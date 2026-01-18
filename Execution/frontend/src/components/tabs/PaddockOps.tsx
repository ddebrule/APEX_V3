'use client';

import { useEffect, useState } from 'react';
import GlassCard from '@/components/common/GlassCard';
import EventIdentity from '@/components/sections/EventIdentity';
import { useMissionControlStore } from '@/stores/missionControlStore';
import { supabase } from '@/lib/supabase';
import type { VehicleClass } from '@/types/database';

interface StatusIndicator {
  label: string;
  value: boolean;
}

export default function PaddockOps() {
  const { selectedRacer } = useMissionControlStore();
  const [classes, setClasses] = useState<VehicleClass[]>([]);
  const [newClassName, setNewClassName] = useState('');
  const [isAddingClass, setIsAddingClass] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [statusIndicators, setStatusIndicators] = useState<StatusIndicator[]>([
    { label: 'Battery', value: true },
    { label: 'Signal', value: true },
    { label: 'Sync', value: true },
  ]);

  // Fetch classes for selected racer
  useEffect(() => {
    if (!selectedRacer) {
      setClasses([]);
      return;
    }

    const fetchClasses = async () => {
      try {
        const { data, error } = await supabase
          .from('classes')
          .select('*')
          .eq('profile_id', selectedRacer.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setClasses(data || []);
      } catch (error) {
        console.error('Error fetching classes:', error);
      }
    };

    fetchClasses();
  }, [selectedRacer]);

  // Status indicators animation
  useEffect(() => {
    const updateStatus = setInterval(() => {
      setStatusIndicators(prev => prev.map(indicator => ({
        ...indicator,
        value: Math.random() > 0.1,
      })));
    }, 3000);

    return () => clearInterval(updateStatus);
  }, []);

  // Handle adding a new class
  const handleAddClass = async () => {
    if (!newClassName.trim() || !selectedRacer) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('classes')
        .insert([{
          profile_id: selectedRacer.id,
          name: newClassName,
        }])
        .select();

      if (error) throw error;

      if (data && data.length > 0) {
        setClasses([data[0], ...classes]);
        setNewClassName('');
        setIsAddingClass(false);
      }
    } catch (error) {
      console.error('Error adding class:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle deleting a class
  const handleDeleteClass = async (classId: string) => {
    try {
      const { error } = await supabase
        .from('classes')
        .delete()
        .eq('id', classId);

      if (error) throw error;

      setClasses(classes.filter(c => c.id !== classId));
    } catch (error) {
      console.error('Error deleting class:', error);
    }
  };

  return (
    <div className="w-full h-screen bg-apex-dark text-white overflow-auto">
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        {/* TOP BAR */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-apex-border">
          <div className="flex items-center gap-3">
            <div className="text-2xl font-bold uppercase tracking-tight">
              A.P.E.X. V3
            </div>
            <div className="text-xl font-bold uppercase tracking-tight text-gray-500">
              Paddock Operations
            </div>
          </div>

          {/* STATUS INDICATORS */}
          <div className="flex items-center gap-6">
            {statusIndicators.map(indicator => (
              <div key={indicator.label} className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    indicator.value ? 'bg-apex-green' : 'bg-apex-red'
                  }`}
                />
                <span className="text-xs uppercase tracking-wide text-gray-400">
                  {indicator.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* MAIN CONTENT GRID */}
        <div className="space-y-6">
          {/* EVENT IDENTITY SECTION */}
          <div>
            <h3 className="header-uppercase text-sm mb-4 text-gray-500 tracking-wide">
              ◆ Event Identity
            </h3>
            <EventIdentity />
          </div>

          {/* CLASS REGISTRY SECTION */}
          <div>
            <h3 className="header-uppercase text-sm mb-4 text-gray-500 tracking-wide">
              ◆ Class Registry
            </h3>
            <GlassCard>
              <div className="flex justify-between items-center mb-4 border-b border-apex-blue/20 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-apex-blue font-mono text-xs">◆</span>
                  <h2 className="header-uppercase text-sm font-bold tracking-widest text-apex-blue">
                    Vehicle Classes
                  </h2>
                </div>
                {!isAddingClass && selectedRacer && (
                  <button
                    onClick={() => setIsAddingClass(true)}
                    className="text-[9px] uppercase font-bold tracking-widest px-2 py-1 border border-apex-blue text-apex-blue hover:bg-apex-blue/5 transition-colors rounded font-mono"
                  >
                    [+] Add
                  </button>
                )}
              </div>

              {/* ADD CLASS FORM */}
              {isAddingClass && selectedRacer && (
                <div className="mb-4 p-3 bg-apex-blue/5 rounded border border-apex-blue/30">
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={newClassName}
                      onChange={(e) => setNewClassName(e.target.value)}
                      placeholder="e.g., 1/8 Buggy"
                      className="w-full px-2 py-2 bg-apex-dark border border-apex-border/50 rounded text-white text-xs focus:outline-none focus:border-apex-blue focus:ring-1 focus:ring-apex-blue/20 font-mono transition-all"
                      disabled={isLoading}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleAddClass}
                        disabled={!newClassName.trim() || isLoading}
                        className="flex-1 px-2 py-1.5 bg-apex-blue/10 border border-apex-blue text-apex-blue text-[9px] font-bold uppercase tracking-widest rounded hover:bg-apex-blue/20 transition-colors font-mono disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isLoading ? '⟳ Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={() => {
                          setIsAddingClass(false);
                          setNewClassName('');
                        }}
                        disabled={isLoading}
                        className="px-2 py-1.5 border border-apex-border text-gray-400 text-[9px] font-bold uppercase tracking-widest rounded hover:bg-white/5 transition-colors font-mono disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* CLASSES LIST */}
              {selectedRacer ? (
                <div className="space-y-2">
                  {classes.length > 0 ? (
                    classes.map(cls => (
                      <div
                        key={cls.id}
                        className="flex justify-between items-center p-2 border border-apex-border/30 rounded hover:bg-white/5 transition-colors"
                      >
                        <span className="text-xs text-gray-300 font-mono">{cls.name}</span>
                        <button
                          onClick={() => handleDeleteClass(cls.id)}
                          className="text-[9px] text-apex-red hover:text-apex-red/80 font-mono font-bold"
                        >
                          [×] Delete
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-gray-400 text-xs font-mono">
                      No classes defined. Add one to get started.
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-400 text-xs font-mono">
                  Select a racer to manage classes
                </div>
              )}
            </GlassCard>
          </div>
        </div>

        {/* FOOTER */}
        <div className="mt-12 pt-6 border-t border-apex-border text-center text-xs text-gray-600">
          <p>🤖 Powered by A.P.E.X. V3 | Dual-Agent Architecture | Status: OPERATIONAL</p>
        </div>
      </div>
    </div>
  );
}
