import { useEffect, useState } from 'react'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

interface Route {
  id: string
  name: string
  distance_km: number
  duration_minutes: number
  optimized: boolean
  created_at: string
}

export default function RoutesPage() {
  const [routes, setRoutes] = useState<Route[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/routes`)
        setRoutes(response.data)
      } catch (error) {
        console.error('Failed to fetch routes:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchRoutes()
  }, [])

  if (loading) {
    return <div>Loading routes...</div>
  }

  return (
    <div>
      <h1>Routes</h1>
      <div style={{ marginTop: '20px' }}>
        {routes.length === 0 ? (
          <p>No routes found. Create your first route!</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f5f5f5' }}>
                <th style={{ padding: '10px', textAlign: 'left' }}>Name</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>Distance (km)</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>Duration (min)</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {routes.map((route) => (
                <tr key={route.id} style={{ borderBottom: '1px solid #ddd' }}>
                  <td style={{ padding: '10px' }}>{route.name || 'Unnamed Route'}</td>
                  <td style={{ padding: '10px' }}>{route.distance_km || 0}</td>
                  <td style={{ padding: '10px' }}>{route.duration_minutes || 0}</td>
                  <td style={{ padding: '10px' }}>
                    {route.optimized ? (
                      <span style={{ color: '#2ecc71' }}>Optimized</span>
                    ) : (
                      <span style={{ color: '#e74c3c' }}>Not Optimized</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
