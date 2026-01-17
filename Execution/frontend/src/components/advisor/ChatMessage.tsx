'use client';

import React from 'react';
import { ChatMessage as ChatMessageType } from '@/stores/advisorStore';

interface ChatMessageProps {
  message: ChatMessageType;
  onProposalApply?: (choice: 'primary' | 'alternative', customValue?: string | number) => void;
  onClarifyingResponse?: (response: string) => void;
  isLoading?: boolean;
}

export default function ChatMessage({
  message,
  onProposalApply,
  onClarifyingResponse,
  isLoading = false,
}: ChatMessageProps) {
  const isUser = message.role === 'user';
  const isAI = message.role === 'ai';
  const isSystem = message.role === 'system';

  // Role-based styling
  const bubbleClass = isUser
    ? 'bg-apex-blue/10 border-l-2 border-apex-blue text-white ml-8'
    : isSystem
      ? 'bg-amber-500/10 border-l-2 border-amber-500 text-amber-200'
      : 'bg-apex-dark border-l-2 border-apex-green text-gray-100 mr-8';

  const headerClass = isUser
    ? 'text-apex-blue font-mono text-xs uppercase'
    : isSystem
      ? 'text-amber-400 font-mono text-xs uppercase'
      : 'text-apex-green font-mono text-xs uppercase';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4 gap-2`}>
      <div className={`flex-1 max-w-[70%] ${isUser ? 'text-right' : ''}`}>
        {/* Message Header (Role + Type) */}
        <div className={`${headerClass} mb-1`}>
          {isUser ? '👤 You' : isSystem ? '⚠️ System' : '🤖 Advisor'}
          <span className="ml-2 text-gray-500">
            {message.type === 'ai-question' && '❓'}
            {message.type === 'user-response' && '💬'}
            {message.type === 'ai-proposal' && '🔧'}
            {message.type === 'ai-confirmation' && '✅'}
            {message.type === 'ai-guidance' && '📚'}
          </span>
        </div>

        {/* Main Content Bubble */}
        <div className={`px-4 py-3 rounded-md border border-gray-600 ${bubbleClass} text-sm leading-relaxed`}>
          {message.content}
        </div>

        {/* Clarifying Question Input (only for ai-question type) */}
        {message.type === 'ai-question' && onClarifyingResponse && (
          <div className="mt-3 flex gap-2">
            <input
              type="text"
              placeholder="Your response..."
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                  onClarifyingResponse(e.currentTarget.value);
                  e.currentTarget.value = '';
                }
              }}
              disabled={isLoading}
              className="flex-1 px-3 py-2 bg-apex-dark border border-gray-600 rounded text-white text-sm placeholder-gray-500 focus:border-apex-green focus:outline-none disabled:opacity-50"
            />
            <button
              onClick={() => {
                const input = document.querySelector(
                  `input[placeholder="Your response..."]`
                ) as HTMLInputElement;
                if (input?.value.trim()) {
                  onClarifyingResponse(input.value);
                  input.value = '';
                }
              }}
              disabled={isLoading}
              className="px-3 py-2 bg-apex-green text-black font-mono text-xs rounded hover:bg-apex-green/80 disabled:opacity-50 transition-colors"
            >
              {isLoading ? '...' : 'SEND'}
            </button>
          </div>
        )}

        {/* Proposal Cards (rendered inline for Primary + Alternative) */}
        {message.type === 'ai-proposal' && message.proposal && (
          <div className="mt-3 space-y-2">
            {/* Note: ProposalCard will be rendered as sibling messages or as sub-components */}
            <div className="text-xs text-gray-500 italic">
              [Proposal cards will render below this message]
            </div>
          </div>
        )}

        {/* Confirmation Actions (for applied proposals) */}
        {message.type === 'ai-confirmation' && (
          <div className="mt-2 flex gap-2 text-xs">
            <button className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded transition-colors">
              📋 Add Feedback
            </button>
            <button className="px-2 py-1 bg-apex-red/20 hover:bg-apex-red/30 text-apex-red rounded transition-colors border border-apex-red/50">
              ⏮️ Undo
            </button>
          </div>
        )}

        {/* Timestamp (compact, optional) */}
        <div className="mt-1 text-xs text-gray-600">
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          })}
        </div>
      </div>
    </div>
  );
}
