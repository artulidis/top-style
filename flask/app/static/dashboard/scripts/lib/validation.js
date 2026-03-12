export const MAX_IMAGE_BYTES = 1 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 75 * 1024 * 1024;
export const ASPECT_TOLERANCE = 0.02;

export function checkSquare(meta) {
	if (!meta?.width || !meta?.height) {
		return null;
	}
	return meta.width === meta.height;
}

export function checkSize(meta, maxBytes) {
	if (!meta || typeof meta.size_bytes !== "number") {
		return null;
	}
	return meta.size_bytes <= maxBytes;
}

export function checkAspectRatio(meta, targetRatio, tolerance = ASPECT_TOLERANCE) {
	if (!meta?.width || !meta?.height) {
		return null;
	}
	const ratio = meta.height ? meta.width / meta.height : 0;
	return Math.abs(ratio - targetRatio) <= tolerance;
}

/**
 * Validates media metadata against a configuration object.
 *
 * @param {object} meta               - { size_bytes, width, height }
 * @param {object} config             - Validation rules
 * @param {number} [config.maxBytes]        - Maximum file size in bytes
 * @param {number} [config.aspectRatio]     - Required width/height ratio
 * @param {number} [config.aspectTolerance] - Allowed deviation from aspectRatio
 * @param {boolean} [config.requireSquare]  - Must be square?
 * @param {object} [config.messages]        - Custom error messages { size, ratio, square }
 *
 * @returns {string|null} Error message, or null if valid.
 */
export function validateMeta(meta, config) {
	if (!config || !meta) {
		return null;
	}
	if (config.maxBytes) {
		const sizeOk = checkSize(meta, config.maxBytes);
		if (sizeOk === false) {
			return config.messages?.size || "File is too large.";
		}
	}
	if (config.aspectRatio) {
		const ratioOk = checkAspectRatio(meta, config.aspectRatio, config.aspectTolerance);
		if (ratioOk === false) {
			return config.messages?.ratio || "File has an invalid aspect ratio.";
		}
	}
	if (config.requireSquare) {
		const squareOk = checkSquare(meta);
		if (squareOk === false) {
			return config.messages?.square || "File must be square.";
		}
	}
	return null;
}

/**
 * Convenience validator for images: must be ≤ 1 MB and square.
 *
 * @param {object} meta - { size_bytes, width, height }
 * @returns {string|null} Error message, or null if valid.
 */
export function validateImageMeta(meta) {
	return validateMeta(meta, {
		maxBytes: MAX_IMAGE_BYTES,
		requireSquare: true,
		messages: {
			size: "Image should not exceed 1MB.",
			square: "Image should be square."
		}
	});
}
