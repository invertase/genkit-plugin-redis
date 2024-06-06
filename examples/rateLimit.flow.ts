import { configureGenkit } from "@genkit-ai/core";
import { defineFlow, startFlowsServer } from "@genkit-ai/flow";
import * as z from "zod";
import { rateLimit, redis } from "@invertase/genkit-plugin-redis";

configureGenkit({
  plugins: [
    redis({
      // Tell the plugin where to connect, if not provided
      // it defaults to localhost:6379 as below:
      // connectionString: "redis://localhost:6379",
    }),
  ],
});

export const expensiveFlow = defineFlow(
  {
    name: "expensiveFlow",
    inputSchema: z.string(),
    outputSchema: z.string(),
  },
  async (subject) => {
    // This can be any arbitrary string, e.g. a user ID or a session ID.
    // In this case we are globally limiting the rate of this flow to 1 request per minute,
    // so we'll just use the name of the flow as the identifier.
    const limitIdentifier = "expensiveFlow";
    // 1 request per minute
    const rateLimited = await rateLimit(limitIdentifier, 1, 60);
    if (rateLimited) {
      return "You have exceeded the rate limit. Please try again in a few seconds.";
    }
    // .. do something expensive
    return "Hello there!";
  },
);

startFlowsServer();
