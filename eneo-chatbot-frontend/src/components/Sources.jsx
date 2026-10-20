import {useState} from "react";

/** Collapsible list of the sources the AI used for its answer. Renders nothing if there are no sources. */
export default function Sources({ references }) {
    const [isVisible, setIsVisible] = useState(false)

    if (!references || references.length === 0) {
        return null;
    }

    return (
        <div className="sources">
            <span onClick={() => setIsVisible(!isVisible)} className="sources-title">Källor {isVisible ? "↑" : "↓"}</span>
            <div className={`sources-content ${isVisible ? '' : 'sources-content-hidden'}`}>
                {references.map((ref, index) => (
                    <details key={index} className="source">
                        <summary>{ref.title ?? "Källa"}</summary>
                        <p className="source-content">{ref.content}</p>
                    </details>
                ))}
            </div>
        </div>
    );
}