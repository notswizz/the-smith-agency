export default async function handler(req, res) {
  // Basic CORS for robustness (same-origin normally, but helps during local/dev)
  const origin = req.headers.origin || process.env.PORTAL_ORIGIN || 'https://your-domain.com';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS, HEAD');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Vary', 'Origin');

  if (req.method === 'OPTIONS' || req.method === 'HEAD') {
    return res.status(204).end();
  }

  const isPost = req.method === 'POST';
  const isGet = req.method === 'GET';
  if (!isPost && !isGet) {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { bookingId, finalFeeCents, dryRun, overrideRateCents } = isPost ? (req.body || {}) : (req.query || {});

    if (!bookingId) {
      return res.status(400).json({ error: 'bookingId is required' });
    }

    let base = process.env.COMPANION_BASE_URL || 'https://your-domain.com';
    try {
      // Ensure we only use scheme + host, ignoring any provided path
      base = new URL(base).origin;
    } catch (_) {
      // If invalid URL, fallback to default
      base = 'https://your-domain.com';
    }
    const targetUrl = `${base}/api/stripe/charge-final`;

    // Forward the existing cookies from the requester. This should include the NextAuth session cookie.
    const incomingCookieHeader = req.headers.cookie || '';

    // Best-effort Origin header. Prefer explicit env, then derive from request host.
    const originHeader = process.env.PORTAL_ORIGIN
      || (req.headers['x-forwarded-proto'] && req.headers.host
          ? `${req.headers['x-forwarded-proto']}://${req.headers.host}`
          : (req.headers.origin || 'https://your-domain.com'));

    const forwardBody = {
      bookingId,
      ...(typeof finalFeeCents === 'number' ? { finalFeeCents } : {}),
      ...(typeof dryRun !== 'undefined' ? { dryRun: String(dryRun) === 'true' || dryRun === true } : {}),
      ...(typeof overrideRateCents === 'number' ? { overrideRateCents } : {}),
    };

    const headers = {
      'Content-Type': 'application/json',
      'Cookie': incomingCookieHeader,
      'Origin': originHeader,
    };

    if (process.env.INTERNAL_ADMIN_API_KEY) {
      headers['x-internal-key'] = process.env.INTERNAL_ADMIN_API_KEY;
    }

    const response = await fetch(targetUrl, {
      method: 'POST', // always POST upstream
      headers,
      body: JSON.stringify(forwardBody),
    });

    const text = await response.text();

    let json;
    try {
      json = text ? JSON.parse(text) : {};
    } catch (e) {
      // Non-JSON response from upstream
      json = { raw: text };
    }

    // Validate upstream response to catch misconfigured COMPANION_BASE_URL or missing keys
    try {
      const contentType = response.headers.get && response.headers.get('content-type') ? response.headers.get('content-type') : '';
      const responseLooksValid = json && (json.dryRun === true || json.success === true || json.requiresAction === true || (json.computed && typeof json.computed === 'object'));
      if (response.ok && !responseLooksValid) {
        return res.status(502).json({
          error: 'Invalid response from portal. Check COMPANION_BASE_URL, PORTAL_ORIGIN, and INTERNAL_ADMIN_API_KEY.',
          details: {
            targetUrl,
            contentType: contentType || null,
            preview: typeof text === 'string' ? text.slice(0, 160) : null,
          },
        });
      }
    } catch (_) {
      // ignore validation failure and fall through
    }

    return res.status(response.status).json(json);
  } catch (error) {
    console.error('charge-final proxy error:', error);
    return res.status(500).json({ error: 'Failed to proxy charge-final request' });
  }
} 