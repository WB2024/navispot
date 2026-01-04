# Feature F3.6: Progress Tracker

## Overview

Display real-time progress during playlist export operations, showing current track being processed, success/fail counters, and allowing users to cancel ongoing exports.

## User Stories

- As a user, I want to see a progress bar while my playlist is being exported so I know how much longer I need to wait.
- As a user, I want to see which track is currently being processed so I can understand what's happening.
- As a user, I want to see success/failure counts update in real-time so I can track export quality.
- As a user, I want to cancel an ongoing export if it takes too long or I change my mind.

## Requirements

### Functional Requirements

1. **Real-time Progress Bar**
   - Display a visual progress bar that fills as tracks are processed
   - Update progress percentage in real-time
   - Show progress during both matching and export phases

2. **Current Track Display**
   - Show the name of the track currently being processed
   - Display artist name alongside track name
   - Indicate current phase (matching vs. exporting)

3. **Success/Fail Counters**
   - Display count of successfully matched tracks
   - Display count of failed/unmatched tracks
   - Update counters in real-time as processing completes
   - Show overall statistics summary

4. **Cancel Export Button**
   - Provide a button to cancel ongoing export
   - Gracefully stop processing new tracks
   - Show confirmation dialog before cancellation
   - Display partial results after cancellation

### Non-Functional Requirements

- Progress updates should feel smooth (no visible jitter)
- Component should be responsive for mobile devices
- Cancel operation should complete within 2 seconds
- Progress state should survive page refresh (optional)

## Technical Design

### Interface

```typescript
interface ExportProgressState {
  phase: 'idle' | 'matching' | 'exporting' | 'completed' | 'cancelled';
  currentTrack?: {
    name: string;
    artist: string;
  };
  progress: {
    current: number;
    total: number;
    percent: number;
  };
  statistics: {
    matched: number;
    unmatched: number;
    exported: number;
    failed: number;
  };
}

interface ProgressTrackerProps {
  state: ExportProgressState;
  onCancel?: () => void;
  onComplete?: (result: ExportResult) => void;
}
```

### Component Structure

```
ProgressTracker/
├── ProgressTracker.tsx      # Main component
├── ProgressBar.tsx          # Visual progress bar
├── TrackIndicator.tsx       # Current track display
├── StatisticsDisplay.tsx    # Success/fail counters
└── CancelButton.tsx         # Cancel control
```

### State Management

The ProgressTracker will use React state to track:
- Current phase
- Progress percentage
- Current track information
- Statistics counters

For the export flow, progress updates will come from:
- `BatchMatcher.matchTracks()` via `onProgress` callback
- `PlaylistExporter.exportPlaylist()` via `onProgress` callback

### Integration Points

1. **Dashboard Component**
   - Shows ProgressTracker when export is initiated
   - Passes cancel callback to ProgressTracker
   - Receives completion event to show results

2. **Batch Matcher**
   - Provides progress updates via callback
   - Current track, progress percentage

3. **Playlist Exporter**
   - Provides progress updates during export phase
   - Updates success/fail statistics

## UI Design

### Layout

```
+--------------------------------------------------+
|  Exporting Playlist                              |
+--------------------------------------------------+
|  [=======================....] 67%               |
+--------------------------------------------------+
|  Phase: Matching tracks                           |
|  Processing: "Bohemian Rhapsody" by Queen         |
+--------------------------------------------------+
|  Matched: 42  |  Unmatched: 8  |  Exported: 35   |
+--------------------------------------------------+
|                        [ Cancel Export ]          |
+--------------------------------------------------+
```

### Progress Bar Styling

- Green fill for successful matches
- Yellow for unmatched (ambiguous)
- Red for failed exports
- Smooth animation (CSS transitions)

### Statistics Display

- Use icons for quick visual recognition
- Show counts with labels
- Update with subtle animation

### Cancel Button

- Red/danger styling
- Confirmation dialog on click
- Disabled after completion

## Implementation Plan

### Step 1: Create Types and Interfaces
Define the progress state interface and component props.

### Step 2: Build ProgressTracker Component
Create the main component with sub-components:
- ProgressBar
- TrackIndicator
- StatisticsDisplay
- CancelButton

### Step 3: Integrate with Batch Matcher
Update Dashboard to use ProgressTracker during matching phase.

### Step 4: Integrate with Playlist Exporter
Update export flow to provide progress updates.

### Step 5: Add Cancel Functionality
Implement AbortController-based cancellation.

### Step 6: Styling and Polish
Apply Tailwind CSS for consistent styling.

## Dependencies

- F2.7 (Batch Matcher) - Provides progress during matching
- F2.8 (Playlist Exporter) - Provides progress during export
- React 19 - Component framework

## Testing Strategy

### Unit Tests
- Test progress state transitions
- Test statistics updates
- Test cancel functionality

### Integration Tests
- Test progress updates from batch matcher
- Test progress updates from playlist exporter
- Test end-to-end export flow with progress

### Manual Testing
- Verify smooth progress bar animation
- Test cancel at various stages
- Verify statistics accuracy
- Test responsive layout

## Acceptance Criteria

1. Progress bar displays during entire export process
2. Current track name is visible during processing
3. Success/fail counters update in real-time
4. Cancel button stops the export within 2 seconds
5. Partial results are shown after cancellation
6. Progress tracker is responsive on mobile devices
7. Progress bar reaches 100% on successful completion
