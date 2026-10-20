const express = require("express");
const crypto = require("crypto");
const multer = require("multer");

const {
    fetchAssistantGreeting,
    fetchAssistantIcon,
    createSession,
    sendMessage,
    uploadFile
} = require("../services/eneo");

const {
    createSession: storeSession,
    getSession
} = require("../sessions/sessionStore");
const {removeRefs, getInrefContents} = require("../utils/referencesParser");



const router = express.Router();


// ---------- File upload handling ----------

/**
 * Accepted file types and their extensions. Keep in sync with the frontend (useFileUpload.js).
 * Extensions are checked too, because browsers often send .md/.csv files with an empty
 * or generic MIME type (e.g. application/octet-stream).
 */
const ACCEPTED_FILE_TYPES = {
    "image/png": [".png"],
    "image/jpeg": [".jpg", ".jpeg"],
    "image/gif": [".gif"],
    "image/webp": [".webp"],
    "application/pdf": [".pdf"],
    "text/plain": [".txt"],
    "text/markdown": [".md"],
    "text/csv": [".csv"],
};
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB per file, same limit as the frontend
const MAX_FILES = 5; // files per message, same limit as the frontend

/** Error codes the frontend recognises (it turns UPLOAD_FAILED into its UploadError). */
const UPLOAD_FAILED = "UPLOAD_FAILED";

class UploadFailedError extends Error {}

function getExtension(name) {
    const dot = name?.lastIndexOf(".") ?? -1;
    return dot >= 0 ? name.slice(dot).toLowerCase() : "";
}

/**
 * Returns the MIME type to use for the file, or null if the file type isn't accepted.
 * A known MIME type wins; otherwise it is looked up from the extension.
 */
function resolveMimeType(file) {
    if (file.mimetype in ACCEPTED_FILE_TYPES) {
        return file.mimetype;
    }
    const extension = getExtension(file.originalname);
    const match = Object.entries(ACCEPTED_FILE_TYPES)
        .find(([, extensions]) => extensions.includes(extension));
    return match ? match[0] : null;
}

// Files are kept in memory only long enough to forward them to ENEO.
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: MAX_FILE_SIZE,
        files: MAX_FILES
    },
    fileFilter(req, file, cb) {
        const mimeType = resolveMimeType(file);
        if (!mimeType) {
            return cb(new UploadFailedError(
                "Endast bilder (PNG, JPEG, GIF, WebP), PDF och textfiler (TXT, MD, CSV) kan bifogas."
            ));
        }
        // Normalise so ENEO gets a proper type even if the browser sent a generic one.
        file.mimetype = mimeType;
        cb(null, true);
    }
});

/**
 * Parses up to MAX_FILES files from the "files" field of multipart/form-data into req.files.
 * JSON requests pass straight through (multer ignores them), so old clients keep working.
 */
function acceptOptionalFiles(req, res, next) {
    upload.array("files", MAX_FILES)(req, res, (error) => {
        if (!error) {
            return next();
        }

        let message;
        if (error.code === "LIMIT_FILE_SIZE") {
            message = `En av filerna är för stor (max ${MAX_FILE_SIZE / 1024 / 1024} MB per fil).`;
        } else if (error.code === "LIMIT_FILE_COUNT" || error.code === "LIMIT_UNEXPECTED_FILE") {
            message = `Du kan bifoga högst ${MAX_FILES} filer per meddelande.`;
        } else if (error instanceof UploadFailedError) {
            message = error.message;
        } else {
            message = "Kunde inte läsa de bifogade filerna.";
        }

        return res.status(400).json({
            error: message,
            code: UPLOAD_FAILED
        });
    });
}

/**
 * Uploads the attached files (if any) to ENEO in parallel and returns the "files" array ENEO expects.
 * If any upload fails, the whole message fails, so the AI never answers with files missing.
 * @param {object[]} files - multer file objects (req.files)
 * @returns {Promise<{id: string}[]>}
 */
async function uploadAttachedFiles(files = []) {
    if (files.length === 0) {
        return [];
    }

    if (files.some(file => file.size === 0)) {
        throw new UploadFailedError("En av filerna är tom.");
    }

    try {
        const fileIds = await Promise.all(files.map(file => uploadFile(file)));
        console.log("Uppladdade filer till ENEO:", fileIds);
        return fileIds.map(id => ({ id }));
    } catch (error) {
        console.error(error);
        throw new UploadFailedError(
            files.length > 1 ? "Kunde inte ladda upp filerna." : "Kunde inte ladda upp filen."
        );
    }
}

function sendUploadError(res, error) {
    return res.status(502).json({
        error: error.message,
        code: UPLOAD_FAILED
    });
}


// ---------- Routes ----------

router.post("/greeting", async (req, res) => {
    try {
        const assistantId = req.body.assistant_id || null;
        const eneoResponse = await fetchAssistantGreeting(assistantId);

        return res.json({
            greeting: eneoResponse?.description ?? "Hej! Vad kan jag hjälpa dig med idag?",
            ai_icon_id: eneoResponse?.icon_id ?? null,
            ai_name: eneoResponse?.name ?? null
        })

    } catch (error) {
        console.error(error);

        return res.status(502).json({
            error: "Kunde inte hämta assistant"
        });
    }
});

router.get("/icon/:iconId", async (req, res) => {
    try {
        const { iconId } = req.params;

        const iconResponse = await fetchAssistantIcon(iconId);

        const contentType =
            iconResponse.headers.get("content-type") ||
            "image/png";

        const buffer = Buffer.from(await iconResponse.arrayBuffer());

        res.set("Content-Type", contentType);
        res.send(buffer);

    } catch (error) {
        console.error(error);

        return res.status(502).json({
            error: "Kunde inte hämta assistentikon"
        });
    }
});

router.post("/session", acceptOptionalFiles, async (req, res) => {

    try {

        const message = req.body.message ?? "";
        const assistantId = req.body.assistant_id || null;

        // A message may be files only, but it needs text or at least one file.
        if ((!message && !req.files?.length) || !assistantId) {
            return res.status(400).json({
                error: "Meddelande eller assistant ID saknas"
            });
        }

        const files = await uploadAttachedFiles(req.files);

        // Första meddelandet skapar samtidigt ENEO-sessionen
        const eneoResponse = await createSession(message, assistantId, files);


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
            response: removeRefs(eneoResponse.answer),
            references: getInrefContents(eneoResponse.answer, eneoResponse.mcp_tool_references)
        });

    } catch (error) {

        if (error instanceof UploadFailedError) {
            return sendUploadError(res, error);
        }

        console.error(error);

        return res.status(502).json({
            error: "Kunde inte skapa chat-session"
        });
    }
});

router.post("/:sessionId/message", acceptOptionalFiles, async (req, res) => {

    try {

        const {sessionId} = req.params;
        const message = req.body.message ?? "";
        const assistantId = req.body.assistant_id || null;

        if ((!message && !req.files?.length) || !assistantId) {
            return res.status(400).json({
                error: "Meddelande eller assistant ID saknas"
            });
        }

        // Check the session before uploading, so no files are uploaded for a dead session.
        if (!getSession(sessionId)) {
            return res.status(404).json({
                error: "Chat-session hittades inte"
            });
        }

        const files = await uploadAttachedFiles(req.files);

        const eneoResponse = await sendMessage(
            message,
            sessionId,
            assistantId,
            files
        );

        return res.json({
            response: removeRefs(eneoResponse.answer),
            references: getInrefContents(eneoResponse.answer, eneoResponse.mcp_tool_references)
        });

    } catch (error) {

        if (error instanceof UploadFailedError) {
            return sendUploadError(res, error);
        }

        console.error(error);

        return res.status(502).json({
            error: "Kunde inte skicka meddelandet"
        });
    }
});

function generateRandomUUID(){
    if (crypto.randomUUID){
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