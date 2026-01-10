"use client";

import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HelpCircle, BookOpen } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Import all guide components
import { GettingStarted } from "./GettingStarted";

import { 
	FileGuide,
	ImportSav,
	ImportCsv,
	ImportExcel,
	ImportClipboard,
	ExportCsv,
	ExportExcel,
	Print
} from "@/app/help/components/file-guide";
import { StatisticsGuide } from "@/app/help/components/statistics-guide";

// Data guides
import {
	AggregateGuide,
	DefineDateTimeGuide,
	DefineVarPropsGuide,
	DuplicateCasesGuide,
	RestructureGuide,
	SelectCasesGuide,
	SetMeasurementLevelGuide,
	SortCasesGuide,
	SortVarsGuide,
	TransposeGuide,
	WeightCasesGuide,
} from "./data-guide";

interface TabbedHelpContentProps {
	selectedGuide?: string;
	guideType?: string;
}

export const TabbedHelpContent: React.FC<TabbedHelpContentProps> = ({
	selectedGuide,
	guideType,
}) => {
	const [activeTab, setActiveTab] = useState("overview");

	// Determine which guides to show based on guideType
	const getGuideContent = () => {
		switch (guideType) {
			case "file-guide":
				return {
					title: "Panduan Manajemen File",
					description: "Pelajari cara mengimpor, mengekspor, dan mengelola file data Anda",
					overview: (
						<Card>
							<CardHeader>
								<CardTitle>Ikhtisar Manajemen File</CardTitle>
								<CardDescription>
									Kuasai seni manajemen file data dengan panduan komprehensif kami
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div>
									<h3 className="font-semibold mb-2">Format yang Didukung</h3>
									<p className="text-sm text-muted-foreground">
										Bekerja dengan SPSS (.sav), CSV, Excel, dan data clipboard dengan mudah.
									</p>
								</div>
								<div>
									<h3 className="font-semibold mb-2">Aksi Cepat</h3>
									<ul className="text-sm text-muted-foreground space-y-1">
										<li>• Impor data dari berbagai sumber</li>
										<li>• Ekspor hasil dalam berbagai format</li>
										<li>• Cetak data dan hasil analisis</li>
										<li>• Gunakan dataset contoh untuk latihan</li>
									</ul>
								</div>
							</CardContent>
						</Card>
					),
					guides: [
					{ key: "overview", label: "Panduan Lengkap", component: <FileGuide /> },
					{ key: "import-sav", label: "Impor SPSS (.sav)", component: <ImportSav /> },
					{ key: "import-csv", label: "Impor CSV", component: <ImportCsv /> },
					{ key: "import-excel", label: "Impor Excel", component: <ImportExcel /> },
					{ key: "import-clipboard", label: "Impor Clipboard", component: <ImportClipboard /> },
					{ key: "export-csv", label: "Ekspor CSV", component: <ExportCsv /> },
					{ key: "export-excel", label: "Ekspor Excel", component: <ExportExcel /> },
					{ key: "print", label: "Cetak Data", component: <Print /> },
				]
				};
			case "data-guide":
				return {
					title: "Panduan Manajemen Data",
					description: "Transformasi dan kelola data Anda dengan alat yang kuat",
					overview: (
						<Card>
							<CardHeader>
								<CardTitle>Ikhtisar Manajemen Data</CardTitle>
								<CardDescription>
									Temukan teknik untuk membersihkan, mentransformasi, dan menyusun data Anda
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div>
									<h3 className="font-semibold mb-2">Transformasi Data</h3>
									<p className="text-sm text-muted-foreground">
										Restrukturisasi dataset, transposisi variabel, dan agregasi data secara efisien.
									</p>
								</div>
								<div>
									<h3 className="font-semibold mb-2">Kualitas Data</h3>
									<ul className="text-sm text-muted-foreground space-y-1">
										<li>• Identifikasi dan tangani kasus duplikat</li>
										<li>• Atur level pengukuran variabel yang tepat</li>
										<li>• Definisikan variabel tanggal/waktu dengan benar</li>
										<li>• Urutkan dan pilih kasus secara strategis</li>
									</ul>
								</div>
							</CardContent>
						</Card>
					),
					guides: [
						{ key: "aggregate", label: "Agregasi Data", component: <AggregateGuide /> },
						{ key: "restructure", label: "Restrukturisasi Data", component: <RestructureGuide /> },
						{ key: "transpose", label: "Transposisi Data", component: <TransposeGuide /> },
						{ key: "select-cases", label: "Pilih Kasus", component: <SelectCasesGuide /> },
						{ key: "sort-cases", label: "Urutkan Kasus", component: <SortCasesGuide /> },
						{ key: "sort-vars", label: "Urutkan Variabel", component: <SortVarsGuide /> },
						{ key: "set-measurement-level", label: "Atur Tingkat Pengukuran", component: <SetMeasurementLevelGuide /> },
						{ key: "define-datetime", label: "Definisi Tanggal/Waktu", component: <DefineDateTimeGuide /> },
						{ key: "define-var-props", label: "Definisi Properti Variabel", component: <DefineVarPropsGuide /> },
						{ key: "duplicate-cases", label: "Identifikasi Kasus Duplikat", component: <DuplicateCasesGuide /> },
						{ key: "weight-cases", label: "Pemberian Bobot Kasus", component: <WeightCasesGuide /> },
					]
				};
			case "statistics-guide":
				return {
					title: "Panduan Statistik",
					description: "Lakukan analisis statistik komprehensif pada data Anda",
					overview: (
						<Card>
							<CardHeader>
								<CardTitle>Ikhtisar Analisis Statistik</CardTitle>
								<CardDescription>
									Jelajahi alat statistik yang kuat untuk memahami data Anda
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div>
									<h3 className="font-semibold mb-2">Statistik Deskriptif</h3>
									<p className="text-sm text-muted-foreground">
										Buat frekuensi, deskriptif, dan jelajahi distribusi.
									</p>
								</div>
								<div>
									<h3 className="font-semibold mb-2">Analisis Lanjutan</h3>
									<ul className="text-sm text-muted-foreground space-y-1">
										<li>• Analisis tabulasi silang</li>
										<li>• Eksplorasi statistik yang kuat</li>
										<li>• Metode deteksi outlier</li>
										<li>• Interpretasi hasil yang komprehensif</li>
									</ul>
								</div>
							</CardContent>
						</Card>
					),
					guides: [
						{ key: "frequencies", label: "Analisis Frekuensi", component: <StatisticsGuide section="frequencies" /> },
						{ key: "descriptives", label: "Statistik Deskriptif", component: <StatisticsGuide section="descriptives" /> },
						{ key: "explore", label: "Analisis Eksplorasi", component: <StatisticsGuide section="explore" /> },
						{ key: "crosstabs", label: "Analisis Crosstabs", component: <StatisticsGuide section="crosstabs" /> },
						{ key: "linear", label: "Regresi Linear", component: <StatisticsGuide section="linear" /> },
						{ key: "k-means", label: "K-Means Clustering", component: <StatisticsGuide section="k-means" /> },
						{ key: "univariate", label: "GLM Univariate", component: <StatisticsGuide section="univariate" /> },
					]
				};
			default:
				return {
					title: "Pusat Bantuan",
					description: "Panduan komprehensif untuk menggunakan Statify secara efektif",
					overview: <GettingStarted />,
					guides: []
				};
		}
	};

	const guideData = getGuideContent();
	const currentGuide = guideData.guides.find(g => g.key === selectedGuide);

	return (
		<div className="w-full">
			<div className="mb-6">
				<h1 className="text-2xl font-bold mb-2">{guideData.title}</h1>
				<p className="text-muted-foreground">{guideData.description}</p>
			</div>

			<Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
				<TabsList className="grid w-full grid-cols-2">
					<TabsTrigger value="overview" className="flex items-center gap-2">
						<BookOpen className="w-4 h-4" />
						Ikhtisar
					</TabsTrigger>
					<TabsTrigger value="guides" className="flex items-center gap-2">
						<HelpCircle className="w-4 h-4" />
						Panduan Detail
					</TabsTrigger>
				</TabsList>

				<TabsContent value="overview" className="mt-6">
					{guideData.overview}
				</TabsContent>

				<TabsContent value="guides" className="mt-6">
					{currentGuide ? (
						<div className="space-y-6">
							<div className="flex items-center justify-between">
								<h2 className="text-xl font-semibold">
									{currentGuide.label}
								</h2>
								<Badge variant="outline">{guideData.title}</Badge>
							</div>
							{currentGuide.component}
						</div>
					) : (
						<div className="grid gap-4">
							{guideData.guides.map((guide) => (
								<Card key={guide.key} className="hover:shadow-md transition-shadow">
									<CardHeader>
										<CardTitle className="text-lg">{guide.label}</CardTitle>
									</CardHeader>
									<CardContent>
										{guide.component}
									</CardContent>
								</Card>
							))}
						</div>
					)}
				</TabsContent>
			</Tabs>
		</div>
	);
};
