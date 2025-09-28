import React, { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { processImages, initializeModel } from "../lib/process";
import "./styles.css";

interface AppError {
  message: string;
}

export interface ImageFile {
  id: number;
  file: File;
  processedFile?: File;
}

// Sample images from the HTML design
const sampleImages = [
  "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=200&h=200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?q=80&w=200&h=200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&h=200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1574144611937-0df059b5ef3e?q=80&w=200&h=200&auto=format&fit=crop"
];

const backgroundOptions = [
  { id: 'transparent', label: 'Transparent' },
  { id: 'color', label: 'Solid Color' },
  { id: 'image', label: 'Image' }
];

const effectOptions = [
  { id: 'none', label: 'None' },
  { id: 'blur', label: 'Blur' },
  { id: 'brightness', label: 'Bright' },
  { id: 'contrast', label: 'Contrast' }
];

const predefinedColors = [
  '#ffffff', '#000000', '#ff0000', '#00ff00', '#0000ff',
  '#ffff00', '#00ffff', '#ff00ff', '#808080', '#c0c0c0'
];

export default function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<AppError | null>(null);
  const [currentState, setCurrentState] = useState<'upload' | 'loading' | 'result'>('upload');
  const [originalImageUrl, setOriginalImageUrl] = useState<string>('');
  const [processedImageUrl, setProcessedImageUrl] = useState<string>('');
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [editedImageUrl, setEditedImageUrl] = useState<string>('');
  const [bgType, setBgType] = useState('transparent');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [customBgImage, setCustomBgImage] = useState<File | null>(null);
  const [selectedEffect, setSelectedEffect] = useState('none');
  const [blurValue, setBlurValue] = useState(50);
  const [brightnessValue, setBrightnessValue] = useState(50);
  const [contrastValue, setContrastValue] = useState(50);
  const [showCustomColorPicker, setShowCustomColorPicker] = useState(false);

  useEffect(() => {
    // Initialize Lucide icons
    if ((window as any).lucide) {
      (window as any).lucide.createIcons();
    }
  }, []);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    
    const file = acceptedFiles[0];
    setCurrentFile(file);
    setOriginalImageUrl(URL.createObjectURL(file));
    setCurrentState('loading');
    setError(null);
    
    try {
      // Initialize model if needed
      await initializeModel();
      
      // Process the image
      const result = await processImages([file]);
      if (result && result.length > 0) {
        const processedUrl = URL.createObjectURL(result[0]);
        setProcessedImageUrl(processedUrl);
        setEditedImageUrl(processedUrl); // Initialize edited version
        setCurrentState('result');
      } else {
        throw new Error("Failed to process image");
      }
    } catch (err) {
      setError({
        message: err instanceof Error ? err.message : "Failed to process image"
      });
      setCurrentState('upload');
    }
  }, []);

  const handleSampleImageClick = async (url: string) => {
    setCurrentState('loading');
    setError(null);
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const file = new File([blob], 'sample-image.jpg', { type: 'image/jpeg' });
      onDrop([file]);
    } catch (error) {
      setError({ message: "Failed to load sample image" });
      setCurrentState('upload');
    }
  };

  const handleUploadNew = () => {
    if (originalImageUrl) URL.revokeObjectURL(originalImageUrl);
    if (processedImageUrl) URL.revokeObjectURL(processedImageUrl);
    if (editedImageUrl && editedImageUrl !== processedImageUrl) URL.revokeObjectURL(editedImageUrl);
    setCurrentState('upload');
    setOriginalImageUrl('');
    setProcessedImageUrl('');
    setEditedImageUrl('');
    setCurrentFile(null);
    setError(null);
    // Reset editing state
    setBgType('transparent');
    setBgColor('#ffffff');
    setCustomBgImage(null);
    setSelectedEffect('none');
    setBlurValue(50);
    setBrightnessValue(50);
    setContrastValue(50);
    setShowCustomColorPicker(false);
  };

  const handleDownload = () => {
    const downloadUrl = editedImageUrl || processedImageUrl;
    if (downloadUrl) {
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = 'cutoutify-result.png';
      link.click();
    }
  };

  const getCurrentEffectValue = () => {
    switch (selectedEffect) {
      case 'blur':
        return blurValue;
      case 'brightness':
        return brightnessValue;
      case 'contrast':
        return contrastValue;
      default:
        return 50;
    }
  };

  const handleEffectValueChange = (value: number) => {
    switch (selectedEffect) {
      case 'blur':
        setBlurValue(value);
        break;
      case 'brightness':
        setBrightnessValue(value);
        break;
      case 'contrast':
        setContrastValue(value);
        break;
    }
  };

  const applyChanges = async () => {
    if (!processedImageUrl) return;
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = processedImageUrl;
    await new Promise(resolve => img.onload = resolve);
    
    canvas.width = img.width;
    canvas.height = img.height;
    
    // Apply background (only if not transparent)
    if (bgType === 'color') {
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else if (bgType === 'image' && customBgImage) {
      const bgImg = new Image();
      bgImg.crossOrigin = 'anonymous';
      const bgUrl = URL.createObjectURL(customBgImage);
      bgImg.src = bgUrl;
      await new Promise(resolve => bgImg.onload = resolve);
      ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(bgUrl); // Clean up
    }
    
    // Draw the processed image
    ctx.drawImage(img, 0, 0);
    
    // Apply effects
    if (selectedEffect !== 'none') {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      switch (selectedEffect) {
        case 'blur':
          // Create a temporary canvas for blur effect
          const tempCanvas = document.createElement('canvas');
          const tempCtx = tempCanvas.getContext('2d');
          if (!tempCtx) break;
          
          tempCanvas.width = canvas.width;
          tempCanvas.height = canvas.height;
          
          // Draw current state to temp canvas
          tempCtx.drawImage(canvas, 0, 0);
          
          // Clear main canvas
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          
          // Apply blur using CSS filter
          ctx.filter = `blur(${blurValue / 10}px)`;
          ctx.drawImage(tempCanvas, 0, 0);
          ctx.filter = 'none';
          break;
          
        case 'brightness':
          for (let i = 0; i < data.length; i += 4) {
            data[i] = Math.min(255, data[i] * (brightnessValue / 50));
            data[i + 1] = Math.min(255, data[i + 1] * (brightnessValue / 50));
            data[i + 2] = Math.min(255, data[i + 2] * (brightnessValue / 50));
          }
          ctx.putImageData(imageData, 0, 0);
          break;
          
        case 'contrast':
          // Map 0-100 to -100 to +100 with 50 as neutral (0)
          const contrastAmount = (contrastValue - 50) * 2;
          const factor = (259 * (contrastAmount + 255)) / (255 * (259 - contrastAmount));
          for (let i = 0; i < data.length; i += 4) {
            data[i] = Math.max(0, Math.min(255, factor * (data[i] - 128) + 128));
            data[i + 1] = Math.max(0, Math.min(255, factor * (data[i + 1] - 128) + 128));
            data[i + 2] = Math.max(0, Math.min(255, factor * (data[i + 2] - 128) + 128));
          }
          ctx.putImageData(imageData, 0, 0);
          break;
      }
    }
    
    // Only create edited version if we're not using transparent background
    if (bgType !== 'transparent' || selectedEffect !== 'none') {
      const dataUrl = canvas.toDataURL('image/png');
      
      // Clean up old edited URL if it's different
      if (editedImageUrl && editedImageUrl !== processedImageUrl) {
        URL.revokeObjectURL(editedImageUrl);
      }
      
      setEditedImageUrl(dataUrl);
    } else {
      // Use original processed image for transparent background with no effects
      if (editedImageUrl && editedImageUrl !== processedImageUrl) {
        URL.revokeObjectURL(editedImageUrl);
      }
      setEditedImageUrl(processedImageUrl);
    }
  };

  // Apply changes when editing options change
  useEffect(() => {
    if (processedImageUrl && currentState === 'result') {
      applyChanges();
    }
  }, [bgType, bgColor, customBgImage, selectedEffect, blurValue, brightnessValue, contrastValue, processedImageUrl, currentState]);

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    open
  } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".webp"],
    },
    multiple: false,
    noClick: true
  });

  return (
    <div className="bg-slate-50 text-gray-800">
      {/* Header */}
      <header className="bg-slate-50/80 backdrop-blur-lg fixed top-0 left-0 right-0 z-20 border-b border-slate-200">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <a href="#" className="flex items-center space-x-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <circle cx="8.5" cy="8.5" r="1.5"></circle>
              <polyline points="21 15 16 10 5 21"></polyline>
            </svg>
            <h1 className="text-xl font-bold text-gray-900">Cutoutify</h1>
          </a>
          <nav className="hidden md:flex space-x-8">
            <a href="#features" className="text-gray-600 hover:text-blue-600 transition-colors">Features</a>
            <a href="#how-it-works" className="text-gray-600 hover:text-blue-600 transition-colors">How it Works</a>
            <a href="#testimonials" className="text-gray-600 hover:text-blue-600 transition-colors">Testimonials</a>
            <a href="#faq" className="text-gray-600 hover:text-blue-600 transition-colors">FAQ</a>
          </nav>
          <div className="flex items-center gap-4">
            <a href="https://paypal.me/yourusername" target="_blank" className="bg-yellow-400 text-yellow-900 px-4 py-2 rounded-lg font-semibold hover:bg-yellow-500 transition-colors flex items-center gap-2">
              <i data-lucide="coffee" className="w-5 h-5"></i>
              Buy me a coffee
            </a>
            <a href="#app-container" className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
              Get Started
            </a>
          </div>
        </div>
      </header>

      <main className="pt-24">
        <div className="container mx-auto px-6 text-center">
          {/* Hero Section */}
          <section className="py-12">
            <div className="max-w-3xl mx-auto">
              <span className="bg-blue-100 text-blue-700 text-sm font-semibold px-3 py-1 rounded-full">✨ Powered by AI</span>
              <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mt-4 leading-tight">Remove Image Backgrounds</h2>
              <p className="text-lg text-gray-600 mt-4 max-w-2xl mx-auto">100% automatically and free. Just upload an image to get a transparent background in seconds. No sign-up required.</p>
            </div>
          </section>

          {/* Uploader & Result Viewer */}
          <section id="app-container" className="mt-2 mb-16 max-w-4xl mx-auto bg-white p-6 md:p-8 rounded-2xl shadow-lg border border-slate-200">
            
            {/* Upload State */}
            {currentState === 'upload' && (
              <div id="upload-state">
                <div 
                  {...getRootProps()} 
                  className={`border-2 border-dashed border-gray-300 rounded-xl p-8 md:p-12 text-center cursor-pointer hover:bg-gray-50 transition-colors ${
                    isDragActive ? 'dropzone-active' : ''
                  }`}
                >
                  <input {...getInputProps()} />
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <div className="bg-blue-100 p-4 rounded-full">
                      <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                      </svg>
                    </div>
                    <p className="text-lg font-semibold text-gray-700">
                      {isDragActive ? "Drop the image here..." : "Drag & drop an image here"}
                    </p>
                    <p className="text-gray-500">or</p>
                    <button 
                      type="button" 
                      onClick={open}
                      className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors z-10"
                    >
                      Select File
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-lg">
                    {error.message}
                  </div>
                )}

                {/* Sample Images */}
                <div className="mt-8">
                  <p className="text-gray-500">No image? Try one of these:</p>
                  <div className="mt-4 flex justify-center items-center gap-4 flex-wrap">
                    {sampleImages.map((url, index) => (
                      <img 
                        key={index}
                        src={url} 
                        className="h-20 w-20 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity" 
                        alt={`Sample ${index + 1}`}
                        onClick={() => handleSampleImageClick(url)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Loading State */}
            {currentState === 'loading' && (
              <div id="loading-state">
                <div className="flex flex-col items-center justify-center p-12 space-y-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  <p className="text-lg text-gray-600">Removing background...</p>
                </div>
              </div>
            )}

            {/* Result State */}
            {currentState === 'result' && (
              <div id="result-state">
                <div className="grid md:grid-cols-2 gap-6 items-start">
                  <div>
                    <p className="font-semibold text-gray-700 text-left mb-2">Original</p>
                    <img 
                      src={originalImageUrl} 
                      alt="Original" 
                      className="w-full h-auto object-contain rounded-lg border border-slate-200" 
                      style={{maxHeight: '300px'}} 
                    />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-700 text-left mb-2">Edited Result</p>
                    <div className="checkerboard rounded-lg border border-slate-200">
                      <img 
                        src={editedImageUrl || processedImageUrl} 
                        alt="Result" 
                        className="w-full h-auto object-contain" 
                        style={{maxHeight: '300px'}} 
                      />
                    </div>
                  </div>
                </div>

                {/* Editing Controls */}
                <div className="mt-8 bg-gray-50 rounded-lg p-6">
                  <h3 className="font-semibold text-lg text-gray-800 mb-4">Customize Background</h3>
                  
                  {/* Background Type Selection */}
                  <div className="mb-6">
                    <div className="flex gap-2 mb-4">
                      {backgroundOptions.map(option => (
                        <button
                          key={option.id}
                          onClick={() => setBgType(option.id)}
                          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                            bgType === option.id
                              ? 'bg-blue-600 text-white'
                              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>

                    {bgType === 'color' && (
                      <div>
                        <div className="flex gap-2 mb-3 flex-wrap">
                          {predefinedColors.map(color => (
                            <button
                              key={color}
                              onClick={() => setBgColor(color)}
                              className={`w-10 h-10 rounded-full border-2 transition-all ${
                                bgColor === color ? 'border-blue-600 scale-110' : 'border-gray-300 hover:border-gray-400'
                              }`}
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setShowCustomColorPicker(!showCustomColorPicker)}
                            className="px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
                          >
                            Custom Color
                          </button>
                          {showCustomColorPicker && (
                            <input
                              type="color"
                              value={bgColor}
                              onChange={(e) => setBgColor(e.target.value)}
                              className="w-10 h-10 border border-gray-300 rounded-lg cursor-pointer"
                            />
                          )}
                        </div>
                      </div>
                    )}

                    {bgType === 'image' && (
                      <div className="space-y-4">
                        {/* Upload Your Own */}
                        <div className="bg-white p-4 rounded-lg border border-gray-200">
                          <h5 className="font-medium text-gray-800 mb-2">Upload Your Own</h5>
                          <p className="text-sm text-gray-600 mb-3">Use your own background image (free)</p>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setCustomBgImage(e.target.files?.[0] || null)}
                            className="w-full p-2 border border-gray-300 rounded-lg bg-white text-sm"
                          />
                        </div>

                        {/* Find a Pro Background */}
                        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 rounded-lg border border-gray-200 relative overflow-hidden">
                          <div className="relative z-10 text-center">
                            <div className="flex items-center justify-center mb-3">
                              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </div>
                            </div>
                            <h5 className="font-semibold text-white mb-1">Find a Pro Background</h5>
                            <p className="text-blue-100 text-sm mb-3">Access millions of professional stock images</p>
                            <div className="flex items-center justify-center gap-3 text-xs text-blue-100 mb-4 flex-wrap">
                              <div className="flex items-center gap-1">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                High Resolution
                              </div>
                              <div className="flex items-center gap-1">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                Commercial License
                              </div>
                              <div className="flex items-center gap-1">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                No Watermarks
                              </div>
                            </div>
                            <a
                              href="https://depositphotos.com/ref=koenw"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 bg-white text-blue-600 font-semibold px-6 py-3 rounded-lg hover:bg-blue-50 transition-all transform hover:scale-105 shadow-lg"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                              </svg>
                              Browse Pro Backgrounds
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </a>
                          </div>
                          {/* Decorative background elements */}
                          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
                          <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/10 rounded-full translate-y-10 -translate-x-10"></div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Effects Section */}
                  <div className="mb-6">
                    <h4 className="font-medium text-gray-700 mb-3">Effects</h4>
                    <div className="flex gap-2 mb-4 flex-wrap">
                      {effectOptions.map(option => (
                        <button
                          key={option.id}
                          onClick={() => setSelectedEffect(option.id)}
                          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                            selectedEffect === option.id
                              ? 'bg-blue-600 text-white'
                              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>

                    {selectedEffect !== 'none' && (
                      <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <div className="flex items-center gap-4">
                          <label className="text-sm font-medium text-gray-600 min-w-0 flex-shrink-0">
                            {selectedEffect === 'blur' ? 'Blur Amount' : 
                             selectedEffect === 'brightness' ? 'Brightness' : 'Contrast'}:
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={getCurrentEffectValue()}
                            onChange={(e) => handleEffectValueChange(Number(e.target.value))}
                            className="flex-1"
                          />
                          <span className="text-sm font-medium text-gray-600 min-w-0 flex-shrink-0">
                            {getCurrentEffectValue()}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-6 flex flex-col md:flex-row items-center justify-center gap-4">
                  <button 
                    onClick={handleDownload}
                    className="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold text-lg hover:bg-blue-700 transition w-full md:w-auto"
                  >
                    Download HD
                  </button>
                  <button 
                    onClick={handleUploadNew}
                    className="bg-gray-200 text-gray-800 px-8 py-3 rounded-lg font-bold text-lg hover:bg-gray-300 transition w-full md:w-auto"
                  >
                    Upload New Image
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* Features Section */}
          <section id="features" className="py-16">
            <div className="max-w-5xl mx-auto">
              <h3 className="text-3xl font-bold text-gray-900">Why Choose Cutoutify?</h3>
              <p className="mt-4 text-lg text-gray-600">Our AI is trained to handle the most challenging conditions.</p>
              <div className="grid md:grid-cols-3 gap-8 mt-12 text-left">
                <div className="bg-white p-6 rounded-lg border border-slate-200">
                  <i data-lucide="wand-2" className="w-10 h-10 text-blue-600 bg-blue-100 p-2 rounded-lg"></i>
                  <h4 className="font-semibold text-xl mt-4">Precise AI Cutouts</h4>
                  <p className="text-gray-600 mt-2">Get pixel-perfect accuracy for any image, from portraits to products. Our AI intelligently identifies and isolates the subject.</p>
                </div>
                <div className="bg-white p-6 rounded-lg border border-slate-200">
                  <i data-lucide="zap" className="w-10 h-10 text-blue-600 bg-blue-100 p-2 rounded-lg"></i>
                  <h4 className="font-semibold text-xl mt-4">Blazing Fast</h4>
                  <p className="text-gray-600 mt-2">Don't wait around. Your background is removed in about 5 seconds. Spend less time editing and more time creating.</p>
                </div>
                <div className="bg-white p-6 rounded-lg border border-slate-200">
                  <i data-lucide="shield-check" className="w-10 h-10 text-blue-600 bg-blue-100 p-2 rounded-lg"></i>
                  <h4 className="font-semibold text-xl mt-4">Privacy Focused</h4>
                  <p className="text-gray-600 mt-2">We respect your privacy. All uploaded images are processed securely and deleted from our servers automatically.</p>
                </div>
              </div>
            </div>
          </section>

          {/* How It Works Section */}
          <section id="how-it-works" className="py-16 bg-white rounded-2xl border border-slate-200">
            <div className="max-w-5xl mx-auto">
              <h3 className="text-3xl font-bold text-gray-900">As Easy As 1-2-3</h3>
              <p className="mt-4 text-lg text-gray-600">Create transparent backgrounds in three simple steps.</p>
              <div className="grid md:grid-cols-3 gap-8 mt-12 text-center relative">
                {/* Connecting line */}
                <div className="hidden md:block absolute top-8 left-0 w-full h-px bg-gray-200 -z-10"></div>
                <div className="flex flex-col items-center gap-4">
                  <div className="relative z-10 flex-shrink-0 w-16 h-16 bg-blue-600 text-white text-2xl font-bold rounded-full flex items-center justify-center">1</div>
                  <div className="text-center">
                    <h4 className="font-semibold text-xl">Upload Image</h4>
                    <p className="text-gray-600 mt-1">Select or drag & drop the file you want to edit.</p>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-4">
                  <div className="relative z-10 flex-shrink-0 w-16 h-16 bg-blue-600 text-white text-2xl font-bold rounded-full flex items-center justify-center">2</div>
                  <div className="text-center">
                    <h4 className="font-semibold text-xl">AI Removes Background</h4>
                    <p className="text-gray-600 mt-1">Our smart AI gets to work and automatically detects the subject.</p>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-4">
                  <div className="relative z-10 flex-shrink-0 w-16 h-16 bg-blue-600 text-white text-2xl font-bold rounded-full flex items-center justify-center">3</div>
                  <div className="text-center">
                    <h4 className="font-semibold text-xl">Download</h4>
                    <p className="text-gray-600 mt-1">Download your new image with a transparent background as a PNG file.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Testimonials Section */}
          <section id="testimonials" className="py-16">
            <div className="max-w-5xl mx-auto">
              <h3 className="text-3xl font-bold text-gray-900">What Our Users Say</h3>
              <p className="mt-4 text-lg text-gray-600">Join thousands of happy creators who trust Cutoutify.</p>
              <div className="grid md:grid-cols-3 gap-8 mt-12 text-left">
                <div className="bg-white p-6 rounded-lg border border-slate-200">
                  <div className="flex text-yellow-400">
                    <i data-lucide="star" className="w-5 h-5 fill-current"></i>
                    <i data-lucide="star" className="w-5 h-5 fill-current"></i>
                    <i data-lucide="star" className="w-5 h-5 fill-current"></i>
                    <i data-lucide="star" className="w-5 h-5 fill-current"></i>
                    <i data-lucide="star" className="w-5 h-5 fill-current"></i>
                  </div>
                  <p className="text-gray-700 mt-4 italic">"Cutoutify is a lifesaver for my product photos. What used to take ages in Photoshop is now done in seconds. The quality is fantastic and it's saved me so much time."</p>
                  <p className="font-semibold text-gray-800 mt-4">- Alex G.</p>
                  <p className="text-sm text-gray-500">Online Store Owner</p>
                </div>
                <div className="bg-white p-6 rounded-lg border border-slate-200">
                  <div className="flex text-yellow-400">
                    <i data-lucide="star" className="w-5 h-5 fill-current"></i>
                    <i data-lucide="star" className="w-5 h-5 fill-current"></i>
                    <i data-lucide="star" className="w-5 h-5 fill-current"></i>
                    <i data-lucide="star" className="w-5 h-5 fill-current"></i>
                    <i data-lucide="star" className="w-5 h-5 fill-current"></i>
                  </div>
                  <p className="text-gray-700 mt-4 italic">"As a graphic designer, I'm always looking for tools that speed up my workflow. Cutoutify's results are incredibly accurate, even with tricky edges. An essential part of my toolkit now."</p>
                  <p className="font-semibold text-gray-800 mt-4">- Maria K.</p>
                  <p className="text-sm text-gray-500">Freelance Designer</p>
                </div>
                <div className="bg-white p-6 rounded-lg border border-slate-200">
                  <div className="flex text-yellow-400">
                    <i data-lucide="star" className="w-5 h-5 fill-current"></i>
                    <i data-lucide="star" className="w-5 h-5 fill-current"></i>
                    <i data-lucide="star" className="w-5 h-5 fill-current"></i>
                    <i data-lucide="star" className="w-5 h-5 fill-current"></i>
                    <i data-lucide="star" className="w-5 h-5 fill-current"></i>
                  </div>
                  <p className="text-gray-700 mt-4 italic">"Making my social media posts pop is so much easier with Cutoutify. I can quickly remove backgrounds to create amazing collages. Can't believe this is free!"</p>
                  <p className="font-semibold text-gray-800 mt-4">- David Chen</p>
                  <p className="text-sm text-gray-500">Social Media Manager</p>
                </div>
              </div>
            </div>
          </section>

          {/* FAQ Section */}
          <section id="faq" className="py-16">
            <div className="max-w-3xl mx-auto text-left">
              <h3 className="text-3xl font-bold text-gray-900 text-center">Frequently Asked Questions</h3>
              <div className="mt-8 space-y-4">
                <details className="faq-item bg-white p-6 rounded-lg border border-slate-200 cursor-pointer">
                  <summary className="font-semibold text-lg flex justify-between items-center">
                    What image formats are supported?
                    <i data-lucide="chevron-down" className="w-5 h-5 transition-transform transform"></i>
                  </summary>
                  <p className="text-gray-600 mt-4">We support all common image formats, including JPG, PNG, WEBP, and HEIC. Feel free to upload any image, and our tool will handle the rest.</p>
                </details>
                <details className="faq-item bg-white p-6 rounded-lg border border-slate-200 cursor-pointer">
                  <summary className="font-semibold text-lg flex justify-between items-center">
                    Is it really free to use?
                    <i data-lucide="chevron-down" className="w-5 h-5 transition-transform transform"></i>
                  </summary>
                  <p className="text-gray-600 mt-4">Yes! Cutoutify is 100% free for unlimited images and high-resolution downloads. If you find the tool helpful, you can show your appreciation with the "Buy me a coffee" link.</p>
                </details>
                <details className="faq-item bg-white p-6 rounded-lg border border-slate-200 cursor-pointer">
                  <summary className="font-semibold text-lg flex justify-between items-center">
                    Do I need to sign up for an account?
                    <i data-lucide="chevron-down" className="w-5 h-5 transition-transform transform"></i>
                  </summary>
                  <p className="text-gray-600 mt-4">No sign-up is required to remove backgrounds. You can start using the tool immediately. An account is only needed if you decide to upgrade to a Pro plan for more features.</p>
                </details>
              </div>
            </div>
          </section>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="bg-white border-t border-slate-200">
        <div className="container mx-auto px-6 py-8 text-center text-gray-500">
          <p>&copy; 2025 Cutoutify. All Rights Reserved.</p>
          <div className="mt-4 space-x-6">
            <a href="#" className="hover:text-blue-600">Terms of Service</a>
            <a href="#" className="hover:text-blue-600">Privacy Policy</a>
          </div>
        </div>
      </footer>
    </div>
  );
}