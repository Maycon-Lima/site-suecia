# Landing page da Suécia Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Página estática em `sueciaautocenter.com.br` que leva o visitante a chamar a loja mais perto no WhatsApp.

**Architecture:** Pasta `site/` independente do Next.js: `index.html` (HTML + CSS dentro) e `lojas.js` (módulo ES com os dados das lojas e as contas de WhatsApp e "aberta agora", testado com vitest). Servida pelo Caddy do VPS como arquivos estáticos, num bloco novo do `Caddyfile`.

**Tech Stack:** HTML, CSS, JS puro (módulo ES), vitest (já no repositório), Caddy.

**Spec:** `docs/superpowers/specs/2026-11-02-landing-page-design.md`

## Global Constraints

- Tudo em português do Brasil; o dono não é técnico.
- Cores: fundo `#171717`; amarelo `#fff21a` só em botões de WhatsApp, nota ⭐ e destaques (texto escuro em cima); roxo `#a668ff` só em detalhes.
- Sem bibliotecas, fontes ou scripts externos; ícones Tabler (MIT) colados como SVG.
- Sem preço, sem parcelas, sem desconto, sem pop-up ao abrir, sem contador animado, sem logos de fabricantes, sem mapas embutidos.
- Mensagem do WhatsApp: `Olá! Vim pelo site e gostaria de um orçamento de <serviço>.` ou, sem serviço, `Olá! Vim pelo site e gostaria de um orçamento.`
- Link: `https://wa.me/55<DDD><número>?text=<encodeURIComponent(mensagem)>`.
- Horário calculado no fuso `America/Sao_Paulo`, qualquer que seja o fuso do aparelho.
- Não mexer no bloco `sistema.sueciaautocenter.com.br` do Caddyfile nem no serviço `suecia`.
- `npm run lint` e `npm test` continuam passando (o `publicar.sh` do sistema exige).

## Review Focus

- Aparelho com fuso diferente de Brasília: "aberta/fechada" tem que seguir Brasília (teste com `Date` UTC fixo).
- Feriado (ex.: Dia de Finados): a página não sabe de feriados; o texto não promete nada além do horário normal (sem "garantido aberto"). Aceito, sem teste.
- Sexta em Mogi Mirim fecha 18h00 (diferente dos outros dias): teste dedicado.
- Navegador sem JS: botões "Chamar no WhatsApp" levam para `#lojas`, onde cada loja tem link `wa.me` direto no HTML (sem depender do script).
- Número mostrado ≠ número do link (erro mais comum na pesquisa): o HTML das lojas é gerado a partir de `LOJAS`; teste confere que o número formatado e o do link vêm do mesmo campo.

---

### Task 1: Dados das lojas, links de WhatsApp e "aberta agora"

**Files:**
- Create: `site/lojas.js`
- Create: `tests/site/lojas.test.ts`
- Modify: `vitest.config.ts` (incluir `tests/site/**/*.test.ts` no projeto "sistema")

**Interfaces:**
- Produces:
  - `export const LOJAS: Loja[]` com `{ id: "guacu"|"mirim"|"estiva"|"itapira", cidade, endereco, bairro, cep, whatsapp: "1938414481" (só dígitos, com DDD), avaliacao: url, mapa: url, horario: { [diaSemana 0–6]: ["HH:MM","HH:MM"] } }` (dias sem chave = fechado). Valores exatos da tabela do spec; `avaliacao` = links de `LINKS_AVALIACAO`; `mapa` = `https://www.google.com/maps/dir/?api=1&destination=<encodeURIComponent("Suécia Auto Center " + endereço completo)>`.
  - `export function linkWhatsApp(loja: Loja, servico?: string): string`
  - `export function telefoneVisivel(loja: Loja): string` → `"(19) 3841-4481"` / `"(19) 99706-5251"`
  - `export function situacao(loja: Loja, agora: Date): { aberta: boolean, texto: string }`
  - `export function horarioTexto(loja: Loja): string` → ex. `"Seg a sex, 8h às 18h30"`; Mogi Mirim `"Seg a qui, 8h30 às 18h15 · sex até 18h"`.

- [ ] **Step 1: Write the failing tests** em `tests/site/lojas.test.ts` (importa `../../site/lojas.js`):
  - `linkWhatsApp(guacu)` === `https://wa.me/551938414481?text=` + `encodeURIComponent("Olá! Vim pelo site e gostaria de um orçamento.")`
  - `linkWhatsApp(itapira, "alinhamento e balanceamento")` contém `wa.me/5519997065251` e a mensagem com `orçamento de alinhamento e balanceamento.`
  - para cada loja, `telefoneVisivel(loja).replace(/\D/g,"")` === `loja.whatsapp` (mesmo campo).
  - `situacao(guacu, new Date("2026-11-03T13:00:00Z"))` (ter 10h em SP) → `{aberta:true, texto:"Aberta agora · fecha às 18h30"}`
  - `situacao(guacu, new Date("2026-11-03T10:30:00Z"))` (7h30) → `{aberta:false, texto:"Fechada · abre hoje às 8h"}`
  - `situacao(estiva, new Date("2026-11-03T22:00:00Z"))` (19h) → `"Fechada · abre amanhã às 8h30"`
  - `situacao(mirim, new Date("2026-11-06T21:10:00Z"))` (sex 18h10) → fechada, `"Fechada · abre segunda às 8h30"`; mesma hora numa quinta (`2026-11-05`) → aberta, `"… fecha às 18h15"`
  - `situacao(itapira, new Date("2026-11-07T15:00:00Z"))` (sáb) → `"Fechada · abre segunda às 9h"`
  - Fuso: os mesmos instantes UTC dão o mesmo resultado com `process.env.TZ` diferente (rodar um caso com `TZ=Asia/Tokyo` via `vi.stubEnv` não muda o `Date`; basta garantir que a função usa `Intl.DateTimeFormat` com `timeZone: "America/Sao_Paulo"` — o teste usa instantes UTC que seriam outro dia em UTC, ex. `2026-11-07T01:00:00Z` = sex 22h em SP → `"abre segunda"`).
  - `horarioTexto` de guaçu e mirim conforme Interfaces.

- [ ] **Step 2: Run** `npx vitest run tests/site` — Expected: FAIL (módulo não existe).
- [ ] **Step 3: Implement `site/lojas.js`** (ESM puro, sem dependências). Horas sem minutos zerados viram `8h`; com minutos, `18h30`.
- [ ] **Step 4: Run** `npx vitest run tests/site` e `npm test` — Expected: PASS; `npm run lint` sem erros novos.
- [ ] **Step 5: Commit** `site/lojas.js tests/site/lojas.test.ts vitest.config.ts` — "Site: dados das lojas, WhatsApp e aberta agora".

### Task 2: Página `index.html`

**Files:**
- Create: `site/index.html`, `site/logo.jpg` (extraído do base64 em `public/app/orcamento.html`), `site/icone.png` (cópia de `public/icons/icon-192.png`), `site/apple-touch-icon.png` (cópia), `site/robots.txt`, `site/sitemap.xml`

**Interfaces:**
- Consumes: `LOJAS`, `linkWhatsApp`, `telefoneVisivel`, `situacao`, `horarioTexto` de `./lojas.js` (via `<script type="module">`).

- [ ] **Step 1: Escrever a página** com as 10 seções do spec, na ordem do spec, textos do spec. Os 4 cartões de loja ficam escritos no HTML (endereço, horário, telefone, links `wa.me`, "Como chegar", avaliações) para funcionar sem JS; o script só (a) preenche o selo "aberta/fechada" de cada cartão e atualiza a cada minuto, (b) faz os botões sem loja (topo, título, barra fixa, serviços, final) abrirem um `<dialog>` "Qual loja fica mais perto de você?" com 4 links `linkWhatsApp(loja, servico)`; sem JS esses botões são `<a href="#lojas">`. Barra fixa no pé só abaixo de 768 px; `padding-bottom` no `body` para não cobrir o rodapé. JSON-LD: um `AutoRepair` por loja (nome, endereço, telefone, `openingHoursSpecification`, `url`), sem `aggregateRating`. `<meta>` description, Open Graph com o logo, `lang="pt-BR"`, `theme-color #171717`. Avaliações: 3 trechos curtos reais de 5 estrelas copiados do Google na hora (primeiro nome + loja), marcados para o dono conferir.
- [ ] **Step 2: Conferir no navegador** (servidor estático local, ex. `npx serve site` ou `python -m http.server`): 375 px sem rolagem horizontal (`document.documentElement.scrollWidth === 375`), 1280 px com colunas; cada link `wa.me` aberto mostra a mensagem certa; o `<dialog>` abre e fecha (Esc e botão); sem JS (desligar no navegador) os botões levam a `#lojas`; console sem erros; tamanho total da página (HTML+logo+JS) abaixo de 200 KB.
- [ ] **Step 3: Revisar contra as Web Interface Guidelines da Vercel** (`https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md`) e corrigir o que valer para a página.
- [ ] **Step 4: Commit** `site/` — "Site: página da Suécia".

### Task 3: Caddy, script de publicação e passo a passo do DNS

**Files:**
- Modify: `ferramentas/vps/Caddyfile` (acrescentar os 2 blocos do spec, sem tocar no bloco `sistema.`)
- Create: `ferramentas/vps/publicar-site.ps1` (UTF-8 com BOM)
- Modify: `README.md` (seção "Site sueciaautocenter.com.br": DNS no Registro.br e como publicar)

- [ ] **Step 1: `publicar-site.ps1`**: parâmetros `-Servidor "root@187.41.113.24"`, `-Chave "$HOME\.ssh\suecia_vps"`; envia `site\*` para `/var/www/site.novo`, troca de pasta de uma vez (`rm -rf /var/www/site.antigo; mv /var/www/site /var/www/site.antigo 2>/dev/null; mv /var/www/site.novo /var/www/site`), envia o Caddyfile para `/tmp/Caddyfile`, roda `caddy validate --config /tmp/Caddyfile --adapter caddyfile` e só se passar instala em `/etc/caddy/Caddyfile` e `systemctl reload caddy`; falha em qualquer passo = para e avisa em português.
- [ ] **Step 2: Validar o Caddyfile** sem aplicar: copiar para `/tmp` no VPS e `caddy validate`. Expected: `Valid configuration`.
- [ ] **Step 3: README**: passo a passo do Registro.br (domínio → DNS → modo avançado / editar zona → novo registro tipo A, Nome em branco, valor `187.41.113.24`; outro tipo A, Nome `www`, mesmo valor; salvar; esperar até algumas horas), como conferir (`nslookup sueciaautocenter.com.br`) e como publicar de novo (`publicar-site.ps1`).
- [ ] **Step 4: Commit** — "Site: Caddy, script de publicação e DNS".

### Task 4: Publicar (depois do DNS do dono)

- [ ] **Step 1:** Conferir `nslookup sueciaautocenter.com.br` e `www.` → `187.41.113.24`. Se ainda não, parar e avisar.
- [ ] **Step 2:** Rodar `publicar-site.ps1`.
- [ ] **Step 3:** Conferir: `curl -sI https://sueciaautocenter.com.br` → 200 com certificado válido; `curl -sI http://sueciaautocenter.com.br` e `https://www.sueciaautocenter.com.br` → 308 para `https://sueciaautocenter.com.br/`; `curl -sI https://sistema.sueciaautocenter.com.br/login` → 200 como antes; abrir no navegador em 375 px.
