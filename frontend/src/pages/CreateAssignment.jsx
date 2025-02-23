import { useState } from 'react';
import api from '../api';

export default function CreateAssignment() {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        deadline: '',
        classroom: '',
        plagarism_threshold: 30,
      });
     
      const handleSubmit = async (e) => {
        e.preventDefault();
        try {
          await api.post('api/assignment/create/', formData);
          // Handle success (e.g. redirect or show message)
        } catch (error) {
          alert(error);
        }
      };

    return (    
        <div className="max-w-md mx-auto p-6">
     <h2 className="text-2xl font-bold mb-6">Create Assignment</h2>
     
     <form onSubmit={handleSubmit} className="space-y-4">
       <div>
         <label className="block text-sm font-medium text-gray-700">
           Assignment Title
         </label>
         <input
           type="text"
           required
           className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
           value={formData.title}
           onChange={(e) => setFormData({...formData, title: e.target.value})}
         />
       </div>

       <div>
         <label className="block text-sm font-medium text-gray-700">
           Assignment Description
         </label>
         <input
           type="text"
           required
           className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
           value={formData.description}
           onChange={(e) => setFormData({...formData, description: e.target.value})}
         />
       </div>

       <div>
         <label className="block text-sm font-medium text-gray-700">
           Classroom Code 
         </label>
         <input
           type="text"
           required
           className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
           value={formData.classroom}
           onChange={(e) => setFormData({...formData, classroom: e.target.value})}
         />
       </div>

       <div>
            <label className="block text-sm font-medium text-gray-700">
                Submission Date
            </label>
            <input
                type="datetime-local"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
            />
        </div>

        <div>
            <label className="block text-sm font-medium text-gray-700">
                Plagiarism Threshold ({formData.plagarism_threshold}%)
            </label>
            <input
                type="range"
                min="0"
                max="100"
                step="10"
                value={formData.plagarism_threshold}
                onChange={(e) => setFormData({ ...formData, plagarism_threshold: Number(e.target.value) })}
                className="mt-1 block w-full cursor-pointer"
            />
        </div>



       <button
         type="submit"
         className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
       >
         Create Assignment
       </button>
     </form>
   </div>
    )
}