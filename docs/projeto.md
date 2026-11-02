# Landing page da Suécia Auto Center (sueciaautocenter.com.br)

Data: 2026-11-02. Conversado com o dono; ideias da pesquisa em `C:\Sistema Suecia\reports\Ideias sites de oficinas.md`
(cerca de 109 fontes: 84 empresas do ramo e 22 guias e licenças).

## Objetivo

Trazer clientes pelo WhatsApp. Quem entra escolhe a loja mais perto e cai na conversa com ela, com a mensagem já
escrita. Sucesso = página rápida e bonita no celular, os 4 WhatsApp certos, no ar em `https://sueciaautocenter.com.br`,
com o `www.` redirecionando para lá.

## Dados (do dono e do Google Maps, 2026-11-02)

- Desde 02/07/2012 (a página diz "desde 2012", que não envelhece).
- Garantia: 90 dias nos serviços.
- Pagamento: Pix, cartão de crédito, débito e dinheiro. Sem citar parcelas nem desconto.
- Sem preço na página.
- Nota: ⭐ 4,9 no Google, mais de 1.800 avaliações (soma dos 4 perfis: 1.580 + 158 + 72 + 28).
- Serviços: Pneus · Alinhamento e balanceamento · Freios e suspensão · Troca de óleo e revisão.
- Sem fotos por enquanto (logo, cores e ícones). Fotos reais das fachadas entram depois.
- Sábado e domingo fechadas em todas.

| Loja | Endereço | WhatsApp | Horário |
|---|---|---|---|
| Mogi Guaçu | Av. Suécia, 1651 - Jardim Novo II | (19) 3841-4481 | seg–sex 08:00–18:30 |
| Mogi Mirim | Av. Pedro Botesi, 2400 - Jardim Scomparim | (19) 3811-8995 | seg–qui 08:30–18:15, sex 08:30–18:00 |
| Estiva Gerbi | Av. Dezenove de Maio, 2377 | (19) 3811-8994 | seg–sex 08:30–18:30 |
| Itapira | Av. dos Italianos, 2022 - Centro | (19) 99706-5251 | seg–sex 09:00–18:00 |

Links de avaliação: os de `LINKS_AVALIACAO` em `public/app/orcamento.html`. Instagram: `sueciaautocenteroficial`.

## Página (ordem no celular)

1. **Topo:** logo + botão "WhatsApp".
2. **Título:** "Pneus, alinhamento, freios e revisão em Mogi Guaçu, Mogi Mirim, Estiva Gerbi e Itapira", botão grande
   "Chamar no WhatsApp" e logo abaixo "⭐ 4,9 no Google · mais de 1.800 avaliações" (link para as avaliações).
3. **Faixa de confiança (4 itens):** desde 2012 · 4 lojas na região · orçamento por escrito no WhatsApp · 90 dias de
   garantia nos serviços.
4. **"Seu carro está pedindo?"** 4 cartões, um por serviço, com 3 sinais cada (ex.: volante puxando ou vibrando,
   pneu gastando de um lado só) e um botão que abre a escolha da loja com a mensagem daquele serviço.
5. **Como funciona (3 passos):** chame a loja no WhatsApp → receba o orçamento por escrito → só fazemos depois que
   você aprovar.
6. **Avaliações:** 3 trechos curtos de avaliações reais de 5 estrelas do Google (primeiro nome e loja), mais "Ver todas
   no Google". O dono confere os trechos antes de publicar.
7. **Lojas:** 4 cartões com cidade, endereço, horário, "🟢 Aberta agora · fecha às 18h30" / "Fechada · abre seg 8h"
   (horário de Brasília), botões WhatsApp desta loja / Como chegar / Avaliações.
8. **Dúvidas (4):** garantia, formas de pagamento, horário (sábado fechado), como pedir orçamento.
9. **Chamada final** com o botão e a nota de novo; aviso contra golpe: "Só atendemos pelos números desta página."
10. **Rodapé:** Instagram, "Quem conhece, confia.", ano.

**WhatsApp:** botão fixo no pé da tela do celular ("Chamar no WhatsApp"). Todo botão sem loja abre a janela
"Qual loja fica mais perto de você?" com as 4 cidades. Mensagem: "Olá! Vim pelo site e gostaria de um orçamento de
<serviço>." (ou "um orçamento." sem serviço). Link `https://wa.me/55DDDnúmero?text=…`. Os 4 números ficam numa
lista só no código.

**Não usar:** pop-up ao abrir, contador animado, promoção com data, fotos de banco no título, mapas embutidos (pesam:
"Como chegar" abre o Google Maps), logos de fabricantes.

## Visual

Fundo `#171717` com faixas alternando para um cinza um pouco mais claro; amarelo `#fff21a` só nos botões de WhatsApp,
na nota ⭐ e em destaques (texto escuro em cima); roxo `#a668ff` nos detalhes (ícones dos serviços, filetes, botões
secundários, passos). Ícones de linha Tabler/Phosphor (licença MIT), copiados como SVG para dentro da página.
Em computador as colunas se abrem (serviços em 4, lojas em 2 ou 4).

## Arquivos

Repositório próprio `site-suecia` (no começo ficou na pasta `site/` do `crm-suecia`; separado no mesmo dia): `index.html` (CSS e o pouco de JS
dentro), `logo` (extraído do app), ícone, `robots.txt`, `sitemap.xml`. Dados estruturados `AutoRepair` (JSON-LD), um
por loja, para a busca do Google. Sem bibliotecas nem fontes externas. Sem JS a página continua completa; o JS só
calcula "aberta agora" e abre a janela de escolha da loja (sem JS, o botão leva aos cartões das lojas).

## Servidor

> Atualização (02/11/2026): depois da separação em repositório próprio, os blocos abaixo ficam em `ferramentas/site.caddy`
> (no VPS, `/etc/caddy/sites/suecia-site.caddy`) e o Caddyfile principal, do `crm-suecia`, faz `import /etc/caddy/sites/*.caddy`.

No `ferramentas/vps/Caddyfile`, dois blocos novos; o bloco `sistema.` fica intocado:

```
sueciaautocenter.com.br {
	root * /var/www/site
	encode zstd gzip
	file_server
}
www.sueciaautocenter.com.br {
	redir https://sueciaautocenter.com.br{uri} permanent
}
```

Publicação: copiar `site/` para `/var/www/site` e o Caddyfile para `/etc/caddy/Caddyfile`, rodar `caddy validate` e
só então `systemctl reload caddy` (recarga sem derrubar o sistema). Script `ferramentas/vps/publicar-site.ps1` faz
isso do PC nas próximas vezes. O `instalar.sh` continua copiando o mesmo Caddyfile, então reinstalar não apaga o site.

Ordem da troca: (1) o dono cria no Registro.br os registros A com Nome em branco e `www`, ambos `187.41.113.24`;
(2) conferir que os nomes já respondem com esse IP; (3) publicar. O certificado HTTPS sai sozinho.

## Testes

Antes: servidor local, 375 px sem rolagem para o lado e computador; os 4 links `wa.me/55…` com a mensagem certa
(número do link = número mostrado), os 4 "Como chegar", as avaliações, "aberta/fechada" com horários simulados
(antes de abrir, aberta, depois de fechar, sexta em Mogi Mirim, fim de semana), página sem JS, ortografia.
Depois de publicar: `https://sueciaautocenter.com.br` com certificado válido, `http://` e `www.` redirecionando,
`https://sistema.sueciaautocenter.com.br` respondendo.

## Depois (fora desta entrega)

Trocar o link "site" dos 4 perfis do Google para o domínio novo (o de Mogi Guaçu aponta para uma página de edição do
Google Sites que não abre para o público). Fotos das lojas quando o dono mandar.
