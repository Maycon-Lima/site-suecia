import { describe, it } from "node:test";
import { expect } from "./expect.ts";
import { LOJAS, horarioTexto, linkWhatsApp, situacao, telefoneVisivel } from "../site/lojas.js";

type Loja = { id: string; whatsapp: string };
const loja = (id: string) => (LOJAS as Loja[]).find(l => l.id === id)!;
const guacu = loja("guacu"), mirim = loja("mirim"), estiva = loja("estiva"), itapira = loja("itapira");

describe("linkWhatsApp", () => {
  it("abre a conversa da loja com a mensagem do site", () => {
    expect(linkWhatsApp(guacu)).toBe(
      "https://wa.me/551938414481?text=" + encodeURIComponent("Olá! Vim pelo site e gostaria de um orçamento."));
  });
  it("cita o serviço quando o botão é de um serviço", () => {
    const link = linkWhatsApp(itapira, "alinhamento e balanceamento");
    expect(link).toContain("wa.me/5519997065251?text=");
    expect(decodeURIComponent(link.split("text=")[1])).toBe(
      "Olá! Vim pelo site e gostaria de um orçamento de alinhamento e balanceamento.");
  });
  it("tem os 4 números passados pelo dono", () => {
    expect((LOJAS as Loja[]).map(l => [l.id, l.whatsapp])).toEqual([
      ["guacu", "1938414481"], ["mirim", "1938118995"], ["estiva", "1938118994"], ["itapira", "19997065251"],
    ]);
  });
});

describe("telefoneVisivel", () => {
  it("formata fixo e celular", () => {
    expect(telefoneVisivel(guacu)).toBe("(19) 3841-4481");
    expect(telefoneVisivel(itapira)).toBe("(19) 99706-5251");
  });
  it("mostra o mesmo número do link", () => {
    for (const l of LOJAS as Loja[]) expect(telefoneVisivel(l).replace(/\D/g, "")).toBe(l.whatsapp);
  });
});

describe("situacao (horário de Brasília)", () => {
  it("aberta no meio da manhã", () => {
    expect(situacao(guacu, new Date("2026-11-03T13:00:00Z"))).toEqual({ aberta: true, texto: "Aberta agora · fecha às 18h30" });
  });
  it("antes de abrir: abre hoje", () => {
    expect(situacao(guacu, new Date("2026-11-03T10:30:00Z"))).toEqual({ aberta: false, texto: "Fechada · abre hoje às 8h" });
  });
  it("depois de fechar: abre amanhã", () => {
    expect(situacao(estiva, new Date("2026-11-03T22:00:00Z"))).toEqual({ aberta: false, texto: "Fechada · abre amanhã às 8h30" });
  });
  it("Mogi Mirim fecha 18h na sexta e 18h15 na quinta", () => {
    expect(situacao(mirim, new Date("2026-11-06T21:10:00Z"))).toEqual({ aberta: false, texto: "Fechada · abre segunda às 8h30" });
    expect(situacao(mirim, new Date("2026-11-05T21:10:00Z"))).toEqual({ aberta: true, texto: "Aberta agora · fecha às 18h15" });
  });
  it("sábado: abre segunda", () => {
    expect(situacao(itapira, new Date("2026-11-07T15:00:00Z"))).toEqual({ aberta: false, texto: "Fechada · abre segunda às 9h" });
  });
  it("usa Brasília mesmo quando em UTC já é outro dia", () => {
    // sábado 01:00 UTC = sexta 22:00 em São Paulo
    expect(situacao(itapira, new Date("2026-11-07T01:00:00Z"))).toEqual({ aberta: false, texto: "Fechada · abre segunda às 9h" });
  });
  it("fecha na hora exata do fechamento", () => {
    expect(situacao(itapira, new Date("2026-11-03T21:00:00Z")).aberta).toBe(false);
    expect(situacao(itapira, new Date("2026-11-03T12:00:00Z")).aberta).toBe(true);
  });
});

describe("situacao em feriado nacional", () => {
  it("no feriado não diz que está aberta", () => {
    // 02/11/2026, segunda, Finados, 10h em SP
    expect(situacao(guacu, new Date("2026-11-02T13:00:00Z"))).toEqual({ aberta: false, texto: "Feriado · confirme pelo WhatsApp" });
  });
  it("na véspera do feriado pula o feriado ao dizer quando abre", () => {
    // sexta 13/11/2026 19h; sábado, domingo, 15/11 domingo... segunda 16/11 abre normal
    expect(situacao(guacu, new Date("2026-11-13T22:00:00Z")).texto).toBe("Fechada · abre segunda às 8h");
    // quinta 19/11/2026 19h; sexta 20/11 é feriado (Consciência Negra) → abre segunda
    expect(situacao(guacu, new Date("2026-11-19T22:00:00Z")).texto).toBe("Fechada · abre segunda às 8h");
  });
});

describe("horarioTexto", () => {
  it("resume a semana", () => {
    expect(horarioTexto(guacu)).toBe("Seg a sex, 8h às 18h30");
    expect(horarioTexto(itapira)).toBe("Seg a sex, 9h às 18h");
    expect(horarioTexto(mirim)).toBe("Seg a qui, 8h30 às 18h15 · sex até 18h");
  });
});
