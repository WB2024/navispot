import React, { ReactNode, useState } from "react"

export interface ExportLayoutManagerProps {
  selectedPlaylistsSection: ReactNode
  unmatchedSongsSection: ReactNode
  mainTableSection: ReactNode
  fixedExportButton: ReactNode
}

export function ExportLayoutManager({
  selectedPlaylistsSection,
  unmatchedSongsSection,
  mainTableSection,
  fixedExportButton,
}: ExportLayoutManagerProps) {
  const [activeTab, setActiveTab] = useState<"playlists" | "tracks">("playlists")

  return (
    <div className="relative min-h-screen">
      {fixedExportButton}

      <div className="flex flex-col pb-20 px-4 max-w-[1800px] mx-auto">
        {/* Tab Navigation for Mobile/Tablet */}
        <div className="lg:hidden flex border-b border-zinc-200 dark:border-zinc-800 mb-4 sticky top-0 bg-white dark:bg-zinc-950 z-10">
          <button
            onClick={() => setActiveTab("playlists")}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "playlists"
                ? "border-blue-500 text-blue-600 dark:text-blue-400"
                : "border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            }`}
          >
            Playlists
          </button>
          <button
            onClick={() => setActiveTab("tracks")}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "tracks"
                ? "border-blue-500 text-blue-600 dark:text-blue-400"
                : "border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            }`}
          >
            Tracks & Export
          </button>
        </div>

        {/* Desktop Layout - Side by side with better proportions */}
        <div className="hidden lg:grid lg:grid-cols-12 gap-4">
          {/* Left Column - Playlist Selection (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="sticky top-4">
              <div className="max-h-[calc(100vh-120px)] overflow-hidden flex flex-col">
                {mainTableSection}
              </div>
            </div>
          </div>

          {/* Right Column - Selected & Tracks (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Selected Playlists - Compact */}
            <div className="max-h-[300px] overflow-hidden">
              {selectedPlaylistsSection}
            </div>

            {/* Songs Panel - Takes remaining space */}
            <div className="min-h-[400px] max-h-[calc(100vh-450px)] overflow-hidden">
              {unmatchedSongsSection}
            </div>
          </div>
        </div>

        {/* Mobile/Tablet Layout - Tabbed */}
        <div className="lg:hidden">
          {activeTab === "playlists" && (
            <div className="space-y-4">
              {/* Main Playlist Table */}
              <div className="min-h-[50vh]">
                {mainTableSection}
              </div>
              {/* Selected Playlists - Below table on mobile */}
              <div className="max-h-[300px] overflow-hidden">
                {selectedPlaylistsSection}
              </div>
            </div>
          )}
          {activeTab === "tracks" && (
            <div className="min-h-[70vh]">
              {unmatchedSongsSection}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
