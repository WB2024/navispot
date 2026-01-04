# Feature F2.3: Track Matching - Strict

## Overview

Implementation of strict matching strategy for matching Spotify tracks to Navidrome songs. This feature performs exact matching on artist name and track title after normalization.

## Dependencies

- F1.5: Search Functionality (uses `search3` endpoint via `NavidromeApiClient.search()`)

## Implementation Details

### String Normalization

The `normalizeString()` function performs the following transformations:

1. Converts string to lowercase
2. Removes all non-alphanumeric characters (keeps only a-z, 0-9, and spaces)
3. Collapses multiple spaces into single space
4. Trims leading/trailing whitespace

Example:
```
"Artist Name! (feat. Someone)" -> "artist name feat someone"
"The Beatles" -> "the beatles"
```

### Matching Algorithm

1. Extract artist name from Spotify track (joins multiple artists)
2. Extract title from Spotify track
3. Normalize both artist and title
4. Search Navidrome using combined query `${artist} ${title}`
5. Iterate through results and find exact match on normalized artist + title
6. Return match result with status 'matched' or 'unmatched'

### Files Created

- `lib/matching/strict-matcher.ts`: Strict matching implementation

## API

### `normalizeString(str: string): string`

Normalizes a string for comparison by removing special characters and converting to lowercase.

### `matchByStrict(client: NavidromeApiClient, spotifyTrack: SpotifyTrack): Promise<StrictMatchResult>`

Matches a Spotify track to a Navidrome song using strict matching.

**Parameters:**
- `client`: NavidromeApiClient instance
- `spotifyTrack`: Spotify track to match

**Returns:** `StrictMatchResult` object with:
- `spotifyTrack`: Original Spotify track
- `navidromeSong`: Matched Navidrome song (if found)
- `matchStrategy`: Always 'strict'
- `matchScore`: 1 if matched, 0 if unmatched
- `status`: 'matched' or 'unmatched'

## Usage Example

```typescript
import { NavidromeApiClient } from '@/lib/navidrome/client';
import { matchByStrict } from '@/lib/matching/strict-matcher';

const client = new NavidromeApiClient(url, username, password);
const spotifyTrack = {
  id: 'track123',
  name: 'Bohemian Rhapsody',
  artists: [{ id: 'artist1', name: 'Queen' }],
  // ...
};

const result = await matchByStrict(client, spotifyTrack);
console.log(result.status); // 'matched' or 'unmatched'
console.log(result.navidromeSong); // Matched song if found
```

## Integration

This feature will be used by the matching orchestrator (F2.4) as a fallback strategy after ISRC and fuzzy matching have been attempted.
