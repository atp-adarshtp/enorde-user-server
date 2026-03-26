import { useState, useEffect } from 'react'
import { apiKeyService } from '../services/api'
import './Modal.css'

export default function ApiKeysModal({ onClose }) {
  const [apiKeys, setApiKeys] = useState([])
  const [loading, setLoading] = useState(true)
  const [newKeyName, setNewKeyName] = useState('')
  const [newApiKey, setNewApiKey] = useState(null)
  const [creating, setCreating] = useState(false)
  const [installerInfo, setInstallerInfo] = useState(null)

  useEffect(() => {
    loadApiKeys()
    loadInstallerInfo()
  }, [])

  const loadInstallerInfo = async () => {
    try {
      const response = await apiKeyService.getInstallerInfo()
      if (response.success) {
        setInstallerInfo(response)
      }
    } catch (error) {
      console.error('Error loading installer info:', error)
    }
  }

  const loadApiKeys = async () => {
    try {
      const response = await apiKeyService.list()
      if (response.success) {
        setApiKeys(response.api_keys || [])
      }
    } catch (error) {
      console.error('Error loading API keys:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!newKeyName.trim()) return
    
    setCreating(true)
    try {
      const response = await apiKeyService.create(newKeyName)
      if (response.success && response.api_key) {
        setNewApiKey(response.api_key)
        setNewKeyName('')
        loadApiKeys()
      } else {
        alert(response.message || 'Failed to create API key')
      }
    } catch (error) {
      alert('Network error. Please try again.')
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (keyId) => {
    if (!confirm('Are you sure you want to delete this API key? Agents using this key will stop working.')) {
      return
    }

    try {
      const response = await apiKeyService.delete(keyId)
      if (response.success) {
        loadApiKeys()
      } else {
        alert('Failed to delete API key')
      }
    } catch (error) {
      alert('Network error. Please try again.')
    }
  }

  const handleCopyKey = () => {
    navigator.clipboard.writeText(newApiKey)
    const btn = document.getElementById('copy-api-key-btn')
    if (btn) {
      const originalText = btn.textContent
      btn.textContent = 'Copied!'
      setTimeout(() => {
        btn.textContent = originalText
      }, 2000)
    }
  }

  return (
    <div className="modal" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content">
        <div className="modal-header">
          <h2>API Keys</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          <div className="api-key-create">
            <input
              type="text"
              placeholder="API Key Name (e.g., Production Server)"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleCreate()}
            />
            <button className="btn-primary" onClick={handleCreate} disabled={creating}>
              {creating ? 'Creating...' : 'Create New Key'}
            </button>
          </div>

          {newApiKey && (
            <div className="new-api-key-display">
              <div className="api-key-warning">
                <strong>Important:</strong> Copy this key now. You won't be able to see it again!
              </div>
              <div className="api-key-value-container">
                <input
                  type="text"
                  className="api-key-input"
                  value={newApiKey}
                  readOnly
                />
                <button id="copy-api-key-btn" className="btn-secondary" onClick={handleCopyKey}>
                  Copy
                </button>
              </div>
              {installerInfo && (
                <div className="installer-command-section">
                  <p className="installer-label">To install the agent on your server, run:</p>
                  <div className="installer-command-container">
                    <code className="installer-command">
                      curl -sSL {installerInfo.installerUrl} | API_KEY={newApiKey} bash -
                    </code>
                    <button 
                      className="btn-secondary" 
                      onClick={() => {
                        navigator.clipboard.writeText(`curl -sSL ${installerInfo.installerUrl} | API_KEY=${newApiKey} bash -`)
                        const btn = document.getElementById('copy-installer-btn')
                        if (btn) {
                          const originalText = btn.textContent
                          btn.textContent = 'Copied!'
                          setTimeout(() => { btn.textContent = originalText }, 2000)
                        }
                      }}
                    >
                      <span id="copy-installer-btn">Copy Command</span>
                    </button>
                  </div>
                </div>
              )}
              <button className="btn-primary" onClick={() => setNewApiKey(null)}>
                I've Saved It
              </button>
            </div>
          )}

          <div className="api-keys-list">
            {loading ? (
              <div className="loading">Loading API keys...</div>
            ) : apiKeys.length === 0 ? (
              <div className="loading">No API keys yet. Create one above.</div>
            ) : (
              apiKeys.map((key) => (
                <div key={key.id} className="api-key-item">
                  <div className="api-key-info">
                    <h4>{key.name}</h4>
                    <p>Created: {new Date(key.created_at * 1000).toLocaleDateString()}</p>
                  </div>
                  <button className="btn-danger" onClick={() => handleDelete(key.id)}>
                    Delete
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
