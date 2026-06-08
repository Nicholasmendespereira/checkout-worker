export default {
  async fetch(request, env) {

    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    const url = new URL(request.url);

    // ── Rotas KV — ficam ANTES de qualquer validação ──────────────────────
    if (url.pathname === "/api/gifts" && request.method === "GET") {
      const id = url.searchParams.get("id");
      const data = await env.WEDDING_GIFTS.get(`gift:${id}`, "json");
      return Response.json(
        data ?? { contributed: 0, total: 0 },
        { headers: corsHeaders }
      );
    }

    if (url.pathname === "/api/gifts/contribute" && request.method === "POST") {
      const body = await request.json();
      const { id, amount, total, buyerName } = body;

      if (!Number.isFinite(id) || id <= 0 ||
          !Number.isFinite(amount) || amount <= 0 ||
          !Number.isFinite(total) || total <= 0) {
        return Response.json({ error: "Invalid numeric fields" }, { status: 400, headers: corsHeaders });
      }

      const current = await env.WEDDING_GIFTS.get(`gift:${id}`, "json") ?? { contributed: 0 };
      const updated = { contributed: current.contributed + amount, total };
      await env.WEDDING_GIFTS.put(`gift:${id}`, JSON.stringify(updated));

      // Persist buyerName independently — contribution must not fail if this fails
      if (typeof buyerName === "string") {
        const trimmed = buyerName.trim().replace(/\s+/g, " ").slice(0, 40);
        if (trimmed.length > 0) {
          try {
            const stored = await env.WEDDING_GIFTS.get("contributors:names", "json") ?? { names: [] };
            const lower = trimmed.toLowerCase();
            const filtered = stored.names.filter(n => n.toLowerCase() !== lower);
            const names = [trimmed, ...filtered].slice(0, 200);
            await env.WEDDING_GIFTS.put("contributors:names", JSON.stringify({ names }));
          } catch (_) {
            // silently ignore — contribution already saved above
          }
        }
      }

      return Response.json(updated, { headers: corsHeaders });
    }

    if (url.pathname === "/api/contributors" && request.method === "GET") {
      const stored = await env.WEDDING_GIFTS.get("contributors:names", "json") ?? { names: [] };
      return Response.json({ names: stored.names ?? [] }, { headers: corsHeaders });
    }

    // ── Rota Asaas — validação de origin só aqui ──────────────────────────
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

      const response = await fetch("https://api.asaas.com/v3/checkouts", {
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