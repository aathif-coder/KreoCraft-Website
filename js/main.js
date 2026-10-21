const DEFAULT_WA = "6362085708";
let whatsappNumber = DEFAULT_WA;
const $ = (s, root = document) => root.querySelector(s);

function waLink(message = "Hi KreoCraft! I'd like to enquire about your services.") {
  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
}
function setMessage(text, type = "") {
  const el = $("#formMessage");
  if (!el) return;
  el.textContent = text;
  el.className = `form-message ${type}`;
}
function initConfig() {
  // Static GitHub Pages version: use the configured WhatsApp number directly.
  document.querySelectorAll("[data-whatsapp]").forEach(a => {
    a.href = waLink(); a.target = "_blank"; a.rel = "noopener noreferrer";
  });
  document.querySelectorAll("[data-service-whatsapp]").forEach(a => {
    const service = a.getAttribute("data-service-whatsapp") || "a KreoCraft service";
    a.href = waLink(`Hi KreoCraft! I'd like to enquire about: ${service}. Please share the price and details.`);
    a.target = "_blank"; a.rel = "noopener noreferrer";
  });
  const phone = $("#footerPhone");
  if (phone) phone.textContent = whatsappNumber;
}
$("#menuToggle")?.addEventListener("click", () => $("#mainNav")?.classList.toggle("open"));
$("#mainNav")?.querySelectorAll("a").forEach(a => a.addEventListener("click", () => $("#mainNav").classList.remove("open")));
document.addEventListener("click", e => {
  const btn = e.target.closest(".choose-service");
  if (!btn) return;
  const select = $("#serviceSelect");
  if (select) { select.value = btn.dataset.service; select.dispatchEvent(new Event("change")); }
  $("#order")?.scrollIntoView({ behavior: "smooth" });
});
const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;", "'":"&#39;"}[c]));
let publicServices = [];
function renderCustomFields(serviceName) {
  const service = publicServices.find(item => item.name === serviceName);
  const host = $("#customServiceFields");
  if (!host) return;
  host.innerHTML = "";
  (service?.fields || []).forEach(field => {
    const label = document.createElement("label");
    label.className = "full";
    const required = field.required ? " *" : "";
    const name = escapeHtml(field.name);
    const req = field.required ? "required" : "";
    let control = "";
    if (field.type === "textarea") control = `<textarea name="custom_${name}" data-custom-field="${name}" rows="3" ${req} maxlength="2000"></textarea>`;
    else if (field.type === "select") control = `<select name="custom_${name}" data-custom-field="${name}" ${req}><option value="">Choose an option</option>${(field.options||[]).map(o=>`<option value="${escapeHtml(o)}">${escapeHtml(o)}</option>`).join("")}</select>`;
    else control = `<input name="custom_${name}" data-custom-field="${name}" type="${["text","number","date","email","tel"].includes(field.type)?field.type:"text"}" ${req} maxlength="200">`;
    label.innerHTML = `${escapeHtml(field.label || field.name)}${required}${control}`;
    host.append(label);
  });
}
async function loadPublicServices() {
  if (Array.isArray(window.KREO_CATALOGUE)) return; // The editable static catalogue is the public source of truth.
  try {
    const response = await fetch("/api/services");
    if (!response.ok) throw new Error("Could not load services");
    publicServices = await response.json();
    const select = $("#serviceSelect");
    if (select) {
      const current = select.value;
      select.innerHTML = '<option value="">Select a service</option>' + publicServices.map(s => `<option value="${escapeHtml(s.name)}">${escapeHtml(s.name)}</option>`).join("");
      if (publicServices.some(s => s.name === current)) select.value = current;
      select.addEventListener("change", () => renderCustomFields(select.value));
      renderCustomFields(select.value);
    }
    const grid = $("#serviceGrid");
    if (grid) {
      grid.innerHTML = publicServices.length ? publicServices.map((s,i) => `<article class="service-card">${s.image_url ? `<img src="${escapeHtml(s.image_url)}" alt="${escapeHtml(s.name)}" loading="lazy">` : `<div class="service-placeholder">KreoCraft</div>`}<div class="service-card-body"><span class="round-icon ${["green","purple","blue","pink"][i%4]}">✦</span><h3>${escapeHtml(s.name)}</h3><p>${escapeHtml(s.description || "Tell us what you need and request a quote.")}</p>${s.price ? `<p class="service-price">${escapeHtml(s.pricing_type === "starting" ? "Starting from " : "")}${escapeHtml(s.price)}</p>` : ""}<button class="card-link choose-service" data-service="${escapeHtml(s.name)}" type="button">Get started →</button></div></article>`).join("") : '<p class="muted">No services are currently available. Please contact KreoCraft.</p>';
    }
  } catch (_) {
    // Keep the page usable if the service API is temporarily unavailable.
  }
}
loadPublicServices();
async function loadGalleryAndReviews() {
  const gallery = $('#dynamicGallery');

  if (gallery) {
    try {
      let items = [];

      // Prefer the editable local demo list when present; otherwise use the API.
      if (Array.isArray(window.KREO_DEMOS)) {
        items = window.KREO_DEMOS.map(item => ({
          title: item.title || 'KreoCraft Demo',
          description: item.description || '',
          media_type: item.type === 'video' ? 'video' : 'image',
          media_url: item.media || ''
        })).filter(item => item.media_url);
      } else {
        const response = await fetch('/api/gallery');
        if (!response.ok) throw new Error('Gallery request failed');
        const result = await response.json();
        items = Array.isArray(result) ? result : [];
      }

      gallery.innerHTML = items.length
        ? items.map(item => `
            <figure>
              ${item.media_type === 'video'
                ? `<video src="${escapeHtml(item.media_url)}" controls preload="metadata" playsinline aria-label="${escapeHtml(item.title)}"></video>`
                : `<img src="${escapeHtml(item.media_url)}" alt="${escapeHtml(item.title)}" loading="lazy">`}
              <figcaption>
                ${escapeHtml(item.title)}
                ${item.description
                  ? `<small>${escapeHtml(item.description)}</small>`
                  : ''}
              </figcaption>
            </figure>
          `).join('')
        : '<p class="muted">Our project gallery is being prepared. Please check back soon.</p>';
    } catch (_) {
      gallery.innerHTML = '<p class="muted">Gallery temporarily unavailable.</p>';
    }
  }

  const reviews = $('#reviewsGrid');
  if (reviews) {
    try {
      const response = await fetch('/api/reviews');
      if (!response.ok) throw new Error('Reviews request failed');
      const result = await response.json();
      const items = Array.isArray(result) ? result : [];
      reviews.innerHTML = items.length
        ? items.map(item => {
            const rating = Math.max(0, Math.min(5, Number(item.rating) || 0));
            return `
              <article class="service-card review-card">
                <div class="review-stars" aria-label="${rating} out of 5 stars">${'★'.repeat(rating)}${'☆'.repeat(5 - rating)}</div>
                <p>${escapeHtml(item.review_text || '')}</p>
                <strong>${escapeHtml(item.customer_name || 'Customer')}</strong>
              </article>`;
          }).join('')
        : '<p class="muted">Customer reviews will appear here as they become available.</p>';
    } catch (_) {
      reviews.innerHTML = '<p class="muted">Reviews temporarily unavailable.</p>';
    }
  }
}
// Static gallery is rendered by catalogue.js from demo-data.js; no review API is used.

$("#referenceFile")?.addEventListener("change", e => {
  const file = e.target.files?.[0];
  $("#fileName").textContent = file ? `${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)` : "No file selected";
  if (file && file.size > 10 * 1024 * 1024) {
    setMessage("That file is larger than 10 MB. Please choose a smaller file.");
    e.target.value = "";
    $("#fileName").textContent = "No file selected";
  } else setMessage("");
});
$("#quoteForm")?.addEventListener("submit", async e => {
  e.preventDefault();
  const form = e.currentTarget;
  const submit = $(".submit-button", form);
  const data = new FormData(form);
  const customFields = {};
  form.querySelectorAll("[data-custom-field]").forEach(field => { if (field.value.trim()) customFields[field.dataset.customField] = field.value.trim(); });
  data.set("custom_fields", JSON.stringify(customFields));
  const file = data.get("referenceFile");
  if (file && file.size > 10 * 1024 * 1024) return setMessage("Please choose a file under 10 MB.");
  submit.disabled = true;
  submit.textContent = "Submitting enquiry…";
  setMessage("");
  try {
    const response = await fetch("/api/enquiries", { method: "POST", body: data });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Unable to submit enquiry.");
    const lines = [
      "Hi KreoCraft! I'd like to request a quotation.",
      `Enquiry reference: ${result.reference}`,
      `Name: ${data.get("name")}`,
      `Phone: ${data.get("phone")}`,
      `Service: ${data.get("service")}`,
      data.get("quantity") ? `Quantity: ${data.get("quantity")}` : "",
      data.get("dimensions") ? `Size/dimensions: ${data.get("dimensions")}` : "",
      data.get("material") ? `Paper/material/binding: ${data.get("material")}` : "",
      data.get("deadline") ? `Needed by: ${data.get("deadline")}` : "",
      data.get("budget") ? `Budget: ${data.get("budget")}` : "",
      `Requirements: ${data.get("details")}`,
      ...Object.entries(customFields).map(([key,value]) => `${key}: ${value}`),
      file && file.size ? `Reference file uploaded on website: ${file.name}` : "",
      "Please confirm the quotation and next steps."
    ].filter(Boolean);
    setMessage(`Enquiry saved! Your reference is ${result.reference}. WhatsApp will open in a new tab.`, "success");
    window.open(waLink(lines.join("\n")), "_blank", "noopener,noreferrer");
    form.reset();
    $("#fileName").textContent = "No file selected";
  } catch (err) {
    setMessage(err.message || "Something went wrong. Please try again.");
  } finally {
    submit.disabled = false;
    submit.innerHTML = 'Submit enquiry & continue to WhatsApp <span>↗</span>';
  }
});
$("#year") && ($("#year").textContent = new Date().getFullYear());
initConfig();


