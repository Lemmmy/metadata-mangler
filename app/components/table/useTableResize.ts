import { type Table, type VisibilityState } from "@tanstack/react-table";
import { useMeasure } from "@uidotdev/usehooks";
import { useEffect, useMemo, type RefCallback } from "react";
import { noop } from "~/lib/noop";

export function useTableResize<T>(
  table: Table<T>,
  columnVisibility?: VisibilityState,
): {
  tableRef: RefCallback<HTMLDivElement>;
  columnSizeVars: { [key: string]: number };
} {
  "use no memo";
  const [tableRef, { width }] = useMeasure<HTMLDivElement>();

  const columnSizingInfo = table.getState().columnSizingInfo;
  const columnSizing = table.getState().columnSizing;

  const resetColumnSizing = table.resetColumnSizing;
  const getFlatHeaders = table.getFlatHeaders;

  useEffect(() => {
    resetColumnSizing();
  }, [columnVisibility, resetColumnSizing]);

  // https://tanstack.com/table/v8/docs/framework/react/examples/column-resizing-performant
  const columnSizeVars = useMemo(() => {
    const headers = getFlatHeaders();
    const colSizes: { [key: string]: number } = {};

    // We need these in the dependency array to re-render the table body
    noop(columnSizingInfo, columnSizing, columnVisibility);

    // Calculate total width of all columns
    let totalWidth = 0;
    const resizableHeaders: typeof headers = [];
    const fixedHeaders: typeof headers = [];

    // First pass: separate fixed and resizable columns, calculate total width
    for (let i = 0; i < headers.length; i++) {
      const header = headers[i]!;
      const canResize = header.column.getCanResize();

      if (canResize) {
        resizableHeaders.push(header);
      } else {
        fixedHeaders.push(header);
      }

      totalWidth += header.getSize();
    }

    // Calculate width of fixed columns
    const fixedWidth = fixedHeaders.reduce(
      (sum, header) => sum + header.getSize(),
      0,
    );

    // Calculate scaling factor if needed
    let scalingFactor = 1;
    if (width && totalWidth > width && resizableHeaders.length > 0) {
      // Calculate how much width we have for resizable columns
      const availableWidth = width - fixedWidth;
      const resizableWidth = totalWidth - fixedWidth;

      // Calculate scaling factor to fit all columns
      scalingFactor = Math.max(0.3, availableWidth / resizableWidth);
    }

    // Apply sizes with scaling if needed
    for (let i = 0; i < headers.length; i++) {
      const header = headers[i]!;
      const canResize = header.column.getCanResize();

      // Apply scaling only to resizable columns
      const size = canResize
        ? Math.max(
            header.column.columnDef.minSize || 48,
            Math.floor(header.getSize() * scalingFactor),
          )
        : header.getSize();

      colSizes[`--header-${header.id}-size`] = size;
      colSizes[`--col-${header.column.id}-size`] = size;
    }

    return colSizes;
  }, [columnSizingInfo, columnSizing, getFlatHeaders, width, columnVisibility]);

  return {
    tableRef,
    columnSizeVars,
  };
}
