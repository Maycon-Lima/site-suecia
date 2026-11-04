// Abre a pasta site/ num servidor local para testar a página antes de publicar:
//   npm run servir  (ou node ferramentas/servir-site.mjs [porta])   (padrão 8780) → http://localhost:8780
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../site");
const PORTA = Number(process.argv[2]) || 8780;
const TIPOS = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".jpg": "image/jpeg",
  ".png": "image/png", ".mp4": "video/mp4", ".txt": "text/plain; charset=utf-8", ".xml": "application/xml; charset=utf-8",
};

createServer(async (req, res) => {
  const caminho = decodeURIComponent(new URL(req.url, "http://x").pathname);
  const arquivo = path.join(RAIZ, caminho.endsWith("/") ? caminho + "index.html" : caminho);
  if (!arquivo.startsWith(RAIZ)) { res.writeHead(403).end(); return; }
  try {
    const corpo = await readFile(arquivo);
    res.writeHead(200, { "Content-Type": TIPOS[path.extname(arquivo)] || "application/octet-stream" }).end(corpo);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }).end("Não encontrado");
  }
}).listen(PORTA, () => console.log(`Site em http://localhost:${PORTA}`));
