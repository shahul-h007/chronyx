import React from 'react';
import Modal from './Modal';

export default function ConfirmDialog({
  isOpen = false,
  title = 'Confirm Action',
  message,
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  danger = false,
  loading = false,
  className = '',
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      title={title}
      maxWidth="420px"
      className={`admin-confirm-dialog ${danger ? 'is-danger' : ''} ${className}`}
      footer={
        <div className="admin-confirm-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className={danger ? 'btn-danger' : 'btn-primary'}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Processing...' : confirmText}
          </button>
        </div>
      }
    >
      <p className="admin-confirm-message">{message}</p>
    </Modal>
  );
}
