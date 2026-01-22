'use client';

import { useState, useEffect } from 'react';
import { insertSetupChange } from '@/lib/queries';

interface SetupChange {
  id: string;
  type: string;                // e.g., "Shock Oil", "Sway Bar"
  position: string;             // e.g., "Front", "Rear"
  currentValue: string;
  proposedValue: string;
  checked: boolean;
  executed: boolean;
  timestamp?: string;
}

interface LiveClipboardProps {
  vehicleId: string;
  sessionId: string;
  watchPoints?: string[];      // Top 3 watch-points from AI
}

export default function LiveClipboard({ vehicleId, sessionId, watchPoints }: LiveClipboardProps) {
  const [setupChanges, setSetupChanges] = useState<SetupChange[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Handle checkbox toggle
  const handleCheckChange = async (id: string) => {
    const change = setupChanges.find(c => c.id === id);
    if (!change) return;

    setIsLoading(true);
    try {
      // Insert to database
      await insertSetupChange({
        session_id: sessionId,
        parameter: `${change.position} ${change.type}`,
        old_value: change.currentValue,
        new_value: change.proposedValue,
        ai_reasoning: `Live clipboard recommendation for ${change.position} ${change.type}`,
        status: 'pending'
      });

      // Update local state
      setSetupChanges(changes =>
        changes.map(c =>
          c.id === id
            ? { ...c, checked: !c.checked, executed: !c.checked }
            : c
        )
      );
    } catch (err) {
      console.error('Failed to insert setup change:', err);
      alert('Failed to record setup change. Check console.');
    } finally {
      setIsLoading(false);
    }
  };

  // Parse AI recommendations into setup changes
  const addSetupChange = (type: string, position: string, currentValue: string, proposedValue: string) => {
    const newChange: SetupChange = {
      id: `${Date.now()}-${Math.random()}`,
      type,
      position,
      currentValue,
      proposedValue,
      checked: false,
      executed: false,
      timestamp: new Date().toLocaleTimeString()
    };
    setSetupChanges([...setupChanges, newChange]);
  };

  // Expose addSetupChange for parent integration
  useEffect(() => {
    // This will be called by AIAdvisor to push recommendations
    (window as any).__addSetupChange = addSetupChange;
  }, []);

  const allApplied = setupChanges.length > 0 && setupChanges.every(c => c.executed);

  return (
    <div className="w-72 bg-apex-surface/30 border-l border-apex-border flex flex-col p-5 overflow-y-auto">
      {/* HEADER */}
      <div className="text-[9px] uppercase font-bold tracking-widest text-apex-green mb-4 font-mono">
        ◆ Live Clipboard
      </div>

      {/* SETUP CHANGES TABLE */}
      {setupChanges.length > 0 ? (
        <div className="flex-1 space-y-3 mb-4 overflow-y-auto">
          <div className="text-[8px] font-mono text-gray-600 uppercase tracking-widest mb-2">
            Recommended Changes
          </div>

          {/* Monospaced table header */}
          <div className="bg-black/30 p-2 border border-apex-border/30 rounded text-[8px] font-mono text-gray-600">
            <div className="grid grid-cols-[30px_60px_60px_60px_1fr] gap-1">
              <div className="text-center">✓</div>
              <div>PARAM</div>
              <div>CURRENT</div>
              <div>PROPOSED</div>
              <div>STATUS</div>
            </div>
          </div>

          {/* Table rows */}
          {setupChanges.map((change) => (
            <div
              key={change.id}
              className={`bg-black/50 p-2 border rounded transition-all font-mono text-[8px] ${
                change.executed
                  ? 'border-apex-green/50 bg-apex-green/5'
                  : 'border-apex-border/30 hover:border-apex-blue/50'
              }`}
            >
              <div className="grid grid-cols-[30px_60px_60px_60px_1fr] gap-1 items-center">
                <input
                  type="checkbox"
                  checked={change.checked}
                  onChange={() => handleCheckChange(change.id)}
                  disabled={isLoading || change.executed}
                  className="w-4 h-4 cursor-pointer"
                />
                <div className="text-gray-400 truncate">
                  {change.position} {change.type}
                </div>
                <div className="text-gray-500 truncate">{change.currentValue}</div>
                <div className="text-apex-blue font-bold truncate">{change.proposedValue}</div>
                <div className={`text-right ${change.executed ? 'text-apex-green' : 'text-gray-600'}`}>
                  {change.executed ? '✓ DONE' : 'PENDING'}
                </div>
              </div>
              {change.timestamp && (
                <div className="text-[7px] text-gray-700 mt-1 text-right">
                  {change.timestamp}
                </div>
              )}
            </div>
          ))}

          {/* Summary */}
          {allApplied && (
            <div className="bg-apex-green/10 border border-apex-green/50 p-2 rounded text-[8px] text-apex-green font-bold text-center">
              ALL CHANGES APPLIED ✓
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center mb-4">
          <div className="text-center">
            <div className="text-[10px] text-gray-600 font-mono">No recommendations</div>
            <div className="text-[8px] text-gray-700 mt-1">Ask AI for setup advice</div>
          </div>
        </div>
      )}

      {/* DIVIDER */}
      {setupChanges.length > 0 && watchPoints && watchPoints.length > 0 && (
        <div className="border-t border-apex-border/30 my-3"></div>
      )}

      {/* TOP 3 WATCH-POINTS (PERSISTENT FOOTER) */}
      {watchPoints && watchPoints.length > 0 && (
        <div className="border-t border-apex-border/30 pt-3">
          <div className="text-[9px] uppercase font-bold tracking-widest text-apex-green mb-2 font-mono">
            ◆ Keep An Eye On
          </div>
          <div className="space-y-2">
            {watchPoints.map((point, idx) => (
              <div
                key={idx}
                className="bg-black/30 p-2 rounded border border-apex-border/20 text-[8px] text-gray-400 font-mono"
              >
                <span className="text-apex-blue font-bold">({idx + 1})</span> {point}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* NEURAL LINK STATUS */}
      <div className="mt-auto pt-3 border-t border-apex-border/30">
        <div className="flex items-center gap-2 text-[8px] font-mono text-gray-600">
          <div className={`w-2 h-2 rounded-full ${setupChanges.length > 0 ? 'bg-apex-green' : 'bg-gray-700'} animate-pulse`} />
          <span>LIVE_LINK</span>
        </div>
        <div className="text-[7px] text-gray-700 mt-1">{setupChanges.length} change(s) in queue</div>
      </div>
    </div>
  );
}
