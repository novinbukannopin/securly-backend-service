import express from 'express';
import { linkController } from '../../controllers';
import auth from '../../middlewares/auth';
import validate from '../../middlewares/validate';
import { linkValidation } from '../../validations';

const router = express.Router();

router
  .route('/shorten')
  .post(auth('link:create'), validate(linkValidation.create), linkController.create);

// router.route('/').get(auth('getAllOwnLinks'), linkController.getAllOwnLinks);
router.route('/').get(auth('link:get-own'), linkController.getAllOwn);

router.route('/all').get(auth('link:get-all'), linkController.getAll);
router.route('/:id').get(auth('link:get-by-id'), linkController.getById);
router
  .route('/:id')
  .patch(
    auth('link:update-is-hidden'),
    validate(linkValidation.isHidden),
    linkController.updateIsHidden
  );

// router.route('/:id').patch(auth('updateLink'), linkController.update);

export default router;
