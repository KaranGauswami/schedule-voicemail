import express from 'express';
import morgan from 'morgan';
import { logger } from './logger';
import routes from './routes';
import swaggerUi from 'swagger-ui-express';
import path from 'path';
import YAML from 'yamljs';

const app = express();
const port = process.env['NODE_APP_PORT'] || 3000;

app.use(morgan('tiny'));
app.use(express.urlencoded({ extended: false }));
const swaggerDocument = YAML.load(path.resolve(__dirname, '..', 'swagger.yml'));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use('/api', routes);
app.listen(port, () => {
  logger.info(`Listening on port ${port}`);
});
