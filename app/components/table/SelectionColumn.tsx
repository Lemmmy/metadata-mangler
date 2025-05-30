import { type ColumnHelper } from "@tanstack/react-table";
import { Checkbox } from "../ui/checkbox";

export function getSelectionColumn<T>(columnHelper: ColumnHelper<T>) {
  return columnHelper.display({
    id: "select-col",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllRowsSelected()}
        indeterminate={table.getIsSomeRowsSelected()}
        onClick={table.getToggleAllRowsSelectedHandler()}
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        disabled={!row.getCanSelect()}
        onClick={row.getToggleSelectedHandler()}
      />
    ),
    size: 40,
    enableResizing: false,
    meta: {
      className: "leading-none items-center justify-center",
      visibility: "always",
    },
  });
}
