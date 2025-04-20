import { AlbumTagInput } from "./AlbumTagInput";

export function AlbumInformationSection() {
  return (
    <div>
      <h2 className="text-xl font-semibold">Album information</h2>
      <div className="mt-2 grid grid-cols-1 gap-4 md:grid-cols-6">
        {/* Album name */}
        <AlbumTagInput
          label="Album name"
          field="name"
          updater="updateAlbumName"
          className="col-span-2"
        />

        {/* Album artist */}
        <AlbumTagInput
          label="Album artist"
          field="artist"
          updater="updateAlbumArtist"
        />

        {/* Grouping */}
        <AlbumTagInput
          label="Grouping"
          field="grouping"
          updater="updateAlbumGrouping"
        />

        {/* Year */}
        <AlbumTagInput label="Year" field="year" updater="updateAlbumYear" />

        {/* Date */}
        <AlbumTagInput label="Date" field="date" updater="updateAlbumDate" />
      </div>
    </div>
  );
}
