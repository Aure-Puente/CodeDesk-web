import { describe, expect, it } from 'vitest';
import { apiErrorSchema, roleSchema } from './index.js';

describe('roleSchema', () => {
  it('acepta los roles de la fase 0', () => {
    expect(roleSchema.parse('admin')).toBe('admin');
    expect(roleSchema.parse('member')).toBe('member');
  });

  it('rechaza roles desconocidos', () => {
    expect(roleSchema.safeParse('client').success).toBe(false);
  });
});

describe('apiErrorSchema', () => {
  it('valida la forma { error: { code, message } }', () => {
    const body = { error: { code: 'FORBIDDEN', message: 'Sin permiso' } };
    expect(apiErrorSchema.parse(body)).toEqual(body);
    expect(apiErrorSchema.safeParse({ message: 'x' }).success).toBe(false);
  });
});
