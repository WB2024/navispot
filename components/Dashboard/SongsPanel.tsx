"use client"

import React, { useState, useMemo } from "react"
import { CandidateInfo } from "@/lib/export/track-export-cache"
import { ManualMatchTrack } from "@/components/Dashboard/ManualMatchDialog"

export interface Song {
  spotifyTrackId: string
  title: string
  album: string
  artist: string
  duration: string
  exportStatus?: "waiting" | "exported" | "failed"
  matchedTitle?: string
  matchedAlbum?: string
  matchedArtist?: string
  matchStrategy?: string
  candidates?: CandidateInfo[]
}

export interface PlaylistGroup {
  playlistId: string
  playlistName: string
  songs: Song[]
  isLoading?: boolean
}

interface SongsPanelProps {
  playlistGroups: PlaylistGroup[]
  isLoading?: boolean
  onRematchUnmatched?: () => void
  isRematching?: boolean
  onSelectCandidate?: (playlistId: string, spotifyTrackId: string, candidate: CandidateInfo) => void
  onManualMatch?: (track: ManualMatchTrack) => void
}

export function SongsPanel({
  playlistGroups,
  isLoading = false,
  onRematchUnmatched,
  isRematching = false,
  onSelectCandidate,
  onManualMatch,
}: SongsPanelProps) {
  const [showUnmatchedOnly, setShowUnmatchedOnly] = useState(false)
  const [expandedTrackKey, setExpandedTrackKey] = useState<string | null>(null)

  const filteredGroups = useMemo(() => {
    if (!showUnmatchedOnly) {
      return playlistGroups
    }

    return playlistGroups.map((group) => ({
      ...group,
      songs: group.songs.filter(
        (song) => song.exportStatus === "failed"
      ),
    }))
  }, [playlistGroups, showUnmatchedOnly])

  const handleDownloadUnmatched = () => {
    const unmatchedSongs: Array<{
      title: string
      artist: string
      album: string
      duration: string
    }> = []

    playlistGroups.forEach((group) => {
      group.songs.forEach((song) => {
        if (song.exportStatus === "failed") {
          unmatchedSongs.push({
            title: song.title,
            artist: song.artist,
            album: song.album,
            duration: song.duration,
          })
        }
      })
    })

    if (unmatchedSongs.length === 0) {
      return
    }

    const jsonString = JSON.stringify(unmatchedSongs, null, 2)
    const blob = new Blob([jsonString], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    const now = new Date()
    const dateTime = `${now.toISOString().split("T")[0]}_${now.toTimeString().slice(0, 8).replace(/:/g, "-")}`
    const names = playlistGroups.map((g) => g.playlistName).filter(Boolean)
    const playlistLabel = names.length === 1
      ? names[0].replace(/[^a-zA-Z0-9]/g, "_")
      : `${names.length}_playlists`
    link.download = `unmatched-songs-${playlistLabel}-${dateTime}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
  if (filteredGroups.length === 0) {
    return (
      <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden flex flex-col h-full">
        <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex-shrink-0">
          <h2 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            Songs
          </h2>
        </div>
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center flex-1">
          {isLoading ? (
            <>
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 dark:border-zinc-700 border-t-blue-500 mb-4"></div>
              <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-1">
                Loading Tracks...
              </h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Fetching tracks from Spotify
              </p>
            </>
          ) : (
            <>
              <svg
                className="w-12 h-12 text-zinc-300 dark:text-zinc-600 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z"
                />
              </svg>
              <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-1">
                No Playlists Checked
              </h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Check playlists in the left panel to view their tracks here.
              </p>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden flex flex-col h-full">
      <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex-shrink-0">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            Songs
          </h2>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showUnmatchedOnly}
                onChange={(e) => setShowUnmatchedOnly(e.target.checked)}
                className="rounded border-zinc-300 dark:border-zinc-600 text-blue-500 focus:ring-blue-500 dark:bg-zinc-700"
              />
              <span className="text-xs text-zinc-600 dark:text-zinc-400">
                Unmatched Songs
              </span>
            </label>
            {onRematchUnmatched && (
              <button
                onClick={onRematchUnmatched}
                disabled={isRematching}
                className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Re-match unmatched songs against Navidrome"
              >
                <svg
                  className={`w-4 h-4 ${isRematching ? "animate-spin" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                {isRematching ? "Re-matching..." : "Re-match"}
              </button>
            )}
            <button
              onClick={handleDownloadUnmatched}
              className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
              title="Download unmatched songs as JSON"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              Download
            </button>
          </div>
        </div>
      </div>
      <div className="overflow-auto flex-1">
        <table className="w-full">
          <thead className="bg-zinc-50 dark:bg-zinc-800/95 sticky top-0">
            <tr className="border-b border-zinc-200 dark:border-zinc-800">
              <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400 w-[5%]">
                #
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400 w-[35%]">
                Title
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400 w-[22%]">
                Album
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400 w-[18%]">
                Artist
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400 w-[10%]">
                Duration
              </th>
              <th className="px-4 py-2 text-center text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400 w-[10%]">
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredGroups.map((group) => (
              <React.Fragment key={group.playlistId}>
                {/* Section Header */}
                <tr>
                  <td
                    colSpan={6}
                    className="bg-zinc-100 dark:bg-zinc-800 px-4 py-2 font-semibold text-sm border-t-2 border-zinc-300 dark:border-zinc-700"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={
                          group.isLoading ? "animate-spin inline-block" : ""
                        }
                      >
                        💿
                      </span>
                      <span>{group.playlistName}</span>
                      <span className="text-zinc-500 dark:text-zinc-400 font-normal">
                        ({group.songs.length} tracks)
                      </span>
                      {group.isLoading && (
                        <span className="ml-auto text-blue-500 text-xs font-normal flex items-center gap-1">
                          <span className="animate-pulse">Fetching...</span>
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
                {/* Tracks */}
                {group.songs.map((song, index) => {
                  const trackKey = `${group.playlistId}-${song.spotifyTrackId}`
                  const hasCandidates = song.candidates && song.candidates.length > 1
                  const isExpanded = expandedTrackKey === trackKey

                  return (
                    <React.Fragment key={`${group.playlistId}-${song.spotifyTrackId}`}>
                      <tr
                        className={`hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors border-b border-zinc-200 dark:border-zinc-800 ${
                          song.exportStatus === "exported"
                            ? "bg-green-50 dark:bg-green-900/20"
                            : song.exportStatus === "failed"
                              ? "bg-red-50 dark:bg-red-900/20"
                              : ""
                        }`}
                      >
                        <td className="px-4 py-2 text-sm text-zinc-500 dark:text-zinc-400">
                          <div className="flex items-center gap-1">
                            {hasCandidates && (
                              <button
                                onClick={() => setExpandedTrackKey(isExpanded ? null : trackKey)}
                                className="text-amber-500 hover:text-amber-600 dark:text-amber-400 dark:hover:text-amber-300 -ml-1"
                                title={`${song.candidates!.length} candidates — click to choose`}
                              >
                                <svg className={`w-3.5 h-3.5 transition-transform ${isExpanded ? "rotate-90" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </button>
                            )}
                            <span>{index + 1}</span>
                          </div>
                        </td>
                        <td
                          className="px-4 py-2 text-sm text-zinc-900 dark:text-zinc-100 truncate max-w-[200px]"
                          title={song.matchedTitle && song.matchedTitle !== song.title ? `Matched: ${song.matchedTitle}` : song.title}
                        >
                          <div className="flex items-center gap-1">
                            <span>{song.title}</span>
                            {hasCandidates && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" title="Multiple candidates found">
                                {song.candidates!.length}
                              </span>
                            )}
                          </div>
                          {song.matchedTitle && song.matchedTitle !== song.title && (
                            <div className="text-xs text-emerald-600 dark:text-emerald-400 truncate">
                              → {song.matchedTitle}
                            </div>
                          )}
                        </td>
                        <td
                          className="px-4 py-2 text-sm text-zinc-600 dark:text-zinc-400 truncate max-w-[120px]"
                          title={song.matchedAlbum && song.matchedAlbum !== song.album ? `Matched: ${song.matchedAlbum}` : song.album}
                        >
                          <div>{song.album}</div>
                          {song.matchedAlbum && song.matchedAlbum !== song.album && (
                            <div className="text-xs text-emerald-600 dark:text-emerald-400 truncate">
                              → {song.matchedAlbum}
                            </div>
                          )}
                        </td>
                        <td
                          className="px-4 py-2 text-sm text-zinc-600 dark:text-zinc-400 truncate max-w-[120px]"
                          title={song.artist}
                        >
                          {song.artist}
                        </td>
                        <td className="px-4 py-2 text-sm text-zinc-500 dark:text-zinc-400">
                          {song.duration}
                        </td>
                        <td className="px-2 py-2 text-center">
                          {onManualMatch && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                onManualMatch({
                                  spotifyTrackId: song.spotifyTrackId,
                                  playlistId: group.playlistId,
                                  title: song.title,
                                  artist: song.artist,
                                  album: song.album,
                                })
                              }}
                              className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
                                song.exportStatus === "failed"
                                  ? "text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                  : "text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                              }`}
                              title={song.exportStatus === "failed" ? "Search Navidrome to manually match" : "Change the matched track"}
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                              </svg>
                              {song.exportStatus === "failed" ? "Match" : "Edit"}
                            </button>
                          )}
                        </td>
                      </tr>
                      {/* Expanded candidate rows */}
                      {isExpanded && song.candidates && (
                        <tr>
                          <td colSpan={6} className="px-0 py-0">
                            <div className="bg-amber-50/50 dark:bg-amber-900/10 border-b border-zinc-200 dark:border-zinc-800">
                              <div className="px-4 py-2">
                                <div className="text-xs font-medium text-amber-700 dark:text-amber-400 mb-2">
                                  Choose the correct match:
                                </div>
                                <div className="space-y-1">
                                  {song.candidates.map((candidate, ci) => {
                                    const isSelected = song.matchedTitle === candidate.title
                                      && song.matchedAlbum === candidate.album
                                      && song.matchedArtist === candidate.artist
                                    const durationMin = Math.floor(candidate.duration / 60)
                                    const durationSec = candidate.duration % 60

                                    return (
                                      <div
                                        key={candidate.id}
                                        className={`flex items-center gap-3 px-3 py-1.5 rounded text-xs transition-colors ${
                                          isSelected
                                            ? "bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-300 dark:border-emerald-700"
                                            : "bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:border-amber-300 dark:hover:border-amber-600"
                                        }`}
                                      >
                                        <span className="text-zinc-400 dark:text-zinc-500 w-4 text-right flex-shrink-0">
                                          {ci + 1}.
                                        </span>
                                        <span className="font-medium text-zinc-900 dark:text-zinc-100 truncate min-w-0 flex-[2]" title={candidate.title}>
                                          {candidate.title}
                                        </span>
                                        <span className="text-zinc-500 dark:text-zinc-400 truncate min-w-0 flex-[1.5]" title={candidate.album}>
                                          {candidate.album}
                                        </span>
                                        <span className="text-zinc-500 dark:text-zinc-400 truncate min-w-0 flex-1" title={candidate.artist}>
                                          {candidate.artist}
                                        </span>
                                        <span className="text-zinc-400 dark:text-zinc-500 flex-shrink-0 w-10 text-right">
                                          {durationMin}:{durationSec.toString().padStart(2, "0")}
                                        </span>
                                        {isSelected ? (
                                          <span className="flex-shrink-0 text-emerald-600 dark:text-emerald-400 font-medium">
                                            ✓ Selected
                                          </span>
                                        ) : (
                                          <button
                                            onClick={() => {
                                              onSelectCandidate?.(group.playlistId, song.spotifyTrackId, candidate)
                                            }}
                                            className="flex-shrink-0 px-2 py-0.5 rounded bg-amber-500 hover:bg-amber-600 text-white font-medium transition-colors"
                                          >
                                            Select
                                          </button>
                                        )}
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  )
                })}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
