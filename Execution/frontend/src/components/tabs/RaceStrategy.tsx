'use client';

import { useState, useEffect } from 'react';
import { useMissionControlStore } from '@/stores/missionControlStore';
import TrackContextMatrix from '@/components/matrices/TrackContextMatrix';
import VehicleTechnicalMatrix from '@/components/matrices/VehicleTechnicalMatrix';

export default function RaceStrategy() {
  const {
    selectedRacer,
    selectedVehicle,
    selectedSession,
    liveRcUrl,
    setLiveRcUrl,
    setSessionStatus,
  } = useMissionControlStore();

  const [eventName, setEventName] = useState('');
  const [sessionType, setSessionType] = useState<'practice' | 'qualifier' | 'main'>('practice');
  const [url, setUrl] = useState('');
  const [urlValid, setUrlValid] = useState(false);
  const [urlError, setUrlError] = useState('');
  const [trackContext, setTrackContext] = useState({});

  // Pre-fill from existing session
  useEffect(() => {
    if (selectedSession) {
      setEventName(selectedSession.event_name);
      setSessionType(selectedSession.session_type as 'practice' | 'qualifier' | 'main');
    }
    if (liveRcUrl) {
      setUrl(liveRcUrl);
    }
  }, [selectedSession, liveRcUrl]);

  // Validate LiveRC URL
  const validateUrl = (inputUrl: string) => {
    setUrl(inputUrl);
    if (!inputUrl.trim()) {
      setUrlValid(false);
      setUrlError('');
      return;
    }

    const isValid =
      inputUrl.includes('liverc.com') &&
      (inputUrl.includes('?p=view_event&id=') || inputUrl.includes('view_event'));

    if (isValid) {
      setUrlValid(true);
      setUrlError('');
    } else {
      setUrlValid(false);
      setUrlError('Invalid LiveRC URL. Expected format: https://liverc.com/?p=view_event&id=...');
    }
  };

  const handleLockAndActivate = () => {
    if (!selectedRacer || !selectedVehicle || !eventName || !urlValid) {
      alert('Please complete all fields and provide a valid LiveRC URL');
      return;
    }

    // Store URL and activate session
    setLiveRcUrl(url);
    setSessionStatus('active');

    // Navigate to Control tab
    const params = new URLSearchParams(window.location.search);
    params.set('tab', 'control');
    window.history.replaceState(null, '', `?${params.toString()}`);
  };

  return (
    <div className="w-full h-full bg-apex-dark text-white overflow-auto">
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* HEADER */}
        <div className="border-b border-apex-border pb-6">
          <h1 className="text-3xl font-bold uppercase tracking-tight text-apex-green">
            Race Strategy
          </h1>
          <p className="text-xs text-gray-400 mt-2 font-mono">
            Configure event details and lock session for monitoring
          </p>
        </div>

        {/* EVENT HEADER SECTION */}
        <div className="bg-apex-surface border border-apex-border rounded-lg p-6 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-300">
            ◆ Event Configuration
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
                Event Name
              </label>
              <input
                type="text"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                className="w-full bg-apex-dark border border-apex-border rounded px-3 py-2 text-sm focus:outline-none focus:border-apex-green transition-colors"
                placeholder="e.g., Winter Series Heat 3"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
                Session Type
              </label>
              <select
                value={sessionType}
                onChange={(e) => setSessionType(e.target.value as 'practice' | 'qualifier' | 'main')}
                className="w-full bg-apex-dark border border-apex-border rounded px-3 py-2 text-sm focus:outline-none focus:border-apex-green transition-colors"
              >
                <option value="practice">Practice</option>
                <option value="qualifier">Qualifier</option>
                <option value="main">Main</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
                Vehicle
              </label>
              <input
                type="text"
                value={selectedVehicle ? `${selectedVehicle.brand} ${selectedVehicle.model}` : '—'}
                disabled
                className="w-full bg-apex-dark border border-apex-border rounded px-3 py-2 text-sm text-gray-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
                Racer
              </label>
              <input
                type="text"
                value={selectedRacer?.name || '—'}
                disabled
                className="w-full bg-apex-dark border border-apex-border rounded px-3 py-2 text-sm text-gray-400"
              />
            </div>
          </div>
        </div>

        {/* LIVERC URL SECTION */}
        <div className="bg-apex-surface border border-apex-border rounded-lg p-6 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-300">
            ◆ LiveRC Feed
          </h2>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
              Event URL
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => validateUrl(e.target.value)}
              className={`w-full bg-apex-dark border rounded px-3 py-2 text-sm focus:outline-none transition-colors ${
                url && (urlValid ? 'border-apex-green' : 'border-apex-red')
              } ${!url && 'border-apex-border'} focus:border-apex-green`}
              placeholder="Paste LiveRC event URL here"
            />
            {urlError && <p className="text-xs text-apex-red mt-2">{urlError}</p>}
            {urlValid && (
              <p className="text-xs text-apex-green mt-2">✓ Valid LiveRC URL</p>
            )}
          </div>
        </div>

        {/* TRACK CONTEXT MATRIX */}
        <div className="bg-apex-surface border border-apex-border rounded-lg p-6 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-300">
            ◆ Track Context
          </h2>
          <TrackContextMatrix
            onContextChange={setTrackContext}
            isEditable={true}
            initialContext={trackContext}
          />
        </div>

        {/* VEHICLE TECHNICAL MATRIX */}
        {selectedVehicle && (
          <div className="bg-apex-surface border border-apex-border rounded-lg p-6 space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-300">
              ◆ Vehicle Setup
            </h2>
            <VehicleTechnicalMatrix
              vehicles={selectedVehicle ? [selectedVehicle] : []}
              isEditable={true}
              selectedVehicleIds={selectedVehicle ? [selectedVehicle.id] : []}
            />
          </div>
        )}

        {/* ACTION BUTTONS */}
        <div className="flex gap-4 pt-6 border-t border-apex-border">
          <button
            onClick={handleLockAndActivate}
            disabled={!selectedRacer || !selectedVehicle || !eventName || !urlValid}
            className={`flex-1 px-6 py-3 font-semibold uppercase tracking-wide rounded transition-all ${
              selectedRacer && selectedVehicle && eventName && urlValid
                ? 'bg-apex-green text-apex-dark hover:bg-opacity-90'
                : 'bg-gray-700 text-gray-400 cursor-not-allowed opacity-50'
            }`}
          >
            🔒 Lock & Activate Session
          </button>

          <button
            onClick={() => window.history.back()}
            className="px-6 py-3 font-semibold uppercase tracking-wide rounded border border-apex-border text-gray-400 hover:text-gray-300 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
