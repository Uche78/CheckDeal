import { useState, useEffect } from 'react';

interface AnalysisStatusProps {
  type: 'success' | 'error' | null;
  message: string;
  onDismiss?: () => void;
}

export default function AnalysisStatus({ type, message, onDismiss }: AnalysisStatusProps) {
  const [isVisible, setIsVisible] = useState(true);

  // Auto-dismiss success messages after 5 seconds
  useEffect(() => {
    if (type === 'success') {
      const timer = setTimeout(() => {
        setIsVisible(false);
        if (onDismiss) {
          onDismiss();
        }
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [type, onDismiss]);

  if (!isVisible || !type) return null;

  return (
    <div
      className={`
        rounded-lg p-4 mb-4 flex items-start justify-between
        animate-in fade-in slide-in-from-top-2 duration-300
        ${
          type === 'success'
            ? 'bg-green-50 border border-green-200'
            : 'bg-red-50 border border-red-200'
        }
      `}
    >
      <div className="flex items-start">
        {/* Icon */}
        <div className="flex-shrink-0">
          {type === 'success' ? (
            <svg
              className="w-5 h-5 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          ) : (
            <svg
              className="w-5 h-5 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          )}
        </div>

        {/* Message */}
        <div className="ml-3">
          <h3
            className={`text-sm font-medium ${
              type === 'success' ? 'text-green-800' : 'text-red-800'
            }`}
          >
            {type === 'success' ? 'Analysis Complete' : 'Analysis Failed'}
          </h3>
          <p
            className={`mt-1 text-sm ${
              type === 'success' ? 'text-green-700' : 'text-red-700'
            }`}
          >
            {message}
          </p>
        </div>
      </div>

      {/* Dismiss Button */}
      <button
        onClick={() => {
          setIsVisible(false);
          if (onDismiss) {
            onDismiss();
          }
        }}
        className={`
          flex-shrink-0 ml-4 inline-flex rounded-md p-1.5
          focus:outline-none focus:ring-2 focus:ring-offset-2
          ${
            type === 'success'
              ? 'text-green-500 hover:bg-green-100 focus:ring-green-600'
              : 'text-red-500 hover:bg-red-100 focus:ring-red-600'
          }
        `}
      >
        <span className="sr-only">Dismiss</span>
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  );
}
