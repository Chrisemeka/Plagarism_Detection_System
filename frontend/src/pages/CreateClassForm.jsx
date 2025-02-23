import { useState } from 'react';
import api from '../api';

export default function CreateClassForm() {
 const [formData, setFormData] = useState({
   title: '',
 });

 const handleSubmit = async (e) => {
   e.preventDefault();
   try {
     await api.post('/api/class/create/', formData);
     // Handle success (e.g. redirect or show message)
   } catch (error) {
     alert(error);
   }
 };

 return (
   <div className="max-w-md mx-auto p-6">
     <h2 className="text-2xl font-bold mb-6">Create New Class</h2>
     
     <form onSubmit={handleSubmit} className="space-y-4">
       <div>
         <label className="block text-sm font-medium text-gray-700">
           Class Title
         </label>
         <input
           type="text"
           required
           className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
           value={formData.title}
           onChange={(e) => setFormData({...formData, title: e.target.value})}
         />
       </div>

       <button
         type="submit"
         className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
       >
         Create Class
       </button>
     </form>
   </div>
 );
}