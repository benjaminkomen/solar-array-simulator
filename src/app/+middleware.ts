import type { MiddlewareFunction, MiddlewareSettings } from "expo-server";

export const unstable_settings: MiddlewareSettings = {
  matcher: {
    patterns: ["/api/[...path]"],
  },
};

const middleware: MiddlewareFunction = (request) => {
  const url = new URL(request.url);
  const method = request.method;
  const timestamp = new Date().toISOString();

  console.log(`[Middleware] ${timestamp} ${method} ${url.pathname}`);

  // Only allow requests to /api/analyze — block all other API routes
  if (url.pathname !== "/api/analyze") {
    console.log(`[Middleware] Blocked: ${url.pathname} (not an allowed route)`);
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  // Verify API token
  const expectedToken = process.env.API_TOKEN;
  const token = request.headers.get("X-API-Token");

  if (!expectedToken || token !== expectedToken) {
    console.log(`[Middleware] Unauthorized request to ${url.pathname}`);
    return Response.json({ error: "Unauthorized" }, { status: 403 });
  }

  console.log(`[Middleware] Authorized request to ${url.pathname}`);
  // Return nothing — request continues to the route handler
};

export default middleware;
