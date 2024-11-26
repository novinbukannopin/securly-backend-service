import { v4 as uuid } from 'uuid';
import prisma from '../client';
import type { User, Link, UTM } from '@prisma/client';

const create = async (data: Partial<Link> & { utm?: UTM }, user: User) => {
  const isUserAvailable = await prisma.user.findUnique({
    where: { id: user.id }
  });
  if (!isUserAvailable) throw new Error('User not found');

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
    select: {
      id: true,
      userId: true,
      originalUrl: true,
      shortCode: true,
      expiresAt: true,
      type: true,
      isExpired: true,
      isHidden: true,
      score: true,
      UTM: true
    }
  });
};

const getAllOwn = async (user: User, limit = 10, page: number, isHidden: boolean) => {
  const offset = (page - 1) * limit;
  const [links, total] = await prisma.$transaction([
    prisma.link.findMany({
      where: {
        userId: user.id,
        ...(isHidden ? { isHidden } : {})
      },
      select: {
        id: true,
        userId: true,
        originalUrl: true,
        shortCode: true,
        expiresAt: true,
        type: true,
        isExpired: true,
        isHidden: true,
        score: true,
        UTM: true
      },
      skip: offset,
      take: limit
    }),
    prisma.link.count({
      where: {
        userId: user.id
      }
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

const getAll = async (showMe: boolean, user: User, limit = 10, page = 1, isHidden: boolean) => {
  const offset = (page - 1) * limit;
  const [links, total] = await prisma.$transaction([
    prisma.link.findMany({
      where: showMe
        ? {
            ...(isHidden ? { isHidden } : {})
          }
        : {
            userId: {
              not: user.id
            },
            ...(isHidden ? { isHidden } : {})
          },
      select: {
        id: true,
        userId: true,
        originalUrl: true,
        shortCode: true,
        expiresAt: true,
        type: true,
        isExpired: true,
        isHidden: true,
        score: true,
        UTM: true
      },
      skip: offset,
      take: limit
    }),
    prisma.link.count({
      where: showMe
        ? {}
        : {
            userId: {
              not: user.id
            },
            isHidden
          }
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
  if (existing) throw new Error('Short URL already exists');
};

const getById = async (user: User, id: string) => {
  const link = await prisma.link.findFirst({
    where: {
      id: Number(id),
      userId: user.id,
      isHidden: false
    }
  });

  if (!link) throw new Error('Link not found');
  return link;
};

const setHidden = async (user: User, id: string, isHidden: boolean) => {
  const link = await prisma.link.findFirst({
    where: {
      id: Number(id),
      userId: user.id
    }
  });

  if (!link) throw new Error('Link not found');

  return prisma.link.update({
    where: {
      id: link.id
    },
    data: {
      isHidden
    }
  });
};

export default { create, getAllOwn, getAll, getById, setHidden };
