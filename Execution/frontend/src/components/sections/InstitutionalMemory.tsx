'use client';

import { useEffect, useState } from 'react';
import GlassCard from '@/components/common/GlassCard';
import { useMissionControlStore } from '@/stores/missionControlStore';
import { getInstitutionalMemory } from '@/lib/queries';

interface MemoryEntry {
  id: string;
  created_at: string;
  content: string;
}

export default function InstitutionalMemory() {
  const { selectedRacer } = useMissionControlStore();
  const [memories, setMemories] = useState<MemoryEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadMemories = async () => {
      if (!selectedRacer) return;
      setLoading(true);
      try {
        const data = await getInstitutionalMemory(selectedRacer.id, 3);
        if (Array.isArray(data)) {
          setMemories(data as unknown as MemoryEntry[]);
        } else {
          setMemories([]);
        }
      } catch (error) {
        console.error('Failed to load memories:', error);
        setMemories([]);
      } finally {
        setLoading(false);
      }
    };

    loadMemories();
  }, [selectedRacer?.id]);

  return (
    <GlassCard>
      <h2 className="header-uppercase text-lg mb-4 border-b border-apex-border pb-3">
        Institutional Memory (Librarian)
      </h2>

      {loading ? (
        <div className="text-gray-400 text-sm text-center py-4">Loading historical data...</div>
      ) : memories.length > 0 ? (
        <div className="space-y-3 max-h-48 overflow-y-auto">
          {memories.map((memory) => (
            <div key={memory.id} className="border-l-2 border-apex-green pl-3 py-2">
              <p className="text-xs text-gray-500 mb-1">
                {new Date(memory.created_at).toLocaleDateString()}
              </p>
              <p className="text-xs leading-relaxed text-gray-300">
                {'\u00BB '}{memory.content}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-gray-400 text-sm text-center py-6">
          {'\u00BB '} No historical data available yet
        </div>
      )}
    </GlassCard>
  );
}
