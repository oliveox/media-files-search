import search_getmenu from '../controllers/search';

import express from 'express';
const router = express.Router();
import bodyParser from 'body-parser';

router.get('/menu', search_getmenu);

export default router;