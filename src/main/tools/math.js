const { loadPipeline, computeExpression } = require("../math-model");

async function solveMath(args) {
  var expression = (args && args.expression) || "";
  if (!expression) {
    return JSON.stringify({ error: "expression is required" });
  }

  // Ensure the model is loaded
  var pipelineReady = await loadPipeline();
  if (!pipelineReady) {
    return JSON.stringify({
      error: "Math model is not available. Download it from Settings > Addons.",
    });
  }

  var result = await computeExpression(expression);
  if (!result) {
    return JSON.stringify({ error: "Math computation failed" });
  }

  return JSON.stringify({
    expression: expression,
    result: result,
  });
}

module.exports = { solveMath };
