import React from 'react';
import { createRoot } from 'react-dom/client';
import { MainLayout } from './components/layout/MainLayout';
import './index.css';

const root = createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <MainLayout />
  </React.StrictMode>
);