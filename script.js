(() => {
  "use strict";

  const screens = [...document.querySelectorAll("[data-screen]")];
  const app = document.querySelector("#app");
  const noButton = document.querySelector("#no-button");
  const escapeZone = document.querySelector("#escape-zone");
  const questionCard = document.querySelector(".question-card");
  const refusalMessage = document.querySelector("#refusal-message");
  const giveUpButton = document.querySelector("#give-up-button");
  const cancelButton = document.querySelector("#cancel-button");
  const cancelMessage = document.querySelector("#cancel-message");
  const burstLayer = document.querySelector("#burst-layer");
  const toast = document.querySelector("#toast");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const gameField = document.querySelector("#game-field");
  const gamePlayer = document.querySelector("#game-player");
  const gameOverlay = document.querySelector("#game-overlay");
  const gameResult = document.querySelector("#game-result");
  const gameStartButton = document.querySelector("#game-start-button");
  const gameContinueButton = document.querySelector("#game-continue-button");
  const gameTime = document.querySelector("#game-time");
  const gameLevel = document.querySelector("#game-level");

  const state = {
    screen: "welcome",
    refusalCount: 0,
    cancelCount: 0,
    toastTimer: null,
    game: null
  };

  const refusalMessages = [
    "거절 버튼이 도망갔습니다.",
    "오늘은 생일이라 거절할 수 없습니다.",
    "아니요 기능은 생일자 보호 정책에 따라 비활성화되었습니다."
  ];

  const refusalButtonLabels = [
    "아니요",
    "잡을 수 있으면 잡아봐요",
    "거절 기능 없음"
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
    noButton.textContent = refusalButtonLabels[Math.min(state.refusalCount, 3) - 1];
    escapeZone.classList.add("is-active");
    questionCard.classList.remove("is-refusing");
    void questionCard.offsetWidth;
    questionCard.classList.add("is-refusing");
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

    const previousCenter = {
      x: noButton.offsetLeft + noButton.offsetWidth / 2,
      y: noButton.offsetTop + noButton.offsetHeight / 2
    };

    if (noButton.classList.contains("is-escaping")) {
      const ghost = document.createElement("span");
      ghost.className = "escape-ghost";
      ghost.textContent = ["휙!", "메롱", "못 잡지", "💨"][Math.floor(Math.random() * 4)];
      ghost.style.left = `${noButton.offsetLeft + noButton.offsetWidth / 2}px`;
      ghost.style.top = `${noButton.offsetTop + noButton.offsetHeight / 2}px`;
      escapeZone.appendChild(ghost);
      window.setTimeout(() => ghost.remove(), 700);
    }

    noButton.classList.add("is-escaping");
    const maxX = Math.max(0, escapeZone.clientWidth - noButton.offsetWidth);
    const maxY = Math.max(0, escapeZone.clientHeight - noButton.offsetHeight);
    const minY = Math.min(64, maxY);
    const minimumDistance = Math.min(110, Math.hypot(maxX, maxY) * 0.55);
    let farthestCandidate = null;
    const validCandidates = [];
    const positionCandidates = [
      { x: 0, y: minY },
      { x: maxX, y: minY },
      { x: 0, y: maxY },
      { x: maxX, y: maxY }
    ];

    for (let index = 0; index < 28; index += 1) {
      positionCandidates.push({
        x: Math.random() * maxX,
        y: minY + Math.random() * Math.max(0, maxY - minY)
      });
    }

    positionCandidates.forEach((candidate) => {
      const centerX = candidate.x + noButton.offsetWidth / 2;
      const centerY = candidate.y + noButton.offsetHeight / 2;
      candidate.distance = Math.hypot(centerX - previousCenter.x, centerY - previousCenter.y);

      if (!farthestCandidate || candidate.distance > farthestCandidate.distance) {
        farthestCandidate = candidate;
      }
      if (candidate.distance >= minimumDistance) validCandidates.push(candidate);
    });

    const nextPosition = validCandidates.length
      ? validCandidates[Math.floor(Math.random() * validCandidates.length)]
      : farthestCandidate;
    noButton.style.left = `${Math.round(nextPosition.x)}px`;
    noButton.style.top = `${Math.round(nextPosition.y)}px`;
    noButton.style.transform = `rotate(${Math.round(Math.random() * 22 - 11)}deg) scale(${0.92 + Math.random() * 0.1})`;
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

  function setPlayerPosition(clientX) {
    if (!state.game?.running) return;
    const bounds = gameField.getBoundingClientRect();
    const halfPlayer = gamePlayer.offsetWidth / 2;
    const x = Math.min(bounds.width - halfPlayer, Math.max(halfPlayer, clientX - bounds.left));
    state.game.playerX = x;
    gamePlayer.style.left = `${x}px`;
  }

  function spawnLove(elapsed) {
    const hardMode = elapsed >= 3000;
    const drop = document.createElement("div");
    const icons = hardMode ? ["❤️", "💖", "🌹", "💕", "💘"] : ["❤️", "🌹", "💖"];
    const size = hardMode ? 44 + Math.random() * 18 : 36 + Math.random() * 10;
    drop.className = "love-drop";
    drop.textContent = icons[Math.floor(Math.random() * icons.length)];
    drop.style.left = `${Math.random() * Math.max(1, gameField.clientWidth - size)}px`;
    drop.style.width = `${size}px`;
    drop.style.height = `${size}px`;
    drop.style.fontSize = `${size * 0.78}px`;
    gameField.appendChild(drop);
    state.game.drops.push({
      element: drop,
      x: Number.parseFloat(drop.style.left),
      y: -size,
      size,
      speed: hardMode ? 330 + Math.random() * 230 : 145 + Math.random() * 75
    });
  }

  function rectanglesOverlap(a, b) {
    const padding = 7;
    return a.x + padding < b.x + b.width - padding
      && a.x + a.width - padding > b.x + padding
      && a.y + padding < b.y + b.height - padding
      && a.y + a.height - padding > b.y + padding;
  }

  function finishGame(survived = false) {
    const game = state.game;
    if (!game?.running) return;
    game.running = false;
    window.cancelAnimationFrame(game.frameId);
    game.drops.forEach(({ element }) => element.remove());
    game.drops = [];
    gameOverlay.classList.remove("is-running");
    gameStartButton.classList.add("is-hidden");
    gameContinueButton.classList.remove("is-hidden");
    gameResult.innerHTML = survived
      ? "30초 생존! 거절에 성공했습니다 🏆<br>이 페이지를 닫아도 인정합니다."
      : `내 사랑을 피하지 못했습니다 💘<br><strong>${(game.elapsed / 1000).toFixed(1)}초</strong> 만에 붙잡혔어요.`;
    gameContinueButton.textContent = survived
      ? "그래도 생일 축하 받으러 가기"
      : "사랑에 잡혔습니다...";
    createBurst(16);
    gameContinueButton.focus({ preventScroll: true });
  }

  function runGameFrame(timestamp) {
    const game = state.game;
    if (!game?.running) return;

    if (!game.lastTimestamp) game.lastTimestamp = timestamp;
    const delta = Math.min(34, timestamp - game.lastTimestamp) / 1000;
    game.lastTimestamp = timestamp;
    game.elapsed = timestamp - game.startedAt;
    const hardMode = game.elapsed >= 3000;
    const spawnInterval = hardMode ? Math.max(55, 125 - (game.elapsed - 3000) / 80) : 480;

    gameTime.textContent = (game.elapsed / 1000).toFixed(1);
    gameLevel.textContent = hardMode ? "사랑 폭주중!!!" : "평온함";

    if (timestamp - game.lastSpawn >= spawnInterval) {
      spawnLove(game.elapsed);
      game.lastSpawn = timestamp;
      if (hardMode && Math.random() > 0.35) spawnLove(game.elapsed);
    }

    const playerRect = {
      x: game.playerX - gamePlayer.offsetWidth / 2,
      y: gameField.clientHeight - 14 - gamePlayer.offsetHeight,
      width: gamePlayer.offsetWidth,
      height: gamePlayer.offsetHeight
    };

    for (let index = game.drops.length - 1; index >= 0; index -= 1) {
      const drop = game.drops[index];
      drop.y += drop.speed * delta;
      drop.element.style.transform = `translateY(${drop.y + drop.size}px) rotate(${drop.y * 0.35}deg)`;

      if (rectanglesOverlap({ x: drop.x, y: drop.y, width: drop.size, height: drop.size }, playerRect)) {
        finishGame(false);
        return;
      }

      if (drop.y > gameField.clientHeight + drop.size) {
        drop.element.remove();
        game.drops.splice(index, 1);
      }
    }

    if (game.elapsed >= 30000) {
      finishGame(true);
      return;
    }

    game.frameId = window.requestAnimationFrame(runGameFrame);
  }

  function startGame() {
    gameField.querySelectorAll(".love-drop").forEach((drop) => drop.remove());
    const now = performance.now();
    state.game = {
      running: true,
      startedAt: now,
      elapsed: 0,
      lastTimestamp: now,
      lastSpawn: now - 300,
      playerX: gameField.clientWidth / 2,
      drops: [],
      frameId: null
    };
    gamePlayer.style.left = "50%";
    gameTime.textContent = "0.0";
    gameLevel.textContent = "평온함";
    gameOverlay.classList.add("is-running");
    gameField.focus({ preventScroll: true });
    state.game.frameId = window.requestAnimationFrame(runGameFrame);
  }

  function showToast(message) {
    window.clearTimeout(state.toastTimer);
    toast.textContent = message;
    toast.classList.add("is-visible");
    state.toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 2600);
  }

  document.querySelector("[data-action='accept']").addEventListener("click", () => showScreen("positive"));
  giveUpButton.addEventListener("click", () => showScreen("game"));

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
  gameStartButton.addEventListener("click", startGame);
  gameContinueButton.addEventListener("click", () => showScreen("positive"));
  gameField.addEventListener("pointerdown", (event) => {
    gameField.setPointerCapture?.(event.pointerId);
    setPlayerPosition(event.clientX);
  });
  gameField.addEventListener("pointermove", (event) => {
    if (event.buttons === 1 || event.pointerType === "touch") setPlayerPosition(event.clientX);
  });
  gameField.addEventListener("keydown", (event) => {
    if (!state.game?.running || !["ArrowLeft", "ArrowRight"].includes(event.key)) return;
    event.preventDefault();
    const direction = event.key === "ArrowLeft" ? -1 : 1;
    const bounds = gameField.getBoundingClientRect();
    setPlayerPosition(bounds.left + state.game.playerX + direction * 28);
  });
  document.querySelector("#again-button").addEventListener("click", () => {
    createBurst(20);
    showToast("생일 축하해 성빈아 🌹");
  });

  preloadBurstAssets();
})();
