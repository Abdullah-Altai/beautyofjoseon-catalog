let db = loadStore();
let lang = localStorage.getItem("altai_catalog_lang") || "ar";
let modalState = { product: null, index: 0 };
let sliderTimer = null;

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const esc = value => String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char]));
const localValue = (object, key) => object?.[`${key}${lang === "ar" ? "Ar" : "En"}`] || object?.[`${key}Ar`] || object?.[`${key}En`] || "";
const number = value => Number(value || 0);

const words = {
  ar: {
    search: "ابحث عن منتج أو كود",
    all: "الكل",
    product: "منتج",
    products: "منتجات",
    emptyTitle: "لا توجد منتجات",
    emptyText: "جرّب كلمة بحث ثانية أو اختر قسماً مختلفاً.",
    whatsappAbout: "للاستفسار عبر واتساب ←",
    loading: "جاري تحميل الكتالوك..."
  },
  en: {
    search: "Search by product or code",
    all: "All",
    product: "product",
    products: "products",
    emptyTitle: "No products found",
    emptyText: "Try another search term or browse a different category.",
    whatsappAbout: "Ask us on WhatsApp →",
    loading: "Loading catalog..."
  }
};
const t = key => words[lang]?.[key] || key;

function productImage(product) {
  return Array.isArray(product?.images) && product.images[0] ? product.images[0] : svgImg("BEAUTY");
}

function whatsappUrl() {
  return `https://wa.me/${String(db.settings.whatsapp || "").replace(/\D/g, "")}`;
}

function setText(selector, value) {
  const element = $(selector);
  if (element) element.textContent = value || "";
}

function applySettings() {
  const settings = db.settings;
  const root = document.documentElement;
  root.lang = lang;
  root.dir = lang === "ar" ? "rtl" : "ltr";
  root.style.setProperty("--primary", settings.primary || "#d72d75");
  root.style.setProperty("--accent", settings.accent || "#ffd6e7");
  root.style.setProperty("--background", settings.bg || "#ffffff");
  root.style.setProperty("--text", settings.textColor || "#17151a");
  root.style.setProperty("--page-width", `${number(settings.pageWidth) || 1440}px`);
  root.style.setProperty("--desktop-columns", number(settings.productColumnsDesktop) || 6);
  root.style.setProperty("--mobile-columns", number(settings.productColumnsMobile) || 3);
  root.style.setProperty("--card-radius", `${number(settings.cardRadius) || 16}px`);
  root.style.setProperty("--image-radius", `${number(settings.imageRadius) || 12}px`);
  root.style.setProperty("--section-gap", `${number(settings.sectionGap) || 28}px`);
  document.body.style.fontFamily = `${settings.fontFamily || "Tahoma"}, Arial, sans-serif`;

  const name = localValue(settings, "name");
  const tagline = localValue(settings, "tagline");
  const logo = settings.logoUrl || "beauty-logo.png";
  setText("#brandName", name);
  setText("#brandTagline", tagline);
  setText("#catalogEyebrow", localValue(settings, "catalogLabel"));
  setText("#coverTitle", localValue(settings, "coverTitle"));
  setText("#coverText", localValue(settings, "coverText"));
  setText("#browseButton", localValue(settings, "browseLabel"));
  setText("#catalogKicker", localValue(settings, "catalogKicker"));
  setText("#catalogTitle", localValue(settings, "catalogTitle"));
  setText("#aboutKicker", localValue(settings, "aboutKicker"));
  setText("#aboutTitle", localValue(settings, "aboutTitle"));
  setText("#aboutText", localValue(settings, "about"));
  setText("#footerName", name);
  setText("#footerYear", `© ${new Date().getFullYear()}`);
  setText("#aboutWhatsapp", t("whatsappAbout"));
  setText("#whatsappLink", localValue(settings, "whatsappLabel"));
  $("#searchInput").placeholder = t("search");
  $("#loadingScreen span").textContent = t("loading");
  $("#headerLogo").src = logo;
  $("#coverLogo").src = settings.coverImage || logo;
  $("#coverVisual").classList.toggle("has-cover-image", Boolean(settings.coverImage));

  const wa = whatsappUrl();
  $("#whatsappLink").href = wa;
  $("#aboutWhatsapp").href = wa;
  $("#languageSwitch").classList.toggle("hidden", settings.showLanguages === false);
  $("#siteHeader").classList.toggle("hidden", settings.showHeader === false);
  $("#whatsappLink").classList.toggle("hidden", settings.showWhatsApp === false);
  $("#searchBox").classList.toggle("hidden", settings.showSearch === false);
  $("#coverSection").classList.toggle("hidden", settings.showCover === false);
  $("#aboutSection").classList.toggle("hidden", settings.showAbout === false);
  $$("[data-lang]").forEach(button => button.classList.toggle("active", button.dataset.lang === lang));

  const sectionMap = {
    cover: $("#coverSection"),
    ads: $("#adsSection"),
    catalog: $("#catalogSection"),
    about: $("#aboutSection")
  };
  (settings.sectionOrder || ["cover", "ads", "catalog", "about"]).forEach(key => {
    if (sectionMap[key]) $("main").appendChild(sectionMap[key]);
  });
}

function categoryName(category) {
  return localValue(category, "name");
}

function visibleCategories() {
  return (db.categories || [])
    .filter(category => category.visible !== false && category.id !== "all")
    .sort((a, b) => number(a.sort) - number(b.sort));
}

function visibleProducts() {
  return (db.products || [])
    .filter(product => product.visible !== false)
    .sort((a, b) => number(a.sort) - number(b.sort));
}

function renderCategoryNav(categories, products) {
  const populated = categories.filter(category => products.some(product => String(product.category) === String(category.id)));
  $("#categoryNav").innerHTML = [
    `<button type="button" data-scroll-category="catalog-start" class="active">${esc(t("all"))}</button>`,
    ...populated.map(category => `<button type="button" data-scroll-category="category-${esc(category.id)}">${esc(categoryName(category))}</button>`)
  ].join("");
  $$('[data-scroll-category]').forEach(button => {
    button.onclick = () => {
      const target = button.dataset.scrollCategory === "catalog-start" ? $("#categorySections") : document.getElementById(button.dataset.scrollCategory);
      target?.scrollIntoView({ behavior: "smooth", block: "start" });
    };
  });
}

function productCard(product, category, index) {
  const settings = db.settings;
  const name = localValue(product, "name");
  const description = localValue(product, "desc");
  const badge = localValue(product, "badge");
  const price = number(product.price);
  return `<button class="product-card" type="button" data-product-id="${esc(product.id)}" aria-label="${esc(name)}">
    <span class="product-image-wrap">
      <img src="${esc(productImage(product))}" alt="${esc(name)}" loading="${index < 8 ? "eager" : "lazy"}" decoding="async">
      ${badge ? `<b class="product-badge">${esc(badge)}</b>` : ""}
      ${Array.isArray(product.images) && product.images.length > 1 ? `<small class="image-count">+${product.images.length - 1}</small>` : ""}
    </span>
    <span class="product-card-body">
      ${settings.showProductCodes !== false && product.code ? `<small class="product-code">${esc(product.code)}</small>` : ""}
      <strong>${esc(name)}</strong>
      ${settings.showDescriptions !== false && description ? `<span class="product-description">${esc(description)}</span>` : ""}
      ${settings.showPrices !== false && price > 0 ? `<span class="product-price">${price.toLocaleString(lang === "ar" ? "ar-IQ" : "en-US")} ${esc(lang === "ar" ? settings.currencyAr : settings.currencyEn)}</span>` : ""}
    </span>
  </button>`;
}

function renderCatalog() {
  const query = $("#searchInput").value.trim().toLowerCase();
  const products = visibleProducts().filter(product => {
    if (!query) return true;
    return [product.nameAr, product.nameEn, product.descAr, product.descEn, product.code, product.badgeAr, product.badgeEn]
      .some(value => String(value || "").toLowerCase().includes(query));
  });
  const categories = visibleCategories();
  renderCategoryNav(categories, visibleProducts());

  const sections = categories.map(category => {
    const categoryProducts = products.filter(product => String(product.category) === String(category.id));
    if (!categoryProducts.length) return "";
    const description = localValue(category, "description");
    return `<section id="category-${esc(category.id)}" class="category-block" style="--category-color:${esc(category.color || db.settings.primary)}">
      <header class="category-heading">
        <div class="category-title-wrap">
          ${category.image ? `<img src="${esc(category.image)}" alt="">` : `<span class="category-mark"></span>`}
          <div><h3>${esc(categoryName(category))}</h3>${description ? `<p>${esc(description)}</p>` : ""}</div>
        </div>
        <span class="category-count">${categoryProducts.length} ${categoryProducts.length === 1 ? t("product") : t("products")}</span>
      </header>
      <div class="products-grid">${categoryProducts.map((product, index) => productCard(product, category, index)).join("")}</div>
    </section>`;
  }).join("");

  $("#categorySections").innerHTML = sections;
  $("#emptyState").classList.toggle("hidden", Boolean(sections));
  if (!sections) {
    $("#emptyState h3").textContent = t("emptyTitle");
    $("#emptyState p").textContent = t("emptyText");
  }
  $$('[data-product-id]').forEach(button => button.onclick = () => openProduct(button.dataset.productId));
  stabilizeImages($("#categorySections"));
}

function stabilizeImages(root = document) {
  root.querySelectorAll("img").forEach(image => {
    image.addEventListener("error", () => {
      if (image.dataset.fallback) return;
      image.dataset.fallback = "1";
      image.src = svgImg("BEAUTY");
    }, { once: true });
  });
}

function renderAds() {
  clearInterval(sliderTimer);
  const ads = (db.ads || []).filter(ad => ad.visible !== false).sort((a, b) => number(a.sort) - number(b.sort));
  const section = $("#adsSection");
  section.classList.toggle("hidden", db.settings.showAds === false || !ads.length);
  if (!ads.length) return;
  $("#adsSlider").innerHTML = ads.map((ad, index) => {
    const video = ad.mediaType === "video" || /\.(mp4|webm)(?:$|\?)/i.test(ad.image || "");
    const media = video
      ? `<video src="${esc(ad.image)}" muted loop playsinline preload="metadata"></video>`
      : `<img src="${esc(ad.image)}" alt="${esc(localValue(ad, "title"))}" loading="${index ? "lazy" : "eager"}">`;
    return `<article class="ad-slide ${index === 0 ? "active" : ""}" aria-hidden="${index ? "true" : "false"}">${media}<div class="ad-copy"><h2>${esc(localValue(ad, "title"))}</h2><p>${esc(localValue(ad, "subtitle"))}</p></div></article>`;
  }).join("");
  $("#sliderDots").innerHTML = ads.map((_, index) => `<button type="button" data-slide="${index}" class="${index === 0 ? "active" : ""}" aria-label="${index + 1}"></button>`).join("");
  let current = 0;
  const show = index => {
    const slides = $$(".ad-slide");
    current = (index + slides.length) % slides.length;
    slides.forEach((slide, position) => {
      const active = position === current;
      slide.classList.toggle("active", active);
      slide.setAttribute("aria-hidden", active ? "false" : "true");
      const video = slide.querySelector("video");
      if (video) active ? video.play().catch(() => {}) : video.pause();
    });
    $$("[data-slide]").forEach((dot, position) => dot.classList.toggle("active", position === current));
  };
  $$("[data-slide]").forEach(dot => dot.onclick = () => show(number(dot.dataset.slide)));
  show(0);
  if (ads.length > 1) sliderTimer = setInterval(() => show(current + 1), 4000);
  stabilizeImages($("#adsSection"));
}

function openProduct(id) {
  const product = db.products.find(item => String(item.id) === String(id));
  if (!product) return;
  modalState = { product, index: 0 };
  const category = db.categories.find(item => String(item.id) === String(product.category));
  setText("#modalCategory", categoryName(category));
  setText("#modalProductName", localValue(product, "name"));
  setText("#modalCode", product.code ? `${lang === "ar" ? "الكود" : "Code"}: ${product.code}` : "");
  setText("#modalDescription", localValue(product, "desc"));
  const price = number(product.price);
  setText("#modalPrice", db.settings.showPrices !== false && price > 0 ? `${price.toLocaleString(lang === "ar" ? "ar-IQ" : "en-US")} ${lang === "ar" ? db.settings.currencyAr : db.settings.currencyEn}` : "");
  renderModalImage();
  $("#productModal").classList.remove("hidden");
  document.body.classList.add("modal-open");
}

function renderModalImage() {
  const images = modalState.product?.images?.length ? modalState.product.images : [svgImg("BEAUTY")];
  modalState.index = (modalState.index + images.length) % images.length;
  $("#modalImage").src = images[modalState.index];
  $("#modalImage").alt = localValue(modalState.product, "name");
  $("#modalThumbs").innerHTML = images.map((image, index) => `<button type="button" data-modal-image="${index}" class="${index === modalState.index ? "active" : ""}"><img src="${esc(image)}" alt=""></button>`).join("");
  $$("[data-modal-image]").forEach(button => button.onclick = () => {
    modalState.index = number(button.dataset.modalImage);
    renderModalImage();
  });
  $("#modalPrev").classList.toggle("hidden", images.length < 2);
  $("#modalNext").classList.toggle("hidden", images.length < 2);
  stabilizeImages($("#productModal"));
}

function closeProduct() {
  $("#productModal").classList.add("hidden");
  document.body.classList.remove("modal-open");
}

function bindEvents() {
  $$("[data-lang]").forEach(button => button.onclick = () => {
    lang = button.dataset.lang;
    localStorage.setItem("altai_catalog_lang", lang);
    renderAll();
  });
  $("#searchInput").addEventListener("input", renderCatalog);
  $$('[data-close-modal]').forEach(button => button.onclick = closeProduct);
  $("#modalPrev").onclick = () => { modalState.index -= 1; renderModalImage(); };
  $("#modalNext").onclick = () => { modalState.index += 1; renderModalImage(); };
  document.addEventListener("keydown", event => {
    if (event.key === "Escape") closeProduct();
    if (!$("#productModal").classList.contains("hidden") && event.key === "ArrowLeft") $("#modalNext").click();
    if (!$("#productModal").classList.contains("hidden") && event.key === "ArrowRight") $("#modalPrev").click();
  });
}

function renderAll() {
  applySettings();
  renderAds();
  renderCatalog();
}

async function boot() {
  bindEvents();
  if (window.catalogCloud?.ready) {
    try {
      const [products, config] = await Promise.all([
        window.catalogCloud.getProducts(),
        window.catalogCloud.getSiteConfig()
      ]);
      db.products = products;
      if (config) {
        db.settings = Object.assign({}, window.defaultStore.settings, config.settings || {});
        if (Array.isArray(config.categories)) db.categories = config.categories;
        if (Array.isArray(config.ads)) db.ads = config.ads;
      }
      saveStore(db);
    } catch (error) {
      console.error("Could not load Supabase catalog", error);
    }
  }
  renderAll();
  requestAnimationFrame(() => setTimeout(() => $("#loadingScreen").classList.add("hide"), 180));
}

boot();
