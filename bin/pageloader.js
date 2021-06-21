#!/usr/bin/env node

import program from 'commander';
import { createRequire } from 'module';

import grubHTML from '../src/index.js';

const require = createRequire(import.meta.url);
const { version, description } = require('../package.json');

const currentDirPath = process.cwd();

program
  .version(version)
  .description(description)
  .option('-o, --output [dir]', 'output directory', currentDirPath)
  .arguments('<url>')
  .action((url) => {
    const { output } = program.opts();
    // program.output почему-то не работет
    grubHTML(url, output);
    // console.log(url, output);
  });
program.parse(process.argv);
