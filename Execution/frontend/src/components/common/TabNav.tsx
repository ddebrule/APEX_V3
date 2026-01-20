'use client';

import { useState, useEffect } from 'react';
import RacerGarage from '@/components/tabs/RacerGarage';
import RaceStrategy from '@/components/tabs/RaceStrategy';
import RaceControl from '@/components/tabs/RaceControl';
import AIAdvisor from '@/components/tabs/AIAdvisor';
import PerformanceAudit from '@/components/tabs/PerformanceAudit';
import TheVault from '@/components/tabs/TheVault';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import { useMissionControlStore } from '@/stores/missionControlStore';

type Tab = 'garage' | 'strategy' | 'control' | 'advisor' | 'audit' | 'vault';

const TABS: { id: Tab; label: string; icon: string; disabledWhen?: (isSessionActive: boolean) => boolean }[] = [
  { id: 'garage', label: 'Garage', icon: '🏠' },
  { id: 'strategy', label: 'Strategy', icon: '📋' },
  { id: 'control', label: 'Control', icon: '⚡', disabledWhen: (active) => !active },
  { id: 'advisor', label: 'Advisor', icon: '🤖' },
  { id: 'audit', label: 'Audit', icon: '📊' },
  { id: 'vault', label: 'Vault', icon: '📚' },
];

export default function TabNav() {
  const [activeTab, setActiveTab] = useState<Tab>('garage');
  const { sessionStatus } = useMissionControlStore();
  const isSessionActive = sessionStatus === 'active';

  // Load tab from URL query parameter
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab') as Tab | null;
    if (tabParam && TABS.find(t => t.id === tabParam)) {
      setActiveTab(tabParam);
    }
  }, []);

  // Update URL when tab changes
  const handleTabChange = (tabId: Tab) => {
    setActiveTab(tabId);
    const params = new URLSearchParams(window.location.search);
    params.set('tab', tabId);
    window.history.replaceState(null, '', `?${params.toString()}`);
  };

  const renderTabContent = (tabId: Tab) => {
    switch (tabId) {
      case 'garage':
        return <ErrorBoundary><RacerGarage /></ErrorBoundary>;
      case 'strategy':
        return <ErrorBoundary><RaceStrategy /></ErrorBoundary>;
      case 'control':
        return <ErrorBoundary><RaceControl /></ErrorBoundary>;
      case 'advisor':
        return <ErrorBoundary><AIAdvisor /></ErrorBoundary>;
      case 'audit':
        return <ErrorBoundary><PerformanceAudit /></ErrorBoundary>;
      case 'vault':
        return <ErrorBoundary><TheVault /></ErrorBoundary>;
      default:
        return null;
    }
  };

  return (
    <div className="w-full h-screen bg-apex-dark text-white flex flex-col">
      {/* TAB NAVIGATION */}
      <div className="flex items-center gap-0 border-b border-apex-border px-6 bg-apex-surface bg-opacity-50">
        {TABS.map(tab => {
          const isDisabled = tab.disabledWhen?.(isSessionActive) ?? false;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => !isDisabled && handleTabChange(tab.id)}
              disabled={isDisabled}
              className={`px-6 py-4 text-sm font-semibold uppercase tracking-wide transition-all border-b-2 flex items-center gap-2 ${
                isActive
                  ? 'text-apex-green border-apex-green'
                  : isDisabled
                    ? 'text-gray-600 border-transparent cursor-not-allowed opacity-50'
                    : 'text-gray-400 border-transparent hover:text-gray-300'
              }`}
              title={isDisabled ? 'Lock session in Strategy to enable' : ''}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT */}
      <div className="tab-content flex-1 overflow-auto">
        {renderTabContent(activeTab)}
      </div>
    </div>
  );
}
