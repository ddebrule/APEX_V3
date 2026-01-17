'use client';

import { useEffect, useState } from 'react';
import GlassCard from '@/components/common/GlassCard';
import { useMissionControlStore } from '@/stores/missionControlStore';
import { getAllRacers, getVehiclesByProfileId, createRacerProfile, createVehicle } from '@/lib/queries';
import type { RacerProfile, Vehicle } from '@/types/database';

export default function EventIdentity() {
  const {
    selectedRacer,
    selectedVehicle,
    racers,
    vehicles,
    setSelectedRacer,
    setSelectedVehicle,
    setRacers,
    setVehicles,
  } = useMissionControlStore();

  const [isAddingRacer, setIsAddingRacer] = useState(false);
  const [isAddingVehicle, setIsAddingVehicle] = useState(false);
  const [newRacer, setNewRacer] = useState({ name: '', email: '', sponsors: '' });
  const [newVehicle, setNewVehicle] = useState({ brand: '', model: '', transponder: '' });

  useEffect(() => {
    const loadRacers = async () => {
      try {
        const data = await getAllRacers();
        setRacers(data);
        if (data.length > 0 && !selectedRacer) {
          setSelectedRacer(data[0]);
        }
      } catch (error) {
        console.error('Failed to load racers:', error);
      }
    };

    loadRacers();
  }, []);

  useEffect(() => {
    const loadVehicles = async () => {
      if (!selectedRacer) return;
      try {
        const data = await getVehiclesByProfileId(selectedRacer.id);
        setVehicles(data);
        if (data.length > 0 && !selectedVehicle) {
          setSelectedVehicle(data[0]);
        }
      } catch (error) {
        console.error('Failed to load vehicles:', error);
      }
    };

    loadVehicles();
  }, [selectedRacer?.id]);

  const handleRacerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const racer = racers.find(r => r.id === e.target.value);
    if (racer) {
      setSelectedRacer(racer);
      setSelectedVehicle(null);
    }
  };

  const handleVehicleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const vehicle = vehicles.find(v => v.id === e.target.value);
    if (vehicle) {
      setSelectedVehicle(vehicle);
    }
  };

  const handleSaveRacer = async () => {
    if (!newRacer.name) return;
    try {
      const racer = await createRacerProfile({
        name: newRacer.name,
        email: newRacer.email,
        sponsors: newRacer.sponsors ? newRacer.sponsors.split(',').map(s => s.trim()) : [],
        is_default: racers.length === 0,
      });
      setRacers([racer, ...racers]);
      setSelectedRacer(racer);
      setIsAddingRacer(false);
      setNewRacer({ name: '', email: '', sponsors: '' });
    } catch (error) {
      console.error('Failed to save racer:', error);
    }
  };

  const handleSaveVehicle = async () => {
    if (!newVehicle.brand || !newVehicle.model || !selectedRacer) return;
    try {
      const vehicle = await createVehicle({
        ...newVehicle,
        profile_id: selectedRacer.id,
        baseline_setup: {},
      });
      setVehicles([vehicle, ...vehicles]);
      setSelectedVehicle(vehicle);
      setIsAddingVehicle(false);
      setNewVehicle({ brand: '', model: '', transponder: '' });
    } catch (error) {
      console.error('Failed to save vehicle:', error);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Fleet Configuration */}
      <GlassCard>
        <div className="flex justify-between items-center mb-4 border-b border-apex-green/20 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-apex-green font-mono text-xs">◆</span>
            <h2 className="header-uppercase text-sm font-bold tracking-widest text-apex-green">
              Fleet Configuration
            </h2>
          </div>
          {!isAddingRacer && (
            <button
              onClick={() => setIsAddingRacer(true)}
              className="text-[9px] uppercase font-bold tracking-widest px-2 py-1 border border-apex-green text-apex-green hover:bg-apex-green/5 transition-colors rounded font-mono"
            >
              [+] Add
            </button>
          )}
        </div>

        {isAddingRacer ? (
          <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <div>
              <label className="text-[9px] uppercase tracking-widest text-gray-500 block mb-1.5 font-mono">
                › RACER NAME
              </label>
              <input
                type="text"
                value={newRacer.name}
                onChange={(e) => setNewRacer({ ...newRacer, name: e.target.value })}
                className="w-full px-2 py-2 bg-apex-dark border border-apex-border/50 rounded text-white text-xs focus:outline-none focus:border-apex-green focus:ring-1 focus:ring-apex-green/20 font-mono transition-all"
                placeholder="Name"
              />
            </div>
            <div>
              <label className="text-[9px] uppercase tracking-widest text-gray-500 block mb-1.5 font-mono">
                › EMAIL
              </label>
              <input
                type="email"
                value={newRacer.email}
                onChange={(e) => setNewRacer({ ...newRacer, email: e.target.value })}
                className="w-full px-2 py-2 bg-apex-dark border border-apex-border/50 rounded text-white text-xs focus:outline-none focus:border-apex-green focus:ring-1 focus:ring-apex-green/20 font-mono transition-all"
                placeholder="email@racing.io"
              />
            </div>
            <div>
              <label className="text-[9px] uppercase tracking-widest text-gray-500 block mb-1.5 font-mono">
                › SPONSORS (CSV)
              </label>
              <input
                type="text"
                value={newRacer.sponsors}
                onChange={(e) => setNewRacer({ ...newRacer, sponsors: e.target.value })}
                className="w-full px-2 py-2 bg-apex-dark border border-apex-border/50 rounded text-white text-xs focus:outline-none focus:border-apex-green focus:ring-1 focus:ring-apex-green/20 font-mono transition-all"
                placeholder="Sponsor1, Sponsor2"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={handleSaveRacer}
                className="flex-1 px-2 py-1.5 bg-apex-green/10 border border-apex-green text-apex-green text-[9px] font-bold uppercase tracking-widest rounded hover:bg-apex-green/20 transition-colors font-mono"
              >
                Save
              </button>
              <button
                onClick={() => setIsAddingRacer(false)}
                className="px-2 py-1.5 border border-apex-border text-gray-400 text-[9px] font-bold uppercase tracking-widest rounded hover:bg-white/5 transition-colors font-mono"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="text-[9px] uppercase tracking-widest text-gray-500 block mb-2 font-mono">
                › SELECT RACER
              </label>
              <select
                value={selectedRacer?.id || ''}
                onChange={handleRacerChange}
                className="w-full px-2 py-2 bg-apex-dark border border-apex-border/50 rounded text-white text-xs focus:outline-none focus:border-apex-green focus:ring-1 focus:ring-apex-green/20 font-mono transition-all appearance-none"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2300e676' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 8px center',
                  paddingRight: '24px',
                }}
              >
                <option value="">─ Choose ─</option>
                {racers.map(racer => (
                  <option key={racer.id} value={racer.id}>
                    {racer.name}
                  </option>
                ))}
              </select>
            </div>

            {selectedRacer && (
              <div className="space-y-2 pt-2 border-t border-apex-border/20">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] uppercase tracking-widest text-gray-600 font-mono">ID:</span>
                  <span className="text-[9px] text-apex-green font-mono">{selectedRacer.id.slice(0, 8)}</span>
                </div>
                {selectedRacer.email && (
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] uppercase tracking-widest text-gray-600 font-mono">Email:</span>
                    <span className="text-[9px] text-gray-300 font-mono truncate">{selectedRacer.email}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </GlassCard>

      {/* Vehicle Status */}
      <GlassCard>
        <div className="flex justify-between items-center mb-4 border-b border-apex-blue/20 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-apex-blue font-mono text-xs">◆</span>
            <h2 className="header-uppercase text-sm font-bold tracking-widest text-apex-blue">
              Vehicle Status
            </h2>
          </div>
          {selectedRacer && !isAddingVehicle && (
            <button
              onClick={() => setIsAddingVehicle(true)}
              className="text-[9px] uppercase font-bold tracking-widest px-2 py-1 border border-apex-blue text-apex-blue hover:bg-apex-blue/5 transition-colors rounded font-mono"
            >
              [+] Add
            </button>
          )}
        </div>

        {isAddingVehicle ? (
          <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <div>
              <label className="text-[9px] uppercase tracking-widest text-gray-500 block mb-1.5 font-mono">
                › BRAND
              </label>
              <input
                type="text"
                value={newVehicle.brand}
                onChange={(e) => setNewVehicle({ ...newVehicle, brand: e.target.value })}
                className="w-full px-2 py-2 bg-apex-dark border border-apex-border/50 rounded text-white text-xs focus:outline-none focus:border-apex-blue focus:ring-1 focus:ring-apex-blue/20 font-mono transition-all"
                placeholder="Associated, TLR, etc."
              />
            </div>
            <div>
              <label className="text-[9px] uppercase tracking-widest text-gray-500 block mb-1.5 font-mono">
                › MODEL
              </label>
              <input
                type="text"
                value={newVehicle.model}
                onChange={(e) => setNewVehicle({ ...newVehicle, model: e.target.value })}
                className="w-full px-2 py-2 bg-apex-dark border border-apex-border/50 rounded text-white text-xs focus:outline-none focus:border-apex-blue focus:ring-1 focus:ring-apex-blue/20 font-mono transition-all"
                placeholder="B6.4, 22 5.0, etc."
              />
            </div>
            <div>
              <label className="text-[9px] uppercase tracking-widest text-gray-500 block mb-1.5 font-mono">
                › TRANSPONDER
              </label>
              <input
                type="text"
                value={newVehicle.transponder}
                onChange={(e) => setNewVehicle({ ...newVehicle, transponder: e.target.value })}
                className="w-full px-2 py-2 bg-apex-dark border border-apex-border/50 rounded text-white text-xs focus:outline-none focus:border-apex-blue focus:ring-1 focus:ring-apex-blue/20 font-mono transition-all"
                placeholder="Optional"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={handleSaveVehicle}
                className="flex-1 px-2 py-1.5 bg-apex-blue/10 border border-apex-blue text-apex-blue text-[9px] font-bold uppercase tracking-widest rounded hover:bg-apex-blue/20 transition-colors font-mono"
              >
                Save
              </button>
              <button
                onClick={() => setIsAddingVehicle(false)}
                className="px-2 py-1.5 border border-apex-border text-gray-400 text-[9px] font-bold uppercase tracking-widest rounded hover:bg-white/5 transition-colors font-mono"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="text-[9px] uppercase tracking-widest text-gray-500 block mb-2 font-mono">
                › SELECT VEHICLE
              </label>
              <select
                value={selectedVehicle?.id || ''}
                onChange={handleVehicleChange}
                disabled={!selectedRacer}
                className="w-full px-2 py-2 bg-apex-dark border border-apex-border/50 rounded text-white text-xs focus:outline-none focus:border-apex-blue focus:ring-1 focus:ring-apex-blue/20 font-mono transition-all appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%232979FF' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 8px center',
                  paddingRight: '24px',
                }}
              >
                <option value="">─ Choose ─</option>
                {vehicles.map(vehicle => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.brand} {vehicle.model}
                  </option>
                ))}
              </select>
            </div>

            {selectedVehicle && (
              <div className="space-y-2 pt-2 border-t border-apex-border/20">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] uppercase tracking-widest text-gray-600 font-mono">Transponder:</span>
                  <span className="text-[9px] text-apex-blue font-mono">{selectedVehicle.transponder || 'TBD'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[9px] uppercase tracking-widest text-gray-600 font-mono">Config:</span>
                  <span className="text-[9px] text-gray-300 font-mono">{selectedVehicle.brand} {selectedVehicle.model}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </GlassCard>
    </div>
  );
}
