import { SpotifyTrack } from '@/types/spotify';
import { TrackMatch } from '@/types/matching';
import { NavidromeApiClient } from '@/lib/navidrome/client';

export function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function matchByStrict(
  client: NavidromeApiClient,
  spotifyTrack: SpotifyTrack
): Promise<TrackMatch> {
  const normalizedArtist = normalizeString(
    spotifyTrack.artists.map((a) => a.name).join(' ')
  );
  const normalizedTitle = normalizeString(spotifyTrack.name);

  if (!normalizedArtist || !normalizedTitle) {
    return {
      spotifyTrack,
      matchStrategy: 'strict',
      matchScore: 0,
      status: 'unmatched',
    };
  }

  try {
    const searchQuery = `${normalizedArtist} ${normalizedTitle}`;
    const songs = await client.search(searchQuery, { songCount: 20 });

    const match = songs.find((song) => {
      const songArtist = normalizeString(song.artist);
      const songTitle = normalizeString(song.title);
      return songArtist === normalizedArtist && songTitle === normalizedTitle;
    });

    if (match) {
      return {
        spotifyTrack,
        navidromeSong: match,
        matchStrategy: 'strict',
        matchScore: 1,
        status: 'matched',
      };
    }

    return {
      spotifyTrack,
      matchStrategy: 'strict',
      matchScore: 0,
      status: 'unmatched',
    };
  } catch {
    return {
      spotifyTrack,
      matchStrategy: 'strict',
      matchScore: 0,
      status: 'unmatched',
    };
  }
}
