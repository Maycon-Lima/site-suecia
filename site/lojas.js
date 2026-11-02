// Dados das 4 lojas e as contas da página (WhatsApp e "aberta agora").
// Para corrigir um número, endereço ou horário, mude só aqui.

const SEMANA = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
const seg_sex = (abre, fecha) => ({ 1: [abre, fecha], 2: [abre, fecha], 3: [abre, fecha], 4: [abre, fecha], 5: [abre, fecha] });
const rota = endereco => "https://www.google.com/maps/dir/?api=1&destination=" + encodeURIComponent("Suécia Auto Center, " + endereco);

export const LOJAS = [
  {
    id: "guacu", cidade: "Mogi Guaçu", endereco: "Av. Suécia, 1651", bairro: "Jardim Novo II", cep: "13848-131",
    whatsapp: "1938414481", horario: seg_sex("08:00", "18:30"),
    google: "https://g.page/r/CeWJw97qz_ObEBM",
  },
  {
    id: "mirim", cidade: "Mogi Mirim", endereco: "Av. Pedro Botesi, 2400", bairro: "Jardim Scomparim", cep: "13806-635",
    whatsapp: "1938118995", horario: { ...seg_sex("08:30", "18:15"), 5: ["08:30", "18:00"] },
    google: "https://g.page/r/CZyWIbWHRwn3EBM",
  },
  {
    id: "estiva", cidade: "Estiva Gerbi", endereco: "Av. Dezenove de Maio, 2377", bairro: "", cep: "13857-000",
    whatsapp: "1938118994", horario: seg_sex("08:30", "18:30"),
    google: "https://g.page/r/CVn16PKFaUGkEBM",
  },
  {
    id: "itapira", cidade: "Itapira", endereco: "Av. dos Italianos, 2022", bairro: "Centro", cep: "13970-080",
    whatsapp: "19997065251", horario: seg_sex("09:00", "18:00"),
    google: "https://g.page/r/CQVCdQf-F2wWEBM",
  },
].map(l => ({ ...l, mapa: rota(`${l.endereco}${l.bairro ? " - " + l.bairro : ""}, ${l.cidade} - SP, ${l.cep}`) }));

export function linkWhatsApp(loja, servico) {
  const msg = `Olá! Vim pelo site e gostaria de um orçamento${servico ? " de " + servico : ""}.`;
  return `https://wa.me/55${loja.whatsapp}?text=${encodeURIComponent(msg)}`;
}

export function telefoneVisivel(loja) {
  const n = loja.whatsapp;
  return `(${n.slice(0, 2)}) ${n.slice(2, -4)}-${n.slice(-4)}`;
}

// "08:00" → "8h", "18:30" → "18h30"
const hora = hhmm => { const [h, m] = hhmm.split(":"); return `${Number(h)}h${m === "00" ? "" : m}`; };
const minutos = hhmm => { const [h, m] = hhmm.split(":"); return Number(h) * 60 + Number(m); };

// Feriados nacionais de data fixa (mês-dia). Os móveis (Carnaval, Sexta-feira Santa, Corpus Christi) e os
// municipais não entram: o aviso "Feriados: confirme pelo WhatsApp" na página cobre esses.
const FERIADOS = ["01-01", "04-21", "05-01", "09-07", "10-12", "11-02", "11-15", "11-20", "12-25"];

// Data e minutos do dia em São Paulo, qualquer que seja o fuso do aparelho
function agoraEmSP(agora) {
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(agora).map(x => [x.type, x.value]));
  return { ano: Number(p.year), mes: Number(p.month), dia: Number(p.day), min: Number(p.hour) * 60 + Number(p.minute) };
}

// O dia "i" dias depois de hoje (em SP): dia da semana e se é feriado
function diaSeguinte({ ano, mes, dia }, i) {
  const d = new Date(Date.UTC(ano, mes - 1, dia + i));
  const md = `${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
  return { semana: d.getUTCDay(), feriado: FERIADOS.includes(md) };
}

export function situacao(loja, agora) {
  const sp = agoraEmSP(agora), hoje = diaSeguinte(sp, 0), h = loja.horario[hoje.semana];
  if (hoje.feriado) return { aberta: false, texto: "Feriado · confirme pelo WhatsApp" };
  if (h && sp.min >= minutos(h[0]) && sp.min < minutos(h[1])) {
    return { aberta: true, texto: `Aberta agora · fecha às ${hora(h[1])}` };
  }
  if (h && sp.min < minutos(h[0])) return { aberta: false, texto: `Fechada · abre hoje às ${hora(h[0])}` };
  for (let i = 1; i <= 14; i++) {
    const d = diaSeguinte(sp, i), abre = loja.horario[d.semana];
    if (abre && !d.feriado) return { aberta: false, texto: `Fechada · abre ${i === 1 ? "amanhã" : SEMANA[d.semana]} às ${hora(abre[0])}` };
  }
  return { aberta: false, texto: "Fechada" };
}

export function horarioTexto(loja) {
  const h = loja.horario, seg = h[1], sex = h[5];
  if (seg[0] === sex[0] && seg[1] === sex[1]) return `Seg a sex, ${hora(seg[0])} às ${hora(seg[1])}`;
  return `Seg a qui, ${hora(seg[0])} às ${hora(seg[1])} · sex até ${hora(sex[1])}`;
}
