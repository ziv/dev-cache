const main = new Deno.Command(Deno.execPath(), {
  args: ["task", "main"],
  stdout: "piped",
  stderr: "piped",
});

Deno.test("main", async () => {
});
// main.outputSync();
