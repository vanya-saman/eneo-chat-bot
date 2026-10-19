import {useCallback, useEffect, useState} from "react";

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

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

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

/**
 * Hook that handles attaching one file via drag & drop, paste or a file picker.
 */
export function useFileUpload() {
    const [file, setFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [error, setError] = useState(null);
    const [isDragging, setIsDragging] = useState(false);

    const selectFile = useCallback((candidate) => {
        if (!candidate) {
            return;
        }
        const validationError = validateFile(candidate);
        if (validationError) {
            setError(validationError);
            return;
        }
        setError(null);
        setFile(candidate);
    }, []);

    const clearFile = useCallback(() => {
        setFile(null);
        setError(null);
    }, []);

    // Thumbnail URL for images only; other files are shown by name.
    useEffect(() => {
        if (!file || !isImageFile(file)) {
            setPreviewUrl(null);
            return;
        }
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
        return () => URL.revokeObjectURL(url);
    }, [file]);

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
            selectFile(e.dataTransfer.files[0]);
        }

        // Pasting a screenshot or a copied file. Plain text pastes are left alone.
        function handlePaste(e) {
            const pasted = e.clipboardData?.files?.[0];
            if (pasted) {
                e.preventDefault();
                selectFile(pasted);
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
    }, [selectFile]);

    return {
        file,
        previewUrl,
        error,
        isDragging,
        selectFile,
        clearFile
    };
}