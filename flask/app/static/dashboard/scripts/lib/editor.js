/**
 * Toggles a button between enabled/disabled states via CSS classes.
 *
 * @param {HTMLElement} button
 * @param {boolean}     isEnabled
 */
export function setButtonState(button, isEnabled) {
	button.classList.toggle("enabled", isEnabled);
	button.classList.toggle("disabled", !isEnabled);
}

/**
 * Makes all elements matching `selector` within `scope` contenteditable.
 *
 * @param {string}      selector - CSS selector for target elements
 * @param {HTMLElement}  [scope=document] - Root element to query within
 */
export function makeEditable(selector, scope = document) {
	scope.querySelectorAll(selector).forEach((el) => {
		el.setAttribute("contenteditable", "true");
	});
}

/**
 * Tracks changes to contenteditable elements and toggles a save button.
 *
 * Captures the initial state via `getStateFn`, then listens for input/blur/keyup
 * events on the tracked elements and enables the save button when the state differs.
 *
 * When the save button is clicked (and enabled), calls `onSave` and expects it to
 * return the new "saved" state (or null/undefined on failure). On success the
 * initial state is reset and the button is disabled again.
 *
 * @param {object}   options
 * @param {HTMLElement}   options.container  - Wrapper element containing the editable fields and save button
 * @param {HTMLElement}   options.saveButton - The save-changes button
 * @param {HTMLElement[]} options.elements   - Editable elements to watch for changes
 * @param {function():object} options.getStateFn - Returns the current state snapshot (plain object)
 * @param {function():Promise<object|null>} options.onSave - Async callback invoked on save; return new state or null on failure
 */
export function trackChanges({ container, saveButton, elements, getStateFn, onSave }) {
	if (!saveButton || !elements.length) return;

	let initialState = getStateFn();

	const updateState = () => {
		const current = getStateFn();
		const changed = Object.keys(initialState).some(
			(key) => current[key] !== initialState[key]
		);
		setButtonState(saveButton, changed);
	};

	elements.filter(Boolean).forEach((el) => {
		["input", "blur", "keyup"].forEach((evt) => {
			el.addEventListener(evt, updateState);
		});
	});

	setButtonState(saveButton, false);

	saveButton.addEventListener("click", async (event) => {
		const isEnabled = saveButton.classList.contains("enabled");
		if (!isEnabled) {
			event.preventDefault();
			event.stopImmediatePropagation();
			return;
		}

		const savedState = await onSave();
		if (!savedState) return;

		initialState = savedState;
		setButtonState(saveButton, false);
	});
}
