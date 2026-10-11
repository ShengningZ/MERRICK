import { Type } from "typebox";
import { defineToolPlugin } from "openclaw/plugin-sdk/tool-plugin";

const DEFAULT_BRIDGE_URL = "http://127.0.0.1:8765";
const STATUS_TIMEOUT_MS = 800;

const configSchema = Type.Object({
  bridgeUrl: Type.Optional(Type.String({
    maxLength: 200,
    description: "MERRICK's loopback bridge URL. Only http://127.0.0.1 is accepted.",
  })),
}, { additionalProperties: false });

type Fetcher = (input: string, init?: RequestInit) => Promise<Response>;

export function normalizeBridgeUrl(raw = DEFAULT_BRIDGE_URL): URL {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error("MERRICK bridge URL is invalid. Use http://127.0.0.1:<port>.");
  }
  if (
    url.protocol !== "http:" ||
    url.hostname !== "127.0.0.1" ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  ) {
    throw new Error("MERRICK bridge must use a plain 127.0.0.1 HTTP origin.");
  }
  return url;
}

export async function probeMerrickBridge(
  bridgeUrl: string | undefined,
  fetcher: Fetcher = fetch,
): Promise<{ ok: true; hostState: "ready"; bridgeUrl: string } | { ok: false; hostState: "not_running"; message: string }> {
  const origin = normalizeBridgeUrl(bridgeUrl).origin;
  try {
    const response = await fetcher(`${origin}/health`, {
      headers: { accept: "application/json" },
      redirect: "error",
      signal: AbortSignal.timeout(STATUS_TIMEOUT_MS),
    });
    const body = await response.json().catch(() => null) as { ok?: unknown } | null;
    if (response.ok && body?.ok === true) {
      return { ok: true, hostState: "ready", bridgeUrl: origin };
    }
  } catch {
    // The public plugin intentionally returns an actionable state rather than
    // surfacing a host stack trace to an OpenClaw model or chat transcript.
  }
  return {
    ok: false,
    hostState: "not_running",
    message: "Start the MERRICK macOS app, then run this status check again.",
  };
}

export default defineToolPlugin({
  id: "merrick-companion",
  name: "MERRICK Companion",
  description: "Reports whether a local MERRICK macOS companion is ready. No desktop action is performed.",
  configSchema,
  tools: (tool) => [
    tool({
      name: "merrick_desktop_status",
      description: "Check whether the local MERRICK macOS app is running and ready. This does not control the computer.",
      optional: true,
      parameters: Type.Object({}),
      outputSchema: Type.Union([
        Type.Object({
          ok: Type.Literal(true),
          hostState: Type.Literal("ready"),
          bridgeUrl: Type.String(),
        }, { additionalProperties: false }),
        Type.Object({
          ok: Type.Literal(false),
          hostState: Type.Literal("not_running"),
          message: Type.String(),
        }, { additionalProperties: false }),
      ]),
      execute: async (_, config) => probeMerrickBridge(config.bridgeUrl),
    }),
  ],
});
