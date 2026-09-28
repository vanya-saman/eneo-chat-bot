import ReactMarkdown from "react-markdown";
import CopyButton from "./CopyButton.jsx";


function Message(props) {
    const message = props.message;
    const aiIcon = props.aiIcon;
    const aiName = props.aiName;


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