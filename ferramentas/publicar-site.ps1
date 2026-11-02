# Publica a página sueciaautocenter.com.br (pasta site\) no VPS.
# Rodar no PowerShell, de dentro da pasta site-suecia:
#   & ".\ferramentas\publicar-site.ps1"
# Mexe só no que é da página: /var/www/site e /etc/caddy/sites/suecia-site.caddy.
# Não toca no sistema (sistema.sueciaautocenter.com.br), no Caddyfile principal nem no serviço "suecia".
param(
  [string]$Servidor = "root@187.41.113.24",
  [string]$Chave = "$HOME\.ssh\suecia_vps"
)
$ErrorActionPreference = "Stop"
$raiz = Split-Path -Parent $PSScriptRoot
$site = Join-Path $raiz "site"
$caddy = Join-Path $PSScriptRoot "site.caddy"
$ssh = @("-i", $Chave, "-o", "BatchMode=yes")
$conf = "/etc/caddy/sites/suecia-site.caddy"

function Passo($texto) { Write-Host "== $texto" -ForegroundColor Cyan }
function Falhou($texto) { Write-Host "❌ $texto. Nada mudou no ar." -ForegroundColor Red; exit 1 }

if (-not (Test-Path (Join-Path $site "index.html"))) { Falhou "Não achei site\index.html" }

Passo "Conferindo o VPS"
& ssh @ssh $Servidor "grep -q '^import /etc/caddy/sites/\*.caddy' /etc/caddy/Caddyfile"
if ($LASTEXITCODE -ne 0) { Falhou "O Caddyfile do VPS não inclui /etc/caddy/sites (ver README do crm-suecia, seção 0)" }

Passo "Enviando a página"
& ssh @ssh $Servidor "rm -rf /var/www/site.novo && mkdir -p /var/www/site.novo /etc/caddy/sites"
if ($LASTEXITCODE -ne 0) { Falhou "Não consegui entrar no VPS" }
& scp @ssh -r -q "$site\*" "${Servidor}:/var/www/site.novo/"
if ($LASTEXITCODE -ne 0) { Falhou "Não consegui enviar os arquivos" }
& scp @ssh -q $caddy "${Servidor}:/tmp/suecia-site.caddy"
if ($LASTEXITCODE -ne 0) { Falhou "Não consegui enviar o site.caddy" }

Passo "Conferindo a configuração do Caddy"
# Põe o arquivo novo no lugar, valida a configuração inteira e, se der erro, devolve o anterior
$valida = "cp -a $conf $conf.anterior 2>/dev/null; install -m 644 /tmp/suecia-site.caddy $conf && " +
  "if caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile >/tmp/caddy-validate.log 2>&1; then " +
  "tail -1 /tmp/caddy-validate.log; rm -f $conf.anterior; else tail -3 /tmp/caddy-validate.log; " +
  "if [ -f $conf.anterior ]; then mv $conf.anterior $conf; else rm -f $conf; fi; exit 1; fi"
& ssh @ssh $Servidor $valida
if ($LASTEXITCODE -ne 0) { Falhou "O site.caddy novo tem erro" }

Passo "Trocando a página e recarregando o Caddy (o sistema não para)"
$troca = "chmod -R a+rX /var/www/site.novo && rm -rf /var/www/site.antigo && " +
  "{ [ ! -d /var/www/site ] || mv /var/www/site /var/www/site.antigo; } && " +
  "{ mv /var/www/site.novo /var/www/site || { [ ! -d /var/www/site.antigo ] || mv /var/www/site.antigo /var/www/site; false; }; } && " +
  "systemctl reload caddy"
& ssh @ssh $Servidor $troca
if ($LASTEXITCODE -ne 0) { Write-Host "❌ A troca falhou no meio: confira no VPS." -ForegroundColor Red; exit 1 }

Write-Host "✅ Página publicada: https://sueciaautocenter.com.br" -ForegroundColor Green
