const path = require("path");
const os = require("os");

let pipelinePromise = null;
let captioner = null;

function send(message) {
  if (process.send) process.send(message);
}

function serializeProgress(progress) {
  if (typeof progress === "number") return progress;
  if (!progress || typeof progress !== "object") return null;

  return {
    status: progress.status,
    file: progress.file,
    loaded: progress.loaded,
    total: progress.total,
    progress: progress.progress,
  };
}

function makePipeline(mod, modelId) {
  return mod.pipeline("image-to-text", modelId, {
    quantized: true,
    progress_callback: function (progress) {
      var serialized = serializeProgress(progress);
      if (serialized) send({ type: "progress", progress: serialized });
    },
  });
}

async function loadPipeline() {
  if (captioner) return captioner;
  if (!pipelinePromise) {
    pipelinePromise = (async function () {
      send({ type: "log", message: "Loading transformers module" });
      var mod = await import("@xenova/transformers");
      mod.env.cacheDir = path.join(
        os.homedir(),
        ".cache",
        "icanhelp",
        "transformers",
      );

      if (process.env.HF_TOKEN) {
        send({ type: "log", message: "HF_TOKEN set — trying BLIP" });
        try {
          captioner = await makePipeline(
            mod,
            "Xenova/blip-image-captioning-base",
          );
          send({ type: "log", message: "BLIP ready" });
          send({ type: "ready" });
          return captioner;
        } catch (e) {
          send({
            type: "log",
            message:
              "BLIP unavailable: " +
              (e.message || String(e)) +
              ". Falling back to ViT-GPT2.",
          });
          captioner = null;
        }
      }

      send({ type: "log", message: "Loading ViT-GPT2 pipeline" });
      captioner = await makePipeline(mod, "Xenova/vit-gpt2-image-captioning");
      send({ type: "ready" });
      return captioner;
    })()
      .catch(function (e) {
        captioner = null;
        send({ type: "load-error", error: e.message || String(e) });
        return null;
      })
      .finally(function () {
        pipelinePromise = null;
      });
  }
  return await pipelinePromise;
}

process.on("message", async function (message) {
  if (!message || typeof message !== "object") return;

  if (message.type === "load") {
    await loadPipeline();
    return;
  }

  if (message.type === "describe") {
    try {
      var pipe = await loadPipeline();
      if (!pipe) {
        send({ type: "result", id: message.id, caption: null });
        return;
      }

      var result = await pipe(message.imagePath, {
        max_new_tokens: 50,
        num_beams: 4,
      });
      var caption = result && result[0] ? result[0].generated_text : null;
      send({ type: "result", id: message.id, caption: caption || null });
    } catch (e) {
      send({
        type: "describe-error",
        id: message.id,
        error: e.message || String(e),
      });
    }
  }
});

process.on("disconnect", function () {
  process.exit(0);
});
