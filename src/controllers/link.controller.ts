import catchAsync from '../utils/catchAsync';
import { linkService } from '../services';
import httpStatus from 'http-status';
import type { Link, User, UTM } from '@prisma/client';
import { extractParamsGet } from '../utils/extractParamsGet';
import { AnalyticsData } from '../types/response';
import config from '../config/config';
import urlMetadata from 'url-metadata';

const create = catchAsync(async (req, res) => {
  const user: User = req.user as User;
  const response: any = await linkService.create(req.body, user);

  res.status(httpStatus.CREATED).send({
    code: httpStatus.CREATED.toPrecision(),
    message: 'Link created successfully',
    data: response
  });
});

const getAll = catchAsync(async (req, res) => {
  const showMe: boolean = req.query.show_me !== undefined ? req.query.show_me === 'true' : false;
  const { user, page, limit, includeHidden, includeDeleted } = extractParamsGet(req);

  const links = await linkService.getAll(showMe, user, limit, page, includeHidden, includeDeleted);
  res.status(httpStatus.OK).send(links);
});

const getAllOwn = catchAsync(async (req, res) => {
  const { user, page, limit, includeHidden, includeDeleted } = extractParamsGet(req);

  const links = await linkService.getAllOwn(user, limit, page, includeHidden, includeDeleted);
  res.status(httpStatus.OK).send(links);
});

const getById = catchAsync(async (req, res) => {
  const user: User = req.user as User;

  const link = await linkService.getById(user, req.params.id);
  res.status(httpStatus.OK).send(link);
});

// const updateIsHidden = catchAsync(async (req, res) => {
//   const user: User = req.user as User;
//   const { isHidden } = req.body;
//
//   const response = await linkService.setHidden(user, req.params.id, isHidden);
//   res.status(httpStatus.CREATED).send({
//     code: httpStatus.CREATED.toPrecision(),
//     message: 'Link hidden status updated successfully',
//     data: response
//   });
// });

const archive = catchAsync(async (req, res) => {
  const user: User = req.user as User;
  const action = req.body.action as 'archive' | 'unarchive';

  const response = await linkService.archive(user, req.params.id, action);
  res.status(httpStatus.OK).send({
    code: httpStatus.OK.toPrecision(),
    message: `Link ${action} successfully`,
    data: response
  });
});

const update = catchAsync(async (req, res) => {
  const user: User = req.user as User;
  const data: Partial<Link> & { utm?: Partial<UTM>; tag?: string[] } = req.body;

  const response = await linkService.update(user, req.params.id, data);

  res.status(httpStatus.OK).send({
    code: httpStatus.OK,
    message: 'Link updated successfully',
    data: response
  });
});

const deleted = catchAsync(async (req, res) => {
  const user: User = req.user as User;

  await linkService.softDelete(user, req.params.id);
  res.status(httpStatus.OK).send({
    code: httpStatus.OK.toPrecision(),
    message: 'Link deleted successfully'
  });
});

const restore = catchAsync(async (req, res) => {
  const user: User = req.user as User;

  const response = await linkService.restore(user, req.params.id);
  res.status(httpStatus.OK).send({
    code: httpStatus.OK.toPrecision(),
    message: 'Link restored successfully',
    data: response
  });
});

const removeUTM = catchAsync(async (req, res) => {
  const user: User = req.user as User;

  const response = await linkService.removeUTM(user, req.params.id);
  res.status(httpStatus.OK).send({
    code: httpStatus.OK.toPrecision(),
    message: 'UTM removed successfully',
    data: response
  });
});

const redirect = catchAsync(async (req, res) => {
  const { code } = req.params;
  const headers = req.headers;
  const { ip, userAgent } = { ip: headers['x-forwarded-for'], userAgent: headers['user-agent'] };
  const IP = '2a09:bac1:34e0:50::da:50';

  try {
    const response = await linkService.goto(code, IP, userAgent);
    const metadata = await urlMetadata(response.originalUrl);
    res.status(200).send(`
      <html>
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta property="og:image" content="${metadata['og:image']}">
          <meta property="og:description" content="${metadata.description}">
          <meta property="og:title" content="${metadata.title}">
          <meta http-equiv="refresh" content="0;url=${response.originalUrl}">
          <script>
              window.location.href = "${response.originalUrl}";
          </script>
      </head>
      <body class="h-screen flex justify-center items-center bg-gray-200">
          <div class="relative flex justify-center items-center text-center h-full">
              <div class="absolute flex flex-col justify-center items-center gap-2 md:gap-8 lg:gap-12 mt-8 pt-0 md:pt-8">
                  <p class="text-xs lg:text-lg font-regular animate-bounce">
                      Redirecting ...
                  </p>
              </div>
          </div>
      </body>
      </html>
  `);
  } catch (e) {
    res.redirect(config.frontendUrl + '/404');
  }
});

const getAnalytics = catchAsync(async (req, res) => {
  const user: User = req.user as User;
  const response = await linkService.getAnalytics(user);
  res.status(httpStatus.OK).send(response);
});

export const getAnalyticsClicks = catchAsync(async (req, res) => {
  const { filter, startDate, endDate, shortCode } = req.query;

  const user = req.user as User;

  if (filter && !['24h', '7 days', '28 days'].includes(filter as string)) {
    throw new Error('Invalid filter');
  }

  const clickData = await linkService.getClicks(
    user,
    filter as '24h' | '7 days' | '28 days',
    startDate as string | undefined,
    endDate as string | undefined,
    shortCode as string | undefined
  );

  res.status(httpStatus.OK).send(clickData);
});

export default {
  create,
  getAll,
  getAllOwn,
  getById,
  update,
  deleted,
  restore,
  removeUTM,
  redirect,
  archive,
  getAnalytics,
  getAnalyticsClicks
};
