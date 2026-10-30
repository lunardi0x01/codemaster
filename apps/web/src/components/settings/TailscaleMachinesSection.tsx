import {
  isAtomCommandInterrupted,
  squashAtomCommandFailure,
} from "@t3tools/client-runtime/state/runtime";
import type { DesktopTailscaleMachine, EnvironmentId } from "@t3tools/contracts";
import * as Option from "effect/Option";
import { RefreshCwIcon } from "lucide-react";
import { useState } from "react";

import { environmentCatalog } from "~/connection/catalog";
import { connectSshEnvironment as connectSshEnvironmentAtom } from "~/connection/onboarding";
import type { EnvironmentPresentation } from "~/state/environments";
import { useEnvironmentQuery } from "~/state/query";
import { tailscaleMachinesStateAtom } from "~/state/tailscaleMachines";
import { useAtomCommand } from "../../state/use-atom-command";
import { Button } from "../ui/button";
import { Switch } from "../ui/switch";
import { stackedThreadToast, toastManager } from "../ui/toast";
import { formatDesktopSshConnectionError } from "./ConnectionsSettings.logic";
import { SettingsRow, SettingsSection } from "./settingsLayout";
import { searchableSetting } from "./settingsSearch";
import {
  canHostEnvironment,
  findSavedTailscaleEnvironment,
  tailscaleMachineSshTarget,
} from "./TailscaleMachines.logic";

const NO_MACHINES: ReadonlyArray<DesktopTailscaleMachine> = [];

/**
 * Machines on this computer's tailnet. Switching one on connects it over SSH as an
 * environment, so it shows in the sidebar; switching it off removes that environment.
 */
export function TailscaleMachinesSection(props: {
  readonly savedEnvironments: ReadonlyArray<EnvironmentPresentation>;
}) {
  const machinesQuery = useEnvironmentQuery(tailscaleMachinesStateAtom);
  const machines = machinesQuery.data ?? NO_MACHINES;
  const connectSshEnvironment = useAtomCommand(connectSshEnvironmentAtom, { reportFailure: false });
  const removeEnvironment = useAtomCommand(environmentCatalog.remove, { reportFailure: false });
  const [busyMachine, setBusyMachine] = useState<string | null>(null);

  const savedSshTargets = props.savedEnvironments.flatMap((environment) => {
    const profile = environment.entry.profile;
    return Option.isSome(profile) && profile.value._tag === "SshConnectionProfile"
      ? [{ environmentId: environment.environmentId, target: profile.value.target }]
      : [];
  });

  const reportFailure = (title: string, description: string) =>
    toastManager.add(stackedThreadToast({ type: "error", title, description }));

  const addMachine = async (machine: DesktopTailscaleMachine) => {
    const target = tailscaleMachineSshTarget(machine);
    if (target === null) return;
    setBusyMachine(machine.name);
    const result = await connectSshEnvironment({ target, label: machine.name });
    setBusyMachine(null);
    if (result._tag === "Failure" && !isAtomCommandInterrupted(result)) {
      reportFailure(
        `Could not add ${machine.name}`,
        formatDesktopSshConnectionError(squashAtomCommandFailure(result)),
      );
    }
  };

  const removeMachine = async (machine: DesktopTailscaleMachine, environmentId: EnvironmentId) => {
    setBusyMachine(machine.name);
    const result = await removeEnvironment(environmentId);
    setBusyMachine(null);
    if (result._tag === "Failure" && !isAtomCommandInterrupted(result)) {
      const error = squashAtomCommandFailure(result);
      reportFailure(
        `Could not remove ${machine.name}`,
        error instanceof Error ? error.message : "Failed to remove the environment.",
      );
    }
  };

  return (
    <SettingsSection
      {...searchableSetting("tailscale-machines")}
      headerAction={
        <Button
          size="icon-xs"
          variant="ghost-muted"
          aria-label="Refresh tailnet machines"
          disabled={machinesQuery.isPending}
          onClick={machinesQuery.refresh}
        >
          <RefreshCwIcon aria-hidden />
        </Button>
      }
    >
      {machines.length === 0 ? (
        <SettingsRow
          title={machinesQuery.isPending ? "Looking for tailnet machines…" : "No tailnet machines"}
          description="Machines on your tailnet show here when Tailscale is running on this computer."
        />
      ) : null}
      {machines.map((machine) => {
        const environmentId = findSavedTailscaleEnvironment(machine, savedSshTargets);
        const canHost = canHostEnvironment(machine);
        const details = [
          machine.os || "unknown OS",
          machine.online ? "online" : "offline",
          ...(machine.tailscaleSsh ? ["Tailscale SSH"] : []),
          ...(canHost ? [] : ["can't host projects"]),
        ];
        return (
          <SettingsRow
            key={machine.name}
            title={machine.name}
            description={details.join(" · ")}
            control={
              <Switch
                checked={environmentId !== null}
                disabled={
                  busyMachine !== null || (environmentId === null && (!canHost || !machine.online))
                }
                onCheckedChange={(checked) => {
                  if (checked) void addMachine(machine);
                  else if (environmentId !== null) void removeMachine(machine, environmentId);
                }}
                aria-label={`Use ${machine.name}`}
              />
            }
          />
        );
      })}
    </SettingsSection>
  );
}
