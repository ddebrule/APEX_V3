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
    <div className="flex h-full bg-[#121212] text-white font-sans overflow-auto relative">

      {/* PINNED SIDEBAR (SESSION CONFIG) */}
      <div className="w-[380px] bg-[#0d0d0f] border-r border-white/5 flex flex-col z-50 transition-transform">
        {/* Sidebar Header */}
        <div className="p-4 bg-white/[0.02] border-b border-white/10 flex justify-between items-center">
          <span className="text-[10px] text-[#E53935] font-black uppercase tracking-[2px]">◆ Event Config</span>
          <button className="text-[#E53935] text-[10px] font-black uppercase tracking-widest">[ PINNED ]</button>
        </div>

        {/* Config Content */}
        <div className="p-[30px] flex-1 overflow-y-auto space-y-5">
          {/* Event Name */}
          <div>
            <label className="text-[10px] font-extrabold text-[#555] uppercase block mb-2">Event Name</label>
            <input
              type="text"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              className="w-full bg-black border border-white/5 p-2 text-white text-sm font-mono rounded focus:outline-none focus:border-[#E53935]"
              placeholder="e.g., Winter Series Heat 3"
            />
          </div>

          {/* Session Type */}
          <div>
            <label className="text-[10px] font-extrabold text-[#555] uppercase block mb-2">Session Type</label>
            <select
              value={sessionType}
              onChange={(e) => setSessionType(e.target.value as 'practice' | 'qualifier' | 'main')}
              className="w-full bg-black border border-white/5 p-2 text-white text-sm font-mono rounded focus:outline-none focus:border-[#E53935]"
            >
              <option value="practice">Practice</option>
              <option value="qualifier">Qualifier</option>
              <option value="main">Main</option>
            </select>
          </div>

          {/* Vehicle Display */}
          <div>
            <label className="text-[10px] font-extrabold text-[#555] uppercase block mb-2">Vehicle</label>
            <div className="bg-black border border-white/5 p-2 text-[11px] text-[#999] font-mono rounded rounded">
              {selectedVehicle ? `${selectedVehicle.brand} ${selectedVehicle.model}` : '—'}
            </div>
          </div>

          {/* Racer Display */}
          <div>
            <label className="text-[10px] font-extrabold text-[#555] uppercase block mb-2">Racer</label>
            <div className="bg-black border border-white/5 p-2 text-[11px] text-[#999] font-mono rounded">
              {selectedRacer?.name || '—'}
            </div>
          </div>

          {/* Lock Button */}
          <button
            onClick={handleLockAndActivate}
            disabled={!selectedRacer || !selectedVehicle || !eventName || !urlValid}
            className={`w-full border font-black uppercase text-[10px] p-2.5 rounded tracking-wider transition-all mt-5 ${
              selectedRacer && selectedVehicle && eventName && urlValid
                ? 'border-[#E53935] bg-[#E53935] text-white hover:bg-[#FF6B6B]'
                : 'border-[#444] bg-[#1a1a1c] text-[#666] cursor-not-allowed opacity-50'
            }`}
          >
            🔒 LOCK & ACTIVATE
          </button>
        </div>
      </div>

      {/* MAIN DESKTOP */}
      <div className="flex-1 flex flex-col p-[25px] gap-[25px] overflow-hidden">

        {/* LIVERC URL SECTION */}
        <div className="bg-[#121214] border border-white/5 rounded flex flex-col overflow-hidden shrink-0">
          <div className="p-4 bg-white/[0.02] border-b border-white/5">
            <span className="text-[10px] text-[#E53935] font-black uppercase tracking-[2px]">◆ LiveRC Feed</span>
          </div>

          <div className="p-5 space-y-3">
            <label className="text-[9px] font-extrabold text-[#555] uppercase block">Event URL</label>
            <input
              type="text"
              value={url}
              onChange={(e) => validateUrl(e.target.value)}
              className={`w-full bg-black border rounded px-3 py-2 text-[10px] font-mono focus:outline-none transition-colors ${
                url && (urlValid ? 'border-[#2196F3]' : 'border-[#E53935]')
              } ${!url && 'border-white/5'} focus:border-[#E53935]`}
              placeholder="Paste LiveRC event URL here"
            />
            {urlError && <p className="text-[8px] text-[#E53935] mt-2 font-mono">{urlError}</p>}
            {urlValid && (
              <p className="text-[8px] text-[#2196F3] mt-2 font-mono">✓ Valid LiveRC URL</p>
            )}
          </div>
        </div>

        {/* TRACK CONTEXT MATRIX */}
        <div className="bg-[#121214] border border-white/5 rounded flex flex-col overflow-hidden shrink-0">
          <div className="p-4 bg-white/[0.02] border-b border-white/5">
            <span className="text-[10px] text-[#E53935] font-black uppercase tracking-[2px]">◆ Track Context</span>
          </div>
          <div className="p-5 overflow-auto">
            <TrackContextMatrix
              onContextChange={setTrackContext}
              isEditable={true}
              initialContext={trackContext}
            />
          </div>
        </div>

        {/* VEHICLE TECHNICAL MATRIX */}
        {selectedVehicle && (
          <div className="bg-[#121214] border border-white/5 rounded flex flex-col overflow-hidden flex-1 min-h-0">
            <div className="p-4 bg-white/[0.02] border-b border-white/5 shrink-0">
              <span className="text-[10px] text-[#E53935] font-black uppercase tracking-[2px]">◆ Vehicle Setup</span>
            </div>
            <div className="p-5 overflow-auto">
              <VehicleTechnicalMatrix
                vehicles={selectedVehicle ? [selectedVehicle] : []}
                isEditable={true}
                selectedVehicleIds={selectedVehicle ? [selectedVehicle.id] : []}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
