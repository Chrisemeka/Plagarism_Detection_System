import { useState, useEffect } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceArea, ResponsiveContainer } from 'recharts';

export function SimilarityBoxPlot({ submissions }) {
  const [boxPlotData, setBoxPlotData] = useState({
    min: 0,
    q1: 0,
    median: 0,
    q3: 0,
    max: 0,
    outliers: [],
  });
  
  useEffect(() => {
    if (!submissions || submissions.length === 0) return;
    
    // Sort scores for calculations
    const scores = submissions.map(s => s.similarity_score).sort((a, b) => a - b);
    const n = scores.length;
    
    // Calculate quartiles
    const min = scores[0];
    const max = scores[n - 1];
    const q1Index = Math.floor(n * 0.25);
    const medianIndex = Math.floor(n * 0.5);
    const q3Index = Math.floor(n * 0.75);
    
    const q1 = scores[q1Index];
    const median = scores[medianIndex];
    const q3 = scores[q3Index];
    
    // Calculate IQR and identify outliers
    const iqr = q3 - q1;
    const lowerBound = Math.max(0, q1 - 1.5 * iqr); // Ensure non-negative
    const upperBound = Math.min(100, q3 + 1.5 * iqr); // Cap at 100%
    
    const outliers = submissions.filter(s => 
      s.similarity_score < lowerBound || s.similarity_score > upperBound
    ).map(s => ({
      x: 1, // We use a single x value for the box plot
      y: s.similarity_score,
      name: s.student_name,
      id: s.id
    }));
    
    setBoxPlotData({
      min: Math.max(min, lowerBound),
      q1,
      median,
      q3,
      max: Math.min(max, upperBound),
      outliers
    });
  }, [submissions]);
  
  // Custom tooltip for outliers
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-2 border border-gray-200 shadow-md rounded text-xs">
          <p className="font-bold">{data.name}</p>
          <p>Similarity: {data.y.toFixed(1)}%</p>
          <p className="text-red-500">Outlier</p>
        </div>
      );
    }
    return null;
  };
  
  // Custom shape for outliers
  const OutlierShape = (props) => {
    const { cx, cy } = props;
    return (
      <circle 
        cx={cx} 
        cy={cy} 
        r={4} 
        fill="#ef4444" 
        stroke="#fff"
        strokeWidth={1}
      />
    );
  };
  
  // Generate labels for important statistics
  const boxPlotLabels = () => {
    const { min, q1, median, q3, max } = boxPlotData;
    
    return [
      <ReferenceArea key="min" x1={0.8} y1={min-2} x2={1.2} y2={min+2} fill="transparent" label={{ position: 'left', value: `Min: ${min.toFixed(1)}%`, fill: '#6b7280', fontSize: 12 }} />,
      <ReferenceArea key="q1" x1={0.8} y1={q1-2} x2={1.2} y2={q1+2} fill="transparent" label={{ position: 'left', value: `Q1: ${q1.toFixed(1)}%`, fill: '#6b7280', fontSize: 12 }} />,
      <ReferenceArea key="median" x1={0.8} y1={median-2} x2={1.2} y2={median+2} fill="transparent" label={{ position: 'left', value: `Median: ${median.toFixed(1)}%`, fill: '#6b7280', fontSize: 12 }} />,
      <ReferenceArea key="q3" x1={0.8} y1={q3-2} x2={1.2} y2={q3+2} fill="transparent" label={{ position: 'left', value: `Q3: ${q3.toFixed(1)}%`, fill: '#6b7280', fontSize: 12 }} />,
      <ReferenceArea key="max" x1={0.8} y1={max-2} x2={1.2} y2={max+2} fill="transparent" label={{ position: 'left', value: `Max: ${max.toFixed(1)}%`, fill: '#6b7280', fontSize: 12 }} />
    ];
  };
  
  // Create SVG elements for the box and whiskers
  const BoxPlotElements = () => {
    const { min, q1, median, q3, max } = boxPlotData;
    
    return (
      <g>
        {/* Whisker lines */}
        <line x1={1} y1={min} x2={1} y2={q1} stroke="#1d8cd7" strokeWidth={2} />
        <line x1={1} y1={q3} x2={1} y2={max} stroke="#1d8cd7" strokeWidth={2} />
        
        {/* Box */}
        <rect x={0.75} y={q1} width={0.5} height={q3-q1} fill="#e8eef3" stroke="#1d8cd7" strokeWidth={2} />
        
        {/* Median line */}
        <line x1={0.75} y1={median} x2={1.25} y2={median} stroke="#1d8cd7" strokeWidth={2} />
        
        {/* Whisker caps */}
        <line x1={0.85} y1={min} x2={1.15} y2={min} stroke="#1d8cd7" strokeWidth={2} />
        <line x1={0.85} y1={max} x2={1.15} y2={max} stroke="#1d8cd7" strokeWidth={2} />
      </g>
    );
  };
  
  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart
          margin={{ top: 20, right: 30, left: 60, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" dataKey="x" domain={[0, 2]} hide />
          <YAxis 
            type="number" 
            dataKey="y" 
            name="Similarity Score" 
            domain={[0, 100]} 
            label={{ value: 'Similarity Score (%)', angle: -90, position: 'insideLeft' }} 
            tickCount={11}
          />
          <Tooltip content={<CustomTooltip />} />
          
          {/* Box Plot Elements */}
          <BoxPlotElements />
          
          {/* Statistical Labels */}
          {boxPlotLabels()}
          
          {/* Outliers as scatter points */}
          <Scatter 
            name="Outliers" 
            data={boxPlotData.outliers} 
            shape={<OutlierShape />}
          />
        </ScatterChart>
      </ResponsiveContainer>
      
      <div className="text-center text-sm text-[#507a95] mt-4">
        <p>Box plot showing distribution of similarity scores. Red dots represent statistical outliers.</p>
      </div>
    </div>
  );
}