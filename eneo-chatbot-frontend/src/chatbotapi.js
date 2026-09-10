const baseUrl = "/eneo-chat-bot/api/chat"

let sessionId = null;

export async function getAssistantGreeting() {

    const resp = await fetch(baseUrl + "/greeting/", {
        method: "GET",
        headers: {
            "Accept": "application/json"
        }
    })

    const data = await resp.json();
    return data?.greeting;
}

export async function getMessageFromAi(input) {
    console.log("[API] getMessageFromAi called", {
        hasSession: Boolean(sessionId),
        inputLength: input?.length,
    });

    return sessionId
        ? getMessage(input)
        : createNewSession(input);
}

export function removeSession() {
    sessionId = null;
}

async function getMessage(input) {
    console.log("[API] Session exists. Sending message to existing session.", {
        sessionId,
    });


    if (!sessionId) {
        console.error("[API] Session ID is missing!");
        throw new Error("Could not find session!");
    }

    const url = `${baseUrl}/${sessionId}/message/`;

    console.log("[API] POST existing session", {
        url,
        sessionId

    });

    const resp = await fetch(url, {
            method: 'POST',
            headers: {
                "Accept": "application/json",
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: input
            })
        }



)
;

console.log("[API] Existing session response", {
    status: resp.status,
    ok: resp.ok,
});

if (!resp.ok) {
    console.error("[API] Failed to fetch message", {
        status: resp.status,
        statusText: resp.statusText,
    });

    alert("Kunde inte hämta meddelande");
    throw new Error("Could not fetch message");
}

const data = await resp.json();

console.log("[API] AI response received", {
    hasAnswer: Boolean(data.response),
    answerLength: data.response?.length,
});

return data.response;
}

async function createNewSession(input) {
    console.log("[API] No session exists. Creating new session.");

    const url = `${baseUrl}/session/`;

    console.log("[API] POST create session", {
        url,
        inputLength: input?.length,
    });

    const resp = await fetch(url, {
        method: "POST",
        headers: {
            "Accept": "application/json",
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(
            {
                "message": input
            }
        )
    });

    console.log("[API] Create session response", {
        status: resp.status,
        ok: resp.ok,
    });

    if (!resp.ok) {
        console.error("[API] Failed to create session", {
            status: resp.status,
            statusText: resp.statusText,
        });

        alert("Kunde inte hämta meddelande");
        throw new Error("Could not fetch message");
    }

    const data = await resp.json();

    console.log("[API] New session created", {
        sessionId: data.sessionId,
        hasResponse: Boolean(data.response),
        responseLength: data.response?.length,
    });

    sessionId = data.sessionId;

    console.log("[API] sessionId stored:", sessionId);

    return data.response;
}


export function createMessageObject(speaker, text) {

    const message = {
        id: generateRandomUUID(),
        speaker: speaker,
        text: text,
        time: parseTime(new Date())
    };

    console.log("[Message] Created message", {
        id: message.id,
        speaker,
        textLength: text?.length,
        time: message.time,
    });

    return message;
}

function generateRandomUUID() {
    if (crypto.randomUUID) {
        console.log("[Generating random UUID]");
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

    const formattedTime = `${hours}:${minutes} ${day}-${month}-${year}`;

    console.log("[Time] Parsed time:", formattedTime);

    return formattedTime;
}


/**
 * Appends a leading 0 to time units that are only 1 character long.
 * @param {number} time
 */
function formatTime(time) {

    if (time.toString().length === 1) {
        return `0${time}`;
    } else {
        return time.toString();
    }
}
