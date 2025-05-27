import React, { useState, useRef } from 'react';
import { Upload, Image as ImageIcon } from 'lucide-react';
import '../styles/ImageUploader.css';

function ImageUploader({ onImageUpload }) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    processFile(files[0]);
  };

  const handleFileChange = (e) => {
    const files = e.target.files;
    processFile(files[0]);
  };

  const handleButtonClick = () => {
    fileInputRef.current.click();
  };

  const processFile = (file) => {
    if (file && file.type.match('image.*')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        onImageUpload(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="upload-container">
      <div 
        className={`upload-area ${isDragging ? 'dragging' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <ImageIcon size={48} />
        <h2>Upload an Image</h2>
        <p>Drag & drop your image here or click to browse</p>
        <button 
          className="upload-button"
          onClick={handleButtonClick}
        >
          <Upload size={16} />
          Choose File
        </button>
        <input 
          type="file" 
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          style={{ display: 'none' }}
        />
      </div>
    </div>
  );
}

export default ImageUploader;