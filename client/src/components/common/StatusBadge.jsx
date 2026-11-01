import React from 'react';
import { getAlertStatusConfig } from '../../utils/formatters.js';

export function StatusBadge({ status, showDot = true, size = 'md', className = '' }) {
  const config = getAlertStatusConfig(status);

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium border ${config.badgeClass} ${sizeClasses[size] || sizeClasses.md} ${className}`}
      role="status"
    >
      {showDot && (
        <span
          className={`w-1.5 h-1.5 rounded-full ${config.dotClass}`}
          aria-hidden="true"
        />
      )}
      {config.label}
    </span>
  );
}

export default StatusBadge;
