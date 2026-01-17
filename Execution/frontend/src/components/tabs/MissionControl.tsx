'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/common/Header';
import EventIdentity from '@/components/sections/EventIdentity';
import TrackIntelligence from '@/components/sections/TrackIntelligence';
import InstitutionalMemory from '@/components/sections/InstitutionalMemory';
import BaselineInitialization from '@/components/sections/BaselineInitialization';
import { useMissionControlStore } from '@/stores/missionControlStore';

interface StatusIndicator {
  label: string;
  value: boolean;
}

export default function MissionControl() {
  const { selectedRacer, selectedSession, isLocked } = useMissionControlStore();
  const [statusIndicators, setStatusIndicators] = useState<StatusIndicator[]>([
    { label: 'Battery', value: true },
    { label: 'Signal', value: true },
    { label: 'Sync', value: true },
  ]);

  useEffect(() => {
    const updateStatus = setInterval(() => {
      setStatusIndicators(prev => prev.map(indicator => ({
        ...indicator,
        value: Math.random() > 0.1,
      })));
    }, 3000);

    return () => clearInterval(updateStatus);
  }, []);

  return (
    <div className="w-full h-screen bg-apex-dark text-white overflow-auto">
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        {/* TOP BAR */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-apex-border">
          <div className="flex items-center gap-3">
            <div className="text-2xl font-bold uppercase tracking-tight">
              A.P.E.X. V3
            </div>
            <div className="text-xl font-bold uppercase tracking-tight text-gray-500">
              Mission Control
            </div>
          </div>

          {/* STATUS INDICATORS */}
          <div className="flex items-center gap-6">
            {statusIndicators.map(indicator => (
              <div key={indicator.label} className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    indicator.value ? 'bg-apex-green' : 'bg-apex-red'
                  }`}
                />
                <span className="text-xs uppercase tracking-wide text-gray-400">
                  {indicator.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* SESSION HEADER */}
        {isLocked && selectedSession && (
          <div className="mb-8 pb-6 border-b border-apex-border">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="header-uppercase text-2xl text-apex-green">
                  {selectedSession.event_name}
                </h2>
                <p className="text-xs text-gray-500 mt-2 font-mono">
                  Session: {selectedSession.id.slice(0, 8)} | Type: {selectedSession.session_type.toUpperCase()}
                </p>
              </div>
              <div className="text-right text-xs font-mono text-gray-400">
                <p>Started: {new Date(selectedSession.created_at).toLocaleTimeString()}</p>
              </div>
            </div>
          </div>
        )}

        {/* MAIN CONTENT GRID */}
        <div className="space-y-6">
          {/* SECTION 1: EVENT IDENTITY */}
          <div>
            <h3 className="header-uppercase text-sm mb-4 text-gray-500 tracking-wide">
              ◆ Event Identity
            </h3>
            <EventIdentity />
          </div>

          {/* SECTION 2: TRACK INTELLIGENCE */}
          <div>
            <h3 className="header-uppercase text-sm mb-4 text-gray-500 tracking-wide">
              ◆ Track Intelligence
            </h3>
            <TrackIntelligence />
          </div>

          {/* SECTION 3: INSTITUTIONAL MEMORY */}
          <div>
            <h3 className="header-uppercase text-sm mb-4 text-gray-500 tracking-wide">
              ◆ Institutional Memory (Librarian Persona)
            </h3>
            <InstitutionalMemory />
          </div>

          {/* SECTION 4: BASELINE INITIALIZATION */}
          <div>
            <h3 className="header-uppercase text-sm mb-4 text-gray-500 tracking-wide">
              ◆ Baseline Initialization
            </h3>
            <BaselineInitialization />
          </div>
        </div>

        {/* FOOTER */}
        <div className="mt-12 pt-6 border-t border-apex-border text-center text-xs text-gray-600">
          <p>🤖 Powered by A.P.E.X. V3 | Dual-Agent Architecture | Status: {isLocked ? 'SESSION ACTIVE' : 'STANDBY'}</p>
        </div>
      </div>
    </div>
  );
}
