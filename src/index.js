import * as cheerio from 'cheerio';
import _ from 'lodash';
import axios from 'axios';
import debug from 'debug';
import path from 'path';
import prettier from 'prettier';
import { promises as fs } from 'fs';
import Listr from 'listr';
import axiosdebug from 'axios-debug-log';

import assetsUrlToFilename from './utils.js';

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

const getPageLinks = ($) => {
  const pageTags = $('img, script, link');
  const links = [];
  logger('Receiving page links');
  pageTags.each((i, e) => {
    links.push($(e).attr('src') || $(e).attr('href'));
  });
  return _.compact(links);
};

const createLoadingResouceTask = (dirpath, link, handledLink, origin) => {
  const fullLink = new URL(link, origin).href;
  logger(`Downloading resource ${fullLink}`);
  return {
    title: `Loading resource: ${fullLink.toString()}`,
    task: () => axios.get(fullLink, { responseType: 'arraybuffer' })
      .then(({ data }) => fs.writeFile(path.resolve(dirpath, handledLink), data))
      .catch((err) => { throw err; }),
  };
};

const replaceHtmlAttr = (link, handledLink, attr, $) => {
  $(`*[${attr}^="${link}"]`).attr(`${attr}`, (i, a) => a.replace(link, handledLink));
  return $.html();
};

const handleLoadedLinks = ($, dirName, origin) => {
  const loadedLinks = getPageLinks($);
  return loadedLinks.reduce((acc, link) => {
    const absoluteLink = new URL(link, origin);
    if (absoluteLink.origin === origin) {
      const ext = path.extname(link) || '.html';
      const { dir, name } = path.parse(absoluteLink.href);
      const extCutLink = path.join(dir, name);
      const createdFilname = assetsUrlToFilename(extCutLink).concat(ext);
      const absolutePath = path.join(dirName, createdFilname);

      replaceHtmlAttr(link, absolutePath, 'src', $);
      replaceHtmlAttr(link, absolutePath, 'href', $);
      return { ...acc, [link]: absolutePath };
    }
    return acc;
  }, {});
};

const loadHTML = (url, dir) => {
  const dirName = assetsUrlToFilename(url).concat('_files');
  const dirPath = path.resolve(dir, dirName);
  const fileName = assetsUrlToFilename(url).concat('.html');
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
