import { useEffect, useState } from 'react';
import { getApiBaseUrl } from '@regulyn/config';

interface PingResponse {
  service?: string;
  status?: string;
}

export default function Home() {
  const [pingData, setPingData] = useState<PingResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPing() {
      try {
        const apiBaseUrl = getApiBaseUrl();
        const response = await fetch(`${apiBaseUrl}/identity/ping`);
        const data = await response.json();
        setPingData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch');
      } finally {
        setLoading(false);
      }
    }

    fetchPing();
  }, []);

  return (
    <div>
      <h1>Regulyn Data Principal Portal</h1>
      
      {loading && <p>Loading...</p>}
      
      {error && (
        <div>
          <h2>Error</h2>
          <p>{error}</p>
        </div>
      )}
      
      {pingData && (
        <div>
          <h2>API Response</h2>
          <pre>{JSON.stringify(pingData, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
