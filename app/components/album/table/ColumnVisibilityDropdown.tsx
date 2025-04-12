import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { useMemo, type Dispatch, type SetStateAction } from "react";
import type { VisibilityState } from "@tanstack/react-table";
import { albumTableColumns } from "./useAlbumTableColumns";

interface ColumnVisibilityDropdownProps {
  columnVisibility: VisibilityState;
  setColumnVisibility: Dispatch<SetStateAction<VisibilityState>>;
}

export function ColumnVisibilityDropdown({
  columnVisibility,
  setColumnVisibility,
}: ColumnVisibilityDropdownProps) {
  const toggleColumnVisibility = (columnId: string) => {
    setColumnVisibility((s) => ({
      ...s,
      [columnId]: !s[columnId],
    }));
  };

  const columnLabels = useMemo(() => {
    return albumTableColumns.reduce(
      (acc, column) => {
        const id = column.id;
        if (!id) return acc;

        const header = column.header;
        acc[id] = typeof header === "string" ? header : id;

        return acc;
      },
      {} as Record<string, string>,
    );
  }, []);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="ml-auto">
          Columns
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Toggle table columns</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {Object.entries(columnLabels).map(([columnId, label]) => (
          <DropdownMenuCheckboxItem
            key={columnId}
            checked={columnVisibility[columnId]}
            onCheckedChange={() => toggleColumnVisibility(columnId)}
            onSelect={(e) => e.preventDefault()} // Keep the menu open
          >
            {label}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
