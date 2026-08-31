import {useEffect, useRef, useState} from "react";
import {getAssistantGreeting, sendChatMessage} from "../api/chatApi.js";
import {createMessageObject} from "../utils/message.js";

const ERROR_REPLY = "Kunde inte hämta svar.";

export function useChat() {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const greetingLoaded = useRef(false);

    useEffect(() => {
        if (greetingLoaded.current) return;
        greetingLoaded.current = true;

        getAssistantGreeting().then((greeting) => {
            setMessages((prev) => [...prev, createMessageObject("ai", greeting)]);
        });
    }, []);

    async function sendMessage() {
        const text = input.trim();
        if (!text || isLoading) return;

        setMessages((prev) => [...prev, createMessageObject("user", text)]);
        setInput("");
        setIsLoading(true);

        try {
            const reply = await sendChatMessage(text);
            setMessages((prev) => [...prev, createMessageObject("ai", reply)]);
        } catch (error) {
            console.error("Failed to get AI response:", error);
            setMessages((prev) => [...prev, createMessageObject("ai", ERROR_REPLY)]);
        } finally {
            setIsLoading(false);
        }
    }

    return {messages, input, setInput, isLoading, sendMessage};
}
