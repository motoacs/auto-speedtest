import fs from 'fs/promises';
import path from 'path';
import Utils from './utils.mjs';

export default class Logger {
  constructor(conf, __dirname) {
    this.conf = conf;
    this.logBuffer = [];

    // 相対パスなら
    if (/^\.\.?[/\\]/.test(conf.logDir)) this.logDir = path.join(__dirname, conf.logDir);
    else this.logDir = conf.logDir;
  }

  static dateTimeFormat = new Intl.DateTimeFormat('ja-jp', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  log(txt) {
    const logTxt = `[${Logger.dateTimeFormat.format(new Date())}] ${txt}`;
    console.log(logTxt);
    this.logBuffer.push(logTxt);
  }

  error(txt) {
    const logTxt = `[${Logger.dateTimeFormat.format(new Date())}] ${txt}`;
    console.error(logTxt);
    this.logBuffer.push(logTxt);
  }

  async save() {
    // 書き込み処理
    if (this.logBuffer.length === 0) {
      return;
    }

    const d = new Date();
    const filename = [
      d.getFullYear(), // YYYY
      `0${d.getMonth() + 1}`.slice(-2), // MM
      `0${d.getDate()}`.slice(-2), // DD
    ].join('-'); // YYYY-MM-DD

    const copy = this.logBuffer.slice(0);
    this.logBuffer = [];

    await fs
      .writeFile(
        `${this.logDir}${filename}.log`,
        `${copy.join('\r\n')}\r\n`, {
          flag: 'a'
        } // append
      )
      .catch((e) => {
        this.logBuffer.push(`Logger: save: ERROR: ${JSON.stringify(e)}`);
      });

  }
}