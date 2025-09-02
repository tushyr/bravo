import { useState, useEffect } from 'react'
import LedgerPanel from './components/LedgerPanel'

const LedgerApp = () => {
  const [isConnected, setIsConnected] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState('connecting')

  useEffect(() => {
    // Simulate connection to outlets
    const timer = setTimeout(() => {
      setIsConnected(true)
      setConnectionStatus('connected')
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold mb-2">Connecting to Outlets</h2>
          <p className="text-gray-400">Establishing real-time sync with partner bars and restaurants...</p>
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-300">Bar Central - Connected</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-300">Lounge Elite - Connected</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-300">Wine Bar - Connecting...</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return <LedgerPanel />
}

export default LedgerApp
