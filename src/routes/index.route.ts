import express from 'express';
import { linkController } from '../controllers';
import config from '../config/config';

const router = express.Router();

router.route('/').get((req, res) => {
  res.redirect(config.frontendUrl);
});
router.route('/:code').get(linkController.redirect);

export default router;
