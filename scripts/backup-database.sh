# Backup
docker compose exec db pg_dump -U cms_user cms_db > backup_$(date +%F).sql

# Restore
docker compose exec -T db psql -U cms_user cms_db < backup_2024-01-15.sql
