import { useState } from 'react';
import GenerateUploadToken from './GenerateUploadToken';
import UploadTokenDisplay from './UploadTokenDisplay';

interface UploadLinkManagerProps {
  applicationId: string;
}

export default function UploadLinkManager({ applicationId }: UploadLinkManagerProps) {
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [generatedTokenId, setGeneratedTokenId] = useState<string | null>(null);
  const [tokenData, setTokenData] = useState<any>(null);
  const [showDisplay, setShowDisplay] = useState<boolean>(false);

  const handleTokenGenerated = (token: string, tokenId: string, data?: any) => {
    setGeneratedToken(token);
    setGeneratedTokenId(tokenId);
    setTokenData(data);
    setShowDisplay(true);
  };

  const handleClose = () => {
    // Navigate back to application page
    window.location.href = `/applications/${applicationId}`;
  };

  if (showDisplay && generatedToken) {
    return (
      <UploadTokenDisplay 
        token={generatedToken}
        tokenData={tokenData}
        onClose={handleClose} 
      />
    );
  }

  return (
    <GenerateUploadToken 
      applicationId={applicationId}
      onTokenGenerated={handleTokenGenerated}
    />
  );
}
