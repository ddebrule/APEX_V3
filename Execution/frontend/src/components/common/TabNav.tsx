'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import RacerGarage from '@/components/tabs/RacerGarage';
import RaceStrategy from '@/components/tabs/RaceStrategy';
import UnifiedRaceControl from '@/components/tabs/UnifiedRaceControl';
import AIAdvisor from '@/components/tabs/AIAdvisor';
import PerformanceAudit from '@/components/tabs/PerformanceAudit';
import TheVault from '@/components/tabs/TheVault';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import { useMissionControlStore } from '@/stores/missionControlStore';
import { getCurrentProfile, signOut } from '@/lib/auth';
import type { RacerProfile } from '@/lib/auth';

type Tab = 'garage' | 'strategy' | 'control' | 'advisor' | 'audit' | 'vault';

const TABS: { id: Tab; label: string; icon: string; disabledWhen?: (isSessionActive: boolean) => boolean }[] = [
  { id: 'garage', label: 'RACER GARAGE', icon: '🏠' },
  { id: 'strategy', label: 'RACE STRATEGY', icon: '📋' },
  { id: 'advisor', label: 'SETUP_IQ', icon: '🤖' },
  { id: 'control', label: 'RACE CONTROL', icon: '⚡', disabledWhen: (active) => !active },
  { id: 'audit', label: 'DATA & ANALYSIS', icon: '📊' },
  { id: 'vault', label: 'THE VAULT', icon: '📚' },
];

export default function TabNav() {
  const [activeTab, setActiveTab] = useState<Tab>('garage');
  const [profile, setProfile] = useState<RacerProfile | null>(null);
  const { sessionStatus } = useMissionControlStore();
  const isSessionActive = sessionStatus === 'active';
  const router = useRouter();

  // Load user profile
  useEffect(() => {
    getCurrentProfile().then(setProfile);
  }, []);

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
        return <ErrorBoundary><UnifiedRaceControl /></ErrorBoundary>;
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

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <div className="w-full h-screen bg-apex-dark text-white flex flex-col">
      {/* HEADER WITH USER INFO */}
      {profile && (
        <div className="bg-apex-surface bg-opacity-30 border-b border-apex-border px-6 py-2 flex justify-between items-center">
          <div className="text-sm text-neutral-400">
            Welcome, <span className="text-white font-semibold">{profile.racer_name}</span>
          </div>
          <button
            onClick={handleSignOut}
            className="text-xs text-neutral-400 hover:text-white transition-colors px-3 py-1 rounded hover:bg-apex-surface"
          >
            Sign Out
          </button>
        </div>
      )}

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
              className={`px-6 py-4 text-sm font-semibold uppercase tracking-wide transition-all border-b-2 flex items-center gap-2 ${isActive
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
