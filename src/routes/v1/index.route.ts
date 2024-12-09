import express from 'express';
import { linkController } from '../../controllers';

const router = express.Router();

router.route('/:code').get(linkController.redirect);

export default router;
