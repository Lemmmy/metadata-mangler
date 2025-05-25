import { Label } from "@radix-ui/react-label";
import { BreadcrumbMenu } from "../BreadcrumbMenu";
import { ColumnVisibilityDropdown } from "../table/ColumnVisibilityDropdown";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import { useDiscographyContext } from "./DiscographyContext";
import { discographyTableColumns } from "./useDiscographyTableColumns";
import type { UseDiscographyTableColumnsReturn } from "./useDiscographyTableColumns";

interface Props extends UseDiscographyTableColumnsReturn {
  edit: () => void;
  refetch: () => void;
  refetchPending: boolean;
}

export function DiscographyHeader({
  edit,
  refetch,
  refetchPending,
  columnVisibility,
  setColumnVisibility,
}: Props) {
  const { includeIgnoredVgmdbRoles, setIncludeIgnoredVgmdbRoles } =
    useDiscographyContext();

  return (
    <div className="border-b-border flex items-center border-b px-4 py-3">
      <BreadcrumbMenu />

      <div className="flex-1" />

      <div className="flex gap-2">
        <div className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={includeIgnoredVgmdbRoles}
            onCheckedChange={(checked) =>
              setIncludeIgnoredVgmdbRoles(checked === true)
            }
          />
          <Label htmlFor="include-ignored-vgmdb-roles">
            Include ignored VGMdb roles
          </Label>
        </div>

        <ColumnVisibilityDropdown
          columns={discographyTableColumns}
          columnVisibility={columnVisibility}
          setColumnVisibility={setColumnVisibility}
          size="default"
        />
        <Button variant="outline" onClick={edit}>
          Edit
        </Button>
        <Button variant="outline" onClick={refetch} disabled={refetchPending}>
          Refetch
        </Button>
      </div>
    </div>
  );
}
