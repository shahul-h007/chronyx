import React from 'react';

export default function ToggleSwitch({
  checked = false,
  onChange,
  disabled = false,
  label,
  description,
  id,
  name,
  className = '',
}) {
  const switchId = id || (label ? `toggle-${label.toLowerCase().replace(/[^a-z0-9]/g, '-')}` : undefined);

  const handleClick = () => {
    if (disabled) return;
    if (onChange) {
      onChange(!checked);
    }
  };

  const handleKeyDown = (e) => {
    if (disabled) return;
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      if (onChange) {
        onChange(!checked);
      }
    }
  };

  return (
    <div className={`admin-toggle-wrapper ${disabled ? 'is-disabled' : ''} ${className}`}>
      {(label || description) && (
        <div className="admin-toggle-text">
          {label && (
            <label htmlFor={switchId} className="admin-toggle-label" onClick={handleClick}>
              {label}
            </label>
          )}
          {description && <p className="admin-toggle-description">{description}</p>}
        </div>
      )}
      <button
        type="button"
        role="switch"
        id={switchId}
        name={name}
        aria-checked={Boolean(checked)}
        aria-disabled={disabled}
        disabled={disabled}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className={`admin-toggle-switch ${checked ? 'is-checked' : ''}`}
      >
        <span className="admin-toggle-thumb" />
      </button>
    </div>
  );
}
