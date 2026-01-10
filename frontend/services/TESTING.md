# Panduan Pengujian Services

Dokumen ini memberikan panduan untuk melakukan *unit testing* pada *services* di dalam direktori `services/`. Services ini biasanya bertanggung jawab untuk berkomunikasi dengan dependensi eksternal seperti **Web Workers**, **API endpoints**, atau **local storage**.

## Filosofi Pengujian Services

Tujuan utama pengujian *service* adalah untuk memverifikasi bahwa *service* tersebut **berinteraksi dengan benar dengan dependensinya**. Kita tidak menguji apakah *web worker* atau API *backend* berfungsi, melainkan apakah *service* kita:
1. Memanggil dependensi yang benar (misalnya, membuat `Worker` dengan *script* yang tepat).
2. Mengirimkan data atau parameter dengan format yang benar.
3. Menangani respons (baik sukses maupun gagal) dari dependensi dengan benar.

## Strategi Pengujian

Kunci utama adalah **mocking**. Kita perlu mengganti dependensi asli dengan versi *mock* yang perilakunya bisa kita kontrol sepenuhnya dalam tes.

### 1. Menguji Service yang Berinteraksi dengan Web Worker

Ini adalah kasus yang paling relevan untuk proyek ini. Kita akan mem-*mock* constructor `Worker` global.

- **Strategi**: Buat implementasi `Worker` palsu menggunakan `jest.fn()` yang memungkinkan kita untuk memeriksa panggilan ke `postMessage` atau `terminate`.
- **Contoh (`analysisService.test.ts`)**:
  ```ts
  import { runAnalysis } from '../services/analysisService';

  // Buat mock untuk fungsi-fungsi Worker yang akan kita gunakan
  const mockPostMessage = jest.fn();
  const mockTerminate = jest.fn();
  const mockAddEventListener = jest.fn();

  // Mock constructor Worker global sebelum semua tes dijalankan
  beforeAll(() => {
    global.Worker = jest.fn(() => ({
      postMessage: mockPostMessage,
      terminate: mockTerminate,
      addEventListener: mockAddEventListener,
      // Implementasikan fungsi lain yang mungkin dipanggil
      onmessage: jest.fn(),
      onerror: jest.fn(),
    })) as any;
  });

  // Bersihkan mock setelah setiap tes untuk memastikan isolasi
  afterEach(() => {
      jest.clearAllMocks();
  });

  describe('runAnalysis', () => {
    it('should create a worker and post the correct message', () => {
      const params = { data: [1, 2, 3], type: 'mean' };
      
      // Panggil fungsi service yang ingin diuji
      runAnalysis(params);

      // 1. Verifikasi bahwa Worker dibuat dengan script yang benar
      // (Ganti dengan path worker Anda yang sebenarnya)
      expect(global.Worker).toHaveBeenCalledWith(new URL('../../public/workers/analysis.worker.js', import.meta.url));

      // 2. Verifikasi bahwa postMessage dipanggil dengan payload yang benar
      expect(mockPostMessage).toHaveBeenCalledTimes(1);
      expect(mockPostMessage).toHaveBeenCalledWith({
        type: 'RUN_ANALYSIS',
        payload: params,
      });
    });

    // Anda juga bisa menambahkan tes untuk memverifikasi penanganan 'message' atau 'error' dari worker
  });
  ```

### 2. Menguji Service yang Berinteraksi dengan API (Fetch)

Jika ada *service* yang memanggil API *backend*, lakukan *mock* pada `fetch` global.

- **Strategi**: Gunakan `jest.spyOn(global, 'fetch')` atau `jest.fn()` untuk menggantikan `fetch` dan mengontrol responsnya (`mockResolvedValueOnce`).
- **Contoh (`apiService.test.ts`)**:
  ```ts
  import { getUserData } from '../services/apiService';

  // Mock fetch global
  global.fetch = jest.fn();

  describe('getUserData', () => {
    it('should fetch user data and return it', async () => {
      const mockUser = { id: 1, name: 'Spongebob' };
      // Atur agar fetch mengembalikan respons sukses
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockUser,
      });

      const data = await getUserData(1);

      // 1. Verifikasi bahwa fetch dipanggil dengan URL yang benar
      expect(fetch).toHaveBeenCalledWith('/api/users/1');

      // 2. Verifikasi bahwa fungsi mengembalikan data yang benar
      expect(data).toEqual(mockUser);
    });
  });
  ```

---
**Struktur File**: Letakkan file pengujian di samping file *service*-nya (misalnya, `analysisService.ts` dan `analysisService.test.ts`). 