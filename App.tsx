import React, { useState, useEffect } from 'react';
import { Tab, ThemeMode } from './types';
import Navigation from './components/Navigation';
import HomeDashboard from './components/HomeDashboard';
import BibleReader from './components/BibleReader';
import ConfessionsReader from './components/ConfessionsReader';
import StudyDashboard from './components/StudyDashboard';
import Library from './components/Library';
import { Moon, Sun } from 'lucide-react';
import { LOGO_SVG } from './constants';

const App: React.FC = () => {
  console.log("App component rendering (simplified)...");
  return (
    <div className="h-screen flex items-center justify-center bg-paper-50 dark:bg-navy-900">
      <div className="text-center">
        <h1 className="text-4xl font-serif font-bold text-petrol-700">Sola Scriptura</h1>
        <p className="mt-4 text-gray-600">O aplicativo está carregando (Teste)...</p>
      </div>
    </div>
  );
};

export default App;
