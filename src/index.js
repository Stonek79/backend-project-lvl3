import * as cheerio from 'cheerio';
import axios from 'axios';
import debug from 'debug';
import path from 'path';
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

const prepareTaskResourse = (dir, url, handledLink) => axios
  .get(url, { responseType: 'arraybuffer' })
  .then(({ data }) => fs.writeFile(path.resolve(dir, handledLink), data));

const handleLoadedLinks = (data, dirName, origin) => {
  const $ = cheerio.load(data, { decodeEntities: false });

  const links = [];
  $('img, script, link').each((i, e) => {
    links.push($(e).attr('src') || $(e).attr('href'));
  });

  const replaceHtmlAttr = (link, handledLink, attr) => {
    $(`*[${attr}^="${link}"]`).attr(`${attr}`, (i, a) => a.replace(link, handledLink));
    return $.html();
  };

  const handledLinks = links
    .filter((link) => new URL(link, origin).origin === origin && link)
    .reduce((acc, link) => {
      const ext = path.extname(link) || '.html';
      const { dir, name } = path.parse(new URL(link, origin).href);
      const handledFilename = assetsUrlToFilename(path.join(dir, name)).concat(ext);
      const absolutePath = path.join(dirName, handledFilename);

      replaceHtmlAttr(link, absolutePath, 'src');
      replaceHtmlAttr(link, absolutePath, 'href');

      return [...acc, [link, absolutePath]];
    }, []);

  return { html: $.html(), handledLinks };
};

const loadHTML = (url, dir = '') => {
  const dirName = assetsUrlToFilename(url).concat('_files');
  const dirPath = path.resolve(dir, dirName);
  const fileName = assetsUrlToFilename(url).concat('.html');
  const filePath = path.resolve(dir, fileName);
  const { origin } = new URL(url);

  return axios.get(url)
    .then((response) => {
      logger(`Сreating directory: ${dirName.toString()}`);

      return fs.mkdir(dirPath)
        .then(() => (response.data));
    })
    .then((response) => {
      const { html, handledLinks } = handleLoadedLinks(response, dirName, origin);
      const filesTasks = handledLinks
        .map(([link, handledLink]) => {
          const { href } = new URL(link, origin);
          logger(`Downloading resource ${href}`);
          return {
            title: `Loading resource: ${href}`,
            task: () => prepareTaskResourse(dir, href, handledLink),
          };
        });

      const task = new Listr(filesTasks, { concurrent: true });

      return task.run(html)
        .then((res) => res);
    })
    .then((response) => {
      logger(`Writing loaded html: ${fileName.toString()}`);

      return fs.writeFile(filePath, response);
    })
    .then(() => filePath);
};

export default loadHTML;
