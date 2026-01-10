import React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { HelpGuideTemplate } from "../ui/HelpGuideTemplate";
import { HelpCard, HelpAlert } from "../ui/HelpLayout";
import { SendHorizontal, Star, ThumbsUp, MessageSquare, Mail, BookOpen } from "lucide-react";

export const Feedback = () => {
  const sections = [
    {
      id: 'overview',
      title: 'Jenis Umpan Balik',
      description: 'Pilih jenis umpan balik yang sesuai dengan kebutuhan Anda',
      icon: BookOpen,
      content: (
        <div className="grid gap-4 md:grid-cols-3">
          <HelpCard title="Permintaan Fitur" icon={ThumbsUp} variant="feature">
            <p className="text-sm text-muted-foreground">
              Saran untuk fitur baru atau perbaikan yang dapat meningkatkan alur kerja Anda.
            </p>
          </HelpCard>
          
          <HelpCard title="Laporan Bug" icon={MessageSquare} variant="feature">
            <p className="text-sm text-muted-foreground">
              Laporkan masalah atau perilaku yang tidak terduga dalam aplikasi.
            </p>
          </HelpCard>
          
          <HelpCard title="Umpan Balik Umum" icon={Star} variant="feature">
            <p className="text-sm text-muted-foreground">
              Bagikan pengalaman dan pendapat Anda secara keseluruhan tentang Statify.
            </p>
          </HelpCard>
        </div>
      )
    },
    {
      id: 'feedback-form',
      title: 'Kirim Umpan Balik Anda',
      description: 'Kami terus meningkatkan Statify berdasarkan masukan pengguna',
      icon: Mail,
      content: (
        <div className="space-y-6">
          <HelpAlert variant="info" title="Umpan Balik Anda Penting">
            <p className="text-sm mt-2">
              Setiap umpan balik yang Anda berikan membantu kami membuat Statify menjadi lebih baik. 
              Tim kami akan meninjau setiap pengajuan dengan cermat.
            </p>
          </HelpAlert>
          
          <HelpCard title="Formulir Umpan Balik" variant="step">
            <form className="space-y-4 max-w-full">
              <div className="grid gap-4 md:grid-cols-2 w-full">
                <div className="space-y-1">
                  <Label htmlFor="name" className="text-sm">Nama</Label>
                  <Input
                    id="name"
                    placeholder="Nama Anda"
                    className="w-full"
                  />
                </div>
                
                <div className="space-y-1">
                  <Label htmlFor="email" className="text-sm">Email (opsional)</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="anda@contoh.com"
                    className="w-full"
                  />
                </div>
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="feedbackType" className="text-sm">Jenis Umpan Balik</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih jenis umpan balik" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="feature">Permintaan Fitur</SelectItem>
                      <SelectItem value="bug">Laporan Bug</SelectItem>
                      <SelectItem value="general">Umpan Balik Umum</SelectItem>
                      <SelectItem value="other">Lainnya</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="subject" className="text-sm">Subjek</Label>
                <Input
                  id="subject"
                  placeholder="Ringkasan singkat umpan balik Anda"
                  className="w-full"
                />
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="message" className="text-sm">Pesan</Label>
                <Textarea
                  id="message"
                  placeholder="Jelaskan masalah atau saran Anda secara detail..."
                  className="min-h-[120px] resize-y w-full"
                  required
                />
              </div>
              
              <div className="flex items-start space-x-2 pt-2">
                <Checkbox id="contactConsent" className="mt-1" />
                <Label htmlFor="contactConsent" className="text-sm text-muted-foreground">
                  Saya setuju untuk dihubungi terkait umpan balik ini jika diperlukan
                </Label>
              </div>
              
              <div className="pt-2">
                <Button type="submit" className="w-full sm:w-auto">
                  <SendHorizontal className="mr-2 h-4 w-4" />
                  Kirim Umpan Balik
                </Button>
              </div>
            </form>
          </HelpCard>
        </div>
      )
    }
  ];



  const tips = [
    {
      type: 'tip' as const,
      title: 'Umpan Balik Efektif',
      content: 'Berikan detail spesifik dan langkah-langkah untuk mereproduksi masalah saat melaporkan bug.'
    },
    {
      type: 'info' as const,
      title: 'Waktu Respons',
      content: 'Tim kami biasanya merespons umpan balik dalam 1-2 hari kerja.'
    }
  ];

  const relatedTopics = [
    { title: 'Memulai', href: '/help/getting-started' },
    { title: 'FAQ', href: '/help/faq' },
    { title: 'Hubungi Dukungan', href: '/help/contact' },
    { title: 'Panduan Pengguna', href: '/help/user-guide' }
  ];

  return (
    <HelpGuideTemplate
      title="Umpan Balik & Dukungan"
      description="Bantu kami meningkatkan Statify dengan membagikan pemikiran, saran, atau melaporkan masalah Anda"
      lastUpdated="2024-01-15"
      sections={sections}
      tips={tips}
      relatedTopics={relatedTopics}
    />
  );
};