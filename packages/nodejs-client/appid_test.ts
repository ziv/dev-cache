import test from "node:test";
import assert from "node:assert";
import process from "node:process";
import appid from "./appid";

test("appid() should prefer the environment value", () => {
  process.env.DEVCACHE_APPID = "test";
  assert.equal(appid("frodo"), "test");
});

test("appid() should return the given value", () => {
  delete process.env.DEVCACHE_APPID;
  assert.equal(appid("test"), "test");
});
