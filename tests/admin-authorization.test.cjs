const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

// These dependency-free checks exercise the real guard with a stub JWT verifier,
// then check its registration on every privileged route. They do not replace
// HTTP integration tests with Express, json-server, and jsonwebtoken installed.
const root = process.env.TEST_SOURCE_ROOT || path.resolve(__dirname, "..");
const implementations = [
  {
    name: "local server",
    file: "wdd330-backend/server.js",
    registrations: [
      /server\.post\(\["\/admin\/draw", "\/api\/admin\/draw"\], requireAdmin, /,
      /server\.post\(\["\/admin\/reset", "\/api\/admin\/reset"\], requireAdmin, /,
    ],
  },
  {
    name: "Netlify function",
    file: "wdd330-frontend/netlify/functions/api.cjs",
    registrations: [
      /app\.post\("\/admin\/draw", requireAdmin, handleDraw\)/,
      /app\.post\("\/api\/admin\/draw", requireAdmin, handleDraw\)/,
      /app\.post\("\/admin\/reset", requireAdmin, handleReset\)/,
      /app\.post\("\/api\/admin\/reset", requireAdmin, handleReset\)/,
    ],
  },
];

for (const implementation of implementations) {
  const source = fs.readFileSync(path.join(root, implementation.file), "utf8");

  function invoke(authorization, verifier) {
    const match = source.match(/function requireAdmin\(req, res, next\) \{[\s\S]*?^\}/m);
    assert.ok(match, "privileged routes need an authorization guard");
    const guard = vm.runInNewContext(`(${match[0]})`, { verifyToken: verifier });
    const req = { headers: { authorization } };
    const result = { status: undefined, body: undefined, continued: false };
    const res = {
      status(code) { result.status = code; return this; },
      json(body) { result.body = body; return this; },
    };
    guard(req, res, () => { result.continued = true; });
    return { ...result, claims: req.claims };
  }

  test(`${implementation.name}: every draw/reset route authorizes before the mutation handler`, () => {
    for (const registration of implementation.registrations) {
      assert.match(source, registration);
    }
    assert.doesNotMatch(source, /(?:server|app)\.all\([^\n]*(?:admin\/draw|admin\/reset)/);
    const publicPaths = source.match(/const publicPaths = \[([\s\S]*?)\];/);
    assert.ok(publicPaths, "public endpoint allowlist exists");
    assert.doesNotMatch(publicPaths[1], /admin\/(?:draw|reset)/);
  });

  test(`${implementation.name}: missing or malformed credentials stop before token verification`, () => {
    for (const authorization of [undefined, "", "Basic abc", "Bearer", "Bearer ", "Bearer abc extra", ["Bearer abc"]]) {
      const result = invoke(authorization, () => assert.fail("malformed credentials reached verifier"));
      assert.equal(result.status, 401);
      assert.equal(result.continued, false);
    }
  });

  test(`${implementation.name}: invalid or expired JWT cannot mutate the raffle`, () => {
    for (const message of ["invalid signature", "jwt expired"]) {
      const result = invoke("Bearer token", () => { throw new Error(message); });
      assert.equal(result.status, 401);
      assert.equal(result.continued, false);
    }
  });

  test(`${implementation.name}: client and absent role claims cannot mutate the raffle`, () => {
    for (const claims of [{ role: "client" }, { email: "client@example.test" }, null, "admin"]) {
      const result = invoke("Bearer token", () => claims);
      assert.equal(result.status, 403);
      assert.equal(result.continued, false);
    }
  });

  test(`${implementation.name}: verified administrator reaches the mutation handler`, () => {
    const claims = { email: "admin@example.test", role: "admin" };
    const result = invoke("Bearer valid-token", (token) => {
      assert.equal(token, "valid-token");
      return claims;
    });
    assert.equal(result.status, undefined);
    assert.equal(result.continued, true);
    assert.equal(result.claims, claims);
  });
}
