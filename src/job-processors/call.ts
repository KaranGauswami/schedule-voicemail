import { queue } from '../services/bull';
import { PollyClient, SynthesizeSpeechCommand } from '@aws-sdk/client-polly';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

queue.process('schedule-jobs', async function (job, done) {
  const data = job.data.data;
  console.log(data);
  if (!data.message) {
    console.log('no message was found');
    done();
  }
  await generateTextToSpeech(data.number, data.message);
  done();
});

async function generateTextToSpeech(number: string, text: string) {
  try {
    const client = new PollyClient({
      region: 'ap-south-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
      }
    });
    const command = new SynthesizeSpeechCommand({
      Text: text,
      OutputFormat: 'mp3',
      SampleRate: '8000',
      VoiceId: 'Matthew'
    });
    const output = await client.send(command);
    const s3client = new S3Client({
      region: 'ap-south-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
      }
    });
    const fileName = `${randomUUID()}.mp3`;
    const writes = fs.createWriteStream(fileName, { encoding: 'binary' });
    // // console.log(output.AudioStream);
    if (!output.AudioStream) {
      throw new Error('audio stream is null');
    }
    for await (const data of output.AudioStream) {
      writes.write(data);
    }
    // output.AudioStream?.pipe(writes);

    const putCommand = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME || '',
      Body: fs.createReadStream(fileName),
      Key: `${randomUUID()}.mp3`,
      Metadata: {
        number: number
      }
    });
    await s3client.send(putCommand);
    fs.unlinkSync(fileName);
  } catch (e) {
    if (e instanceof Error) {
      console.error(e.message);
    } else {
      console.error(e);
    }
  }
}
