import catchAsync from '../utils/catchAsync';
import adminService from '../services/admin.service';
import httpStatus from 'http-status';

const adminAnalytics = catchAsync(async (req, res) => {
  const [totalLinks, totalClicks, mostClickedLinks, userStatistics] = await Promise.all([
    adminService.getTotalLinks(),
    adminService.getTotalClicks(),
    adminService.getMostClickedLinks(),
    adminService.getUserStatistics()
  ]);

  res.status(httpStatus.OK).send({
    code: httpStatus.CREATED.toPrecision(),
    message: 'Admin analytics fetched successfully',
    data: {
      totalLinks: totalLinks,
      totalClicks: totalClicks,
      mostClickedLinks: mostClickedLinks,
      userStatistics: userStatistics
    }
  });
});

export default { adminAnalytics };
