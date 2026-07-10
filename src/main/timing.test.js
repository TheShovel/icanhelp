const test = require("node:test");
const assert = require("node:assert");

test("buildFunctions - onToolStart completes before executeTool runs", async (t) => {
  const { buildFunctions } = require("./llm-local");

  var toolStartOrder = 0;
  var execOrder = 0;
  var toolEndOrder = 0;
  var orders = [];

  var tools = [
    {
      function: {
        name: "test_tool",
        description: "A test tool",
        parameters: { type: "object", properties: {} },
      },
    },
  ];

  var startResolve;
  var startCalled = false;

  async function onToolStart(info) {
    startCalled = true;
    toolStartOrder = orders.length;
    orders.push("start");
    // Simulate the ack delay - just a microtask yield
    await new Promise(function (r) { setImmediate(r); });
  }

  async function executeTool(name, params) {
    execOrder = orders.length;
    orders.push("exec");
    return "done";
  }

  function onToolEnd(info) {
    toolEndOrder = orders.length;
    orders.push("end");
  }

  var { functions, state } = buildFunctions(
    tools,
    executeTool,
    onToolStart,
    onToolEnd,
  );

  var result = await functions.test_tool.handler({});

  assert.strictEqual(result, "done");
  assert.strictEqual(orders.length, 3);
  assert.strictEqual(orders[0], "start");
  assert.strictEqual(orders[1], "exec");
  assert.strictEqual(orders[2], "end");
  assert.ok(toolStartOrder < execOrder);
  assert.ok(execOrder < toolEndOrder);
});

test("buildFunctions - onToolStart blocking delays executeTool", async (t) => {
  const { buildFunctions } = require("./llm-local");

  var execCalledAt = null;
  var startResolvedAt = null;

  var tools = [
    {
      function: {
        name: "delay_tool",
        description: "A delayed tool",
        parameters: { type: "object", properties: {} },
      },
    },
  ];

  async function onToolStart(info) {
    // Simulate realistic ack delay (~16ms = one frame)
    await new Promise(function (r) { setTimeout(r, 30); });
    startResolvedAt = Date.now();
  }

  async function executeTool(name, params) {
    execCalledAt = Date.now();
    return "done";
  }

  function onToolEnd(info) {}

  var { functions } = buildFunctions(
    tools,
    executeTool,
    onToolStart,
    onToolEnd,
  );

  await functions.delay_tool.handler({});

  assert.ok(
    execCalledAt - startResolvedAt >= 0,
    "executeTool should start at or after onToolStart resolves",
  );
  assert.ok(
    execCalledAt - startResolvedAt < 5,
    "executeTool should start immediately after onToolStart resolves",
  );
});

test("buildFunctions - multiple tools maintain order", async (t) => {
  const { buildFunctions } = require("./llm-local");

  var calls = [];

  var toolDefs = [
    { function: { name: "tool_a", description: "", parameters: { type: "object", properties: {} } } },
    { function: { name: "tool_b", description: "", parameters: { type: "object", properties: {} } } },
  ];

  async function onToolStart(info) {
    calls.push({ type: "start", name: info.name });
    await new Promise(function (r) { setImmediate(r); });
  }

  async function executeTool(name, params) {
    calls.push({ type: "exec", name: name });
    return "ok";
  }

  function onToolEnd(info) {
    calls.push({ type: "end", name: info.name });
  }

  var { functions } = buildFunctions(toolDefs, executeTool, onToolStart, onToolEnd);

  await functions.tool_a.handler({});
  await functions.tool_b.handler({});

  assert.strictEqual(calls.length, 6);
  assert.deepStrictEqual(calls[0], { type: "start", name: "tool_a" });
  assert.deepStrictEqual(calls[1], { type: "exec", name: "tool_a" });
  assert.deepStrictEqual(calls[2], { type: "end", name: "tool_a" });
  assert.deepStrictEqual(calls[3], { type: "start", name: "tool_b" });
  assert.deepStrictEqual(calls[4], { type: "exec", name: "tool_b" });
  assert.deepStrictEqual(calls[5], { type: "end", name: "tool_b" });
});

test("buildFunctions - onToolStart is awaited (returns promise)", async (t) => {
  const { buildFunctions } = require("./llm-local");

  var execStarted = false;

  var tools = [
    {
      function: {
        name: "test",
        description: "",
        parameters: { type: "object", properties: {} },
      },
    },
  ];

  var startDone = false;

  async function onToolStart(info) {
    await new Promise(function (r) { setTimeout(r, 10); });
    startDone = true;
  }

  async function executeTool(name, params) {
    // If onToolStart is properly awaited, startDone should be true here
    assert.ok(startDone, "executeTool should run after onToolStart promise resolves");
    return "ok";
  }

  function onToolEnd(info) {}

  var { functions } = buildFunctions(tools, executeTool, onToolStart, onToolEnd);

  var result = await functions.test.handler({});
  assert.strictEqual(result, "ok");
});

test("buildFunctions - error in tool still calls onToolEnd", async (t) => {
  const { buildFunctions } = require("./llm-local");

  var endCalled = false;
  var endInfo = null;

  var tools = [
    {
      function: {
        name: "fail_tool",
        description: "",
        parameters: { type: "object", properties: {} },
      },
    },
  ];

  async function onToolStart(info) {
    await new Promise(function (r) { setImmediate(r); });
  }

  async function executeTool(name, params) {
    throw new Error("tool failed");
  }

  function onToolEnd(info) {
    endCalled = true;
    endInfo = info;
  }

  var { functions } = buildFunctions(tools, executeTool, onToolStart, onToolEnd);

  var result = await functions.fail_tool.handler({});
  assert.ok(result.includes("error"));
  assert.ok(endCalled);
  assert.strictEqual(endInfo.name, "fail_tool");
});
