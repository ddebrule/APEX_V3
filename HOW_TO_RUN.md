# How to Run A.P.E.X. V3

**Quick Start:** 5 minutes to get up and running

---

## 📍 Location

```
c:\Users\dnyce\Desktop\Coding\Antigravit Workspaces\APEX_V3\Execution\frontend
```

---

## 🚀 Step 1: Install Dependencies

Open terminal/command prompt and navigate to the frontend folder:

```bash
cd "c:\Users\dnyce\Desktop\Coding\Antigravit Workspaces\APEX_V3\Execution\frontend"
```

Install npm packages:

```bash
npm install
```

This installs:
- Next.js 15 (React framework)
- React 18 (UI library)
- Tailwind CSS (styling)
- Zustand (state management)
- Supabase client (database)

**Time:** ~2-3 minutes (first time only)

---

## 🔐 Step 2: Configure Environment

1. Copy the example environment file:
```bash
cp .env.local.example .env.local
```

2. Edit `.env.local` with your Supabase credentials:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**Where to get these:**
- Go to [Supabase Dashboard](https://app.supabase.com)
- Select your project
- Settings → API → Copy the URL and anon key

---

## 💻 Step 3: Run Development Server

```bash
npm run dev
```

You should see:
```
> apex-mission-control@3.0.0 dev
> next dev

  ▲ Next.js 15.0.0
  - Local:        http://localhost:3000
  - Environments: .env.local

✓ Ready in 2.5s
```

---

## 🌐 Step 4: Open in Browser

Navigate to:
```
http://localhost:3000
```

You should see the A.P.E.X. V3 dashboard with tabs:
- **Tab 1:** Mission Control (Session setup)
- **Tab 2:** Conversational Advisor (NEW! - what we just built)
- Tab 3-6: (Future phases)

---

## 🎯 Step 5: Test the Conversational Advisor

### To see the new Conversational Advisor (Tab 2):

1. **First:** Go to Tab 1 (Mission Control)
2. **Select a vehicle** (or create one)
3. **Select a track** (or create one)
4. **Create a session** (or use existing)
5. **Go to Tab 2** (Conversational Advisor)
6. **Click a symptom button** → Chat interface starts!

### Quick Test Flow:

```
1. Click "Oversteer (Entry)"
   ↓
2. AI asks: "Is the oversteer happening right at turn-in...?"
   ↓
3. Type response: "Right at turn-in"
   ↓
4. Click SEND
   ↓
5. AI asks second question
   ↓
6. Answer it
   ↓
7. See two proposals: Primary (green) & Alternative (blue)
   ↓
8. Click "APPLY" on one
   ↓
9. Confirmation: "✅ Applied: Increase Front Shock Oil"
```

---

## ⚙️ Common Commands

```bash
# Development server (what you did above)
npm run dev

# Type checking (catch TypeScript errors)
npm run type-check

# Build for production
npm build

# Production server (after build)
npm start

# Run linting
npm run lint
```

---

## 🐛 Troubleshooting

### Issue: "npm command not found"
**Solution:** Install Node.js from https://nodejs.org/ (includes npm)

### Issue: "Port 3000 already in use"
**Solution:** Run on different port:
```bash
npm run dev -- -p 3001
# Then visit http://localhost:3001
```

### Issue: "Supabase connection error"
**Solution:** Check `.env.local` has correct credentials
```bash
cat .env.local  # View current values
```

### Issue: "Module not found errors"
**Solution:** Reinstall dependencies:
```bash
rm -rf node_modules package-lock.json
npm install
```

### Issue: "Chat not appearing"
**Solution:**
1. Check browser console (F12 → Console tab) for errors
2. Ensure Mission Control has a session selected
3. Refresh page (Ctrl+R or Cmd+R)

---

## 📂 File Structure

```
frontend/
├── src/
│   ├── app/                      # Next.js pages
│   ├── components/
│   │   ├── advisor/
│   │   │   ├── ChatMessage.tsx          ← NEW
│   │   │   ├── ProposalCard.tsx         ← NEW
│   │   │   ├── ProposalCardsContainer.tsx ← NEW
│   │   │   └── [other components]
│   │   └── tabs/
│   │       └── AdvisorTab.tsx           ← REBUILT
│   ├── stores/
│   │   └── advisorStore.ts              ← EXTENDED
│   ├── lib/
│   │   ├── physicsAdvisor.ts
│   │   └── queries.ts
│   └── types/
│       └── database.ts
├── package.json
├── next.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

---

## 🧪 Testing in Browser

Once the app is running, you can test directly:

### Option 1: UI Testing (Recommended)
1. Open Advisor Tab
2. Click a symptom
3. Answer questions
4. See proposals appear
5. Click APPLY

### Option 2: Console Testing (Debug)
Open browser DevTools (F12) → Console tab and run:

```javascript
// Check store
const store = useAdvisorStore()
console.log('Phase:', store.conversationPhase)

// Trigger Socratic loop manually
store.initiateSocraticLoop('Oversteer (Entry)', {
  trackTemp: 75,
  scenarioB: false,
  sessionType: 'practice',
  surfaceType: 'hard_packed'
})

// See results
console.log('Messages:', store.chatMessages.length)
console.log('Questions:', store.clarifyingQuestions)
```

---

## 📚 Documentation

After running the app, read these for deeper understanding:

1. **QUICK_TEST_CHECKLIST.md** – 5-minute smoke test
2. **TESTING_GUIDE.md** – Comprehensive testing procedures
3. **CONVERSATIONAL_ADVISOR_COMPLETE.md** – Technical overview
4. **IMPLEMENTATION_NOTES.md** – Integration details

---

## 🚀 Next Steps

### If everything works:
1. ✅ Test all symptoms (see TESTING_GUIDE.md)
2. ✅ Test guardrails (confidence < 3, tire fatigue)
3. ✅ Test database writes (check setup_changes table)
4. ✅ Get team to review code
5. ✅ Deploy to staging

### If something breaks:
1. Check error message in browser console
2. See troubleshooting section above
3. Check IMPLEMENTATION_NOTES.md for common issues
4. Run `npm run type-check` to find TypeScript errors

---

## 💡 Quick Reference

| Task | Command |
|------|---------|
| Start development server | `npm run dev` |
| Check for errors | `npm run type-check` |
| Build for production | `npm run build` |
| Visit app | http://localhost:3000 |
| Test Advisor Tab | Select session in Tab 1, then Tab 2 |
| Debug in console | Press F12 → Console tab |

---

## ✅ Success Checklist

After running `npm run dev`:

- [ ] Server shows "Ready in X.Xs"
- [ ] Browser opens to http://localhost:3000
- [ ] Mission Control Tab visible
- [ ] Can select vehicle and session
- [ ] Can navigate to Advisor Tab
- [ ] Can see symptom selector buttons
- [ ] Clicking symptom shows chat with question
- [ ] Answering question shows second question
- [ ] After all answers, proposals appear
- [ ] Can click APPLY to apply proposal

**If all checked:** ✅ App is working!

---

## 📞 Support

**Common questions:**
- "How do I access the Conversational Advisor?" → Tab 2 after setting up session in Tab 1
- "Does it need a database?" → Yes, Supabase (cloud PostgreSQL)
- "Can I run locally without Supabase?" → Not currently, but can add mock data
- "How long does it take to start?" → ~5 minutes first time, then instant

**For code questions:** See IMPLEMENTATION_NOTES.md

---

**Ready?** Run `npm install` → `npm run dev` → Visit http://localhost:3000

**Stuck?** Check Troubleshooting section above, or open browser DevTools (F12) for errors.

