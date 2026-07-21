IBRAQ + SUPABASE — FINAL SETUP

1) Open setup-supabase.sql, copy all of it, paste it in Supabase SQL Editor, and press Run.

2) In Supabase: Settings > API Keys > copy the Publishable key.
   Open supabase-config.js and replace:
   PASTE_YOUR_PUBLISHABLE_KEY_HERE
   with your complete Publishable key.
   Never put the Secret key in the website.

3) Create the admin account:
   Supabase > Authentication > Users > Add user > Create new user.
   Enter your email and a strong password. Use this email/password on admin.html.

4) Confirm Storage bucket exists:
   product-images (Public)

5) Upload all files to the root of your GitHub repository. Do not upload the ZIP itself.

Notes:
- Products, product images, and orders are stored in Supabase.
- Cart and visual homepage settings remain in the customer's/admin's browser.
- The maximum quantity is 100 per perfume, and also cannot exceed stock.
- admin.html uses Supabase Authentication, not the old admin/admin123 login.
