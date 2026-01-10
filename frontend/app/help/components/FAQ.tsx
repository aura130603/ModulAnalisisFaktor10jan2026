import React from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { HelpGuideTemplate } from "../ui/HelpGuideTemplate";
import { HelpCard, HelpAlert } from "../ui/HelpLayout";
import { Search, FileQuestion, FileCode, BarChart4, Clock, Save, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

// Data FAQ khusus Statify
const faqs = [
  {
    question: "Apa itu file .sav?",
    answer: "File .sav adalah format data yang digunakan oleh SPSS (Statistical Package for the Social Sciences). Statify dapat membaca dan menulis format ini, memungkinkan interoperabilitas yang mulus dengan SPSS."
  },
  {
    question: "Bagaimana cara mengimpor data dari Excel?",
    answer: "Untuk mengimpor data dari Excel, klik menu 'File' dan pilih 'Impor Excel'. Anda dapat menyesuaikan pengaturan impor seperti sheet mana yang akan dibaca, baris header, dan jenis data variabel."
  },
  {
    question: "Bagaimana cara melakukan analisis deskriptif?",
    answer: "Untuk melakukan analisis deskriptif, pilih variabel yang ingin Anda analisis dari panel variabel, kemudian klik menu 'Analisis' dan pilih 'Statistik Deskriptif'. Anda dapat memilih statistik mana yang akan ditampilkan seperti mean, median, modus, dan standar deviasi."
  },
  {
    question: "Bisakah Statify membuat grafik?",
    answer: "Ya, Statify menyertakan berbagai jenis grafik seperti bar chart, histogram, scatter plot, dan box plot. Anda dapat membuat grafik dengan memilih menu 'Grafik' kemudian memilih jenis grafik yang diinginkan."
  },
  {
    question: "Bagaimana cara melakukan uji hipotesis?",
    answer: "Untuk melakukan uji hipotesis, pilih menu 'Analisis', kemudian pilih jenis uji yang sesuai seperti T-Test, ANOVA, atau Chi-Square. Pilih variabel yang relevan dan sesuaikan parameter uji sesuai kebutuhan."
  },
  {
    question: "Apakah Statify menyimpan data secara otomatis?",
    answer: "Ya, Statify memiliki fitur autosave yang akan menyimpan pekerjaan Anda secara otomatis jika aplikasi mendeteksi Anda tidak aktif untuk beberapa waktu. Namun, kami tetap merekomendasikan untuk menyimpan pekerjaan Anda secara rutin dengan mengklik 'File' > 'Simpan'."
  },
  {
    question: "Bagaimana cara mengekspor hasil analisis?",
    answer: "Hasil analisis dapat diekspor dalam format PDF, Excel, atau gambar. Klik kanan pada output analisis dan pilih opsi 'Ekspor', kemudian pilih format yang diinginkan."
  },
  {
    question: "Bagaimana cara menangani data yang hilang dalam analisis?",
    answer: "Dalam analisis statistik Statify, Anda dapat memilih cara menangani nilai yang hilang untuk setiap jenis analisis. Di kotak dialog analisis, Anda dapat memilih opsi seperti 'Kecualikan kasus berpasangan', 'Kecualikan kasus dalam daftar', atau menggunakan metode estimasi khusus sesuai kebutuhan analisis Anda."
  }
];

// Kategori FAQ
const faqCategories = [
  {
    name: "Data & File",
    icon: <FileCode className="h-5 w-5 mr-2 text-primary/70" />,
    faqs: [faqs[0], faqs[1], faqs[5], faqs[6]]
  },
  {
    name: "Analisis Statistik",
    icon: <BarChart4 className="h-5 w-5 mr-2 text-primary/70" />,
    faqs: [faqs[2], faqs[3], faqs[4], faqs[7]]
  }
];

export const FAQ = () => {
  const sections = [
    {
      id: 'overview',
      title: 'Bantuan Cepat',
      description: 'Informasi penting untuk memulai',
      icon: BookOpen,
      content: (
        <div className="space-y-4">
          <HelpAlert variant="info" title="Tidak menemukan yang Anda cari?">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mt-3">
              <p className="text-sm flex-1">
                Gunakan fitur pencarian atau hubungi tim dukungan kami untuk bantuan lebih lanjut.
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Search className="h-4 w-4 mr-2" />
                  Cari Bantuan
                </Button>
                <Button variant="default" size="sm">
                  <FileQuestion className="h-4 w-4 mr-2" />
                  Hubungi Dukungan
                </Button>
              </div>
            </div>
          </HelpAlert>
          
          <HelpCard title="Fitur Autosave" icon={Clock} variant="feature">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Statify secara otomatis menyimpan pekerjaan Anda ketika aplikasi mendeteksi periode tidak aktif. 
                Ini membantu mencegah kehilangan data jika aplikasi secara tidak sengaja ditutup.
              </p>
              <div className="flex items-center gap-2 text-xs font-medium text-primary">
                <Save className="h-3.5 w-3.5" />
                <span>Pekerjaan tersimpan otomatis</span>
              </div>
            </div>
          </HelpCard>
        </div>
      )
    },
    {
      id: 'data-file',
      title: 'Data & File',
      description: 'Pertanyaan yang sering diajukan tentang manajemen data dan file',
      icon: FileCode,
      content: (
        <div className="space-y-4">
          <Accordion type="single" collapsible className="w-full">
            {faqCategories[0].faqs.map((faq, index) => (
              <AccordionItem 
                key={index} 
                value={`data-file-${index}`}
                className="border-b border-border/50"
              >
                <AccordionTrigger className="text-left font-medium hover:text-primary py-3 text-foreground">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground py-2 pb-4 text-sm leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      )
    },
    {
      id: 'statistics',
      title: 'Analisis Statistik',
      description: 'Pertanyaan yang sering diajukan tentang analisis statistik',
      icon: BarChart4,
      content: (
        <div className="space-y-4">
          <Accordion type="single" collapsible className="w-full">
            {faqCategories[1].faqs.map((faq, index) => (
              <AccordionItem 
                key={index} 
                value={`statistics-${index}`}
                className="border-b border-border/50"
              >
                <AccordionTrigger className="text-left font-medium hover:text-primary py-3 text-foreground">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground py-2 pb-4 text-sm leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      )
    }
  ];

  const tips = [
    {
      type: 'tip' as const,
      title: 'Umpan Balik',
      content: 'Bantu kami meningkatkan dokumentasi dengan memberikan umpan balik pada setiap halaman bantuan.'
    },
    {
      type: 'info' as const,
      title: 'Pencarian',
      content: 'Gunakan fitur pencarian untuk menemukan jawaban dengan cepat menggunakan kata kunci.'
    }
  ];

  const relatedTopics = [
    { title: 'Memulai', href: '/help/getting-started' },
    { title: 'Impor File SPSS', href: '/help/file-guide/import-sav' },
    { title: 'Statistik Deskriptif', href: '/help/statistics-guide/descriptive' },
    { title: 'Manajemen Data', href: '/help/data-guide' }
  ];

  return (
    <HelpGuideTemplate
      title="Pertanyaan yang Sering Diajukan"
      description="Temukan jawaban untuk pertanyaan umum tentang penggunaan Statify"
      lastUpdated="2024-01-15"
      sections={sections}
      tips={tips}
      relatedTopics={relatedTopics}
    />
  );
};