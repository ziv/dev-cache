import { assertEquals } from "@std/assert";
import { assertSpyCalls, resolvesNext, spy, stub } from "@std/testing/mock";
import request from "./index.ts";
import process from "node:process";

function generatorFunction() {
  return Promise.resolve("test");
}

function noop() {
}

const exists = (() => true) as never;
const ctx = { request: noop, generatorFunction };

Deno.test("should return from generator for non-development environment", async () => {
  process.env.NODE_ENV = "staging";
  const generator = spy(ctx, "generatorFunction");

  assertEquals(await request("test", "test", generator), "test");
  assertSpyCalls(generator, 1);
  generator.restore();
});

Deno.test("should return from generator for missing socket", async () => {
  process.env.NODE_ENV = "dev";
  const generator = spy(ctx, "generatorFunction");
  assertEquals(
    await request(
      "test",
      "test",
      generator,
      noop as never,
      (() => false) as never,
    ),
    "test",
  );
  assertSpyCalls(generator, 1);
  generator.restore();
});

Deno.test("should return from generator for not available (request error)", async () => {
  const generator = spy(ctx, "generatorFunction");
  const req = stub(
    ctx,
    "request",
    resolvesNext([{ status: "error", value: "test" }]),
  );
  assertEquals(
    await request("test", "test", generator, req as never, exists),
    "test",
  );
  assertSpyCalls(generator, 1);
  generator.restore();
  req.restore();
});

Deno.test("should hit cache", async () => {
  process.env.NODE_ENV = "dev";
  const generator = spy(ctx, "generatorFunction");
  const req = stub(
    ctx,
    "request",
    resolvesNext([
      '{"status":"ok"}',
      '{"status":"ok","value":"test"}',
    ]),
  );
  assertEquals(
    await request("test", "test", generator, req as never, exists),
    "test",
  );
  assertSpyCalls(generator, 0);
  generator.restore();
  req.restore();
});

Deno.test("should not hit cache and write generator output to cache", async () => {
  process.env.NODE_ENV = "dev";
  const generator = spy(ctx, "generatorFunction");
  const req = stub(
    ctx,
    "request",
    resolvesNext([
      '{"status":"ok"}',
      '{"status":"error","value":"test"}',
      '{"status":"ok","value":"test"}',
    ]),
  );
  assertEquals(
    await request("test", "test", generator, req as never, exists),
    "test",
  );
  assertSpyCalls(generator, 1);
  generator.restore();
  req.restore();
});
