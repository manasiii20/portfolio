/* ==========================================================================
   Four hats — click a pill to swap it into the title.
   Edit the copy here; `pill` is how it reads in the grey chip,
   `title` is how it reads inside the selected text box.
   ========================================================================== */
const HATS = [
  {
    pill: "product designer",
    title: "Product Designer",
    desc: "who looks beyond the interface at the moving parts underneath, and what makes it work",
  },
  {
    pill: "a creative :)",
    title: "A Creative :)",
    desc: "who doodles, builds tiny lego worlds, and keeps finding playful ways to make everyday things feel a little more delightful",
  },
  {
    pill: "ux designer",
    title: "UX Designer",
    desc: "who sits with the messy bits of research until the real problem shows up, then designs for the people living with it",
  },
  {
    pill: "system thinker",
    title: "System Thinker",
    desc: "who zooms out to map how people, tools and processes connect, before touching a single pixel",
  },
];

const OUT_MS = 170;
const IN_MS = 380;

const state = {
  title: 0,          // index into HATS shown in the box
  slots: [1, 2, 3],  // indexes shown in the three pills, left → right
  busy: false,
};

const pills = [...document.querySelectorAll("[data-slot]")];
const box = document.querySelector(".title-box");
const titleText = document.querySelector("[data-hat-title]");
const desc = document.querySelector("[data-hat-desc]");

function render() {
  titleText.textContent = HATS[state.title].title;
  desc.textContent = HATS[state.title].desc;
  pills.forEach((pill, i) => {
    const hat = HATS[state.slots[i]];
    pill.textContent = hat.pill;
    pill.setAttribute("aria-label", `Swap to ${hat.title}`);
  });
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function swap(slot) {
  if (state.busy) return;
  state.busy = true;

  const pill = pills[slot];
  const fromWidth = box.offsetWidth;

  pill.classList.add("is-out");
  titleText.classList.add("is-out");
  desc.classList.add("is-out");
  await wait(OUT_MS);

  [state.title, state.slots[slot]] = [state.slots[slot], state.title];

  // measure the box at its new natural width, then animate to it
  box.style.width = "";
  render();
  const toWidth = box.offsetWidth;
  box.style.width = `${fromWidth}px`;
  box.offsetWidth; // flush so the transition starts from the old width
  box.style.width = `${toWidth}px`;

  pill.classList.replace("is-out", "is-in");
  titleText.classList.replace("is-out", "is-in");
  desc.classList.remove("is-out");
  await wait(IN_MS);

  pill.classList.remove("is-in");
  titleText.classList.remove("is-in");
  box.style.width = "";
  state.busy = false;
}

pills.forEach((pill, i) => pill.addEventListener("click", () => swap(i)));
render();

/* ==========================================================================
   Sticky notes — pick up, drag anywhere inside the hero, drop.
   ========================================================================== */
const stage = document.querySelector("[data-sticky-stage]");
const hero = document.querySelector(".hero");
const stickies = [...document.querySelectorAll(".sticky")];
let topZ = 10;

const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

// the area a note may sit in, in the stage's coordinate space
function bounds(el) {
  const s = stage.getBoundingClientRect();
  const h = hero.getBoundingClientRect();
  return {
    minX: h.left - s.left,
    minY: h.top - s.top,
    maxX: h.right - s.left - el.offsetWidth,
    maxY: h.bottom - s.top - el.offsetHeight,
  };
}

function place(el, x, y) {
  const b = bounds(el);
  el.style.left = `${clamp(x, b.minX, b.maxX)}px`;
  el.style.top = `${clamp(y, b.minY, b.maxY)}px`;
  el.style.right = "auto";
  el.style.bottom = "auto";
}

function raise(el) {
  el.style.zIndex = ++topZ;
}

stickies.forEach((el) => {
  let start = null;
  let lastX = 0;
  let tilt = 0;

  el.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    el.setPointerCapture(e.pointerId);
    raise(el);
    start = { px: e.clientX, py: e.clientY, x: el.offsetLeft, y: el.offsetTop };
    lastX = e.clientX;
    tilt = 0;
    el.classList.add("is-dragging");
  });

  el.addEventListener("pointermove", (e) => {
    if (!start) return;
    place(el, start.x + e.clientX - start.px, start.y + e.clientY - start.py);
    // lean a little into the direction of travel, like paper catching air
    tilt = clamp(tilt * 0.7 + (e.clientX - lastX) * 0.5, -6, 6);
    lastX = e.clientX;
    el.style.setProperty("--tilt", `${tilt.toFixed(2)}deg`);
  });

  const drop = () => {
    if (!start) return;
    start = null;
    el.classList.remove("is-dragging");
    el.style.removeProperty("--tilt");
  };
  el.addEventListener("pointerup", drop);
  el.addEventListener("pointercancel", drop);

  // keyboard: arrows nudge, shift + arrows move further
  el.addEventListener("keydown", (e) => {
    const step = e.shiftKey ? 40 : 10;
    const moves = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    const move = moves[e.key];
    if (!move) return;
    e.preventDefault();
    raise(el);
    place(el, el.offsetLeft + move[0], el.offsetTop + move[1]);
  });
});

// keep dropped notes inside the hero when the window shrinks
window.addEventListener("resize", () => {
  stickies.forEach((el) => {
    if (el.style.left) place(el, el.offsetLeft, el.offsetTop);
  });
});

// crossing a layout breakpoint puts the notes back where the layout wants them
["(max-width: 1100px)", "(max-width: 640px)", "(max-width: 1320px)"].forEach((q) => {
  window.matchMedia(q).addEventListener("change", () => {
    stickies.forEach((el) => {
      ["left", "top", "right", "bottom"].forEach((p) => el.style.removeProperty(p));
    });
  });
});
