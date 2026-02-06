import { useState, useRef, useEffect, type Dispatch, type SetStateAction, type MutableRefObject } from 'react';
import { ProgressState } from '@/components/ProgressTracker';
import { SelectedPlaylist } from '@/components/Dashboard/SelectedPlaylistsPanel';
import { UnmatchedSong } from '@/components/Dashboard/UnmatchedSongsPanel';

import { CandidateInfo } from '@/lib/export/track-export-cache';

export interface SongExportEntry {
  status: 'waiting' | 'exported' | 'failed';
  matchedTitle?: string;
  matchedAlbum?: string;
  matchedArtist?: string;
  matchStrategy?: string;
  candidates?: CandidateInfo[];
}

export interface ExportState {
  isExporting: boolean;
  progressState: ProgressState | null;
  selectedPlaylistsStats: SelectedPlaylist[];
  currentUnmatchedPlaylistId: string | null;
  unmatchedSongs: UnmatchedSong[];
  showSuccess: boolean;
  showCancel: boolean;
  showCancelConfirmation: boolean;
  showConfirmation: boolean;
  isRematching: boolean;
  songExportStatus: Map<string, Map<string, SongExportEntry>>;
}

export interface ExportActions {
  setIsExporting: (v: boolean) => void;
  setProgressState: (v: ProgressState | null) => void;
  setSelectedPlaylistsStats: Dispatch<SetStateAction<SelectedPlaylist[]>>;
  setCurrentUnmatchedPlaylistId: (v: string | null) => void;
  setUnmatchedSongs: (v: UnmatchedSong[]) => void;
  setShowSuccess: (v: boolean) => void;
  setShowCancel: (v: boolean) => void;
  setShowCancelConfirmation: (v: boolean) => void;
  setShowConfirmation: (v: boolean) => void;
  setIsRematching: (v: boolean) => void;
  setSongExportStatus: Dispatch<SetStateAction<ExportState['songExportStatus']>>;
  isExportingRef: MutableRefObject<boolean>;
  abortControllerRef: MutableRefObject<AbortController | null>;
}

/**
 * Custom hook that manages all export-related state.
 * Extracts the export state management from Dashboard.tsx for clarity.
 * 
 * The actual export orchestration logic (handleStartExport) remains in Dashboard
 * because it accesses many other pieces of Dashboard state (playlists, selectedIds, etc.)
 * but this hook consolidates the export-specific state.
 */
export function usePlaylistExport(): ExportState & ExportActions {
  const [isExporting, setIsExporting] = useState(false);
  const [progressState, setProgressState] = useState<ProgressState | null>(null);
  const [selectedPlaylistsStats, setSelectedPlaylistsStats] = useState<SelectedPlaylist[]>([]);
  const [currentUnmatchedPlaylistId, setCurrentUnmatchedPlaylistId] = useState<string | null>(null);
  const [unmatchedSongs, setUnmatchedSongs] = useState<UnmatchedSong[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [showCancelConfirmation, setShowCancelConfirmation] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isRematching, setIsRematching] = useState(false);
  const [songExportStatus, setSongExportStatus] = useState<ExportState['songExportStatus']>(new Map());

  const isExportingRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Persist export progress to sessionStorage
  useEffect(() => {
    if (isExporting && selectedPlaylistsStats.length > 0) {
      try {
        sessionStorage.setItem(
          'navispot-export-progress',
          JSON.stringify({
            selectedPlaylistsStats,
            timestamp: Date.now(),
          }),
        );
      } catch {
        // Silently fail on sessionStorage errors
      }
    }
  }, [isExporting, selectedPlaylistsStats]);

  // Restore export progress on mount
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('navispot-export-progress');
      if (saved) {
        const { selectedPlaylistsStats: savedStats, timestamp } = JSON.parse(saved);
        if (Date.now() - timestamp < 5 * 60 * 1000 && savedStats?.length > 0) {
          setSelectedPlaylistsStats(savedStats.map(
            (stat: SelectedPlaylist) => stat.status === 'exporting'
              ? { ...stat, status: 'pending' as const }
              : stat,
          ));
        }
        sessionStorage.removeItem('navispot-export-progress');
      }
    } catch {
      // Silently fail on parse errors
    }
  }, []);

  return {
    // State
    isExporting,
    progressState,
    selectedPlaylistsStats,
    currentUnmatchedPlaylistId,
    unmatchedSongs,
    showSuccess,
    showCancel,
    showCancelConfirmation,
    showConfirmation,
    isRematching,
    songExportStatus,
    // Setters
    setIsExporting,
    setProgressState,
    setSelectedPlaylistsStats,
    setCurrentUnmatchedPlaylistId,
    setUnmatchedSongs,
    setShowSuccess,
    setShowCancel,
    setShowCancelConfirmation,
    setShowConfirmation,
    setIsRematching,
    setSongExportStatus,
    isExportingRef,
    abortControllerRef,
  };
}
