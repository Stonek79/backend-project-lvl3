#!/usr/bin/env node

import program from 'commander';
import { createRequire } from 'module';

import htmlGrubber from '../src/index.js';

const require = createRequire(import.meta.url);
const { version, description } = require('../package.json');

const errorMessages = {
  404: 'Page does\'t exist',
  EACCES: 'Permission denied',
  EEXIST: 'Output directory already exists',
  ENOENT: 'Output directory not found',
  ENOTFOUND: 'Page was not found or does not exist. Check your link',
};

program
  .version(version)
  .description(description)
  .option('-o, --output [dir]', 'output directory', process.cwd())
  .arguments('<url>')
  .action((url) => {
    const { output } = program.opts();
    // program.output почему-то не работет
    htmlGrubber(url, output)
      .then((resolve) => {
        console.log(`\n Page was downloaded to '${resolve}'`);
        process.exit();
      })
      .catch((error) => {
        console.error(errorMessages[error.code] ?? 'Opps, some unexpected error...');
        process.exit(1);
      });
  });

program.parse(process.argv);
