SELECT * FROM users;

SELECT * FROM links l JOIN public.utms u on l.id = u."linkId"
WHERE l.id = 9;
