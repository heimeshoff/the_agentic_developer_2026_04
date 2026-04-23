const drainEntries = [
  { id: 1, name: "Netflix",              category: "streaming",  frequency: "monthly",  amount: 17.99 },
  { id: 2, name: "Spotify",              category: "streaming",  frequency: "monthly",  amount: 11.99 },
  { id: 3, name: "Gym Membership",       category: "health",     frequency: "monthly",  amount: 45.00 },
  { id: 4, name: "Car Insurance",        category: "insurance",  frequency: "monthly",  amount: 180.00 },
  { id: 5, name: "Phone Plan",           category: "utilities",  frequency: "monthly",  amount: 65.00 },
  { id: 6, name: "Cloud Storage",        category: "software",   frequency: "annual",   amount: 99.00 },
  { id: 7, name: "Electricity",          category: "utilities",  frequency: "monthly",  amount: 95.00 },
  { id: 8, name: "Internet",             category: "utilities",  frequency: "monthly",  amount: 70.00 },
];

const monthlyEquivalentFactors = {
  monthly: 1,
  annual:  1 / 12,
  weekly:  52 / 12,
};

function monthlyEquivalent(drain) {
  const factor = monthlyEquivalentFactors[drain.frequency] ?? 1;
  return drain.amount * factor;
}

function totalMonthlyDrains(entries) {
  return entries.reduce((sum, drain) => sum + monthlyEquivalent(drain), 0);
}

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(amount);
}

function renderDrainEntry(drain) {
  const isMonthlyEquivalent = drain.frequency !== "monthly";
  const equivalent = monthlyEquivalent(drain);

  const row = document.createElement("tr");
  row.classList.add("drain-entry", `drain-entry--${drain.category}`);
  row.innerHTML = `
    <td class="drain-entry__name">${drain.name}</td>
    <td class="drain-entry__category">${drain.category}</td>
    <td class="drain-entry__frequency">${drain.frequency}</td>
    <td class="drain-entry__amount">${formatCurrency(drain.amount)}</td>
    <td class="drain-entry__monthly-equivalent ${isMonthlyEquivalent ? "drain-entry__monthly-equivalent--calculated" : ""}">
      ${formatCurrency(equivalent)}${isMonthlyEquivalent ? "<span class='drain-entry__calculated-marker'>÷12</span>" : ""}
    </td>
  `;
  return row;
}

function renderDrains() {
  const tbody = document.getElementById("drain-entries");
  drainEntries.forEach(drain => tbody.appendChild(renderDrainEntry(drain)));

  const total = totalMonthlyDrains(drainEntries);
  document.getElementById("drain-total").textContent = formatCurrency(total);
}

document.addEventListener("DOMContentLoaded", renderDrains);
