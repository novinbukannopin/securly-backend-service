import prisma from '../client';
import { User, Link, UTM, LinkType } from '@prisma/client';
import ApiError from '../utils/ApiError';
import { CreateLinkBody } from '../types/link';
import { UAParser } from 'ua-parser-js';
import { IPinfoWrapper } from 'node-ipinfo';
import config from '../config/config';
import { subDays } from 'date-fns';
import { uuid } from 'uuidv4';

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
        UTM: true,
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

  const tags = await getUniqueTagsByUser(user);

  return {
    links,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    tags: tags
  };
};

const getUniqueTagsByUser = async (user: User) => {
  const tags = await prisma.tag.findMany({
    where: {
      TagLink: {
        some: {
          link: {
            userId: user.id
          }
        }
      }
    },
    select: {
      name: true
    }
  });

  return tags.map((tag) => tag.name);
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

const update = async (
  user: User,
  id: string,
  data: Partial<Link> & { utm?: Partial<UTM>; tags?: string[] }
) => {
  const link = await prisma.link.findFirst({
    where: {
      id: Number(id),
      userId: user.id
    },
    include: {
      UTM: true,
      TagLink: {
        include: {
          tag: true
        }
      }
    }
  });

  if (!link) throw new ApiError(404, 'Link not found');

  await ensureShortURLUnique(data.shortCode || '');

  const tagIds = await Promise.all(
    (data.tags || []).map(async (tagName) => {
      const tag = await prisma.tag.upsert({
        where: { name: tagName },
        update: {}, // No update needed for existing tags
        create: { name: tagName }
      });
      return tag.id;
    })
  );

  await prisma.tagLink.deleteMany({
    where: {
      linkId: link.id,
      tagId: {
        notIn: tagIds
      }
    }
  });

  const existingTagIds = link.TagLink.map((tagLink) => tagLink.tagId);
  const newTagIds = tagIds.filter((id) => !existingTagIds.includes(id));

  await prisma.tagLink.createMany({
    data: newTagIds.map((tagId) => ({
      linkId: link.id,
      tagId
    }))
  });

  return prisma.link.update({
    where: {
      id: link.id
    },
    data: {
      shortCode: data.shortCode || link.shortCode,
      expiresAt: data.expiresAt || link.expiresAt,
      expiredRedirectUrl: data.expiredRedirectUrl || link.expiredRedirectUrl,
      qrcode: data.qrcode || link.qrcode,
      comments: data.comments || link.comments,
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
      id: true,
      deletedAt: true
    }
  });

  if (!link) {
    throw new ApiError(404, 'Link not found');
  }

  if (link.deletedAt) {
    throw new ApiError(404, 'Link has been deleted');
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

const archive = async (user: User, id: string, action: 'archive' | 'unarchive') => {
  const link = await prisma.link.findFirst({
    where: {
      id: Number(id),
      userId: user.id
    }
  });

  if (!link) throw new ApiError(404, 'Link not found');

  const isArchived = !!link.deletedAt;

  if (action === 'archive' && isArchived) {
    throw new ApiError(400, 'Link is already archived');
  }

  if (action === 'unarchive' && !isArchived) {
    throw new ApiError(400, 'Link is not archived');
  }

  return prisma.link.update({
    where: {
      id: link.id
    },
    data: {
      deletedAt: action === 'archive' ? new Date() : null
    }
  });
};

const getAnalytics = async (user: User) => {
  const topClickedLinks = await prisma.link.findMany({
    where: {
      userId: user.id
    },
    include: {
      Click: true
    }
  });

  const topLinks = topClickedLinks
    .map((link) => ({
      shortCode: link.shortCode,
      clicks: link.Click.length,
      originalUrl: link.originalUrl
    }))
    .sort((a, b) => b.clicks - a.clicks) // Sort by clicks descending
    .slice(0, 5); // Take top 5

  const neverClickedLinks = await prisma.link.findMany({
    where: {
      userId: user.id,
      Click: {
        none: {} // No clicks associated with the link
      }
    },
    select: {
      shortCode: true,
      originalUrl: true,
      createdAt: true
    }
  });

  const transformedNeverClickedLinks = neverClickedLinks
    .map((link) => ({
      shortCode: link.shortCode,
      originalUrl: link.originalUrl,
      createdAt: link.createdAt.toISOString().split('T')[0] // Format date
    }))
    .slice(0, 5); // Take top 5

  const startOfThisWeek = new Date();
  startOfThisWeek.setDate(startOfThisWeek.getDate() - startOfThisWeek.getDay());
  startOfThisWeek.setHours(0, 0, 0, 0);

  const startOfLastWeek = new Date(startOfThisWeek);
  startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);

  const endOfLastWeek = new Date(startOfThisWeek);
  endOfLastWeek.setDate(endOfLastWeek.getDate() - 1);

  // Total overall
  const totalLinksOverall = await prisma.link.count({ where: { userId: user.id } });
  const activeLinksOverall = await prisma.link.count({
    where: { userId: user.id, expiresAt: null, deletedAt: null }
  });
  const expiredLinksOverall = await prisma.link.count({
    where: { userId: user.id, expiresAt: { not: null } }
  });
  const archivedLinksOverall = await prisma.link.count({
    where: { userId: user.id, deletedAt: { not: null } }
  });

  // This week
  const totalLinksThisWeek = await prisma.link.count({
    where: {
      userId: user.id,
      createdAt: { gte: startOfThisWeek }
    }
  });
  const activeLinksThisWeek = await prisma.link.count({
    where: {
      userId: user.id,
      expiresAt: null,
      deletedAt: null,
      createdAt: { gte: startOfThisWeek }
    }
  });
  const expiredLinksThisWeek = await prisma.link.count({
    where: {
      userId: user.id,
      expiresAt: { not: null },
      createdAt: { gte: startOfThisWeek }
    }
  });
  const archivedLinksThisWeek = await prisma.link.count({
    where: {
      userId: user.id,
      deletedAt: { not: null },
      createdAt: { gte: startOfThisWeek }
    }
  });

  // Last week
  const totalLinksLastWeek = await prisma.link.count({
    where: {
      userId: user.id,
      createdAt: { gte: startOfLastWeek, lte: endOfLastWeek }
    }
  });
  const activeLinksLastWeek = await prisma.link.count({
    where: {
      userId: user.id,
      expiresAt: null,
      deletedAt: null,
      createdAt: { gte: startOfLastWeek, lte: endOfLastWeek }
    }
  });
  const expiredLinksLastWeek = await prisma.link.count({
    where: {
      userId: user.id,
      expiresAt: { not: null },
      createdAt: { gte: startOfLastWeek, lte: endOfLastWeek }
    }
  });
  const archivedLinksLastWeek = await prisma.link.count({
    where: {
      userId: user.id,
      deletedAt: { not: null },
      createdAt: { gte: startOfLastWeek, lte: endOfLastWeek }
    }
  });

  // Percentage changes
  const calculatePercentageChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const tagsUsage = await prisma.tag.findMany({
    where: {
      TagLink: {
        some: {
          link: {
            userId: user.id
          }
        }
      }
    },
    include: {
      TagLink: {
        where: {
          link: {
            userId: user.id
          }
        }
      }
    }
  });

  const listTags = tagsUsage.map((tag) => tag.name);

  const tagsWithUsage = tagsUsage.map((tag) => ({
    tagName: tag.name,
    usageCount: tag.TagLink.length
  }));

  const linkTypes = await prisma.link.groupBy({
    where: {
      userId: user.id
    },
    by: ['type'],
    _count: {
      type: true
    }
  });

  return {
    topLinks,
    neverClickedLinks: transformedNeverClickedLinks,
    links: {
      total: {
        overall: totalLinksOverall,
        thisWeek: totalLinksThisWeek,
        lastWeek: totalLinksLastWeek,
        percentageChange: {
          thisWeek: calculatePercentageChange(totalLinksThisWeek, totalLinksLastWeek)
        }
      },
      active: {
        overall: activeLinksOverall,
        thisWeek: activeLinksThisWeek,
        lastWeek: activeLinksLastWeek,
        percentageChange: {
          thisWeek: calculatePercentageChange(activeLinksThisWeek, activeLinksLastWeek)
        }
      },
      expired: {
        overall: expiredLinksOverall,
        thisWeek: expiredLinksThisWeek,
        lastWeek: expiredLinksLastWeek,
        percentageChange: {
          thisWeek: calculatePercentageChange(expiredLinksThisWeek, expiredLinksLastWeek)
        }
      },
      archived: {
        overall: archivedLinksOverall,
        thisWeek: archivedLinksThisWeek,
        lastWeek: archivedLinksLastWeek,
        percentageChange: {
          thisWeek: calculatePercentageChange(archivedLinksThisWeek, archivedLinksLastWeek)
        }
      }
    },
    tags: {
      list: listTags,
      usage: tagsWithUsage
    },
    type: {
      list: linkTypes
    }
  };
};

type InsightRecord = Record<string, number>;

interface Insights {
  location: InsightRecord;
  region: InsightRecord;
  country: InsightRecord;
  browser: InsightRecord;
  browserVersion: InsightRecord;
  os: InsightRecord;
  osVersion: InsightRecord;
  cpuArch: InsightRecord;
  deviceType: InsightRecord;
}

const getClicks = async (
  user: User,
  filter?: '24h' | '7 days' | '28 days',
  startDate?: string,
  endDate?: string,
  shortCode?: string // Tambahkan parameter opsional shortCode
) => {
  let rangeStartDate: Date | undefined;
  let rangeEndDate: Date | undefined;

  if (filter) {
    const now = new Date();
    if (filter === '24h') {
      rangeStartDate = subDays(now, 1); // 1 hari sebelumnya
    } else if (filter === '7 days') {
      rangeStartDate = subDays(now, 7); // 7 hari sebelumnya
    } else if (filter === '28 days') {
      rangeStartDate = subDays(now, 28); // 28 hari sebelumnya
    }
    rangeEndDate = now;
  } else {
    rangeStartDate = startDate ? new Date(startDate) : undefined;
    rangeEndDate = endDate ? new Date(endDate) : undefined;
  }

  // Fetch raw clicks data
  const rawClicksData = await prisma.click.findMany({
    where: {
      Link: {
        userId: user.id,
        ...(shortCode ? { shortCode } : {}), // Filter berdasarkan shortCode jika ada
      },
      timestamp: {
        gte: rangeStartDate,
        lte: rangeEndDate,
      },
    },
    select: {
      Link: {
        select: {
          shortCode: true,
          originalUrl: true,
        },
      },
      timestamp: true,
      location: true,
      region: true,
      country: true,
      userAgent: {
        select: {
          browser: true,
          browserVersion: true,
          os: true,
          osVersion: true,
          cpuArch: true,
          deviceType: true,
        },
      },
    },
  });

  // Process clicks data
  const clicksData = rawClicksData.reduce((acc, curr) => {
    const date = curr.timestamp.toISOString().split('T')[0];
    if (!acc[date]) {
      acc[date] = 0;
    }
    acc[date]++;
    return acc;
  }, {} as Record<string, number>);

  const formattedData = Object.entries(clicksData)
    .map(([date, totalClicks]) => ({
      date,
      totalClicks,
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Count total clicks
  const totalClick = await prisma.click.count({
    where: {
      Link: {
        userId: user.id,
        ...(shortCode ? { shortCode } : {}), // Filter berdasarkan shortCode jika ada
      },
      timestamp: {
        gte: rangeStartDate,
        lte: rangeEndDate,
      },
    },
  });

  // Generate insights
  const insights: Insights = {
    location: {},
    region: {},
    country: {},
    browser: {},
    browserVersion: {},
    os: {},
    osVersion: {},
    cpuArch: {},
    deviceType: {},
  };

  rawClicksData.forEach((click) => {
    const fields: (keyof Insights)[] = [
      'location',
      'region',
      'country',
      'browser',
      'browserVersion',
      'os',
      'osVersion',
      'cpuArch',
      'deviceType',
    ];

    fields.forEach((field) => {
      // @ts-ignore
      const value = click[field] || click.userAgent?.[field];
      if (value) {
        insights[field][value] = (insights[field][value] || 0) + 1;
      }
    });
  });

  return {
    click: {
      data: formattedData,
      totalClick,
    },
    interaction: insights,
  };
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
  goto,
  archive,
  getAnalytics,
  getClicks
};
