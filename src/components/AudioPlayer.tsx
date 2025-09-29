import { useState, useRef, useEffect } from "react";
import { Play, Pause, RotateCcw, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { analyzeBPM } from "@/lib/audio-utils";

interface AudioPlayerProps {
  audioUrl: string;
  onBpmDetected: (bpm: number) => void;
  onAnalysisStart: () => void;
}

export const AudioPlayer = ({ audioUrl, onBpmDetected, onAnalysisStart }: AudioPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [waveformData, setWaveformData] = useState<number[]>([]);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const { toast } = useToast();

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => {
      setCurrentTime(audio.currentTime);
    };

    const updateDuration = () => {
      setDuration(audio.duration);
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
    };
  }, [audioUrl]);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (value: number[]) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newTime = (value[0] / 100) * duration;
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const reset = () => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.pause();
    audio.currentTime = 0;
    setCurrentTime(0);
    setIsPlaying(false);
  };

  const drawWaveform = () => {
    const canvas = canvasRef.current;
    if (!canvas || waveformData.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);

    // Create gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, 'hsl(217, 91%, 60%)');
    gradient.addColorStop(1, 'hsl(269, 70%, 65%)');
    
    ctx.fillStyle = gradient;

    const barWidth = width / waveformData.length;
    waveformData.forEach((amplitude, index) => {
      const barHeight = amplitude * height * 0.8;
      const x = index * barWidth;
      const y = (height - barHeight) / 2;
      
      ctx.fillRect(x, y, barWidth - 1, barHeight);
    });

    // Draw progress indicator
    const progress = duration > 0 ? currentTime / duration : 0;
    const progressX = progress * width;
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillRect(0, 0, progressX, height);
  };

  useEffect(() => {
    drawWaveform();
  }, [waveformData, currentTime, duration]);

  const analyzeAudio = async () => {
    if (!audioUrl) {
      toast({
        title: "No audio file",
        description: "Please upload an audio file first",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    onAnalysisStart();
    
    toast({
      title: "Analyzing audio...",
      description: "This may take a few moments depending on file size",
    });

    try {
      const bpm = await analyzeBPM(audioUrl);
      onBpmDetected(bpm);
      
      toast({
        title: "Analysis complete!",
        description: `Detected BPM: ${bpm.toFixed(1)}`,
      });
    } catch (error) {
      console.error('BPM analysis failed:', error);
      toast({
        title: "Analysis failed",
        description: "Unable to analyze BPM. Please try a different file.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      <audio ref={audioRef} src={audioUrl} />
      
      {/* Waveform Visualization */}
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={400}
          height={80}
          className="w-full h-20 bg-muted rounded-lg border border-border"
        />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {waveformData.length === 0 && (
            <div className="text-muted-foreground text-sm">
              Waveform will appear here
            </div>
          )}
        </div>
      </div>

      {/* Progress Slider */}
      <div className="space-y-2">
        <Slider
          value={[duration > 0 ? (currentTime / duration) * 100 : 0]}
          onValueChange={handleSeek}
          max={100}
          step={0.1}
          className="cursor-pointer"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={togglePlayPause}
            disabled={!audioUrl}
            className="w-12 h-12 rounded-full border-primary/20 hover:border-primary hover:bg-primary/10"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5" />
            ) : (
              <Play className="w-5 h-5 ml-1" />
            )}
          </Button>
          
          <Button
            variant="outline"
            size="icon"
            onClick={reset}
            disabled={!audioUrl}
            className="border-primary/20 hover:border-primary hover:bg-primary/10"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>

        <Button
          onClick={analyzeAudio}
          disabled={!audioUrl || isAnalyzing}
          className="bg-gradient-primary hover:shadow-glow transition-all"
        >
          {isAnalyzing ? (
            <>
              <Activity className="w-4 h-4 mr-2 animate-pulse" />
              Analyzing...
            </>
          ) : (
            <>
              <Activity className="w-4 h-4 mr-2" />
              Analyze BPM
            </>
          )}
        </Button>
      </div>
    </div>
  );
};