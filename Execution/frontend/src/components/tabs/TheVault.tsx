'use client';

import { useState, useMemo } from 'react';
import { useMissionControlStore } from '@/stores/missionControlStore';
import { useAdvisorStore } from '@/stores/advisorStore';
import { ORP_Result } from '@/lib/ORPService';

interface ArchivedSession {
  sessionId: string;
  eventName: string;
  sessionType: string;
  createdAt: string;
  finalORP: number;
  totalLaps: number;
  improvement: number | null; // Percentage improvement vs previous
  symptoms: string[];
  fixes: string[];
}

interface LibrarianResult {
  eventDate: string;
  symptom: string;
  fix: string;
  orpImprovement: number;
  confidence: number;
}

export default function TheVault() {
  const { sessions, currentORP } = useMissionControlStore();
  const { conversationLedger } = useAdvisorStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArchive, setSelectedArchive] = useState<ArchivedSession | null>(null);
  const [librarianResults, setLibrarianResults] = useState<LibrarianResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Mock archived sessions (in production, fetch from Supabase historic_sessions table)
  const archivedSessions = useMemo(() => {
    return sessions.slice(0, 15).map((session, idx) => ({
      sessionId: session.id,
      eventName: session.event_name,
      sessionType: session.session_type,
      createdAt: new Date(session.created_at).toLocaleString(),
      finalORP: 70 + Math.random() * 25, // Mock ORP scores
      totalLaps: 12 + Math.floor(Math.random() * 8),
      improvement: idx > 0 ? Math.random() * 15 - 5 : null, // Random improvement
      symptoms: ['bouncy on triples', 'loose mid-corner'],
      fixes: ['increased spring stiffness', 'adjusted camber'],
    }));
  }, [sessions]);

  const handleLibrarianSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);

    // Cold Start Fallback: Show baseline knowledge when no historical sessions exist
    if (isColdStart) {
      // Simulate search latency
      await new Promise((resolve) => setTimeout(resolve, 500));
      setLibrarianResults(baselineKnowledge);
      setIsSearching(false);
      return;
    }

    // Mock Librarian search (in production, use OpenAI embeddings + vector search)
    const mockResults: LibrarianResult[] = [
      {
        eventDate: '2026-01-15',
        symptom: 'Loose on mid-corner',
        fix: 'Increased front sway bar stiffness by 0.5mm',
        orpImprovement: 8.5,
        confidence: 0.92,
      },
      {
        eventDate: '2026-01-10',
        symptom: 'Bouncy on high-speed turns',
        fix: 'Adjusted shock compression settings',
        orpImprovement: 6.2,
        confidence: 0.87,
      },
      {
        eventDate: '2026-01-05',
        symptom: 'Poor traction on acceleration',
        fix: 'Changed tire compound to softer blend',
        orpImprovement: 5.8,
        confidence: 0.79,
      },
    ];

    // Simulate search latency
    await new Promise((resolve) => setTimeout(resolve, 800));

    setLibrarianResults(mockResults);
    setIsSearching(false);
  };

  const handlePushToAdvisor = (result: LibrarianResult) => {
    // In production, this would push the historical context to advisorStore
    const contextMessage = `Historical reference: ${result.eventDate} - "${result.symptom}" was resolved by: ${result.fix} (ORP improvement: +${result.orpImprovement}%)`;
    alert(`📚 Pushed to Advisor:\n\n${contextMessage}`);
  };

  const totalSessionsArchived = archivedSessions.length;
  const averageORP = archivedSessions.length > 0
    ? (archivedSessions.reduce((sum, s) => sum + s.finalORP, 0) / archivedSessions.length).toFixed(1)
    : 0;

  // Cold Start Detection: No archived sessions yet
  const isColdStart = totalSessionsArchived === 0;

  // Baseline racing knowledge for cold start fallback
  const baselineKnowledge: LibrarianResult[] = [
    {
      eventDate: 'General Knowledge',
      symptom: 'Loose/Oversteer on entry',
      fix: 'Reduce front anti-roll bar stiffness or increase front spring rate',
      orpImprovement: 0,
      confidence: 1.0,
    },
    {
      eventDate: 'General Knowledge',
      symptom: 'Understeer/Push on exit',
      fix: 'Increase rear anti-roll bar stiffness or adjust camber',
      orpImprovement: 0,
      confidence: 1.0,
    },
    {
      eventDate: 'General Knowledge',
      symptom: 'Tire degradation/Inconsistency',
      fix: 'Check tire pressures, adjust tire compound, or reduce tire wear with camber changes',
      orpImprovement: 0,
      confidence: 0.95,
    },
  ];

  return (
    <div className="flex h-full bg-[#121212] text-white font-sans overflow-auto relative">

      {/* PINNED SIDEBAR (LIBRARIAN AI) */}
      <div className="w-[380px] bg-[#0d0d0f] border-r border-white/5 flex flex-col z-50 transition-transform">
        {/* Sidebar Header */}
        <div className="p-4 bg-white/[0.02] border-b border-white/10 flex justify-between items-center">
          <span className="text-sm text-[#E53935] font-black uppercase tracking-[2px]">◆ Librarian AI</span>
          <button className="text-[#E53935] text-sm font-black uppercase tracking-widest">[ PINNED ]</button>
        </div>

        {/* Librarian AI Search */}
        <div className="p-5 space-y-4 flex flex-col flex-1 overflow-hidden">
          <p className="text-xs text-[#666] font-mono">Search historical sessions for similar mechanical issues and solutions</p>

          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleLibrarianSearch()}
              placeholder="e.g., 'loose on mid-corner' or 'bouncy suspension'"
              className="flex-1 bg-black border border-white/5 p-2 text-xs text-white font-mono rounded focus:outline-none focus:border-[#E53935]"
            />
            <button
              onClick={handleLibrarianSearch}
              disabled={isSearching || !searchQuery.trim()}
              className={`px-4 py-2 text-xs font-black uppercase rounded tracking-widest transition-all ${
                isSearching || !searchQuery.trim()
                  ? 'bg-[#333] text-[#666] cursor-not-allowed opacity-50'
                  : 'border border-[#E53935] bg-[#E53935]/10 text-[#E53935] hover:bg-[#E53935] hover:text-white'
              }`}
            >
              {isSearching ? '⟳' : '🔍'}
            </button>
          </div>

          {librarianResults.length > 0 && (
            <div className="space-y-3 flex-1 overflow-y-auto">
              <p className="text-xs font-black text-[#555] uppercase">
                📚 {isColdStart ? `Baseline Knowledge (${librarianResults.length} refs)` : `Found ${librarianResults.length} cases`}
              </p>
              {librarianResults.map((result, idx) => (
                <div key={idx} className="bg-black rounded p-3 border border-white/5">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-xs font-mono text-[#999]">{result.eventDate}</p>
                      <p className="text-[11px] text-[#666] mt-1">Symptom: {result.symptom}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-black text-[#E53935]">
                        +{result.orpImprovement.toFixed(1)}%
                      </p>
                      <p className="text-[11px] text-[#666] mt-1">
                        {(result.confidence * 100).toFixed(0)}% conf
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-[#999] bg-[#0a0a0b] rounded p-2 mb-2 font-mono">
                    ✓ {result.fix}
                  </p>

                  <button
                    onClick={() => handlePushToAdvisor(result)}
                    className="w-full px-2 py-1 text-[11px] font-black uppercase rounded border border-[#E53935] text-[#E53935] hover:bg-[#E53935] hover:text-white transition-all tracking-widest"
                  >
                    → Push
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* MAIN DESKTOP */}
      <div className="flex-1 flex flex-col p-[25px] gap-[25px] overflow-hidden">

        {/* COLD START NOTICE */}
        {isColdStart && (
          <div className="bg-[#121214] border border-[#2196F3] border-opacity-50 rounded p-4 flex items-center gap-3">
            <span className="text-lg">📚</span>
            <div className="flex-1">
              <p className="text-sm font-black text-[#2196F3] uppercase tracking-[1px]">
                [BUILDING VAULT] — First Session Initialization
              </p>
              <p className="text-xs text-[#999] mt-1 font-mono">
                Your first session will establish the foundation for institutional memory. Until then, the Librarian uses general racing knowledge as reference material.
              </p>
            </div>
          </div>
        )}

        {/* STATISTICS */}
        <div className="grid grid-cols-3 gap-[15px]">
          <div className="bg-[#121214] border border-white/5 rounded p-[18px]">
            <p className="text-xs text-[#555] uppercase font-black tracking-widest">Total Archived</p>
            <p className="text-[24px] font-black text-[#E53935] mt-2">{totalSessionsArchived}</p>
            <p className="text-xs text-[#666] mt-2 font-mono">sessions in vault</p>
          </div>

          <div className="bg-[#121214] border border-white/5 rounded p-[18px]">
            <p className="text-xs text-[#555] uppercase font-black tracking-widest">Average ORP</p>
            <p className="text-[24px] font-black text-[#E53935] mt-2">{averageORP}%</p>
            <p className="text-xs text-[#666] mt-2 font-mono">across all sessions</p>
          </div>

          <div className="bg-[#121214] border border-white/5 rounded p-[18px]">
            <p className="text-xs text-[#555] uppercase font-black tracking-widest">Ledger</p>
            <p className="text-[24px] font-black text-[#E53935] mt-2">{conversationLedger.length}</p>
            <p className="text-xs text-[#666] mt-2 font-mono">messages recorded</p>
          </div>
        </div>

        {/* SELECTED SESSION DETAIL */}
        {selectedArchive && (
          <div className="bg-[#121214] border border-[#E53935] rounded flex flex-col overflow-hidden flex-1 min-h-0">
            <div className="p-4 bg-white/[0.02] border-b border-[#E53935]/30">
              <span className="text-sm text-[#E53935] font-black uppercase tracking-[2px]">◆ {selectedArchive.eventName}</span>
            </div>

            <div className="p-5 flex-1 overflow-y-auto space-y-4">
              <div className="grid grid-cols-4 gap-3">
                <div className="bg-black rounded p-3 border border-white/5">
                  <p className="text-xs text-[#555] uppercase font-black">Final ORP</p>
                  <p className="text-[16px] font-black text-[#E53935] mt-2">{selectedArchive.finalORP.toFixed(1)}%</p>
                </div>
                <div className="bg-black rounded p-3 border border-white/5">
                  <p className="text-xs text-[#555] uppercase font-black">Total Laps</p>
                  <p className="text-[16px] font-black text-white mt-2">{selectedArchive.totalLaps}</p>
                </div>
                <div className="bg-black rounded p-3 border border-white/5">
                  <p className="text-xs text-[#555] uppercase font-black">Type</p>
                  <p className="text-sm font-black text-white mt-2 uppercase">{selectedArchive.sessionType}</p>
                </div>
                <div className="bg-black rounded p-3 border border-white/5">
                  <p className="text-xs text-[#555] uppercase font-black">Recorded</p>
                  <p className="text-xs font-mono text-[#999] mt-2">{selectedArchive.createdAt}</p>
                </div>
              </div>

              {/* MONOSPACED SESSION DETAILS TABLE */}
              <div className="bg-black border border-white/10 rounded p-4 font-mono text-xs overflow-x-auto">
                <div className="text-xs font-black text-[#555] uppercase mb-3 tracking-widest">Session Metadata</div>
                <div className="space-y-2 text-[#999]">
                  <div className="flex justify-between">
                    <span className="text-[#E53935]">EVENT</span>
                    <span>{selectedArchive.eventName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#E53935]">TYPE</span>
                    <span>{selectedArchive.sessionType.toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#E53935]">ORP_SCORE</span>
                    <span>{selectedArchive.finalORP.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#E53935]">LAP_COUNT</span>
                    <span>{selectedArchive.totalLaps}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#E53935]">RECORDED_AT</span>
                    <span>{selectedArchive.createdAt}</span>
                  </div>
                  {selectedArchive.improvement !== null && (
                    <div className="flex justify-between">
                      <span className="text-[#E53935]">IMPROVEMENT</span>
                      <span className={selectedArchive.improvement > 0 ? 'text-[#4CAF50]' : 'text-[#FF6B6B]'}>
                        {selectedArchive.improvement > 0 ? '+' : ''}{selectedArchive.improvement.toFixed(2)}%
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-black text-[#555] uppercase mb-2">Reported Symptoms</p>
                  <ul className="space-y-1">
                    {selectedArchive.symptoms.map((symptom, idx) => (
                      <li key={idx} className="text-xs text-[#999] font-mono">
                        • {symptom}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-black text-[#555] uppercase mb-2">Applied Fixes</p>
                  <ul className="space-y-1">
                    {selectedArchive.fixes.map((fix, idx) => (
                      <li key={idx} className="text-xs text-[#E53935] font-mono">
                        ✓ {fix}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CONVERSATION LEDGER */}
        <div className="bg-[#121214] border border-white/5 rounded flex flex-col overflow-hidden shrink-0">
          <div className="p-4 bg-white/[0.02] border-b border-white/5">
            <span className="text-sm text-[#E53935] font-black uppercase tracking-[2px]">◆ Conversation Ledger</span>
          </div>

          <div className="p-5 max-h-[200px] overflow-y-auto space-y-2">
            {conversationLedger.length > 0 ? (
              conversationLedger.slice(-5).map((msg, idx) => (
                <div
                  key={idx}
                  className="bg-black rounded p-2 text-[11px] border-l-2 font-mono"
                  style={{
                    borderLeftColor:
                      msg.role === 'user'
                        ? '#2196F3'
                        : msg.role === 'ai'
                          ? '#E53935'
                          : '#666',
                  }}
                >
                  <p className="font-black text-[#999] uppercase">{msg.role}</p>
                  <p className="text-[#666] line-clamp-1 mt-1">{msg.content}</p>
                </div>
              ))
            ) : (
              <p className="text-xs text-[#555] italic font-mono">No conversations recorded yet</p>
            )}
          </div>
        </div>

        {/* SESSION HISTORY */}
        <div className="bg-[#121214] border border-white/5 rounded flex flex-col overflow-hidden shrink-0">
          <div className="p-4 bg-white/[0.02] border-b border-white/5">
            <span className="text-sm text-[#E53935] font-black uppercase tracking-[2px]">◆ Session History</span>
          </div>

          <div className="p-5 max-h-[400px] overflow-y-auto">
            {archivedSessions.length === 0 ? (
              <div className="text-sm text-[#555] italic">No sessions archived yet.</div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {archivedSessions.map((session) => (
                  <div
                    key={session.sessionId}
                    onClick={() => setSelectedArchive(session)}
                    className={`p-3 border rounded cursor-pointer transition-all relative group ${
                      selectedArchive?.sessionId === session.sessionId
                        ? 'bg-[#E53935]/5 border-[#E53935] border-l-4 shadow-[0_0_20px_rgba(229,57,53,0.1)]'
                        : 'bg-[#1a1a1c]/80 backdrop-blur-sm border-white/10 hover:border-[#E53935]/50 transition-all duration-300'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-sm font-bold text-white uppercase">{session.eventName}</div>
                        <div className="font-mono text-xs text-[#666] mt-[3px] uppercase">{session.sessionType}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-[#E53935] font-black">{session.finalORP.toFixed(1)}% ORP</div>
                        <div className="text-xs text-[#666] font-mono mt-1">{session.totalLaps} laps</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
