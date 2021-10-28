import display_filesystem from '../controllers/display';

import express from 'express';
const router = express.Router();
import bodyParser from 'body-parser';

router.post('/', bodyParser.text({type: '*/*'}), display_filesystem);

export default router;