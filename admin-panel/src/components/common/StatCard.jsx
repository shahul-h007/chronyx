import React from 'react';

export default function StatCard({
  label,
  value,
  description,
  icon: Icon,
  tone = 'neutral',
  className = '',
}) {
  return (
    <div className={`admin-stat-card tone-${tone} ${className}`}>
      <div className="admin-stat-card-header">
        <span className="admin-stat-card-label">{label}</span>
        {Icon && (
          <div className="admin-stat-card-icon">
            {React.isValidElement(Icon) ? Icon : <Icon size={18} />}
          </div>
        )}
      </div>
      <div className="admin-stat-card-value">{value}</div>
      {description && <div className="admin-stat-card-description">{description}</div>}
    </div>
  );
}
