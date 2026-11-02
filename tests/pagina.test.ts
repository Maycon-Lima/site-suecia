import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { expect } from "./expect.ts";
import { LOJAS, horarioTexto, linkWhatsApp, telefoneVisivel } from "../site/lojas.js";

// Os cartões das lojas estão escritos no HTML (para funcionar sem JS):
// conferir que batem com a lista de lojas, o erro mais comum nos sites do ramo.
const html = readFileSync(path.join(import.meta.dirname, "../site/index.html"), "utf8");
const cartao = (id: string) => {
  const m = html.match(new RegExp(`<article[^>]*id="loja-${id}"[\\s\\S]*?</article>`));
  if (!m) throw new Error("sem cartão da loja " + id);
  return m[0];
};
const attr = (s: string) => s.replace(/&/g, "&amp;");

describe("cartões das lojas no HTML", () => {
  for (const loja of LOJAS) {
    it(`${loja.cidade}: número, WhatsApp, rota e avaliações iguais aos da lista`, () => {
      const c = cartao(loja.id);
      expect(c).toContain(loja.cidade);
      expect(c).toContain(loja.endereco);
      expect(c).toContain(telefoneVisivel(loja));
      expect(c).toContain(`href="${attr(linkWhatsApp(loja))}"`);
      expect(c).toContain(`href="${attr(loja.mapa)}"`);
      expect(c).toContain(`href="${attr(loja.google)}"`);
      expect(c).toContain(`data-loja="${loja.id}"`);
      expect(c).toContain(horarioTexto(loja));
      if (loja.bairro) expect(c).toContain(loja.bairro);
    });
  }
  it("as avaliações levam ao Google de cada loja", () => {
    const sec = html.match(/<section id="avaliacoes"[\s\S]*?<\/section>/)![0];
    for (const loja of LOJAS) expect(sec).toContain(`href="${attr(loja.google)}"`);
  });
  it("avisa que em feriado é preciso confirmar", () => {
    const sec = html.match(/<section id="lojas"[\s\S]*?<\/section>/)![0];
    expect(sec).toContain("Feriados: confirme pelo WhatsApp");
  });
  it("o horário no JSON-LD é o mesmo da lista", () => {
    const ld = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)![1]);
    const dias = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    for (const loja of LOJAS) {
      const item = ld.find((x: { telephone: string }) => x.telephone === "+55" + loja.whatsapp);
      const horas = Object.fromEntries(item.openingHoursSpecification.map((h: { dayOfWeek: string; opens: string; closes: string }) =>
        [dias.indexOf(h.dayOfWeek), [h.opens, h.closes]]));
      expect(horas).toEqual(loja.horario);
    }
  });
  it("não tem nenhum outro número de WhatsApp na página", () => {
    const numeros = new Set([...html.matchAll(/wa\.me\/55(\d+)/g)].map(m => m[1]));
    expect([...numeros].sort()).toEqual(LOJAS.map(l => l.whatsapp).sort());
  });
  it("os dados para o Google (JSON-LD) têm o telefone de cada loja", () => {
    const ld = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m => JSON.parse(m[1]));
    const tels = ld.flat().map((x: { telephone: string }) => x.telephone);
    expect(tels.sort()).toEqual(LOJAS.map(l => "+55" + l.whatsapp).sort());
  });
});
