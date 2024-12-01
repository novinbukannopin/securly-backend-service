import { v4 as uuid } from 'uuid';
import prisma from '../client';
import type { User, Link, UTM } from '@prisma/client';
import ApiError from '../utils/ApiError';

const linkSelectFields = () => ({
  id: true,
  userId: true,
  originalUrl: true,
  shortCode: true,
  type: true,
  score: true,
  isHidden: true,
  isExpired: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  expiresAt: true,
  UTM: true
});

const create = async (data: Partial<Link> & { utm?: Partial<UTM> }, user: User) => {
  const isUserAvailable = await prisma.user.findUnique({
    where: { id: user.id }
  });
  if (!isUserAvailable) throw new ApiError(401, 'User not found');

  const shortCode = data.shortCode || (await generateShortCode());
  await ensureShortURLUnique(shortCode);

  return prisma.link.create({
    data: {
      userId: user.id,
      originalUrl: data.originalUrl || '',
      shortCode,
      score: data.score || 0,
      expiresAt: data.expiresAt || null,
      type: data.type || 'BENIGN',
      isExpired: data.isExpired || false,
      isHidden: data.isHidden || false,
      UTM: data.utm
        ? {
            create: {
              source: data.utm.source || null,
              medium: data.utm.medium || null,
              campaign: data.utm.campaign || null,
              term: data.utm.term || null,
              content: data.utm.content || null
            }
          }
        : undefined
    },
    select: linkSelectFields()
  });
};

const getAllOwn = async (
  user: User,
  limit = 10,
  page: number,
  hidden?: boolean,
  deleted?: boolean,
  expired?: boolean
) => {
  const offset = (page - 1) * limit;

  const where: any = {
    userId: user.id
  };

  if (typeof deleted === 'boolean') {
    where.deletedAt = deleted ? { not: null } : null;
  }

  if (typeof hidden === 'boolean') {
    where.isHidden = hidden;
  }

  if (typeof expired === 'boolean') {
    where.isExpired = expired;
  }

  const [links, total] = await prisma.$transaction([
    prisma.link.findMany({
      where,
      select: linkSelectFields(),
      skip: offset,
      take: limit
    }),
    prisma.link.count({
      where
    })
  ]);

  return {
    links,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  };
};

const getAll = async (
  showMe: boolean,
  user: User,
  limit = 10,
  page = 1,
  hidden?: boolean,
  deleted?: boolean,
  expired?: boolean
) => {
  const offset = (page - 1) * limit;

  const where: any = showMe
    ? {
        ...(typeof hidden === 'boolean' ? { isHidden: hidden } : {}),
        ...(typeof deleted === 'boolean' ? { deletedAt: deleted ? { not: null } : null } : {}),
        ...(typeof expired === 'boolean' ? { isExpired: expired } : {})
      }
    : {
        userId: {
          not: user.id
        },
        ...(typeof hidden === 'boolean' ? { isHidden: hidden } : {}),
        ...(typeof deleted === 'boolean' ? { deletedAt: deleted ? { not: null } : null } : {}),
        ...(typeof expired === 'boolean' ? { isExpired: expired } : {})
      };

  const [links, total] = await prisma.$transaction([
    prisma.link.findMany({
      where,
      select: linkSelectFields(),
      skip: offset,
      take: limit
    }),
    prisma.link.count({
      where
    })
  ]);

  return {
    links,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  };
};

const generateShortCode = async (): Promise<string> => {
  return uuid().slice(0, 8);
};

const ensureShortURLUnique = async (shortCode: string) => {
  const existing = await prisma.link.findUnique({
    where: { shortCode }
  });
  if (existing) throw new ApiError(400, 'Short URL has been used');
};

const getById = async (user: User, id: string) => {
  const link = await prisma.link.findFirst({
    where: {
      id: Number(id),
      userId: user.id,
      deletedAt: null
    }
  });

  if (!link) throw new ApiError(404, 'Link not found');
  return link;
};

const setHidden = async (user: User, id: string, isHidden: boolean) => {
  const link = await prisma.link.findFirst({
    where: {
      id: Number(id),
      userId: user.id
    }
  });

  if (!link) throw new ApiError(404, 'Link not found');

  if (link.isHidden === isHidden)
    throw new ApiError(400, 'Link already has the same hidden status');

  return prisma.link.update({
    where: {
      id: link.id
    },
    data: {
      isHidden
    }
  });
};

const update = async (user: User, id: string, data: Partial<Link> & { utm?: Partial<UTM> }) => {
  const link = await prisma.link.findFirst({
    where: {
      id: Number(id),
      userId: user.id
    },
    include: {
      UTM: true
    }
  });

  if (!link) throw new ApiError(404, 'Link not found');

  await ensureShortURLUnique(data.shortCode || '');

  return prisma.link.update({
    where: {
      id: link.id
    },
    data: {
      shortCode: data.shortCode || link.shortCode,
      expiresAt: data.expiresAt || link.expiresAt,
      isExpired: data.isExpired || link.isExpired,
      isHidden: data.isHidden || link.isHidden,
      UTM: {
        upsert: {
          create: {
            ...data.utm
          },
          update: {
            ...data.utm
          }
        }
      }
    },
    select: linkSelectFields()
  });
};

const softDelete = async (user: User, id: string) => {
  const link = await prisma.link.findFirst({
    where: {
      id: Number(id),
      userId: user.id,
      deletedAt: null
    }
  });

  if (!link) throw new ApiError(404, 'Link not found');

  return prisma.link.update({
    where: {
      id: link.id
    },
    data: {
      deletedAt: new Date()
    }
  });
};

const restore = async (user: User, id: string) => {
  const link = await prisma.link.findFirst({
    where: {
      id: Number(id),
      userId: user.id,
      deletedAt: { not: null }
    }
  });

  if (!link) throw new ApiError(404, 'Link not found');

  return prisma.link.update({
    where: {
      id: link.id
    },
    data: {
      deletedAt: null
    }
  });
};

const removeUTM = async (user: User, id: string) => {
  const link = await prisma.link.findFirst({
    where: {
      id: Number(id),
      userId: user.id
    },
    include: {
      UTM: true
    }
  });

  if (!link) throw new ApiError(404, 'Link not found');

  if (!link.UTM) throw new ApiError(400, 'Link does not have UTM');

  return prisma.link.update({
    where: {
      id: link.id
    },
    data: {
      UTM: {
        delete: true
      }
    },
    select: linkSelectFields()
  });
};

// TODO - Visit and redirect Link
// TODO - QR Code

export default {
  create,
  getAllOwn,
  getAll,
  getById,
  setHidden,
  update,
  softDelete,
  restore,
  removeUTM
};
