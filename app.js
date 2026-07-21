let db=loadStore(), cart=loadCart(), lang=localStorage.getItem("beauty_lang")||"ar";
let activeCategory="all", selectedProduct=null, gallery={images:[],index:0};
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
const T={
 ar:{offers:"عروض مميزة",products:"المنتجات",about:"من نحن",cart:"سلة المشتريات",clearCart:"تفريغ السلة",whatsapp:"فتح واتساب",waNote:"عند الضغط يُفتح واتساب مع وصل الطلب جاهزاً للإرسال.",quantity:"العدد",addToCart:"إضافة إلى السلة",search:"ابحث عن منتج",empty:"لا توجد منتجات حالياً",added:"تمت الإضافة إلى السلة",total:"المجموع",items:"عدد القطع",out:"غير متوفر"},
 en:{offers:"Featured Offers",products:"Products",about:"About Us",cart:"Shopping Cart",clearCart:"Clear Cart",whatsapp:"Open WhatsApp",waNote:"WhatsApp opens with the order receipt ready to send.",quantity:"Quantity",addToCart:"Add to Cart",search:"Search products",empty:"No products available",added:"Added to cart",total:"Total",items:"Items",out:"Out of stock"}
};
function tx(k){return T[lang][k]||k}
function loc(obj,key){return obj[key+(lang==="ar"?"Ar":"En")]||obj[key+"Ar"]||""}
function currency(){return lang==="ar"?db.settings.currencyAr:db.settings.currencyEn}
function applySettings(){
 const st=db.settings;
 document.documentElement.style.setProperty("--primary",st.primary);
 document.documentElement.style.setProperty("--accent",st.accent);
 document.documentElement.style.setProperty("--bg",st.bg);
 document.documentElement.style.setProperty("--site-width",`${st.pageWidth||1120}px`);
 document.documentElement.style.setProperty("--card-radius",`${st.cardRadius||22}px`);
 document.documentElement.style.setProperty("--desktop-columns",st.productColumnsDesktop||4);
 document.documentElement.style.setProperty("--mobile-columns",st.productColumnsMobile||2);
 document.documentElement.style.setProperty("--hero-name-size",`${st.heroNameSize||34}px`);
 document.documentElement.style.setProperty("--tagline-size",`${st.taglineSize||16}px`);
 document.documentElement.style.setProperty("--section-title-size",`${st.sectionTitleSize||22}px`);
 document.documentElement.style.setProperty("--product-name-size",`${st.productNameSize||16}px`);
 document.documentElement.style.setProperty("--ad-height",`${st.adHeight||230}px`);
 document.documentElement.style.setProperty("--section-gap",`${st.sectionGap||32}px`);
 document.body.style.fontFamily=`${st.fontFamily||"Tahoma"},Arial,sans-serif`;
 document.body.style.backgroundImage=st.backgroundImage?`linear-gradient(rgba(247,243,238,.88),rgba(247,243,238,.88)),url("${st.backgroundImage}")`:"";
 document.body.style.backgroundSize=st.backgroundFit||"cover";
 document.body.style.backgroundAttachment=st.backgroundImage?"fixed":"";
 document.documentElement.dir=lang==="ar"?"rtl":"ltr";
 document.documentElement.lang=lang;
 $("#brandName").textContent=lang==="ar"?st.nameAr:st.nameEn;
 $("#brandTagline").textContent=lang==="ar"?st.taglineAr:st.taglineEn;
 const brandLogo=$("#brandLogo");
 const logoImg=brandLogo.querySelector("img");
 if(logoImg){logoImg.alt=lang==="ar"?(st.nameAr||"بيوتي أوف جوسون العراق"):(st.nameEn||"Beauty of Joseon Iraq");}
 else brandLogo.textContent=st.logoText||"إ";
 $("#aboutText").textContent=lang==="ar"?st.aboutAr:st.aboutEn;
 $("#offersTitle").textContent=lang==="ar"?(st.offersTitleAr||tx("offers")):(st.offersTitleEn||tx("offers"));
 $("#productsTitle").textContent=lang==="ar"?(st.productsTitleAr||tx("products")):(st.productsTitleEn||tx("products"));
 $("#aboutTitle").textContent=lang==="ar"?(st.aboutTitleAr||tx("about")):(st.aboutTitleEn||tx("about"));
 $("#languageRow").classList.toggle("hidden",st.showLanguages===false);
 $("#heroSection").classList.toggle("hidden",st.showHeader===false);
 $("#whatsappTop").classList.toggle("hidden",st.showWhatsAppTop===false);
 $("#searchInput").classList.toggle("hidden",st.showSearch===false);
 $("#categoryFilters").classList.toggle("hidden",st.showCategories===false);
 $("#cartFab").classList.toggle("hidden",st.showCart===false);
 $("#aboutSection").classList.toggle("hidden",!st.showAbout);
 $("#adsSection").classList.toggle("hidden",!st.showAds);
 const wa=`https://wa.me/${String(st.whatsapp).replace(/\D/g,"")}`;
 $("#whatsappTop").href=wa;
 const orderButton=$("#whatsappOrder");
 if(orderButton) orderButton.removeAttribute("href");
 $("#whatsappTop").textContent=lang==="ar"?(st.whatsappLabelAr||"واتساب"):(st.whatsappLabelEn||"WhatsApp");
 const topButton=$("#whatsappTop");
 if(topButton){topButton.onclick=()=>{topButton.href=wa;};}
 $$('[data-i18n]').forEach(el=>{if(!["offers","products","about"].includes(el.dataset.i18n))el.textContent=tx(el.dataset.i18n)});
 $("#searchInput").placeholder=lang==="ar"?(st.searchPlaceholderAr||tx("search")):(st.searchPlaceholderEn||tx("search"));
 $("#emptyState").textContent=tx("empty");
 $$(".lang-btn").forEach(b=>b.classList.toggle("active",b.dataset.lang===lang));
 const sectionMap={ads:$("#adsSection"),products:$("#productsSection"),about:$("#aboutSection")};
 (st.sectionOrder||["ads","products","about"]).forEach(k=>{if(sectionMap[k])document.querySelector("main").appendChild(sectionMap[k])});
}
function renderCategories(){
 const cats=db.categories.filter(c=>c.visible).sort((a,b)=>a.sort-b.sort);
 $("#categoryFilters").innerHTML=cats.map(c=>`<button class="chip ${c.id===activeCategory?"active":""}" data-cat="${c.id}">${esc(loc(c,"name"))}</button>`).join("");
 $$(".chip").forEach(b=>b.onclick=()=>{activeCategory=b.dataset.cat;renderCategories();renderProducts()});
}

function stabilizeImages(root=document){
  root.querySelectorAll("img").forEach(img=>{
    const done=()=>img.classList.remove("image-loading");
    if(img.complete && img.naturalWidth>0) done();
    else img.addEventListener("load",done,{once:true});
    img.addEventListener("error",()=>{
      img.classList.remove("image-loading");
      img.classList.add("image-error");
      if(!img.dataset.fallback){
        img.dataset.fallback="1";
        img.src=svgImg("BEAUTY","#f4ede5","#c9a36a");
      }
    },{once:true});
  });
}

const PRODUCT_PAGE_SIZE=24;
let visibleProductCount=PRODUCT_PAGE_SIZE;
function productCardHtml(p,i){
 return `<article class="product-card">
   <div class="product-image-wrap">
    <img class="product-image image-loading" data-open="${p.id}" id="main-${p.id}" src="${p.images?.[0]||""}" alt="${esc(loc(p,"name"))}" loading="${i<4?"eager":"lazy"}" decoding="async" fetchpriority="${i<4?"high":"low"}">
    ${loc(p,"badge")?`<span class="badge">${esc(loc(p,"badge"))}</span>`:""}
    ${p.images?.length>1?`<div class="thumbs">${p.images.slice(0,4).map((im,x)=>`<img class="thumb ${x===0?"active":""}" data-product="${p.id}" data-index="${x}" src="${im}" loading="lazy" decoding="async">`).join("")}</div>`:""}
   </div>
   <div class="product-info"><h3>${esc(loc(p,"name"))}</h3><p>${esc(loc(p,"desc"))}</p>
    <div class="price-row"><span class="price">${Number(p.price).toLocaleString()} ${currency()}</span>
    <button class="add-btn" data-add="${p.id}" ${(+p.stock||0)<=0?"disabled":""}>${(+p.stock||0)<=0?tx("out"):tx("addToCart")}</button></div>
   </div></article>`;
}
function bindProductEvents(root=document){
 root.querySelectorAll("[data-add]").forEach(b=>b.onclick=()=>openQty(b.dataset.add));
 root.querySelectorAll("[data-open]").forEach(im=>im.onclick=()=>openGallery(im.dataset.open,0));
 root.querySelectorAll(".thumb").forEach(t=>t.onclick=e=>{e.stopPropagation();const p=db.products.find(x=>String(x.id)===String(t.dataset.product));const main=$("#main-"+CSS.escape(String(p.id)));if(main&&p?.images?.[+t.dataset.index])main.src=p.images[+t.dataset.index];t.parentElement.querySelectorAll(".thumb").forEach(x=>x.classList.remove("active"));t.classList.add("active")});
}
function getFilteredProducts(){
 const q=$("#searchInput").value.trim().toLowerCase();
 return db.products.filter(p=>p.visible&&(activeCategory==="all"||p.category===activeCategory)&&(!q||loc(p,"name").toLowerCase().includes(q)||loc(p,"desc").toLowerCase().includes(q))).sort((a,b)=>(a.sort||0)-(b.sort||0));
}
function renderProducts(reset=true){
 if(reset) visibleProductCount=PRODUCT_PAGE_SIZE;
 const list=getFilteredProducts();
 const visible=list.slice(0,visibleProductCount);
 $("#emptyState").classList.toggle("hidden",list.length>0);
 $("#productsGrid").innerHTML=visible.map(productCardHtml).join("");
 stabilizeImages($("#productsGrid"));
 bindProductEvents($("#productsGrid"));
 const more=$("#loadMoreProducts");
 if(more){
   more.classList.toggle("hidden",visible.length>=list.length);
   more.textContent=lang==="ar"?`عرض المزيد (${list.length-visible.length})`:`Load more (${list.length-visible.length})`;
 }
}
function loadMoreProducts(){
 visibleProductCount+=PRODUCT_PAGE_SIZE;
 renderProducts(false);
}

let sliderTimer;
function renderAds(){
 const ads=db.ads.filter(a=>a.visible).sort((a,b)=>a.sort-b.sort);
 $("#adsSlider").innerHTML=ads.map(a=>{const isVideo=a.mediaType==="video"||/\.(mp4|webm)(?:$|\?)/i.test(a.image||"");const media=isVideo?`<video src="${a.image}" autoplay muted loop playsinline preload="metadata"></video>`:`<img src="${a.image}" loading="eager" decoding="async">`;return `<div class="ad-card" data-ad="${a.id}">${media}</div>`}).join("");
 $("#sliderDots").innerHTML=ads.map((_,i)=>`<span class="dot ${i===0?"active":""}"></span>`).join("");
 stabilizeImages($("#adsSlider"));
 $$("[data-ad]").forEach(a=>a.onclick=()=>{const ad=db.ads.find(x=>x.id===a.dataset.ad);if(ad?.productId)openQty(ad.productId)});
 clearInterval(sliderTimer);let i=0;
 const slider=$("#adsSlider");
 const slides=[...slider.querySelectorAll(".ad-card")];
 const showSlide=index=>{
   i=((index%slides.length)+slides.length)%slides.length;
   slides.forEach((slide,x)=>{
     slide.classList.toggle("active",x===i);
     slide.setAttribute("aria-hidden",x===i?"false":"true");
     const video=slide.querySelector("video");
     if(video){
       if(x===i){ video.currentTime=0; video.play().catch(()=>{}); }
       else { video.pause(); }
     }
   });
   $$("#sliderDots .dot").forEach((d,x)=>d.classList.toggle("active",x===i));
 };
 if(slides.length){ showSlide(0); }
 if(ads.length>1)sliderTimer=setInterval(()=>showSlide(i+1),3000);
}
function openQty(id){
 selectedProduct=db.products.find(p=>p.id===id);if(!selectedProduct)return;
 if((+selectedProduct.stock||0)<=0){toast(tx("out"));return;}
 $("#qtyImage").src=selectedProduct.images?.[0]||"";
 $("#qtyTitle").textContent=loc(selectedProduct,"name");
 const input=$("#qtyInput");
 const stockLimit=Math.max(1,Number(selectedProduct.stock)||1);
 input.value=1;
 input.max=stockLimit;
 document.body.classList.add("qty-open");
 $("#qtyModal").classList.remove("hidden");
 setTimeout(()=>{try{input.focus({preventScroll:true});input.select()}catch(e){}},120);
}
let addBusy=false;
function closeAllOverlays(){
  const input=$("#qtyInput");
  try{input?.blur()}catch(e){}
  $("#qtyModal")?.classList.add("hidden");
  $("#galleryModal")?.classList.add("hidden");
  document.body.classList.remove("qty-open");
  document.documentElement.classList.remove("qty-open");
  document.body.style.removeProperty("overflow");
  document.documentElement.style.removeProperty("overflow");
}
function addSelected(){
  if(addBusy||!selectedProduct)return;
  addBusy=true;
  try{
    const stock=Math.max(0,Number(selectedProduct.stock)||0);
    const found=cart.find(x=>x.id===selectedProduct.id);
    const inCart=Math.max(0,Number(found?.qty)||0);
    const remaining=Math.max(0,stock-inCart);
    if(remaining<=0){
      closeAllOverlays();
      toast(tx("out"));
      return;
    }
    const requested=Math.max(1,Math.floor(Number($("#qtyInput")?.value)||1));
    const qty=Math.min(requested,remaining);
    if(found) found.qty=inCart+qty;
    else cart.push({id:selectedProduct.id,qty});
    if(!saveCart(cart)){
      toast(lang==="ar"?"تعذّر حفظ السلة، امسح بيانات الموقع القديمة":"Could not save cart. Clear old site data.");
      return;
    }
    closeAllOverlays();
    renderCart();
    toast(tx("added"));
  }catch(error){
    console.error("Beauty add-to-cart failed",error);
    closeAllOverlays();
    toast(lang==="ar"?"حدث خطأ أثناء الإضافة للسلة":"An error occurred while adding to cart");
  }finally{
    setTimeout(()=>{addBusy=false},180);
  }
}
function renderCart(){
  try{
    const productsById=new Map((db.products||[]).map(p=>[String(p.id),p]));
    const cleaned=[];
    for(const item of Array.isArray(cart)?cart:[]){
      const p=productsById.get(String(item?.id));
      const stock=Math.max(0,Number(p?.stock)||0);
      const qty=Math.min(stock,Math.max(1,Math.floor(Number(item?.qty)||1)));
      if(p && stock>0 && qty>0) cleaned.push({id:p.id,qty});
    }
    const changed=JSON.stringify(cleaned)!==JSON.stringify(cart);
    cart=cleaned;
    if(changed) saveCart(cart);

    const count=cart.reduce((sum,item)=>sum+item.qty,0);
    const countEl=$("#cartCount");
    if(countEl) countEl.textContent=count;

    const cartItems=$("#cartItems");
    if(cartItems){
      cartItems.innerHTML=cart.map(item=>{
        const p=productsById.get(String(item.id));
        const image=(Array.isArray(p.images)&&p.images[0])?p.images[0]:svgImg("BEAUTY","#f4ede5","#c9a36a");
        return `<div class="cart-item"><img src="${image}" alt="${esc(loc(p,"name"))}" loading="lazy" decoding="async"><div><h4>${esc(loc(p,"name"))}</h4><small>${Number(p.price||0).toLocaleString()} ${currency()}</small></div><div class="cart-controls"><button type="button" data-minus="${esc(p.id)}">−</button><b>${item.qty}</b><button type="button" data-plus="${esc(p.id)}">+</button><button type="button" class="remove" data-remove="${esc(p.id)}">×</button></div></div>`;
      }).join("")||`<div class="empty">${tx("empty")}</div>`;
    }

    const total=cart.reduce((sum,item)=>{
      const p=productsById.get(String(item.id));
      return sum+(Number(p?.price)||0)*item.qty;
    },0);
    const receipt=$("#receipt");
    if(receipt) receipt.innerHTML=`<div class="receipt-row"><span>${tx("items")}</span><b>${count}</b></div><div class="receipt-row total"><span>${tx("total")}</span><b>${total.toLocaleString()} ${currency()}</b></div>`;

    const receiptLines=cart.map((item,i)=>{
      const p=productsById.get(String(item.id));
      const price=Number(p?.price)||0;
      return `${i+1}. ${loc(p,"name")}\n${lang==="ar"?"العدد":"Qty"}: ${item.qty} × ${price.toLocaleString()} ${currency()} = ${(price*item.qty).toLocaleString()} ${currency()}`;
    });
    const receiptText=lang==="ar"
      ? `وصل طلب من متجر ${db.settings.nameAr||"بيوتي أوف جوسون العراق"}\n\n${receiptLines.join("\n\n")}\n\nعدد القطع: ${count}\nالمجموع: ${total.toLocaleString()} ${currency()}`
      : `Order receipt from ${db.settings.nameEn||"Beauty of Joseon Iraq"}\n\n${receiptLines.join("\n\n")}\n\nItems: ${count}\nTotal: ${total.toLocaleString()} ${currency()}`;
    const phone=String(db.settings.whatsapp||"").replace(/\D/g,"");
    const wa=$("#whatsappOrder");
    if(wa){
      wa.href=`https://wa.me/${phone}?text=${encodeURIComponent(receiptText)}`;
      wa.removeAttribute("target");
      wa.onclick=async event=>{
        event.preventDefault();
        if(!cart.length){toast(lang==="ar"?"السلة فارغة":"Cart is empty");return;}
        if(!window.ibraqCloud?.ready){toast(lang==="ar"?"أكمل إعداد مفتاح Supabase أولاً":"Complete Supabase setup first");return;}

        const customerName=prompt(lang==="ar"?"اكتب اسمك الكامل":"Enter your full name",localStorage.getItem("beauty_customer_name")||"");
        if(!customerName)return;
        const customerPhone=prompt(lang==="ar"?"اكتب رقم هاتفك":"Enter your phone number",localStorage.getItem("beauty_customer_phone")||"");
        if(!customerPhone)return;
        const customerAddress=prompt(lang==="ar"?"اكتب العنوان (اختياري)":"Address (optional)",localStorage.getItem("beauty_customer_address")||"")||"";

        localStorage.setItem("beauty_customer_name",customerName);
        localStorage.setItem("beauty_customer_phone",customerPhone);
        localStorage.setItem("beauty_customer_address",customerAddress);

        const customerBlock=lang==="ar"
          ? `اسم الزبون: ${customerName}\nرقم الهاتف: ${customerPhone}${customerAddress?`\nالعنوان: ${customerAddress}`:""}`
          : `Customer: ${customerName}\nPhone: ${customerPhone}${customerAddress?`\nAddress: ${customerAddress}`:""}`;
        const finalReceiptText=`${receiptText}\n\n${customerBlock}`;
        const whatsappUrl=`https://wa.me/${phone}?text=${encodeURIComponent(finalReceiptText)}`;

        try{
          wa.setAttribute("aria-busy","true");
          const items=cart.map(item=>{const p=productsById.get(String(item.id));return {product_id:p.id,name_ar:p.nameAr,name_en:p.nameEn,qty:item.qty,price:Number(p.price)||0,image:p.images?.[0]||""}});
          await window.ibraqCloud.createOrder({customer_name:customerName,customer_phone:customerPhone,customer_address:customerAddress,items,total,status:"new",notes:""});
          cart=[];saveCart(cart);renderCart();
          window.location.href=whatsappUrl;
        }catch(error){
          console.error(error);
          toast(lang==="ar"?"سيفتح واتساب، لكن تعذر حفظ الطلب في صفحة الطلبات":"WhatsApp will open, but the order could not be saved");
          window.location.href=whatsappUrl;
        }finally{
          wa.removeAttribute("aria-busy");
        }
      };
    }

    if(cartItems) stabilizeImages(cartItems);
    $$('[data-minus]').forEach(b=>b.onclick=()=>changeQty(b.dataset.minus,-1));
    $$('[data-plus]').forEach(b=>b.onclick=()=>changeQty(b.dataset.plus,1));
    $$('[data-remove]').forEach(b=>b.onclick=()=>{
      cart=cart.filter(x=>String(x.id)!==String(b.dataset.remove));
      saveCart(cart);
      renderCart();
    });
  }catch(error){
    console.error("Beauty cart rendering failed",error);
    const cartItems=$("#cartItems");
    if(cartItems) cartItems.innerHTML=`<div class="empty">${lang==="ar"?"تعذّر عرض السلة. أعد تحميل الصفحة.":"Could not display the cart. Reload the page."}</div>`;
    closeAllOverlays();
  }
}
function changeQty(id,delta){
  const item=cart.find(x=>String(x.id)===String(id));
  const product=(db.products||[]).find(x=>String(x.id)===String(id));
  if(!item||!product)return;
  const stock=Math.max(1,Number(product.stock)||1);
  const limit=stock;
  item.qty=Math.max(1,Math.min(limit,(Number(item.qty)||1)+delta));
  saveCart(cart);
  renderCart();
}
function openGallery(id,index){const p=(db.products||[]).find(x=>String(x.id)===String(id));if(!p)return;gallery={images:Array.isArray(p.images)?p.images.filter(Boolean):[],index:Math.max(0,Number(index)||0)};if(!gallery.images.length)return;showGallery();$("#galleryModal").classList.remove("hidden")}
function showGallery(){if(!gallery.images.length)return;$("#galleryImage").src=gallery.images[gallery.index];$("#galleryCounter").textContent=`${gallery.index+1} / ${gallery.images.length}`}
function toast(msg){$("#toast").textContent=msg;$("#toast").classList.add("show");setTimeout(()=>$("#toast").classList.remove("show"),1800)}
$(".language-row").onclick=e=>{if(e.target.dataset.lang){lang=e.target.dataset.lang;localStorage.setItem("beauty_lang",lang);applySettings();renderCategories();renderProducts();renderAds();renderCart()}};
let searchTimer;$("#searchInput").oninput=()=>{clearTimeout(searchTimer);searchTimer=setTimeout(()=>renderProducts(true),120)};$("#cartFab").onclick=()=>$("#cartDrawer").classList.add("open");$("#closeCart").onclick=()=>$("#cartDrawer").classList.remove("open");$("#cartDrawer").onclick=e=>{if(e.target.id==="cartDrawer")e.currentTarget.classList.remove("open")};
$("#clearCart").onclick=()=>{cart=[];saveCart(cart);renderCart()};
$("#qtyMinus").onclick=()=>$("#qtyInput").value=Math.max(1,+$("#qtyInput").value-1);
$("#qtyPlus").onclick=()=>{const max=Math.max(1,+$("#qtyInput").max||1);$("#qtyInput").value=Math.min(max,Math.max(1,+$("#qtyInput").value+1))};
$("#qtyInput").addEventListener("input",()=>{const input=$("#qtyInput");const max=Math.max(1,+input.max||1);input.value=Math.min(max,Math.max(1,Math.floor(Number(input.value)||1)))});
$("#confirmAdd").onclick=e=>{e.preventDefault();addSelected()};
$$("[data-close]").forEach(b=>b.onclick=()=>closeAllOverlays());$("#galleryPrev").onclick=()=>{gallery.index=(gallery.index-1+gallery.images.length)%gallery.images.length;showGallery()};$("#galleryNext").onclick=()=>{gallery.index=(gallery.index+1)%gallery.images.length;showGallery()};
$("#qtyModal").addEventListener("pointerdown",e=>{if(e.target.id==="qtyModal")closeAllOverlays()});
window.addEventListener("pageshow",()=>{if($("#qtyModal").classList.contains("hidden"))document.body.classList.remove("qty-open")});
window.addEventListener("storage",()=>{const local=loadStore();db.settings=local.settings;db.categories=local.categories;db.ads=local.ads;applySettings();renderCategories();renderAds();renderCart()});
async function initializeStore(){
  closeAllOverlays();$("#cartDrawer").classList.remove("open");
  if(window.ibraqCloud?.ready){
    try{const [products,config]=await Promise.all([window.ibraqCloud.getProducts(),window.ibraqCloud.getSiteConfig()]);db.products=products;if(config){db.settings=Object.assign({},defaultStore.settings,config.settings||{});db.categories=Array.isArray(config.categories)?config.categories:db.categories;db.ads=Array.isArray(config.ads)?config.ads:db.ads;saveStore(db)}}
    catch(error){console.error("Supabase products load failed",error);toast(lang==="ar"?"تعذر تحميل المنتجات من السيرفر":"Could not load products");}
  }
  applySettings();renderCategories();renderProducts();renderAds();renderCart();
}
initializeStore();

// Hide branded opening screen after the store is ready.
window.addEventListener("load",()=>{
  const splash=document.getElementById("splashScreen");
  if(!splash)return;
  setTimeout(()=>splash.classList.add("hide"),1400);
  setTimeout(()=>splash.remove(),2200);
});
