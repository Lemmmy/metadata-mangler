import {
  flexRender,
  type ColumnDef,
  type VisibilityState,
} from "@tanstack/react-table";
import { useMemo, type Dispatch, type SetStateAction } from "react";
import { Button, type ButtonProps } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";

interface ColumnVisibilityDropdownProps<T> extends ButtonProps {
  columns: ColumnDef<T, unknown>[];
  columnVisibility: VisibilityState;
  setColumnVisibility: Dispatch<SetStateAction<VisibilityState>>;
}

export function ColumnVisibilityDropdown<T>({
  columns,
  columnVisibility,
  setColumnVisibility,
  ...props
}: ColumnVisibilityDropdownProps<T>) {
  const toggleColumnVisibility = (columnId: string) => {
    setColumnVisibility((s) => ({
      ...s,
      [columnId]: !s[columnId],
    }));
  };

  const columnLabels = useMemo(() => {
    return columns.reduce(
      (acc, column) => {
        const id = column.id;
        if (!id || column.meta?.visibility === "always") return acc;

        const header = column.header;
        acc[id] =
          typeof header === "string"
            ? header
            : header
              ? flexRender(header as any, {})
              : "";

        return acc;
      },
      {} as Record<string, any>,
    );
  }, [columns]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" {...props}>
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
