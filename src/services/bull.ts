import { Queue } from 'bullmq';
import { Worker, Job } from 'bullmq';
const queueName = 'schedule-jobs';

new Worker(
  queueName,
  async (job: Job) => {
    console.log('got job', job.data);
  },
  { connection: { host: 'localhost' } }
);

const queue = new Queue(queueName, { connection: { host: 'localhost' } });

await queue.add('call', { data: '' });
console.log('data was sent');
export { queue };
