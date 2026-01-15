import { Outlet, Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export default function Layout() {
  const navigate = useNavigate()
  const logout = useAuthStore((state) => state.logout)
  const operator = useAuthStore((state) => state.operator)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside style={{
        width: '250px',
        backgroundColor: '#2c3e50',
        color: 'white',
        padding: '20px',
      }}>
        <h2 style={{ marginBottom: '30px' }}>Route Intelligence</h2>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <Link to="/" style={{ color: 'white', textDecoration: 'none', padding: '10px' }}>
            Dashboard
          </Link>
          <Link to="/routes" style={{ color: 'white', textDecoration: 'none', padding: '10px' }}>
            Routes
          </Link>
          <Link to="/jobs" style={{ color: 'white', textDecoration: 'none', padding: '10px' }}>
            Jobs
          </Link>
          <Link to="/pricing" style={{ color: 'white', textDecoration: 'none', padding: '10px' }}>
            Pricing
          </Link>
          <Link to="/analytics" style={{ color: 'white', textDecoration: 'none', padding: '10px' }}>
            Analytics
          </Link>
        </nav>
        <div style={{ marginTop: 'auto', paddingTop: '30px' }}>
          <p style={{ marginBottom: '10px' }}>{operator?.name}</p>
          <button onClick={handleLogout} style={{
            width: '100%',
            padding: '10px',
            backgroundColor: '#e74c3c',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}>
            Logout
          </button>
        </div>
      </aside>
      <main style={{ flex: 1, padding: '20px' }}>
        <Outlet />
      </main>
    </div>
  )
}
