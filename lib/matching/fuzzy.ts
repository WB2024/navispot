export interface FuzzyMatchOptions {
  threshold?: number;
  songCount?: number;
}

export interface FuzzyMatchResult {
  song: import('@/types/navidrome').NavidromeSong;
  score: number;
}

export interface FuzzyMatchCandidateResult {
  matches: FuzzyMatchResult[];
  hasAmbiguous: boolean;
  bestMatch?: FuzzyMatchResult;
}

export function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function levenshteinDistance(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

export function calculateSimilarity(str1: string, str2: string): number {
  const normalized1 = normalizeString(str1);
  const normalized2 = normalizeString(str2);

  if (normalized1 === normalized2) return 1.0;

  const maxLength = Math.max(normalized1.length, normalized2.length);
  if (maxLength === 0) return 1.0;

  const distance = levenshteinDistance(normalized1, normalized2);
  return 1.0 - distance / maxLength;
}

export function calculateTrackSimilarity(
  spotifyTrack: import('@/types/spotify').SpotifyTrack,
  navidromeSong: import('@/types/navidrome').NavidromeSong
): number {
  const artistSimilarity = calculateSimilarity(
    spotifyTrack.artists.map((a) => a.name).join(' '),
    navidromeSong.artist
  );

  const titleSimilarity = calculateSimilarity(
    spotifyTrack.name,
    navidromeSong.title
  );

  // If title is an exact match, boost the score significantly
  // This helps with classical/video game music where artist names might differ
  if (titleSimilarity === 1.0) {
    // Give more weight to title when it's an exact match
    // and artist similarity is at least somewhat reasonable
    if (artistSimilarity >= 0.3) {
      return Math.max(artistSimilarity * 0.3 + titleSimilarity * 0.7, 0.85);
    }
    // Even with very different artists, if title matches exactly, consider it a good match
    return Math.max(artistSimilarity * 0.2 + titleSimilarity * 0.8, 0.75);
  }

  return artistSimilarity * 0.4 + titleSimilarity * 0.6;
}

export function findBestMatch(
  spotifyTrack: import('@/types/spotify').SpotifyTrack,
  candidates: import('@/types/navidrome').NavidromeSong[],
  threshold: number = 0.8
): FuzzyMatchCandidateResult {
  if (candidates.length === 0) {
    console.log(`[Fuzzy Match] No candidates found for track: "${spotifyTrack.name}" by ${spotifyTrack.artists.map(a => a.name).join(', ')}`);
    return { matches: [], hasAmbiguous: false };
  }

  console.log(`[Fuzzy Match] Processing ${candidates.length} candidates for track: "${spotifyTrack.name}" by ${spotifyTrack.artists.map(a => a.name).join(', ')}`);

  const scoredMatches: FuzzyMatchResult[] = candidates
    .map((song) => ({
      song,
      score: calculateTrackSimilarity(spotifyTrack, song),
    }))
    .filter((match) => {
      if (match.score >= threshold) {
        return true;
      }
      // Log songs that were close to the threshold
      if (match.score >= threshold - 0.1) {
        console.log(`[Fuzzy Match] Close call (${match.score.toFixed(3)} < ${threshold}): "${match.song.title}" by "${match.song.artist}"`);
      }
      return false;
    })
    .sort((a, b) => b.score - a.score);

  console.log(`[Fuzzy Match] Found ${scoredMatches.length} matches above threshold ${threshold}`);
  if (scoredMatches.length > 0) {
    console.log(`[Fuzzy Match] Best match: "${scoredMatches[0].song.title}" by "${scoredMatches[0].song.artist}" with score ${scoredMatches[0].score.toFixed(3)}`);
  }

  if (scoredMatches.length === 0) {
    // Show the top candidate even if it didn't make the threshold
    const allScores = candidates.map(song => ({
      song,
      score: calculateTrackSimilarity(spotifyTrack, song)
    })).sort((a, b) => b.score - a.score);
    
    if (allScores.length > 0) {
      console.log(`[Fuzzy Match] No matches above threshold. Top candidate: "${allScores[0].song.title}" by "${allScores[0].song.artist}" with score ${allScores[0].score.toFixed(3)}`);
    }
    
    return { matches: [], hasAmbiguous: false };
  }

  const bestScore = scoredMatches[0].score;
  const thresholdMatches = scoredMatches.filter(
    (m) => m.score >= bestScore - 0.05
  );

  const hasAmbiguous = thresholdMatches.length > 1;

  return {
    matches: scoredMatches,
    hasAmbiguous,
    bestMatch: scoredMatches[0],
  };
}
