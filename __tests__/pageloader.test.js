/* eslint-disable no-underscore-dangle */
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
import { fileURLToPath } from 'url';

import grubHTML from '../src/index.js';

axios.defaults.adapter = httpAdapter;
nock.disableNetConnect();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const getFilePath = (filename) => path.join(__dirname, '..', '__fixtures__', filename);
const getExpectedResult = (fileName) => (fs.readFile(getFilePath(fileName), 'utf-8'));

const url = 'https://ru.hexlet.io/courses';
let originalPageData;
let expectedPageData;
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

  originalPageData = await getExpectedResult('originalPage.html');
  expectedPageData = await getExpectedResult('loadedPage.html');
});

beforeEach(async () => {
  tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));
});

test('fetchFileName', async () => {
  nock('https://ru.hexlet.io')
    .get('/courses')
    .reply(200, originalPageData);
  await grubHTML(url, tempDir);
  const dirData = await fs.readdir(tempDir, { withFileTypes: true });
  const [filename] = dirData.filter((dirent) => (dirent.isFile() ? dirent.name : null));
  expect(filename.name).toEqual(expectedFileName);
});

test('fetchFilePath', async () => {
  nock('https://ru.hexlet.io')
    .get('/courses')
    .reply(200, originalPageData);
  const expectedFilePath = path.join(tempDir, expectedFileName);
  await grubHTML(url, tempDir);
  const dirData = await fs.readdir(tempDir, { withFileTypes: true });
  const [filename] = dirData.filter((dirent) => (dirent.isFile() ? dirent.name : null));
  const currentPath = path.join(tempDir, filename.name);
  expect(currentPath).toEqual(expectedFilePath);
});

test('fetchPageData', async () => {
  nock('https://ru.hexlet.io')
    .get('/courses')
    .reply(200, originalPageData);
  await grubHTML(url, tempDir);
  const dirData = await fs.readdir(tempDir, { withFileTypes: true });
  const [filename] = dirData.filter((dirent) => (dirent.isFile() ? dirent.name : null));
  const currentPath = path.join(tempDir, filename.name);
  const fileData = await fs.readFile(currentPath, 'utf-8');
  expect(fileData.trim()).toEqual(expectedPageData);
});

test('hasCreatedDirectory', async () => {
  nock('https://ru.hexlet.io')
    .get('/courses')
    .reply(200, originalPageData);
  await grubHTML(url, tempDir);
  const dirData = await fs.readdir(tempDir, { withFileTypes: true });
  const [dirname] = dirData.filter((dirent) => (dirent.isDirectory() ? dirent.name : null));
  expect(dirname.name).toBeDefined();
});
