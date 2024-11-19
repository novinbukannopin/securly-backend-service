import express from 'express';
import { linkController } from '../../controllers';
import auth from '../../middlewares/auth';
import validate from '../../middlewares/validate';
import { linkValidation } from '../../validations';

const router = express.Router();

router
  .route('/shorten')
  .post(auth('createLink'), validate(linkValidation.createLink), linkController.create);

router.route('/').get(auth('getAllOwnLinks'), linkController.getAllOwnLinks);
router.route('/all').get(auth('getAllLinks'), linkController.getAllLinks);

export default router;
