import React, { useState } from 'react';
import { Copy, Check, RotateCcw, Table } from 'lucide-react';
import '../styles/ResultsView.css';

function ResultsView({ croppedImage, extractedText, onReset }) {
  const [copied, setCopied] = useState(false);
  const [formattedTable, setFormattedTable] = useState([]);
  const [loadingTable, setLoadingTable] = useState(false);

  const handleCopyText = () => {
    navigator.clipboard.writeText(extractedText)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(err => {
        console.error('Failed to copy text: ', err);
      });
  };

  const handleFormatText = () => {
    setLoadingTable(true);
    fetch('http://localhost:5000/api/format-text', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text: extractedText })
    })
      .then(response => response.json())
      .then(data => {
        if (data.success && Array.isArray(data.table)) {
          setFormattedTable(data.table);
        }
      })
      .catch(error => {
        console.error('Error formatting text:', error);
      })
      .finally(() => {
        setLoadingTable(false);
      });
  };

  const renderTable = () => {
    if (formattedTable.length === 0) return null;

    const hasHeader = formattedTable.length > 1;
    const headerRow = hasHeader ? formattedTable[0] : null;
    const dataRows = hasHeader ? formattedTable.slice(1) : formattedTable;

    return (
      <div className="formatted-table">
        <h3>Formatted Table</h3>
        <table>
          {headerRow && (
            <thead>
              <tr>
                {headerRow.map((cell, idx) => (
                  <th key={idx}>{cell}</th>
                ))}
              </tr>
            </thead>
          )}
          <tbody>
            {dataRows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, colIndex) => (
                  <td key={colIndex}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="results-container">
      <div className="results-header">
        <h2>Extracted Text Results</h2>
        <button className="reset-button" onClick={onReset}>
          <RotateCcw size={16} />
          Start Over
        </button>
      </div>
      
      <div className="results-content">
        <div className="image-section">
          <h3>Selected Image Area</h3>
          <div className="image-preview">
            <img src={croppedImage} alt="Selected area" />
          </div>
        </div>
        
        <div className="text-section">
          <div className="text-header">
            <h3>Extracted Text</h3>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                className={`copy-button ${copied ? 'copied' : ''}`}
                onClick={handleCopyText}
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? 'Copied!' : 'Copy Text'}
              </button>
              {extractedText && (
                <button 
                  className="format-button"
                  onClick={handleFormatText}
                  disabled={loadingTable}
                >
                  <Table size={16} />
                  {loadingTable ? 'Formatting...' : 'Format as Table'}
                </button>
              )}
            </div>
          </div>
          
          <div className="extracted-text">
            {extractedText ? 
              <p>{extractedText}</p> : 
              <p className="no-text">No text was extracted from the selected area.</p>
            }
          </div>
        </div>
      </div>

      {renderTable()}
    </div>
  );
}

export default ResultsView;
