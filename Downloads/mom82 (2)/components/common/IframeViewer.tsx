
import React, { useRef } from 'react';

interface IframeViewerProps {
  url: string;
  title?: string;
}

const IframeViewer: React.FC<IframeViewerProps> = ({ url, title = 'Document Viewer' }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  if (!url) return null;

  return (
    <div 
      ref={containerRef} 
      className="relative w-full bg-gray-100 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-md group"
      style={{ height: '600px' }} // Fixed height container
    >
      <div className="absolute top-2 right-2 z-10 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <button
          onClick={toggleFullscreen}
          className="bg-black/70 hover:bg-black/90 text-white px-3 py-1.5 rounded-lg text-xs font-bold backdrop-blur-sm shadow-lg flex items-center gap-1 transition-all"
        >
          <span>⛶</span> ملء الشاشة
        </button>
        <a 
            href={url} 
            target="_blank" 
            rel="noreferrer"
            className="bg-indigo-600/90 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold backdrop-blur-sm shadow-lg transition-all"
        >
            فتح في نافذة جديدة ↗
        </a>
      </div>

      <iframe
        src={url}
        title={title}
        className="w-full h-full border-0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    </div>
  );
};

export default IframeViewer;
