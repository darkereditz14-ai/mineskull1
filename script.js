(() => {
  "use strict";

  const qs = (selector, scope = document) => scope.querySelector(selector);
  const qsa = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

  const setTextAll = (selector, value) => {
    qsa(selector).forEach((el) => {
      el.textContent = value;
    });
  };

  const setHrefAll = (selector, value) => {
    qsa(selector).forEach((el) => {
      el.setAttribute("href", value);
    });
  };

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
    if (!window.CONFIG) return;
    const page = document.body.getAttribute("data-page");
    const labels = {
      home: "Home",
      features: "Features",
      team: "Team",
      join: "Join"
    };
    if (page && labels[page]) {
      document.title = `${window.CONFIG.serverName} | ${labels[page]}`;
    }
  };

  const initConfigBindings = () => {
    if (!window.CONFIG) return;
    const { serverName, serverIP, version, discord, copyright } = window.CONFIG;
    setTextAll("[data-server-name]", serverName);
    setTextAll("[data-server-ip]", serverIP);
    setTextAll("[data-server-version]", version);
    setHrefAll("[data-discord-url]", discord);
    if (copyright) {
      setTextAll("[data-copyright]", copyright);
    }
  };

  const buildFeatures = () => {
    const grid = qs("#features-grid");
    if (!grid || !window.CONFIG) return;
    grid.innerHTML = "";
    window.CONFIG.features.forEach((feature) => {
      const card = document.createElement("div");
      card.className = "card reveal";
      card.innerHTML = `
        <h3 class="card-title"></h3>
        <p class="card-text"></p>
      `;
      card.querySelector(".card-title").textContent = feature.title;
      card.querySelector(".card-text").textContent = feature.description;
      grid.appendChild(card);
    });
  };

  const buildTeam = () => {
    const grid = qs("#team-grid");
    if (!grid || !window.CONFIG) return;
    grid.innerHTML = "";
    window.CONFIG.team.forEach((member) => {
      const card = document.createElement("div");
      card.className = "card reveal";
      card.innerHTML = `
        <div class="avatar-ring"></div>
        <h3 class="card-title"></h3>
        <p class="card-subtitle"></p>
      `;
      card.querySelector(".card-title").textContent = member.name;
      card.querySelector(".card-subtitle").textContent = member.role;
      grid.appendChild(card);
    });
  };

  const initCopyButtons = () => {
    document.addEventListener("click", async (event) => {
      const trigger = event.target.closest("[data-copy-ip]");
      if (!trigger) return;

      const ip = window.CONFIG?.serverIP || "";
      if (!ip) return;

      try {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(ip);
        } else {
          throw new Error("Clipboard API unavailable");
        }
      } catch (error) {
        const input = document.createElement("input");
        input.value = ip;
        document.body.appendChild(input);
        input.select();
        document.execCommand("copy");
        document.body.removeChild(input);
      }

      const labelButton =
        trigger.tagName === "BUTTON" ? trigger : trigger.querySelector("button");
      if (labelButton) {
        const originalText = labelButton.textContent;
        labelButton.textContent = "Copied!";
        labelButton.classList.add("copied");
        setTimeout(() => {
          labelButton.textContent = originalText;
          labelButton.classList.remove("copied");
        }, 1500);
      }
      showToast("Copied to clipboard");
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
    if (!container || !window.CONFIG) return;

    const statusText = qs("#status-text", container);
    const playerText = qs("#status-players", container);
    const versionText = qs("#status-version", container);
    const dot = qs("#status-dot", container);
    const onlineBadge = qs("#status-online", container);
    const offlineBadge = qs("#status-offline", container);

    try {
      const response = await fetch(
        `https://api.mcsrvstat.us/2/${encodeURIComponent(window.CONFIG.serverIP)}`
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
    initConfigBindings();
    buildFeatures();
    buildTeam();
    initCopyButtons();
    loadServerStatus();
    initAutoRevealTargets();
    initPageLinks();
    initReveal();
    initCookieBanner();
    requestAnimationFrame(() => {
      document.body.classList.add("page-loaded");
    });
  });
})();
