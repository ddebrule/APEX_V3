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

  return (
    <div className="w-full h-full bg-apex-dark text-white overflow-auto">
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* HEADER */}
        <div className="border-b border-apex-border pb-6">
          <h1 className="text-3xl font-bold uppercase tracking-tight text-apex-green">
            The Vault
          </h1>
          <p className="text-xs text-gray-400 mt-2 font-mono">
            Session history, Librarian AI, and institutional memory
          </p>
        </div>

        {/* STATISTICS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-apex-surface border border-apex-border rounded-lg p-4">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Total Archived</p>
            <p className="text-3xl font-bold text-apex-green">{totalSessionsArchived}</p>
            <p className="text-xs text-gray-500 mt-2">sessions in vault</p>
          </div>

          <div className="bg-apex-surface border border-apex-border rounded-lg p-4">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Average ORP</p>
            <p className="text-3xl font-bold text-apex-green">{averageORP}%</p>
            <p className="text-xs text-gray-500 mt-2">across all sessions</p>
          </div>

          <div className="bg-apex-surface border border-apex-border rounded-lg p-4">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Conversation Ledger</p>
            <p className="text-3xl font-bold text-apex-green">{conversationLedger.length}</p>
            <p className="text-xs text-gray-500 mt-2">messages recorded</p>
          </div>
        </div>

        {/* LIBRARIAN AI SEARCH */}
        <div className="bg-apex-surface border border-apex-border rounded-lg p-6 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-300">
            ◆ Librarian AI: Semantic Search
          </h2>
          <p className="text-xs text-gray-500">
            Search historical sessions for similar mechanical issues and solutions
          </p>

          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleLibrarianSearch()}
              placeholder="e.g., 'loose on mid-corner' or 'bouncy suspension'"
              className="flex-1 bg-apex-dark border border-apex-border rounded px-3 py-2 text-sm focus:outline-none focus:border-apex-green transition-colors"
            />
            <button
              onClick={handleLibrarianSearch}
              disabled={isSearching || !searchQuery.trim()}
              className={`px-6 py-2 font-semibold uppercase tracking-wide rounded transition-all ${
                isSearching || !searchQuery.trim()
                  ? 'bg-gray-700 text-gray-400 cursor-not-allowed opacity-50'
                  : 'bg-apex-green text-apex-dark hover:bg-opacity-90'
              }`}
            >
              {isSearching ? '⟳ Searching...' : '🔍 Search'}
            </button>
          </div>

          {librarianResults.length > 0 && (
            <div className="space-y-3 mt-4">
              <p className="text-xs font-semibold text-gray-400 uppercase">
                📚 Found {librarianResults.length} similar cases
              </p>
              {librarianResults.map((result, idx) => (
                <div key={idx} className="bg-apex-dark rounded p-4 border border-apex-border border-opacity-30">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-sm font-mono text-gray-300">{result.eventDate}</p>
                      <p className="text-xs text-gray-500 mt-1">Symptom: {result.symptom}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-apex-green">
                        +{result.orpImprovement.toFixed(1)}% ORP
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {(result.confidence * 100).toFixed(0)}% confidence
                      </p>
                    </div>
                  </div>

                  <p className="text-sm text-gray-300 bg-apex-surface rounded p-2 mb-3">
                    ✓ Fix: {result.fix}
                  </p>

                  <button
                    onClick={() => handlePushToAdvisor(result)}
                    className="w-full px-3 py-2 text-xs font-semibold uppercase tracking-wide rounded border border-apex-green text-apex-green hover:bg-apex-green hover:text-apex-dark transition-colors"
                  >
                    → Push to Advisor
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SESSION HISTORY */}
        <div className="bg-apex-surface border border-apex-border rounded-lg p-6 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-300">
            ◆ Archived Sessions
          </h2>

          <div className="space-y-2">
            {archivedSessions.map((session) => (
              <div
                key={session.sessionId}
                onClick={() => setSelectedArchive(session)}
                className={`rounded p-4 cursor-pointer transition-all ${
                  selectedArchive?.sessionId === session.sessionId
                    ? 'bg-apex-green bg-opacity-20 border border-apex-green'
                    : 'bg-apex-dark border border-apex-border border-opacity-30 hover:border-apex-green hover:border-opacity-50'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-semibold text-gray-200">{session.eventName}</p>
                    <p className="text-xs text-gray-500 font-mono mt-1">{session.createdAt}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-apex-green">{session.finalORP.toFixed(1)}%</p>
                    <p className="text-xs text-gray-400">ORP</p>
                  </div>
                </div>

                <div className="flex gap-4 text-xs font-mono text-gray-400 mt-2">
                  <span>{session.totalLaps} laps</span>
                  <span className="px-2 py-1 rounded bg-gray-800 text-gray-300">{session.sessionType}</span>
                  {session.improvement !== null && (
                    <span
                      className={
                        session.improvement > 0 ? 'text-apex-green' : 'text-apex-red'
                      }
                    >
                      {session.improvement > 0 ? '↑' : '↓'} {Math.abs(session.improvement).toFixed(1)}%
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SELECTED SESSION DETAIL */}
        {selectedArchive && (
          <div className="bg-apex-surface border border-apex-green border-opacity-50 rounded-lg p-6 space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-apex-green">
              ◆ Session Detail: {selectedArchive.eventName}
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="bg-apex-dark rounded p-3">
                <p className="text-xs text-gray-400 uppercase mb-1">Final ORP</p>
                <p className="text-lg font-bold text-apex-green">{selectedArchive.finalORP.toFixed(1)}%</p>
              </div>
              <div className="bg-apex-dark rounded p-3">
                <p className="text-xs text-gray-400 uppercase mb-1">Total Laps</p>
                <p className="text-lg font-bold text-gray-300">{selectedArchive.totalLaps}</p>
              </div>
              <div className="bg-apex-dark rounded p-3">
                <p className="text-xs text-gray-400 uppercase mb-1">Session Type</p>
                <p className="text-lg font-bold text-gray-300">{selectedArchive.sessionType.toUpperCase()}</p>
              </div>
              <div className="bg-apex-dark rounded p-3">
                <p className="text-xs text-gray-400 uppercase mb-1">Recorded</p>
                <p className="text-xs font-mono text-gray-300">{selectedArchive.createdAt}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Reported Symptoms</p>
                <ul className="space-y-1">
                  {selectedArchive.symptoms.map((symptom, idx) => (
                    <li key={idx} className="text-sm text-gray-300">
                      • {symptom}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Applied Fixes</p>
                <ul className="space-y-1">
                  {selectedArchive.fixes.map((fix, idx) => (
                    <li key={idx} className="text-sm text-apex-green">
                      ✓ {fix}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* CONVERSATION LEDGER SUMMARY */}
        <div className="bg-apex-surface border border-apex-border rounded-lg p-6 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-300">
            ◆ Conversation Ledger
          </h2>
          <p className="text-xs text-gray-500">
            Global AI-human dialogue history ({conversationLedger.length} messages recorded)
          </p>

          {conversationLedger.length > 0 ? (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {conversationLedger.slice(-5).map((msg, idx) => (
                <div
                  key={idx}
                  className="bg-apex-dark rounded p-3 text-xs border-l-2"
                  style={{
                    borderLeftColor:
                      msg.role === 'user'
                        ? '#00d9ff'
                        : msg.role === 'ai'
                          ? '#00ff88'
                          : '#888',
                  }}
                >
                  <p className="font-semibold text-gray-300 capitalize mb-1">{msg.role}</p>
                  <p className="text-gray-400 line-clamp-2">{msg.content}</p>
                  <p className="text-gray-600 text-xs mt-1">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-500 italic">No conversations recorded yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
