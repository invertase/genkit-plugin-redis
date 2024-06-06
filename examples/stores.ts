import { configureGenkit } from "@genkit-ai/core";
import { redis } from "@invertase/genkit-plugin-redis";

configureGenkit({
  plugins: [
    redis({
      // Tell the plugin where to connect, if not provided
      // it defaults to localhost:6379 as below:
      // connectionString: "redis://localhost:6379",

      flowStateStore: {
        // The Redis key to use for storing flow states.
        storageKey: "flowState",
      },
      traceStore: {
        // The Redis key to use for storing trace data.
        storageKey: "trace",
      },
    }),
  ],
  enableTracingAndMetrics: true,
  // Tell GenKit to use the Redis plugin for flow state.
  flowStateStore: "redis",
  // Tell GenKit to use the Redis plugin for trace data.
  traceStore: "redis",
});

// .. define your flows here
