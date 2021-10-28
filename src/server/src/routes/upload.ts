import analyseByRootPath from '../controllers/analyse';
import upload_files from '../controllers/upload';

import express from 'express';
const router = express.Router();
import bodyParser from 'body-parser';

router.post('/', upload_files);

export default router;