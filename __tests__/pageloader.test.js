/**
 * @jest-environment node
 */

import os from 'os';
import path from 'path';
import nock from 'nock';
import axios from 'axios';
import httpAdapter from 'axios/lib/adapters/http';
import { promises as fs } from 'fs';
import {
  test, beforeEach, beforeAll, expect,
} from '@jest/globals';
import grubHTML from '../src/index.js';

axios.defaults.adapter = httpAdapter;
nock.disableNetConnect();

const url = 'https://ru.hexlet.io/courses';
const expectedFileData = '<html><body><div>Some Data</div></body></html>';
let expectedFileName;
let tempDir;

beforeAll(async () => {
  const { protocol } = new URL(url);

  expectedFileName = url
    .split(protocol)
    .join()
    .split(/[^\d\sA-Z]/gi)
    .filter((el) => el !== '')
    .join('-')
    .concat('.html');
});

beforeEach(async () => {
  tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));
});

test('fetchFileName', async () => {
  nock('https://ru.hexlet.io')
    .get('/courses')
    .reply(200, expectedFileData);
  await grubHTML(url, tempDir);
  const [filename] = await fs.readdir(tempDir);
  expect(filename).toEqual(expectedFileName);
});

test('fetchFilePath', async () => {
  nock('https://ru.hexlet.io')
    .get('/courses')
    .reply(200, expectedFileData);
  const expectedFilePath = tempDir.concat('/', expectedFileName);
  await grubHTML(url, tempDir);
  const [filename] = await fs.readdir(tempDir);
  const filePath = tempDir.concat('/', filename);
  expect(filePath).toEqual(expectedFilePath);
});

test('fetchFileData', async () => {
  nock('https://ru.hexlet.io')
    .get('/courses')
    .reply(200, expectedFileData);
  await grubHTML(url, tempDir);
  const [filename] = await fs.readdir(tempDir);
  const filePath = tempDir.concat('/', filename);
  const fileData = await fs.readFile(filePath, 'utf-8');
  expect(fileData).toEqual(expectedFileData);
});
