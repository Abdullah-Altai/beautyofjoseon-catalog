const STORE_KEY = "beautyofjoseon_iraq_store_v1";
const CART_KEY = "beautyofjoseon_iraq_cart_v1";

const svgImg = (text, c1, c2) =>
  `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="900" height="700"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/><circle cx="720" cy="110" r="160" fill="white" opacity=".12"/><circle cx="150" cy="610" r="230" fill="white" opacity=".08"/><text x="50%" y="52%" text-anchor="middle" dominant-baseline="middle" fill="white" font-family="Arial" font-size="76" font-weight="700">${text}</text></svg>`)}`;

const defaultStore = {
  settings:{
    nameAr:"بيوتي أوف جوسون العراق", nameEn:"Beauty of Joseon Iraq",
    taglineAr:"منتجات عناية كورية مختارة بعناية", taglineEn:"Carefully selected Korean skincare products",
    aboutAr:"متجر Beauty of Joseon Iraq يوفر منتجات عناية كورية مختارة مع طلب سريع وسهل عبر واتساب.",
    aboutEn:"Beauty of Joseon Iraq offers selected Korean skincare products with fast and easy ordering via WhatsApp.",
    whatsapp:"9647500000000", currencyAr:"د.ع", currencyEn:"IQD",
    primary:"#241d19", accent:"#a9473f", bg:"#f7f3ee",
    logoText:"BOJ", showAds:true, showAbout:true,
    showLanguages:true, showHeader:true, showWhatsAppTop:true, showSearch:true, showCategories:true, showCart:true,
    offersTitleAr:"عروض مميزة", offersTitleEn:"Featured Offers",
    productsTitleAr:"المنتجات", productsTitleEn:"Products", aboutTitleAr:"من نحن", aboutTitleEn:"About Us",
    searchPlaceholderAr:"ابحث عن منتج", searchPlaceholderEn:"Search products",
    whatsappLabelAr:"واتساب", whatsappLabelEn:"WhatsApp",
    fontFamily:"Tahoma", pageWidth:1120, cardRadius:22, productColumnsDesktop:4, productColumnsMobile:2,
    heroNameSize:34, taglineSize:16, sectionTitleSize:22, productNameSize:16,
    adHeight:230, sectionGap:32, backgroundImage:"", backgroundFit:"cover",
    sectionOrder:["ads","products","about"]
  },
  categories:[
    {id:"all",nameAr:"الكل",nameEn:"All",visible:true,sort:0},
    {id:"skincare",nameAr:"العناية بالبشرة",nameEn:"Skincare",visible:true,sort:1},
    {id:"sets",nameAr:"المجموعات",nameEn:"Sets",visible:true,sort:2}
  ],
  products:[],
  ads:[],
  admin:{username:"admin",password:"admin123"}
};

function loadStore(){
  try{
    const saved=JSON.parse(localStorage.getItem(STORE_KEY));
    if(saved && saved.settings && saved.products) {
      if (saved.settings.primary === "#7c3aed" && saved.settings.bg === "#0d0718") {
        saved.settings.primary = "#6b3f23";
        saved.settings.accent = "#d6a06a";
        saved.settings.bg = "#f7f3ee";
      }
      saved.settings = Object.assign({}, defaultStore.settings, saved.settings || {});
      if (!Array.isArray(saved.settings.sectionOrder)) saved.settings.sectionOrder=["ads","products","about"];
      localStorage.setItem(STORE_KEY, JSON.stringify(saved));
      return saved;
    }
  }catch(e){}
  localStorage.setItem(STORE_KEY,JSON.stringify(defaultStore));
  return JSON.parse(JSON.stringify(defaultStore));
}
function saveStore(data){
  try{
    localStorage.setItem(STORE_KEY,JSON.stringify(data));
    return {ok:true};
  }catch(error){
    console.error("Beauty store save failed",error);
    return {ok:false,error};
  }
}
function loadCart(){
  try{
    const data=JSON.parse(localStorage.getItem(CART_KEY));
    return Array.isArray(data)?data:[];
  }catch(e){return[]}
}
function saveCart(data){
  try{localStorage.setItem(CART_KEY,JSON.stringify(data));return true}
  catch(error){console.error("Beauty cart save failed",error);return false}
}
