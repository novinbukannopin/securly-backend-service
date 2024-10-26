import { CreateLinkDTO } from '../dto/create.link';
import { v4 as uuid } from 'uuid';
import prisma from '../client';

const createLink = async (data: CreateLinkDTO) => {
  const {
    originalURL,
    shortURL,
    utmCampaign,
    utmContent,
    utmMedium,
    utmSource,
    utmTerm,
    expiresAt
  } = data;
  return prisma.link.create({
    data: {
      originalUrl: originalURL,
      shortCode: shortURL ? shortURL : await generateShortURL(shortURL),
      expiresAt,
      UTM: {
        create: {
          campaign: utmCampaign,
          content: utmContent,
          medium: utmMedium,
          source: utmSource,
          term: utmTerm
        }
      },
      type: 'BENIGN',
      userId: 1
    },
    include: {
      UTM: true
    }
  });
};

export const generateShortURL = async (shortURL?: string) => {
  if (shortURL) {
    return shortURL;
  } else {
    return uuid().slice(0, 8);
  }
};

export default { generateShortURL, createLink };
