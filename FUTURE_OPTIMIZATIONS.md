# Future Optimizations & Feature Requests

This document tracks technical refinements and feature ideas that are planned for after the completion of the V3.1 migration.

## AI Advisor Refinements

### Fine-Tuning Advisor Communication (User Request: 2026-01-19)
**Goal:** Dial in the AI Advisor's communication style to use a structured response format when making recommendations.

**Requirements:**
- The Advisor should respond with specific examples of how it should communicate.
- Implementation of a structured response framework for all recommendations.
- Validation of reasoning through the "Socratic loop" before final proposal.

**Target Files:**
- `Directives/prompts/advisor.md`: Update the system persona and provide few-shot examples of structured responses.
- `Execution/frontend/src/components/tabs/AIAdvisor.tsx`: (If needed) Update the UI to better handle highly structured data (e.g., specific card layouts for different types of recommendations).

**Success Criteria:**
- The AI consistently uses the agreed-upon structure.
- Recommendations are clear, actionable, and backed by institutional memory.
- Responses feel like a "Knowledgeable Racer" (Analytical Pit Partner).

---

## Technical Debt / Refinements
- [ ] Transition remaining mock data in `AIAdvisor.tsx` to Supabase queries.
- [ ] Implement voice-to-text integration for the microphone button.
- [ ] Add PDF export for "Strategic Prep Plans".
