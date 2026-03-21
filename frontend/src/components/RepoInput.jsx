import { useState } from 'react';
import { analyzeRepo } from '../services/api.js';

export default function RepoInput() {
  const [repoUrl, setRepoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  async function onSubmit(e) {
    e.preventDefault();

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await analyzeRepo(repoUrl);
      setResult(response);
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12, marginTop: 16 }}>
      <label>
        <span style={{ display: 'block', marginBottom: 6 }}>GitHub repo URL</span>
        <input
          value={repoUrl}
          onChange={(e) => setRepoUrl(e.target.value)}
          placeholder="https://github.com/owner/repo"
          style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #ccc' }}
        />
      </label>

      <button type="submit" disabled={loading} style={{ padding: 10, borderRadius: 8 }}>
        {loading ? 'Analyzing...' : 'Analyze'}
      </button>

      {error ? <div style={{ color: 'crimson' }}>Error: {error}</div> : null}
      {result ? (
        <pre
          style={{
            background: '#f6f8fa',
            padding: 12,
            borderRadius: 8,
            overflowX: 'auto',
            fontSize: 12,
          }}
        >
          {JSON.stringify(result, null, 2)}
        </pre>
      ) : null}
    </form>
  );
}

