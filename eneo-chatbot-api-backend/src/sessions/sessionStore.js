const sessions = new Map();

function createSession(sessionId, enosSessionId) {
    sessions.set(sessionId, enosSessionId);
}

function getSession(sessionId) {
    return sessions.get(sessionId);
}

module.exports = {
    createSession,
    getSession,
};