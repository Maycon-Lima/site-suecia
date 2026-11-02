// O mínimo do "expect" usado nos testes, em cima do node:assert (sem instalar nada).
import assert from "node:assert/strict";

export function expect(atual: unknown) {
  return {
    toBe: (esperado: unknown) => assert.equal(atual, esperado),
    toEqual: (esperado: unknown) => assert.deepEqual(atual, esperado),
    toContain: (trecho: string) => assert.ok(String(atual).includes(trecho), `não contém: ${trecho}`),
  };
}
