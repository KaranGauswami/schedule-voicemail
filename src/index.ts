import express from 'express';
import morgan from 'morgan';
import { logger } from './logger';
import routes from './routes';
import swaggerUi from 'swagger-ui-express';
import path from 'path';
import YAML from 'yamljs';
import rateLimit from 'express-rate-limit';

const app = express();
const port = process.env['NODE_APP_PORT'] || 3000;

app.use(morgan('combined'));
app.use(express.urlencoded({ extended: false }));
const swaggerDocument = YAML.load(path.resolve(__dirname, '..', 'swagger.yml'));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Enable if you're behind a reverse proxy (Heroku, Bluemix, AWS ELB or API Gateway, Nginx, etc)
// see https://expressjs.com/en/guide/behind-proxies.html
// app.set('trust proxy', 1);

const apiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 60 minutes
  max: 100,
  message:
    'Too many requests created from this IP, please try again after sometime'
});

app.use('/api/', apiLimiter);
app.use('/api/', routes);
app.listen(port, () => {
  logger.info(`Listening on port ${port}`);
});
