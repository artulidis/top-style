import { showDashboardAlert } from "../alert.js";

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

function setButtonState(button, isEnabled) {
	button.classList.toggle("enabled", isEnabled);
	button.classList.toggle("disabled", !isEnabled);
}

async function addStylist(name, bio, image) {
	try {
		const response = await fetch("/cms/stylists/add", {
			method: "POST",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify({
				name,
				bio,
				image
			})
		});

		const data = await response.json().catch(() => ({}));
		showDashboardAlert(data.message || "Unable to add stylist.");

		return response.ok;
	} catch (error) {
		showDashboardAlert("Unable to add stylist.");
		return false;
	}
}

async function sendSingleStylistUpdate(stylistCard, fallbackMessage) {
	const name = stylistCard.querySelector(".stylist-name")?.textContent?.trim() || "";
	const bio = stylistCard.querySelector(".stylist-bio")?.textContent?.trim() || "";
	const image = stylistCard.querySelector(".stylist-image-preview")?.getAttribute("src") || "";
	const rawId = stylistCard.dataset.stylistId;
	const rawOrder = stylistCard.dataset.stylistOrder;
	const parsedOrder = Number(rawOrder);

	if (!name) {
		showDashboardAlert("Stylist name is required.");
		return null;
	}

	if (!rawOrder || Number.isNaN(parsedOrder)) {
		showDashboardAlert("Stylist order is missing.");
		return null;
	}

	const payload = { name, bio, image, order: parsedOrder };
	if (rawId) {
		const parsedId = Number(rawId);
		if (!Number.isNaN(parsedId)) {
			payload.id = parsedId;
		}
	}

	try {
		const response = await fetch("/cms/stylists", {
			method: "POST",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify(payload)
		});

		const data = await response.json().catch(() => ({}));
		if (!response.ok) {
			showDashboardAlert(data.message || fallbackMessage);
			return null;
		}

		if (data?.stylist?.id) {
			stylistCard.dataset.stylistId = String(data.stylist.id);
		}
		if (data?.stylist?.order !== undefined && data?.stylist?.order !== null) {
			stylistCard.dataset.stylistOrder = String(data.stylist.order);
		}

		showDashboardAlert(data.message || "Stylist successfully updated.");
		return {
			name,
			bio,
			image,
			order: parsedOrder
		};
	} catch (error) {
		showDashboardAlert(fallbackMessage);
		return null;
	}
}

async function removeSingleStylist(stylistCard) {
	if (!stylistCard) return;

	const idRaw = stylistCard.dataset.stylistId;
	const orderRaw = stylistCard.dataset.stylistOrder;
	const name = stylistCard.querySelector(".stylist-name")?.textContent?.trim() || "";

	const payload = {
		name,
		order: orderRaw ? Number(orderRaw) : null
	};

	if (idRaw) {
		const parsedId = Number(idRaw);
		if (!Number.isNaN(parsedId)) {
			payload.id = parsedId;
		}
	}

	try {
		const response = await fetch("/cms/stylists/remove", {
			method: "POST",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify(payload)
		});

		const data = await response.json().catch(() => ({}));
		if (!response.ok) {
			showDashboardAlert(data.message || "Unable to remove stylist.");
			return;
		}

		stylistCard.remove();
		showDashboardAlert(data.message || "Stylist successfully removed.");
	} catch (error) {
		showDashboardAlert("Unable to remove stylist.");
	}
}

function readImageFile(file) {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();

		reader.onload = () => {
			const dataUrl = reader.result;
			const img = new Image();

			img.onload = () => {
				resolve({
					dataUrl,
					meta: {
						size_bytes: file.size,
						width: img.width,
						height: img.height
					}
				});
			};

			img.onerror = () => reject(new Error("Unable to read image."));
			img.src = dataUrl;
		};

		reader.onerror = () => reject(new Error("Unable to read image."));
		reader.readAsDataURL(file);
	});
}

async function replaceStylistPhoto(stylistId, file, stylistCard) {
	if (!file || !stylistCard) return;

	const parsedId = Number(stylistId);
	if (Number.isNaN(parsedId)) {
		showDashboardAlert("Stylist id is invalid.");
		return;
	}

	try {
		const { dataUrl, meta } = await readImageFile(file);
		const violation = validateImageMeta(meta);
		if (violation) {
			showDashboardAlert(violation);
			return;
		}

		const response = await fetch("/cms/stylists/image", {
			method: "POST",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify({
				id: parsedId,
				image: dataUrl
			})
		});

		const data = await response.json().catch(() => ({}));
		if (!response.ok) {
			showDashboardAlert(data.message || "Unable to save stylist photo.");
			return;
		}

		const imageEl = stylistCard.querySelector(".stylist-image-preview");
		if (imageEl) {
			imageEl.src = data?.stylist?.image || dataUrl;
		}

		showDashboardAlert(data.message || "Stylist photo successfully updated.");
	} catch (error) {
		showDashboardAlert("Unable to process image.");
	}
}

const addStylistForm = document.querySelector("#addStylistForm");
const addStylistButton = document.querySelector("#addStylistButton");
const stylistNameInput = document.querySelector("#stylistName");
const stylistBioInput = document.querySelector("#stylistBio");

if (addStylistForm && addStylistButton && stylistNameInput && stylistBioInput) {
	const addStylistPhotoInput = document.createElement("input");
	addStylistPhotoInput.type = "file";
	addStylistPhotoInput.accept = "image/*";
	addStylistPhotoInput.hidden = true;
	addStylistPhotoInput.id = "addStylistPhotoInput";
	addStylistForm.appendChild(addStylistPhotoInput);

	addStylistButton.addEventListener("click", (event) => {
		event.preventDefault();

		const name = stylistNameInput.value.trim();
		const bio = stylistBioInput.value.trim();

		if (!name) {
			showDashboardAlert("Stylist name is required.");
			return;
		}

		if (!bio) {
			showDashboardAlert("Stylist bio is required.");
			return;
		}

		addStylistPhotoInput.value = "";
		addStylistPhotoInput.click();
	});

	addStylistPhotoInput.addEventListener("change", async () => {
		const file = (addStylistPhotoInput.files || [])[0];
		if (!file) {
			return;
		}

		try {
			const { dataUrl, meta } = await readImageFile(file);
			const violation = validateImageMeta(meta);
			if (violation) {
				showDashboardAlert(violation);
				return;
			}

			const created = await addStylist(
				stylistNameInput.value.trim(),
				stylistBioInput.value.trim(),
				dataUrl
			);

			if (created) {
				stylistNameInput.value = "";
				stylistBioInput.value = "";
			}
		} catch (error) {
			showDashboardAlert("Unable to process image.");
		}
	});
}

document.querySelectorAll(".stylist-editor").forEach((stylistCard) => {
	const saveButton = stylistCard.querySelector(".save-changes");
	const nameEl = stylistCard.querySelector(".stylist-name");
	const bioEl = stylistCard.querySelector(".stylist-bio");
	const imageEl = stylistCard.querySelector(".stylist-image-preview");
	const removeButton = stylistCard.querySelector(".remove-stylist");
	const replacePhotoButton = stylistCard.querySelector(".replace-stylist-photo-button");
	const photoInput = stylistCard.querySelector(".stylist-photo-input");

	if (!saveButton || !nameEl || !bioEl || !imageEl) {
		return;
	}

	bioEl.setAttribute("contenteditable", "true");

	const initialState = {
		bio: bioEl.textContent
	};

	const updateState = () => {
		const changed = bioEl.textContent !== initialState.bio;

		setButtonState(saveButton, changed);
	};

	[bioEl].forEach((el) => {
		["input", "blur", "keyup"].forEach((evt) => {
			el.addEventListener(evt, updateState);
		});
	});

	setButtonState(saveButton, false);

	saveButton.addEventListener("click", async (event) => {
		const isEnabled = saveButton.classList.contains("enabled");
		if (!isEnabled) {
			event.preventDefault();
			return;
		}

		const saved = await sendSingleStylistUpdate(stylistCard, "Unable to save stylist changes.");
		if (!saved) {
			return;
		}

		initialState.bio = saved.bio;
		setButtonState(saveButton, false);
	});

	if (removeButton) {
		removeButton.addEventListener("click", async () => {
			await removeSingleStylist(stylistCard);
		});
	}

	if (replacePhotoButton && photoInput) {
		replacePhotoButton.addEventListener("click", () => {
			photoInput.click();
		});

		photoInput.addEventListener("change", async () => {
			const file = (photoInput.files || [])[0];
			await replaceStylistPhoto(stylistCard.dataset.stylistId, file, stylistCard);
		});
	}
});
