SELECT
    COUNT(*) AS total_links,
    SUM(CASE WHEN links."isHidden" = true THEN 1 ELSE 0 END) AS hidden_count,
    SUM(CASE WHEN links."isExpired" = true THEN 1 ELSE 0 END) AS expired_count,
    SUM(CASE WHEN links."deletedAt" IS NOT NULL THEN 1 ELSE 0 END) AS deleted_count
FROM links
JOIN public.users u ON u.id = links."userId"
WHERE u.id = 2;
