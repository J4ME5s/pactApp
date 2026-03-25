export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path.startsWith('/api/shared/')) {
      const code = path.split('/api/shared/')[1]?.toUpperCase().trim();
      if (!code || code.length < 4) return json({ error: 'Invalid code' }, 400);

      // Handle CORS preflight
      if (request.method === 'OPTIONS') {
        return new Response(null, {
          status: 204,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
          }
        });
      }

      if (request.method === 'GET') {
        const data = await env.LISTS.get('list_' + code);
        if (!data) return json({ error: 'Not found' }, 404);
        return json(JSON.parse(data));
      }

      if (request.method === 'POST') {
        let body;
        try {
          body = await request.json();
        } catch {
          return json({ error: 'Invalid JSON' }, 400);
        }

        if (typeof body !== 'object' || body === null) {
          return json({ error: 'Invalid body' }, 400);
        }

        await env.LISTS.put('list_' + code, JSON.stringify(body), {
          expirationTtl: 60 * 60 * 24 * 90
        });

        return json({ ok: true });
      }

      return json({ error: 'Method not allowed' }, 405);
    }

    return new Response(HTML, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}