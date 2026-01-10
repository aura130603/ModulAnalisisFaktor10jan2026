import React from 'react';
import { HelpAlert, HelpCard } from '../../../ui/HelpLayout';
import { Database, Settings, Shield, BarChart3, CheckCircle, ArrowRight } from 'lucide-react';

const QuickStartGuide: React.FC = () => {
  const quickSteps = [
    {
      icon: Database,
      title: '1. Atur Properti Data',
      description: 'Mulai dengan mengatur nama variabel, label, dan tipe data yang sesuai',
      actions: [
  'Buka Data → Define Variable Properties',
        'Atur nama variabel yang deskriptif',
        'Tambahkan label yang informatif',
        'Pilih tipe data yang tepat (numeric, string, date)'
      ]
    },
    {
      icon: Settings,
      title: '2. Organisasi Dataset',
      description: 'Susun data Anda agar mudah dianalisis dan dipahami',
      actions: [
  'Buka Data → Sort Variables (urutkan variabel secara logis)',
  'Buka Data → Sort Cases (urutkan kasus jika diperlukan)',
  'Buka Data → Set Measurement Level (atur tingkat pengukuran)',
  'Buka Data → Weight Cases (terapkan pembobotan jika ada)'
      ]
    },
    {
      icon: Shield,
      title: '3. Periksa Kualitas Data',
      description: 'Pastikan data Anda berkualitas tinggi sebelum analisis',
      actions: [
        'Identifikasi missing values dan outliers',
  'Buka Data → Identify Duplicate Cases (cek duplikat)',
        'Validasi konsistensi data',
        'Dokumentasikan temuan dan tindakan'
      ]
    }
  ];

  const commonTasks = [
    {
      title: 'Agregasi Data',
      description: 'Lokasi: Data → Aggregate — buat statistik ringkasan per kelompok',
      icon: BarChart3
    },
    {
      title: 'Filter Data',
      description: 'Lokasi: Data → Select Cases — pilih subset data untuk analisis',
      icon: Database
    },
    {
      title: 'Restrukturisasi',
      description: 'Lokasi: Data → Restructure — ubah format data (wide ↔ long)',
      icon: Settings
    },
    {
      title: 'Definisi Tanggal',
      description: 'Lokasi: Data → Define Date and Time — atur struktur waktu untuk time series',
      icon: CheckCircle
    }
  ];

  const bestPractices = [
    {
      title: 'Penamaan Variabel',
      tips: [
        'Gunakan nama yang deskriptif dan konsisten',
        'Hindari spasi dan karakter khusus',
        'Gunakan konvensi penamaan yang jelas (camelCase, snake_case)',
        'Tambahkan prefix/suffix untuk kategori variabel'
      ]
    },
    {
      title: 'Dokumentasi Data',
      tips: [
        'Selalu berikan label yang informatif',
        'Dokumentasikan unit pengukuran',
        'Catat sumber dan tanggal pengumpulan data',
        'Simpan kamus data (data dictionary)'
      ]
    },
    {
      title: 'Backup dan Versioning',
      tips: [
        'Simpan backup data asli sebelum transformasi',
        'Gunakan versioning untuk track perubahan',
        'Dokumentasikan setiap langkah transformasi',
        'Test transformasi pada subset data terlebih dahulu'
      ]
    }
  ];

  return (
    <div className="space-y-8">
      {/* Quick Start Steps */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Panduan Cepat: 3 Langkah Manajemen Data</h2>
        <p className="text-gray-600 mb-6">
          Ikuti langkah-langkah berikut untuk mempersiapkan data Anda untuk analisis yang optimal.
        </p>
        
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
          {quickSteps.map((step, index) => (
            <HelpCard key={index} className="relative">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-muted/50 rounded-lg flex items-center justify-center">
                    <step.icon className="w-6 h-6 text-foreground" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-gray-600 mb-4">{step.description}</p>
                  <ul className="space-y-2">
                    {step.actions.map((action, actionIndex) => (
                      <li key={actionIndex} className="flex items-start space-x-2 text-sm text-gray-700">
                        <ArrowRight className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <span>{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </HelpCard>
          ))}
        </div>
      </div>

      {/* Common Tasks */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Tugas Umum Manajemen Data</h2>
        <p className="text-gray-600 mb-6">
          Akses cepat ke fitur-fitur yang paling sering digunakan dalam manajemen data.
        </p>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {commonTasks.map((task, index) => (
            <HelpCard key={index} className="hover:shadow-md transition-shadow">
              <div className="text-center">
                <div className="w-12 h-12 bg-muted/50 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <task.icon className="w-6 h-6 text-foreground" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{task.title}</h3>
                <p className="text-sm text-gray-600">{task.description}</p>
              </div>
            </HelpCard>
          ))}
        </div>
      </div>

      {/* Best Practices */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Best Practices</h2>
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
          {bestPractices.map((practice, index) => (
            <HelpAlert key={index} variant="tip" title={practice.title}>
              <ul className="list-disc list-inside space-y-1 text-sm mt-2">
                {practice.tips.map((tip, tipIndex) => (
                  <li key={tipIndex}>{tip}</li>
                ))}
              </ul>
            </HelpAlert>
          ))}
        </div>
      </div>

  {/* Additional Resources removed per guidelines */}
    </div>
  );
};

export default QuickStartGuide;