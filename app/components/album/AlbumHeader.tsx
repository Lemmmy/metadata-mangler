import { BreadcrumbMenu } from "../BreadcrumbMenu";
import { AlbumSaveButton } from "./AlbumSaveButton";
import type { StoreAlbum } from "./useMetadataStore";

interface Props {
  album: StoreAlbum | null;
}

export function AlbumHeader({ album }: Props) {
  return (
    <div className="border-b-border flex items-center border-b px-4 py-3">
      <BreadcrumbMenu />

      <div className="flex-1" />

      <AlbumSaveButton album={album} />
    </div>
  );
}
