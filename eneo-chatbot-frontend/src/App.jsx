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
import {ACCEPT_ATTRIBUTE, MAX_FILES, useFileUpload} from "./fileUpload.js";

function App() {
    const [aiIcon, setAiIcon] = useState(icon)
    const [messages, setMessages] = useState([]);
    const [aiName, setAiName] = useState(null);
    const greetingLoaded = useRef(false);

    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const {
        attachments,
        files,
        canAddMore,
        isProcessing,
        error: uploadError,
        isDragging,
        addFiles,
        removeFile,
        clearFiles
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
            setMessages((messages) => [...messages, createMessageObject("ai", greeting)]);
        }).catch(error => {
            console.log(error);
            setAiName("Chatbot")
            setMessages((messages) => [...messages, createMessageObject("ai", "Kunde inte kontakta AI. Testa att ladda om sidan.")])
        });
    }

    // ------------------------------------------------------------------------------

    async function sendMessage() {
        const text = input.trim();
        const attachedFiles = files;

        // Wait for images to finish compressing, so none are left out of the message.
        if ((!text && attachedFiles.length === 0) || isLoading || isProcessing) {
            console.log("[Chat] Message not sent:", {
                hasText: Boolean(text),
                fileCount: attachedFiles.length,
                isLoading,
                isProcessing
            });
            return;
        }

        console.log("[Chat] Sending message:", text);

        const userMessage = createMessageObject("user", text, attachedFiles);

        setMessages((messages) => [...messages, userMessage]);
        setInput("");
        clearFiles();
        setIsLoading(true);

        try {
            const aiResponse = await getMessageFromAi(text, attachedFiles);

            const aiMessage = createMessageObject("ai", aiResponse);
            setMessages((messages) => [...messages, aiMessage]);
            console.log("[Chat] AI response received:", aiResponse);

        } catch (error) {
            console.error("[Chat] Failed to get AI response:", error);

            const errorText = error instanceof UploadError
                ? (attachedFiles.length > 1
                    ? "Kunde inte ladda upp filerna. Försök igen."
                    : "Kunde inte ladda upp filen. Försök igen.")
                : "Kunde inte hämta svar.";

            setMessages((messages) => [
                ...messages,
                createMessageObject("ai", errorText),
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
        addFiles(event.target.files);
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

                    {attachments.length > 0 && (
                        <div className="attachment-list">
                            {attachments.map(({id, file, previewUrl}) => (
                                <div className="attachment-preview" key={id}>
                                    {previewUrl ? (
                                        <img className="embedded-image" src={previewUrl} alt={file.name} title={file.name}/>
                                    ) : (
                                        <span className="file-chip" title={file.name}>
                                            <span className="file-chip-icon" aria-hidden="true">📄</span>
                                            <span className="file-chip-name">{file.name}</span>
                                        </span>
                                    )}
                                    <button
                                        type="button"
                                        className="remove-attachment"
                                        onClick={() => removeFile(id)}
                                        aria-label={`Ta bort ${file.name}`}
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {uploadError && (
                        <p className="upload-error" role="alert">{uploadError}</p>
                    )}

                    <div className="input-actions">
                        <div className="input-actions-container">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept={ACCEPT_ATTRIBUTE}
                                onChange={handleFileInputChange}
                                multiple
                                hidden
                            />
                            {isProcessing ? (
                                <span className="attachment-count" role="status">
                                    Förbereder bild…
                                </span>
                            ) : attachments.length > 0 && (
                                <span className="attachment-count">
                                    {attachments.length}/{MAX_FILES} filer
                                </span>
                            )}
                            <button
                                type="button"
                                className="attach-button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isLoading || !canAddMore}
                                title={canAddMore ? undefined : `Högst ${MAX_FILES} filer per meddelande`}
                            >
                                Bifoga fil
                            </button>

                            <button
                                onClick={sendMessage}
                                disabled={(!input.trim() && files.length === 0) || isLoading || isProcessing}
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