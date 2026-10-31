import { ApiRequest, ApiResponse, privateResponse } from '../../lib/http.js';
export default function handler(_req: ApiRequest, res: ApiResponse) {
  privateResponse(res);
  res.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'");
  return res.status(410).json({ error: 'External account linking is disabled' });
}
