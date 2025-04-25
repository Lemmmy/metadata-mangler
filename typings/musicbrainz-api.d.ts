import "musicbrainz-api";
import type { ILabel } from "musicbrainz-api";

declare module "musicbrainz-api" {
  export interface IRelease {
    ["label-info"]?: {
      label: ILabel;
      ["catalog-number"]?: string;
    }[];
  }

  export interface IRelation {
    work?: IWork;
  }

  export interface IWork {
    relations?: IRelation[];
  }
}
