# Panduan Pengujian Halaman (Pages)

Dokumen ini memberikan panduan untuk melakukan *integration testing* tingkat tinggi pada komponen Halaman (Page) di dalam direktori `app/`.

## Filosofi Pengujian Halaman

Tujuan utama pengujian halaman adalah untuk memverifikasi bahwa halaman tersebut **merender semua komponen utamanya dengan benar** dan **mengintegrasikan berbagai bagian aplikasi** seperti yang diharapkan. Ini lebih merupakan tes integrasi daripada tes unit murni.

Fokus pengujian halaman adalah:
1. Memastikan semua komponen penting (seperti *layout*, *header*, *footer*, dan konten utama) muncul di layar.
2. Memverifikasi bahwa data awal (jika ada) ditampilkan dengan benar.
3. Menjadi titik awal yang baik untuk pengujian *end-to-end* (E2E), meskipun ini bukan cakupan Jest.

Kita **tidak** menguji secara mendalam setiap interaksi di setiap komponen anak di sini. Interaksi tersebut harus diuji di level komponen itu sendiri.

## Strategi Pengujian

Pengujian halaman mirip dengan pengujian komponen, tetapi dalam skala yang lebih besar. Kita akan me-render seluruh komponen halaman dan memeriksa keberadaan elemen-elemen kunci.

### 1. Mocking Dependensi

Halaman sering kali bergantung pada *hooks*, *services*, atau *stores* untuk mengambil data. Karena ini bukan tes E2E, kita harus **me-mock dependensi tersebut** untuk mengisolasi halaman dari *backend* atau logika pengambilan data yang kompleks.

- **Strategi**: Gunakan `jest.mock` untuk menggantikan implementasi *hook* atau *service* dengan data palsu yang bisa kita kontrol.

### 2. Pengujian Render Halaman

- **Contoh (`dashboard/page.test.tsx`)**:
  ```tsx
  import '@testing-library/jest-dom';
  import { render, screen } from '@testing-library/react';
  import DashboardPage from './page';

  // Mock custom hook yang digunakan oleh halaman untuk mengambil data
  jest.mock('../../hooks/useUserData', () => ({
    useUserData: () => ({
      user: { name: 'Budi' },
      isLoading: false,
      error: null,
    }),
  }));

  // Mock komponen anak yang kompleks atau tidak relevan untuk tes ini
  jest.mock('../../components/ComplexChart', () => () => <div>Mocked Chart</div>);

  describe('DashboardPage', () => {
    it('should render the welcome message for the user', () => {
      render(<DashboardPage />);
      
      // Cari heading yang menyapa pengguna, berdasarkan data dari hook yang di-mock
      const heading = screen.getByRole('heading', { name: /selamat datang, budi/i });
      expect(heading).toBeInTheDocument();
    });

    it('should render the main layout components', () => {
      render(<DashboardPage />);

      // Verifikasi keberadaan komponen-komponen kunci
      expect(screen.getByText(/dashboard utama/i)).toBeInTheDocument();
      expect(screen.getByText(/statistik ringkasan/i)).toBeInTheDocument();
      // Verifikasi bahwa komponen yang di-mock juga dirender
      expect(screen.getByText('Mocked Chart')).toBeInTheDocument();
    });
  });
  ```

### Kapan Menggunakan Tes Halaman?

-   **Verifikasi Awal**: Gunakan tes ini untuk memastikan halaman tidak rusak setelah perubahan besar pada *layout* atau struktur data.
-   **Tes Asap (*Smoke Test*)**: Sebagai tes dasar untuk memastikan rute (route) dapat di-render tanpa *crash*.
-   **Snapshot Halaman**: Seperti pada komponen, Anda bisa menggunakan `toMatchSnapshot()` untuk halaman yang memiliki struktur UI yang sangat stabil.

---
**Struktur File**: Selalu letakkan file pengujian di samping file halamannya (misalnya, `page.tsx` dan `page.test.tsx`) di dalam direktori `app/`. 