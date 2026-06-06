import process from "node:process";
import { performance } from "node:perf_hooks";

function parseArgs(argv) {
  const options = {
    url: "http://localhost:8080/api/kitchen/create",
    iterations: 2,
    concurrency: 1,
    prompt: `* 1 and 3/4 cups (219g) all-purpose flour (spoon & leveled)
* 1 teaspoon baking soda
* 1 teaspoon baking powder
* 1/2 teaspoon salt
* 1/2 cup (115g) unsalted butter, softened to room temperature
* 1/2 cup (100g) granulated sugar
* 1/4 cup (50g) packed light or dark brown sugar
* 2 large eggs, at room temperature
* 1/2 cup (120g) sour cream or plain/vanilla yogurt, at room temperature
* 2 teaspoons pure vanilla extract
* 1/4 cup (60ml) milk, at room temperature
* 1 and 1/2 cups (250g) fresh or frozen blueberries

Makes about 9

Bake for 5 minutes at 425 then, keeping the muffins in the oven, reduce the oven temperature to 350°F (177°C). Bake for an additional 18-20 minutes or until a toothpick inserted in the center comes out clean. The total time these muffins take in the oven is about 23-25 minutes, give or take. Allow the muffins to cool for 5 minutes in the muffin pan, then transfer to a wire rack to continue cooling.
`,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = argv[i + 1];

    if (arg === "--url" && next) {
      options.url = next;
      i += 1;
    } else if (arg === "--iterations" && next) {
      options.iterations = Number.parseInt(next, 10);
      i += 1;
    } else if (arg === "--concurrency" && next) {
      options.concurrency = Number.parseInt(next, 10);
      i += 1;
    } else if ((arg === "--prompt" || arg === "--message") && next) {
      options.prompt = next;
      i += 1;
    }
  }

  if (!Number.isInteger(options.iterations) || options.iterations < 1) {
    throw new Error("--iterations must be an integer greater than 0");
  }

  if (!Number.isInteger(options.concurrency) || options.concurrency < 1) {
    throw new Error("--concurrency must be an integer greater than 0");
  }

  return options;
}

async function timeRequest(url, prompt) {
  const startedAt = performance.now();

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ prompt }),
  });

  const durationMs = performance.now() - startedAt;
  const body = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      `Request failed with ${response.status}: ${JSON.stringify(body)}`,
    );
  }

  return {
    durationMs,
    title: body?.recipe?.title ?? body?.reply?.title ?? null,
    model: body?.model ?? null,
  };
}

function percentile(sortedValues, p) {
  const index = Math.ceil((p / 100) * sortedValues.length) - 1;
  return sortedValues[Math.max(0, index)];
}

function formatSeconds(durationMs) {
  return `${(durationMs / 1000).toFixed(2)} s`;
}

async function run() {
  const { url, iterations, concurrency, prompt } = parseArgs(
    process.argv.slice(2),
  );
  const results = [];
  let completed = 0;

  console.log(`Benchmarking text-only recipe creation`);
  console.log(`URL: ${url}`);
  console.log(`Iterations: ${iterations}`);
  console.log(`Concurrency: ${concurrency}`);
  // console.log(`Prompt: ${prompt}`);

  async function worker() {
    while (completed < iterations) {
      const current = completed;
      completed += 1;

      if (current >= iterations) {
        return;
      }

      const result = await timeRequest(url, prompt);
      results.push(result);
      console.log(
        `#${current + 1} ${formatSeconds(result.durationMs)}${result.model ? ` | ${result.model}` : ""}${result.title ? ` | ${result.title}` : ""}`,
      );
    }
  }

  const startedAt = performance.now();
  await Promise.all(
    Array.from({ length: Math.min(concurrency, iterations) }, () => worker()),
  );
  const totalMs = performance.now() - startedAt;

  const durations = results
    .map((result) => result.durationMs)
    .sort((a, b) => a - b);

  const average =
    durations.reduce((sum, value) => sum + value, 0) / durations.length;
  const models = [...new Set(results.map((result) => result.model).filter(Boolean))];

  console.log("");
  console.log(`Completed ${durations.length} requests in ${formatSeconds(totalMs)}`);
  console.log(`model ${models.length ? models.join(", ") : "unknown"}`);
  console.log(`avg ${formatSeconds(average)}`);
  console.log(`min ${formatSeconds(durations[0])}`);
  console.log(`max ${formatSeconds(durations[durations.length - 1])}`);
  console.log(`throughput ${(durations.length / (totalMs / 1000)).toFixed(2)} req/s`);
}

run().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
