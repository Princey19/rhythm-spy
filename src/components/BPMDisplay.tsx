import { Activity, Music, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";

interface BPMDisplayProps {
  bpm: number | null;
  isAnalyzing: boolean;
  fileName?: string;
}

export const BPMDisplay = ({ bpm, isAnalyzing, fileName }: BPMDisplayProps) => {
  const getBPMCategory = (bpm: number) => {
    if (bpm < 70) return { label: "Slow", color: "text-blue-400" };
    if (bpm < 100) return { label: "Moderate", color: "text-green-400" };
    if (bpm < 140) return { label: "Fast", color: "text-yellow-400" };
    if (bpm < 180) return { label: "Very Fast", color: "text-orange-400" };
    return { label: "Extreme", color: "text-red-400" };
  };

  const getMusicGenre = (bpm: number) => {
    if (bpm < 70) return "Ballad, Ambient";
    if (bpm < 90) return "Hip-Hop, R&B";
    if (bpm < 110) return "Pop, Rock";
    if (bpm < 130) return "Dance, House";
    if (bpm < 150) return "Techno, Trance";
    if (bpm < 180) return "Drum & Bass";
    return "Hardcore, Speedcore";
  };

  if (isAnalyzing) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <div className="relative">
          <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center animate-pulse shadow-glow">
            <Activity className="w-8 h-8 text-primary-foreground animate-bounce-subtle" />
          </div>
        </div>
        <div className="text-center space-y-2">
          <p className="text-lg font-medium text-foreground">Analyzing audio...</p>
          <p className="text-sm text-muted-foreground">
            Processing beats and tempo patterns
          </p>
        </div>
      </div>
    );
  }

  if (!bpm) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4 text-muted-foreground">
        <Music className="w-16 h-16 opacity-50" />
        <div className="text-center space-y-2">
          <p className="text-lg font-medium">No analysis yet</p>
          <p className="text-sm">
            Upload a file and click "Analyze BPM" to get started
          </p>
        </div>
      </div>
    );
  }

  const category = getBPMCategory(bpm);
  const genre = getMusicGenre(bpm);

  return (
    <div className="space-y-6 animate-scale-in">
      {/* Main BPM Display */}
      <div className="text-center space-y-4">
        <div className="relative">
          <div className="text-6xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            {bpm.toFixed(1)}
          </div>
          <div className="text-lg text-muted-foreground mt-1">BPM</div>
          <div className="absolute -inset-4 bg-gradient-primary opacity-20 blur-xl rounded-full"></div>
        </div>
        
        <div className={`inline-block px-4 py-2 rounded-full bg-muted ${category.color} font-medium text-sm`}>
          {category.label} Tempo
        </div>
      </div>

      {/* Details */}
      <div className="space-y-4">
        <Card className="p-4 bg-gradient-accent border-border/50">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-primary" />
            <div>
              <p className="font-medium text-foreground">Typical Genres</p>
              <p className="text-sm text-muted-foreground">{genre}</p>
            </div>
          </div>
        </Card>

        {fileName && (
          <Card className="p-4 bg-gradient-accent border-border/50">
            <div className="flex items-center gap-3">
              <Music className="w-5 h-5 text-primary" />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-foreground">File</p>
                <p className="text-sm text-muted-foreground truncate">{fileName}</p>
              </div>
            </div>
          </Card>
        )}

        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="p-3 rounded-lg bg-muted">
            <div className="text-lg font-semibold text-foreground">
              {(60000 / bpm).toFixed(0)}ms
            </div>
            <div className="text-xs text-muted-foreground">Beat Interval</div>
          </div>
          <div className="p-3 rounded-lg bg-muted">
            <div className="text-lg font-semibold text-foreground">
              {(bpm / 4).toFixed(1)}
            </div>
            <div className="text-xs text-muted-foreground">Quarter Notes/s</div>
          </div>
        </div>
      </div>
    </div>
  );
};