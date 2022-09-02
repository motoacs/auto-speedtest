import path from 'path';
import Utils from './utils.mjs';

export default class ResultSaver {
  constructor(conf, __dirname, logger) {
    this.conf = conf;
    this.logger = logger;

    // 相対パスなら
    if (/^\.\.?[/\\]/.test(conf.resultDir)) this.resultDir = path.join(__dirname, conf.resultDir);
    else this.logDir = conf.resultDir;
  }

  async append(data) {
    const d = new Date();
    const filename = [
      d.getFullYear(), // YYYY
      `0${d.getMonth() + 1}`.slice(-2), // MM
      `0${d.getDate()}`.slice(-2), // DD
    ].join('-'); // YYYY-MM-DD
    const filePath = path.join(this.logDir, `${filename}.json`);

    let json = await Utils.readJSON(filePath);
    if (json === null) {
      this.error('Logger: appendResult: readJSON error');
      json = [];
    }
    json.push({
      t: data.timestamp,
      p: Math.round(data.ping.latency),
      d: ((data.download.bandwidth * 8) / 1e6).toFixed(2),
      u: ((data.upload.bandwidth * 8) / 1e6).toFixed(2),
    });
    Utils.writeJSON(filePath, json);
  }
}
