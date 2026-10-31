/**
 * Browser-facing API routes.
 *
 * In production, Vercel proxies these same-origin paths to the Render
 * services. In local development, Vite proxies them using VITE_*_SERVICE_URL.
 * Keep service URL configuration out of browser bundles.
 */
const proxyBase = (service: string, path: string) =>
  `/api/proxy/${service}${path.startsWith("/") ? path : `/${path}`}`;

export const AUTH_API_URL = proxyBase("auth", "/api/v1/auth");
export const PRODUCT_API_URL = proxyBase("product", "/api/v1/products");
export const CART_API_URL = proxyBase("cart", "/api/v1/cart");
export const WISHLIST_API_URL = proxyBase("cart", "/api/v1/wishlist");
export const ORDER_API_URL = proxyBase("order", "/api/v1/orders");
export const PAYMENT_API_URL = proxyBase("order", "/api/v1/payments");
export const UTILS_API_URL = proxyBase("utils", "/api/v1");
export const MEDIA_API_URL = proxyBase("utils", "/api/v1/media");
