import { readFileSync } from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { describe, it } from "node:test";
import { expect } from "./expect.ts";

const ler = (arq: string) => readFileSync(path.join(import.meta.dirname, "../site", arq), "utf8");
const pixel = ler("pixel.js");
const CHAVE = "suecia_privacidade";

// Roda o pixel.js numa página simulada, começando com a escolha já guardada (ou nenhuma)
function pagina(escolha: string | null) {
  const guardado = new Map<string, string>(escolha ? [[CHAVE, escolha]] : []);
  const cliques: ((ev: unknown) => void)[] = [];
  const faixas: { removida: boolean }[] = [];
  let recarregou = 0;
  const elemento = () => ({
    src: "", textContent: "", innerHTML: "", className: "", hidden: true,
    removida: false,
    remove() { this.removida = true; },
    setAttribute() {},
    append() {},
    parentNode: { insertBefore() {} },
  });
  const janela: Record<string, unknown> = {
    localStorage: { getItem: (c: string) => guardado.get(c) ?? null, setItem: (c: string, v: string) => guardado.set(c, v) },
    location: { reload: () => { recarregou++; }, hostname: "sueciaautocenter.com.br" },
    document: {
      readyState: "complete",
      cookie: "",
      createElement: elemento,
      getElementsByTagName: () => [elemento()],
      querySelectorAll: () => [],
      querySelector: () => null,
      addEventListener: (tipo: string, f: (ev: unknown) => void) => { if (tipo === "click") cliques.push(f); },
      head: { append() {} },
      body: { append: (e: { removida: boolean }) => { faixas.push(e); } },
    },
  };
  janela.window = janela;
  vm.runInNewContext(pixel, janela);
  const clicar = (seletor: string) => {
    for (const f of cliques) f({ preventDefault() {}, target: { closest: (s: string) => (s === seletor ? {} : null) } });
  };
  const eventos = () => {
    const fbq = janela.fbq as { queue?: unknown[][] } | undefined;
    return fbq ? JSON.parse(JSON.stringify(fbq.queue)).map((a: Record<string, unknown>) => Object.values(a).slice(0, 2).join(" ")) : null;
  };
  return { janela, faixas, clicar, eventos, guardado, recarregadas: () => recarregou };
}

describe("aceite do Pixel", () => {
  it("sem escolha: mostra a faixa e não liga o Pixel", () => {
    const p = pagina(null);
    expect(p.faixas.length).toBe(1);
    expect(p.eventos()).toBe(null);
  });
  it("já aceitou: liga o Pixel e não mostra a faixa", () => {
    const p = pagina("aceito");
    expect(p.faixas.length).toBe(0);
    expect(p.eventos()).toEqual(["init 1137949573594545", "track PageView"]);
  });
  it("já recusou: não liga o Pixel e não mostra a faixa", () => {
    const p = pagina("recusado");
    expect(p.faixas.length).toBe(0);
    expect(p.eventos()).toBe(null);
  });
  it("clicar em Aceitar guarda, liga o Pixel e fecha a faixa", () => {
    const p = pagina(null);
    p.clicar("[data-priv-aceitar]");
    expect(p.guardado.get(CHAVE)).toBe("aceito");
    expect(p.eventos()).toEqual(["init 1137949573594545", "track PageView"]);
    expect(p.faixas[0].removida).toBe(true);
  });
  it("clicar em Recusar guarda, não liga o Pixel e fecha a faixa", () => {
    const p = pagina(null);
    p.clicar("[data-priv-recusar]");
    expect(p.guardado.get(CHAVE)).toBe("recusado");
    expect(p.eventos()).toBe(null);
    expect(p.faixas[0].removida).toBe(true);
  });
  it("mudou de ideia depois de aceitar: recarrega a página para desligar o Pixel", () => {
    const p = pagina("aceito");
    p.clicar("[data-privacidade]");
    expect(p.faixas.length).toBe(1);
    p.clicar("[data-priv-recusar]");
    expect(p.guardado.get(CHAVE)).toBe("recusado");
    expect(p.recarregadas()).toBe(1);
  });
});

describe("página de privacidade e rodapés", () => {
  const politica = ler("privacidade/index.html");
  it("a política identifica a empresa, o contato e o Pixel", () => {
    expect(politica).toContain("16.519.223/0001-08");
    expect(politica).toContain("suecia0712@gmail.com");
    expect(politica).toContain("Pixel da Meta");
    expect(politica).toContain('<script src="/pixel.js"></script>');
  });
  for (const arq of ["index.html", "revisao/index.html"]) {
    it(`${arq}: rodapé com a política e as preferências`, () => {
      const html = ler(arq);
      expect(html).toContain('href="/privacidade/"');
      expect(html).toContain("data-privacidade");
    });
  }
});
