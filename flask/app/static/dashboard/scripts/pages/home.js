import { showDashboardAlert } from "../alert.js";
import { validateMeta, MAX_IMAGE_BYTES, MAX_VIDEO_BYTES, ASPECT_TOLERANCE } from "../lib/validation.js";
import { readImageFile, readMediaFile } from "../lib/media.js";
import { makeEditable, trackChanges } from "../lib/editor.js";
import { cmsRequest, sendTextUpdate, cmsUpload } from "../lib/api.js";
import { initLazyLoad } from "../lib/lazy-load.js";

// ---------------------------------------------------------------------------
// DOM references
// ---------------------------------------------------------------------------
const aboutGalleryContainer = document.getElementById("galleryImgs");
const bridalGalleryContainer = document.getElementById("bridalImageGrid");

// ---------------------------------------------------------------------------
// Gallery selection (toggle checkmark overlay on gallery items)
// ---------------------------------------------------------------------------
function handleGallerySelection(container) {
	if (!container) return;

	container.querySelectorAll(".gallery-item").forEach((item) => {
		item.addEventListener("click", () => {
			const marker = item.querySelector(".img-selected");
			if (!marker) return;

			const isShown = getComputedStyle(marker).display === "block";
			marker.style.display = isShown ? "none" : "block";
		});
	});
}

// ---------------------------------------------------------------------------
// Gallery replacement (multi-image: about gallery, bridal gallery)
// ---------------------------------------------------------------------------
function handleGalleryReplacement(options) {
	const { button, input, container, endpoint, maxCount, warningsConfig } = options;
	if (!button || !input || !container) return;

	button.addEventListener("click", () => {
		const selectedItems = getSelectedGalleryItems(container);
		if (selectedItems.length === 0) return;

		input.dataset.replaceCount = String(selectedItems.length);
		input.click();
	});

	input.addEventListener("change", async () => {
		const files = Array.from(input.files || []);
		if (files.length === 0) return;

		const selectedItems = getSelectedGalleryItems(container);
		const limitedItems = selectedItems.slice(0, maxCount || files.length);
		const validFiles = [];
		const indices = [];

		for (let i = 0; i < limitedItems.length; i++) {
			const item = limitedItems[i];
			const file = files[i];
			const img = item?.querySelector(".gallery-img");
			if (!img || !file) continue;

			try {
				const { previewUrl, meta } = await readImageFile(file);
				const violation = validateMeta(meta, warningsConfig);
				if (violation) {
					showDashboardAlert(violation);
					return;
				}

				const placeholder = item.querySelector(".img-placeholder");
				img.src = previewUrl;
				img.removeAttribute("data-src");
				img.classList.add("loaded");
				if (placeholder) {
					placeholder.classList.add("fade-out");
				}

				const allItems = Array.from(container.querySelectorAll(".gallery-item"));
				const itemIndex = allItems.indexOf(item);
				if (itemIndex >= 0) {
					validFiles.push(file);
					indices.push(itemIndex + 1);
				}
			} catch (err) {
				showDashboardAlert("Unable to process image.");
				return;
			}
		}

		if (validFiles.length === 0) return;

		const formData = new FormData();
		validFiles.forEach((file) => formData.append("files", file));
		formData.append("indices", JSON.stringify(indices));

		const { ok } = await cmsUpload(endpoint, formData, "Unable to save images.");
		if (ok) {
			limitedItems.forEach((item) => {
				const marker = item?.querySelector(".img-selected");
				const img = item?.querySelector(".gallery-img");
				if (marker) {
					marker.style.display = "none";
				}
				if (img) {
					img.style.opacity = "1";
				}
			});
		}
	});
}

function getSelectedGalleryItems(container) {
	return Array.from(container.querySelectorAll(".img-selected"))
		.filter((marker) => getComputedStyle(marker).display === "block")
		.map((marker) => marker.closest(".gallery-item"))
		.filter(Boolean);
}

// ---------------------------------------------------------------------------
// Single media replacement (image or video)
// ---------------------------------------------------------------------------
function handleSingleMediaReplacement(options) {
	const { button, input, previewSelector, endpoint, mediaType, warningsConfig } = options;
	if (!button || !input) return;

	button.addEventListener("click", () => input.click());

	input.addEventListener("change", async () => {
		const file = (input.files || [])[0];
		if (!file) return;

		try {
			const { previewUrl, meta } = await readMediaFile(file, mediaType);
			const violation = validateMeta(meta, warningsConfig);
			if (violation) {
				showDashboardAlert(violation);
				return;
			}

			const previewEl = previewSelector ? document.querySelector(previewSelector) : null;
			if (previewEl && (previewEl.tagName === "IMG" || previewEl.tagName === "VIDEO")) {
				previewEl.src = previewUrl;
			}

			const formData = new FormData();
			formData.append("file", file);

			await cmsUpload(endpoint, formData, `Unable to save ${mediaType}.`);
		} catch (err) {
			showDashboardAlert(`Unable to process ${mediaType}.`);
		}
	});
}

// ---------------------------------------------------------------------------
// Initialization
// ---------------------------------------------------------------------------

// Make all text blocks editable
makeEditable("h1, p", document.querySelector("body"));

// Enable gallery selection
[aboutGalleryContainer, bridalGalleryContainer].forEach((container) => handleGallerySelection(container));

// Text save buttons - bind each to its CMS endpoint
const textEndpoints = {
	saveMissionStatement: "/cms/home/about",
	saveServicesStatement: "/cms/home/services",
	saveStylistsStatement: "/cms/home/stylists",
	saveBridalStatement: "/cms/home/bridal"
};

document.querySelectorAll(".save-changes").forEach((button) => {
	const endpoint = textEndpoints[button.id];
	if (!endpoint) return;

	const scope = button.closest(".container-vertical") || document;
	const block = scope.querySelector(".edit-text-block");
	if (!block) return;

	// Click handler that POSTs heading + paragraph
	button.addEventListener("click", sendTextUpdate(endpoint, block, "Unable to save changes."));

	// Change tracking: enable/disable button based on edits
	const headingEl = block.querySelector("h1");
	const paraEl = block.querySelector("p");
	if (!headingEl || !paraEl) return;

	trackChanges({
		container: scope,
		saveButton: button,
		elements: [headingEl, paraEl],
		getStateFn: () => ({
			heading: headingEl.textContent,
			text: paraEl.textContent
		}),
		onSave: async () => {
			// The actual POST is handled by the click handler above.
			// Return the current state so trackChanges resets its baseline.
			return {
				heading: headingEl.textContent,
				text: paraEl.textContent
			};
		}
	});
});

// Gallery replacement - About (9 images, square)
handleGalleryReplacement({
	button: document.getElementById("replaceAboutImagesButton"),
	input: document.getElementById("aboutGalleryUploadInput"),
	container: aboutGalleryContainer,
	endpoint: "/cms/home/about",
	maxCount: 9,
	warningsConfig: {
		maxBytes: MAX_IMAGE_BYTES,
		requireSquare: true,
		messages: {
			size: "Images should not exceed 1MB.",
			square: "Images should be square."
		}
	}
});

// Single media - Salon video (vertical, <= 75 MB)
handleSingleMediaReplacement({
	button: document.getElementById("replaceVideoButton"),
	input: document.getElementById("salonVideoInput"),
	previewSelector: "#salonVideo",
	endpoint: "/cms/home/services",
	mediaType: "video",
	warningsConfig: {
		maxBytes: MAX_VIDEO_BYTES,
		aspectRatio: 9 / 16,
		aspectTolerance: ASPECT_TOLERANCE,
		messages: {
			size: "Salon video should not exceed 75MB.",
			ratio: "Salon video should be vertical (9:16 aspect ratio)."
		}
	}
});

// Single media - Team photo (any aspect ratio, <= 1 MB)
handleSingleMediaReplacement({
	button: document.getElementById("replaceTeamPhotoButton"),
	input: document.getElementById("teamPhotoUploadInput"),
	previewSelector: "#teamPhoto",
	endpoint: "/cms/home/stylists",
	mediaType: "image",
	warningsConfig: {
		maxBytes: MAX_IMAGE_BYTES,
		requireSquare: false,
		messages: {
			size: "Image should not exceed 1MB."
		}
	}
});

// Gallery replacement - Bridal (4 images, square)
handleGalleryReplacement({
	button: document.getElementById("replaceBridalImagesButton"),
	input: document.getElementById("bridalGalleryUploadInput"),
	container: bridalGalleryContainer,
	endpoint: "/cms/home/bridal",
	maxCount: 9,
	warningsConfig: {
		maxBytes: MAX_IMAGE_BYTES,
		requireSquare: true,
		messages: {
			size: "Images should not exceed 1MB.",
			square: "Images should be square."
		}
	}
});

// Lazy-load gallery images
initLazyLoad();
