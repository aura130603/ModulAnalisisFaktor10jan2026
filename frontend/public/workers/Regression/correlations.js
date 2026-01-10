self.onmessage = function(e) {
  const { dependent, independent, dependentVariableInfo, independentVariableInfos } = e.data;

  if (!dependent || !independent || !dependentVariableInfo || !independentVariableInfos) {
    self.postMessage({ error: "Data dependent, independent, dan info variabel harus disediakan." });
    return;
  }
  if (!Array.isArray(dependent) || !Array.isArray(independent)) {
    self.postMessage({ error: "Data dependent dan independent harus berupa array." });
    return;
  }

  const numIndependentVars = independent.length;
  const n = dependent.length;

  // Create a unified list of all variable details (name, label, displayName)
  const allVariableDetails = [
    {
      name: dependentVariableInfo.name,
      label: dependentVariableInfo.label,
      displayName: (dependentVariableInfo.label && dependentVariableInfo.label.trim() !== '') 
        ? dependentVariableInfo.label 
        : dependentVariableInfo.name
    },
    ...independentVariableInfos.map(info => ({
      name: info.name,
      label: info.label,
      displayName: (info.label && info.label.trim() !== '') 
        ? info.label 
        : info.name
    }))
  ];

  const allDataArrays = [dependent, ...independent]; // Keep this for accessing data by index
  const numTotalVars = allVariableDetails.length;

  function mean(arr) {
    return arr.reduce((sum, val) => sum + val, 0) / arr.length;
  }

  function correlation(x, y) {
    const n = x.length;
    const meanX = mean(x);
    const meanY = mean(y);
    let num = 0, denX = 0, denY = 0;
    for (let i = 0; i < n; i++) {
      const dx = x[i] - meanX;
      const dy = y[i] - meanY;
      num += dx * dy;
      denX += dx * dx;
      denY += dy * dy;
    }
    return num / Math.sqrt(denX * denY);
  }

  function gammln(xx) {
    const cof = [
      76.18009172947146, -86.50532032941677,
      24.01409824083091, -1.231739572450155,
      0.1208650973866179e-2, -0.5395239384953e-5
    ];
    let x = xx - 1.0;
    let tmp = x + 5.5;
    tmp -= (x + 0.5) * Math.log(tmp);
    let ser = 1.000000000190015;
    for (let j = 0; j < cof.length; j++) {
      x += 1;
      ser += cof[j] / x;
    }
    return -tmp + Math.log(2.5066282746310005 * ser);
  }

  function betacf(a, b, x) {
    const MAXIT = 100;
    const EPS = 3e-7;
    const FPMIN = 1e-30;
    const qab = a + b;
    const qap = a + 1;
    const qam = a - 1;
    let c = 1;
    let d = 1 - qab * x / qap;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    d = 1 / d;
    let h = d;
    for (let m = 1; m <= MAXIT; m++) {
      const m2 = 2 * m;
      let aa = m * (b - m) * x / ((qam + m2) * (a + m2));
      d = 1 + aa * d;
      if (Math.abs(d) < FPMIN) d = FPMIN;
      c = 1 + aa / c;
      if (Math.abs(c) < FPMIN) c = FPMIN;
      d = 1 / d;
      h *= d * c;
      aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2));
      d = 1 + aa * d;
      if (Math.abs(d) < FPMIN) d = FPMIN;
      c = 1 + aa / c;
      if (Math.abs(c) < FPMIN) c = FPMIN;
      d = 1 / d;
      const del = d * c;
      h *= del;
      if (Math.abs(del - 1) < EPS) break;
    }
    return h;
  }

  function betai(a, b, x) {
    if (x < 0 || x > 1) return NaN;
    const bt = (x === 0 || x === 1)
        ? 0
        : Math.exp(gammln(a + b) - gammln(a) - gammln(b) + a * Math.log(x) + b * Math.log(1 - x));
    if (x < (a + 1) / (a + b + 2)) {
      return bt * betacf(a, b, x) / a;
    } else {
      return 1 - bt * betacf(b, a, 1 - x) / b;
    }
  }

  function calculatePValue(r, n) {
    if (Math.abs(r) === 1.0) return 0.000; // Perfect correlation
    const df = n - 2;
    if (df <= 0) return 1.000; // Not enough data
    const tAbs = Math.abs(r * Math.sqrt(df / (1 - r * r)));
    // For t-distribution, P(T > t) for one tail
    // SPSS Sig. (1-tailed) for correlations is often just p/2 from a two-tailed test.
    // A direct t-test p-value (two-tailed) is 2 * (1 - tCDF(tAbs, df)) or betai for (t^2 / (df + t^2))
    // For 1-tailed, it depends on the hypothesis. SPSS usually shows significance levels.
    // Using 0.5 * betai(df / 2, 0.5, df / (tAbs * tAbs + df)) for one tail probability, assuming t is positive.
    // Or simply 1 - TDist.cdf(t, df) if t is positive from a library.
    // Let's use a common approach based on Pearson's r for p-value (two-tailed) then halve it.
    const pTwoTailed = betai(df / 2, 0.5, df / (tAbs * tAbs + df));
    return pTwoTailed < 0 ? 0 : pTwoTailed / 2; // SPSS shows 1-tailed, so divide by 2
  }

  function round(num) {
    if (typeof num === 'string') return num; // if it's already a string like "."
    return Math.round(num * 1000) / 1000;
  }

  const columnHeaders = [
    { header: "" }, // For the main row headers like "Pearson Correlation"
    { header: "" }  // For the variable name/label row sub-headers
  ];

  allVariableDetails.forEach(varDetail => {
    columnHeaders.push({ header: varDetail.displayName, key: varDetail.name });
  });

  const correlationRows = [];
  const sigRows = [];
  const nRows = [];

  for (let i = 0; i < numTotalVars; i++) {
    const currentRowVarDetail = allVariableDetails[i];
    const correlationChildren = {
      rowHeader: [null, currentRowVarDetail.displayName]
    };

    const sigChildren = {
      rowHeader: [null, currentRowVarDetail.displayName]
    };

    const nChildren = {
      rowHeader: [null, currentRowVarDetail.displayName]
    };

    for (let j = 0; j < numTotalVars; j++) {
      const currentColVarDetail = allVariableDetails[j];
      if (i === j) {
        correlationChildren[currentColVarDetail.name] = 1.000;
        sigChildren[currentColVarDetail.name] = "."; // SPSS shows blank or dot for diagonal
        nChildren[currentColVarDetail.name] = n;
      } else {
        const r = correlation(allDataArrays[i], allDataArrays[j]);
        const pValue = calculatePValue(r, n);

        correlationChildren[currentColVarDetail.name] = round(r);
        sigChildren[currentColVarDetail.name] = round(pValue);
        nChildren[currentColVarDetail.name] = n;
      }
    }

    correlationRows.push(correlationChildren);
    sigRows.push(sigChildren);
    nRows.push(nChildren);
  }

  const result = {
    tables: [
      {
        title: "Correlations",
        columnHeaders: columnHeaders,
        rows: [
          {
            rowHeader: ["Pearson Correlation"],
            children: correlationRows
          },
          {
            rowHeader: ["Sig. (1-tailed)"],
            children: sigRows
          },
          {
            rowHeader: ["N"],
            children: nRows
          }
        ]
      }
    ]
  };

  self.postMessage(result);
};