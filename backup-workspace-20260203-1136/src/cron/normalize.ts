import { normalizeAgentId } from "../routing/session-key.js";
import { parseAbsoluteTimeMs } from "./parse.js";
import { migrateLegacyCronPayload } from "./payload-migration.js";
import type { CronJobCreate, CronJobPatch } from "./types.js";

type UnknownRecord = Record<string, unknown>;

type NormalizeOptions = {
  applyDefaults?: boolean;
};

const DEFAULT_OPTIONS: NormalizeOptions = {
  applyDefaults: false,
};

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function coerceSchedule(schedule: UnknownRecord) {
  const next: UnknownRecord = { ...schedule };
  let kind = typeof schedule.kind === "string" ? schedule.kind : undefined;
  const atMsRaw = schedule.atMs;
  const atRaw = schedule.at;
  const parsedAtMs =
    typeof atMsRaw === "string"
      ? parseAbsoluteTimeMs(atMsRaw)
      : typeof atRaw === "string"
        ? parseAbsoluteTimeMs(atRaw)
        : null;

  if (!kind) {
    if (
      typeof schedule.atMs === "number" ||
      typeof schedule.at === "string" ||
      typeof schedule.atMs === "string"
    )
      kind = "at";
    else if (typeof schedule.everyMs === "number") kind = "every";
    else if (typeof schedule.expr === "string") kind = "cron";
  }

  if (typeof schedule.atMs !== "number" && parsedAtMs !== null) {
    next.atMs = parsedAtMs;
  }

  if ("at" in next) delete next.at;

  // Strip additional properties based on kind to satisfy strict schema validation
  const result: UnknownRecord = { kind };
  if (kind === "at") {
    if (typeof next.atMs === "number") result.atMs = next.atMs;
  } else if (kind === "every") {
    if (typeof next.everyMs === "number") result.everyMs = next.everyMs;
    if (typeof next.anchorMs === "number") result.anchorMs = next.anchorMs;
  } else if (kind === "cron") {
    if (typeof next.expr === "string") result.expr = next.expr;
    if (typeof next.tz === "string") result.tz = next.tz;
  } else {
    // Unknown kind - return as-is for validation to catch
    return next;
  }

  return result;
}

function coercePayload(payload: UnknownRecord) {
  const next: UnknownRecord = { ...payload };
  let kind = typeof payload.kind === "string" ? payload.kind : undefined;
  if (!kind) {
    if (typeof payload.text === "string") kind = "systemEvent";
    else if (typeof payload.message === "string") kind = "agentTurn";
  }

  // Back-compat: older configs used `provider` for delivery channel.
  migrateLegacyCronPayload(next);

  // Strip additional properties based on kind to satisfy strict schema validation
  const result: UnknownRecord = { kind };
  if (kind === "systemEvent") {
    if (typeof next.text === "string") result.text = next.text;
  } else if (kind === "agentTurn") {
    if (typeof next.message === "string") result.message = next.message;
    if (typeof next.model === "string") result.model = next.model;
    if (typeof next.thinking === "string") result.thinking = next.thinking;
    if (typeof next.timeoutSeconds === "number") result.timeoutSeconds = next.timeoutSeconds;
    if (typeof next.deliver === "boolean") result.deliver = next.deliver;
    if (typeof next.channel === "string") result.channel = next.channel;
    if (typeof next.to === "string") result.to = next.to;
    if (typeof next.bestEffortDeliver === "boolean") result.bestEffortDeliver = next.bestEffortDeliver;
  } else {
    // Unknown kind - return as-is for validation to catch
    return next;
  }

  return result;
}

function unwrapJob(raw: UnknownRecord) {
  if (isRecord(raw.data)) return raw.data;
  if (isRecord(raw.job)) return raw.job;
  return raw;
}

export function normalizeCronJobInput(
  raw: unknown,
  options: NormalizeOptions = DEFAULT_OPTIONS,
): UnknownRecord | null {
  if (!isRecord(raw)) return null;
  const base = unwrapJob(raw);
  const next: UnknownRecord = { ...base };

  if ("agentId" in base) {
    const agentId = (base as UnknownRecord).agentId;
    if (agentId === null) {
      next.agentId = null;
    } else if (typeof agentId === "string") {
      const trimmed = agentId.trim();
      if (trimmed) next.agentId = normalizeAgentId(trimmed);
      else delete next.agentId;
    }
  }

  if ("enabled" in base) {
    const enabled = (base as UnknownRecord).enabled;
    if (typeof enabled === "boolean") {
      next.enabled = enabled;
    } else if (typeof enabled === "string") {
      const trimmed = enabled.trim().toLowerCase();
      if (trimmed === "true") next.enabled = true;
      if (trimmed === "false") next.enabled = false;
    }
  }

  if (isRecord(base.schedule)) {
    next.schedule = coerceSchedule(base.schedule);
  }

  if (isRecord(base.payload)) {
    next.payload = coercePayload(base.payload);
  }

  if (options.applyDefaults) {
    if (!next.wakeMode) next.wakeMode = "next-heartbeat";
    if (!next.sessionTarget && isRecord(next.payload)) {
      const kind = typeof next.payload.kind === "string" ? next.payload.kind : "";
      if (kind === "systemEvent") next.sessionTarget = "main";
      if (kind === "agentTurn") next.sessionTarget = "isolated";
    }
  }

  // Fix mismatched sessionTarget/payload combinations
  // - main requires systemEvent
  // - isolated requires agentTurn
  if (isRecord(next.payload)) {
    const payloadKind = typeof next.payload.kind === "string" ? next.payload.kind : "";
    if (next.sessionTarget === "main" && payloadKind === "agentTurn") {
      // Change sessionTarget to isolated to preserve the agentTurn payload
      next.sessionTarget = "isolated";
    } else if (next.sessionTarget === "isolated" && payloadKind === "systemEvent") {
      // Change sessionTarget to main to preserve the systemEvent payload
      next.sessionTarget = "main";
    }
  }

  return next;
}

export function normalizeCronJobCreate(
  raw: unknown,
  options?: NormalizeOptions,
): CronJobCreate | null {
  return normalizeCronJobInput(raw, {
    applyDefaults: true,
    ...options,
  }) as CronJobCreate | null;
}

export function normalizeCronJobPatch(
  raw: unknown,
  options?: NormalizeOptions,
): CronJobPatch | null {
  return normalizeCronJobInput(raw, {
    applyDefaults: false,
    ...options,
  }) as CronJobPatch | null;
}
