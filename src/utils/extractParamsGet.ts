import { User } from '@prisma/client';

export const extractParamsGet = (req: any) => {
  const user: User = req.user as User;
  const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
  const isHidden = req.query.is_hidden ? req.query.is_hidden === 'true' : false;

  return { user, page, limit, isHidden };
};
