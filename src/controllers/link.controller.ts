import catchAsync from '../utils/catchAsync';
import { linkService } from '../services';
import httpStatus from 'http-status';

const createShortLink = catchAsync(async (req, res) => {
  const {
    originalURL,
    shortURL,
    utmCampaign,
    utmContent,
    utmMedium,
    utmSource,
    utmTerm,
    expiresAt
  } = req.body;
  const link = await linkService.createLink({
    originalURL,
    shortURL,
    utmCampaign,
    utmContent,
    utmMedium,
    utmSource,
    utmTerm,
    expiresAt
  });
  res.status(httpStatus.CREATED).send(link);
});

export default { createShortLink };
