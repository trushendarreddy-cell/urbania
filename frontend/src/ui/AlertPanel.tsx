import useAlertStore from "../store/AlertStore";

export default function AlertPanel() {
  const alerts = useAlertStore((state) => state.alerts.filter(a => !a.resolved));
  const resolveAlert = useAlertStore((state) => state.resolveAlert);
  const dismissAlert = useAlertStore((state) => state.dismissAlert);

  if (alerts.length === 0) return null;

  const severityColor = {
    info: '#60A5FA',
    warning: '#FBBF24',
    critical: '#EF4444'
  };

  const severityIcon = {
    info: 'ℹ️',
    warning: '⚠️',
    critical: '🚨'
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '100px',
        right: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        zIndex: 15,
        maxWidth: '320px',
        pointerEvents: 'none',
      }}
    >
      {alerts.slice(0, 5).map((alert) => (
        <div
          key={alert.id}
          style={{
            background: 'rgba(12, 12, 16, 0.92)',
            backdropFilter: 'blur(12px)',
            border: `1px solid ${severityColor[alert.severity]}`,
            borderRadius: '12px',
            padding: '10px 14px',
            color: '#F3F4F6',
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: '13px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
            pointerEvents: 'auto',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
          }}
        >
          <span style={{ fontSize: '18px' }}>{severityIcon[alert.severity]}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: '500', marginBottom: '2px' }}>{alert.message}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
              <span style={{ fontSize: '10px', color: '#9CA3AF' }}>
                {alert.category.toUpperCase()} · Day {Math.round(alert.timestamp)}
              </span>
              <button
                onClick={() => {
                  if (alert.dismissable) {
                    dismissAlert(alert.id);
                  } else {
                    resolveAlert(alert.id);
                  }
                }}
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '2px 8px',
                  color: '#9CA3AF',
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontFamily: 'inherit',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
              >
                {alert.dismissable ? 'Dismiss' : 'Resolve'}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}