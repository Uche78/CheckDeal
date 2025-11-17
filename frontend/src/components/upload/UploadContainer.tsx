import React, { useState } from 'react';
import UploadZone from './UploadZone';
import FileList from './FileList';
import SuccessMessage from './SuccessMessage';

interface UploadContainerProps {
  applicationId: string;
  token: string;
  borrowerName?: string;
}

export default function UploadContainer({ applicationId, token, borrowerName }: UploadContainerProps) {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [uploadedCount, setUploadedCount] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleUploadComplete = () => {
    // Increment trigger to refresh FileList
    setRefreshTrigger(prev => prev + 1);
    setUploadedCount(prev => prev + 1);
    
    // Show success message after a brief delay
    setTimeout(() => {
      setShowSuccess(true);
    }, 500);
  };

  const handleNotifyBroker = async () => {
    try {
      const response = await fetch('/api/notifications/send-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          application_id: applicationId,
          documents_count: uploadedCount
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send notification');
      }
    } catch (error) {
      console.error('Notification error:', error);
      alert('Failed to notify broker. They will still see your uploaded documents.');
    }
  };

  const handleDone = () => {
    setShowSuccess(false);
    setUploadedCount(0);
  };

  if (showSuccess && uploadedCount > 0) {
    return (
      <SuccessMessage
        documentsCount={uploadedCount}
        borrowerName={borrowerName}
        onNotifyBroker={handleNotifyBroker}
        onDone={handleDone}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Upload Zone */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <UploadZone
          applicationId={applicationId}
          token={token}
          onUploadComplete={handleUploadComplete}
        />
      </div>

      {/* Previously Uploaded Files */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <FileList
          applicationId={applicationId}
          showDelete={true}
          refreshTrigger={refreshTrigger}
        />
      </div>
    </div>
  );
}
