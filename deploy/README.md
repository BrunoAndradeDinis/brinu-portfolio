# Deploy na Magalu Cloud

O site é estático: o GitHub Actions faz o build e envia o `dist/` por `rsync` para uma VM na Magalu Cloud, onde o [Caddy](https://caddyserver.com) serve os arquivos com HTTPS automático (Let's Encrypt).

```
push na main ─▶ GitHub Actions (npm ci + build) ─▶ rsync ─▶ /var/www/brinu/releases/<sha>
                                                            current ─▶ release ativa ◀─ Caddy
```

| Arquivo | Papel |
|---|---|
| `Caddyfile` | Domínio, `www` redirecionando para o domínio raiz, cache, compressão, 404 |
| `bootstrap.sh` | Prepara a VM uma única vez (Caddy, usuário `deploy` com chave restrita, SSH só por chave, `ufw`, `fail2ban`, atualizações automáticas) |
| `rollback.sh` | Volta o `current` para a release anterior ou para um SHA |
| `../.github/workflows/deploy.yml` | Build e deploy a cada push na `main` (ou manual) |

## 1. Criar a VM

1. Ubuntu LTS, menor tamanho disponível, região `br-se1`, com a sua chave SSH pessoal.
2. Associe um IP público.
3. Security Group, entrada: `80/tcp` e `443/tcp` para `0.0.0.0/0`, `443/udp` (HTTP/3, opcional) e `22/tcp` só para o seu IP.

## 2. Gerar a chave de deploy

Na sua máquina, uma chave usada só pelo GitHub Actions:

```bash
ssh-keygen -t ed25519 -N "" -C "github-deploy" -f ~/.ssh/brinu_deploy
```

## 3. Preparar o servidor

```bash
scp -r deploy ubuntu@<IP>:~/
ssh ubuntu@<IP> "sudo ~/deploy/bootstrap.sh \"$(cat ~/.ssh/brinu_deploy.pub)\""
```

Confira que você ainda entra com `ssh ubuntu@<IP>` antes de fechar a sessão atual: o script desliga o login por senha.

## 4. DNS na GoDaddy

1. Um dia antes, baixe o TTL dos registros atuais para 600.
2. Apague o registro `A @` de "Parked" e qualquer Forwarding do domínio.
3. Crie:

| Tipo | Nome | Valor |
|---|---|---|
| A | `@` | IP público da VM |
| CNAME | `www` | `@` |
| CAA | `@` | `0 issue "letsencrypt.org"` (opcional) |

4. Espere `dig +short brinu.xyz` responder o IP da VM. O Caddy tenta emitir o certificado sozinho; se falhar antes do DNS propagar, rode `sudo systemctl reload caddy` depois.

## 5. Segredos no GitHub

Settings → Environments → `production` → Environment secrets:

| Segredo | Valor |
|---|---|
| `DEPLOY_HOST` | IP público da VM |
| `DEPLOY_SSH_KEY` | conteúdo de `~/.ssh/brinu_deploy` (chave privada) |
| `DEPLOY_KNOWN_HOSTS` | saída de `ssh-keyscan -t ed25519 <IP>` |

Confira a impressão digital do `ssh-keyscan` com a do servidor (`ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub`) antes de salvar.

## 6. Primeiro deploy

Actions → Deploy → Run workflow. O último passo testa `/`, `/whoami/`, `/robots.txt` e uma URL inexistente (precisa dar 404).

## Manutenção

- Rollback para a release anterior: `ssh deploy@<IP> /var/www/brinu/rollback.sh`
- Rollback para um commit: `ssh deploy@<IP> /var/www/brinu/rollback.sh <sha>`
- Ficam as últimas 5 releases no servidor.
- Logs de acesso: `/var/log/caddy/brinu.log`. Logs do Caddy: `journalctl -u caddy`.
- Mudou o `Caddyfile`: copie para `/etc/caddy/Caddyfile` e rode `sudo systemctl reload caddy`.
- Atualizações de segurança do Ubuntu rodam sozinhas (`unattended-upgrades`). Reinicie a VM quando existir `/var/run/reboot-required`.
- IPs banidos pelo `fail2ban`: `sudo fail2ban-client status sshd`. O `22/tcp` fica aberto porque os runners do GitHub Actions não têm IP fixo; o login é só por chave.
- A CSP de scripts e estilos vem no `<meta>` gerado pelo Astro (`security.csp` em `astro.config.mjs`); o `Caddyfile` só define o que o `<meta>` não cobre (`frame-ancestors`). Script `is:inline` novo precisa entrar em `src/utils/inline-scripts.mjs`, ou o navegador bloqueia; `tests/v2-security-csp.test.mjs` falha se faltar.

## Atenções

- Anote a validade do voucher da Magalu Cloud e crie um alerta de cobrança: depois dele a VM e o IP público passam a ser cobrados.
- Ative a renovação automática do domínio na GoDaddy; a renovação do `.xyz` costuma custar mais que o primeiro ano.
- Se o domínio mudar, atualize `deploy/Caddyfile`, o smoke test do workflow, `site` em `astro.config.mjs`, `public/robots.txt` e `SITE_URL` em `apps-script/contact-relay.js`.
