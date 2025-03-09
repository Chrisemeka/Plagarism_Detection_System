import { useState } from 'react';
import api from '../../api';
import { useNavigate } from 'react-router-dom';

export default function JoinClassForm({ onSuccess }) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess('');

    // Validate input
    if (!code.trim()) {
      setError('Please enter a valid class code.');
      setLoading(false);
      return;
    }

    try {
      await api.post('/api/class/join/', { code });
      setSuccess('Successfully joined the class! Redirecting to your classes...');
      
      // Call the onSuccess callback if provided (for modal usage)
      if (onSuccess) {
        onSuccess();
      }
      
      // Redirect after joining (with slight delay for user to see success message)
      setTimeout(() => {
        navigate('/student/classes');
      }, 2000);
      
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to join class. Please check the code and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 text-[#dc3545] p-3 rounded-md text-sm">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 text-green-600 p-3 rounded-md text-sm">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="classCode" className="block text-sm font-medium text-[#0e161b]">
            Class Code
          </label>
          <input
            id="classCode"
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg border border-[#d1dde6] focus:ring-2 focus:ring-[#1d8cd7] focus:border-[#1d8cd7]"
            placeholder="Enter class code (e.g., ABC123)"
            disabled={loading}
            required
          />
          <p className="text-[#507a95] text-xs">
            You can get this code from your instructor.
          </p>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-[#1d8cd7] hover:bg-[#1d8cd7]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1d8cd7] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Joining...
              </>
            ) : 'Join Class'}
          </button>
        </div>
      </form>
    </div>
  );
}