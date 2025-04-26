import { AlbumCodecs } from "./AlbumCodecs";
import { AlbumTagInput } from "./AlbumTagInput";

export function AlbumInformationSection() {
  return (
    <div>
      <div className="flex flex-col flex-wrap items-baseline gap-2 md:flex-row">
        <h2 className="text-xl font-semibold">Album information</h2>
        <AlbumCodecs />
      </div>

      <div className="mt-2 grid grid-cols-1 gap-4 md:grid-cols-6">
        {/* Album name */}
        <AlbumTagInput label="Album name" field="name" className="col-span-2" />

        {/* Album artist */}
        <AlbumTagInput
          label="Album artist"
          field="artist"
          className="col-span-2"
        />

        {/* Grouping */}
        <AlbumTagInput
          label="Grouping"
          field="grouping"
          className="col-span-2"
          lockable={false}
        />

        {/* Subtitle */}
        <AlbumTagInput
          label="Subtitle"
          field="albumSubtitle"
          className="col-span-2"
          lockable={false}
        />

        {/* Year */}
        <AlbumTagInput label="Year" field="year" />

        {/* Date */}
        <AlbumTagInput label="Date" field="date" />

        {/* Catalog number */}
        <AlbumTagInput label="Catalog number" field="catalogNumber" />

        {/* Barcode */}
        <AlbumTagInput label="Barcode" field="barcode" />
      </div>
    </div>
  );
}
