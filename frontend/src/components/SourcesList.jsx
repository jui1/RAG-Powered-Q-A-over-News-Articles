function SourcesList({ sources }) {
  if (!sources || sources.length === 0) return null;

  return (
    <div className="sources-list">
      <div className="sources-header">📚 Sources:</div>
      <div className="sources-items">
        {sources.map((source, index) => (
          <a
            key={index}
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="source-item"
          >
            <div className="source-title">{source.title}</div>
            <div className="source-snippet">{source.snippet}</div>
          </a>
        ))}
      </div>
    </div>
  );
}

export default SourcesList;


