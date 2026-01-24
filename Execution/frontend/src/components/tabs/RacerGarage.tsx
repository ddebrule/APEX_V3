'use client';

import { useState } from 'react';
import { useMissionControlStore } from '@/stores/missionControlStore';
import {
  useRacers,
  useVehiclesByRacer,
  useCreateRacer,
  useCreateVehicle,
  useUpdateRacer,
  useDeleteRacer,
  useUpdateVehicle,
  useClassesByRacer,
  useHandlingSignals,
  useCreateHandlingSignal,
  useDeleteHandlingSignal,
} from '@/hooks/useRacerGarageData';

export default function RacerGarage() {
  const { selectedRacer, selectedVehicle, setSelectedVehicle, setSelectedRacer, uiScale, setUiScale } = useMissionControlStore();

  // TanStack Query: Fetch racers (cached globally)
  const { data: allRacers = [] } = useRacers();

  // TanStack Query: Fetch vehicles, classes, and handling signals for selected racer
  const { data: vehicles = [] } = useVehiclesByRacer(selectedRacer?.id);
  const { data: classes = [] } = useClassesByRacer(selectedRacer?.id);
  const { data: customSignals = [] } = useHandlingSignals(selectedRacer?.id);

  // TanStack Query: Mutations
  const createRacerMutation = useCreateRacer();
  const createVehicleMutation = useCreateVehicle();
  const updateRacerMutation = useUpdateRacer();
  const deleteRacerMutation = useDeleteRacer();
  const updateVehicleMutation = useUpdateVehicle();
  const createHandlingSignalMutation = useCreateHandlingSignal();
  const deleteHandlingSignalMutation = useDeleteHandlingSignal();

  // UI State
  const [isRacerDropdownOpen, setIsRacerDropdownOpen] = useState(false);
  const [isAddingRacer, setIsAddingRacer] = useState(false);
  const [newRacerName, setNewRacerName] = useState('');

  const [newSponsor, setNewSponsor] = useState('');
  const [sponsorCategory, setSponsorCategory] = useState('');

  const [isAddingVehicle, setIsAddingVehicle] = useState(false);
  const [newVehicle, setNewVehicle] = useState({ brand: '', model: '', transponder: '', class_id: '' });

  const [setupModalOpen, setSetupModalOpen] = useState(false);
  const [setupForm, setSetupForm] = useState({
    shocks: '',
    diff: '',
    gearing: '',
    // v6.0.1 Schema Expansion
    tire_compound: '',
    tire_insert: '',
    tread_pattern: '',
    camber: '',
    toe_in: '',
    ride_height: '',
    front_toe_out: '',
    front_sway_bar: '',
    rear_sway_bar: '',
    punch: '',
    brake: ''
  });

  const [uiScalingOpen, setUiScalingOpen] = useState(false);

  const [signalManagerOpen, setSignalManagerOpen] = useState(false);
  const [newSignal, setNewSignal] = useState({ label: '', description: '' });

  // Identity Editing State
  const [isEditingIdentity, setIsEditingIdentity] = useState(false);
  const [editIdentityForm, setEditIdentityForm] = useState({ name: '', email: '' });

  // Sponsor Editing State
  const [editingSponsorIdx, setEditingSponsorIdx] = useState<number | null>(null);
  const [editingSponsorValue, setEditingSponsorValue] = useState('');

  // --- HANDLERS: IDENTITY EDITING ---
  const handleStartEditIdentity = () => {
    if (!selectedRacer) return;
    setEditIdentityForm({
      name: selectedRacer.name,
      email: selectedRacer.email || ''
    });
    setIsEditingIdentity(true);
  };

  const handleSaveIdentity = async () => {
    if (!selectedRacer || !editIdentityForm.name.trim()) {
      alert('Name cannot be empty');
      return;
    }
    try {
      const updatedProfile = await updateRacerMutation.mutateAsync({
        racerId: selectedRacer.id,
        updates: {
          name: editIdentityForm.name.trim(),
          email: editIdentityForm.email.trim() || undefined
        }
      });
      setSelectedRacer(updatedProfile);
      setIsEditingIdentity(false);
    } catch (err: any) {
      console.error('Failed to update identity', err);
      alert(`Failed to update identity: ${err.message || 'Unknown error'}`);
    }
  };

  const handleCancelEditIdentity = () => {
    setIsEditingIdentity(false);
    setEditIdentityForm({ name: '', email: '' });
  };

  const handleDeleteProfile = async () => {
    if (!selectedRacer) return;

    const confirmDelete = window.confirm(
      `⚠️ DELETE PROFILE: "${selectedRacer.name}"\n\n` +
      `This will permanently delete:\n` +
      `• Profile identity\n` +
      `• All vehicles\n` +
      `• All sessions\n` +
      `• All setup data\n\n` +
      `This action CANNOT be undone.\n\n` +
      `Type the profile name to confirm deletion.`
    );

    if (!confirmDelete) return;

    const typedName = window.prompt(
      `Type "${selectedRacer.name}" exactly to confirm deletion:`
    );

    if (typedName !== selectedRacer.name) {
      alert('Profile name did not match. Deletion cancelled.');
      return;
    }

    try {
      await deleteRacerMutation.mutateAsync(selectedRacer.id);

      // Select first available racer or null
      const remainingRacers = allRacers.filter(r => r.id !== selectedRacer.id);
      setSelectedRacer(remainingRacers[0] || null);

      setIsEditingIdentity(false);
      alert('✓ Profile deleted successfully');
    } catch (err: any) {
      console.error('Failed to delete profile', err);
      alert(`Failed to delete profile: ${err.message || 'Unknown error'}`);
    }
  };

  // --- HANDLERS: RACER IDENTITY ---
  const handleCreateRacer = async () => {
    if (!newRacerName.trim()) {
      alert("Racer name cannot be empty");
      return;
    }
    try {
      const newRacer = await createRacerMutation.mutateAsync({
        name: newRacerName,
        sponsors: [],
        is_default: false
      });
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
        const updatedProfile = await updateRacerMutation.mutateAsync({
          racerId: selectedRacer.id,
          updates: { sponsors: updatedSponsors }
        });
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
      const updatedProfile = await updateRacerMutation.mutateAsync({
        racerId: selectedRacer.id,
        updates: { sponsors: updatedSponsors }
      });
      setSelectedRacer(updatedProfile);
    } catch (err: any) {
      console.error('Failed to remove sponsor', err);
      alert(`Failed to remove sponsor: ${err.message || 'Unknown error'}`);
    }
  };

  const handleStartEditSponsor = (idx: number, sponsor: string) => {
    setEditingSponsorIdx(idx);
    setEditingSponsorValue(sponsor);
  };

  const handleSaveSponsorEdit = async () => {
    if (!selectedRacer || editingSponsorIdx === null || !editingSponsorValue.trim()) return;
    const updatedSponsors = [...(selectedRacer.sponsors || [])];
    updatedSponsors[editingSponsorIdx] = editingSponsorValue.trim();
    try {
      const updatedProfile = await updateRacerMutation.mutateAsync({
        racerId: selectedRacer.id,
        updates: { sponsors: updatedSponsors }
      });
      setSelectedRacer(updatedProfile);
      setEditingSponsorIdx(null);
      setEditingSponsorValue('');
    } catch (err: any) {
      console.error('Failed to update sponsor', err);
      alert(`Failed to update sponsor: ${err.message || 'Unknown error'}`);
    }
  };

  const handleCancelSponsorEdit = () => {
    setEditingSponsorIdx(null);
    setEditingSponsorValue('');
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
      await createVehicleMutation.mutateAsync({
        profile_id: selectedRacer.id,
        brand: newVehicle.brand.trim(),
        model: newVehicle.model.trim(),
        transponder: newVehicle.transponder.trim() || undefined,
        baseline_setup: {},
        ...(newVehicle.class_id && { class_id: newVehicle.class_id })
      } as any);
      setIsAddingVehicle(false);
      setNewVehicle({ brand: '', model: '', transponder: '', class_id: '' });

      // Note: TanStack Query automatically invalidates vehicle cache after mutation
    } catch (err: any) {
      console.error('Failed to create vehicle', err);
      alert(`Failed to create vehicle: ${err.message || 'Unknown error'}`);
    }
  };

  const handleOpenSetupModal = () => {
    if (!selectedVehicle) return;
    const setup = selectedVehicle.baseline_setup as Record<string, any>;
    setSetupForm({
      shocks: (setup.shock_oil || '') as string,
      diff: (setup.diff_oil || '') as string,
      gearing: (setup.gear || '') as string,
      // v6.0.1 Schema Fields
      tire_compound: (setup.tire_compound || '') as string,
      tire_insert: (setup.tire_insert || '') as string,
      tread_pattern: (setup.tread_pattern || '') as string,
      camber: (setup.camber || '') as string,
      toe_in: (setup.toe_in || '') as string,
      ride_height: (setup.ride_height || '') as string,
      front_toe_out: (setup.front_toe_out || '') as string,
      front_sway_bar: (setup.front_sway_bar || '') as string,
      rear_sway_bar: (setup.rear_sway_bar || '') as string,
      punch: (setup.punch || '') as string,
      brake: (setup.brake || '') as string
    });
    setSetupModalOpen(true);
  };

  const handleSaveSetup = async () => {
    if (!selectedVehicle) return;
    try {
      const updated = await updateVehicleMutation.mutateAsync({
        vehicleId: selectedVehicle.id,
        updates: {
          baseline_setup: {
            shock_oil: setupForm.shocks.trim(),
            diff_oil: setupForm.diff.trim(),
            gear: setupForm.gearing.trim(),
            // v6.0.1 Schema Fields
            tire_compound: setupForm.tire_compound.trim(),
            tire_insert: setupForm.tire_insert.trim(),
            tread_pattern: setupForm.tread_pattern.trim(),
            camber: setupForm.camber.trim(),
            toe_in: setupForm.toe_in.trim(),
            ride_height: setupForm.ride_height.trim(),
            front_toe_out: setupForm.front_toe_out.trim(),
            front_sway_bar: setupForm.front_sway_bar.trim(),
            rear_sway_bar: setupForm.rear_sway_bar.trim(),
            punch: setupForm.punch.trim(),
            brake: setupForm.brake.trim()
          }
        }
      });
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
      await createHandlingSignalMutation.mutateAsync({
        profile_id: selectedRacer.id,
        label: newSignal.label.trim(),
        description: newSignal.description.trim() || undefined
      });
      setNewSignal({ label: '', description: '' });
    } catch (err: any) {
      console.error('Failed to add signal', err);
      alert(`Failed to add signal: ${err.message || 'Unknown error'}`);
    }
  };

  const handleDeleteSignal = async (id: string) => {
    if (!selectedRacer) return;
    try {
      await deleteHandlingSignalMutation.mutateAsync({
        signalId: id,
        racerId: selectedRacer.id
      });
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


  return (
    <div className="flex h-full bg-[#121212] text-white font-sans overflow-auto relative">

      {/* PINNED SIDEBAR (RACER IDENTITY) */}
      <div className="w-[385px] bg-[#0d0d0f] border-r border-white/5 flex flex-col z-50 transition-transform">
        {/* Sidebar Header */}
        <div className="p-4 bg-white/[0.02] border-b border-white/10 flex justify-between items-center">
          <span className="text-base text-[#E53935] font-black uppercase tracking-[2px]">◆ Racer Identity</span>
          <button className="text-[#E53935] text-base font-black uppercase tracking-widest">[ PINNED ]</button>
        </div>

        {/* Profile Content */}
        <div className="p-[30px] flex-1 overflow-y-auto">
          {/* Identity Group */}
          <div className="mb-5 relative">
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-extrabold text-[#555] uppercase">Registry Name</label>
              {selectedRacer && !isEditingIdentity && (
                <button
                  onClick={handleStartEditIdentity}
                  className="text-xs font-black uppercase tracking-wider text-[#E53935] hover:text-white border border-[#E53935] px-2 py-0.5 rounded hover:bg-[#E53935] transition-all"
                >
                  [EDIT PROFILE]
                </button>
              )}
            </div>

            {/* EDITING MODE */}
            {isEditingIdentity ? (
              <div className="space-y-3 bg-black/30 border border-[#E53935] rounded p-3">
                <div>
                  <label className="text-xs font-bold text-[#777] uppercase block mb-1">Name</label>
                  <input
                    autoFocus
                    type="text"
                    value={editIdentityForm.name}
                    onChange={(e) => setEditIdentityForm({ ...editIdentityForm, name: e.target.value })}
                    className="w-full bg-black border border-white/10 p-2 text-white text-sm font-mono rounded focus:outline-none focus:border-[#E53935]"
                    placeholder="Racer Name"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#777] uppercase block mb-1">Email</label>
                  <input
                    type="email"
                    value={editIdentityForm.email}
                    onChange={(e) => setEditIdentityForm({ ...editIdentityForm, email: e.target.value })}
                    className="w-full bg-black border border-white/10 p-2 text-white text-sm font-mono rounded focus:outline-none focus:border-[#E53935]"
                    placeholder="email@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveIdentity}
                      className="flex-1 border border-[#E53935] bg-[#E53935] text-white text-xs font-black uppercase py-1.5 rounded hover:bg-[#FF6B6B] transition-all"
                    >
                      SAVE
                    </button>
                    <button
                      onClick={handleCancelEditIdentity}
                      className="flex-1 border border-white/10 bg-white/[0.05] text-white text-xs font-black uppercase py-1.5 rounded hover:bg-white/[0.1] transition-all"
                    >
                      CANCEL
                    </button>
                  </div>
                  <button
                    onClick={handleDeleteProfile}
                    className="w-full border border-red-600 bg-red-900/20 text-red-500 text-xs font-black uppercase py-1.5 rounded hover:bg-red-600 hover:text-white transition-all"
                  >
                    ⚠ DELETE PROFILE (PERMANENT)
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* RACER SELECTOR */}
                <div
                  onClick={() => setIsRacerDropdownOpen(!isRacerDropdownOpen)}
                  className="bg-black border border-white/5 p-3 text-white text-base font-mono rounded w-full cursor-pointer hover:border-[#E53935] transition-colors flex justify-between items-center"
                >
                  <span>{selectedRacer?.name || 'SELECT RACER'}</span>
                  <span className="text-sm text-[#555]">▼</span>
                </div>
              </>
            )}

            {/* DROPDOWN MENU */}
            {isRacerDropdownOpen && !isEditingIdentity && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-[#1a1a1c] border border-[#E53935] rounded z-[60] shadow-xl">
                <div className="max-h-[200px] overflow-y-auto">
                  {allRacers.map(racer => (
                    <div
                      key={racer.id}
                      onClick={() => {
                        setSelectedRacer(racer);
                        setIsRacerDropdownOpen(false);
                      }}
                      className="p-3 hover:bg-[#E53935]/10 cursor-pointer text-base font-mono border-b border-white/5 last:border-0"
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
                        className="flex-1 bg-black border border-white/20 p-1 text-sm text-white"
                        placeholder="New Racer Name"
                        value={newRacerName}
                        onChange={e => setNewRacerName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleCreateRacer()}
                      />
                      <button onClick={handleCreateRacer} className="border border-[#E53935] bg-[#E53935]/10 text-[#E53935] hover:bg-[#E53935] hover:text-white transition-all uppercase font-black tracking-wider text-sm px-2 py-1">[SAVE]</button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setIsAddingRacer(true)}
                      className="w-full text-center border border-[#E53935] bg-[#E53935]/10 text-[#E53935] hover:bg-[#E53935] hover:text-white transition-all uppercase font-black tracking-wider text-sm py-1.5 rounded"
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
            <label className="text-sm font-extrabold text-[#555] uppercase block mb-2">Sponsor Portfolio</label>
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSponsor}
                  onChange={(e) => setNewSponsor(e.target.value)}
                  onKeyDown={handleAddSponsor}
                  className="flex-1 bg-black border border-white/5 p-2 text-white text-sm font-mono rounded focus:outline-none focus:border-[#E53935]"
                  placeholder="Sponsor Name..."
                  disabled={!selectedRacer}
                />
                <input
                  type="text"
                  list="sponsor-categories"
                  value={sponsorCategory}
                  onChange={(e) => setSponsorCategory(e.target.value)}
                  className="bg-black border border-white/5 p-2 text-white text-sm font-mono rounded focus:outline-none focus:border-[#E53935] min-w-[120px]"
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
                  className="border border-[#E53935] bg-[#E53935] text-white text-sm font-black px-3 rounded hover:bg-[#FF6B6B] transition-all disabled:opacity-50"
                  disabled={!selectedRacer || !newSponsor.trim()}
                >
                  [+]
                </button>
              </div>
              <div className="flex gap-[5px] flex-wrap mt-2 min-h-[40px] content-start">
                {selectedRacer?.sponsors?.map((sponsor, idx) => (
                  editingSponsorIdx === idx ? (
                    // EDIT MODE
                    <div key={idx} className="flex items-center gap-1 bg-black border border-[#E53935] rounded-[3px] px-2 py-1">
                      <input
                        autoFocus
                        type="text"
                        value={editingSponsorValue}
                        onChange={(e) => setEditingSponsorValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveSponsorEdit();
                          if (e.key === 'Escape') handleCancelSponsorEdit();
                        }}
                        className="bg-transparent border-none outline-none text-white text-sm font-bold w-[150px]"
                      />
                      <button
                        onClick={handleSaveSponsorEdit}
                        className="text-green-500 hover:text-green-400 text-xs font-black"
                        title="Save (Enter)"
                      >
                        ✓
                      </button>
                      <button
                        onClick={handleCancelSponsorEdit}
                        className="text-[#777] hover:text-white text-xs font-black"
                        title="Cancel (Esc)"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    // VIEW MODE
                    <span
                      key={idx}
                      className="text-sm px-2 py-1 border border-[#E53935] text-[#E53935] font-bold rounded-[3px] cursor-pointer hover:bg-[#E53935] hover:text-white transition-colors group relative"
                    >
                      <span onClick={() => handleStartEditSponsor(idx, sponsor)}>{sponsor}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveSponsor(sponsor);
                        }}
                        className="ml-2 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ✕
                      </button>
                    </span>
                  )
                ))}
                {(!selectedRacer?.sponsors || selectedRacer.sponsors.length === 0) && (
                  <span className="text-sm text-[#444] italic pt-1">No sponsors defined. Add one above.</span>
                )}
              </div>
            </div>
          </div>

          {/* System Preferences */}
          <div className="mt-10 border-t border-white/5 pt-5">
            <label className="text-sm font-extrabold text-[#555] uppercase block mb-2">System Preferences</label>
            <button
              onClick={() => setUiScalingOpen(true)}
              className="w-full border border-[#E53935] bg-[#E53935]/10 text-[#E53935] hover:bg-[#E53935] hover:text-white transition-all uppercase font-black tracking-wider text-sm p-2.5 mb-2.5">
              UI Scaling (Accessibility)
            </button>
            <button
              onClick={() => setSignalManagerOpen(true)}
              className="w-full border border-[#E53935] bg-[#E53935]/10 text-[#E53935] hover:bg-[#E53935] hover:text-white transition-all uppercase font-black tracking-wider text-sm p-2.5 flex justify-center items-center">
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
            <span className="text-base text-[#E53935] font-black uppercase tracking-[2px]">◆ Active Vehicle Assets</span>
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
                <div className="font-mono text-base text-[#666] mt-[5px] uppercase">
                  {getClassName(vehicle.class_id)} • {vehicle.transponder || 'NO-TX'}
                </div>
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-sm bg-[#E53935] text-white px-1 rounded">SETUP</span>
                </div>
              </div>
            ))}

            {/* V-Card: Add New Form or Button */}
            {isAddingVehicle ? (
              <div className="bg-[#1a1a1c] border border-[#E53935] p-[18px] rounded flex flex-col gap-2 animate-in fade-in duration-300">
                <input
                  autoFocus
                  placeholder="BRAND (e.g. TEKNO)"
                  className="bg-black border border-white/10 p-1.5 text-sm text-white font-bold"
                  value={newVehicle.brand}
                  onChange={e => setNewVehicle({ ...newVehicle, brand: e.target.value })}
                />
                <input
                  placeholder="MODEL (e.g. NB48 2.2)"
                  className="bg-black border border-white/10 p-1.5 text-sm text-white font-bold"
                  value={newVehicle.model}
                  onChange={e => setNewVehicle({ ...newVehicle, model: e.target.value })}
                />
                <div className="flex gap-2">
                  <select
                    className="bg-black border border-white/10 p-1.5 text-sm text-white font-mono flex-1"
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
                  className="bg-black border border-white/10 p-1.5 text-sm text-white font-mono"
                  value={newVehicle.transponder}
                  onChange={e => setNewVehicle({ ...newVehicle, transponder: e.target.value })}
                />
                <div className="flex gap-2 mt-1">
                  <button onClick={handleCreateVehicle} className="flex-1 border border-[#E53935] bg-[#E53935] text-white text-sm font-black uppercase py-1.5 hover:bg-[#FF6B6B] transition-all">SAVE</button>
                  <button onClick={() => setIsAddingVehicle(false)} className="flex-1 border border-white/10 bg-white/[0.05] text-white text-sm font-black uppercase py-1.5 hover:bg-white/[0.1] transition-all">CANCEL</button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => setIsAddingVehicle(true)}
                className="bg-[#1a1a1c]/80 backdrop-blur-sm border border-dashed border-[#E53935]/30 p-[18px] rounded flex items-center justify-center opacity-50 hover:opacity-100 hover:border-[#E53935] hover:text-[#E53935] hover:bg-[#E53935]/5 cursor-pointer transition-all min-h-[85px]"
              >
                <span className="text-base font-black uppercase tracking-widest">[+] ADD NEW ASSET</span>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* SETUP DETAIL MODAL */}
      {setupModalOpen && selectedVehicle && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-[#1a1a1c] border border-[#E53935] rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-5">
              <span className="text-base font-black uppercase tracking-tight">◆ Setup Details</span>
              <button
                onClick={() => setSetupModalOpen(false)}
                className="text-[#999] hover:text-white text-lg"
              >
                ✕
              </button>
            </div>

            <div className="mb-4">
              <span className="text-base font-extrabold text-[#555] uppercase block mb-2">
                {selectedVehicle.brand} {selectedVehicle.model}
              </span>
              <div className="text-base text-[#777] font-mono">Class: {getClassName(selectedVehicle.class_id)}</div>
              <div className="text-base text-[#777] font-mono">TX: {selectedVehicle.transponder || 'NONE'}</div>
            </div>

            <div className="border-t border-white/5 pt-4 mt-4 space-y-4">
              <div>
                <label className="text-sm font-extrabold text-[#555] uppercase block mb-2">Shocks Setup</label>
                <input
                  type="text"
                  value={setupForm.shocks}
                  onChange={(e) => setSetupForm({ ...setupForm, shocks: e.target.value })}
                  className="w-full bg-black border border-white/10 p-2 text-white text-sm font-mono rounded focus:outline-none focus:border-[#E53935]"
                  placeholder="e.g., 6.5 front, 7.0 rear..."
                />
              </div>

              <div>
                <label className="text-sm font-extrabold text-[#555] uppercase block mb-2">Diff Setup</label>
                <input
                  type="text"
                  value={setupForm.diff}
                  onChange={(e) => setSetupForm({ ...setupForm, diff: e.target.value })}
                  className="w-full bg-black border border-white/10 p-2 text-white text-sm font-mono rounded focus:outline-none focus:border-[#E53935]"
                  placeholder="e.g., 3000T oil, ratio 2.6..."
                />
              </div>

              <div>
                <label className="text-sm font-extrabold text-[#555] uppercase block mb-2">Gearing</label>
                <input
                  type="text"
                  value={setupForm.gearing}
                  onChange={(e) => setSetupForm({ ...setupForm, gearing: e.target.value })}
                  className="w-full bg-black border border-white/10 p-2 text-white text-sm font-mono rounded focus:outline-none focus:border-[#E53935]"
                  placeholder="e.g., 16/37, 17/37..."
                />
              </div>

              {/* v6.0.1 SCHEMA EXPANSION */}
              <div className="border-t border-white/10 pt-4 mt-4">
                <span className="text-sm font-black text-[#E53935] uppercase block mb-3">TIRES (Grip Foundation)</span>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-extrabold text-[#555] uppercase block mb-1">Tire Compound</label>
                    <input
                      type="text"
                      value={setupForm.tire_compound}
                      onChange={(e) => setSetupForm({ ...setupForm, tire_compound: e.target.value })}
                      className="w-full bg-black border border-white/10 p-2 text-white text-sm font-mono rounded focus:outline-none focus:border-[#E53935]"
                      placeholder="e.g., Soft, Medium, Hard"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-extrabold text-[#555] uppercase block mb-1">Tire Insert</label>
                    <input
                      type="text"
                      value={setupForm.tire_insert}
                      onChange={(e) => setSetupForm({ ...setupForm, tire_insert: e.target.value })}
                      className="w-full bg-black border border-white/10 p-2 text-white text-sm font-mono rounded focus:outline-none focus:border-[#E53935]"
                      placeholder="e.g., 40, 45, 50"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-extrabold text-[#555] uppercase block mb-1">Tread Pattern</label>
                    <input
                      type="text"
                      value={setupForm.tread_pattern}
                      onChange={(e) => setSetupForm({ ...setupForm, tread_pattern: e.target.value })}
                      className="w-full bg-black border border-white/10 p-2 text-white text-sm font-mono rounded focus:outline-none focus:border-[#E53935]"
                      placeholder="e.g., Street, Grid, Custom"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-white/10 pt-4">
                <span className="text-sm font-black text-[#E53935] uppercase block mb-3">GEOMETRY (Cornering Control)</span>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-extrabold text-[#555] uppercase block mb-1">Camber</label>
                    <input
                      type="text"
                      value={setupForm.camber}
                      onChange={(e) => setSetupForm({ ...setupForm, camber: e.target.value })}
                      className="w-full bg-black border border-white/10 p-2 text-white text-sm font-mono rounded focus:outline-none focus:border-[#E53935]"
                      placeholder="e.g., -2.5°"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-extrabold text-[#555] uppercase block mb-1">Toe In</label>
                    <input
                      type="text"
                      value={setupForm.toe_in}
                      onChange={(e) => setSetupForm({ ...setupForm, toe_in: e.target.value })}
                      className="w-full bg-black border border-white/10 p-2 text-white text-sm font-mono rounded focus:outline-none focus:border-[#E53935]"
                      placeholder="e.g., 0.5mm"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-extrabold text-[#555] uppercase block mb-1">Ride Height</label>
                    <input
                      type="text"
                      value={setupForm.ride_height}
                      onChange={(e) => setSetupForm({ ...setupForm, ride_height: e.target.value })}
                      className="w-full bg-black border border-white/10 p-2 text-white text-sm font-mono rounded focus:outline-none focus:border-[#E53935]"
                      placeholder="e.g., Front 18mm, Rear 20mm"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-extrabold text-[#555] uppercase block mb-1">Front Toe Out</label>
                    <input
                      type="text"
                      value={setupForm.front_toe_out}
                      onChange={(e) => setSetupForm({ ...setupForm, front_toe_out: e.target.value })}
                      className="w-full bg-black border border-white/10 p-2 text-white text-sm font-mono rounded focus:outline-none focus:border-[#E53935]"
                      placeholder="e.g., 1.0mm"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-white/10 pt-4">
                <span className="text-sm font-black text-[#E53935] uppercase block mb-3">SHOCKS & BARS (Chassis Dynamics)</span>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-extrabold text-[#555] uppercase block mb-1">Front Sway Bar (mm)</label>
                    <input
                      type="text"
                      value={setupForm.front_sway_bar}
                      onChange={(e) => setSetupForm({ ...setupForm, front_sway_bar: e.target.value })}
                      className="w-full bg-black border border-white/10 p-2 text-white text-sm font-mono rounded focus:outline-none focus:border-[#E53935]"
                      placeholder="e.g., 5.0"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-extrabold text-[#555] uppercase block mb-1">Rear Sway Bar (mm)</label>
                    <input
                      type="text"
                      value={setupForm.rear_sway_bar}
                      onChange={(e) => setSetupForm({ ...setupForm, rear_sway_bar: e.target.value })}
                      className="w-full bg-black border border-white/10 p-2 text-white text-sm font-mono rounded focus:outline-none focus:border-[#E53935]"
                      placeholder="e.g., 5.5"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-white/10 pt-4">
                <span className="text-sm font-black text-[#E53935] uppercase block mb-3">POWER (Acceleration & Braking)</span>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-extrabold text-[#555] uppercase block mb-1">Punch (Engine Tuning)</label>
                    <input
                      type="text"
                      value={setupForm.punch}
                      onChange={(e) => setSetupForm({ ...setupForm, punch: e.target.value })}
                      className="w-full bg-black border border-white/10 p-2 text-white text-sm font-mono rounded focus:outline-none focus:border-[#E53935]"
                      placeholder="e.g., 1.3:1, 1.5:1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-extrabold text-[#555] uppercase block mb-1">Brake</label>
                    <input
                      type="text"
                      value={setupForm.brake}
                      onChange={(e) => setSetupForm({ ...setupForm, brake: e.target.value })}
                      className="w-full bg-black border border-white/10 p-2 text-white text-sm font-mono rounded focus:outline-none focus:border-[#E53935]"
                      placeholder="e.g., Ceramic, Metallic"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={handleSaveSetup}
                className="flex-1 border border-[#E53935] bg-[#E53935] text-white text-sm font-black uppercase py-2 rounded hover:bg-[#FF6B6B] transition-all shadow-[0_4px_10px_rgba(229,57,53,0.3)]"
              >
                SAVE CONFIGURATION
              </button>
              <button
                onClick={() => setSetupModalOpen(false)}
                className="flex-1 border border-white/10 bg-white/[0.05] text-white text-sm font-black uppercase py-2 rounded hover:bg-white/[0.1] transition-all"
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
              <span className="text-base font-black uppercase tracking-tight">◆ UI Scaling</span>
              <button
                onClick={() => setUiScalingOpen(false)}
                className="text-[#999] hover:text-white text-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-extrabold text-[#555] uppercase block mb-3">Scale Level: {uiScale}%</label>
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
                className="flex-1 border border-[#E53935] bg-[#E53935] text-white text-sm font-black uppercase py-2 rounded hover:bg-[#FF6B6B] transition-all"
              >
                APPLY
              </button>
              <button
                onClick={() => setUiScalingOpen(false)}
                className="flex-1 border border-white/10 bg-white/[0.05] text-white text-sm font-black uppercase py-2 rounded hover:bg-white/[0.1] transition-all"
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
              <span className="text-base font-black uppercase tracking-tight">◆ Handling Signal Manager</span>
              <button
                onClick={() => setSignalManagerOpen(false)}
                className="text-[#999] hover:text-white text-lg"
              >
                ✕
              </button>
            </div>

            <div className="bg-black/30 border border-white/5 rounded-lg p-4 mb-4">
              <div className="text-sm font-bold text-[#555] uppercase mb-2">Add New Signal Definition</div>
              <div className="flex flex-col gap-2">
                <input
                  placeholder="Signal Label (e.g. 'Diff Out')"
                  className="bg-black border border-white/10 p-2 text-sm text-white"
                  value={newSignal.label}
                  onChange={e => setNewSignal({ ...newSignal, label: e.target.value })}
                />
                <textarea
                  placeholder="Interpretation Description (What does this mean for setup?)"
                  className="bg-black border border-white/10 p-2 text-sm text-white h-16"
                  value={newSignal.description}
                  onChange={e => setNewSignal({ ...newSignal, description: e.target.value })}
                />
                <button
                  onClick={() => handleAddSignal()}
                  className="border border-[#E53935] bg-[#E53935] text-white text-sm font-black uppercase py-1.5 rounded transition-all disabled:opacity-50 hover:bg-[#FF6B6B]"
                  disabled={!newSignal.label.trim() || !selectedRacer}
                >
                  [+] Add to Dictionary
                </button>
              </div>
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              <div className="text-sm font-bold text-[#555] uppercase">Active Signal Dictionary</div>
              {customSignals.map(sig => (
                <div key={sig.id} className="p-3 bg-[#111] border border-white/5 rounded flex justify-between items-start group">
                  <div>
                    <div className="text-[#E53935] font-bold text-sm">{sig.label}</div>
                    <div className="text-[#777] text-sm mt-1">{sig.description}</div>
                  </div>
                  <button
                    onClick={() => handleDeleteSignal(sig.id)}
                    className="text-[#444] hover:text-[#E53935] text-sm opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    [DELETE]
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={() => setSignalManagerOpen(false)}
              className="w-full mt-6 border border-white/10 bg-white/[0.05] text-white text-sm font-black uppercase py-2 rounded hover:bg-white/[0.1] transition-all"
            >
              CLOSE
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
