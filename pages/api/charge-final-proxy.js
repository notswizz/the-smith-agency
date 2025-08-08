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
    const debugFlag = (req.query && req.query.debug === '1') || (isPost && req.body && req.body.debug === true);
    const { bookingId, finalFeeCents, dryRun, overrideRateCents } = isPost ? (req.body || {}) : (req.query || {});

    if (!bookingId) {
      return res.status(400).json({ error: 'bookingId is required' });
    }

    // Resolve base portal origin from env
    let base = process.env.COMPANION_BASE_URL
      || process.env.NEXT_PUBLIC_COMPANION_BASE_URL
      || 'https://your-domain.com';
    try {
      base = new URL(base).origin; // ensure origin only
    } catch (_) {
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

    // Attach debug info on demand or when non-OK
    const debugInfo = {
      targetUrl,
      base,
      upstreamStatus: response.status,
      upstreamOk: response.ok,
      preview: typeof text === 'string' ? text.slice(0, 160) : null,
      sent: {
        hasCookie: Boolean(incomingCookieHeader),
        hasInternalKey: Boolean(process.env.INTERNAL_ADMIN_API_KEY),
        body: { ...forwardBody, bookingId: '[redacted]' },
      },
    };

    if (!response.ok) {
      return res.status(response.status).json({ error: json?.message || json?.error || 'Upstream error', details: json, debug: debugInfo });
    }

    // Validate upstream response to catch misconfigured COMPANION_BASE_URL or missing keys
    try {
      const responseLooksValid = json && (json.dryRun === true || json.success === true || json.requiresAction === true || (json.computed && typeof json.computed === 'object'));
      if (!responseLooksValid) {
        return res.status(502).json({
          error: 'Invalid response from portal. Check COMPANION_BASE_URL, PORTAL_ORIGIN, and INTERNAL_ADMIN_API_KEY.',
          details: json,
          debug: debugInfo,
        });
      }
    } catch (_) {
      // ignore validation failure and fall through
    }

    return res.status(response.status).json(debugFlag ? { ...json, debug: debugInfo } : json);
  } catch (error) {
    console.error('charge-final proxy error:', error);
    return res.status(500).json({ error: 'Failed to proxy charge-final request', details: error?.message || String(error) });
  }
} 