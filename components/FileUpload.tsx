import React, { useRef } from 'react';
import { Upload, FileText, AlertCircle, Loader2 } from 'lucide-react';
import { UploadedFile } from '../types';

interface FileUploadProps {
  onFilesSelected: (files: UploadedFile[]) => void;
  isProcessing: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFilesSelected, isProcessing }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      // Explicitly type the result of Array.from to File[] to avoid 'unknown' inference
      const selectedFiles: File[] = Array.from(e.target.files);
      const processedFiles: UploadedFile[] = [];

      for (const file of selectedFiles) {
        const base64 = await fileToBase64(file);
        processedFiles.push({
          name: file.name,
          type: file.type,
          data: base64,
          mimeType: file.type
        });
      }
      onFilesSelected(processedFiles);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix (e.g., "data:application/pdf;base64,")
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  };

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center animate-fade-in">
      <div className="max-w-xl w-full bg-industrial-800 border-2 border-dashed border-industrial-600 rounded-xl p-10 hover:border-brand-blue transition-colors duration-300">
        
        <div className="bg-industrial-700 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
          {isProcessing ? (
             <Loader2 className="w-10 h-10 text-brand-blue animate-spin" />
          ) : (
             <Upload className="w-10 h-10 text-brand-blue" />
          )}
        </div>

        <h2 className="text-2xl font-bold text-white mb-3">Upload Machine Manual</h2>
        <p className="text-industrial-400 mb-8">
          Support for PDF, JPG, PNG. <br/> 
          AI will scan for schematics, error codes, and maintenance tables.
        </p>

        <input 
            type="file" 
            ref={inputRef}
            onChange={handleFileChange}
            accept=".pdf,image/png,image/jpeg,image/webp"
            className="hidden" 
            multiple
        />

        <button 
          onClick={() => inputRef.current?.click()}
          disabled={isProcessing}
          className="bg-brand-blue hover:bg-blue-600 text-white font-semibold py-3 px-8 rounded-lg transition-all shadow-lg hover:shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? 'Processing Manual...' : 'Select Files'}
        </button>

        <div className="mt-8 flex items-center justify-center gap-2 text-sm text-industrial-500 bg-industrial-900/50 p-3 rounded-lg">
            <AlertCircle className="w-4 h-4" />
            <span>Files are processed locally in your browser session via API.</span>
        </div>
      </div>
    </div>
  );
};