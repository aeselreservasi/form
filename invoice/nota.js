const productOptions = [
  { name: "JFT Basic A2", price: 650000 },
  { name: "PM", price: 550000 },
  { name: "Restoran", price: 550000 },
  { name: "Pertanian", price: 550000 },
  { name: "Peternakan", price: 550000 },
  { name: "Kaigo Indonesia", price: 200000 },
  { name: "Kaigo Jepang", price: 200000 },
];
const productList = document.getElementById("productList");
const addItemBtn = document.getElementById("addItemBtn");
const buyerName = document.getElementById("buyerName");
const buyerEmail = document.getElementById("buyerEmail");
const dateInput = document.getElementById("date");
const invoiceBody = document.getElementById("invoiceBody");
const showBuyerName = document.getElementById("showBuyerName");
const showBuyerEmail = document.getElementById("showBuyerEmail");
const invoiceNoEl = document.getElementById("invoiceNo");
const invoiceDateEl = document.getElementById("invoiceDate");
const dueDateEl = document.getElementById("in");
const proofInput = document.getElementById("proofInput");
const proofBox = document.getElementById("proofBox");
const paymentAmount = document.getElementById("paymentAmount");
const paymentStatus = document.getElementById("paymentStatus");
function formatIDR(n) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n || 0);
}
function formatTanggalIndonesia(tanggal) {
  if (!tanggal) return "-";
  const bulan = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  const t = new Date(tanggal);
  const hari = t.getDate();
  const bulanNama = bulan[t.getMonth()];
  const tahun = t.getFullYear();
  return `${hari} ${bulanNama} ${tahun}`;
}
function getKodeProduk(nama) {
  const n = (nama || "").toLowerCase();
  if (n.includes("jft")) return "JFT";
  if (n === "pm") return "PM1";
  if (n.includes("restoran")) return "RST";
  if (n.includes("pertanian")) return "PRT";
  if (n.includes("peternakan")) return "PTN";
  if (n.includes("kaigo indonesia")) return "KGI";
  if (n.includes("kaigo jepang")) return "KGJ";
  return "GEN";
}
function generateInvoiceCode({ layanan, jenisUjianCode, tanggalUjianISO, telepon }) {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const cleanPhone = (telepon || "").replace(/\D/g, "");
  const last4 = cleanPhone.slice(-4) || "0000";
  const kodeJenis = jenisUjianCode || "GEN";
  const prefixLayanan = layanan === "reschedule" ? "RSC" : "RSV";
  return `INV-${prefixLayanan}-${kodeJenis}-${y}${m}${d}-${last4}`;
}
function genInvoiceNo() {
  const layanan = "reservasi";
  const telepon = (buyerEmail.value || "").trim();
  const tanggalUjianISO = dateInput.value || new Date().toISOString().slice(0, 10);
  const items = getProducts();
  let jenisUjianCode = "GEN";
  if (items.length > 0) {
    jenisUjianCode = getKodeProduk(items[0].name);
  }
  return generateInvoiceCode({
    layanan,
    jenisUjianCode,
    tanggalUjianISO,
    telepon,
  });
}
dateInput.valueAsDate = new Date();
invoiceDateEl.textContent = formatTanggalIndonesia(new Date());
if (dueDateEl) {
  dueDateEl.textContent = formatTanggalIndonesia(new Date());
}
invoiceNoEl.textContent = genInvoiceNo();
function createProductRow() {
  const div = document.createElement("div");
  div.className = "product-row";
  const select = document.createElement("select");
  const defaultOpt = document.createElement("option");
  defaultOpt.value = "";
  defaultOpt.textContent = "-- Pilih Produk --";
  select.appendChild(defaultOpt);
  productOptions.forEach((p) => {
    const o = document.createElement("option");
    o.value = p.name;
    o.dataset.price = p.price;
    o.textContent = `${p.name} - Rp${p.price.toLocaleString("id-ID")}`;
    select.appendChild(o);
  });
  const qty = document.createElement("input");
  qty.type = "number";
  qty.min = "1";
  qty.value = "1";
  qty.className = "qty";
  const price = document.createElement("input");
  price.type = "number";
  price.placeholder = "Harga";
  price.readOnly = true;
  const remove = document.createElement("button");
  remove.textContent = "×";
  remove.className = "red";
  remove.type = "button";
  remove.onclick = () => {
    div.remove();
    updatePreview();
  };
  select.onchange = () => {
    price.value = select.selectedOptions[0].dataset.price || 0;
    updatePreview();
  };
  qty.oninput = updatePreview;
  div.append(select, qty, price, remove);
  return div;
}
function getProducts() {
  const rows = productList.querySelectorAll(".product-row");
  const items = [];
  rows.forEach((r) => {
    const select = r.querySelector("select");
    const qty = r.querySelector(".qty");
    const price = r.querySelector('input[type="number"]:not(.qty)');
    if (select.value) {
      items.push({
        name: select.value,
        qty: Number(qty.value) || 1,
        price: Number(price.value) || 0,
      });
    }
  });
  return items;
}
function updatePreview() {
  const items = getProducts();
  invoiceBody.innerHTML = "";
  let total = 0;
  if (items.length === 0) {
    invoiceBody.innerHTML = '<tr><td colspan="4" class="small">Belum ada item</td></tr>';
  } else {
    items.forEach((it) => {
      const subtotal = it.qty * it.price;
      total += subtotal;
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${it.name}</td><td>${it.qty}</td><td>${formatIDR(it.price)}</td><td>${formatIDR(subtotal)}</td>`;
      invoiceBody.appendChild(tr);
    });
  }
  const trTotal = document.createElement("tr");
  trTotal.className = "total-row";
  trTotal.innerHTML = `<td colspan="3" style="text-align: right;">Total</td><td>${formatIDR(total)}</td>`;
  invoiceBody.appendChild(trTotal);
  const paid = Number(paymentAmount.value) || 0;
  if (paid > 0) {
    const trPaid = document.createElement("tr");
    if (paid >= total) {
      trPaid.innerHTML = `<td colspan="3" style="text-align: right;">Bayar</td><td>${formatIDR(paid)}</td>`;
    } else {
      trPaid.innerHTML = `<td colspan="3" style="text-align: right;">DP (Uang Muka)</td><td>${formatIDR(paid)}</td>`;
    }
    invoiceBody.appendChild(trPaid);
    const remaining = Math.max(total - paid, 0);
    if (remaining > 0) {
      const trSisa = document.createElement("tr");
      trSisa.innerHTML = `<td colspan="3" style="text-align: right;">Sisa Bayar</td><td>${formatIDR(remaining)}</td>`;
      invoiceBody.appendChild(trSisa);
    }
  } else {
    const trUnpaid = document.createElement("tr");
    trUnpaid.innerHTML = `<td colspan="3" style="text-align: right;">Belum dibayar</td><td>0</td>`;
    invoiceBody.appendChild(trUnpaid);
  }
  showBuyerName.textContent = buyerName.value || "-";
  showBuyerEmail.textContent = buyerEmail.value || "-";
  if (dateInput.value) {
    const t = new Date(dateInput.value);
    invoiceDateEl.textContent = formatTanggalIndonesia(t);
    if (dueDateEl) {
      dueDateEl.textContent = formatTanggalIndonesia(t);
    }
  }
  if (paid >= total && total > 0) {
    paymentStatus.textContent = "Lunas";
    paymentStatus.style.color = "#0b9b6e";
  } else if (paid > 0 && paid < total) {
    paymentStatus.textContent = "DP (Uang Muka)";
    paymentStatus.style.color = "#e67e22";
  } else {
    paymentStatus.textContent = "Belum dibayar";
    paymentStatus.style.color = "#c0392b";
  }
  invoiceNoEl.textContent = genInvoiceNo();
}
proofInput.onchange = () => {
  const f = proofInput.files[0];
  if (!f) {
    proofBox.innerHTML = '<span class="small">Belum ada</span>';
    return;
  }
  const r = new FileReader();
  r.onload = (e) => {
    proofBox.innerHTML = `<img src="${e.target.result}">`;
  };
  r.readAsDataURL(f);
};
addItemBtn.onclick = () => {
  productList.appendChild(createProductRow());
};
document.getElementById("updateBtn").onclick = (e) => {
  e.preventDefault();
  updatePreview();
};
productList.appendChild(createProductRow());
updatePreview();
document.getElementById("downloadBtn").onclick = () => {
  const element = document.getElementById("invoice");
  const custName = document.getElementById("buyerName").value.trim();
  const safeCustName = custName.replace(/\s+/g, "_");
  const opt = {
    margin: 5,
    filename: `invoice_${safeCustName}.pdf`,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 2, scrollY: 0 },
    jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
  };
  html2pdf().set(opt).from(element).save();
};
