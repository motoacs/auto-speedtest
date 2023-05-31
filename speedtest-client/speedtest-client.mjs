// -----------------
// packages
// -----------------
import { exec } from 'child_process';
import fs from 'fs/promises';
import { CronJob } from 'cron';
import * as winston from 'winston';
import 'winston-daily-rotate-file';
import moment from 'moment-timezone';
import path from 'path';
import { fileURLToPath } from 'url';

// -----------------
// classes
// -----------------
import Utils from './classes/utils.mjs';

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
// result-saver instance
let resultSaver;
// speedtest running flag
let running = false;

// -----------------
// main functions
// -----------------
async function init() {
  console.log('init');
  // load config
  conf = await Utils.readJSON(path.join(__dirname, confJsonPath));
  if (conf == null) {
    console.error('init: load conf.json error');
    return;
  }

  logger = winston.createLogger({
    format: winston.format.combine(
      winston.format.timestamp({ format: () => moment().tz('Asia/Tokyo').format('YYYY-MM-DD HH:mm:ss') }),
      winston.format.printf(({ level, message, timestamp }) => {
        return `${timestamp} ${level.toUpperCase()}: ${message}`
      }),
    ),
    transports: [
      new winston.transports.DailyRotateFile({
        filename: '%DATE%.log',
        dirname: path.join(__dirname, conf.logDir),
        datePattern: 'YYYY-MM',
        zippedArchive: true,
        maxSize: '20m',
        maxFiles: '180d'
      }),
      new winston.transports.Console(),
    ],
  });

  resultSaver = winston.createLogger({
    format: winston.format.combine(
        winston.format.timestamp({ format: () => moment().tz('Asia/Tokyo').format('YYYY/MM/DD HH:mm:ss') }),
        winston.format.printf(({ message, timestamp }) => {
            return `${timestamp},${message}`
        }),
    ),
    transports: [
        new winston.transports.DailyRotateFile({
            filename: '%DATE%.csv',
            dirname: path.join(__dirname, conf.resultDir),
            datePattern: 'YYYY-MM',
            zippedArchive: true,
            maxSize: '20m',
        }),
    ],
  });

  // test
  // runSpeedtest();
  // return;

  conf.cron.forEach((cronTime) => {
    try {
      const job = new CronJob(cronTime, runSpeedtest, null, true);
      logger.info(`init: cronJob started: ${cronTime}  next: ${job.nextDate().toString()}`);
    }
    catch (e) {
      logger.error(e);
    }
  });
}

async function runSpeedtest() {
  let i = 0;
  let success = false;
  if (running) return;
  running = true;
  logger.info('runSpeedtest: start test');

  while (!success && i <= conf.testServerId.length) {
    const cmd = `${__dirname}/bin/speedtest.exe${(typeof conf.testServerId[i] === 'number') ? ` -s ${conf.testServerId[i]}` : ''} -f json`
    logger.info(`runSpeedtest: cmd = ${cmd}`);
    success = await test(cmd);
    i += 1;
  }

  running = false;


  function test(cmd) {
    return new Promise((resolve) => {
      exec(cmd, (error, stdout, stderr) => {
        if (error != null) {
          logger.error(`runSpeedtest: error: ${error}`);
          resolve(false);
        }
        else {
          logger.info('runSpeedtest: done');
          const ret = JSON.parse(stdout);
          logger.info(`runSpeedtest: result: [ping] ${Math.round(ret.ping.latency)}ms  [download] ${(ret.download.bandwidth * 8 / 1e6).toFixed(2)}Mbps  [upload] ${(ret.upload.bandwidth * 8 / 1e6).toFixed(2)}Mbps  [result] ${ret.result.url}`);
          resultSaver.info(`${Math.round(ret.ping.latency)},${(ret.download.bandwidth * 8 / 1e6).toFixed(2)},${(ret.upload.bandwidth * 8 / 1e6).toFixed(2)},${ret.result.id}`);
          resolve(true);
        }
      });
    });
  }
}

init();
