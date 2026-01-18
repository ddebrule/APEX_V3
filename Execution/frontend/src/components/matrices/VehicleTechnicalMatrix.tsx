'use client';

import GlassCard from '@/components/common/GlassCard';
import type { Vehicle } from '@/types/database';

interface VehicleTechnicalMatrixProps {
  vehicles: Vehicle[];
  isEditable: boolean;
  selectedVehicleIds?: string[];
  onVehicleSelect?: (vehicleId: string) => void;
}

interface TechnicalParameter {
  label: string;
  key: string;
  unit?: string;
}

const TECHNICAL_PARAMETERS: TechnicalParameter[] = [
  { label: 'Shock Oil (F/R)', key: 'shock_oil', unit: 'CST' },
  { label: 'Spring Rate (F/R)', key: 'spring_rate' },
  { label: 'Diff Oil (F/C/R)', key: 'diff_oil', unit: 'K' },
  { label: 'Tire / Foam', key: 'tire_foam' },
  { label: 'Ride Height (F/R)', key: 'ride_height', unit: 'MM' },
  { label: 'Camber (F/R)', key: 'camber', unit: 'DEG' },
  { label: 'Sway Bar (F/R)', key: 'sway_bar', unit: 'MM' },
  { label: 'Droop (F/R)', key: 'droop', unit: 'MM' },
  { label: 'Toe-In / Out', key: 'toe_in' },
];

export default function VehicleTechnicalMatrix({
  vehicles,
  isEditable,
  selectedVehicleIds = [],
  onVehicleSelect,
}: VehicleTechnicalMatrixProps) {
  const getParameterValue = (vehicle: Vehicle, key: string): string => {
    const setup = vehicle.baseline_setup as Record<string, unknown>;
    return setup?.[key]?.toString() || '—';
  };

  const handleAIBridge = (vehicleId: string) => {
    // Placeholder for AI bridge functionality
    console.log('Bridge to AI for vehicle:', vehicleId);
  };

  return (
    <GlassCard>
      <div className="flex items-center gap-2 mb-4 border-b border-apex-red/20 pb-3">
        <span className="text-apex-red font-mono text-xs">◆</span>
        <h2 className="header-uppercase text-sm font-bold tracking-widest text-apex-red">
          Active Fleet Technical Matrix (9 points)
        </h2>
      </div>

      {vehicles.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-apex-border/50 bg-apex-surface/50">
                <th className="text-left px-4 py-3 text-[9px] uppercase font-bold tracking-widest text-gray-600 font-mono">
                  Technical Parameter
                </th>
                {vehicles.slice(0, 2).map((vehicle) => (
                  <th key={vehicle.id} className="text-left px-4 py-3">
                    <div className="flex flex-col gap-2">
                      <div className="text-[11px] font-bold text-apex-blue font-mono">
                        {vehicle.brand} {vehicle.model}
                      </div>
                      <button
                        onClick={() => handleAIBridge(vehicle.id)}
                        className="text-[8px] font-bold uppercase tracking-widest text-apex-red hover:text-apex-red/80 transition-colors font-mono border border-apex-red/30 px-2 py-1 rounded hover:border-apex-red/60"
                      >
                        Discuss with AI →
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TECHNICAL_PARAMETERS.map((param, idx) => (
                <tr
                  key={param.key}
                  className="border-b border-apex-border/30 hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-4 py-3 text-[11px] font-bold text-gray-600 uppercase tracking-widest font-mono">
                    {param.label}
                  </td>
                  {vehicles.slice(0, 2).map((vehicle) => (
                    <td key={vehicle.id} className="px-4 py-3 font-mono text-sm text-gray-300">
                      {getParameterValue(vehicle, param.key)}
                      {param.unit && <span className="text-[9px] text-gray-600 ml-1">{param.unit}</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-400 text-xs font-mono">
          <p>○ NO VEHICLES AVAILABLE</p>
          <p className="text-[8px] text-gray-600 mt-1">Add vehicles to Mission Control first</p>
        </div>
      )}
    </GlassCard>
  );
}
