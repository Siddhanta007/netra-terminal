/* global process, Buffer */

const DEFAULT_HF_SPACE_URL = 'https://siddhanta007-netra-server.hf.space';

export default async function handler(req, res) {
  const hfToken = process.env.HF_TOKEN;
  const hfSpaceUrl = (process.env.HF_SPACE_URL || DEFAULT_HF_SPACE_URL).replace(/\/$/, '');

  if (!hfToken) {
    return res.status(500).json({ detail: 'HF_TOKEN is not configured on Vercel' });
  }

  const path = Array.isArray(req.query.path) ? req.query.path.join('/') : req.query.path || '';
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(req.query)) {
    if (key === 'path') continue;
    for (const item of Array.isArray(value) ? value : [value]) {
      if (item != null) query.append(key, String(item));
    }
  }

  const target = `${hfSpaceUrl}/api/${path}${query.size ? `?${query}` : ''}`;
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value == null) continue;
    const lower = key.toLowerCase();
    if (['authorization', 'content-length', 'host', 'connection'].includes(lower)) continue;
    headers.set(key, Array.isArray(value) ? value.join(', ') : value);
  }

  // Hugging Face owns the Authorization header for a Private Space.
  // Preserve the application's JWT separately for backend verification.
  if (req.headers.authorization) {
    headers.set('x-netra-authorization', req.headers.authorization);
  }
  headers.set('authorization', `Bearer ${hfToken}`);

  const chunks = [];
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    for await (const chunk of req) chunks.push(chunk);
  }

  try {
    const upstream = await fetch(target, {
      method: req.method,
      headers,
      body: chunks.length ? Buffer.concat(chunks) : undefined,
      redirect: 'manual',
    });

    for (const name of ['content-type', 'content-disposition', 'cache-control']) {
      const value = upstream.headers.get(name);
      if (value) res.setHeader(name, value);
    }

    const body = Buffer.from(await upstream.arrayBuffer());
    return res.status(upstream.status).send(body);
  } catch (error) {
    return res.status(502).json({
      detail: 'Unable to reach the NETRA backend',
      message: error instanceof Error ? error.message : String(error),
    });
  }
}
