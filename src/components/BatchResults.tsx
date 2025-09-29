import { useState } from "react";
import { Music, Download, TrendingUp, BarChart3, Filter } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BatchResult } from "./BatchProcessor";

interface BatchResultsProps {
  results: BatchResult[];
}

export const BatchResults = ({ results }: BatchResultsProps) => {
  const [sortBy, setSortBy] = useState<'name' | 'bpm' | 'size'>('name');
  const [filterBy, setFilterBy] = useState<'all' | 'completed' | 'errors'>('all');

  const completedResults = results.filter(r => r.status === 'completed' && r.bpm);
  const filteredResults = results.filter(result => {
    if (filterBy === 'completed') return result.status === 'completed';
    if (filterBy === 'errors') return result.status === 'error';
    return true;
  });

  const sortedResults = [...filteredResults].sort((a, b) => {
    switch (sortBy) {
      case 'bpm':
        if (a.bpm && b.bpm) return b.bpm - a.bpm;
        return 0;
      case 'size':
        return b.file.size - a.file.size;
      default:
        return a.file.name.localeCompare(b.file.name);
    }
  });

  const getBPMCategory = (bpm: number) => {
    if (bpm < 70) return { label: "Slow", color: "text-blue-400" };
    if (bpm < 100) return { label: "Moderate", color: "text-green-400" };
    if (bpm < 140) return { label: "Fast", color: "text-yellow-400" };
    if (bpm < 180) return { label: "Very Fast", color: "text-orange-400" };
    return { label: "Extreme", color: "text-red-400" };
  };

  const exportResults = () => {
    const csvContent = completedResults.map(result => 
      `"${result.file.name}",${result.bpm?.toFixed(1)},${(result.file.size / (1024 * 1024)).toFixed(1)}`
    ).join('\n');
    
    const header = 'File Name,BPM,Size (MB)\n';
    const fullContent = header + csvContent;
    
    const blob = new Blob([fullContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bpm-analysis-results.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (results.length === 0) {
    return (
      <Card className="p-8 text-center bg-card shadow-card border-border">
        <Music className="w-16 h-16 mx-auto text-muted-foreground opacity-50 mb-4" />
        <p className="text-lg font-medium text-foreground mb-2">No results yet</p>
        <p className="text-sm text-muted-foreground">
          Upload files and start batch analysis to see results here
        </p>
      </Card>
    );
  }

  const avgBPM = completedResults.length > 0 
    ? completedResults.reduce((sum, r) => sum + (r.bpm || 0), 0) / completedResults.length 
    : 0;

  return (
    <Card className="p-6 bg-card shadow-card border-border">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-foreground flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Analysis Results
            </h3>
            <p className="text-sm text-muted-foreground">
              {completedResults.length} successful analyses
            </p>
          </div>
          
          {completedResults.length > 0 && (
            <Button
              variant="outline"
              onClick={exportResults}
              className="border-primary/20 hover:border-primary hover:bg-primary/10"
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          )}
        </div>

        {completedResults.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4 bg-gradient-accent border-border/50">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Average BPM</p>
                  <p className="text-2xl font-bold text-foreground">
                    {avgBPM.toFixed(1)}
                  </p>
                </div>
              </div>
            </Card>
            
            <Card className="p-4 bg-gradient-accent border-border/50">
              <div className="flex items-center gap-3">
                <Music className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Files</p>
                  <p className="text-2xl font-bold text-foreground">
                    {results.length}
                  </p>
                </div>
              </div>
            </Card>
            
            <Card className="p-4 bg-gradient-accent border-border/50">
              <div className="flex items-center gap-3">
                <BarChart3 className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Success Rate</p>
                  <p className="text-2xl font-bold text-foreground">
                    {((completedResults.length / results.length) * 100).toFixed(0)}%
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}

        <div className="flex gap-4">
          <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="bpm">BPM</SelectItem>
              <SelectItem value="size">Size</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={filterBy} onValueChange={(value: any) => setFilterBy(value)}>
            <SelectTrigger className="w-32">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Files</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="errors">Errors</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {sortedResults.map((result, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-4 rounded-lg bg-muted border border-border"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <Music className="w-5 h-5 text-primary flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground truncate">
                    {result.file.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {(result.file.size / (1024 * 1024)).toFixed(1)} MB
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                {result.status === 'completed' && result.bpm && (
                  <>
                    <div className="text-right">
                      <p className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                        {result.bpm.toFixed(1)}
                      </p>
                      <p className="text-xs text-muted-foreground">BPM</p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium bg-muted ${getBPMCategory(result.bpm).color}`}>
                      {getBPMCategory(result.bpm).label}
                    </div>
                  </>
                )}
                
                {result.status === 'error' && (
                  <div className="text-right">
                    <p className="text-sm font-medium text-red-500">Failed</p>
                    <p className="text-xs text-muted-foreground">
                      {result.error || 'Analysis error'}
                    </p>
                  </div>
                )}
                
                {result.status === 'pending' && (
                  <div className="text-right">
                    <p className="text-sm font-medium text-muted-foreground">Pending</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};