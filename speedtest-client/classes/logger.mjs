import fs from 'fs/promises';
import path from 'path';

export default class Logger {
  constructor(conf, __dirname) {
    this.conf = conf;
    this.__dirname;
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

  async appendResult(data) {
    const d = new Date();
    const filename = [
      d.getFullYear(), // YYYY
      `0${d.getMonth() + 1}`.slice(-2), // MM
      `0${d.getDate()}`.slice(-2), // DD
    ].join('-'); // YYYY-MM-DD
    const filePath = path.join(this.logDir, `${filename}.json`);

    const json = await Logger.readJSON(filePath);
    if (json === null) {
      this.error('Logger: appendResult: readJSON error');
      return;
    }
    json.push({
      t: data.timestamp,
      p: Math.round(data.ping.latency),
      d: ((data.download.bandwidth * 8) / 1_000_000).toFixed(2),
      u: ((data.upload.bandwidth * 8) / 1_000_000).toFixed(2),
    });
    Logger.writeJSON(filePath, json);
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

    await fs
      .writeFile(
        `${this.logDir}debug/${filename}.log`,
        `${copy.join('\r\n')}\r\n`,
        { flag: 'a' } // append
      )
      .catch((e) => {
        this.logBuffer.push(`Logger: save: ERROR: ${JSON.stringify(e)}`);
      });

    this.logBuffer = [];
  }

  static async readJSON(path) {
    let json;
    try {
      json = await fs.readFile(path);
      json = JSON.parse(json);
      return json;
    } catch (e) {
      console.error(e);
      return [];
    }
  }

  static async writeJSON(path, obj, append = false) {
    try {
      const txt = JSON.stringify(obj, null, '  ');
      await fs.writeFile(path, txt, {
        flag: append ? 'a' : 'w+',
      });
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  }
}
