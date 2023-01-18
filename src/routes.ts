import { Router } from 'express';
import { scheduleController } from './controller/schedule-job.js';
const router = Router();

router.get('/v1/jobs/:id', scheduleController.getScheduleJobById);
router.delete('/v1/jobs/:id', scheduleController.deleteScheduleJobById);
router.post('/v1/jobs', scheduleController.createScheduleJob);
router.get('/v1/jobs', scheduleController.getScheduleJobs);

export default router;
