# Feature F3-1: Navidrome Credentials Form

## Overview

Implemented a `NavidromeCredentialsForm` component that allows users to configure and manage their Navidrome server connection.

## Location

`app/components/navidrome-credentials-form.tsx`

## Features

### Form Fields
- **Server URL**: Text input with URL validation
- **Username**: Text input for Navidrome credentials
- **Password**: Password input with show/hide toggle visibility

### Validation
- URL format validation using the URL constructor
- Required field validation for all fields
- Error messages displayed below each field

### Connection Management
- **Connect Button**: Tests and saves credentials to the auth context
- **Disconnect Button**: Clears stored credentials and resets the form
- Loading state during connection testing with spinner
- Pre-fills form with stored credentials on component mount

### Status Display
- Connection status indicator (connected/disconnected)
- Server version display when connected
- Error messages from auth context and local validation

### Styling
- Tailwind CSS with dark mode support
- Consistent with existing component patterns
- Focus states with green border for action buttons
- Disabled states during connection/loading

## Integration

The component uses the `useAuth` hook from `@/lib/auth/auth-context`:
- `navidrome.isConnected`: Displays connection status
- `navidrome.credentials`: Pre-fills form values
- `navidrome.serverVersion`: Shows server version when connected
- `navidrome.error`: Displays connection error messages
- `setNavidromeCredentials`: Tests and saves credentials
- `clearNavidromeCredentials`: Clears stored credentials
- `isLoading`: Handles initial auth loading state

## Bug Fixes

### January 4, 2026 - Infinite Loop on Credentials Submission

Fixed an infinite loop that occurred when submitting Navidrome credentials:

**Problem:** When users entered Navidrome credentials and clicked connect, the application would get stuck in an infinite loop of re-renders and state updates.

**Root Cause:** Circular dependencies in React `useCallback` hooks in `lib/auth/auth-context.tsx`:
1. `testNavidromeConnection` depended on `navidrome.credentials`
2. `setNavidromeCredentials` depended on `testNavidromeConnection`
3. When credentials changed, both callbacks were recreated, triggering state updates that recreated the callbacks again

**Solution:**
- Refactored `testNavidromeConnection` to accept credentials as a parameter with empty dependency array `[]`
- Updated `setNavidromeCredentials` and `loadStoredAuth` to pass credentials directly
- Updated the `testNavidromeConnection` type signature in `AuthContextType`

**Files Modified:**
- `lib/auth/auth-context.tsx`: Refactored callback dependencies
- `types/auth-context.ts`: Updated function signature
