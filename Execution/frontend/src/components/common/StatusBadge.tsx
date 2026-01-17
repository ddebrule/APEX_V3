import type { SessionStatus, SessionType, ChangeStatus } from '@/types/database';

interface StatusBadgeProps {
  status: SessionStatus | SessionType | ChangeStatus | string;
  variant?: 'status' | 'type' | 'change';
}

export default function StatusBadge({ status, variant = 'status' }: StatusBadgeProps) {
  const statusColors: Record<string, string> = {
    // Session status
    draft: 'status-neutral',
    active: 'status-good',
    archived: 'status-neutral',
    // Session type
    practice: 'status-neutral',
    qualifier: 'status-warning',
    main: 'status-good',
    // Change status
    pending: 'status-warning',
    accepted: 'status-good',
    denied: 'status-danger',
    reversed: 'status-neutral',
  };

  const displayText = {
    draft: 'DRAFT',
    active: 'ACTIVE',
    archived: 'ARCHIVED',
    practice: 'PRACTICE',
    qualifier: 'QUALIFIER',
    main: 'MAIN',
    pending: 'PENDING',
    accepted: 'ACCEPTED',
    denied: 'DENIED',
    reversed: 'REVERSED',
  };

  const colorClass = statusColors[status] || 'status-neutral';
  const text = displayText[status as keyof typeof displayText] || status;

  return (
    <span className={`${colorClass} text-xs font-bold uppercase tracking-wide`}>
      [{text}]
    </span>
  );
}
