import { useEffect, useState } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface AnalyticsData {
  routes: {
    total: number;
    optimized: number;
    totalDistance: number;
    totalDuration: number;
    averageDistance: number;
    averageDuration: number;
  };
  jobs: {
    total: number;
    open: number;
    assigned: number;
    totalRevenue: number;
  };
  bids: {
    total: number;
    accepted: number;
    averageAmount: number;
  };
  optimization: {
    averageSavings: number;
    totalDistanceSaved: number;
    totalTimeSaved: number;
  };
}

export default function Analytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [performance, setPerformance] = useState<any[]>([]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const token = localStorage.getItem('token');
        const [analyticsRes, performanceRes] = await Promise.all([
          axios.get(`${API_URL}/api/analytics/operator`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${API_URL}/api/analytics/routes/performance`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        setAnalytics(analyticsRes.data);
        setPerformance(performanceRes.data);
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return <div>Loading analytics...</div>;
  }

  if (!analytics) {
    return <div>No analytics data available</div>;
  }

  return (
    <div>
      <h1>Analytics Dashboard</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginTop: '30px' }}>
        <div style={{ backgroundColor: '#3498db', color: 'white', padding: '30px', borderRadius: '8px' }}>
          <h3>Total Routes</h3>
          <p style={{ fontSize: '36px', marginTop: '10px' }}>{analytics.routes.total}</p>
          <p style={{ fontSize: '14px', opacity: 0.9 }}>
            {analytics.routes.optimized} optimized
          </p>
        </div>

        <div style={{ backgroundColor: '#2ecc71', color: 'white', padding: '30px', borderRadius: '8px' }}>
          <h3>Total Distance</h3>
          <p style={{ fontSize: '36px', marginTop: '10px' }}>
            {analytics.routes.totalDistance.toFixed(1)} km
          </p>
          <p style={{ fontSize: '14px', opacity: 0.9 }}>
            Avg: {analytics.routes.averageDistance.toFixed(1)} km
          </p>
        </div>

        <div style={{ backgroundColor: '#e74c3c', color: 'white', padding: '30px', borderRadius: '8px' }}>
          <h3>Total Revenue</h3>
          <p style={{ fontSize: '36px', marginTop: '10px' }}>
            ${analytics.jobs.totalRevenue.toFixed(2)}
          </p>
          <p style={{ fontSize: '14px', opacity: 0.9 }}>
            {analytics.jobs.assigned} jobs assigned
          </p>
        </div>

        <div style={{ backgroundColor: '#f39c12', color: 'white', padding: '30px', borderRadius: '8px' }}>
          <h3>Optimization Savings</h3>
          <p style={{ fontSize: '36px', marginTop: '10px' }}>
            {analytics.optimization.averageSavings.toFixed(1)}%
          </p>
          <p style={{ fontSize: '14px', opacity: 0.9 }}>
            {analytics.optimization.totalDistanceSaved.toFixed(1)} km saved
          </p>
        </div>
      </div>

      <div style={{ marginTop: '40px' }}>
        <h2>Route Performance (Last 30 Days)</h2>
        <div style={{ marginTop: '20px', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f5f5f5' }}>
                <th style={{ padding: '10px', textAlign: 'left' }}>Date</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>Routes</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>Avg Distance</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>Avg Duration</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>Optimized</th>
              </tr>
            </thead>
            <tbody>
              {performance.map((day, index) => (
                <tr key={index} style={{ borderBottom: '1px solid #ddd' }}>
                  <td style={{ padding: '10px' }}>
                    {new Date(day.date).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '10px' }}>{day.route_count}</td>
                  <td style={{ padding: '10px' }}>
                    {parseFloat(day.avg_distance || 0).toFixed(1)} km
                  </td>
                  <td style={{ padding: '10px' }}>
                    {parseInt(day.avg_duration || 0)} min
                  </td>
                  <td style={{ padding: '10px' }}>{day.optimized_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
