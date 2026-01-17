'use client';

import React, { useState } from 'react';
import { Prescription, FixOption } from '@/lib/physicsAdvisor';

interface ProposalCardProps {
  prescription: Prescription;
  variant: 'primary' | 'alternative';
  onApply: (customValue?: string | number) => void;
  isLoading?: boolean;
  context?: string; // e.g., "Corner-exit oversteer, hard-packed clay"
  timestamp?: string;
}

export default function ProposalCard({
  prescription,
  variant,
  onApply,
  isLoading = false,
  context,
  timestamp,
}: ProposalCardProps) {
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customValue, setCustomValue] = useState('');

  const fix = variant === 'primary' ? prescription.primary : prescription.alternative;
  const isExecutionFast = fix.executionSpeed === 'high';

  // Color scheme by variant
  const borderColor = variant === 'primary' ? 'border-apex-green' : 'border-apex-blue';
  const headerBgColor = variant === 'primary' ? 'bg-apex-green/10' : 'bg-apex-blue/10';
  const accentColor = variant === 'primary' ? 'text-apex-green' : 'text-apex-blue';
  const badgeColor =
    variant === 'primary'
      ? 'bg-apex-green/20 text-apex-green border-apex-green'
      : 'bg-apex-blue/20 text-apex-blue border-apex-blue';
  const buttonColor =
    variant === 'primary'
      ? 'bg-apex-green hover:bg-apex-green/80 text-black'
      : 'bg-apex-blue hover:bg-apex-blue/80 text-white';

  return (
    <div className={`border ${borderColor} rounded-md overflow-hidden bg-apex-dark/50 mb-3`}>
      {/* Header */}
      <div className={`${headerBgColor} px-4 py-2 border-b ${borderColor}/30 flex items-center justify-between`}>
        <div>
          <div className={`${accentColor} font-bold uppercase text-sm`}>
            {variant === 'primary' ? '⭐ PRIMARY FIX' : '🔄 ALTERNATIVE'}
          </div>
          <div className="text-xs text-gray-400 mt-0.5">{fix.category}</div>
        </div>

        {/* Physics Impact Badge */}
        <div
          className={`px-2 py-1 rounded text-xs font-mono border ${badgeColor}`}
          title="Estimated physics impact on chassis behavior (0-100)"
        >
          {fix.physicsImpact}% Impact
        </div>
      </div>

      {/* Body */}
      <div className="px-4 py-3 space-y-3">
        {/* Fix Name */}
        <div>
          <div className="text-xs text-gray-500 uppercase font-mono mb-1">Change</div>
          <div className="text-sm font-bold text-white">{fix.name}</div>
        </div>

        {/* Reasoning */}
        <div>
          <div className="text-xs text-gray-500 uppercase font-mono mb-1">Physics Reasoning</div>
          <div className="text-xs text-gray-300 leading-relaxed">{fix.reasoning}</div>
        </div>

        {/* Execution Info */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <div className="text-gray-500 uppercase font-mono">Execution Speed</div>
            <div className={`mt-1 font-mono ${isExecutionFast ? 'text-apex-green' : 'text-amber-400'}`}>
              {isExecutionFast ? '⚡ Fast' : '🔧 Slow'} ({fix.timingMinutes}m)
            </div>
          </div>
          <div>
            <div className="text-gray-500 uppercase font-mono">Pit Time</div>
            <div className="mt-1 font-mono text-white">{fix.timingMinutes} minutes</div>
          </div>
        </div>

        {/* Warnings (if any) */}
        {prescription.warnings && prescription.warnings.length > 0 && (
          <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded text-xs text-amber-200">
            <div className="font-bold mb-1">⚠️ Warnings</div>
            {prescription.warnings.map((warning, idx) => (
              <div key={idx}>{warning}</div>
            ))}
          </div>
        )}

        {/* Custom Value Input */}
        {showCustomInput ? (
          <div className="flex gap-2 pt-1">
            <input
              type="text"
              placeholder={`e.g., 115 CST or custom value`}
              value={customValue}
              onChange={(e) => setCustomValue(e.target.value)}
              className="flex-1 px-2 py-1 bg-gray-800 border border-gray-600 rounded text-white text-xs placeholder-gray-500 focus:border-gray-400 focus:outline-none"
            />
            <button
              onClick={() => {
                if (customValue.trim()) {
                  onApply(customValue);
                  setCustomValue('');
                  setShowCustomInput(false);
                }
              }}
              disabled={isLoading || !customValue.trim()}
              className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs font-mono disabled:opacity-50 transition-colors"
            >
              OK
            </button>
            <button
              onClick={() => {
                setShowCustomInput(false);
                setCustomValue('');
              }}
              className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs font-mono transition-colors"
            >
              Cancel
            </button>
          </div>
        ) : null}
      </div>

      {/* Footer: Action Buttons */}
      <div className="px-4 py-3 bg-gray-900/50 border-t border-gray-700 flex gap-2">
        <button
          onClick={() => onApply()}
          disabled={isLoading}
          className={`flex-1 px-3 py-2 rounded font-mono text-sm uppercase transition-colors disabled:opacity-50 ${buttonColor}`}
        >
          {isLoading ? '⏳ Applying...' : 'APPLY'}
        </button>

        <button
          onClick={() => setShowCustomInput(!showCustomInput)}
          disabled={isLoading}
          className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded font-mono text-xs uppercase text-white transition-colors disabled:opacity-50"
          title="Override the suggested value"
        >
          {showCustomInput ? '✕ Hide' : '✎ Custom'}
        </button>
      </div>
    </div>
  );
}
