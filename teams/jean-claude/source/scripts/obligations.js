const obligationEntries = [
  { id: 1, name: "Home Mortgage",   kind: "mortgage",      balance: 218400.00, interestRate: 0.0489, monthlyPayment: 1420.00 },
  { id: 2, name: "Car Loan",        kind: "car loan",      balance:  14750.00, interestRate: 0.0699, monthlyPayment:  385.00 },
  { id: 3, name: "Personal Loan",   kind: "personal loan", balance:   6200.00, interestRate: 0.1199, monthlyPayment:  225.00 },
  { id: 4, name: "Student Loan",    kind: "personal loan", balance:   9100.00, interestRate: 0.0550, monthlyPayment:  165.00 },
];

function totalMonthlyObligationPayments(entries) {
  return entries.reduce((sum, obligation) => sum + obligation.monthlyPayment, 0);
}

function totalOutstandingBalance(entries) {
  return entries.reduce((sum, obligation) => sum + obligation.balance, 0);
}

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(amount);
}

function formatInterestRate(rate) {
  return new Intl.NumberFormat("en-CA", { style: "percent", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(rate);
}

function kindModifier(kind) {
  return kind.replace(/\s+/g, "-");
}

function renderObligationEntry(obligation) {
  const row = document.createElement("tr");
  row.classList.add("obligation-entry", `obligation-entry--${kindModifier(obligation.kind)}`);
  row.innerHTML = `
    <td class="obligation-entry__name">${obligation.name}</td>
    <td class="obligation-entry__kind">${obligation.kind}</td>
    <td class="obligation-entry__balance">${formatCurrency(obligation.balance)}</td>
    <td class="obligation-entry__interest-rate">${formatInterestRate(obligation.interestRate)}</td>
    <td class="obligation-entry__monthly-payment">${formatCurrency(obligation.monthlyPayment)}</td>
  `;
  return row;
}

function renderObligations() {
  const tbody = document.getElementById("obligation-entries");
  obligationEntries.forEach(obligation => tbody.appendChild(renderObligationEntry(obligation)));

  document.getElementById("obligation-balance-total").textContent = formatCurrency(totalOutstandingBalance(obligationEntries));
  document.getElementById("obligation-monthly-total").textContent = formatCurrency(totalMonthlyObligationPayments(obligationEntries));
}

document.addEventListener("DOMContentLoaded", renderObligations);
