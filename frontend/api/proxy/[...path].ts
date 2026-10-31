import http from "node:http";
import https from "node:https";
import type { IncomingMessage, ServerResponse } from "node:http";

const SERVICE_ENV: Record<string, string> = {
  auth: "AUTH_SERVICE_URL",
  product: "PRODUCT_SERVICE_URL",
  cart: "CART_SERVICE_URL",
  order: "ORDER_SERVICE_URL",
  utils: "UTILS_SERVICE_URL",
};

export const config = {
  api: { bodyParser: false },
};

export default function handler(
  req: IncomingMessage,
  res: ServerResponse,
): void {
  const requestUrl = new URL(req.url || "/", "http://vercel.local");
  const segments = requestUrl.pathname.split("/").filter(Boolean);

  // Expected browser route: /api/proxy/{service}/api/v1/...
  if (segments.length < 3 || segments[0] !== "api" || segments[1] !== "proxy") {
    res.writeHead(404, { "content-type": "application/json" });
    res.end(JSON.stringify({ success: false, message: "Unknown API route" }));
    return;
  }

  const method = (req.method || "GET").toUpperCase();
  if (!["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"].includes(method)) {
    res.writeHead(405, { "content-type": "application/json", allow: "GET, HEAD, POST, PUT, PATCH, DELETE, OPTIONS" });
    res.end(JSON.stringify({ success: false, message: "Method not allowed" }));
    return;
  }

  const service = segments[2];
  const envName = SERVICE_ENV[service];
  const serviceOrigin = envName ? process.env[envName] : undefined;

  if (!envName || !serviceOrigin) {
    res.writeHead(503, { "content-type": "application/json" });
    res.end(JSON.stringify({
      success: false,
      message: `API service is not configured (${service || "unknown"})`,
    }));
    return;
  }

  let upstreamUrl: URL;
  try {
    const base = new URL(serviceOrigin);
    if (base.protocol !== "https:" && base.protocol !== "http:") {
      throw new Error("Unsupported upstream protocol");
    }
    const upstreamPath = `/${segments.slice(3).join("/")}`;
    upstreamUrl = new URL(`${upstreamPath}${requestUrl.search}`, base);
  } catch {
    res.writeHead(500, { "content-type": "application/json" });
    res.end(JSON.stringify({ success: false, message: `Invalid ${envName} URL` }));
    return;
  }

  const headers: http.OutgoingHttpHeaders = { ...req.headers };
  delete headers.host;
  delete headers.connection;
  delete headers["content-length"];
  headers.host = upstreamUrl.host;
  headers["x-forwarded-host"] = req.headers.host;
  headers["x-forwarded-proto"] = "https";

  const transport = upstreamUrl.protocol === "https:" ? https : http;
  const upstreamRequest = transport.request(
    upstreamUrl,
    {
      method,
      headers,
      timeout: 55_000,
    },
    (upstreamResponse) => {
      const responseHeaders = { ...upstreamResponse.headers };
      delete responseHeaders.connection;
      res.writeHead(upstreamResponse.statusCode || 502, responseHeaders);
      upstreamResponse.pipe(res);
    },
  );

  upstreamRequest.on("timeout", () => {
    upstreamRequest.destroy(new Error("Upstream request timed out"));
  });

  upstreamRequest.on("error", (error) => {
    if (!res.headersSent) {
      res.writeHead(502, { "content-type": "application/json" });
    }
    if (!res.writableEnded) {
      res.end(JSON.stringify({
        success: false,
        message: "The API service is temporarily unavailable",
      }));
    }
    console.error(`[API proxy:${service}]`, error.message);
  });

  req.on("aborted", () => upstreamRequest.destroy());
  req.pipe(upstreamRequest);
}
