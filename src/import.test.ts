import test from "node:test";
import assert from "node:assert/strict";
import { createImportServer, validateImportedDraft } from "../server/index.ts";
import { samplePlan } from "./solver.ts";
test("independent import validation rejects invalid scalar and task values", () => {
  const d = {
    title: "Lesson",
    learnerCount: 28,
    minutes: 30,
    tasks: [{ name: "Observe", duration: 4, capacity: 3 }],
    assumptions: ["Reset included."],
  };
  assert.equal(validateImportedDraft(d).plan.learners.length, 28);
  for (const changed of [
    { learnerCount: 0 },
    { minutes: 0 },
    { tasks: [{ name: "x", duration: 0, capacity: 3 }] },
    { assumptions: [null] },
    { tasks: [null] },
    { tasks: [d.tasks[0], d.tasks[0]] },
  ])
    assert.throws(() => validateImportedDraft({ ...d, ...changed }));
});
test("local API validates request size, origin, JSON and input without cloud calls", async () => {
  let calls = 0;
  const server = createImportServer(async () => {
    calls++;
    return { plan: samplePlan, assumptions: [] };
  });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  const addr = server.address();
  assert.ok(addr && typeof addr === "object");
  const url = `http://127.0.0.1:${addr.port}/api/import`;
  try {
    for (const [body, expected] of [
      ["{}", 400],
      ["broken", 400],
      [JSON.stringify({ text: "" }), 400],
      [JSON.stringify({ text: "x".repeat(10001) }), 400],
      [JSON.stringify({ text: "x".repeat(25000) }), 413],
    ] as const) {
      const r = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      });
      assert.equal(r.status, expected);
    }
    assert.equal(
      (
        await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Origin: "https://evil.example",
          },
          body: JSON.stringify({ text: "valid" }),
        })
      ).status,
      403,
    );
    assert.equal(calls, 0);
    const success = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "http://127.0.0.1:5174",
      },
      body: JSON.stringify({ text: "28 learners, 30 minutes, 3 scopes" }),
    });
    assert.equal(success.status, 200);
    assert.equal(calls, 1);
    assert.equal((await success.json()).plan.learners.length, 28);
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close((e) => (e ? reject(e) : resolve())),
    );
  }
});

test("deployed handler rejects foreign and missing origins before spending, accepts same-origin HTTPS", async () => {
  const { createImportHandler } = await import("../server/import.ts");
  let calls = 0;
  const handler = createImportHandler(async () => {
    calls++;
    return { plan: samplePlan, assumptions: [] };
  }, { production: true });
  const request = (origin?: string, site?: string, url = "https://everyhand.example/api/import") =>
    new Request(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(origin ? { Origin: origin } : {}), ...(site ? { "Sec-Fetch-Site": site } : {}) },
      body: JSON.stringify({ text: "28 learners with microscopes" }),
    });
  for (const req of [request(), request("https://foreign.example"), request("https://everyhand.example", "cross-site"), request("http://everyhand.example", undefined, "http://everyhand.example/api/import")])
    assert.equal((await handler(req)).status, 403);
  assert.equal(calls, 0);
  const response = await handler(request("https://everyhand.example", "same-origin"));
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.equal(calls, 1);
  assert.equal((await handler(new Request("https://everyhand.example/api/health?probe=1"))).status, 200);
});

test("deployed handler preserves input boundaries and per-instance burst protection", async () => {
  const { createImportHandler } = await import("../server/import.ts");
  let calls = 0;
  const handler = createImportHandler(async () => {
    calls++;
    return { plan: samplePlan, assumptions: [] };
  }, { production: true });
  const post = (body: string, type = "application/json") => handler(new Request("https://everyhand.example/api/import", {
    method: "POST", headers: { Origin: "https://everyhand.example", "Content-Type": type }, body,
  }));
  assert.equal((await post("broken")).status, 400);
  assert.equal((await post(JSON.stringify({ text: "x".repeat(10001) }))).status, 400);
  assert.equal((await post(JSON.stringify({ text: "x".repeat(24001) }))).status, 413);
  assert.equal((await post('{"text":"notes"}', "text/plain")).status, 415);
  assert.equal(calls, 0);
  for (let i = 0; i < 6; i++) assert.equal((await post('{"text":"notes"}')).status, 200);
  assert.equal((await post('{"text":"notes"}')).status, 429);
  assert.equal(calls, 6);
});


test("Vercel entry point exports a shared Web handler without starting a server", async () => {
  const { default: entry } = await import("../api/index.ts");
  const response = await entry.fetch(new Request("https://everyhand.example/api/health"));
  assert.equal(response.status, 200);
  assert.equal((await response.json()).ok, true);
});
