import React from 'react';
import { HelpCard, HelpAlert } from '@/app/help/ui/HelpLayout';
import { BarChart3 } from 'lucide-react';

export const ChartsTab = () => (
  <div className="space-y-6">
    <HelpCard title="Opsi Grafik" icon={BarChart3} variant="feature">
      <div className="space-y-4 mt-2">
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Menampilkan Grafik</h4>
          <p className="text-sm text-muted-foreground">
            Centang opsi &quot;Display charts&quot; untuk menampilkan visualisasi grafik dalam hasil analisis.
          </p>
        </div>
        
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Jenis Grafik</h4>
          <div className="text-sm space-y-2">
            <p>• <strong>None:</strong> Tidak menampilkan grafik</p>
            <p>• <strong>Bar charts:</strong> Grafik batang untuk menampilkan frekuensi kategori</p>
            <p>• <strong>Pie charts:</strong> Grafik lingkaran untuk menampilkan proporsi</p>
            <p>• <strong>Histograms:</strong> Histogram untuk data numerik kontinu</p>
          </div>
        </div>
        
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Nilai Grafik</h4>
          <div className="text-sm space-y-2">
            <p>• <strong>Frequencies:</strong> Menampilkan nilai frekuensi absolut</p>
            <p>• <strong>Percentages:</strong> Menampilkan nilai dalam bentuk persentase</p>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            *Opsi ini tidak tersedia untuk histogram
          </p>
        </div>
      </div>
    </HelpCard>

    <HelpAlert variant="tip" title="Tips Pemilihan Grafik">
      <div className="text-sm space-y-2 mt-2">
        <p>• <strong>Bar charts:</strong> Ideal untuk data kategorikal dan ordinal</p>
        <p>• <strong>Pie charts:</strong> Terbaik untuk menunjukkan proporsi dari keseluruhan (maksimal 7 kategori)</p>
        <p>• <strong>Histograms:</strong> Cocok untuk data numerik kontinu untuk melihat distribusi</p>
        <p>• <strong>Frequencies vs Percentages:</strong> Gunakan frekuensi untuk nilai absolut, persentase untuk perbandingan</p>
      </div>
    </HelpAlert>
  </div>
);