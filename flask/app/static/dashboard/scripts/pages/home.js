import { showDashboardAlert } from "../alert.js";

const replaceAboutImagesButton = document.getElementById("replaceAboutImagesButton");
const replaceVideoButton = document.getElementById("replaceVideoButton");
const replaceTeamPhotoButton = document.getElementById("replaceTeamPhotoButton");
const replaceBridalImagesButton = document.getElementById("replaceBridalImagesButton");

const aboutGalleryUploadInput = document.getElementById("aboutGalleryUploadInput");
const salonVideoInput = document.getElementById("salonVideoInput");
const teamPhotoUploadInput = document.getElementById("teamPhotoUploadInput");
const bridalGalleryUploadInput = document.getElementById("bridalGalleryUploadInput");

const aboutGalleryContainer = document.getElementById("galleryImgs");
const bridalGalleryContainer = document.getElementById("bridalImageGrid");



const MAX_IMAGE_BYTES = 1 * 1024 * 1024;
const MAX_VIDEO_BYTES = 75 * 1024 * 1024;
const ASPECT_TOLERANCE = 0.02;


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

function checkAspectRatio(meta, targetRatio, tolerance = ASPECT_TOLERANCE) {
    if (!meta?.width || !meta?.height) {
        return null;
    }
    const ratio = meta.height ? meta.width / meta.height : 0;
    return Math.abs(ratio - targetRatio) <= tolerance;
}

function validateMeta(meta, config) {
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

function handleGallerySelection(container) {
    if (!container) return;
    container.querySelectorAll(".gallery-item").forEach((item) => {
        item.addEventListener("click", () => {
            const marker = item.querySelector(".img-selected");
            if (!marker) return;
            const isShown = getComputedStyle(marker).display === "block";
            if (isShown) {
                marker.style.display = "none";
            } else {
                marker.style.display = "block";
            }
        });
    });
}

function sendTextUpdate(endpoint, block, messageFallback) {
    return async () => {
        const heading = block?.querySelector("h1")?.textContent || "";
        const text = block?.querySelector("p")?.textContent || "";

        try {
            const response = await fetch(endpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    heading,
                    text
                })
            });

            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                showDashboardAlert(data.message || messageFallback);
                return;
            }

            showDashboardAlert(data.message || messageFallback);
        } catch (error) {
            showDashboardAlert(messageFallback);
        }
    };
}

function sendStaticUpdate(endpoint, payload, messageFallback, onSuccess) {
    return fetch(endpoint, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            ...payload
        })
    })
        .then(async (response) => {
            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                showDashboardAlert(data.message || messageFallback);
                return;
            }
            if (onSuccess) {
                onSuccess();
            }
            showDashboardAlert(data.message || messageFallback);
        })
        .catch(() => {
            showDashboardAlert(messageFallback);
        });
}

function handleGalleryReplacement(options) {
    const {
        button,
        input,
        container,
        endpoint,
        maxCount,
        onSuccess,
        warningsConfig
    } = options;

    if (!button || !input || !container) return;

    button.addEventListener("click", () => {
        const selectedItems = Array.from(container.querySelectorAll(".img-selected"))
            .filter((marker) => getComputedStyle(marker).display === "block")
            .map((marker) => marker.closest(".gallery-item"))
            .filter(Boolean);

        if (selectedItems.length === 0) {
            return;
        }

        input.dataset.replaceCount = String(selectedItems.length);
        input.click();
    });

        input.addEventListener("change", () => {
        const files = Array.from(input.files || []);
        if (files.length === 0) {
            return;
        }

        const selectedItems = Array.from(container.querySelectorAll(".img-selected"))
            .filter((marker) => getComputedStyle(marker).display === "block")
            .map((marker) => marker.closest(".gallery-item"))
            .filter(Boolean);

        const limitedItems = selectedItems.slice(0, maxCount || files.length);
        const updates = [];
        let hasInvalidFiles = false;
        let warningMessage = "";

        Promise.all(
            limitedItems.map((item, index) => {
                const img = item?.querySelector(".gallery-img");
                const placeholder = item?.querySelector(".img-placeholder");
                const file = files[index];
                if (!img || !file) {
                    return null;
                }

                const reader = new FileReader();
                const image = new Image();

                return new Promise((resolve) => {
                    reader.onload = () => {
                        const dataUrl = reader.result;
                        image.onload = () => {
                            const meta = {
                                size_bytes: file.size,
                                width: image.width,
                                height: image.height
                            };
                            const violation = validateMeta(meta, warningsConfig);
                            if (violation) {
                                hasInvalidFiles = true;
                                warningMessage = violation;
                                resolve();
                                return;
                            }

                            img.src = dataUrl;
                            img.removeAttribute("data-src");
                            img.classList.add("loaded");
                            if (placeholder) {
                                placeholder.classList.add("fade-out");
                            }

                            const allItems = Array.from(container.querySelectorAll(".gallery-item"));
                            const itemIndex = allItems.indexOf(item);
                            if (itemIndex >= 0) {
                                updates.push({
                                    index: itemIndex + 1,
                                    data: dataUrl,
                                    ...meta
                                });
                            }
                            resolve();
                        };
                        image.src = dataUrl;
                    };

                    reader.readAsDataURL(file);
                });
            })
        ).then(() => {
            if (hasInvalidFiles) {
                showDashboardAlert(warningMessage || "Image formatting is not supported.");
                return;
            }
            if (updates.length === 0) {
                return;
            }

            sendStaticUpdate(
                endpoint,
                { gallery_images: updates },
                "Unable to save images.",
                () => {
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
                    if (onSuccess) {
                        onSuccess();
                    }
                }
            );
        });
    });
}

function handleSingleMediaReplacement(options) {
    const { button, input, previewSelector, endpoint, mediaType, warningsConfig } = options;
    if (!button || !input) return;

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
            const meta = { data: dataUrl, size_bytes: file.size };

            if (mediaType === "image") {
                const img = new Image();
                img.onload = () => {
                    meta.width = img.width;
                    meta.height = img.height;
                    const violation = validateMeta(meta, warningsConfig);
                    if (violation) {
                        showDashboardAlert(violation);
                        return;
                    }
                    if (previewEl && previewEl.tagName === "IMG") {
                        previewEl.src = dataUrl;
                    }
                    sendStaticUpdate(
                        endpoint,
                        { static_content: meta },
                        "Unable to save image.",
                        null
                    );
                };
                img.src = dataUrl;
            } else if (mediaType === "video") {
                const video = document.createElement("video");
                video.onloadedmetadata = () => {
                    meta.width = video.videoWidth;
                    meta.height = video.videoHeight;
                    const violation = validateMeta(meta, warningsConfig);
                    if (violation) {
                        showDashboardAlert(violation);
                        return;
                    }
                    if (previewEl && previewEl.tagName === "VIDEO") {
                        previewEl.src = dataUrl;
                    }
                    sendStaticUpdate(
                        endpoint,
                        { static_content: meta },
                        "Unable to save video.",
                        null
                    );
                };
                video.src = dataUrl;
            }
        };

        reader.readAsDataURL(file);
    });
}
document.querySelectorAll(".edit-text-block").forEach((block) => {
    block.querySelectorAll("h1, p").forEach((el) => {
        el.setAttribute("contenteditable", "true");
    });
});

[aboutGalleryContainer, bridalGalleryContainer].forEach((container) => {
    if (container) handleGallerySelection(container);
});

const textEndpoints = {
    saveMissionStatement: "/cms/home/about",
    saveServicesStatement: "/cms/home/services",
    saveStylistsStatement: "/cms/home/stylists",
    saveBridalStatement: "/cms/home/bridal"
};

document.querySelectorAll(".save-changes").forEach((button) => {
    const endpoint = textEndpoints[button.id];
    if (!endpoint) return;

    const block = button.closest(".container-vertical")?.querySelector(".edit-text-block");
    if (!block) return;

    button.addEventListener("click", sendTextUpdate(endpoint, block, "Unable to save changes."));
});

handleGalleryReplacement({
    button: replaceAboutImagesButton,
    input: aboutGalleryUploadInput,
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

handleSingleMediaReplacement({
    button: replaceVideoButton,
    input: salonVideoInput,
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

handleSingleMediaReplacement({
    button: replaceTeamPhotoButton,
    input: teamPhotoUploadInput,
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

handleGalleryReplacement({
    button: replaceBridalImagesButton,
    input: bridalGalleryUploadInput,
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