document.addEventListener("DOMContentLoaded", () => {
    const hamburger = document.getElementById("hamburgerMenu");
    const menu = document.getElementById("mobileMenu");
    const overlay = document.createElement("div");
    const navItems = menu.querySelectorAll("li");
    overlay.id = "menuOverlay";
    document.body.appendChild(overlay);

    const closeBtn = document.getElementById("menuClose");

    function openMenu() {
        menu.classList.add("open");
        overlay.classList.add("open");
        document.body.style.overflow = "hidden";
    }

    function closeMenu() {
        menu.classList.remove("open");
        overlay.classList.remove("open");
        document.body.style.overflow = "";
    }

    hamburger.addEventListener("click", openMenu);
    closeBtn.addEventListener("click", closeMenu);
    overlay.addEventListener("click", closeMenu);
    navItems.forEach((i) => i.addEventListener("click", closeMenu))
});
