# Rodando o TAPeira com Docker

O jogo é 100% cliente (HTML/CSS/JS estáticos). A imagem apenas monta os arquivos
(`index.html`, `Caverna.html`, `css/`, `script/`, `imagens/`, `media/`) e os serve com
nginx. Nada de Node/Electron roda no contêiner.

## Subir

```bash
docker compose up -d --build
```

Depois abra:

- Menu: <http://localhost:8080/>
- Jogo: <http://localhost:8080/Caverna.html>

Para trocar a porta: edite/crie um `.env` (veja `.env.example`).

## Comandos úteis

```bash
docker compose ps            # status (inclui health)
docker compose logs -f web   # logs do nginx
docker compose down          # parar e remover
docker compose build --no-cache
```

## Decisões de implementação

- **Imagem enxuta e imutável**: `nginxinc/nginx-unprivileged:1.27-alpine`, rodando como
  usuário não-root (UID 101) na porta 8080.
- **Multi-stage**: o estágio `site` valida a estrutura e o estágio final recebe apenas os
  arquivos do jogo — sem `node_modules`, `android/`, `desktop/`, testes ou `.git`.
- **Endurecimento** (em `docker-compose.yml`): `read_only: true`, `cap_drop: ALL`,
  `no-new-privileges`, `tmpfs` para `/tmp` e `/var/cache/nginx`.
- **nginx** (`docker/nginx.conf`): gzip, cache de 30 dias para assets, `no-cache` para os
  HTML, cabeçalhos de segurança (`X-Content-Type-Options`, `X-Frame-Options`,
  `Referrer-Policy`) e o endpoint `/healthz` usado pelo `HEALTHCHECK`.
- **`.dockerignore`**: mantém o contexto de build pequeno.

## Observações

- Os sprites de animação já estão versionados no repositório; `prepare:web`
  (PowerShell/Windows) **não** é necessário para a imagem Docker. A pasta `www/` não é
  usada aqui.
- Saves são locais ao navegador (localStorage), então cada navegador/dispositivo tem seu
  próprio progresso. Use exportar/importar JSON para transferir.
