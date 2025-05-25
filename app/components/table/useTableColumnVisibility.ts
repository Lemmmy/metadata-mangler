import type {
  CellContext,
  ColumnDef,
  RowData,
  VisibilityState,
} from "@tanstack/react-table";
import {
  useEffect,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";

declare module "@tanstack/react-table" {
  interface ColumnMeta<TData extends RowData, TValue> {
    className?: string;
    classNameFn?: (ctx: CellContext<TData, TValue>) => string;
    headerExtra?: () => ReactNode;
    visibility?:
      | "always"
      | "hiddenByDefault"
      | "showIfDiffers"
      | "showIfExists";
  }
}

interface UseTableColumnVisibilityReturn {
  columnVisibility: VisibilityState;
  setColumnVisibility: Dispatch<SetStateAction<VisibilityState>>;
}

export function checkColumnCardinality<T extends RowData>(
  setColumnVisibility: UseTableColumnVisibilityReturn["setColumnVisibility"],
  data: T[],
  accessorFn: (row: T, idx: number) => any,
  normalizeFn: (value: any) => string,
  column: keyof T,
  justExistence: boolean = false,
) {
  const uniqueValues = new Set<string>();

  let found = false;
  for (let i = 0; i < data.length; i++) {
    const value = normalizeFn(accessorFn(data[i], i));
    if (value) {
      if (justExistence) {
        found = true;
        break;
      }

      uniqueValues.add(value);

      if (uniqueValues.size > 1) {
        found = true;
        break;
      }
    }
  }

  if (found) {
    setColumnVisibility((prev) => ({
      ...prev,
      [column]: true,
    }));
  }
}

const defaultNormalizeFn = (value: any) => value;

export function useTableColumnVisibility<T extends RowData>(
  columns: ColumnDef<T, any>[],
  data: T[],
  normalizeFn: (value: any) => string = defaultNormalizeFn,
): UseTableColumnVisibilityReturn {
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
    () => {
      const out: Record<string, boolean> = {};
      columns.forEach((column) => {
        const id = column.id;
        if (!id) return;
        out[id] = !column.meta?.visibility;
      });
      return out;
    },
  );

  useEffect(() => {
    if (!data.length) return;

    columns.forEach((column) => {
      const id = column.id as keyof T;
      if (!id) return;

      const hidden = column.meta?.visibility;
      if (hidden === "showIfDiffers" || hidden === "showIfExists") {
        checkColumnCardinality(
          setColumnVisibility,
          data,
          "accessorFn" in column ? column.accessorFn : (row) => row[id],
          normalizeFn,
          id,
          hidden === "showIfExists",
        );
      }
    });
  }, [data, columns, normalizeFn]);

  return {
    columnVisibility,
    setColumnVisibility,
  };
}
