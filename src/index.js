import axios from 'axios';
// import * as cheerio  'cheerio';
import path from 'path';
import { writeFile } from 'fs/promises';

const getFullFilePath = (url, dirpath) => {
  const { protocol } = new URL(url);
  const filename = url
    .split(protocol)
    .join()
    .split(/[^\d\sA-Z]/gi)
    .filter((el) => el !== '')
    .join('-')
    .concat('.html');

  return path.resolve(dirpath, filename);
};

const grubHTML = (url, dir) => axios(url)
  .then((response) => response.data)
  .then((response) => {
    const filepath = getFullFilePath(url, dir);
    writeFile(filepath, response);
    return filepath;
  })
  .then((resolve) => console.log(`Page was downloded to '${resolve}'`));

export default grubHTML;
