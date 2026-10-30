import { EnvironmentId } from "@t3tools/contracts";
import { describe, expect, it } from "vite-plus/test";

import {
  canHostEnvironment,
  findSavedTailscaleEnvironment,
  tailscaleMachineSshTarget,
} from "./TailscaleMachines.logic";

const surface = {
  name: "surface-black",
  dnsName: "surface-black.tail.ts.net",
  tailnetIpv4: "100.102.185.114",
};

describe("tailscale machines", () => {
  it("connects by MagicDNS name, falling back to the tailnet IP", () => {
    expect(tailscaleMachineSshTarget(surface)).toEqual({
      alias: "surface-black",
      hostname: "surface-black.tail.ts.net",
      username: null,
      port: null,
    });
    expect(tailscaleMachineSshTarget({ ...surface, dnsName: null })?.hostname).toBe(
      "100.102.185.114",
    );
    expect(tailscaleMachineSshTarget({ ...surface, dnsName: null, tailnetIpv4: null })).toBeNull();
  });

  it("finds the saved environment by DNS name, IP or alias, and only that one", () => {
    const saved = (id: string, alias: string, hostname: string) => ({
      environmentId: EnvironmentId.make(id),
      target: { alias, hostname, username: "me", port: 22 },
    });
    expect(
      findSavedTailscaleEnvironment(surface, [
        saved("other", "laptop", "laptop.tail.ts.net"),
        saved("by-ip", "work", "100.102.185.114"),
      ]),
    ).toBe("by-ip");
    expect(
      findSavedTailscaleEnvironment(surface, [saved("by-dns", "x", "SURFACE-BLACK.tail.ts.net")]),
    ).toBe("by-dns");
    expect(
      findSavedTailscaleEnvironment(surface, [saved("by-alias", "surface-black", "10.0.0.5")]),
    ).toBe("by-alias");
    expect(
      findSavedTailscaleEnvironment(surface, [saved("other", "laptop", "laptop.tail.ts.net")]),
    ).toBeNull();
  });

  it("rules out phones and tablets as hosts", () => {
    expect(canHostEnvironment({ os: "linux" })).toBe(true);
    expect(canHostEnvironment({ os: "android" })).toBe(false);
  });
});
