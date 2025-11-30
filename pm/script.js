// === KONFIGURASI SUPABASE ===
const { createClient } = supabase;

const SUPABASE_URL = "https://ixliuzdqfqheouthgupw.supabase.co"; // contoh: https://xxxx.supabase.co
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4bGl1emRxZnFoZW91dGhndXB3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0MjM3OTYsImV4cCI6MjA3OTk5OTc5Nn0.bUkkaCcqJj5R6cBcc5IEbrHFWnSmsnK1YSIrSR1eGtE";

const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ==== FUNGSI DUMMY BAWAH INI BIAR TIDAK ERROR ====
function Cancel() {
  alert("Logout (dummy function)");
}

function ChangeAreaSelectBox() {
  console.log("ChangeAreaSelectBox dipanggil");
}

function joukyo_1(code) {
  alert("Detail Test Center: " + code);
}

function click_next(placeCode, time, seatFlag) {
  alert("Anda memilih:\nTempat: " + placeCode + "\nJam mulai: " + time + "\nSeatFlag: " + seatFlag);
}

// ==== UTIL ====
function getStatusClass(status) {
  switch ((status || "").toLowerCase()) {
    case "available":
      return "available";
    case "limited":
      return "limited";
    case "booked":
      return "booked";
    case "unavailable":
      return "unavailable";
    default:
      return "available";
  }
}

function isDisabledStatus(status) {
  const s = (status || "").toLowerCase();
  return s === "booked" || s === "unavailable";
}

// ==== FUNGSI UTAMA SAAT TOMBOL CARI DIKLIK ====
async function reload() {
  const y = document.getElementById("exam_day_y").value.trim();
  const m = document.getElementById("exam_day_m").value.trim();
  const d = document.getElementById("exam_day_d").value.trim();

  const resultDiv = document.getElementById("searchResult");

  if (!y || !m || !d) {
    alert("Harap isi Tahun, Bulan, dan Tanggal ujian.");
    return;
  }

  // format untuk Supabase (DATE): YYYY-MM-DD
  const mm = m.toString().padStart(2, "0");
  const dd = d.toString().padStart(2, "0");
  const tanggalStr = `${y}-${mm}-${dd}`;

  // tampilkan loading
  resultDiv.innerHTML = `<p>Sedang mengambil jadwal untuk ${tanggalStr}...</p>`;

  // panggil Supabase
  const { data, error } = await supabaseClient
    .from("jadwal_ujian") // NAMA TABEL DI SUPABASE
    .select("*")
    .eq("exam_date", tanggalStr)
    .order("place_code", { ascending: true })
    .order("start_time", { ascending: true });

  if (error) {
    console.error(error);
    resultDiv.innerHTML = `<div class="alert alert-danger">Gagal mengambil data jadwal: ${error.message}</div>`;
    return;
  }

  if (!data || data.length === 0) {
    const tanggalView = tanggalStr.replace(/-/g, "/"); // 2026-02-08 -> 2026/02/08

    resultDiv.innerHTML = `
    <h3>【Hasil Pencarian】</h3>
    <p class="selected-examday">Tanggal ujian ${tanggalView}</p>
    <p></p>
    <p>
      Tidak ada ujian yang diselenggarakan pada tanggal ujian, negara, atau wilayah yang Anda pilih.
      <br />
      Pilih tanggal ujian, negara, atau wilayah lain, lalu klik tombol “Cari” sekali lagi.
    </p>
    <div>
      <button
        class="btn btn-secondary wid-180 margin-t-large"
        type="button"
        name="Return"
        onclick="location.href='../Reserve/Status'"
      >
        <!-- <i class="bi bi-caret-left-fill"></i> -->
        Kembali
      </button>
    </div>
    <input type="hidden" id="calendar_start" name="calendar_start" value="2025/12/04" />
    <input type="hidden" id="calendar_start_y" name="calendar_start_y" value="2025" />
    <input type="hidden" id="calendar_start_m" name="calendar_start_m" value="12" />
    <input type="hidden" id="calendar_start_d" name="calendar_start_d" value="04" />
  `;
    return;
  }

  // ===== BANGUN HTML HASIL (seperti contohmu) =====
  let html = `
    <h3>【Hasil Pencarian】</h3>
    <p class="selected-examday">Tanggal ujian ${tanggalStr.replace(/-/g, "/")}</p>
    <p></p>
    <input type="hidden" name="In_examstart" />
    <input type="hidden" name="In_place_no" />
    <input type="hidden" name="In_placeno" />
    <input type="hidden" name="In_exam_day" value="${tanggalStr.replace(/-/g, "/")}" />
    <div class="time-table-note alert alert-light">
      <div class="d-flex flex-wrap flex-md-row">
        <div class="d-flex flex-row align-items-center legend-bt-wrapper">
          <div class="available-legend"></div>
          <div class="legend-text">Ada kursi</div>
        </div>
        <div class="d-flex flex-row align-items-center legend-bt-wrapper">
          <div class="limited-legend"></div>
          <div class="legend-text">Ada sedikit kursi</div>
        </div>
        <div class="d-flex flex-row align-items-center legend-bt-wrapper">
          <div class="booked-legend"></div>
          <div class="legend-text">Tidak dapat dipilih</div>
        </div>
        <div class="d-flex flex-row align-items-center legend-bt-wrapper">
          <div class="unavailable-legend"></div>
          <div class="legend-text">Tidak tersedia</div>
        </div>
      </div>
    </div>
    <p>Klik jam mulai dari tempat ujian yang Anda inginkan.</p>
  `;

  // group by tempat (place_code + place_name)
  let currentPlaceKey = null;
  let isTimeTableOpen = false;

  data.forEach((row) => {
    const placeCode = row.place_code;
    const placeName = row.place_name;
    const startTimeRaw = row.start_time;
    const startTime = row.start_time.substring(0, row.start_time.lastIndexOf(":"));
    // dari "09:15:00" → "09:15"
    const status = row.status;

    const placeKey = `${placeCode}|${placeName}`;

    if (placeKey !== currentPlaceKey) {
      // tutup time-table sebelumnya
      if (isTimeTableOpen) {
        html += `</div>`;
        isTimeTableOpen = false;
      }

      // header lokasi baru
      html += `
        <div class="row-header place-name">
          <i class="bi bi-geo-alt-fill"></i>
          <a href="javascript:void(0)" onclick="joukyo_1('${placeCode}')" title="Detail Test Center">
            ${placeCode}/${placeName}
          </a>
        </div>
        <div class="time-table">
      `;
      isTimeTableOpen = true;
      currentPlaceKey = placeKey;
    }

    const statusClass = getStatusClass(status);
    const disabled = isDisabledStatus(status);
    const disabledAttr = disabled ? "disabled" : "";
    const onclickAttr = disabled ? "" : `onclick="click_next('${placeCode}','${startTime}','1')"`; // seatFlag=1 contoh saja

    html += `
      <button type="button" class="btn ${statusClass}" ${disabledAttr} ${onclickAttr}>
        ${startTime}
      </button>
    `;
  });

  if (isTimeTableOpen) {
    html += `</div>`;
  }

  html += `
    <div>
      <button class="btn btn-secondary wid-180 margin-t-large" type="button" name="Return" onclick="location.href='../Reserve/Status'">
        <!-- <i class="bi bi-caret-left-fill"></i> -->
        Kembali
      </button>
    </div>
    <input type="hidden" id="calendar_start" name="calendar_start" value="2025/12/04" />
    <input type="hidden" id="calendar_start_y" name="calendar_start_y" value="2025" />
    <input type="hidden" id="calendar_start_m" name="calendar_start_m" value="12" />
    <input type="hidden" id="calendar_start_d" name="calendar_start_d" value="04" />
  `;

  resultDiv.innerHTML = html;
}
