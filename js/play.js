/* ==========================================================================
   Play area
   ========================================================================== */
// wrapped in its own scope so nothing clashes with main.js
(() => {
  const prefersCalm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- the heading: each verb acts out what it means ------------------------ */
  document.querySelectorAll("[data-verb]").forEach((word) => {
    // wrap each letter so it can move on its own (the scribble svg stays put)
    [...word.childNodes].forEach((node) => {
      if (node.nodeType !== Node.TEXT_NODE) return;
      const frag = document.createDocumentFragment();
      [...node.textContent].forEach((ch, i) => {
        const l = document.createElement("span");
        l.className = "l";
        l.textContent = ch;
        l.style.setProperty("--i", i);
        l.style.setProperty("--r", `${Math.round((Math.random() - 0.5) * 40)}deg`);
        frag.append(l);
      });
      node.replaceWith(frag);
    });

    const kind = word.dataset.verb;
    const start = () => {
      word.classList.remove("is-on");
      void word.offsetWidth; // restart the animation every time
      word.classList.add("is-on");
      if (kind === "create") word.classList.add("is-done"); // the scribble stays once drawn
    };
    const stop = () => {
      // the wave stops when you leave; the one-shot ones finish on their own
      if (kind === "animate") word.classList.remove("is-on");
    };

    word.addEventListener("mouseenter", start);
    word.addEventListener("mouseleave", stop);
    word.addEventListener("focus", start);
    word.addEventListener("blur", stop);
    word.addEventListener("click", () => (kind === "animate" && word.classList.contains("is-on") ? stop() : start()));
  });

  /* ---- the lanyard: a name tag on an elastic strap -------------------------- */
  const hero = document.querySelector(".play-hero");
  const strap = document.querySelector(".lanyard__strap");
  const tag = document.querySelector(".lanyard__tag");

  if (hero && strap && tag) {
    const GRAVITY = 2200; // px/s²
    const STIFF = 42; // how hard the strap pulls back once stretched
    const DAMP = 1.6; // how quickly the swing dies down
    let anchor = { x: 0, y: 0 };
    let rest = 150; // strap length before it stretches
    let pos = { x: 0, y: 0 };
    let vel = { x: 0, y: 0 };
    let drag = null;
    let last = 0;
    let running = false;

    const layout = () => {
      const w = hero.clientWidth;
      const narrow = w < 700;
      // on phones it hangs on a short strap above the heading, clear of the words
      anchor = { x: narrow ? w - 120 : w * 0.74, y: 0 };
      rest = narrow ? 36 : 150;
    };

    const draw = () => {
      const dx = pos.x - anchor.x;
      const dy = pos.y - anchor.y;
      const len = Math.hypot(dx, dy);
      const angle = Math.atan2(dx, dy); // 0 when hanging straight down
      strap.style.transform = `translate(${anchor.x}px, ${anchor.y}px) rotate(${-angle}rad)`;
      strap.style.height = `${len}px`;
      tag.style.transform = `translate(${pos.x}px, ${pos.y}px) rotate(${-angle * 0.9}rad)`;
    };

    const step = (now) => {
      const dt = Math.min((now - last) / 1000, 1 / 30);
      last = now;

      if (!drag) {
        const dx = pos.x - anchor.x;
        const dy = pos.y - anchor.y;
        const len = Math.hypot(dx, dy) || 1;
        let ax = 0;
        let ay = GRAVITY;
        if (len > rest) {
          // the strap only pulls, it never pushes (it's fabric)
          const pull = STIFF * (len - rest) * 6;
          ax -= (dx / len) * pull;
          ay -= (dy / len) * pull;
        }
        vel.x = (vel.x + ax * dt) * Math.exp(-DAMP * dt);
        vel.y = (vel.y + ay * dt) * Math.exp(-DAMP * dt);
        pos.x += vel.x * dt;
        pos.y += vel.y * dt;
        // keep it inside the section
        const maxY = hero.clientHeight - tag.offsetHeight - 30;
        if (pos.y > maxY) { pos.y = maxY; vel.y *= -0.4; }
        if (pos.y < 10) { pos.y = 10; vel.y = Math.abs(vel.y) * 0.4; }
      }
      draw();

      const settled = !drag && Math.hypot(vel.x, vel.y) < 4 && Math.abs(pos.x - anchor.x) < 0.5;
      if (settled) { running = false; return; }
      requestAnimationFrame(step);
    };

    const wake = () => {
      if (running) return;
      running = true;
      last = performance.now();
      requestAnimationFrame(step);
    };

    layout();
    // it arrives from the side and swings into place
    pos = prefersCalm ? { x: anchor.x, y: rest + 40 } : { x: anchor.x + 170, y: 70 };
    vel = { x: 0, y: 0 };
    draw();
    setTimeout(wake, prefersCalm ? 0 : 500);

    let grab = { x: 0, y: 0 };
    let prev = { x: 0, y: 0, t: 0 };
    const local = (e) => {
      const r = hero.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };

    tag.addEventListener("pointerdown", (e) => {
      if (e.button !== 0) return;
      e.preventDefault();
      tag.setPointerCapture(e.pointerId);
      const p = local(e);
      grab = { x: p.x - pos.x, y: p.y - pos.y };
      prev = { ...p, t: performance.now() };
      drag = true;
      tag.classList.add("is-dragging");
      wake();
    });
    tag.addEventListener("pointermove", (e) => {
      if (!drag) return;
      const p = local(e);
      const now = performance.now();
      const dt = Math.max((now - prev.t) / 1000, 1 / 120);
      vel = { x: (p.x - prev.x) / dt, y: (p.y - prev.y) / dt };
      prev = { ...p, t: now };
      pos = { x: p.x - grab.x, y: p.y - grab.y };
    });
    const release = () => {
      if (!drag) return;
      drag = null;
      tag.classList.remove("is-dragging");
      // a flick carries through, but not so hard it flies off
      vel.x = Math.max(-2400, Math.min(2400, vel.x));
      vel.y = Math.max(-2400, Math.min(2400, vel.y));
      wake();
    };
    tag.addEventListener("pointerup", release);
    tag.addEventListener("pointercancel", release);

    window.addEventListener("resize", () => {
      layout();
      wake();
    });
  }

  /* ---- the shelf: filters ---------------------------------------------------- */
  const toys = [...document.querySelectorAll(".toy")];
  const count = document.querySelector("[data-count]");
  const filters = [...document.querySelectorAll("[data-filter]")];

  filters.forEach((btn) =>
    btn.addEventListener("click", () => {
      const kind = btn.dataset.filter;
      filters.forEach((b) => b.classList.toggle("is-on", b === btn));
      const shown = toys.filter((t) => kind === "all" || t.dataset.kind === kind);
      toys.forEach((t) => {
        const show = shown.includes(t);
        if (show && t.hidden) {
          t.hidden = false;
          t.classList.add("is-leaving");
          requestAnimationFrame(() => requestAnimationFrame(() => t.classList.remove("is-leaving")));
        } else if (!show && !t.hidden) {
          t.hidden = true;
        }
      });
      count.textContent = String(shown.length).padStart(2, "0");
    })
  );

  /* ---- the shelf: calm by default, the one you hover plays ------------------- */
  const play = (toy) => {
    const v = toy.querySelector(".toy__video");
    if (!v || !v.dataset.src) return;
    if (!v.src) v.src = v.dataset.src;
    v.play().then(() => toy.classList.add("is-playing")).catch(() => {});
  };
  const pause = (toy) => {
    const v = toy.querySelector(".toy__video");
    if (!v || !v.src) return;
    v.pause();
    toy.classList.remove("is-playing");
  };

  const canHover = window.matchMedia("(hover: hover)").matches;
  if (canHover) {
    toys.forEach((toy) => {
      const media = toy.querySelector(".toy__media");
      media.addEventListener("mouseenter", () => play(toy));
      media.addEventListener("mouseleave", () => pause(toy));
    });
  } else if ("IntersectionObserver" in window) {
    // on phones there's no hover: whichever card sits in the middle of the screen plays
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => (e.isIntersecting ? play(e.target) : pause(e.target))),
      { rootMargin: "-35% 0px -35% 0px" }
    );
    toys.forEach((t) => io.observe(t));
  }

  /* ---- theatre: click a card to see it big, with nothing else around ---------- */
  const theatre = document.querySelector(".theatre");
  const stage = theatre?.querySelector(".theatre__media");
  let open = -1;

  const visibleToys = () => toys.filter((t) => !t.hidden);

  function show(index) {
    const list = visibleToys();
    open = (index + list.length) % list.length;
    const toy = list[open];
    const media = toy.querySelector(".toy__media");
    const video = toy.querySelector(".toy__video");
    const poster = toy.querySelector(".toy__poster");

    stage.removeAttribute("style");
    stage.style.setProperty("--ratio", media.style.getPropertyValue("--ratio") || "16 / 9");
    stage.replaceChildren();
    if (video?.dataset.src) {
      const v = document.createElement("video");
      Object.assign(v, { src: video.dataset.src, muted: true, loop: true, playsInline: true, autoplay: true, controls: true });
      stage.append(v);
    } else if (poster) {
      stage.append(poster.cloneNode());
    } else {
      stage.append(media.querySelector(".toy__soon").cloneNode(true));
      stage.style.display = "grid";
      stage.style.placeItems = "center";
    }

    theatre.querySelector("[data-theatre-tags]").innerHTML = toy.querySelector(".toy__tags").innerHTML;
    theatre.querySelector("[data-theatre-title]").textContent = toy.querySelector(".toy__title").textContent;
    theatre.querySelector("[data-theatre-line]").textContent = toy.querySelector(".toy__line").textContent;
    theatre.querySelector("[data-theatre-count]").textContent = `${String(open + 1).padStart(2, "0")} / ${String(list.length).padStart(2, "0")}`;
  }

  function openTheatre(toy) {
    toys.forEach(pause);
    theatre.hidden = false;
    document.body.style.overflow = "hidden";
    show(visibleToys().indexOf(toy));
    theatre.querySelector("[data-theatre='close']").focus();
  }

  function closeTheatre() {
    theatre.hidden = true;
    stage.replaceChildren();
    document.body.style.overflow = "";
    visibleToys()[open]?.querySelector(".toy__media").focus();
    open = -1;
  }

  if (theatre) {
    toys.forEach((toy) => toy.querySelector(".toy__media").addEventListener("click", () => openTheatre(toy)));
    theatre.addEventListener("click", (e) => {
      const action = e.target.closest("[data-theatre]")?.dataset.theatre;
      if (action === "close") closeTheatre();
      else if (action === "prev") show(open - 1);
      else if (action === "next") show(open + 1);
      else if (e.target === theatre) closeTheatre(); // click the empty space around it
    });
    document.addEventListener("keydown", (e) => {
      if (theatre.hidden) return;
      if (e.key === "Escape") closeTheatre();
      if (e.key === "ArrowRight") show(open + 1);
      if (e.key === "ArrowLeft") show(open - 1);
    });
  }
})();
