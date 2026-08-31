import "../App.css";
import {useChat} from "../hooks/useChat.js";
import ChatHeader from "./ChatHeader.jsx";
import MessageList from "./MessageList.jsx";
import MessageInput from "./MessageInput.jsx";

function ChatBox() {
    const {messages, input, setInput, isLoading, sendMessage} = useChat();

    return (
        <main className="app">
            <section className="chat">
                <ChatHeader/>
                <MessageList
                    messages={messages}
                    isLoading={isLoading}
                />
                <MessageInput
                    value={input}
                    onChange={setInput}
                    onSend={sendMessage}
                    disabled={isLoading}
                />
            </section>
        </main>
    );
}

export default ChatBox;
