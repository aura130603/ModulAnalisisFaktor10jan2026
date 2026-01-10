# Panduan Pengujian untuk Fitur Modal

Dokumen ini adalah panduan spesifik untuk melakukan *unit testing* pada fitur modal, yang mengikuti arsitektur yang dijelaskan dalam `README.md`. Panduan ini melengkapi [panduan pengujian komponen umum](../TESTING.md) dengan strategi untuk menguji *hooks*, *services*, dan integrasi.

## Filosofi Pengujian Modal

Fokus utama pengujian modal adalah **memverifikasi logika bisnis dan alur kerja**, bukan hanya rendering UI. Oleh karena itu, strategi pengujian kita memisahkan:
1.  **Pengujian Logika (Hooks)**: Menguji *custom hook* secara terisolasi untuk memastikan manajemen state dan logika berjalan dengan benar.
2.  **Pengujian Layanan (Services)**: Menguji lapisan *service* untuk memastikan ia berinteraksi dengan benar dengan sistem eksternal (Web Workers, API) dengan melakukan *mocking*.
3.  **Pengujian Integrasi (Komponen)**: Menguji komponen UI untuk memastikan ia menampilkan state dari *hook* dan memanggil fungsi yang benar saat ada interaksi pengguna.

---

## 1. Menguji Custom Hooks (`hooks/`)

*Hook* adalah otak dari fitur modal. Kita harus mengujinya secara menyeluruh menggunakan `renderHook` dari React Testing Library.

-   **Struktur Tes**:
    1.  **Mock dependencies**: *Mock* semua *service* atau *store* yang dipanggil oleh *hook*.
    2.  **Render**: Gunakan `renderHook` untuk menjalankan *hook*.
    3.  **Act**: Gunakan `act()` untuk memanggil fungsi yang diekspos oleh *hook* (misalnya, *event handler*).
    4.  **Assert**: Periksa nilai yang dikembalikan oleh *hook* (`result.current`) atau apakah fungsi *mock* telah dipanggil.

-   **Contoh (`__tests__/useDuplicateCasesLogic.test.ts`)**:

    ```tsx
    import { renderHook, act } from '@testing-library/react';
    import { useDuplicateCasesLogic } from '../hooks/useDuplicateCasesLogic';
    import { duplicateCasesService } from '../services/duplicateCasesService';
    import { useResultStore } from '@/stores/useResultStore';

    // 1. Mock dependencies
    jest.mock('../services/duplicateCasesService');
    jest.mock('@/stores/useResultStore');

    // Buat mock untuk implementasi spesifik
    const mockedAddResult = jest.fn();
    const mockedDuplicateCases = duplicateCasesService as jest.Mocked<typeof duplicateCasesService>;

    describe('useDuplicateCasesLogic', () => {
      beforeEach(() => {
        // Reset mocks sebelum setiap tes
        jest.clearAllMocks();
        
        // Sediakan implementasi mock default untuk store
        (useResultStore as jest.Mock).mockReturnValue({
          addResult: mockedAddResult,
        });
      });

      it('should call the service and add result on success', async () => {
        // Atur agar service mengembalikan hasil yang sukses
        mockedDuplicateCases.find.mockResolvedValue({ success: true, data: 'Hasil Duplikasi' });
        
        // 2. Render hook
        const { result } = renderHook(() => useDuplicateCasesLogic());

        // 3. Panggil fungsi dari hook
        await act(async () => {
          await result.current.handleRun();
        });

        // 4. Lakukan assertion
        expect(duplicateCasesService.find).toHaveBeenCalledTimes(1);
        expect(mockedAddResult).toHaveBeenCalledWith('Hasil Duplikasi');
        expect(result.current.isLoading).toBe(false);
      });
    });
    ```

---

## 2. Menguji Services (`services/`)

*Service* adalah lapisan yang berkomunikasi dengan Web Workers. Pengujiannya fokus pada apakah *service* mengirim pesan yang benar dan menangani respons dengan tepat.

-   **Strategi**: *Mock* Web Worker global untuk mengontrol perilakunya.

-   **Contoh (`__tests__/duplicateCasesService.test.ts`)**:

    ```tsx
    import { duplicateCasesService } from '../services/duplicateCasesService';

    // Simpan implementasi Worker asli dan siapkan mock
    const OriginalWorker = global.Worker;
    const mockPostMessage = jest.fn();
    const mockOnMessage = jest.fn();
    const mockOnError = jest.fn();

    // Mock Worker secara global
    global.Worker = jest.fn(function (this: any) {
      this.postMessage = mockPostMessage;
      // Beri akses untuk memicu onmessage & onerror dari luar
      this.triggerMessage = (data: any) => this.onmessage({ data });
      this.triggerError = (error: any) => this.onerror({ error });
      return this;
    } as any) as any;


    describe('duplicateCasesService', () => {
      beforeEach(() => {
        jest.clearAllMocks();
      });

      it('should post a message to the worker and resolve on success', async () => {
        const promise = duplicateCasesService.find();
        
        // Ambil instance worker yang baru dibuat
        const workerInstance = (global.Worker as jest.Mock).mock.instances[0];
        
        // Simulasikan worker mengirim pesan kembali
        workerInstance.triggerMessage({ success: true, payload: 'data' });

        const result = await promise;

        expect(global.Worker).toHaveBeenCalledWith(expect.stringContaining('duplicateCases.worker.js'));
        expect(mockPostMessage).toHaveBeenCalledWith({ type: 'START' });
        expect(result).toEqual({ success: true, data: 'data' });
      });
    });
    ```

---

## 3. Menguji Komponen UI (`index.tsx`)

Setelah logika diuji secara terpisah, pengujian komponen UI menjadi lebih sederhana. Fokusnya adalah pada **integrasi**:
-   Apakah komponen merender *state* dari *hook* dengan benar?
-   Apakah interaksi pengguna (klik tombol) memanggil fungsi yang benar dari *hook*?

-   **Strategi**: *Mock* *hook* logika utama untuk mengontrol sepenuhnya *state* dan fungsi yang diterima komponen.

-   **Contoh (`__tests__/DuplicateCases.test.tsx`)**:

    ```tsx
    import { render, screen } from '@testing-library/react';
    import userEvent from '@testing-library/user-event';
    import DuplicateCasesModal from '../index';
    import { useDuplicateCasesLogic } from '../hooks/useDuplicateCasesLogic';

    // Mock hook logika
    jest.mock('../hooks/useDuplicateCasesLogic');
    const mockedUseLogic = useDuplicateCasesLogic as jest.Mock;
    const mockedHandleRun = jest.fn();

    describe('DuplicateCasesModal', () => {
      it('should call handleRun when the "Run" button is clicked', async () => {
        // Sediakan implementasi mock untuk hook
        mockedUseLogic.mockReturnValue({
          isLoading: false,
          handleRun: mockedHandleRun,
        });

        render(<DuplicateCasesModal />);
        const user = userEvent.setup();
        
        const runButton = screen.getByRole('button', { name: /run/i });
        await user.click(runButton);

        expect(mockedHandleRun).toHaveBeenCalledTimes(1);
      });
    });
    ```

</rewritten_file> 