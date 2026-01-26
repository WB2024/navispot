import { SpotifyClient } from '@/lib/spotify/client';
import { NavidromeApiClient } from '@/lib/navidrome/client';
import { SpotifyPlaylistTrack, SpotifyTrack } from '@/types/spotify';
import { TrackMatch, MatchStrategy } from '@/types/matching';
import { matchTracks, getMatchStatistics, MatchingOrchestratorOptions as OrchestratorOptions, defaultMatchingOptions } from './orchestrator';
import { TrackExportStatus } from '@/lib/export/track-export-cache';

export interface BatchMatcherProgress {
  current: number;
  total: number;
  currentTrack?: SpotifyTrack;
  currentMatch?: TrackMatch;
  percent: number;
  matched?: number;
  unmatched?: number;
}

export type ProgressCallback = (progress: BatchMatcherProgress) => void | Promise<void>;

export interface BatchMatcherOptions {
  enableISRC?: boolean;
  enableFuzzy?: boolean;
  enableStrict?: boolean;
  fuzzyThreshold?: number;
  maxSearchResults?: number;
  concurrency?: number;
}

export interface BatchMatchResult {
  playlistId: string;
  playlistName: string;
  tracks: SpotifyPlaylistTrack[];
  matches: TrackMatch[];
  statistics: {
    total: number;
    matched: number;
    ambiguous: number;
    unmatched: number;
    byStrategy: Record<MatchStrategy, number>;
  };
  duration: number;
}

export interface BatchMatcher {
  matchPlaylist(
    playlistId: string,
    options?: BatchMatcherOptions,
    onProgress?: ProgressCallback
  ): Promise<BatchMatchResult>;
  matchTracks(
    tracks: SpotifyTrack[],
    options?: BatchMatcherOptions,
    onProgress?: ProgressCallback
  ): Promise<{ matches: TrackMatch[]; statistics: BatchMatchResult['statistics'] }>;
  matchTracksDifferential(
    tracks: SpotifyTrack[],
    cachedTracks: Record<string, TrackExportStatus>,
    options?: BatchMatcherOptions,
    onProgress?: ProgressCallback
  ): Promise<{ matches: TrackMatch[]; statistics: BatchMatchResult['statistics']; newTracks: SpotifyTrack[]; cachedMatches: TrackMatch[] }>;
}

export class DefaultBatchMatcher implements BatchMatcher {
  private spotifyClient: SpotifyClient;
  private navidromeClient: NavidromeApiClient;

  constructor(spotifyClient: SpotifyClient, navidromeClient: NavidromeApiClient) {
    this.spotifyClient = spotifyClient;
    this.navidromeClient = navidromeClient;
  }

  async matchPlaylist(
    playlistId: string,
    options: BatchMatcherOptions = {},
    onProgress?: ProgressCallback
  ): Promise<BatchMatchResult> {
    const startTime = Date.now();

    await this.spotifyClient.loadToken();

    const tracks = await this.spotifyClient.getAllPlaylistTracks(playlistId);
    const playlistName = 'Playlist';

    const result = await this.matchTracks(
      tracks.map((t: SpotifyPlaylistTrack) => t.track),
      options,
      onProgress
    );

    const duration = Date.now() - startTime;

    return {
      playlistId,
      playlistName,
      tracks,
      matches: result.matches,
      statistics: result.statistics,
      duration,
    };
  }

  async matchTracks(
    tracks: SpotifyTrack[],
    options: BatchMatcherOptions = {},
    onProgress?: ProgressCallback
  ): Promise<{ matches: TrackMatch[]; statistics: BatchMatchResult['statistics'] }> {
    const orchestratorOptions: Partial<OrchestratorOptions> = {
      enableISRC: options.enableISRC ?? defaultMatchingOptions.enableISRC,
      enableFuzzy: options.enableFuzzy ?? defaultMatchingOptions.enableFuzzy,
      enableStrict: options.enableStrict ?? defaultMatchingOptions.enableStrict,
      fuzzyThreshold: options.fuzzyThreshold ?? defaultMatchingOptions.fuzzyThreshold,
      maxSearchResults: options.maxSearchResults ?? defaultMatchingOptions.maxSearchResults,
    };

    const matches: TrackMatch[] = [];
    const total = tracks.length;
    const concurrency = options.concurrency ?? 1;

    if (concurrency <= 1) {
      for (let i = 0; i < tracks.length; i++) {
        const track = tracks[i];
        const match = await matchTracks(this.navidromeClient, [track], orchestratorOptions);
        matches.push(match[0]);

        // Calculate partial statistics
        let matched = 0;
        let unmatched = 0;
        for (const m of matches) {
          if (m.status === 'matched' || m.status === 'ambiguous') {
            matched++;
          } else {
            unmatched++;
          }
        }

        if (onProgress) {
          await onProgress({
            current: i + 1,
            total,
            currentTrack: track,
            currentMatch: match[0],
            percent: Math.round(((i + 1) / total) * 100),
            matched,
            unmatched,
          });
        }
      }
    } else {
      const chunks: SpotifyTrack[][] = [];
      for (let i = 0; i < tracks.length; i += concurrency) {
        chunks.push(tracks.slice(i, i + concurrency));
      }

      let processed = 0;
      for (const chunk of chunks) {
        const chunkResults = await Promise.all(
          chunk.map(async (track) => {
            const result = await matchTracks(this.navidromeClient, [track], orchestratorOptions);
            return result[0];
          })
        );
        matches.push(...chunkResults);
        processed += chunk.length;

        // Calculate partial statistics
        let matched = 0;
        let unmatched = 0;
        for (const m of matches) {
          if (m.status === 'matched' || m.status === 'ambiguous') {
            matched++;
          } else {
            unmatched++;
          }
        }

        if (onProgress) {
          await onProgress({
            current: processed,
            total,
            currentMatch: chunkResults[chunkResults.length - 1],
            percent: Math.round((processed / total) * 100),
            matched,
            unmatched,
          });
        }
      }
    }

    const statistics = getMatchStatistics(matches) as BatchMatchResult['statistics'];
    
    return { matches, statistics };
  }

  async matchTracksDifferential(
    tracks: SpotifyTrack[],
    cachedTracks: Record<string, TrackExportStatus>,
    options: BatchMatcherOptions = {},
    onProgress?: ProgressCallback
  ): Promise<{ matches: TrackMatch[]; statistics: BatchMatchResult['statistics']; newTracks: SpotifyTrack[]; cachedMatches: TrackMatch[] }> {
    const orchestratorOptions: Partial<OrchestratorOptions> = {
      enableISRC: options.enableISRC ?? defaultMatchingOptions.enableISRC,
      enableFuzzy: options.enableFuzzy ?? defaultMatchingOptions.enableFuzzy,
      enableStrict: options.enableStrict ?? defaultMatchingOptions.enableStrict,
      fuzzyThreshold: options.fuzzyThreshold ?? defaultMatchingOptions.fuzzyThreshold,
      maxSearchResults: options.maxSearchResults ?? defaultMatchingOptions.maxSearchResults,
    };

    const tracksToMatch: SpotifyTrack[] = [];
    const tracksFromCache: Array<{ track: SpotifyTrack; cachedStatus: TrackExportStatus }> = [];

    tracks.forEach(track => {
      const cachedStatus = cachedTracks[track.id];
      if (cachedStatus) {
        tracksFromCache.push({ track, cachedStatus });
      } else {
        tracksToMatch.push(track);
      }
    });

    const concurrency = options.concurrency ?? 1;
    let newMatches: TrackMatch[] = [];

    if (tracksToMatch.length > 0) {
      if (concurrency <= 1) {
        for (let i = 0; i < tracksToMatch.length; i++) {
          const track = tracksToMatch[i];
          const match = await matchTracks(this.navidromeClient, [track], orchestratorOptions);
          newMatches.push(match[0]);
        }
      } else {
        const chunks: SpotifyTrack[][] = [];
        for (let i = 0; i < tracksToMatch.length; i += concurrency) {
          chunks.push(tracksToMatch.slice(i, i + concurrency));
        }

        for (const chunk of chunks) {
          const chunkResults = await Promise.all(
            chunk.map(async (track) => {
              const result = await matchTracks(this.navidromeClient, [track], orchestratorOptions);
              return result[0];
            })
          );
          newMatches.push(...chunkResults);
        }
      }
    }

    const cachedMatches: TrackMatch[] = tracksFromCache.map(({ track, cachedStatus }) => {
      if (cachedStatus.status === 'matched' || cachedStatus.status === 'ambiguous') {
        const navidromeSong = cachedStatus.navidromeSongId ? {
          id: cachedStatus.navidromeSongId,
          title: track.name,
          artist: track.artists?.[0]?.name || 'Unknown',
          album: track.album?.name || 'Unknown',
          duration: track.duration_ms,
          isrc: track.external_ids?.isrc ? [track.external_ids.isrc] : undefined,
        } : undefined;

        return {
          spotifyTrack: track,
          navidromeSong,
          matchScore: cachedStatus.matchScore,
          matchStrategy: cachedStatus.matchStrategy as MatchStrategy,
          status: cachedStatus.status,
          candidates: undefined,
        };
      } else {
        return {
          spotifyTrack: track,
          navidromeSong: undefined,
          matchScore: 0,
          matchStrategy: 'none' as MatchStrategy,
          status: cachedStatus.status,
          candidates: undefined,
        };
      }
    });

    const allMatches: TrackMatch[] = [];
    const trackMap = new Map<string, TrackMatch>();

    tracks.forEach(track => {
      const cachedStatus = cachedTracks[track.id];
      if (cachedStatus) {
        const cachedMatch = cachedMatches.find(m => m.spotifyTrack.id === track.id);
        if (cachedMatch) {
          trackMap.set(track.id, cachedMatch);
        }
      }
    });

    newMatches.forEach(match => {
      trackMap.set(match.spotifyTrack.id, match);
    });

    tracks.forEach(track => {
      const match = trackMap.get(track.id);
      if (match) {
        allMatches.push(match);
      }
    });

    const statistics = getMatchStatistics(allMatches) as BatchMatchResult['statistics'];

    if (onProgress) {
      await onProgress({
        current: tracks.length,
        total: tracks.length,
        percent: 100,
        matched: statistics.matched,
        unmatched: statistics.unmatched + statistics.ambiguous,
      });
    }

    return {
      matches: allMatches,
      statistics,
      newTracks: tracksToMatch,
      cachedMatches,
    };
  }
}

export function createBatchMatcher(
  spotifyClient: SpotifyClient,
  navidromeClient: NavidromeApiClient
): BatchMatcher {
  return new DefaultBatchMatcher(spotifyClient, navidromeClient);
}
