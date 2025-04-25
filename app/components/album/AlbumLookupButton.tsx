import { ChevronDown, Loader2, Sparkles } from "lucide-react";
import { useState, type ReactElement } from "react";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

export type HandleLookupFn = (
  enableAI: boolean,
  inheritYear: boolean,
  inheritDate: boolean,
  inheritCatalogNumber: boolean,
  inheritBarcode: boolean,
) => Promise<void>;

interface Props {
  handleLookup: HandleLookupFn;
  canLookup: boolean;
  isPending: boolean;
}

export function AlbumLookupButton({
  handleLookup,
  canLookup,
  isPending,
}: Props): ReactElement {
  const [enableAI, setEnableAI] = useState(true);
  const [inheritYear, setInheritYear] = useState(true);
  const [inheritDate, setInheritDate] = useState(true);
  const [inheritCatalogNumber, setInheritCatalogNumber] = useState(true);
  const [inheritBarcode, setInheritBarcode] = useState(true);

  return (
    <div className="flex items-center">
      {/* Button */}
      <Button
        variant="default"
        size="sm"
        onClick={() =>
          handleLookup(
            enableAI,
            inheritYear,
            inheritDate,
            inheritCatalogNumber,
            inheritBarcode,
          )
        }
        disabled={!canLookup || isPending}
        className="rounded-r-none"
      >
        {isPending && <Loader2 className="animate-spin" />}
        {!isPending && enableAI && <Sparkles className="fill-current" />}
        {enableAI ? "AI Lookup" : "Lookup"}
      </Button>

      {/* Settings dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="default" size="sm" className="rounded-l-none">
            <ChevronDown />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuCheckboxItem
            checked={enableAI}
            onCheckedChange={setEnableAI}
            onSelect={(e) => e.preventDefault()} // Keep the menu open
          >
            Enable AI
          </DropdownMenuCheckboxItem>

          <DropdownMenuSeparator />

          <DropdownMenuCheckboxItem
            checked={inheritYear}
            onCheckedChange={setInheritYear}
            onSelect={(e) => e.preventDefault()}
          >
            Inherit year
          </DropdownMenuCheckboxItem>

          <DropdownMenuCheckboxItem
            checked={inheritDate}
            onCheckedChange={setInheritDate}
            onSelect={(e) => e.preventDefault()}
          >
            Inherit date
          </DropdownMenuCheckboxItem>

          <DropdownMenuCheckboxItem
            checked={inheritCatalogNumber}
            onCheckedChange={setInheritCatalogNumber}
            onSelect={(e) => e.preventDefault()}
          >
            Inherit catalog number
          </DropdownMenuCheckboxItem>

          <DropdownMenuCheckboxItem
            checked={inheritBarcode}
            onCheckedChange={setInheritBarcode}
            onSelect={(e) => e.preventDefault()}
          >
            Inherit barcode
          </DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
