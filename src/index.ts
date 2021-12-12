import express from 'express';
import morgan from 'morgan';
import { logger } from './logger';
import routes from './routes';
const app = express();
const port = process.env['NODE_APP_PORT'] || 3000;

app.use(morgan('tiny'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use('/api', routes);
app.listen(port, () => {
  logger.info(`Listening on port ${port}`);
});
