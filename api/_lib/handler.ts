import type { VercelRequest, VercelResponse } from '@vercel/node';

type Handler = (req: VercelRequest, res: VercelResponse) => Promise<unknown> | unknown;

// Wraps a handler so any thrown error becomes a JSON 500 with diagnostics,
// instead of FUNCTION_INVOCATION_FAILED.
export function withErrors(h: Handler): Handler {
  return async (req, res) => {
    try {
      return await h(req, res);
    } catch (e) {
      console.error('handler error', e);
      if (res.writableEnded) return;
      const msg = e instanceof Error ? e.message : String(e);
      res.status(500).json({ error: 'server_error', detail: msg });
    }
  };
}
