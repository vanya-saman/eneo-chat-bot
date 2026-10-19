import ReactMarkdown from "react-markdown";
import CopyButton from "./CopyButton.jsx";


function Message(props) {
    const message = props.message;
    const aiIcon = props.aiIcon;
    const aiName = props.aiName;
    const image = props.image;
    const onImageLoad = props.onImageLoad;


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
                {image && (
                    <img
                        className="message-image"
                        src={image}
                        alt="Message image"
                        // The image has no height until it has loaded, so the scroll that
                        // runs when the message is added stops short. Scroll again now.
                        onLoad={onImageLoad}
                    />
                )}
                {message.file && (
                    <a
                        className="file-chip message-file"
                        href={message.file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={message.file.name}
                    >
                        <span className="file-chip-icon" aria-hidden="true">📄</span>
                        <span className="file-chip-name">{message.file.name}</span>
                    </a>
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
            </div>
        </div>
    );

}

export default Message;