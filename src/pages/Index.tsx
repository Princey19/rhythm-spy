import { useState } from "react";
import { FileUpload } from "@/components/FileUpload";
import { AudioPlayer } from "@/components/AudioPlayer";
import { BPMDisplay } from "@/components/BPMDisplay";
import { BatchProcessor, BatchResult } from "@/components/BatchProcessor";
import { BatchResults } from "@/components/BatchResults";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Music, Files, File } from "lucide-react";

const Index = () => {
  const [mode, setMode] = useState<'single' | 'batch'>('single');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [bpm, setBpm] = useState<number | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [batchFiles, setBatchFiles] = useState<File[]>([]);
  const [batchResults, setBatchResults] = useState<BatchResult[]>([]);

  const handleFileSelect = (file: File) => {
    setAudioFile(file);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    const url = URL.createObjectURL(file);
    setAudioUrl(url);
    setBpm(null);
  };

  const handleFilesSelect = (files: File[]) => {
    setBatchFiles(files);
    setBatchResults([]);
  };

  const handleModeSwitch = (newMode: 'single' | 'batch') => {
    setMode(newMode);
    // Clear data when switching modes
    if (newMode === 'single') {
      setBatchFiles([]);
      setBatchResults([]);
    } else {
      setAudioFile(null);
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      setAudioUrl(null);
      setBpm(null);
    }
  };

  const handleBpmDetected = (detectedBpm: number) => {
    setBpm(detectedBpm);
    setIsAnalyzing(false);
  };

  const handleAnalysisStart = () => {
    setIsAnalyzing(true);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-secondary border-b border-border">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-xl bg-gradient-primary shadow-glow">
              <Music className="w-8 h-8 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                BPM Analyzer
              </h1>
              <p className="text-muted-foreground mt-1">
                Detect the beats per minute of your audio and video files
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Mode Selection */}
          <Card className="p-6 bg-card shadow-card border-border animate-fade-in">
            <div className="flex items-center justify-center gap-4">
              <Button
                variant={mode === 'single' ? 'default' : 'outline'}
                onClick={() => handleModeSwitch('single')}
                className="flex items-center gap-2"
              >
                <File className="w-4 h-4" />
                Single File Analysis
              </Button>
              <Button
                variant={mode === 'batch' ? 'default' : 'outline'}
                onClick={() => handleModeSwitch('batch')}
                className="flex items-center gap-2"
              >
                <Files className="w-4 h-4" />
                Batch Analysis
              </Button>
            </div>
          </Card>

          {/* Upload Section */}
          <Card className="p-8 bg-card shadow-card border-border animate-fade-in">
            <FileUpload
              onFileSelect={mode === 'single' ? handleFileSelect : undefined}
              onFilesSelect={mode === 'batch' ? handleFilesSelect : undefined}
              allowMultiple={mode === 'batch'}
              acceptedTypes={[
                ".mp3",
                ".wav", 
                ".m4a",
                ".aac",
                ".ogg",
                ".mp4",
                ".webm",
                ".mov",
                ".avi"
              ]}
            />
          </Card>

          {/* Results Section */}
          {mode === 'single' && (audioUrl || bpm) && (
            <div className="grid gap-8 md:grid-cols-2 animate-scale-in">
              {/* Audio Player */}
              {audioUrl && (
                <Card className="p-6 bg-card shadow-card border-border">
                  <h3 className="text-xl font-semibold mb-4 text-foreground">
                    Audio Player
                  </h3>
                  <AudioPlayer
                    audioUrl={audioUrl}
                    onBpmDetected={handleBpmDetected}
                    onAnalysisStart={handleAnalysisStart}
                  />
                </Card>
              )}

              {/* BPM Display */}
              <Card className="p-6 bg-card shadow-card border-border">
                <h3 className="text-xl font-semibold mb-4 text-foreground">
                  BPM Analysis
                </h3>
                <BPMDisplay
                  bpm={bpm}
                  isAnalyzing={isAnalyzing}
                  fileName={audioFile?.name}
                />
              </Card>
            </div>
          )}

          {/* Batch Processing Section */}
          {mode === 'batch' && batchFiles.length > 0 && (
            <div className="space-y-8 animate-scale-in">
              <BatchProcessor 
                files={batchFiles}
                onResults={setBatchResults}
              />
              <BatchResults results={batchResults} />
            </div>
          )}

          {/* Instructions */}
          <Card className="p-6 bg-gradient-accent border-border animate-fade-in">
            <h3 className="text-lg font-medium mb-3 text-foreground">
              How to use
            </h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p><strong>Single File Mode:</strong></p>
              <p>• Upload an audio file (MP3, WAV, M4A, AAC, OGG) or video file (MP4, WebM, MOV, AVI)</p>
              <p>• Click "Analyze BPM" to detect the beats per minute</p>
              <p><strong>Batch Mode:</strong></p>
              <p>• Upload multiple files or select a folder containing audio/video files</p>
              <p>• Click "Start Analysis" to process all files sequentially</p>
              <p>• Export results to CSV when analysis is complete</p>
              <p>• The analysis uses advanced audio processing to identify tempo patterns</p>
              <p>• Results are most accurate with clear, consistent beats</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;