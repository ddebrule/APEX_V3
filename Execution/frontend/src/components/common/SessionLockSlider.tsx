'use client';

import { useState, useRef, useEffect } from 'react';

interface SessionLockSliderProps {
  onDeploy: () => void;
  disabled?: boolean;
  isLoading?: boolean;
}

export default function SessionLockSlider({ onDeploy, disabled = false, isLoading = false }: SessionLockSliderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [sliderPosition, setSliderPosition] = useState(0);
  const [deployed, setDeployed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);

  const DEPLOY_THRESHOLD = 90; // 90% = deploy
  const MAX_POSITION = 100;

  const handleMouseDown = () => {
    if (disabled || isLoading || deployed) return;
    setIsDragging(true);
  };

  const handleMouseUp = () => {
    setIsDragging(false);

    if (sliderPosition >= DEPLOY_THRESHOLD) {
      setSliderPosition(100);
      setDeployed(true);
      onDeploy();

      // Reset after 2 seconds
      setTimeout(() => {
        setDeployed(false);
        setSliderPosition(0);
      }, 2000);
    } else {
      // Snap back to start
      setSliderPosition(0);
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !containerRef.current || disabled || isLoading || deployed) return;

    const rect = containerRef.current.getBoundingClientRect();
    const newPosition = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    setSliderPosition(newPosition);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, disabled, isLoading, deployed]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-12 rounded border-2 overflow-hidden transition-all duration-300 ${
        deployed
          ? 'border-apex-green bg-apex-green/5'
          : disabled || isLoading
            ? 'border-apex-border/30 bg-apex-dark/50 cursor-not-allowed'
            : 'border-apex-border hover:border-apex-green/50 bg-apex-dark cursor-grab active:cursor-grabbing'
      }`}
    >
      {/* Background track */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[9px] uppercase tracking-widest font-mono text-gray-600 pointer-events-none">
          {deployed ? '✓ SESSION LOCKED' : '⟩ SLIDE TO DEPLOY'}
        </span>
      </div>

      {/* Fill indicator */}
      <div
        className={`absolute inset-y-0 left-0 transition-all duration-75 pointer-events-none ${
          deployed
            ? 'bg-apex-green/20'
            : sliderPosition >= DEPLOY_THRESHOLD
              ? 'bg-apex-green/15'
              : 'bg-apex-blue/10'
        }`}
        style={{ width: `${sliderPosition}%` }}
      />

      {/* Threshold indicator */}
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-apex-green/30 pointer-events-none transition-all"
        style={{ left: `${DEPLOY_THRESHOLD}%` }}
      />

      {/* Draggable thumb */}
      <div
        ref={thumbRef}
        onMouseDown={handleMouseDown}
        className={`absolute top-0 bottom-0 w-12 rounded-l transition-all duration-75 flex items-center justify-center ${
          deployed
            ? 'bg-apex-green/30 border-r border-apex-green'
            : sliderPosition >= DEPLOY_THRESHOLD
              ? 'bg-apex-green/25 border-r border-apex-green'
              : 'bg-apex-blue/20 border-r border-apex-blue'
        } ${disabled || isLoading ? 'opacity-50' : 'opacity-100'}`}
        style={{
          left: `${sliderPosition}%`,
          transform: 'translateX(-100%)',
          cursor: deployed ? 'default' : isDragging ? 'grabbing' : 'grab',
        }}
      >
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-[7px] font-mono font-bold text-white">{Math.round(sliderPosition)}%</span>
          {isLoading && (
            <div className="w-1.5 h-1.5 border border-white/50 border-t-white rounded-full animate-spin" />
          )}
        </div>
      </div>

      {/* Deploy indicator line */}
      {sliderPosition >= DEPLOY_THRESHOLD && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-0.5 h-full bg-gradient-to-b from-apex-green to-transparent" />
        </div>
      )}
    </div>
  );
}
