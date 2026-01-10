// src/components/ChartBuilderModal.tsx

import React, { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { useVariableStore } from "@/stores/useVariableStore";
import { useResultStore } from "@/stores/useResultStore";
import { useDataStore } from "@/stores/useDataStore"; // Import useDataStore
import ChartPreview, { ChartPreviewRef } from "./ChartPreview";
import VariableSelection from "./VariableSelection";
import ChartSelection from "./ChartSelection";
import { chartTypes, ChartType } from "@/components/Modals/Graphs/ChartTypes";
import ResultOutput from "@/app/dashboard/result/components/ResultOutput";
import { chartVariableConfig } from "./ChartVariableConfig";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import {
  Pencil2Icon,
  TextAlignLeftIcon,
  BarChartIcon,
  Cross2Icon,
  ChevronRightIcon,
  ChevronLeftIcon,
} from "@radix-ui/react-icons";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { HexColorPicker } from "react-colorful";
import { chartConfigOptions } from "./ChartConfigOptions";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { type ErrorBarOptions } from "@/services/chart/DataProcessingService";
import CustomizationPanel from "./CustomizationPanel";

interface ChartBuilderModalProps {
  onClose: () => void;
}

const ChartBuilderModal: React.FC<ChartBuilderModalProps> = ({ onClose }) => {
  const [chartType, setChartType] = useState<ChartType>("Vertical Bar Chart");
  const [sideVariables, setSideVariables] = useState<string[]>([]);
  const [side2Variables, setSide2Variables] = useState<string[]>([]);
  const [bottomVariables, setBottomVariables] = useState<string[]>([]);
  const [bottom2Variables, setBottom2Variables] = useState<string[]>([]);
  const [colorVariables, setColorVariables] = useState<string[]>([]);
  const [filterVariables, setFilterVariables] = useState<string[]>([]);
  const [lowVariables, setLowVariables] = useState<string[]>([]);
  const [highVariables, setHighVariables] = useState<string[]>([]);
  const [closeVariables, setCloseVariables] = useState<string[]>([]);

  // Add ref to access ChartPreview
  const chartPreviewRef = useRef<ChartPreviewRef>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);

  // Add new state variables for chart customization
  const [chartTitle, setChartTitle] = useState<string>("");
  const [chartSubtitle, setChartSubtitle] = useState<string>("");
  // const [titleFontSize, setTitleFontSize] = useState<string>("16");
  // const [subtitleFontSize, setSubtitleFontSize] = useState<string>("14");
  // const [titleColor, setTitleColor] = useState<string>("#000000");
  // const [subtitleColor, setSubtitleColor] = useState<string>("#666666");
  const [xAxisOptions, setXAxisOptions] = useState({
    label: "",
    min: "",
    max: "",
    majorIncrement: "",
    origin: "",
  });
  const [yAxisOptions, setYAxisOptions] = useState({
    label: "",
    min: "",
    max: "",
    majorIncrement: "",
    origin: "",
  });

  // Add state for Y2 axis (dual axis charts)
  const [y2AxisOptions, setY2AxisOptions] = useState({
    label: "",
    min: "",
    max: "",
    majorIncrement: "",
    origin: "",
  });

  const [zAxisOptions, setZAxisOptions] = useState({
    label: "",
    min: "",
    max: "",
    majorIncrement: "",
    origin: "",
  });

  // Add state for chart colors
  const [chartColors, setChartColors] = useState<string[]>([
    "#1f77b4",
    "#ff7f0e",
    "#2ca02c",
    "#d62728",
    "#9467bd",
    "#8c564b",
    "#e377c2",
    "#7f7f7f",
    "#bcbd22",
    "#17becf",
  ]);

  // Add state for statistic selection (for Summary Point Plot)
  const [selectedStatistic, setSelectedStatistic] = useState<
    "mean" | "median" | "mode" | "min" | "max"
  >("mean");

  // Add state for normal curve (for Histogram)
  const [showNormalCurve, setShowNormalCurve] = useState<boolean>(false);

  const [isCalculating, setIsCalculating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // State untuk error dialog
  const [errorDialog, setErrorDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
  } | null>(null);

  const { addStatistic, addLog, addAnalytic } = useResultStore();
  const [showResult, setShowResult] = useState(false);

  const variables = useVariableStore.getState().variables;
  const data = useDataStore((state) => state.data);

  // Update error bar states
  const [errorBarType, setErrorBarType] = useState<"ci" | "se" | "sd">("ci");
  const [confidenceLevel, setConfidenceLevel] = useState<number>(95);
  const [seMultiplier, setSeMultiplier] = useState<number>(2);
  const [sdMultiplier, setSdMultiplier] = useState<number>(2);
  const [errorBarOptions, setErrorBarOptions] = useState<
    ErrorBarOptions | undefined
  >(undefined);

  useEffect(() => {
    if (dialogRef.current) {
      dialogRef.current.focus();
    }
  }, []);

  // Update useEffect to create proper error bar options
  useEffect(() => {
    if (
      chartType === "Error Bar Chart" ||
      chartType === "Clustered Error Bar Chart"
    ) {
      let newErrorBarOptions: ErrorBarOptions;
      switch (errorBarType) {
        case "ci":
          newErrorBarOptions = {
            type: "ci",
            confidenceLevel: confidenceLevel,
          };
          break;
        case "se":
          newErrorBarOptions = {
            type: "se",
            multiplier: seMultiplier,
          };
          break;
        case "sd":
          newErrorBarOptions = {
            type: "sd",
            multiplier: sdMultiplier,
          };
          break;
      }
      console.log("🔄 Updating error bar options:", newErrorBarOptions);
      setErrorBarOptions(newErrorBarOptions);
    } else {
      setErrorBarOptions(undefined);
    }
  }, [chartType, errorBarType, confidenceLevel, seMultiplier, sdMultiplier]);

  // Utility function to check if all axis config values are false
  function isAxisConfigAllFalse(axisConfig: Record<string, boolean>) {
    return Object.values(axisConfig).every((v) => v === false);
  }

  // Helper function to check if error bar config is enabled
  function isErrorBarEnabled(errorBarConfig: any) {
    if (!errorBarConfig) return false;
    return (
      errorBarConfig.ci?.confidenceLevel ||
      errorBarConfig.se?.multiplier ||
      errorBarConfig.sd?.multiplier
    );
  }

  const config = chartConfigOptions[chartType];

  // Helper function to check if config has dual Y axis
  const hasDualYAxis = (axis: any): axis is { x: any; y1: any; y2: any } => {
    return "y1" in axis && "y2" in axis;
  };

  const settingList = [
    {
      key: "title",
      label: "Title",
      icon: <Pencil2Icon className="w-4 h-4 mr-2" />,
      show: config.title,
    },
    {
      key: "subtitle",
      label: "Subtitle",
      icon: <TextAlignLeftIcon className="w-4 h-4 mr-2" />,
      show: config.subtitle,
    },
    {
      key: "statistic",
      label: "Statistic",
      icon: <BarChartIcon className="w-4 h-4 mr-2" />,
      show: config.statistic || false,
    },
    {
      key: "x-axis",
      label: "X-Axis",
      icon: <BarChartIcon className="w-4 h-4 mr-2" />,
      show: !isAxisConfigAllFalse(config.axis.x),
    },
    {
      key: "z-axis",
      label: "Z-Axis",
      icon: <BarChartIcon className="w-4 h-4 mr-2" />,
      show: "z" in config.axis && !isAxisConfigAllFalse((config.axis as any).z),
    },

    // Conditional Y axis settings based on whether chart has dual Y axis
    ...(hasDualYAxis(config.axis)
      ? [
          {
            key: "y1-axis",
            label: "Y1-Axis",
            icon: <BarChartIcon className="w-4 h-4 mr-2 rotate-90" />,
            show: !isAxisConfigAllFalse(config.axis.y1),
          },
          {
            key: "y2-axis",
            label: "Y2-Axis",
            icon: <BarChartIcon className="w-4 h-4 mr-2 rotate-90" />,
            show: !isAxisConfigAllFalse(config.axis.y2),
          },
        ]
      : [
          {
            key: "y-axis",
            label: "Y-Axis",
            icon: <BarChartIcon className="w-4 h-4 mr-2 rotate-90" />,
            show: !isAxisConfigAllFalse((config.axis as any).y),
          },
        ]),
    {
      key: "error-bar",
      label: "Error Bar",
      icon: <BarChartIcon className="w-4 h-4 mr-2" />,
      show: isErrorBarEnabled(config.errorBar),
    },
  ].filter((item) => item.show);
  const [selectedSetting, setSelectedSetting] = useState<string>("title");

  const [showCustomizationPanel, setShowCustomizationPanel] = useState(false);

  // Responsive chart dimensions
  const [chartDimensions, setChartDimensions] = useState({
    width: 300,
    height: 390,
  });

  // Calculate responsive chart dimensions
  useEffect(() => {
    const updateChartDimensions = () => {
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;

      let width, height;

      if (screenWidth < 1024) {
        // Mobile/tablet view
        width = Math.min(screenWidth * 0.8, 400);
        height = Math.min(screenHeight * 0.4, 250);
      } else {
        // Desktop view
        if (showCustomizationPanel) {
          width = Math.min(screenWidth * 0.25, 400);
          height = Math.min(screenHeight * 0.45, 300);
        } else {
          width = Math.min(screenWidth * 0.3, 450);
          height = Math.min(screenHeight * 0.45, 600);
        }
      }

      setChartDimensions({ width, height });
    };

    updateChartDimensions();
    window.addEventListener("resize", updateChartDimensions);

    return () => window.removeEventListener("resize", updateChartDimensions);
  }, [showCustomizationPanel]);

  // Add new state variables for color selection
  const [selectedColorType, setSelectedColorType] = useState<
    "basic" | "gradient" | "custom"
  >("basic");
  const [selectedGradient, setSelectedGradient] = useState<string>("");
  const [selectedColorScheme, setSelectedColorScheme] = useState<string>("");

  // State for color mode
  const [colorMode, setColorMode] = useState<"single" | "group" | "custom">(
    "single"
  );
  const [singleColor, setSingleColor] = useState<string>("#1f77b4");
  const [inputColor, setInputColor] = useState<string>("#1f77b4");
  const [pickerColor, setPickerColor] = useState<string>("#1f77b4");
  const [groupColors, setGroupColors] = useState<string[]>([
    "#1f77b4",
    "#ff7f0e",
    "#2ca02c",
    "#d62728",
    "#9467bd",
  ]);

  // Array of popular preset colors
  const popularColors = [
    "#000000",
    "#424242",
    "#757575",
    "#BDBDBD",
    "#FFFFFF",
    "#D32F2F",
    "#F44336",
    "#FFCDD2",
    "#E57373",
    "#FF5252",
    "#C2185B",
    "#E040FB",
    "#9C27B0",
    "#7B1FA2",
    "#512DA8",
    "#1976D2",
    "#2196F3",
    "#64B5F6",
    "#03A9F4",
    "#00BCD4",
    "#388E3C",
    "#4CAF50",
    "#81C784",
    "#8BC34A",
    "#CDDC39",
    "#FBC02D",
    "#FFEB3B",
    "#FFD600",
    "#FF9800",
    "#FF5722",
  ];

  // State for showing custom picker
  const singleCustomRef = useRef<HTMLButtonElement | null>(null);
  const [showSingleCustom, setShowSingleCustom] = useState(false);
  const [showGroupCustom, setShowGroupCustom] = useState<number | null>(null);

  const customPresets = [
    "#E69F00",
    "#56B4E9",
    "#009E73",
    "#F0E442",
    "#0072B2",
    "#D55E00",
    "#CC79A7",
    "#000000",
  ];

  useEffect(() => {
    console.log("Updated Side Variables:", sideVariables);
  }, [sideVariables]);

  useEffect(() => {
    console.log("Updated Bottom Variables:", bottomVariables);
  }, [bottomVariables]);

  useEffect(() => {
    if (colorMode === "single") {
      setChartColors([singleColor]);
    } else {
      setChartColors(groupColors);
    }
    // eslint-disable-next-line
  }, [colorMode, singleColor, groupColors]);

  const handleDragStart = (
    e: React.DragEvent<HTMLDivElement>,
    variableName: string
  ) => {
    e.dataTransfer.setData("text/plain", variableName);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleChartTypeChange = (value: ChartType) => {
    setChartType(value);
  };

  const handleDropSide = (newSideVariables: string[]) => {
    setSideVariables(newSideVariables);
    console.log("Updated Side Variables:", newSideVariables);
  };

  const handleDropSide2 = (newSide2Variables: string[]) => {
    setSide2Variables(newSide2Variables);
    console.log("Updated Side2 Variables:", newSide2Variables);
  };

  const handleDropBottom = (newBottomVariables: string[]) => {
    setBottomVariables(newBottomVariables);
    console.log("Updated Bottom Variables:", newBottomVariables);
  };

  const handleDropBottom2 = (newBottom2Variables: string[]) => {
    setBottom2Variables(newBottom2Variables);
    console.log("Updated Bottom2 Variables:", newBottom2Variables);
  };

  const handleDropColor = (newColorVariables: string[]) => {
    setColorVariables(newColorVariables);
    console.log("Updated Color Variables:", newColorVariables);
  };

  const handleDropFilter = (newFilterVariables: string[]) => {
    setFilterVariables(newFilterVariables);
    console.log("Updated Bottom Variables:", newFilterVariables);
  };

  const handleDropLow = (newLowVariables: string[]) => {
    setLowVariables(newLowVariables);
    console.log("Updated Low Variables:", newLowVariables);
  };

  const handleDropHigh = (newHighVariables: string[]) => {
    setHighVariables(newHighVariables);
    console.log("Updated High Variables:", newHighVariables);
  };

  const handleDropClose = (newCloseVariables: string[]) => {
    setCloseVariables(newCloseVariables);
    console.log("Updated Close Variables:", newCloseVariables);
  };

  const handleRemoveVariable = (
    type: "side" | "bottom" | "low" | "high" | "close" | "side2" | "bottom2",
    index: number
  ) => {
    if (type === "side") {
      setSideVariables((prev) => prev.filter((_, i) => i !== index));
    } else if (type === "bottom") {
      setBottomVariables((prev) => prev.filter((_, i) => i !== index));
    } else if (type === "low") {
      setLowVariables((prev) => prev.filter((_, i) => i !== index));
    } else if (type === "high") {
      setHighVariables((prev) => prev.filter((_, i) => i !== index));
    } else if (type === "close") {
      setCloseVariables((prev) => prev.filter((_, i) => i !== index));
    } else if (type === "side2") {
      setSide2Variables((prev) => prev.filter((_, i) => i !== index));
    } else if (type === "bottom2") {
      setBottom2Variables((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const handleResetVariables = () => {
    setSideVariables([]);
    setSide2Variables([]);
    setBottomVariables([]);
    setColorVariables([]);
    setFilterVariables([]);
    setLowVariables([]);
    setHighVariables([]);
    setCloseVariables([]);
    setBottom2Variables([]);
    setXAxisOptions({
      label: "",
      min: "",
      max: "",
      majorIncrement: "",
      origin: "",
    });
    setYAxisOptions({
      label: "",
      min: "",
      max: "",
      majorIncrement: "",
      origin: "",
    });
    setY2AxisOptions({
      label: "",
      min: "",
      max: "",
      majorIncrement: "",
      origin: "",
    });
    setChartTitle("");
    setChartSubtitle("");
    setSelectedStatistic("mean");
  };

  const handleGenerateChart = async () => {
    // Validasi Input dengan error dialog
    if (
      !validateChartVariablesWithError(
        chartType,
        sideVariables,
        bottomVariables,
        lowVariables,
        highVariables,
        closeVariables
      )
    ) {
      return;
    }

    setIsCalculating(true);
    setErrorMsg(null);

    try {
      // Get the pre-generated JSON from ChartPreview using ref
      const chartJSON = chartPreviewRef.current?.getGeneratedChartJSON();

      if (!chartJSON) {
        setErrorMsg(
          "Chart JSON tidak tersedia. Pastikan data dan variabel sudah dipilih."
        );
        setIsCalculating(false);
        return;
      }

      // 1. Tambahkan Log
      const logMsg = `GENERATE CHART TYPE ${chartType} WITH VARIABLES Y: ${sideVariables.join(
        ", "
      )} X: ${bottomVariables.join(", ")}`;

      // Add log first and get the ID
      const logId = await addLog({ log: logMsg });

      // Add analytic with log_id
      const analyticId = await addAnalytic(logId, {
        title: "Chart Builder",
        note: "",
      });

      // Add statistic with analytic_id using the pre-generated JSON
      await addStatistic(analyticId, {
        title: chartType,
        output_data: chartJSON,
        components: chartType,
        description: "",
      });

      setIsCalculating(false);
      onClose(); // Tutup modal
      setShowResult(true);
    } catch (error) {
      console.error("Error during chart generation:", error);
      setErrorMsg("Terjadi kesalahan saat menyimpan hasil.");
      setIsCalculating(false);
    }
  };

  // Function untuk validasi tanpa menampilkan error dialog (untuk cek tombol)
  const validateChartVariables = (
    chartType: ChartType,
    sideVariables: string[],
    bottomVariables: string[],
    lowVariables: string[],
    highVariables: string[],
    closeVariables: string[]
  ) => {
    const chartConfig = chartVariableConfig[chartType];

    // Validasi untuk side (sumbu Y)
    if (
      sideVariables.length < chartConfig.side.min ||
      sideVariables.length > chartConfig.side.max
    ) {
      return false;
    }

    // Validasi untuk bottom (sumbu X) - hanya jika chart memerlukan bottom variables
    if (chartConfig.bottom.min > 0 || chartConfig.bottom.max > 0) {
      if (
        bottomVariables.length < chartConfig.bottom.min ||
        bottomVariables.length > chartConfig.bottom.max
      ) {
        return false;
      }
    }

    if (
      chartConfig.low &&
      (chartConfig.low.min > 0 || chartConfig.low.max > 0) &&
      (lowVariables.length < chartConfig.low.min ||
        lowVariables.length > chartConfig.low.max)
    ) {
      return false;
    }

    if (
      chartConfig.high &&
      (chartConfig.high.min > 0 || chartConfig.high.max > 0) &&
      (highVariables.length < chartConfig.high.min ||
        highVariables.length > chartConfig.high.max)
    ) {
      return false;
    }

    if (
      chartConfig.close &&
      (chartConfig.close.min > 0 || chartConfig.close.max > 0) &&
      (closeVariables.length < chartConfig.close.min ||
        closeVariables.length > chartConfig.close.max)
    ) {
      return false;
    }

    return true; // Jika semua validasi lolos
  };

  // Function untuk validasi dengan menampilkan error dialog
  const validateChartVariablesWithError = (
    chartType: ChartType,
    sideVariables: string[],
    bottomVariables: string[],
    lowVariables: string[],
    highVariables: string[],
    closeVariables: string[]
  ) => {
    const chartConfig = chartVariableConfig[chartType];

    // Validasi untuk side (sumbu Y)
    if (
      sideVariables.length < chartConfig.side.min ||
      sideVariables.length > chartConfig.side.max
    ) {
      setErrorDialog({
        open: true,
        title: "Validation Error",
        description: `Jumlah variabel untuk sumbu Y (side) harus antara ${chartConfig.side.min} dan ${chartConfig.side.max}.`,
      });
      return false;
    }

    // Validasi untuk bottom (sumbu X) - hanya jika chart memerlukan bottom variables
    if (chartConfig.bottom.min > 0 || chartConfig.bottom.max > 0) {
      if (
        bottomVariables.length < chartConfig.bottom.min ||
        bottomVariables.length > chartConfig.bottom.max
      ) {
        setErrorDialog({
          open: true,
          title: "Validation Error",
          description: `Jumlah variabel untuk sumbu X (bottom) harus antara ${chartConfig.bottom.min} dan ${chartConfig.bottom.max}.`,
        });
        return false;
      }
    }

    if (
      chartConfig.low &&
      (chartConfig.low.min > 0 || chartConfig.low.max > 0) &&
      (lowVariables.length < chartConfig.low.min ||
        lowVariables.length > chartConfig.low.max)
    ) {
      setErrorDialog({
        open: true,
        title: "Validation Error",
        description: `Jumlah variabel untuk sumbu low harus antara ${chartConfig.low.min} dan ${chartConfig.low.max}.`,
      });
      return false;
    }

    if (
      chartConfig.high &&
      (chartConfig.high.min > 0 || chartConfig.high.max > 0) &&
      (highVariables.length < chartConfig.high.min ||
        highVariables.length > chartConfig.high.max)
    ) {
      setErrorDialog({
        open: true,
        title: "Validation Error",
        description: `Jumlah variabel untuk sumbu high harus antara ${chartConfig.high.min} dan ${chartConfig.high.max}.`,
      });
      return false;
    }

    if (
      chartConfig.close &&
      (chartConfig.close.min > 0 || chartConfig.close.max > 0) &&
      (closeVariables.length < chartConfig.close.min ||
        closeVariables.length > chartConfig.close.max)
    ) {
      setErrorDialog({
        open: true,
        title: "Validation Error",
        description: `Jumlah variabel untuk sumbu close harus antara ${chartConfig.close.min} dan ${chartConfig.close.max}.`,
      });
      return false;
    }

    return true; // Jika semua validasi lolos
  };

  // Function untuk mengecek apakah chart siap untuk di-generate
  const isChartReadyToGenerate = () => {
    // Cek apakah ada data
    if (data.length === 0) {
      return false;
    }

    // Cek apakah ada variabel yang dipilih
    if (sideVariables.length === 0) {
      return false;
    }

    // Validasi variabel berdasarkan chart type
    return validateChartVariables(
      chartType,
      sideVariables,
      bottomVariables,
      lowVariables,
      highVariables,
      closeVariables
    );
  };

  // Paksa scroll ke atas saat modal muncul agar scroll mouse wheel langsung aktif
  useEffect(() => {
    if (dialogRef.current) {
      dialogRef.current.scrollTop = 0;
      dialogRef.current.focus();
    }
    // Forward event wheel ke modal jika mouse berada di luar modal
    const handler = (e: WheelEvent) => {
      if (dialogRef.current && !dialogRef.current.contains(e.target as Node)) {
        dialogRef.current.scrollTop += e.deltaY;
        e.preventDefault();
      }
    };
    window.addEventListener("wheel", handler, { passive: false });
    return () => window.removeEventListener("wheel", handler);
  }, []);

  if (showResult) {
    return <ResultOutput />;
  }

  return (
    <>
      {/* Error Alert Dialog */}
      {errorDialog?.open && (
        <AlertDialog
          open={errorDialog.open}
          onOpenChange={(open) => setErrorDialog(open ? errorDialog : null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{errorDialog.title}</AlertDialogTitle>
              <AlertDialogDescription>
                {errorDialog.description}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction onClick={() => setErrorDialog(null)}>
                OK
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      <DialogContent
        className="custom-dialog-content sm:max-h-[95%] max-w-[95%] lg:max-w-[90%] xl:max-w-[85%] overflow-y-scroll"
        style={{ WebkitOverflowScrolling: "touch" }}
        tabIndex={0}
        ref={dialogRef}
        autoFocus
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader className="p-1 m-0 flex flex-row justify-between items-center">
          <DialogTitle className="text-xs lg:text-sm font-semibold m-0 p-0">
            Chart Builder
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-12 gap-2 lg:gap-4 py-0 lg:py-1 px-1 lg:px-0 text-xs lg:text-sm relative">
          {/* Kolom Kiri - Pilih Variabel dan Jenis Chart */}
          <div
            className={
              showCustomizationPanel
                ? "col-span-12 lg:col-span-3 space-y-2 lg:space-y-4 pr-2 lg:pr-4 border-r-0 lg:border-r-2 border-b-2 lg:border-b-0 border-gray-100 mb-2 lg:mb-0 pb-2 lg:pb-0 text-xs lg:text-sm"
                : "col-span-12 lg:col-span-5 space-y-2 lg:space-y-4 pr-2 lg:pr-4 border-r-0 lg:border-r-2 border-b-2 lg:border-b-0 border-gray-100 mb-2 lg:mb-0 pb-2 lg:pb-0 text-xs lg:text-sm"
            }
          >
            <VariableSelection
              variables={variables}
              onDragStart={handleDragStart}
            />
            {/* Chart Type Selection tetap di sini */}
            <TooltipProvider>
              <div className="border p-2 lg:p-3 rounded-lg shadow-sm h-[160px] lg:h-[270px] mt-2 text-xs lg:text-sm">
                <div className="mb-1">
                  <Label className="text-xs lg:text-sm">Choose Graph</Label>
                </div>
                <div className="overflow-y-auto max-h-[100px] lg:max-h-[220px] chart-selection-container">
                  <div
                    className="chart-selection-grid w-full gap-1 lg:gap-2 mt-1 gap-y-0.5 lg:gap-y-1"
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(70px, 1fr))",
                    }}
                  >
                    {chartTypes.map((type, index) => (
                      <Tooltip key={index}>
                        <TooltipTrigger asChild>
                          <div
                            className={`relative cursor-pointer p-2 lg:p-2 border-2 rounded-lg text-center flex flex-col items-center justify-center h-[70px] lg:h-[100px] w-full text-xs lg:text-sm ${
                              chartType === type
                                ? "bg-gray-300 text-black"
                                : "bg-gray-100"
                            }`}
                            onClick={() => handleChartTypeChange(type)}
                          >
                            <div className="flex justify-center items-center overflow-hidden mb-1 lg:mb-2">
                              <ChartSelection
                                chartType={type}
                                width={50}
                                height={50}
                                useaxis={false}
                              />
                            </div>
                            <span
                              className="font-semibold text-[6px] lg:text-[8px] block leading-tight line-clamp-2 overflow-hidden text-ellipsis text-center"
                              style={{
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                                whiteSpace: "normal",
                                minHeight: "20px",
                              }}
                            >
                              {type.charAt(0).toUpperCase() + type.slice(1)}
                            </span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent
                          side="top"
                          className="text-xs lg:text-sm"
                        >
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </div>
                </div>
              </div>
            </TooltipProvider>
          </div>

          {/* Kolom Tengah - Preview Chart */}
          <div
            className={
              showCustomizationPanel
                ? "col-span-12 lg:col-span-6 flex justify-center items-center mb-2 lg:mb-0 pb-2 lg:pb-0 border-b-2 lg:border-b-0 border-gray-100 text-xs lg:text-sm px-4"
                : "col-span-12 lg:col-span-7 flex justify-center items-center mb-2 lg:mb-0 pb-2 lg:pb-0 border-b-2 lg:border-b-0 border-gray-100 text-xs lg:text-sm px-4"
            }
            style={{ minHeight: "400px", overflowX: "auto" }}
          >
            <ChartPreview
              ref={chartPreviewRef}
              chartType={chartType}
              width={chartDimensions.width}
              height={chartDimensions.height}
              useaxis={true}
              sideVariables={sideVariables}
              side2Variables={side2Variables}
              bottomVariables={bottomVariables}
              bottom2Variables={bottom2Variables}
              colorVariables={colorVariables}
              filterVariables={filterVariables}
              lowVariables={lowVariables}
              highVariables={highVariables}
              closeVariables={closeVariables}
              onDropSide={handleDropSide}
              onDropSide2={handleDropSide2}
              onDropBottom={handleDropBottom}
              onDropBottom2={handleDropBottom2}
              onDropColor={handleDropColor}
              onDropFilter={handleDropFilter}
              onDropLow={handleDropLow}
              onDropHigh={handleDropHigh}
              onDropClose={handleDropClose}
              handleRemoveVariable={handleRemoveVariable}
              validateChartVariables={validateChartVariables}
              chartTitle={chartTitle}
              chartSubtitle={chartSubtitle}
              xAxisLabel={xAxisOptions.label}
              yAxisLabel={yAxisOptions.label}
              yLeftAxisLabel={yAxisOptions.label}
              yRightAxisLabel={y2AxisOptions.label}
              xAxisMin={xAxisOptions.min}
              xAxisMax={xAxisOptions.max}
              xAxisMajorIncrement={xAxisOptions.majorIncrement}
              xAxisOrigin={xAxisOptions.origin}
              yAxisMin={yAxisOptions.min}
              yAxisMax={yAxisOptions.max}
              yAxisMajorIncrement={yAxisOptions.majorIncrement}
              yAxisOrigin={yAxisOptions.origin}
              yRightAxisMin={y2AxisOptions.min}
              yRightAxisMax={y2AxisOptions.max}
              yRightAxisMajorIncrement={y2AxisOptions.majorIncrement}
              yRightAxisOrigin={y2AxisOptions.origin}
              chartColors={chartColors}
              selectedStatistic={selectedStatistic}
              errorBarOptions={errorBarOptions}
              showNormalCurve={showNormalCurve}
            />
          </div>
        </div>

        {/* Panel Kustomisasi - Absolute Positioning */}
        <div
          className={`absolute right-0 bg-white z-10 transition-transform duration-300 ${
            showCustomizationPanel
              ? "w-[200px] sm:w-[220px] md:w-[240px] lg:w-[270px] xl:w-[270px]"
              : "w-0"
          }`}
          style={{
            top: "50%",
            transform: showCustomizationPanel
              ? "translateY(-50%)"
              : "translate(100%, -50%)",
            height: "calc(80vh - 1rem)",
            maxHeight: "calc(100% - 2rem)",
            overflowY: "auto",
          }}
        >
          {/* Konten panel */}
          <div className="p-4 h-full overflow-y-auto">
            <CustomizationPanel
              onClose={() => setShowCustomizationPanel(false)}
              chartType={chartType}
              chartConfigOptions={chartConfigOptions}
              colorMode={colorMode}
              setColorMode={setColorMode}
              singleColor={singleColor}
              setSingleColor={setSingleColor}
              groupColors={groupColors}
              setGroupColors={setGroupColors}
              setChartColors={setChartColors}
              chartTitle={chartTitle}
              setChartTitle={setChartTitle}
              chartSubtitle={chartSubtitle}
              setChartSubtitle={setChartSubtitle}
              xAxisOptions={xAxisOptions}
              setXAxisOptions={setXAxisOptions}
              yAxisOptions={yAxisOptions}
              setYAxisOptions={setYAxisOptions}
              y2AxisOptions={y2AxisOptions}
              setY2AxisOptions={setY2AxisOptions}
              zAxisOptions={zAxisOptions}
              setZAxisOptions={setZAxisOptions}
              selectedStatistic={selectedStatistic}
              setSelectedStatistic={setSelectedStatistic}
              errorBarType={errorBarType}
              setErrorBarType={setErrorBarType}
              confidenceLevel={confidenceLevel}
              setConfidenceLevel={setConfidenceLevel}
              seMultiplier={seMultiplier}
              setSeMultiplier={setSeMultiplier}
              sdMultiplier={sdMultiplier}
              setSdMultiplier={setSdMultiplier}
              showNormalCurve={showNormalCurve}
              setShowNormalCurve={setShowNormalCurve}
            />
          </div>
        </div>

        {/* Tombol Expand - Di Luar Panel, Z-Index Lebih Tinggi */}
        <button
          onClick={() => setShowCustomizationPanel(!showCustomizationPanel)}
          className={`absolute top-1/2 -translate-y-1/2 z-30 bg-[#E5E0D8] border border-gray-300 transition-all duration-300 ${
            showCustomizationPanel
              ? "right-[200px] sm:right-[220px] md:right-[240px] lg:right-[270px] xl:right-[255px]"
              : "right-0"
          }`}
          style={{
            width: "24px",
            height: "80px",
            borderRadius: "12px 0 0 12px",
            padding: "8px 4px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "2px 0 4px rgba(0,0,0,0.1)",
          }}
        >
          <div className="flex flex-col items-center space-y-1">
            {/* <div className="w-1 h-1 bg-gray-400 rounded-full"></div> */}
            <ChevronLeftIcon
              className={`w-4 h-4 text-gray-600 transition-transform ${
                showCustomizationPanel ? "" : "rotate-180"
              }`}
            />
            {/* <div className="w-1 h-1 bg-gray-400 rounded-full"></div> */}
          </div>
        </button>

        {/* Error Message */}
        {errorMsg && (
          <div className="text-red-500 text-xs lg:text-sm mb-2 px-1 lg:px-0">
            {errorMsg}
          </div>
        )}

        <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0 mt-2 text-xs lg:text-sm">
          <Button
            variant="outline"
            onClick={onClose}
            className="text-xs lg:text-sm"
          >
            Cancel
          </Button>
          <Button
            variant="outline"
            onClick={handleResetVariables}
            className="text-xs lg:text-sm"
          >
            Reset
          </Button>

          <Button
            onClick={handleGenerateChart}
            disabled={isCalculating || !isChartReadyToGenerate()}
            className="text-xs lg:text-sm"
          >
            {isCalculating ? (
              <>
                <svg
                  className="animate-spin h-4 w-4 lg:h-5 lg:w-5 mr-2 lg:mr-3 border-t-2 border-b-2 border-gray-900 rounded-full"
                  viewBox="0 0 24 24"
                ></svg>
                Generating...
              </>
            ) : (
              "OK"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </>
  );
};

export default ChartBuilderModal;
