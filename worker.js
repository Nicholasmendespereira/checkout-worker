export default {
  async fetch(request, env) {

    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    };

    // Preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    const url = new URL(request.url);

    // ── Rotas do KV (sem verificação de origin, são internas) ──────────────
    if (url.pathname === "/api/gifts" && request.method === "GET") {
      const id = url.searchParams.get("id");
      const data = await env.WEDDING_GIFTS.get(`gift:${id}`, "json");
      return Response.json(data ?? { contributed: 0, total: 0 }, { headers: corsHeaders });
    }

    if (url.pathname === "/api/gifts/contribute" && request.method === "POST") {
      const { id, amount, total } = await request.json();
      const current = await env.WEDDING_GIFTS.get(`gift:${id}`, "json") ?? { contributed: 0 };
      const updated = { contributed: current.contributed + amount, total };
      await env.WEDDING_GIFTS.put(`gift:${id}`, JSON.stringify(updated));
      return Response.json(updated, { headers: corsHeaders });
    }

    // ── Rota do Asaas (com verificação de origin) ──────────────────────────
    try {
      const allowedOrigin = "https://landingpage-wedding.pages.dev";
      const allowedReferer = "https://landingpage-wedding.pages.dev/";
      const origin = request.headers.get("Origin");
      const referer = request.headers.get("Referer");

      if (!origin || !origin.startsWith(allowedOrigin)) {
        return new Response("Forbidden", { status: 403 });
      }

      if (!referer || !referer.startsWith(allowedReferer)) {
        return new Response("Forbidden", { status: 403 });
      }

      const body = await request.json();

      const response = await fetch("https://api-sandbox.asaas.com/v3/checkouts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "access_token": env.ASAAS_TOKEN,
          "User-Agent": "cloudflare-worker"
        },
        body: JSON.stringify(body)
      });

      const data = await response.text();

      return new Response(data, {
        status: response.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });

    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
  }
};