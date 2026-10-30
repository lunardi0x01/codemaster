import type {
  DesktopSshEnvironmentTarget,
  DesktopTailscaleMachine,
  EnvironmentId,
} from "@t3tools/contracts";

// Phones and tablets join tailnets but cannot run the T3 server over SSH.
const HOSTLESS_OS = new Set(["android", "ios", "iOS", "tvOS"]);

export function canHostEnvironment(machine: Pick<DesktopTailscaleMachine, "os">): boolean {
  return !HOSTLESS_OS.has(machine.os);
}

export function tailscaleMachineSshTarget(
  machine: Pick<DesktopTailscaleMachine, "name" | "dnsName" | "tailnetIpv4">,
): DesktopSshEnvironmentTarget | null {
  const hostname = machine.dnsName ?? machine.tailnetIpv4;
  return hostname === null ? null : { alias: machine.name, hostname, username: null, port: null };
}

/** The saved SSH environment that reaches this tailnet machine, by MagicDNS name, tailnet IP, or alias. */
export function findSavedTailscaleEnvironment(
  machine: Pick<DesktopTailscaleMachine, "name" | "dnsName" | "tailnetIpv4">,
  savedSshTargets: ReadonlyArray<{
    readonly environmentId: EnvironmentId;
    readonly target: DesktopSshEnvironmentTarget;
  }>,
): EnvironmentId | null {
  const hostnames = new Set(
    [machine.dnsName, machine.tailnetIpv4].flatMap((value) =>
      value === null ? [] : [value.toLowerCase()],
    ),
  );
  return (
    savedSshTargets.find(
      ({ target }) =>
        hostnames.has(target.hostname.toLowerCase()) ||
        target.alias.toLowerCase() === machine.name.toLowerCase(),
    )?.environmentId ?? null
  );
}
