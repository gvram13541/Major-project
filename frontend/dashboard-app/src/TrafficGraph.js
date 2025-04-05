import React, { useEffect, useRef } from 'react';
import { getStyle } from '@coreui/utils';
import { CChart } from '@coreui/react-chartjs';

const TrafficGraph = () => {
  const chartRef = useRef(null);

  useEffect(() => {
    const handleColorSchemeChange = () => {
      const chartInstance = chartRef.current;
      if (chartInstance) {
        const { options } = chartInstance;

        if (options.plugins?.legend?.labels) {
          options.plugins.legend.labels.color = getStyle('--cui-body-color');
        }

        if (options.scales?.x) {
          if (options.scales.x.grid) {
            options.scales.x.grid.color = getStyle('--cui-border-color-translucent');
          }
          if (options.scales.x.ticks) {
            options.scales.x.ticks.color = getStyle('--cui-body-color');
          }
        }

        if (options.scales?.y) {
          if (options.scales.y.grid) {
            options.scales.y.grid.color = getStyle('--cui-border-color-translucent');
          }
          if (options.scales.y.ticks) {
            options.scales.y.ticks.color = getStyle('--cui-body-color');
          }
        }

        chartInstance.update();
      }
    };

    document.documentElement.addEventListener('ColorSchemeChange', handleColorSchemeChange);

    return () => {
      document.documentElement.removeEventListener('ColorSchemeChange', handleColorSchemeChange);
    };
  }, []);

  const data = {
    labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September'],
    datasets: [
      {
        label: 'HTTP Requests',
        data: [1200, 1100, 1300, 1250, 1400, 1350, 1500, 1450, 1600],
        backgroundColor: 'rgba(0, 123, 255, 0.2)',
        borderColor: 'rgba(0, 123, 255, 1)',
        pointBackgroundColor: 'rgba(0, 123, 255, 1)',
        pointBorderColor: '#fff',
        fill: false,
      },
      {
        label: 'Bandwidth Usage (GB)',
        data: [60, 62, 58, 65, 70, 68, 75, 72, 80],
        backgroundColor: 'rgba(255, 193, 7, 0.2)',
        borderColor: 'rgba(255, 193, 7, 1)',
        pointBackgroundColor: 'rgba(255, 193, 7, 1)',
        pointBorderColor: '#fff',
        fill: false,
      },
      {
        label: 'Active Connections',
        data: [45, 50, 48, 55, 60, 58, 65, 62, 70],
        backgroundColor: 'rgba(23, 162, 184, 0.2)',
        borderColor: 'rgba(23, 162, 184, 1)',
        pointBackgroundColor: 'rgba(23, 162, 184, 1)',
        pointBorderColor: '#fff',
        fill: false,
      },
      {
        label: 'Errors',
        data: [5, 6, 4, 7, 8, 6, 9, 7, 10],
        backgroundColor: 'rgba(220, 53, 69, 0.2)',
        borderColor: 'rgba(220, 53, 69, 1)',
        pointBackgroundColor: 'rgba(220, 53, 69, 1)',
        pointBorderColor: '#fff',
        fill: false,
      },
      {
        label: 'Average Response Time (ms)',
        data: [200, 210, 190, 220, 230, 215, 240, 225, 250],
        backgroundColor: 'rgba(40, 167, 69, 0.2)',
        borderColor: 'rgba(40, 167, 69, 1)',
        pointBackgroundColor: 'rgba(40, 167, 69, 1)',
        pointBorderColor: '#fff',
        fill: false,
      },
    ],
  };

  const options = {
    plugins: {
      legend: {
        labels: {
          color: getStyle('--cui-body-color'),
        },
      },
    },
    scales: {
      x: {
        grid: {
          color: getStyle('--cui-border-color-translucent'),
        },
        ticks: {
          color: getStyle('--cui-body-color'),
        },
        type: 'category',
      },
      y: {
        grid: {
          color: getStyle('--cui-border-color-translucent'),
        },
        ticks: {
          color: getStyle('--cui-body-color'),
        },
        beginAtZero: true,
      },
    },
  };

  return <CChart type="line" data={data} options={options} ref={chartRef} />;
};

export default TrafficGraph;