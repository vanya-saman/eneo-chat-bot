export default function Sources({ references }) {
    if (!references || references.length === 0) {
        return null;
    }

    return (
        <div className="sources">
            <span className="sources-title">Källor</span>

            {references.map((ref, index) => (
                <details key={index} className="source">
                    <summary>{ref.title ?? "Källa"}</summary>
                    <p className="source-content">{ref.content}</p>
                </details>
            ))}
        </div>
    );
}