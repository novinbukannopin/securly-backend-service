import { v4 as uuid } from 'uuid';
import prisma from '../client';
import { User, Link, UTM, LinkType } from '@prisma/client';
import ApiError from '../utils/ApiError';
import { CreateLinkBody } from '../types/link';
import { CustomParamsDictionary } from '../utils/catchAsync';
import * as QueryString from 'node:querystring';
import { UAParser } from 'ua-parser-js';
import { IPinfoWrapper } from 'node-ipinfo';
import config from '../config/config';

const linkSelectFields = () => ({
  id: true,
  userId: true,
  originalUrl: true,
  shortCode: true,
  type: true,
  comments: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  expiresAt: true,
  expiredRedirectUrl: true,
  UTM: true,
  qrcode: true,
  TagLink: {
    select: {
      tag: {
        select: {
          name: true
        }
      }
    }
  }
});

const create = async (data: Partial<CreateLinkBody>, user: User) => {
  const isUserAvailable = await prisma.user.findUnique({
    where: { id: user.id }
  });
  if (!isUserAvailable) throw new ApiError(401, 'User not found');

  const shortCode = data.shortCode || (await generateShortCode());
  await ensureShortURLUnique(shortCode);

  return prisma.link.create({
    data: {
      type: data.type || LinkType.BENIGN,
      userId: user.id,
      originalUrl: data.originalUrl || '',
      comments: data.comments || null,
      shortCode,
      expiresAt: data.expiration?.datetime || null,
      expiredRedirectUrl: data.expiration?.url || null,
      qrcode: data.qrcode || null,
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
        : undefined,
      TagLink: {
        create: data.tags
          ? data.tags.map((tag) => ({
              tag: {
                connectOrCreate: {
                  where: { name: tag },
                  create: { name: tag }
                }
              }
            }))
          : []
      }
    },
    select: linkSelectFields()
  });
};

const getAllOwn = async (
  user: User,
  limit = 10,
  page: number,
  hidden?: boolean,
  deleted?: boolean
) => {
  const offset = (page - 1) * limit;

  const where: any = {
    userId: user.id
  };

  if (typeof deleted === 'boolean') {
    where.deletedAt = deleted ? { not: null } : null;
  }

  const [links, total] = await prisma.$transaction([
    prisma.link.findMany({
      where,
      // select: linkSelectFields(),
      orderBy: {
        createdAt: 'desc'
      },
      skip: offset,
      take: limit,
      include: {
        _count: {
          select: {
            Click: true
          }
        },
        TagLink: {
          select: {
            tag: {
              select: {
                name: true
              }
            }
          }
        }
      }
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

// const setHidden = async (user: User, id: string, isHidden: boolean) => {
//   const link = await prisma.link.findFirst({
//     where: {
//       id: Number(id),
//       userId: user.id
//     }
//   });
//
//   if (!link) throw new ApiError(404, 'Link not found');
//
//   if (link.isHidden === isHidden)
//     throw new ApiError(400, 'Link already has the same hidden status');
//
//   return prisma.link.update({
//     where: {
//       id: link.id
//     },
//     data: {
//       isHidden
//     }
//   });
// };

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

const goto = async (code: string, ip?: string, userAgent?: string) => {
  const ipinfoWrapper = new IPinfoWrapper(config.ipinfoToken);

  const link = await prisma.link.findFirst({
    where: {
      shortCode: code
    },
    select: {
      originalUrl: true,
      id: true
    }
  });

  if (!link) {
    throw new ApiError(404, 'Link not found');
  }

  const details = await ipinfoWrapper.lookupIp(ip as string);
  const UA = UAParser(userAgent);

  if (details || UA) {
    await prisma.click.create({
      data: {
        ip: details?.ip || '',
        region: details?.region || '',
        country: details?.country || '',
        loc: details?.loc || '',
        org: details?.org || '',
        postal: details?.postal || '',
        timezone: details?.timezone || '',
        countryCode: details?.countryCode || '',
        Link: {
          connect: {
            id: link.id
          }
        },
        userAgent: {
          create: {
            ua: UA.ua,
            browser: UA.browser.name,
            browserVersion: UA.browser.version,
            os: UA.os.name,
            osVersion: UA.os.version,
            cpuArch: UA.cpu.architecture,
            deviceType: UA.device.type,
            engine: UA.engine.name
          }
        }
      }
    });
  }

  return link;
};

export default {
  create,
  getAllOwn,
  getAll,
  getById,
  update,
  softDelete,
  restore,
  removeUTM,
  goto
};
