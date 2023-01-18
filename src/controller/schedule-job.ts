import { Request, Response } from 'express';
import { queue } from '../services/bull.js';
import { v4 as uuidv4 } from 'uuid';
import dayjs, { Dayjs } from 'dayjs';
import logger from '../logger/index.js';

export class ScheduleController {
  async createScheduleJob(req: Request, res: Response) {
    const when = String(req.body.when);
    logger.info(`when is ${when}`);

    let time: Dayjs;
    if (when.toLocaleLowerCase().startsWith('after ')) {
      time = ScheduleController.getAbsoluteTimeFromRelative(when);
    } else {
      time = dayjs(when);
    }
    logger.info(`time is ${time.toString()}`);
    const isValid = time.isValid();
    if (!isValid) {
      return res
        .status(400)
        .json({ status: 4000, message: 'when is not valid' });
    }
    const jobId = uuidv4();
    const currentTime = dayjs();
    const delay = time.diff(currentTime, 'seconds', false);
    if (delay < 1) {
      return res.status(400).json({
        status: 400,
        message: 'when should be at least after 1 second'
      });
    }
    logger.info(`${jobId} will be processed after ${delay} seconds`);
    await queue.add(
      'call',
      { data: req.body },
      {
        jobId,
        delay: delay * 1000, // second to ms
        removeOnComplete: true,
        removeOnFail: true
      }
    );
    return res.status(200).json({ jobId, when: time });
  }

  async deleteScheduleJobById(req: Request, res: Response) {
    // await queue.removeJobs(`${req.params.id}`);
    const id = req.params.id;
    const job = await queue.getJob(id);
    if (!job) {
      return res.status(404).json({ status: 404, message: 'job not found' });
    }
    await job.remove();
    return res.status(200).json({ status: 200 });
  }
  async getScheduleJobs(_req: Request, res: Response) {
    const jobs = await queue.getJobs(['delayed']);
    const result = jobs.map((job) => {
      const data = job.data;
      return { id: job.id, ...data };
    });
    return res.status(200).json({ status: 200, jobs: result });
  }

  async getScheduleJobById(req: Request, res: Response) {
    const id = req.params.id;
    const job = await queue.getJob(req.params.id);
    if (!job) {
      return res.status(404).json({ status: 404, message: 'job not found' });
    }
    return res.status(200).json({ id, ...job.data });
  }

  public static getAbsoluteTimeFromRelative(relativeTime: string): Dayjs {
    try {
      let [_relative, value, unit] = relativeTime.split(' ');
      return dayjs().add(+value, unit);
    } catch (e) {
      if (e instanceof Error) {
        logger.error(e.stack);
      }
      throw new Error('INVALID_TIME');
    }
  }
}

export const scheduleController = new ScheduleController();
