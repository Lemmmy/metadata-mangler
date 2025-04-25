import { BreadcrumbMenu } from "../BreadcrumbMenu";
import { AlbumSaveButton } from "./AlbumSaveButton";
import type { StoreAlbum } from "./useMetadataStore";

interface Props {
  album: StoreAlbum | null;
  path: string;
}

export function AlbumHeader({ album, path }: Props) {
  return (
    <div className="border-b-border flex items-center border-b px-4 py-3">
      <BreadcrumbMenu />

      <div className="flex-1" />

      <AlbumSaveButton album={album} path={path} />
    </div>
  );
}
