'use client';

import { useAdvisorStore } from '@/stores/advisorStore';
import { getAvailableSymptoms } from '@/lib/physicsAdvisor';
import GlassCard from '@/components/common/GlassCard';

interface SymptomSelectorProps {
  disabled?: boolean;
}

export default function SymptomSelector({ disabled = false }: SymptomSelectorProps) {
  const { selectedSymptom, selectSymptom } = useAdvisorStore();
  const symptoms = getAvailableSymptoms();

  // Group symptoms by phase
  const symptomsByPhase = {
    'Entry Phase': symptoms.filter(s => s.includes('Entry')),
    'Apex Phase': symptoms.filter(s => s.includes('Apex') || s.includes('Fade')),
    'Exit Phase': symptoms.filter(s => s.includes('Exit')),
    'General': symptoms.filter(s => !s.includes('Entry') && !s.includes('Apex') && !s.includes('Exit') && !s.includes('Fade')),
  };

  return (
    <GlassCard className="p-6 space-y-6">
      {/* Track Phases */}
      {Object.entries(symptomsByPhase).map(([phase, phaseSymptoms]) => {
        // Only render non-empty phases
        if (phaseSymptoms.length === 0) return null;

        return (
          <div key={phase}>
            {/* Phase Header */}
            <p className="text-xs font-bold uppercase text-gray-500 mb-3 tracking-wide">◆ {phase}</p>

            {/* Symptom Buttons Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {phaseSymptoms.map((symptom) => (
                <button
                  key={symptom}
                  onClick={() => selectSymptom(symptom)}
                  disabled={disabled}
                  className={`
                    px-4 py-3 rounded border text-sm font-mono transition-all duration-200
                    ${
                      selectedSymptom === symptom
                        ? 'bg-apex-green/20 border-apex-green text-apex-green shadow-lg shadow-apex-green/20'
                        : 'bg-gray-900/40 border-gray-700 text-gray-300 hover:border-apex-green/50 hover:text-apex-green/70'
                    }
                    ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                >
                  {symptom}
                </button>
              ))}
            </div>

            {/* Phase Divider */}
            {Object.keys(symptomsByPhase).indexOf(phase) < Object.keys(symptomsByPhase).length - 1 && (
              <div className="mt-6 border-t border-apex-border/30" />
            )}
          </div>
        );
      })}

      {/* Disabled State Message */}
      {disabled && (
        <div className="p-4 bg-apex-red/10 border border-apex-red/30 rounded text-center">
          <p className="text-xs text-apex-red font-mono">
            🚨 Symptom selection disabled. Tire change recommended.
          </p>
        </div>
      )}

      {/* Empty State */}
      {symptoms.length === 0 && (
        <div className="text-center py-8">
          <p className="text-xs text-gray-500">No symptoms available</p>
        </div>
      )}
    </GlassCard>
  );
}
