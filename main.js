// Shared navigation. Page content and links remain available without JavaScript.
document.documentElement.classList.add("js");
const toggle = document.querySelector(".nav-toggle");
const navLinks = document.querySelector(".nav-links");

if (toggle && navLinks) {
  const closeMenu = ({ restoreFocus = false } = {}) => {
    navLinks.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Open navigation");
    if (restoreFocus) toggle.focus();
  };
  toggle.addEventListener("click", () => {
    const open = toggle.getAttribute("aria-expanded") !== "true";
    navLinks.classList.toggle("open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute(
      "aria-label",
      open ? "Close navigation" : "Open navigation",
    );
  });
  navLinks.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => closeMenu());
    const url = new URL(link.href);
    if (
      url.origin === location.origin &&
      url.pathname === location.pathname &&
      !url.hash
    ) {
      link.setAttribute("aria-current", "page");
    }
  });
  document.addEventListener("click", (event) => {
    if (!event.target.closest(".nav-inner")) closeMenu();
  });
  document.addEventListener("keydown", (event) => {
    if (
      event.key === "Escape" &&
      toggle.getAttribute("aria-expanded") === "true"
    ) {
      closeMenu({ restoreFocus: true });
    }
  });
  window.matchMedia("(min-width: 761px)").addEventListener("change", () => {
    closeMenu({
      restoreFocus:
        navLinks.contains(document.activeElement) && window.innerWidth <= 760,
    });
  });
}

document.querySelectorAll("[data-year]").forEach((element) => {
  element.textContent = String(new Date().getFullYear());
});
