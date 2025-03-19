import { CronJob } from 'cron';
import { updateMessage } from '../server-build/Information.js';

export function startPeriodicUpdate() {
  new CronJob(
    '*/10 * * * *',
    () => {
      updateMessage();
    },
    null,
    true
  );
}
