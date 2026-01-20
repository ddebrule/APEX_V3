'use client';

import { useState, useRef, useEffect } from 'react';
import { useMissionControlStore } from '@/stores/missionControlStore';
import { useChatMessages } from '@/stores/advisorStore';
import ChatMessage from '@/components/advisor/ChatMessage';
import { getVehiclesByProfileId } from '@/lib/queries';

interface ContextData {
  vehicleId: string;
  vehicleName: string;
  temperature?: number;
  condition?: string;
  setupParams: Record<string, string>;
}

const SAMPLE_CONTEXTS: Record<string, ContextData> = {
  'chassis-01': {
    vehicleId: 'chassis-01',
    vehicleName: 'MBX8R [CHASSIS_01]',
    temperature: 74.2,
    condition: 'FRESH CLAY',
    setupParams: {
      'Shock Oil (F/R)': '450 / 400 CST',
      'Spring Rate (F/R)': 'White / Blue',
      'Diff Oil (F/C/R)': '7 / 10 / 5 K',
      'Tire / Foam': 'S3 / Blue',
      'Ride Height (F/R)': '27 / 29 MM',
    },
  },
  'fleet-04': {
    vehicleId: 'fleet-04',
    vehicleName: 'MBX8T [FLEET_04]',
    temperature: 74.5,
    condition: 'FRESH CLAY',
    setupParams: {
      'Shock Oil (F/R)': '600 / 550 CST',
      'Spring Rate (F/R)': 'Purple / Purple',
      'Diff Oil (F/C/R)': '10 / 15 / 7 K',
      'Tire / Foam': 'M3 / Red',
      'Ride Height (F/R)': '30 / 32 MM',
    },
  },
};

const TACTICAL_DIRECTIVES = [
  { title: '"Loose Rear End"', desc: 'Oversteer on entry/exit.' },
  { title: '"Push / Understeer"', desc: 'Front end washing out.' },
  { title: '"Bottoms Out"', desc: 'Chassis slap on landing/G-out.' },
  { title: '"Lacks Forward Drive"', desc: 'Spinning wheels on power.' },
];

export default function AIAdvisor() {
  const { selectedVehicle, selectedRacer } = useMissionControlStore();
  const chatMessages = useChatMessages();
  const [vehicles, setVehicles] = useState(selectedVehicle ? [selectedVehicle] : []);
  const [selectedContext, setSelectedContext] = useState<string>('');
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Fetch vehicles for the selected racer
  useEffect(() => {
    if (!selectedRacer) {
      setVehicles([]);
      setSelectedContext('');
      return;
    }

    const fetchVehicles = async () => {
      setIsFetching(true);
      try {
        const data = await getVehiclesByProfileId(selectedRacer.id);
        setVehicles(data);
        if (data.length > 0) {
          setSelectedContext(data[0].id);
        }
      } catch (error) {
        console.error('Error fetching vehicles:', error);
        // Fall back to sample data if fetch fails
        setVehicles(selectedVehicle ? [selectedVehicle] : []);
        if (selectedVehicle) {
          setSelectedContext(selectedVehicle.id);
        }
      } finally {
        setIsFetching(false);
      }
    };

    fetchVehicles();
  }, [selectedRacer, selectedVehicle]);

  // Build context data from selected vehicle
  const selectedVehicleData = vehicles.find(v => v.id === selectedContext);
  const context: ContextData = selectedVehicleData
    ? {
      vehicleId: selectedVehicleData.id,
      vehicleName: `${selectedVehicleData.brand} ${selectedVehicleData.model}`,
      temperature: undefined,
      condition: 'FRESH CLAY',
      setupParams: (selectedVehicleData.baseline_setup?.shocks || {}) as Record<string, string>,
    }
    : SAMPLE_CONTEXTS['chassis-01'];

  // Auto-scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSendMessage = async () => {
    if (!userInput.trim()) return;

    setIsLoading(true);
    // Simulate AI response delay
    setTimeout(() => {
      setUserInput('');
      setIsLoading(false);
    }, 500);
  };

  const handleContextChange = (contextKey: string) => {
    setSelectedContext(contextKey);
  };

  const handleTacticalDirective = (directive: string) => {
    setUserInput(`Ask about: ${directive}`);
  };

  return (
    <div className="w-full h-screen bg-apex-dark text-white flex flex-col overflow-hidden">
      {/* HEADER */}
      <div className="px-6 py-4 border-b border-apex-border bg-apex-surface/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-2xl font-bold uppercase tracking-tight">A.P.E.X. V3</div>
            <div className="text-sm font-bold uppercase tracking-tight text-gray-500">
              AI Advisor
            </div>
          </div>
          <div className="text-[9px] font-mono font-bold uppercase text-gray-600">
            NEURAL_LINK: ACTIVE
          </div>
        </div>
      </div>

      {/* MAIN LAYOUT: Sidebar | Chat | Right Rail */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT SIDEBAR: Context Deck */}
        <div className="w-80 bg-apex-surface/30 border-r border-apex-border flex flex-col overflow-y-auto">
          {/* Context Header */}
          <div className="px-5 py-4 border-b border-apex-border bg-black/30">
            <label className="text-[9px] uppercase font-bold tracking-widest text-apex-red block mb-3 font-mono">
              ◆ Select Active Context
            </label>
            <select
              value={selectedContext}
              onChange={(e) => handleContextChange(e.target.value)}
              disabled={isFetching || vehicles.length === 0}
              className="w-full px-3 py-2 bg-apex-dark border border-apex-red rounded text-white text-xs font-mono font-bold focus:outline-none focus:border-apex-red/80 disabled:opacity-50"
            >
              <option value="">
                {isFetching ? 'Loading vehicles...' : vehicles.length === 0 ? 'No vehicles' : 'Select vehicle'}
              </option>
              {vehicles.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.brand} {vehicle.model} [{vehicle.id?.slice(0, 8).toUpperCase()}]
                </option>
              ))}
            </select>
          </div>

          {/* Telemetry Snapshot */}
          <div className="px-5 py-4 border-b border-apex-border/50">
            <div className="text-[9px] uppercase font-bold tracking-widest text-gray-600 mb-3 font-mono">
              Live Telemetry
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white/5 p-2 rounded border border-apex-border/30">
                <div className="text-[8px] text-gray-600 mb-1">AMBIENT</div>
                <div className="font-mono font-bold text-xs">
                  {context.temperature?.toFixed(1) || '--'}
                  <span className="text-[8px] text-gray-500 ml-1">°F</span>
                </div>
              </div>
              <div className="bg-white/5 p-2 rounded border border-apex-border/30">
                <div className="text-[8px] text-gray-600 mb-1">CONDITION</div>
                <div className="font-mono font-bold text-[10px] text-apex-blue">
                  {context.condition || '--'}
                </div>
              </div>
            </div>
          </div>

          {/* Dynamic Setup Snapshot */}
          <div className="flex-1 px-5 py-4 overflow-y-auto">
            <div className="text-[9px] uppercase font-bold tracking-widest text-gray-600 mb-3 font-mono">
              Dynamic Configuration
            </div>
            <div className="space-y-2">
              {Object.entries(context.setupParams).map(([key, value]) => (
                <div key={key} className="flex justify-between text-[11px] pb-2 border-b border-apex-border/20">
                  <span className="text-gray-500 font-mono">{key}</span>
                  <span className="text-apex-blue font-mono font-bold">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* MAIN CHAT AREA */}
        <div className="flex-1 flex flex-col overflow-hidden bg-gradient-to-b from-apex-surface/20 to-apex-dark">
          {/* Chat Feed */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {chatMessages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="text-3xl mb-4 text-apex-red font-mono">◆</div>
                  <p className="text-gray-400 text-sm mb-2">Welcome to Neural Link</p>
                  <p className="text-gray-600 text-xs font-mono">
                    Ask about setup optimization, tire strategy, or race tactics
                  </p>
                </div>
              </div>
            ) : (
              <>
                {chatMessages.map((msg) => (
                  <div key={msg.id}>
                    <ChatMessage
                      message={msg}
                      onClarifyingResponse={() => { }}
                      isLoading={isLoading}
                    />
                  </div>
                ))}
                <div ref={chatEndRef} />
              </>
            )}
          </div>

          {/* Input Area */}
          <div className="px-6 py-4 border-t border-apex-border bg-apex-surface/50">
            <div className="flex gap-3 bg-black/50 border border-apex-border rounded p-1">
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask AI about setup, strategy, or diagnostics..."
                disabled={isLoading}
                className="flex-1 bg-transparent border-none text-white text-sm px-3 py-2 focus:outline-none placeholder-gray-600 font-mono"
              />
              <button
                onClick={handleSendMessage}
                disabled={isLoading || !userInput.trim()}
                className="px-4 py-2 bg-apex-green text-white font-bold text-xs uppercase rounded hover:bg-apex-green/90 disabled:opacity-50 transition-all shadow-[0_0_10px_rgba(46,125,50,0.3)] hover:shadow-[0_0_15px_rgba(46,125,50,0.5)]"
              >
                {isLoading ? '⟳' : '🎤'}
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT RAIL: Tactical Directives */}
        <div className="w-72 bg-apex-surface/30 border-l border-apex-border flex flex-col p-5 overflow-y-auto">
          <div className="text-[9px] uppercase font-bold tracking-widest text-apex-green mb-4 font-mono">
            ◆ Tactical Directives
          </div>

          <div className="space-y-2">
            {TACTICAL_DIRECTIVES.map((directive) => (
              <button
                key={directive.title}
                onClick={() => handleTacticalDirective(directive.title)}
                className="w-full text-left px-3 py-2 bg-gray-900/50 border border-apex-border rounded hover:border-apex-blue hover:bg-apex-blue/5 transition-all group"
              >
                <div className="text-[11px] font-bold text-white group-hover:text-apex-blue transition-colors">
                  {directive.title}
                </div>
                <div className="text-[9px] text-gray-600 group-hover:text-gray-400 transition-colors">
                  {directive.desc}
                </div>
              </button>
            ))}
          </div>

          {/* Custom Prompt */}
          <div className="mt-4 pt-4 border-t border-apex-border/50">
            <input
              type="text"
              placeholder="Custom directive..."
              className="w-full px-3 py-2 bg-black/30 border border-dashed border-apex-border rounded text-[10px] text-gray-500 font-mono focus:outline-none focus:text-white placeholder-gray-700"
            />
          </div>

          {/* Status */}
          <div className="mt-auto pt-4 border-t border-apex-border/50">
            <div className="flex items-center gap-2 text-[9px] font-mono text-gray-600">
              <div className="w-2 h-2 rounded-full bg-apex-green animate-pulse" />
              <span>NEURAL_LINK</span>
            </div>
            <div className="text-[8px] text-gray-700 mt-1">Connected to context</div>
          </div>
        </div>
      </div>
    </div>
  );
}
