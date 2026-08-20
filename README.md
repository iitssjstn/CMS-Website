# CMS - Self-hosted Website Builder

Een complete, veilige, self-hosted CMS/website builder voor ZZP'ers en kleine bedrijven.

## ✨ Features

- **Page Builder** - Drag & drop met 12 bloktypen (Heading, Text, Image, Button, Link, Video, Hero, 2/3 kolommen, Spacer, Divider, HTML)
- **Mediabibliotheek** - Upload, hergebruik, alt-teksten, persistente opslag via Docker volumes
- **Dynamische navigatie** - Automatisch bijgewerkt bij pagina wijzigingen
- **SEO** - Per pagina: SEO title, meta description, Open Graph, sitemap.xml, robots.txt
- **Contactformulier** - Met honeypot spam bescherming
- **Beveiligde setup** - Geen standaard credentials, eenmalige `/setup` wizard met Argon2id
- **Docker ready** - Multi-stage build, non-root, health checks, read-only filesystem

## 🚀 Snel starten

### Vereisten
- Docker & Docker Compose
- Git

### Installatie

```bash
# 1. Repository klonen
git clone https://github.com/JOUW_GEBRUIKER/cms.git
cd cms

# 2. Environment configureren
cp .env.example .env
# Bewerk .env en vul in:
# - DATABASE_URL (wordt automatisch goed gezet voor docker-compose)
# - SESSION_SECRET (genereer met: openssl rand -base64 32)
# - SITE_NAME, SITE_DESCRIPTION

# 3. Starten
docker compose up -d

# 4. Database migraties draaien (eerste keer)
docker compose exec app npx prisma migrate deploy

# 5. Setup wizard openen
open http://localhost:3000/setup
