"use client";

import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import 'echarts-gl';

interface LoadingPoint {
  label: string;
  coordinates: number[];
}

interface LoadingPlotData {
  axis_labels: string[];
  points: LoadingPoint[];
}

interface Props {
  data: LoadingPlotData;
}

export default function FactorLoadingChart({ data }: Props) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<echarts.ECharts | null>(null);

  // Determine if 3D or 2D
  const is3D = data.axis_labels.length >= 3;

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Initialize chart
    if (!chartInstanceRef.current) {
      chartInstanceRef.current = echarts.init(chartContainerRef.current);
    }

    const chart = chartInstanceRef.current;

    if (is3D) {
      createOption3D();
    } else {
      createOption2D();
    }

    function createOption3D() {
      // Prepare 3D scatter plot data
      const seriesData = data.points.map(point => [
        point.coordinates[0],
        point.coordinates[1],
        point.coordinates[2],
        point.label
      ]);

      const option: any = {
        title: {
          text: 'Component Plot in Rotated Space',
          left: 'center',
          top: 10,
          textStyle: {
            color: '#333',
            fontSize: 16,
            fontWeight: 'bold',
          },
        },
        tooltip: {
          formatter: (params: any) => {
            if (params.componentSubType === 'scatter3D') {
              const [x, y, z, label] = params.value;
              return `${label}<br/>Component 1: ${x.toFixed(3)}<br/>Component 2: ${y.toFixed(3)}<br/>Component 3: ${z.toFixed(3)}`;
            }
            return '';
          },
        },
        grid3D: {
          axisPointer: {
            show: false,
          },
          viewControl: {
            autoRotate: false,
            rotateSensitivity: 1,
          },
          boxWidth: 120,
          boxDepth: 120,
          boxHeight: 120,
        },
        xAxis3D: {
          name: data.axis_labels[0] || 'Component 1',
          type: 'value',
          min: -1.1,
          max: 1.1,
          splitLine: {
            show: true,
          },
          axisLine: {
            lineStyle: {
              color: '#000',
              width: 2,
            },
          },
          nameTextStyle: {
            fontSize: 12,
            color: '#333',
          },
        },
        yAxis3D: {
          name: data.axis_labels[1] || 'Component 2',
          type: 'value',
          min: -1.1,
          max: 1.1,
          splitLine: {
            show: true,
          },
          axisLine: {
            lineStyle: {
              color: '#000',
              width: 2,
            },
          },
          nameTextStyle: {
            fontSize: 12,
            color: '#333',
          },
        },
        zAxis3D: {
          name: data.axis_labels[2] || 'Component 3',
          type: 'value',
          min: -1.1,
          max: 1.1,
          splitLine: {
            show: true,
          },
          axisLine: {
            lineStyle: {
              color: '#000',
              width: 2,
            },
          },
          nameTextStyle: {
            fontSize: 12,
            color: '#333',
          },
        },
        series: [
          {
            name: 'Loading',
            type: 'scatter3D',
            symbolSize: 8,
            data: seriesData,
            itemStyle: {
              color: '#1f77b4',
              borderColor: '#000',
              borderWidth: 0.5,
            },
            emphasis: {
              itemStyle: {
                color: '#ff7f0e',
              },
              label: {
                show: true,
                formatter: (params: any) => params.value[3] || '',
                fontSize: 10,
              },
            },
            label: {
              show: true,
              formatter: (params: any) => params.value[3] || '',
              fontSize: 10,
              position: 'top',
            },
          },
        ],
      };

      chart.setOption(option);
    }

    function createOption2D() {
      // Prepare 2D scatter plot data
      const seriesData = data.points.map(point => ({
        value: [point.coordinates[0], point.coordinates[1]],
        name: point.label,
      }));

      const option: any = {
        title: {
          text: 'Component Plot in Rotated Space',
          left: 'center',
          top: 10,
          textStyle: {
            color: '#333',
            fontSize: 16,
            fontWeight: 'bold',
          },
        },
        tooltip: {
          formatter: (params: any) => {
            if (Array.isArray(params.value)) {
              const [x, y] = params.value;
              return `${params.name}<br/>Component 1: ${x.toFixed(3)}<br/>Component 2: ${y.toFixed(3)}`;
            }
            return '';
          },
        },
        xAxis: {
          name: data.axis_labels[0] || 'Component 1',
          type: 'value',
          min: -1.1,
          max: 1.1,
          axisLine: {
            lineStyle: {
              color: '#000',
              width: 2,
            },
          },
          splitLine: {
            show: true,
            lineStyle: {
              color: '#e0e0e0',
            },
          },
          nameTextStyle: {
            fontSize: 12,
            color: '#333',
          },
        },
        yAxis: {
          name: data.axis_labels[1] || 'Component 2',
          type: 'value',
          min: -1.1,
          max: 1.1,
          axisLine: {
            lineStyle: {
              color: '#000',
              width: 2,
            },
          },
          splitLine: {
            show: true,
            lineStyle: {
              color: '#e0e0e0',
            },
          },
          nameTextStyle: {
            fontSize: 12,
            color: '#333',
          },
        },
        grid: {
          left: 60,
          right: 40,
          top: 60,
          bottom: 60,
        },
        series: [
          {
            name: 'Loading',
            type: 'scatter',
            symbolSize: 8,
            data: seriesData,
            itemStyle: {
              color: '#1f77b4',
              borderColor: '#000',
              borderWidth: 0.5,
            },
            label: {
              show: true,
              formatter: (params: any) => params.name || '',
              fontSize: 10,
              position: 'top',
              color: '#333',
            },
            emphasis: {
              itemStyle: {
                color: '#ff7f0e',
                borderWidth: 1,
              },
              label: {
                show: true,
              },
            },
          },
        ],
      };

      chart.setOption(option);
    }

    // Handle window resize
    const handleResize = () => {
      chart.resize();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [data, is3D]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.dispose();
        chartInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div className="w-full flex justify-center border rounded-lg p-4 bg-white shadow-sm">
      <div
        ref={chartContainerRef}
        style={{
          width: '100%',
          height: '600px',
          minHeight: '500px',
        }}
      />
    </div>
  );
}
