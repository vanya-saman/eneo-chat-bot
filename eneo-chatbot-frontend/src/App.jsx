import {useEffect, useRef, useState} from 'react'
import './App.css'
import {
    createMessageObject,
    fetchAssistant,
    getAssistantIcon,
    getMessageFromAi,
    UploadError
} from './chatbotapi.js'
import Message from "./components/Message.jsx";
import icon from "./assets/ai_icon.png"
import {ACCEPTED_IMAGE_TYPES, useFileUpload} from "./fileUpload.js";

function App() {
    const [aiIcon, setAiIcon] = useState(icon)
    const [messages, setMessages] = useState([]);
    const [aiName, setAiName] = useState(null);
    const greetingLoaded = useRef(false);

    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const {
        file,
        previewUrl,
        error: uploadError,
        isDragging,
        selectFile,
        clearFile
    } = useFileUpload();
    const fileInputRef = useRef(null);

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
            setMessages((messages) => [...messages, createMessageObject("ai", greeting, null)]);
        }).catch(error => {
            console.log(error);
            setAiName("Chatbot")
            setMessages((messages) => [...messages, createMessageObject("ai", "Kunde inte kontakta AI. Testa att ladda om sidan.", null)])
        });
    }

    // ------------------------------------------------------------------------------

    async function sendMessage() {
        const text = input.trim();
        const attachedFile = file;

        if ((!text && !attachedFile) || isLoading) {
            console.log("[Chat] Message not sent:", {
                hasText: Boolean(text),
                hasFile: Boolean(attachedFile),
                isLoading
            });
            return;
        }

        console.log("[Chat] Sending message:", text);

        const userMessage = createMessageObject("user", text, attachedFile);

        setMessages((messages) => [...messages, userMessage]);
        setInput("");
        clearFile();
        setIsLoading(true);

        try {
            const aiResponse = await getMessageFromAi(text, attachedFile);

            const aiMessage = createMessageObject("ai", aiResponse, null);
            setMessages((messages) => [...messages, aiMessage]);
            console.log("[Chat] AI response received:", aiResponse);

        } catch (error) {
            console.error("[Chat] Failed to get AI response:", error);

            const errorText = error instanceof UploadError
                ? "Kunde inte ladda upp bilden. Försök igen."
                : "Kunde inte hämta svar.";

            setMessages((messages) => [
                ...messages,
                createMessageObject("ai", errorText, null),
            ]);
        } finally {
            setIsLoading(false);
        }
    }

    function handleKeyDown(event) {
        if (event.key === "Enter") {
            event.preventDefault();
            sendMessage();
        }
    }

    function handleFileInputChange(event) {
        selectFile(event.target.files?.[0]);
        // Reset so picking the same file again still fires onChange.
        event.target.value = "";
    }

    const messagesRef = useRef(null);

    function scrollToBottom() {
        const el = messagesRef.current;
        if (!el) return;
        el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    return (
        <main className="app">
            <section className={`chat${isDragging ? " dragging" : ""}`}>

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
                            image={message.image}
                            onImageLoad={scrollToBottom}
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

                    {uploadError && (
                        <p className="upload-error" role="alert">{uploadError}</p>
                    )}

                    <div className="input-actions">
                        <div className="input-actions-container">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept={ACCEPTED_IMAGE_TYPES.join(",")}
                                onChange={handleFileInputChange}
                                hidden
                            />
                            {previewUrl && (
                                <div className="attachment-preview">
                                    <img className="embedded-image" src={previewUrl} alt={file?.name ?? "Bifogad bild"}/>
                                    <button
                                        type="button"
                                        className="remove-attachment"
                                        onClick={clearFile}
                                        aria-label="Ta bort bild"
                                    >
                                        ×
                                    </button>
                                </div>
                            )}
                            <button
                                type="button"
                                className="attach-button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isLoading}
                            >
                                Bifoga bild
                            </button>



                            <button
                                onClick={sendMessage}
                                disabled={(!input.trim() && !file) || isLoading}
                            >
                                Skicka
                            </button>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}

export default App