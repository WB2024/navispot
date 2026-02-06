import React, { ReactNode } from "react"

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
  return (
    <div className="relative min-h-screen">
      {fixedExportButton}

      <div className="pb-20 px-4">
        {/* Responsive layout: stacked on mobile/tablet, side-by-side on desktop */}
        <div className="flex flex-col xl:flex-row gap-4 w-full">
          {/* Left Column - Playlist Table */}
          <div className="w-full xl:w-[680px] xl:min-w-[500px] xl:flex-shrink-0">
            <div className="h-[50vh] xl:h-[calc(100vh-120px)] overflow-auto">
              {mainTableSection}
            </div>
          </div>

          {/* Right Column - Selected Playlists & Songs */}
          <div className="flex-1 flex flex-col gap-4 min-w-0">
            {/* Selected Playlists Panel */}
            <div className="flex-shrink-0 max-h-[280px] overflow-auto">
              {selectedPlaylistsSection}
            </div>

            {/* Songs Panel - Takes remaining height */}
            <div className="flex-1 min-h-[300px] overflow-auto">
              {unmatchedSongsSection}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
