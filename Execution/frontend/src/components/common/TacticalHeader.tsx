'use client';

import { useMemo } from 'react';
import { useMissionControlStore } from '@/stores/missionControlStore';
import GlassCard from '@/components/common/GlassCard';
import type { Session } from '@/types/database';

interface TacticalHeaderProps {
  session: Session;
}

export default function TacticalHeader({ session }: TacticalHeaderProps) {
  const { vehicles } = useMissionControlStore();

  // Compute all 6 metric slots
  const metrics = useMemo(() => {
    const { event_name, track_context, vehicle_id } = session;

    // SLOT 1: EVENT
    const event = event_name || 'UNNAMED EVENT';

    // SLOT 2: CLASSES
    const classCount = track_context.race_classes?.length || 0;
    const classes = classCount > 0 ? classCount.toString() : 'SINGLE';

    // SLOT 3: FLEET
    let fleet = '';
    if (track_context.race_classes && track_context.race_classes.length > 0) {
      // Multiclass: resolve each vehicleId to model name
      const modelNames = track_context.race_classes
        .map((rc) => {
          const vehicle = vehicles.find((v) => v.id === rc.vehicleId);
          return vehicle ? `${vehicle.brand} ${vehicle.model}` : null;
        })
        .filter(Boolean) as string[];
      fleet = modelNames.join(', ') || 'UNKNOWN';
    } else {
      // Single class: use selectedSession.vehicle_id
      const vehicle = vehicles.find((v) => v.id === vehicle_id);
      fleet = vehicle ? `${vehicle.brand} ${vehicle.model}` : 'UNKNOWN';
    }

    // SLOT 4: GRIP
    const grip = track_context.traction?.toUpperCase() || 'N/A';

    // SLOT 5: SURFACE
    const material = track_context.surface?.toUpperCase() || 'N/A';
    const condition = track_context.condition?.toUpperCase().replace('_', ' / ') || 'N/A';
    const surface = material !== 'N/A' && condition !== 'N/A'
      ? `${material} / ${condition}`
      : material !== 'N/A' ? material : 'N/A';

    // SLOT 6: AMBIENT
    const temp = track_context.temperature || track_context.anticipated_temp;
    const ambient = temp ? `${temp}°F` : '74.2°F (MOCK)';

    return { event, classes, fleet, grip, surface, ambient };
  }, [session, vehicles]);

  return (
    <GlassCard>
      <div className="px-6 py-4">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4 border-b border-apex-blue/20 pb-3">
          <span className="text-apex-blue font-mono text-xs">◆</span>
          <h2 className="text-xs font-bold tracking-widest text-apex-blue font-mono uppercase">
            Tactical Header
          </h2>
        </div>

        {/* 6 Metric Slots in a Horizontal Grid */}
        <div className="grid grid-cols-6 gap-4">
          {/* SLOT 1: EVENT */}
          <div className="border border-apex-border bg-apex-surface bg-opacity-30 rounded p-3">
            <div className="text-[9px] uppercase font-bold tracking-widest text-gray-600 mb-1 font-mono">
              Event
            </div>
            <div className="text-xs font-bold text-white truncate" title={metrics.event}>
              {metrics.event}
            </div>
          </div>

          {/* SLOT 2: CLASSES */}
          <div className="border border-apex-border bg-apex-surface bg-opacity-30 rounded p-3">
            <div className="text-[9px] uppercase font-bold tracking-widest text-gray-600 mb-1 font-mono">
              Classes
            </div>
            <div className="text-xs font-bold text-white">
              {metrics.classes}
            </div>
          </div>

          {/* SLOT 3: FLEET */}
          <div className="border border-apex-border bg-apex-surface bg-opacity-30 rounded p-3">
            <div className="text-[9px] uppercase font-bold tracking-widest text-gray-600 mb-1 font-mono">
              Fleet
            </div>
            <div className="text-xs font-bold text-white truncate" title={metrics.fleet}>
              {metrics.fleet}
            </div>
          </div>

          {/* SLOT 4: GRIP */}
          <div className="border border-apex-border bg-apex-surface bg-opacity-30 rounded p-3">
            <div className="text-[9px] uppercase font-bold tracking-widest text-gray-600 mb-1 font-mono">
              Grip
            </div>
            <div className="text-xs font-bold text-white">
              {metrics.grip}
            </div>
          </div>

          {/* SLOT 5: SURFACE */}
          <div className="border border-apex-border bg-apex-surface bg-opacity-30 rounded p-3">
            <div className="text-[9px] uppercase font-bold tracking-widest text-gray-600 mb-1 font-mono">
              Surface
            </div>
            <div className="text-xs font-bold text-white truncate" title={metrics.surface}>
              {metrics.surface}
            </div>
          </div>

          {/* SLOT 6: AMBIENT */}
          <div className="border border-apex-border bg-apex-surface bg-opacity-30 rounded p-3">
            <div className="text-[9px] uppercase font-bold tracking-widest text-gray-600 mb-1 font-mono">
              Ambient
            </div>
            <div className="text-xs font-bold text-white">
              {metrics.ambient}
            </div>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
