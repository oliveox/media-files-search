import analyseByRootPath from '../controllers/analyse';

import express from 'express';
const router = express.Router();
import bodyParser from 'body-parser';

router.post('/', bodyParser.text({type: '*/*'}), analyseByRootPath);

export default router;