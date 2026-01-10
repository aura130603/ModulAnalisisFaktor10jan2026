/**
 * Default color schemes for charts using d3 color scales and Tailwind color palette
 */

import * as d3 from "d3";

// D3 Color Scales
export const d3ColorScales = {
  // Sequential Scales
  sequential: [
    // Continuous
    {
      name: "Blues (Continuous)",
      scale: d3.interpolateBlues,
      colors: Array.from({ length: 9 }, (_, i) => d3.interpolateBlues(i / 8)),
    },
    {
      name: "Greens (Continuous)",
      scale: d3.interpolateGreens,
      colors: Array.from({ length: 9 }, (_, i) => d3.interpolateGreens(i / 8)),
    },
    {
      name: "Greys (Continuous)",
      scale: d3.interpolateGreys,
      colors: Array.from({ length: 9 }, (_, i) => d3.interpolateGreys(i / 8)),
    },
    {
      name: "Oranges (Continuous)",
      scale: d3.interpolateOranges,
      colors: Array.from({ length: 9 }, (_, i) => d3.interpolateOranges(i / 8)),
    },
    {
      name: "Purples (Continuous)",
      scale: d3.interpolatePurples,
      colors: Array.from({ length: 9 }, (_, i) => d3.interpolatePurples(i / 8)),
    },
    {
      name: "Reds (Continuous)",
      scale: d3.interpolateReds,
      colors: Array.from({ length: 9 }, (_, i) => d3.interpolateReds(i / 8)),
    },
    {
      name: "Turbo (Continuous)",
      scale: d3.interpolateTurbo,
      colors: Array.from({ length: 9 }, (_, i) => d3.interpolateTurbo(i / 8)),
    },
    {
      name: "Viridis (Continuous)",
      scale: d3.interpolateViridis,
      colors: Array.from({ length: 9 }, (_, i) => d3.interpolateViridis(i / 8)),
    },
    {
      name: "Inferno (Continuous)",
      scale: d3.interpolateInferno,
      colors: Array.from({ length: 9 }, (_, i) => d3.interpolateInferno(i / 8)),
    },
    {
      name: "Magma (Continuous)",
      scale: d3.interpolateMagma,
      colors: Array.from({ length: 9 }, (_, i) => d3.interpolateMagma(i / 8)),
    },
    {
      name: "Plasma (Continuous)",
      scale: d3.interpolatePlasma,
      colors: Array.from({ length: 9 }, (_, i) => d3.interpolatePlasma(i / 8)),
    },
    {
      name: "Cividis (Continuous)",
      scale: d3.interpolateCividis,
      colors: Array.from({ length: 9 }, (_, i) => d3.interpolateCividis(i / 8)),
    },
    {
      name: "Warm (Continuous)",
      scale: d3.interpolateWarm,
      colors: Array.from({ length: 9 }, (_, i) => d3.interpolateWarm(i / 8)),
    },
    {
      name: "Cool (Continuous)",
      scale: d3.interpolateCool,
      colors: Array.from({ length: 9 }, (_, i) => d3.interpolateCool(i / 8)),
    },
    {
      name: "Cubehelix (Continuous)",
      scale: d3.interpolateCubehelixDefault,
      colors: Array.from({ length: 9 }, (_, i) =>
        d3.interpolateCubehelixDefault(i / 8)
      ),
    },
    {
      name: "BuGn (Continuous)",
      scale: d3.interpolateBuGn,
      colors: Array.from({ length: 9 }, (_, i) => d3.interpolateBuGn(i / 8)),
    },
    {
      name: "BuPu (Continuous)",
      scale: d3.interpolateBuPu,
      colors: Array.from({ length: 9 }, (_, i) => d3.interpolateBuPu(i / 8)),
    },
    {
      name: "GnBu (Continuous)",
      scale: d3.interpolateGnBu,
      colors: Array.from({ length: 9 }, (_, i) => d3.interpolateGnBu(i / 8)),
    },
    {
      name: "OrRd (Continuous)",
      scale: d3.interpolateOrRd,
      colors: Array.from({ length: 9 }, (_, i) => d3.interpolateOrRd(i / 8)),
    },
    {
      name: "PuBuGn (Continuous)",
      scale: d3.interpolatePuBuGn,
      colors: Array.from({ length: 9 }, (_, i) => d3.interpolatePuBuGn(i / 8)),
    },
    {
      name: "PuBu (Continuous)",
      scale: d3.interpolatePuBu,
      colors: Array.from({ length: 9 }, (_, i) => d3.interpolatePuBu(i / 8)),
    },
    {
      name: "PuRd (Continuous)",
      scale: d3.interpolatePuRd,
      colors: Array.from({ length: 9 }, (_, i) => d3.interpolatePuRd(i / 8)),
    },
    {
      name: "RdPu (Continuous)",
      scale: d3.interpolateRdPu,
      colors: Array.from({ length: 9 }, (_, i) => d3.interpolateRdPu(i / 8)),
    },
    {
      name: "YlGnBu (Continuous)",
      scale: d3.interpolateYlGnBu,
      colors: Array.from({ length: 9 }, (_, i) => d3.interpolateYlGnBu(i / 8)),
    },
    {
      name: "YlGn (Continuous)",
      scale: d3.interpolateYlGn,
      colors: Array.from({ length: 9 }, (_, i) => d3.interpolateYlGn(i / 8)),
    },
    {
      name: "YlOrBr (Continuous)",
      scale: d3.interpolateYlOrBr,
      colors: Array.from({ length: 9 }, (_, i) => d3.interpolateYlOrBr(i / 8)),
    },
    {
      name: "YlOrRd (Continuous)",
      scale: d3.interpolateYlOrRd,
      colors: Array.from({ length: 9 }, (_, i) => d3.interpolateYlOrRd(i / 8)),
    },
    // Discrete
    {
      name: "Blues (Discrete)",
      colors: d3.schemeBlues[9] || d3.schemeBlues[7],
    },
    {
      name: "Greens (Discrete)",
      colors: d3.schemeGreens[9] || d3.schemeGreens[7],
    },
    {
      name: "Greys (Discrete)",
      colors: d3.schemeGreys[9] || d3.schemeGreys[7],
    },
    {
      name: "Oranges (Discrete)",
      colors: d3.schemeOranges[9] || d3.schemeOranges[7],
    },
    {
      name: "Purples (Discrete)",
      colors: d3.schemePurples[9] || d3.schemePurples[7],
    },
    { name: "Reds (Discrete)", colors: d3.schemeReds[9] || d3.schemeReds[7] },
    { name: "BuGn (Discrete)", colors: d3.schemeBuGn[9] || d3.schemeBuGn[7] },
    { name: "BuPu (Discrete)", colors: d3.schemeBuPu[9] || d3.schemeBuPu[7] },
    { name: "GnBu (Discrete)", colors: d3.schemeGnBu[9] || d3.schemeGnBu[7] },
    { name: "OrRd (Discrete)", colors: d3.schemeOrRd[9] || d3.schemeOrRd[7] },
    {
      name: "PuBuGn (Discrete)",
      colors: d3.schemePuBuGn[9] || d3.schemePuBuGn[7],
    },
    { name: "PuBu (Discrete)", colors: d3.schemePuBu[9] || d3.schemePuBu[7] },
    { name: "PuRd (Discrete)", colors: d3.schemePuRd[9] || d3.schemePuRd[7] },
    { name: "RdPu (Discrete)", colors: d3.schemeRdPu[9] || d3.schemeRdPu[7] },
    {
      name: "YlGnBu (Discrete)",
      colors: d3.schemeYlGnBu[9] || d3.schemeYlGnBu[7],
    },
    { name: "YlGn (Discrete)", colors: d3.schemeYlGn[9] || d3.schemeYlGn[7] },
    {
      name: "YlOrBr (Discrete)",
      colors: d3.schemeYlOrBr[9] || d3.schemeYlOrBr[7],
    },
    {
      name: "YlOrRd (Discrete)",
      colors: d3.schemeYlOrRd[9] || d3.schemeYlOrRd[7],
    },
  ],

  // Diverging Scales
  diverging: [
    // Continuous
    {
      name: "BrBG (Continuous)",
      scale: d3.interpolateBrBG,
      colors: Array.from({ length: 11 }, (_, i) => d3.interpolateBrBG(i / 10)),
    },
    {
      name: "PRGn (Continuous)",
      scale: d3.interpolatePRGn,
      colors: Array.from({ length: 11 }, (_, i) => d3.interpolatePRGn(i / 10)),
    },
    {
      name: "PiYG (Continuous)",
      scale: d3.interpolatePiYG,
      colors: Array.from({ length: 11 }, (_, i) => d3.interpolatePiYG(i / 10)),
    },
    {
      name: "PuOr (Continuous)",
      scale: d3.interpolatePuOr,
      colors: Array.from({ length: 11 }, (_, i) => d3.interpolatePuOr(i / 10)),
    },
    {
      name: "RdBu (Continuous)",
      scale: d3.interpolateRdBu,
      colors: Array.from({ length: 11 }, (_, i) => d3.interpolateRdBu(i / 10)),
    },
    {
      name: "RdGy (Continuous)",
      scale: d3.interpolateRdGy,
      colors: Array.from({ length: 11 }, (_, i) => d3.interpolateRdGy(i / 10)),
    },
    {
      name: "RdYlBu (Continuous)",
      scale: d3.interpolateRdYlBu,
      colors: Array.from({ length: 11 }, (_, i) =>
        d3.interpolateRdYlBu(i / 10)
      ),
    },
    {
      name: "RdYlGn (Continuous)",
      scale: d3.interpolateRdYlGn,
      colors: Array.from({ length: 11 }, (_, i) =>
        d3.interpolateRdYlGn(i / 10)
      ),
    },
    {
      name: "Spectral (Continuous)",
      scale: d3.interpolateSpectral,
      colors: Array.from({ length: 11 }, (_, i) =>
        d3.interpolateSpectral(i / 10)
      ),
    },
    // Discrete
    { name: "BrBG (Discrete)", colors: d3.schemeBrBG[11] || d3.schemeBrBG[9] },
    { name: "PRGn (Discrete)", colors: d3.schemePRGn[11] || d3.schemePRGn[9] },
    { name: "PiYG (Discrete)", colors: d3.schemePiYG[11] || d3.schemePiYG[9] },
    { name: "PuOr (Discrete)", colors: d3.schemePuOr[11] || d3.schemePuOr[9] },
    { name: "RdBu (Discrete)", colors: d3.schemeRdBu[11] || d3.schemeRdBu[9] },
    { name: "RdGy (Discrete)", colors: d3.schemeRdGy[11] || d3.schemeRdGy[9] },
    {
      name: "RdYlBu (Discrete)",
      colors: d3.schemeRdYlBu[11] || d3.schemeRdYlBu[9],
    },
    {
      name: "RdYlGn (Discrete)",
      colors: d3.schemeRdYlGn[11] || d3.schemeRdYlGn[9],
    },
    {
      name: "Spectral (Discrete)",
      colors: d3.schemeSpectral[11] || d3.schemeSpectral[9],
    },
  ],

  // Categorical Scales
  categorical: [
    { name: "Category10", colors: d3.schemeCategory10 },
    { name: "Observable10", colors: d3.schemeObservable10 },
    { name: "Accent", colors: d3.schemeAccent },
    { name: "Dark2", colors: d3.schemeDark2 },
    { name: "Paired", colors: d3.schemePaired },
    { name: "Pastel1", colors: d3.schemePastel1 },
    { name: "Pastel2", colors: d3.schemePastel2 },
    { name: "Set1", colors: d3.schemeSet1 },
    { name: "Set2", colors: d3.schemeSet2 },
    { name: "Set3", colors: d3.schemeSet3 },
    { name: "Tableau10", colors: d3.schemeTableau10 },
  ],
};

// Default colors for charts
export const defaultChartColors = d3.schemeCategory10;

// Lighter version of colors for hover/focus states
export const defaultChartColorsLight = [
  "#93C5FD", // blue-300
  "#86EFAC", // green-300
  "#FDA4AF", // red-300
  "#FCD34D", // amber-300
  "#C4B5FD", // violet-300
  "#6EE7B7", // emerald-300
  "#FDBA74", // orange-300
  "#C084FC", // purple-300
  "#5EEAD4", // teal-300
  "#F9A8D4", // pink-300
  "#CBD5E1", // slate-300
  "#6B7280", // gray-500
];

// Darker version of colors for active states
export const defaultChartColorsDark = [
  "#2563EB", // blue-600
  "#16A34A", // green-600
  "#DC2626", // red-600
  "#D97706", // amber-600
  "#7C3AED", // violet-600
  "#059669", // emerald-600
  "#EA580C", // orange-600
  "#9333EA", // purple-600
  "#0D9488", // teal-600
  "#DB2777", // pink-600
  "#475569", // slate-600
  "#1F2937", // gray-800
];

// Basic color presets
export const basicColors = [
  { name: "Red", value: "#ff0000" },
  { name: "Blue", value: "#0000ff" },
  { name: "Green", value: "#00ff00" },
  { name: "Yellow", value: "#ffff00" },
  { name: "Purple", value: "#800080" },
  { name: "Orange", value: "#ffa500" },
  { name: "Pink", value: "#ffc0cb" },
  { name: "Brown", value: "#a52a2a" },
  { name: "Black", value: "#000000" },
  { name: "White", value: "#ffffff" },
];

// Gradient color presets
export const gradientPresets = [
  {
    name: "Blue Gradient",
    colors: ["#1a237e", "#0d47a1", "#1976d2", "#2196f3", "#64b5f6"],
  },
  {
    name: "Green Gradient",
    colors: ["#1b5e20", "#2e7d32", "#388e3c", "#4caf50", "#81c784"],
  },
  {
    name: "Red Gradient",
    colors: ["#b71c1c", "#c62828", "#d32f2f", "#e53935", "#ef5350"],
  },
  {
    name: "Purple Gradient",
    colors: ["#4a148c", "#6a1b9a", "#7b1fa2", "#8e24aa", "#ba68c8"],
  },
  {
    name: "Orange Gradient",
    colors: ["#e65100", "#ef6c00", "#f57c00", "#fb8c00", "#ffb74d"],
  },
];

// Color schemes
export const colorSchemes = [
  {
    name: "Tableau",
    colors: [
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
    ],
  },
  {
    name: "Material",
    colors: [
      "#f44336",
      "#e91e63",
      "#9c27b0",
      "#673ab7",
      "#3f51b5",
      "#2196f3",
      "#03a9f4",
      "#00bcd4",
      "#009688",
      "#4caf50",
    ],
  },
  {
    name: "Pastel",
    colors: [
      "#ffb3ba",
      "#baffc9",
      "#bae1ff",
      "#ffffba",
      "#ffdfba",
      "#ffb3ff",
      "#e6b3ff",
      "#b3d9ff",
      "#b3ffd9",
      "#ffffb3",
    ],
  },
  {
    name: "Vibrant",
    colors: [
      "#ff0000",
      "#00ff00",
      "#0000ff",
      "#ffff00",
      "#ff00ff",
      "#00ffff",
      "#ff8000",
      "#8000ff",
      "#008000",
      "#800000",
    ],
  },
];

// Popular preset colors
export const popularColors = [
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

// Custom color presets
export const customPresets = [
  "#E69F00",
  "#56B4E9",
  "#009E73",
  "#F0E442",
  "#0072B2",
  "#D55E00",
  "#CC79A7",
  "#000000",
];
