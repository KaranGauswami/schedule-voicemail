import { Router } from 'express';
import {
  createScheduleJob,
  deleteScheduleJobById,
  getScheduleJobs,
  getScheduleJobById
} from './controller/schedule-job';
const router = Router();

router.get('/v1/jobs/:id', getScheduleJobById);
router.delete('/v1/jobs/:id', deleteScheduleJobById);
router.post('/v1/jobs', createScheduleJob);
router.get('/v1/jobs', getScheduleJobs);

export default router;
