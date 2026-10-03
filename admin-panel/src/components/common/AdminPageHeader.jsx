import React from 'react';

export default function AdminPageHeader({
  title,
  eyebrow,
  description,
  actions,
  className = '',
}) {
  return (
    <div className={`admin-page-header ${className}`}>
      <div className="admin-page-header-content">
        {eyebrow && <p className="admin-page-header-eyebrow">{eyebrow}</p>}
        {title && <h1 className="admin-page-header-title">{title}</h1>}
        {description && <p className="admin-page-header-description">{description}</p>}
      </div>
      {actions && <div className="admin-page-header-actions">{actions}</div>}
    </div>
  );
}
