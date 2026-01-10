# Utils Library — Dokumentasi Fungsi & Perilaku

Kumpulan fungsi utilitas yang digunakan oleh modul Descriptive, Frequency, Examine, dan Crosstabs.

## Fungsi Utama
- `checkIsMissing(value, missingDef, isNumeric)`
  - Mendukung tipe missing: `none`, `discrete`, `range`, `range_discrete`.
  - Untuk `range(_discrete)`, konversi ke numerik bila memungkinkan.
- `isNumeric(value)`
  - Mengembalikan `true` untuk numerik valid dan juga untuk string tanggal `dd-mm-yyyy` yang dapat dikonversi ke SPSS seconds.
- `dateStringToSpssSeconds(dd-mm-yyyy)` ↔ `spssSecondsToDateString(seconds)`
  - Konversi ke/dari epoch SPSS (14-10-1582 UTC).
- `isDateString(value)`
  - Validasi cepat format `dd-mm-yyyy` + uji konversi.
- `toSPSSFixed(num, decimals)`
  - Pembulatan "bankers rounding" (round-half-to-even) setara perilaku SPSS.
- `mapValueLabel(variable, value)` / `applyValueLabels(frequencyTable, variable)`
  - Mengaplikasikan label nilai dari metadata variabel ke baris tabel.
- `roundToDecimals`, `roundDeep`, `roundStatsObject`
  - Utilitas pembulatan untuk angka, struktur array/objek, dan objek statistik.

## Peran terhadap Tipe Data & Measurement Level
- Fungsi util men-decode tanggal string jadi numerik sehingga modul lain dapat memperlakukan tanggal sebagai numerik (misalnya percentiles) lalu mengembalikannya ke tampilan tanggal bila diperlukan.
- `checkIsMissing` dipakai di semua modul untuk konsistensi perlakuan missing, baik pada numeric/string/date.

## Dipakai Oleh
- Descriptive: semua cek missing dan konversi tanggal; pembulatan.
- Frequency: cek numeric/tanggal, konversi tanggal saat membangun distribusi, pembulatan.
- Examine: sama seperti Frequency + pembulatan.
- Crosstabs: cek missing/numeric, konversi tanggal baris/kolom, pembulatan expected/residual.

## Catatan
- Karena `isNumeric` menganggap string tanggal sebagai numerik (melalui konversi), modul tingkat atas perlu memutuskan apakah tanggal akan diperlakukan numerik murni (misalnya Descriptive) atau dikecualikan (misalnya Examine) sesuai kebutuhan UI.
