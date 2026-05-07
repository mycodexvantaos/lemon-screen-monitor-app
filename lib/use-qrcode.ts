import { useState, useCallback, useEffect } from 'react';

export function useQRCode(data: string) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);

  const generateQRCode = useCallback(async (text: string) => {
    if (!text) return;

    setIsGenerating(true);
    try {
      // Use a QR code generation API (e.g., qr-server.com)
      // This is a simple approach that works without additional dependencies
      const encodedText = encodeURIComponent(text);
      const url = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodedText}`;
      setQrCodeUrl(url);
    } catch (error) {
      console.error('Failed to generate QR code:', error);
    } finally {
      setIsGenerating(false);
    }
  }, []);

  useEffect(() => {
    if (data) {
      generateQRCode(data);
    }
  }, [data, generateQRCode]);

  return {
    qrCodeUrl,
    isGenerating,
    regenerate: () => generateQRCode(data),
  };
}
