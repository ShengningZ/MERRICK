import { describe, expect, it } from "vitest";
import entry from "./index.js";
import { getToolPluginMetadata } from "openclaw/plugin-sdk/tool-plugin";
import { normalizeBridgeUrl, probeMerrickBridge } from "./index.js";

describe("merrick-companion", () => {
  it("declares one optional, read-only host status tool", () => {
    const tools = getToolPluginMetadata(entry)?.tools;
    expect(tools?.map((tool) => tool.name)).toEqual(["merrick_desktop_status"]);
    expect(tools?.[0]?.optional).toBe(true);
  });

  it.each([
    "https://127.0.0.1:8765",
    "http://localhost:8765",
    "http://127.0.0.1:8765/unexpected",
    "http://user:password@127.0.0.1:8765",
    "http://example.com",
  ])("rejects a non-canonical bridge URL: %s", (url) => {
    expect(() => normalizeBridgeUrl(url)).toThrow();
  });

  it("reports a healthy local MERRICK bridge without an action", async () => {
    const result = await probeMerrickBridge("http://127.0.0.1:8765", async (url) => {
      expect(url).toBe("http://127.0.0.1:8765/health");
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    });
    expect(result).toEqual({ ok: true, hostState: "ready", bridgeUrl: "http://127.0.0.1:8765" });
  });

  it("returns an actionable status when the host is unavailable", async () => {
    const result = await probeMerrickBridge(undefined, async () => {
      throw new Error("connection refused");
    });
    expect(result).toMatchObject({ ok: false, hostState: "not_running" });
  });
});
