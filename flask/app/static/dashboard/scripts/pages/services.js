import { showDashboardAlert } from "../alert.js";

const SERVICE_DETAIL_PLACEHOLDER_TEXT = "[Add service detail]";
const SERVICE_DETAIL_PLACEHOLDER_CLASS = "service-detail-placeholder";
const MAX_IMAGE_BYTES = 1 * 1024 * 1024;

function checkSquare(meta) {
    if (!meta?.width || !meta?.height) {
        return null;
    }
    return meta.width === meta.height;
}

function checkSize(meta, maxBytes) {
    if (!meta || typeof meta.size_bytes !== "number") {
        return null;
    }
    return meta.size_bytes <= maxBytes;
}

function validateImageMeta(meta) {
    const sizeOk = checkSize(meta, MAX_IMAGE_BYTES);
    if (sizeOk === false) {
        return "Image should not exceed 1MB.";
    }

    const squareOk = checkSquare(meta);
    if (squareOk === false) {
        return "Image should be square.";
    }

    return null;
}

function handleSingleImageReplacement(options) {
    const { button, input, previewSelector, endpoint, category } = options;
    if (!button || !input || !endpoint || !category) return;

    button.addEventListener("click", () => {
        input.click();
    });

    input.addEventListener("change", () => {
        const file = (input.files || [])[0];
        if (!file) return;

        const reader = new FileReader();
        const previewEl = previewSelector ? document.querySelector(previewSelector) : null;

        reader.onload = () => {
            const dataUrl = reader.result;
            const img = new Image();

            img.onload = () => {
                const meta = {
                    uri: dataUrl,
                    size_bytes: file.size,
                    width: img.width,
                    height: img.height
                };

                const violation = validateImageMeta(meta);
                if (violation) {
                    showDashboardAlert(violation);
                    return;
                }

                if (previewEl && previewEl.tagName === "IMG") {
                    previewEl.src = dataUrl;
                }

                fetch(endpoint, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        category,
                        uri: dataUrl
                    })
                })
                    .then(async (response) => {
                        const data = await response.json().catch(() => ({}));
                        if (!response.ok) {
                            showDashboardAlert(data.message || "Unable to save image.");
                            return;
                        }
                        showDashboardAlert(data.message || "Image successfully updated.");
                    })
                    .catch(() => {
                        showDashboardAlert("Unable to save image.");
                    });
            };

            img.src = dataUrl;
        };

        reader.readAsDataURL(file);
    });
}

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

function setButtonState(button, isEnabled) {
    button.classList.toggle("enabled", isEnabled);
    button.classList.toggle("disabled", !isEnabled);
}

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

    try {
        const response = await fetch("/cms/services", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            showDashboardAlert(data.message || messageFallback);
            return null;
        }

        if (data?.service?.id) {
            serviceMeta.dataset.serviceId = String(data.service.id);
        }
        if (data?.service?.order !== undefined && data?.service?.order !== null) {
            serviceMeta.dataset.serviceOrder = String(data.service.order);
        }

        showDashboardAlert(data.message || "Service successfully updated.");
        return {
            name: serviceName,
            price: servicePrice,
            details: serviceDetails
        };
    } catch (error) {
        showDashboardAlert(messageFallback);
        return null;
    }
}

document.querySelectorAll(".service").forEach((service) => {
    service.querySelectorAll(".service-name, .service-price, .service-details").forEach((el) => {
        el.setAttribute("contenteditable", "true");
    });

    const serviceDetails = service.querySelector(".service-details");
    if (!serviceDetails) return;

    applyServiceDetailPlaceholder(serviceDetails);

    serviceDetails.addEventListener("focus", () => {
        clearServiceDetailPlaceholder(serviceDetails);
    });

    serviceDetails.addEventListener("blur", () => {
        applyServiceDetailPlaceholder(serviceDetails);
    });
});

document.querySelectorAll(".save-changes").forEach((button) => {
    const service = button.closest(".service");
    if (!service) return;

    const serviceName = service.querySelector(".service-name");
    const servicePrice = service.querySelector(".service-price");
    const serviceDetails = service.querySelector(".service-details");
    if (!serviceName || !servicePrice) return;

    const initialState = {
        name: serviceName.textContent,
        price: servicePrice.textContent,
        details: normalizeServiceDetails(serviceDetails)
    };

    const updateState = () => {
        const normalizedDetails = normalizeServiceDetails(serviceDetails);
        const changed =
            serviceName.textContent !== initialState.name ||
            servicePrice.textContent !== initialState.price ||
            normalizedDetails !== initialState.details;

        setButtonState(button, changed);
    };

    [serviceName, servicePrice, serviceDetails].filter(Boolean).forEach((el) => {
        ["input", "blur", "keyup"].forEach((evt) => {
            el.addEventListener(evt, updateState);
        });
    });

    setButtonState(button, false);

    button.addEventListener("click", async (event) => {
        const isEnabled = button.classList.contains("enabled");
        if (!isEnabled) {
            event.preventDefault();
            return;
        }

        const savedState = await sendServiceUpdate(service, "Unable to save service changes.");
        if (!savedState) {
            return;
        }

        initialState.name = savedState.name;
        initialState.price = savedState.price;
        initialState.details = savedState.details;
        setButtonState(button, false);
    });
});

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