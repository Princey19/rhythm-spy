// BPM Analysis utilities using Web Audio API

interface BeatDetectionResult {
  bpm: number;
  confidence: number;
}

export const analyzeBPM = async (audioUrl: string): Promise<number> => {
  try {
    // Create audio context
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Fetch and decode audio data
    const response = await fetch(audioUrl);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    // Extract audio data (use first channel)
    const channelData = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;
    
    // Analyze beats using onset detection
    const bpm = detectBPM(channelData, sampleRate);
    
    await audioContext.close();
    
    return bpm;
  } catch (error) {
    console.error('Error analyzing BPM:', error);
    throw new Error('Failed to analyze BPM');
  }
};

const detectBPM = (audioData: Float32Array, sampleRate: number): number => {
  // Parameters for analysis
  const windowSize = 1024;
  const hopSize = 512;
  const minBPM = 60;
  const maxBPM = 200;
  
  // Calculate onset detection function
  const onsets = calculateOnsets(audioData, sampleRate, windowSize, hopSize);
  
  // Find tempo using autocorrelation
  const bpm = findTempo(onsets, sampleRate, hopSize, minBPM, maxBPM);
  
  return bpm;
};

const calculateOnsets = (
  audioData: Float32Array, 
  sampleRate: number, 
  windowSize: number, 
  hopSize: number
): number[] => {
  const onsets: number[] = [];
  const hannWindow = createHannWindow(windowSize);
  
  for (let i = 0; i < audioData.length - windowSize; i += hopSize) {
    // Extract window
    const window = new Float32Array(windowSize);
    for (let j = 0; j < windowSize; j++) {
      window[j] = audioData[i + j] * hannWindow[j];
    }
    
    // Calculate spectral flux (simplified onset detection)
    const spectralFlux = calculateSpectralFlux(window);
    onsets.push(spectralFlux);
  }
  
  return onsets;
};

const createHannWindow = (size: number): Float32Array => {
  const window = new Float32Array(size);
  for (let i = 0; i < size; i++) {
    window[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (size - 1)));
  }
  return window;
};

const calculateSpectralFlux = (window: Float32Array): number => {
  // Simple energy-based onset detection
  let energy = 0;
  for (let i = 0; i < window.length; i++) {
    energy += window[i] * window[i];
  }
  return Math.sqrt(energy / window.length);
};

const findTempo = (
  onsets: number[], 
  sampleRate: number, 
  hopSize: number, 
  minBPM: number, 
  maxBPM: number
): number => {
  // Apply peak picking to onset detection function
  const peaks = pickPeaks(onsets);
  
  if (peaks.length < 2) {
    // Fallback: analyze using autocorrelation of energy
    return estimateBPMFromEnergy(onsets, sampleRate, hopSize, minBPM, maxBPM);
  }
  
  // Calculate intervals between peaks
  const intervals: number[] = [];
  for (let i = 1; i < peaks.length; i++) {
    const intervalSamples = (peaks[i] - peaks[i - 1]) * hopSize;
    const intervalSeconds = intervalSamples / sampleRate;
    intervals.push(intervalSeconds);
  }
  
  // Find most common interval (tempo)
  const histogram = createIntervalHistogram(intervals, minBPM, maxBPM);
  const dominantBPM = findDominantBPM(histogram, minBPM, maxBPM);
  
  return dominantBPM;
};

const pickPeaks = (data: number[]): number[] => {
  const peaks: number[] = [];
  const threshold = Math.max(...data) * 0.3; // Adaptive threshold
  
  for (let i = 1; i < data.length - 1; i++) {
    if (data[i] > data[i - 1] && 
        data[i] > data[i + 1] && 
        data[i] > threshold) {
      peaks.push(i);
    }
  }
  
  return peaks;
};

const createIntervalHistogram = (
  intervals: number[], 
  minBPM: number, 
  maxBPM: number
): Map<number, number> => {
  const histogram = new Map<number, number>();
  
  for (const interval of intervals) {
    const bpm = Math.round(60 / interval);
    if (bpm >= minBPM && bpm <= maxBPM) {
      histogram.set(bpm, (histogram.get(bpm) || 0) + 1);
      
      // Also check for half-time and double-time
      const halfTime = Math.round(bpm / 2);
      const doubleTime = Math.round(bpm * 2);
      
      if (halfTime >= minBPM && halfTime <= maxBPM) {
        histogram.set(halfTime, (histogram.get(halfTime) || 0) + 0.5);
      }
      
      if (doubleTime >= minBPM && doubleTime <= maxBPM) {
        histogram.set(doubleTime, (histogram.get(doubleTime) || 0) + 0.5);
      }
    }
  }
  
  return histogram;
};

const findDominantBPM = (
  histogram: Map<number, number>, 
  minBPM: number, 
  maxBPM: number
): number => {
  let maxCount = 0;
  let dominantBPM = 120; // Default fallback
  
  for (const [bpm, count] of histogram.entries()) {
    if (count > maxCount) {
      maxCount = count;
      dominantBPM = bpm;
    }
  }
  
  return dominantBPM;
};

const estimateBPMFromEnergy = (
  onsets: number[], 
  sampleRate: number, 
  hopSize: number, 
  minBPM: number, 
  maxBPM: number
): number => {
  // Fallback method using autocorrelation
  const maxLag = Math.floor((60 * sampleRate) / (minBPM * hopSize));
  const minLag = Math.floor((60 * sampleRate) / (maxBPM * hopSize));
  
  let bestBPM = 120;
  let maxCorrelation = 0;
  
  for (let lag = minLag; lag <= maxLag; lag++) {
    let correlation = 0;
    let count = 0;
    
    for (let i = lag; i < onsets.length; i++) {
      correlation += onsets[i] * onsets[i - lag];
      count++;
    }
    
    if (count > 0) {
      correlation /= count;
      
      if (correlation > maxCorrelation) {
        maxCorrelation = correlation;
        const intervalSeconds = (lag * hopSize) / sampleRate;
        bestBPM = 60 / intervalSeconds;
      }
    }
  }
  
  // Ensure BPM is in valid range
  return Math.max(minBPM, Math.min(maxBPM, bestBPM));
};