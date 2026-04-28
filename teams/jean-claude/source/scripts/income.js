const incomeEntries = [
  { id: 1, label: "Monthly Salary", amount: 3200.00, frequency: "monthly", type: "salary" },
  { id: 2, label: "Freelance Work", amount: 450.00, frequency: "irregular", type: "irregular" },
  { id: 3, label: "Child Benefits", amount: 120.00, frequency: "monthly", type: "irregular" },
];

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(amount);
}

function totalIncome(entries) {
  return entries.reduce((sum, entry) => sum + entry.amount, 0);
}

function renderIncomeEntry(entry) {
  const row = document.createElement("tr");
  row.classList.add("income-entry", `income-entry--${entry.type}`);
  row.innerHTML = `
    <td class="income-entry__label">${entry.label}</td>
    <td class="income-entry__frequency">${entry.frequency}</td>
    <td class="income-entry__amount">${formatCurrency(entry.amount)}</td>
  `;
  return row;
}

function renderIncome() {
  const tbody = document.getElementById("income-entries");
  incomeEntries.forEach(entry => tbody.appendChild(renderIncomeEntry(entry)));

  const total = totalIncome(incomeEntries);
  document.getElementById("income-total").textContent = formatCurrency(total);
}

document.addEventListener("DOMContentLoaded", renderIncome);
