// Meta Pixel de todas as páginas do site, com a faixa de aceite (privacidade).
// O Pixel só liga depois que a pessoa aceita; a escolha fica guardada no aparelho.
// Para trocar o Pixel, mude o ID abaixo e publique. Vazio, nada é carregado nem enviado à Meta.
const PIXEL_ID = "1137949573594545";
const CHAVE_ESCOLHA = "suecia_privacidade";

// O navegador pode bloquear o armazenamento (aba anônima): aí a faixa aparece de novo a cada visita
function lerEscolha() {
  try { return window.localStorage.getItem(CHAVE_ESCOLHA); } catch { return null; }
}
function guardarEscolha(valor) {
  try { window.localStorage.setItem(CHAVE_ESCOLHA, valor); } catch { /* fica só nesta página */ }
}

function ligarPixel() {
  if (!PIXEL_ID || window.fbq) return;
  // Código padrão da Meta
  !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
  n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script',
  'https://connect.facebook.net/en_US/fbevents.js');
  window.fbq("init", PIXEL_ID);
  window.fbq("track", "PageView");
}

// Apaga os cookies que o Pixel deixou, para quem mudou de ideia
function apagarCookies() {
  for (const nome of ["_fbp", "_fbc"]) {
    document.cookie = `${nome}=; Max-Age=0; path=/`;
    document.cookie = `${nome}=; Max-Age=0; path=/; domain=.${window.location.hostname}`;
  }
}

let faixa = null;

function colocarEstilo() {
  const estilo = document.createElement("style");
  estilo.textContent = `
    .faixa-priv { position: fixed; z-index: 40; left: 12px; right: 12px; bottom: calc(12px + env(safe-area-inset-bottom)); max-width: 560px; padding: 16px; border: 1px solid #4a4a4a; border-radius: 14px; background: #242424; color: #f4f4f4; font-size: .92rem; line-height: 1.45; }
    @media (max-width: 767px) { .faixa-priv.com-barra { bottom: calc(84px + env(safe-area-inset-bottom)); } }
    .faixa-priv a { color: #fccb3a; }
    .faixa-priv p { margin: 0 0 12px; }
    .faixa-priv div { display: flex; gap: 10px; }
    .faixa-priv button { flex: 1; min-height: 44px; border-radius: 10px; border: 1.5px solid #fccb3a; font: inherit; font-weight: 700; cursor: pointer; touch-action: manipulation; }
    .faixa-priv button:focus-visible { outline: 3px solid #fccb3a; outline-offset: 3px; }
    .faixa-priv [data-priv-aceitar] { background: #fccb3a; color: #171717; }
    .faixa-priv [data-priv-recusar] { background: transparent; color: #fccb3a; }
  `;
  document.head.append(estilo);
}

function mostrarFaixa() {
  if (faixa) return;
  faixa = document.createElement("div");
  faixa.className = "faixa-priv" + (document.querySelector(".barra") ? " com-barra" : "");
  faixa.setAttribute("role", "region");
  faixa.setAttribute("aria-label", "Privacidade");
  faixa.innerHTML = '<p>Usamos o Pixel da Meta para medir nossos anúncios, se você permitir. <a href="/privacidade/">Política de privacidade</a></p>' +
    '<div><button type="button" data-priv-aceitar>Aceitar</button><button type="button" data-priv-recusar>Recusar</button></div>';
  document.body.append(faixa);
}

function fecharFaixa() {
  if (faixa) faixa.remove();
  faixa = null;
}

document.addEventListener("click", ev => {
  if (ev.target.closest("[data-priv-aceitar]")) {
    guardarEscolha("aceito");
    fecharFaixa();
    ligarPixel();
  } else if (ev.target.closest("[data-priv-recusar]")) {
    guardarEscolha("recusado");
    fecharFaixa();
    // Se o Pixel já estava ligado nesta página, só recarregando ele sai de vez
    if (window.fbq) { apagarCookies(); window.location.reload(); }
  } else if (ev.target.closest("[data-privacidade]")) {
    mostrarFaixa();
  }
});

function iniciar() {
  colocarEstilo();
  // O botão de preferências só faz sentido com JavaScript
  for (const b of document.querySelectorAll("[data-privacidade]")) b.hidden = false;
  if (!lerEscolha()) mostrarFaixa();
}

if (lerEscolha() === "aceito") ligarPixel();
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciar);
else iniciar();
