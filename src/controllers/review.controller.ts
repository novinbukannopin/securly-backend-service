import catchAsync from '../utils/catchAsync';
import { reviewService } from '../services';

const createOrUpdateUrlWithReview = catchAsync(async (req, res) => {
  const { originalUrl, type, reviewerId, action, reason, evidence } = req.body;
  const review = await reviewService.createOrUpdateUrlWithReview({
    originalUrl,
    type,
    reviewerId,
    action,
    reason,
    evidence
  });
  res.status(201).send(review);
});

const getAll = catchAsync(async (req, res) => {
  const reviews = await reviewService.getAll();
  res.status(200).send(reviews);
});

export default {
  createOrUpdateUrlWithReview,
  getAll
};
