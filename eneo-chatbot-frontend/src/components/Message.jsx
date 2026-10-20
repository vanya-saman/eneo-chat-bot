import ReactMarkdown from "react-markdown";
import CopyButton from "./CopyButton.jsx";
import Sources from "./Sources.jsx";

/**
 * A single chat message: text as Markdown, attached images and files, and sources.
 * AI messages also show the assistant's icon, name and a copy button.
 */

function Message(props) {
    const message = props.message;
    const aiIcon = props.aiIcon;
    const aiName = props.aiName;
    const onImageLoad = props.onImageLoad;

    const images = message.images ?? [];
    const files = message.files ?? [];
    const hasAttachments = images.length > 0 || files.length > 0;


    return (
        <div
            className={`message ${message.speaker}`}
        >
            {message.speaker === "ai" && (
                <div className={"ai-message-header"}>
                    <img className="ai-icon" src={aiIcon} alt="Ai icon"/>
                    {aiName && <span>{aiName}</span>}
                </div>
            )}

            <div className="bubble">
                {hasAttachments && (
                    <div className="message-attachments">
                        {images.length > 0 && (
                            <div className={`message-images${images.length > 1 ? " multiple" : ""}`}>
                                {images.map((image) => (
                                    <a
                                        key={image.url}
                                        href={image.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        title={image.name}
                                    >
                                        <img
                                            className="message-image"
                                            src={image.url}
                                            alt={image.name}
                                            // The image has no height until it has loaded, so the scroll that
                                            // runs when the message is added stops short. Scroll again now.
                                            onLoad={onImageLoad}
                                        />
                                    </a>
                                ))}
                            </div>
                        )}

                        {files.map((file) => (
                            <a
                                key={file.url}
                                className="file-chip message-file"
                                href={file.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                title={file.name}
                            >
                                <span className="file-chip-icon" aria-hidden="true">📄</span>
                                <span className="file-chip-name">{file.name}</span>
                            </a>
                        ))}
                    </div>
                )}

                <ReactMarkdown>
                    {message.text}
                </ReactMarkdown>

                <div className="message-footer-container">
                    {message.speaker === "ai" && (
                        <CopyButton text={message.text}/>
                    )}
                    <div className="date-display">
                        {message.time}
                    </div>
                </div>
                <Sources references={message.references}/>
            </div>
        </div>
    );

}

export default Message;