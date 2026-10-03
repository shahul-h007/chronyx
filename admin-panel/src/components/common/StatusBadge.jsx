import React from 'react';

export default function StatusBadge({
  status = 'neutral',
  children,
  className = '',
}) {
  return (
    <span className={`admin-status-badge status-${status} ${className}`}>
      <span className="admin-status-badge-dot" />
      <span className="admin-status-badge-text">{children}</span>
    </span>
  );
}
