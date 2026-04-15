# Sam-Landshaft Frontend — Cloudflare Pages Deploy

Frontend Cloudflare Pages'da hosting qilinadi. Ikki domen:
- `sam-landshaft.uz` — Public xarita portali
- `admin.sam-landshaft.uz` — Admin panel (bir xil build)

Har ikkalasi **bitta Cloudflare Pages loyihasi**ga ulanadi. React Router subdomen/path'ga qarab mos sahifani ko'rsatadi.

## Birinchi marta deploy

### 1. Git repo tayyorlash

```bash
cd sam-landshaft-frontend
git remote add origin https://github.com/YOU/sam-landshaft-frontend.git
git push -u origin main
```

### 2. Cloudflare Pages loyiha yaratish

1. Cloudflare Dashboard → **Workers & Pages** → **Create application** → **Pages** → **Connect to Git**
2. GitHub repo'ni tanlang
3. Build sozlamalari:
   - **Framework preset**: Vite
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Root directory**: (bo'sh)
   - **Node version**: 22

### 3. Environment variables

Pages loyiha → **Settings** → **Environment variables**:

```
VITE_API_URL = https://api.sam-landshaft.uz/api
```

Production va Preview uchun alohida qo'yish mumkin.

### 4. Custom domen

Pages loyiha → **Custom domains** → **Set up a custom domain**:

1. Asosiy domen: `sam-landshaft.uz` → Cloudflare DNS record avtomatik qo'shiladi
2. Admin subdomeni: `admin.sam-landshaft.uz` → xuddi shu Pages loyiha'ga ulanadi

Brauzer `admin.sam-landshaft.uz`'ga kirganda, React Router `/admin/login` va `/admin/*` routelarini ko'rsatadi. Buning uchun quyidagi fayl mavjud: `public/_redirects`.

### 5. Redirect — admin subdomen uchun

Agar foydalanuvchi `admin.sam-landshaft.uz` ga kirsa, avtomatik `/admin`ga yo'naltirish mumkin. Cloudflare **Page Rules** yoki **Redirect Rules** orqali:

```
When hostname = admin.sam-landshaft.uz AND path = /
Redirect: /admin/login (302)
```

Yoki SPA ichida `useLocation` hook orqali subdomenga qarab routing qilish:

```tsx
// App.tsx ichida
if (window.location.hostname.startsWith('admin.')) {
  return <AdminRouter />;
}
return <PublicRouter />;
```

## Keyingi deploylar

Git'ga push qilish yetarli — Cloudflare Pages avtomatik build qiladi.

```bash
git push origin main
```

Har bir PR uchun **Preview URL** avtomatik yaratiladi.

## Local development

```bash
npm install
cp .env.example .env
npm run dev
```

API'ga ulanish uchun `.env`:
```
VITE_API_URL=http://localhost:3000/api          # lokal backend
# yoki
VITE_API_URL=https://api.sam-landshaft.uz/api   # VPS backend
```

## SEO va Security

`public/_headers` faylda:
- `X-Frame-Options: DENY` — clickjacking
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy`
- Static assetlar uchun cache

`public/_redirects` — SPA fallback (barcha route'lar `index.html` ga).
