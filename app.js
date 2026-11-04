const toast = document.getElementById("toast");
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add("show");
  clearTimeout(showToast.t);
  showToast.t = setTimeout(() => toast.classList.remove("show"), 1600);
}

/* ---------- Color swatches ---------- */
const grid = document.getElementById("colorGrid");
(window.BRAND_COLORS || []).forEach(({ name, hex }) => {
  const b = document.createElement("button");
  b.className = "swatch";
  b.innerHTML = `<div class="chip" style="background:${hex}"></div>
    <div class="meta"><div class="name">${name}</div><div class="hex">${hex}</div></div>`;
  b.onclick = () => { navigator.clipboard?.writeText(hex); showToast(`${hex} 복사됨`); };
  grid.appendChild(b);
});

/* ---------- Spacing demo ---------- */
const sp = document.getElementById("spacingDemo");
[4, 8, 16, 24, 32, 48, 64].forEach((n) =>
  sp.insertAdjacentHTML("beforeend",
    `<div class="sp-row"><span style="width:48px">${n}px</span><div class="sp-bar" style="width:${n * 4}px"></div></div>`));

/* ---------- Component spec tables (화면에 실제 적용된 값을 읽어서 표시) ---------- */
function specTable(el, head, rows) {
  el.innerHTML = `<table><thead><tr><th></th>${head.map((h) => `<th>${h}</th>`).join("")}</tr></thead>
    <tbody>${rows.map(([k, vals]) => `<tr><th>${k}</th>${vals.map((v) => `<td>${v}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
}
function renderSpecs(page) {
  const btns = [...page.querySelectorAll(".btn[data-size]")];
  const bs = page.querySelector('.spec[data-spec="button"]');
  if (bs && btns.length) {
    const cs = btns.map((b) => getComputedStyle(b));
    specTable(bs, btns.map((b) => b.dataset.size), [
      ["Height", cs.map((c) => c.height)],
      ["Radius", cs.map((c) => c.borderTopLeftRadius)],
      ["Font size", cs.map((c) => c.fontSize)],
      ["Padding X", cs.map((c) => c.paddingLeft)]
    ]);
  }
  const inp = page.querySelector("[data-spec-input]");
  const is = page.querySelector('.spec[data-spec="input"]');
  if (inp && is) {
    const c = getComputedStyle(inp);
    specTable(is, ["Default"], [["Height", [c.height]], ["Radius", [c.borderTopLeftRadius]], ["Font size", [c.fontSize]]]);
  }
}

/* ---------- Router ----------
   #/overview  #/brand/logo  #/foundations/spacing
   #/components  #/components/pc  #/components/pc/button  #/components/mo/input */
function route() {
  const m = location.hash.match(/^#\/(\w+)(?:\/(\w+))?(?:\/(\w+))?/) || [];
  const top = m[1] || "overview";
  let key = top, plat = null, section = m[2];
  if (top === "components" && (m[2] === "pc" || m[2] === "mo")) {
    plat = m[2]; key = `components-${plat}`; section = m[3];
  }
  const pages = [...document.querySelectorAll("[data-page]")];
  if (!pages.some((p) => p.dataset.page === key)) { key = "overview"; plat = null; section = null; }
  const shown = pages.find((p) => p.dataset.page === key);
  pages.forEach((p) => (p.hidden = p !== shown));

  // 사이드바 상태
  document.querySelectorAll("[data-route]").forEach((a) => a.classList.toggle("active", a.dataset.route === top));
  document.querySelectorAll(".side-group").forEach((g) => {
    const on = g.dataset.group === top;
    g.classList.toggle("open", on || g.dataset.keep === "1");
    g.querySelector(":scope > .side-link").classList.toggle("active", on);
  });
  document.querySelectorAll(".sub-group").forEach((g) => {
    const on = g.dataset.sub === plat;
    g.classList.toggle("open", on || g.dataset.keep === "1");
    g.querySelector(":scope > .sub-toggle").classList.toggle("active", on);
  });
  const base = plat ? `#/${top}/${plat}/` : `#/${top}/`;
  document.querySelectorAll(".side-sub a").forEach((a) =>
    a.classList.toggle("active", !!section && a.getAttribute("href") === base + section));

  const TITLES = { overview: "Overview", brand: "Brand", foundations: "Foundations", components: "Components" };
  document.getElementById("topbarTitle").textContent = (TITLES[top] || "Overview") + (plat ? ` · ${plat.toUpperCase()}` : "");
  document.body.classList.remove("nav-open");

  renderSpecs(shown);
  const id = plat ? `components-${plat}-${section}` : `${top}-${section}`;
  const target = section && document.getElementById(id);
  if (target) target.scrollIntoView(); else window.scrollTo(0, 0);
}
window.addEventListener("hashchange", route);

// 1단 그룹 버튼(Brand / Foundations / Components): 이 페이지 안이면 접기·펼치기, 아니면 이동
document.querySelectorAll("[data-toggle]").forEach((btn) =>
  btn.addEventListener("click", () => {
    const g = btn.parentElement, name = btn.dataset.toggle;
    if (location.hash.startsWith(`#/${name}`)) {
      g.classList.toggle("open"); g.dataset.keep = g.classList.contains("open") ? "1" : "";
    } else location.hash = `#/${name}`;
  }));

// 2단 그룹 버튼(PC / MO): 해당 플랫폼 안이면 접기·펼치기, 아니면 이동
document.querySelectorAll("[data-subtoggle]").forEach((btn) =>
  btn.addEventListener("click", () => {
    const g = btn.parentElement, plat = btn.dataset.subtoggle;
    if (location.hash.startsWith(`#/components/${plat}`)) {
      g.classList.toggle("open"); g.dataset.keep = g.classList.contains("open") ? "1" : "";
    } else location.hash = `#/components/${plat}`;
  }));
route();

/* ---------- Image slots: 교체 + 브라우저 저장 ---------- */
const KEY = "ds-slots-v1";
let saved = {};
try { saved = JSON.parse(localStorage.getItem(KEY) || "{}"); } catch (e) {}
document.querySelectorAll("[data-slot]").forEach((slot) => {
  const img = slot.querySelector("img");
  if (saved[slot.dataset.slot]) img.src = saved[slot.dataset.slot];
});

const picker = document.createElement("input");
picker.type = "file"; picker.accept = "image/*";
let targetSlot = null;
document.querySelectorAll("[data-slot]").forEach((slot) =>
  slot.addEventListener("click", (e) => {
    if (!document.body.classList.contains("edit")) return;
    e.preventDefault(); targetSlot = slot; picker.click();
  }));
picker.onchange = () => {
  const f = picker.files[0];
  if (!f || !targetSlot) return;
  const r = new FileReader();
  r.onload = () => {
    targetSlot.querySelector("img").src = r.result;
    saved[targetSlot.dataset.slot] = r.result;
    try { localStorage.setItem(KEY, JSON.stringify(saved)); showToast("교체 완료 (이 브라우저에 저장됨)"); }
    catch (e) { showToast("교체됨 (용량이 커서 저장은 안 됨)"); }
    picker.value = "";
  };
  r.readAsDataURL(f);
};

/* E: 편집 모드 / R(편집 모드에서): 교체한 이미지 초기화 */
document.addEventListener("keydown", (e) => {
  if (e.metaKey || e.ctrlKey || /input|textarea/i.test(e.target.tagName) || e.target.isContentEditable) return;
  const k = e.key.toLowerCase();
  if (k === "e") {
    document.body.classList.toggle("edit");
    showToast(document.body.classList.contains("edit")
      ? "편집 모드 ON — 로고/이미지를 클릭해 교체 (R: 초기화)" : "편집 모드 OFF");
  } else if (k === "r" && document.body.classList.contains("edit")) {
    try { localStorage.removeItem(KEY); } catch (e) {}
    location.reload();
  }
});

/* ---------- 모바일 메뉴 서랍 ---------- */
const openNav = () => document.body.classList.add("nav-open");
const closeNav = () => document.body.classList.remove("nav-open");
document.getElementById("menuBtn").addEventListener("click", openNav);
document.getElementById("drawerClose").addEventListener("click", closeNav);
document.getElementById("backdrop").addEventListener("click", closeNav);
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeNav(); });
window.addEventListener("resize", () => { if (innerWidth > 900) closeNav(); });
