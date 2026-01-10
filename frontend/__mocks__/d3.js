// Mock for d3 library
const mockColors = [
  '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd',
  '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf'
];

module.exports = {
  // Interpolate functions
  interpolateReds: (t) => `rgb(${Math.floor(255 * t)}, 0, 0)`,
  interpolateTurbo: (t) => `rgb(${Math.floor(255 * t)}, ${Math.floor(255 * (1-t))}, 0)`,
  interpolateBlues: (t) => `rgb(0, 0, ${Math.floor(255 * t)})`,
  interpolateGreens: (t) => `rgb(0, ${Math.floor(255 * t)}, 0)`,
  interpolateOranges: (t) => `rgb(255, ${Math.floor(165 * t)}, 0)`,
  interpolatePurples: (t) => `rgb(${Math.floor(128 * t)}, 0, ${Math.floor(128 * t)})`,
  interpolateGreys: (t) => `rgb(${Math.floor(128 * t)}, ${Math.floor(128 * t)}, ${Math.floor(128 * t)})`,
  interpolateViridis: (t) => `rgb(${Math.floor(255 * t)}, ${Math.floor(255 * t)}, 0)`,
  interpolatePlasma: (t) => `rgb(${Math.floor(255 * t)}, 0, ${Math.floor(255 * t)})`,
  interpolateInferno: (t) => `rgb(${Math.floor(255 * t)}, ${Math.floor(128 * t)}, 0)`,
  interpolateMagma: (t) => `rgb(${Math.floor(255 * t)}, 0, ${Math.floor(128 * t)})`,
  interpolateCividis: (t) => `rgb(0, ${Math.floor(255 * t)}, ${Math.floor(255 * t)})`,
  interpolateWarm: (t) => `rgb(255, ${Math.floor(255 * t)}, ${Math.floor(128 * t)})`,
  interpolateCool: (t) => `rgb(${Math.floor(128 * t)}, ${Math.floor(255 * t)}, 255)`,
  interpolateCubehelixDefault: (t) => `rgb(${Math.floor(255 * t)}, ${Math.floor(255 * t)}, ${Math.floor(255 * t)})`,
  interpolateRainbow: (t) => `hsl(${Math.floor(360 * t)}, 100%, 50%)`,
  interpolateSinebow: (t) => `hsl(${Math.floor(360 * t)}, 100%, 50%)`,
  
  // Additional interpolate functions
  interpolateBuGn: (t) => `rgb(${Math.floor(64 * (1-t))}, ${Math.floor(255 * t)}, ${Math.floor(128 * t)})`,
  interpolateBuPu: (t) => `rgb(${Math.floor(128 * t)}, ${Math.floor(64 * (1-t))}, ${Math.floor(255 * t)})`,
  interpolateGnBu: (t) => `rgb(0, ${Math.floor(255 * t)}, ${Math.floor(255 * t)})`,
  interpolateOrRd: (t) => `rgb(255, ${Math.floor(165 * t)}, ${Math.floor(128 * t)})`,
  interpolatePuBuGn: (t) => `rgb(${Math.floor(128 * t)}, ${Math.floor(255 * t)}, ${Math.floor(128 * t)})`,
  interpolatePuBu: (t) => `rgb(${Math.floor(128 * t)}, ${Math.floor(64 * t)}, ${Math.floor(255 * t)})`,
  interpolatePuRd: (t) => `rgb(${Math.floor(255 * t)}, ${Math.floor(64 * t)}, ${Math.floor(128 * t)})`,
  interpolateRdPu: (t) => `rgb(${Math.floor(255 * t)}, 0, ${Math.floor(128 * t)})`,
  interpolateYlGnBu: (t) => `rgb(${Math.floor(255 * (1-t))}, ${Math.floor(255 * t)}, ${Math.floor(255 * t)})`,
  interpolateYlGn: (t) => `rgb(${Math.floor(255 * (1-t))}, ${Math.floor(255 * t)}, 0)`,
  interpolateYlOrBr: (t) => `rgb(255, ${Math.floor(255 * t)}, ${Math.floor(128 * t)})`,
  interpolateYlOrRd: (t) => `rgb(255, ${Math.floor(165 * t)}, ${Math.floor(128 * t)})`,
  
  // Diverging interpolate functions
  interpolateBrBG: (t) => `rgb(${Math.floor(166 * (1-t))}, ${Math.floor(97 * t)}, ${Math.floor(26 * t)})`,
  interpolatePRGn: (t) => `rgb(${Math.floor(123 * t)}, ${Math.floor(50 * (1-t))}, ${Math.floor(148 * t)})`,
  interpolatePiYG: (t) => `rgb(${Math.floor(208 * t)}, ${Math.floor(28 * (1-t))}, ${Math.floor(139 * t)})`,
  interpolatePuOr: (t) => `rgb(${Math.floor(241 * t)}, ${Math.floor(163 * (1-t))}, ${Math.floor(64 * t)})`,
  interpolateRdBu: (t) => `rgb(${Math.floor(178 * (1-t))}, ${Math.floor(24 * t)}, ${Math.floor(43 * t)})`,
  interpolateRdGy: (t) => `rgb(${Math.floor(178 * (1-t))}, ${Math.floor(24 * t)}, ${Math.floor(43 * t)})`,
  interpolateRdYlBu: (t) => `rgb(${Math.floor(215 * (1-t))}, ${Math.floor(48 * t)}, ${Math.floor(39 * t)})`,
  interpolateRdYlGn: (t) => `rgb(${Math.floor(215 * (1-t))}, ${Math.floor(48 * t)}, ${Math.floor(39 * t)})`,
  interpolateSpectral: (t) => `rgb(${Math.floor(158 * (1-t))}, ${Math.floor(1 * t)}, ${Math.floor(66 * t)})`,
  
  // Scheme functions (discrete color palettes)
  schemeBlues: { 7: mockColors, 9: mockColors },
  schemeGreens: { 7: mockColors, 9: mockColors },
  schemeGreys: { 7: mockColors, 9: mockColors },
  schemeOranges: { 7: mockColors, 9: mockColors },
  schemePurples: { 7: mockColors, 9: mockColors },
  schemeReds: { 7: mockColors, 9: mockColors },
  schemeBuGn: { 7: mockColors, 9: mockColors },
  schemeBuPu: { 7: mockColors, 9: mockColors },
  schemeGnBu: { 7: mockColors, 9: mockColors },
  schemeOrRd: { 7: mockColors, 9: mockColors },
  schemePuBuGn: { 7: mockColors, 9: mockColors },
  schemePuBu: { 7: mockColors, 9: mockColors },
  schemePuRd: { 7: mockColors, 9: mockColors },
  schemeRdPu: { 7: mockColors, 9: mockColors },
  schemeYlGnBu: { 7: mockColors, 9: mockColors },
  schemeYlGn: { 7: mockColors, 9: mockColors },
  schemeYlOrBr: { 7: mockColors, 9: mockColors },
  schemeYlOrRd: { 7: mockColors, 9: mockColors },
  
  // Diverging schemes
  schemeBrBG: { 9: mockColors, 11: mockColors },
  schemePRGn: { 9: mockColors, 11: mockColors },
  schemePiYG: { 9: mockColors, 11: mockColors },
  schemePuOr: { 9: mockColors, 11: mockColors },
  schemeRdBu: { 9: mockColors, 11: mockColors },
  schemeRdGy: { 9: mockColors, 11: mockColors },
  schemeRdYlBu: { 9: mockColors, 11: mockColors },
  schemeRdYlGn: { 9: mockColors, 11: mockColors },
  schemeSpectral: { 9: mockColors, 11: mockColors },
  
  // Categorical schemes
  schemeCategory10: mockColors,
  schemeObservable10: mockColors,
  schemeAccent: mockColors,
  schemeDark2: mockColors,
  schemePaired: mockColors,
  schemePastel1: mockColors,
  schemePastel2: mockColors,
  schemeSet1: mockColors,
  schemeSet2: mockColors,
  schemeSet3: mockColors,
  schemeTableau10: mockColors
};