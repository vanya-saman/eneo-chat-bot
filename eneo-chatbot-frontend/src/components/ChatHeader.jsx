import herrljungaIcon from "../assets/herrljunga.png";
import closeButton from "../assets/x-button.png";
import minimizeButton from "../assets/v-button.png";

function ChatHeader() {
    return (
        <header className="chat-header">
            <div className="header-container">
                <div className="header-title">
                    <img src={herrljungaIcon} alt="herrljunga"/>
                    <h1>Herrljunga Chatt</h1>
                </div>
                <div className="header-buttons">
                    <img src={minimizeButton} alt="Minimera"/>
                    <img src={closeButton} alt="Stäng"/>
                </div>
            </div>
        </header>
    );
}

export default ChatHeader;
