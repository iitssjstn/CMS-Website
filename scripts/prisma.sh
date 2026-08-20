# Migraties uitvoeren
docker compose exec app npx prisma migrate deploy

# Nieuwe migratie aanmaken (development)
docker compose exec app npx prisma migrate dev --name naam

# Prisma Studio openen
docker compose exec app npx prisma studio
