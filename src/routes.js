import { Router } from 'express';
import multer from 'multer';
import multerConfig from './config/multer';

import auth from './app/middleware/auth';

import UserController from './app/controllers/UserController';
import SessionController from './app/controllers/SessionController';

const routes = new Router();
const upload = multer(multerConfig);

routes.post('/users', UserController.store);
routes.post('/session', SessionController.store);

routes.use(auth);

routes.put('/users', UserController.update);

routes.post('/files', upload.single('file'), (req, res) =>
  res.json({ ok: true })
);

export default routes;
