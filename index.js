// super tiny SVG library :D
const coords = (arr) => arr.map(([x, y]) => ({ x, y }));
const pathDef = (arr) =>
  "M" + arr.map(({ x, y }) => x + " " + y).join("L") + "Z";
const area = (a, b, c) =>
  Math.abs((a.x * (b.y - c.y) + b.x * (c.y - a.y) + c.x * (a.y - b.y)) / 2);
const roughlyEq = (a, b) => Math.abs(a - b) < 1e-11;
const inside = (P, A, B, C) =>
  roughlyEq(area(A, B, C), area(P, B, C) + area(P, A, C) + area(P, A, B));
const clamp = (x, minVal, maxVal) => Math.min(Math.max(x, minVal), maxVal);
const d = document;
const [$, $$] = ["", "All"].map((fn) => d["querySelector" + fn].bind(d));
////

const res = 16;
const $svg = $`svg`;
const $path = $`path`;
const $$pixels = $$`rect`;
const $$circles = ([$A, $B, $C] = [...$$("circle")]);

class Draggable {
  constructor(el, xProp = "cx", yProp = "cy", svg = null) {
    this.el = el;
    this.xProp = xProp;
    this.yProp = yProp;
    this.svg = svg || $("svg");
    this.subscribers = [];
  }

  init() {
    this.el.addEventListener("pointerup", this.onPointerUp);
    this.el.addEventListener("pointerdown", this.onPointerDown);
    this.el.addEventListener("pointermove", this.onPointerMove);
    return this;
  }

  subscribe(func) {
    this.subscribers.push(func);
    return this;
  }

  dispose() {
    this.el.removeEventListener("pointerup", this.onPointerUp);
    this.el.removeEventListener("pointerdown", this.onPointerDown);
    this.el.removeEventListener("pointermove", this.onPointerMove);
  }

  onPointerDown = (e) => {
    this.dragging = true;
    this.startX = e.clientX;
    this.startY = e.clientY;
    this.x0 = +this.el.getAttribute(this.xProp);
    this.y0 = +this.el.getAttribute(this.yProp);
    this.el.setPointerCapture(e.pointerId);
  };

  onPointerMove = (e) => {
    if (!this.dragging) {
      return;
    }
    const deltaX = e.clientX - this.startX;
    const deltaY = e.clientY - this.startY;
    const clientWidth = this.svg.clientWidth;
    const clientHeight = this.svg.clientHeight;
    const viewBoxWidth = this.svg.viewBox.baseVal.width;
    const viewBoxHeight = this.svg.viewBox.baseVal.height;
    const xMin = this.svg.viewBox.baseVal.x;
    const yMin = this.svg.viewBox.baseVal.y;
    const xMax = xMin + viewBoxWidth;
    const yMax = yMin + viewBoxHeight;
    const x1 = clamp(this.x0 + (deltaX * viewBoxWidth) / clientWidth, xMin, xMax);
    const y1 = clamp(this.y0 + (deltaY * viewBoxHeight) / clientHeight, yMin, yMax);
    this.el.setAttribute(this.xProp, x1);
    this.el.setAttribute(this.yProp, y1);
    for (const subscriber of this.subscribers) {
      if (typeof subscriber === "function") {
        subscriber(this.el);
      }
    }
  };

  onPointerUp = (e) => {
    this.el.releasePointerCapture(e.pointerId);
    this.dragging = false;
  };
}

// update the pixels and the path when dragging the circles
function update() {
  const points = ([A, B, C] = $$circles.map((c) => ({
    x: +c.getAttribute("cx"),
    y: +c.getAttribute("cy")
  })));
  $path.setAttribute("d", pathDef(points));
  for (let y = 0; y < res; y++) {
    for (let x = 0; x < res; x++) {
      const pxWidth = $svg.viewBox.baseVal.width / res;
      const pxHeight = $svg.viewBox.baseVal.height / res;
      const cx = $svg.viewBox.baseVal.x + x * pxWidth + pxWidth * 0.5;
      const cy = $svg.viewBox.baseVal.y + y * pxHeight + pxHeight * 0.5;
      const color = inside({ x: cx, y: cy }, A, B, C) ? "#f0f" : "#000";
      $$pixels[y * res + x].setAttribute("fill", color);
    }
  }
}

const dragA = new Draggable($A).subscribe(update).init();
const dragB = new Draggable($B).subscribe(update).init();
const dragC = new Draggable($C).subscribe(update).init();
