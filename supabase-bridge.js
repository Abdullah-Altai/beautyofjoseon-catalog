(function () {
  const config = window.ALTAI_SUPABASE || {};
  const configured = Boolean(
    config.url &&
    config.publishableKey &&
    config.url !== "PASTE_YOUR_SUPABASE_URL_HERE" &&
    config.publishableKey !== "PASTE_YOUR_PUBLISHABLE_KEY_HERE" &&
    window.supabase
  );

  window.catalogCloud = {
    ready: false,
    client: null,
    adminEmail: config.adminEmail || "Altai0193@gmail.com",
    error: configured ? null : "Supabase is not configured"
  };
  if (!configured) return;

  const client = window.supabase.createClient(config.url, config.publishableKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });

  const mapProduct = row => ({
    id: row.id,
    nameAr: row.name_ar || "",
    nameEn: row.name_en || "",
    descAr: row.description_ar || "",
    descEn: row.description_en || "",
    code: row.code || "",
    category: row.category || "all",
    price: Number(row.price) || 0,
    stock: Number(row.stock) || 0,
    badgeAr: row.badge_ar || "",
    badgeEn: row.badge_en || "",
    visible: row.visible !== false,
    featured: Boolean(row.featured),
    sort: Number(row.sort_order) || 0,
    images: Array.isArray(row.images) ? row.images : []
  });

  const unmapProduct = product => ({
    name_ar: String(product.nameAr || "").trim(),
    name_en: String(product.nameEn || "").trim(),
    description_ar: String(product.descAr || "").trim(),
    description_en: String(product.descEn || "").trim(),
    code: String(product.code || "").trim(),
    category: String(product.category || "all"),
    price: Math.max(0, Number(product.price) || 0),
    stock: Math.max(0, Math.floor(Number(product.stock) || 0)),
    badge_ar: String(product.badgeAr || "").trim(),
    badge_en: String(product.badgeEn || "").trim(),
    visible: product.visible !== false,
    featured: Boolean(product.featured),
    sort_order: Math.floor(Number(product.sort) || 0),
    images: Array.isArray(product.images) ? product.images.filter(Boolean).slice(0, 10) : [],
    updated_at: new Date().toISOString()
  });

  const publicPrefix = `${config.url}/storage/v1/object/public/${config.bucket}/`;
  function storagePath(url) {
    try {
      const value = String(url || "");
      return value.startsWith(publicPrefix) ? decodeURIComponent(value.slice(publicPrefix.length)) : "";
    } catch {
      return "";
    }
  }

  async function compressImage(original) {
    if (!original?.type?.startsWith("image/") || original.size <= 700000) return original;
    const bitmap = await createImageBitmap(original);
    const limit = 1800;
    const scale = Math.min(1, limit / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    canvas.getContext("2d", { alpha: false }).drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close?.();
    const blob = await new Promise((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error("تعذر ضغط الصورة")), "image/webp", .86));
    return new File([blob], `${(original.name.replace(/\.[^.]+$/, "") || "image")}.webp`, { type: "image/webp" });
  }

  async function uploadFile(original, folder, allowVideo = false) {
    if (!original?.size) throw new Error("اختر ملفاً أولاً");
    const image = original.type.startsWith("image/");
    const video = original.type.startsWith("video/");
    if (!image && !(allowVideo && video)) throw new Error(allowVideo ? "اختر صورة أو فيديو" : "اختر صورة");
    if (image && original.size > 12 * 1024 * 1024) throw new Error("حجم الصورة يجب ألا يتجاوز 12 MB");
    if (video && original.size > 60 * 1024 * 1024) throw new Error("حجم الفيديو يجب ألا يتجاوز 60 MB");
    const file = image ? await compressImage(original) : original;
    const extension = image ? "webp" : (original.name.split(".").pop() || "mp4").toLowerCase();
    const path = `${folder}/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${extension}`;
    const { error } = await client.storage.from(config.bucket).upload(path, file, {
      cacheControl: "31536000",
      contentType: file.type,
      upsert: false
    });
    if (error) throw error;
    const { data } = client.storage.from(config.bucket).getPublicUrl(path);
    return { url: data.publicUrl, type: video ? "video" : "image", path };
  }

  window.catalogCloud = {
    ready: true,
    client,
    adminEmail: config.adminEmail || "Altai0193@gmail.com",

    async getProducts() {
      const { data, error } = await client.from("products").select("*").order("sort_order", { ascending: true });
      if (error) throw error;
      return (data || []).map(mapProduct);
    },

    async saveProduct(product) {
      const row = unmapProduct(product);
      if (!row.name_ar) throw new Error("اسم المنتج بالعربي مطلوب");
      if (!row.images.length) throw new Error("أضف صورة واحدة على الأقل");
      const query = product.id
        ? client.from("products").update(row).eq("id", product.id).select().single()
        : client.from("products").insert(row).select().single();
      const { data, error } = await query;
      if (error) throw error;
      return mapProduct(data);
    },

    async deleteProduct(product) {
      const { error } = await client.from("products").delete().eq("id", product.id);
      if (error) throw error;
      const paths = (product.images || []).map(storagePath).filter(Boolean);
      if (paths.length) await client.storage.from(config.bucket).remove(paths);
    },

    async uploadProductImages(files) {
      const urls = [];
      for (const file of files.slice(0, 10)) urls.push((await uploadFile(file, "products")).url);
      return urls;
    },

    async uploadAsset(file, folder = "site") {
      return (await uploadFile(file, folder)).url;
    },

    async uploadAdMedia(file) {
      return uploadFile(file, "ads", true);
    },

    async getSiteConfig() {
      const { data, error } = await client.from("site_config").select("config").eq("id", 1).maybeSingle();
      if (error) throw error;
      return data?.config || null;
    },

    async saveSiteConfig(configValue) {
      const { error } = await client.from("site_config").upsert({ id: 1, config: configValue, updated_at: new Date().toISOString() });
      if (error) throw error;
    },

    async signIn(email, password) {
      const { data, error } = await client.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return data;
    },

    async signOut() {
      await client.auth.signOut();
    },

    async session() {
      const { data } = await client.auth.getSession();
      return data.session;
    }
  };
})();
