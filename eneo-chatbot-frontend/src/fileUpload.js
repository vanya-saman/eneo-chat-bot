import {useCallback, useEffect, useRef, useState} from "react";

/**
 * Accepted file types and their extensions.
 * Extensions are checked too, because browsers often give .md/.csv files an empty
 * or unusual MIME type (especially on Windows).
 * Keep in sync with ACCEPTED_FILE_TYPES in the backend (routes/chat.js).
 */
export const ACCEPTED_FILE_TYPES = {
    "image/png": [".png"],
    "image/jpeg": [".jpg", ".jpeg"],
    "image/gif": [".gif"],
    "image/webp": [".webp"],
    "application/pdf": [".pdf"],
    "text/plain": [".txt"],
    "text/markdown": [".md"],
    "text/csv": [".csv"],
};

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB per file

/** Max number of files in one message. Keep in sync with MAX_FILES in the backend. */
export const MAX_FILES = 5;

/** Value for <input type="file" accept="...">. */
export const ACCEPT_ATTRIBUTE = [
    ...Object.keys(ACCEPTED_FILE_TYPES),
    ...Object.values(ACCEPTED_FILE_TYPES).flat()
].join(",");

function getExtension(name) {
    const dot = name?.lastIndexOf(".") ?? -1;
    return dot >= 0 ? name.slice(dot).toLowerCase() : "";
}

export function isAcceptedFile(file) {
    if (file.type in ACCEPTED_FILE_TYPES) {
        return true;
    }
    return Object.values(ACCEPTED_FILE_TYPES).flat().includes(getExtension(file.name));
}

export function isImageFile(file) {
    return Boolean(file?.type?.startsWith("image/")) && file.type in ACCEPTED_FILE_TYPES;
}

/**
 * Returns an error message (in Swedish, shown to the user) or null if the file is OK.
 * @param {File} file
 */
export function validateFile(file) {
    if (!file) {
        return "Ingen fil vald.";
    }
    if (!isAcceptedFile(file)) {
        return "Endast bilder (PNG, JPEG, GIF, WebP), PDF och textfiler (TXT, MD, CSV) kan bifogas.";
    }
    if (file.size === 0) {
        return "Filen är tom.";
    }
    if (file.size > MAX_FILE_SIZE) {
        return `Filen är för stor (max ${MAX_FILE_SIZE / 1024 / 1024} MB).`;
    }
    return null;
}

/** Same file picked twice (e.g. dropped again) — skip it instead of attaching a copy. */
function isSameFile(a, b) {
    return a.name === b.name && a.size === b.size && a.lastModified === b.lastModified;
}

let nextAttachmentId = 0;

/**
 * Hook that handles attaching up to MAX_FILES files via drag & drop, paste or a file picker.
 *
 * Each attachment is { id, file, previewUrl }. previewUrl is set for images only and is
 * revoked when the attachment is removed, the list is cleared or the component unmounts.
 */
export function useFileUpload() {
    const [attachments, setAttachments] = useState([]);
    const [error, setError] = useState(null);
    const [isDragging, setIsDragging] = useState(false);

    // Always the latest list, so callbacks don't go stale and preview URLs are created once.
    const attachmentsRef = useRef([]);

    function updateAttachments(next) {
        attachmentsRef.current = next;
        setAttachments(next);
    }

    const addFiles = useCallback((fileList) => {
        const candidates = Array.from(fileList ?? []);
        if (candidates.length === 0) {
            return;
        }

        const current = attachmentsRef.current;
        const added = [];
        const problems = [];

        for (const file of candidates) {
            if ([...current, ...added].some(a => isSameFile(a.file, file))) {
                continue;
            }
            if (current.length + added.length >= MAX_FILES) {
                problems.push(`Du kan bifoga högst ${MAX_FILES} filer per meddelande.`);
                break;
            }
            const validationError = validateFile(file);
            if (validationError) {
                problems.push(`${file.name}: ${validationError}`);
                continue;
            }
            added.push({
                id: ++nextAttachmentId,
                file,
                previewUrl: isImageFile(file) ? URL.createObjectURL(file) : null
            });
        }

        setError(problems.length > 0 ? problems.join(" ") : null);

        if (added.length > 0) {
            updateAttachments([...current, ...added]);
        }
    }, []);

    const removeFile = useCallback((id) => {
        const current = attachmentsRef.current;
        const removed = current.find(a => a.id === id);
        if (removed?.previewUrl) {
            URL.revokeObjectURL(removed.previewUrl);
        }
        updateAttachments(current.filter(a => a.id !== id));
        setError(null);
    }, []);

    const clearFiles = useCallback(() => {
        attachmentsRef.current.forEach(a => a.previewUrl && URL.revokeObjectURL(a.previewUrl));
        updateAttachments([]);
        setError(null);
    }, []);

    // Release any remaining preview URLs on unmount.
    useEffect(() => () => {
        attachmentsRef.current.forEach(a => a.previewUrl && URL.revokeObjectURL(a.previewUrl));
    }, []);

    useEffect(() => {
        let dragDepth = 0;

        function hasFiles(e) {
            return Array.from(e.dataTransfer?.types ?? []).includes("Files");
        }

        function handleDragEnter(e) {
            if (!hasFiles(e)) return;
            e.preventDefault();
            dragDepth++;
            setIsDragging(true);
        }

        function handleDragOver(e) {
            if (!hasFiles(e)) return;
            e.preventDefault();
            e.dataTransfer.dropEffect = "copy";
        }

        function handleDragLeave(e) {
            if (!hasFiles(e)) return;
            dragDepth = Math.max(0, dragDepth - 1);
            if (dragDepth === 0) {
                setIsDragging(false);
            }
        }

        function handleDrop(e) {
            if (!hasFiles(e)) return;
            e.preventDefault();
            dragDepth = 0;
            setIsDragging(false);
            addFiles(e.dataTransfer.files);
        }

        // Pasting screenshots or copied files. Plain text pastes are left alone.
        function handlePaste(e) {
            const pasted = e.clipboardData?.files;
            if (pasted && pasted.length > 0) {
                e.preventDefault();
                addFiles(pasted);
            }
        }

        document.addEventListener("dragenter", handleDragEnter);
        document.addEventListener("dragover", handleDragOver);
        document.addEventListener("dragleave", handleDragLeave);
        document.addEventListener("drop", handleDrop);
        document.addEventListener("paste", handlePaste);

        return () => {
            document.removeEventListener("dragenter", handleDragEnter);
            document.removeEventListener("dragover", handleDragOver);
            document.removeEventListener("dragleave", handleDragLeave);
            document.removeEventListener("drop", handleDrop);
            document.removeEventListener("paste", handlePaste);
        };
    }, [addFiles]);

    return {
        attachments,
        files: attachments.map(a => a.file),
        canAddMore: attachments.length < MAX_FILES,
        error,
        isDragging,
        addFiles,
        removeFile,
        clearFiles
    };
}