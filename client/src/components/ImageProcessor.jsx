import React, { useState, useRef, useEffect } from 'react';
import { Undo, Redo, Eraser, Check, X, Loader2 } from 'lucide-react';
import { extractText } from '../services/api';
import '../styles/ImageProcessor.css';

function ImageProcessor({ image, onProcessComplete, onCancel }) {
  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  const containerRef = useRef(null);
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectionRect, setSelectionRect] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [startPoint, setStartPoint] = useState({ x: 0, y: 0 });
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [toolType, setToolType] = useState('select'); // 'select' or 'erase'
  const [imageData, setImageData] = useState({
    displayWidth: 0,
    displayHeight: 0,
    naturalWidth: 0,
    naturalHeight: 0,
    scaleRatio: 1
  });

  // Initialize canvas and load image
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.src = image;
    
    img.onload = () => {
      imageRef.current = img;
      
      // Calculate display size while maintaining aspect ratio
      const container = containerRef.current;
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;
      
      let displayWidth = containerWidth;
      let displayHeight = (img.height * containerWidth) / img.width;
      
      if (displayHeight > containerHeight) {
        displayHeight = containerHeight;
        displayWidth = (img.width * containerHeight) / img.height;
      }
      
      // Set canvas to display size (for UI interaction)
      canvas.width = displayWidth;
      canvas.height = displayHeight;
      
      // Calculate scale ratio (display to original)
      const scaleRatio = displayWidth / img.width;
      
      setImageData({
        displayWidth: displayWidth,
        displayHeight: displayHeight,
        naturalWidth: img.width,
        naturalHeight: img.height,
        scaleRatio: scaleRatio
      });
      
      // Configure canvas for high quality rendering
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      
      // Draw the image on the canvas at display size
      ctx.drawImage(img, 0, 0, displayWidth, displayHeight);
      
      // Clear selection rectangle
      setSelectionRect({ x: 0, y: 0, width: 0, height: 0 });
    };
  }, [image]);

  // Update canvas when selection changes
  useEffect(() => {
    if (!canvasRef.current || !imageRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Configure canvas for high quality rendering
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    // Clear canvas and redraw image
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(imageRef.current, 0, 0, imageData.displayWidth, imageData.displayHeight);
    
    // Draw selection rectangle if it has dimensions
    if (selectionRect.width > 0 && selectionRect.height > 0) {
      ctx.strokeStyle = '#3B82F6';
      ctx.lineWidth = 2;
      ctx.strokeRect(selectionRect.x, selectionRect.y, selectionRect.width, selectionRect.height);
      
      // Add semi-transparent overlay outside the selection
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      
      // Top
      ctx.fillRect(0, 0, canvas.width, selectionRect.y);
      // Right
      ctx.fillRect(selectionRect.x + selectionRect.width, selectionRect.y, 
                   canvas.width - (selectionRect.x + selectionRect.width), selectionRect.height);
      // Bottom
      ctx.fillRect(0, selectionRect.y + selectionRect.height, 
                   canvas.width, canvas.height - (selectionRect.y + selectionRect.height));
      // Left
      ctx.fillRect(0, selectionRect.y, selectionRect.x, selectionRect.height);
    }
  }, [selectionRect, imageData]);

  const handleMouseDown = (e) => {
    if (toolType === 'select' && !isProcessing) {
      setIsDrawing(true);
      
      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      setStartPoint({ x, y });
      setSelectionRect({ x, y, width: 0, height: 0 });
    }
  };

  const handleMouseMove = (e) => {
    if (isDrawing && toolType === 'select' && !isProcessing) {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Calculate the new selection rectangle
      const width = x - startPoint.x;
      const height = y - startPoint.y;
      
      setSelectionRect({
        x: width >= 0 ? startPoint.x : x,
        y: height >= 0 ? startPoint.y : y,
        width: Math.abs(width),
        height: Math.abs(height)
      });
    }
  };

  const handleMouseUp = () => {
    if (isDrawing && toolType === 'select' && !isProcessing) {
      setIsDrawing(false);
      
      // Add current selection to history if it has dimensions
      if (selectionRect.width > 0 && selectionRect.height > 0) {
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push({ ...selectionRect });
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
      }
    }
  };

  const handleUndo = () => {
    if (isProcessing) return;
    
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setSelectionRect(history[historyIndex - 1]);
    } else if (historyIndex === 0) {
      setHistoryIndex(-1);
      setSelectionRect({ x: 0, y: 0, width: 0, height: 0 });
    }
  };

  const handleRedo = () => {
    if (isProcessing) return;
    
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setSelectionRect(history[historyIndex + 1]);
    }
  };

  const handleErase = () => {
    if (isProcessing) return;
    
    setToolType('erase');
    setSelectionRect({ x: 0, y: 0, width: 0, height: 0 });
    
    // Add this "erased" state to history
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ x: 0, y: 0, width: 0, height: 0 });
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const handleToolChange = (tool) => {
    if (isProcessing) return;
    setToolType(tool);
  };

  const handleConfirm = async () => {
    if (selectionRect.width <= 0 || selectionRect.height <= 0) {
      alert('Please select an area of the image first.');
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // Calculate coordinates in original image space
      const originalX = Math.round(selectionRect.x / imageData.scaleRatio);
      const originalY = Math.round(selectionRect.y / imageData.scaleRatio);
      const originalWidth = Math.round(selectionRect.width / imageData.scaleRatio);
      const originalHeight = Math.round(selectionRect.height / imageData.scaleRatio);
      
      // Ensure coordinates are within image bounds
      const clampedX = Math.max(0, Math.min(originalX, imageData.naturalWidth));
      const clampedY = Math.max(0, Math.min(originalY, imageData.naturalHeight));
      const clampedWidth = Math.min(originalWidth, imageData.naturalWidth - clampedX);
      const clampedHeight = Math.min(originalHeight, imageData.naturalHeight - clampedY);
      
      // Create high-quality canvas for cropped image
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Set canvas size to exact crop dimensions (no scaling)
      canvas.width = clampedWidth;
      canvas.height = clampedHeight;
      
      // Configure for maximum quality
      ctx.imageSmoothingEnabled = false; // Disable smoothing for pixel-perfect crop
      
      // Draw the selected portion at original resolution
      ctx.drawImage(
        imageRef.current,
        clampedX, clampedY, clampedWidth, clampedHeight,  // source rectangle
        0, 0, clampedWidth, clampedHeight                 // destination rectangle
      );
      
      // Convert to PNG with maximum quality (no compression)
      const croppedImageUrl = canvas.toDataURL('image/png', 1.0);
      
      // Call API to extract text
      const extractedText = await extractText(croppedImageUrl);
      onProcessComplete(croppedImageUrl, extractedText);
    } catch (error) {
      console.error('Error extracting text:', error);
      alert('Failed to extract text. Please make sure the backend server is running and try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="processor-container">
      <div className="toolbar">
        <button 
          className={`tool-button ${toolType === 'select' ? 'active' : ''}`}
          onClick={() => handleToolChange('select')}
          title="Select Area"
          disabled={isProcessing}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 3h18v18H3z"></path>
          </svg>
        </button>
        <button 
          className="tool-button" 
          onClick={handleUndo}
          disabled={historyIndex < 0 || isProcessing}
          title="Undo"
        >
          <Undo size={20} />
        </button>
        <button 
          className="tool-button" 
          onClick={handleRedo}
          disabled={historyIndex >= history.length - 1 || isProcessing}
          title="Redo"
        >
          <Redo size={20} />
        </button>
        <button 
          className="tool-button" 
          onClick={handleErase}
          title="Erase Selection"
          disabled={isProcessing}
        >
          <Eraser size={20} />
        </button>
      </div>
      
      <div 
        className="canvas-container"
        ref={containerRef}
      >
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{ cursor: isProcessing ? 'wait' : 'crosshair' }}
        />
      </div>
      
      <div className="action-buttons">
        <button 
          className="action-button cancel" 
          onClick={onCancel}
          disabled={isProcessing}
        >
          <X size={16} />
          Cancel
        </button>
        <button 
          className="action-button confirm" 
          onClick={handleConfirm}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Check size={16} />
              Extract Text
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default ImageProcessor;