import "musicbrainz-api";

declare module "musicbrainz-api" {
  export interface IRelation {
    artist?: IArtist;
    "attribute-ids": unknown[];
    direction: RelationDirection;
    "target-credit": string;
    end: null | unknown;
    "source-credit": string;
    ended: boolean;
    "attribute-values": unknown[];
    attributes?: any[];
    type: string;
    begin?: null | unknown;
    "target-type"?: "url" | "work";
    "type-id": string;
    url?: IUrl;
    release?: IRelease;
    work?: IWork;
  }

  export interface IWork {
    relations?: IRelation[];
  }
}
