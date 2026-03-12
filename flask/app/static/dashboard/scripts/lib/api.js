import { showDashboardAlert } from "../alert.js";

/**
 * Sends a JSON POST request to a CMS endpoint and shows a dashboard alert
 * with the result message.
 *
 * @param {string} endpoint        - URL to POST to
 * @param {object} payload         - JSON-serializable request body
 * @param {string} fallbackMessage - Message shown on network error or missing response message
 * @returns {Promise<{ ok: boolean, data: object }>}
 */
export async function cmsRequest(endpoint, payload, fallbackMessage) {
	try {
		const response = await fetch(endpoint, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(payload)
		});

		const data = await response.json().catch(() => ({}));

		if (!response.ok) {
			showDashboardAlert(data.message || fallbackMessage);
			return { ok: false, data };
		}

		showDashboardAlert(data.message || fallbackMessage);
		return { ok: true, data };
	} catch (err) {
		showDashboardAlert(fallbackMessage);
		return { ok: false, data: {} };
	}
}

/**
 * Sends a multipart form-data POST request (for file uploads) and shows
 * a dashboard alert with the result message.
 *
 * Do NOT set a Content-Type header — the browser sets it automatically
 * with the correct multipart boundary.
 *
 * @param {string}   endpoint        - URL to POST to
 * @param {FormData} formData        - Multipart payload (files + fields)
 * @param {string}   fallbackMessage - Message shown on network error
 * @returns {Promise<{ ok: boolean, data: object }>}
 */
export async function cmsUpload(endpoint, formData, fallbackMessage) {
	try {
		const response = await fetch(endpoint, {
			method: "POST",
			body: formData
		});

		const data = await response.json().catch(() => ({}));

		if (!response.ok) {
			showDashboardAlert(data.message || fallbackMessage);
			return { ok: false, data };
		}

		showDashboardAlert(data.message || fallbackMessage);
		return { ok: true, data };
	} catch (err) {
		showDashboardAlert(fallbackMessage);
		return { ok: false, data: {} };
	}
}

/**
 * Reads the heading (h1) and paragraph (p) from a text block and POSTs them
 * to the given CMS endpoint.
 *
 * Returns an async function suitable for use as a click handler.
 *
 * @param {string}      endpoint        - CMS URL
 * @param {HTMLElement}  block           - Container with h1 + p children
 * @param {string}      fallbackMessage - Alert on failure
 * @returns {function(): Promise<void>}
 */
export function sendTextUpdate(endpoint, block, fallbackMessage) {
	return async () => {
		const heading = block?.querySelector("h1")?.textContent || "";
		const text = block?.querySelector("p")?.textContent || "";

		await cmsRequest(endpoint, { heading, text }, fallbackMessage);
	};
}
