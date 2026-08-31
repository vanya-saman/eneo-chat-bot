import ReactMarkdown from "react-markdown";
import CopyButton from "./CopyButton.jsx";
import aiIcon from "../assets/ai_icon.png";

function Message({message}) {
    const isAi = message.speaker === "ai";

    return (
        <div className={`message ${message.speaker}`}>
            {isAi && (
                <img className="ai-icon" src={aiIcon} alt="Ai icon"/>
            )}

            <div className="bubble">
                <ReactMarkdown>
                    {message.text}
                </ReactMarkdown>

                <div className="message-footer-container">
                    {isAi && <CopyButton text={message.text}/>}
                    <div className="date-display">
                        {message.time}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Message;
