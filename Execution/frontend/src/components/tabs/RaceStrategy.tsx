'use client';

import { useState, useEffect } from 'react';
import { useMissionControlStore } from '@/stores/missionControlStore';
import TrackContextMatrix from '@/components/matrices/TrackContextMatrix';
import VehicleTechnicalMatrix from '@/components/matrices/VehicleTechnicalMatrix';
import { createSession } from '@/lib/queries';
import type { RaceClassMapping } from '@/types/database';

export default function RaceStrategy() {
  const {
    selectedRacer,
    selectedVehicle,
    selectedSession,
    vehicles,
    liveRcUrl,
    setLiveRcUrl,
    setSessionStatus,
    setSelectedVehicle,
  } = useMissionControlStore();

  const [eventName, setEventName] = useState('');
  const [sessionType, setSessionType] = useState<'practice' | 'race'>('practice');
  const [url, setUrl] = useState('');
  const [urlValid, setUrlValid] = useState(false);
  const [urlError, setUrlError] = useState('');
  const [trackContext, setTrackContext] = useState({});

  // New metadata fields
  const [eventDate, setEventDate] = useState('');
  const [trackName, setTrackName] = useState('');
  const [location, setLocation] = useState('');
  const [numQuals, setNumQuals] = useState('');
  const [qualLength, setQualLength] = useState('');
  const [mainLength, setMainLength] = useState('');
  const [anticipatedTemp, setAnticipatedTemp] = useState('');

  // Multiclass state
  const [raceClasses, setRaceClasses] = useState<Array<{ className: string; vehicleId: string }>>([]);

  // Initialize multiclass with one empty entry when race type is selected
  useEffect(() => {
    if (sessionType === 'race' && raceClasses.length === 0) {
      setRaceClasses([{ className: '', vehicleId: '' }]);
    } else if (sessionType === 'practice') {
      setRaceClasses([]);
    }
  }, [sessionType]);

  // Pre-fill from existing session
  useEffect(() => {
    if (selectedSession) {
      setEventName(selectedSession.event_name);
      // Map old session types to new enum
      const mappedType = selectedSession.session_type === 'practice' ? 'practice' : 'race';
      setSessionType(mappedType as 'practice' | 'race');
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

  const handleLockAndActivate = async () => {
    if (!selectedRacer || !selectedVehicle || !eventName || !urlValid) {
      alert('Please complete all fields and provide a valid LiveRC URL');
      return;
    }

    // For race mode, validate that at least one class is properly configured
    if (sessionType === 'race') {
      const hasValidClass = raceClasses.some(rc => rc.className.trim() && rc.vehicleId);
      if (!hasValidClass) {
        alert('Please configure at least one race class with both a name and vehicle');
        return;
      }
    }

    try {
      // Build enhanced track context with new metadata
      const enhancedTrackContext = {
        name: (trackContext as any).name || 'medium',
        surface: (trackContext as any).surface || 'clay',
        traction: (trackContext as any).traction || 'medium',
        temperature: (trackContext as any).temperature || null,
        ...trackContext,
        event_date: eventDate,
        track_name: trackName,
        location: location,
        num_quals: numQuals ? parseInt(numQuals) : 0,
        qual_length: qualLength ? parseInt(qualLength) : 0,
        main_length: mainLength ? parseInt(mainLength) : 0,
        anticipated_temp: anticipatedTemp ? parseInt(anticipatedTemp) : 0,
        race_classes: sessionType === 'race' ? raceClasses as RaceClassMapping[] : undefined,
      };

      // Create session in database
      const newSession = await createSession({
        profile_id: selectedRacer.id,
        vehicle_id: selectedVehicle.id,
        event_name: eventName,
        session_type: sessionType,
        track_context: enhancedTrackContext,
        actual_setup: selectedVehicle.baseline_setup || {},
        status: 'active',
      });

      if (!newSession) {
        alert('Failed to create session. Please try again.');
        return;
      }

      // Store URL, track context, and activate session
      setLiveRcUrl(url);
      setTrackContext(enhancedTrackContext);
      setSessionStatus('active');

      // Navigate to Control tab
      const params = new URLSearchParams(window.location.search);
      params.set('tab', 'control');
      window.history.replaceState(null, '', `?${params.toString()}`);
    } catch (error) {
      console.error('Error creating session:', error);
      alert('Failed to create session. Please check the console for details.');
    }
  };

  return (
    <div className="flex h-full bg-[#121212] text-white font-sans overflow-auto relative">

      {/* PINNED SIDEBAR (SESSION CONFIG) */}
      <div className="w-[380px] bg-[#0d0d0f] border-r border-white/5 flex flex-col z-50 transition-transform">
        {/* Sidebar Header */}
        <div className="p-4 bg-white/[0.02] border-b border-white/10 flex justify-between items-center">
          <span className="text-base text-[#E53935] font-black uppercase tracking-[2px]">◆ Event Config</span>
          <button className="text-[#E53935] text-base font-black uppercase tracking-widest">[ PINNED ]</button>
        </div>

        {/* Config Content */}
        <div className="p-[30px] flex-1 overflow-y-auto space-y-5">
          {/* Event Name */}
          <div>
            <label className="text-sm font-extrabold text-[#555] uppercase block mb-2">Event Name</label>
            <input
              type="text"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              className="w-full bg-black border border-white/5 p-2 text-white text-base font-mono rounded focus:outline-none focus:border-[#E53935]"
              placeholder="e.g., Winter Series Heat 3"
            />
          </div>

          {/* Session Type */}
          <div>
            <label className="text-sm font-extrabold text-[#555] uppercase block mb-2">Session Type</label>
            <select
              value={sessionType}
              onChange={(e) => setSessionType(e.target.value as 'practice' | 'race')}
              className="w-full bg-black border border-white/5 p-2 text-white text-base font-mono rounded focus:outline-none focus:border-[#E53935]"
            >
              <option value="practice">Practice</option>
              <option value="race">Race</option>
            </select>
          </div>

          {/* Event Date */}
          <div>
            <label className="text-sm font-extrabold text-[#555] uppercase block mb-2">Event Date</label>
            <input
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="w-full bg-black border border-white/5 p-2 text-white text-base font-mono rounded focus:outline-none focus:border-[#E53935]"
            />
          </div>

          {/* Track Name */}
          <div>
            <label className="text-sm font-extrabold text-[#555] uppercase block mb-2">Track Name</label>
            <input
              type="text"
              value={trackName}
              onChange={(e) => setTrackName(e.target.value)}
              className="w-full bg-black border border-white/5 p-2 text-white text-base font-mono rounded focus:outline-none focus:border-[#E53935]"
              placeholder="e.g., Nitro Hobbies"
            />
          </div>

          {/* Location */}
          <div>
            <label className="text-sm font-extrabold text-[#555] uppercase block mb-2">Location (City, State)</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full bg-black border border-white/5 p-2 text-white text-base font-mono rounded focus:outline-none focus:border-[#E53935]"
              placeholder="e.g., Phoenix, AZ"
            />
          </div>

          {/* Race Structure Section */}
          <div className="pt-3 border-t border-white/10">
            <label className="text-sm font-extrabold text-[#E53935] uppercase block mb-3">Race Structure</label>

            {/* Number of Quals */}
            <div className="mb-3">
              <label className="text-sm font-extrabold text-[#555] uppercase block mb-2"># Quals</label>
              <input
                type="number"
                value={numQuals}
                onChange={(e) => setNumQuals(e.target.value)}
                className="w-full bg-black border border-white/5 p-2 text-white text-base font-mono rounded focus:outline-none focus:border-[#E53935]"
                placeholder="e.g., 3"
                min="0"
              />
            </div>

            {/* Qual Length */}
            <div className="mb-3">
              <label className="text-sm font-extrabold text-[#555] uppercase block mb-2">Length (min)</label>
              <input
                type="number"
                value={qualLength}
                onChange={(e) => setQualLength(e.target.value)}
                className="w-full bg-black border border-white/5 p-2 text-white text-base font-mono rounded focus:outline-none focus:border-[#E53935]"
                placeholder="e.g., 5"
                min="0"
              />
            </div>

            {/* Main Length */}
            <div>
              <label className="text-sm font-extrabold text-[#555] uppercase block mb-2">Main Length (min)</label>
              <input
                type="number"
                value={mainLength}
                onChange={(e) => setMainLength(e.target.value)}
                className="w-full bg-black border border-white/5 p-2 text-white text-base font-mono rounded focus:outline-none focus:border-[#E53935]"
                placeholder="e.g., 10"
                min="0"
              />
            </div>
          </div>

          {/* Multiclass Manager - Only for Race Mode */}
          {sessionType === 'race' && (
            <div className="pt-3 border-t border-white/10">
              <label className="text-sm font-extrabold text-[#E53935] uppercase block mb-3">Race Classes</label>

              <div className="space-y-3">
                {raceClasses.map((raceClass, index) => (
                  <div key={index} className="flex gap-2">
                    {/* Class Name Input */}
                    <input
                      type="text"
                      value={raceClass.className}
                      onChange={(e) => {
                        const updated = [...raceClasses];
                        updated[index].className = e.target.value;
                        setRaceClasses(updated);
                      }}
                      className="flex-1 bg-black border border-white/5 p-2 text-white text-sm font-mono rounded focus:outline-none focus:border-[#E53935]"
                      placeholder="e.g., 1/8 Nitro Buggy"
                    />

                    {/* Vehicle Selection */}
                    <select
                      value={raceClass.vehicleId}
                      onChange={(e) => {
                        const updated = [...raceClasses];
                        updated[index].vehicleId = e.target.value;
                        setRaceClasses(updated);
                      }}
                      className="flex-1 bg-black border border-white/5 p-2 text-white text-sm font-mono rounded focus:outline-none focus:border-[#E53935]"
                    >
                      <option value="">Select vehicle...</option>
                      {vehicles.map((vehicle) => (
                        <option key={vehicle.id} value={vehicle.id}>
                          {vehicle.brand} {vehicle.model}
                        </option>
                      ))}
                    </select>

                    {/* Remove Button */}
                    <button
                      onClick={() => {
                        const updated = raceClasses.filter((_, i) => i !== index);
                        setRaceClasses(updated);
                      }}
                      disabled={raceClasses.length === 1}
                      className={`px-3 py-2 text-sm font-black uppercase rounded transition-all ${
                        raceClasses.length === 1
                          ? 'bg-[#333] text-[#666] cursor-not-allowed opacity-50'
                          : 'border border-[#E53935] text-[#E53935] hover:bg-[#E53935] hover:text-white'
                      }`}
                    >
                      🗑
                    </button>
                  </div>
                ))}

                {/* Add Class Button */}
                <button
                  onClick={() => setRaceClasses([...raceClasses, { className: '', vehicleId: '' }])}
                  className="w-full px-3 py-2 text-sm font-black uppercase rounded border border-[#2196F3] text-[#2196F3] hover:bg-[#2196F3] hover:text-white transition-all"
                >
                  + Add Class
                </button>
              </div>
            </div>
          )}

          {/* Anticipated Temp */}
          <div>
            <label className="text-sm font-extrabold text-[#555] uppercase block mb-2">Anticipated Temp (°F)</label>
            <input
              type="number"
              value={anticipatedTemp}
              onChange={(e) => {
                const value = e.target.value;
                // Limit to 3 digits
                if (value.length <= 3) {
                  setAnticipatedTemp(value);
                }
              }}
              className="w-full bg-black border border-white/5 p-2 text-white text-base font-mono rounded focus:outline-none focus:border-[#E53935]"
              placeholder="e.g., 85"
              maxLength={3}
            />
          </div>

          {/* Vehicle Selection */}
          <div>
            <label className="text-sm font-extrabold text-[#555] uppercase block mb-2">Vehicle</label>
            <select
              value={selectedVehicle?.id || ''}
              onChange={(e) => {
                const vehicle = vehicles.find(v => v.id === e.target.value);
                setSelectedVehicle(vehicle || null);
              }}
              className="w-full bg-black border border-white/5 p-2 text-white text-base font-mono rounded focus:outline-none focus:border-[#E53935]"
            >
              <option value="">Select a vehicle...</option>
              {vehicles.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.brand} {vehicle.model}
                </option>
              ))}
            </select>
          </div>

          {/* Lock Button */}
          <button
            onClick={handleLockAndActivate}
            disabled={!selectedRacer || !selectedVehicle || !eventName || !urlValid}
            className={`w-full border font-black uppercase text-base p-2.5 rounded tracking-wider transition-all mt-5 ${selectedRacer && selectedVehicle && eventName && urlValid
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
            <span className="text-base text-[#E53935] font-black uppercase tracking-[2px]">◆ LiveRC Feed</span>
          </div>

          <div className="p-5 space-y-3">
            <label className="text-sm font-extrabold text-[#555] uppercase block">Event URL</label>
            <input
              type="text"
              value={url}
              onChange={(e) => validateUrl(e.target.value)}
              className={`w-full bg-black border rounded px-3 py-2 text-base font-mono focus:outline-none transition-colors ${url && (urlValid ? 'border-[#2196F3]' : 'border-[#E53935]')
                } ${!url && 'border-white/5'} focus:border-[#E53935]`}
              placeholder="Paste LiveRC event URL here"
            />
            {urlError && <p className="text-sm text-[#E53935] mt-2 font-mono">{urlError}</p>}
            {urlValid && (
              <p className="text-sm text-[#2196F3] mt-2 font-mono">✓ Valid LiveRC URL</p>
            )}
          </div>
        </div>

        {/* TRACK CONTEXT MATRIX */}
        <div className="bg-[#121214] border border-white/5 rounded flex flex-col overflow-hidden shrink-0">
          <div className="p-4 bg-white/[0.02] border-b border-white/5">
            <span className="text-base text-[#E53935] font-black uppercase tracking-[2px]">◆ Track Context</span>
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
              <span className="text-base text-[#E53935] font-black uppercase tracking-[2px]">◆ Vehicle Setup</span>
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
