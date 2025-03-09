import { useState } from 'react';

export function SimilarityHeatMap({ matrix, submissions, onCellClick }) {
  const [hoveredCell, setHoveredCell] = useState(null);
  
  if (!matrix || matrix.length === 0 || !submissions || submissions.length === 0) {
    return <div className="text-[#507a95]">No data available for heat map.</div>;
  }
  
  // Color scale function
  const getColorForValue = (value) => {
    // Create a blue gradient where darker = higher similarity
    const intensity = Math.round(value * 2.55); // Scale 0-100 to 0-255
    return `rgb(${255 - intensity}, ${255 - intensity}, 255)`;
  };
  
  // Handle cell hover
  const handleCellHover = (rowIndex, colIndex) => {
    setHoveredCell({ rowIndex, colIndex });
  };
  
  // Handle cell leave
  const handleCellLeave = () => {
    setHoveredCell(null);
  };
  
  // Handle cell click
  const handleCellClick = (rowIndex, colIndex) => {
    if (rowIndex === colIndex) return; // Skip comparison with self
    onCellClick(rowIndex, colIndex);
  };
  
  // Get truncated student name
  const getShortName = (student) => {
    if (!student || !student.student_name) return '?';
    const parts = student.student_name.split(' ');
    return parts.length > 1 
      ? `${parts[0][0]}. ${parts[parts.length - 1]}`
      : student.student_name;
  };
  
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse">
        <thead>
          <tr>
            <th className="p-2 border border-[#d1dde6] bg-gray-50"></th>
            {submissions.map((submission, index) => (
              <th key={index} className="p-2 border border-[#d1dde6] bg-gray-50 text-xs">
                {getShortName(submission)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {matrix.map((row, rowIndex) => (
            <tr key={rowIndex}>
              <th className="p-2 border border-[#d1dde6] bg-gray-50 text-xs">
                {getShortName(submissions[rowIndex])}
              </th>
              {row.map((cell, colIndex) => (
                <td 
                  key={colIndex}
                  style={{ 
                    backgroundColor: rowIndex === colIndex 
                      ? '#f9fafb' // Diagonal cells (self comparison)
                      : getColorForValue(cell)
                  }}
                  className={`
                    w-12 h-12 text-center border border-[#d1dde6] relative
                    ${rowIndex !== colIndex ? 'cursor-pointer hover:opacity-80' : ''}
                    ${hoveredCell && hoveredCell.rowIndex === rowIndex && hoveredCell.colIndex === colIndex 
                      ? 'ring-2 ring-[#1d8cd7]' : ''}
                  `}
                  onMouseEnter={() => handleCellHover(rowIndex, colIndex)}
                  onMouseLeave={handleCellLeave}
                  onClick={() => rowIndex !== colIndex && handleCellClick(rowIndex, colIndex)}
                >
                  {rowIndex !== colIndex && (
                    <span className={`text-xs font-medium ${cell > 50 ? 'text-white' : 'text-gray-800'}`}>
                      {Math.round(cell)}%
                    </span>
                  )}
                  
                  {/* Tooltip on hover */}
                  {hoveredCell && hoveredCell.rowIndex === rowIndex && hoveredCell.colIndex === colIndex && rowIndex !== colIndex && (
                    <div className="absolute z-10 bg-white p-2 rounded shadow-md text-xs w-48 left-1/2 transform -translate-x-1/2 -translate-y-full -top-2">
                      <p className="font-bold">{Math.round(cell)}% Similarity</p>
                      <p>Between:</p>
                      <p>{submissions[rowIndex].student_name}</p>
                      <p>{submissions[colIndex].student_name}</p>
                      <p className="text-[#1d8cd7] mt-1">Click to compare</p>
                    </div>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      
      {/* Legend */}
      <div className="flex items-center justify-center mt-6">
        <div className="flex items-center space-x-1">
          <div className="w-4 h-4" style={{ backgroundColor: getColorForValue(0) }}></div>
          <span className="text-xs">0%</span>
        </div>
        <div className="w-32 h-4 mx-2 bg-gradient-to-r from-[#e6e6ff] to-[#0000ff]"></div>
        <div className="flex items-center space-x-1">
          <div className="w-4 h-4" style={{ backgroundColor: getColorForValue(100) }}></div>
          <span className="text-xs">100%</span>
        </div>
      </div>
    </div>
  );
}