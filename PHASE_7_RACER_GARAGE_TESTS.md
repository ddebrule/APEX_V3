# Phase 7.0.0 Racer Garage Optimization Tests

**Status:** Ready for Manual Testing
**Dev Server:** http://localhost:3000
**Date:** 2026-01-23

---

## Overview

The Racer Garage tab has been extended with TanStack Query optimization to match the EventIdentity implementation. This test suite verifies the caching behavior and user experience improvements.

---

## ✅ Automated Checks (PASSED)

### 1. TypeScript Compilation
**Status:** ✅ PASSED
```bash
npm run type-check
# No errors - All TanStack Query hooks properly typed
```

### 2. Code Quality
**Status:** ✅ PASSED
- All manual useEffect fetches removed
- TanStack Query hooks implemented for all data operations
- Mutations properly configured with cache invalidation
- Component reduced from ~1049 lines with manual state management

---

## 🧪 Manual Tests (TO BE PERFORMED)

### Test 1: Cache Test - Instant Tab Switching ⏳

**Goal:** Verify Racer Garage data loads instantly from cache on second visit

**Prerequisites:**
- At least 1 racer profile with vehicles and handling signals
- Dev server running

**Steps:**
1. Navigate to http://localhost:3000
2. Go to **Event Identity** tab → Select a racer (this warms the cache)
3. Go to **Racer Garage** tab (Tab 3) → Observe initial load
4. Go to **Race Control** tab (Tab 1)
5. Return to **Racer Garage** tab
6. **Open DevTools → Network tab before step 5 to monitor requests**

**Expected Result:**
- ✅ First visit: Shows racer data from cache (already loaded in EventIdentity)
- ✅ Second visit: **Zero API calls** - instant display
- ✅ No loading spinners on subsequent visits
- ✅ Racer identity sidebar shows immediately

**Verification:**
```javascript
// Open browser console (F12) → Network tab
// Filter by: Fetch/XHR
// Expected: 0 new requests when switching back to Racer Garage
```

**Status:** ⏳ Ready to Test

---

### Test 2: Dependent Query Test - Vehicle/Class/Signal Filtering ⏳

**Goal:** Verify vehicles, classes, and handling signals automatically refetch when racer changes

**Prerequisites:**
- At least 2 racer profiles
- Racer A: 2 vehicles, 1 class, 2 handling signals
- Racer B: 1 vehicle, 1 class, 1 handling signal

**Steps:**
1. Navigate to http://localhost:3000 → Racer Garage tab
2. Select **Racer A** from dropdown
3. Observe: Vehicles grid, handling signals in signal manager
4. Select **Racer B** from dropdown
5. Observe: Content updates instantly

**Expected Result:**
- ✅ Vehicles grid updates to show only Racer B's vehicles
- ✅ No manual refresh needed
- ✅ Previous racer's data replaced instantly
- ✅ Signal Manager shows Racer B's signals only

**Technical Verification:**
```javascript
// TanStack Query implements dependent queries:
// useVehiclesByRacer(selectedRacer?.id)
// useClassesByRacer(selectedRacer?.id)
// useHandlingSignals(selectedRacer?.id)
// All queries use enabled: !!racerId
```

**Status:** ⏳ Ready to Test

---

### Test 3: Mutation Cache Invalidation - Create Racer ⏳

**Goal:** Verify new racer appears instantly in all locations after creation

**Steps:**
1. Go to Racer Garage → Click racer dropdown
2. Click **[+ Create New Identity]**
3. Enter name: "Test Racer Cache"
4. Press ENTER or click SAVE
5. Observe dropdown updates
6. Navigate to Event Identity tab
7. Open racer dropdown

**Expected Result:**
- ✅ "Test Racer Cache" appears in Racer Garage dropdown immediately
- ✅ "Test Racer Cache" also appears in Event Identity dropdown (shared cache)
- ✅ No page refresh required
- ✅ New racer auto-selected after creation

**Verification:**
```javascript
// Check TanStack Query DevTools (if installed):
// queryKey: ['racers'] should be invalidated and refetched
```

**Status:** ⏳ Ready to Test

---

### Test 4: Mutation Cache Invalidation - Create Vehicle ⏳

**Goal:** Verify new vehicle appears in grid instantly after creation

**Steps:**
1. Go to Racer Garage → Select a racer
2. Scroll to "Active Vehicle Assets" section
3. Click **[+] Add Vehicle** card
4. Fill in:
   - Brand: "XRAY"
   - Model: "XB4 '25"
   - Class: (optional)
   - Transponder: (optional)
5. Click SAVE
6. Observe vehicle grid

**Expected Result:**
- ✅ New vehicle card appears immediately in grid
- ✅ No loading spinner
- ✅ Vehicle data persists on tab switch
- ✅ New vehicle also visible in Event Identity vehicle dropdown

**Verification:**
```javascript
// Check TanStack Query cache:
// queryKey: ['vehicles', racerId] should be invalidated
// New vehicle should appear in vehicles array
```

**Status:** ⏳ Ready to Test

---

### Test 5: Mutation Cache Invalidation - Update Racer Identity ⏳

**Goal:** Verify racer name updates propagate instantly across all components

**Steps:**
1. Go to Racer Garage
2. Click **[EDIT PROFILE]** button in Racer Identity sidebar
3. Change name from "John Doe" to "John Doe Jr."
4. Click SAVE
5. Observe racer dropdown
6. Navigate to Event Identity tab
7. Check racer dropdown there

**Expected Result:**
- ✅ Racer name updates instantly in Racer Garage dropdown
- ✅ Racer name updates instantly in Event Identity dropdown
- ✅ No stale data visible
- ✅ Sidebar shows updated name immediately

**Technical Note:**
- updateRacerMutation.mutateAsync() triggers `queryClient.invalidateQueries(['racers'])`
- All components using `useRacers()` automatically refetch

**Status:** ⏳ Ready to Test

---

### Test 6: Mutation Cache Invalidation - Handling Signals ⏳

**Goal:** Verify handling signals update instantly without manual state management

**Steps:**
1. Go to Racer Garage → Click **"Handling Signals Map"** button
2. Modal opens with signal dictionary
3. Add new signal:
   - Label: "Front Traction Roll"
   - Description: "Car rolls to outside on entry"
4. Click ADD
5. Observe signal list
6. Delete the signal by clicking X
7. Observe signal list updates

**Expected Result:**
- ✅ New signal appears instantly in list
- ✅ Deleted signal removes instantly
- ✅ No manual state updates in code
- ✅ Close modal and reopen → changes persist

**Verification:**
```javascript
// Check mutation hooks:
// createHandlingSignalMutation invalidates ['handling-signals', racerId]
// deleteHandlingSignalMutation invalidates ['handling-signals', racerId]
```

**Status:** ⏳ Ready to Test

---

### Test 7: Network Tab Analysis - Before/After Comparison ⏳

**Goal:** Quantify reduction in redundant API calls

**Setup:**
1. Open DevTools → Network tab
2. Filter: Fetch/XHR
3. Clear log

**Test Sequence:**
1. Load Racer Garage tab
2. Record number of API calls
3. Switch to Race Control tab
4. Switch back to Racer Garage tab
5. Record number of API calls

**Expected Result - First Load:**
- ✅ 3 API calls (if racer not cached):
  - GET /rest/v1/racer_profiles (racers)
  - GET /rest/v1/vehicles?profile_id=... (vehicles)
  - GET /rest/v1/classes?profile_id=... (classes)
  - GET /rest/v1/handling_signals?profile_id=... (signals)

**Expected Result - Second Load (After Tab Switch):**
- ✅ **0 API calls** (all cached)

**Before Optimization (Manual useEffect):**
- First load: 4 requests
- Second load: 4 requests (refetched unnecessarily)
- **Total:** 8 requests

**After Optimization (TanStack Query):**
- First load: 4 requests
- Second load: 0 requests (cached)
- **Total:** 4 requests
- **Improvement:** 50% reduction

**Status:** ⏳ Ready to Test

---

## 📊 Test Results Summary

| Test | Status | Pass/Fail | Notes |
|------|--------|-----------|-------|
| TypeScript Compilation | ✅ | PASS | No errors |
| Code Quality | ✅ | PASS | All patterns implemented |
| Cache Test | ⏳ | PENDING | Test instant tab switching |
| Dependent Query Test | ⏳ | PENDING | Test racer filtering |
| Create Racer Mutation | ⏳ | PENDING | Test auto-refetch |
| Create Vehicle Mutation | ⏳ | PENDING | Test auto-refetch |
| Update Racer Mutation | ⏳ | PENDING | Test cross-component updates |
| Handling Signals Mutation | ⏳ | PENDING | Test add/delete signals |
| Network Analysis | ⏳ | PENDING | Verify 50% reduction |

---

## 🚀 Next Actions

### Immediate (Required)
1. **Test Cache Behavior** → Verify instant tab switching
2. **Test Mutations** → Verify auto-refetch after CRUD operations
3. **Test Network** → Confirm 50% API call reduction
4. **Cross-Tab Consistency** → Verify data syncs between Event Identity and Racer Garage

### Post-Testing (Recommended)
1. Monitor cache hit rates in production
2. Verify all existing Racer Garage features still work
3. Test with large datasets (100+ vehicles)
4. Performance benchmark comparison

---

## 🐛 Troubleshooting

### Issue: Data doesn't update after mutation
**Solution:** Check browser console for mutation errors. Verify cache invalidation keys match query keys.

### Issue: Stale data appears after tab switch
**Solution:** Check staleTime in QueryProvider (should be 5 minutes). Verify queries use same queryKey format.

### Issue: Vehicles don't filter by racer
**Solution:** Check dependent query implementation. Verify `enabled: !!racerId` in useVehiclesByRacer.

### Issue: Network tab shows repeated requests
**Solution:** Check refetchOnWindowFocus and refetchOnMount settings in QueryProvider (both should be false).

---

## 📝 Technical Details

### TanStack Query Hooks Created

**File:** `src/hooks/useRacerGarageData.ts`

**Queries:**
- `useRacers()` - Global racer cache
- `useVehiclesByRacer(racerId)` - Dependent query
- `useClassesByRacer(racerId)` - Dependent query
- `useHandlingSignals(racerId)` - Dependent query

**Mutations:**
- `useCreateRacer()` - Invalidates `['racers']`
- `useUpdateRacer()` - Invalidates `['racers']`
- `useDeleteRacer()` - Invalidates `['racers']`, `['vehicles']`, `['classes']`, `['handling-signals']`
- `useCreateVehicle()` - Invalidates `['vehicles', racerId]`
- `useUpdateVehicle()` - Invalidates `['vehicles']`
- `useCreateHandlingSignal()` - Invalidates `['handling-signals', racerId]`
- `useDeleteHandlingSignal()` - Invalidates `['handling-signals', racerId]`

### Component Changes

**File:** `src/components/tabs/RacerGarage.tsx`

**Removed:**
- Manual `useEffect` for getAllRacers (lines 62-72)
- Manual `useEffect` for vehicles/classes (lines 75-90)
- Manual `useEffect` for handling signals (lines 93-107)
- All `setState` calls after mutations

**Added:**
- TanStack Query hooks (lines 23-37)
- Mutation handlers using `.mutateAsync()` (all CRUD operations)

**Benefits:**
- ~100 lines of boilerplate removed
- Automatic cache invalidation
- Zero manual state synchronization
- Loading states built-in

---

## 🔍 Cache Strategy

**Query Keys:**
```typescript
['racers']                      // All racers (global)
['vehicles', racerId]            // Vehicles for specific racer
['classes', racerId]             // Classes for specific racer
['handling-signals', racerId]    // Signals for specific racer
```

**Cache Settings:**
- **staleTime:** 5 minutes (data treated as fresh)
- **gcTime:** 10 minutes (garbage collection)
- **refetchOnWindowFocus:** false
- **refetchOnMount:** false

**Invalidation Strategy:**
- Creating racer → Invalidate `['racers']`
- Creating vehicle → Invalidate `['vehicles', racerId]`
- Updating racer → Invalidate `['racers']` (updates all caches)
- Deleting racer → Invalidate all related caches

---

**Test Duration:** ~20-30 minutes for all tests
**Estimated Completion:** End of day (2026-01-23)
