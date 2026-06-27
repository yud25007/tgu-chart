const HOP_BY_HOP_HEADERS = [
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade"
];

function stripHopByHop(headers) {
  const next = new Headers(headers);
  for (const name of HOP_BY_HOP_HEADERS) {
    next.delete(name);
  }
  return next;
}

function buildUpstreamRequest(request) {
  const incomingUrl = new URL(request.url);
  const upstreamUrl = new URL(request.url);
  upstreamUrl.protocol = "http:";
  upstreamUrl.hostname = "tgu-chart";
  upstreamUrl.port = "8080";

  const headers = stripHopByHop(request.headers);
  headers.set("Host", "tgu-chart");
  headers.set("X-Forwarded-Host", incomingUrl.host);
  headers.set("X-Forwarded-Proto", incomingUrl.protocol.replace(":", ""));

  const clientIp = request.headers.get("CF-Connecting-IP");
  if (clientIp) {
    headers.set("X-Real-IP", clientIp);
  }

  return new Request(upstreamUrl.toString(), {
    method: request.method,
    headers,
    body: request.method === "GET" || request.method === "HEAD" ? undefined : request.body,
    redirect: "manual"
  });
}

function rewriteResponse(response, publicHost) {
  const headers = stripHopByHop(response.headers);
  const location = headers.get("Location");

  if (location) {
    try {
      const next = new URL(location);
      if (next.hostname === "tgu-chart") {
        next.protocol = "https:";
        next.host = publicHost;
        headers.set("Location", next.toString());
      }
    } catch {
      // Relative redirects are already correct for the public host.
    }
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

export default {
  async fetch(request, env) {
    const publicHost = new URL(request.url).host;
    const upstreamRequest = buildUpstreamRequest(request);
    const upstreamResponse = await env.TGU_CHART.fetch(upstreamRequest);
    return rewriteResponse(upstreamResponse, publicHost);
  }
};
