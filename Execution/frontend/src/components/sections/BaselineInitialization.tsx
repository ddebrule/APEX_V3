'use client';

import { useState } from 'react';
import GlassCard from '@/components/common/GlassCard';
import SessionLockSlider from '@/components/common/SessionLockSlider';
import { useMissionControlStore } from '@/stores/missionControlStore';
import { createSession } from '@/lib/queries';
import type { TrackContext, SessionType } from '@/types/database';

export default function BaselineInitialization() {
  const {
    selectedRacer,
    selectedVehicle,
    isReadyToLock,
    setSelectedSession,
    setIsLocked,
  } = useMissionControlStore();

  const [eventName, setEventName] = useState('');
  const [sessionType, setSessionType] = useState<SessionType>('practice');
  const [trackName, setTrackName] = useState('');
  const [isInitiating, setIsInitiating] = useState(false);

  const handleInitializeSession = async () => {
    if (!isReadyToLock() || !selectedRacer || !selectedVehicle || !eventName || !trackName) {
      return;
    }

    setIsInitiating(true);

    try {
      const trackContext: TrackContext = {
        name: trackName,
        surface: 'clay',
        traction: 'medium',
        temperature: null,
      };

      const session = await createSession({
        profile_id: selectedRacer.id,
        vehicle_id: selectedVehicle.id,
        event_name: eventName,
        session_type: sessionType,
        track_context: trackContext,
        actual_setup: selectedVehicle.baseline_setup,
        status: 'active',
      });

      if (session) {
        setSelectedSession(session);
        setIsLocked(true);
      }
    } catch (error) {
      console.error('Failed to initialize session:', error);
    } finally {
      setIsInitiating(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Baseline Configuration */}
      <GlassCard>
        <div className="flex items-center gap-2 mb-4 border-b border-apex-border/40 pb-3">
          <span className="text-amber-400 font-mono text-xs">◆</span>
          <h2 className="header-uppercase text-sm font-bold tracking-widest text-amber-400">
            Baseline Configuration
          </h2>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-[9px] uppercase tracking-widest text-gray-500 block mb-1.5 font-mono">
              › EVENT NAME
            </label>
            <input
              type="text"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              placeholder="SDRC Fall Brawl"
              className="w-full px-2 py-2 bg-apex-dark border border-apex-border/50 rounded text-white text-xs focus:outline-none focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/20 font-mono transition-all"
            />
          </div>

          <div>
            <label className="text-[9px] uppercase tracking-widest text-gray-500 block mb-1.5 font-mono">
              › TRACK NAME
            </label>
            <input
              type="text"
              value={trackName}
              onChange={(e) => setTrackName(e.target.value)}
              placeholder="SDRC Raceway"
              className="w-full px-2 py-2 bg-apex-dark border border-apex-border/50 rounded text-white text-xs focus:outline-none focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/20 font-mono transition-all"
            />
          </div>

          <div>
            <label className="text-[9px] uppercase tracking-widest text-gray-500 block mb-1.5 font-mono">
              › SESSION TYPE
            </label>
            <select
              value={sessionType}
              onChange={(e) => setSessionType(e.target.value as SessionType)}
              className="w-full px-2 py-2 bg-apex-dark border border-apex-border/50 rounded text-white text-xs focus:outline-none focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/20 font-mono transition-all appearance-none"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23fbbf24' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 8px center',
                paddingRight: '24px',
              }}
            >
              <option value="practice">Practice</option>
              <option value="qualifier">Qualifier</option>
              <option value="main">Main</option>
            </select>
          </div>

          {selectedVehicle && (
            <div className="pt-2 border-t border-apex-border/20">
              <div className="flex justify-between items-center">
                <span className="text-[9px] uppercase tracking-widest text-gray-600 font-mono">Ready:</span>
                <span className="text-[9px] text-apex-green font-mono">✓ YES</span>
              </div>
            </div>
          )}
        </div>
      </GlassCard>

      {/* Session Control */}
      <GlassCard>
        <div className="flex items-center gap-2 mb-4 border-b border-apex-border/40 pb-3">
          <span className="text-apex-green font-mono text-xs">◆</span>
          <h2 className="header-uppercase text-sm font-bold tracking-widest text-apex-green">
            Session Control
          </h2>
        </div>
        <div className="space-y-4">
          {/* Slider */}
          <SessionLockSlider
            onDeploy={handleInitializeSession}
            disabled={!isReadyToLock()}
            isLoading={isInitiating}
          />

          {/* Prep PDF Button */}
          <button
            className="w-full py-2 border border-apex-blue/50 hover:border-apex-blue text-apex-blue hover:bg-apex-blue/5 text-xs font-bold uppercase tracking-widest rounded transition-all duration-200 font-mono"
          >
            [ ] Prep PDF Checklist
          </button>

          {/* Status */}
          <div className="pt-2 border-t border-apex-border/20">
            <div className="flex justify-between items-center">
              <span className="text-[9px] uppercase tracking-widest text-gray-600 font-mono">STATUS:</span>
              <span
                className={`text-[9px] font-mono font-bold ${
                  isReadyToLock() ? 'text-apex-green' : 'text-gray-500'
                }`}
              >
                {isReadyToLock() ? '◆ READY' : '◯ CONFIG PENDING'}
              </span>
            </div>
            <div className="flex justify-between items-center mt-1">
              <span className="text-[9px] uppercase tracking-widest text-gray-600 font-mono">LOCK:</span>
              <span className={`text-[9px] font-mono ${isInitiating ? 'text-amber-400' : 'text-gray-500'}`}>
                {isInitiating ? '⟳ INITIALIZING' : '◯ STANDBY'}
              </span>
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
