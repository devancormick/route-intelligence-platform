import { useEffect, useState } from 'react'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export default function Dashboard() {
  const [stats, setStats] = useState({
    routes: 0,
    jobs: 0,
    optimizedRoutes: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [routesRes, jobsRes] = await Promise.all([
          axios.get(`${API_URL}/api/routes`),
          axios.get(`${API_URL}/api/jobs?limit=1`),
        ])

        const routes = routesRes.data
        const optimizedRoutes = routes.filter((r: any) => r.optimized).length

        setStats({
          routes: routes.length,
          jobs: jobsRes.data.length,
          optimizedRoutes,
        })
      } catch (error) {
        console.error('Failed to fetch stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div>
      <h1>Dashboard</h1>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
        marginTop: '30px',
      }}>
        <div style={{
          backgroundColor: '#3498db',
          color: 'white',
          padding: '30px',
          borderRadius: '8px',
        }}>
          <h3>Total Routes</h3>
          <p style={{ fontSize: '36px', marginTop: '10px' }}>{stats.routes}</p>
        </div>
        <div style={{
          backgroundColor: '#2ecc71',
          color: 'white',
          padding: '30px',
          borderRadius: '8px',
        }}>
          <h3>Optimized Routes</h3>
          <p style={{ fontSize: '36px', marginTop: '10px' }}>{stats.optimizedRoutes}</p>
        </div>
        <div style={{
          backgroundColor: '#e74c3c',
          color: 'white',
          padding: '30px',
          borderRadius: '8px',
        }}>
          <h3>Available Jobs</h3>
          <p style={{ fontSize: '36px', marginTop: '10px' }}>{stats.jobs}</p>
        </div>
      </div>
    </div>
  )
}
