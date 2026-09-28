const $ = s => document.querySelector(s);
let cur = 0;

const RULES = CONFIG.rules.map((r, i) => ({
  id: i + 1,
  name: r.name,
  printed: Number(r.page),
  printedEnd: i + 1 < CONFIG.rules.length ? Number(CONFIG.rules[i + 1].page) - 1 : null,
  pdfPage: Number(r.page) + Number(CONFIG.pageOffset || 0)
}));

const PDF = CONFIG.pdfFile;
const esc = s => (s || "").replace(/[&<>"']/g, m => ({
  "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
}[m]));

document.title = `${CONFIG.year} ${CONFIG.title}`;
$("#appTitle").textContent = `🏫 ${CONFIG.title}`;
$("#appSubtitle").textContent = `${CONFIG.year}학년도 · ${CONFIG.subtitle}`;

if (CONFIG.officialPage) {
  $("#official").classList.remove("hidden");
  $("#official").onclick = () => window.open(CONFIG.officialPage, "_blank", "noopener");
}

function renderNav() {
  const q = $("#q").value.trim().toLowerCase();
  $("#nav").innerHTML = "";
  RULES.forEach((r, i) => {
    if (q && !r.name.toLowerCase().includes(q)) return;
    const d = document.createElement("div");
    d.className = "rule" + (i === cur ? " active" : "");
    const range = r.printedEnd && r.printedEnd >= r.printed
      ? `규정집 ${r.printed}–${r.printedEnd}쪽`
      : `규정집 ${r.printed}쪽`;
    d.innerHTML = `<span class="num">${String(r.id).padStart(2,"0")}</span>
      <div>${esc(r.name)}<div class="rm">${range}</div></div>`;
    d.onclick = () => openRule(i, true);
    $("#nav").appendChild(d);
  });
}

function createFrame(page) {
  const wrap = $("#pdfWrap");
  wrap.innerHTML = "";
  const f = document.createElement("iframe");
  f.className = "pdfFrame";
  f.title = `${CONFIG.school} 학교 규정집`;
  f.src = `${PDF}?page=${page}&t=${Date.now()}#page=${page}&zoom=page-width`;
  wrap.appendChild(f);
}

function updateUrl(ruleId) {
  const u = new URL(window.location.href);
  u.searchParams.set("rule", ruleId);
  history.replaceState(null, "", u);
}

function openRule(i, updateAddress = true) {
  cur = Math.max(0, Math.min(RULES.length - 1, i));
  const r = RULES[cur];
  $("#title").textContent = `${String(r.id).padStart(2,"0")}. ${r.name}`;
  $("#meta").textContent = `규정집 ${r.printed}쪽 · PDF ${r.pdfPage}쪽`;
  createFrame(r.pdfPage);
  renderNav();
  $("#side").classList.remove("open");
  if (updateAddress) updateUrl(r.id);
}

function showToast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 1800);
}

$("#q").oninput = renderNav;
$("#clear").onclick = () => {
  $("#q").value = "";
  renderNav();
  $("#q").focus();
};
$("#prev").onclick = () => openRule(cur - 1);
$("#next").onclick = () => openRule(cur + 1);
$("#hamb").onclick = () => $("#side").classList.toggle("open");
$("#open").onclick = () => {
  const r = RULES[cur];
  window.open(`${PDF}#page=${r.pdfPage}`, "_blank", "noopener");
};
$("#share").onclick = async () => {
  const url = new URL(window.location.href);
  url.searchParams.set("rule", RULES[cur].id);
  try {
    await navigator.clipboard.writeText(url.toString());
    showToast("현재 규정 링크를 복사했습니다. 🔗");
  } catch {
    window.prompt("아래 주소를 복사하세요.", url.toString());
  }
};

const requested = Number(new URLSearchParams(location.search).get("rule"));
const start = Number.isInteger(requested) && requested >= 1 && requested <= RULES.length
  ? requested - 1 : 0;
openRule(start, requested ? false : true);
