"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

interface ScreePlotProps {
  data: {
    component_numbers: number[];
    eigenvalues: number[];
  };
}

export function ScreePlot({ data }: ScreePlotProps) {
  if (
    !data ||
    !Array.isArray(data.component_numbers) ||
    !Array.isArray(data.eigenvalues)
  ) {
    console.error("Invalid ScreePlot data:", data);
    return <p>Invalid scree plot data</p>;
  }

  const chartData = data.component_numbers.map((c, i) => ({
    component: c,
    eigenvalue: data.eigenvalues[i] ?? 0,
  }));

  return (
    <LineChart width={600} height={400} data={chartData}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis
        dataKey="component"
        label={{ value: "Component", position: "insideBottom" }}
      />
      <YAxis
        label={{ value: "Eigenvalue", angle: -90, position: "insideLeft" }}
      />
      <Tooltip />
      <Line
        type="monotone"
        dataKey="eigenvalue"
        strokeWidth={2}
        dot
      />
    </LineChart>
  );
}

