const urlParams = new URLSearchParams(window.location.search);
const initialGovernorateId = urlParams.get("id") || "cairo";

const governorateSelect = document.getElementById("governorateSelect");
const typeFilter = document.getElementById("typeFilter");
const priceRange = document.getElementById("priceRange");
const priceRangeValue = document.getElementById("priceRangeValue");
const applyFiltersBtn = document.getElementById("applyFiltersBtn");
const globalSearchInput = document.getElementById("globalSearchInput");
const heroTitle = document.getElementById("heroTitle");
const heroSubtitle = document.getElementById("heroSubtitle");
const govMeta = document.getElementById("govMeta");
const propertiesGrid = document.getElementById("propertiesGrid");
const resultsCount = document.getElementById("resultsCount");
const demandChecks = Array.from(document.querySelectorAll(".demand-check"));
const sortButtons = Array.from(document.querySelectorAll(".chip-btn"));

const state = {
  governorateId: initialGovernorateId,
  search: "",
  type: "all",
  maxPrice: Number(priceRange.value),
  sort: "default"
};

function normalizeText(text) {
  return (text || "").toString().trim().toLowerCase();
}

function propertyFallback(label) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="700" height="450">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#eaf3ff"/>
          <stop offset="100%" stop-color="#cfe2ff"/>
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#g)"/>
      <rect x="90" y="170" width="110" height="170" rx="8" fill="rgba(13,110,253,.18)"/>
      <rect x="230" y="135" width="120" height="205" rx="8" fill="rgba(13,110,253,.22)"/>
      <rect x="385" y="110" width="120" height="230" rx="8" fill="rgba(13,110,253,.18)"/>
      <text x="50%" y="75%" text-anchor="middle" fill="#0d6efd" font-size="28" font-family="Tahoma, Arial" font-weight="700">${label}</text>
    </svg>
  `;
  return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg);
}

window.handlePropertyImgError = function (img, label) {
  img.onerror = null;
  img.src = propertyFallback(label);
};

function getCurrentGovernorate() {
  return governoratesData.find((g) => g.id === state.governorateId) || governoratesData[0];
}

function populateGovernorateSelect() {
  governorateSelect.innerHTML = governoratesData.map((g) => `
    <option value="${g.id}" ${g.id === state.governorateId ? "selected" : ""}>${g.name}</option>
  `).join("");
}

function setSortButtonActive(sort) {
  sortButtons.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.sort === sort);
  });
}

function formatCurrencyArabic(value) {
  return `${formatPrice(value)} ج`;
}

function getSelectedDemands() {
  const allChecked = demandChecks.find((c) => c.value === "all")?.checked;
  if (allChecked) return ["مرتفع جدًا", "مرتفع", "متوسط", "منخفض"];

  return demandChecks
    .filter((c) => c.value !== "all" && c.checked)
    .map((c) => c.value);
}

function maybeNavigateToGovernorate(searchValue) {
  const q = normalizeText(searchValue);
  if (!q) return false;

  const matchedGovernorate = governoratesData.find((g) =>
    normalizeText(g.name).includes(q) ||
    normalizeText(g.capital).includes(q) ||
    normalizeText(g.englishName).includes(q)
  );

  if (matchedGovernorate && matchedGovernorate.id !== state.governorateId) {
    window.location.href = `details.html?id=${matchedGovernorate.id}`;
    return true;
  }

  return false;
}

function getFilteredProperties() {
  const governorate = getCurrentGovernorate();
  let items = [...governorate.properties];
  const demands = getSelectedDemands();

  if (state.type !== "all") {
    items = items.filter((item) => item.type === state.type);
  }

  items = items.filter((item) => item.price <= state.maxPrice);

  if (demands.length) {
    items = items.filter((item) => demands.includes(item.demand));
  }

  if (state.search) {
    const q = normalizeText(state.search);

    items = items.filter((item) => {
      const content = [
        item.title,
        item.city,
        item.type,
        item.demand,
        governorate.name,
        governorate.capital,
        ...governorate.cities
      ].join(" ").toLowerCase();

      return content.includes(q);
    });
  }

  if (state.sort === "low") {
    items.sort((a, b) => a.price - b.price);
  } else if (state.sort === "high") {
    items.sort((a, b) => b.price - a.price);
  } else if (state.sort === "mid") {
    const avg = (governorate.minPrice + governorate.maxPrice) / 2;
    items = items.filter((item) => Math.abs(item.price - avg) <= avg * 0.25);
  }

  return items;
}

function demandBadgeClass(demand) {
  if (demand === "مرتفع جدًا") return "demand-very-high";
  if (demand === "مرتفع") return "demand-high";
  if (demand === "متوسط") return "demand-medium";
  return "demand-low";
}

function renderPropertyCard(item) {
  return `
    <div class="property-card">
      <img
        class="property-image"
        src="${item.image}"
        alt="${item.title}"
        onerror="handlePropertyImgError(this, '${item.city}')"
      />

      <div class="property-body">
        <div class="property-title">${item.title}</div>
        <div class="property-city">${item.city}</div>
        <div class="property-price">بسعر يبدأ من ${formatCurrencyArabic(item.price)}</div>

        <span class="badge-demand ${demandBadgeClass(item.demand)}">${item.demand}</span>

        <div class="property-specs">
          <span>${item.type}</span>
          <span>${item.size} م²</span>
          <span>${item.beds} غرف</span>
          <span>${item.baths} حمام</span>
        </div>

        <div class="property-footer">
          <span>عرض تجريبي للواجهة</span>
          <span>${item.city}</span>
        </div>
      </div>
    </div>
  `;
}

function renderGovernorateHeader(governorate) {
  heroTitle.textContent = `استكشاف المشروعات العقارية في ${governorate.name}`;
  heroSubtitle.textContent = `${governorate.description} — العاصمة: ${governorate.capital}`;

  govMeta.innerHTML = `
    <span class="meta-pill">الإقليم: ${governorate.region}</span>
    <span class="meta-pill">العاصمة: ${governorate.capital}</span>
    <span class="meta-pill">عدد المدن: ${governorate.cities.length}</span>
    <span class="meta-pill">أماكن بارزة: ${governorate.featured.join(" - ")}</span>
  `;
}

function renderPage() {
  const governorate = getCurrentGovernorate();
  renderGovernorateHeader(governorate);

  const items = getFilteredProperties();
  resultsCount.textContent = items.length;

  if (!items.length) {
    propertiesGrid.innerHTML = `
      <div class="empty-box">
        <h3 class="mb-2">لا توجد نتائج</h3>
        <p class="mb-0">غيّر الفلاتر أو ابحث باسم مشروع أو مدينة أخرى.</p>
      </div>
    `;
    return;
  }

  propertiesGrid.innerHTML = items.map(renderPropertyCard).join("");
}

governorateSelect.addEventListener("change", function () {
  window.location.href = `details.html?id=${this.value}`;
});

priceRange.addEventListener("input", function () {
  priceRangeValue.textContent = formatCurrencyArabic(Number(this.value));
});

applyFiltersBtn.addEventListener("click", function () {
  state.search = globalSearchInput.value.trim();
  state.type = typeFilter.value;
  state.maxPrice = Number(priceRange.value);

  const redirected = maybeNavigateToGovernorate(state.search);
  if (redirected) return;

  renderPage();
});

globalSearchInput.addEventListener("keydown", function (e) {
  if (e.key === "Enter") {
    state.search = this.value.trim();
    const redirected = maybeNavigateToGovernorate(state.search);
    if (redirected) return;
    renderPage();
  }
});

sortButtons.forEach((btn) => {
  btn.addEventListener("click", function () {
    state.sort = this.dataset.sort;
    setSortButtonActive(state.sort);
    renderPage();
  });
});

demandChecks.forEach((check) => {
  check.addEventListener("change", function () {
    if (this.value === "all" && this.checked) {
      demandChecks.forEach((c) => {
        c.checked = true;
      });
    }

    if (this.value !== "all" && !this.checked) {
      const allBox = demandChecks.find((c) => c.value === "all");
      if (allBox) allBox.checked = false;
    }

    if (this.value !== "all") {
      const nonAll = demandChecks.filter((c) => c.value !== "all");
      const allSelected = nonAll.every((c) => c.checked);
      const allBox = demandChecks.find((c) => c.value === "all");
      if (allBox) allBox.checked = allSelected;
    }
  });
});

populateGovernorateSelect();
setSortButtonActive(state.sort);
priceRangeValue.textContent = formatCurrencyArabic(Number(priceRange.value));
renderPage();