// install dulu: npm install xlsx
const xlsx = require("xlsx");

// fungsi untuk bersihin & konversi nomor hp
function cleanPhone(phone) {
  if (!phone) return "";

  let s = String(phone).trim();
  if (s.startsWith("'")) s = s.slice(1).trim();

  let digits = s.replace(/\D/g, "");
  if (!digits) return "";

  if (digits.startsWith("62")) {
    return digits;
  } else if (digits.startsWith("0")) {
    return "62" + digits.slice(1);
  } else if (digits.startsWith("8")) {
    return "62" + digits;
  } else {
    return "62" + digits;
  }
}

// fungsi untuk konversi NIM jadi email
function nimToEmail(nim) {
  if (!nim) return "";
  let s = String(nim).trim();

  // ubah A11 → 111
  if (s.startsWith("A11")) {
    s = s.replace("A11", "111");
  }

  // hapus titik
  let clean = s.replace(/\./g, "");

  return clean ? `${clean}@mhs.dinus.ac.id` : "";
}

// === main ===
const inputFile = "DATA MHS 2025_2026.xlsx";
const outputFile = "cleaned_contacts.xlsx";

const workbook = xlsx.readFile(inputFile);
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const rows = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: "" });

// ambil dari kolom B, C, D (ingat: array index mulai dari 0 → A=0, B=1, C=2, D=3)
let result = [];
for (let i = 1; i < rows.length; i++) { // skip row 0 kalau itu header
  let nim = rows[i][1] || "";   // kolom B
  let nama = rows[i][2] || "";  // kolom C
  let rawPhone = rows[i][3] || ""; // kolom D

  if (nim || nama || rawPhone) {
    result.push({
      nim,
      email: nimToEmail(nim),
      nama,
      cleanPhone: cleanPhone(rawPhone),
    });
  }
}

// preview JSON dulu di console (10 baris)
console.log(JSON.stringify(result.slice(0, 10), null, 2));

// export ke Excel
const newSheet = xlsx.utils.json_to_sheet(result);
const newWorkbook = xlsx.utils.book_new();
xlsx.utils.book_append_sheet(newWorkbook, newSheet, "Cleaned");
xlsx.writeFile(newWorkbook, outputFile);

console.log(`✅ Excel berhasil dibuat: ${outputFile}`);
