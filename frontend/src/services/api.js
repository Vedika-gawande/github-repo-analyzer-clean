import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

export async function analyzeRepo(repoUrl) {
  const response = await axios.post(`${BACKEND_URL}/api/analyze`, { repoUrl });
  return response.data;
}

