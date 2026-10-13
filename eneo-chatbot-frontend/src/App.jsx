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
    const [aiName, setAiName] = useState(null);
    const greetingLoaded = useRef(false);

    useEffect(() => {
        if (greetingLoaded.current) return;
        greetingLoaded.current = true;
        createNewSessionAndAddGreeting();
    }, []);

    function createNewSessionAndAddGreeting() {
        fetchAssistant().then(data => {
            setAiName(data.aiName ? data.aiName : "Chatbot")
            if(data.iconId){
                getAssistantIcon(data.iconId).then(icon => {
                    setAiIcon(icon);
                })
            }
            const greeting = data.greeting;
            setMessages((messages) => [...messages, createMessageObject("ai", greeting)]);
        }).catch(error => {
            console.log(error);
            setAiName("Chatbot")
            setMessages((messages) => [...messages, createMessageObject("ai", "Kunde inte kontakta AI. Testa att ladda om sidan.")])
        });
    }

    // ------------------------------------------------------------------------------

    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    // ------------------------------------------------------------------------------

    async function sendMessage() {
        if(isLoading){
            return;
        }

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

            const aiMessage = createMessageObject("ai", aiResponse);
            setMessages((messages) => [...messages, aiMessage]);
            console.log("[Chat] AI response received:", aiResponse);

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
            event.preventDefault();
            console.log("[Input] Enter pressed");
            sendMessage();
        }
    }

    const messagesRef = useRef(null);

    useEffect(() => {
        const el = messagesRef.current;
        if (!el) return;
        el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }, [messages, isLoading]);

    return (
        <main className="app">
            <section className="chat">

                <div className="messages" ref={messagesRef}>
                    {messages.length === 0 && (
                        <p><i>Laddar...</i></p>
                    )}
                    {messages.map((message) => (
                        <Message
                            key={message.id}
                            message={message}
                            aiIcon={aiIcon}
                            aiName={aiName}
                        />
                    ))}

                    {isLoading && (
                        <div className="message ai">
                            <div className="bubble typing">
                                Tänker...
                            </div>
                        </div>
                    )}

                    <div/>
                </div>

                <div className="input-area">

                    <textarea
                        value={input}
                        placeholder="Ställ en fråga..."
                        onChange={(event) => setInput(event.target.value)}
                        onKeyDown={handleKeyDown}
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