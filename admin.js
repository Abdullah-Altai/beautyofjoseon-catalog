let db = loadStore();
const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const esc = value => String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char]));
const cloudReady = () => Boolean(window.catalogCloud?.ready);
const adminEmail = () => String(window.catalogCloud?.adminEmail || "Altai0193@gmail.com").toLowerCase();

const tabTitles = {
  dashboard: "نظرة عامة",
  products: "المنتجات",
  categories: "الأقسام",
  ads: "الإعلانات",
  content: "محتوى الصفحة",
  appearance: "الشكل والترتيب",
  preview: "معاينة الموقع",
  security: "الدخول والأمان"
};

function toast(message) {
  const element = $("#toast");
  element.textContent = message;
  element.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => element.classList.remove("show"), 2200);
}

function setSaving(message = "جاري الحفظ...") {
  $("#saveState").textContent = message;
  $("#saveState").style.color = "#d72d75";
}

function setSaved() {
  $("#saveState").textContent = "كل التغييرات محفوظة";
  $("#saveState").style.color = "#159957";
}

function activateTab(name) {
  $$(".nav").forEach(button => button.classList.toggle("active", button.dataset.tab === name));
  $$(".tab").forEach(section => section.classList.toggle("active", section.id === name));
  $("#pageTitle").textContent = tabTitles[name] || "لوحة التحكم";
  if (name === "preview") refreshPreview();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

$$(".nav").forEach(button => button.onclick = () => activateTab(button.dataset.tab));
$$('[data-go-tab]').forEach(button => button.onclick = () => activateTab(button.dataset.goTab));
$("#quickPreview").onclick = () => activateTab("preview");

function isAllowedSession(session) {
  return String(session?.user?.email || "").toLowerCase() === adminEmail();
}

async function login() {
  const button = $("#loginButton");
  const email = $("#loginUser").value.trim();
  const password = $("#loginPass").value;
  $("#loginError").textContent = "";
  if (!cloudReady()) {
    $("#loginError").textContent = "أضف Project URL و Publishable Key داخل supabase-config.js أولاً";
    return;
  }
  button.disabled = true;
  button.textContent = "جاري تسجيل الدخول...";
  try {
    const result = await window.catalogCloud.signIn(email, password);
    if (!isAllowedSession(result.session)) {
      await window.catalogCloud.signOut();
      throw new Error("هذا الحساب غير مخوّل للدخول إلى لوحة الإدارة");
    }
    await showApp();
  } catch (error) {
    $("#loginError").textContent = error.message || "تعذر تسجيل الدخول";
  } finally {
    button.disabled = false;
    button.textContent = "تسجيل الدخول";
  }
}

$("#loginForm").onsubmit = event => {
  event.preventDefault();
  login();
};

$("#logoutBtn").onclick = async () => {
  await window.catalogCloud?.signOut();
  location.reload();
};

async function showApp() {
  $("#loginView").classList.add("hidden");
  $("#adminApp").classList.remove("hidden");
  await refreshCloud();
  fillContentForm();
  fillAppearanceForm();
  renderAll();
}

window.addEventListener("load", async () => {
  if (!cloudReady()) return;
  const session = await window.catalogCloud.session();
  if (!session) return;
  if (!isAllowedSession(session)) {
    await window.catalogCloud.signOut();
    $("#loginError").textContent = "الحساب المسجل غير مخوّل. استخدم Altai0193@gmail.com";
    return;
  }
  showApp();
});

async function refreshCloud() {
  if (!cloudReady()) {
    $("#statCloud").textContent = "غير مربوط";
    $("#cloudStatus").textContent = "أضف بيانات Supabase";
    return;
  }
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
    $("#statCloud").textContent = "متصل";
    $("#statCloud").style.color = "#159957";
    $("#cloudStatus").textContent = "Supabase يعمل بنجاح";
  } catch (error) {
    console.error(error);
    $("#statCloud").textContent = "خطأ";
    $("#statCloud").style.color = "#c83045";
    $("#cloudStatus").textContent = error.message || "تعذر الاتصال";
    toast("تعذر تحميل بيانات Supabase");
  }
}

async function saveConfig() {
  if (!cloudReady()) throw new Error("Supabase غير مربوط");
  saveStore(db);
  await window.catalogCloud.saveSiteConfig({
    settings: db.settings,
    categories: db.categories,
    ads: db.ads
  });
}

function categoryLabel(id) {
  const category = db.categories.find(item => String(item.id) === String(id));
  return category?.nameAr || "بدون قسم";
}

function renderStats() {
  const categories = db.categories.filter(item => item.id !== "all");
  $("#statProducts").textContent = db.products.length;
  $("#statVisibleProducts").textContent = `${db.products.filter(item => item.visible !== false).length} ظاهرة`;
  $("#statCategories").textContent = categories.length;
  $("#statAds").textContent = db.ads.length;
}

function renderProductFilters() {
  const select = $("#productCategoryFilter");
  const current = select.value || "all";
  select.innerHTML = `<option value="all">كل الأقسام</option>${db.categories.filter(item => item.id !== "all").sort((a, b) => Number(a.sort) - Number(b.sort)).map(category => `<option value="${esc(category.id)}">${esc(category.nameAr)}</option>`).join("")}`;
  select.value = [...select.options].some(option => option.value === current) ? current : "all";
}

function renderProducts() {
  renderProductFilters();
  const query = $("#productAdminSearch").value.trim().toLowerCase();
  const category = $("#productCategoryFilter").value;
  const products = db.products
    .filter(product => category === "all" || String(product.category) === category)
    .filter(product => !query || [product.nameAr, product.nameEn, product.code].some(value => String(value || "").toLowerCase().includes(query)))
    .sort((a, b) => Number(a.sort) - Number(b.sort));
  $("#productsAdmin").innerHTML = products.map(product => `<article class="admin-card">
    <span class="visibility-dot ${product.visible !== false ? "visible" : ""}" title="${product.visible !== false ? "ظاهر" : "مخفي"}"></span>
    <img src="${esc(product.images?.[0] || svgImg("BEAUTY"))}" alt="">
    <div><h4>${esc(product.nameAr)}</h4><p>${esc(product.nameEn || "")}</p>${product.code ? `<span class="code-pill">${esc(product.code)}</span>` : ""}<p>${esc(categoryLabel(product.category))} · الترتيب ${Number(product.sort) || 0}${Number(product.price) ? ` · ${Number(product.price).toLocaleString()} د.ع` : ""}</p>
    <div class="card-actions"><button class="edit" type="button" data-edit-product="${esc(product.id)}">تعديل</button><button type="button" data-toggle-product="${esc(product.id)}">${product.visible !== false ? "إخفاء" : "إظهار"}</button><button class="delete" type="button" data-delete-product="${esc(product.id)}">حذف</button></div></div>
  </article>`).join("") || `<div class="empty-admin"><h3>لا توجد منتجات</h3><p>اضغط على «إضافة منتج» حتى يبدأ الكتالوك بالظهور.</p></div>`;
  $$('[data-edit-product]').forEach(button => button.onclick = () => openProduct(button.dataset.editProduct));
  $$('[data-toggle-product]').forEach(button => button.onclick = async () => {
    const product = db.products.find(item => String(item.id) === String(button.dataset.toggleProduct));
    product.visible = product.visible === false;
    try { await saveProduct(product); } catch (error) { alert(error.message); }
  });
  $$('[data-delete-product]').forEach(button => button.onclick = async () => {
    const product = db.products.find(item => String(item.id) === String(button.dataset.deleteProduct));
    if (!product || !confirm(`حذف المنتج «${product.nameAr}» نهائياً؟`)) return;
    try {
      await window.catalogCloud.deleteProduct(product);
      db.products = db.products.filter(item => String(item.id) !== String(product.id));
      saveStore(db);
      renderProducts();
      renderStats();
      toast("تم حذف المنتج");
    } catch (error) { alert(error.message); }
  });
}

$("#productAdminSearch").addEventListener("input", renderProducts);
$("#productCategoryFilter").addEventListener("change", renderProducts);

function renderCategories() {
  const categories = db.categories.filter(item => item.id !== "all").sort((a, b) => Number(a.sort) - Number(b.sort));
  $("#categoriesAdmin").innerHTML = categories.map(category => {
    const count = db.products.filter(product => String(product.category) === String(category.id)).length;
    return `<article class="category-admin-card"><span class="category-color" style="background:${esc(category.color || "#d72d75")}"></span><div><h4>${esc(category.nameAr)} / ${esc(category.nameEn || "")}</h4><p>${category.visible !== false ? "ظاهر" : "مخفي"} · الترتيب ${Number(category.sort) || 0}</p></div><span class="category-product-count">${count} منتج</span><div class="card-actions"><button class="edit" type="button" data-edit-category="${esc(category.id)}">تعديل</button><button class="delete" type="button" data-delete-category="${esc(category.id)}">حذف</button></div></article>`;
  }).join("") || `<div class="empty-admin"><h3>لا توجد أقسام</h3><p>أنشئ قسماً واحداً على الأقل قبل إضافة المنتجات.</p></div>`;
  $$('[data-edit-category]').forEach(button => button.onclick = () => openCategory(button.dataset.editCategory));
  $$('[data-delete-category]').forEach(button => button.onclick = async () => {
    const category = db.categories.find(item => String(item.id) === String(button.dataset.deleteCategory));
    const count = db.products.filter(product => String(product.category) === String(category.id)).length;
    if (count) { alert(`لا يمكن حذف هذا القسم لأن بداخله ${count} منتج. انقل المنتجات إلى قسم آخر أولاً.`); return; }
    if (!confirm(`حذف قسم «${category.nameAr}»؟`)) return;
    db.categories = db.categories.filter(item => String(item.id) !== String(category.id));
    try { await saveConfig(); renderAll(); toast("تم حذف القسم"); } catch (error) { alert(error.message); }
  });
}

function renderAds() {
  const ads = db.ads.slice().sort((a, b) => Number(a.sort) - Number(b.sort));
  $("#adsAdmin").innerHTML = ads.map(ad => `<article class="admin-card"><span class="visibility-dot ${ad.visible !== false ? "visible" : ""}"></span>${ad.mediaType === "video" ? `<video src="${esc(ad.image)}" muted></video>` : `<img src="${esc(ad.image || svgImg("AD"))}" alt="">`}<div><h4>${esc(ad.titleAr || "إعلان بدون عنوان")}</h4><p>${esc(ad.subtitleAr || "")}</p><p>${ad.visible !== false ? "ظاهر" : "مخفي"} · الترتيب ${Number(ad.sort) || 0}</p><div class="card-actions"><button class="edit" type="button" data-edit-ad="${esc(ad.id)}">تعديل</button><button type="button" data-toggle-ad="${esc(ad.id)}">${ad.visible !== false ? "إخفاء" : "إظهار"}</button><button class="delete" type="button" data-delete-ad="${esc(ad.id)}">حذف</button></div></div></article>`).join("") || `<div class="empty-admin"><h3>لا توجد إعلانات</h3><p>الإعلانات اختيارية، ويمكن إبقاء الصفحة بدونها.</p></div>`;
  $$('[data-edit-ad]').forEach(button => button.onclick = () => openAd(button.dataset.editAd));
  $$('[data-toggle-ad]').forEach(button => button.onclick = async () => {
    const ad = db.ads.find(item => String(item.id) === String(button.dataset.toggleAd));
    ad.visible = ad.visible === false;
    try { await saveConfig(); renderAds(); renderStats(); toast("تم تحديث الإعلان"); } catch (error) { alert(error.message); }
  });
  $$('[data-delete-ad]').forEach(button => button.onclick = async () => {
    const ad = db.ads.find(item => String(item.id) === String(button.dataset.deleteAd));
    if (!confirm(`حذف الإعلان «${ad.titleAr || "بدون عنوان"}»؟`)) return;
    db.ads = db.ads.filter(item => String(item.id) !== String(ad.id));
    try { await saveConfig(); renderAds(); renderStats(); toast("تم حذف الإعلان"); } catch (error) { alert(error.message); }
  });
}

function renderAll() {
  renderStats();
  renderProducts();
  renderCategories();
  renderAds();
}

function field(label, name, value = "", type = "text", extra = "") {
  return `<label>${label}<input name="${name}" type="${type}" value="${esc(value)}" ${extra}></label>`;
}

function textArea(label, name, value = "", className = "") {
  return `<label class="${className}">${label}<textarea name="${name}">${esc(value)}</textarea></label>`;
}

function checkField(label, name, checked) {
  return `<label class="check-field"><input name="${name}" type="checkbox" ${checked ? "checked" : ""}> ${label}</label>`;
}

function openModal(title, html, onSubmit) {
  $("#editorTitle").textContent = title;
  $("#editorForm").innerHTML = `${html}<button type="submit">حفظ التغييرات</button>`;
  $("#editorModal").classList.remove("hidden");
  document.body.style.overflow = "hidden";
  $("#editorForm").onsubmit = async event => {
    event.preventDefault();
    const button = event.submitter;
    button.disabled = true;
    button.textContent = "جاري الحفظ...";
    try {
      await onSubmit(new FormData(event.currentTarget));
      closeModal();
    } catch (error) {
      alert(error.message || "حدث خطأ أثناء الحفظ");
    } finally {
      button.disabled = false;
      button.textContent = "حفظ التغييرات";
    }
  };
}

function closeModal() {
  $("#editorModal").classList.add("hidden");
  document.body.style.overflow = "";
}
$("#closeEditor").onclick = closeModal;
$("#modalBackdrop").onclick = closeModal;

async function saveProduct(product) {
  setSaving();
  const saved = await window.catalogCloud.saveProduct(product);
  const index = db.products.findIndex(item => String(item.id) === String(saved.id));
  if (index >= 0) db.products[index] = saved; else db.products.push(saved);
  saveStore(db);
  renderProducts();
  renderStats();
  setSaved();
  toast("تم حفظ المنتج");
}

function openProduct(id) {
  const categories = db.categories.filter(item => item.id !== "all" && item.visible !== false).sort((a, b) => Number(a.sort) - Number(b.sort));
  if (!categories.length) { alert("أضف قسماً واحداً على الأقل قبل إضافة المنتج"); activateTab("categories"); return; }
  const existing = id ? db.products.find(item => String(item.id) === String(id)) : null;
  const product = existing ? { ...existing, images: [...(existing.images || [])] } : {
    nameAr: "", nameEn: "", descAr: "", descEn: "", code: "", category: categories[0].id,
    price: 0, stock: 0, badgeAr: "", badgeEn: "", visible: true, featured: false,
    sort: db.products.length + 1, images: []
  };
  const categoryOptions = categories.map(category => `<option value="${esc(category.id)}" ${String(product.category) === String(category.id) ? "selected" : ""}>${esc(category.nameAr)} / ${esc(category.nameEn || "")}</option>`).join("");
  openModal(existing ? "تعديل المنتج" : "إضافة منتج",
    field("اسم المنتج بالعربي", "nameAr", product.nameAr, "text", "required") +
    field("Product name in English", "nameEn", product.nameEn) +
    field("كود المنتج", "code", product.code, "text", "placeholder=\"مثال: BOJ-001\"") +
    `<label>القسم<select name="category" required>${categoryOptions}</select></label>` +
    textArea("الوصف بالعربي", "descAr", product.descAr) +
    textArea("Description in English", "descEn", product.descEn) +
    field("السعر (0 لإخفائه)", "price", product.price, "number", "min=\"0\" step=\"0.01\"") +
    field("المخزون - للمعلومة داخل الأدمن", "stock", product.stock, "number", "min=\"0\"") +
    field("شارة بالعربي", "badgeAr", product.badgeAr, "text", "placeholder=\"جديد / مميز\"") +
    field("Badge in English", "badgeEn", product.badgeEn) +
    field("الترتيب", "sort", product.sort, "number") +
    checkField("ظاهر في الكتالوك", "visible", product.visible !== false) +
    `<label class="file-field wide">رفع صور المنتج<input name="images" type="file" accept="image/*" multiple><small>حتى 10 صور، والصورة الأولى هي الرئيسية</small></label>` +
    textArea("روابط الصور - كل رابط بسطر", "imageUrls", (product.images || []).join("\n"), "wide") +
    `<div class="image-preview">${(product.images || []).map(image => `<img src="${esc(image)}" alt="">`).join("")}</div>`,
    async form => {
      const files = form.getAll("images").filter(file => file.size).slice(0, 10);
      const uploaded = files.length ? await window.catalogCloud.uploadProductImages(files) : [];
      const links = String(form.get("imageUrls") || "").split("\n").map(value => value.trim()).filter(Boolean);
      const value = {
        ...product,
        nameAr: form.get("nameAr"), nameEn: form.get("nameEn"), code: form.get("code"),
        category: form.get("category"), descAr: form.get("descAr"), descEn: form.get("descEn"),
        price: Number(form.get("price")) || 0, stock: Number(form.get("stock")) || 0,
        badgeAr: form.get("badgeAr"), badgeEn: form.get("badgeEn"), sort: Number(form.get("sort")) || 0,
        visible: form.has("visible"), images: [...uploaded, ...links].slice(0, 10)
      };
      if (existing) value.id = existing.id;
      if (!value.images.length) throw new Error("أضف صورة واحدة على الأقل");
      await saveProduct(value);
    }
  );
}

function openCategory(id) {
  const existing = id ? db.categories.find(item => String(item.id) === String(id)) : null;
  const category = existing ? { ...existing } : {
    id: `category-${Date.now()}`, nameAr: "", nameEn: "", descriptionAr: "", descriptionEn: "",
    color: "#d72d75", image: "", visible: true, sort: db.categories.length
  };
  openModal(existing ? "تعديل القسم" : "إضافة قسم",
    field("اسم القسم بالعربي", "nameAr", category.nameAr, "text", "required") +
    field("Category name in English", "nameEn", category.nameEn) +
    textArea("وصف قصير بالعربي", "descriptionAr", category.descriptionAr) +
    textArea("Short description in English", "descriptionEn", category.descriptionEn) +
    field("لون القسم", "color", category.color, "color") +
    field("الترتيب", "sort", category.sort, "number") +
    field("رابط صورة أو شعار القسم", "image", category.image, "url", "placeholder=\"https://...\"") +
    `<label class="file-field">رفع صورة القسم<input name="imageFile" type="file" accept="image/*"><small>اختياري</small></label>` +
    checkField("القسم ظاهر", "visible", category.visible !== false),
    async form => {
      let image = String(form.get("image") || "").trim();
      const file = form.get("imageFile");
      if (file?.size) image = await window.catalogCloud.uploadAsset(file, "categories");
      Object.assign(category, {
        nameAr: form.get("nameAr"), nameEn: form.get("nameEn"),
        descriptionAr: form.get("descriptionAr"), descriptionEn: form.get("descriptionEn"),
        color: form.get("color"), image, sort: Number(form.get("sort")) || 0, visible: form.has("visible")
      });
      if (!existing) db.categories.push(category);
      setSaving();
      await saveConfig();
      renderAll();
      setSaved();
      toast("تم حفظ القسم");
    }
  );
}

function openAd(id) {
  const existing = id ? db.ads.find(item => String(item.id) === String(id)) : null;
  const ad = existing ? { ...existing } : { id: `ad-${Date.now()}`, titleAr: "", titleEn: "", subtitleAr: "", subtitleEn: "", image: "", mediaType: "image", visible: true, sort: db.ads.length + 1 };
  openModal(existing ? "تعديل الإعلان" : "إضافة إعلان",
    field("عنوان الإعلان بالعربي", "titleAr", ad.titleAr) + field("Ad title in English", "titleEn", ad.titleEn) +
    field("النص بالعربي", "subtitleAr", ad.subtitleAr) + field("Text in English", "subtitleEn", ad.subtitleEn) +
    field("رابط صورة أو فيديو", "mediaUrl", ad.image, "url", "placeholder=\"https://...\"") + field("الترتيب", "sort", ad.sort, "number") +
    `<label class="file-field wide">رفع صورة أو فيديو<input name="mediaFile" type="file" accept="image/*,video/mp4,video/webm"><small>صورة حتى 12 MB أو فيديو حتى 60 MB</small></label>` +
    checkField("الإعلان ظاهر", "visible", ad.visible !== false) +
    (ad.image ? `<div class="media-preview">${ad.mediaType === "video" ? `<video src="${esc(ad.image)}" controls muted></video>` : `<img src="${esc(ad.image)}" alt="">`}</div>` : ""),
    async form => {
      let image = String(form.get("mediaUrl") || "").trim();
      let mediaType = /\.(mp4|webm)(?:$|\?)/i.test(image) ? "video" : "image";
      const file = form.get("mediaFile");
      if (file?.size) {
        const uploaded = await window.catalogCloud.uploadAdMedia(file);
        image = uploaded.url;
        mediaType = uploaded.type;
      }
      if (!image) throw new Error("اختر صورة أو فيديو للإعلان");
      Object.assign(ad, {
        titleAr: form.get("titleAr"), titleEn: form.get("titleEn"), subtitleAr: form.get("subtitleAr"), subtitleEn: form.get("subtitleEn"),
        image, mediaType, sort: Number(form.get("sort")) || 0, visible: form.has("visible")
      });
      if (!existing) db.ads.push(ad);
      setSaving();
      await saveConfig();
      renderAds();
      renderStats();
      setSaved();
      toast("تم حفظ الإعلان");
    }
  );
}

$("#addProduct").onclick = () => openProduct();
$("#addCategory").onclick = () => openCategory();
$("#addAd").onclick = () => openAd();

const contentKeys = [
  "nameAr", "nameEn", "taglineAr", "taglineEn", "catalogLabelAr", "catalogLabelEn", "logoUrl",
  "coverTitleAr", "coverTitleEn", "coverTextAr", "coverTextEn", "browseLabelAr", "browseLabelEn", "coverImage",
  "catalogKickerAr", "catalogKickerEn", "catalogTitleAr", "catalogTitleEn", "aboutTitleAr", "aboutTitleEn",
  "aboutKickerAr", "aboutKickerEn", "aboutAr", "aboutEn", "whatsapp", "whatsappLabelAr", "whatsappLabelEn", "currencyAr", "currencyEn"
];

function fillContentForm() {
  const form = $("#contentForm");
  contentKeys.forEach(key => { if (form.elements[key]) form.elements[key].value = db.settings[key] ?? ""; });
}

$("#saveContent").onclick = async () => {
  const form = $("#contentForm");
  const button = $("#saveContent");
  button.disabled = true;
  setSaving();
  try {
    contentKeys.forEach(key => { if (form.elements[key]) db.settings[key] = form.elements[key].value; });
    const logoFile = form.elements.logoFile.files?.[0];
    const coverFile = form.elements.coverFile.files?.[0];
    if (logoFile) db.settings.logoUrl = await window.catalogCloud.uploadAsset(logoFile, "site");
    if (coverFile) db.settings.coverImage = await window.catalogCloud.uploadAsset(coverFile, "site");
    await saveConfig();
    fillContentForm();
    refreshPreview();
    setSaved();
    toast("تم حفظ محتوى الصفحة");
  } catch (error) { alert(error.message); setSaving("تعذر الحفظ"); }
  finally { button.disabled = false; }
};

const toggleKeys = ["showLanguages", "showHeader", "showWhatsApp", "showSearch", "showCover", "showAds", "showAbout", "showPrices", "showDescriptions", "showProductCodes"];
const appearanceTextKeys = ["primary", "accent", "bg", "textColor", "fontFamily"];
const appearanceNumberKeys = ["pageWidth", "productColumnsDesktop", "productColumnsMobile", "cardRadius", "imageRadius", "sectionGap"];
const sectionOptions = [
  ["cover", "الغلاف"], ["ads", "الإعلانات"], ["catalog", "الكتالوك"], ["about", "من نحن"]
];

function fillAppearanceForm() {
  const form = $("#appearanceForm");
  toggleKeys.forEach(key => { form.elements[key].checked = db.settings[key] !== false; });
  appearanceTextKeys.forEach(key => { form.elements[key].value = db.settings[key] ?? window.defaultStore.settings[key]; });
  appearanceNumberKeys.forEach(key => { form.elements[key].value = db.settings[key] ?? window.defaultStore.settings[key]; });
  const order = db.settings.sectionOrder || ["cover", "ads", "catalog", "about"];
  [1, 2, 3, 4].forEach((position, index) => {
    const select = form.elements[`section${position}`];
    select.innerHTML = sectionOptions.map(([value, label]) => `<option value="${value}">${label}</option>`).join("");
    select.value = order[index] || sectionOptions[index][0];
  });
}

$("#saveAppearance").onclick = async () => {
  const form = $("#appearanceForm");
  const button = $("#saveAppearance");
  button.disabled = true;
  setSaving();
  try {
    toggleKeys.forEach(key => { db.settings[key] = form.elements[key].checked; });
    appearanceTextKeys.forEach(key => { db.settings[key] = form.elements[key].value; });
    appearanceNumberKeys.forEach(key => { db.settings[key] = Number(form.elements[key].value) || window.defaultStore.settings[key]; });
    const selected = [1, 2, 3, 4].map(position => form.elements[`section${position}`].value);
    db.settings.sectionOrder = [...new Set([...selected, "cover", "ads", "catalog", "about"])].slice(0, 4);
    await saveConfig();
    fillAppearanceForm();
    refreshPreview();
    setSaved();
    toast("تم حفظ شكل الصفحة");
  } catch (error) { alert(error.message); setSaving("تعذر الحفظ"); }
  finally { button.disabled = false; }
};

function refreshPreview() {
  const frame = $("#homepagePreview");
  if (frame) frame.src = `index.html?preview=${Date.now()}`;
}
$("#refreshPreview").onclick = refreshPreview;

$("#exportBtn").onclick = () => {
  const content = JSON.stringify({ exportedAt: new Date().toISOString(), ...db }, null, 2);
  const url = URL.createObjectURL(new Blob([content], { type: "application/json" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `altai-catalog-backup-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
};

document.addEventListener("keydown", event => {
  if (event.key === "Escape" && !$("#editorModal").classList.contains("hidden")) closeModal();
});
