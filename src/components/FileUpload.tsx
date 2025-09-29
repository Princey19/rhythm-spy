import { useState, useCallback } from "react";
import { Upload, FileAudio, FileVideo } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface FileUploadProps {
  onFileSelect?: (file: File) => void;
  onFilesSelect?: (files: File[]) => void;
  acceptedTypes: string[];
  allowMultiple?: boolean;
}

export const FileUpload = ({ onFileSelect, onFilesSelect, acceptedTypes, allowMultiple = false }: FileUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const validateFile = (file: File): boolean => {
    const extension = `.${file.name.split('.').pop()?.toLowerCase()}`;
    return acceptedTypes.includes(extension);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    
    if (files.length === 0) return;

    if (allowMultiple) {
      const validFiles = files.filter(validateFile);
      const oversizedFiles = validFiles.filter(file => file.size > 100 * 1024 * 1024);
      const processableFiles = validFiles.filter(file => file.size <= 100 * 1024 * 1024);
      
      if (validFiles.length < files.length) {
        toast({
          title: "Some files skipped",
          description: `${files.length - validFiles.length} files were invalid. Supported formats: ${acceptedTypes.join(', ')}`,
          variant: "destructive",
        });
      }
      
      if (oversizedFiles.length > 0) {
        toast({
          title: "Some files too large",
          description: `${oversizedFiles.length} files were over 100MB and skipped`,
          variant: "destructive",
        });
      }
      
      if (processableFiles.length > 0) {
        onFilesSelect?.(processableFiles);
        toast({
          title: "Files uploaded successfully",
          description: `${processableFiles.length} files ready for batch analysis`,
        });
      }
    } else {
      const file = files[0];
      
      if (!validateFile(file)) {
        toast({
          title: "Invalid file type",
          description: `Please select a valid audio or video file. Supported formats: ${acceptedTypes.join(', ')}`,
          variant: "destructive",
        });
        return;
      }

      if (file.size > 100 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select a file smaller than 100MB",
          variant: "destructive",
        });
        return;
      }

      onFileSelect?.(file);
      toast({
        title: "File uploaded successfully",
        description: `${file.name} is ready for analysis`,
      });
    }
  }, [acceptedTypes, onFileSelect, onFilesSelect, allowMultiple, toast]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (allowMultiple) {
      const fileArray = Array.from(files);
      const validFiles = fileArray.filter(validateFile);
      const oversizedFiles = validFiles.filter(file => file.size > 100 * 1024 * 1024);
      const processableFiles = validFiles.filter(file => file.size <= 100 * 1024 * 1024);
      
      if (validFiles.length < fileArray.length) {
        toast({
          title: "Some files skipped",
          description: `${fileArray.length - validFiles.length} files were invalid. Supported formats: ${acceptedTypes.join(', ')}`,
          variant: "destructive",
        });
      }
      
      if (oversizedFiles.length > 0) {
        toast({
          title: "Some files too large",
          description: `${oversizedFiles.length} files were over 100MB and skipped`,
          variant: "destructive",
        });
      }
      
      if (processableFiles.length > 0) {
        onFilesSelect?.(processableFiles);
        toast({
          title: "Files uploaded successfully",
          description: `${processableFiles.length} files ready for batch analysis`,
        });
      }
    } else {
      const file = files[0];
      
      if (!validateFile(file)) {
        toast({
          title: "Invalid file type",
          description: `Please select a valid audio or video file. Supported formats: ${acceptedTypes.join(', ')}`,
          variant: "destructive",
        });
        return;
      }

      if (file.size > 100 * 1024 * 1024) {
        toast({
          title: "File too large", 
          description: "Please select a file smaller than 100MB",
          variant: "destructive",
        });
        return;
      }

      onFileSelect?.(file);
      toast({
        title: "File uploaded successfully",
        description: `${file.name} is ready for analysis`,
      });
    }
  };

  const isAudioFile = (filename: string) => {
    const audioExtensions = ['.mp3', '.wav', '.m4a', '.aac', '.ogg'];
    const extension = `.${filename.split('.').pop()?.toLowerCase()}`;
    return audioExtensions.includes(extension);
  };

  return (
    <div className="space-y-4">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300
          ${isDragging 
            ? 'border-primary bg-gradient-accent scale-[1.02] shadow-glow' 
            : 'border-border hover:border-primary/50 hover:bg-gradient-accent/50'
          }
        `}
      >
        <div className="space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center shadow-primary">
            <Upload className="w-8 h-8 text-primary-foreground" />
          </div>
          
          <div className="space-y-2">
            <h3 className="text-lg font-medium text-foreground">
              {allowMultiple ? "Drop your audio or video files here" : "Drop your audio or video file here"}
            </h3>
            <p className="text-sm text-muted-foreground">
              {allowMultiple ? "Or click to browse and select multiple files" : "Or click to browse and select a file"}
            </p>
          </div>

          <div className="flex items-center justify-center gap-6 pt-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <FileAudio className="w-4 h-4" />
              <span>Audio: MP3, WAV, M4A, AAC, OGG</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <FileVideo className="w-4 h-4" />
              <span>Video: MP4, WebM, MOV, AVI</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-center">
        <Button
          variant="outline"
          onClick={() => document.getElementById('file-input')?.click()}
          className="border-primary/20 hover:border-primary hover:bg-primary/10"
        >
          <Upload className="w-4 h-4 mr-2" />
          {allowMultiple ? "Choose Files" : "Choose File"}
        </Button>
        <input
          id="file-input"
          type="file"
          accept={acceptedTypes.join(',')}
          multiple={allowMultiple}
          onChange={handleFileInput}
          className="hidden"
        />
      </div>
    </div>
  );
};