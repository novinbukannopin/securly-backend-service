import express from 'express';
import validate from '../../middlewares/validate';
import reviewValidation from '../../validations/review.validation';
import { reviewController } from '../../controllers';
import auth from '../../middlewares/auth';

const router = express.Router();

router.route('/').post(validate(reviewValidation), reviewController.createOrUpdateUrlWithReview);
router.route('/').get(auth('review:get-all'), reviewController.getAll);

export default router;
