export interface MarginConfig {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export interface MarginPercentageConfig {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export interface ResponsiveMarginOptions {
  width: number;
  height: number;
  hasTitle?: boolean;
  hasAxisLabels?: {
    x?: boolean;
    y?: boolean;
  };
  useAxis?: boolean;
  categories?: string[];
  titleOptions?: {
    title: string;
    subtitle?: string;
  };
  axisLabels?: {
    x?: string;
    y?: string;
  };
  maxLabelWidth?: number;
  isHorizontalChart?: boolean;
  hasLegend?: boolean;
  legendPosition?: "bottom" | "right" | "top" | "left";
  hasErrorBars?: boolean;
  maxTickWidth?: number;
  itemCount?: number; // Number of legend items for multi-column calculation
}

/**
 * Calculate optimal rotation angle for X-axis labels based on text length
 * (Duplicate from chartUtils for use in margin calculations)
 */
const calculateXAxisRotationForMargin = (
  categories: string[],
  chartWidth: number,
  marginLeft: number,
  marginRight: number
): { rotation: number; needsRotation: boolean; maxLabelWidth: number } => {
  const availableWidth = chartWidth - marginLeft - marginRight;
  const avgLabelWidth = Math.max(...categories.map((cat) => cat.length)) * 8; // approximate 8px per character
  const categoryWidth = availableWidth / categories.length;

  if (avgLabelWidth <= categoryWidth) {
    return { rotation: 0, needsRotation: false, maxLabelWidth: avgLabelWidth };
  }

  // Try 45 degrees first
  const diagonal45 = avgLabelWidth * Math.cos(Math.PI / 4);
  if (diagonal45 <= categoryWidth) {
    return { rotation: -45, needsRotation: true, maxLabelWidth: avgLabelWidth };
  }

  // Use 90 degrees for very long labels
  return { rotation: -90, needsRotation: true, maxLabelWidth: avgLabelWidth };
};

/**
 * Calculate responsive margins for charts based on chart size and content
 */
export const calculateResponsiveMargin = (
  options: ResponsiveMarginOptions & {
    categories?: string[]; // Add categories for rotation calculation
  }
): MarginConfig => {
  const {
    width,
    height,
    useAxis,
    titleOptions,
    axisLabels,
    maxLabelWidth = 0,
    isHorizontalChart = false,
    hasLegend = false,
    legendPosition = "bottom",
    hasErrorBars = false,
    maxTickWidth = 0,
    categories = [],
  } = options;

  // Base margin percentages (responsive)
  const baseMarginPercent: MarginPercentageConfig = {
    top: titleOptions ? 0.15 : isHorizontalChart && useAxis ? 0.2 : 0.02,
    bottom: useAxis ? 0.1 : 0.02,
    left: useAxis ? 0.1 : 0.02,
    right: useAxis ? 0.1 : 0.02,
  };

  // Check if X-axis labels need rotation and adjust bottom margin accordingly
  let additionalBottomMargin = 0;
  if (useAxis && !isHorizontalChart && categories.length > 0) {
    // Calculate initial margins to get basic left/right margins
    const initialMarginLeft = Math.max(width * baseMarginPercent.left, 25);
    const initialMarginRight = Math.max(width * baseMarginPercent.right, 20);

    const rotationInfo = calculateXAxisRotationForMargin(
      categories,
      width,
      initialMarginLeft,
      initialMarginRight
    );

    if (rotationInfo.needsRotation) {
      if (rotationInfo.rotation === -90) {
        // Vertical labels need space equal to max label width
        additionalBottomMargin = rotationInfo.maxLabelWidth;
      } else {
        // 45-degree labels need diagonal space
        additionalBottomMargin =
          rotationInfo.maxLabelWidth *
          Math.sin((Math.abs(rotationInfo.rotation) * Math.PI) / 180);
      }
      // Cap the additional margin
      additionalBottomMargin = Math.min(additionalBottomMargin, height * 0.3);
    }
  }

  // Adjust for legend
  if (hasLegend) {
    switch (legendPosition) {
      case "bottom":
        baseMarginPercent.bottom += 0.15;
        break;
      case "right":
        // Calculate space needed for multi-column legend
        const maxHeight = 300;
        const itemHeightWithSpacing = 27; // itemHeight (19) + spacing (8)
        const maxItemsPerColumn = Math.floor(maxHeight / itemHeightWithSpacing);
        const numColumns = Math.ceil(
          (options.itemCount || 10) / maxItemsPerColumn
        );
        const columnWidth = 150; // Increased width per column for better text display
        const totalLegendWidth = numColumns * columnWidth;

        // Adjust right margin based on legend width
        const legendMarginPercent = Math.max(
          0.1,
          totalLegendWidth / width + 0.05
        );
        baseMarginPercent.right += legendMarginPercent;
        break;
    }
  }

  // Minimum margins to ensure readability
  const minMargins: MarginConfig = {
    top: titleOptions ? 80 : isHorizontalChart && useAxis ? 60 : 5,
    bottom: useAxis
      ? hasLegend && legendPosition === "bottom"
        ? 150 + additionalBottomMargin
        : 60 + additionalBottomMargin
      : 5,
    left: useAxis ? 40 : 5,
    right: useAxis
      ? hasLegend && legendPosition === "right"
        ? Math.max(150, width * 0.15)
        : 10
      : 5,
  };

  // Maximum margins to prevent too much spacing on large charts
  const maxMargins: MarginConfig = {
    top: titleOptions ? 150 : isHorizontalChart && useAxis ? 70 : 40,
    bottom: useAxis
      ? hasLegend && legendPosition === "bottom"
        ? 150 + additionalBottomMargin
        : 50 + additionalBottomMargin
      : 10,
    left: useAxis ? 150 : 10,
    right: useAxis
      ? hasLegend && legendPosition === "right"
        ? Math.max(200, width * 0.2)
        : 40
      : 10,
  };

  // Calculate responsive margins
  let marginTop = Math.min(
    Math.max(height * baseMarginPercent.top, minMargins.top),
    maxMargins.top
  );

  const marginBottom = Math.min(
    Math.max(height * baseMarginPercent.bottom, minMargins.bottom),
    maxMargins.bottom
  );

  let marginLeft = Math.min(
    Math.max(width * baseMarginPercent.left, minMargins.left),
    maxMargins.left
  );

  let marginRight = Math.min(
    Math.max(width * baseMarginPercent.right, minMargins.right),
    maxMargins.right
  );

  // Adjust left margin based on Y label width and axis labels for vertical charts
  if (useAxis && !isHorizontalChart) {
    const yLabelLength = axisLabels?.y ? axisLabels.y.length : 0;
    const labelBasedMargin = Math.max(
      maxLabelWidth + (axisLabels?.y ? Math.min(60, width * 0.1) : 20),
      yLabelLength * Math.min(7, width * 0.01)
    );
    marginLeft = Math.max(
      marginLeft,
      Math.min(labelBasedMargin, maxMargins.left)
    );
  }

  // Adjust margins for horizontal charts
  if (isHorizontalChart && useAxis) {
    // For horizontal charts, calculate actual category label width
    const labelPadding = axisLabels?.y ? Math.min(60, width * 0.1) : 25;
    const maxCategoryWidth =
      maxLabelWidth ||
      (categories.length > 0
        ? Math.max(...categories.map((cat) => cat.toString().length * 7)) // Approximate character width
        : 50); // Default if no categories

    // Calculate left margin based on actual label width plus padding
    const categoryBasedMargin = maxCategoryWidth + labelPadding;
    marginLeft = Math.min(
      Math.max(marginLeft, categoryBasedMargin),
      width * 0.25 // Cap at 25% of chart width
    );

    // Additional adjustment for tick width on right side for horizontal charts
    if (maxTickWidth > 0) {
      const tickBasedMargin = maxTickWidth + Math.min(20, width * 0.03);
      marginRight = Math.max(
        marginRight,
        Math.min(tickBasedMargin, width * 0.1)
      );
    }

    // Additional space for X axis label on horizontal charts (axis is on top)
    if (axisLabels?.x) {
      const additionalTopSpace = Math.min(40, height * 0.06);
      marginTop = Math.max(marginTop, marginTop + additionalTopSpace);
    }
  }

  // Adjust for error bars (need extra space at the top)
  if (hasErrorBars) {
    marginTop += Math.min(20, height * 0.05);
  }

  return {
    top: marginTop,
    bottom: marginBottom,
    left: marginLeft,
    right: marginRight,
  };
};

/**
 * Convenience exports for backward compatibility and simpler usage
 */
export const calculateStackedResponsiveMargin = (
  width: number,
  height: number,
  useAxis: boolean,
  titleOptions?: any,
  hasLegend: boolean = true
): MarginConfig => {
  return calculateResponsiveMargin({
    width,
    height,
    useAxis,
    titleOptions,
    hasLegend,
    legendPosition: "bottom",
  });
};

export const calculateHorizontalResponsiveMargin = (
  width: number,
  height: number,
  useAxis: boolean,
  titleOptions?: any,
  axisLabels?: { x?: string; y?: string },
  maxCategoryWidth: number = 0,
  maxTickWidth: number = 0
): MarginConfig => {
  return calculateResponsiveMargin({
    width,
    height,
    useAxis,
    titleOptions,
    axisLabels,
    maxLabelWidth: maxCategoryWidth,
    maxTickWidth,
    isHorizontalChart: true,
  });
};

export const calculateErrorBarResponsiveMargin = (
  width: number,
  height: number,
  useAxis: boolean,
  titleOptions?: any,
  axisLabels?: { x?: string; y?: string }
): MarginConfig => {
  return calculateResponsiveMargin({
    width,
    height,
    useAxis,
    titleOptions,
    axisLabels,
    hasErrorBars: true,
  });
};

/**
 * Utility function to create margin-aware title options
 * This helps apply responsive positioning to existing chart functions
 */
export const createMarginAwareTitleOptions = (
  titleOptions: any,
  marginTop: number
) => {
  if (!titleOptions) return undefined;

  return {
    ...titleOptions,
    marginTop,
    useResponsivePositioning: true,
  };
};
