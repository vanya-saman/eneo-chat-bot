/**
 * Helpers for Eneo inline citations, e.g. `<inref id="3f9a1c2e"/>`.
 * The id is the first 8 characters of an entry's id in the response's `references`.
 */

// Matches a citation tag plus any whitespace before it. Group 1 is the short id.
const INREF = /\s*<inref id="(\w{8})"\s*\/>/g;

/**
 * Strips all citation tags from an answer.
 * @param {string} message  Eneo `answer` text.
 * @returns {string}
 */
function removeRefs(message) {
    return (message || "").replace(INREF, "").trim();
}

/**
 * Returns the sources cited in an answer, unique and in order of first citation.
 * Citations without a matching reference are skipped.
 * @param {string} text   Eneo `answer` text.
 * @param {Array<{id: string, meta?: {title?: string}, content?: string}>} refs  Eneo `references`.
 * @returns {Array<{title?: string, content?: string}>}
 */
function getInrefContents(text, refs) {
    const answerText = text || "";
    const sources = refs || [];

    // Unique short ids, in order of appearance
    const ids = [];
    for (const match of answerText.matchAll(INREF)) {
        const id = match[1];
        if (!ids.includes(id)) {
            ids.push(id);
        }
    }

    // Match short ids to full reference ids by prefix
    const results = [];
    for (const id of ids) {
        const source = sources.find((s) => s.id.startsWith(id));

        if (source) {
            results.push({
                title: source.meta?.title,
                content: source.content
            });
        }
    }

    return results;
}

module.exports = { removeRefs, getInrefContents };