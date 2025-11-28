const SUBMIT_FUNCTION_URL = "https://yuwfecfaoouylnzsdlnr.supabase.co/functions/v1/submit";
const STORAGE_STEP_KEY = "aesel_current_step";
const STORAGE_LAYANAN_KEY = "aesel_layanan";
const STORAGE_FORM_KEY = "aesel_form_data";
const layananForm = document.getElementById("layanan-form");
const step1 = document.getElementById("step1");
const step2 = document.getElementById("step2");
const step3 = document.getElementById("step3");
const modeLayanan = document.getElementById("mode-layanan");
const reservasiFields = document.getElementById("reservasi-only");
const progressBar = document.getElementById("progress-bar");
const tanggalInput = document.getElementById("tanggal-ujian");
const previewTanggal = document.getElementById("preview-tanggal");
const tglLahirInput = document.getElementById("tgl-lahir");
const previewTglLahir = document.getElementById("preview-tgl-lahir");
const btnBack = document.getElementById("btn-back");
const btnResetData = document.getElementById("btn-reset-data");
const resetModalEl = document.getElementById("resetModal");
const btnConfirmReset = document.getElementById("btn-confirm-reset");
const resetModal = resetModalEl ? new bootstrap.Modal(resetModalEl) : null;
const togglePasswordBtn = document.getElementById("toggle-password");
const passwordField = document.getElementById("password");
const passwordIcon = document.getElementById("password-icon");
const lokasiError = document.getElementById("lokasi-error");
const tanggalError = document.getElementById("tanggal-error");
const paymentInstruction = document.getElementById("payment-instruction");
const payMethodButtons = document.querySelectorAll(".pay-method");
const btnBackToForm = document.getElementById("btn-back-to-form");
const summaryLayanan = document.getElementById("summary-layanan");
const summaryNama = document.getElementById("summary-nama");
const summaryTelepon = document.getElementById("summary-telepon");
const summaryJenisUjian = document.getElementById("summary-jenis-ujian");
const summaryLokasi = document.getElementById("summary-lokasi");
const summaryTanggalUjian = document.getElementById("summary-tanggal-ujian");
const summaryJamUjian = document.getElementById("summary-jam-ujian");
const summaryTotal = document.getElementById("summary-total");
let lastFormData = null;
let isDataTersimpan = false;
function saveStep(stepNumber) {
  sessionStorage.setItem(STORAGE_STEP_KEY, String(stepNumber));
  sessionStorage.setItem(STORAGE_LAYANAN_KEY, modeLayanan.value || "");
}
function transitionStep(fromStep, toStep, progress, stepNumber) {
  if (fromStep) fromStep.style.display = "none";
  if (toStep) toStep.style.display = "block";
  progressBar.style.width = progress + "%";
  progressBar.setAttribute("aria-valuenow", progress);
  if (stepNumber !== undefined) {
    saveStep(stepNumber);
  }
}
const hargaPerJenis = {
  JFT: 650000,
  PM: 550000,
  RESTO: 550000,
  KGINDO: 200000,
  KGJAPAN: 200000,
  PERTANIAN: 550000,
  PETERNAKAN: 550000,
};
const HARGA_RESCHEDULE = 50000;
function getHarga(layanan, jenisKode) {
  if (layanan === "reschedule") return HARGA_RESCHEDULE;
  return hargaPerJenis[jenisKode] || 650000;
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
function formatRupiah(angka) {
  return "Rp " + (angka || 0).toLocaleString("id-ID");
}
layananForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const layanan = document.getElementById("layanan").value;
  if (!layanan) {
    document.getElementById("layanan").classList.add("is-invalid");
    return;
  }
  document.getElementById("layanan").classList.remove("is-invalid");
  modeLayanan.value = layanan;
  saveFormDataToStorage();
  if (layanan === "reservasi") {
    reservasiFields.style.display = "block";
    tglLahirInput.setAttribute("required", "required");
    document.getElementById("jenis-kelamin").setAttribute("required", "required");
  } else {
    reservasiFields.style.display = "none";
    tglLahirInput.removeAttribute("required");
    document.getElementById("jenis-kelamin").removeAttribute("required");
  }
  transitionStep(step1, step2, 50, 2);
});
btnBack.addEventListener("click", () => transitionStep(step2, step1, 0, 1));
togglePasswordBtn.addEventListener("click", () => {
  if (passwordField.type === "password") {
    passwordField.type = "text";
    passwordIcon.classList.replace("bi-eye-slash", "bi-eye");
  } else {
    passwordField.type = "password";
    passwordIcon.classList.replace("bi-eye", "bi-eye-slash");
  }
});
function formatTanggalIndo(isoDate) {
  if (!isoDate) return "";
  const bulan = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  const [y, m, d] = isoDate.split("-");
  const tanggal = String(d).padStart(2, "0");
  return `${tanggal} ${bulan[parseInt(m) - 1]} ${y}`;
}
tanggalInput.addEventListener("input", () => {
  const formatted = formatTanggalIndo(tanggalInput.value);
  previewTanggal.textContent = formatted ? `📅 Tanggal ujian: ${formatted}` : "";
});
tglLahirInput.addEventListener("input", () => {
  const formatted = formatTanggalIndo(tglLahirInput.value);
  previewTglLahir.textContent = formatted ? `🎂 Tanggal lahir: ${formatted}` : "";
});
function getLokasiTerpilih() {
  return Array.from(document.querySelectorAll('input[name="lokasi"]:checked')).map((el) => el.value);
}
["nama", "telepon", "jenis-ujian", "id-prometrik", "password", "tgl-lahir", "jenis-kelamin", "tanggal-ujian", "jam-ujian"].forEach((id) => {
  const el = document.getElementById(id);
  if (!el) return;
  const ev = el.tagName === "SELECT" || el.type === "date" ? "change" : "input";
  el.addEventListener(ev, saveFormDataToStorage);
});
document.querySelectorAll('input[name="lokasi"]').forEach((cb) => {
  cb.addEventListener("change", saveFormDataToStorage);
});
document.getElementById("data-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.target;
  const lokasiArray = getLokasiTerpilih();
  const lokasiChecked = lokasiArray.length;
  const tanggal = tanggalInput.value;
  lokasiError.style.display = lokasiChecked > 0 ? "none" : "block";
  tanggalError.style.display = tanggal ? "none" : "block";
  if (!form.checkValidity() || lokasiChecked === 0 || !tanggal) {
    form.classList.add("was-validated");
    return false;
  }
  const layanan = modeLayanan.value;
  const nama = document.getElementById("nama").value.trim();
  const telepon = document.getElementById("telepon").value;
  const jenisUjianSelect = document.getElementById("jenis-ujian");
  const jenisUjianCode = jenisUjianSelect.value;
  const jenisUjianLabel = jenisUjianSelect.options[jenisUjianSelect.selectedIndex].text;
  const idPrometrik = document.getElementById("id-prometrik").value;
  const password = document.getElementById("password").value;
  const tglLahirISO = tglLahirInput.value;
  const tglLahirFormatted = tglLahirISO ? formatTanggalIndo(tglLahirISO) : null;
  const jenisKelamin = document.getElementById("jenis-kelamin")?.value || null;
  const tanggalUjianISO = tanggalInput.value;
  const tanggalUjianFormatted = formatTanggalIndo(tanggalUjianISO);
  const jamUjian = document.getElementById("jam-ujian").value || null;
  const lokasi = lokasiArray.join(", ");
  const harga = getHarga(layanan, jenisUjianCode);
  const invoiceCode = generateInvoiceCode({ layanan, jenisUjianCode, tanggalUjianISO, telepon });
  const formData = {
    layanan,
    nama,
    telepon,
    jenisUjianCode,
    jenisUjianLabel,
    idPrometrik,
    password,
    tglLahirISO,
    tglLahirFormatted,
    jenisKelamin,
    tanggalUjianISO,
    tanggalUjianFormatted,
    jamUjian,
    lokasiArray,
    lokasi,
    harga,
    invoiceCode,
  };
  lastFormData = formData;
  sessionStorage.setItem(STORAGE_FORM_KEY, JSON.stringify(formData));
  isDataTersimpan = false;
  await kirimKeWhatsAppDanSimpanSupabase(formData);
  isiRingkasanPembayaran(formData);
  transitionStep(step2, step3, 100, 3);
  return false;
});
async function kirimKeWhatsAppDanSimpanSupabase(data) {
  const {
    layanan,
    nama,
    telepon,
    jenisUjianCode,
    jenisUjianLabel,
    idPrometrik,
    password,
    tglLahirISO,
    tglLahirFormatted,
    jenisKelamin,
    tanggalUjianISO,
    tanggalUjianFormatted,
    jamUjian,
    lokasiArray,
    lokasi,
    harga,
    invoiceCode,
  } = data;
  try {
    const payload = {
      layanan: layanan,
      nama_lengkap: nama,
      nomor_telepon: telepon,
      jenis_ujian_kode: jenisUjianCode,
      jenis_ujian_nama: jenisUjianLabel,
      id_prometrik: idPrometrik,
      password: password,
      tanggal_lahir_iso: layanan === "reservasi" ? tglLahirISO : null,
      tanggal_lahir: layanan === "reservasi" ? tglLahirFormatted : "-",
      jenis_kelamin: jenisKelamin,
      lokasi_ujian: lokasi,
      lokasi_ujian_list: lokasiArray,
      tanggal_ujian_iso: tanggalUjianISO,
      tanggal_ujian: tanggalUjianFormatted,
      jam_ujian: jamUjian,
      order_id: invoiceCode,
      status_pembayaran: "BELUM BAYAR",
    };
    const res = await fetch(SUBMIT_FUNCTION_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await res.json();
    if (!res.ok || result.error) {
      const msg = result.error || `HTTP ${res.status}`;
      if (String(msg).includes("duplicate")) {
        alert("Data ini sudah terdaftar, tidak boleh duplikat!");
      } else {
        alert("Error menyimpan data: " + msg);
      }
      return;
    }
    isDataTersimpan = true;
  } catch (e) {
    console.error(e);
    alert("Kesalahan tak terduga saat menyimpan data.");
    return;
  }
  const jamUjianText = jamUjian || "-";
  const hargaText = formatRupiah(harga);
  const pesan =
    `*INVOICE PEMBAYARAN UJIAN*\n` +
    `--------------------------------\n` +
    `Kode Invoice : *${invoiceCode}*\n` +
    `Status       : *BELUM BAYAR*\n` +
    `Total        : *${hargaText}*\n` +
    `--------------------------------\n` +
    `*Data Peserta*\n` +
    `Nama         : ${nama}\n` +
    `Telepon      : ${telepon}\n` +
    `Layanan      : ${layanan}\n` +
    `Jenis Ujian  : ${jenisUjianLabel}\n` +
    `ID Prometrik : ${idPrometrik}\n` +
    `Password     : ${password}\n` +
    (layanan === "reservasi" ? `Tanggal Lahir : ${tglLahirFormatted || "-"}\n` + `Jenis Kelamin : ${jenisKelamin || "-"}\n` : "") +
    `\n*Jadwal Ujian*\n` +
    `Lokasi       : ${lokasi}\n` +
    `Tanggal      : ${tanggalUjianFormatted}\n` +
    `Jam          : ${jamUjianText}\n` +
    `\n*Instruksi Pembayaran*\n` +
    `Silakan lakukan pembayaran sesuai total di atas.\n` +
    `Setelah pembayaran, kirim *bukti transfer* dan *kode invoice* ini ke admin.\n`;
  const waUrl = `https://wa.me/62895346030735?text=${encodeURIComponent(pesan)}`;
  window.open(waUrl, "_blank");
}
function isiRingkasanPembayaran(data) {
  const { layanan, nama, telepon, jenisUjianLabel, lokasi, tanggalUjianFormatted, jamUjian, harga } = data;
  if (layanan === "reservasi") {
    summaryLayanan.innerHTML = '<span class="badge bg-primary">Reservasi</span>';
  } else {
    summaryLayanan.innerHTML = '<span class="badge bg-warning text-dark">Reschedule (Biaya admin Rp 50.000)</span>';
  }
  summaryNama.textContent = nama;
  summaryTelepon.textContent = telepon;
  summaryJenisUjian.textContent = jenisUjianLabel;
  summaryLokasi.textContent = lokasi;
  summaryTanggalUjian.textContent = tanggalUjianFormatted;
  summaryJamUjian.textContent = jamUjian || "-";
  summaryTotal.textContent = formatRupiah(harga);
}
payMethodButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    payMethodButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    const method = btn.dataset.method;
    updatePaymentInstruction(method);
  });
});
function updatePaymentInstruction(method) {
  if (!paymentInstruction) return;
  if (method === "bank") {
    paymentInstruction.innerHTML =
      "<strong>Transfer Bank</strong><br>" +
      "Silakan transfer sesuai total tagihan ke:<br>" +
      "Bank BCA a.n. Asep Ridwansyah<br>" +
      "No. Rek: <strong>1481 4175 09</strong><br>" +
      "Bank Jago a.n. Asep Ridwansyah<br>" +
      "No. Rek: <strong>1026 8278 3938</strong><br>" +
      "SeaBank a.n. Asep Ridwansyah<br>" +
      "No. Rek: <strong>9011 8716 6910</strong><br>" +
      "Kirim bukti transfer ke <a href='https://wa.me/62895346030735' target='_blank' rel='noopener noreferrer'><strong>WhatsApp Admin</strong></a>.";
  } else if (method === "ewallet") {
    paymentInstruction.innerHTML =
      "<strong>E-Wallet</strong><br>" +
      "Kirim pembayaran ke nomor:<br>" +
      "<strong>0895 3460 30735</strong> (GoPay/DANA)<br>" +
      "<strong>0898 515 2070</strong> (OVO/DOKU)<br>" +
      "a.n. Asep Ridwansyah<br>" +
      "Kirim bukti transfer ke <a href='https://wa.me/62895346030735' target='_blank' rel='noopener noreferrer'><strong>WhatsApp Admin</strong></a>.";
  } else if (method === "qris") {
    paymentInstruction.innerHTML =
      "<strong>QRIS</strong><br>" +
      "<img src='qris.jpeg' style='width:250px; height:auto; display:block; margin:10px auto;' />" +
      "<br>a.n. Aesel Reservasi<br>" +
      "Kirim bukti transfer ke <a href='https://wa.me/62895346030735' target='_blank' rel='noopener noreferrer'><strong>WhatsApp Admin</strong></a>.";
  } else {
    paymentInstruction.textContent = "Pilih metode pembayaran untuk melihat instruksi pembayaran.";
  }
}
function resetAllData() {
  sessionStorage.removeItem(STORAGE_STEP_KEY);
  sessionStorage.removeItem(STORAGE_LAYANAN_KEY);
  sessionStorage.removeItem(STORAGE_FORM_KEY);
  lastFormData = null;
  isDataTersimpan = false;
  document.getElementById("layanan").value = "";
  modeLayanan.value = "";
  document.getElementById("nama").value = "";
  document.getElementById("telepon").value = "";
  document.getElementById("jenis-ujian").value = "";
  document.getElementById("id-prometrik").value = "";
  passwordField.value = "";
  tglLahirInput.value = "";
  const jkEl = document.getElementById("jenis-kelamin");
  if (jkEl) jkEl.value = "";
  tanggalInput.value = "";
  document.getElementById("jam-ujian").value = "";
  document.querySelectorAll('input[name="lokasi"]').forEach((cb) => {
    cb.checked = false;
  });
  previewTanggal.textContent = "";
  previewTglLahir.textContent = "";
  lokasiError.style.display = "none";
  tanggalError.style.display = "none";
  const dataForm = document.getElementById("data-form");
  if (dataForm) dataForm.classList.remove("was-validated");
  step1.style.display = "block";
  step2.style.display = "none";
  step3.style.display = "none";
  progressBar.style.width = "0%";
  progressBar.setAttribute("aria-valuenow", "0");
  if (summaryLayanan) summaryLayanan.textContent = "";
  if (summaryNama) summaryNama.textContent = "";
  if (summaryTelepon) summaryTelepon.textContent = "";
  if (summaryJenisUjian) summaryJenisUjian.textContent = "";
  if (summaryLokasi) summaryLokasi.textContent = "";
  if (summaryTanggalUjian) summaryTanggalUjian.textContent = "";
  if (summaryJamUjian) summaryJamUjian.textContent = "";
  if (summaryTotal) summaryTotal.textContent = "";
}
if (btnResetData && resetModal) {
  btnResetData.addEventListener("click", () => {
    resetModal.show();
  });
}
if (btnConfirmReset && resetModal) {
  btnConfirmReset.addEventListener("click", () => {
    resetAllData();
    resetModal.hide();
  });
}
if (btnBackToForm) {
  btnBackToForm.addEventListener("click", () => {
    transitionStep(step3, step2, 50, 2);
  });
}
function saveFormDataToStorage() {
  const lokasiArray = getLokasiTerpilih();
  const data = {
    layanan: modeLayanan.value || document.getElementById("layanan").value || "",
    nama: document.getElementById("nama").value || "",
    telepon: document.getElementById("telepon").value || "",
    jenisUjianCode: document.getElementById("jenis-ujian").value || "",
    idPrometrik: document.getElementById("id-prometrik").value || "",
    password: passwordField.value || "",
    tglLahirISO: tglLahirInput.value || "",
    jenisKelamin: document.getElementById("jenis-kelamin")?.value || "",
    tanggalUjianISO: tanggalInput.value || "",
    jamUjian: document.getElementById("jam-ujian").value || "",
    lokasiArray: lokasiArray,
  };
  sessionStorage.setItem(STORAGE_FORM_KEY, JSON.stringify(data));
}
(function restoreState() {
  const savedRaw = sessionStorage.getItem(STORAGE_FORM_KEY);
  let saved = null;
  if (savedRaw) {
    try {
      saved = JSON.parse(savedRaw);
      if (saved.layanan) {
        document.getElementById("layanan").value = saved.layanan;
        modeLayanan.value = saved.layanan;
      }
      document.getElementById("nama").value = saved.nama || "";
      document.getElementById("telepon").value = saved.telepon || "";
      document.getElementById("jenis-ujian").value = saved.jenisUjianCode || "";
      document.getElementById("id-prometrik").value = saved.idPrometrik || "";
      passwordField.value = saved.password || "";
      tglLahirInput.value = saved.tglLahirISO || "";
      const jkEl = document.getElementById("jenis-kelamin");
      if (jkEl && saved.jenisKelamin) jkEl.value = saved.jenisKelamin;
      tanggalInput.value = saved.tanggalUjianISO || "";
      document.getElementById("jam-ujian").value = saved.jamUjian || "";
      if (Array.isArray(saved.lokasiArray)) {
        document.querySelectorAll('input[name="lokasi"]').forEach((cb) => {
          cb.checked = saved.lokasiArray.includes(cb.value);
        });
      }
      if (saved.tanggalUjianISO) {
        previewTanggal.textContent = `📅 Tanggal ujian: ${formatTanggalIndo(saved.tanggalUjianISO)}`;
      }
      if (saved.tglLahirISO) {
        previewTglLahir.textContent = `🎂 Tanggal lahir: ${formatTanggalIndo(saved.tglLahirISO)}`;
      }
      if (saved.layanan === "reservasi") {
        reservasiFields.style.display = "block";
        tglLahirInput.setAttribute("required", "required");
        if (jkEl) jkEl.setAttribute("required", "required");
      } else {
        reservasiFields.style.display = "none";
        tglLahirInput.removeAttribute("required");
        if (jkEl) jkEl.removeAttribute("required");
      }
    } catch (e) {
      console.warn("Gagal parse form dari storage", e);
    }
  }
  const savedStep = sessionStorage.getItem(STORAGE_STEP_KEY);
  if (savedStep === "2") {
    step1.style.display = "none";
    step2.style.display = "block";
    step3.style.display = "none";
    progressBar.style.width = "50%";
    progressBar.setAttribute("aria-valuenow", "50");
  } else if (savedStep === "3") {
    step1.style.display = "none";
    step2.style.display = "none";
    step3.style.display = "block";
    progressBar.style.width = "100%";
    progressBar.setAttribute("aria-valuenow", "100");
    if (saved && saved.invoiceCode) {
      lastFormData = saved;
      isiRingkasanPembayaran(saved);
    }
  } else {
    step1.style.display = "block";
    step2.style.display = "none";
    step3.style.display = "none";
    progressBar.style.width = "0%";
    progressBar.setAttribute("aria-valuenow", "0");
  }
})();
