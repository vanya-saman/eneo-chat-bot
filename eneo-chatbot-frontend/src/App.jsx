import {useEffect, useRef, useState} from 'react'
import './App.css'
import {createMessageObject, getAssistantGreeting, getMessageFromAi, removeSession} from './chatbotapi.js'
import Message from "./components/Message.jsx";

function App() {

    const [messages, setMessages] = useState([]);
    const greetingLoaded = useRef(false);

    useEffect(() => {
        if (greetingLoaded.current) return;

        greetingLoaded.current = true;
        createNewSessionAndAddGreeting();
    }, []);

    function createNewSessionAndAddGreeting(){
        getAssistantGreeting().then(greeting => {
            setMessages((messages) => [...messages, createMessageObject("ai",greeting)]);
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

    // Dark mode settings ----------------------------------------------------

    const [darkMode, setDarkMode] = useState(() => {
        const savedTheme = localStorage.getItem("theme");
        console.log("[Theme] Saved theme:", savedTheme);

        return savedTheme === "dark";
    });

    useEffect(() => {
        const theme = darkMode ? "dark" : "light";

        console.log("[Theme] Changing theme to:", theme);

        document.documentElement.dataset.theme = theme;
        localStorage.setItem("theme", theme);
    }, [darkMode]);

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
                <header className="chat-header">

                    <button className="button"
                        onClick={() => {
                            setMessages([])
                            removeSession();
                            greetingLoaded.current = false;
                            createNewSessionAndAddGreeting()
                        }}>
                        Ny chatt
                    </button>

                    <button
                        className="button"
                        onClick={() => {
                            console.log("[Theme] Toggle clicked. New value:", !darkMode);
                            setDarkMode(!darkMode);
                        }}
                    >
                        {darkMode ? "Ljust läge" : "Mörkt läge"}
                    </button>


                    <div>
                        <h1>Eneo Chatbot</h1>
                    </div>
                </header>

                <div className="messages">
                    {messages.length === 0 && (
                        <p><i>Laddar...</i></p>
                    )}
                    {messages.map((message) => (
                        <Message
                            key={message.id}
                            message={message}
                            darkMode={darkMode}>
                        </Message>
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