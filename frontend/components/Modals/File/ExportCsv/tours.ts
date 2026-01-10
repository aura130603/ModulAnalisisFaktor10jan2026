// Tour definitions for ExportCsv Modal

// Define tour types locally since onborda type exports are not available
type TourStep = {
  icon: React.ReactNode | string | null;
  title: string;
  content: React.ReactNode | string;
  selector: string;
  side: "top" | "bottom" | "left" | "right" | "top-left" | "top-right" | "bottom-left" | "bottom-right";
  showControls?: boolean;
  pointerPadding?: number;
  pointerRadius?: number;
  nextRoute?: string;
  prevRoute?: string;
};

type TourDefinition = {
  tour: string;
  steps: TourStep[];
};

// ExportCSV Modal Tour
export const exportCsvTour: TourDefinition = {
  tour: "exportcsv",
  steps: [
    {
      icon: null,
      title: "Nama File",
      content: "Tentukan nama file untuk hasil ekspor CSV Anda di sini.",
      selector: "#csv-filename-wrapper",
      side: "left",
      showControls: true,
      pointerPadding: 5,
    },
    {
      icon: null,
      title: "Pemisah Data",
      content: "Pilih karakter yang akan digunakan untuk memisahkan nilai dalam file CSV Anda.",
      selector: "#csv-delimiter-wrapper",
      side: "left",
      showControls: true,
      pointerPadding: 5,
    },
    {
      icon: null,
      title: "Header Variabel",
      content: "Pilih apakah akan menyertakan nama variabel sebagai baris header dalam file CSV.",
      selector: "#csv-headers-wrapper",
      side: "left",
      showControls: true,
      pointerPadding: 5,
    },
    {
      icon: null,
      title: "Properti Variabel",
      content: "Anda dapat menyertakan properti variabel seperti tipe data dan label sebagai baris pertama.",
      selector: "#csv-properties-wrapper",
      side: "left",
      showControls: true,
      pointerPadding: 5,
    },
    {
      icon: null,
      title: "Kutip String",
      content: "Aktifkan opsi ini untuk mengapit semua nilai string dengan tanda kutip.",
      selector: "#csv-quotes-wrapper",
      side: "left",
      showControls: true,
      pointerPadding: 5,
    },
    {
      icon: null,
      title: "Pengkodean",
      content: "Pilih pengkodean karakter untuk file CSV Anda. UTF-8 adalah standar yang paling umum digunakan.",
      selector: "#csv-encoding-wrapper",
      side: "left",
      showControls: true,
      pointerPadding: 5,
    },
    {
      icon: null,
      title: "Tombol Ekspor",
      content: "Setelah mengatur semua opsi, klik tombol 'Export' untuk mengunduh file CSV Anda.",
      selector: "#csv-buttons-wrapper",
      side: "left",
      showControls: true,
      pointerPadding: 5,
    }
  ]
};

// Helper function to start specific tours
export const getTourByName = (tourName: string): TourDefinition | undefined => {
  return tourName === "exportcsv" ? exportCsvTour : undefined;
};
