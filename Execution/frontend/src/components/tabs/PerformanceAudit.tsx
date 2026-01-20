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
    if (value === null) return 'text-gray-400';
    return value > 0 ? 'text-apex-green' : value < 0 ? 'text-apex-red' : 'text-gray-300';
  };

  const getDeltaArrow = (value: number | null) => {
    if (value === null) return '—';
    return value > 0 ? '↑' : value < 0 ? '↓' : '→';
  };

  return (
    <div className="w-full h-full bg-apex-dark text-white overflow-auto">
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* HEADER */}
        <div className="border-b border-apex-border pb-6">
          <h1 className="text-3xl font-bold uppercase tracking-tight text-apex-green">
            Performance Audit
          </h1>
          <p className="text-xs text-gray-400 mt-2 font-mono">
            Side-by-side ORP comparison and trend analysis
          </p>
        </div>

        {/* COLD START CALIBRATION NOTICE */}
        {!hasHistoricalSessions && (
          <div className="bg-apex-surface border border-yellow-600 border-opacity-50 rounded-lg p-4 flex items-center gap-3">
            <span className="text-lg">⚙️</span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-yellow-400 uppercase tracking-wide">
                [CALIBRATING] — Awaiting Historical Data
              </p>
              <p className="text-xs text-gray-300 mt-1">
                Complete your first session to establish a performance baseline for future comparisons.
              </p>
            </div>
          </div>
        )}

        {/* SESSION SELECTION */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* SESSION A */}
          <div className="bg-apex-surface border border-apex-border rounded-lg p-6 space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-300">
              ◆ Baseline Session (A)
            </h2>
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-400">
                Select Session
              </label>
              <select
                value={selectedSessionA?.sessionId || ''}
                onChange={(e) => {
                  const session = sessionsWithORP.find((s) => s.sessionId === e.target.value);
                  setSelectedSessionA(session || null);
                }}
                className="w-full bg-apex-dark border border-apex-border rounded px-3 py-2 text-sm focus:outline-none focus:border-apex-green transition-colors"
              >
                <option value="">Choose baseline session...</option>
                {sessionsWithORP.map((session) => (
                  <option key={session.sessionId} value={session.sessionId}>
                    {session.eventName} ({session.sessionType}) - {session.createdAt}
                  </option>
                ))}
              </select>
            </div>

            {selectedSessionA && selectedSessionA.orp && (
              <div className="bg-apex-dark rounded p-4 space-y-2 font-mono text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">ORP Score</span>
                  <span className="text-apex-green">
                    {selectedSessionA.orp.orp_score.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Consistency</span>
                  <span className="text-gray-300">
                    {selectedSessionA.orp.consistency_score.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Speed</span>
                  <span className="text-gray-300">{selectedSessionA.orp.speed_score.toFixed(1)}%</span>
                </div>
                {selectedSessionA.orp.fade_factor !== null && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Fade Factor</span>
                    <span
                      className={
                        selectedSessionA.orp.fade_factor > 0
                          ? 'text-apex-red'
                          : 'text-apex-green'
                      }
                    >
                      {(selectedSessionA.orp.fade_factor * 100).toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* SESSION B */}
          <div className="bg-apex-surface border border-apex-border rounded-lg p-6 space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-300">
              ◆ Current Session (B)
            </h2>
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-400">
                Select Session
              </label>
              <select
                value={selectedSessionB?.sessionId || ''}
                onChange={(e) => {
                  const session = sessionsWithORP.find((s) => s.sessionId === e.target.value);
                  setSelectedSessionB(session || null);
                }}
                className="w-full bg-apex-dark border border-apex-border rounded px-3 py-2 text-sm focus:outline-none focus:border-apex-green transition-colors"
              >
                <option value="">Choose comparison session...</option>
                {sessionsWithORP.map((session) => (
                  <option key={session.sessionId} value={session.sessionId}>
                    {session.eventName} ({session.sessionType}) - {session.createdAt}
                  </option>
                ))}
              </select>
            </div>

            {selectedSessionB && selectedSessionB.orp && (
              <div className="bg-apex-dark rounded p-4 space-y-2 font-mono text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">ORP Score</span>
                  <span className="text-apex-green">
                    {selectedSessionB.orp.orp_score.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Consistency</span>
                  <span className="text-gray-300">
                    {selectedSessionB.orp.consistency_score.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Speed</span>
                  <span className="text-gray-300">{selectedSessionB.orp.speed_score.toFixed(1)}%</span>
                </div>
                {selectedSessionB.orp.fade_factor !== null && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Fade Factor</span>
                    <span
                      className={
                        selectedSessionB.orp.fade_factor > 0
                          ? 'text-apex-red'
                          : 'text-apex-green'
                      }
                    >
                      {(selectedSessionB.orp.fade_factor * 100).toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ORP DELTA COMPARISON */}
        {delta && (
          <div className="bg-apex-surface border border-apex-border rounded-lg p-6 space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-300">
              ◆ ORP Delta Analysis (B - A)
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-apex-dark rounded p-4">
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">ORP Score Delta</p>
                <div className={`text-3xl font-bold ${getDeltaColor(delta.orpDelta)}`}>
                  <span className="mr-2">{getDeltaArrow(delta.orpDelta)}</span>
                  {Math.abs(delta.orpDelta).toFixed(1)}%
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {delta.orpDelta > 0
                    ? 'Improvement detected'
                    : delta.orpDelta < 0
                      ? 'Performance degradation'
                      : 'No change'}
                </p>
              </div>

              <div className="bg-apex-dark rounded p-4">
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Consistency Delta</p>
                <div className={`text-3xl font-bold ${getDeltaColor(delta.consistencyDelta)}`}>
                  <span className="mr-2">{getDeltaArrow(delta.consistencyDelta)}</span>
                  {Math.abs(delta.consistencyDelta).toFixed(1)}%
                </div>
              </div>

              <div className="bg-apex-dark rounded p-4">
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Speed Delta</p>
                <div className={`text-3xl font-bold ${getDeltaColor(delta.speedDelta)}`}>
                  <span className="mr-2">{getDeltaArrow(delta.speedDelta)}</span>
                  {Math.abs(delta.speedDelta).toFixed(1)}%
                </div>
              </div>

              <div className="bg-apex-dark rounded p-4">
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Fade Factor Delta</p>
                <div className={`text-3xl font-bold ${getDeltaColor(delta.fadeDelta)}`}>
                  <span className="mr-2">{getDeltaArrow(delta.fadeDelta)}</span>
                  {Math.abs(delta.fadeDelta * 100).toFixed(1)}%
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SETUP CHANGE ANALYSIS */}
        {selectedSessionA && selectedSessionB && selectedSessionA.orp && selectedSessionB.orp && (
          <div className="bg-apex-surface border border-apex-border rounded-lg p-6 space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-300">
              ◆ ORP Metric Comparison
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-sm font-mono">
                <thead>
                  <tr className="border-b border-apex-border">
                    <th className="text-left px-4 py-2 text-xs text-gray-400 uppercase">
                      Metric
                    </th>
                    <th className="text-left px-4 py-2 text-xs text-gray-400 uppercase">
                      Session A
                    </th>
                    <th className="text-left px-4 py-2 text-xs text-gray-400 uppercase">
                      Session B
                    </th>
                    <th className="text-left px-4 py-2 text-xs text-gray-400 uppercase">
                      Change
                    </th>
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
                      <tr key={metric.key} className="border-b border-apex-border border-opacity-30">
                        <td className="px-4 py-2 text-gray-300">{metric.name}</td>
                        <td className="px-4 py-2 text-gray-400">
                          {typeof valueA === 'number' ? metric.format(valueA) : '—'}
                        </td>
                        <td className="px-4 py-2 text-gray-400">
                          {typeof valueB === 'number' ? metric.format(valueB) : '—'}
                        </td>
                        <td className="px-4 py-2">
                          <span
                            className={
                              changed ? 'text-apex-green font-semibold' : 'text-gray-500'
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

        {/* SESSION HISTORY */}
        <div className="bg-apex-surface border border-apex-border rounded-lg p-6 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-300">
            ◆ Recent Sessions
          </h2>

          <div className="space-y-2">
            {sessionsWithORP.slice(0, 10).map((session) => (
              <div
                key={session.sessionId}
                className="bg-apex-dark rounded p-3 flex items-center justify-between hover:bg-opacity-80 transition-colors cursor-pointer"
              >
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-200">{session.eventName}</p>
                  <p className="text-xs text-gray-500 font-mono">{session.createdAt}</p>
                </div>

                <div className="text-right font-mono">
                  {session.orp && (
                    <>
                      <p className="text-sm text-apex-green font-bold">
                        {session.orp.orp_score.toFixed(1)}%
                      </p>
                      <p className="text-xs text-gray-400">ORP</p>
                    </>
                  )}
                </div>

                <div className="ml-4 px-3 py-1 rounded text-xs font-semibold uppercase tracking-wide bg-gray-800 text-gray-300">
                  {session.sessionType}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
