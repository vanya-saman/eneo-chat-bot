let sessionId = null;
const params = new URLSearchParams(window.location.search);
const assistantId = params.get("assistant_id") ?? null;
const baseUrl = params.get("server") === "false" ? "http://localhost:3001/api/chat" : "/eneo-chat-bot/api/chat"

import icon from "./assets/ai_icon.png"

/** Thrown when the backend reports that the image upload failed, so the UI can show a specific message. */
export class UploadError extends Error {
    constructor(message) {
        super(message);
        this.name = "UploadError";
    }
}

export async function fetchAssistant() {

    if(!assistantId){
        return {
            greeting: "Ingen assistent vald."
        }
    }

    const resp = await fetch(baseUrl + "/greeting/", {
        method: 'POST',
        headers: {
            "Accept": "application/json",
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            "assistant_id": assistantId
        }),
        signal: AbortSignal.timeout(10000)
    })
    if (!resp.ok) {
        throw new Error("[ERROR] Response is not OK");
    }
    const data = await resp.json();
    return {
        greeting: data?.greeting,
        iconId: data?.ai_icon_id,
        aiName: data?.ai_name,
    };
}

export async function getAssistantIcon(iconId) {
    if (!iconId) {
        return icon;
    }
    const resp = await fetch(`${baseUrl}/icon/${iconId}`)

    if (!resp.ok) {
        return icon;
    }
    const blob = await resp.blob();
    return URL.createObjectURL(blob);
}

/**
 * Sends a message (and optionally an image) to the AI.
 * The first message creates a session; later messages reuse it.
 * The backend handles uploading the image to ENEO.
 *
 * @param {string} input
 * @param {File|null} file
 * @returns {Promise<string>} the AI's answer
 */
export async function getMessageFromAi(input, file = null) {
    if(!assistantId){
        throw Error("No assistant id for AI.")
    }

    console.log("[API] getMessageFromAi called", {
        hasSession: Boolean(sessionId),
        inputLength: input?.length,
        hasFile: Boolean(file),
    });

    if (!sessionId) {
        const data = await postMessage(`${baseUrl}/session`, input, file);
        sessionId = data.sessionId;
        console.log("[API] New session created", {sessionId});
        return data.response;
    }

    const data = await postMessage(`${baseUrl}/${sessionId}/message/`, input, file);
    return data.response;
}

/**
 * Posts the message as multipart/form-data so the image can travel in the same request.
 * Content-Type is not set manually: the browser adds it together with the multipart boundary.
 */
async function postMessage(url, input, file) {
    const formData = new FormData();
    formData.append("message", input ?? "");
    formData.append("assistant_id", assistantId);
    if (file) {
        formData.append("file", file);
    }

    const resp = await fetch(url, {
        method: "POST",
        headers: {
            "Accept": "application/json"
        },
        body: formData
    });

    console.log("[API] Response", {url, status: resp.status, ok: resp.ok});

    if (!resp.ok) {
        const data = await resp.json().catch(() => null);
        if (data?.code === "UPLOAD_FAILED") {
            throw new UploadError(data.error ?? "Upload failed");
        }
        throw new Error(data?.error ?? `Request failed (${resp.status})`);
    }

    return resp.json();
}


export function createMessageObject(speaker, text, file) {
    let url;
    if(file){
        // Separate URL from the input preview, so clearing the preview doesn't break the chat history.
        url = URL.createObjectURL(file);
    }

    const message = {
        id: generateRandomUUID(),
        speaker: speaker,
        text: text,
        time: parseTime(new Date()),
        image: url ?? null
    };

    console.log("[Message] Created message", {
        id: message.id,
        speaker,
        textLength: text?.length,
        hasImage: Boolean(url),
        time: message.time,
    });

    return message;
}

function generateRandomUUID() {
    if (crypto.randomUUID) {
        return crypto.randomUUID()
    } else {
        console.log("crypto.randomUUID not available. Using fallback");
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
}

function parseTime(time) {
    const hours = formatTime(time.getHours());
    const minutes = formatTime(time.getMinutes());
    const day = formatTime(time.getDate());
    const month = formatTime(time.getMonth() + 1);
    const year = time.getFullYear();

    return `${hours}:${minutes} ${day}-${month}-${year}`;
}


/**
 * Appends a leading 0 to time units that are only 1 character long.
 * @param {number} time
 */
function formatTime(time) {
    return time.toString().padStart(2, "0");
}