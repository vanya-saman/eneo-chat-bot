import ReactMarkdown from "react-markdown";
import CopyButton from "./CopyButton.jsx";
import aiIcon from "../assets/ai_icon.png"

function Message(props) {
    const message = props.message;
    const darkMode = props.darkMode;


    return (
        <div
            className={`message ${message.speaker}`}
        >
            {message.speaker === "ai" && (
                <img className="ai-icon" src={aiIcon} alt="Ai icon"/>
            )}

            <div className="bubble">
                <ReactMarkdown>
                    {message.text}
                </ReactMarkdown>

                <div className="message-footer-container">
                    {message.speaker === "ai" && (
                        <CopyButton text={message.text} darkMode={darkMode} />
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