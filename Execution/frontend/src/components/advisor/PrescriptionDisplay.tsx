'use client';

import { useState } from 'react';
import { Prescription } from '@/lib/physicsAdvisor';
import { useAdvisorStore, useCanAccept } from '@/stores/advisorStore';
import { useMissionControlStore } from '@/stores/missionControlStore';
import GlassCard from '@/components/common/GlassCard';

interface PrescriptionDisplayProps {
  prescription: Prescription;
}

export default function PrescriptionDisplay({ prescription }: PrescriptionDisplayProps) {
  const { acceptPrescription, isAccepting, error } = useAdvisorStore();
  const { selectedSession } = useMissionControlStore();
  const canAccept = useCanAccept();

  const [acceptedChoice, setAcceptedChoice] = useState<'primary' | 'alternative' | null>(null);

  const handleAccept = async (choice: 'primary' | 'alternative') => {
    if (!selectedSession || !canAccept) return;

    try {
      setAcceptedChoice(choice);

      // Prepare setup change data
      const setupChangeData = {
        session_id: selectedSession.id as string,
        // old_value and new_value would come from session.actual_setup
        // For now, we'll let the API handle defaults
      };

      await acceptPrescription(choice, setupChangeData);

      // Clear after short delay
      setTimeout(() => setAcceptedChoice(null), 2000);
    } catch (err) {
      console.error('Failed to accept prescription:', err);
    }
  };

  return (
    <div className="space-y-4">
      {/* PRIMARY FIX - LEFT CARD (Green) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <GlassCard className="border-2 border-apex-green">
          <div className="space-y-4">
            {/* Header */}
            <div className="border-b border-apex-green/30 pb-4">
              <p className="text-xs font-bold uppercase text-apex-green tracking-widest">★ Ideal Performance Fix</p>
              <p className="text-lg font-bold text-apex-green mt-2 font-mono">{prescription.primary.name}</p>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-4">
              {/* Impact Score */}
              <div>
                <p className="text-xs uppercase text-gray-500 font-bold">Physics Impact</p>
                <div className="mt-2 flex items-center gap-2">
                  <div className="text-2xl font-bold text-apex-green">{prescription.primary.physicsImpact}</div>
                  <p className="text-xs text-gray-500">/100</p>
                </div>
                <div className="mt-2 w-full bg-gray-700 rounded h-1.5">
                  <div
                    className="h-1.5 bg-apex-green rounded"
                    style={{ width: `${prescription.primary.physicsImpact}%` }}
                  />
                </div>
              </div>

              {/* Execution Speed */}
              <div>
                <p className="text-xs uppercase text-gray-500 font-bold">Execution</p>
                <div className="mt-2">
                  <p className="text-2xl font-bold text-apex-green">{prescription.primary.timingMinutes.toFixed(0)}</p>
                  <p className="text-xs text-gray-500">minutes</p>
                </div>
              </div>
            </div>

            {/* Category & Speed */}
            <div className="bg-gray-900/50 rounded p-3 space-y-1">
              <p className="text-xs text-gray-500">
                Category: <span className="text-gray-300">{prescription.primary.category}</span>
              </p>
              <p className="text-xs text-gray-500">
                Speed: <span className={prescription.primary.executionSpeed === 'high' ? 'text-apex-green' : 'text-amber-400'}>
                  {prescription.primary.executionSpeed === 'high' ? 'FAST ⚡' : 'BENCH TIME 🔧'}
                </span>
              </p>
            </div>

            {/* Reasoning */}
            <div className="bg-gray-900/30 rounded p-3 border border-apex-green/20">
              <p className="text-xs font-bold text-gray-400 mb-2">PHYSICS RULE</p>
              <p className="text-xs text-gray-300 leading-relaxed font-mono">{prescription.primary.reasoning}</p>
            </div>

            {/* Accept Button */}
            <button
              onClick={() => handleAccept('primary')}
              disabled={!canAccept || isAccepting}
              className={`
                w-full py-3 rounded font-mono font-bold text-sm uppercase transition-all duration-300
                ${
                  acceptedChoice === 'primary' && !error
                    ? 'bg-apex-green text-black shadow-lg shadow-apex-green/50'
                    : canAccept && !isAccepting
                      ? 'bg-apex-green/20 border border-apex-green text-apex-green hover:bg-apex-green/30'
                      : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                }
              `}
            >
              {isAccepting && acceptedChoice === 'primary' ? '⏳ Accepting...' : '✓ Accept Primary Fix'}
            </button>
          </div>
        </GlassCard>

        {/* ALTERNATIVE FIX - RIGHT CARD (Cyan) */}
        <GlassCard className="border-2 border-cyan-500">
          <div className="space-y-4">
            {/* Header */}
            <div className="border-b border-cyan-500/30 pb-4">
              <p className="text-xs font-bold uppercase text-cyan-400 tracking-widest">⚡ Quick Trackside Fix</p>
              <p className="text-lg font-bold text-cyan-400 mt-2 font-mono">{prescription.alternative.name}</p>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-4">
              {/* Impact Score */}
              <div>
                <p className="text-xs uppercase text-gray-500 font-bold">Physics Impact</p>
                <div className="mt-2 flex items-center gap-2">
                  <div className="text-2xl font-bold text-cyan-400">{prescription.alternative.physicsImpact}</div>
                  <p className="text-xs text-gray-500">/100</p>
                </div>
                <div className="mt-2 w-full bg-gray-700 rounded h-1.5">
                  <div
                    className="h-1.5 bg-cyan-500 rounded"
                    style={{ width: `${prescription.alternative.physicsImpact}%` }}
                  />
                </div>
              </div>

              {/* Execution Speed */}
              <div>
                <p className="text-xs uppercase text-gray-500 font-bold">Execution</p>
                <div className="mt-2">
                  <p className="text-2xl font-bold text-cyan-400">{prescription.alternative.timingMinutes.toFixed(0)}</p>
                  <p className="text-xs text-gray-500">minutes</p>
                </div>
              </div>
            </div>

            {/* Category & Speed */}
            <div className="bg-gray-900/50 rounded p-3 space-y-1">
              <p className="text-xs text-gray-500">
                Category: <span className="text-gray-300">{prescription.alternative.category}</span>
              </p>
              <p className="text-xs text-gray-500">
                Speed: <span className={prescription.alternative.executionSpeed === 'high' ? 'text-apex-green' : 'text-amber-400'}>
                  {prescription.alternative.executionSpeed === 'high' ? 'FAST ⚡' : 'BENCH TIME 🔧'}
                </span>
              </p>
            </div>

            {/* Reasoning */}
            <div className="bg-gray-900/30 rounded p-3 border border-cyan-500/20">
              <p className="text-xs font-bold text-gray-400 mb-2">PHYSICS RULE</p>
              <p className="text-xs text-gray-300 leading-relaxed font-mono">{prescription.alternative.reasoning}</p>
            </div>

            {/* Accept Button */}
            <button
              onClick={() => handleAccept('alternative')}
              disabled={!canAccept || isAccepting}
              className={`
                w-full py-3 rounded font-mono font-bold text-sm uppercase transition-all duration-300
                ${
                  acceptedChoice === 'alternative' && !error
                    ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/50'
                    : canAccept && !isAccepting
                      ? 'bg-cyan-500/20 border border-cyan-500 text-cyan-400 hover:bg-cyan-500/30'
                      : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                }
              `}
            >
              {isAccepting && acceptedChoice === 'alternative' ? '⏳ Accepting...' : '⚡ Accept Trackside Fix'}
            </button>
          </div>
        </GlassCard>
      </div>

      {/* PRESCRIPTION REASONING */}
      <GlassCard className="border-apex-blue/30 border bg-gray-900/30">
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase text-apex-blue tracking-widest">ℹ️ Diagnostic Context</p>
          <p className="text-sm text-gray-300 leading-relaxed">{prescription.reasoning}</p>
        </div>
      </GlassCard>

      {/* ERROR DISPLAY */}
      {error && (
        <GlassCard className="border-apex-red/50 border">
          <p className="text-xs text-apex-red font-mono">{error}</p>
        </GlassCard>
      )}

      {/* SUCCESS MESSAGE */}
      {acceptedChoice && !error && (
        <GlassCard className="border-apex-green/50 border bg-apex-green/10">
          <div className="flex items-center gap-3">
            <div className="text-2xl">✓</div>
            <div>
              <p className="text-sm font-bold text-apex-green">Change Accepted</p>
              <p className="text-xs text-gray-400 mt-1">
                {acceptedChoice === 'primary' ? 'Primary' : 'Alternative'} fix has been recorded to session history.
              </p>
            </div>
          </div>
        </GlassCard>
      )}
    </div>
  );
}
