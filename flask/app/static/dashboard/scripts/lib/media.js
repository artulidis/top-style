/**
 * Creates a blob-URL preview and extracts dimension metadata for an image file.
 *
 * The returned `previewUrl` is a local object-URL suitable for setting an
 * element's `src` attribute.  It is NOT a data-URL — the raw {@link File}
 * should be sent to the server via FormData instead.
 *
 * @param {File} file
 * @returns {Promise<{ previewUrl: string, meta: { size_bytes: number, width: number, height: number } }>}
 */
export function readImageFile(file) {
	return new Promise((resolve, reject) => {
		const previewUrl = URL.createObjectURL(file);
		const img = new Image();

		img.onload = () => {
			resolve({
				previewUrl,
				meta: {
					size_bytes: file.size,
					width: img.width,
					height: img.height
				}
			});
		};

		img.onerror = () => {
			URL.revokeObjectURL(previewUrl);
			reject(new Error("Unable to read image."));
		};
		img.src = previewUrl;
	});
}

/**
 * Creates a blob-URL preview and extracts dimension metadata for a video file.
 *
 * @param {File} file
 * @returns {Promise<{ previewUrl: string, meta: { size_bytes: number, width: number, height: number } }>}
 */
export function readVideoFile(file) {
	return new Promise((resolve, reject) => {
		const previewUrl = URL.createObjectURL(file);
		const video = document.createElement("video");

		video.onloadedmetadata = () => {
			resolve({
				previewUrl,
				meta: {
					size_bytes: file.size,
					width: video.videoWidth,
					height: video.videoHeight
				}
			});
		};

		video.onerror = () => {
			URL.revokeObjectURL(previewUrl);
			reject(new Error("Unable to read video."));
		};
		video.src = previewUrl;
	});
}

/**
 * Creates a blob-URL preview and extracts dimension metadata.
 * Delegates to readImageFile or readVideoFile based on mediaType.
 *
 * @param {File}   file
 * @param {"image"|"video"} mediaType
 * @returns {Promise<{ previewUrl: string, meta: object }>}
 */
export function readMediaFile(file, mediaType = "image") {
	return mediaType === "video" ? readVideoFile(file) : readImageFile(file);
}
