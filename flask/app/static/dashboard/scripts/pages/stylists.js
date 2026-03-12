import { showDashboardAlert } from "../alert.js";
import { validateImageMeta } from "../lib/validation.js";
import { readImageFile } from "../lib/media.js";
import { makeEditable, trackChanges } from "../lib/editor.js";
import { cmsRequest, cmsUpload } from "../lib/api.js";

// ---------------------------------------------------------------------------
// Stylist CRUD helpers
// ---------------------------------------------------------------------------
async function addStylist(name, bio, file) {
	const formData = new FormData();
	formData.append("name", name);
	formData.append("bio", bio);
	formData.append("file", file);

	const { ok } = await cmsUpload("/cms/stylists", formData, "Unable to add stylist.");
	return ok;
}

async function sendSingleStylistUpdate(stylistCard, fallbackMessage) {
	const name = stylistCard.querySelector(".stylist-name")?.textContent?.trim() || "";
	const bio = stylistCard.querySelector(".stylist-bio")?.textContent?.trim() || "";
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

	const payload = { name, bio, order: parsedOrder };
	if (rawId) {
		const parsedId = Number(rawId);
		if (!Number.isNaN(parsedId)) {
			payload.id = parsedId;
		}
	}

	const { ok, data } = await cmsRequest("/cms/stylists", payload, fallbackMessage);
	if (!ok) return null;

	if (data?.stylist?.id) {
		stylistCard.dataset.stylistId = String(data.stylist.id);
	}
	if (data?.stylist?.order !== undefined && data?.stylist?.order !== null) {
		stylistCard.dataset.stylistOrder = String(data.stylist.order);
	}

	return { name, bio };
}

async function removeSingleStylist(stylistCard) {
	if (!stylistCard) return;

	const idRaw = stylistCard.dataset.stylistId;
	if (!idRaw) {
		showDashboardAlert("Stylist id is missing.");
		return;
	}

	const parsedId = Number(idRaw);
	if (Number.isNaN(parsedId)) {
		showDashboardAlert("Stylist id is invalid.");
		return;
	}

	const { ok } = await cmsRequest("/cms/stylists/remove", { id: parsedId }, "Unable to remove stylist.");
	if (ok) {
		stylistCard.remove();
	}
}

// ---------------------------------------------------------------------------
// Stylist photo replacement
// ---------------------------------------------------------------------------
async function replaceStylistPhoto(stylistId, file, stylistCard) {
	if (!file || !stylistCard) return;

	const parsedId = Number(stylistId);
	if (Number.isNaN(parsedId)) {
		showDashboardAlert("Stylist id is invalid.");
		return;
	}

	try {
		const { previewUrl, meta } = await readImageFile(file);
		const violation = validateImageMeta(meta);
		if (violation) {
			showDashboardAlert(violation);
			return;
		}

		const formData = new FormData();
		formData.append("id", String(parsedId));
		formData.append("file", file);

		const { ok, data } = await cmsUpload(
			"/cms/stylists/image",
			formData,
			"Unable to save stylist photo."
		);

		if (ok) {
			const imageEl = stylistCard.querySelector(".stylist-image-preview");
			if (imageEl) {
				imageEl.src = data?.stylist?.image || previewUrl;
			}
		}
	} catch (err) {
		showDashboardAlert("Unable to process image.");
	}
}

// ---------------------------------------------------------------------------
// Add stylist form (two-phase: validate text -> pick image -> submit)
// ---------------------------------------------------------------------------
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
		if (!file) return;

		try {
			const { previewUrl, meta } = await readImageFile(file);
			const violation = validateImageMeta(meta);
			if (violation) {
				showDashboardAlert(violation);
				return;
			}

			const created = await addStylist(
				stylistNameInput.value.trim(),
				stylistBioInput.value.trim(),
				file
			);

			if (created) {
				stylistNameInput.value = "";
				stylistBioInput.value = "";
			}
		} catch (err) {
			showDashboardAlert("Unable to process image.");
		}
	});
}

// ---------------------------------------------------------------------------
// Existing stylist editors - change tracking + save + remove + photo replace
// ---------------------------------------------------------------------------
document.querySelectorAll(".stylist-editor").forEach((stylistCard) => {
	const saveButton = stylistCard.querySelector(".save-changes");
	const nameEl = stylistCard.querySelector(".stylist-name");
	const bioEl = stylistCard.querySelector(".stylist-bio");
	const imageEl = stylistCard.querySelector(".stylist-image-preview");
	const removeButton = stylistCard.querySelector(".remove-stylist");
	const replacePhotoButton = stylistCard.querySelector(".replace-stylist-photo-button");
	const photoInput = stylistCard.querySelector(".stylist-photo-input");

	if (!saveButton || !nameEl || !bioEl || !imageEl) return;

	// Make bio editable
	makeEditable(".stylist-bio", stylistCard);

	// Track changes on bio (and name if it's contenteditable)
	trackChanges({
		container: stylistCard,
		saveButton,
		elements: [bioEl],
		getStateFn: () => ({ bio: bioEl.textContent }),
		onSave: async () => {
			const saved = await sendSingleStylistUpdate(stylistCard, "Unable to save stylist changes.");
			return saved ? { bio: saved.bio } : null;
		}
	});

	// Remove button
	if (removeButton) {
		removeButton.addEventListener("click", async () => {
			await removeSingleStylist(stylistCard);
		});
	}

	// Replace photo button
	if (replacePhotoButton && photoInput) {
		replacePhotoButton.addEventListener("click", () => photoInput.click());

		photoInput.addEventListener("change", async () => {
			const file = (photoInput.files || [])[0];
			await replaceStylistPhoto(stylistCard.dataset.stylistId, file, stylistCard);
		});
	}
});
