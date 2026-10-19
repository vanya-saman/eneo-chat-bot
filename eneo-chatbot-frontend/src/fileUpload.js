import {useCallback, useEffect, useState} from "react";

export const ACCEPTED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/gif", "image/webp"];
export const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 MB

/**
 * Returns an error message (in Swedish, shown to the user) or null if the file is OK.
 * @param {File} file
 */
export function validateImage(file) {
    if (!file) {
        return "Ingen fil vald.";
    }
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        return "Endast bilder (PNG, JPEG, GIF, WebP) kan bifogas.";
    }
    if (file.size > MAX_IMAGE_SIZE) {
        return `Bilden är för stor (max ${MAX_IMAGE_SIZE / 1024 / 1024} MB).`;
    }
    return null;
}

export function useFileUpload() {
    const [file, setFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [error, setError] = useState(null);
    const [isDragging, setIsDragging] = useState(false);

    const selectFile = useCallback((candidate) => {
        if (!candidate) {
            return;
        }
        const validationError = validateImage(candidate);
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

    // One preview URL per file, revoked when the file changes or the component unmounts.
    useEffect(() => {
        if (!file) {
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

        // Ctrl/Cmd+V of a screenshot. Plain text pastes are left alone.
        function handlePaste(e) {
            const pasted = Array.from(e.clipboardData?.files ?? [])
                .find(f => f.type.startsWith("image/"));
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