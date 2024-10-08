import { Logger } from 'logzen';

export const logger = new Logger({ prefix: 'renderer', hideWarningStack: true });
logger.on('send', $app.log);
