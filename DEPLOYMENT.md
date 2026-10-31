# Taksham production deployment

Production website domain: **https://taksham.co.in**

The storefront now calls same-origin routes under `/api/proxy/*`. Vercel forwards these requests to the existing Render services. This keeps service hostnames out of the browser bundle, avoids browser-to-Render cross-origin cookie issues, and preserves the current five-service backend structure.

## 1. Vercel project

- Import the repository into Vercel.
- Set **Root Directory** to `frontend`.
- Framework preset: Vite.
- Install command: `npm ci`.
- Build command: `npm run build`.
- Output directory: `dist`.
- Add both `taksham.co.in` and `www.taksham.co.in` under Project → Settings → Domains. Make `taksham.co.in` the primary domain and configure Vercel's suggested DNS records at the domain registrar.
- Add the five environment variables below to **Production, Preview, and Development** as appropriate. Values must be the Render service's origin only: `https://service-name.onrender.com` (no trailing slash and no `/api/v1/...` suffix).

| Vercel variable | Value |
|---|---|
| `AUTH_SERVICE_URL` | Auth Render origin |
| `PRODUCT_SERVICE_URL` | Product Render origin |
| `CART_SERVICE_URL` | Cart Render origin |
| `ORDER_SERVICE_URL` | Order Render origin |
| `UTILS_SERVICE_URL` | Utils Render origin |

Do not add `VITE_` to these five Vercel production variables. They are read only by the server-side proxy function.

## 2. Render services

Keep the existing five Render services and their existing root directories / start commands. For every service:

- Set `NODE_ENV=production`.
- Set `CLIENT_URL=https://taksham.co.in`.
- Ensure Render's automatically provided `PORT` is not overridden with a conflicting hard-coded port.
- Set the service's existing secrets and service-to-service URLs from the service's current environment configuration. Do not paste secrets into source control.
- Set the Render health check path to `/health`.

Health checks now exist at `/health` on all five services.

### Service-specific existing environment requirements

**Auth**: `MONGODB_URI`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `JWT_ACCESS_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN`, `MEDIA_SERVICE_URL`, `EMAIL_USER`, `EMAIL_PASSWORD`, `INTERNAL_SERVICE_SECRET`, `COOKIE_SAME_SITE`.

**Product**: `MONGODB_URI`, `AUTH_SERVICE_URL`, `INTERNAL_SERVICE_SECRET`.

**Cart**: `MONGODB_URI`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `JWT_ACCESS_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN`, `PRODUCT_SERVICE_URL`.

**Order**: `MONGODB_URI`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `CLIENT_URL`, `CART_SERVICE_URL`, `AUTH_SERVICE_URL`, `PRODUCT_SERVICE_URL`, `UTILS_SERVICE_URL`, `EMAIL_USER`, `EMAIL_PASSWORD`, `INTERNAL_SERVICE_SECRET`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`.

**Utils**: `MONGODB_URI`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.

Use these exact path formats for the existing Render-to-Render calls (replace each host with the corresponding Render origin):

| Render service | Variable | Expected value |
|---|---|---|
| Auth | `MEDIA_SERVICE_URL` | Utils origin + `/api/v1/media` |
| Product | `AUTH_SERVICE_URL` | Auth origin only |
| Cart | `PRODUCT_SERVICE_URL` | Product origin + `/api/v1/products` |
| Order | `CART_SERVICE_URL` | Cart origin + `/api/v1/cart` |
| Order | `AUTH_SERVICE_URL` | Auth origin + `/api/v1` |
| Order | `PRODUCT_SERVICE_URL` | Product origin + `/api/v1/products` |
| Order | `UTILS_SERVICE_URL` | Utils origin + `/api/v1` |

These Render-to-Render values are intentionally different from the five Vercel variables above, which must be service origins only.

For production auth cookies set `COOKIE_SAME_SITE=strict`. Cookies are HTTP-only and secure in production. Since the browser and API now share the same site origin, cross-site `SameSite=None` cookies are not required.

## 3. Local development

Copy `frontend/.env.example` to `frontend/.env.local` and replace the five placeholder origins with your Render service origins. For local development only, set `CLIENT_URL=http://localhost:5173` in each local backend environment. Vite proxies `/api/proxy/{service}` to the matching Render service.

## 4. Deploy order

1. Deploy the backend services first and wait until all five `/health` checks return HTTP 200.
2. Configure the five Vercel server-side service-origin variables.
3. Deploy the frontend from the `frontend` root directory.
4. Verify `https://taksham.co.in` and `https://www.taksham.co.in`; set the apex domain as primary.
5. Verify the proxy before testing customer flows: `/api/proxy/auth/`, `/api/proxy/product/`, `/api/proxy/cart/health`, `/api/proxy/order/health`, `/api/proxy/utils/health`. The auth and product root paths return their service status; the cart/order/utils health paths return health JSON.

## 5. Launch acceptance checklist

- [ ] Home page and all deep links load on refresh.
- [ ] Product, category, collection and settings reads work.
- [ ] Register, email verification, login, refresh and logout work.
- [ ] HTTP-only access/refresh cookies are set and sent on subsequent requests.
- [ ] Cart and wishlist add/update/remove work.
- [ ] Admin customers, orders, offers, coupons, media uploads and notifications work.
- [ ] Razorpay test-mode order creation, signature verification, payment failure and retry work.
- [ ] Production Razorpay credentials are enabled only after test-mode verification.
- [ ] Check mobile, desktop, image loading, and checkout on a real phone/network.
- [ ] Configure MongoDB backups and alerting; check Render logs and Vercel function logs.

Never commit `.env`, `.env.local`, production credentials, Razorpay secrets, JWT secrets, or MongoDB connection strings.
