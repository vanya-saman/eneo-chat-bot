const { getSession } = require("../sessions/sessionStore");

const apiKey = process.env.API_KEY;

const baseUrl = process.env.ENEO_API_BASE_URL;

const conversationsUrl = baseUrl + "/conversations/";

const filesUrl = baseUrl + "/files/";


const apiHeader = {
    "X-Api-Key": apiKey,
    "Accept": "application/json",
    "Content-Type": "application/json"
};


/**
 * Uploads a file to ENEO and returns its file ID.
 * Uses the global FormData/Blob in Node 18+ (same versions that have global fetch).
 *
 * @param {{buffer: Buffer, mimetype: string, originalname: string}} file - a multer file object
 * @returns {Promise<string>} the ENEO file ID
 */
async function uploadFile(file) {
    const formData = new FormData();
    formData.append(
        "upload_file",
        new Blob([file.buffer], { type: file.mimetype }),
        file.originalname || "upload"
    );

    // No Content-Type header: fetch sets multipart/form-data with the boundary itself.
    const response = await fetch(filesUrl, {
        method: "POST",
        headers: {
            "X-Api-Key": apiKey,
            "Accept": "application/json"
        },
        body: formData
    });

    if (!response.ok) {
        throw new Error(`ENEO file upload returned ${response.status}`);
    }

    const data = await response.json();

    if (!data?.id) {
        throw new Error("ENEO file upload response did not contain an id");
    }

    return data.id;
}


/**
 * @param {string} input
 * @param {string} assistantId
 * @param {{id: string}[]} files - e.g. [{ id: "3fa85f64-..." }]
 */
async function createSession(input, assistantId, files = []) {

    const response = await fetch(conversationsUrl, {
        method: "POST",
        headers: apiHeader,
        body: JSON.stringify({
            question: input,
            assistant_id: assistantId,
            files: files,
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
    const iconUrl = baseUrl + "/icons/" + iconId + "/";

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


/**
 * @param {string} input
 * @param {string} proxySessionId
 * @param {string} assistantId
 * @param {{id: string}[]} files - e.g. [{ id: "3fa85f64-..." }]
 */
async function sendMessage(input, proxySessionId, assistantId, files = []) {
    const eneoSessionId = getSession(proxySessionId);

    if (!eneoSessionId) {
        throw new Error("Kunde inte hitta session");
    }

    const messageUrl = baseUrl + "/assistants/" + assistantId + "/sessions/" + eneoSessionId;

    let fileId;
    if(files.length > 0) {
        fileId = [files[0].id];
    } else {
        fileId = []
    }

    const response = await fetch(messageUrl, {
        method: "POST",
        headers: apiHeader,
        body: JSON.stringify({
            question: input,
            session_id: eneoSessionId,
            files: fileId,
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
    const greetingUrl = baseUrl + "/assistants/" + assistantId + "/";

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
    sendMessage,
    uploadFile
};