import { queue } from '../services/bull';
import {
  PollyClient,
  StartSpeechSynthesisTaskCommand
} from '@aws-sdk/client-polly';
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
    const command = new StartSpeechSynthesisTaskCommand({
      Text: text,
      OutputFormat: 'mp3',
      SampleRate: '8000',
      VoiceId: 'Matthew',
      OutputS3KeyPrefix: `${number}/`,
      OutputS3BucketName: process.env.AWS_BUCKET_NAME
    });
    await client.send(command);
  } catch (e) {
    if (e instanceof Error) {
      console.error(e.message);
    } else {
      console.error(e);
    }
  }
}
