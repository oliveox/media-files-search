import gallery_controller from '../controllers/gallery';

import express from "express";
const router = express.Router();
import bodyParser from 'body-parser';

router.get('/', gallery_controller.gallery_index);
router.post('/search', bodyParser.text({type: '*/*'}), gallery_controller.gallery_search);

export default router;