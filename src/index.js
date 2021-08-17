import * as cheerio from 'cheerio';
import axios from 'axios';
import debug from 'debug';
import path from 'path';
import prettier from 'prettier';
import { promises as fs } from 'fs';
import Listr from 'listr';
import axiosdebug from 'axios-debug-log';

import {
  handleLoadedLinks,
  assetsUrlToFilename,
  createLoadingResouceTask,
} from './utils.js';

const logger = debug('page-loader');

axiosdebug({
  response(deb, response) {
    debug(
      `Response with ${response.headers['content-type']}`,
      `from ${response.config.url}`,
    );
  },
  error(deb, error) {
    debug('Axios Error: ', error);
  },
});

const loadHTML = (url, dir = process.cwd()) => {
  const dirName = assetsUrlToFilename(url, '_files');
  const dirPath = path.resolve(dir, dirName);
  const fileName = assetsUrlToFilename(url, '.html');
  const filePath = path.resolve(dir, fileName);
  const { origin } = new URL(url);

  return axios(url)
    .then((response) => {
      logger(`Creating new html page: ${fileName}`);
      const $ = cheerio.load(response.data);
      const handledLinks = handleLoadedLinks($, dirName, origin);
      const changedHtml = prettier.format($.html(), { printWidth: 300, parser: 'html' });
      const filesTasks = Object.entries(handledLinks)
        .map(([link, handledLink]) => createLoadingResouceTask(dir, link, handledLink, origin));

      const task = new Listr([{
        title: `Сreating directory: ${dirName.toString()}`,
        task: () => fs.mkdir(dirPath)
          .catch((err) => { throw err; }),
      },
      {
        title: 'Loading resources',
        task: () => new Listr(filesTasks, { concurrent: true }),
      },
      ]);

      return task.run(changedHtml)
        .then((res) => res);
    })
    .then((response) => {
      logger(`Writing loaded html: ${fileName.toString()}`);
      const task = new Listr([{
        title: `Сreating htmlFile: ${fileName.toString()}`,
        task: () => fs.writeFile(filePath, response)
          .catch((err) => { throw err; }),
      }]);

      return task.run();
    })
    .then(() => filePath);
};

export default loadHTML;
