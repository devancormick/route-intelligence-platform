import { useState } from 'react'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export default function PricingPage() {
  const [jobType, setJobType] = useState('')
  const [latitude, setLatitude] = useState('')
  const [longitude, setLongitude] = useState('')
  const [recommendation, setRecommendation] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const handleGetRecommendation = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await axios.get(`${API_URL}/api/pricing/recommendations`, {
        params: {
          job_type: jobType,
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
        },
      })
      setRecommendation(response.data)
    } catch (error) {
      console.error('Failed to get pricing recommendation:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h1>Pricing Guidance</h1>
      <form onSubmit={handleGetRecommendation} style={{ marginTop: '30px' }}>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Job Type</label>
          <input
            type="text"
            value={jobType}
            onChange={(e) => setJobType(e.target.value)}
            required
            placeholder="e.g., lawn_mowing, landscaping"
            style={{
              width: '100%',
              maxWidth: '400px',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '4px',
            }}
          />
        </div>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Latitude</label>
          <input
            type="number"
            step="any"
            value={latitude}
            onChange={(e) => setLatitude(e.target.value)}
            required
            style={{
              width: '100%',
              maxWidth: '400px',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '4px',
            }}
          />
        </div>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Longitude</label>
          <input
            type="number"
            step="any"
            value={longitude}
            onChange={(e) => setLongitude(e.target.value)}
            required
            style={{
              width: '100%',
              maxWidth: '400px',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '4px',
            }}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '12px 24px',
            backgroundColor: '#3498db',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Loading...' : 'Get Recommendation'}
        </button>
      </form>

      {recommendation && recommendation.recommendation && (
        <div style={{
          marginTop: '30px',
          padding: '20px',
          backgroundColor: '#f9f9f9',
          borderRadius: '8px',
        }}>
          <h3>Pricing Recommendation</h3>
          <div style={{ marginTop: '15px' }}>
            <p><strong>Average:</strong> ${recommendation.recommendation.average.toFixed(2)}</p>
            <p><strong>Median:</strong> ${recommendation.recommendation.median.toFixed(2)}</p>
            <p><strong>Range:</strong> ${recommendation.recommendation.min.toFixed(2)} - ${recommendation.recommendation.max.toFixed(2)}</p>
            <p><strong>Sample Size:</strong> {recommendation.recommendation.sample_size} data points</p>
          </div>
        </div>
      )}
    </div>
  )
}
