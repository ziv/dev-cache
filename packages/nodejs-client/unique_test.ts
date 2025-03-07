import test from "node:test";
import assert from "node:assert";
import unique from "./unique";

test("unique() should return 64 long string for input (sid)", () => {
  assert.equal(unique("test").length, 64);
});

test("unique() should return 64 long string for input (sid and name)", () => {
  assert.equal(unique("test", "name").length, 64);
});

test("unique() should return the same output from the same input (sid)", () => {
  assert.equal(unique("test"), unique("test"));
});

test("unique() should return the same output from the same input  (sid and name)", () => {
  assert.equal(unique("test", "name"), unique("test", "name"));
});
