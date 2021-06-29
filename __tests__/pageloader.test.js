/* eslint-disable no-underscore-dangle */
/**
 * @jest-environment node
 */
import os from 'os';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import httpAdapter from 'axios/lib/adapters/http.js';
import nock from 'nock';
import { promises as fs } from 'fs';
import axiosDebug from 'axios-debug-log';

import grubHTML from '../src/index.js';

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
const getFileData = (fileName) => fs.readFile(getFilePath(fileName), 'utf8');

const filesInfo = [
  { name: 'originalPage.html', handledName: 'ru-hexlet-io-courses.html', path: '/courses' },
  { name: 'testImgFile.png', handledName: 'ru-hexlet-io-assets-professions-nodejs.png', path: /png/ },
  { name: 'testScriptFile.js', handledName: 'ru-hexlet-io-packs-js-runtime.js', path: /js/ },
  { name: 'testCssFile.css', handledName: 'ru-hexlet-io-assets-application.css', path: /css/ },
];
const host = 'https://ru.hexlet.io';
const url = 'https://ru.hexlet.io/courses';
const incorrectUrl = 'https://ru.hexlet.io/incorrect';
const fakeUrlHost = nock(host).persist();
let filesContent;
let tempDir;
let expectedHtml;

beforeAll(async () => {
  tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));
  expectedHtml = await getFileData('loadedPage.html');

  const generatedFilesContent = filesInfo.map(async (file) => {
    const data = await getFileData(file.name);
    return { [file.name]: data };
  });

  filesContent = await Promise.all(generatedFilesContent);

  filesInfo.forEach((file) => {
    const currentFileContent = filesContent.find((content) => content[file.name]);
    fakeUrlHost.get(file.path).reply(200, currentFileContent[file.name]);
  });
});

describe('Pageload success tests', () => {
  test('FetchHtmlData', async () => {
    await grubHTML(url, tempDir);
    const [htmlFile] = await fs.readdir(tempDir);
    const htmlData = await fs.readFile(path.join(tempDir, htmlFile), 'utf8');
    expect(htmlData.trim()).toEqual(expectedHtml);
  });

  const filesName = filesInfo.map((res) => res.name);
  test.each(filesName)('FetchFileData: %s', async (filename) => {
    const [, filesDirectory] = await fs.readdir(tempDir);
    const filesDirectoryPath = `${tempDir}/${filesDirectory}`;
    const currentFile = filesInfo.find(({ name }) => name === filename);
    const data = await fs.readFile(path.join(filesDirectoryPath, currentFile.handledName), 'utf8');
    const currentContent = filesContent.find((c) => c[filename]);
    expect(data).toEqual(currentContent[filename]);
  });
});

describe('Pageload fails tests', () => {
  test('Fail with url error', async () => {
    nock(host)
      .get('/incorrect')
      .reply(404);
    await expect(grubHTML(incorrectUrl, tempDir)).rejects.toThrow(/404/);
  });

  test('Fail with output directory error', async () => {
    await expect(grubHTML(url, '/fail/dir')).rejects.toThrow('ENOENT');
  });
});
