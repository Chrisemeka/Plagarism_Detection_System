import React from 'react';
import JoinClassForm from '../../components/common/JoinClassForm';

const JoinClass = () => {
  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap justify-between gap-3">
        <div className="flex min-w-72 flex-col gap-2">
          <h2 className="text-[#0e161b] tracking-light text-[32px] font-bold leading-tight">
            Join a Class
          </h2>
          <p className="text-[#507a95] text-sm font-normal leading-normal">
            Enter the class code provided by your instructor
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Join Class Form - Now in column layout */}
        <div className="bg-white rounded-lg p-6 border border-[#d1dde6] w-full md:w-2/5">
          <JoinClassForm />
        </div>

        {/* How It Works - Now side by side with form on larger screens */}
        <div className="bg-white rounded-lg p-6 border border-[#d1dde6] w-full md:w-3/5">
          <h3 className="text-[#0e161b] text-lg font-bold mb-4">How It Works</h3>
          
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#e8eef3] flex items-center justify-center text-[#1d8cd7] font-bold">
                1
              </div>
              <div>
                <h4 className="text-[#0e161b] font-medium">Get the class code</h4>
                <p className="text-[#507a95] text-sm">Ask your instructor for the class code.</p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#e8eef3] flex items-center justify-center text-[#1d8cd7] font-bold">
                2
              </div>
              <div>
                <h4 className="text-[#0e161b] font-medium">Enter the code above</h4>
                <p className="text-[#507a95] text-sm">Type the code exactly as provided, including any letters, numbers, or symbols.</p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#e8eef3] flex items-center justify-center text-[#1d8cd7] font-bold">
                3
              </div>
              <div>
                <h4 className="text-[#0e161b] font-medium">Access your new class</h4>
                <p className="text-[#507a95] text-sm">Once joined, you'll have immediate access to class materials and assignments.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JoinClass;