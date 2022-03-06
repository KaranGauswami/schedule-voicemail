import express from 'express';
import morgan from 'morgan';
import fs from 'fs';
import logger from './logger';
import routes from './routes';
import swaggerUi from 'swagger-ui-express';
import path from 'path';
import YAML from 'yamljs';
import rateLimit from 'express-rate-limit';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';
import esl from 'modesl';
dotenv.config();

const app = express();
const port = process.env['NODE_APP_PORT'] || 3000;

app.use(morgan('combined'));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
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
app.post('/sns', express.text(), (req, res) => {
  logger.debug({ body: req.body }, `SNS Body`);
  const data = JSON.parse(req.body);
  let message = JSON.parse(data.Message);
  message = message.Records;
  const client = new S3Client({
    region: 'ap-south-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
    }
  });
  message.forEach(async (message: any) => {
    console.log(message);
    const bucketName = message['s3']['bucket']['name'];
    const key = decodeURIComponent(message['s3']['object']['key']);
    console.log(bucketName, key);
    const command = new GetObjectCommand({ Bucket: bucketName, Key: key });
    const output = await client.send(command);
    const filePath = path.resolve('tts_files_voicemail', key);
    const ws = fs.createWriteStream(filePath);
    //@ts-ignore
    output.Body?.pipe(ws);
    const phoneNumber = key.split('/')[0];
    logger.debug(`Phone number is ${phoneNumber}`);
    const eslCommand = `originate {origination_caller_id_number=+11234512345,ignore_early_media=true}[tts_file_path=/home/admin/tts_files_voicemail/${key}]user/1002 &transfer(114092 public XML)`;
    const connection = new esl.Connection(
      'host.docker.internal',
      8021,
      'Cluecon',
      () => {
        // @ts-ignore
        connection.api(eslCommand, (res: any) => {
          console.log(res.getBody());
        });
      }
    );
    // const url = await getSignedUrl(client, command, { expiresIn: 3600 });
    // console.log(url);
  });
  res.status(200).json({});
});
app.all('/*', (req, res) => {
  logger.debug({ body: req.body, headers: req.headers }, 'Unknown route');
  res
    .status(404)
    .json({ status: 404, message: `Router ${req.path} not found.` });
});
app.listen(port, () => {
  logger.info(`Listening on port ${port}`);
});
