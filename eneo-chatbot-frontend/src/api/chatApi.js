const BASE_URL = "/api/chat";

// Session id for the current chat. Lives here (rather than in component
// state) because it's plumbing for the API layer, not UI state.
let sessionId = null;

async function request(url, options = {}) {
    const resp = await fetch(url, {
        ...options,
        headers: {
            Accept: "application/json",
            ...(options.body ? {"Content-Type": "application/json"} : {}),
            ...options.headers,
        },
    });

    if (!resp.ok) {
        throw new Error(`Request to ${url} failed with status ${resp.status}`);
    }

    return resp.json();
}

export async function getAssistantGreeting() {
    const data = await request(`${BASE_URL}/greeting/`);
    return data?.greeting;
}

/**
 * Sends a message to the assistant, creating a new session first if one
 * doesn't exist yet.
 * @param {string} message
 * @returns {Promise<string>} the assistant's reply text
 */
export async function sendChatMessage(message) {
    return sessionId
        ? sendToExistingSession(message)
        : createSession(message);
}

export function resetSession() {
    sessionId = null;
}

async function sendToExistingSession(message) {
    const data = await request(`${BASE_URL}/${sessionId}/message/`, {
        method: "POST",
        body: JSON.stringify({message}),
    });

    return data.response;
}

async function createSession(message) {
    const data = await request(`${BASE_URL}/session/`, {
        method: "POST",
        body: JSON.stringify({message}),
    });

    sessionId = data.sessionId;
    return data.response;
}
