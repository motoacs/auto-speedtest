import fs from 'fs/promises';

export default class Utils {
  static async readJSON(path) {
    let json;
    try {
      json = await fs.readFile(path);
      json = JSON.parse(json);
      return json;
    } catch (e) {
      console.error(e);
      return null;
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
