import React from 'react';
import { useEffect } from 'react';
import Plotly from 'plotly.js-dist';

const SimilarityHeatMap = ({ matrix, submissions, onCellClick }) => {
  // Custom blue to red color scale
  const blueToRedScale = [
    [0, 'rgb(0, 0, 255)'],      // Blue for 0% (cold/no plagiarism)
    [0.25, 'rgb(30, 144, 255)'], // DodgerBlue
    [0.5, 'rgb(220, 220, 220)'], // Light gray for midpoint
    [0.75, 'rgb(255, 99, 71)'],  // Tomato
    [1, 'rgb(255, 0, 0)']        // Red for 100% (hot/complete plagiarism)
  ];

  const data = [
    {
      z: matrix,
      x: submissions.map(s => s.student_name),
      y: submissions.map(s => s.student_name),
      type: 'heatmap',
      colorscale: blueToRedScale,
      zmin: 0,  // Set minimum value to 0
      zmax: 100, // Set maximum value to 100
      colorbar: {
        title: 'Similarity %',
        titleside: 'right'
      },
      hovertemplate: '<b>%{x}</b> vs <b>%{y}</b><br>Similarity: %{z}%<extra></extra>'
    },
  ];

  const layout = {
    title: 'Submission Similarity Matrix',
    xaxis: { 
      title: 'Student',
      tickangle: -45 // Angle labels for better readability
    },
    yaxis: { title: 'Student' },
    margin: { l: 80, r: 80, b: 80, t: 80 }
  };

  useEffect(() => {
    const plot = document.getElementById('heatmap');
    Plotly.newPlot(plot, data, layout, {responsive: true});

    // Add click event listener
    plot.on('plotly_click', (data) => {
      const point = data.points[0];
      if (point) {
        const xIndex = submissions.findIndex(s => s.student_name === point.x);
        const yIndex = submissions.findIndex(s => s.student_name === point.y);
        if (xIndex !== -1 && yIndex !== -1) {
          onCellClick(xIndex, yIndex);
        }
      }
    });

    return () => Plotly.purge(plot);
  }, [matrix, submissions, onCellClick]);

  return (
    <div>
      <div id="heatmap" style={{ width: '100%', height: '500px' }} />
      <div className="mt-3 p-3 bg-gray-50 rounded text-sm">
        <p className="mb-2 font-medium">Color Scale Legend:</p>
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-blue-600 mr-2"></div>
            <span>0% (No similarity)</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-gray-300 mr-2"></div>
            <span>50% (Partial similarity)</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-red-600 mr-2"></div>
            <span>100% (Identical content)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimilarityHeatMap;