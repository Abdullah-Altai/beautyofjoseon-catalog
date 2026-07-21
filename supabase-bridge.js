(function(){
  const cfg=window.IBRAQ_SUPABASE||{};
  const ready=cfg.url&&cfg.publishableKey&&cfg.publishableKey!=="PASTE_YOUR_PUBLISHABLE_KEY_HERE"&&window.supabase;
  window.ibraqCloud={ready:false,client:null,error:null};
  if(!ready){window.ibraqCloud.error="Supabase publishable key is not configured";return;}
  const client=window.supabase.createClient(cfg.url,cfg.publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
  const mapProduct=r=>({id:r.id,nameAr:r.name_ar||"",nameEn:r.name_en||"",descAr:r.description_ar||"",descEn:r.description_en||"",category:r.category||"all",price:Number(r.price)||0,stock:Number(r.stock)||0,badgeAr:r.badge_ar||"",badgeEn:r.badge_en||"",visible:r.visible!==false,featured:!!r.featured,sort:Number(r.sort_order)||0,images:Array.isArray(r.images)?r.images:[]});
  const unmapProduct=p=>({name_ar:String(p.nameAr||"").trim(),name_en:String(p.nameEn||"").trim(),description_ar:String(p.descAr||"").trim(),description_en:String(p.descEn||"").trim(),category:p.category||"all",price:Math.max(0,Number(p.price)||0),stock:Math.max(0,Math.floor(Number(p.stock)||0)),badge_ar:String(p.badgeAr||"").trim(),badge_en:String(p.badgeEn||"").trim(),visible:p.visible!==false,featured:!!p.featured,sort_order:Math.floor(Number(p.sort)||0),images:Array.isArray(p.images)?p.images.filter(Boolean).slice(0,10):[],updated_at:new Date().toISOString()});
  const storagePrefix=`${cfg.url}/storage/v1/object/public/${cfg.bucket}/`;
  function storagePath(url){try{return decodeURIComponent(String(url).startsWith(storagePrefix)?String(url).slice(storagePrefix.length):"")}catch{return ""}}
  async function compressImage(file){
    if(!file?.type?.startsWith('image/')||file.size<=700000)return file;
    const bitmap=await createImageBitmap(file);
    const max=1800,scale=Math.min(1,max/Math.max(bitmap.width,bitmap.height));
    const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));
    canvas.getContext('2d',{alpha:false}).drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close?.();
    const blob=await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('Image compression failed')),'image/webp',.84));
    return new File([blob],(file.name.replace(/\.[^.]+$/,'')||'image')+'.webp',{type:'image/webp'});
  }
  window.ibraqCloud={
    ready:true,client,
    async getProducts(){const {data,error}=await client.from('products').select('*').order('sort_order',{ascending:true});if(error)throw error;return (data||[]).map(mapProduct)},
    async saveProduct(p){const row=unmapProduct(p);if(!row.name_ar)throw new Error('اسم المنتج بالعربي مطلوب');if(!row.images.length)throw new Error('أضف صورة واحدة على الأقل');const q=p.id?client.from('products').update(row).eq('id',p.id).select().single():client.from('products').insert(row).select().single();const {data,error}=await q;if(error)throw error;return mapProduct(data)},
    async deleteProduct(id,images=[]){const {error}=await client.from('products').delete().eq('id',id);if(error)throw error;const paths=(images||[]).map(storagePath).filter(Boolean);if(paths.length)await client.storage.from(cfg.bucket).remove(paths)},
    async uploadImages(files){const urls=[];for(const original of files){if(!original?.size||!original.type.startsWith('image/'))continue;if(original.size>12*1024*1024)throw new Error('حجم الصورة كبير جداً');const file=await compressImage(original);const path=`products/${new Date().toISOString().slice(0,10)}/${crypto.randomUUID()}.webp`;const {error}=await client.storage.from(cfg.bucket).upload(path,file,{cacheControl:'31536000',contentType:file.type,upsert:false});if(error)throw error;const {data}=client.storage.from(cfg.bucket).getPublicUrl(path);urls.push(data.publicUrl)}return urls},
    async uploadAdMedia(original){
      if(!original?.size)throw new Error('اختر صورة أو فيديو');
      const isImage=original.type.startsWith('image/');
      const isVideo=original.type.startsWith('video/');
      if(!isImage&&!isVideo)throw new Error('الملف يجب أن يكون صورة أو فيديو');
      if(isImage&&original.size>8*1024*1024)throw new Error('حجم الصورة يجب ألا يتجاوز 8 MB');
      if(isVideo&&original.size>50*1024*1024)throw new Error('حجم الفيديو يجب ألا يتجاوز 50 MB');
      let file=original,ext=(original.name.split('.').pop()||'bin').toLowerCase();
      if(isImage){file=await compressImage(original);ext='webp'}
      const path=`ads/${new Date().toISOString().slice(0,10)}/${crypto.randomUUID()}.${ext}`;
      const {error}=await client.storage.from(cfg.bucket).upload(path,file,{cacheControl:'31536000',contentType:file.type,upsert:false});
      if(error)throw error;
      const {data}=client.storage.from(cfg.bucket).getPublicUrl(path);
      return {url:data.publicUrl,type:isVideo?'video':'image',path};
    },
    async createOrder(order){const payload={...order,customer_name:String(order.customer_name||'').trim().slice(0,120),customer_phone:String(order.customer_phone||'').trim().slice(0,40),customer_address:String(order.customer_address||'').trim().slice(0,300),notes:String(order.notes||'').trim().slice(0,500)};const {error}=await client.from('orders').insert(payload);if(error)throw error;return true},
    async getOrders(){const {data,error}=await client.from('orders').select('*').order('created_at',{ascending:false}).limit(1000);if(error)throw error;return data||[]},
    async updateOrder(id,patch){const {error}=await client.from('orders').update(patch).eq('id',id);if(error)throw error},
    async deleteOrder(id){const {error}=await client.from('orders').delete().eq('id',id);if(error)throw error},
    async getSiteConfig(){const {data,error}=await client.from('site_config').select('config').eq('id',1).maybeSingle();if(error)throw error;return data?.config||null},
    async saveSiteConfig(config){const {error}=await client.from('site_config').upsert({id:1,config,updated_at:new Date().toISOString()});if(error)throw error},
    async signIn(email,password){const {data,error}=await client.auth.signInWithPassword({email,password});if(error)throw error;return data},
    async signOut(){await client.auth.signOut()},
    async session(){const {data}=await client.auth.getSession();return data.session}
  };
})();
