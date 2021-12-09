import { Request, Response } from 'express';
import { queue } from '../services/bull';
import { v4 as uuidv4 } from 'uuid';
import dayjs, { Dayjs } from 'dayjs';

export async function createScheduleJob(req: Request, res: Response) {
  const when = String(req.body.when);

  let time: Dayjs;
  if (when.toLocaleLowerCase().startsWith('after ')) {
    time = getAbsoluteTimeFromRelative(when);
    console.log('time is ', time.toString());
  } else {
    time = dayjs(when);
  }
  const isValid = time.isValid();
  if (!isValid) {
    return res.status(400).json({ status: 4000, message: 'when is not valid' });
  }
  const jobId = uuidv4();
  const currentTime = dayjs();
  const delay = time.diff(currentTime, 'seconds', false);
  console.log(`after ${delay} seconds`);
  await queue.add('schedule-jobs', req.body, {
    jobId,
    delay: delay * 1000, // second to ms
    removeOnComplete: true
  });
  return res.status(200).json({ jobId, when: time });
}

export function deleteScheduleJobById(req: Request, res: Response) {
  console.log(`path param is ${req.params.id}`);
  queue.removeJobs(`${req.params.id}`);
  return res.status(200).json({});
}
export async function getScheduleJobs(_req: Request, res: Response) {
  let jobs = await queue.getJobs(['delayed']);
  const result = jobs.forEach((job) => {
    return job.data;
  });
  return res.status(200).json({ jobs: result });
}

export function getScheduleJobById(_req: Request, res: Response) {
  return res.status(200).json({});
}

function getAbsoluteTimeFromRelative(relativeTime: string): Dayjs {
  try {
    let [_relative, value, unit] = relativeTime.split(' ');
    let time = dayjs().add(+value, unit);
    console.log(time.toISOString());
    console.log('gotcha');
    return time;
  } catch (e) {
    if (e instanceof Error) {
      console.log(e.message);
    }
    throw new Error('INVALID_TIME');
  }
}
