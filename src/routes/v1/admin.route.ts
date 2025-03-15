import express from 'express';
import auth from '../../middlewares/auth';
import adminController from '../../controllers/admin.controller';

const router = express.Router();

router.route('/insight').get(auth('admin:get-insight'), adminController.adminAnalytics);

export default router;
