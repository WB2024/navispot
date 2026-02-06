"use client"

import React, { useState, useCallback, useRef, useEffect } from "react"

export interface ManualMatchSearchResult {
  id: string
  title: string
  artist: string
  album: string
  duration: number
}

export interface ManualMatchTrack {
  spotifyTrackId: string
  playlistId: string
  title: string
  artist: string
  album: string
}

interface ManualMatchDialogProps {
  isOpen: boolean
  track: ManualMatchTrack | null
  onClose: () => void
  onSearch: (query: { title: string; artist: string; album: string }) => Promise<ManualMatchSearchResult[]>
  onSelect: (track: ManualMatchTrack, result: ManualMatchSearchResult) => void
}

export function ManualMatchDialog({
  isOpen,
  track,
  onClose,
  onSearch,
  onSelect,
}: ManualMatchDialogProps) {
  const [titleQuery, setTitleQuery] = useState("")
  const [artistQuery, setArtistQuery] = useState("")
  const [albumQuery, setAlbumQuery] = useState("")
  const [results, setResults] = useState<ManualMatchSearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const titleRef = useRef<HTMLInputElement>(null)

  // Pre-fill fields when the track changes
  useEffect(() => {
    if (track && isOpen) {
      setTitleQuery(track.title)
      setArtistQuery(track.artist)
      setAlbumQuery(track.album)
      setResults([])
      setHasSearched(false)
      // Focus the title field after render
      setTimeout(() => titleRef.current?.select(), 50)
    }
  }, [track, isOpen])

  const handleSearch = useCallback(async () => {
    if (!titleQuery.trim() && !artistQuery.trim() && !albumQuery.trim()) return

    setIsSearching(true)
    setHasSearched(true)
    try {
      const searchResults = await onSearch({
        title: titleQuery.trim(),
        artist: artistQuery.trim(),
        album: albumQuery.trim(),
      })
      setResults(searchResults)
    } catch (err) {
      console.error("Manual match search failed:", err)
      setResults([])
    } finally {
      setIsSearching(false)
    }
  }, [titleQuery, artistQuery, albumQuery, onSearch])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault()
        handleSearch()
      }
      if (e.key === "Escape") {
        onClose()
      }
    },
    [handleSearch, onClose],
  )

  const handleSelect = useCallback(
    (result: ManualMatchSearchResult) => {
      if (track) {
        onSelect(track, result)
        onClose()
      }
    },
    [track, onSelect, onClose],
  )

  const formatDuration = (seconds: number) => {
    const min = Math.floor(seconds / 60)
    const sec = seconds % 60
    return `${min}:${sec.toString().padStart(2, "0")}`
  }

  if (!isOpen || !track) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative w-full max-w-2xl mx-4 max-h-[85vh] flex flex-col rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 flex-shrink-0">
          <div>
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              Manual Match
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Search Navidrome for:{" "}
              <span className="font-medium text-zinc-700 dark:text-zinc-300">
                {track.title}
              </span>
              {" — "}
              <span className="text-zinc-600 dark:text-zinc-400">
                {track.artist}
              </span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search fields */}
        <div className="px-5 py-3 border-b border-zinc-200 dark:border-zinc-800 flex-shrink-0">
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                Title
              </label>
              <input
                ref={titleRef}
                type="text"
                value={titleQuery}
                onChange={(e) => setTitleQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Song title..."
                className="px-2.5 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                Artist
              </label>
              <input
                type="text"
                value={artistQuery}
                onChange={(e) => setArtistQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Artist name..."
                className="px-2.5 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                Album
              </label>
              <input
                type="text"
                value={albumQuery}
                onChange={(e) => setAlbumQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Album name..."
                className="px-2.5 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={handleSearch}
              disabled={isSearching || (!titleQuery.trim() && !artistQuery.trim() && !albumQuery.trim())}
              className="px-4 py-1.5 text-sm font-medium rounded-md bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSearching ? (
                <>
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Searching...
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Search Navidrome
                </>
              )}
            </button>
            <span className="text-xs text-zinc-400 dark:text-zinc-500">
              Press Enter to search
            </span>
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-auto min-h-0">
          {!hasSearched ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <svg className="w-10 h-10 text-zinc-300 dark:text-zinc-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Adjust the fields above and search to find a match
              </p>
            </div>
          ) : isSearching ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 dark:border-zinc-700 border-t-blue-500 mb-3" />
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Searching Navidrome...
              </p>
            </div>
          ) : results.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <svg className="w-10 h-10 text-zinc-300 dark:text-zinc-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                No results found. Try adjusting your search terms.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              <div className="px-5 py-2 bg-zinc-50 dark:bg-zinc-800/50 sticky top-0">
                <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  {results.length} result{results.length !== 1 ? "s" : ""} found — click to select
                </span>
              </div>
              {results.map((result) => (
                <button
                  key={result.id}
                  onClick={() => handleSelect(result)}
                  className="w-full px-5 py-3 text-left hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                          {result.title}
                        </span>
                        <span className="text-xs text-zinc-400 dark:text-zinc-500 flex-shrink-0">
                          {formatDuration(result.duration)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-xs text-zinc-600 dark:text-zinc-400 truncate">
                          {result.artist}
                        </span>
                        <span className="text-zinc-300 dark:text-zinc-600">·</span>
                        <span className="text-xs text-zinc-500 dark:text-zinc-500 truncate">
                          {result.album}
                        </span>
                      </div>
                    </div>
                    <span className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-xs font-medium text-blue-600 dark:text-blue-400 px-2.5 py-1 rounded-md bg-blue-100 dark:bg-blue-900/30">
                      Select
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
