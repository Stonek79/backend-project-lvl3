/* eslint-disable no-underscore-dangle */
import os from 'os';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import httpAdapter from 'axios/lib/adapters/http.js';
import nock from 'nock';
import { promises as fs } from 'fs';
import axiosDebug from 'axios-debug-log';

import loadHTML from '../src/index.js';

axiosDebug({
  request(debug, request) {
    debug(`Request with ${request.headers['content-type']}`);
  },
  response(debug, response) {
    debug(
      `Response with ${response.headers['content-type']}`,
      `from ${response.config.url}`,
    );
  },
  error(debug, error) {
    debug('Some axios error: ', error.message);
  },
});

nock.disableNetConnect();
axios.defaults.adapter = httpAdapter;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const getFilePath = (fileName) => path.join(__dirname, '..', '__fixtures__', fileName);
const readFile = (fileName) => fs.readFile(`${__dirname}/../__fixtures__/${fileName}`, 'utf8');

const filesInfo = [
  { name: 'originalPage.html', handledName: 'ru-hexlet-io-courses.html', path: '/courses' },
  { name: 'testImgFile.png', handledName: 'ru-hexlet-io-assets-professions-nodejs.png', path: /png/ },
  { name: 'testScriptFile.js', handledName: 'ru-hexlet-io-packs-js-runtime.js', path: /js/ },
  { name: 'testCssFile.css', handledName: 'ru-hexlet-io-assets-application.css', path: /css/ },
];
const host = 'https://ru.hexlet.io';
const url = 'https://ru.hexlet.io/courses';
const incorrectUrl = 'https://ru.hexlet.io/incorrect';
const scope = nock(host).persist();
let filesContent;
let tempDir;
let expectedHtml;

beforeAll(async () => {
  tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));

  expectedHtml = await readFile('loadedPage.html');

  const generatedFilesContent = filesInfo.map(async (file) => {
    const data = await readFile(file.name);
    return { [file.name]: data };
  });

  filesContent = await Promise.all(generatedFilesContent);

  filesInfo.forEach((file) => {
    const currentFileContent = filesContent.find((content) => content[file.name]);
    scope.get(file.path).reply(200, currentFileContent[file.name]);
  });
});

describe('Pageload success tests', () => {
  test('FetchHtmlData', async () => {
    await loadHTML(url, tempDir);
    const [htmlFile] = await fs.readdir(tempDir);
    const htmlData = await fs.readFile(path.join(tempDir, htmlFile), 'utf8');
    expect(htmlData.trim()).toEqual(expectedHtml);
  });

  test.each(filesInfo)('FetchFileData: $name', async ({ name }) => {
    const [, filesDirectory] = await fs.readdir(tempDir);
    const filesDirectoryPath = `${tempDir}/${filesDirectory}`;
    const currentFile = filesInfo.find((file) => file.name === name);
    const data = fs.readFile(path.join(filesDirectoryPath, currentFile.handledName), 'utf8');
    await expect(data).resolves.not.toThrow();
  });
});

describe('Pageload fails tests', () => {
  test.each([404, 500])('Fail with error code "%s"', async (err) => {
    nock(host)
      .get('/incorrect')
      .reply(err);
    await expect(loadHTML(incorrectUrl, tempDir)).rejects.toThrow(`Request failed with status code ${err}`);
  });

  test('Fail with directory NOT exist', async () => {
    await expect(loadHTML(url, '/fail/dir')).rejects.toThrow('ENOENT');
  });

  test('Fail with output is NOT a directory', async () => {
    await expect(loadHTML(url, getFilePath('fakeFile.js'))).rejects.toThrow('ENOTDIR');
  });

  test('Fail with access denied directory', async () => {
    const deniedDir = await fs.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));
    fs.chmod(deniedDir, 0o400);
    await expect(loadHTML(url, deniedDir)).rejects.toThrow('EACCES');
  });
});
