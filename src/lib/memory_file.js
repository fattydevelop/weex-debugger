const Crypto = require('crypto');
const Url = require('url');
const queryParser = require('querystring');
const _memoryFileMap = {};
class MemoryFile {
  static get (name) {
    return _memoryFileMap[name];
  }
  static dump () {
    return Object.keys(_memoryFileMap);
  }
  constructor (fileName, content) {
    const rHttpHeader = /^(https?|taobao|qap):\/\/(?!.*your_current_ip)/i;
    if (rHttpHeader.test(fileName)) {
      const query = queryParser.parse(Url.parse(fileName).query);
      if (query['_wx_tpl']) {
        this.url = normalize(query['_wx_tpl']);
        this.name = this.url.replace(rHttpHeader, '');
      }
      else {
        this.url = normalize(fileName);
        this.name = this.url.replace(rHttpHeader, '');
      }
    }
    else {
      this.name = fileName.replace(/^(https?|taobao|qap):\/\/(.*your_current_ip):(\d+)\//i, 'file://');
    }
    if (this.name.charAt(this.name.length - 1) === '?') {
      this.name = this.name.substring(0, this.name.length - 1);
    }
    const md5 = Crypto.createHash('md5');
    md5.update(content);
    const md5Str = md5.digest('hex');
    const key = this.name.split('?')[0] + '|' + md5Str;
    if (_memoryFileMap[this.name]) {
      _memoryFileMap[this.name].content = content;
      return _memoryFileMap[this.name];
    }
    else if (_memoryFileMap[key]) {
      _memoryFileMap[key].content = content;
      return _memoryFileMap[key];
    }
    else {
      this.content = content;
    }
    this.md5 = md5Str;
    _memoryFileMap[this.name] = this;
    _memoryFileMap[key] = this;
  }
  getContent () {
    return this.content;
  }
  getUrl () {
    return '/source/' + this.name;
  }
}
module.exports = MemoryFile;

function normalize (url) {
  const urlObj = Url.parse(url);
  if (urlObj.query) {
    urlObj.query = queryParser.stringify(queryParser.parse(urlObj.query));
    urlObj.search = '?' + urlObj.query;
  }
  return urlObj.format();
}
