import { Router } from 'express';

import { uploadSavFile, createSavFile } from '../controllers/savController';

const router = Router();

router.post('/upload', uploadSavFile);
router.post('/create', createSavFile);
router.get('/', (req, res) => {
    res.status(200).send('OK');
});
export { router as savRouter };