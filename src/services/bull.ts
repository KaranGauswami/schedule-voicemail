import Bull from 'bull';

const queue = new Bull('call-queue', { redis: { host: 'fs.karanss.com' } });

export { queue };
