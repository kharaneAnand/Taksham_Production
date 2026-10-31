import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const serviceProxy = (target: string | undefined, prefix: string) =>
  target
    ? {
        target,
        changeOrigin: true,
        secure: true,
        rewrite: (path: string) => path.replace(prefix, ''),
      }
    : undefined;

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const proxy: Record<string, object> = {};

  const services = [
    ['auth', env.VITE_AUTH_SERVICE_URL],
    ['product', env.VITE_PRODUCT_SERVICE_URL],
    ['cart', env.VITE_CART_SERVICE_URL],
    ['order', env.VITE_ORDER_SERVICE_URL],
    ['utils', env.VITE_UTILS_SERVICE_URL],
  ] as const;

  for (const [name, target] of services) {
    const prefix = `/api/proxy/${name}`;
    const config = serviceProxy(target, prefix);
    if (config) proxy[prefix] = config;
  }

  return {
    plugins: [react(), tailwindcss()],
    server: { proxy },
  };
});
