# AI Background Removal App

## Overview
A React-based web application that uses machine learning to remove backgrounds from images automatically. The app runs entirely in the browser using Transformers.js and WebAssembly, ensuring privacy as no images are uploaded to servers.

## Current State
- Successfully imported from GitHub repository
- Configured for Replit environment with proper host settings
- Running on port 5000 with webview output
- Uses RMBG-1.4 model for cross-browser compatibility
- Optional WebGPU acceleration with MODNet model when available

## Project Architecture
### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite 5.4 with React plugin
- **Styling**: TailwindCSS
- **UI Components**: Custom drag-and-drop interface, image gallery, edit modal

### AI/ML Models
- **Primary Model**: RMBG-1.4 (Cross-browser compatible)
- **Optional Model**: MODNet (WebGPU-accelerated)
- **Runtime**: Transformers.js with ONNX Runtime

### Key Features
- Drag-and-drop image upload
- Background removal using AI models
- Image editing with background customization
- Local processing (no server uploads)
- Export with transparent or custom backgrounds

## Dependencies
- React ecosystem (react, react-dom, react-dropzone)
- AI/ML libraries (@huggingface/transformers, onnxruntime-web)
- File handling (file-saver, jszip)
- Database (dexie for IndexedDB)
- Styling (tailwindcss, autoprefixer)

## Configuration
- Vite configured for Replit environment with 0.0.0.0:5000 binding
- CORS headers for cross-origin isolation
- WebGPU headers for ML model acceleration
- Optimized build settings for large ML models

## Recent Changes
- 2024-09-28: Imported from GitHub and configured for Replit
- Added Replit-specific server configuration
- Set up workflow for development server
- Configured proper host settings for proxy environment