import path from 'path';
import Utils from './utils.mjs';

export default class ResultSaver {
  constructor(conf, __dirname, logger) {
    this.conf = conf;
    this.logger = logger;

    // 相対パスなら
    if (/^\.\.?[/\\]/.test(conf.resultDir)) this.resultDir = path.join(__dirname, conf.resultDir);
    else this.resultDir = conf.resultDir;
  }

  async append(data) {
    const d = new Date();
    const filename = [
      d.getFullYear(), // YYYY
      `0${d.getMonth() + 1}`.slice(-2), // MM
      `0${d.getDate()}`.slice(-2), // DD
    ].join('-'); // YYYY-MM-DD
    const filePath = path.join(this.resultDir, `${filename}.csv`);

    const writeStr = [
      new Date(data.timestamp).toLocaleString('ja-jp'),
      Math.round(data.ping.latency),
      ((data.download.bandwidth * 8) / 1e6).toFixed(2),
      ((data.upload.bandwidth * 8) / 1e6).toFixed(2),
    ].join(',') + '\r\n';
    Utils.writeFile(filePath, writeStr);
  }
}
