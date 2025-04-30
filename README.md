# Metadata Mangler

A personal tool for managing metadata of music libraries.

# WARNING: This saves tracks in-place and hasn't been tested extensively yet. Have backups!

## Overview

Metadata Mangler provides a web interface for viewing and editing music metadata, with a focus on handling Japanese
music and doujin music collections. This project is primarily built for personal use, but you're welcome to mess around
with it if it fits your needs.

The primary purpose of the tool is to use large language models to comb through supplementary third-party data sources
to provide detailed metadata for music tracks according to personal preferences, with a particular focus on handling
VGMdb's arbitrary notes format. See the prompt in [app/lib/aiMetadata.ts](app/lib/aiMetadata.ts) for specifics on the
preferences.

As with any AI-powered tool, the results may not always be 100% accurate. Use with caution and always double-check the
results. It also won't improve upon garbage input data—I found many albums on VGMdb during development of the tool that
didn't even have good data in their Notes section to begin with (such as not listing any composers/arrangers for some
tracks).

This app was made with the [Jebsite Template](https://github.com/Lustyn/jebsite-template/) and almost entirely vibe
coded. Beware.

## Features

- Web interface with table-based metadata editor
- Browse and edit your music library metadata
  - Support for populating album tags:
    - Album Name (`ALBUM`/`TALB`)
    - Album Artist (`ALBUMARTIST`/`TPE2`)
    - Grouping (`CONTENTGROUP`/`TIT1`)
    - Catalog Number (`CATALOGNUMBER`/`TXXX:CATALOGNUMBER`)
    - Barcode (`BARCODE`/`TXXX:BARCODE`)
    - Custom Album Subtitle (`COMMENT2ALBUM`/`TXXX:COMMENT2ALBUM`)
    - Custom Track Comment (`COMMENT2TRACK`/`TXXX:COMMENT2TRACK`)
  - Support for populating track tags:
    - Track Number (`TRACKNUMBER`/`TRCK`)
    - Disc Number (`DISCNUMBER`/`TPOS`)
    - Title (`TITLE`/`TIT2`)
    - Artists, semi-colon separated in the UI for convenience (`ARTIST`/`TPE1`)
    - Display Artist (`DISPLAY ARTIST`/`TXXX:DISPLAY ARTIST`). Generally considered a garbage tag, so the UI highlights
      it in red and will offer to remove it from all tracks.
- Japanese-capable romaji directory searching powered by [kuroshiro](https://github.com/hexenq/kuroshiro) and
  [kuromoji.js](https://github.com/takuyaa/kuromoji.js)
- Search VGMdb and MusicBrainz directly from the interface
- AI-assisted metadata suggestions and corrections. Corrections work on data supplied from:
  - VGMdb (requires a [VGMdb API proxy](https://github.com/hufman/vgmdb))
  - MusicBrainz
  - Bandcamp (TODO)
  - Any text input
- Synced browser popup window that automatically shows the associated VGMdb/MusicBrainz page
- Automatically highlights per-track differences in album-level tags
- Automatically highlights suspicious container/tag combinations, such as ID3 in FLAC containers
- Bulk artist name replacement tool, with memory of previous replacements
- MusicBee plugin to open selected tracks in Metadata Mangler

## Requirements

- Self-hosting required (needs direct filesystem access)
- API key for either OpenRouter, Anthropic, or OpenAI
- Node.js 20 or later

### Optional

- MongoDB for saving of common corrections
- [VGMdb API proxy](https://github.com/hufman/vgmdb)
- Self-hosted MusicBrainz API (e.g. [musicbrainz-docker](https://github.com/metabrainz/musicbrainz-docker)). MusicBrainz
  rate limits will be disabled if a self-hosted API is used.

## Getting Started

### Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/Lemmmy/metadata-mangler.git
cd metadata-mangler
pnpm install
```

### Configuration

Deploy with Docker, or create a `.env` file in the root directory with the following variables:

```
# Path to the root of your music library
MUSIC_LIBRARY_PATH=/path/to/your/music/library

# MongoDB connection string (optional)
MONGO_URI=mongodb://localhost:27017

# At least one API key is required for AI corrections
OPENROUTER_API_KEY=sk-or-v1-...
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...

# VGMdb API URL is required. Credentials are optional (if your server uses basic auth)
VGMDB_API_URL=https://vgmdb.example.com
VGMDB_API_USERNAME=...
VGMDB_API_PASSWORD=...

# MusicBrainz API URL if you're using a self-hosted API
MUSICBRAINZ_BASE_URL=https://musicbrainz.example.com
```

### Development

Start the development server:

```bash
pnpm dev
```

The application will be available at `http://localhost:5173`.

## Disclaimer

This tool is primarily designed for personal use and may not be suitable for general purposes.

## License

MIT
