import {useEffect, useRef} from "react";
import Message from "./Message.jsx";

function MessageList({messages, isLoading}) {
    const messagesEndRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({behavior: "smooth"});
    }, [messages, isLoading]);

    return (
        <div className="messages">
            {messages.length === 0 && (
                <p><i>Laddar...</i></p>
            )}

            {messages.map((message) => (
                <Message key={message.id} message={message}/>
            ))}

            {isLoading && (
                <div className="message ai">
                    <div className="bubble typing">Tänker...</div>
                </div>
            )}

            <div ref={messagesEndRef}/>
        </div>
    );
}

export default MessageList;
