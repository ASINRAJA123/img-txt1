import React, { useState } from 'react';
import Header from './components/Header';
import ImageUploader from './components/ImageUploader';
import ImageProcessor from './components/ImageProcessor';
import ResultsView from './components/ResultsView';
import './styles/App.css';

function App() {
  const [uploadedImage, setUploadedImage] = useState(null);
  const [croppedImage, setCroppedImage] = useState(null);
  const [extractedText, setExtractedText] = useState('');
  const [currentView, setCurrentView] = useState('upload'); // 'upload', 'process', 'results'

  const handleImageUpload = (image) => {
    setUploadedImage(image);
    setCurrentView('process');
  };

  const handleProcessComplete = (croppedImg, text) => {
    setCroppedImage(croppedImg);
    setExtractedText(text);
    setCurrentView('results');
  };

  const handleReset = () => {
    setUploadedImage(null);
    setCroppedImage(null);
    setExtractedText('');
    setCurrentView('upload');
  };

  return (
    <div className="app-container">
      <Header />
      <main className="main-content">
        {currentView === 'upload' && (
          <ImageUploader onImageUpload={handleImageUpload} />
        )}
        
        {currentView === 'process' && uploadedImage && (
          <ImageProcessor 
            image={uploadedImage} 
            onProcessComplete={handleProcessComplete}
            onCancel={handleReset}
          />
        )}
        
        {currentView === 'results' && croppedImage && (
          <ResultsView 
            croppedImage={croppedImage} 
            extractedText={extractedText} 
            onReset={handleReset}
          />
        )}
      </main>
    </div>
  );
}

export default App;