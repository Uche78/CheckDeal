interface LinkStatusBadgeProps {
  expiresAt: string;
  isUsed: boolean;
  maxUploads: number | null;
  uploadsCount: number;
}

export default function LinkStatusBadge({ 
  expiresAt, 
  isUsed, 
  maxUploads, 
  uploadsCount 
}: LinkStatusBadgeProps) {
  const now = new Date();
  const expirationDate = new Date(expiresAt);
  const isExpired = expirationDate < now;
  const isExhausted = maxUploads !== null && uploadsCount >= maxUploads;

  // Determine status
  let status: 'active' | 'expired' | 'exhausted';
  let bgColor: string;
  let textColor: string;
  let icon: JSX.Element;

  if (isExpired) {
    status = 'expired';
    bgColor = 'bg-gray-100';
    textColor = 'text-gray-700';
    icon = (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
      </svg>
    );
  } else if (isExhausted) {
    status = 'exhausted';
    bgColor = 'bg-orange-100';
    textColor = 'text-orange-700';
    icon = (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
    );
  } else {
    status = 'active';
    bgColor = 'bg-green-100';
    textColor = 'text-green-700';
    icon = (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
    );
  }

  const statusText = {
    active: 'Active',
    expired: 'Expired',
    exhausted: 'Upload Limit Reached'
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${bgColor} ${textColor}`}>
      {icon}
      {statusText[status]}
    </span>
  );
}
