import { Logger } from 'logzen';

export const logger = new Logger({ prefix: 'renderer' });
logger.on('send', $app.log);
