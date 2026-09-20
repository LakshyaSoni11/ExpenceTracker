import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const formatINR = (value) => {
  const num = Number(value) || 0;
  return num.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const formatDate = (dateString) => {
  if (!dateString) return "—";
  const date = new Date(dateString);
  if (isNaN(date)) return "—";
  return date.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getGroupName = (groupId, groups) => {
  const group = groups.find((g) => g.id === groupId);
  return group ? group.name : "Unknown Group";
};

const getSplitDetails = (expense) => {
  if (!expense.splits || expense.splits.length === 0) return "";
  return expense.splits.map((s) => `${s.member}: ${formatINR(s.amount)}`).join(" | ");
};

const getPayerTotals = (expenses) => {
  const totals = {};
  expenses.forEach((expense) => {
    const payer = expense.paidBy || "Unknown";
    totals[payer] = (totals[payer] || 0) + (Number(expense.amount) || 0);
  });
  return Object.entries(totals).sort((a, b) => b[1] - a[1]);
};

const escapeCsvCell = (value) => {
  const str = String(value ?? "");
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

const toCsvRow = (cells) => cells.map(escapeCsvCell).join(",");

export const downloadExpenseCSV = ({ expenses, groups, settlements }) => {
  const lines = [];

  lines.push("EXPENSE REPORT — ExpenceTracker");
  lines.push(`Generated on,${new Date().toLocaleString()}`);
  lines.push("");

  const totalSpent = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const totalSettled = settlements.reduce((sum, s) => sum + (Number(s.amount) || 0), 0);

  lines.push("SUMMARY");
  lines.push(toCsvRow(["Total Spent", formatINR(totalSpent)]));
  lines.push(toCsvRow(["Total Settled", formatINR(totalSettled)]));
  lines.push(toCsvRow(["Expense Count", expenses.length]));
  lines.push(toCsvRow(["Settlement Count", settlements.length]));
  lines.push(toCsvRow(["Group Count", groups.length]));
  lines.push("");

  lines.push("EXPENSES");
  lines.push(
    toCsvRow([
      "Date",
      "Group",
      "Description",
      "Amount (₹)",
      "Paid By",
      "Split Type",
      "Split Details (Member: Amount)",
    ])
  );
  expenses.forEach((expense) => {
    lines.push(
      toCsvRow([
        formatDate(expense.createdAt),
        getGroupName(expense.groupId, groups),
        expense.description || "",
        formatINR(expense.amount),
        expense.paidBy || "",
        expense.splitType || "",
        getSplitDetails(expense),
      ])
    );
  });
  lines.push("");

  lines.push("PAYMENTS BY MEMBER");
  lines.push(toCsvRow(["Member", "Total Paid"]));
  getPayerTotals(expenses).forEach(([member, total]) => {
    lines.push(toCsvRow([member, formatINR(total)]));
  });
  lines.push("");

  lines.push("SETTLEMENTS");
  lines.push(toCsvRow(["Date", "Group", "From", "To", "Amount"]));
  settlements.forEach((settlement) => {
    lines.push(
      toCsvRow([
        formatDate(settlement.createdAt),
        getGroupName(settlement.groupId, groups),
        settlement.from || "",
        settlement.to || "",
        formatINR(settlement.amount),
      ])
    );
  });

  const blob = new Blob(["\uFEFF" + lines.join("\r\n")], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const stamp = new Date().toISOString().slice(0, 10);
  link.href = url;
  link.download = `expense-report-${stamp}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const downloadExpensePDF = ({ expenses, groups, settlements }) => {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;
  const contentWidth = pageWidth - margin * 2;

  const totalSpent = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const totalSettled = settlements.reduce((sum, s) => sum + (Number(s.amount) || 0), 0);

  const addPageHeader = (title) => {
    doc.saveGraphicsState();
    doc.setFillColor(16, 122, 87); // emerald-700
    doc.rect(0, 0, pageWidth, 72, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(title, margin, 30);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("ExpenceTracker — Expense Report", pageWidth - margin, 26, { align: "right" });
    doc.text(
      `Generated on ${new Date().toLocaleString()}`,
      pageWidth - margin,
      38,
      { align: "right" }
    );
    doc.restoreGraphicsState();
    return 88;
  };

  const addSectionTitle = (title, startY) => {
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(title, margin, startY + 6);
    doc.setFontSize(9);
    return startY + 18;
  };

  let y = addPageHeader("Expense Report");

  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("Summary", margin, y + 6);
  y += 18;

  const stats = [
    { label: "Total Spent", value: `Rs. ${formatINR(totalSpent)}` },
    { label: "Total Settled", value: `Rs. ${formatINR(totalSettled)}` },
    { label: "Expenses", value: String(expenses.length) },
    { label: "Groups", value: String(groups.length) },
  ];

  const boxW = contentWidth / stats.length;
  const boxH = 58;
  stats.forEach((stat, idx) => {
    const x = margin + idx * boxW;
    doc.setFillColor(240, 253, 244);
    doc.setDrawColor(16, 122, 87);
    doc.setLineWidth(0.5);
    doc.roundedRect(x, y, boxW - 6, boxH, 6, 6, "FD");
    doc.setTextColor(16, 122, 87);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(stat.label.toUpperCase(), x + 10, y + 20);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(15, 23, 42);
    doc.text(stat.value, x + 10, y + 42);
  });
  y += boxH + 24;

  y = addSectionTitle("Expense Details", y);

  let tableY;
  autoTable(doc, {
    startY: y,
    head: [
      ["Date", "Group", "Description", "Paid By", "Split Type", "Amount (Rs.)"],
    ],
    body: expenses.map((expense) => [
      formatDate(expense.createdAt),
      getGroupName(expense.groupId, groups),
      expense.description || "",
      expense.paidBy || "",
      expense.splitType || "",
      formatINR(expense.amount),
    ]),
    theme: "grid",
    styles: { fontSize: 8, cellPadding: 5 },
    headStyles: {
      fillColor: [16, 122, 87],
      textColor: 255,
      fontStyle: "bold",
    },
    alternateRowStyles: { fillColor: [241, 245, 249] },
    columnStyles: {
      5: { halign: "right", fontStyle: "bold" },
    },
  });
  tableY = doc.lastAutoTable.finalY;

  if (expenses.length === 0) {
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text("No expenses recorded yet.", margin, tableY + 16);
    tableY += 28;
  }

  autoTable(doc, {
    startY: tableY + 24,
    head: [["Split Details (who owes what)"]],
    body: expenses.map((expense) => [getSplitDetails(expense)]),
    theme: "grid",
    styles: { fontSize: 8, cellPadding: 5 },
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: 255,
      fontStyle: "bold",
    },
    alternateRowStyles: { fillColor: [241, 245, 249] },
  });
  tableY = doc.lastAutoTable.finalY;

  if (expenses.length === 0) {
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text("No split details to show.", margin, tableY + 16);
    tableY += 24;
  }

  autoTable(doc, {
    startY: tableY + 24,
    head: [["Payments by Member", "Total Paid (Rs.)"]],
    body: getPayerTotals(expenses).map(([member, total]) => [
      member,
      formatINR(total),
    ]),
    theme: "grid",
    styles: { fontSize: 8, cellPadding: 5 },
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: 255,
      fontStyle: "bold",
    },
    alternateRowStyles: { fillColor: [241, 245, 249] },
    columnStyles: { 1: { halign: "right", fontStyle: "bold" } },
  });
  tableY = doc.lastAutoTable.finalY;

  if (getPayerTotals(expenses).length === 0) {
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text("No payments recorded yet.", margin, tableY + 16);
    tableY += 24;
  }

  autoTable(doc, {
    startY: tableY + 24,
    head: [["Settlement History", "Group", "From", "To", "Amount (Rs.)"]],
    body: settlements.map((settlement) => [
      formatDate(settlement.createdAt),
      getGroupName(settlement.groupId, groups),
      settlement.from || "",
      settlement.to || "",
      formatINR(settlement.amount),
    ]),
    theme: "grid",
    styles: { fontSize: 8, cellPadding: 5 },
    headStyles: {
      fillColor: [16, 122, 87],
      textColor: 255,
      fontStyle: "bold",
    },
    alternateRowStyles: { fillColor: [241, 245, 249] },
    columnStyles: { 4: { halign: "right", fontStyle: "bold" } },
  });
  tableY = doc.lastAutoTable.finalY;

  if (settlements.length === 0) {
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text("No settlements recorded yet.", margin, tableY + 16);
    tableY += 24;
  }

  const footerY = Math.min(tableY + 40, doc.internal.pageSize.getHeight() - 30);
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, footerY, pageWidth - margin, footerY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(`Grand Total Spent: Rs. ${formatINR(totalSpent)}`, margin, footerY + 14);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text("Generated by ExpenceTracker", pageWidth - margin, footerY + 14, {
    align: "right",
  });

  const stamp = new Date().toISOString().slice(0, 10);
  doc.save(`expense-report-${stamp}.pdf`);
};

export const expenseReport = { downloadExpenseCSV, downloadExpensePDF };