import _ from 'lodash';
import axios from 'axios';
import debug from 'debug';
import path from 'path';
import { promises as fs } from 'fs';

const logger = debug('page-loader');

const assetsUrlToFilename = (url, nameEnd = '') => {
  const { protocol } = new URL(url);
  return url
    .split(protocol)
    .join()
    .split(/[^\d\sA-Z]/gi)
    .filter((el) => el !== '')
    .join('-')
    .concat(nameEnd);
};

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
      const ext = path.extname(link);
      const extension = _.isEmpty(ext) ? '.html' : ext;
      const { dir, name } = path.parse(absoluteLink.href);
      const extCutLink = path.join(dir, name);
      const createdFilname = assetsUrlToFilename(extCutLink, extension);
      const absolutePath = path.join(dirName, createdFilname);

      replaceHtmlAttr(link, absolutePath, 'src', $);
      replaceHtmlAttr(link, absolutePath, 'href', $);
      return { ...acc, [link]: absolutePath };
    }
    return acc;
  }, {});
};

export {
  handleLoadedLinks,
  assetsUrlToFilename,
  createLoadingResouceTask,
};
