import {
  FlowState,
  FlowStateQuery,
  FlowStateQueryResponse,
  FlowStateSchema,
  FlowStateStore,
} from "@genkit-ai/core";

import {
  TraceData,
  TraceDataSchema,
  TraceQuery,
  TraceQueryResponse,
  TraceStore,
} from "@genkit-ai/core/tracing";
import { getRedisClient } from "./client";

export class RedisFlowStateStore implements FlowStateStore {
  readonly key: string;

  constructor(params: { storageKey?: string }) {
    this.key = "flow_storage:" + (params.storageKey || "states");
  }

  async load(id: string): Promise<FlowState | undefined> {
    const flowState = await getRedisClient().genkitPluginRedisStorageLoad(
      this.key,
      id,
    );
    if (flowState === null) {
      return undefined;
    }
    return FlowStateSchema.parse(JSON.parse(flowState));
  }

  async save(id: string, state: FlowState): Promise<void> {
    return getRedisClient().genkitPluginRedisStorageSave(
      this.key,
      id,
      JSON.stringify(state),
    );
  }

  async list(query?: FlowStateQuery): Promise<FlowStateQueryResponse> {
    const [values, cursor] =
      await getRedisClient().genkitPluginRedisStorageList(
        this.key,
        String(query?.limit || 0),
        String(query?.continuationToken || 0),
      );
    const valuesParsed = values.map((r) =>
      FlowStateSchema.parse(JSON.parse(r[1])),
    );
    let continuationToken: string | undefined;
    if (query?.limit && cursor !== "0") {
      continuationToken = cursor;
    }
    return {
      flowStates: valuesParsed,
      continuationToken,
    };
  }
}

export class RedisTraceStore implements TraceStore {
  readonly key: string;

  constructor(params: { storageKey?: string }) {
    this.key = "trace_storage:" + (params.storageKey || "traces");
  }

  async load(traceId: string): Promise<TraceData | undefined> {
    const traceData = await getRedisClient().genkitPluginRedisStorageLoad(
      this.key,
      traceId,
    );
    if (traceData === null) {
      return undefined;
    }
    return TraceDataSchema.parse(JSON.parse(traceData));
  }

  async save(traceId: string, traceData: TraceData): Promise<void> {
    return getRedisClient().genkitPluginRedisStorageSave(
      this.key,
      traceId,
      JSON.stringify(traceData),
    );
  }

  async list(query?: TraceQuery): Promise<TraceQueryResponse> {
    const [values, cursor] =
      await getRedisClient().genkitPluginRedisStorageList(
        this.key,
        String(query?.limit || 0),
        String(query?.continuationToken || 0),
      );
    const valuesParsed = values.map((r) =>
      TraceDataSchema.parse(JSON.parse(r[1])),
    );
    let continuationToken: string | undefined;
    if (query?.limit && cursor !== "0") {
      continuationToken = cursor;
    }
    return {
      traces: valuesParsed,
      continuationToken,
    };
  }
}
