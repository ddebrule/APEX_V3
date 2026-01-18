'use client';

import { useMissionControlStore } from '@/stores/missionControlStore';

export default function AIAdvisor() {
  const { selectedSession } = useMissionControlStore();

  return (
    <div className="w-full h-screen bg-apex-dark text-white overflow-auto">
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        {/* PLACEHOLDER - Tab 3 Coming Soon */}
        <div className="flex flex-col items-center justify-center h-96">
          <h2 className="text-2xl font-bold text-apex-green mb-4 uppercase tracking-wide">
            AI Advisor
          </h2>
          <p className="text-gray-400 mb-4">
            Command Chat Interface with Voice Input
          </p>
          <div className="text-center text-sm text-gray-500 space-y-2">
            <p>Building high-density chat interface</p>
            <p className="mt-4 text-xs">
              ◆ AI Avatar (Red) vs User Avatar (Dark)<br />
              ◆ Voice input with GREEN (#4CAF50) glow<br />
              ◆ Persistent context deck sidebar<br />
              ◆ Tactical directives right rail
            </p>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-apex-border text-center text-xs text-gray-600">
          <p>🤖 Powered by A.P.E.X. V3 | Reusing Socratic Loop + Chat Components...</p>
        </div>
      </div>
    </div>
  );
}
