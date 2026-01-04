# Feature F2.6: Track Fetcher

## Overview

Implements functionality to fetch all tracks from a Spotify playlist with automatic pagination handling. This feature builds on the Spotify API Client (F1.3) to provide a complete track fetching solution.

## Implementation Details

### Files Modified/Created

1. **lib/spotify/client.ts** - Already contains `getAllPlaylistTracks` method (lines 38-52)
2. **types/spotify.ts** - Already contains `SpotifyTrack`, `SpotifyPlaylistTrack`, and `SpotifyTracksResponse` types

### Requirements Met

| Requirement | Status | Location |
|-------------|--------|----------|
| Fetch all tracks for a playlist | ✅ | `client.ts:38-52` |
| Handle Spotify pagination (100 tracks/page) | ✅ | `client.ts:38-52` |
| Store track data structure | ✅ | `types/spotify.ts:1-45` |

## Components

### Track Fetching Methods

Located in `lib/spotify/client.ts`:

| Method | Description | Rate Limited |
|--------|-------------|--------------|
| `getPlaylistTracks(playlistId, limit, offset)` | Fetch single page of playlist tracks | ✅ |
| `getAllPlaylistTracks(playlistId)` | Fetch all tracks with auto-pagination | ✅ |

### Data Structures

Located in `types/spotify.ts`:

```typescript
interface SpotifyTrack {
  id: string;
  name: string;
  artists: { id: string; name: string }[];
  album: { id: string; name: string; release_date: string };
  duration_ms: number;
  external_ids: { isrc?: string };
  external_urls: { spotify: string };
}

interface SpotifyPlaylistTrack {
  track: SpotifyTrack;
  added_at: string;
  added_by: { id: string; display_name: string };
}

interface SpotifyTracksResponse {
  items: SpotifyPlaylistTrack[];
  total: number;
  next?: string;
  offset: number;
  limit: number;
}
```

## Usage Example

```typescript
import { spotifyClient } from '@/lib/spotify/client';

async function fetchPlaylistTracks(playlistId: string) {
  await spotifyClient.loadToken();

  const tracks = await spotifyClient.getAllPlaylistTracks(playlistId);
  console.log(`Found ${tracks.length} tracks`);

  for (const item of tracks) {
    const track = item.track;
    console.log(`${track.name} by ${track.artists.map(a => a.name).join(', ')}`);
  }
}
```

## Pagination Behavior

The `getAllPlaylistTracks()` method handles pagination automatically:

1. Fetch initial page with limit of 100 tracks (Spotify API maximum)
2. Check for `next` property in response to determine if more pages exist
3. Continue fetching subsequent pages until all tracks are retrieved
4. Aggregate all `SpotifyPlaylistTrack` items into single array
5. Return complete list of tracks

## Dependencies

- **F1.3 Spotify API Client**: Base client with authentication and rate limiting
- **lib/spotify/rate-limiter.ts**: Rate limiting to avoid API throttling
- **types/spotify.ts**: TypeScript interfaces for track data structures

## Testing

Run the following to verify the implementation:

```bash
# Type check
npm run typecheck

# Lint
npm run lint
```

## Notes

- The Spotify API allows fetching up to 100 tracks per request
- Pagination is handled internally by checking the `next` field in responses
- Rate limiting is applied to each page fetch to avoid throttling
- The method returns `SpotifyPlaylistTrack[]` which includes metadata like `added_at` and `added_by`
- Each track includes `external_ids.isrc` for ISRC-based matching
