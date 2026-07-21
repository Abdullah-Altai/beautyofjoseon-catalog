const STORE_KEY = "altai_catalog_store_v2";

const svgImg = (text = "CATALOG", c1 = "#f7f7f7", c2 = "#ececec") =>
  `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="900" height="900"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/><circle cx="720" cy="120" r="180" fill="white" opacity=".4"/><circle cx="130" cy="760" r="250" fill="white" opacity=".3"/><text x="50%" y="52%" text-anchor="middle" dominant-baseline="middle" fill="#8d8d8d" font-family="Arial" font-size="68" font-weight="700">${text}</text></svg>`)}`;

window.defaultStore = {
  settings: {
    nameAr: "بيوتي أوف جوسون العراق",
    nameEn: "Beauty of Joseon Iraq",
    taglineAr: "كتالوك منتجات العناية والجمال",
    taglineEn: "Beauty & skincare product catalog",
    catalogLabelAr: "كتالوك المنتجات",
    catalogLabelEn: "Product Catalog",
    coverTitleAr: "كل منتجات العناية مرتبة بمكان واحد",
    coverTitleEn: "Every beauty essential in one place",
    coverTextAr: "تصفح الأقسام وشاهد تفاصيل كل منتج بسهولة.",
    coverTextEn: "Browse every category and view product details with ease.",
    browseLabelAr: "تصفح المنتجات",
    browseLabelEn: "Browse products",
    catalogKickerAr: "تصفح حسب القسم",
    catalogKickerEn: "Browse by category",
    catalogTitleAr: "الكتالوك",
    catalogTitleEn: "Catalog",
    aboutKickerAr: "عن الكتالوك",
    aboutKickerEn: "About the catalog",
    aboutTitleAr: "من نحن",
    aboutTitleEn: "About us",
    aboutAr: "منتجات عناية وجمال مختارة بعناية. تصفح الأقسام وتواصل معنا للاستفسار عن أي منتج.",
    aboutEn: "A carefully selected beauty and skincare collection. Browse the catalog and contact us for product enquiries.",
    whatsapp: "9647500000000",
    whatsappLabelAr: "تواصل عبر واتساب",
    whatsappLabelEn: "Contact on WhatsApp",
    currencyAr: "د.ع",
    currencyEn: "IQD",
    primary: "#d72d75",
    accent: "#ffd6e7",
    bg: "#ffffff",
    textColor: "#17151a",
    logoUrl: "beauty-logo.png",
    coverImage: "",
    showLanguages: true,
    showHeader: true,
    showWhatsApp: true,
    showSearch: true,
    showCover: true,
    showAds: true,
    showAbout: true,
    showPrices: true,
    showDescriptions: true,
    showProductCodes: true,
    pageWidth: 1440,
    productColumnsDesktop: 6,
    productColumnsMobile: 3,
    cardRadius: 16,
    imageRadius: 12,
    sectionGap: 28,
    fontFamily: "Tahoma",
    sectionOrder: ["cover", "ads", "catalog", "about"]
  },
  categories: [
    { id: "all", nameAr: "الكل", nameEn: "All", descriptionAr: "", descriptionEn: "", color: "#d72d75", image: "", visible: true, sort: 0 },
    { id: "beauty-of-joseon", nameAr: "بيوتي أوف جوسون", nameEn: "Beauty of Joseon", descriptionAr: "", descriptionEn: "", color: "#efb6c7", image: "", visible: true, sort: 1 },
    { id: "cosrx", nameAr: "كوسركس", nameEn: "COSRX", descriptionAr: "", descriptionEn: "", color: "#f2cf45", image: "", visible: true, sort: 2 },
    { id: "centella", nameAr: "سنتيلا", nameEn: "SKIN1004 Centella", descriptionAr: "", descriptionEn: "", color: "#bfc8c5", image: "", visible: true, sort: 3 },
    { id: "anua", nameAr: "أنوا", nameEn: "Anua", descriptionAr: "", descriptionEn: "", color: "#aadbd4", image: "", visible: true, sort: 4 },
    { id: "cerave", nameAr: "سيرافي", nameEn: "CeraVe", descriptionAr: "", descriptionEn: "", color: "#43a4cf", image: "", visible: true, sort: 5 },
    { id: "ordinary", nameAr: "ذا أورديناري", nameEn: "The Ordinary", descriptionAr: "", descriptionEn: "", color: "#d8d8d8", image: "", visible: true, sort: 6 },
    { id: "some-by-mi", nameAr: "سوم باي مي", nameEn: "Some By Mi", descriptionAr: "", descriptionEn: "", color: "#cab8de", image: "", visible: true, sort: 7 },
    { id: "eucerin", nameAr: "يوسيرين", nameEn: "Eucerin", descriptionAr: "", descriptionEn: "", color: "#8e284c", image: "", visible: true, sort: 8 },
    { id: "tocobo", nameAr: "توكوبو", nameEn: "TOCOBO", descriptionAr: "", descriptionEn: "", color: "#99dff5", image: "", visible: true, sort: 9 },
    { id: "dr-althea", nameAr: "دكتور ألثيا", nameEn: "Dr. Althea", descriptionAr: "", descriptionEn: "", color: "#b9d776", image: "", visible: true, sort: 10 },
    { id: "eqqualberry", nameAr: "إيكوال بيري", nameEn: "Eqqualberry", descriptionAr: "", descriptionEn: "", color: "#a46bb9", image: "", visible: true, sort: 11 },
    { id: "k-secret", nameAr: "كي سيكريت", nameEn: "K-Secret", descriptionAr: "", descriptionEn: "", color: "#f0a1a8", image: "", visible: true, sort: 12 },
    { id: "mielle", nameAr: "ميلي", nameEn: "Mielle", descriptionAr: "", descriptionEn: "", color: "#8eb36a", image: "", visible: true, sort: 13 },
    { id: "elizavecca", nameAr: "إليزافيكا", nameEn: "Elizavecca", descriptionAr: "", descriptionEn: "", color: "#eaa8cc", image: "", visible: true, sort: 14 },
    { id: "celimax", nameAr: "سيليماكس", nameEn: "Celimax", descriptionAr: "", descriptionEn: "", color: "#bed957", image: "", visible: true, sort: 15 },
    { id: "kahi", nameAr: "كاهي", nameEn: "KAHI", descriptionAr: "", descriptionEn: "", color: "#f1adb5", image: "", visible: true, sort: 16 },
    { id: "vaseline", nameAr: "فازلين", nameEn: "Vaseline", descriptionAr: "", descriptionEn: "", color: "#1c5599", image: "", visible: true, sort: 17 },
    { id: "clinique", nameAr: "كلينيك", nameEn: "Clinique", descriptionAr: "", descriptionEn: "", color: "#e8d786", image: "", visible: true, sort: 18 },
    { id: "kerifa", nameAr: "كيريفا", nameEn: "Kerifa", descriptionAr: "", descriptionEn: "", color: "#2549a0", image: "", visible: true, sort: 19 },
    { id: "aprilskin", nameAr: "أبريل سكن", nameEn: "APRILSKIN", descriptionAr: "", descriptionEn: "", color: "#f0a048", image: "", visible: true, sort: 20 },
    { id: "axis-y", nameAr: "أكسس واي", nameEn: "AXIS-Y", descriptionAr: "", descriptionEn: "", color: "#76a56d", image: "", visible: true, sort: 21 },
    { id: "vt-cosmetics", nameAr: "في تي كوزمتكس", nameEn: "VT Cosmetics", descriptionAr: "", descriptionEn: "", color: "#c7c7c7", image: "", visible: true, sort: 22 },
    { id: "seapuri", nameAr: "سيابوري", nameEn: "Seapuri", descriptionAr: "", descriptionEn: "", color: "#4eb0df", image: "", visible: true, sort: 23 },
    { id: "skala", nameAr: "سكالا", nameEn: "SKALA", descriptionAr: "", descriptionEn: "", color: "#79b47c", image: "", visible: true, sort: 24 }
  ],
  products: [],
  ads: []
};

function cloneDefaultStore() {
  return JSON.parse(JSON.stringify(window.defaultStore));
}

function normalizeStore(value) {
  const base = cloneDefaultStore();
  const data = value && typeof value === "object" ? value : {};
  base.settings = Object.assign(base.settings, data.settings || {});
  if (Array.isArray(data.categories)) base.categories = data.categories;
  if (Array.isArray(data.products)) base.products = data.products;
  if (Array.isArray(data.ads)) base.ads = data.ads;
  return base;
}

function loadStore() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORE_KEY));
    if (saved) return normalizeStore(saved);
  } catch (error) {
    console.warn("Could not read local catalog data", error);
  }
  const initial = cloneDefaultStore();
  saveStore(initial);
  return initial;
}

function saveStore(data) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(normalizeStore(data)));
    return { ok: true };
  } catch (error) {
    console.error("Could not save catalog data", error);
    return { ok: false, error };
  }
}
