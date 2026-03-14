export default {
  async fetch(request, env) {

    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type"
        }
      });
    }

    const body = await request.json();

    const response = await fetch("https://api-sandbox.asaas.com/v3/checkouts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "access_token": env.ASAAS_TOKEN
      },
      body: JSON.stringify(body)
    });

    return new Response(await response.text(), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }
};