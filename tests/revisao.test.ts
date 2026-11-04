import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { expect } from "./expect.ts";
import { LOJAS } from "../site/lojas.js";

const ler = (arq: string) => readFileSync(path.join(import.meta.dirname, "../site", arq), "utf8");
const html = ler("revisao/index.html");
const inicio = ler("index.html");
const MENSAGEM = "Ol%C3%A1!%20Vi%20o%20an%C3%BAncio%20da%20revis%C3%A3o%20completa%20de%20R%24%2029%2C90%20e%20quero%20agendar.";

const cartao = (id: string) => {
  const m = html.match(new RegExp(`<article[^>]*id="loja-${id}"[\\s\\S]*?</article>`));
  if (!m) throw new Error("sem cartão da loja " + id);
  return m[0];
};

describe("página /revisao", () => {
  for (const loja of LOJAS) {
    it(`${loja.cidade}: WhatsApp com a mensagem da oferta, em nova aba, avisando a cidade`, () => {
      const c = cartao(loja.id);
      expect(c).toContain(`href="https://wa.me/55${loja.whatsapp}?text=${MENSAGEM}"`);
      expect(c).toContain('target="_blank"');
      expect(c).toContain(`data-cidade="${loja.cidade}"`);
      expect(c).toContain(loja.endereco);
      expect(c).toContain("Agendar pelo WhatsApp");
    });
  }
  it("só tem os 4 números das lojas", () => {
    const numeros = new Set([...html.matchAll(/wa\.me\/55(\d+)/g)].map(m => m[1]));
    expect([...numeros].sort()).toEqual(LOJAS.map(l => l.whatsapp).sort());
  });
  it("não mostra outro preço além de R$ 29,90", () => {
    const precos = new Set([...html.matchAll(/R\$\s*([\d.,]+\d)/g)].map(m => m[1]));
    expect([...precos]).toEqual(["29,90"]);
  });
  it("título e descrição pedidos, e a capa no compartilhamento", () => {
    expect(html).toContain("<title>Revisão completa por R$ 29,90 | Suécia Auto Center</title>");
    expect(html).toContain('name="description" content="Revisão completa por R$ 29,90 | Suécia Auto Center"');
    expect(html).toContain('property="og:image" content="https://sueciaautocenter.com.br/revisao/revisao-2990-capa.jpg"');
  });
  it("o vídeo tem controles e capa, e sem o script espera o play com som", () => {
    const v = html.match(/<video[^>]*>/)![0];
    expect(v).toContain("controls");
    expect(v).toContain("playsinline");
    expect(v).toContain('preload="metadata"');
    expect(v).toContain('poster="revisao-2990-capa.jpg"');
    expect(v.includes("muted")).toBe(false);
  });
  it("o vídeo começa sozinho sem som, com botão para ligar o som", () => {
    expect(html).toContain("video.muted = true");
    expect(html).toContain("video.play()");
    expect(html).toContain("Ligar o som");
    expect(/<button[^>]*data-som[^>]*hidden/.test(html)).toBe(true);
  });
  it("o vídeo respeita quem pede menos movimento ou economia de dados, e não fica mudo se não tocar", () => {
    expect(html).toContain("navigator.connection?.saveData");
    expect(html).toContain("catch(() => { video.muted = false; })");
  });
  it("não usa a frase retirada a pedido do dono", () => {
    expect(html.includes("pente fino")).toBe(false);
    expect(html).toContain("Você vê tudo o que conferimos no seu carro: são mais de 70 itens, mostrados pessoalmente, por foto ou por vídeo. Sem surpresa, para o dia a dia ou antes de pegar a estrada.");
  });
  it("as avaliações são as mesmas da página inicial", () => {
    const cartoes = (h: string) => [...h.matchAll(/<blockquote>[\s\S]*?<\/blockquote>/g)].map(m => m[0]);
    expect(cartoes(html).length).toBe(15);
    expect(cartoes(html)).toEqual(cartoes(inicio));
  });
});

describe("Meta Pixel", () => {
  it("as duas páginas carregam o pixel.js no head", () => {
    for (const h of [html, inicio]) {
      const head = h.slice(0, h.indexOf("</head>"));
      expect(head).toContain('<script src="/pixel.js"></script>');
    }
  });
  it("a página inicial não dispara o evento Contact", () => {
    expect(inicio.includes("Contact")).toBe(false);
  });
  it("a /revisao dispara Contact com a cidade da loja", () => {
    expect(html).toContain('fbq("track", "Contact", { content_name: cidade })');
  });
  it("usa o ID do dono e só carrega a Meta se houver ID", () => {
    const js = ler("pixel.js");
    expect(js).toContain('const PIXEL_ID = "1137949573594545";');
    expect(js).toContain("if (!PIXEL_ID");
  });
});
