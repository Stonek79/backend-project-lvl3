import axios from 'axios';
import * as cheerio from 'cheerio';
import path from 'path';
import prettier from 'prettier';
import { promises as fs } from 'fs';

// const prettier = require('prettier');

const createItemName = (url, nameEnd = '') => {
  const { protocol } = new URL(url);
  return url
    .split(protocol)
    .join()
    .split(/[^\d\sA-Z]/gi)
    .filter((el) => el !== '')
    .join('-')
    .concat(nameEnd);
};

const getImgPaths = (cheerioData) => {
  const recievedImgElements = cheerioData('img');
  const links = [];
  recievedImgElements.each((_, e) => {
    links.push(cheerioData(e).attr('src'));
  });
  return links;
};

const grubHTML = (url, dir) => axios(url)
  .then((response) => {
    const { data } = response;
    const dirName = createItemName(url, '_files');
    const dirPath = path.resolve(dir, dirName);
    fs.mkdir(dirPath);
    return { dirName, data };
  })
  .then((response) => {
    const { dirName, data } = response;
    const $ = cheerio.load(data);
    const downloadedImgLinks = getImgPaths($);
    const { origin } = new URL(url);

    const handledLinks = downloadedImgLinks.reduce((acc, link) => {
      const ext = path.extname(link);
      const { hostname, pathname } = new URL(link, origin);
      const parsedPathname = path.parse(pathname);
      const newLink = path.format({
        dir: hostname.concat('/', parsedPathname.dir),
        name: parsedPathname.name,
      });
      const handledLink = newLink
        .split(/[^\d\sA-Z]/gi)
        .filter((el) => el !== '')
        .join('-')
        .concat(ext);
      const absolutePathToImg = path.join(dirName, handledLink);

      return { ...acc, [link]: absolutePathToImg };
    }, {});

    const downloadedImages = downloadedImgLinks.map((link) => {
      const fullImgLink = new URL(link, origin);
      return axios({
        method: 'get',
        url: `${fullImgLink}`,
        responseType: 'stream',
      })
        .then((res) => {
          console.log(path.resolve(dir, handledLinks[link]));
          fs.writeFile(path.resolve(dir, handledLinks[link]), res.data);
        })
        .catch((err) => ({ result: 'error', error: err }));
    });
    Promise.all(downloadedImages);
    return { handledLinks, $ };
  })
  .then((response) => {
    const { handledLinks, $ } = response;
    Object.keys(handledLinks).forEach((key) => {
      $(`img[src^="${key}"]`).attr('src', (_, a) => a.replace(key, handledLinks[key]));
      return $.html();
    });
    const fileName = createItemName(url, '.html');
    const filePath = path.resolve(dir, fileName);
    const changedHtml = prettier.format($.html(), { printWidth: 300, parser: 'html' });

    fs.writeFile(filePath, changedHtml);
    return filePath;
  })
  .then((resolve) => console.log(`Page was downloded to '${resolve}'`));

export default grubHTML;
