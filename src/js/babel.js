import _ from 'lodash';
import CompileCache from 'electron-compile-cache';
import fs from 'fs';

let babel = null;

const invalidOpts = ['extension', 'extensions', 'version'];
const extensions = ['js', 'jsx'];

export default class BabelCompiler extends CompileCache {
  constructor(options={}) {
    super();
    
    this.compilerInformation = _.extend({}, {
      extensions: extensions,
      sourceMaps: 'inline',
      blacklist: [
        'useStrict'
      ],
      stage: 1,
      optional: [
        // Target a version of the regenerator runtime that
        // supports yield so the transpiled code is cleaner/smaller.
        'asyncToGenerator'
      ],
    }, options);
  }
  
  static getExtensions() {
    return extensions;
  }

  getCompilerInformation() {
    return this.compilerInformation;
  }

  compile(sourceCode, filePath) {
    this.babelCompilerOpts = this.babelCompilerOpts || _.omit(this.compilerInformation, invalidOpts);
    let opts = _.extend({}, this.babelCompilerOpts, {
      filename: filePath,
      ast: false
    });

    return babel.transform(sourceCode, opts).code;
  }

  getMimeType() { return 'text/javascript'; }

  shouldCompileFile(filePath, sourceCode) {
    let ret = super.shouldCompileFile(filePath);
    if (!ret) return false;
    
    // Read the first 4k of the file
    if (!sourceCode) {
      let fd = fs.openSync(filePath, 'r');
      
      try {
        let buf = new Buffer(4*1024);
        fs.readSync(fd, buf, 0, 4*1024, 0);
        sourceCode = buf.toString('utf8');
      } finally {
        fs.closeSync(fd);
      }
    }

    return ret && !(/^("use nobabel"|'use nobabel')/.test(sourceCode));
  }

  initializeCompiler() {
    babel = babel || require('babel-core');
    return babel.version;
  }
}
