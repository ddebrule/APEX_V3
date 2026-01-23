'use client';

import { useState } from 'react';
import GlassCard from '@/components/common/GlassCard';
import type { TrackContext } from '@/types/database';

interface TrackContextMatrixProps {
  onContextChange: (context: Partial<TrackContext>) => void;
  isEditable: boolean;
  initialContext?: Partial<TrackContext>;
}

type ScaleOption = 'small' | 'medium' | 'large';
type GripLevel = 'low' | 'med' | 'hi' | 'ext';
type SurfaceMaterial = 'clay' | 'hard_packed' | 'loam' | 'blue_groove';
type SurfaceCondition = 'damp_fresh' | 'dry_dusty' | 'slick' | 'bumpy';

export default function TrackContextMatrix({
  onContextChange,
  isEditable,
  initialContext = {},
}: TrackContextMatrixProps) {
  const [scale, setScale] = useState<ScaleOption>(
    (initialContext.name?.toLowerCase().includes('small') ? 'small' :
      initialContext.name?.toLowerCase().includes('large') ? 'large' : 'medium') as ScaleOption
  );
  const [grip, setGrip] = useState<GripLevel>(
    (initialContext.traction as GripLevel) || 'med'
  );
  const [material, setMaterial] = useState<SurfaceMaterial>(
    (initialContext.surface?.toLowerCase().includes('clay') ? 'clay' : 'hard_packed') as SurfaceMaterial
  );
  const [condition, setCondition] = useState<SurfaceCondition>(
    (initialContext.condition as SurfaceCondition) || 'damp_fresh'
  );

  const handleScaleChange = (newScale: ScaleOption) => {
    setScale(newScale);
    onContextChange({ name: newScale });
  };

  const handleGripChange = (newGrip: GripLevel) => {
    setGrip(newGrip);
    onContextChange({ traction: newGrip });
  };

  const handleMaterialChange = (newMaterial: SurfaceMaterial) => {
    setMaterial(newMaterial);
    onContextChange({ surface: newMaterial });
  };

  const handleConditionChange = (newCondition: SurfaceCondition) => {
    setCondition(newCondition);
    onContextChange({ condition: newCondition });
  };

  return (
    <GlassCard>
      <div className="flex items-center gap-2 mb-4 border-b border-apex-blue/20 pb-3">
        <span className="text-apex-blue font-mono text-xs">◆</span>
        <h2 className="header-uppercase text-sm font-bold tracking-widest text-apex-blue">
          Track Context Matrix (16 params)
        </h2>
      </div>

      <div className="space-y-4 p-4">
        {/* Row 1: Scale & Grip */}
        <div className="grid grid-cols-2 gap-6">
          {/* Track Scale */}
          <div>
            <label className="text-[9px] uppercase font-bold tracking-widest text-gray-600 block mb-2 font-mono">
              Track Scale
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['small', 'medium', 'large'] as ScaleOption[]).map((s) => (
                <button
                  key={s}
                  onClick={() => handleScaleChange(s)}
                  disabled={!isEditable}
                  className={`px-2 py-1.5 rounded text-[9px] font-bold uppercase tracking-widest font-mono transition-all ${scale === s
                    ? 'border border-apex-blue bg-apex-blue/10 text-white'
                    : 'border border-gray-600 bg-gray-900 text-gray-400 hover:border-apex-blue/50'
                    } ${!isEditable ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Grip Level */}
          <div>
            <label className="text-[9px] uppercase font-bold tracking-widest text-gray-600 block mb-2 font-mono">
              Grip Level
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['low', 'med', 'hi', 'ext'] as GripLevel[]).map((g) => (
                <button
                  key={g}
                  onClick={() => handleGripChange(g)}
                  disabled={!isEditable}
                  className={`px-2 py-1.5 rounded text-[9px] font-bold uppercase tracking-widest font-mono transition-all ${grip === g
                    ? 'border border-apex-blue bg-apex-blue/10 text-white'
                    : 'border border-gray-600 bg-gray-900 text-gray-400 hover:border-apex-blue/50'
                    } ${!isEditable ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Row 2: Surface Material & Condition */}
        <div className="grid grid-cols-2 gap-6">
          {/* Surface Material */}
          <div>
            <label className="text-[9px] uppercase font-bold tracking-widest text-gray-600 block mb-2 font-mono">
              Surface Material
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['clay', 'hard_packed', 'loam', 'blue_groove'] as SurfaceMaterial[]).map((m) => (
                <button
                  key={m}
                  onClick={() => handleMaterialChange(m)}
                  disabled={!isEditable}
                  className={`px-2 py-1.5 rounded text-[9px] font-bold uppercase tracking-widest font-mono transition-all text-center ${material === m
                    ? 'border border-apex-blue bg-apex-blue/10 text-white'
                    : 'border border-gray-600 bg-gray-900 text-gray-400 hover:border-apex-blue/50'
                    } ${!isEditable ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {m.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Surface Condition */}
          <div>
            <label className="text-[9px] uppercase font-bold tracking-widest text-gray-600 block mb-2 font-mono">
              Surface Condition
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['damp_fresh', 'dry_dusty', 'slick', 'bumpy'] as SurfaceCondition[]).map((c) => (
                <button
                  key={c}
                  onClick={() => handleConditionChange(c)}
                  disabled={!isEditable}
                  className={`px-2 py-1.5 rounded text-[9px] font-bold uppercase tracking-widest font-mono transition-all text-center ${condition === c
                    ? 'border border-apex-blue bg-apex-blue/10 text-white'
                    : 'border border-gray-600 bg-gray-900 text-gray-400 hover:border-apex-blue/50'
                    } ${!isEditable ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {c.replace('_', ' / ')}
                </button>
              ))}
            </div>
          </div>
        </div>

      </div>
    </GlassCard>
  );
}
