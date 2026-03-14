export default {
  async fetch(request, env) {

    const body = await request.json()

    const response = await fetch(
      "https://api-sandbox.asaas.com/v3/checkouts",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "access_token": "$aact_hmlg_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OjU5NWM1YTg5LWMxN2ItNDhmNS05OGEwLTM5MjJiN2M3YTJhZTo6JGFhY2hfMDhiODFmMWMtNjY1NC00OWNjLWI2ZDctNTUwODEzOGJkMDJh"
        },
        body: JSON.stringify(body)
      }
    )

    return new Response(await response.text(), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    })
  }
}