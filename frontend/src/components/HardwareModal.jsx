import { useState, useEffect } from 'react'
import { serversService, utils } from '../services/api'
import './Modal.css'

export default function HardwareModal({ hostname, onClose }) {
  const [hardware, setHardware] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadHardware()
  }, [hostname])

  const loadHardware = async () => {
    try {
      const response = await serversService.getHardware(hostname)
      if (response.success && response.hardware) {
        setHardware(response.hardware)
      }
    } catch (error) {
      console.error('Error loading hardware:', error)
    } finally {
      setLoading(false)
    }
  }

  const cpu = hardware?.cpu
  const memory = hardware?.memory
  const disks = hardware?.disks || []
  const networkInterfaces = hardware?.network_interfaces || []
  const motherboard = hardware?.motherboard

  return (
    <div className="modal modal-large" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content">
        <div className="modal-header">
          <h2>Hardware Details - {hostname}</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          {loading ? (
            <div className="loading">Loading hardware information...</div>
          ) : !hardware ? (
            <div className="loading">
              <p>No hardware information available.</p>
              <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                Hardware data is collected every 60 minutes. Please check back later.
              </p>
            </div>
          ) : (
            <div className="hardware-sections">
              {cpu && (
                <div className="hardware-section">
                  <h3 className="hardware-section-title">CPU Information</h3>
                  <div className="hardware-grid">
                    <div className="hardware-item">
                      <span className="hardware-label">Model</span>
                      <span className="hardware-value">{cpu.model}</span>
                    </div>
                    <div className="hardware-item">
                      <span className="hardware-label">Vendor</span>
                      <span className="hardware-value">{cpu.vendor}</span>
                    </div>
                    <div className="hardware-item">
                      <span className="hardware-label">Architecture</span>
                      <span className="hardware-value">{cpu.architecture}</span>
                    </div>
                    <div className="hardware-item">
                      <span className="hardware-label">Cores / Threads</span>
                      <span className="hardware-value">{cpu.cores} / {cpu.threads}</span>
                    </div>
                    <div className="hardware-item">
                      <span className="hardware-label">Base Frequency</span>
                      <span className="hardware-value">{cpu.base_frequency_mhz} MHz</span>
                    </div>
                    <div className="hardware-item">
                      <span className="hardware-label">Max Frequency</span>
                      <span className="hardware-value">{cpu.max_frequency_mhz} MHz</span>
                    </div>
                    <div className="hardware-item">
                      <span className="hardware-label">Cache L1</span>
                      <span className="hardware-value">{cpu.cache_l1_kb} KB</span>
                    </div>
                    <div className="hardware-item">
                      <span className="hardware-label">Cache L2</span>
                      <span className="hardware-value">{cpu.cache_l2_kb} KB</span>
                    </div>
                    <div className="hardware-item">
                      <span className="hardware-label">Cache L3</span>
                      <span className="hardware-value">{cpu.cache_l3_kb} KB</span>
                    </div>
                  </div>
                </div>
              )}

              {memory && (
                <div className="hardware-section">
                  <h3 className="hardware-section-title">Memory Information</h3>
                  <div className="hardware-grid">
                    <div className="hardware-item">
                      <span className="hardware-label">Total Memory</span>
                      <span className="hardware-value">{utils.formatBytes(memory.total_memory_bytes)}</span>
                    </div>
                    <div className="hardware-item">
                      <span className="hardware-label">Memory Slots</span>
                      <span className="hardware-value">
                        {memory.used_slots} used / {memory.total_slots} total ({memory.free_slots} free)
                      </span>
                    </div>
                  </div>
                  {memory.dimms && memory.dimms.length > 0 && (
                    <div className="dimms-list">
                      {memory.dimms.map((dimm, index) => (
                        <div key={index} className="dimm-card">
                          <div className="dimm-header">{dimm.slot}</div>
                          <div className="dimm-details">
                            <div><strong>Size:</strong> {utils.formatBytes(dimm.size_bytes)}</div>
                            <div><strong>Speed:</strong> {dimm.speed_mhz} MHz</div>
                            <div><strong>Type:</strong> {dimm.memory_type}</div>
                            <div><strong>Manufacturer:</strong> {dimm.manufacturer}</div>
                            {dimm.serial_number !== 'Unknown' && (
                              <div><strong>Serial:</strong> {dimm.serial_number}</div>
                            )}
                            {dimm.part_number !== 'Unknown' && (
                              <div><strong>Part #:</strong> {dimm.part_number}</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {disks.length > 0 && (
                <div className="hardware-section">
                  <h3 className="hardware-section-title">Storage Information</h3>
                  {disks.map((disk, index) => (
                    <div key={index} className="disk-card">
                      <div className="disk-header">
                        <span className="disk-device">{disk.device}</span>
                        <span className="disk-type">{disk.disk_type}</span>
                      </div>
                      <div className="disk-info">
                        <div className="hardware-item">
                          <span className="hardware-label">Model</span>
                          <span className="hardware-value">{disk.model}</span>
                        </div>
                        <div className="hardware-item">
                          <span className="hardware-label">Size</span>
                          <span className="hardware-value">{utils.formatBytes(disk.size_bytes)}</span>
                        </div>
                        {disk.serial_number !== 'Unknown' && (
                          <div className="hardware-item">
                            <span className="hardware-label">Serial</span>
                            <span className="hardware-value">{disk.serial_number}</span>
                          </div>
                        )}
                      </div>
                      {disk.partitions && disk.partitions.length > 0 && (
                        <div className="partitions-list">
                          <h4>Partitions</h4>
                          {disk.partitions.map((part, pIndex) => (
                            <div key={pIndex} className="partition-item">
                              <span className="partition-name">{part.name}</span>
                              <div className="partition-details">
                                <span>{part.filesystem}</span>
                                <span>{utils.formatBytes(part.size_bytes)}</span>
                                {part.mount_point !== 'Not mounted' && (
                                  <span className="partition-mount">{part.mount_point}</span>
                                )}
                                {part.usage_percent > 0 && (
                                  <span className="partition-usage">{part.usage_percent.toFixed(1)}% used</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {networkInterfaces.length > 0 && (
                <div className="hardware-section">
                  <h3 className="hardware-section-title">Network Interfaces</h3>
                  <div className="network-list">
                    {networkInterfaces.map((iface, index) => (
                      <div key={index} className="network-card">
                        <div className="network-header">
                          <span className="network-name">{iface.name}</span>
                          <span className="network-speed">
                            {iface.speed_mbps > 0 ? `${iface.speed_mbps} Mbps` : 'Unknown speed'}
                          </span>
                        </div>
                        <div className="network-details">
                          <div className="hardware-item">
                            <span className="hardware-label">MAC Address</span>
                            <span className="hardware-value">{iface.mac_address}</span>
                          </div>
                          <div className="hardware-item">
                            <span className="hardware-label">Duplex</span>
                            <span className="hardware-value">{iface.duplex}</span>
                          </div>
                          <div className="hardware-item">
                            <span className="hardware-label">Driver</span>
                            <span className="hardware-value">{iface.driver}</span>
                          </div>
                          {iface.ip_addresses && iface.ip_addresses.length > 0 && (
                            <div className="hardware-item">
                              <span className="hardware-label">IP Addresses</span>
                              <span className="hardware-value">{iface.ip_addresses.join(', ')}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {motherboard && (
                <div className="hardware-section">
                  <h3 className="hardware-section-title">Motherboard & BIOS</h3>
                  <div className="hardware-grid">
                    <div className="hardware-item">
                      <span className="hardware-label">Manufacturer</span>
                      <span className="hardware-value">{motherboard.manufacturer}</span>
                    </div>
                    <div className="hardware-item">
                      <span className="hardware-label">Product</span>
                      <span className="hardware-value">{motherboard.product_name}</span>
                    </div>
                    <div className="hardware-item">
                      <span className="hardware-label">Version</span>
                      <span className="hardware-value">{motherboard.version}</span>
                    </div>
                    {motherboard.serial_number !== 'Unknown' && (
                      <div className="hardware-item">
                        <span className="hardware-label">Serial</span>
                        <span className="hardware-value">{motherboard.serial_number}</span>
                      </div>
                    )}
                    <div className="hardware-item">
                      <span className="hardware-label">BIOS Vendor</span>
                      <span className="hardware-value">{motherboard.bios_vendor}</span>
                    </div>
                    <div className="hardware-item">
                      <span className="hardware-label">BIOS Version</span>
                      <span className="hardware-value">{motherboard.bios_version}</span>
                    </div>
                    <div className="hardware-item">
                      <span className="hardware-label">BIOS Date</span>
                      <span className="hardware-value">{motherboard.bios_date}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
