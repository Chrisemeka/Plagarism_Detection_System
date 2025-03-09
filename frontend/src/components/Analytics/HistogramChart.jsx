import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts';

export function HistogramChart({ submissions, threshold = 30 }) {
  // Create buckets for the histogram (0-10%, 11-20%, etc.)
  const createHistogramData = () => {
    // Initialize buckets
    const buckets = Array(10).fill().map((_, i) => ({
      range: `${i*10}-${(i+1)*10}%`,
      count: 0,
      // Color based on severity
      color: i < 3 ? '#4ade80' : i < 6 ? '#facc15' : '#ef4444'
    }));
    
    // Extract similarity scores from all comparisons
    const scores = submissions.map(submission => submission.similarity_score);
    
    // Count submissions in each bucket
    scores.forEach(score => {
      const bucketIndex = Math.min(Math.floor(score / 10), 9); // Ensure it fits in our buckets
      buckets[bucketIndex].count += 1;
    });
    
    return buckets;
  };
  
  const histogramData = createHistogramData();
  
  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={histogramData}
          margin={{ top: 20, right: 30, left: 20, bottom: 30 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis 
            dataKey="range" 
            label={{ value: 'Similarity Score Range', position: 'bottom', offset: 0 }} 
          />
          <YAxis 
            label={{ value: 'Number of Submissions', angle: -90, position: 'left' }} 
          />
          <Tooltip 
            formatter={(value) => [`${value} submissions`, 'Count']}
            labelFormatter={(label) => `Similarity range: ${label}`}
          />
          <ReferenceLine 
            x={`${Math.floor(threshold / 10) * 10}-${Math.floor(threshold / 10) * 10 + 10}%`}
            stroke="#1d8cd7"
            strokeDasharray="5 5"
            label={{ value: 'Threshold', position: 'top', fill: '#1d8cd7' }}
          />
          <Bar 
            dataKey="count" 
            fill={(data) => data.color}
            radius={[4, 4, 0, 0]} // Slightly rounded top corners
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}