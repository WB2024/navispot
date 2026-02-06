import { SpotifyTrack } from '@/types/spotify';

export interface CandidateInfo {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
}

export interface TrackExportStatus {
  spotifyTrackId: string;
  navidromeSongId?: string;
  status: 'matched' | 'ambiguous' | 'unmatched';
  matchStrategy: 'isrc' | 'fuzzy' | 'strict' | 'manual' | 'none';
  matchScore: number;
  matchedAt: string;
  matchedTitle?: string;
  matchedAlbum?: string;
  matchedArtist?: string;
  candidates?: CandidateInfo[];
  // Store original Spotify track info for unmatched tracks display
  title?: string;
  album?: string;
  artist?: string;
  duration?: string;
}

export interface PlaylistExportData {
  spotifyPlaylistId: string;
  spotifySnapshotId: string;
  playlistName: string;
  navidromePlaylistId?: string;
  exportedAt: string;
  trackCount: number;
  tracks: Record<string, TrackExportStatus>;
  statistics: {
    total: number;
    matched: number;
    unmatched: number;
    ambiguous: number;
  };
}

export interface DiffResult {
  newTracks: SpotifyTrack[];
  unchangedTracks: Array<{
    spotifyTrack: SpotifyTrack;
    cachedStatus: TrackExportStatus;
  }>;
  removedTracks: string[];
}

const STORAGE_KEY_PREFIX = 'navispot-playlist-export-';
const DEFAULT_MAX_AGE_DAYS = 90;

function getStorageKey(playlistId: string): string {
  return `${STORAGE_KEY_PREFIX}${playlistId}`;
}

/**
 * Saves playlist export data to localStorage.
 * @param playlistId - The Spotify playlist ID
 * @param data - The playlist export data to save
 */
export function savePlaylistExportData(playlistId: string, data: PlaylistExportData): void {
  try {
    const key = getStorageKey(playlistId);
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save playlist export data:', error);
  }
}

/**
 * Loads playlist export data from localStorage.
 * @param playlistId - The Spotify playlist ID
 * @returns The cached playlist export data, or null if not found or on error
 */
export function loadPlaylistExportData(playlistId: string): PlaylistExportData | undefined {
  try {
    const key = getStorageKey(playlistId);
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : undefined;
  } catch (error) {
    console.error('Failed to load playlist export data:', error);
    return undefined;
  }
}

/**
 * Deletes playlist export data from localStorage.
 * @param playlistId - The Spotify playlist ID
 */
export function deletePlaylistExportData(playlistId: string): void {
  try {
    const key = getStorageKey(playlistId);
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Failed to delete playlist export data:', error);
  }
}

/**
 * Gets all saved playlist export data from localStorage.
 * @returns A Map of playlist IDs to their export data
 */
export function getAllExportData(): Map<string, PlaylistExportData> {
  const result = new Map<string, PlaylistExportData>();
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(STORAGE_KEY_PREFIX)) {
        const data = localStorage.getItem(key);
        if (data) {
          const parsed = JSON.parse(data);
          const playlistId = key.slice(STORAGE_KEY_PREFIX.length);
          result.set(playlistId, parsed);
        }
      }
    }
  } catch (error) {
    console.error('Failed to get all export data:', error);
  }
  return result;
}

/**
 * Checks if a playlist is up to date with the current snapshot.
 * @param data - The cached playlist export data
 * @param currentSnapshotId - The current Spotify playlist snapshot ID
 * @returns True if the snapshot IDs match, false otherwise
 */
export function isPlaylistUpToDate(data: PlaylistExportData, currentSnapshotId: string): boolean {
  return data.spotifySnapshotId === currentSnapshotId;
}

/**
 * Calculates the differential export between current tracks and cached data.
 * @param currentTracks - The current list of Spotify tracks
 * @param cachedData - The cached playlist export data
 * @returns An object containing new, unchanged, and removed tracks
 */
export function calculateDiff(currentTracks: SpotifyTrack[], cachedData: PlaylistExportData): DiffResult {
  const newTracks: SpotifyTrack[] = [];
  const unchangedTracks: DiffResult['unchangedTracks'] = [];
  const removedTracks: string[] = [];

  const currentTrackIds = new Set(currentTracks.map(t => t.id));
  const cachedTrackIds = new Set(Object.keys(cachedData.tracks));

  currentTracks.forEach(track => {
    const cachedStatus = cachedData.tracks[track.id];
    if (cachedStatus) {
      unchangedTracks.push({ spotifyTrack: track, cachedStatus });
    } else {
      newTracks.push(track);
    }
  });

  cachedTrackIds.forEach(trackId => {
    if (!currentTrackIds.has(trackId)) {
      removedTracks.push(trackId);
    }
  });

  return { newTracks, unchangedTracks, removedTracks };
}

/**
 * Removes expired cache entries from localStorage.
 * @param maxAgeDays - Maximum age in days (defaults to 90)
 */
export function clearExpiredCache(maxAgeDays: number = DEFAULT_MAX_AGE_DAYS): void {
  const maxAge = maxAgeDays;
  const cutoffTime = Date.now() - maxAge * 24 * 60 * 60 * 1000;

  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(STORAGE_KEY_PREFIX)) {
        const data = localStorage.getItem(key);
        if (data) {
          try {
            const parsed = JSON.parse(data) as PlaylistExportData;
            const exportedAt = new Date(parsed.exportedAt).getTime();
            if (exportedAt < cutoffTime) {
              keysToRemove.push(key);
            }
          } catch {
            keysToRemove.push(key);
          }
        }
      }
    }

    keysToRemove.forEach(key => localStorage.removeItem(key));
  } catch (error) {
    console.error('Failed to clear expired cache:', error);
  }
}
