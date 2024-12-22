import express from 'express';
import { linkController } from '../../controllers';
import auth from '../../middlewares/auth';
import validate from '../../middlewares/validate';
import { linkValidation } from '../../validations';

const router = express.Router();

router
  .route('/shorten')
  .post(auth('link:create'), validate(linkValidation.create), linkController.create);

router.route('/').get(auth('link:get-own'), linkController.getAllOwn);

router.route('/all').get(auth('link:get-all'), linkController.getAll);
router.route('/:id').get(auth('link:get-by-id'), linkController.getById);

// router
// .route('/:id/hide')
// .patch(
//   auth('link:update-is-hidden'),
//   validate(linkValidation.isHidden),
//   linkController.updateIsHidden
// );

router
  .route('/:id')
  .patch(auth('link:update'), validate(linkValidation.update), linkController.update);

router.route('/:id').delete(auth('link:delete'), linkController.deleted);
router.route('/:id/remove-utm').delete(auth('link:delete'), linkController.removeUTM);
router.route('/:id/restore').patch(auth('link:delete'), linkController.restore);

export default router;
