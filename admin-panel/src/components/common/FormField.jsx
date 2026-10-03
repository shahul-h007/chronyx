import React from 'react';

export default function FormField({
  label,
  children,
  hint,
  error,
  required = false,
  id,
  className = '',
}) {
  return (
    <div className={`admin-form-field ${error ? 'has-error' : ''} ${className}`}>
      {label && (
        <label htmlFor={id} className="admin-field-label">
          {label}
          {required && <span className="admin-field-required" aria-hidden="true">*</span>}
        </label>
      )}
      <div className="admin-field-control">{children}</div>
      {error ? (
        <p className="admin-field-error" role="alert">{error}</p>
      ) : hint ? (
        <p className="admin-field-hint">{hint}</p>
      ) : null}
    </div>
  );
}
