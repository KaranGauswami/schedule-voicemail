import { queue } from '../services/bull';
queue.process('schedule-jobs', function (job, done) {
  console.log('job', job.data);
  done();
});
