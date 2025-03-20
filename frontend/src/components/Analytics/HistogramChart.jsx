import React from 'react';
import { useEffect } from 'react';
import { Chart } from 'chart.js/auto';


const HistogramChart = ({ submissions }) => {
  const chartRef = React.useRef(null);

  useEffect(() => {
    const ctx = chartRef.current.getContext('2d');
    const chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: submissions.map(s => s.student_name),
        datasets: [
          {
            label: 'Average Similarity Score (%)',
            data: submissions.map(s => s.similarity_score),
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1,
          },
        ],
      },
      options: {
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
          },
        },
      },
    });

    return () => chart.destroy();
  }, [submissions]);

  return <canvas ref={chartRef} />;
};

export default HistogramChart;