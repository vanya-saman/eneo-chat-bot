/** Maps proxy session IDs (sent to the frontend) to ENEO session IDs. In-memory only. */
const sessions = new Map();

/** Links a proxy session ID to an ENEO session ID. */
function createSession(sessionId, eneoSessionId) {
    sessions.set(sessionId, eneoSessionId);
}

/** Returns the ENEO session ID for a proxy session ID, or undefined. */
function getSession(sessionId) {
    return sessions.get(sessionId);
}

module.exports = {
    createSession,
    getSession,
};