# Bug Analysis & Workflow Review

## Executive Summary

This document identifies bugs, potential issues, and workflow analysis for the Envitefy codebase. The analysis covers API routes, frontend state management, error handling, race conditions, and data consistency issues.

---

## 🔴 Critical Bugs

### 1. **Event Share API - Missing Error Handling**

**Location**: `src/app/api/events/share/route.ts`

**Issue**: The share counter increment happens even if the database share creation fails silently.

```typescript:45:48:src/app/api/events/share/route.ts
    } catch (err: any) {
      // If event_shares table is not present yet, bypass DB share and still email the recipient
      try { console.warn("[share] falling back to email only:", err?.message || err); } catch {}
    }
```

**Problem**: Line 42 increments `shares_sent` even if `createOrUpdateEventShare` throws. The counter increments outside the try-catch, so if the DB operation fails, the counter still increments but no share is created.

**Fix**: Move the increment inside the try block or check if `share` was successfully created:

```typescript
try {
  share = await createOrUpdateEventShare({...});
  await incrementUserSharesSent({ userId: ownerUserId, delta: 1 });
  invalidateUserHistory(ownerUserId);
} catch (err: any) {
  // Handle error - don't increment counter if share failed
}
```

---

### 2. **Subscription Page - Race Condition in Cleanup**

**Location**: `src/app/subscription/page.tsx:264-266`

**Issue**: The cleanup function can run even after the component unmounts, causing potential memory leaks or state updates on unmounted components.

```typescript:264:266:src/app/subscription/page.tsx
    run().finally(() => {
      cleanup();
    });
```

**Problem**: The `cleanup` function uses `router.replace` which could execute after unmount. The `cancelled` flag helps but doesn't prevent all race conditions.

**Fix**: Add a ref check before navigation:

```typescript
const isMountedRef = useRef(true);
useEffect(() => {
  return () => {
    isMountedRef.current = false;
  };
}, []);

const cleanup = () => {
  if (cancelled || !isMountedRef.current || typeof window === "undefined")
    return;
  // ... rest of cleanup
};
```

---

### 3. **Google Calendar Route - Missing Token Refresh Error Handling**

**Location**: `src/app/api/events/google/route.ts:41-44`

**Issue**: When both `refreshToken` and `accessToken` are missing, the code returns an error but doesn't distinguish between "not connected" vs "token expired".

**Problem**: The error message "Google not connected" is misleading if the token simply expired. The client can't distinguish between needing to reconnect vs refresh.

**Fix**: Add more specific error handling for token expiration:

```typescript
if (!refreshToken && !accessToken) {
  // Check if token exists but expired
  if (tokenData && expiresAt && expiresAt < Date.now()) {
    return NextResponse.json(
      { error: "Token expired, please reconnect" },
      { status: 401 }
    );
  }
  const reason = tokenData ? "Google not connected" : "Unauthorized";
  const status = tokenData ? 400 : 401;
  return NextResponse.json({ error: reason }, { status });
}
```

---

### 4. **History Signup - Potential Race Condition**

**Location**: `src/app/api/history/[id]/signup/route.ts:370-373`

**Issue**: The signup form is updated in both the legacy JSON (`updateEventHistoryData`) and normalized table (`upsertSignupForm`) without transaction guarantees.

```typescript:370:373:src/app/api/history/[id]/signup/route.ts
      const updatedRow = await updateEventHistoryData(id, mergedData);
      try {
        await upsertSignupForm(id, normalizedNext);
      } catch {}
```

**Problem**: If `upsertSignupForm` fails silently, the data becomes inconsistent. Multiple concurrent signups could cause race conditions.

**Fix**: Use database transactions or proper error propagation:

```typescript
try {
  await upsertSignupForm(id, normalizedNext);
} catch (err) {
  console.error("[signup] Failed to sync to normalized table:", err);
  // Consider rolling back or at least logging the inconsistency
}
```

---

## 🟡 Medium Priority Issues

### 5. **OCR Route - Silent Failures**

**Location**: `src/app/api/ocr/route.ts`

**Issue**: Multiple `catch` blocks swallow errors without proper logging or user feedback.

**Recommendation**: Add structured logging with error context to help debug OCR failures in production.

---

### 6. **Subscription Page - Loading State Not Reset on Error**

**Location**: `src/app/subscription/page.tsx:645-650`

**Issue**: When checkout fails, `setLoading(false)` is called, but if `window.location.href` assignment fails, the loading state might not reset.

**Fix**: Ensure loading state is always reset:

```typescript
} catch (err: any) {
  setLoading(false); // Move this before the error handling
  setBanner({
    type: "error",
    message: err?.message || "Failed to start checkout",
  });
}
```

---

### 7. **Page Component - Duplicate History Save Logic**

**Location**: `src/app/page.tsx:599-671` and `712-789`

**Issue**: The `addGoogle` and `addOutlook` functions contain nearly identical code for saving history. This violates DRY and increases maintenance burden.

**Recommendation**: Extract the history saving logic into a shared function:

```typescript
const saveEventToHistory = useCallback(
  async (event: EventFields, ready: any) => {
    // ... shared logic
  },
  [uploadedFile, ocrCategory]
);
```

---

### 8. **Stripe Webhook - Idempotency Check Timing**

**Location**: `src/app/api/stripe/webhook/route.ts:320-327`

**Issue**: The webhook event is recorded before processing, which is good, but if processing fails after recording, the event won't be retried.

**Recommendation**: Consider recording the event after successful processing, or implement a retry mechanism for failed events.

---

## 🟢 Low Priority / Code Quality Issues

### 9. **Type Safety - Excessive `any` Types**

**Location**: Multiple files

**Issue**: Many API routes use `any` types for session, request bodies, and error handling.

**Examples**:

- `src/app/api/events/share/route.ts:13` - `session: any`
- `src/app/api/history/route.ts:122` - `sessionUser: any`
- `src/app/api/stripe/webhook/route.ts:313` - `payload: any`

**Recommendation**: Create proper TypeScript interfaces for common types.

---

### 10. **Error Messages - Inconsistent Format**

**Location**: Throughout API routes

**Issue**: Some errors return `{ error: string }`, others return `{ ok: false, error: string }`.

**Recommendation**: Standardize error response format across all API routes.

---

### 11. **Empty Catch Blocks**

**Location**: Multiple files

**Issue**: Many catch blocks are empty or only log errors without proper handling:

```typescript
} catch {}
// or
} catch (err) {
  try { console.error(...) } catch {}
}
```

**Recommendation**: At minimum, add error tracking/monitoring (e.g., Sentry) for production errors.

---

## 📋 Workflow Analysis

### Main User Workflow

1. **OCR/Scan Flow** (`/snap` or home page):

   - User uploads image/PDF
   - `onFile` → `ingest` → POST `/api/ocr`
   - Response populates `event` state
   - User edits in modal (`SnapEventModal`)
   - User saves to calendar or history

2. **Calendar Integration**:

   - Google: OAuth → JWT token → POST `/api/events/google`
   - Outlook: OAuth → DB token → POST `/api/events/outlook`
   - Apple: ICS download

3. **Event History**:

   - POST `/api/history` creates event
   - GET `/api/history` lists user events
   - Shared events included via `event_shares` table

4. **Subscription Flow**:
   - Stripe Checkout → Webhook → User sync
   - `/subscription` page manages plans

### Workflow Issues Identified

1. **State Management**:

   - Multiple state variables in `page.tsx` for similar purposes
   - Modal state (`modalOpen`) and event state (`event`) can get out of sync
   - No clear state machine for event creation flow

2. **Error Recovery**:

   - If OCR fails, user sees error but can't retry easily
   - Calendar connection errors don't always prompt re-authentication
   - No retry mechanism for failed API calls

3. **Concurrency**:

   - Multiple calendar buttons can be clicked simultaneously
   - No debouncing on location autocomplete
   - History saves can happen multiple times (guarded by `hasSavedRef` but race conditions possible)

4. **Data Consistency**:
   - Signup forms stored in both `event_history.data.signupForm` and `signup_forms` table
   - Sync failures can cause inconsistencies
   - No transaction support for dual writes

---

## 🔧 Recommended Fixes Priority

### High Priority (Fix Immediately)

1. Event share counter increment bug (#1)
2. Subscription cleanup race condition (#2)
3. History signup transaction safety (#4)

### Medium Priority (Fix Soon)

4. Google Calendar token refresh handling (#3)
5. Loading state management (#6)
6. Extract duplicate history save logic (#7)

### Low Priority (Technical Debt)

7. Type safety improvements (#9)
8. Error response standardization (#10)
9. Empty catch block handling (#11)

---

## 🧪 Testing Recommendations

1. **Concurrency Tests**:

   - Multiple simultaneous calendar button clicks
   - Concurrent signup form submissions
   - Parallel event share requests

2. **Error Scenarios**:

   - OCR API failures
   - Calendar OAuth token expiration
   - Stripe webhook retries

3. **Edge Cases**:
   - Very large image uploads
   - Invalid timezone strings
   - Missing required fields

---

## 📝 Notes

- The codebase generally has good error handling patterns, but some edge cases are missed
- The workflow is well-documented in `snap-workflow.md` and `AGENTS.md`
- Most issues are related to error handling edge cases rather than fundamental design flaws
- Consider adding integration tests for critical workflows (OCR → Calendar → History)
