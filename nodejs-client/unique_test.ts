import test from 'node:test';
import assert from 'node:assert';
import unique from './unique';

test('unique() should return 40 long string', (t) => {
    assert.equal(unique('test').length, 40);
});

test('unique() should return the same output from the same input', (t) => {
    assert.equal(unique('test'), unique('test'));
});