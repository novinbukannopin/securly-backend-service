import { User } from '@prisma/client';

export const extractParamsGet = (req: any) => {
  const user: User = req.user as User;

  const page =
    req.query.page && !isNaN(req.query.page)
      ? Math.max(parseInt(req.query.page as string, 10), 1)
      : 1;
  const limit =
    req.query.limit && !isNaN(req.query.limit)
      ? Math.max(parseInt(req.query.limit as string, 10), 1)
      : 10;

  // Parsing boolean untuk includeHidden, includeDeleted, dan includeExpired
  const includeHidden = req.query.hidden ? req.query.hidden === 'true' : undefined;
  const includeDeleted = req.query.deleted ? req.query.deleted === 'true' : undefined;
  const includeExpired = req.query.expired ? req.query.expired === 'true' : undefined;

  return { user, page, limit, includeHidden, includeDeleted, includeExpired };
};
