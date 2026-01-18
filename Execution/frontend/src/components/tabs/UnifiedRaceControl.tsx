'use client';

import { useState } from 'react';
import { useMissionControlStore } from '@/stores/missionControlStore';

type RaceMode = 'BLUE' | 'RED';

export default function UnifiedRaceControl() {
  const { selectedSession, isLocked } = useMissionControlStore();
  const [mode, setMode] = useState<RaceMode>(isLocked ? 'RED' : 'BLUE');

  return (
    <div className="w-full h-screen bg-apex-dark text-white overflow-auto">
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        {/* PLACEHOLDER - Tab 2 Coming Soon */}
        <div className="flex flex-col items-center justify-center h-96">
          <h2 className="text-2xl font-bold text-apex-blue mb-4 uppercase tracking-wide">
            Unified Race Control
          </h2>
          <p className="text-gray-400 mb-4">
            Stage 2: Frontend Framework Implementation
          </p>
          <div className="text-center text-sm text-gray-500 space-y-2">
            <p>Mode: {mode}</p>
            <p className="mt-4 text-xs">
              Combining Track Context Matrix (16 params)<br />
              + Vehicle Technical Matrix (9 points)<br />
              + State machine: BLUE (setup) ↔ RED (active)
            </p>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-apex-border text-center text-xs text-gray-600">
          <p>🤖 Powered by A.P.E.X. V3 | Building Phase 4...</p>
        </div>
      </div>
    </div>
  );
}
