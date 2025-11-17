import React from 'react';

interface ProgressBarProps {
  progress: number; // 0-100
  status?: 'uploading' | 'success' | 'error';
}

export default function ProgressBar({ progress, status = 'uploading' }: ProgressBarProps) {
  const getColor = () => {
    if (status === 'success') return 'bg-green-500';
    if (status === 'error') return 'bg-red-500';
    return 'bg-blue-500';
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-gray-600">
          {status === 'uploading' && `Uploading... ${progress}%`}
          {status === 'success' && 'Upload complete'}
          {status === 'error' && 'Upload failed'}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full ${getColor()} transition-all duration-300 ease-out`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
