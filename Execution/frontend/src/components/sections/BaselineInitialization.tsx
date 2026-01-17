'use client';

import { useState } from 'react';
import GlassCard from '@/components/common/GlassCard';
import DataDisplay from '@/components/common/DataDisplay';
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
      alert('Please fill in all required fields');
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
      alert('Failed to initialize session');
    } finally {
      setIsInitiating(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Configuration */}
      <GlassCard>
        <h2 className="header-uppercase text-lg mb-4 border-b border-apex-border pb-3">
          Baseline Configuration
        </h2>
        <div className="space-y-4">
          <div>
            <label className="text-xs uppercase tracking-wide text-gray-400 block mb-2">
              Event Name
            </label>
            <input
              type="text"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              placeholder="e.g., SDRC Fall Brawl"
              className="w-full px-3 py-2 bg-apex-dark border border-apex-border rounded text-white text-sm focus:outline-none focus:border-apex-blue"
            />
          </div>

          <div>
            <label className="text-xs uppercase tracking-wide text-gray-400 block mb-2">
              Track Name
            </label>
            <input
              type="text"
              value={trackName}
              onChange={(e) => setTrackName(e.target.value)}
              placeholder="e.g., SDRC Raceway"
              className="w-full px-3 py-2 bg-apex-dark border border-apex-border rounded text-white text-sm focus:outline-none focus:border-apex-blue"
            />
          </div>

          <div>
            <label className="text-xs uppercase tracking-wide text-gray-400 block mb-2">
              Session Type
            </label>
            <select
              value={sessionType}
              onChange={(e) => setSessionType(e.target.value as SessionType)}
              className="w-full px-3 py-2 bg-apex-dark border border-apex-border rounded text-white text-sm focus:outline-none focus:border-apex-blue"
            >
              <option value="practice">Practice</option>
              <option value="qualifier">Qualifier</option>
              <option value="main">Main</option>
            </select>
          </div>

          {selectedVehicle && (
            <DataDisplay label="Shop Master Ready" value="YES" mono />
          )}
        </div>
      </GlassCard>

      {/* Actions */}
      <GlassCard>
        <h2 className="header-uppercase text-lg mb-4 border-b border-apex-border pb-3">
          Session Control
        </h2>
        <div className="space-y-3">
          <button
            onClick={handleInitializeSession}
            disabled={!isReadyToLock() || isInitiating}
            className="w-full py-3 bg-apex-blue hover:bg-blue-600 disabled:bg-gray-700 disabled:opacity-50 text-white font-bold uppercase tracking-wide rounded transition-all duration-200 flex items-center justify-center gap-2"
          >
            {isInitiating ? '⟳ INITIALIZING...' : '⊳ INIT RACING SESSION'}
          </button>

          <button
            className="w-full py-2 border border-apex-green hover:bg-apex-green/10 text-apex-green font-bold uppercase tracking-wide text-sm rounded transition-all duration-200"
          >
            📋 PREP PDF CHECKLIST
          </button>

          <div className="text-xs text-gray-500 mt-4 pt-4 border-t border-apex-border">
            <p>Status: {isReadyToLock() ? '✓ READY TO LOCK' : '○ AWAITING CONFIG'}</p>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
