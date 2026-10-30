import type { DesktopTailscaleMachine } from "@t3tools/contracts";
import * as Effect from "effect/Effect";
import * as Schema from "effect/Schema";
import { Atom } from "effect/reactivity";

class TailscaleDiscoveryError extends Schema.TaggedError<TailscaleDiscoveryError>()(
  "TailscaleDiscoveryError",
  { cause: Schema.Defect() },
) {
  override get message(): string {
    return "Failed to list tailnet machines.";
  }
}

const discoverTailscaleMachines = Effect.fn("discoverTailscaleMachines")(function* () {
  const bridge = typeof window === "undefined" ? undefined : window.desktopBridge;
  if (!bridge) return [] as ReadonlyArray<DesktopTailscaleMachine>;
  return yield* Effect.tryPromise({
    try: (): Promise<ReadonlyArray<DesktopTailscaleMachine>> => bridge.discoverTailscaleMachines(),
    catch: (cause) => new TailscaleDiscoveryError({ cause }),
  });
});

export const tailscaleMachinesStateAtom = Atom.make(discoverTailscaleMachines()).pipe(
  Atom.swr({ staleTime: 30_000, revalidateOnMount: true }),
  Atom.keepAlive,
  Atom.withLabel("desktop:tailscale-machines"),
);
