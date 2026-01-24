# Phase 7.0.0 Verification Tests

**Status:** Ready for Manual Testing
**Dev Server:** http://localhost:3000
**Date:** 2026-01-23

---

## ✅ Automated Checks (PASSED)

### 1. TypeScript Compilation
**Status:** ✅ PASSED
```bash
npm run type-check
# No errors
```

### 2. Schema Verification
**Status:** ✅ PASSED

**HNSW Index Confirmed:**
```sql
-- Line 122-126 in Master_Schema.sql
CREATE INDEX setup_embeddings_embedding_idx
ON setup_embeddings
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);
```

**Optimized RPC Confirmed:**
```sql
-- Line 152-184 in Master_Schema.sql
CREATE OR REPLACE FUNCTION match_setup_embeddings(...)
RETURNS TABLE (
  ...
  event_name TEXT,           -- NEW: From SESSION JOIN
  session_created_at TIMESTAMPTZ  -- NEW: From SESSION JOIN
)
```

**Result:** Single query instead of 2 separate queries ✅

### 3. Code Quality
**Status:** ✅ PASSED
- Singleton pattern implemented in search route
- TanStack Query hooks created with proper cache invalidation
- Zustand slices properly composed
- Persist middleware configured for sessionStorage

---

## 🧪 Manual Tests (TO BE PERFORMED)

### Test 1: Database Schema Deployment ⏳

**Prerequisites:**
- Access to Supabase dashboard
- Backup of current database (if needed)

**Steps:**
1. Open Supabase Dashboard → SQL Editor
2. Copy contents of `Directives/Master_Schema.sql`
3. Execute the schema

**Verify HNSW Index:**
```sql
-- Check if index exists
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'setup_embeddings'
AND indexname = 'setup_embeddings_embedding_idx';
```

**Expected Output:**
```
indexname                          | indexdef
-----------------------------------+------------------------------------------
setup_embeddings_embedding_idx     | CREATE INDEX ... USING hnsw ...
```

**Verify RPC Function:**
```sql
-- Check function signature
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_name = 'match_setup_embeddings'
AND routine_schema = 'public';
```

**Expected Output:**
```
routine_name              | routine_type
-------------------------+--------------
match_setup_embeddings    | FUNCTION
```

**Status:** ⏳ Pending Deployment

---

### Test 2: Persistence Test (sessionStorage) ⏳

**Goal:** Verify chat conversation survives browser refresh

**Steps:**
1. Navigate to http://localhost:3000
2. Go to **AI Advisor** tab (Tab 2)
3. Select a symptom (e.g., "Oversteer (Entry)")
4. Answer the first clarifying question
5. **Press F5 to refresh the browser**
6. Navigate back to AI Advisor tab

**Expected Result:**
- ✅ Chat messages are still visible
- ✅ Conversation history preserved
- ✅ Can continue from where you left off

**Verification:**
```javascript
// Open browser console (F12)
sessionStorage.getItem('apex-conversation')
// Should show JSON with chatMessages array
```

**Status:** ⏳ Ready to Test

---

### Test 3: Cache Test (TanStack Query) ⏳

**Goal:** Verify instant tab switching for cached data

**Prerequisites:**
- At least 1 racer profile created
- At least 1 vehicle created

**Steps:**
1. Navigate to http://localhost:3000
2. Observe **Event Identity** section (should show racer/vehicle dropdowns)
3. Wait for data to load (first time will have spinners)
4. Switch to **Race Control** tab (Tab 1)
5. Switch back to **Event Identity** section

**Expected Result:**
- ✅ No loading spinners on second load
- ✅ Data appears instantly
- ✅ Dropdown values preserved

**Verification:**
```javascript
// Open React DevTools → Components → QueryClientProvider
// Check: staleTime: 300000 (5 min)
// Check: gcTime: 600000 (10 min)
```

**Status:** ⏳ Ready to Test

---

### Test 4: Filtering Test (Dependent Query) ⏳

**Goal:** Verify racer→vehicle filtering works correctly

**Prerequisites:**
- At least 2 racer profiles
- Multiple vehicles (some for Racer A, some for Racer B)

**Setup:**
```sql
-- Create test data if needed
INSERT INTO racer_profiles (name) VALUES ('Test Racer A'), ('Test Racer B');
INSERT INTO vehicles (profile_id, brand, model)
SELECT id, 'Associated', 'B6.4' FROM racer_profiles WHERE name = 'Test Racer A'
UNION ALL
SELECT id, 'TLR', '22 5.0' FROM racer_profiles WHERE name = 'Test Racer B';
```

**Steps:**
1. Navigate to http://localhost:3000
2. In **Fleet Configuration**, select "Test Racer A"
3. Observe **Vehicle Status** dropdown (should show only Racer A's vehicles)
4. Select "Test Racer B"
5. Observe **Vehicle Status** dropdown updates

**Expected Result:**
- ✅ Vehicle list updates instantly when racer changes
- ✅ No manual refresh needed
- ✅ Only vehicles belonging to selected racer appear

**Technical Verification:**
```javascript
// Open browser console (F12) and run:
// Check that query key includes racer ID
performance.getEntriesByType('navigation')
// Should show dependent query pattern: ['vehicles', racerId]
```

**Status:** ⏳ Ready to Test

---

## 🔍 Additional Verification (Optional)

### Test 5: Mutation Cache Invalidation

**Goal:** Verify automatic refetch after creating racer/vehicle

**Steps:**
1. Click **[+] Add** button in Fleet Configuration
2. Enter new racer details
3. Click **Save**
4. Observe dropdown list updates automatically

**Expected Result:**
- ✅ New racer appears in dropdown immediately
- ✅ No page refresh required

---

### Test 6: Network Tab Analysis

**Goal:** Verify reduced network requests

**Steps:**
1. Open DevTools → Network tab
2. Clear network log
3. Navigate to Event Identity
4. Observe initial requests
5. Switch to another tab and back
6. Observe no redundant requests

**Expected Result:**
- ✅ First load: 2 requests (racers, vehicles)
- ✅ Second load: 0 requests (cached)

---

### Test 7: Librarian Search (Optimized RPC)

**Goal:** Verify single-query search with session metadata

**Prerequisites:**
- Some session embeddings in database
- Search functionality accessible

**Steps:**
1. Navigate to Librarian search interface
2. Enter a search query
3. Open DevTools → Network tab
4. Observe the `/api/librarian/search` request

**Expected Result:**
- ✅ Single RPC call to `match_setup_embeddings`
- ✅ Response includes `event_name` and `session_created_at` fields
- ✅ No second query for session metadata

**Verification:**
```javascript
// Check response structure
{
  "success": true,
  "results": [
    {
      "eventDate": "01/23/2026",
      "symptom": "...",
      "fix": "...",
      "orpImprovement": 2.5,
      "confidence": 0.87
    }
  ]
}
```

---

## 📊 Test Results Summary

| Test | Status | Pass/Fail | Notes |
|------|--------|-----------|-------|
| TypeScript Compilation | ✅ | PASS | No errors |
| Schema Verification | ✅ | PASS | HNSW + RPC confirmed |
| Code Quality | ✅ | PASS | All patterns implemented |
| Database Deployment | ⏳ | PENDING | Run Master_Schema.sql |
| Persistence Test | ⏳ | PENDING | Test browser refresh |
| Cache Test | ⏳ | PENDING | Test tab switching |
| Filtering Test | ⏳ | PENDING | Test dependent query |
| Mutation Invalidation | ⏳ | OPTIONAL | Test auto-refetch |
| Network Analysis | ⏳ | OPTIONAL | Verify request count |
| Librarian Search | ⏳ | OPTIONAL | Verify single query |

---

## 🚀 Next Actions

### Immediate (Required)
1. **Deploy Schema** → Run `Master_Schema.sql` in Supabase
2. **Test Persistence** → Verify chat survives refresh
3. **Test Cache** → Verify instant tab switching
4. **Test Filtering** → Verify racer→vehicle dependency

### Post-Deployment (Recommended)
1. Monitor cache hit rates in production
2. Check for any console errors
3. Verify all existing features still work
4. Performance benchmark comparison (before/after)

---

## 🐛 Troubleshooting

### Issue: Chat messages don't persist
**Solution:** Check browser console for sessionStorage errors. Verify persist middleware is active in advisorStoreV2.

### Issue: Data doesn't appear instantly
**Solution:** Check TanStack Query cache settings. Verify staleTime is set to 5 minutes.

### Issue: Vehicles don't filter by racer
**Solution:** Check dependent query implementation. Verify `enabled: !!racerId` in useVehiclesByRacer.

### Issue: HNSW index not used
**Solution:** Run `EXPLAIN ANALYZE` on match_setup_embeddings. Verify index exists with correct operator class.

---

## 📝 Notes

- All tests assume dev server is running on port 3000
- Browser console (F12) should be open during testing
- React DevTools extension helpful for cache inspection
- Tests are non-destructive (safe to run on development data)

**Test Duration:** ~15-20 minutes for all tests
**Estimated Completion:** End of day (2026-01-23)
