import { showDashboardAlert } from "../alert.js";
import { validateImageMeta } from "../lib/validation.js";
import { readImageFile } from "../lib/media.js";
import { makeEditable, setButtonState, trackChanges } from "../lib/editor.js";
import { cmsRequest, cmsUpload } from "../lib/api.js";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const SERVICE_DETAIL_PLACEHOLDER_TEXT = "[Add service detail]";
const SERVICE_DETAIL_PLACEHOLDER_CLASS = "service-detail-placeholder";

// ---------------------------------------------------------------------------
// Service detail placeholder helpers
// ---------------------------------------------------------------------------
function isPlaceholderDetail(detailsEl) {
	return !!detailsEl?.classList.contains(SERVICE_DETAIL_PLACEHOLDER_CLASS);
}

function normalizeServiceDetails(detailsEl) {
	if (!detailsEl || isPlaceholderDetail(detailsEl)) {
		return "";
	}

	return detailsEl.textContent?.trim() || "";
}

function applyServiceDetailPlaceholder(detailsEl) {
	if (!detailsEl) return;

	const currentText = detailsEl.textContent?.trim() || "";
	if (!currentText) {
		detailsEl.textContent = SERVICE_DETAIL_PLACEHOLDER_TEXT;
		detailsEl.classList.add(SERVICE_DETAIL_PLACEHOLDER_CLASS);
		return;
	}

	detailsEl.classList.remove(SERVICE_DETAIL_PLACEHOLDER_CLASS);
}

function clearServiceDetailPlaceholder(detailsEl) {
	if (!detailsEl || !isPlaceholderDetail(detailsEl)) return;

	detailsEl.textContent = "";
	detailsEl.classList.remove(SERVICE_DETAIL_PLACEHOLDER_CLASS);
}

// ---------------------------------------------------------------------------
// Service update
// ---------------------------------------------------------------------------
async function sendServiceUpdate(service, messageFallback) {
	const serviceName = service.querySelector(".service-name")?.textContent?.trim() || "";
	const servicePrice = service.querySelector(".service-price")?.textContent?.trim() || "";
	const serviceDetailsEl = service.querySelector(".service-details");
	const serviceDetails = normalizeServiceDetails(serviceDetailsEl);
	const serviceMeta = service.querySelector(".service-flex");

	if (!serviceName || !servicePrice || !serviceMeta) {
		showDashboardAlert("Service name and price are required.");
		return null;
	}

	const rawId = serviceMeta.dataset.serviceId;
	const rawOrder = serviceMeta.dataset.serviceOrder;
	const parsedOrder = Number(rawOrder);
	if (!rawOrder || Number.isNaN(parsedOrder)) {
		showDashboardAlert("Service order is missing.");
		return null;
	}

	const payload = {
		name: serviceName,
		price: servicePrice,
		details: serviceDetails,
		category: serviceMeta.dataset.category || "popular",
		order: parsedOrder
	};

	if (rawId) {
		const parsedId = Number(rawId);
		if (!Number.isNaN(parsedId)) {
			payload.id = parsedId;
		}
	}

	const { ok, data } = await cmsRequest("/cms/services", payload, messageFallback);
	if (!ok) return null;

	if (data?.service?.id) {
		serviceMeta.dataset.serviceId = String(data.service.id);
	}
	if (data?.service?.order !== undefined && data?.service?.order !== null) {
		serviceMeta.dataset.serviceOrder = String(data.service.order);
	}

	return { name: serviceName, price: servicePrice, details: serviceDetails };
}

// ---------------------------------------------------------------------------
// Single image replacement per service category
// ---------------------------------------------------------------------------
function handleSingleImageReplacement(options) {
	const { button, input, previewSelector, endpoint, category } = options;
	if (!button || !input || !endpoint || !category) return;

	button.addEventListener("click", () => input.click());

	input.addEventListener("change", async () => {
		const file = (input.files || [])[0];
		if (!file) return;

		try {
			const { previewUrl, meta } = await readImageFile(file);
			const violation = validateImageMeta(meta);
			if (violation) {
				showDashboardAlert(violation);
				return;
			}

			const previewEl = previewSelector ? document.querySelector(previewSelector) : null;
			if (previewEl && previewEl.tagName === "IMG") {
				previewEl.src = previewUrl;
			}

			const formData = new FormData();
			formData.append("file", file);
			formData.append("category", category);

			await cmsUpload(endpoint, formData, "Unable to save image.");
		} catch (err) {
			showDashboardAlert("Unable to process image.");
		}
	});
}

// ---------------------------------------------------------------------------
// Initialization
// ---------------------------------------------------------------------------

// Make service fields editable
document.querySelectorAll(".service").forEach((service) => {
	makeEditable(".service-name, .service-price, .service-details", service);

	const serviceDetails = service.querySelector(".service-details");
	if (!serviceDetails) return;

	applyServiceDetailPlaceholder(serviceDetails);
	serviceDetails.addEventListener("focus", () => clearServiceDetailPlaceholder(serviceDetails));
	serviceDetails.addEventListener("blur", () => applyServiceDetailPlaceholder(serviceDetails));
});

// Change tracking + save for each service
document.querySelectorAll(".save-changes").forEach((button) => {
	const service = button.closest(".service");
	if (!service) return;

	const serviceName = service.querySelector(".service-name");
	const servicePrice = service.querySelector(".service-price");
	const serviceDetails = service.querySelector(".service-details");
	if (!serviceName || !servicePrice) return;

	trackChanges({
		container: service,
		saveButton: button,
		elements: [serviceName, servicePrice, serviceDetails].filter(Boolean),
		getStateFn: () => ({
			name: serviceName.textContent,
			price: servicePrice.textContent,
			details: normalizeServiceDetails(serviceDetails)
		}),
		onSave: async () => {
			const saved = await sendServiceUpdate(service, "Unable to save service changes.");
			return saved;
		}
	});
});

// Image replacement per service category
[
	{
		buttonId: "replacePopularServicesPhotoButton",
		inputId: "popularServicesPhotoUploadInput",
		formId: "popularServicesPhotoUploadForm",
		previewSelector: "#popularServicesPhoto"
	},
	{
		buttonId: "replaceCuttingServicesPhotoButton",
		inputId: "cuttingServicesPhotoUploadInput",
		formId: "cuttingServicesPhotoUploadForm",
		previewSelector: "#cuttingServicesPhoto"
	},
	{
		buttonId: "replaceColoringServicesPhotoButton",
		inputId: "coloringServicesPhotoUploadInput",
		formId: "coloringServicesPhotoUploadForm",
		previewSelector: "#coloringServicesPhoto"
	},
	{
		buttonId: "replaceExtrasServicesPhotoButton",
		inputId: "extrasServicesPhotoUploadInput",
		formId: "extrasServicesPhotoUploadForm",
		previewSelector: "#extrasServicesPhoto"
	},
	{
		buttonId: "replaceBeautyServicesPhotoButton",
		inputId: "beautyServicesPhotoUploadInput",
		formId: "beautyServicesPhotoUploadForm",
		previewSelector: "#beautyServicesPhoto"
	},
	{
		buttonId: "replaceBridalServicesPhotoButton",
		inputId: "bridalServicesPhotoUploadInput",
		formId: "bridalServicesPhotoUploadForm",
		previewSelector: "#bridalServicesPhoto"
	}
].forEach((config) => {
	const button = document.getElementById(config.buttonId);
	const input = document.getElementById(config.inputId);
	const form = document.getElementById(config.formId);

	handleSingleImageReplacement({
		button,
		input,
		previewSelector: config.previewSelector,
		endpoint: "/cms/services/image",
		category: form?.dataset.category
	});
});
