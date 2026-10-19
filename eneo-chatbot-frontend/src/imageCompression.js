/**
 * Compresses images in the browser to WebP before they are attached.
 *
 * - Scales the image down so its longest side is at most IMAGE_MAX_DIMENSION px
 *   (AI vision models downscale large images anyway, so the extra pixels only cost upload time).
 * - Re-encodes as WebP at IMAGE_QUALITY.
 * - Falls back to the original file when compression isn't possible or doesn't help:
 *   animated GIFs (would lose their animation), browsers that can't encode WebP
 *   (older Safari silently returns PNG), decode errors, or a result that isn't smaller.
 */

export const IMAGE_MAX_DIMENSION = 2048;
export const IMAGE_QUALITY = 0.8;

/** GIF is left out on purpose: drawing it to a canvas keeps only the first frame. */
const COMPRESSIBLE_TYPES = ["image/png", "image/jpeg", "image/webp"];

/**
 * @param {File} file
 * @returns {Promise<File>} a WebP file, or the original file if compression didn't apply
 */
export async function compressImage(file) {
    if (!COMPRESSIBLE_TYPES.includes(file.type)) {
        return file;
    }

    let bitmap;
    try {
        // "from-image" applies the EXIF rotation, so phone photos aren't sideways.
        bitmap = await createImageBitmap(file, {imageOrientation: "from-image"});
    } catch (error) {
        console.warn("[Compress] Could not decode image, sending original", file.name, error);
        return file;
    }

    try {
        const scale = Math.min(1, IMAGE_MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
        const width = Math.max(1, Math.round(bitmap.width * scale));
        const height = Math.max(1, Math.round(bitmap.height * scale));

        const blob = await encodeWebp(bitmap, width, height, IMAGE_QUALITY);

        // No WebP support (blob comes back as PNG) or no gain: keep the original.
        if (!blob || blob.type !== "image/webp" || blob.size >= file.size) {
            console.log("[Compress] Keeping original", {
                name: file.name,
                originalSize: file.size,
                compressedSize: blob?.size,
                compressedType: blob?.type
            });
            return file;
        }

        const name = file.name.replace(/\.[^.]+$/, "") + ".webp";
        const compressed = new File([blob], name, {
            type: "image/webp",
            lastModified: file.lastModified
        });

        console.log("[Compress] Compressed image", {
            name: file.name,
            from: `${bitmap.width}×${bitmap.height}, ${formatBytes(file.size)}`,
            to: `${width}×${height}, ${formatBytes(compressed.size)}`
        });

        return compressed;
    } catch (error) {
        console.warn("[Compress] Compression failed, sending original", file.name, error);
        return file;
    } finally {
        bitmap.close();
    }
}

function encodeWebp(bitmap, width, height, quality) {
    // OffscreenCanvas avoids touching the DOM; fall back to a normal canvas where it's missing.
    if (typeof OffscreenCanvas !== "undefined") {
        const canvas = new OffscreenCanvas(width, height);
        drawScaled(canvas.getContext("2d"), bitmap, width, height);
        return canvas.convertToBlob({type: "image/webp", quality}).catch(() => null);
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    drawScaled(canvas.getContext("2d"), bitmap, width, height);
    return new Promise(resolve => canvas.toBlob(resolve, "image/webp", quality));
}

function drawScaled(ctx, bitmap, width, height) {
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(bitmap, 0, 0, width, height);
}

function formatBytes(bytes) {
    return bytes >= 1024 * 1024
        ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
        : `${Math.round(bytes / 1024)} KB`;
}
