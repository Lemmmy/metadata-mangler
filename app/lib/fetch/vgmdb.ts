import { env } from "~/lib/env";

export interface VgmdbNames {
  en?: string;
  ja?: string;
  "ja-latn"?: string;
  English?: string;
  Japanese?: string;
  Romaji?: string;
  [key: string]: string | undefined;
}

export interface VgmdbLinkedName {
  link?: string;
  names: VgmdbNames;
}

export type VgmdbArtist = VgmdbLinkedName;

export interface VgmdbCover {
  full: string;
  medium: string;
  thumb: string;
  name: string;
}

export interface VgmdbTrack {
  names: VgmdbNames;
  track_length: string;
}

export interface VgmdbDisc {
  disc_length: string;
  name: string;
  tracks: VgmdbTrack[];
}

export interface VgmdbOrganization extends VgmdbLinkedName {
  role?: string;
}
export type VgmdbStudio = VgmdbOrganization;
export type VgmdbUnit = VgmdbOrganization;

export interface VgmdbReleasePrice {
  currency: string;
  price: number;
}

export interface VgmdbReleaseEvent extends VgmdbLinkedName {
  shortname: string;
}

export type VgmdbStore = VgmdbLinkedName;
export type VgmdbWebsite = VgmdbLinkedName;

export interface VgmdbWebsites {
  Official?: VgmdbWebsite[];
  Commercial?: VgmdbWebsite[];
  Fansite?: VgmdbWebsite[];
  Personal?: VgmdbWebsite[];
  Reference?: VgmdbWebsite[];
  [key: string]: VgmdbWebsite[] | undefined;
}

export interface VgmdbMeta {
  added_date: string;
  edited_date: string;
  fetched_date: string;
  freedb: number;
  ttl: number;
  visitors: number;
}

export interface VgmdbAlbum {
  arrangers: VgmdbArtist[];
  barcode?: string;
  catalog?: string;
  categories: string[];
  category: string;
  classification: string;
  composers: VgmdbArtist[];
  covers: VgmdbCover[];
  discs: VgmdbDisc[];
  link: string;
  lyricists: VgmdbArtist[];
  media_format: string;
  meta: VgmdbMeta;
  name: string;
  names: VgmdbNames;
  notes: string;
  organizations: VgmdbOrganization[];
  performers: VgmdbArtist[];
  picture_full: string;
  picture_small: string;
  picture_thumb: string;
  publish_format: string;
  publisher: VgmdbOrganization;
  related: never[]; // Not yet known, but likely not required
  release_date: string;
  release_events: VgmdbReleaseEvent[];
  release_price: VgmdbReleasePrice;
  reprints: never[]; // Not yet known, but likely not required
  stores: VgmdbStore[];
  vgmdb_link: string;
  votes: number;
  websites: VgmdbWebsites;
}

/**
 * Interface for a cleaned VgmdbAlbum with only essential data for AI inference
 */
export interface CleanVgmdbAlbum {
  name: string;
  names: VgmdbNames;
  notes: string;
  discs: {
    name: string;
    tracks: {
      names: VgmdbNames;
    }[];
  }[];
  composers: VgmdbArtist[];
  arrangers: VgmdbArtist[];
  performers: VgmdbArtist[];
  release_date: string;
}

export interface VgmdbSearchResult {
  link: string;
  meta: {
    fetched_date: string;
  };
  query: string;
  results: {
    albums: VgmdbAlbumSearchResult[];
    artists: never[]; // TODO
    orgs: never[];
    products: never[];
  };
  sections: ("albums" | "artists" | "orgs" | "products")[];
  vgmdb_link: string;
}

export interface VgmdbAlbumSearchResult {
  catalog: string;
  category: string;
  link: string;
  media_format: string;
  release_date: string;
  titles: VgmdbNames;
}

export interface VgmdbArtistResult {
  link: string;
  vgmdb_link: string;
  birthdate?: string;
  birthplace?: string;
  name?: string;
  name_real?: string;
  name_trans?: string;
  notes?: string;
  picture_full?: string;
  picture_small?: string;
  picture_thumb?: string;
  type?: "Individual" | "Unit" | "Studio" | string;
  sex?: string;
  discography?: VgmdbArtistDiscographyEntry[];
  featured_on?: VgmdbArtistDiscographyEntry[];
  info: {
    Birthdate?: string;
    Birthplace?: string;
    Bloodtype?: string;
    "Credited works"?: string[];
    Credits?: string[];
    Organizations?: VgmdbOrganization[];
    Studios?: VgmdbStudio[];
    Units?: VgmdbUnit[];
    Variations?: { names: VgmdbNames }[];
    Formed?: string;
    Members?: VgmdbArtist[];
    "Former Members"?: VgmdbArtist[];
  };
  meta: VgmdbMeta;
  members?: VgmdbArtist[];
  organizations?: VgmdbOrganization[];
  studios?: VgmdbStudio[];
  units?: VgmdbUnit[];
  twitter_names?: string[];
  websites: VgmdbWebsites;
}

export interface VgmdbArtistDiscographyEntry {
  link: string;
  catalog?: string;
  date?: string;
  reprint?: boolean;
  roles?: string[];
  titles: VgmdbNames;
  type:
    | "live"
    | "anime"
    | "bonus"
    | "game"
    | "works"
    | "doujin"
    | "live"
    | "other"
    | string;
}

/**
 * Makes an authenticated request to the VGMdb API
 * Uses basic auth if username and password are provided in the environment
 * @param endpoint The API endpoint to request (without base URL)
 * @returns Promise resolving to the response
 */
export async function makeVgmdbApiRequest(
  endpoint: string,
  request: RequestInit = {},
): Promise<Response> {
  const apiUrl = env.VGMDB_API_URL;
  if (!apiUrl) {
    throw new Error("VGMDB API URL is required");
  }

  const url = `${apiUrl}${endpoint}`;
  const headers: HeadersInit = {
    Accept: "application/json",
  };

  // Add basic auth if credentials are provided
  if (env.VGMDB_API_USERNAME && env.VGMDB_API_PASSWORD) {
    const credentials = btoa(
      `${env.VGMDB_API_USERNAME}:${env.VGMDB_API_PASSWORD}`,
    );
    headers["Authorization"] = `Basic ${credentials}`;
  }

  const response = await fetch(url, {
    ...request,
    headers: {
      ...headers,
      ...request.headers,
    },
  });

  if (!response.ok) {
    throw new Error(
      `VGMDB API returned ${response.status}: ${response.statusText}`,
    );
  }

  return response;
}

/**
 * Fetches album information from VGMDB API
 * @param id The VGMDB album ID
 * @returns Promise resolving to a VgmdbAlbum object
 */
export async function fetchVgmdbAlbum(id: number): Promise<VgmdbAlbum> {
  try {
    const response = await makeVgmdbApiRequest(`/album/${id}?format=json`);
    const data: VgmdbAlbum = await response.json();
    return data;
  } catch (error) {
    console.error(`Error fetching album ${id} from VGMDB:`, error);
    throw error;
  }
}

export async function searchVgmdbAlbums(
  albumName: string,
): Promise<VgmdbSearchResult> {
  try {
    const response = await makeVgmdbApiRequest(
      `/search/albums/${encodeURIComponent(albumName)}?format=json`,
    );
    const data: VgmdbSearchResult = await response.json();
    return data;
  } catch (error) {
    console.error(`Error searching VGMDB for album ${albumName}:`, error);
    return {
      link: "",
      meta: {
        fetched_date: "",
      },
      query: albumName,
      results: {
        albums: [],
        artists: [],
        orgs: [],
        products: [],
      },
      sections: [],
      vgmdb_link: "",
    };
  }
}

export function parseVgmdbReleaseDate(
  date?: string | null,
): [string, string] | [undefined, undefined] {
  if (!date) return [undefined, undefined];
  const [year] = date.split("-", 1);
  return [year, date];
}

export async function fetchVgmdbArtist(id: number): Promise<VgmdbArtistResult> {
  try {
    const response = await makeVgmdbApiRequest(`/artist/${id}?format=json`);
    const data: VgmdbArtistResult = await response.json();
    return data;
  } catch (error) {
    console.error(`Error fetching artist ${id} from VGMDB:`, error);
    throw error;
  }
}
