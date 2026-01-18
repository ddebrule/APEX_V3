'use client';

import { useState, useEffect } from 'react';
import { useMissionControlStore } from '@/stores/missionControlStore';
import { getVehiclesByProfileId, createVehicle, updateRacerProfile, getClassesByProfileId, updateVehicle, getAllRacers, createRacerProfile, getHandlingSignalsByProfileId, createHandlingSignal, deleteHandlingSignal, createSession } from '@/lib/queries';
import type { Vehicle, VehicleClass, RacerProfile, HandlingSignal } from '@/types/database';

export default function RacerGarage() {
  const { selectedRacer, selectedVehicle, setSelectedVehicle, setSelectedRacer, setSelectedSession, uiScale, setUiScale } = useMissionControlStore();

  // Data State
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [classes, setClasses] = useState<VehicleClass[]>([]);
  const [allRacers, setAllRacers] = useState<RacerProfile[]>([]);

  // UI State
  const [isRacerDropdownOpen, setIsRacerDropdownOpen] = useState(false);
  const [isAddingRacer, setIsAddingRacer] = useState(false);
  const [newRacerName, setNewRacerName] = useState('');

  const [newSponsor, setNewSponsor] = useState('');
  const [sponsorCategory, setSponsorCategory] = useState('');

  const [isAddingVehicle, setIsAddingVehicle] = useState(false);
  const [newVehicle, setNewVehicle] = useState({ brand: '', model: '', transponder: '', class_id: '' });

  const [setupModalOpen, setSetupModalOpen] = useState(false);
  const [setupForm, setSetupForm] = useState({ shocks: '', diff: '', gearing: '' });

  const [uiScalingOpen, setUiScalingOpen] = useState(false);

  const [signalManagerOpen, setSignalManagerOpen] = useState(false);
  const [customSignals, setCustomSignals] = useState<HandlingSignal[]>([]);
  const [newSignal, setNewSignal] = useState({ label: '', description: '' });
  const [isLoadingSignals, setIsLoadingSignals] = useState(false);

  // Initial Data Load
  useEffect(() => {
    const loadRacers = async () => {
      try {
        const racers = await getAllRacers();
        setAllRacers(racers);
      } catch (err) {
        console.error('Failed to load racers', err);
      }
    };
    loadRacers();
  }, []);

  // Fetch vehicles and classes when racer changes
  useEffect(() => {
    if (!selectedRacer) return;
    const loadData = async () => {
      try {
        const [vData, cData] = await Promise.all([
          getVehiclesByProfileId(selectedRacer.id),
          getClassesByProfileId(selectedRacer.id)
        ]);
        setVehicles(vData);
        setClasses(cData);
      } catch (err) {
        console.error('Failed to load racer data', err);
      }
    };
    loadData();
  }, [selectedRacer]);

  // Fetch handling signals when racer changes
  useEffect(() => {
    if (!selectedRacer) {
      setCustomSignals([]);
      return;
    }
    const loadSignals = async () => {
      try {
        const signals = await getHandlingSignalsByProfileId(selectedRacer.id);
        setCustomSignals(signals);
      } catch (err) {
        console.error('Failed to load handling signals', err);
      }
    };
    loadSignals();
  }, [selectedRacer]);

  // --- HANDLERS: RACER IDENTITY ---
  const handleCreateRacer = async () => {
    if (!newRacerName.trim()) {
      alert("Racer name cannot be empty");
      return;
    }
    try {
      const newRacer = await createRacerProfile({
        name: newRacerName,
        sponsors: [],
        is_default: false
      });
      setAllRacers([newRacer, ...allRacers]);
      setSelectedRacer(newRacer);
      setIsAddingRacer(false);
      setNewRacerName('');
      setIsRacerDropdownOpen(false);
    } catch (err: any) {
      console.error('Failed to create racer', err);
      alert(`Failed to create racer: ${err.message || 'Unknown error'}`);
    }
  };

  // --- HANDLERS: SPONSORS ---
  const handleAddSponsor = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newSponsor.trim() && selectedRacer) {
      const sponsorName = sponsorCategory ? `${newSponsor.trim()} (${sponsorCategory})` : newSponsor.trim();
      const updatedSponsors = [...(selectedRacer.sponsors || []), sponsorName];
      try {
        const updatedProfile = await updateRacerProfile(selectedRacer.id, { sponsors: updatedSponsors });
        setSelectedRacer(updatedProfile);
        setNewSponsor('');
        setSponsorCategory('');
      } catch (err: any) {
        console.error('Failed to add sponsor', err);
        alert(`Failed to add sponsor: ${err.message}`);
      }
    }
  };

  const handleRemoveSponsor = async (sponsorToRemove: string) => {
    if (!selectedRacer) return;
    const updatedSponsors = (selectedRacer.sponsors || []).filter(s => s !== sponsorToRemove);
    try {
      const updatedProfile = await updateRacerProfile(selectedRacer.id, { sponsors: updatedSponsors });
      setSelectedRacer(updatedProfile);
    } catch (err: any) {
      console.error('Failed to remove sponsor', err);
      alert(`Failed to remove sponsor: ${err.message || 'Unknown error'}`);
    }
  };

  // --- HANDLERS: VEHICLES ---
  const handleCreateVehicle = async () => {
    if (!selectedRacer) {
      alert("Please select a racer first.");
      return;
    }
    // Basic validation: Brand and Model required
    if (!newVehicle.brand.trim() || !newVehicle.model.trim()) {
      alert('Brand and Model are required.');
      return;
    }

    try {
      const created = await createVehicle({
        profile_id: selectedRacer.id,
        brand: newVehicle.brand.trim(),
        model: newVehicle.model.trim(),
        transponder: newVehicle.transponder.trim() || undefined,
        class_id: newVehicle.class_id || undefined,
        baseline_setup: {}
      });
      setVehicles([created, ...vehicles]);
      setIsAddingVehicle(false);
      setNewVehicle({ brand: '', model: '', transponder: '', class_id: '' });
    } catch (err: any) {
      console.error('Failed to create vehicle', err);
      alert(`Failed to create vehicle: ${err.message || 'Unknown error'}`);
    }
  };

  const handleOpenSetupModal = () => {
    if (!selectedVehicle) return;
    const setup = selectedVehicle.baseline_setup as Record<string, string> || {};
    setSetupForm({
      shocks: setup.shocks || '',
      diff: setup.diff || '',
      gearing: setup.gearing || ''
    });
    setSetupModalOpen(true);
  };

  const handleSaveSetup = async () => {
    if (!selectedVehicle) return;
    try {
      const updated = await updateVehicle(selectedVehicle.id, {
        baseline_setup: {
          shocks: setupForm.shocks.trim(),
          diff: setupForm.diff.trim(),
          gearing: setupForm.gearing.trim()
        }
      });
      setVehicles(vehicles.map(v => v.id === updated.id ? updated : v));
      setSelectedVehicle(updated);
      setSetupModalOpen(false);
    } catch (err: any) {
      console.error('Failed to save setup', err);
      alert(`Failed to save setup: ${err.message || 'Unknown error'}`);
    }
  };

  // --- HANDLERS: SIGNALS ---
  const handleAddSignal = async () => {
    if (!newSignal.label.trim() || !selectedRacer) {
      alert('Please enter a signal label');
      return;
    }
    try {
      const created = await createHandlingSignal({
        profile_id: selectedRacer.id,
        label: newSignal.label.trim(),
        description: newSignal.description.trim() || undefined
      });
      setCustomSignals([created, ...customSignals]);
      setNewSignal({ label: '', description: '' });
    } catch (err: any) {
      console.error('Failed to add signal', err);
      alert(`Failed to add signal: ${err.message || 'Unknown error'}`);
    }
  };

  const handleDeleteSignal = async (id: string) => {
    try {
      await deleteHandlingSignal(id);
      setCustomSignals(customSignals.filter(s => s.id !== id));
    } catch (err: any) {
      console.error('Failed to delete signal', err);
      alert(`Failed to delete signal: ${err.message || 'Unknown error'}`);
    }
  };

  const getClassName = (classId?: string) => {
    if (!classId) return 'NO CLASS';
    const cls = classes.find(c => c.id === classId);
    return cls ? cls.name : 'Unknown';
  };

  const handleNewSession = async () => {
    if (!selectedRacer || !selectedVehicle) {
      alert('Please select a racer and vehicle first');
      return;
    }

    try {
      // Create draft session
      const newSession = await createSession({
        profile_id: selectedRacer.id,
        vehicle_id: selectedVehicle.id,
        event_name: 'New Session',
        track_context: { name: 'TBD', surface: 'hard_packed', traction: 'medium' },
        session_type: 'practice',
        status: 'draft',
        actual_setup: selectedVehicle.baseline_setup || {},
      });

      // Update store
      setSelectedSession(newSession);
      alert('New session created. Click Race Control tab to set up.');
    } catch (err: any) {
      console.error('Failed to create session', err);
      alert(`Failed to create session: ${err.message || 'Unknown error'}`);
    }
  };


  return (
    <div className="flex h-full bg-[#121212] text-white font-sans overflow-auto relative">

      {/* PINNED SIDEBAR (RACER IDENTITY) */}
      <div className="w-[380px] bg-[#0d0d0f] border-r border-white/5 flex flex-col z-50 transition-transform">
        {/* Sidebar Header */}
        <div className="p-4 bg-white/[0.02] border-b border-white/10 flex justify-between items-center">
          <span className="text-[10px] text-[#E53935] font-black uppercase tracking-[2px]">◆ Racer Identity</span>
          <button className="text-[#E53935] text-[10px] font-black uppercase tracking-widest">[ PINNED ]</button>
        </div>

        {/* Profile Content */}
        <div className="p-[30px] flex-1 overflow-y-auto">
          {/* Identity Group */}
          <div className="mb-5 relative">
            <label className="text-[10px] font-extrabold text-[#555] uppercase block mb-2">Registry Name</label>

            {/* RACER SELECTOR */}
            <div
              onClick={() => setIsRacerDropdownOpen(!isRacerDropdownOpen)}
              className="bg-black border border-white/5 p-3 text-white text-base font-mono rounded w-full cursor-pointer hover:border-[#E53935] transition-colors flex justify-between items-center"
            >
              <span>{selectedRacer?.name || 'SELECT RACER'}</span>
              <span className="text-[10px] text-[#555]">▼</span>
            </div>

            {/* DROPDOWN MENU */}
            {isRacerDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-[#1a1a1c] border border-[#E53935] rounded z-[60] shadow-xl">
                <div className="max-h-[200px] overflow-y-auto">
                  {allRacers.map(racer => (
                    <div
                      key={racer.id}
                      onClick={() => {
                        setSelectedRacer(racer);
                        setIsRacerDropdownOpen(false);
                      }}
                      className="p-3 hover:bg-[#E53935]/10 cursor-pointer text-sm font-mono border-b border-white/5 last:border-0"
                    >
                      {racer.name}
                    </div>
                  ))}
                </div>
                <div className="p-2 border-t border-white/10 bg-[#0d0d0f]">
                  {isAddingRacer ? (
                    <div className="flex gap-2">
                      <input
                        autoFocus
                        className="flex-1 bg-black border border-white/20 p-1 text-xs text-white"
                        placeholder="New Racer Name"
                        value={newRacerName}
                        onChange={e => setNewRacerName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleCreateRacer()}
                      />
                      <button onClick={handleCreateRacer} className="border border-[#E53935] bg-[#E53935]/10 text-[#E53935] hover:bg-[#E53935] hover:text-white transition-all uppercase font-black tracking-wider text-[10px] px-2 py-1">[SAVE]</button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setIsAddingRacer(true)}
                      className="w-full text-center border border-[#E53935] bg-[#E53935]/10 text-[#E53935] hover:bg-[#E53935] hover:text-white transition-all uppercase font-black tracking-wider text-[10px] py-1.5 rounded"
                    >
                      + Create New Identity
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sponsor Portfolio */}
          <div className="mb-5">
            <label className="text-[10px] font-extrabold text-[#555] uppercase block mb-2">Sponsor Portfolio</label>
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSponsor}
                  onChange={(e) => setNewSponsor(e.target.value)}
                  onKeyDown={handleAddSponsor}
                  className="flex-1 bg-black border border-white/5 p-2 text-white text-xs font-mono rounded focus:outline-none focus:border-[#E53935]"
                  placeholder="Sponsor Name..."
                  disabled={!selectedRacer}
                />
                <input
                  type="text"
                  list="sponsor-categories"
                  value={sponsorCategory}
                  onChange={(e) => setSponsorCategory(e.target.value)}
                  className="bg-black border border-white/5 p-2 text-white text-xs font-mono rounded focus:outline-none focus:border-[#E53935] min-w-[120px]"
                  placeholder="Category..."
                  disabled={!selectedRacer}
                />
                <datalist id="sponsor-categories">
                  <option value="Tires" />
                  <option value="Fuel" />
                  <option value="Electronics" />
                  <option value="Chassis" />
                  <option value="Engine" />
                  <option value="Shocks" />
                  <option value="Stickers" />
                  <option value="Bodies" />
                  <option value="Bearings" />
                  <option value="Tools" />
                  <option value="Radio" />
                  <option value="Paint" />
                </datalist>
                <button
                  onClick={() => handleAddSponsor({ key: 'Enter' } as React.KeyboardEvent)}
                  className="border border-[#E53935] bg-[#E53935] text-white text-[10px] font-black px-3 rounded hover:bg-[#FF6B6B] transition-all disabled:opacity-50"
                  disabled={!selectedRacer || !newSponsor.trim()}
                >
                  [+]
                </button>
              </div>
              <div className="flex gap-[5px] flex-wrap mt-2 min-h-[40px] content-start">
                {selectedRacer?.sponsors?.map((sponsor, idx) => (
                  <span
                    key={idx}
                    onClick={() => handleRemoveSponsor(sponsor)}
                    className="text-[10px] px-2 py-1 border border-[#E53935] text-[#E53935] font-bold rounded-[3px] cursor-pointer hover:bg-[#E53935] hover:text-white transition-colors group"
                  >
                    {sponsor} <span className="hidden group-hover:inline ml-1 text-white">x</span>
                  </span>
                ))}
                {(!selectedRacer?.sponsors || selectedRacer.sponsors.length === 0) && (
                  <span className="text-[10px] text-[#444] italic pt-1">No sponsors defined. Add one above.</span>
                )}
              </div>
            </div>
          </div>

          {/* System Preferences */}
          <div className="mt-10 border-t border-white/5 pt-5">
            <label className="text-[10px] font-extrabold text-[#555] uppercase block mb-2">System Preferences</label>
            <button
              onClick={() => setUiScalingOpen(true)}
              className="w-full border border-[#E53935] bg-[#E53935]/10 text-[#E53935] hover:bg-[#E53935] hover:text-white transition-all uppercase font-black tracking-wider text-[10px] p-2.5 mb-2.5">
              UI Scaling (Accessibility)
            </button>
            <button
              onClick={() => setSignalManagerOpen(true)}
              className="w-full border border-[#E53935] bg-[#E53935]/10 text-[#E53935] hover:bg-[#E53935] hover:text-white transition-all uppercase font-black tracking-wider text-[10px] p-2.5 flex justify-center items-center">
              <span>Handling Signals Map</span>
            </button>
          </div>
        </div>
      </div>

      {/* MAIN DESKTOP */}
      <div className="flex-1 flex flex-col p-[25px] gap-[25px] overflow-hidden">

        {/* VEHICLE GARAGE (TOP) */}
        <div className="bg-[#121214] border border-white/5 rounded flex flex-col overflow-hidden shrink-0">
          <div className="p-4 bg-white/[0.02] border-b border-white/5">
            <span className="text-[10px] text-[#E53935] font-black uppercase tracking-[2px]">◆ Active Vehicle Assets</span>
          </div>

          <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-[15px] p-5">
            {/* V-Card: Active */}
            {vehicles.map(vehicle => (
              <div
                key={vehicle.id}
                onClick={() => {
                  setSelectedVehicle(vehicle);
                  handleOpenSetupModal();
                }}
                className={`p-[18px] border rounded cursor-pointer transition-all relative group ${selectedVehicle?.id === vehicle.id
                  ? 'bg-[#E53935]/5 border-[#E53935] border-l-4 shadow-[0_0_20px_rgba(229,57,53,0.1)]'
                  : 'bg-[#1a1a1c]/80 backdrop-blur-sm border-white/10 hover:border-[#E53935]/50 transition-all duration-300'
                  }`}
              >
                <div className="text-[18px] font-black text-white uppercase">{vehicle.brand} {vehicle.model}</div>
                <div className="font-mono text-[10px] text-[#666] mt-[5px] uppercase">
                  {getClassName(vehicle.class_id)} • {vehicle.transponder || 'NO-TX'}
                </div>
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-[9px] bg-[#E53935] text-white px-1 rounded">SETUP</span>
                </div>
              </div>
            ))}

            {/* V-Card: Add New Form or Button */}
            {isAddingVehicle ? (
              <div className="bg-[#1a1a1c] border border-[#E53935] p-[18px] rounded flex flex-col gap-2 animate-in fade-in duration-300">
                <input
                  autoFocus
                  placeholder="BRAND (e.g. TEKNO)"
                  className="bg-black border border-white/10 p-1.5 text-[10px] text-white font-bold"
                  value={newVehicle.brand}
                  onChange={e => setNewVehicle({ ...newVehicle, brand: e.target.value })}
                />
                <input
                  placeholder="MODEL (e.g. NB48 2.2)"
                  className="bg-black border border-white/10 p-1.5 text-[10px] text-white font-bold"
                  value={newVehicle.model}
                  onChange={e => setNewVehicle({ ...newVehicle, model: e.target.value })}
                />
                <div className="flex gap-2">
                  <select
                    className="bg-black border border-white/10 p-1.5 text-[10px] text-white font-mono flex-1"
                    value={newVehicle.class_id}
                    onChange={e => setNewVehicle({ ...newVehicle, class_id: e.target.value })}
                  >
                    <option value="">CLASS (OPTIONAL)...</option>
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <input
                  placeholder="TX # (OPTIONAL)"
                  className="bg-black border border-white/10 p-1.5 text-[10px] text-white font-mono"
                  value={newVehicle.transponder}
                  onChange={e => setNewVehicle({ ...newVehicle, transponder: e.target.value })}
                />
                <div className="flex gap-2 mt-1">
                  <button onClick={handleCreateVehicle} className="flex-1 border border-[#E53935] bg-[#E53935] text-white text-[10px] font-black uppercase py-1.5 hover:bg-[#FF6B6B] transition-all">SAVE</button>
                  <button onClick={() => setIsAddingVehicle(false)} className="flex-1 border border-white/10 bg-white/[0.05] text-white text-[10px] font-black uppercase py-1.5 hover:bg-white/[0.1] transition-all">CANCEL</button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => setIsAddingVehicle(true)}
                className="bg-[#1a1a1c]/80 backdrop-blur-sm border border-dashed border-[#E53935]/30 p-[18px] rounded flex items-center justify-center opacity-50 hover:opacity-100 hover:border-[#E53935] hover:text-[#E53935] hover:bg-[#E53935]/5 cursor-pointer transition-all min-h-[85px]"
              >
                <span className="text-[10px] font-black uppercase tracking-widest">[+] ADD NEW ASSET</span>
              </div>
            )}
          </div>
        </div>

        {/* PAST SESSION RESULTS (BOTTOM) */}
        <div className="bg-[#121214] border border-white/5 rounded flex flex-col flex-1 min-h-0">
          <div className="p-4 bg-white/[0.02] border-b border-white/5 shrink-0 flex justify-between items-center">
            <span className="text-[10px] text-[#E53935] font-black uppercase tracking-[2px]">
              ◆ Past Session Results // {selectedVehicle ? `${selectedVehicle.brand} ${selectedVehicle.model}` : 'SELECT VEHICLE'}
            </span>
            <button
              onClick={handleNewSession}
              disabled={!selectedRacer || !selectedVehicle}
              className="text-[10px] px-3 py-1.5 border border-[#2196F3] bg-[#2196F3]/10 text-[#2196F3] font-black uppercase tracking-widest rounded hover:bg-[#2196F3]/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              ◆ NEW SESSION
            </button>
          </div>

          <div className="px-5 py-2.5 bg-black/20 border-b border-white/5 flex gap-5 items-center shrink-0">
            {['All Sessions', 'Race Events', 'Practice & Testing', 'Analytics View'].map((filter, idx) => (
              <button
                key={filter}
                className={`bg-transparent border-none text-[10px] font-black uppercase tracking-widest cursor-pointer py-2.5 border-b-2 transition-colors ${idx === 0 ? 'text-white border-[#E53935]' : 'text-[#555] border-transparent hover:text-white'
                  }`}
              >
                {filter}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-auto">
            <table className="w-full border-collapse font-mono text-sm">
              <thead className="sticky top-0 bg-[#1a1a1c] z-10">
                <tr>
                  {['Type', 'Date/Time', 'Event/Location', 'Class', 'Result', 'Consistency', 'Setup Profile'].map(header => (
                    <th key={header} className="text-left p-5 text-[10px] font-extrabold uppercase text-[#555] border-b border-[#E53935]">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Mock Data Row 1 */}
                <tr
                  className="border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer"
                  onClick={() => alert('Session Details coming in Phase 4')}
                >
                  <td className="p-5 text-[#B0BEC5]">
                    <span className="text-[9px] px-1.5 py-0.5 rounded-[2px] border border-[#E53935] text-[#E53935]">RACE</span>
                  </td>
                  <td className="p-5 text-[#B0BEC5]">15-JAN // 14:30</td>
                  <td className="p-5 text-white font-bold">ROAR NATS PREP // SDRC</td>
                  <td className="p-5 text-[#B0BEC5]">1/8 NITRO</td>
                  <td className="p-5 text-[#E53935] font-black">A-MAIN P3</td>
                  <td className="p-5 text-[#B0BEC5]">94.2%</td>
                  <td className="p-5 text-[#666] text-[11px]">Blue Groove V2</td>
                </tr>
                {/* Mock Data Row 2 */}
                <tr className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="p-5 text-[#B0BEC5]">
                    <span className="text-[9px] px-1.5 py-0.5 rounded-[2px] border border-[#444] text-[#777]">TEST</span>
                  </td>
                  <td className="p-5 text-[#B0BEC5]">12-JAN // 10:15</td>
                  <td className="p-5 text-white font-bold">PRIVATE SESSION // SDRC</td>
                  <td className="p-5 text-[#B0BEC5]">1/8 NITRO</td>
                  <td className="p-5 text-[#B0BEC5] font-bold">DATA ONLY</td>
                  <td className="p-5 text-[#B0BEC5]">89.1%</td>
                  <td className="p-5 text-[#666] text-[11px]">Diff Oil Test</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* SETUP DETAIL MODAL */}
      {setupModalOpen && selectedVehicle && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-[#1a1a1c] border border-[#E53935] rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-5">
              <span className="text-[13px] font-black uppercase tracking-tight">◆ Setup Details</span>
              <button
                onClick={() => setSetupModalOpen(false)}
                className="text-[#999] hover:text-white text-lg"
              >
                ✕
              </button>
            </div>

            <div className="mb-4">
              <span className="text-[10px] font-extrabold text-[#555] uppercase block mb-2">
                {selectedVehicle.brand} {selectedVehicle.model}
              </span>
              <div className="text-[11px] text-[#777] font-mono">Class: {getClassName(selectedVehicle.class_id)}</div>
              <div className="text-[11px] text-[#777] font-mono">TX: {selectedVehicle.transponder || 'NONE'}</div>
            </div>

            <div className="border-t border-white/5 pt-4 mt-4 space-y-4">
              <div>
                <label className="text-[10px] font-extrabold text-[#555] uppercase block mb-2">Shocks Setup</label>
                <input
                  type="text"
                  value={setupForm.shocks}
                  onChange={(e) => setSetupForm({ ...setupForm, shocks: e.target.value })}
                  className="w-full bg-black border border-white/10 p-2 text-white text-xs font-mono rounded focus:outline-none focus:border-[#E53935]"
                  placeholder="e.g., 6.5 front, 7.0 rear..."
                />
              </div>

              <div>
                <label className="text-[10px] font-extrabold text-[#555] uppercase block mb-2">Diff Setup</label>
                <input
                  type="text"
                  value={setupForm.diff}
                  onChange={(e) => setSetupForm({ ...setupForm, diff: e.target.value })}
                  className="w-full bg-black border border-white/10 p-2 text-white text-xs font-mono rounded focus:outline-none focus:border-[#E53935]"
                  placeholder="e.g., 3000T oil, ratio 2.6..."
                />
              </div>

              <div>
                <label className="text-[10px] font-extrabold text-[#555] uppercase block mb-2">Gearing</label>
                <input
                  type="text"
                  value={setupForm.gearing}
                  onChange={(e) => setSetupForm({ ...setupForm, gearing: e.target.value })}
                  className="w-full bg-black border border-white/10 p-2 text-white text-xs font-mono rounded focus:outline-none focus:border-[#E53935]"
                  placeholder="e.g., 16/37, 17/37..."
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={handleSaveSetup}
                className="flex-1 border border-[#E53935] bg-[#E53935] text-white text-[10px] font-black uppercase py-2 rounded hover:bg-[#FF6B6B] transition-all shadow-[0_4px_10px_rgba(229,57,53,0.3)]"
              >
                SAVE CONFIGURATION
              </button>
              <button
                onClick={() => setSetupModalOpen(false)}
                className="flex-1 border border-white/10 bg-white/[0.05] text-white text-[10px] font-black uppercase py-2 rounded hover:bg-white/[0.1] transition-all"
              >
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UI SCALING MODAL */}
      {uiScalingOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-[#1a1a1c] border border-[#E53935] rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-5">
              <span className="text-[13px] font-black uppercase tracking-tight">◆ UI Scaling</span>
              <button
                onClick={() => setUiScalingOpen(false)}
                className="text-[#999] hover:text-white text-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-extrabold text-[#555] uppercase block mb-3">Scale Level: {uiScale}%</label>
                <input
                  type="range"
                  min="80"
                  max="150"
                  step="10"
                  value={uiScale}
                  onChange={(e) => setUiScale(Number(e.target.value))}
                  className="w-full h-2 bg-[#333] rounded appearance-none cursor-pointer"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => {
                  setUiScalingOpen(false);
                }}
                className="flex-1 border border-[#E53935] bg-[#E53935] text-white text-[10px] font-black uppercase py-2 rounded hover:bg-[#FF6B6B] transition-all"
              >
                APPLY
              </button>
              <button
                onClick={() => setUiScalingOpen(false)}
                className="flex-1 border border-white/10 bg-white/[0.05] text-white text-[10px] font-black uppercase py-2 rounded hover:bg-white/[0.1] transition-all"
              >
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HANDLING SIGNALS MANAGER (NEW) */}
      {signalManagerOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-[#1a1a1c] border border-[#E53935] rounded-lg p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-5">
              <span className="text-[13px] font-black uppercase tracking-tight">◆ Handling Signal Manager</span>
              <button
                onClick={() => setSignalManagerOpen(false)}
                className="text-[#999] hover:text-white text-lg"
              >
                ✕
              </button>
            </div>

            <div className="bg-black/30 border border-white/5 rounded-lg p-4 mb-4">
              <div className="text-[10px] font-bold text-[#555] uppercase mb-2">Add New Signal Definition</div>
              <div className="flex flex-col gap-2">
                <input
                  placeholder="Signal Label (e.g. 'Diff Out')"
                  className="bg-black border border-white/10 p-2 text-xs text-white"
                  value={newSignal.label}
                  onChange={e => setNewSignal({ ...newSignal, label: e.target.value })}
                />
                <textarea
                  placeholder="Interpretation Description (What does this mean for setup?)"
                  className="bg-black border border-white/10 p-2 text-xs text-white h-16"
                  value={newSignal.description}
                  onChange={e => setNewSignal({ ...newSignal, description: e.target.value })}
                />
                <button
                  onClick={() => handleAddSignal()}
                  className="border border-[#E53935] bg-[#E53935] text-white text-[10px] font-black uppercase py-1.5 rounded transition-all disabled:opacity-50 hover:bg-[#FF6B6B]"
                  disabled={!newSignal.label.trim() || !selectedRacer}
                >
                  [+] Add to Dictionary
                </button>
              </div>
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              <div className="text-[10px] font-bold text-[#555] uppercase">Active Signal Dictionary</div>
              {customSignals.map(sig => (
                <div key={sig.id} className="p-3 bg-[#111] border border-white/5 rounded flex justify-between items-start group">
                  <div>
                    <div className="text-[#E53935] font-bold text-xs">{sig.label}</div>
                    <div className="text-[#777] text-[10px] mt-1">{sig.description}</div>
                  </div>
                  <button
                    onClick={() => handleDeleteSignal(sig.id)}
                    className="text-[#444] hover:text-[#E53935] text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    [DELETE]
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={() => setSignalManagerOpen(false)}
              className="w-full mt-6 border border-white/10 bg-white/[0.05] text-white text-[10px] font-black uppercase py-2 rounded hover:bg-white/[0.1] transition-all"
            >
              CLOSE
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
