import { afterEach, beforeEach, mock, type Mock, test } from 'node:test';
import assert from 'node:assert';
import request from './index';

const OK = {status: 'ok', value: 'test'};
const ERR = {status: 'error', value: 'test'};
let gen: Mock<any>, req: Mock<any>, exists: Mock<any>;

beforeEach(() => {
    process.env.NODE_ENV = 'dev';
    gen = mock.fn(() => Promise.resolve('test'));
    exists = mock.fn(() => true);
});

afterEach(() => {
    mock.reset();
});

test('should return from generator for non-development environment', async () => {
    process.env.NODE_ENV = 'staging';
    // @ts-ignore
    assert.equal(await request('id', 'name', gen, -1, req, exists), 'test');
    assert.equal(1, gen.mock.callCount());
});

test('should return from generator for missing socket', async () => {
    exists.mock.mockImplementation(() => false);
    // @ts-ignore
    assert.equal(await request('id', 'name', gen, -1, req, exists), 'test');
    assert.equal(1, gen.mock.callCount());
});

test('should return from generator for unavailable (request error)', async () => {
    req = mock.fn(() => Promise.resolve(ERR));
    // @ts-ignore
    assert.equal(await request('id', 'name', gen, -1, req, exists), 'test');
    assert.equal(1, gen.mock.callCount());
    assert.equal(1, req.mock.callCount());
});

test('should return from cache', async () => {
    let cur = 0;
    const requests = [OK, OK];
    req = mock.fn(() => Promise.resolve(requests[cur++]));
    // @ts-ignore
    assert.equal(await request('id', 'name', gen, -1, req, exists), 'test');
    assert.equal(0, gen.mock.callCount());
    assert.equal(2, req.mock.callCount());
});

test('should return from generator for missing in cache', async () => {
    let cur = 0;
    const requests = [OK, ERR, OK];
    req = mock.fn(() => Promise.resolve(requests[cur++]));
    // @ts-ignore
    assert.equal(await request('id', 'name', gen, -1, req, exists), 'test');
    assert.equal(1, gen.mock.callCount());
    assert.equal(3, req.mock.callCount());
});