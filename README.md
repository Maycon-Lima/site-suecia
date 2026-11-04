# Página da Suécia Auto Center

Página de `https://sueciaautocenter.com.br` (o `www.` leva para ela). Objetivo: o cliente escolher a loja mais perto e
chamar no WhatsApp com a mensagem pronta. Página estática, sem bibliotecas, hospedada no mesmo VPS do sistema
(Hostinger, `187.41.113.24`), mas independente dele: o sistema fica no repositório `crm-suecia`.

## O que tem aqui

- `site/`: o que vai para o ar.
  - `index.html`: a página, com o CSS e o script.
  - `lojas.js`: os 4 WhatsApp, endereços e horários, além das contas do WhatsApp e do "aberta agora".
  - Logos, ícones, `robots.txt` e `sitemap.xml`.
- `tests/`: conferem as contas de horário (fuso de Brasília, feriados nacionais fixos, sexta de Mogi Mirim) e que os
  cartões das lojas no HTML batem com `lojas.js`. Rodam com o próprio Node (24 ou mais novo): `npm test`, sem instalar nada.
- `ferramentas/`:
  - `servir-site.mjs`: servidor para testar no computador (`npm run servir` → `http://localhost:8780`).
  - `publicar-site.ps1`: publica no VPS.
  - `site.caddy`: a configuração do Caddy só desta página.
  - `marca/`: a logo original.
- `docs/projeto.md` e `docs/plano.md`: o que foi combinado com o dono e como foi feito (02/11/2026).

## Páginas

- `/`: página inicial.
- `/revisao/`: oferta da revisão de R$ 29,90, para os anúncios do Instagram/Facebook. Tem cópias próprias dos cartões das
  lojas (com a mensagem do anúncio) e das avaliações; `npm test` confere com `lojas.js` e com a página inicial.
  O vídeo é uma conversão do original do iPhone para H.264 em 720×1280. Começa sozinho e sem som (regra dos navegadores),
  com o botão "Ligar o som"; não começa para quem pediu menos movimento ou economia de dados no aparelho.
- `/privacidade/`: política de privacidade.

**Meta Pixel:** fica em `site/pixel.js`, carregado no `<head>` de todas as páginas, com a faixa de aceite. Só liga depois
de "Aceitar" (escolha guardada no aparelho; "Preferências de privacidade" no rodapé troca). Para mudar o Pixel, troque
`PIXEL_ID` nesse arquivo. Na `/revisao/`, cada clique em um WhatsApp de loja dispara `Contact` com a cidade em `content_name`.

## Mudar um dado de loja ou as cores

- **Loja (telefone, endereço, horário):** mudar em `site/lojas.js` **e** nos cartões da loja em `site/index.html` e `site/revisao/index.html` (os
  cartões ficam escritos no HTML para a página funcionar mesmo sem JavaScript). Depois rodar `npm test`: se os dois não
  baterem, o teste avisa.
- **Cores:** no começo de `site/index.html`, em `:root`:
  - `--fundo` `#171717`;
  - `--amarelo` `#fccb3a`, a mesma cor da logo, nos botões e em todos os detalhes (o dono pediu tudo nessa cor);
  - `--amarelo-claro` `#ffda6b` (botão com o mouse em cima).

## Publicar

No PowerShell, de dentro desta pasta, com a chave SSH do VPS em `~/.ssh/suecia_vps`:

```powershell
& ".\ferramentas\publicar-site.ps1"
```

O script segue estes passos:
1. Confere que o Caddyfile principal do VPS inclui `/etc/caddy/sites/*.caddy`. Isso vem do `crm-suecia`.
2. Envia `site/` para `/var/www/site.novo`.
3. Põe `ferramentas/site.caddy` em `/etc/caddy/sites/suecia-site.caddy` e valida a configuração inteira do Caddy.
   Se der erro, devolve o arquivo anterior e para, sem mudar nada no ar.
4. Troca as pastas: a versão anterior fica em `/var/www/site.antigo`.
5. Recarrega o Caddy. O sistema (`sistema.sueciaautocenter.com.br`) não para, e o serviço `suecia` não é tocado.

## DNS (Registro.br, já feito em 02/11/2026)

Na zona DNS de `sueciaautocenter.com.br` há 2 registros tipo **A** apontando para `187.41.113.24`: um com Nome **em
branco** e outro com Nome `www`. A entrada `sistema` é do sistema e não deve ser mexida. O certificado HTTPS
(Let's Encrypt) é pedido e renovado sozinho pelo Caddy.

## Para depois

- Trocar o link "site" dos 4 perfis do Google para `https://sueciaautocenter.com.br`.
- Fotos reais das fachadas quando o dono mandar.
