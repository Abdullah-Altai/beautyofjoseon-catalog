let db=loadStore(),orders=[];
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
function toast(msg){const t=$("#toast");t.textContent=msg;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),1800)}
function cloudReady(){return !!window.ibraqCloud?.ready}
async function login(){
 const email=$("#loginUser").value.trim(),password=$("#loginPass").value;
 $("#loginError").textContent="";
 if(!cloudReady()){$("#loginError").textContent="ضع Publishable Key داخل supabase-config.js أولاً";return}
 try{await window.ibraqCloud.signIn(email,password);showApp()}catch(e){$("#loginError").textContent=e.message||"تعذر تسجيل الدخول"}
}
$("#loginForm").onsubmit=e=>{e.preventDefault();login()};
async function showApp(){
 $("#loginView").classList.add("hidden");$("#adminApp").classList.remove("hidden");
 $("#cloudStatus").textContent=cloudReady()?"متصل بقاعدة البيانات بنجاح":"مفتاح Supabase غير مضاف";
 await refreshCloud();fillSettings();fillHomepage();renderLocal();
}
$("#logoutBtn").onclick=async()=>{await window.ibraqCloud?.signOut();location.reload()};
window.addEventListener('load',async()=>{if(cloudReady()&&await window.ibraqCloud.session())showApp()});

const titles={dashboard:"الرئيسية",products:"المنتجات",orders:"الطلبات",categories:"الأقسام",ads:"الإعلانات",settings:"إعدادات الموقع",security:"الدخول والأمان",homepage:"تعديل الصفحة الرئيسية"};
$$('.nav').forEach(b=>b.onclick=()=>{$$('.nav').forEach(x=>x.classList.remove('active'));b.classList.add('active');$$('.tab').forEach(x=>x.classList.remove('active'));$('#'+b.dataset.tab).classList.add('active');$('#pageTitle').textContent=titles[b.dataset.tab]||'';if(b.dataset.tab==='orders')loadOrders()});

async function refreshCloud(){
 if(!cloudReady())return;
 try{const [products,config]=await Promise.all([window.ibraqCloud.getProducts(),window.ibraqCloud.getSiteConfig()]);db.products=products;if(config){db.settings=Object.assign({},defaultStore.settings,config.settings||{});db.categories=Array.isArray(config.categories)?config.categories:db.categories;db.ads=Array.isArray(config.ads)?config.ads:db.ads;saveStore(db)}renderProducts();renderStats()}catch(e){console.error(e);toast("تعذر تحميل البيانات")}
}
function renderStats(){
 $('#statProducts').textContent=db.products.length;$('#statAds').textContent=db.ads.length;$('#statCats').textContent=db.categories.length;$('#statStock').textContent=db.products.reduce((s,p)=>s+(Number(p.stock)||0),0)
}
function renderLocal(){renderProducts();renderCategories();renderAds();renderStats()}
function renderProducts(){
 $('#productsAdmin').innerHTML=db.products.slice().sort((a,b)=>a.sort-b.sort).map(p=>`<div class="admin-card"><img src="${p.images?.[0]||''}"><div><h4>${esc(p.nameAr)}</h4><p>${esc(p.nameEn)}</p><p>${Number(p.price).toLocaleString()} د.ع — المخزون: ${p.stock}</p><p>${p.visible?'ظاهر':'مخفي'} — الترتيب: ${p.sort}</p><div class="card-actions"><button class="edit" data-edit-product="${p.id}">تعديل</button><button class="toggle" data-toggle-product="${p.id}">${p.visible?'إخفاء':'إظهار'}</button><button class="delete" data-delete-product="${p.id}">حذف</button></div></div></div>`).join('')||'<div class="panel">لا توجد منتجات بعد.</div>';
 $$('[data-edit-product]').forEach(b=>b.onclick=()=>openProduct(b.dataset.editProduct));
 $$('[data-toggle-product]').forEach(b=>b.onclick=async()=>{const p=db.products.find(x=>x.id===b.dataset.toggleProduct);p.visible=!p.visible;await saveProduct(p)});
 $$('[data-delete-product]').forEach(b=>b.onclick=async()=>{if(!confirm('حذف المنتج نهائياً؟'))return;try{const product=db.products.find(x=>x.id===b.dataset.deleteProduct);await window.ibraqCloud.deleteProduct(b.dataset.deleteProduct,product?.images||[]);db.products=db.products.filter(x=>x.id!==b.dataset.deleteProduct);renderProducts();renderStats();toast('تم حذف المنتج')}catch(e){alert(e.message)}})
}
function renderCategories(){
 $('#categoriesAdmin').innerHTML=db.categories.slice().sort((a,b)=>a.sort-b.sort).map(c=>`<div class="mini-card"><h4>${esc(c.nameAr)} / ${esc(c.nameEn)}</h4><p>المعرّف: ${c.id} — الترتيب: ${c.sort}</p><div class="card-actions"><button class="edit" data-edit-cat="${c.id}">تعديل</button>${c.id!=='all'?`<button class="delete" data-delete-cat="${c.id}">حذف</button>`:''}</div></div>`).join('');
 $$('[data-edit-cat]').forEach(b=>b.onclick=()=>openCategory(b.dataset.editCat));$$('[data-delete-cat]').forEach(b=>b.onclick=async()=>{if(confirm('حذف القسم؟')){db.categories=db.categories.filter(x=>x.id!==b.dataset.deleteCat);db.products.filter(p=>p.category===b.dataset.deleteCat).forEach(p=>p.category='all');saveStore(db);await window.ibraqCloud.saveSiteConfig({settings:db.settings,categories:db.categories,ads:db.ads});renderCategories()}})
}
function renderAds(){
 $('#adsAdmin').innerHTML=db.ads.slice().sort((a,b)=>a.sort-b.sort).map(a=>`<div class="admin-card"><img src="${a.image}"><div><h4>${esc(a.titleAr)}</h4><p>${esc(a.titleEn)}</p><p>${a.visible?'ظاهر':'مخفي'} — الترتيب: ${a.sort}</p><div class="card-actions"><button class="edit" data-edit-ad="${a.id}">تعديل</button><button class="toggle" data-toggle-ad="${a.id}">${a.visible?'إخفاء':'إظهار'}</button><button class="delete" data-delete-ad="${a.id}">حذف</button></div></div></div>`).join('');
 $$('[data-edit-ad]').forEach(b=>b.onclick=()=>openAd(b.dataset.editAd));$$('[data-toggle-ad]').forEach(b=>b.onclick=async()=>{const a=db.ads.find(x=>x.id===b.dataset.toggleAd);a.visible=!a.visible;saveStore(db);await window.ibraqCloud.saveSiteConfig({settings:db.settings,categories:db.categories,ads:db.ads});renderAds()});$$('[data-delete-ad]').forEach(b=>b.onclick=async()=>{if(confirm('حذف الإعلان؟')){db.ads=db.ads.filter(x=>x.id!==b.dataset.deleteAd);saveStore(db);await window.ibraqCloud.saveSiteConfig({settings:db.settings,categories:db.categories,ads:db.ads});renderAds()}})
}
async function loadOrders(){
 const box=$('#ordersAdmin');box.innerHTML='<div class="panel">جاري تحميل الطلبات...</div>';
 try{orders=await window.ibraqCloud.getOrders();renderOrders()}catch(e){box.innerHTML=`<div class="panel">تعذر تحميل الطلبات: ${esc(e.message)}</div>`}
}
function renderOrders(){
 $('#ordersAdmin').innerHTML=orders.map(o=>`<div class="admin-card order-card"><div><h4>طلب ${String(o.id).slice(0,8)}</h4><p><b>${esc(o.customer_name)}</b> — ${esc(o.customer_phone)}</p><p>${esc(o.customer_address||'بدون عنوان')}</p><p>${(o.items||[]).map(i=>`${esc(i.name_ar||i.name_en)} × ${i.qty}`).join('، ')}</p><p><b>${Number(o.total).toLocaleString()} د.ع</b> — ${new Date(o.created_at).toLocaleString('ar-IQ')}</p><div class="card-actions"><select data-order-status="${o.id}"><option value="new" ${o.status==='new'?'selected':''}>جديد</option><option value="confirmed" ${o.status==='confirmed'?'selected':''}>مؤكد</option><option value="completed" ${o.status==='completed'?'selected':''}>مكتمل</option><option value="cancelled" ${o.status==='cancelled'?'selected':''}>ملغي</option></select><button class="delete" data-delete-order="${o.id}">حذف</button></div></div></div>`).join('')||'<div class="panel">لا توجد طلبات.</div>';
 $$('[data-order-status]').forEach(s=>s.onchange=async()=>{try{await window.ibraqCloud.updateOrder(s.dataset.orderStatus,{status:s.value});toast('تم تحديث الطلب')}catch(e){alert(e.message)}});
 $$('[data-delete-order]').forEach(b=>b.onclick=async()=>{if(confirm('حذف الطلب؟')){await window.ibraqCloud.deleteOrder(b.dataset.deleteOrder);orders=orders.filter(x=>x.id!==b.dataset.deleteOrder);renderOrders()}})
}
$('#refreshOrders').onclick=loadOrders;
function fillSettings(){const f=$('#settingsForm');Object.entries(db.settings).forEach(([k,v])=>{const el=f.elements[k];if(el)el.type==='checkbox'?el.checked=!!v:el.value=v})}
$('#saveAll').onclick=async()=>{const f=$('#settingsForm'),s=db.settings;['nameAr','nameEn','taglineAr','taglineEn','aboutAr','aboutEn','whatsapp','logoText','currencyAr','currencyEn','primary','accent','bg'].forEach(k=>s[k]=f.elements[k].value);s.showAds=f.showAds.checked;s.showAbout=f.showAbout.checked;saveStore(db);await window.ibraqCloud.saveSiteConfig({settings:db.settings,categories:db.categories,ads:db.ads});toast('تم حفظ إعدادات الموقع')};
function field(label,name,value='',type='text',extra=''){return `<label>${label}<input name="${name}" type="${type}" value="${esc(value)}" ${extra}></label>`}
function textArea(label,name,value=''){return `<label class="wide">${label}<textarea name="${name}">${esc(value)}</textarea></label>`}
function openModal(title,html,onSubmit){$('#editorTitle').textContent=title;$('#editorForm').innerHTML=html+'<button class="wide save">حفظ</button>';$('#editorModal').classList.remove('hidden');$('#editorForm').onsubmit=async e=>{e.preventDefault();const btn=e.submitter;btn.disabled=true;btn.textContent='جاري الحفظ...';try{await onSubmit(new FormData(e.target));$('#editorModal').classList.add('hidden')}catch(err){alert(err.message||'حدث خطأ')}finally{btn.disabled=false;btn.textContent='حفظ'}}}
$('#closeEditor').onclick=()=>$('#editorModal').classList.add('hidden');
async function saveProduct(p){const saved=await window.ibraqCloud.saveProduct(p);const i=db.products.findIndex(x=>x.id===saved.id);if(i>=0)db.products[i]=saved;else db.products.push(saved);renderProducts();renderStats();toast('تم حفظ المنتج')}
function openProduct(id){
 const old=id?db.products.find(x=>x.id===id):{nameAr:'',nameEn:'',descAr:'',descEn:'',category:'all',price:0,stock:0,badgeAr:'',badgeEn:'',visible:true,featured:false,sort:db.products.length+1,images:[]};
 const cats=db.categories.filter(c=>c.id!=='all');
 openModal(id?'تعديل المنتج':'إضافة منتج',field('اسم المنتج بالعربي','nameAr',old.nameAr)+field('Product name in English','nameEn',old.nameEn)+textArea('الوصف بالعربي','descAr',old.descAr)+textArea('Description in English','descEn',old.descEn)+`<label>القسم<select name="category">${cats.map(c=>`<option value="${c.id}" ${old.category===c.id?'selected':''}>${esc(c.nameAr)} / ${esc(c.nameEn)}</option>`).join('')}</select></label>`+field('السعر','price',old.price,'number','min="0"')+field('المخزون','stock',old.stock,'number','min="0"')+field('شارة بالعربي','badgeAr',old.badgeAr)+field('Badge in English','badgeEn',old.badgeEn)+field('الترتيب','sort',old.sort,'number')+`<label class="check"><input name="visible" type="checkbox" ${old.visible?'checked':''}> ظاهر</label><label class="check"><input name="featured" type="checkbox" ${old.featured?'checked':''}> مميز</label><label class="wide">صور المنتج (حتى 10 صور)<input name="images" type="file" accept="image/*" multiple></label><label class="wide">روابط صور إضافية، كل رابط بسطر<textarea name="imageUrls">${(old.images||[]).join('\n')}</textarea></label><div class="wide image-preview">${(old.images||[]).map(x=>`<img src="${x}">`).join('')}</div>`,async fd=>{
   const files=fd.getAll('images').filter(f=>f.size).slice(0,10);const uploaded=files.length?await window.ibraqCloud.uploadImages(files):[];const urls=String(fd.get('imageUrls')||'').split('\n').map(x=>x.trim()).filter(Boolean);const p={...old,nameAr:fd.get('nameAr'),nameEn:fd.get('nameEn'),descAr:fd.get('descAr'),descEn:fd.get('descEn'),category:fd.get('category'),price:+fd.get('price'),stock:+fd.get('stock'),badgeAr:fd.get('badgeAr'),badgeEn:fd.get('badgeEn'),sort:+fd.get('sort'),visible:fd.has('visible'),featured:fd.has('featured'),images:[...uploaded,...urls].slice(0,10)};if(id)p.id=id;if(!p.images.length)throw new Error('أضف صورة واحدة على الأقل');await saveProduct(p)
 })
}
function openCategory(id){const c=id?db.categories.find(x=>x.id===id):{id:'c'+Date.now(),nameAr:'',nameEn:'',visible:true,sort:db.categories.length};openModal(id?'تعديل القسم':'إضافة قسم',field('اسم القسم بالعربي','nameAr',c.nameAr)+field('Category name in English','nameEn',c.nameEn)+field('الترتيب','sort',c.sort,'number')+`<label class="check"><input name="visible" type="checkbox" ${c.visible?'checked':''}> ظاهر</label>`,async fd=>{Object.assign(c,{nameAr:fd.get('nameAr'),nameEn:fd.get('nameEn'),sort:+fd.get('sort'),visible:fd.has('visible')});if(!id)db.categories.push(c);saveStore(db);await window.ibraqCloud.saveSiteConfig({settings:db.settings,categories:db.categories,ads:db.ads});renderCategories();toast('تم الحفظ')})}
function openAd(id){
 const a=id?db.ads.find(x=>x.id===id):{id:'a'+Date.now(),titleAr:'',titleEn:'',subtitleAr:'',subtitleEn:'',image:'',mediaType:'image',productId:'',visible:true,sort:db.ads.length+1};
 const current=a.image?`<div id="adMediaPreview" class="media-preview show">${a.mediaType==='video'?`<video src="${esc(a.image)}" controls muted playsinline></video>`:`<img src="${esc(a.image)}" alt="">`}<div class="media-name">الملف الحالي</div><button type="button" id="removeAdMedia" class="remove-media">حذف الملف الحالي</button></div>`:`<div id="adMediaPreview" class="media-preview"></div>`;
 openModal(id?'تعديل الإعلان':'إضافة إعلان',field('عنوان الإعلان بالعربي','titleAr',a.titleAr)+field('Ad title in English','titleEn',a.titleEn)+field('النص بالعربي','subtitleAr',a.subtitleAr)+field('Text in English','subtitleEn',a.subtitleEn)+`<label class="media-upload">صورة أو فيديو الإعلان<input id="adMediaFile" name="media" type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"><span class="media-help">الصورة المفضلة: 1600 × 900 بكسل — JPG / PNG / WEBP حتى 8 MB<br>الفيديو: MP4 / WEBM حتى 50 MB، ويفضل بنسبة 16:9</span></label>${current}<input type="hidden" name="removeMedia" id="removeMediaFlag" value="0">`+field('الترتيب','sort',a.sort,'number')+`<label class="check"><input name="visible" type="checkbox" ${a.visible?'checked':''}> ظاهر</label>`,async fd=>{
   let mediaUrl=a.image||'',mediaType=a.mediaType||'image';
   if(fd.get('removeMedia')==='1'){mediaUrl='';mediaType='image'}
   const file=fd.get('media');
   if(file&&file.size){const uploaded=await window.ibraqCloud.uploadAdMedia(file);mediaUrl=uploaded.url;mediaType=uploaded.type}
   if(!mediaUrl)throw new Error('اختر صورة أو فيديو للإعلان');
   Object.assign(a,{titleAr:fd.get('titleAr'),titleEn:fd.get('titleEn'),subtitleAr:fd.get('subtitleAr'),subtitleEn:fd.get('subtitleEn'),image:mediaUrl,mediaType,sort:+fd.get('sort'),visible:fd.has('visible')});
   if(!id)db.ads.push(a);saveStore(db);await window.ibraqCloud.saveSiteConfig({settings:db.settings,categories:db.categories,ads:db.ads});renderAds();toast('تم الحفظ')
 });
 setTimeout(()=>{
   const input=$('#adMediaFile'),preview=$('#adMediaPreview'),flag=$('#removeMediaFlag'),remove=$('#removeAdMedia');
   const clear=()=>{if(input)input.value='';if(flag)flag.value='1';if(preview){preview.innerHTML='';preview.classList.remove('show')}};
   if(remove)remove.onclick=clear;
   if(input)input.onchange=()=>{const f=input.files?.[0];if(!f)return;flag.value='0';const url=URL.createObjectURL(f);preview.innerHTML=(f.type.startsWith('video/')?`<video src="${url}" controls muted playsinline></video>`:`<img src="${url}" alt="">`)+`<div class="media-name">${esc(f.name)}</div><button type="button" class="remove-media" id="removeNewAdMedia">إزالة الملف</button>`;preview.classList.add('show');$('#removeNewAdMedia').onclick=clear};
 },0)
}
$('#addProduct').onclick=()=>openProduct();$('#addCategory').onclick=()=>openCategory();$('#addAd').onclick=()=>openAd();
$('#exportBtn').onclick=()=>{const blob=new Blob([JSON.stringify(db,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='beautyofjoseon-settings-backup.json';a.click();URL.revokeObjectURL(a.href)};
$('#importInput').onchange=e=>{const r=new FileReader();r.onload=()=>{try{const d=JSON.parse(r.result);db.settings=d.settings||db.settings;db.categories=d.categories||db.categories;db.ads=d.ads||db.ads;saveStore(db);location.reload()}catch{alert('ملف غير صالح')}};if(e.target.files[0])r.readAsText(e.target.files[0])};
$('#resetBtn').onclick=()=>{if(confirm('استعادة إعدادات الموقع الافتراضية؟')){localStorage.removeItem(STORE_KEY);location.reload()}};
function fillHomepage(){const f=$('#homepageForm');if(!f)return;const st=db.settings;['showLanguages','showHeader','showWhatsAppTop','showSearch','showCategories','showCart','showAds','showAbout'].forEach(k=>{if(f.elements[k])f.elements[k].checked=st[k]!==false});['offersTitleAr','offersTitleEn','productsTitleAr','productsTitleEn','aboutTitleAr','aboutTitleEn','searchPlaceholderAr','searchPlaceholderEn','whatsappLabelAr','whatsappLabelEn','fontFamily','pageWidth','cardRadius','productColumnsDesktop','productColumnsMobile','heroNameSize','taglineSize','sectionTitleSize','productNameSize','adHeight','sectionGap','backgroundImage','backgroundFit'].forEach(k=>{if(f.elements[k])f.elements[k].value=st[k]??''});const order=st.sectionOrder||['ads','products','about'];[1,2,3].forEach((n,i)=>{if(f.elements['section'+n])f.elements['section'+n].value=order[i]})}
function readHomepage(){const f=$('#homepageForm'),st=db.settings;['showLanguages','showHeader','showWhatsAppTop','showSearch','showCategories','showCart','showAds','showAbout'].forEach(k=>st[k]=f.elements[k].checked);['offersTitleAr','offersTitleEn','productsTitleAr','productsTitleEn','aboutTitleAr','aboutTitleEn','searchPlaceholderAr','searchPlaceholderEn','whatsappLabelAr','whatsappLabelEn','fontFamily','backgroundImage','backgroundFit'].forEach(k=>st[k]=f.elements[k].value);['pageWidth','cardRadius','productColumnsDesktop','productColumnsMobile','heroNameSize','taglineSize','sectionTitleSize','productNameSize','adHeight','sectionGap'].forEach(k=>st[k]=+f.elements[k].value||defaultStore.settings[k]);st.sectionOrder=[...new Set([f.section1.value,f.section2.value,f.section3.value,'ads','products','about'])].slice(0,3)}
function refreshPreview(){const fr=$('#homepagePreview');if(fr)fr.src='index.html?preview='+Date.now()}
$('#saveHomepage').onclick=async()=>{readHomepage();saveStore(db);await window.ibraqCloud.saveSiteConfig({settings:db.settings,categories:db.categories,ads:db.ads});refreshPreview();toast('تم حفظ الصفحة')};$('#refreshPreview').onclick=refreshPreview;
const hpUpload=$('#homepageBgUpload');hpUpload.onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{$('#homepageForm').backgroundImage.value=r.result;readHomepage();saveStore(db);refreshPreview()};r.readAsDataURL(f)};
