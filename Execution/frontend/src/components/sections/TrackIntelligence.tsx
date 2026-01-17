'use client';

import { useEffect, useState } from 'react';
import GlassCard from '@/components/common/GlassCard';
import { useMissionControlStore } from '@/stores/missionControlStore';
import type { TrackContext } from '@/types/database';

export default function TrackIntelligence() {
  const { selectedSession } = useMissionControlStore();
  const [trackData, setTrackData] = useState<TrackContext | null>(null);
  const [tickerMessages, setTickerMessages] = useState<string[]>([]);
  const [currentTickerIndex, setCurrentTickerIndex] = useState(0);

  useEffect(() => {
    if (selectedSession?.track_context) {
      setTrackData(selectedSession.track_context);
    }
  }, [selectedSession]);

  // Generate ticker messages based on track data
  useEffect(() => {
    if (trackData) {
      const messages = [];
      if (trackData.temperature) {
        messages.push(`TEMP: ${trackData.temperature.toFixed(1)}°F | TREND: +1.2°/HR`);
        messages.push(`TRACTION: ${trackData.traction.toUpperCase()} | GRIP: MONITORING`);
        messages.push(`SURFACE: ${trackData.surface.toUpperCase()} | CONDITIONS: STABLE`);
      }
      setTickerMessages(messages.length > 0 ? messages : ['NO LIVE DATA | INITIALIZING SENSORS']);
    }
  }, [trackData]);

  // Rotate ticker messages
  useEffect(() => {
    if (tickerMessages.length === 0) return;
    const interval = setInterval(() => {
      setCurrentTickerIndex((prev) => (prev + 1) % tickerMessages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [tickerMessages]);

  const getTractionColor = (traction: string): string => {
    const lowerTraction = traction.toLowerCase();
    if (lowerTraction.includes('high')) return 'text-apex-green';
    if (lowerTraction.includes('low')) return 'text-apex-red';
    return 'text-gray-300';
  };

  const getSurfaceColor = (surface: string): string => {
    if (surface.toLowerCase().includes('clay')) return 'text-amber-400';
    return 'text-gray-300';
  };

  return (
    <GlassCard>
      <div className="flex items-center gap-2 mb-4 border-b border-apex-blue/20 pb-3">
        <span className="text-apex-blue font-mono text-xs">◆</span>
        <h2 className="header-uppercase text-sm font-bold tracking-widest text-apex-blue">
          Track Intelligence
        </h2>
      </div>

      {trackData ? (
        <div className="space-y-4">
          {/* Track Name */}
          <div>
            <p className="text-[9px] uppercase tracking-widest text-gray-600 block mb-2 font-mono">Track:</p>
            <p className="data-mono text-apex-blue font-mono text-xs">{trackData.name || 'TBD'}</p>
          </div>

          {/* Live Data Grid */}
          <div className="grid grid-cols-3 gap-2">
            <div className="border border-apex-border/30 rounded p-2">
              <p className="text-[8px] uppercase tracking-widest text-gray-600 mb-1 font-mono">Traction</p>
              <p className={`data-mono text-xs font-mono font-bold ${getTractionColor(trackData.traction)}`}>
                [{trackData.traction.toUpperCase()}]
              </p>
            </div>

            <div className="border border-apex-border/30 rounded p-2">
              <p className="text-[8px] uppercase tracking-widest text-gray-600 mb-1 font-mono">Surface</p>
              <p className={`data-mono text-xs font-mono font-bold ${getSurfaceColor(trackData.surface)}`}>
                [{trackData.surface.toUpperCase()}]
              </p>
            </div>

            {trackData.temperature !== null && trackData.temperature !== undefined && (
              <div className="border border-apex-border/30 rounded p-2 bg-amber-400/5">
                <p className="text-[8px] uppercase tracking-widest text-gray-600 mb-1 font-mono">Temp</p>
                <p className="data-mono text-xs font-mono font-bold text-amber-400 animate-pulse">
                  {trackData.temperature.toFixed(1)}°F
                </p>
              </div>
            )}
          </div>

          {/* Live Data Ticker */}
          <div className="border border-apex-blue/30 bg-apex-blue/5 rounded p-2 overflow-hidden">
            <div className="flex items-center gap-2">
              <span className="text-[7px] font-mono text-apex-blue font-bold whitespace-nowrap">LIVE:</span>
              <div className="flex-1 overflow-hidden">
                <div
                  className="text-[9px] font-mono text-gray-300 whitespace-nowrap transition-opacity duration-500"
                  style={{
                    opacity: currentTickerIndex === tickerMessages.length - 1 ? 0.5 : 1,
                  }}
                >
                  {'\u00BB '} {tickerMessages[currentTickerIndex]}
                </div>
              </div>
            </div>
          </div>

          {/* Temp Trend Indicator */}
          {trackData.temperature && (
            <div className="flex items-center gap-2 text-[9px] text-gray-500 font-mono border-t border-apex-border/20 pt-2">
              <span className="text-amber-400">⚡</span>
              <span>{'\u00BB '} TEMP TREND: +1.2°/HR | FORECAST: CONTINUE MONITORING</span>
            </div>
          )}
        </div>
      ) : (
        <div className="text-gray-400 text-sm text-center py-6 font-mono">
          <p className="text-[9px]">○ NO TRACK DATA</p>
          <p className="text-[8px] text-gray-600 mt-1">Initialize a session to begin monitoring</p>
        </div>
      )}
    </GlassCard>
  );
}
