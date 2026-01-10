# Help Design Standards - Statify

## Overview
Dokumen ini mendefinisikan standar desain untuk semua halaman help di Statify. Standar ini memastikan konsistensi visual, pengalaman pengguna yang baik, dan maintainability kode.

## Komponen Standar

### 1. HelpLayout
Komponen utama untuk layout halaman help.

```tsx
import { HelpLayout } from "../ui/HelpLayout";

<HelpLayout
  title="Judul Halaman"
  description="Deskripsi singkat halaman"
  category="Kategori"
  lastUpdated="2024-01-15"
>
  {/* Konten */}
</HelpLayout>
```

### 2. HelpSection
Untuk membagi konten menjadi section-section.

```tsx
import { HelpSection } from "../ui/HelpLayout";
import { Database } from "lucide-react";

<HelpSection
  title="Judul Section"
  description="Deskripsi section"
  icon={Database}
>
  {/* Konten section */}
</HelpSection>
```

### 3. HelpCard
Kartu untuk menampilkan informasi dengan styling konsisten.

```tsx
import { HelpCard } from "../ui/HelpLayout";
import { Settings } from "lucide-react";

<HelpCard
  title="Judul Card"
  description="Deskripsi card"
  icon={Settings}
  variant="feature" // default | feature | step
>
  {/* Konten card */}
</HelpCard>
```

### 4. HelpAlert
Untuk menampilkan peringatan, tips, atau informasi penting.

```tsx
import { HelpAlert } from "../ui/HelpLayout";

<HelpAlert
  variant="tip" // info | warning | success | error | tip
  title="Judul Alert"
>
  Konten alert
</HelpAlert>
```

### 5. HelpStep
Untuk tutorial step-by-step.

```tsx
import { HelpStep } from "../ui/HelpLayout";

<HelpStep
  stepNumber={1}
  title="Langkah Pertama"
  description="Deskripsi langkah"
>
  {/* Konten langkah */}
</HelpStep>
```

### 6. HelpGuideTemplate
Template lengkap untuk guide pages.

```tsx
import { HelpGuideTemplate } from "../ui/HelpGuideTemplate";
import { Database, Settings } from "lucide-react";

const sections = [
  {
    id: "overview",
    title: "Gambaran Umum",
    description: "Penjelasan fitur",
    icon: Database,
    content: <div>Konten overview</div>
  },
  {
    id: "steps",
    title: "Langkah-langkah",
    icon: Settings,
    steps: [
      {
        title: "Langkah 1",
        description: "Deskripsi langkah 1",
        content: <div>Konten langkah 1</div>,
        code: "console.log('Hello');",
        codeLanguage: "javascript"
      }
    ]
  }
];

<HelpGuideTemplate
  title="Judul Guide"
  description="Deskripsi guide"
  category="Data Management"
  lastUpdated="2024-01-15"
  sections={sections}
  prerequisites={[
    "Data sudah diimport",
    "Variabel sudah didefinisikan"
  ]}
  quickActions={[
    {
      label: "Coba Sekarang",
      onClick: () => {},
      variant: "default",
      icon: Play
    }
  ]}
  tips={[
    {
      type: "tip",
  title: "Tip",
  content: "Simpan perubahan Anda secara berkala melalui menu yang tersedia"
    }
  ]}
  relatedTopics={[
    { title: "Import Data", href: "/help/import-data" }
  ]}
/>
```

## Standar Visual

### Typography
- **H1 (Page Title)**: `text-3xl font-bold tracking-tight`
- **H2 (Section Title)**: `text-xl font-semibold`
- **H3 (Subsection)**: `text-lg font-semibold`
- **Body Text**: `text-base`
- **Muted Text**: `text-muted-foreground`

### Colors
- **Primary**: Menggunakan theme primary color
- **Muted**: `text-muted-foreground`
- **Success**: Green variants
- **Warning**: Yellow variants
- **Error**: Red variants
- **Info**: Blue variants
- **Tip**: Purple variants

### Spacing
- **Section Spacing**: `space-y-6` atau `space-y-8`
- **Card Padding**: `p-4` atau `p-6`
- **Content Spacing**: `space-y-4`

### Icons
- Gunakan Lucide React icons
- Size standar: `h-4 w-4` atau `h-5 w-5`
- Warna: `text-primary` untuk accent, `text-muted-foreground` untuk secondary

## Struktur File

### Lokasi Komponen
```
app/help/
├── components/
│   ├── [CategoryName]/
│   │   ├── [GuideName].tsx
│   │   └── index.ts
│   ├── HelpContent.tsx
│   ├── HelpContentWrapper.tsx (deprecated)
│   └── index.ts
└── page.tsx
```

### Naming Convention
- **Guide Components**: PascalCase (e.g., `AggregateGuide.tsx`)
- **Category Folders**: kebab-case (e.g., `data-guide/`)
- **Export Files**: `index.ts` untuk re-exports

## Migration Guide

### Dari HelpContentWrapper ke HelpLayout

**Sebelum:**
```tsx
import { HelpContentWrapper } from "./HelpContentWrapper";

<HelpContentWrapper
  title="Judul"
  description="Deskripsi"
>
  {/* konten */}
</HelpContentWrapper>
```

**Sesudah:**
```tsx
import { HelpLayout } from "../ui/HelpLayout";

<HelpLayout
  title="Judul"
  description="Deskripsi"
  category="Kategori"
>
  {/* konten */}
</HelpLayout>
```

### Dari Card Manual ke HelpCard

**Sebelum:**
```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

<Card>
  <CardHeader>
    <CardTitle>Judul</CardTitle>
  </CardHeader>
  <CardContent>
    {/* konten */}
  </CardContent>
</Card>
```

**Sesudah:**
```tsx
import { HelpCard } from "../ui/HelpLayout";

<HelpCard title="Judul">
  {/* konten */}
</HelpCard>
```

## Best Practices

### 1. Konsistensi
- Selalu gunakan komponen standar
- Ikuti naming convention
- Gunakan spacing yang konsisten

### 2. Accessibility
- Gunakan semantic HTML
- Tambahkan proper ARIA labels
- Pastikan keyboard navigation bekerja
- Gunakan color contrast yang baik

### 3. Responsiveness
- Test di berbagai screen size
- Gunakan responsive classes Tailwind
- Pastikan mobile experience baik

### 4. Performance
- Lazy load komponen berat
- Optimize images
- Minimize re-renders

### 5. Content
- Gunakan bahasa yang jelas dan mudah dipahami
- Sertakan contoh praktis
- Tambahkan screenshot jika perlu
- Update informasi secara berkala

## Checklist untuk Guide Baru

- [ ] Menggunakan HelpGuideTemplate atau HelpLayout
- [ ] Memiliki struktur yang jelas (overview, steps, troubleshooting)
- [ ] Menggunakan komponen standar (HelpCard, HelpAlert, dll)
- [ ] Memiliki table of contents
- [ ] Responsive di semua device
- [ ] Accessible (keyboard navigation, screen reader friendly)
- [ ] Memiliki quick actions jika relevan
- [ ] Memiliki related topics
- [ ] Content up-to-date dan akurat
- [ ] Tested di berbagai browser

## Maintenance

### Review Schedule
- **Monthly**: Review content accuracy
- **Quarterly**: Update design components jika ada perubahan
- **Yearly**: Major review dan restructuring jika diperlukan

### Update Process
1. Identifikasi perubahan yang diperlukan
2. Update komponen standar jika perlu
3. Update guide yang terpengaruh
4. Test di berbagai device dan browser
5. Deploy dan monitor feedback

## Support

Jika ada pertanyaan tentang standar desain ini, hubungi:
- Frontend Team Lead
- UX/UI Designer
- Technical Writer