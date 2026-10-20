import icon from "../assets/ai_icon.png";
import {useEffect, useRef, useState} from 'react'
import {createMessageObject, fetchAssistant, getAssistantIcon, getMessageFromAi, UploadError} from "../chatbotapi.js";

export function useChat(clearFiles, isProcessing, files, addFiles){

    const [aiIcon, setAiIcon] = useState(icon)
    const [messages, setMessages] = useState([]);
    const [aiName, setAiName] = useState(null);
    const greetingLoaded = useRef(false);

    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);


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

            const aiMessage = createMessageObject("ai", aiResponse.text, [], aiResponse.references);
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


    return {
        sendMessage,
        messagesRef,
        messages,
        scrollToBottom,
        isLoading,
        setInput,
        handleFileInputChange,
        aiIcon,
        aiName,
        input
    };
}