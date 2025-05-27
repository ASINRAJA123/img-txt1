// services/api.js

const API_BASE_URL = 'http://localhost:5000/api';

export const extractText = async (imageDataUrl) => {
  try {
    const response = await fetch(`${API_BASE_URL}/extract-text`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: imageDataUrl
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to extract text');
    }

    return data.text;
  } catch (error) {
    console.error('Error extracting text:', error);
    throw error;
  }
};

// Keep the mock function for development/testing
export const extractTextMock = async (imageDataUrl) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Return mock text
  return "This is mock extracted text for testing purposes. The actual OCR will be performed by the backend service.";
};