'use client';

import { useState, useEffect } from 'react';
import { useMissionControlStore } from '@/stores/missionControlStore';
import { useAdvisorStore } from '@/stores/advisorStore';
import { scrapeRaceResults } from '@/lib/LiveRCScraper';
import { SessionContext } from '@/stores/advisorStore';

export default function RaceControl() {
  const {
    selectedRacer,
    selectedSession,
    selectedVehicle,
    liveRcUrl,
    sessionTelemetry,
    currentORP,
    setSessionTelemetry,
    setRacerLapsSnapshot,
    calculateORP,
  } = useMissionControlStore();

  const { loadSessionContext } = useAdvisorStore();

  const [scribeFeedback, setScribeFeedback] = useState('');
  const [isScrapingLoading, setIsScrapingLoading] = useState(false);
  const [scrapingStatus, setScrapingStatus] = useState<'idle' | 'success' | 'stale' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Timer for elapsed session time
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleScrapeAndCalculate = async () => {
    if (!liveRcUrl || !selectedRacer) return;

    setIsScrapingLoading(true);
    setScrapingStatus('idle');

    try {
      const result = await scrapeRaceResults(liveRcUrl, selectedRacer.id, sessionTelemetry || undefined);

      if (result.status === 'success' && result.data) {
        setSessionTelemetry(result.data);
        setScrapingStatus('success');
        setStatusMessage('✓ Telemetry loaded successfully');

        // Extract racerLaps object (assuming scraper provides it in extended result)
        // For now, we trigger ORP calculation with the telemetry we have
        calculateORP(selectedRacer.id);
      } else if (result.status === 'stale') {
        setScrapingStatus('stale');
        setStatusMessage(`⚠ ${result.warning || 'Data may be stale'}`);
        if (result.data) {
          setSessionTelemetry(result.data);
          calculateORP(selectedRacer.id);
        }
      } else {
        setScrapingStatus('error');
        setStatusMessage(`✗ ${result.warning || 'Failed to scrape telemetry'}`);
      }
    } catch (error) {
      setScrapingStatus('error');
      setStatusMessage('✗ Error during scraping');
      console.error('Scrape error:', error);
    } finally {
      setIsScrapingLoading(false);
    }
  };

  const handleStartDebrief = () => {
    if (!sessionTelemetry || !currentORP || !selectedSession) {
      alert('Telemetry not available. Please scrape LiveRC first.');
      return;
    }

    const sessionContext: SessionContext = {
      telemetry: sessionTelemetry,
      orp_score: currentORP,
      fade_factor: currentORP.fade_factor || null,
      current_setup_id: selectedSession.id,
      applied_setup_snapshot: structuredClone(selectedSession.actual_setup || {}),
      racer_scribe_feedback: scribeFeedback,
    };

    loadSessionContext(sessionContext);

    // Navigate to Advisor tab
    const params = new URLSearchParams(window.location.search);
    params.set('tab', 'advisor');
    window.history.replaceState(null, '', `?${params.toString()}`);
  };

  return (
    <div className="w-full h-full bg-apex-dark text-white overflow-auto">
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* HEADER */}
        <div className="border-b border-apex-border pb-6">
          <h1 className="text-3xl font-bold uppercase tracking-tight text-apex-green">
            Race Control
          </h1>
          <p className="text-xs text-gray-400 mt-2 font-mono">
            Live monitoring and telemetry capture
          </p>
        </div>

        {/* SESSION LOCK INDICATOR */}
        <div className="bg-apex-surface border border-apex-green border-opacity-50 rounded-lg p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Session ID</p>
              <p className="font-mono text-apex-green">{selectedSession?.id.slice(0, 12) || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Racer</p>
              <p className="font-mono text-apex-green">{selectedRacer?.name || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Vehicle</p>
              <p className="font-mono text-apex-green">{selectedVehicle?.model || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Elapsed</p>
              <p className="font-mono text-apex-green">{formatTime(elapsedSeconds)}</p>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-apex-green animate-pulse" />
            <p className="text-xs font-semibold uppercase tracking-wide text-apex-green">
              🔒 LOCKED & ACTIVE
            </p>
          </div>
        </div>

        {/* TELEMETRY DISPLAY */}
        {sessionTelemetry && (
          <div className="bg-apex-surface border border-apex-border rounded-lg p-6 space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-300">
              ◆ Live Telemetry
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono text-sm">
              <div className="bg-apex-dark rounded p-4">
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Laps</p>
                <p className="text-xl text-apex-green">{sessionTelemetry.laps}</p>
              </div>
              <div className="bg-apex-dark rounded p-4">
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Best Lap</p>
                <p className="text-xl text-apex-green">
                  {(sessionTelemetry.best_lap / 1000).toFixed(3)}s
                </p>
              </div>
              <div className="bg-apex-dark rounded p-4">
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Average</p>
                <p className="text-xl text-apex-green">
                  {(sessionTelemetry.average_lap / 1000).toFixed(3)}s
                </p>
              </div>
              <div className="bg-apex-dark rounded p-4">
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Consistency</p>
                <p className="text-xl text-apex-green">
                  {sessionTelemetry.consistency_percentage.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ORP DISPLAY */}
        {currentORP ? (
          <div className="bg-apex-surface border border-apex-border rounded-lg p-6 space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-300">
              ◆ ORP Score
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 font-mono text-sm">
              <div className="bg-apex-dark rounded p-4">
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">ORP Score</p>
                <p className="text-2xl text-apex-green">{currentORP.orp_score.toFixed(1)}%</p>
              </div>
              <div className="bg-apex-dark rounded p-4">
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Consistency</p>
                <p className="text-lg text-gray-300">{currentORP.consistency_score.toFixed(1)}%</p>
              </div>
              <div className="bg-apex-dark rounded p-4">
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Speed</p>
                <p className="text-lg text-gray-300">{currentORP.speed_score.toFixed(1)}%</p>
              </div>
              {currentORP.fade_factor !== null && (
                <div className="bg-apex-dark rounded p-4">
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Fade Factor</p>
                  <p className={`text-lg ${currentORP.fade_factor > 0 ? 'text-apex-red' : 'text-apex-green'}`}>
                    {(currentORP.fade_factor * 100).toFixed(1)}%
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-apex-surface border border-gray-600 border-opacity-50 rounded-lg p-6 flex items-center gap-3">
            <span className="text-lg">⏳</span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
                ORP Score — Awaiting Telemetry
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Scrape LiveRC to calculate performance metrics
              </p>
            </div>
          </div>
        )}

        {/* SCRIBE TEXTAREA */}
        <div className="bg-apex-surface border border-apex-border rounded-lg p-6 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-300">
            ◆ The Scribe
          </h2>
          <p className="text-xs text-gray-400">
            Describe mechanical sensations and handling notes
          </p>
          <textarea
            maxLength={1000}
            value={scribeFeedback}
            onChange={(e) => setScribeFeedback(e.target.value)}
            placeholder="e.g., 'Bouncy on triples, loose on mid-corner, consistent on straights...'"
            className="w-full bg-apex-dark border border-apex-border rounded px-3 py-2 text-sm focus:outline-none focus:border-apex-green transition-colors resize-none"
            rows={5}
          />
          <p className="text-xs text-gray-500 text-right">
            {scribeFeedback.length} / 1000
          </p>
        </div>

        {/* SCRAPING STATUS */}
        {statusMessage && (
          <div
            className={`p-4 rounded text-sm font-mono ${
              scrapingStatus === 'success'
                ? 'bg-green-900 bg-opacity-30 border border-apex-green text-apex-green'
                : scrapingStatus === 'stale'
                  ? 'bg-yellow-900 bg-opacity-30 border border-yellow-600 text-yellow-400'
                  : 'bg-red-900 bg-opacity-30 border border-apex-red text-apex-red'
            }`}
          >
            {statusMessage}
          </div>
        )}

        {/* ACTION BUTTONS */}
        <div className="flex gap-4 pt-6 border-t border-apex-border">
          <button
            onClick={handleScrapeAndCalculate}
            disabled={!liveRcUrl || isScrapingLoading}
            className={`flex-1 px-6 py-3 font-semibold uppercase tracking-wide rounded transition-all ${
              liveRcUrl && !isScrapingLoading
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-700 text-gray-400 cursor-not-allowed opacity-50'
            }`}
          >
            {isScrapingLoading ? '⟳ Scraping...' : '📡 Scrape LiveRC'}
          </button>

          <button
            onClick={handleStartDebrief}
            disabled={!sessionTelemetry || !currentORP}
            className={`flex-1 px-6 py-3 font-semibold uppercase tracking-wide rounded transition-all ${
              sessionTelemetry && currentORP
                ? 'bg-apex-green text-apex-dark hover:bg-opacity-90'
                : 'bg-gray-700 text-gray-400 cursor-not-allowed opacity-50'
            }`}
          >
            💬 Start Debrief
          </button>
        </div>
      </div>
    </div>
  );
}
