const pagesMenuToggle = document.getElementById("pagesMenuToggle");
const pagesMenu = document.getElementById("pagesMenu");
const pagesMenuContainer = document.querySelector(".pages-menu-container");
let pagesMenuOpen = false;

function openPagesMenu() {
    if (!pagesMenu) {
        return;
    }

    pagesMenu.style.display = "block";
    requestAnimationFrame(() => {
        pagesMenu.style.opacity = "1";
    });
    pagesMenuOpen = true;
}

function closePagesMenu() {
    if (!pagesMenu) {
        return;
    }

    pagesMenu.style.opacity = "0";
    const handleTransitionEnd = () => {
        pagesMenu.style.display = "none";
        pagesMenu.removeEventListener("transitionend", handleTransitionEnd);
    };
    pagesMenu.addEventListener("transitionend", handleTransitionEnd);
    pagesMenuOpen = false;
}

if (pagesMenuToggle) {
    pagesMenuToggle.addEventListener("click", (event) => {
        event.stopPropagation();
        if (pagesMenuOpen) {
            closePagesMenu();
        } else {
            openPagesMenu();
        }
    });
}

document.addEventListener("click", (event) => {
    if (!pagesMenuOpen) {
        return;
    }

    if (pagesMenuContainer && pagesMenuContainer.contains(event.target)) {
        return;
    }

    closePagesMenu();
});
