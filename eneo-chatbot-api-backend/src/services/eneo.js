const { getSession } = require("../sessions/sessionStore");

const apiKey = process.env.API_KEY;



const conversationsUrl =
    process.env.ENEO_API_BASE_URL +
    "/conversations/";



const apiHeader = {
    "X-Api-Key": apiKey,
    "Accept": "application/json",
    "Content-Type": "application/json"
};


async function createSession(input, assistantId) {

    const response = await fetch(conversationsUrl, {
        method: "POST",
        headers: apiHeader,
        body: JSON.stringify({
            question: input,
            assistant_id: assistantId,
            files: [],
            stream: false,
            use_web_search: false,
            require_tool_approval: false
        })
    });

    if (!response.ok) {
        throw new Error("Kunde ej kontakta AI");
    }

    return response.json();
}


async function fetchAssistantIcon(iconId) {
    const iconUrl =
        process.env.ENEO_API_BASE_URL +
        "/icons/" +
        iconId +
        "/";

    console.log(`Fetching ${iconUrl}`);

    const response = await fetch(iconUrl, {
        headers: {
            "X-Api-Key": apiKey,
            "Accept": "image/png"
        }
    });

    if (!response.ok) {
        throw new Error(`Kunde inte hämta ikon: ${response.status}`);
    }

    return response;
}


async function sendMessage(input, proxySessionId, assistantId) {
    const messageUrl =
        process.env.ENEO_API_BASE_URL +
        "/assistants/" +
        assistantId +
        "/";

    const eneoSessionId = getSession(proxySessionId);

    if (!eneoSessionId) {
        throw new Error("Kunde inte hitta session");
    }

    const response = await fetch(messageUrl + "/sessions/" + eneoSessionId, {
        method: "POST",
        headers: apiHeader,
        body: JSON.stringify({
            question: input,
            session_id: eneoSessionId,
            files: [],
            stream: false,
            tools: {
                assistants: []
            }
        })
    });

    if (!response.ok) {

        throw new Error(
            `ENEO returned ${response.status}`
        );
    }

    return response.json();
}

async function fetchAssistantGreeting(assistantId) {
    const greetingUrl =
        process.env.ENEO_API_BASE_URL +
        "/assistants/" +
        assistantId + "/"
    ;

    const resp = await fetch(greetingUrl, {
        headers: {
            "X-Api-Key": apiKey,
            "Accept": "application/json"
        }
    })
    return resp.json()
}


module.exports = {
    fetchAssistantGreeting,
    fetchAssistantIcon,
    createSession,
    sendMessage

};
