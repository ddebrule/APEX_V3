'use client';

import { useState } from 'react';
import MissionControl from '@/components/tabs/MissionControl';
import AdvisorTab from '@/components/tabs/AdvisorTab';

type Tab = 'mission-control' | 'advisor' | 'battery' | 'signal' | 'sync';

export default function TabNav() {
  const [activeTab, setActiveTab] = useState<Tab>('mission-control');

  const tabs: { id: Tab; label: string; component: React.ReactNode }[] = [
    { id: 'mission-control', label: 'Mission Control', component: <MissionControl /> },
    { id: 'advisor', label: 'Setup Advisor', component: <AdvisorTab /> },
    { id: 'battery', label: 'Battery', component: <div className="p-8 text-gray-400">Battery tab coming soon</div> },
    { id: 'signal', label: 'Signal', component: <div className="p-8 text-gray-400">Signal tab coming soon</div> },
    { id: 'sync', label: 'Sync', component: <div className="p-8 text-gray-400">Sync tab coming soon</div> },
  ];

  return (
    <div className="w-full h-screen bg-apex-dark text-white flex flex-col">
      {/* TAB NAVIGATION */}
      <div className="flex items-center gap-0 border-b border-apex-border px-6 bg-apex-surface bg-opacity-50">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-4 text-sm font-semibold uppercase tracking-wide transition-all border-b-2 ${
              activeTab === tab.id
                ? 'text-apex-green border-apex-green'
                : 'text-gray-400 border-transparent hover:text-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB CONTENT */}
      <div className="flex-1 overflow-auto">
        {tabs.find(tab => tab.id === activeTab)?.component}
      </div>
    </div>
  );
}
