import {useEffect, useRef, useState} from 'react'
import './App.css'
import {
    createMessageObject,
    fetchAssistant,
    getAssistantIcon,
    getMessageFromAi,
    removeSession
} from './chatbotapi.js'
import Message from "./components/Message.jsx";
import icon from "./assets/ai_icon.png"

function App() {
    const [aiIcon, setAiIcon] = useState(icon)
    const [messages, setMessages] = useState([]);
    const greetingLoaded = useRef(false);

    useEffect(() => {
        if (greetingLoaded.current) return;
        greetingLoaded.current = true;
        createNewSessionAndAddGreeting();
    }, []);

    function createNewSessionAndAddGreeting() {
        fetchAssistant().then(data => {
            const iconId = data.iconId;
            if(iconId){
                getAssistantIcon(iconId).then(icon => {
                    setAiIcon(icon);
                })
            }
            const greeting = data.greeting;
            setMessages((messages) => [...messages, createMessageObject("ai", greeting)]);
        })
    }


    // This section is for automatic scrolling down whenever a new message is created.

    const messagesEndRef = useRef(null);

    useEffect(() => {
        console.log("[App] Messages updated:", messages.length);

        messagesEndRef.current?.scrollIntoView({behavior: "smooth"});
    }, [messages]);

    // ------------------------------------------------------------------------------

    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    // ------------------------------------------------------------------------------

    async function sendMessage() {
        const text = input.trim();

        console.log("[Chat] sendMessage called");

        if (!text || isLoading) {
            console.log("[Chat] Message not sent:", {
                hasText: Boolean(text),
                isLoading
            });
            return;
        }

        console.log("[Chat] Sending message:", text);

        const userMessage = createMessageObject("user", text);

        setMessages((messages) => [...messages, userMessage]);
        setInput("");
        setIsLoading(true);

        try {
            console.log("[Chat] Waiting for AI response...");

            const aiResponse = await getMessageFromAi(text);

            console.log("[Chat] AI response received:", aiResponse);

            const aiMessage = createMessageObject("ai", aiResponse);

            setMessages((messages) => [...messages, aiMessage]);
        } catch (error) {
            console.error("[Chat] Failed to get AI response:", error);

            setMessages((messages) => [
                ...messages,
                createMessageObject("ai", "Kunde inte hämta svar."),
            ]);
        } finally {
            console.log("[Chat] Finished sending message");

            setIsLoading(false);
        }
    }

    function handleKeyDown(event) {
        if (event.key === "Enter") {
            console.log("[Input] Enter pressed");
            sendMessage();
        }
    }

    return (
        <main className="app">
            <section className="chat">

                <div className="messages">
                    {messages.length === 0 && (
                        <p><i>Laddar...</i></p>
                    )}
                    {messages.map((message) => (
                        <Message
                            key={message.id}
                            message={message}
                            aiIcon={aiIcon}
                        />
                    ))}

                    {isLoading && (
                        <div className="message ai">
                            <div className="bubble typing">
                                Tänker...
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef}/>
                </div>

                <div className="input-area">

                    <textarea
                        value={input}
                        placeholder="Ställ en fråga..."
                        onChange={(event) => setInput(event.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={isLoading}
                    />

                    <div className="input-actions">
                        <button
                            onClick={sendMessage}
                            disabled={!input.trim() || isLoading}
                        >
                            Skicka
                        </button>
                    </div>
                </div>
            </section>
        </main>
    );
}

export default App