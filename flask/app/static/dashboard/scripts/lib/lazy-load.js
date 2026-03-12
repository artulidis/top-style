/**
 * Observes `.lazy` images with an IntersectionObserver.
 * When an image enters the viewport it loads the real source from `data-src`,
 * adds a `.loaded` class, and fades out the preceding placeholder element.
 *
 * Call once on DOMContentLoaded (or at the end of the body).
 *
 * @param {string} [selector=".lazy"] - CSS selector for lazy images
 */
export function initLazyLoad(selector = ".lazy") {
	const lazyImages = document.querySelectorAll(selector);
	if (!lazyImages.length) return;

	const observer = new IntersectionObserver(
		(entries, obs) => {
			entries.forEach((entry) => {
				if (!entry.isIntersecting) return;

				const img = entry.target;
				const placeholder = img.previousElementSibling;

				img.src = img.getAttribute("data-src");
				img.onload = () => {
					img.classList.add("loaded");
					if (placeholder) {
						placeholder.classList.add("fade-out");
					}
				};

				obs.unobserve(img);
			});
		},
		{ rootMargin: "100px 0px", threshold: 0.1 }
	);

	lazyImages.forEach((img) => observer.observe(img));
}
