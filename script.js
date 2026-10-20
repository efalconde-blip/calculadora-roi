(function () {
  const MIN_USERS = 100;
  const MAX_USERS = 100000;
  const ANNUAL_DISCOUNT = 0.15;
  const SLIDER_STEPS = 1000;

  const el = (id) => document.getElementById(id);
  const slider = el("mau-slider");
  const mauInput = el("mau-input");
  const annualSwitch = el("annual");
  const valueInput = el("value-input");
  const planInputs = document.querySelectorAll('input[name="plan"]');

  const out = {
    monthly: el("monthly"),
    monthlySub: el("monthly-sub"),
    annualCost: el("annual-cost"),
    annualValue: el("annual-value"),
    net: el("net"),
    roi: el("roi"),
  };

  let users = Number(mauInput.value);

  // Logarithmic slider: 100 → 100,000 spread evenly across the track,
  // so small teams get as much precision as large ones.
  const logMin = Math.log10(MIN_USERS);
  const logMax = Math.log10(MAX_USERS);
  const sliderToUsers = (pos) => {
    const raw = Math.pow(10, logMin + (pos / SLIDER_STEPS) * (logMax - logMin));
    return roundNice(raw);
  };
  const usersToSlider = (u) =>
    Math.round(((Math.log10(u) - logMin) / (logMax - logMin)) * SLIDER_STEPS);

  function roundNice(n) {
    if (n < 1000) return Math.round(n / 10) * 10;
    if (n < 10000) return Math.round(n / 100) * 100;
    return Math.round(n / 1000) * 1000;
  }

  const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

  // Spanish number format ("1.234,56 $"); grouping forced so 4-digit
  // amounts also get a thousands separator.
  const num = (n, decimals = 0) =>
    n.toLocaleString("es-ES", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
      useGrouping: "always",
    });

  const money = (n) => {
    const abs = Math.abs(n);
    const str = num(abs, abs < 1000 ? 2 : 0) + " $";
    return n < 0 ? "−" + str : str;
  };

  function setText(node, text) {
    if (node.textContent === text) return;
    node.textContent = text;
    node.classList.remove("bump");
    void node.offsetWidth; // restart animation
    node.classList.add("bump");
  }

  function calculate() {
    const pricePerUser = Number(document.querySelector('input[name="plan"]:checked').value);
    const annual = annualSwitch.getAttribute("aria-checked") === "true";
    const valuePerUser = Math.max(0, Number(valueInput.value) || 0);

    const baseMonthly = users * pricePerUser;
    const monthly = annual ? baseMonthly * (1 - ANNUAL_DISCOUNT) : baseMonthly;
    const annualCost = monthly * 12;
    const annualValue = users * valuePerUser * 12;
    const net = annualValue - annualCost;
    const roi = annualCost > 0 ? (net / annualCost) * 100 : 0;

    setText(out.monthly, money(monthly));
    out.monthlySub.innerHTML = annual
      ? `<s>${money(baseMonthly)}</s> &nbsp;facturado ${money(annualCost)} al año`
      : `${num(users)} usuarios × ${num(pricePerUser, 2)} $`;
    setText(out.annualCost, money(annualCost));
    setText(out.annualValue, money(annualValue));
    setText(out.net, money(net));
    setText(out.roi, `${num(Math.round(roi))} %`);
    out.roi.classList.toggle("negative", roi < 0);
    out.roi.classList.toggle("accent", roi >= 0);
  }

  function syncSlider() {
    slider.value = usersToSlider(users);
    slider.style.setProperty("--fill", (slider.value / SLIDER_STEPS) * 100 + "%");
  }

  // Events
  slider.addEventListener("input", () => {
    users = sliderToUsers(Number(slider.value));
    mauInput.value = users;
    slider.style.setProperty("--fill", (slider.value / SLIDER_STEPS) * 100 + "%");
    calculate();
  });

  mauInput.addEventListener("input", () => {
    const n = Number(mauInput.value);
    if (!n) return;
    users = clamp(Math.round(n), MIN_USERS, MAX_USERS);
    syncSlider();
    calculate();
  });
  mauInput.addEventListener("change", () => {
    users = clamp(Math.round(Number(mauInput.value) || MIN_USERS), MIN_USERS, MAX_USERS);
    mauInput.value = users;
    syncSlider();
    calculate();
  });

  planInputs.forEach((r) => r.addEventListener("change", calculate));

  annualSwitch.addEventListener("click", () => {
    const on = annualSwitch.getAttribute("aria-checked") === "true";
    annualSwitch.setAttribute("aria-checked", String(!on));
    calculate();
  });

  valueInput.addEventListener("input", calculate);

  syncSlider();
  calculate();
})();
