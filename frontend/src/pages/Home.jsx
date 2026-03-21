import RepoInput from '../components/RepoInput.jsx';

export default function Home() {
  return (
    <div style={{ maxWidth: 720, margin: '40px auto', padding: '0 16px', fontFamily: 'system-ui' }}>
      <h1>Repo Analyzer</h1>
      <RepoInput />
    </div>
  );
}

