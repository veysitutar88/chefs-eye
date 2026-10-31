export class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
export interface ApiRequest {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: any;
  query?: Record<string, unknown>;
}
export interface ApiResponse {
  status(code: number): ApiResponse;
  json(body: unknown): any;
  setHeader(name: string, value: string): any;
}
export function fail(res: ApiResponse, error: unknown) {
  return res.status(error instanceof HttpError ? error.status : 503).json({
    error: error instanceof HttpError ? error.message : 'Service unavailable',
  });
}
export function privateResponse(res: ApiResponse) {
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('Vary', 'Authorization, Origin');
  res.setHeader('X-Content-Type-Options', 'nosniff');
}
