import prisma from '../client';

const getTotalLinks = async () => {
  return prisma.link.count();
};

const getTotalClicks = async () => {
  return prisma.click.count();
};

const getMostClickedLinks = async (limit = 10) => {
  return await prisma.link.findMany({
    include: {
      Click: true
    },
    orderBy: {
      Click: {
        _count: 'desc'
      }
    },
    take: limit
  });
};

const getUserStatistics = async () => {
  const totalUsers = await prisma.user.count();
  const verifiedUsers = await prisma.user.count({ where: { isEmailVerified: true } });
  const unverifiedUsers = await prisma.user.count({ where: { isEmailVerified: false } });

  return {
    totalUsers: totalUsers,
    verifiedUsers: verifiedUsers,
    unverifiedUsers: unverifiedUsers
  };
};

export default {
  getTotalLinks,
  getTotalClicks,
  getMostClickedLinks,
  getUserStatistics
};
