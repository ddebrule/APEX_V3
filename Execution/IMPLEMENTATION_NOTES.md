# Implementation Notes: Conversational Advisor

## Critical Integration Points

### 1. Mission Control Store Integration

**What's needed:**
```typescript
// missionControlStore.ts - MUST export:
export interface MissionControlState {
  selectedSession: Session | null
  selectedVehicle: Vehicle | null
  driverConfidence: number  // ← NEW: 1-10 scale
  // ... other properties
}
```

**Current usage in AdvisorTab:**
```typescript
const { selectedSession, selectedVehicle, driverConfidence } = useMissionControlStore();
```

**Action item:** If `driverConfidence` doesn't exist, either:
- Add it to Mission Control store
- Set a default in AdvisorTab: `const confidence = driverConfidence ?? 5`

### 2. Database Schema Validation

**SetupChange table:**
The existing schema should support:
```typescript
{
  id: string,
  session_id: string,
  created_at: string,
  parameter: string,           // "Increase Shock Oil", etc.
  old_value?: string,          // nullable
  new_value?: string,          // nullable (or custom override)
  ai_reasoning?: string,       // populated from prescription.primary.reasoning
  driver_feedback?: string,    // NEW: for post-application feedback
  status: 'pending' | 'accepted' | 'denied' | 'reversed'  // ← 'reversed' added
}
```

**What to check:**
- [ ] `status: 'reversed'` is a valid enum value
- [ ] `driver_feedback` column exists (or allow null)
- [ ] `insertSetupChange` function accepts all fields

### 3. Physics Advisor Dependencies

**Required functions (already exist):**
```typescript
// physicsAdvisor.ts
getPrescriptionForSymptom(symptom, context) // ← used by generateProposalsFromContext
calculateDynamicTireFatigue(runCount, surfaceType) // ← used in initialization
getAvailableSymptoms() // ← used in AdvisorTab to populate button grid
getSessionScenario(sessionType, undefined) // ← used in initialization
```

All these are called from AdvisorTab. **No changes needed here.**

### 4. TypeScript Types

**Ensure these are properly exported:**

From `types/database.ts`:
```typescript
export type SetupChange = {
  id: string
  session_id: string
  created_at: string
  parameter: string
  old_value?: string
  new_value?: string
  ai_reasoning?: string
  driver_feedback?: string  // ← may need to add
  status: ChangeStatus
}
```

From `stores/advisorStore.ts` (NEW):
```typescript
export type ConversationPhase = 'symptom' | 'clarifying' | 'proposal' | 'applied'
export type ChatMessageType = 'ai-question' | 'user-response' | 'ai-proposal' | 'ai-confirmation' | 'ai-guidance'
export interface ChatMessage { /* ... */ }
```

---

## Common Issues & Solutions

### Issue 1: "Cannot find module 'useAdvisorStore'"
**Cause:** Store not importing properly
**Solution:**
```typescript
// Ensure path alias works:
// tsconfig.json: "@/*": "src/*"
// Then: import { useAdvisorStore } from '@/stores/advisorStore'
```

### Issue 2: "driverConfidence is undefined"
**Cause:** Mission Control doesn't export it
**Solution:**
```typescript
// In AdvisorTab.tsx, add fallback:
const { driverConfidence = 5 } = useMissionControlStore();
```

### Issue 3: Chat not scrolling to bottom
**Cause:** `chatEndRef` not being fired
**Solution:**
```typescript
// Ensure effect dependency includes chatMessages:
useEffect(() => {
  chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
}, [chatMessages]); // ← chatMessages must be in deps
```

### Issue 4: Proposals not applying to database
**Cause:** `insertSetupChange` failing silently
**Solution:**
```typescript
// Add error logging in applyProposal:
try {
  const savedChange = await insertSetupChange(payload);
  console.log('Saved:', savedChange); // ← debug
} catch (err) {
  console.error('DB write failed:', err); // ← debug
}
```

### Issue 5: Clarifying response not advancing phase
**Cause:** All questions not answered before advancing
**Solution:**
```typescript
// In submitClarificationResponse:
const allAnswered = state.clarifyingQuestions.every(
  (q) => state.userResponses[q] || response // ← must check all OR current
);
```

---

## Performance Optimization

### 1. Chat Message Memo
Consider memoizing ChatMessage for large histories:
```typescript
// ChatMessage.tsx
export default React.memo(function ChatMessage(props) {
  // ...
})
```

### 2. Selector Optimization
Current selectors recalculate on every store change. If store grows large, use:
```typescript
// Example: useChatMessages selector
export const useChatMessages = () => {
  return useAdvisorStore(
    (state) => state.chatMessages,  // ← select only what's needed
    (a, b) => a.length === b.length  // ← use shallow comparison
  );
};
```

### 3. Chat Feed Virtualization
If history grows beyond 100 messages, consider react-window:
```typescript
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={chatMessages.length}
  itemSize={80}
  width="100%"
>
  {({ index, style }) => (
    <div style={style}>
      <ChatMessage message={chatMessages[index]} />
    </div>
  )}
</FixedSizeList>
```

---

## Testing Strategy

### Unit Tests (Store)
```typescript
// advisorStore.test.ts
describe('initiateSocraticLoop', () => {
  it('should reject if confidence < 3', () => {
    const store = useAdvisorStore()
    store.setDriverConfidence(2)
    store.initiateSocraticLoop('Oversteer (Entry)', mockContext)

    expect(store.conversationPhase).toBe('symptom')
    expect(store.chatMessages[0].type).toBe('ai-guidance')
  })
})
```

### Component Tests (UI)
```typescript
// ChatMessage.test.tsx
describe('ChatMessage', () => {
  it('should render user message with blue border', () => {
    const { container } = render(
      <ChatMessage
        message={{ role: 'user', type: 'user-response', ... }}
      />
    )
    expect(container.querySelector('.border-apex-blue')).toBeTruthy()
  })
})
```

### E2E Tests (Flow)
```typescript
// AdvisorTab.e2e.ts
describe('Full Socratic Loop', () => {
  it('should complete symptom → questions → proposals → apply', () => {
    cy.get('[data-testid=symptom-button]').first().click()
    cy.get('input[placeholder="Your response..."]').type('On power')
    cy.get('button:contains(SEND)').click()
    cy.get('button:contains(APPLY)').should('be.visible')
    cy.get('button:contains(APPLY)').click()
    cy.get('text:contains(✅ Applied)').should('be.visible')
  })
})
```

---

## Debugging Tips

### 1. Track State Changes
```typescript
// Log all store updates
import { subscribeWithSelector } from 'zustand/middleware'

export const useAdvisorStore = create<AdvisorState>(
  subscribeWithSelector((set, get) => ({
    // ...
  }))
)

// Then:
useAdvisorStore.subscribe(
  (state) => state.conversationPhase,
  (phase) => console.log('Phase changed:', phase)
)
```

### 2. Chat Message Inspector
Add hidden debug panel:
```typescript
// In AdvisorTab.tsx
{process.env.NODE_ENV === 'development' && (
  <details className="mt-4 text-xs text-gray-600">
    <summary>Debug: Store State</summary>
    <pre>{JSON.stringify(useAdvisorStore((s) => ({
      phase: s.conversationPhase,
      messageCount: s.chatMessages.length,
      currentSymptom: s.selectedSymptom,
    })), null, 2)}</pre>
  </details>
)}
```

### 3. Message Timeline
```typescript
// Print all messages in order
const messages = useAdvisorStore((s) => s.chatMessages)
messages.sort((a, b) => a.timestamp - b.timestamp)
         .forEach(m => console.log(`${m.timestamp} [${m.role}] ${m.type}: ${m.content}`))
```

---

## Production Checklist

Before deploying to production:

### Code Quality
- [ ] All `console.log` statements removed (or behind feature flag)
- [ ] No `any` types (use `unknown` + type guard)
- [ ] Error boundaries added around components
- [ ] Loading states handled gracefully
- [ ] Network timeouts configured

### Performance
- [ ] Chat feed renders < 16ms (60fps)
- [ ] Store updates don't cause jank
- [ ] Message history doesn't grow unbounded
- [ ] Bundle size acceptable (< 50KB gzipped)

### Security
- [ ] User input sanitized (no XSS in custom values)
- [ ] API calls authenticated (session checks)
- [ ] Rate limiting on proposal generation
- [ ] Sensitive data not logged

### Accessibility
- [ ] Keyboard navigation works (Tab, Enter, Escape)
- [ ] Screen reader announces messages
- [ ] Color contrast meets WCAG AA
- [ ] Focus indicators visible

### Compatibility
- [ ] Tested on Chrome, Safari, Firefox
- [ ] Mobile layout responsive
- [ ] No breaking changes to existing tabs
- [ ] Backward compatibility maintained

---

## Rollback Plan

If critical issue found in production:

**Option 1: Revert to Old UI**
```typescript
// AdvisorTab.tsx - temporarily use old component:
import PrescriptionDisplay from '@/components/advisor/PrescriptionDisplay'
import SymptomSelector from '@/components/advisor/SymptomSelector'

// Replace new components with old implementation
// Keep store changes (they're backward compatible)
```

**Option 2: Feature Flag**
```typescript
const USE_CHAT_ADVISOR = process.env.NEXT_PUBLIC_CHAT_ADVISOR === 'true'

return USE_CHAT_ADVISOR ? (
  <ChatAdvisorTab />
) : (
  <LegacyAdvisorTab />
)
```

**Option 3: Graceful Degradation**
```typescript
// If store fails, fall back to legacy mode:
try {
  const store = useAdvisorStore()
  return <ChatAdvisorTab />
} catch (err) {
  console.error('Chat Advisor failed:', err)
  return <LegacyAdvisorTab />
}
```

---

## Maintenance & Future Improvements

### Short Term (v1.1)
- [ ] Add post-application feedback hook
- [ ] Implement isolation rule warnings
- [ ] Create effectiveness dashboard
- [ ] Add telemetry tracking

### Medium Term (v2.0)
- [ ] LLM-powered clarifying questions
- [ ] Voice input (Web Speech API)
- [ ] Multi-session trend analysis
- [ ] Predictive proposal ranking
- [ ] Confidence adjustment from lap times

### Long Term (v3.0)
- [ ] Federated learning across vehicles
- [ ] Genetic algorithm for setup optimization
- [ ] Real-time telemetry integration
- [ ] AR pit walkthrough visualization

---

## Support Resources

**Documentation:**
- [Zustand Documentation](https://github.com/pmndrs/zustand)
- [React Hooks Guide](https://react.dev/reference/react/hooks)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)

**Code Examples:**
- See `physicsAdvisor.ts` for physics logic patterns
- See `PrescriptionDisplay.tsx` for component patterns
- See `missionControlStore.ts` for store patterns

**Questions:**
- Check `PHASE_2_COMPLETE.md` for testing guide
- Check `CONVERSATIONAL_ADVISOR_COMPLETE.md` for overview
- Check inline code comments for implementation details

---

**Status:** Ready for deployment
**Last Updated:** January 2026
**Version:** 1.0 (Production)
