import { useEffect, useState } from 'react'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

interface Job {
  id: string
  title: string
  description: string
  address: string
  service_type: string
  budget: number
  status: string
  created_at: string
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/jobs`)
        setJobs(response.data)
      } catch (error) {
        console.error('Failed to fetch jobs:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchJobs()
  }, [])

  if (loading) {
    return <div>Loading jobs...</div>
  }

  return (
    <div>
      <h1>Job Marketplace</h1>
      <div style={{ marginTop: '20px' }}>
        {jobs.length === 0 ? (
          <p>No jobs available at the moment.</p>
        ) : (
          <div style={{ display: 'grid', gap: '20px' }}>
            {jobs.map((job) => (
              <div
                key={job.id}
                style={{
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  padding: '20px',
                }}
              >
                <h3>{job.title}</h3>
                <p style={{ color: '#666', marginTop: '10px' }}>{job.description}</p>
                <div style={{ marginTop: '15px', display: 'flex', gap: '20px' }}>
                  <span>
                    <strong>Location:</strong> {job.address}
                  </span>
                  {job.budget && (
                    <span>
                      <strong>Budget:</strong> ${job.budget}
                    </span>
                  )}
                  <span>
                    <strong>Status:</strong> {job.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
