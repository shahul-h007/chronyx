import { useEffect, useMemo, useState } from 'react';
import {
  EnvelopeSimple,
  EnvelopeOpen,
  CheckCircle,
  CircleNotch,
  MagnifyingGlass,
  ArrowSquareOut,
  X,
  WarningCircle,
  User,
  CalendarBlank,
} from '@phosphor-icons/react';
import { supabase } from '../lib/supabase';

import AdminPageHeader from '../components/common/AdminPageHeader';
import StatCard from '../components/common/StatCard';
import StatusBadge from '../components/common/StatusBadge';
import EmptyState from '../components/common/EmptyState';

const Contacts = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState('');
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('contact_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMessages(data || []);
      if (data?.length && !selectedId) {
        setSelectedId(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching contact messages:', error.message);
      setFeedback({ type: 'error', message: `Failed to load inbox: ${error.message}` });
    } finally {
      setLoading(false);
    }
  };

  const filteredMessages = useMemo(() => {
    return messages.filter((message) => {
      const matchesFilter =
        activeFilter === 'all' ? true : activeFilter === 'unread' ? !message.is_read : Boolean(message.is_read);

      const query = search.trim().toLowerCase();
      const matchesSearch = !query
        ? true
        : [message.name, message.email, message.message].some((field) =>
            String(field || '').toLowerCase().includes(query)
          );

      return matchesFilter && matchesSearch;
    });
  }, [messages, activeFilter, search]);

  const selectedMessage =
    filteredMessages.find((message) => message.id === selectedId) ||
    messages.find((message) => message.id === selectedId) ||
    filteredMessages[0] ||
    null;

  const unreadCount = messages.filter((message) => !message.is_read).length;

  const updateReadState = async (message, nextReadState) => {
    setUpdatingId(message.id);
    try {
      const { error } = await supabase
        .from('contact_messages')
        .update({ is_read: nextReadState })
        .eq('id', message.id);

      if (error) throw error;

      setMessages((current) =>
        current.map((item) => (item.id === message.id ? { ...item, is_read: nextReadState } : item))
      );
    } catch (error) {
      setFeedback({ type: 'error', message: `Failed to update status: ${error.message}` });
    } finally {
      setUpdatingId('');
    }
  };

  const handleSelectMessage = async (message) => {
    setSelectedId(message.id);
    if (!message.is_read) {
      await updateReadState(message, true);
    }
  };

  if (loading) {
    return (
      <div className="admin-page-container">
        <AdminPageHeader
          eyebrow="Customer Inquiries"
          title="Contact Inbox"
          description="Review messages sent from the storefront contact form."
        />
        <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--admin-text-muted)' }}>
          Loading contact messages...
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page-container" style={{ display: 'grid', gap: '24px' }}>
      <AdminPageHeader
        eyebrow="Customer Inquiries"
        title="Contact Inbox"
        description="Review messages sent from the storefront contact form and keep track of inquiries requiring response."
      />

      {feedback && (
        <div
          role="status"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            borderRadius: 'var(--admin-radius-md, 8px)',
            fontSize: '0.9rem',
            background: feedback.type === 'error' ? 'var(--admin-danger-subtle)' : 'var(--admin-success-subtle)',
            color: feedback.type === 'error' ? 'var(--admin-danger)' : 'var(--admin-success)',
            border: `1px solid ${feedback.type === 'error' ? 'var(--admin-danger)' : 'var(--admin-success)'}`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {feedback.type === 'error' ? <WarningCircle size={18} /> : <CheckCircle size={18} />}
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: '4px' }}
            aria-label="Dismiss notification"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <StatCard
          label="Total Messages"
          value={messages.length}
          description="Inquiries received to date"
          icon={EnvelopeSimple}
          tone="neutral"
        />
        <StatCard
          label="Unread Inquiries"
          value={unreadCount}
          description="Awaiting administrator review"
          icon={EnvelopeOpen}
          tone={unreadCount > 0 ? 'warning' : 'success'}
        />
        <StatCard
          label="Reviewed / Read"
          value={messages.length - unreadCount}
          description="Inquiries addressed"
          icon={CheckCircle}
          tone="neutral"
        />
      </div>

      <div
        className="card"
        style={{
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'inline-flex', gap: '6px', background: 'var(--admin-surface-hover)', padding: '4px', borderRadius: 'var(--admin-radius-sm, 6px)', border: '1px solid var(--admin-border)' }}>
          {[
            { id: 'all', label: `All (${messages.length})` },
            { id: 'unread', label: `Unread (${unreadCount})` },
            { id: 'read', label: `Read (${messages.length - unreadCount})` },
          ].map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => setActiveFilter(filter.id)}
              style={{
                border: 'none',
                background: activeFilter === filter.id ? 'var(--admin-surface)' : 'transparent',
                color: activeFilter === filter.id ? 'var(--admin-text)' : 'var(--admin-text-muted)',
                fontWeight: activeFilter === filter.id ? 600 : 400,
                boxShadow: activeFilter === filter.id ? 'var(--admin-shadow-sm)' : 'none',
                padding: '6px 12px',
                borderRadius: 'var(--admin-radius-sm, 4px)',
                fontSize: '0.82rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <div style={{ position: 'relative', width: '280px' }}>
          <MagnifyingGlass
            size={14}
            style={{
              position: 'absolute',
              left: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--admin-text-muted)',
            }}
          />
          <input
            type="text"
            placeholder="Search sender, email, or message..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '6px 12px 6px 30px',
              fontSize: '0.84rem',
              borderRadius: 'var(--admin-radius-sm, 6px)',
              border: '1px solid var(--admin-border)',
              background: 'var(--admin-surface)',
              color: 'var(--admin-text)',
            }}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 380px) minmax(0, 1fr)', gap: '24px', alignItems: 'start' }}>
        {/* MESSAGE LIST */}
        <div className="card" style={{ padding: 0, overflow: 'hidden', maxHeight: '680px', overflowY: 'auto' }}>
          {filteredMessages.length === 0 ? (
            <div style={{ padding: '40px 20px' }}>
              <EmptyState
                icon={EnvelopeSimple}
                title={search || activeFilter !== 'all' ? 'No matching messages' : 'Inbox is empty'}
                description={
                  search || activeFilter !== 'all'
                    ? 'Try clearing the search or switching filters.'
                    : 'Customer inquiries submitted through your storefront will arrive here.'
                }
              />
            </div>
          ) : (
            <div style={{ display: 'grid', divideY: '1px solid var(--admin-border)' }}>
              {filteredMessages.map((msg) => {
                const isSelected = selectedMessage?.id === msg.id;
                return (
                  <button
                    key={msg.id}
                    type="button"
                    onClick={() => handleSelectMessage(msg)}
                    style={{
                      display: 'block',
                      width: '100%',
                      textAlign: 'left',
                      padding: '14px 16px',
                      background: isSelected ? 'var(--admin-surface-hover)' : 'transparent',
                      border: 'none',
                      borderBottom: '1px solid var(--admin-border)',
                      borderLeft: isSelected ? '3px solid var(--admin-primary)' : '3px solid transparent',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontWeight: msg.is_read ? 500 : 700, color: 'var(--admin-text)', fontSize: '0.9rem' }}>
                        {msg.name || 'Anonymous Sender'}
                      </span>
                      <span style={{ fontSize: '0.74rem', color: 'var(--admin-text-muted)' }}>
                        {new Date(msg.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)', marginBottom: '6px' }}>
                      {msg.email}
                    </div>
                    <div
                      style={{
                        fontSize: '0.82rem',
                        color: msg.is_read ? 'var(--admin-text-muted)' : 'var(--admin-text)',
                        fontWeight: msg.is_read ? 400 : 500,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {msg.message}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* MESSAGE DETAIL */}
        <div className="card" style={{ padding: '24px' }}>
          {selectedMessage ? (
            <div style={{ display: 'grid', gap: '20px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px',
                  paddingBottom: '18px',
                  borderBottom: '1px solid var(--admin-border)',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <StatusBadge status={selectedMessage.is_read ? 'neutral' : 'warning'}>
                      {selectedMessage.is_read ? 'Read' : 'Unread'}
                    </StatusBadge>
                    <span style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <CalendarBlank size={14} />
                      {new Date(selectedMessage.created_at).toLocaleString()}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--admin-text)', margin: '0 0 4px' }}>
                    {selectedMessage.name}
                  </h3>
                  <a
                    href={`mailto:${selectedMessage.email}`}
                    style={{
                      fontSize: '0.88rem',
                      color: 'var(--admin-primary)',
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <span>{selectedMessage.email}</span>
                    <ArrowSquareOut size={14} />
                  </a>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => updateReadState(selectedMessage, !selectedMessage.is_read)}
                    disabled={updatingId === selectedMessage.id}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    {updatingId === selectedMessage.id ? (
                      <CircleNotch size={14} className="spin" />
                    ) : selectedMessage.is_read ? (
                      <EnvelopeSimple size={14} />
                    ) : (
                      <CheckCircle size={14} />
                    )}
                    <span>{selectedMessage.is_read ? 'Mark as Unread' : 'Mark as Read'}</span>
                  </button>
                  <a
                    href={`mailto:${selectedMessage.email}?subject=Re: Inquiry on ${encodeURIComponent(selectedMessage.name)}`}
                    className="btn-primary"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      textDecoration: 'none',
                    }}
                  >
                    <EnvelopeSimple size={14} />
                    <span>Reply via Email</span>
                  </a>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, color: 'var(--admin-text-muted)', display: 'block', marginBottom: '8px' }}>
                  Customer Message
                </label>
                <div
                  style={{
                    padding: '16px',
                    borderRadius: 'var(--admin-radius-md, 8px)',
                    background: 'var(--admin-surface-hover)',
                    border: '1px solid var(--admin-border)',
                    fontSize: '0.92rem',
                    lineHeight: 1.7,
                    color: 'var(--admin-text)',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {selectedMessage.message}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ padding: '60px 20px', textAlign: 'center' }}>
              <EmptyState
                icon={EnvelopeSimple}
                title="No message selected"
                description="Choose an inquiry from the inbox list on the left to read customer details."
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Contacts;
