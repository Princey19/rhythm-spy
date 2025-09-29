import { useState, useCallback } from "react";
import { Play, Pause, RotateCcw, FileAudio, CheckCircle, XCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { analyzeBPM } from "@/lib/audio-utils";

export interface BatchResult {
  file: File;
  bpm?: number;
  status: 'pending' | 'processing' | 'completed' | 'error';
  error?: string;
}

interface BatchProcessorProps {
  files: File[];
  onResults: (results: BatchResult[]) => void;
}

export const BatchProcessor = ({ files, onResults }: BatchProcessorProps) => {
  const [results, setResults] = useState<BatchResult[]>(
    files.map(file => ({ file, status: 'pending' }))
  );
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const { toast } = useToast();

  const processFile = async (result: BatchResult, index: number): Promise<BatchResult> => {
    try {
      const audioUrl = URL.createObjectURL(result.file);
      const bpm = await analyzeBPM(audioUrl);
      URL.revokeObjectURL(audioUrl);
      
      return {
        ...result,
        bpm,
        status: 'completed'
      };
    } catch (error) {
      return {
        ...result,
        status: 'error',
        error: error instanceof Error ? error.message : 'Analysis failed'
      };
    }
  };

  const processBatch = useCallback(async () => {
    if (isProcessing && !isPaused) return;
    
    setIsProcessing(true);
    setIsPaused(false);
    
    const startIndex = currentIndex + 1;
    
    for (let i = startIndex; i < results.length; i++) {
      if (isPaused) break;
      
      setCurrentIndex(i);
      
      // Update status to processing
      setResults(prev => prev.map((r, idx) => 
        idx === i ? { ...r, status: 'processing' } : r
      ));
      
      const processedResult = await processFile(results[i], i);
      
      // Update with result
      setResults(prev => {
        const newResults = prev.map((r, idx) => 
          idx === i ? processedResult : r
        );
        onResults(newResults);
        return newResults;
      });
    }
    
    if (!isPaused) {
      setIsProcessing(false);
      setCurrentIndex(-1);
      toast({
        title: "Batch analysis complete!",
        description: `Processed ${files.length} files`,
      });
    }
  }, [currentIndex, files.length, isPaused, isProcessing, onResults, results, toast]);

  const pauseProcessing = () => {
    setIsPaused(true);
  };

  const resetProcessing = () => {
    setIsProcessing(false);
    setIsPaused(false);
    setCurrentIndex(-1);
    setResults(files.map(file => ({ file, status: 'pending' })));
    onResults([]);
  };

  const completedCount = results.filter(r => r.status === 'completed').length;
  const errorCount = results.filter(r => r.status === 'error').length;
  const progress = files.length > 0 ? ((completedCount + errorCount) / files.length) * 100 : 0;

  return (
    <Card className="p-6 bg-card shadow-card border-border">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-foreground">Batch Analysis</h3>
            <p className="text-sm text-muted-foreground">
              {files.length} files • {completedCount} completed • {errorCount} errors
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={resetProcessing}
              disabled={isProcessing && !isPaused}
              className="border-primary/20 hover:border-primary hover:bg-primary/10"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
            
            <Button
              onClick={isProcessing ? pauseProcessing : processBatch}
              disabled={completedCount + errorCount === files.length}
              className="bg-gradient-primary hover:shadow-glow transition-all"
            >
              {isProcessing ? (
                <>
                  <Pause className="w-4 h-4 mr-2" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  {currentIndex >= 0 ? "Resume" : "Start Analysis"}
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="text-foreground">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <div className="space-y-2 max-h-60 overflow-y-auto">
          {results.map((result, index) => (
            <div
              key={index}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                index === currentIndex 
                  ? 'bg-primary/5 border-primary/20' 
                  : 'bg-muted border-border'
              }`}
            >
              <div className="flex-shrink-0">
                {result.status === 'pending' && <Clock className="w-4 h-4 text-muted-foreground" />}
                {result.status === 'processing' && <FileAudio className="w-4 h-4 text-primary animate-pulse" />}
                {result.status === 'completed' && <CheckCircle className="w-4 h-4 text-green-500" />}
                {result.status === 'error' && <XCircle className="w-4 h-4 text-red-500" />}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {result.file.name}
                </p>
                {result.status === 'completed' && result.bpm && (
                  <p className="text-xs text-muted-foreground">
                    {result.bpm.toFixed(1)} BPM
                  </p>
                )}
                {result.status === 'error' && (
                  <p className="text-xs text-red-500">
                    {result.error || 'Analysis failed'}
                  </p>
                )}
              </div>
              
              <div className="text-xs text-muted-foreground">
                {(result.file.size / (1024 * 1024)).toFixed(1)}MB
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};