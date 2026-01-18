'use client';

import { useEffect, useState } from 'react';
import { useMissionControlStore } from '@/stores/missionControlStore';
import GlassCard from '@/components/common/GlassCard';
import TrackContextMatrix from '@/components/matrices/TrackContextMatrix';
import VehicleTechnicalMatrix from '@/components/matrices/VehicleTechnicalMatrix';
import TrackIntelligence from '@/components/sections/TrackIntelligence';
import type { TrackContext, Vehicle } from '@/types/database';

type RaceMode = 'BLUE' | 'RED';

interface SessionConfig {
  trackContext: Partial<TrackContext>;
  selectedVehicleId?: string;
  qualifyingRounds: number;
  mainEvents: 'single' | 'triple';
}

export default function UnifiedRaceControl() {
  const {
    selectedSession,
    selectedVehicle,
    selectedRacer,
    isLocked,
    setIsLocked,
  } = useMissionControlStore();

  // State machine
  const [mode, setMode] = useState<RaceMode>('BLUE');
  const [config, setConfig] = useState<SessionConfig>({
    trackContext: {
      name: selectedSession?.track_context?.name || 'TBD',
      surface: selectedSession?.track_context?.surface || 'hard_packed',
      traction: selectedSession?.track_context?.traction || 'medium',
      temperature: selectedSession?.track_context?.temperature,
    },
    selectedVehicleId: selectedVehicle?.id,
    qualifyingRounds: 3,
    mainEvents: 'single',
  });

  // Transition to RED when session is locked
  useEffect(() => {
    if (isLocked) {
      setMode('RED');
    }
  }, [isLocked]);

  const handleTrackContextChange = (changes: Partial<TrackContext>) => {
    setConfig((prev) => ({
      ...prev,
      trackContext: {
        ...prev.trackContext,
        ...changes,
      },
    }));
  };

  const handleDeploy = () => {
    if (!selectedVehicle || !selectedRacer) {
      console.error('Vehicle or racer not selected');
      return;
    }

    // Deploy: lock the session and transition to RED mode
    setIsLocked(true);
    setMode('RED');
  };

  // Vehicles list from selected racer
  const vehicles = selectedVehicle ? [selectedVehicle] : ([] as Vehicle[]);

  return (
    <div className="w-full min-h-screen bg-apex-dark text-white overflow-auto">
      <div className="flex">
        {/* SIDEBAR: Event Configuration & Controls */}
        <div className="w-80 bg-apex-surface/50 border-r border-apex-border flex flex-col">
          {/* Section Header */}
          <div className="px-6 py-4 border-b border-apex-border">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-apex-red font-mono text-xs">◆</span>
              <h3 className="text-[10px] uppercase font-bold tracking-widest text-apex-red font-mono">
                Event Configuration
              </h3>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {/* Event Name */}
            <div>
              <label className="text-[9px] uppercase font-bold tracking-widest text-gray-600 block mb-2 font-mono">
                Event Name
              </label>
              <input
                type="text"
                value={selectedSession?.event_name || 'New Event'}
                disabled={mode === 'RED'}
                className="w-full px-3 py-2 bg-apex-dark border border-apex-border rounded text-white text-sm focus:outline-none focus:border-apex-blue font-mono disabled:opacity-50"
              />
            </div>

            {/* Track Name */}
            <div>
              <label className="text-[9px] uppercase font-bold tracking-widest text-gray-600 block mb-2 font-mono">
                Track Name
              </label>
              <input
                type="text"
                value={config.trackContext.name || ''}
                onChange={(e) =>
                  handleTrackContextChange({
                    name: e.target.value,
                  })
                }
                disabled={mode === 'RED'}
                className="w-full px-3 py-2 bg-apex-dark border border-apex-border rounded text-white text-sm focus:outline-none focus:border-apex-blue font-mono disabled:opacity-50"
              />
            </div>

            {/* Session Intent */}
            <div>
              <label className="text-[9px] uppercase font-bold tracking-widest text-gray-600 block mb-2 font-mono">
                Session Intent
              </label>
              <div className="grid grid-cols-2 gap-2">
                {['PRACTICE', 'RACE'].map((intent) => (
                  <button
                    key={intent}
                    disabled={mode === 'RED'}
                    className={`px-2 py-1.5 rounded text-[9px] font-bold uppercase tracking-widest font-mono transition-all ${
                      intent === 'RACE'
                        ? 'border border-apex-blue bg-apex-blue/10 text-white'
                        : 'border border-gray-600 bg-gray-900 text-gray-400 hover:border-apex-blue/50'
                    } disabled:opacity-50`}
                  >
                    {intent}
                  </button>
                ))}
              </div>
            </div>

            {/* Race Logic */}
            <div className="pt-4 border-t border-apex-border/50">
              <label className="text-[9px] uppercase font-bold tracking-widest text-gray-600 block mb-2 font-mono">
                Qualifying Rounds
              </label>
              <select
                value={config.qualifyingRounds}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    qualifyingRounds: parseInt(e.target.value),
                  }))
                }
                disabled={mode === 'RED'}
                className="w-full px-3 py-2 bg-apex-dark border border-apex-border rounded text-white text-sm focus:outline-none focus:border-apex-blue font-mono disabled:opacity-50"
              >
                <option value={2}>2 Rounds</option>
                <option value={3}>3 Rounds</option>
                <option value={4}>4 Rounds</option>
              </select>
            </div>

            <div>
              <label className="text-[9px] uppercase font-bold tracking-widest text-gray-600 block mb-2 font-mono">
                Main Events
              </label>
              <select
                value={config.mainEvents}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    mainEvents: e.target.value as 'single' | 'triple',
                  }))
                }
                disabled={mode === 'RED'}
                className="w-full px-3 py-2 bg-apex-dark border border-apex-border rounded text-white text-sm focus:outline-none focus:border-apex-blue font-mono disabled:opacity-50"
              >
                <option value="single">Single Main</option>
                <option value="triple">Triple Mains</option>
              </select>
            </div>

            {/* Status Indicator */}
            <div className="pt-4 border-t border-apex-border/50 mt-4">
              <div className="flex items-center gap-2 p-3 bg-apex-surface rounded border border-apex-border/50">
                <div
                  className={`w-2 h-2 rounded-full ${
                    mode === 'BLUE' ? 'bg-apex-blue' : 'bg-apex-red'
                  }`}
                />
                <span className="text-[9px] font-mono font-bold uppercase">
                  Mode: {mode === 'BLUE' ? 'SETUP' : 'ACTIVE'}
                </span>
              </div>
            </div>
          </div>

          {/* Deploy Button */}
          <div className="px-6 py-4 border-t border-apex-border">
            <button
              onClick={handleDeploy}
              disabled={mode === 'RED' || !selectedVehicle}
              className={`w-full py-3 font-bold uppercase tracking-widest text-sm font-mono transition-all rounded ${
                mode === 'RED'
                  ? 'bg-apex-red/30 text-apex-red/60 cursor-not-allowed'
                  : 'bg-apex-red text-white hover:bg-apex-red/90 shadow-lg shadow-apex-red/30'
              }`}
            >
              COMMIT & START
            </button>
          </div>
        </div>

        {/* MAIN DESKTOP: Matrices & Live Data */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 max-w-6xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-apex-border">
            <div className="flex items-center gap-3">
              <div className="text-2xl font-bold uppercase tracking-tight">A.P.E.X. V3</div>
              <div className="text-sm font-bold uppercase tracking-tight text-gray-500">
                Unified Race Control
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-apex-surface border border-apex-border rounded text-[9px] font-mono">
              <div
                className={`w-2 h-2 rounded-full ${
                  mode === 'BLUE' ? 'bg-apex-blue' : 'bg-apex-red'
                }`}
              />
              {mode === 'BLUE' ? 'PRE-SESSION' : 'ACTIVE'}
            </div>
          </div>

          {/* Track Intelligence (Active mode only) */}
          {mode === 'RED' && selectedSession && (
            <div>
              <TrackIntelligence />
            </div>
          )}

          {/* Track Context Matrix */}
          <div>
            <TrackContextMatrix
              onContextChange={handleTrackContextChange}
              isEditable={mode === 'BLUE'}
              initialContext={config.trackContext}
            />
          </div>

          {/* Baseline Selector */}
          {mode === 'BLUE' && (
            <GlassCard>
              <div className="flex items-center gap-2 mb-4 border-b border-apex-blue/20 pb-3">
                <span className="text-apex-blue font-mono text-xs">◆</span>
                <h2 className="header-uppercase text-sm font-bold tracking-widest text-apex-blue">
                  Mechanical Baseline Selector
                </h2>
              </div>
              <div className="space-y-2">
                <label className="text-[9px] uppercase font-bold tracking-widest text-gray-600 block font-mono">
                  Initial Setup
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {['Master Baseline', 'Last Session'].map((option) => (
                    <button
                      key={option}
                      className="px-3 py-2 rounded text-[9px] font-bold uppercase tracking-widest font-mono border border-apex-blue bg-apex-blue/10 text-white hover:bg-apex-blue/20 transition-all"
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            </GlassCard>
          )}

          {/* Vehicle Technical Matrix */}
          <div>
            <VehicleTechnicalMatrix
              vehicles={vehicles}
              isEditable={mode === 'BLUE'}
              selectedVehicleIds={selectedVehicle ? [selectedVehicle.id] : []}
            />
          </div>

          {/* Footer */}
          <div className="pt-6 border-t border-apex-border text-center text-xs text-gray-600 font-mono">
            <p>
              A.P.E.X. V3.1 // UNIFIED_RACE_CONTROL // [ MODE: {mode === 'BLUE' ? 'SETUP' : 'ACTIVE'} ]
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
