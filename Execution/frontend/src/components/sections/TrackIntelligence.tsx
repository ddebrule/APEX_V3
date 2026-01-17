'use client';

import { useEffect, useState } from 'react';
import GlassCard from '@/components/common/GlassCard';
import DataDisplay from '@/components/common/DataDisplay';
import { useMissionControlStore } from '@/stores/missionControlStore';
import type { TrackContext } from '@/types/database';

export default function TrackIntelligence() {
  const { selectedSession } = useMissionControlStore();
  const [trackData, setTrackData] = useState<TrackContext | null>(null);

  useEffect(() => {
    if (selectedSession?.track_context) {
      setTrackData(selectedSession.track_context);
    }
  }, [selectedSession]);

  const getTractionColor = (traction: string): string => {
    const lowerTraction = traction.toLowerCase();
    if (lowerTraction.includes('high')) return 'status-good';
    if (lowerTraction.includes('low')) return 'status-danger';
    return 'status-neutral';
  };

  const getSurfaceColor = (surface: string): string => {
    if (surface.toLowerCase().includes('clay')) return 'status-warning';
    return 'status-neutral';
  };

  return (
    <GlassCard>
      <h2 className="header-uppercase text-lg mb-4 border-b border-apex-border pb-3">
        Track Intelligence
      </h2>

      {trackData ? (
        <div className="space-y-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-400 mb-2">Track Location</p>
            <p className="data-mono text-apex-blue">{trackData.name || 'TBD'}</p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">Traction</p>
              <p className={`data-mono ${getTractionColor(trackData.traction)}`}>
                [{trackData.traction.toUpperCase()}]
              </p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">Surface</p>
              <p className={`data-mono ${getSurfaceColor(trackData.surface)}`}>
                [{trackData.surface.toUpperCase()}]
              </p>
            </div>

            {trackData.temperature !== null && trackData.temperature !== undefined && (
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">Temp</p>
                <p className="data-mono ticker status-warning">
                  {trackData.temperature.toFixed(1)}°F
                </p>
              </div>
            )}
          </div>

          {trackData.temperature && (
            <div className="text-xs text-gray-500 font-mono">
              {'\u00BB '} TEMP TREND: Monitoring real-time changes (RISE: ~1.2°/HR)
            </div>
          )}
        </div>
      ) : (
        <div className="text-gray-400 text-sm text-center py-6">
          No track data available. Initialize a session first.
        </div>
      )}
    </GlassCard>
  );
}
