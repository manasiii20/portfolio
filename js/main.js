/* ==========================================================================
   Four hats. They sit in a loop: the title shows one, the three pills show
   the next three in order. Clicking a pill makes it the title and the pills
   roll round to whatever follows it. Copy is from manasivinze.com.
   ========================================================================== */
const HATS = [
  {
    pill: "ux designer",
    title: "UX Designer",
    desc: "who knows her tools on both sides, running the research and converting it into design",
  },
  {
    pill: "system thinker",
    title: "System Thinker",
    desc: "who moves between the pixel and the whole system, and gets more interested the wider it gets",
  },
  {
    pill: "product designer",
    title: "Product Designer",
    desc: "who looks beyond the interface at the moving parts underneath, and what makes it work",
  },
  {
    pill: "a creative :)",
    title: "a creative :)",
    desc: "whose 10-year-old self scribbled to get things out of her head, and she still does, except now they run",
  },
];

let current = 0; // index into HATS shown in the title box

const pills = [...document.querySelectorAll("[data-slot]")];
const box = document.querySelector(".title-box");
const titleText = document.querySelector("[data-hat-title]");
const desc = document.querySelector("[data-hat-desc]");

const hatAt = (offset) => HATS[(current + offset) % HATS.length];

function render() {
  titleText.textContent = hatAt(0).title;
  desc.textContent = hatAt(0).desc;
  pills.forEach((pill, i) => {
    const hat = hatAt(i + 1);
    pill.textContent = hat.pill;
    pill.setAttribute("aria-label", `Swap to ${hat.title}`);
  });
}

// text swaps instantly; the boxes glide from their old width to the new one
function swapTo(next) {
  const boxes = [box, ...pills];
  const from = boxes.map((el) => el.getBoundingClientRect().width);

  boxes.forEach((el) => (el.style.width = ""));
  current = next;
  render();
  const to = boxes.map((el) => el.getBoundingClientRect().width);

  boxes.forEach((el, i) => {
    el.style.transition = "none";
    el.style.width = `${from[i]}px`;
  });
  box.offsetWidth; // flush so the transition starts from the old width
  boxes.forEach((el, i) => {
    el.style.transition = "";
    el.style.width = `${to[i]}px`;
  });
}

// once settled, hand the width back to the content
[box, ...pills].forEach((el) =>
  el.addEventListener("transitionend", (e) => {
    if (e.propertyName === "width") el.style.width = "";
  })
);

pills.forEach((pill, i) =>
  pill.addEventListener("click", () => swapTo((current + i + 1) % HATS.length))
);
render();

/* ==========================================================================
   Sticky notes — pick up, drag anywhere, drop.
   ========================================================================== */
const stickies = [...document.querySelectorAll(".sticky")];
let topZ = 10;

const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

// keep notes on the page: anywhere vertically, never past the side edges
function bounds(el) {
  const board = el.offsetParent.getBoundingClientRect();
  const page = document.documentElement;
  return {
    minX: -board.left,
    maxX: page.clientWidth - board.left - el.offsetWidth,
    minY: -(board.top + window.scrollY),
    maxY: page.scrollHeight - (board.top + window.scrollY) - el.offsetHeight,
  };
}

function place(el, x, y) {
  const b = bounds(el);
  el.style.left = `${clamp(x, b.minX, b.maxX)}px`;
  el.style.top = `${clamp(y, b.minY, b.maxY)}px`;
  el.style.right = "auto";
  el.style.bottom = "auto";
}

stickies.forEach((el) => {
  let start = null;

  el.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    el.setPointerCapture(e.pointerId);
    el.style.zIndex = ++topZ;
    start = { px: e.clientX, py: e.clientY, x: el.offsetLeft, y: el.offsetTop };
    el.classList.add("is-dragging");
  });

  el.addEventListener("pointermove", (e) => {
    if (!start) return;
    place(el, start.x + e.clientX - start.px, start.y + e.clientY - start.py);
  });

  const drop = () => {
    if (!start) return;
    start = null;
    el.classList.remove("is-dragging");
    el.classList.add("was-dragged");
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
    el.style.zIndex = ++topZ;
    el.classList.add("was-dragged");
    place(el, el.offsetLeft + move[0], el.offsetTop + move[1]);
  });
});

// keep dropped notes on the page when the window shrinks
window.addEventListener("resize", () => {
  stickies.forEach((el) => {
    if (el.style.left) place(el, el.offsetLeft, el.offsetTop);
  });
});

// crossing a layout breakpoint puts the notes back where the layout wants them
["(max-width: 1399px)", "(max-width: 1299px)", "(max-width: 1199px)", "(max-width: 899px)", "(max-width: 640px)"].forEach((q) => {
  window.matchMedia(q).addEventListener("change", () => {
    stickies.forEach((el) => ["left", "top", "right", "bottom"].forEach((p) => el.style.removeProperty(p)));
  });
});

/* ==========================================================================
   Custom cursor — a Figma pointer that becomes a move icon over the notes
   and carries a little name tag over things that are on their way.
   ========================================================================== */
const cursor = document.querySelector(".cursor");
const tag = cursor.querySelector(".cursor__tag");
const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");

if (finePointer.matches) {
  document.addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse") return;
    document.documentElement.classList.add("has-cursor");
    cursor.classList.add("is-visible");
    cursor.style.transform = `translate(${e.clientX - 10}px, ${e.clientY - 11.5}px)`;

    const target = e.target instanceof Element ? e.target : null;
    const dragging = document.querySelector(".sticky.is-dragging");
    cursor.classList.toggle("is-move", Boolean(dragging || target?.closest(".sticky")));

    const tagged = target?.closest("[data-cursor-tag]");
    cursor.classList.toggle("has-tag", Boolean(tagged));
    if (tagged) tag.textContent = tagged.dataset.cursorTag;
  });

  document.documentElement.addEventListener("mouseleave", () => cursor.classList.remove("is-visible"));
}
