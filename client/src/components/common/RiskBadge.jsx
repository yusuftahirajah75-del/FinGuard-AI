import React from 'react';
import { getRiskLevelConfig } from '../../utils/formatters.js';

export function RiskBadge({ level, showDot = true, size = 'md', className = '' }) {
  const config = getRiskLevelConfig(level);

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5 font-medium',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold border ring-1 transition-colors ${config.badgeClass} ${sizeClasses[size] || sizeClasses.md} ${className}`}
      role="status"
      aria-label={`Risk level ${config.label}`}
    >
      {showDot && (
        <span
          className={`w-1.5 h-1.5 rounded-full ${config.dotClass} animate-pulse`}
          aria-hidden="true"
        />
      )}
      {config.label}
    </span>
  );
}

export default RiskBadge;
