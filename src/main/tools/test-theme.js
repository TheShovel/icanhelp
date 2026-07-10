const path = require("path");
const fs = require("fs");
const os = require("os");

const MODEL_PATH = path.join(
  os.homedir(),
  ".cache",
  "icanhelp",
  "models",
  "Qwen_Qwen3.5-2B-Q4_K_M.gguf",
);
const { tools, executeToolCall } = require("../tools/registry");

const PROMPT =
  process.argv[2] || "change my theme to a dark green hacker theme";

console.log("=== Test harness ===");
console.log("Model:", MODEL_PATH);
console.log("Prompt:", PROMPT);
console.log("");

const TOOLS_COUNT = tools.length;
console.log("Tools loaded:", TOOLS_COUNT);
for (var i = 0; i < tools.length; i++) {
  var t = tools[i];
  console.log(
    "  " + t.function.name + ": " + t.function.description.slice(0, 80),
  );
  console.log(
    "    schema:",
    JSON.stringify(t.function.parameters).slice(0, 120),
  );
}
console.log("");

function buildSystemPrompt() {
  return "You are Canhelpy, a Linux desktop AI assistant.\nUse tools when appropriate.";
}

function buildFunctions(tools, executeTool) {
  var functions = {};

  for (var i = 0; i < tools.length; i++) {
    var fn = tools[i].function;
    functions[fn.name] = {
      description: fn.description,
      params: fn.parameters || { type: "object", properties: {} },
      handler: (function (name) {
        return async function (params) {
          console.log("\n=== FUNCTION CALLED: " + name + " ===");
          console.log("Raw params:", JSON.stringify(params, null, 2));
          console.log("typeof params:", typeof params);
          if (params && typeof params === "object") {
            console.log("params keys:", Object.keys(params));
            if (name === "set_theme") {
              console.log("params.properties type:", typeof params.properties);
              console.log(
                "params.properties value:",
                JSON.stringify(params.properties),
              );
              if (params.properties && typeof params.properties === "object") {
                console.log("properties keys:", Object.keys(params.properties));
              }
            }
          }
          try {
            var result = await executeTool(name, params);
            var resultStr = String(result);
            console.log("Result:", resultStr.slice(0, 200));
            return resultStr;
          } catch (e) {
            var errorStr = JSON.stringify({ error: e.message });
            console.log("Error:", errorStr);
            return errorStr;
          }
        };
      })(fn.name),
    };
  }

  return functions;
}

async function executeTool(name, args) {
  console.log(
    "  [executeTool] name:",
    name,
    "args:",
    JSON.stringify(args).slice(0, 200),
  );

  var tc = {
    id: "test-" + Date.now(),
    function: { name: name, arguments: JSON.stringify(args) },
  };

  var result = await executeToolCall(tc, {
    onSudoPrompt: async function () {
      console.log("  [sudo prompt requested]");
      return "";
    },
    onConfirm: async function (cmd) {
      console.log("  [confirm requested for:", cmd, "]");
      return true;
    },
  });

  if (name === "list_themes") {
    return JSON.stringify({ themes: [] });
  }

  return String(result);
}

async function main() {
  console.log("Loading node-llama-cpp...");
  var { getLlama, LlamaChatSession } = await import("node-llama-cpp");

  console.log("Loading model...");
  var llama = await getLlama();
  var model = await llama.loadModel({ modelPath: MODEL_PATH, gpuLayers: 99 });
  var context = await model.createContext({
    contextSize: 4096,
    batchSize: 512,
  });

  var session = new LlamaChatSession({
    contextSequence: context.getSequence(),
    systemPrompt: buildSystemPrompt(),
  });

  console.log("Chat wrapper:", session.chatWrapper?.wrapperName);

  var history = [{ type: "system", text: buildSystemPrompt() }];
  session.setChatHistory(history);

  var functions = buildFunctions(tools, executeTool);
  console.log("Functions:", Object.keys(functions).join(", "));
  console.log("");

  console.log("=== Sending prompt ===");
  console.log("Prompt:", PROMPT);
  console.log("");

  try {
    var result = await session.promptWithMeta(PROMPT, {
      functions: functions,
      documentFunctionParams: true,
      maxTokens: 2048,
      temperature: 0.7,
      stopOnAbortSignal: true,
      onTextChunk: function (chunk) {
        process.stdout.write(chunk);
      },
      onResponseChunk: function (chunk) {
        if (
          chunk &&
          chunk.type === "segment" &&
          chunk.segmentType === "thought"
        ) {
          console.log("\n[thinking]:", chunk.text.slice(0, 200));
        }
      },
    });

    console.log("");
    console.log("=== Final response ===");
    console.log(result.responseText);
  } catch (e) {
    console.log("Error:", e.message);
  }

  console.log("");
  console.log("=== Done ===");
  session.dispose();
}

main().catch(function (e) {
  console.error("Fatal:", e);
  process.exit(1);
});
