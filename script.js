(() => {
  "use strict";

  const qs = (selector, scope = document) => scope.querySelector(selector);
  const qsa = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

  const getServerIP = () =>
    document.body.dataset.serverIp ||
    qs("[data-server-ip]")?.textContent?.trim() ||
    "";

  const initNavActive = () => {
    const page = document.body.getAttribute("data-page");
    if (!page) return;
    qsa(".nav-link").forEach((link) => {
      if (link.getAttribute("data-page") === page) {
        link.classList.add("active");
      }
    });
  };

  const updateTitle = () => {
    const serverName = qs("[data-server-name]")?.textContent?.trim() || "MineSkull";
    const page = document.body.getAttribute("data-page");
    const labels = {
      home: "Home",
      features: "Features",
      team: "Team",
      join: "Join"
    };
    if (page && labels[page]) {
      document.title = `${serverName} | ${labels[page]}`;
    }
  };

  const initCopyButtons = () => {
    document.addEventListener("click", async (event) => {
      const trigger = event.target.closest("[data-copy-ip]");
      if (!trigger) return;

      const ip = getServerIP();
      if (!ip) return;

      let copied = false;
      const secureClipboard = window.isSecureContext && navigator.clipboard?.writeText;

      let input = document.getElementById("copy-helper-input");
      if (!input) {
        input = document.createElement("textarea");
        input.id = "copy-helper-input";
        input.setAttribute("readonly", "");
        input.style.position = "fixed";
        input.style.opacity = "0";
        input.style.pointerEvents = "none";
        input.style.zIndex = "-1";
        document.body.appendChild(input);
      }

      input.value = ip;
      input.focus({ preventScroll: true });
      input.select();

      try {
        if (secureClipboard) {
          await navigator.clipboard.writeText(ip);
          copied = true;
        } else {
          copied = document.execCommand("copy");
        }
      } catch (error) {
        copied = document.execCommand("copy");
      }

      const fallbackField = trigger.closest(".join-copy")?.querySelector(".copy-fallback");
      if (!copied && fallbackField) {
        fallbackField.classList.add("is-visible");
        const fallbackInput = fallbackField.querySelector(".copy-fallback-input");
        if (fallbackInput) {
          fallbackInput.value = ip;
          fallbackInput.focus({ preventScroll: true });
          fallbackInput.select();
        }
      }

      showToast(copied ? "Copied to clipboard" : "Copy blocked. IP selected.");
    });

    document.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      const focused = document.activeElement?.closest?.("[data-copy-ip]");
      if (!focused) return;
      event.preventDefault();
      focused.click();
    });
  };

  const showToast = (message) => {
    let toast = qs("#toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "toast";
      toast.className = "toast";
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toast._hideTimer);
    toast._hideTimer = setTimeout(() => {
      toast.classList.remove("show");
    }, 1600);
  };

  const initCookieBanner = () => {
    const key = "ms_cookie_consent";
    if (localStorage.getItem(key) === "accepted") return;

    const banner = document.createElement("div");
    banner.className = "cookie-banner";
    banner.innerHTML = `
      <div class="cookie-text">We use cookies to improve your experience. By continuing, you agree to our cookie policy.</div>
      <div class="cookie-actions">
        <button class="btn btn-primary" type="button">Accept</button>
      </div>
    `;
    document.body.appendChild(banner);

    const acceptButton = banner.querySelector("button");
    acceptButton.addEventListener("click", () => {
      localStorage.setItem(key, "accepted");
      banner.remove();
    });
  };

  const loadServerStatus = async () => {
    const container = qs("#server-status");
    if (!container) return;

    const statusText = qs("#status-text", container);
    const playerText = qs("#status-players", container);
    const versionText = qs("#status-version", container);
    const dot = qs("#status-dot", container);
    const onlineBadge = qs("#status-online", container);
    const offlineBadge = qs("#status-offline", container);

    try {
      const response = await fetch(
        `https://api.mcsrvstat.us/2/${encodeURIComponent(getServerIP())}`
      );
      const data = await response.json();
      const online = Boolean(data?.online);

      statusText.textContent = online ? "Online" : "Offline";
      dot?.classList.toggle("online", online);
      dot?.classList.toggle("offline", !online);
      onlineBadge?.classList.toggle("active", online);
      offlineBadge?.classList.toggle("active", !online);

      const onlineCount = data?.players?.online;
      const maxCount = data?.players?.max;
      if (typeof onlineCount === "number") {
        playerText.textContent =
          typeof maxCount === "number" ? `${onlineCount} / ${maxCount}` : `${onlineCount}`;
      } else {
        playerText.textContent = "--";
      }

      versionText.textContent = data?.version || "--";
    } catch (error) {
      statusText.textContent = "Unavailable";
      playerText.textContent = "--";
      versionText.textContent = "--";
      dot?.classList.remove("online", "offline");
      onlineBadge?.classList.remove("active");
      offlineBadge?.classList.remove("active");
    }
  };

  const initAutoRevealTargets = () => {
    const selectors = [".section-header", ".hero-content", ".ip-bar", ".status-card", ".steps li"];
    selectors.forEach((selector) => {
      qsa(selector).forEach((el) => el.classList.add("reveal"));
    });
  };

  const initPageLinks = () => {
    qsa("a[href]").forEach((link) => {
      const href = link.getAttribute("href");
      if (!href) return;
      if (href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;
      if (href.startsWith("http")) return;
      if (link.target === "_blank") return;

      link.addEventListener("click", (event) => {
        if (event.defaultPrevented || event.button !== 0) return;
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        document.body.classList.add("page-exit");
        setTimeout(() => {
          window.location.href = href;
        }, 250);
      });
    });
  };

  const initFlipGuards = () => {
    qsa(".click-to-copy").forEach((panel) => {
      const card = panel.closest(".join-copy")?.querySelector(".flip-card");
      if (!card) return;
      panel.addEventListener("mouseenter", () => card.classList.add("no-flip"));
      panel.addEventListener("mouseleave", () => card.classList.remove("no-flip"));
      panel.addEventListener("focusin", () => card.classList.add("no-flip"));
      panel.addEventListener("focusout", () => card.classList.remove("no-flip"));
    });
  };

  const initReveal = () => {
    const items = qsa(".reveal");
    if (!items.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    items.forEach((item) => observer.observe(item));
  };

  document.addEventListener("DOMContentLoaded", () => {
    initNavActive();
    updateTitle();
    initCopyButtons();
    loadServerStatus();
    initAutoRevealTargets();
    initPageLinks();
    initReveal();
    initCookieBanner();
    initFlipGuards();
    requestAnimationFrame(() => {
      document.body.classList.add("page-loaded");
    });
  });
})();
