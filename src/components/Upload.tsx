import React, { useRef } from 'react';
import { Upload as UploadIcon, Image as ImageIcon } from 'lucide-react';
import { motion } from 'motion/react';

interface UploadProps {
  onUpload: (base64: string) => void;
  isLoading: boolean;
}

export default function Upload({ onUpload, isLoading }: UploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      alert("File is too large. Max 5MB.");
      return;
    }
    if (!file.type.startsWith('image/')) {
      alert("Please upload an image file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const MAX_DIM = 1024;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_DIM) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          }
        } else {
          if (height > MAX_DIM) {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const resizedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
          onUpload(resizedDataUrl);
        } else {
          onUpload(e.target?.result as string);
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto py-4 px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4 }}
        id="upload-zone"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`w-full aspect-[4/3] bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-white/20 transition-all group relative overflow-hidden ${isLoading ? 'pointer-events-none' : ''}`}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          className="hidden" 
          accept="image/*"
        />
        
        <div className="flex flex-col items-center z-10 text-center px-6">
          <UploadIcon className="w-10 h-10 mb-4 opacity-40 group-hover:opacity-60 transition-opacity" />
          <p className="font-mono text-sm uppercase tracking-widest opacity-60">
            {isLoading ? 'Processing...' : 'Drop screenshot or tap to upload'}
          </p>
        </div>

        {/* Small instruction image placeholder styled with CSS because image gen failed */}
        <div className="mt-8 flex items-center gap-2 opacity-30 group-hover:opacity-50 transition-opacity">
           <ImageIcon size={16} />
           <span className="text-[10px] uppercase font-mono tracking-tighter">Instructions: Screenshot emoji grid</span>
        </div>
      </motion.div>
      
      <div className="mt-12 text-[10px] font-mono uppercase tracking-[0.3em] opacity-30">
        <a href="https://www.wondervalleyprojects.com" target="_blank" rel="noopener noreferrer" className="hover:opacity-100 transition-opacity">
          a lab project
        </a>
      </div>
    </div>
  );
}
