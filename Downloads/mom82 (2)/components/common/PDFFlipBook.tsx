
import React, { useState, useRef, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import HTMLFlipBook from 'react-pageflip';
import LoadingSpinner from './LoadingSpinner';

// Configure PDF worker
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js`;

interface PDFFlipBookProps {
  pdfUrl: string;
}

const PDFFlipBook: React.FC<PDFFlipBookProps> = ({ pdfUrl }) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<boolean>(false);
  
  // Responsive sizing state
  const [bookWidth, setBookWidth] = useState(450);
  const [bookHeight, setBookHeight] = useState(600);
  
  const bookRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Resize handler
  useEffect(() => {
    const handleResize = () => {
        if (containerRef.current) {
            const containerWidth = containerRef.current.offsetWidth;
            // On mobile (< 640px), make it single page width roughly
            if (window.innerWidth < 640) {
                setBookWidth(Math.min(containerWidth - 20, 350));
                setBookHeight(Math.min((containerWidth - 20) * 1.4, 500));
            } else {
                setBookWidth(450);
                setBookHeight(600);
            }
        }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial calculation
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setLoading(false);
    setError(false);
  };

  const onDocumentLoadError = (err: Error) => {
      console.warn("Flipbook render failed (likely CORS), falling back to native viewer.", err);
      setLoading(false);
      setError(true);
  };

  const toggleFullscreen = () => {
    const elem = document.getElementById('flipbook-container');
    if (!document.fullscreenElement && elem) {
      elem.requestFullscreen().then(() => setIsFullscreen(true)).catch(err => console.log(err));
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false));
    }
  };

  // --- Fallback View (Native Browser PDF) ---
  if (error) {
      return (
        <div className="w-full h-[600px] bg-gray-100 rounded-xl border border-gray-300 flex flex-col items-center justify-center p-4 relative">
             <div className="absolute top-2 right-2 z-10">
                <a 
                    href={pdfUrl} 
                    target="_blank" 
                    rel="noreferrer"
                    className="bg-brand-charcoal text-white px-4 py-2 rounded-lg text-xs font-bold shadow hover:bg-black transition-colors"
                >
                    تحميل / فتح في نافذة مستقلة ↗
                </a>
            </div>
            <iframe 
                src={`${pdfUrl}#toolbar=0`} 
                className="w-full h-full rounded-lg shadow-inner"
                title="PDF Viewer"
            />
        </div>
      );
  }

  return (
    <div 
        id="flipbook-container" 
        ref={containerRef}
        className={`relative flex flex-col items-center justify-center bg-gray-800 rounded-xl overflow-hidden shadow-2xl transition-all duration-300 ${isFullscreen ? 'p-0 w-full h-screen' : 'p-2 sm:p-4 min-h-[500px] sm:min-h-[600px] w-full'}`}
    >
        
        {/* Header Controls */}
        <div className="absolute top-4 right-4 z-50 flex gap-2">
            <a 
                href={pdfUrl} 
                target="_blank" 
                rel="noreferrer"
                className="bg-white/20 hover:bg-white/40 text-white p-2 rounded-full backdrop-blur-sm transition-colors text-xs font-bold flex items-center gap-1"
                title="تحميل / فتح خارجي"
            >
                ⬇️
            </a>
            <button 
                onClick={toggleFullscreen} 
                className="bg-white/20 hover:bg-white/40 text-white p-2 rounded-full backdrop-blur-sm transition-colors"
                title="ملء الشاشة"
            >
                {isFullscreen ? '🔽' : '⛶'}
            </button>
        </div>

        {/* Loading State */}
        {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white z-40 bg-gray-800/80 backdrop-blur-sm">
                <LoadingSpinner />
                <span className="text-sm font-light mt-2">جاري تحميل الكتاب...</span>
            </div>
        )}

        {/* Document Viewer */}
        <div className="w-full overflow-hidden flex justify-center">
            <Document
                file={pdfUrl}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={onDocumentLoadError}
                loading={null}
                className="flex justify-center items-center"
                options={{
                    cMapUrl: 'https://unpkg.com/pdfjs-dist@3.11.174/cmaps/',
                    cMapPacked: true,
                }}
            >
                {numPages > 0 && (
                    <div className="relative">
                        {/* Navigation Overlay - Mobile optimized */}
                        <div className="absolute bottom-[-40px] md:bottom-[-50px] left-0 right-0 flex justify-center gap-2 md:gap-4 z-50">
                            <button 
                                onClick={() => bookRef.current?.pageFlip()?.flipPrev()} 
                                className="bg-black/50 hover:bg-black/80 text-white px-4 md:px-6 py-2 rounded-full font-bold backdrop-blur-md shadow-lg border border-white/10 text-xs md:text-sm"
                            >
                                السابق
                            </button>
                            <span className="bg-black/50 text-white px-3 md:px-4 py-2 rounded-full text-[10px] md:text-xs flex items-center font-mono border border-white/10">
                                {numPages} صفحات
                            </span>
                            <button 
                                onClick={() => bookRef.current?.pageFlip()?.flipNext()} 
                                className="bg-black/50 hover:bg-black/80 text-white px-4 md:px-6 py-2 rounded-full font-bold backdrop-blur-md shadow-lg border border-white/10 text-xs md:text-sm"
                            >
                                التالي
                            </button>
                        </div>

                        {/* @ts-ignore */}
                        <HTMLFlipBook 
                            width={bookWidth} 
                            height={bookHeight} 
                            size="stretch"
                            minWidth={280}
                            maxWidth={1000}
                            minHeight={350}
                            maxHeight={1533}
                            maxShadowOpacity={0.8} 
                            showCover={true}
                            mobileScrollSupport={true}
                            className="flip-book shadow-2xl"
                            ref={bookRef}
                            drawShadow={true}
                            flippingTime={1000} 
                            usePortrait={window.innerWidth < 640} // Force single page on mobile
                            startPage={0}
                            swipeDistance={30}
                            showPageCorners={true}
                            disableFlipByClick={false}
                        >
                            {[...Array(numPages)].map((_, index) => (
                                <div key={index} className={`bg-[#fdfaf7] overflow-hidden border-r border-gray-200 relative ${index === 0 ? 'hard-cover' : ''}`}>
                                    {/* Spine Shadow */}
                                    <div className={`absolute top-0 bottom-0 w-8 z-20 pointer-events-none mix-blend-multiply opacity-10
                                        ${index % 2 === 0 ? 'left-0 bg-gradient-to-r from-black to-transparent' : 'right-0 bg-gradient-to-l from-black to-transparent'}
                                    `}></div>
                                    
                                    <Page 
                                        pageNumber={index + 1} 
                                        width={bookWidth} 
                                        renderAnnotationLayer={false} 
                                        renderTextLayer={false}
                                        className="shadow-inner h-full w-full object-contain"
                                        loading=""
                                    />
                                    <div className="absolute bottom-2 left-0 right-0 text-center pointer-events-none">
                                        <span className="text-[10px] text-gray-400 font-mono bg-white/80 px-2 rounded">
                                            - {index + 1} -
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </HTMLFlipBook>
                    </div>
                )}
            </Document>
        </div>
    </div>
  );
};

export default PDFFlipBook;
