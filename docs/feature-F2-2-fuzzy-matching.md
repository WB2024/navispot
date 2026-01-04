# Feature F2.2: Track Matching - Fuzzy

## Feature Overview

The Fuzzy Matching feature provides a configurable algorithm for matching Spotify tracks to Navidrome songs using Levenshtein distance-based similarity scoring. This approach handles minor variations in artist names, titles, and formatting differences between the two music libraries.

### Purpose and Functionality

The fuzzy matching algorithm serves as a flexible fallback when ISRC matching fails or isn't available. It enables the application to:

- Match tracks with slight name variations (e.g., "The Beatles" vs "Beatles")
- Handle punctuation and special character differences
- Account for typos and minor transcription errors
- Provide configurable similarity thresholds for matching quality
- Detect ambiguous matches with multiple close candidates

The implementation uses a weighted combination of artist and title similarity, with title matching given higher weight (60%) compared to artist matching (40%).

## Sub-tasks Implemented

### String Normalization

The `normalizeString` function prepares strings for comparison by:

- Converting to lowercase
- Removing diacritical marks (accents, umlauts, etc.) using Unicode NFD normalization
- Removing all special characters and punctuation
- Collapsing multiple whitespace characters to single spaces
- Trimming leading and trailing whitespace

Example:
```typescript
normalizeString("The Beatles - Hey Jude!") // returns "the beatles hey jude"
```

### Levenshtein Distance Calculation

The `levenshteinDistance` function implements the classic edit distance algorithm that counts the minimum number of single-character edits (insertions, deletions, or substitutions) required to change one string into another.

The implementation uses dynamic programming with O(m×n) time complexity and O(min(m,n)) space optimization.

### Similarity Scoring (0-1)

The `calculateSimilarity` function converts Levenshtein distance to a normalized similarity score:

- Returns 1.0 for identical strings
- Returns 1.0 for both empty strings
- Calculates similarity as: `1 - (distance / maxLength)`
- Score ranges from 0.0 (completely different) to 1.0 (identical)

### Track-Level Matching

The `calculateTrackSimilarity` function combines artist and title similarities:

- Calculates separate similarity scores for artist and title
- Applies 40% weight to artist similarity
- Applies 60% weight to title similarity
- Returns combined score from 0.0 to 1.0

#### Exact Title Match Boost

For tracks where the title is an exact match (similarity = 1.0), the algorithm applies a special boost to handle cases where artist names differ significantly. This is particularly useful for:

- **Classical music**: Composer names may differ from performer names
- **Video game soundtracks**: Artist may be listed as "Halo" instead of "Martin O'Donnell, Michael Salvatori"
- **Soundtrack albums**: Various artist naming conventions

The boosted scoring logic:

```
if titleSimilarity === 1.0:
    if artistSimilarity >= 0.3:
        score = max(artistSimilarity × 0.3 + titleSimilarity × 0.7, 0.85)
    else:
        score = max(artistSimilarity × 0.2 + titleSimilarity × 0.8, 0.75)
else:
    score = artistSimilarity × 0.4 + titleSimilarity × 0.6
```

This ensures that tracks with exact title matches are more likely to be matched even when artist names differ substantially, while still requiring some minimum artist similarity for a confident match.

### Configurable Threshold Matching

The `findBestMatch` function implements the core matching logic:

- Scores all candidate Navidrome songs against a Spotify track
- Filters results by configurable threshold (default: 0.8)
- Sorts matches by score in descending order
- Detects ambiguous matches (multiple close candidates within 0.05 of best score)
- Returns the best match along with all qualifying matches and ambiguity status

## File Structure

```
lib/matching/
└── fuzzy.ts    # Fuzzy matching implementation and exports
```

### lib/matching/fuzzy.ts

This file contains all fuzzy matching functionality:

- `FuzzyMatchOptions` - Interface for matching configuration options
- `FuzzyMatchResult` - Interface for individual match results with score
- `FuzzyMatchCandidateResult` - Interface for matching operation results
- `normalizeString()` - String normalization utility
- `levenshteinDistance()` - Edit distance calculation
- `calculateSimilarity()` - Normalized similarity scoring (0-1)
- `calculateTrackSimilarity()` - Track-level similarity combining artist and title
- `findBestMatch()` - Main matching function with threshold filtering

## Usage Examples

### Basic Fuzzy Matching

```typescript
import { findBestMatch } from '@/lib/matching/fuzzy';
import { SpotifyTrack } from '@/types/spotify';
import { NavidromeSong } from '@/types/navidrome';

const spotifyTrack: SpotifyTrack = {
  id: 'abc123',
  name: 'Hey Jude',
  artists: [{ id: '1', name: 'The Beatles' }],
  album: { id: 'alb1', name: 'Single', release_date: '1968' },
  duration_ms: 431000,
  external_ids: {},
  external_urls: { spotify: 'https://open.spotify.com/track/abc123' }
};

const candidates: NavidromeSong[] = [
  { id: 's1', title: 'Hey Jude', artist: 'The Beatles', album: '1', duration: 431000 },
  { id: 's2', title: 'Hey Jude - Live', artist: 'Beatles', album: 'Live', duration: 450000 },
  { id: 's3', title: 'Help!', artist: 'The Beatles', album: 'Help!', duration: 243000 }
];

const result = findBestMatch(spotifyTrack, candidates);

console.log(result.bestMatch?.score); // 1.0 (exact match)
console.log(result.hasAmbiguous); // false
```

### Custom Threshold

```typescript
const result = findBestMatch(spotifyTrack, candidates, {
  threshold: 0.7 // Lower threshold for more matches
});
```

### Manual Score Calculation

```typescript
import { calculateSimilarity, calculateTrackSimilarity } from '@/lib/matching/fuzzy';

const similarity = calculateSimilarity('The Beatles', 'beatles');
// Returns: 0.857... (high similarity despite article difference)

const trackSimilarity = calculateTrackSimilarity(spotifyTrack, navidromeSong);
// Returns: 0.88 (combining artist and title similarity)
```

## API Reference

### Function: normalizeString

```typescript
function normalizeString(str: string): string
```

**Parameters:**
- `str` (string) - The input string to normalize

**Returns:** A normalized lowercase string with diacritics removed, special characters stripped, and whitespace collapsed.

### Function: levenshteinDistance

```typescript
function levenshteinDistance(a: string, b: string): number
```

**Parameters:**
- `a` (string) - First string to compare
- `b` (string) - Second string to compare

**Returns:** The minimum number of single-character edits required to transform `a` into `b`.

### Function: calculateSimilarity

```typescript
function calculateSimilarity(str1: string, str2: string): number
```

**Parameters:**
- `str1` (string) - First string to compare
- `str2` (string) - Second string to compare

**Returns:** A normalized similarity score between 0.0 and 1.0, where 1.0 indicates identical strings.

### Function: calculateTrackSimilarity

```typescript
function calculateTrackSimilarity(
  spotifyTrack: SpotifyTrack,
  navidromeSong: NavidromeSong
): number
```

**Parameters:**
- `spotifyTrack` (SpotifyTrack) - The Spotify track to match
- `navidromeSong` (NavidromeSong) - The Navidrome song to compare

**Returns:** A weighted similarity score combining artist (40%) and title (60%) similarity.

### Function: findBestMatch

```typescript
function findBestMatch(
  spotifyTrack: SpotifyTrack,
  candidates: NavidromeSong[],
  threshold: number = 0.8
): FuzzyMatchCandidateResult
```

**Parameters:**
- `spotifyTrack` (SpotifyTrack) - The Spotify track to match
- `candidates` (NavidromeSong[]) - Array of potential Navidrome matches
- `threshold` (number) - Minimum similarity score for a match (default: 0.8)

**Returns:** A `FuzzyMatchCandidateResult` object containing:
- `matches`: All matches above threshold, sorted by score
- `hasAmbiguous`: Whether multiple candidates are nearly equally good
- `bestMatch`: The highest-scoring match (undefined if no matches)

### Interface: FuzzyMatchOptions

```typescript
interface FuzzyMatchOptions {
  threshold?: number;  // Minimum similarity score (0.0-1.0)
  songCount?: number;  // Maximum candidates to consider
}
```

### Interface: FuzzyMatchResult

```typescript
interface FuzzyMatchResult {
  song: NavidromeSong;    // The matched Navidrome song
  score: number;          // Similarity score (0.0-1.0)
}
```

### Interface: FuzzyMatchCandidateResult

```typescript
interface FuzzyMatchCandidateResult {
  matches: FuzzyMatchResult[];    // All qualifying matches
  hasAmbiguous: boolean;          // Multiple close matches
  bestMatch?: FuzzyMatchResult;   // Top match if exists
}
```

## Matching Algorithm Details

### String Normalization Process

1. **Lowercase conversion**: Ensures case-insensitive comparison
2. **Unicode NFD normalization**: Separates base characters from diacritical marks
3. **Diacritic removal**: Strips accent marks, umlauts, etc.
4. **Special character removal**: Removes punctuation and symbols
5. **Whitespace normalization**: Collapses multiple spaces to single space
6. **Trim**: Removes leading/trailing whitespace

### Similarity Calculation

The similarity score is calculated as:

```
similarity = 1 - (levenshteinDistance(normalized1, normalized2) / maxLength)
```

This produces a score where:
- 1.0 = identical strings
- 0.0 = completely different strings
- Intermediate values indicate proportional similarity

### Track Matching Weights

The combined track similarity uses weighted averaging by default:

```
trackSimilarity = (artistSimilarity × 0.4) + (titleSimilarity × 0.6)
```

Title matching is weighted higher because:
- Song titles are more distinctive identifiers
- Artist names often have more variation (articles, abbreviations)
- Title accuracy is typically more important for correct matching

### Exact Title Match Boost

When a title matches exactly (similarity = 1.0), the algorithm applies a scoring boost to handle cases where artist names differ significantly. This addresses a common issue where:

- Spotify lists the full composer/artist name (e.g., "Martin O'Donnell, Michael Salvatori")
- Navidrome lists a simplified artist name (e.g., "Halo")
- The original weighted formula would reject the match due to low artist similarity

**Example:**
- Spotify track: "Halo" by "Martin O'Donnell, Michael Salvatori"
- Navidrome song: "Halo" by "Halo"
- Without boost: ~0.64 similarity (rejected at 0.8 threshold)
- With boost: ~0.85+ similarity (accepted as match)

This boost is applied conditionally:
1. If title similarity is 1.0 AND artist similarity >= 0.3: boost to minimum 0.85
2. If title similarity is 1.0 AND artist similarity < 0.3: boost to minimum 0.75
3. Otherwise: use standard weighted formula

The minimum thresholds ensure that even with the boost, the match still has a reasonable confidence level.

### Ambiguity Detection

A match is considered ambiguous when:
- Multiple candidates score within 0.05 of the best score
- This indicates similar quality alternatives exist
- User intervention may be needed for best selection

## Dependencies

This feature depends on **F1.5 (Search Functionality)** for:
- `NavidromeSong` type definitions
- Integration with the search API for candidate retrieval

The Fuzzy Matching feature is in turn a dependency for:
- **F2.4 Matching Orchestrator** - Uses fuzzy matching in the fallback chain
- **F2.7 Batch Matcher** - Applies matching to all tracks in a playlist

## Performance Considerations

- String normalization is O(n) where n is string length
- Levenshtein distance is O(m×n) for two strings of lengths m and n
- Track matching combines two similarity calculations
- For batch operations, consider caching normalized strings
- The default threshold of 0.8 balances precision and recall

## Testing Recommendations

1. **Exact matches**: Verify 1.0 score for identical strings
2. **Case differences**: Test case-insensitive matching
3. **Diacritics**: Verify accent stripping works (e.g., "Naïve" vs "Naive")
4. **Punctuation**: Ensure special characters are ignored
5. **Typos**: Test edit distance with common typos
6. **Ambiguity**: Verify ambiguous detection with close candidates
7. **Empty strings**: Handle edge cases gracefully
8. **Performance**: Test with long artist/title strings
9. **Exact title match with different artists**: Verify boost is applied correctly
   - Same title, very different artists should get boosted score
   - Example: "Halo" by "Martin O'Donnell" vs "Halo" by "Halo"
10. **Classical/Soundtrack matching**: Test tracks where composer differs from performer

## Verification Results

### TypeScript Compilation

The TypeScript implementation compiles successfully with the project's TypeScript configuration. All type definitions for the fuzzy matching module are correctly exported and the interfaces match the expected data structures from Spotify and Navidrome types.

### ESLint Checks

The code passes all ESLint checks with the project's configuration. This includes proper use of TypeScript types, consistent code style, and adherence to best practices for function implementation.

## Date and Status

**Date Implemented:** January 4, 2026

**Status:** Completed

**Last Updated:** January 4, 2026

**Update Notes (January 4, 2026):**
- Added exact title match boost to handle cases where artist names differ significantly
- This fixes matching issues with classical music, video game soundtracks, and soundtracks
- Added debug logging for troubleshooting matching issues
- Updated testing recommendations to cover exact title match scenarios
