import React, { ReactNode } from 'react';

export interface ExportLayoutManagerProps {
  selectedPlaylistsSection: ReactNode;
  unmatchedSongsSection: ReactNode;
  mainTableSection: ReactNode;
  fixedExportButton: ReactNode;
}

export function ExportLayoutManager({
  selectedPlaylistsSection,
  unmatchedSongsSection,
  mainTableSection,
  fixedExportButton,
}: ExportLayoutManagerProps) {
  return (
    <div className="relative">
      {fixedExportButton}

      <div className="flex flex-col h-[calc(100vh-100px)]">
        {/* Top Section - 50% height - Consistent across all stages */}
        <div className="h-[50%] flex gap-4 overflow-hidden">
          {/* Left Column - Selected Playlists (50% width) */}
          <div className="w-1/2 flex flex-col overflow-hidden">
            {selectedPlaylistsSection}
          </div>
          
          {/* Right Column - Unmatched Songs (50% width) */}
          <div className="w-1/2 flex flex-col overflow-hidden">
            {unmatchedSongsSection}
          </div>
        </div>

        {/* Bottom Section - 50% height - Main Playlist Table */}
        <div className="h-[50%] border-t border-zinc-200 dark:border-zinc-800 overflow-hidden pt-4">
          {mainTableSection}
        </div>
      </div>
    </div>
  );
}
