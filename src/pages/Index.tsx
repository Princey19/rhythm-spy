import { useState } from "react";
import { FileUpload } from "@/components/FileUpload";
import { AudioPlayer } from "@/components/AudioPlayer";
import { BPMDisplay } from "@/components/BPMDisplay";
import { Card } from "@/components/ui/card";
import { Music } from "lucide-react";

const Index = () => {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [bpm, setBpm] = useState<number | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleFileSelect = (file: File) => {
    setAudioFile(file);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    const url = URL.createObjectURL(file);
    setAudioUrl(url);
    setBpm(null);
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
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Upload Section */}
          <Card className="p-8 bg-card shadow-card border-border animate-fade-in">
            <FileUpload
              onFileSelect={handleFileSelect}
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
          {(audioUrl || bpm) && (
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

          {/* Instructions */}
          <Card className="p-6 bg-gradient-accent border-border animate-fade-in">
            <h3 className="text-lg font-medium mb-3 text-foreground">
              How to use
            </h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>• Upload an audio file (MP3, WAV, M4A, AAC, OGG) or video file (MP4, WebM, MOV, AVI)</p>
              <p>• Click "Analyze BPM" to detect the beats per minute</p>
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