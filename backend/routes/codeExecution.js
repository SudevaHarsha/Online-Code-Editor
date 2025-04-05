// backend/routes/codeExecution.js (Route)
import express from 'express';
import * as codeExecutionController from '../controllers/codeExecutionController.js';
import { authMiddleware } from '../middileware/authMiddileware.js';

const router = express.Router();

router.post('/execute', codeExecutionController.executeCode);
router.get('/files/:userId', codeExecutionController.getUserCode);
router.get('/file/:id', codeExecutionController.getCodeById);
router.post('/files/save-code/:id', codeExecutionController.saveCode);
router.post('/files/create-file', codeExecutionController.createFile);

export default router;