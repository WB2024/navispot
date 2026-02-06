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
        {/* Two-column layout using flex with explicit widths */}
        <div className="flex gap-4 w-full">
          {/* Left Column - Playlist Table */}
          <div className="w-[680px] min-w-[500px] flex-shrink-0">
            <div className="h-[calc(100vh-120px)] overflow-auto">
              {mainTableSection}
            </div>
          </div>

          {/* Right Column - Selected Playlists & Songs */}
          <div className="flex-1 min-w-[450px] flex flex-col gap-4">
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
