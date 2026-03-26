import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { serversService, apiKeyService, utils } from '../services/api'
import ApiKeysModal from '../components/ApiKeysModal'
import HardwareModal from '../components/HardwareModal'
import ServerCard from '../components/ServerCard'
import './DashboardPage.css'

export default function DashboardPage() {
  const [servers, setServers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showApiKeysModal, setShowApiKeysModal] = useState(false)
  const [showHardwareModal, setShowHardwareModal] = useState(false)
  const [selectedServer, setSelectedServer] = useState(null)
  const { logout } = useAuth()

  useEffect(() => {
    loadServers()
    const interval = setInterval(loadServers, 5000)
    return () => clearInterval(interval)
  }, [])

  const loadServers = async () => {
    try {
      const response = await serversService.list()
      if (response.success && response.servers) {
        const serversWithMetrics = await Promise.all(
          response.servers.map(async (hostname) => {
            try {
              const metricsResponse = await serversService.getMetrics(hostname)
              if (metricsResponse.success && metricsResponse.metric) {
                const m = metricsResponse.metric
                return {
                  hostname,
                  status: 'online',
                  cpu: m.cpu_usage_percent || 0,
                  memory: m.memory_usage_percent || 0,
                  disk_read: m.disk_read_bytes_per_sec || 0,
                  disk_write: m.disk_write_bytes_per_sec || 0,
                  disk_read_ops: m.disk_read_ops_per_sec || 0,
                  disk_write_ops: m.disk_write_ops_per_sec || 0,
                  network_rx: m.network_rx_bytes_per_sec || 0,
                  network_tx: m.network_tx_bytes_per_sec || 0,
                  uptime: m.uptime_seconds || 0,
                  cpu_count: m.cpu_count || 0,
                  memory_total: m.memory_total || 0,
                  memory_used: m.memory_used || 0,
                  timestamp: m.timestamp || 0
                }
              }
              return { hostname, status: 'offline' }
            } catch (error) {
              return { hostname, status: 'offline' }
            }
          })
        )
        setServers(serversWithMetrics)
      } else {
        setServers([])
      }
    } catch (error) {
      console.error('Error loading servers:', error)
      setServers([])
    } finally {
      setLoading(false)
    }
  }

  const handleShowHardware = (server) => {
    setSelectedServer(server)
    setShowHardwareModal(true)
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1 className="logo">EnordeAgent</h1>
        <div className="header-actions">
          <button className="btn-secondary" onClick={() => setShowApiKeysModal(true)}>
            API Keys
          </button>
          <button className="btn-secondary" onClick={logout}>
            Logout
          </button>
        </div>
      </header>

      <main className="dashboard-main">
        {loading ? (
          <div className="loading">Loading servers...</div>
        ) : servers.length === 0 ? (
          <div className="loading">
            <p>No servers connected yet.</p>
            <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>
              Click "API Keys" to generate a key for your agents.
            </p>
          </div>
        ) : (
          <div className="servers-grid">
            {servers.map((server) => (
              <ServerCard
                key={server.hostname}
                server={server}
                onShowHardware={() => handleShowHardware(server)}
              />
            ))}
          </div>
        )}
      </main>

      {showApiKeysModal && (
        <ApiKeysModal onClose={() => setShowApiKeysModal(false)} />
      )}

      {showHardwareModal && selectedServer && (
        <HardwareModal
          hostname={selectedServer.hostname}
          onClose={() => {
            setShowHardwareModal(false)
            setSelectedServer(null)
          }}
        />
      )}
    </div>
  )
}
