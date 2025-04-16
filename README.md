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
- Japanese-capable romaji directory searching powered by [kuroshiro](https://github.com/hexenq/kuroshiro) and
  [kuromoji.js](https://github.com/takuyaa/kuromoji.js)
- Search VGMdb directly from the interface
- AI-assisted metadata suggestions and corrections. Corrections work on data supplied from:
  - VGMdb (requires a [VGMdb API proxy](https://github.com/hufman/vgmdb))
  - Musicbrainz (TODO)
  - Bandcamp (TODO)
  - Any text input

## Requirements

- Self-hosting required (needs direct filesystem access)
- API key for either OpenRouter, Anthropic, or OpenAI
- Node.js 20 or later

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
# At least one API key is required for AI corrections
OPENROUTER_API_KEY=sk-or-v1-...
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...

# Path to the root of your music library
MUSIC_LIBRARY_PATH=/path/to/your/music/library

# VGMdb API URL is required. Credentials are optional (if your server uses basic auth)
VGMDB_API_URL=https://vgmdb.example.com
VGMDB_API_USERNAME=...
VGMDB_API_PASSWORD=...
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
