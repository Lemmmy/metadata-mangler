import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { type Dispatch, type SetStateAction } from "react";
import type { VisibilityState } from "@tanstack/react-table";

interface ColumnVisibilityDropdownProps {
  columnVisibility: VisibilityState;
  setColumnVisibility: Dispatch<SetStateAction<VisibilityState>>;
}

const columnLabels: Record<string, string> = {
  filename: "Filename",
  trackNumber: "Track #",
  discNumber: "Disc #",
  title: "Title",
  artists: "Artists",
  album: "Album",
  duration: "Duration",
};

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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="ml-auto">
          Columns
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {Object.entries(columnVisibility).map(([columnId, isVisible]) => (
          <DropdownMenuCheckboxItem
            key={columnId}
            checked={isVisible}
            onCheckedChange={() => toggleColumnVisibility(columnId)}
          >
            {columnLabels[columnId] || columnId}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
