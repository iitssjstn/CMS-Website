# Lokaal bouwen en starten
docker compose up -d --build

# Alleen starten (na eerste build)
docker compose up -d

# Logs bekijken
docker compose logs -f app

# Stoppen
docker compose down

# Volledig resetten (VERWIJDERT DATA!)
docker compose down -v

# Updates halen
git pull
docker compose pull
docker compose up -d --build
docker compose exec app npx prisma migrate deploy
