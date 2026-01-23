'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useMissionControlStore } from '@/stores/missionControlStore';
import GlassCard from '@/components/common/GlassCard';
import TacticalHeader from '@/components/common/TacticalHeader';
import TrackContextMatrix from '@/components/matrices/TrackContextMatrix';
import VehicleTechnicalMatrix from '@/components/matrices/VehicleTechnicalMatrix';
import TrackIntelligence from '@/components/sections/TrackIntelligence';
import { updateSession } from '@/lib/queries';
import type { TrackContext, Vehicle, RaceResult } from '@/types/database';

type RaceMode = 'BLUE' | 'RED';

interface SessionConfig {
  trackContext: Partial<TrackContext>;
  selectedVehicleId?: string;
  qualifyingRounds: number;
  mainEvents: 'single' | 'triple';
  pitNotes: string;
}

export default function UnifiedRaceControl() {
  const router = useRouter();
  const {
    selectedSession,
    selectedVehicle,
    sessionStatus,
    isLocked,
    setIsLocked,
  } = useMissionControlStore();

  // Local state
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
    pitNotes: '',
  });

  const [raceResult, setRaceResult] = useState<RaceResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // SYNC: Determine mode based on session status
  useEffect(() => {
    if (!selectedSession) {
      setMode('BLUE');
      setIsLocked(false);
      return;
    }

    if (selectedSession.status === 'active') {
      setMode('RED');
      setIsLocked(true);
    } else {
      setMode('BLUE');
      setIsLocked(false);
    }
  }, [selectedSession, setIsLocked]);

  // Initialize config from selected session
  useEffect(() => {
    if (selectedSession) {
      setConfig((prev) => ({
        ...prev,
        trackContext: selectedSession.track_context || prev.trackContext,
      }));
    }
  }, [selectedSession]);

  const handleTrackContextChange = (changes: Partial<TrackContext>) => {
    setConfig((prev) => ({
      ...prev,
      trackContext: {
        ...prev.trackContext,
        ...changes,
      },
    }));
  };

  const handleCommitAndStart = async () => {
    if (!selectedSession?.id || !selectedVehicle) {
      alert('Session or vehicle not found');
      return;
    }

    setIsSubmitting(true);
    try {
      // Update session in DB
      await updateSession(selectedSession.id, {
        track_context: config.trackContext as TrackContext,
        status: 'active',
      });

      // Update store - this triggers mode change via useEffect
      setIsLocked(true);
    } catch (error: any) {
      console.error('Error committing session:', error);
      alert(`Failed to start session: ${error.message || 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const vehicles = useMemo(
    () => (selectedVehicle ? [selectedVehicle] : ([] as Vehicle[])),
    [selectedVehicle]
  );

  // STANDBY VIEW: Show when no session or session is not active
  if (!selectedSession || selectedSession.status !== 'active') {
    return (
      <div className="w-full h-full bg-apex-dark text-white flex items-center justify-center p-8">
        <GlassCard>
          <div className="flex flex-col items-center justify-center p-12 space-y-6">
            {/* Icon */}
            <div className="text-6xl opacity-30">⚡</div>

            {/* Message */}
            <div className="text-center space-y-2">
              <div className="text-xl font-bold uppercase tracking-widest text-apex-red font-mono">
                NO ACTIVE SESSION DETECTED
              </div>
              <div className="text-sm text-gray-500">
                Configure and activate a session to access Race Control
              </div>
            </div>

            {/* Action Button */}
            <button
              onClick={() => {
                const params = new URLSearchParams(window.location.search);
                params.set('tab', 'strategy');
                window.history.replaceState(null, '', `?${params.toString()}`);
                router.refresh();
              }}
              className="px-8 py-3 bg-apex-blue text-white font-bold uppercase tracking-widest text-sm font-mono rounded hover:bg-apex-blue/90 transition-all shadow-lg shadow-apex-blue/30"
            >
              CONFIGURE STRATEGY
            </button>
          </div>
        </GlassCard>
      </div>
    );
  }

  // ============================================
  // BLUE MODE: SETUP STATE (Mockup v29)
  // ============================================
  if (mode === 'BLUE') {
    return (
      <div className="w-full min-h-screen bg-apex-dark text-white overflow-auto">
        <div className="flex h-full">
          {/* SIDEBAR: 360px Event Configuration */}
          <div className="w-[360px] bg-[#0d0d0f] border-r border-apex-border flex flex-col shrink-0">
            {/* Header */}
            <div className="px-6 py-4 border-b border-apex-border">
              <div className="flex items-center gap-2">
                <span className="text-apex-red font-mono text-base">◆</span>
                <h3 className="text-base uppercase font-bold tracking-widest text-apex-red font-mono">
                  Event Configuration
                </h3>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {/* Event Name */}
              <div>
                <label className="text-sm uppercase font-bold tracking-widest text-gray-600 block mb-2 font-mono">
                  Event Name
                </label>
                <input
                  type="text"
                  value={config.trackContext.name || ''}
                  onChange={(e) => handleTrackContextChange({ name: e.target.value })}
                  className="w-full px-3 py-2 bg-apex-dark border border-apex-border rounded text-white text-base font-mono focus:outline-none focus:border-apex-blue"
                  placeholder="SDRC FALL BRAWL"
                />
              </div>

              {/* Track Name */}
              <div>
                <label className="text-sm uppercase font-bold tracking-widest text-gray-600 block mb-2 font-mono">
                  Track Name
                </label>
                <input
                  type="text"
                  value={config.trackContext.surface || ''}
                  onChange={(e) => handleTrackContextChange({ surface: e.target.value })}
                  className="w-full px-3 py-2 bg-apex-dark border border-apex-border rounded text-white text-base font-mono focus:outline-none focus:border-apex-blue"
                  placeholder="SAN DIEGO RC RACEWAY"
                />
              </div>

              {/* Session Intent */}
              <div>
                <label className="text-sm uppercase font-bold tracking-widest text-gray-600 block mb-2 font-mono">
                  Session Intent
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {['PRACTICE', 'RACE'].map((intent) => (
                    <button
                      key={intent}
                      className={`px-2 py-1.5 rounded text-sm font-bold uppercase tracking-widest font-mono transition-all ${
                        config.mainEvents === intent.toLowerCase()
                          ? 'border border-apex-blue bg-apex-blue/10 text-white'
                          : 'border border-gray-600 bg-gray-900 text-gray-400 hover:border-apex-blue/50'
                      }`}
                    >
                      {intent}
                    </button>
                  ))}
                </div>
              </div>

              {/* Race Logic */}
              <div className="pt-4 border-t border-apex-border/50">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-sm uppercase font-bold tracking-widest text-gray-600 block mb-2 font-mono">
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
                      className="w-full px-2 py-2 bg-apex-dark border border-apex-border rounded text-white text-base font-mono focus:outline-none focus:border-apex-blue"
                    >
                      <option value={2}>2 Rounds</option>
                      <option value={3}>3 Rounds</option>
                      <option value={4}>4 Rounds</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm uppercase font-bold tracking-widest text-gray-600 block mb-2 font-mono">
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
                      className="w-full px-2 py-2 bg-apex-dark border border-apex-border rounded text-white text-base font-mono focus:outline-none focus:border-apex-blue"
                    >
                      <option value="single">Single Main</option>
                      <option value="triple">Triple Mains</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Class Registry (Simplified Vehicle Selector) */}
              <div className="pt-4 border-t border-apex-border/50">
                <label className="text-sm uppercase font-bold tracking-widest text-gray-600 block mb-2 font-mono">
                  Active Vehicle
                </label>
                <div className="bg-[#0a0a0b] border border-apex-border rounded p-3">
                  <div className="text-base font-bold text-white">
                    {selectedVehicle?.brand} {selectedVehicle?.model}
                  </div>
                  <div className="text-base text-gray-500 mt-1 font-mono">
                    TX: {selectedVehicle?.transponder || 'NONE'}
                  </div>
                </div>
              </div>
            </div>

            {/* Deploy Button */}
            <div className="px-6 py-4 border-t border-apex-border">
              <button
                onClick={handleCommitAndStart}
                disabled={isSubmitting || !selectedVehicle}
                className={`w-full py-3 font-bold uppercase tracking-widest text-base font-mono transition-all rounded ${
                  isSubmitting || !selectedVehicle
                    ? 'bg-apex-red/30 text-apex-red/60 cursor-not-allowed'
                    : 'bg-apex-red text-white hover:bg-apex-red/90 shadow-lg shadow-apex-red/30'
                }`}
              >
                {isSubmitting ? 'COMMITTING...' : 'COMMIT & START SESSION'}
              </button>
            </div>
          </div>

          {/* DESKTOP: Matrices & Live Data */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
            {/* Weather Ticker */}
            <GlassCard>
              <div className="px-6 py-3 flex gap-8 items-center font-mono text-base">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-apex-green rounded-full shadow-lg shadow-apex-green"></div>
                  <span className="text-sm uppercase font-bold text-gray-600">Live Atmos Sync:</span>
                </div>
                <div>
                  <span className="text-sm uppercase font-bold text-gray-600">Ambient:</span>
                  <span className="text-white ml-2 font-bold">74.2°F</span>
                </div>
                <div className="ml-auto">
                  <span className="text-sm uppercase font-bold text-gray-600">Source:</span>
                  <span className="text-white ml-2 font-bold">OPENWEATHERMAP</span>
                </div>
              </div>
            </GlassCard>

            {/* Track Context Matrix */}
            <div>
              <TrackContextMatrix
                onContextChange={handleTrackContextChange}
                isEditable={true}
                initialContext={config.trackContext}
              />
            </div>

            {/* Baseline Selector */}
            <GlassCard>
              <div className="flex items-center gap-2 mb-4 border-b border-apex-blue/20 pb-3 px-4 pt-4">
                <span className="text-apex-blue font-mono text-sm">◆</span>
                <h2 className="text-sm font-bold tracking-widest text-apex-blue font-mono uppercase">
                  Mechanical Baseline Selector
                </h2>
              </div>
              <div className="px-4 pb-4">
                <label className="text-sm uppercase font-bold tracking-widest text-gray-600 block mb-2 font-mono">
                  Initial Setup
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {['Master Baseline', 'Last Session'].map((option) => (
                    <button
                      key={option}
                      className="px-3 py-2 rounded text-sm font-bold uppercase tracking-widest font-mono border border-apex-blue bg-apex-blue/10 text-white hover:bg-apex-blue/20 transition-all"
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            </GlassCard>

            {/* Vehicle Technical Matrix */}
            <div>
              <VehicleTechnicalMatrix
                vehicles={vehicles}
                isEditable={true}
                selectedVehicleIds={selectedVehicle ? [selectedVehicle.id] : []}
              />
            </div>

            {/* Footer */}
            <div className="pt-6 border-t border-apex-border text-center text-sm text-gray-600 font-mono">
              <p>A.P.E.X. V3.1 // UNIFIED_RACE_CONTROL // [ MODE: SETUP ]</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // RED MODE: ACTIVE COCKPIT (Mockup v28)
  // ============================================
  return (
    <div className="w-full min-h-screen bg-apex-dark text-white overflow-auto">
      <div className="flex h-full">
        {/* SIDEBAR: 340px Race Registry */}
        <div className="w-[340px] bg-[#0d0d0f] border-r border-apex-border flex flex-col shrink-0">
          {/* Header */}
          <div className="px-6 py-4 border-b border-apex-border">
            <div className="flex items-center gap-2">
              <span className="text-apex-red font-mono text-sm">◆</span>
              <h3 className="text-sm uppercase font-bold tracking-widest text-apex-red font-mono">
                Race Registry
              </h3>
            </div>
          </div>

          {/* Registry Content */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
            {/* Active Vehicle Card */}
            <div className="bg-[#1a1a1c]/50 border border-apex-border rounded p-3">
              <div className="text-sm font-bold text-white mb-2">
                {selectedVehicle?.brand} {selectedVehicle?.model}
              </div>
              <div className="text-sm text-gray-500 font-mono">
                TX: {selectedVehicle?.transponder || 'NONE'}
              </div>
            </div>

            {/* Registry Logic Info */}
            <div className="bg-apex-red/5 border border-dashed border-apex-red/30 rounded p-3 mt-6">
              <div className="text-sm font-bold text-apex-red/70 uppercase tracking-widest mb-2">
                ◆ Registry Logic
              </div>
              <div className="text-sm text-gray-500 leading-relaxed">
                Only assigned vehicles are active. Session is locked and read-only during active racing.
              </div>
            </div>
          </div>

          {/* Commit Button (Disabled) */}
          <div className="px-6 py-4 border-t border-apex-border">
            <button
              disabled={true}
              className="w-full py-3 font-bold uppercase tracking-widest text-sm font-mono bg-apex-red/20 text-apex-red/50 cursor-not-allowed rounded"
            >
              SESSION ACTIVE
            </button>
          </div>
        </div>

        {/* DESKTOP: Main + Tactical Grid */}
        <div className="flex-1 overflow-hidden p-4 sm:p-6 lg:p-8">
          <div className="grid grid-cols-[1fr_380px] gap-6 h-full">
            {/* CENTER STACK */}
            <div className="flex flex-col gap-6 overflow-y-auto pr-2">
              {/* Tactical Header */}
              <TacticalHeader session={selectedSession} />

              {/* Operational Signals Row */}
              <div className="grid grid-cols-[1.2fr_1fr] gap-6">
                <GlassCard>
                  <div className="px-4 pt-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-apex-red font-mono text-sm">◆</span>
                      <h3 className="text-sm font-bold tracking-widest text-apex-red font-mono uppercase">
                        Operational Signals
                      </h3>
                    </div>
                  </div>
                  <div className="px-4 pb-4">
                    <div className="bg-apex-red/10 border-l-3 border-apex-red rounded p-3">
                      <div className="text-sm font-bold text-white">Tire Fatigue Warning</div>
                      <div className="text-[11px] text-gray-400 mt-2">
                        Tires reaching thermal peak. Monitor drift.
                      </div>
                    </div>
                  </div>
                </GlassCard>

                <GlassCard>
                  <div className="px-4 pt-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-apex-red font-mono text-sm">◆</span>
                      <h3 className="text-sm font-bold tracking-widest text-apex-red font-mono uppercase">
                        Performance Analytics
                      </h3>
                    </div>
                  </div>
                  <div className="px-4 pb-4">
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <div className="text-[11px] font-bold uppercase text-gray-600 mb-2">Best Lap</div>
                        <div className="font-mono text-2xl font-black text-gray-500">---.---</div>
                      </div>
                      <div>
                        <div className="text-[11px] font-bold uppercase text-gray-600 mb-2">Consistency</div>
                        <div className="font-mono text-2xl font-black text-gray-600">00.0%</div>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              </div>

              {/* Track Context Matrix (Compact) */}
              <GlassCard>
                <div className="px-4 pt-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-apex-red font-mono text-sm">◆</span>
                      <h3 className="text-sm font-bold tracking-widest text-apex-red font-mono uppercase">
                        Track Context Matrix
                      </h3>
                    </div>
                    <div className="text-sm text-gray-600 font-mono space-x-6">
                      <span>TRACK_TEMP: 102.4°F</span>
                      <span>HUMIDITY: 12.4%</span>
                    </div>
                  </div>
                </div>
                <div className="px-4 pb-4">
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { label: 'Track Scale', value: 'Med' },
                      { label: 'Grip Level', value: 'Med' },
                      { label: 'Material', value: 'Clay' },
                      { label: 'Condition', value: 'Damp' },
                    ].map((item) => (
                      <div key={item.label} className="border border-apex-border rounded p-2">
                        <div className="text-[11px] uppercase font-bold text-gray-600 mb-2">{item.label}</div>
                        <div className="text-sm font-bold text-white text-center">{item.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </GlassCard>

              {/* Fleet Matrix */}
              <GlassCard className="flex-1">
                <div className="px-4 pt-4 pb-3 border-b border-apex-border flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-apex-red font-mono text-sm">◆</span>
                    <h3 className="text-sm font-bold tracking-widest text-apex-red font-mono uppercase">
                      Active Fleet Matrix
                    </h3>
                  </div>
                  <div className="text-[11px] text-apex-green font-bold">● AUTO-PERSISTENCE: ENABLED</div>
                </div>
                <div className="overflow-y-auto">
                  <VehicleTechnicalMatrix
                    vehicles={vehicles}
                    isEditable={false}
                    selectedVehicleIds={selectedVehicle ? [selectedVehicle.id] : []}
                  />
                </div>
              </GlassCard>
            </div>

            {/* TACTICAL HUB: 380px Right Panel */}
            <GlassCard className="flex flex-col overflow-hidden">
              <div className="px-4 pt-4 pb-3 border-b border-apex-border">
                <div className="flex items-center gap-2">
                  <span className="text-apex-red font-mono text-sm">◆</span>
                  <h3 className="text-sm font-bold tracking-widest text-apex-red font-mono uppercase">
                    Tactical Hub
                  </h3>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                {/* Institutional Memory */}
                <div>
                  <div className="text-[11px] font-bold uppercase text-gray-600 mb-2">Institutional Memory</div>
                  <div className="text-sm text-gray-400 italic leading-relaxed">
                    {/* TODO: Phase 6 - Semantic search across past session notes */}
                    &ldquo;SDRC Fall Brawl note: Center diff overheating caused handling fade after 8min.&rdquo;
                  </div>
                </div>

                {/* Active Pit Notes */}
                <div className="flex-1 flex flex-col min-h-[200px]">
                  <div className="text-[11px] font-bold uppercase text-gray-600 mb-2">Active Pit Notes</div>
                  <textarea
                    value={config.pitNotes}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        pitNotes: e.target.value,
                      }))
                    }
                    placeholder="CAPTURING REAL-TIME THOUGHTS..."
                    className="flex-1 bg-black/50 border border-apex-border rounded p-3 text-white text-sm font-mono focus:outline-none focus:border-apex-blue resize-none"
                  />
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
    </div>
  );
}
