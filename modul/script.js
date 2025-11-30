const socials = [
  { icon: "icons/wa.png", url: "https://wa.me/62895346030735" },
  { icon: "icons/tiktok.png", url: "https://www.tiktok.com/@aeselReservasi" },
  { icon: "icons/facebook.png", url: "https://www.facebook.com/aesel.ridwansyah/" },
  { icon: "icons/instagram.png", url: "https://www.instagram.com/aesel_reservasi/" },
];
const resources = [
  {
    title: "JFT Basic A2",
    items: [
      { label: "Modul JFT", url: "https://drive.google.com/drive/folders/1TESMoGekaPHOr0C55F6nFVS9wPPb_Uqg" },
      { label: "Kotoba, Kanji & Bunpou", url: "https://drive.google.com/drive/folders/1fxg62oXVlOqwV4OvJFaYK1jN2SU22R8i" },
      { label: "Latihan Soal", url: "https://drive.google.com/drive/folders/1-IoE_1MG-GRTGj5Bw59XwIkDkOdlecBZ" },
    ],
  },
  {
    title: "SSW PM",
    items: [
      { label: "Modul Restoran", url: "https://drive.google.com/drive/folders/1rgBE11nxsqSzOCw3xMASmuphz5AFhPhn" },
      { label: "Kotoba, Kanji Restoran", url: "https://drive.google.com/drive/folders/1ZGuG5OnrCxdB-K7CoSwrnxKiuBKCNm_f" },
      { label: "Latihan Soal", url: "https://drive.google.com/drive/folders/1rRX385YycYjM75sj6n1xAWVcuZ10w6DW" },
    ],
  },
  {
    title: "SSW Restoran",
    items: [
      { label: "Modul Restoran", url: "https://drive.google.com/drive/folders/1vWEDtKDbLc3ElWv0I0iMwqsWgSX-aYmP" },
      { label: "Kotoba, Kanji Restoran", url: "https://drive.google.com/drive/folders/1xj0WCLdfpHzdyCUF1UxDFPqP6isyWV5p" },
      { label: "Latihan Soal", url: "https://drive.google.com/drive/folders/18djure8A0fNAOLdj4FTnt8RHG91u635p" },
    ],
  },
  {
    title: "SSW Pertanian & Perternakan",
    items: [
      { label: "Modul ASAT", url: "https://drive.google.com/drive/folders/1XJNVe9qWLinKbYpkTG595dy28EDuy3AF" },
      { label: "Kotoba & Kanji Tani & Ternak", url: "https://drive.google.com/drive/folders/1C5QKpRky7Jd7fRTs6QRcgW7T05FFC8dL" },
      { label: "Latihan Soal", url: "https://drive.google.com/drive/folders/1JsD5d2VEmSwjZZhHHljYo3iExbwAZkb4" },
    ],
  },
];

const socialRow = document.getElementById("social-row");
socials.forEach((s) => {
  const a = document.createElement("a");
  a.href = s.url;
  a.target = "_blank";
  a.className = "social-icon";
  a.innerHTML = `<img src="${s.icon}" alt="icon">`;
  socialRow.appendChild(a);
});
const linksContainer = document.getElementById("links");
resources.forEach((section) => {
  const title = document.createElement("p");
  title.innerHTML = `<b>${section.title}</b>`;
  linksContainer.appendChild(title);
  section.items.forEach((item) => {
    const link = document.createElement("a");
    link.href = item.url;
    link.className = "btn";
    link.textContent = item.label;
    linksContainer.appendChild(link);
  });
});
window.onload = () => {
  document.querySelector(".container").classList.add("visible");
};
