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

test("buildFunctions - onToolStart fires before executeTool", async (t) => {
  const { buildFunctions } = require("./llm-local");

  var calls = [];

  var tools = [
    {
      function: {
        name: "order_tool",
        description: "",
        parameters: { type: "object", properties: {} },
      },
    },
  ];

  function onToolStart(info) {
    calls.push("start");
  }

  async function executeTool(name, params) {
    calls.push("exec");
    return "done";
  }

  function onToolEnd(info) {
    calls.push("end");
  }

  var { functions } = buildFunctions(tools, executeTool, onToolStart, onToolEnd);

  await functions.order_tool.handler({});

  assert.deepStrictEqual(calls, ["start", "exec", "end"]);
});

test("buildFunctions - onToolStart yields before executeTool", async (t) => {
  const { buildFunctions } = require("./llm-local");

  var ordering = [];

  var tools = [
    {
      function: {
        name: "yield_tool",
        description: "",
        parameters: { type: "object", properties: {} },
      },
    },
  ];

  function onToolStart(info) {
    ordering.push("start");
  }

  async function executeTool(name, params) {
    // executeTool runs after a setImmediate yield — verify start came first
    ordering.push("exec-" + (ordering.length === 1 && ordering[0] === "start" ? "ok" : "wrong"));
    return "done";
  }

  function onToolEnd(info) {
    ordering.push("end");
  }

  var { functions } = buildFunctions(tools, executeTool, onToolStart, onToolEnd);

  await functions.yield_tool.handler({});

  assert.deepStrictEqual(ordering, ["start", "exec-ok", "end"]);
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

test("buildFunctions - onToolStart is called before executeTool", async (t) => {
  const { buildFunctions } = require("./llm-local");

  var startCalled = false;

  var tools = [
    {
      function: {
        name: "test",
        description: "",
        parameters: { type: "object", properties: {} },
      },
    },
  ];

  function onToolStart(info) {
    startCalled = true;
  }

  async function executeTool(name, params) {
    assert.ok(startCalled, "onToolStart should have been called before executeTool");
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
