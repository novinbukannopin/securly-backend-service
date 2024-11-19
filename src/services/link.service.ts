import { v4 as uuid } from 'uuid';
import prisma from '../client';
import type { User, Link, UTM } from '@prisma/client';
import { userService } from './index';

const createLink = async (data: { link: Link; utm: UTM }, user: User) => {
  const isUserAvailable = await userService.getUserById(user.id);
  if (!isUserAvailable) {
    throw new Error('User not found');
  }

  const createShort = await generateShortURL(data.link.shortCode);
  const checkShort = await checkUniqueShortURL(createShort);

  return prisma.link.create({
    data: {
      userId: Number(user.id),
      originalUrl: data.link.originalUrl,
      shortCode: createShort,
      expiresAt: data.link.expiresAt,
      type: 'BENIGN',
      isExpired: false,
      isHidden: false,
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
      UTM: true
    }
  });
};

const getAllOwnLinks = async (data: User) => {
  return prisma.link.findMany({
    where: {
      userId: Number(data.id)
    },
    include: {
      UTM: true
    }
  });
};

const getAllLinks = async () => {
  return prisma.link.findMany({
    include: {
      UTM: true
    }
  });
};

export const generateShortURL = async (shortURL?: string | null) => {
  if (shortURL) {
    return shortURL;
  } else {
    return uuid().slice(0, 8);
  }
};

export const checkUniqueShortURL = async (shortURL: string) => {
  const link = await prisma.link.findUnique({
    where: {
      shortCode: shortURL
    }
  });

  if (link) {
    throw new Error('Short URL already exists');
  }

  return link;
};

export const setToHidden = async (type: string) => {
  return type === 'MALICIOUS';
};

export default { generateShortURL, createLink, setToHidden, getAllOwnLinks, getAllLinks };
