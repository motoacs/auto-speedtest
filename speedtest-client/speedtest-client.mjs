// -----------------
// packages
// -----------------
import { exec } from 'child_process';
import fs from 'fs/promises';
import { CronJob } from 'cron';
import path from 'path';
import { fileURLToPath } from 'url';

// -----------------
// classes
// -----------------
import Logger from './classes/logger.mjs';

// -----------------
// variables
// -----------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const confJsonPath = './conf.json';
// conf.json
let conf;
// logger instance
let logger;
// speedtest running flag
let running = false;

// -----------------
// main functions
// -----------------
async function init() {
  console.log('init');
  // load config
  conf = await Logger.readJSON(path.join(__dirname, confJsonPath));
  if (conf == null) {
    console.error('init: load conf.json error');
    return;
  }

  logger = new Logger(conf, __dirname);
  new CronJob('* * * * *', () => logger.save(), null, true);

  // runSpeedtest();

  conf.cron.forEach((cronTime) => {
    try {
      const job = new CronJob(cronTime, runSpeedtest, null, true);
      logger.log('init: cronJob started:', cronTime, 'next:', job.nextDate().toString());
    }
    catch (e) {
      logger.error(e);
    }
  });
}

async function runSpeedtest() {
  if (running) return;
  running = true;
  logger.log('runSpeedtest: start');

  exec(`${__dirname}/bin/speedtest.exe -u Mbps -s ${conf.testServerId} -f json`, (error, stdout, stderr) => {
    if (error != null) {
      console.error(error);
      running = false;
    }
    else {
      try {
        logger.log('runSpeedtest: done');
        const ret = JSON.parse(stdout);
        logger.log(`runSpeedtest: result: [ping] ${Math.round(ret.ping.latency)}ms  [download] ${ret.download.bandwidth}Mbps  [upload] ${ret.upload.bandwidth}Mbps`);
        logger.appendResult(ret);
      }
      catch (e) {
        logger.error(e);
      }
      running = false;
    }
  });
}


// -----------------
// utility functions
// -----------------


init();
