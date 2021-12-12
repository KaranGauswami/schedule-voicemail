import { logger } from '../logger';
import { queue } from '../services/bull';
queue.process('schedule-jobs', function (job, done) {
  logger.info('job', job.data);
  done();
});
