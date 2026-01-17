'use client';

import React from 'react';
import { Prescription } from '@/lib/physicsAdvisor';
import ProposalCard from './ProposalCard';

interface ProposalCardsContainerProps {
  prescription: Prescription;
  onApplyPrimary: (customValue?: string | number) => void;
  onApplyAlternative: (customValue?: string | number) => void;
  isLoading?: boolean;
  context?: string;
}

export default function ProposalCardsContainer({
  prescription,
  onApplyPrimary,
  onApplyAlternative,
  isLoading = false,
  context,
}: ProposalCardsContainerProps) {
  return (
    <div className="mt-4 space-y-3">
      {/* Primary Fix */}
      <ProposalCard
        prescription={prescription}
        variant="primary"
        onApply={onApplyPrimary}
        isLoading={isLoading}
        context={context}
      />

      {/* Alternative Fix */}
      <ProposalCard
        prescription={prescription}
        variant="alternative"
        onApply={onApplyAlternative}
        isLoading={isLoading}
        context={context}
      />
    </div>
  );
}
