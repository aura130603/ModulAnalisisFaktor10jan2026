// src/lib/spssDateConverter.ts

// Epoch SPSS: 14 Oktober 1582, 00:00:00 UTC
// Kita gunakan Date.UTC untuk mendapatkan timestamp dalam milidetik sejak epoch JavaScript (1 Jan 1970 UTC)
// secara konsisten. Bulan dalam Date.UTC/Date object adalah 0-indexed (0=Januari, 9=Oktober).
const SPSS_EPOCH_MILLIS = Date.UTC(1582, 9, 14, 0, 0, 0);

/**
 * Mengonversi detik SPSS (detik sejak 14 Okt 1582 00:00:00 UTC)
 * ke string tanggal dengan format dd-mm-yyyy.
 * Mengembalikan null jika input menghasilkan tanggal tidak valid.
 *
 * @param spssSeconds - Jumlah detik sejak epoch SPSS.
 * @returns String tanggal yang diformat atau null.
 */
export function spssSecondsToDateString(spssSeconds: number): string | null {
    // Validasi input dasar
    if (typeof spssSeconds !== 'number' || !Number.isFinite(spssSeconds)) {
        return null;
    }

    // Hitung timestamp target dalam milidetik sejak epoch JavaScript
    const targetMillis = SPSS_EPOCH_MILLIS + spssSeconds * 1000;

    // Buat objek Date dari timestamp milidetik
    const date = new Date(targetMillis);

    // Periksa apakah tanggal yang dihasilkan valid
    if (isNaN(date.getTime())) {
        return null;
    }

    // Ekstrak komponen tanggal menggunakan metode UTC agar sesuai definisi epoch UTC
    const day = date.getUTCDate();
    const month = date.getUTCMonth() + 1; // Bulan 0-indexed, jadi tambah 1
    const year = date.getUTCFullYear();

    // Format komponen dengan nol di depan jika perlu
    const dayString = String(day).padStart(2, '0');
    const monthString = String(month).padStart(2, '0');

    return `${dayString}-${monthString}-${year}`;
}

/**
 * Mengonversi string tanggal format dd-mm-yyyy ke detik SPSS
 * (detik sejak 14 Okt 1582 00:00:00 UTC).
 * Mengembalikan null jika string input tidak valid atau merepresentasikan tanggal yang tidak valid.
 *
 * @param dateString - String tanggal dalam format dd-mm-yyyy.
 * @returns Jumlah detik SPSS atau null.
 */
export function dateStringToSpssSeconds(dateString: string): number | null {
    if (typeof dateString !== 'string') {
        return null;
    }

    const parts = dateString.split('-');
    if (parts.length !== 3) {
        return null; // Format tidak valid
    }

    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);

    // Validasi dasar hasil parsing
    if (isNaN(day) || isNaN(month) || isNaN(year) || month < 1 || month > 12 || day < 1 || day > 31) {
        return null;
    }

    // Hitung timestamp target dalam milidetik sejak epoch JavaScript (gunakan UTC)
    // Bulan perlu 0-indexed untuk Date.UTC
    const targetMillis = Date.UTC(year, month - 1, day, 0, 0, 0);

    // Periksa apakah Date.UTC menghasilkan timestamp valid (menangani tgl spt 30 Feb)
    // Validasi ulang komponen karena Date.UTC bisa 'meluap' (misal bulan 13 jadi tahun berikutnya)
    const validationDate = new Date(targetMillis);
    if (
        isNaN(targetMillis) ||
        validationDate.getUTCFullYear() !== year ||
        validationDate.getUTCMonth() !== month - 1 ||
        validationDate.getUTCDate() !== day
    ) {
        return null; // Komponen tanggal tidak valid atau masalah parsing
    }

    // Pastikan epoch SPSS valid (seharusnya selalu valid)
    if (isNaN(SPSS_EPOCH_MILLIS)) {
        // Seharusnya tidak pernah terjadi di lingkungan JS modern
        throw new Error("Perhitungan Epoch SPSS menghasilkan NaN.");
    }

    // Hitung selisih dalam milidetik
    const diffMillis = targetMillis - SPSS_EPOCH_MILLIS;

    // Konversi selisih ke detik. Gunakan Math.round untuk presisi.
    const spssSeconds = Math.round(diffMillis / 1000);

    // Anda bisa menambahkan pengecekan jika tanggal sebelum epoch jika diperlukan
    // if (spssSeconds < 0) return null;

    return spssSeconds;
}