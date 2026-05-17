// Tiny inline validator. No deps. Keeps payloads bounded so the DB can't be force-fed garbage.

export type FieldSpec =
  | { type: 'string'; max?: number; min?: number; required?: boolean; pattern?: RegExp; oneOf?: readonly string[] }
  | { type: 'int';    min?: number; max?: number; required?: boolean }
  | { type: 'bool';   required?: boolean }
  | { type: 'any';    required?: boolean };

export type Schema = Record<string, FieldSpec>;

export function validate(body: unknown, schema: Schema): { ok: boolean; value: Record<string, unknown>; error: string } {
  if (!body || typeof body !== 'object') return { ok: false, value: {}, error: 'body must be an object' };
  const input = body as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const [key, spec] of Object.entries(schema)) {
    const v = input[key];
    const present = v !== undefined && v !== null && v !== '';
    if (!present) {
      if (spec.required) return { ok: false, value: {}, error: `${key} required` };
      continue;
    }
    if (spec.type === 'string') {
      if (typeof v !== 'string') return { ok: false, value: {}, error: `${key} must be string` };
      if (spec.max !== undefined && v.length > spec.max) return { ok: false, value: {}, error: `${key} too long (max ${spec.max})` };
      if (spec.min !== undefined && v.length < spec.min) return { ok: false, value: {}, error: `${key} too short` };
      if (spec.pattern && !spec.pattern.test(v)) return { ok: false, value: {}, error: `${key} has invalid format` };
      if (spec.oneOf && !spec.oneOf.includes(v)) return { ok: false, value: {}, error: `${key} must be one of: ${spec.oneOf.join(', ')}` };
      out[key] = v;
    } else if (spec.type === 'int') {
      const n = typeof v === 'number' ? v : Number(v);
      if (!Number.isInteger(n)) return { ok: false, value: {}, error: `${key} must be integer` };
      if (spec.min !== undefined && n < spec.min) return { ok: false, value: {}, error: `${key} < ${spec.min}` };
      if (spec.max !== undefined && n > spec.max) return { ok: false, value: {}, error: `${key} > ${spec.max}` };
      out[key] = n;
    } else if (spec.type === 'bool') {
      out[key] = Boolean(v);
    } else {
      out[key] = v;
    }
  }
  return { ok: true, value: out, error: "" };
}
