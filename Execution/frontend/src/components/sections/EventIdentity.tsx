'use client';

import { useEffect } from 'react';
import GlassCard from '@/components/common/GlassCard';
import DataDisplay from '@/components/common/DataDisplay';
import { useMissionControlStore } from '@/stores/missionControlStore';
import { getAllRacers, getVehiclesByProfileId } from '@/lib/queries';
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Racer & Event */}
      <GlassCard>
        <h2 className="header-uppercase text-lg mb-4 border-b border-apex-border pb-3">
          Fleet Configuration
        </h2>
        <div className="space-y-4">
          <div>
            <label className="text-xs uppercase tracking-wide text-gray-400 block mb-2">
              Select Racer
            </label>
            <select
              value={selectedRacer?.id || ''}
              onChange={handleRacerChange}
              className="w-full px-3 py-2 bg-apex-dark border border-apex-border rounded text-white text-sm focus:outline-none focus:border-apex-blue"
            >
              <option value="">Choose Racer...</option>
              {racers.map(racer => (
                <option key={racer.id} value={racer.id}>
                  {racer.name}
                </option>
              ))}
            </select>
          </div>

          {selectedRacer && (
            <>
              <DataDisplay label="Racer ID" value={selectedRacer.id.slice(0, 8)} mono />
              <DataDisplay label="Email" value={selectedRacer.email || 'N/A'} />
            </>
          )}
        </div>
      </GlassCard>

      {/* Vehicle & Transponder */}
      <GlassCard>
        <h2 className="header-uppercase text-lg mb-4 border-b border-apex-border pb-3">
          Vehicle Status
        </h2>
        <div className="space-y-4">
          <div>
            <label className="text-xs uppercase tracking-wide text-gray-400 block mb-2">
              Select Vehicle
            </label>
            <select
              value={selectedVehicle?.id || ''}
              onChange={handleVehicleChange}
              disabled={!selectedRacer}
              className="w-full px-3 py-2 bg-apex-dark border border-apex-border rounded text-white text-sm focus:outline-none focus:border-apex-blue disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">Choose Vehicle...</option>
              {vehicles.map(vehicle => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.brand} {vehicle.model}
                </option>
              ))}
            </select>
          </div>

          {selectedVehicle && (
            <>
              <DataDisplay label="Transponder" value={selectedVehicle.transponder || 'TBD'} mono />
              <DataDisplay label="Brand/Model" value={`${selectedVehicle.brand} ${selectedVehicle.model}`} />
            </>
          )}
        </div>
      </GlassCard>
    </div>
  );
}
