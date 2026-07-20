(() => {
  "use strict";

  const screens = [...document.querySelectorAll("[data-screen]")];
  const app = document.querySelector("#app");
  const noButton = document.querySelector("#no-button");
  const escapeZone = document.querySelector("#escape-zone");
  const refusalMessage = document.querySelector("#refusal-message");
  const giveUpButton = document.querySelector("#give-up-button");
  const cancelButton = document.querySelector("#cancel-button");
  const cancelMessage = document.querySelector("#cancel-message");
  const burstLayer = document.querySelector("#burst-layer");
  const toast = document.querySelector("#toast");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  const state = {
    screen: "welcome",
    refusalCount: 0,
    cancelCount: 0,
    toastTimer: null
  };

  const refusalMessages = [
    "거절 버튼이 도망갔습니다.",
    "오늘은 생일이라 거절할 수 없습니다.",
    "아니요 기능은 생일자 보호 정책에 따라 비활성화되었습니다."
  ];

  const cancelLabels = [
    "그래도 입장하기",
    "진짜 그래도 입장하기",
    "이제 그냥 입장하기",
    "확인하고 입장하기"
  ];

  const burstAssets = [
    { src: "assets/rose.png", fallback: "🌹" },
    { src: "assets/heart.png", fallback: "❤️" },
    { src: "assets/cake.png", fallback: "🎂" },
    { src: "assets/custom-1.png", fallback: "💖" }
  ];

  const assetAvailability = new Map();

  function preloadBurstAssets() {
    burstAssets.forEach(({ src }) => {
      const image = new Image();
      image.onload = () => assetAvailability.set(src, true);
      image.onerror = () => assetAvailability.set(src, false);
      image.src = src;
    });
  }

  function showScreen(name, options = {}) {
    state.screen = name;
    screens.forEach((screen) => {
      const active = screen.dataset.screen === name;
      screen.hidden = !active;
      screen.classList.toggle("is-active", active);
    });

    window.scrollTo({ top: 0, behavior: reducedMotion.matches ? "auto" : "smooth" });
    app.focus({ preventScroll: true });

    if (options.burst) {
      window.setTimeout(() => createBurst(options.burst), reducedMotion.matches ? 0 : 140);
    }
  }

  function registerRefusal(event) {
    if (event) event.preventDefault();
    state.refusalCount += 1;
    refusalMessage.textContent = refusalMessages[Math.min(state.refusalCount, 3) - 1];
    moveNoButton();

    if (state.refusalCount >= 3) {
      giveUpButton.classList.remove("is-hidden");
      noButton.disabled = true;
      noButton.classList.add("is-hidden");
      giveUpButton.focus({ preventScroll: true });
    }
  }

  function moveNoButton() {
    if (reducedMotion.matches || !escapeZone) return;

    noButton.classList.add("is-escaping");
    const maxX = Math.max(0, escapeZone.clientWidth - noButton.offsetWidth);
    const maxY = Math.max(0, escapeZone.clientHeight - noButton.offsetHeight);
    noButton.style.left = `${Math.round(Math.random() * maxX)}px`;
    noButton.style.top = `${Math.round(Math.random() * maxY)}px`;
    noButton.style.transform = `rotate(${Math.round(Math.random() * 10 - 5)}deg)`;
  }

  function handleCancel() {
    if (state.cancelCount >= cancelLabels.length) {
      showScreen("celebration", { burst: 18 });
      return;
    }

    cancelButton.textContent = cancelLabels[state.cancelCount];
    state.cancelCount += 1;
    cancelMessage.textContent = "취소 요청이 접수되지 않았습니다. 오늘은 생일이니까요.";

    if (state.cancelCount === cancelLabels.length) {
      cancelButton.classList.remove("button-secondary");
      cancelButton.classList.add("button-primary");
    }
  }

  function createBurst(requestedCount = 16) {
    const count = reducedMotion.matches ? Math.min(4, requestedCount) : Math.min(20, Math.max(12, requestedCount));
    const fragment = document.createDocumentFragment();

    for (let index = 0; index < count; index += 1) {
      const asset = burstAssets[Math.floor(Math.random() * burstAssets.length)];
      const item = assetAvailability.get(asset.src) === true
        ? document.createElement("img")
        : document.createElement("span");

      if (item instanceof HTMLImageElement) {
        item.src = asset.src;
        item.alt = "";
      } else {
        item.textContent = asset.fallback;
        item.classList.add("burst-emoji");
      }

      const duration = 1000 + Math.round(Math.random() * 500);
      item.classList.add("burst-item");
      item.style.setProperty("--x", `${8 + Math.random() * 84}vw`);
      item.style.setProperty("--y", `${12 + Math.random() * 70}vh`);
      item.style.setProperty("--size", `${28 + Math.random() * 30}px`);
      item.style.setProperty("--dx", `${Math.round(Math.random() * 140 - 70)}px`);
      item.style.setProperty("--dy", `${Math.round(Math.random() * -120 - 35)}px`);
      item.style.setProperty("--fall", `${Math.round(Math.random() * 50 - 5)}px`);
      item.style.setProperty("--spin", `${Math.round(Math.random() * 360 - 180)}deg`);
      item.style.setProperty("--duration", `${duration}ms`);
      item.style.animationDelay = `${Math.round(Math.random() * 120)}ms`;
      fragment.appendChild(item);
      window.setTimeout(() => item.remove(), duration + 250);
    }

    burstLayer.appendChild(fragment);
  }

  function showToast(message) {
    window.clearTimeout(state.toastTimer);
    toast.textContent = message;
    toast.classList.add("is-visible");
    state.toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 2600);
  }

  document.querySelector("[data-action='accept']").addEventListener("click", () => showScreen("positive"));
  giveUpButton.addEventListener("click", () => showScreen("positive"));

  noButton.addEventListener("touchstart", registerRefusal, { passive: false });
  noButton.addEventListener("pointerenter", (event) => {
    if (event.pointerType === "mouse") registerRefusal(event);
  });
  noButton.addEventListener("click", (event) => {
    if (event.detail === 0 || reducedMotion.matches) registerRefusal(event);
  });

  document.querySelectorAll(".positive-choice").forEach((button) => {
    button.addEventListener("click", () => {
      createBurst(14);
      window.setTimeout(() => showScreen("confirm"), reducedMotion.matches ? 0 : 360);
    });
  });

  document.querySelector("[data-action='enter']").addEventListener("click", () => {
    showScreen("celebration", { burst: 18 });
  });

  cancelButton.addEventListener("click", handleCancel);
  document.querySelector("#again-button").addEventListener("click", () => {
    createBurst(20);
    showToast("생일 축하해 성빈아 🌹");
  });

  preloadBurstAssets();
})();
