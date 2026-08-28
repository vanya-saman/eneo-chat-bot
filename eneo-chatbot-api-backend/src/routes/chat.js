const express = require("express");
const crypto = require("crypto");

const {
    fetchAssistantGreeting,
    createSession,
    sendMessage
} = require("../services/eneo");

const {
    createSession: storeSession,
    getSession
} = require("../sessions/sessionStore");

const router = express.Router();


router.get("/greeting", async (req, res) => {
    try {
        console.log("Kontaktar API")

        const eneoResponse = await fetchAssistantGreeting();

        console.log("Hämtade data")

        const greeting =
            eneoResponse?.description ??
            "Hej! Vad kan jag hjälpa dig med idag?";

        return res.json({
            greeting: greeting
        })

    } catch (error) {
        console.error(error);

        return res.status(502).json({
            error: "Kunde inte hämta feature"
        });
    }
});

router.post("/session", async (req, res) => {

    try {

        const {message} = req.body || {};

        if (!message) {
            return res.status(400).json({
                error: "Meddelande saknas"
            });
        }

        // Första meddelandet skapar samtidigt ENEO-sessionen
        console.log("Kontaktar api")
        const eneoResponse = await createSession(message);
        console.log("klar")

        /*
         * Här måste vi använda det faktiska fältet
         * som ENEO returnerar som session/conversation ID.
         *
         * Exempel:
         * eneoResponse.id
         */
        const eneoSessionId = eneoResponse.session_id;

        // Vårt eget ID som frontend får känna till
        const proxySessionId = "raccoon-" + generateRandomUUID();

        // Spara kopplingen
        storeSession(
            proxySessionId,
            eneoSessionId
        );

        // Returnera INTE ENEO-ID:t
        return res.json({
            sessionId: proxySessionId,
            response: eneoResponse.answer
        });

    } catch (error) {

        console.error(error);

        return res.status(502).json({
            error: "Kunde inte skapa chat-session"
        });
    }
});

router.post("/:sessionId/message", async (req, res) => {

    try {

        const {sessionId} = req.params;
        const {message} = req.body;

        if (!message) {
            return res.status(400).json({
                error: "Meddelande saknas"
            });
        }

        const session = getSession(sessionId);

        if (!session) {
            return res.status(404).json({
                error: "Chat-session hittades inte"
            });
        }

        const eneoResponse = await sendMessage(
            message,
            sessionId
        );

        return res.json({
            response: eneoResponse.answer
        });

    } catch (error) {

        console.error(error);

        return res.status(502).json({
            error: "Kunde inte skicka meddelandet"
        });
    }
});

function generateRandomUUID(){
    if (crypto.randomUUID){
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
module.exports = router;