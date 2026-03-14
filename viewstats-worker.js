export default {
    async fetch(request) {
      if (request.method === "OPTIONS") {
        return new Response(null, {
          status: 204,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "Authorization, Content-Type",
          },
        });
      }
  
      const url = new URL(request.url);
      const targetPath = url.pathname + url.search;
  
      const VS_API_TOKEN = '32ev9m0qggn227ng1rgpbv5j8qllas8uleujji3499g9had6oj7f0ltnvrgi00cq';
      const targetUrl = `https://api.viewstats.com${targetPath}`;
  
      try {
        const response = await fetch(targetUrl, {
          method: request.method,
          headers: {
            'Authorization': `Bearer ${VS_API_TOKEN}`,
            'Accept': request.headers.get('Accept') || 'application/json, application/octet-stream',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          }
        });
  
        const responseHeaders = new Headers(response.headers);
        responseHeaders.set("Access-Control-Allow-Origin", "*");
  
        return new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: responseHeaders
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), {
          status: 500,
          headers: { "Access-Control-Allow-Origin": "*" }
        });
      }
    }
  };
