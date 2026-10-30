import { type EnvironmentId, resolveEnvironmentMachineKind } from "@t3tools/contracts";
import { ChevronDownIcon, FolderPlusIcon } from "lucide-react";
import { memo } from "react";

import { cn } from "~/lib/utils";
import { useEnvironment } from "../../state/environments";
import {
  ConnectionStatusDot,
  connectionPhaseDotClassName,
  connectionPhasePingClassName,
} from "../ConnectionStatusDot";
import { EnvironmentMachineIcon } from "../EnvironmentMachineIcon";
import { Button } from "../ui/button";

function sidebarMachineRowId(environmentId: EnvironmentId) {
  return `machine:${environmentId}`;
}

/** A machine section in the folder sidebar; its project folders follow it. */
export const SidebarMachineHeader = memo(function SidebarMachineHeader(props: {
  environmentId: EnvironmentId;
  label: string;
  collapsed: boolean;
  projectCount: number;
  onToggle: (environmentId: EnvironmentId) => void;
  onAddProject: (environmentId: EnvironmentId) => void;
}) {
  const { environmentId, collapsed } = props;
  const environment = useEnvironment(environmentId);
  const rowId = sidebarMachineRowId(environmentId);
  const phase = environment?.connection.phase ?? "offline";
  return (
    <li data-testid="sidebar-machine" className="group/machine relative mt-3 list-none first:mt-0">
      <button
        type="button"
        role="treeitem"
        tabIndex={-1}
        data-sidebar-row={rowId}
        aria-expanded={!collapsed}
        onClick={() => props.onToggle(environmentId)}
        className="flex h-8 w-full cursor-pointer items-center gap-2 rounded-(--control-radius) px-(--sidebar-row-content-inset) text-left outline-none hover:bg-sidebar-row-hover focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
      >
        <EnvironmentMachineIcon
          aria-hidden
          kind={resolveEnvironmentMachineKind(environment?.serverConfig ?? null)}
          className="size-4 shrink-0 text-sidebar-muted-foreground"
        />
        <span className="min-w-0 flex-1 truncate text-xs font-semibold tracking-wide text-sidebar-muted-foreground uppercase">
          {props.label}
        </span>
        <ConnectionStatusDot
          dotClassName={connectionPhaseDotClassName(phase)}
          pingClassName={connectionPhasePingClassName(phase)}
        />
        <span className="sr-only">{`, ${phase}`}</span>
        {collapsed && props.projectCount > 0 ? (
          <span className="shrink-0 text-xs tabular-nums text-sidebar-muted-foreground group-hover/machine:invisible pointer-coarse:invisible">
            {props.projectCount}
          </span>
        ) : null}
        <ChevronDownIcon
          aria-hidden
          className={cn(
            "size-3 shrink-0 text-sidebar-muted-foreground transition-transform",
            collapsed && "-rotate-90",
          )}
        />
      </button>
      <span className="absolute inset-y-0 right-6 flex items-center opacity-0 focus-within:opacity-100 group-hover/machine:opacity-100 pointer-coarse:opacity-100">
        <Button
          data-sidebar-action-for={rowId}
          size="icon-xs"
          variant="ghost-muted"
          aria-label={`Add a project on ${props.label}`}
          onClick={() => props.onAddProject(environmentId)}
        >
          <FolderPlusIcon aria-hidden />
        </Button>
      </span>
    </li>
  );
});
