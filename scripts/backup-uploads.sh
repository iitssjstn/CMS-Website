# Backup (volumes)
docker run --rm -v cms_uploads:/data -v $(pwd):/backup alpine tar czf /backup/uploads_backup_$(date +%F).tar.gz -C /data .

# Restore
docker run --rm -v cms_uploads:/data -v $(pwd):/backup alpine tar xzf /backup/uploads_backup_2024-01-15.tar.gz -C /data
