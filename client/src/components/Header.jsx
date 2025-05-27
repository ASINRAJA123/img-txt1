import React from 'react';
import { FileText } from 'lucide-react';
import '../styles/Header.css';

function Header() {
  return (
    <header className="header">
      <div className="logo">
        <FileText size={24} />
        <h1>TextExtract</h1>
      </div>
      <p className="tagline">Extract text from images with precision</p>
    </header>
  );
}

export default Header;