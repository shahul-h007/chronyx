import React from 'react';

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className = '',
}) {
  return (
    <div className={`admin-empty-state ${className}`}>
      {Icon && (
        <div className="admin-empty-state-icon">
          {React.isValidElement(Icon) ? Icon : <Icon size={36} />}
        </div>
      )}
      {title && <h3 className="admin-empty-state-title">{title}</h3>}
      {description && <p className="admin-empty-state-description">{description}</p>}
      {action && <div className="admin-empty-state-action">{action}</div>}
    </div>
  );
}
