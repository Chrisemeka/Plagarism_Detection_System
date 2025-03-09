import { useState } from 'react';
import { FileText, Plus } from 'lucide-react';
import api from '../../api';
import { useNavigate } from 'react-router-dom';

export default function CreateAssignment() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    deadline: '',
    classroom: '',
    plagarism_threshold: 30,
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await api.post('api/assignment/create/', formData);
      // Navigate back after successful creation
      navigate('/lecturer/dashboard');
    } catch (error) {
      console.error('Error creating assignment:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h2 className="text-[#0e161b] tracking-light text-[32px] font-bold leading-tight">
          Create New Assignment
        </h2>
        <p className="text-[#507a95] text-sm font-normal leading-normal">
          Create an assignment for your students to complete
        </p>
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-lg shadow-sm p-8 border border-[#d1dde6]">
        <div className="flex items-center space-x-4 mb-6">
          <div className="p-3 bg-[#e8eef3] rounded-full">
            <FileText className="h-6 w-6 text-[#1d8cd7]" />
          </div>
          <h3 className="text-lg font-semibold text-[#0e161b]">Assignment Details</h3>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#0e161b] mb-1">
                Assignment Title
              </label>
              <input
                type="text"
                required
                className="w-full px-4 py-2.5 rounded-lg border border-[#d1dde6] focus:ring-2 focus:ring-[#1d8cd7] focus:border-[#1d8cd7]"
                placeholder="Enter assignment title"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[#0e161b] mb-1">
                Assignment Description
              </label>
              <textarea
                rows="4"
                required
                className="w-full px-4 py-2.5 rounded-lg border border-[#d1dde6] focus:ring-2 focus:ring-[#1d8cd7] focus:border-[#1d8cd7]"
                placeholder="Provide detailed instructions for the assignment"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[#0e161b] mb-1">
                Classroom Code
              </label>
              <input
                type="text"
                required
                className="w-full px-4 py-2.5 rounded-lg border border-[#d1dde6] focus:ring-2 focus:ring-[#1d8cd7] focus:border-[#1d8cd7]"
                placeholder="Enter the classroom code"
                value={formData.classroom}
                onChange={(e) => setFormData({...formData, classroom: e.target.value})}
              />
              <p className="text-[#507a95] text-xs mt-1">
                Enter the code of the class this assignment belongs to
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[#0e161b] mb-1">
                Submission Deadline
              </label>
              <input
                type="datetime-local"
                required
                className="w-full px-4 py-2.5 rounded-lg border border-[#d1dde6] focus:ring-2 focus:ring-[#1d8cd7] focus:border-[#1d8cd7]"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[#0e161b] mb-1">
                Plagiarism Threshold ({formData.plagarism_threshold}%)
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="10"
                value={formData.plagarism_threshold}
                onChange={(e) => setFormData({ ...formData, plagarism_threshold: Number(e.target.value) })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#1d8cd7]"
              />
              <div className="flex justify-between text-xs text-[#507a95] mt-1">
                <span>0% (Strict)</span>
                <span>50%</span>
                <span>100% (Lenient)</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center pt-4">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-6 py-3 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-[#1d8cd7] hover:bg-[#1d8cd7]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1d8cd7] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Assignment
                </>
              )}
            </button>
            
            <button
              type="button"
              onClick={() => navigate('/lecturer/dashboard')}
              className="ml-4 inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-[#507a95] bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1d8cd7] transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
      
      {/* Tips Card */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-[#d1dde6]">
        <h3 className="text-[#0e161b] text-lg font-semibold mb-4">Tips for Creating Effective Assignments</h3>
        
        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#e8eef3] flex items-center justify-center text-[#1d8cd7] font-bold">
              1
            </div>
            <div>
              <h4 className="text-[#0e161b] font-medium">Be clear and specific</h4>
              <p className="text-[#507a95] text-sm">Provide detailed instructions and expectations for the assignment.</p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#e8eef3] flex items-center justify-center text-[#1d8cd7] font-bold">
              2
            </div>
            <div>
              <h4 className="text-[#0e161b] font-medium">Set a reasonable deadline</h4>
              <p className="text-[#507a95] text-sm">Give students enough time to complete the assignment thoroughly.</p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#e8eef3] flex items-center justify-center text-[#1d8cd7] font-bold">
              3
            </div>
            <div>
              <h4 className="text-[#0e161b] font-medium">Adjust plagiarism threshold appropriately</h4>
              <p className="text-[#507a95] text-sm">Consider the nature of the assignment when setting the plagiarism threshold.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}