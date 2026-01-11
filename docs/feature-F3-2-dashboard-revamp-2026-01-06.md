# Feature F3.2 Dashboard UI Revamp Plan

**Date:** January 6, 2026
**Status:** Planning
**Previous Implementation:** Grid-based card layout (feature-F3-2-dashboard.md)

---

## Overview

Revamp the dashboard UI from a grid-based card layout to a table-based layout with advanced filtering, sorting, and search capabilities. This revamp improves playlist management for bulk export operations while maintaining visual consistency with the login page design language.

---

## UI Flow Stages

The dashboard export workflow is divided into three distinct stages:

| Stage | Description |
|-------|-------------|
| **Before Exporting** | Browse, filter, search, and select playlists in a data table |
| **During Exporting** | Track export progress with real-time status updates |
| **After Exporting** | View export results, statistics, and options to export again or return to dashboard |

---

## Stage 1: Before Exporting (Table View)

### 1.1 Table Layout Requirements

#### Container Properties
- **Height:** Responsive to viewport (`max-h-[70vh]` or `h-[calc(100vh-250px)]`)
- **Width:** Full width appropriate for data display (not constrained like login card)
- **Overflow:** Inner scrollable content with sticky header
- **Pagination:** None - all playlists loaded at once for simplicity
- **Loved Songs Row:** Second row (after header) - visible at beginning of table, scrolls with content

#### Header Row Behavior
- **Sticky positioning:** Header row sticks to top when scrolling
- **Background:** Semi-transparent backdrop with blur effect
- **Z-index:** Higher than table body content

#### Column Structure

| Column | Width | Content | Sortable | Filterable |
|--------|-------|---------|----------|------------|
| Select | 60px | Checkbox for individual + "Select All" header checkbox | No | No |
| Cover | 80px | Playlist cover image (Next.js Image) | No | No |
| Name | Auto | Playlist name (truncated with tooltip) | Yes | Yes |
| Tracks | 120px | Total track count | Yes | No |
| Owner | 200px | Owner display name | Yes | Yes |
| Status | 120px | Export status badge | No | **No** (non-filterable) |

**Table Row Order:**
1. **Header Row** (sticky) - Column titles with sort indicators
2. **Loved Songs Row** - Liked Songs playlist as the first playlist row
3. **Playlist Rows** - Remaining playlists scrollable within table body

**Note:** The Status column is explicitly non-filterable to maintain focus on selection and export actions.

### 1.2 Functional Requirements

#### Sorting
- Click column headers to toggle ascending/descending sort
- Visual indicator (arrow icon) showing sort direction
- Default sort: Name (A-Z)
- Sortable columns: Name, Tracks, Owner

#### Filtering
- Filter dropdown per applicable column (Name, Owner)
- Quick filter chips above table for common filters
- Filters act on the full playlist list (no pagination)
- Filter options:
  - All Playlists
  - Selected Only
  - Not Selected
  - Liked Songs
  - Exported
  - Not Exported

#### Searching
- Global search bar above table
- Searches across: Playlist name, Owner name
- Debounced search (300ms delay)
- Clear search button with icon

#### Selection
- Individual row checkbox selection
- Header checkbox for "Select All" (selects filtered/visible playlists only)
- "Select All" selects only playlists matching current filters and search criteria
- Selection state persists during session
- Visual indicator for selected rows (row highlight)

### 1.3 Visual Design (Login Page Theme)

The table inherits visual style elements from the login page but not its layout/sizing constraints.

#### Color Scheme (from login page)

```css
/* Page background */
bg-zinc-50 dark:bg-black

/* Card/container */
rounded-lg border border-zinc-200 dark:border-zinc-800
bg-white dark:bg-zinc-900

/* Headings */
text-zinc-900 dark:text-zinc-100

/* Body text */
text-sm text-zinc-600 dark:text-zinc-400

/* Section borders */
border-b border-zinc-200 dark:border-zinc-800

/* Loading spinner */
border-4 border-green-500 border-t-transparent
```

#### Typography
- Font: Geist Sans (consistent with login page)
- Header: Medium weight, uppercase, tracking-wide, smaller font size
- Body: Regular weight, appropriate line height

#### Component Styles

**Table Container:**
```tsx
<div className="w-full max-w-6xl mx-auto">
  <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
    {/* Table content */}
  </div>
</div>
```

**Header Row (Sticky):**
```tsx
<thead className="sticky top-0 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm z-10">
  <tr className="border-b border-zinc-200 dark:border-zinc-800">
    {/* Headers */}
  </tr>
</thead>
```

**Row Hover Effects:**
```tsx
<tr className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer">
```

**Selected Row:**
```tsx
<tr className="bg-zinc-100 dark:bg-zinc-800 border-l-4 border-l-green-500">
```

**Zebra Striping (Row Visual Separation):**
```tsx
<tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
  {/* Even rows: Standard background */}
  <tr className="bg-white dark:bg-zinc-900">
  
  {/* Odd rows: Slightly darker for visual separation */}
  <tr className="bg-zinc-50 dark:bg-zinc-800/50">
</tbody>
```

**Row Alternating Pattern:**
| Row Type | Light Mode | Dark Mode |
|----------|------------|-----------|
| Even | `bg-white` | `bg-zinc-900` |
| Odd | `bg-zinc-50` | `bg-zinc-800/50` |
---

## Stage 2: During Exporting (Progress View)

### 2.1 Layout Overview

**Vertical Split Layout:**
- **Top (40%):** Export Progress Panel - Shows current export progress, statistics, and current track
- **Bottom (60%):** Table View - Remains visible during export with modified Status column

```
+------------------------------------------------------+
|  EXPORT PROGRESS PANEL (40% height)                  |
|  +--------------------------------------------------+ |
|  | Playlist: Playlist Name                          | |
|  | Phase: Matching | 45 of 100 tracks              | |
|  | [==================== 45% ================]     | |
|  | Current: "Song Title" by "Artist Name"          | |
|  | Matched: 40  Unmatched: 5  Exported: 35         | |
|  |                        [Cancel Export]          | |
|  +--------------------------------------------------+ |
+------------------------------------------------------+
|  TABLE VIEW (60% height)                             |
|  +--------------------------------------------------+ |
|  | Select | Cover | Name    | Tracks | Owner | Stat| |
|  +--------------------------------------------------+ |
|  | [  ]   | [Img] | Liked...| 150    | You   | === | | <- Highlighted (exporting)
|  | [x]    | [Img] | Playlist| 42     | User  | Out | |
|  | [  ]   | [Img] | Another | 89     | Other | ---- | |
|  +--------------------------------------------------+ |
+------------------------------------------------------+
```

### 2.2 Progress Panel Components

#### Progress Panel Features
- **Playlist Name:** Currently exporting playlist
- **Phase Indicator:** Matching tracks → Exporting to Navidrome
- **Progress Bar:** Overall progress with percentage
- **Current Track:** Track name, artist, and progress (e.g., "45/100")
- **Statistics Cards:**
  - Matched (green) - Successfully matched tracks
  - Unmatched (yellow) - No match found
  - Exported (blue) - Successfully exported to Navidrome
- **Cancel Export Button:** Abort the entire export process
- **Time Estimates:** Elapsed/remaining time (optional)

#### Visual Styling
- Uses existing `ProgressTracker` component styling
- Card container: `rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900`
- Statistics cards: Colored backgrounds matching status badges

### 2.3 Table Behavior During Export

#### Status Column Transformation
The Status column dynamically changes based on export state:

| State | Column Content |
|-------|----------------|
| **Idle** | Status badge: `Exported` / `Out of Sync` / `Not Exported` |
| **Exporting** | Progress bar showing export progress (per-playlist) |
| **Completed** | Updated status badge |

#### Status Badge Styles (Idle State)

| Status | Badge Style |
|--------|-------------|
| None | `bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400` |
| Exported | `bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400` |
| Out of Sync | `bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400` |

#### Progress Bar Styles (Exporting State)

```tsx
{/* Progress bar in Status column during export */}
<div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-2 overflow-hidden">
  <div 
    className="bg-blue-500 h-full transition-all duration-300"
    style={{ width: `${percent}%` }}
  />
</div>
```

#### Row Highlighting
- **Currently exporting playlist row** gets highlighted
- **Highlight style:** `border-l-4 border-l-blue-500 bg-blue-50 dark:bg-blue-900/20`
- Non-exporting rows remain with zebra striping
- Table selection is **disabled** during export

### 2.4 Export Flow Sequence

1. User clicks "Export Selected"
2. Progress Panel appears at top (40% height)
3. Table remains visible below (60% height)
4. First selected playlist row is highlighted
5. Status column shows progress bar for exporting playlist
6. Progress updates in real-time as tracks are processed
7. On completion, status changes to "Exported"
8. Move to next selected playlist
9. When all complete, show Results Report

### 2.5 Cancel Export Behavior

- **Cancel Button:** Always visible in Progress Panel during export
- **On Cancel:**
  - Stop current export process
  - Show "Export cancelled" state
  - Allow user to return to table view
  - Previously exported playlists retain "Exported" status
  - In-progress playlist remains with previous status

---

## Export Progress Panel Component

### Component Overview

The `ExportProgressPanel` displays above the table during export, showing real-time progress of playlist exports.

### Props Interface

```typescript
interface ExportProgressPanelProps {
  playlistName: string;
  phase: 'matching' | 'exporting' | 'completed';
  progress: {
    current: number;
    total: number;
    percent: number;
  };
  currentTrack?: {
    name: string;
    artist: string;
    index?: number;
    total?: number;
  };
  statistics: {
    matched: number;
    unmatched: number;
    exported: number;
    failed: number;
  };
  onCancel: () => void;
  isLastPlaylist?: boolean;
}
```

### Visual Layout

```tsx
<div className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
  {/* Header */}
  <div className="flex items-center justify-between mb-4">
    <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
      Exporting: {playlistName}
    </h2>
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
      phase === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
      phase === 'exporting' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
    }`}>
      {phase === 'matching' ? 'Matching tracks' : phase === 'exporting' ? 'Exporting' : 'Complete'}
    </span>
  </div>

  {/* Progress Bar */}
  <div className="mb-4">
    <div className="flex justify-between text-sm text-zinc-500 dark:text-zinc-400 mb-2">
      <span>Processing...</span>
      <span className="font-medium">{progress.percent}%</span>
    </div>
    <div className="h-3 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
      <div 
        className="h-full bg-green-500 transition-all duration-300"
        style={{ width: `${progress.percent}%` }}
      />
    </div>
  </div>

  {/* Current Track */}
  {currentTrack && (
    <div className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg mb-4">
      <svg className="w-5 h-5 text-zinc-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z" />
      </svg>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
          {currentTrack.name}
        </p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
          {currentTrack.artist}
        </p>
      </div>
      {currentTrack.index !== undefined && currentTrack.total !== undefined && (
        <div className="text-xs text-zinc-400">
          {currentTrack.index + 1}/{currentTrack.total}
        </div>
      )}
    </div>
  )}

  {/* Statistics */}
  <div className="grid grid-cols-3 gap-4 mb-4">
    <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
      <p className="text-2xl font-bold text-green-600 dark:text-green-400">
        {statistics.matched}
      </p>
      <p className="text-xs text-green-700 dark:text-green-400">Matched</p>
    </div>
    <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
      <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
        {statistics.unmatched}
      </p>
      <p className="text-xs text-yellow-700 dark:text-yellow-400">Unmatched</p>
    </div>
    <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
        {statistics.exported}
      </p>
      <p className="text-xs text-blue-700 dark:text-blue-400">Exported</p>
    </div>
  </div>

  {/* Footer */}
  <div className="flex items-center justify-between">
    <p className="text-sm text-zinc-500 dark:text-zinc-400">
      {progress.current} of {progress.total} tracks processed
    </p>
    <button
      onClick={onCancel}
      className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 bg-red-50 hover:bg-red-100 dark:bg-red-900/30 dark:hover:bg-red-900/50 rounded-lg transition-colors"
    >
      Cancel Export
    </button>
  </div>
</div>
```

### Vertical Split Layout Configuration

The dashboard uses a configurable vertical split during export:

```tsx
{isExporting ? (
  <div className="flex flex-col h-screen">
    {/* Progress Panel - 40% height */}
    <div className="h-[40%] p-6 overflow-y-auto">
      <ExportProgressPanel {...progressProps} />
    </div>
    
    {/* Table - 60% height */}
    <div className="flex-1 overflow-hidden">
      <PlaylistTable ... />
    </div>
  </div>
) : (
  <PlaylistTable ... />
)}
```

**Notes:**
- Height percentages are configurable via CSS or props
- Both panels remain scrollable independently
- Table header remains sticky during export
- Table selection is disabled during export

---

## Stage 3: After Exporting (Results View)

### 3.1 Results Report Components

#### Results Report (Existing)
- Uses `ResultsReport` component
- Summary cards with statistics
- Match status breakdown
- Export options

#### Results Features
- **Summary Cards:**
  - Total Tracks
  - Matched
  - Unmatched
  - Ambiguous
  - Exported
  - Failed

- **Action Buttons:**
  - Export Again (repeats export)
  - Back to Dashboard (returns to table view)

### 3.2 Results Layout

```
+------------------------------------------------------+
|  Export Complete: Playlist Name                      |
+------------------------------------------------------+
|  [==========] Total    [====] Matched   [==] Unmatched|
|  [==] Ambiguous [====] Exported  [=] Failed          |
+------------------------------------------------------+
|  Match Details (expandable sections)                 |
+------------------------------------------------------+
|                  [Export Again]  [Back to Dashboard] |
+------------------------------------------------------+
```

---

## Export Tracking & Sync Mechanism

### Overview

Export status is tracked using Navidrome's `comment` field on playlists. This enables cross-device sync and change detection.

### Comment Metadata Format

When a playlist is exported, store JSON metadata in Navidrome's `comment` field:

```json
{
  "spotifyPlaylistId": "abc123",
  "navidromePlaylistId": "nav123",
  "spotifySnapshotId": "xyz789",
  "exportedAt": "2026-01-06T10:30:00Z",
  "trackCount": 42
}
```

### Export Status States

| Status | Condition | Badge Style |
|--------|-----------|-------------|
| **Not Exported** | No matching Navidrome playlist found | Gray `bg-zinc-100 text-zinc-600` |
| **Exported** | Navidrome playlist exists with matching `snapshotId` | Green `bg-green-100 text-green-700` |
| **Out of Sync** | Navidrome exists but `snapshotId` differs | Orange `bg-orange-100 text-orange-700` |

### Sync Detection

1. **On Dashboard Load:**
   - Fetch all Navidrome playlists
   - Parse `comment` field for metadata
   - Match with Spotify playlists by `spotifyPlaylistId`
   - Compare current Spotify `snapshot_id` with stored `snapshotId`

2. **Status Determination:**
   - No match found → `not-exported`
   - Match found + `snapshotId` matches → `exported`
   - Match found + `snapshotId` differs → `out-of-sync`

3. **Sync Actions:**
   - `out-of-sync` playlists show warning icon
   - Re-export updates existing Navidrome playlist (using `navidromePlaylistId`)
   - New exports create new Navidrome playlists

### Liked Songs Tracking

Liked Songs sync uses a special approach:

- **First Export:** Create Navidrome playlist named "Liked Songs" with metadata in comment
- **Subsequent Exports:** Compare saved tracks count with stored `trackCount`
- **Out of Sync:** Show status when count differs from stored value
- **Fallback:** If no matching playlist found, treat as not exported

### Data Model Updates

#### PlaylistTableItem (Updated)

```typescript
interface PlaylistTableItem {
  id: string;
  name: string;
  images: { url: string }[];
  owner: { display_name: string };
  tracks: { total: number };
  snapshot_id: string;
  isLikedSongs: boolean;
  selected: boolean;
  exportStatus: 'none' | 'exported' | 'out-of-sync';
  navidromePlaylistId?: string;
  lastExportedAt?: string;
}
```

#### ExportMetadata

```typescript
interface ExportMetadata {
  spotifyPlaylistId: string;
  navidromePlaylistId?: string;
  spotifySnapshotId: string;
  exportedAt: string;
  trackCount: number;
}
```

### Navidrome Client Updates

| Task | File | Description |
|------|------|-------------|
| Add `getPlaylistByComment` method | `lib/navidrome/client.ts` | Find playlists with matching Spotify ID |
| Add `updatePlaylistComment` method | `lib/navidrome/client.ts` | Update comment with new metadata |
| Add `findOrCreateLikedSongsPlaylist` method | `lib/navidrome/client.ts` | Special handling for Liked Songs |

### UI Updates for Sync

**Status Badge with Sync Indicator:**
```tsx
{exportStatus === 'out-of-sync' && (
  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
    Out of Sync
  </span>
)}
```

### Testing Requirements (Updated)

- [ ] Export creates Navidrome playlist with metadata in comment
- [ ] Dashboard loads and matches Navidrome playlists with Spotify playlists
- [ ] Export status shows correctly (none/exported/out-of-sync)
- [ ] Out of sync badge appears when snapshot IDs differ
- [ ] Re-export updates existing Navidrome playlist
- [ ] Liked Songs tracking works correctly
- [ ] Cross-device sync status loads correctly

### Phase 1: Core Table Structure

| Task | File | Description |
|------|------|-------------|
| Create `PlaylistTable` component | `components/Dashboard/PlaylistTable.tsx` | Main table with sticky header, Loved Songs row |
| Create `TableHeader` component | `components/Dashboard/TableHeader.tsx` | Sortable column headers |
| Create `TableRow` component | `components/Dashboard/TableRow.tsx` | Individual playlist row |
| Create `LovedSongsRow` component | `components/Dashboard/LovedSongsRow.tsx` | Fixed second row for Liked Songs |
| Update `Dashboard` component | `components/Dashboard/Dashboard.tsx` | Integrate table view |

### Phase 2: Sorting, Filtering, Search

| Task | File | Description |
|------|------|-------------|
| Implement sort logic | `PlaylistTable.tsx` | State for sort column/direction |
| Implement filter UI | `PlaylistTable.tsx` | Filter dropdowns and chips |
| Implement search | `PlaylistTable.tsx` | Debounced search input |
| Create hook for table state | `hooks/usePlaylistTable.ts` | Reusable table logic |

### Phase 3: Selection and Export Flow

| Task | File | Description |
|------|------|-------------|
| Implement selection | `Dashboard.tsx` | Multi-select with "Select All" (filtered playlists only) |
| Update export flow | `Dashboard.tsx` | Connect selection to export, trigger progress panel |
| Preserve selection state | `Dashboard.tsx` | Session persistence |
| Implement export tracking | `lib/navidrome/client.ts` | Add methods to read/update comment metadata |
| Implement sync detection | `Dashboard.tsx` | Match Navidrome playlists with Spotify playlists |
| Create Export Progress Panel | `components/Dashboard/ExportProgressPanel.tsx` | Top section showing export progress |
| Update table row | `components/Dashboard/TableRow.tsx` | Add progress bar and highlighting for export |
| Update status column | `components/Dashboard/PlaylistTable.tsx` | Transform status to progress during export |

### Phase 4: Visual Polish

| Task | File | Description |
|------|------|-------------|
| Apply login page style | Global CSS | Consistent design language |
| Sticky header | `PlaylistTable.tsx` | CSS position: sticky |
| Loading states | `PlaylistTable.tsx` | Skeleton loaders |
| Empty states | `PlaylistTable.tsx` | No results found |
| Status badges | `TableRow.tsx` | Export status with out-of-sync indicator |

---

## File Changes Summary

### New Files to Create

| File | Purpose |
|------|---------|
| `components/Dashboard/PlaylistTable.tsx` | Main table component |
| `components/Dashboard/TableHeader.tsx` | Sortable header cells |
| `components/Dashboard/TableRow.tsx` | Playlist row component with export progress |
| `components/Dashboard/LovedSongsRow.tsx` | Fixed second row for Liked Songs |
| `components/Dashboard/TableFilters.tsx` | Filter controls |
| `components/Dashboard/TableSearch.tsx` | Search input component |
| `components/Dashboard/ExportProgressPanel.tsx` | Progress panel for during export |
| `hooks/usePlaylistTable.ts` | Custom hook for table state |
| `hooks/useExportProgress.ts` | Custom hook for export progress tracking |
| `types/playlist-table.ts` | Table-specific types |
| `types/export.ts` | Export metadata types |

### Files to Modify

| File | Changes |
|------|---------|
| `components/Dashboard/Dashboard.tsx` | Replace grid with table, update export flow |
| `components/Dashboard/PlaylistCard.tsx` | May be deprecated or refactored |
| `app/globals.css` | Add table-specific styles if needed |

### Files to Remove (Optional)

| File | Reason |
|------|--------|
| `components/Dashboard/PlaylistCard.tsx` | Replaced by table rows |

---

## Data Model

### PlaylistTableItem

```typescript
interface PlaylistTableItem {
  id: string;
  name: string;
  images: { url: string }[];
  owner: { display_name: string };
  tracks: { total: number };
  snapshot_id: string;
  isLikedSongs: boolean;
  selected: boolean;
  exportStatus: 'none' | 'exported' | 'out-of-sync';
  navidromePlaylistId?: string;
  lastExportedAt?: string;
}
```

**Note:** The `Liked Songs` playlist is positioned as the first row in the playlist list (after the header row), displayed before other user playlists.

### ExportMetadata

```typescript
interface ExportMetadata {
  spotifyPlaylistId: string;
  navidromePlaylistId?: string;
  spotifySnapshotId: string;
  exportedAt: string;
  trackCount: number;
}
```

### TableState

```typescript
interface TableState {
  sortColumn: 'name' | 'tracks' | 'owner';
  sortDirection: 'asc' | 'desc';
  searchQuery: string;
  filters: {
    status: 'all' | 'selected' | 'not-selected' | 'exported' | 'not-exported';
    source: 'all' | 'liked-songs' | 'playlists';
  };
  selectedIds: Set<string>;
}
```

---

## Design Reference: Login Page Theme

### Key Style Elements

**From login page (`app/page.tsx`):**

```tsx
// Page background
<div className="min-h-screen bg-zinc-50 dark:bg-black">

// Card container
<div className="rounded-lg border border-zinc-200 bg-white shadow-sm 
         dark:border-zinc-800 dark:bg-zinc-900">

// Heading
<h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">

// Body text
<p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">

// Section border
<div className="border-b border-zinc-200 dark:border-zinc-800">

// Loading spinner
<div className="h-8 w-8 animate-spin rounded-full border-4 border-green-500 border-t-transparent" />
```

### Table-Specific Adaptations

The table inherits the login page visual language but adapts for data display:

```tsx
// Table wrapper (full width, not constrained like login card)
<div className="w-full max-w-6xl mx-auto">

// Sticky header with backdrop blur
<thead className="sticky top-0 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm z-10">

// Zebra striping - odd rows darker for visual separation
<tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
  <tr className="bg-white dark:bg-zinc-900">   {/* Even row */}
  <tr className="bg-zinc-50 dark:bg-zinc-800/50"> {/* Odd row */}

// Row hover
<tr className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">

// Selected row highlight
<tr className="bg-zinc-100 dark:bg-zinc-800 border-l-4 border-l-green-500">
```

---

## Export Status Badge Styles

### Status Colors (Consistent with Login Page Theme)

| Status | Badge Style |
|--------|-------------|
| None | `bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400` |
| Exported | `bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400` |
| Out of Sync | `bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400` |

---

## Testing Requirements

### Manual Testing Checklist

- [ ] Table renders with all playlists loaded at once
- [ ] Sticky header works on scroll
- [ ] Loved Songs row appears as second row (after header)
- [ ] Zebra striping visible between rows (odd rows darker)
- [ ] Sorting changes order and shows direction indicator
- [ ] Search filters results in real-time (debounced)
- [ ] Individual row selection works
- [ ] "Select All" selects only filtered/visible playlists
- [ ] Export button is disabled when no selection
- [ ] Status column is visible but not filterable
- [ ] Export creates Navidrome playlist with metadata in comment
- [ ] Dashboard loads and matches Navidrome playlists with Spotify playlists
- [ ] Export status shows correctly (none/exported/out-of-sync)
- [ ] Out of sync badge appears when snapshot IDs differ
- [ ] Re-export updates existing Navidrome playlist
- [ ] Liked Songs tracking works correctly
- [ ] Progress Panel appears above table on export
- [ ] Vertical split layout (40% progress, 60% table) works
- [ ] Status column transforms to progress bar during export
- [ ] Currently exporting row is highlighted
- [ ] Progress bar updates in real-time
- [ ] Statistics cards show correct counts
- [ ] Current track info displays during matching
- [ ] Cancel export button works and returns to table
- [ ] Results view shows after export completes
- [ ] Back to Dashboard returns to table
- [ ] Dark mode renders correctly (login page style)
- [ ] Empty state shows when no playlists
- [ ] Loading spinner displays during data fetch

### Automated Tests (TBD)

- Unit tests for sorting/filtering logic
- Integration tests for selection state
- E2E tests for export workflow

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Table render time | < 100ms |
| Search debounce | 300ms |
| Sort response | < 50ms |
| Selection toggle | Instant |
| Export flow completion | 100% success rate |

---

## Timeline

| Phase | Duration | Deliverables |
|-------|----------|--------------|
| Phase 1: Core Structure | 1 day | Table component with all playlists |
| Phase 2: Sort/Filter/Search | 2 days | Full table functionality |
| Phase 3: Selection & Export | 1 day | Complete export flow |
| Phase 4: Polish & Testing | 1 day | Visual polish, testing |

**Total Estimated Time:** 5 days (reduced from 6 due to no pagination)

---

## Related Documentation

- Previous implementation: `docs/feature-F3-2-dashboard.md`
- Login page reference: `docs/feature-F3-1-login-page.md`
- TO-DO item: `docs/to-do.md` ("Update dashboard UI to a table")
- TrackList reference: `app/components/TrackList.tsx`
