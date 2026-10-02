/* Krause Plumbing site script
 * FORM_ENDPOINT: paste a form-handling URL here (e.g. a Formspree endpoint like
 * https://formspree.io/f/xxxxxxx) to make "Book Online" requests arrive by email.
 * While it's blank, the form tells visitors to call instead; it never pretends to send.
 *
 * CONSENT: analytics and ad tags load ONLY after the visitor accepts (see COMPLIANCE.md).
 * Add tag script URLs to TAGS below. Nothing is installed today. A Global Privacy Control or
 * Do Not Track signal is treated as Reject. Never put tag code anywhere else on the site.
 */
const FORM_ENDPOINT = "";
const PHONE_TEXT = "(336) 816-8381";
const TAGS = { analytics: [], ads: [] };   // e.g. { analytics: ["https://www.googletagmanager.com/gtag/js?id=G-XXXX"], ads: [] }

document.querySelectorAll("form.js-request").forEach(function (form) {
  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    const msg = form.querySelector(".form-msg");
    if (!FORM_ENDPOINT) {
      msg.textContent = "Online requests aren't connected yet. Please call " + PHONE_TEXT + " and we'll help you right away.";
      return;
    }
    const btn = form.querySelector("button[type=submit]");
    btn.disabled = true;
    msg.textContent = "Sending…";
    try {
      const res = await fetch(FORM_ENDPOINT, { method: "POST", body: new FormData(form), headers: { Accept: "application/json" } });
      if (!res.ok) throw new Error(res.status);
      form.reset();
      msg.textContent = "Thanks! We got your request and will call you back. For emergencies, call " + PHONE_TEXT + " now.";
    } catch (err) {
      msg.textContent = "Something went wrong sending your request. Please call " + PHONE_TEXT + ".";
    } finally {
      btn.disabled = false;
    }
  });
});

/* ---------- Consent banner ---------- */
(function () {
  const KEY = "kp_consent";
  const loaded = {};
  function read() { try { return JSON.parse(localStorage.getItem(KEY)); } catch (e) { return null; } }
  function write(c) { try { localStorage.setItem(KEY, JSON.stringify(c)); } catch (e) {} }
  const optedOut = navigator.globalPrivacyControl === true || navigator.doNotTrack === "1" || window.doNotTrack === "1";

  function loadTags(c) {
    ["analytics", "ads"].forEach(function (k) {
      if (!c[k] || loaded[k]) return;
      loaded[k] = true;
      TAGS[k].forEach(function (src) { const s = document.createElement("script"); s.async = true; s.src = src; document.head.appendChild(s); });
    });
  }
  function save(c) {
    c.ts = new Date().toISOString();
    write(c);
    loadTags(c);
    close();
  }
  function close() { const b = document.getElementById("consent"); if (b) b.remove(); }

  function open(manage) {
    close();
    const c = read() || { analytics: false, ads: false };
    const d = document.createElement("div");
    d.id = "consent"; d.setAttribute("role", "dialog"); d.setAttribute("aria-label", "Cookie choices");
    d.innerHTML =
      '<p><b>Your privacy choices.</b> We use analytics and advertising cookies only if you accept. Necessary features work either way. ' +
      '<a href="' + PRIVACY + '">Privacy Policy</a></p>' +
      '<div class="consent-opts"' + (manage ? "" : " hidden") + '>' +
      '<label><input type="checkbox" id="c-an"' + (c.analytics ? " checked" : "") + '> Analytics (Google Analytics)</label>' +
      '<label><input type="checkbox" id="c-ad"' + (c.ads ? " checked" : "") + '> Advertising (Google Ads, Meta Pixel)</label>' +
      '<button type="button" class="btn consent-btn" id="c-save">Save choices</button></div>' +
      '<div class="consent-row"><button type="button" class="btn consent-btn" id="c-acc">Accept all</button>' +
      '<button type="button" class="btn consent-btn" id="c-rej">Reject all</button>' +
      '<button type="button" class="btn consent-btn" id="c-man">Manage choices</button></div>';
    document.body.appendChild(d);
    document.getElementById("c-acc").onclick = function () { save({ analytics: true, ads: true }); };
    document.getElementById("c-rej").onclick = function () { save({ analytics: false, ads: false }); };
    document.getElementById("c-man").onclick = function () { d.querySelector(".consent-opts").hidden = false; document.getElementById("c-an").focus(); };
    document.getElementById("c-save").onclick = function () { save({ analytics: document.getElementById("c-an").checked, ads: document.getElementById("c-ad").checked }); };
  }

  const script = document.currentScript || document.querySelector('script[src$="assets/site.js"]');
  const PRIVACY = script.src.replace("assets/site.js", "privacy/index.html");

  document.querySelectorAll("[data-cookie-settings]").forEach(function (b) { b.addEventListener("click", function () { open(true); }); });

  if (optedOut) { write({ analytics: false, ads: false, gpc: true, ts: new Date().toISOString() }); return; }
  const c = read();
  if (c) loadTags(c); else open(false);
})();
