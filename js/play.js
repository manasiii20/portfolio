/* ==========================================================================
   Play area
   ========================================================================== */
// wrapped in its own scope so nothing clashes with main.js
(() => {
  const prefersCalm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- the lanyard: a name tag on an elastic strap ------------------------ */
  const hero = document.querySelector(".play-hero");
  const strap = document.querySelector(".lanyard__strap");
  const tag = document.querySelector(".lanyard__tag");
  const note = document.querySelector(".lanyard__note");

  if (hero && strap && tag) {
    const GRAVITY = 2200; // px/s²
    const STIFF = 42; // how hard the strap pulls back once stretched
    const DAMP = 1.6; // how quickly the swing dies down
    let anchor = { x: 0, y: 0 };
    let rest = 150; // strap length before it stretches
    let pos = { x: 0, y: 0 };
    let vel = { x: 0, y: 0 };
    let drag = false;
    let last = 0;
    let running = false;

    const layout = () => {
      const w = hero.clientWidth;
      const narrow = w < 700;
      // on phones it hangs on a short strap above the heading, clear of the words
      anchor = { x: narrow ? w - 120 : w * 0.76, y: 0 };
      rest = narrow ? 36 : 150;
      // the note sits just left of the strap
      if (note) note.style.transform = `translate(${anchor.x - note.offsetWidth - 26}px, 0)`;
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
        const maxY = hero.clientHeight - tag.offsetHeight - 20;
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
    pos = prefersCalm ? { x: anchor.x, y: rest + 10 } : { x: anchor.x + 170, y: 70 };
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
      drag = false;
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

  /* ---- the shelf: videos loop like the work section ------------------------ */
  const toys = [...document.querySelectorAll(".toy")];
  toys.forEach((toy) => {
    const v = toy.querySelector(".toy__video");
    if (v?.dataset.src) {
      v.src = v.dataset.src;
      v.play().catch(() => {});
    }
  });

  /* ---- theatre: click a card to watch it big, with nothing else around ----- */
  const theatre = document.querySelector(".theatre");
  const stage = theatre?.querySelector(".theatre__media");
  let open = -1;

  function show(index) {
    open = (index + toys.length) % toys.length;
    const toy = toys[open];
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
    }

    theatre.querySelector("[data-theatre-tags]").innerHTML = toy.querySelector(".toy__tags").innerHTML;
    theatre.querySelector("[data-theatre-title]").textContent = toy.querySelector(".toy__title").textContent;
    theatre.querySelector("[data-theatre-line]").textContent = toy.querySelector(".toy__line").textContent;
    theatre.querySelector("[data-theatre-count]").textContent = `${String(open + 1).padStart(2, "0")} / ${String(toys.length).padStart(2, "0")}`;
  }

  function openTheatre(toy) {
    theatre.hidden = false;
    document.body.style.overflow = "hidden";
    show(toys.indexOf(toy));
    theatre.querySelector("[data-theatre='close']").focus();
  }

  function closeTheatre() {
    theatre.hidden = true;
    stage.replaceChildren();
    document.body.style.overflow = "";
    toys[open]?.querySelector(".toy__media").focus();
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
