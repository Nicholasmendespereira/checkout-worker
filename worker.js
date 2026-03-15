export default {
  async fetch(request, env) {

    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    };
    
    // Preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders
      });
    }
    
    try {

      const allowedOrigin = "https://landingpage-wedding.pages.dev"
      const allowedReferer = "https://landingpage-wedding.pages.dev/"
      const origin = request.headers.get("Origin")
      const referer = request.headers.get("Referer")

      if (!origin || !origin.startsWith(allowedOrigin)) {
        return new Response("Forbidden", { status: 403 })
      }

      if (!referer || !referer.startsWith(allowedReferer)) {
        return new Response("Forbidden", { status: 403 })
      }

      const body = await request.json();

      const response = await fetch(
        "https://api-sandbox.asaas.com/v3/checkouts",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "access_token": env.ASAAS_TOKEN,
            "User-Agent": "cloudflare-worker"
          },
          body: JSON.stringify(body)
        }
      );

      const data = await response.text();

      return new Response(data, {
        status: response.status,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });

    } catch (error) {

      return new Response(JSON.stringify({
        error: error.message
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });

    }
  }
};
