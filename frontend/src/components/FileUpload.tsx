import { useState, useRef } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface FileUploadProps {
  onUploadSuccess: (route: any) => void;
  onUploadError: (error: string) => void;
}

export default function FileUpload({ onUploadSuccess, onUploadError }: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file) return;

    const allowedTypes = [
      'text/csv',
      'application/json',
      'application/gpx+xml',
      'application/xml',
      'text/xml',
    ];

    const allowedExtensions = ['.csv', '.json', '.gpx', '.geojson'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));

    if (
      !allowedTypes.includes(file.type) &&
      !allowedExtensions.includes(fileExtension)
    ) {
      onUploadError('Invalid file type. Only CSV, JSON, GPX, and GeoJSON files are allowed.');
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/api/routes/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });

      onUploadSuccess(response.data);
    } catch (error: any) {
      onUploadError(
        error.response?.data?.error?.message || 'Failed to upload file'
      );
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  return (
    <div
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      style={{
        border: `2px dashed ${dragActive ? '#3498db' : '#ddd'}`,
        borderRadius: '8px',
        padding: '40px',
        textAlign: 'center',
        backgroundColor: dragActive ? '#f0f8ff' : '#fafafa',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
      }}
      onClick={() => fileInputRef.current?.click()}
    >
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleChange}
        accept=".csv,.json,.gpx,.geojson"
        style={{ display: 'none' }}
      />
      {uploading ? (
        <div>
          <div style={{ marginBottom: '10px' }}>Uploading...</div>
          <div style={{ fontSize: '14px', color: '#666' }}>Please wait</div>
        </div>
      ) : (
        <div>
          <div style={{ fontSize: '48px', marginBottom: '10px' }}>📁</div>
          <div style={{ marginBottom: '10px', fontWeight: 'bold' }}>
            Drop a file here or click to browse
          </div>
          <div style={{ fontSize: '14px', color: '#666' }}>
            Supported formats: CSV, JSON, GPX, GeoJSON
          </div>
        </div>
      )}
    </div>
  );
}
