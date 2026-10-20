import {useState} from "react";

export default function Sources({ references }) {
    if (!references || references.length === 0) {
        return null;
    }

    const [isVisible, setIsVisible] = useState(false)

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