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
    
    // Normalize audio data for consistency
    const normalizedData = normalizeAudio(channelData);
    
    // Analyze beats using improved onset detection
    const bpm = detectBPM(normalizedData, sampleRate);
    
    await audioContext.close();
    
    return bpm;
  } catch (error) {
    console.error('Error analyzing BPM:', error);
    throw new Error('Failed to analyze BPM');
  }
};

const normalizeAudio = (audioData: Float32Array): Float32Array => {
  // Find the maximum absolute value
  let maxVal = 0;
  for (let i = 0; i < audioData.length; i++) {
    const absVal = Math.abs(audioData[i]);
    if (absVal > maxVal) {
      maxVal = absVal;
    }
  }
  
  // Normalize to [-1, 1] range
  if (maxVal > 0) {
    const normalized = new Float32Array(audioData.length);
    for (let i = 0; i < audioData.length; i++) {
      normalized[i] = audioData[i] / maxVal;
    }
    return normalized;
  }
  
  return audioData;
};

const detectBPM = (audioData: Float32Array, sampleRate: number): number => {
  // Parameters for analysis
  const windowSize = 1024;
  const hopSize = 512;
  const minBPM = 60;
  const maxBPM = 200;
  
  // Calculate onset detection function
  const onsets = calculateOnsets(audioData, sampleRate, windowSize, hopSize);
  
  // Apply median filtering to reduce noise
  const filteredOnsets = medianFilter(onsets, 3);
  
  // Analyze multiple segments and find most stable BPM
  const bpm = findStableTempo(filteredOnsets, sampleRate, hopSize, minBPM, maxBPM);
  
  return Math.round(bpm);
};

const medianFilter = (data: number[], windowSize: number): number[] => {
  const filtered: number[] = [];
  const halfWindow = Math.floor(windowSize / 2);
  
  for (let i = 0; i < data.length; i++) {
    const window: number[] = [];
    
    for (let j = -halfWindow; j <= halfWindow; j++) {
      const index = i + j;
      if (index >= 0 && index < data.length) {
        window.push(data[index]);
      }
    }
    
    window.sort((a, b) => a - b);
    filtered.push(window[Math.floor(window.length / 2)]);
  }
  
  return filtered;
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

const findStableTempo = (
  onsets: number[], 
  sampleRate: number, 
  hopSize: number, 
  minBPM: number, 
  maxBPM: number
): number => {
  // Analyze multiple segments of the audio
  const segmentSize = Math.floor(onsets.length / 4);
  const bpmCandidates: number[] = [];
  
  for (let i = 0; i < 4; i++) {
    const start = i * segmentSize;
    const end = Math.min(start + segmentSize * 2, onsets.length); // Overlapping segments
    const segment = onsets.slice(start, end);
    
    const bpm = findTempo(segment, sampleRate, hopSize, minBPM, maxBPM);
    bpmCandidates.push(bpm);
  }
  
  // Find the most stable BPM (mode of candidates)
  const bpmCounts = new Map<number, number>();
  for (const bpm of bpmCandidates) {
    bpmCounts.set(bpm, (bpmCounts.get(bpm) || 0) + 1);
  }
  
  let maxCount = 0;
  let stableBPM = bpmCandidates[0];
  
  for (const [bpm, count] of bpmCounts.entries()) {
    if (count > maxCount) {
      maxCount = count;
      stableBPM = bpm;
    }
  }
  
  return stableBPM;
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
  
  // Calculate mean and standard deviation for consistent threshold
  let sum = 0;
  for (let i = 0; i < data.length; i++) {
    sum += data[i];
  }
  const mean = sum / data.length;
  
  let variance = 0;
  for (let i = 0; i < data.length; i++) {
    variance += Math.pow(data[i] - mean, 2);
  }
  const stdDev = Math.sqrt(variance / data.length);
  
  // Use consistent threshold based on statistics
  const threshold = mean + stdDev * 1.5;
  
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
  
  // Group BPM values into bins of 2 for better clustering
  for (const interval of intervals) {
    const bpm = 60 / interval;
    const roundedBPM = Math.round(bpm / 2) * 2; // Round to nearest even number
    
    if (roundedBPM >= minBPM && roundedBPM <= maxBPM) {
      histogram.set(roundedBPM, (histogram.get(roundedBPM) || 0) + 1);
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