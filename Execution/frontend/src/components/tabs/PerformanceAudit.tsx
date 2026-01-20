'use client';

import { useState, useMemo } from 'react';
import { useMissionControlStore } from '@/stores/missionControlStore';
import { ORP_Result } from '@/lib/ORPService';

interface SessionComparison {
  sessionId: string;
  eventName: string;
  sessionType: string;
  createdAt: string;
  orp?: ORP_Result;
  totalLaps: number;
  status: string;
}

export default function PerformanceAudit() {
  const { sessions, currentORP, selectedSession } = useMissionControlStore();
  const [selectedSessionA, setSelectedSessionA] = useState<SessionComparison | null>(null);
  const [selectedSessionB, setSelectedSessionB] = useState<SessionComparison | null>(null);

  // Mock data for demo (in production, this would fetch from Supabase historic_sessions)
  const sessionsWithORP = useMemo(() => {
    return sessions.map((session) => ({
      sessionId: session.id,
      eventName: session.event_name,
      sessionType: session.session_type,
      createdAt: new Date(session.created_at).toLocaleString(),
      orp: currentORP || undefined, // In production, fetch from historic_sessions table
      totalLaps: 12, // Mock value
      status: session.status,
    } as SessionComparison));
  }, [sessions, currentORP]);

  const calculateDelta = () => {
    if (!selectedSessionA?.orp || !selectedSessionB?.orp) return null;

    return {
      orpDelta: selectedSessionB.orp.orp_score - selectedSessionA.orp.orp_score,
      consistencyDelta:
        selectedSessionB.orp.consistency_score - selectedSessionA.orp.consistency_score,
      speedDelta: selectedSessionB.orp.speed_score - selectedSessionA.orp.speed_score,
      fadeDelta:
        (selectedSessionB.orp.fade_factor ?? 0) - (selectedSessionA.orp.fade_factor ?? 0),
    };
  };

  const delta = calculateDelta();

  // Cold Start Detection: Check if any sessions exist for comparison
  const hasHistoricalSessions = sessionsWithORP.length > 0;

  const getDeltaColor = (value: number | null) => {
    if (value === null) return 'text-[#666]';
    return value > 0 ? 'text-[#2196F3]' : value < 0 ? 'text-[#E53935]' : 'text-[#999]';
  };

  const getDeltaArrow = (value: number | null) => {
    if (value === null) return '—';
    return value > 0 ? '↑' : value < 0 ? '↓' : '→';
  };

  return (
    <div className="flex h-full bg-[#121212] text-white font-sans overflow-auto relative">

      {/* PINNED SIDEBAR (SESSION SELECTION) */}
      <div className="w-[380px] bg-[#0d0d0f] border-r border-white/5 flex flex-col z-50 transition-transform">
        {/* Sidebar Header */}
        <div className="p-4 bg-white/[0.02] border-b border-white/10 flex justify-between items-center">
          <span className="text-[10px] text-[#E53935] font-black uppercase tracking-[2px]">◆ Session Selector</span>
          <button className="text-[#E53935] text-[10px] font-black uppercase tracking-widest">[ PINNED ]</button>
        </div>

        {/* Session Selection */}
        <div className="p-[30px] flex-1 overflow-y-auto space-y-5">
          {/* SESSION A */}
          <div>
            <label className="text-[10px] font-extrabold text-[#555] uppercase block mb-2">Baseline (A)</label>
            <select
              value={selectedSessionA?.sessionId || ''}
              onChange={(e) => {
                const session = sessionsWithORP.find((s) => s.sessionId === e.target.value);
                setSelectedSessionA(session || null);
              }}
              className="w-full bg-black border border-white/5 p-2 text-white text-sm font-mono rounded focus:outline-none focus:border-[#E53935]"
            >
              <option value="">Select baseline...</option>
              {sessionsWithORP.map((session) => (
                <option key={session.sessionId} value={session.sessionId}>
                  {session.eventName}
                </option>
              ))}
            </select>
          </div>

          {/* SESSION B */}
          <div>
            <label className="text-[10px] font-extrabold text-[#555] uppercase block mb-2">Current (B)</label>
            <select
              value={selectedSessionB?.sessionId || ''}
              onChange={(e) => {
                const session = sessionsWithORP.find((s) => s.sessionId === e.target.value);
                setSelectedSessionB(session || null);
              }}
              className="w-full bg-black border border-white/5 p-2 text-white text-sm font-mono rounded focus:outline-none focus:border-[#E53935]"
            >
              <option value="">Select current...</option>
              {sessionsWithORP.map((session) => (
                <option key={session.sessionId} value={session.sessionId}>
                  {session.eventName}
                </option>
              ))}
            </select>
          </div>

          {/* SESSION A STATS */}
          {selectedSessionA && selectedSessionA.orp && (
            <div className="bg-[#1a1a1c] border border-[#2196F3]/30 rounded p-3 space-y-2">
              <div className="text-[9px] font-black text-[#555] uppercase">Session A</div>
              <div className="space-y-1 font-mono text-[9px]">
                <div className="flex justify-between text-[#999]">
                  <span>ORP Score</span>
                  <span className="text-[#2196F3] font-black">{selectedSessionA.orp.orp_score.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between text-[#999]">
                  <span>Consistency</span>
                  <span className="text-white">{selectedSessionA.orp.consistency_score.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between text-[#999]">
                  <span>Speed</span>
                  <span className="text-white">{selectedSessionA.orp.speed_score.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          )}

          {/* SESSION B STATS */}
          {selectedSessionB && selectedSessionB.orp && (
            <div className="bg-[#1a1a1c] border border-[#E53935]/30 rounded p-3 space-y-2">
              <div className="text-[9px] font-black text-[#555] uppercase">Session B</div>
              <div className="space-y-1 font-mono text-[9px]">
                <div className="flex justify-between text-[#999]">
                  <span>ORP Score</span>
                  <span className="text-[#E53935] font-black">{selectedSessionB.orp.orp_score.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between text-[#999]">
                  <span>Consistency</span>
                  <span className="text-white">{selectedSessionB.orp.consistency_score.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between text-[#999]">
                  <span>Speed</span>
                  <span className="text-white">{selectedSessionB.orp.speed_score.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MAIN DESKTOP */}
      <div className="flex-1 flex flex-col p-[25px] gap-[25px] overflow-hidden">

        {/* COLD START NOTICE */}
        {!hasHistoricalSessions && (
          <div className="bg-[#121214] border border-[#FFC400] border-opacity-50 rounded p-4 flex items-center gap-3">
            <span className="text-lg">⚙️</span>
            <div className="flex-1">
              <p className="text-[11px] font-black text-[#FFC400] uppercase tracking-[1px]">
                [CALIBRATING] — Awaiting Historical Data
              </p>
              <p className="text-[9px] text-[#999] mt-1 font-mono">
                Complete your first session to establish a performance baseline.
              </p>
            </div>
          </div>
        )}

        {/* ORP DELTA COMPARISON */}
        {delta && (
          <div className="bg-[#121214] border border-white/5 rounded flex flex-col overflow-hidden shrink-0">
            <div className="p-4 bg-white/[0.02] border-b border-white/5">
              <span className="text-[10px] text-[#E53935] font-black uppercase tracking-[2px]">◆ ORP Delta Analysis (B - A)</span>
            </div>

            <div className="grid grid-cols-4 gap-3 p-5">
              <div className="bg-black rounded p-3 border border-white/5">
                <p className="text-[9px] text-[#555] uppercase font-black">ORP Score</p>
                <div className={`text-[18px] font-black mt-2 ${getDeltaColor(delta.orpDelta)}`}>
                  <span>{getDeltaArrow(delta.orpDelta)}</span>
                  <span className="ml-1">{Math.abs(delta.orpDelta).toFixed(1)}%</span>
                </div>
              </div>

              <div className="bg-black rounded p-3 border border-white/5">
                <p className="text-[9px] text-[#555] uppercase font-black">Consistency</p>
                <div className={`text-[18px] font-black mt-2 ${getDeltaColor(delta.consistencyDelta)}`}>
                  <span>{getDeltaArrow(delta.consistencyDelta)}</span>
                  <span className="ml-1">{Math.abs(delta.consistencyDelta).toFixed(1)}%</span>
                </div>
              </div>

              <div className="bg-black rounded p-3 border border-white/5">
                <p className="text-[9px] text-[#555] uppercase font-black">Speed</p>
                <div className={`text-[18px] font-black mt-2 ${getDeltaColor(delta.speedDelta)}`}>
                  <span>{getDeltaArrow(delta.speedDelta)}</span>
                  <span className="ml-1">{Math.abs(delta.speedDelta).toFixed(1)}%</span>
                </div>
              </div>

              <div className="bg-black rounded p-3 border border-white/5">
                <p className="text-[9px] text-[#555] uppercase font-black">Fade Factor</p>
                <div className={`text-[18px] font-black mt-2 ${getDeltaColor(delta.fadeDelta)}`}>
                  <span>{getDeltaArrow(delta.fadeDelta)}</span>
                  <span className="ml-1">{Math.abs(delta.fadeDelta * 100).toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* METRIC COMPARISON TABLE */}
        {selectedSessionA && selectedSessionB && selectedSessionA.orp && selectedSessionB.orp && (
          <div className="bg-[#121214] border border-white/5 rounded flex flex-col overflow-hidden flex-1 min-h-0">
            <div className="p-4 bg-white/[0.02] border-b border-white/5 shrink-0">
              <span className="text-[10px] text-[#E53935] font-black uppercase tracking-[2px]">◆ ORP Metric Comparison</span>
            </div>

            <div className="flex-1 overflow-auto">
              <table className="w-full border-collapse font-mono text-[9px]">
                <thead className="sticky top-0 bg-[#1a1a1c] z-10">
                  <tr>
                    {['Metric', 'Session A', 'Session B', 'Change'].map(header => (
                      <th key={header} className="text-left p-3 text-[9px] font-extrabold uppercase text-[#555] border-b border-[#E53935]">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    {
                      name: 'ORP Score',
                      key: 'orp_score',
                      format: (v: number) => `${v.toFixed(1)}%`,
                    },
                    {
                      name: 'Consistency',
                      key: 'consistency_score',
                      format: (v: number) => `${v.toFixed(1)}%`,
                    },
                    {
                      name: 'Speed',
                      key: 'speed_score',
                      format: (v: number) => `${v.toFixed(1)}%`,
                    },
                    {
                      name: 'CoV',
                      key: 'coV',
                      format: (v: number) => `${v.toFixed(2)}`,
                    },
                    {
                      name: 'Best Lap',
                      key: 'best_lap',
                      format: (v: number) => `${(v / 1000).toFixed(3)}s`,
                    },
                    {
                      name: 'Avg Lap',
                      key: 'average_lap',
                      format: (v: number) => `${(v / 1000).toFixed(3)}s`,
                    },
                  ].map((metric) => {
                    const valueA =
                      selectedSessionA.orp?.[metric.key as keyof typeof selectedSessionA.orp];
                    const valueB =
                      selectedSessionB.orp?.[metric.key as keyof typeof selectedSessionB.orp];
                    const changed = valueA !== valueB;

                    return (
                      <tr key={metric.key} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="p-3 text-[#999]">{metric.name}</td>
                        <td className="p-3 text-[#999]">
                          {typeof valueA === 'number' ? metric.format(valueA) : '—'}
                        </td>
                        <td className="p-3 text-[#999]">
                          {typeof valueB === 'number' ? metric.format(valueB) : '—'}
                        </td>
                        <td className="p-3">
                          <span
                            className={
                              changed ? 'text-[#2196F3] font-black' : 'text-[#555]'
                            }
                          >
                            {changed ? '⚡ Changed' : '—'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
