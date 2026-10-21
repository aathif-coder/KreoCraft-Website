(() => {
  const allServices = Array.isArray(window.KREO_CATALOGUE) ? window.KREO_CATALOGUE : [];
  const grid = document.getElementById('serviceGrid');
  const categoryHost = document.getElementById('catalogueCategories');
  const panel = document.getElementById('selectedCategoryPanel');
  let backButton = document.getElementById('backToCategories');
  const search = document.getElementById('catalogueSearch');
  const count = document.getElementById('catalogueCount');
  if (!grid || !categoryHost) return;
  const homepageMode = !panel;
  // The homepage uses category banners and the service grid without the
  // dedicated selected-category panel used by /services.
  if (homepageMode && !backButton) {
    backButton = document.createElement('button');
    backButton.type = 'button';
    backButton.id = 'backToCategories';
    backButton.className = 'button button-outline dark-outline';
    backButton.textContent = '← All categories';
    backButton.hidden = true;
    const tools = search?.closest('.catalogue-tools');
    if (tools) tools.parentNode.insertBefore(backButton, tools);
    else grid.parentNode.insertBefore(backButton, grid);
  }
  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const categories = [...new Set(allServices.map(item => item.category))];
  const slugify = value => String(value || '').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const pathParts = location.pathname.split('/').filter(Boolean);
  const routeCategorySlug = pathParts[0] === 'services' && pathParts.length > 1 ? pathParts[1] : '';
  let selectedCategory = categories.find(category => slugify(category) === routeCategorySlug) || '';
  let query = '';
  const pageTitle = document.getElementById('cataloguePageTitle');
  const pageIntro = document.querySelector('.catalogue-page-main .section-heading p');
  const money = item => {
    if (item.price === null || item.price === undefined || item.price === '') return 'Contact for price';
    const amount = Number(item.price);
    const formatted = Number.isFinite(amount) ? new Intl.NumberFormat('en-IN', {maximumFractionDigits:2}).format(amount) : String(item.price);
    return `₹${formatted}${item.priceUnit ? ` / ${escapeHtml(item.priceUnit)}` : ''}`;
  };
  function renderCategories() {
    categoryHost.hidden = Boolean(selectedCategory);
    if (panel) panel.hidden = !selectedCategory;
    if (homepageMode) {
      grid.style.display = selectedCategory ? '' : 'none';
      if (backButton) backButton.hidden = !selectedCategory;
      const tools = search?.closest('.catalogue-tools');
      if (tools) tools.hidden = !selectedCategory;
      if (count) count.hidden = !selectedCategory;
    }
    if (pageTitle) pageTitle.textContent = selectedCategory || 'Browse by Category';
    if (pageIntro) pageIntro.textContent = selectedCategory
      ? `Explore ${allServices.filter(item => item.category === selectedCategory).length} services in ${selectedCategory}. Choose a service to view details or enquire on WhatsApp.`
      : `Choose a category banner to see its services. All ${allServices.length} services are organised into ${categories.length} easy-to-browse categories.`;
    if (selectedCategory) return;
    categoryHost.innerHTML = categories.map(category => {
      const items = allServices.filter(item => item.category === category);
      const cover = items.find(item => item.image && item.image.trim())?.image || 'images/service-placeholder.svg';
      const slug = slugify(category);
      return `<button type="button" class="category-banner" data-category="${escapeHtml(category)}" aria-label="Browse ${escapeHtml(category)}, ${items.length} services"><span class="category-banner-image"><img src="${escapeHtml(cover)}" alt="" loading="lazy" onerror="this.onerror=null;this.src='images/service-placeholder.svg'"><span class="category-banner-count">${items.length} services</span></span><span class="category-banner-copy"><strong>${escapeHtml(category)}</strong><span>Explore services</span><span class="category-banner-arrow" aria-hidden="true">→</span></span></button>`;
    }).join('');
  }
  function renderServices() {
    if (!selectedCategory) return;
    const normalized = query.trim().toLowerCase();
    const matches = allServices.filter(item => item.category === selectedCategory && (!normalized || `${item.name} ${item.category} ${item.description}`.toLowerCase().includes(normalized)));
    if (count) count.textContent = `Showing ${matches.length} of ${allServices.filter(item => item.category === selectedCategory).length} services`;
    grid.innerHTML = matches.length ? matches.map(item => {
      const message = `Hi KreoCraft! I'd like to enquire about: ${item.name}. Please share the price and details.`;
      const href = `https://wa.me/6362085708?text=${encodeURIComponent(message)}`;
      const detailUrl = `service.html?name=${encodeURIComponent(slugify(item.name))}`;
      return `<article class="service-card catalogue-card"><a class="catalogue-image-link" href="${detailUrl}" aria-label="View ${escapeHtml(item.name)} details"><img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}" loading="lazy" onerror="this.onerror=null;this.src='images/service-placeholder.svg'"></a><div class="service-card-body"><span class="catalogue-category-label"><a href="#" data-category-link>${escapeHtml(item.category)}</a></span><h3><a class="catalogue-title-link" href="${detailUrl}">${escapeHtml(item.name)}</a></h3><p>${escapeHtml(item.description)}</p><div class="service-price">${money(item)}</div><a class="catalogue-detail-link" href="${detailUrl}">View service details →</a><a class="button button-green catalogue-enquire" data-service-whatsapp="${escapeHtml(item.name)}" href="${href}" target="_blank" rel="noopener noreferrer">Enquire on WhatsApp ↗</a></div></article>`;
    }).join('') : '<div class="catalogue-empty"><strong>No matching services found.</strong><p>Try another search term.</p></div>';
  }
  categoryHost.addEventListener('click', event => {
    const button = event.target.closest('[data-category]');
    if (!button) return;
    selectedCategory = button.dataset.category;
    query = '';
    if (search) search.value = '';
    renderCategories(); renderServices();
    if (pageTitle) pageTitle.scrollIntoView({behavior:'smooth',block:'start'});
  });
  backButton?.addEventListener('click', () => {
    selectedCategory = ''; query = '';
    if (search) search.value = '';
    renderCategories();
    if (pageTitle) pageTitle.scrollIntoView({behavior:'smooth',block:'start'});
  });
  grid.addEventListener('click', event => {
    if (event.target.closest('[data-category-link]')) { event.preventDefault(); selectedCategory = ''; renderCategories(); }
  });
  search?.addEventListener('input', () => { query = search.value; renderServices(); });
  renderCategories();
  if (selectedCategory) renderServices();

  const demoHost = document.getElementById('dynamicGallery');
  const demos = Array.isArray(window.KREO_DEMOS) ? window.KREO_DEMOS : [];
  if (demoHost) {
    demoHost.innerHTML = demos.length ? demos.map(item => `<figure class="demo-item">${item.type === 'video' ? `<video src="${escapeHtml(item.media)}" controls preload="metadata" aria-label="${escapeHtml(item.title)}"></video>` : `<img src="${escapeHtml(item.media)}" alt="${escapeHtml(item.title)}" loading="lazy" onerror="this.style.display='none'">`}<figcaption>${escapeHtml(item.title)}${item.description ? `<small>${escapeHtml(item.description)}</small>` : ''}</figcaption></figure>`).join('') : '<p class="muted">Add demo items in public/js/demo-data.js.</p>';
  }
})();
