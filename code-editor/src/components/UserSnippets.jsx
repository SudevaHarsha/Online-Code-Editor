import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react'; // Import useAuth from Clerk

function UserFiles() {
  const [files, setFiles] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const { getToken } = useAuth(); // Get getToken function from Clerk

  useEffect(() => {
    const fetchUserFiles = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2N2VkMDQxMmIxMTcyNWFmMDY3YzUxNWYiLCJpYXQiOjE3NDM2NzIwNjEsImV4cCI6MTc0MzY3NTY2MX0.m_NIgJ5yQ7U1w4l36gNPwYVweRjvy13341oyopSOiUo";

        const response = await fetch('/api/snippets/67ed0412b11725af067c515f', { // Your backend API endpoint
          headers: {
            Authorization: `Bearer ${token}`, // Include JWT in Authorization header
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setFiles(data);
        setLoading(false);

      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchUserFiles();
  }, [getToken]); // Dependency array includes getToken

  if (loading) {
    return <p>Loading files...</p>;
  }

  if (error) {
    return <p>Error: {error}</p>;
  }

  return (
    <div>
      <h2>My Files</h2>
      {files.length === 0 ? (
        <p>No files found.</p>
      ) : (
        <ul>
          {files.map((file) => (
            <li key={file._id}>
              {file.fileName} ({file.language})
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default UserFiles;