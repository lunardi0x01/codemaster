import { useNavigate } from "@tanstack/react-router";
import { RefreshCwIcon } from "lucide-react";
import { create } from "zustand";

import { useEnvironmentQuery } from "~/state/query";
import { tailscaleMachinesStateAtom } from "~/state/tailscaleMachines";
import { TailscaleMachineList } from "../settings/TailscaleMachinesSection";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
} from "../ui/dialog";

const useAddComputerDialogStore = create<{ open: boolean }>(() => ({ open: false }));

export function openAddComputerDialog() {
  useAddComputerDialogStore.setState({ open: true });
}

function setAddComputerDialogOpen(open: boolean) {
  useAddComputerDialogStore.setState({ open });
}

/** Picks which tailnet machines appear in the sidebar, with a way out to any other SSH host. */
export function AddComputerDialog() {
  const open = useAddComputerDialogStore((state) => state.open);
  const navigate = useNavigate();
  const machinesQuery = useEnvironmentQuery(open ? tailscaleMachinesStateAtom : null);
  const hasDesktopBridge = typeof window !== "undefined" && window.desktopBridge !== undefined;
  return (
    <Dialog open={open} onOpenChange={setAddComputerDialogOpen}>
      <DialogPopup className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add a computer</DialogTitle>
          <DialogDescription>
            Switch on the machines from your tailnet you want here. Each one connects over SSH and
            gets its own section in the sidebar.
          </DialogDescription>
        </DialogHeader>
        <DialogPanel>
          {hasDesktopBridge ? (
            <TailscaleMachineList />
          ) : (
            <p className="text-sm text-muted-foreground">
              Tailnet machines are listed in the desktop app. Here, add a computer from Connections
              settings.
            </p>
          )}
        </DialogPanel>
        <DialogFooter>
          {hasDesktopBridge ? (
            <Button
              variant="ghost"
              disabled={machinesQuery.isPending}
              onClick={machinesQuery.refresh}
            >
              <RefreshCwIcon aria-hidden />
              Refresh
            </Button>
          ) : null}
          <Button
            variant="outline"
            onClick={() => {
              setAddComputerDialogOpen(false);
              void navigate({ to: "/settings/connections" });
            }}
          >
            Other SSH host…
          </Button>
          <Button onClick={() => setAddComputerDialogOpen(false)}>Done</Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}
