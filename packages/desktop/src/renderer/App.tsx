import { useState } from "react";

function App() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Array<{
    siglum: string;
    library: string;
    century: string;
    genre: string;
    folio: string;
    sourceDatabase: string;
  }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchedQuery, setSearchedQuery] = useState("");

  async function doSearch() {
    if (!query.trim() || loading) return;
    setLoading(true);
    setError(null);
    setSearchedQuery(query);
    try {
      const response = await window.gueranger.search({ query });
      setResults(response.results);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Search failed: ${msg}`);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") doSearch();
  }

  return (
    <div>
      <h1>Gueranger</h1>
      <div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Latin incipit..."
        />
        <button onClick={doSearch} disabled={loading || !query.trim()}>
          Search
        </button>
      </div>
      {loading && <p>Searching...</p>}
      {error && <p>{error}</p>}
      {!loading && !error && results.length === 0 && searchedQuery && (
        <p>No manuscripts found for &quot;{searchedQuery}&quot;.</p>
      )}
      {results.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Siglum</th>
              <th>Library</th>
              <th>Century</th>
              <th>Genre</th>
              <th>Folio</th>
              <th>Source</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r, i) => (
              <tr key={i}>
                <td>{r.siglum}</td>
                <td>{r.library}</td>
                <td>{r.century}</td>
                <td>{r.genre}</td>
                <td>{r.folio}</td>
                <td>{r.sourceDatabase}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default App;
