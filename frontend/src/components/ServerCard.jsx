import { utils } from '../services/api'
import './ServerCard.css'

export default function ServerCard({ server, onShowHardware }) {
  const isOnline = server.status === 'online'
  const lastUpdate = isOnline && server.timestamp ? utils.formatTimeAgo(server.timestamp) : 'N/A'

  return (
    <div
      className={`server-card ${isOnline ? '' : 'offline'}`}
      onClick={isOnline ? onShowHardware : undefined}
      style={{ cursor: isOnline ? 'pointer' : 'default' }}
    >
      <div className="server-header">
        <h3 className="server-name">{server.hostname}</h3>
        <div className="server-status">
          <span className={`status-indicator ${isOnline ? '' : 'offline'}`}></span>
          <span>{server.status}</span>
        </div>
      </div>

      {isOnline ? (
        <>
          <div className="metrics-grid">
            <div className="metric-item">
              <div className="metric-label">CPU Usage</div>
              <div className="metric-value">
                {server.cpu.toFixed(1)}<span className="metric-unit">%</span>
                {server.cpu_count ? (
                  <small style={{ color: 'var(--text-muted)' }}>({server.cpu_count} cores)</small>
                ) : null}
              </div>
              <div className="progress-bar">
                <div
                  className={`progress-fill ${utils.getProgressColor(server.cpu)}`}
                  style={{ width: `${server.cpu}%` }}
                ></div>
              </div>
            </div>

            <div className="metric-item">
              <div className="metric-label">Memory</div>
              <div className="metric-value">
                {server.memory.toFixed(1)}<span className="metric-unit">%</span>
                {server.memory_total ? (
                  <small style={{ color: 'var(--text-muted)' }}>
                    ({utils.formatBytes(server.memory_used)} / {utils.formatBytes(server.memory_total)})
                  </small>
                ) : null}
              </div>
              <div className="progress-bar">
                <div
                  className={`progress-fill ${utils.getProgressColor(server.memory)}`}
                  style={{ width: `${server.memory}%` }}
                ></div>
              </div>
            </div>

            <div className="metric-item">
              <div className="metric-label">Disk I/O</div>
              <div className="metric-value">
                <span style={{ color: 'var(--success)' }}>
                  R: {utils.formatBytes(server.disk_read)}/s
                </span>
                <span style={{ color: 'var(--danger)', marginLeft: '0.5rem' }}>
                  W: {utils.formatBytes(server.disk_write)}/s
                </span>
              </div>
              <div className="metric-value" style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
                <span style={{ color: 'var(--success)' }}>{server.disk_read_ops || 0} IOPS</span>
                <span style={{ color: 'var(--danger)', marginLeft: '0.5rem' }}>
                  {server.disk_write_ops || 0} IOPS
                </span>
              </div>
            </div>

            <div className="metric-item">
              <div className="metric-label">Network</div>
              <div className="metric-value">
                <span style={{ color: 'var(--success)' }}>
                  ↓ {utils.formatBytes(server.network_rx)}/s
                </span>
                <span style={{ color: 'var(--accent-primary)', marginLeft: '0.5rem' }}>
                  ↑ {utils.formatBytes(server.network_tx)}/s
                </span>
              </div>
            </div>
          </div>

          <div className="server-footer">
            <div className="uptime-info">
              <span className="uptime-label">Uptime:</span>
              <span className="uptime-value">{utils.formatUptime(server.uptime)}</span>
            </div>
            <div className="last-update">
              Last update: {lastUpdate}
              <span style={{ color: 'var(--accent-primary)', marginLeft: '0.5rem' }}>
                (Click for hardware details)
              </span>
            </div>
          </div>
        </>
      ) : (
        <div className="offline-message">
          <p>Server is currently offline</p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Last seen: {lastUpdate}
          </p>
        </div>
      )}
    </div>
  )
}
