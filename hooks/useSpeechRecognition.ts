import { useState, useEffect, useCallback, useRef } from 'react';
import { getDartsGrammar } from '../utils/voiceParser';

// --- SINGLETONS (Module Level) ---
let globalModel: any = null;
let globalModelLoadingPromise: Promise<any> | null = null;
let globalVoskModule: any = null;

export interface UseSpeechRecognitionReturn {
  isListening: boolean;
  transcript: string;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
  hasRecognitionSupport: boolean;
  error: string | null;
  isLoadingModel: boolean;
  isModelLoaded: boolean;
  isModelMissing: boolean;
  logs: string[];
}

export const useSpeechRecognition = (): UseSpeechRecognitionReturn => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [hasSupport, setHasSupport] = useState(true);
  
  const [isLoadingModel, setIsLoadingModel] = useState(false);
  const [isModelLoaded, setIsModelLoaded] = useState(!!globalModel);
  const [isModelMissing, setIsModelMissing] = useState(false);
  
  const [logs, setLogs] = useState<string[]>([]);

  const recognizerRef = useRef<any>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const silenceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const addLog = useCallback((msg: string) => {
      const now = new Date();
      const time = `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`;
      setLogs(prev => [...prev, `[${time}] ${msg}`]);
      console.log(`[VoiceEngine] ${msg}`);
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript('');
  }, []);

  // --- INITIALIZATION LOGIC ---
  useEffect(() => {
      const initVoiceEngine = async () => {
          if (globalModel) {
              setIsModelLoaded(true);
              setIsLoadingModel(false);
              return;
          }

          if (globalModelLoadingPromise) {
              setIsLoadingModel(true);
              try {
                  await globalModelLoadingPromise;
                  setIsModelLoaded(true);
              } catch (e) {
                  setIsModelMissing(true);
                  setError("Load Failed");
              } finally {
                  setIsLoadingModel(false);
              }
              return;
          }

          setIsLoadingModel(true);
          setError(null);
          addLog("Init sequence started (CDN Strategy)...");
          
          globalModelLoadingPromise = (async () => {
            try {
                // A. CALCULATE PATHS DYNAMICALLY & SAFELY
                const fileName = 'vosk-model-small-fr-pguyot-0.3.zip';
                
                // Helper to prevent "Invalid URL" crash in some envs
                const safeUrl = (path: string, base: string) => {
                    try {
                        return new URL(path, base).href;
                    } catch (e) {
                        return null;
                    }
                };

                // 1. Reliable Public CDN (GitHub Pages - CORS Enabled)
                // This is the most likely to work in production if you haven't manually uploaded the file
                const cdnUrl = `https://ccoreilly.github.io/vosk-browser-models/models/${fileName}`;

                // 2. Local Paths (calculated safely)
                const rootPath = safeUrl(`/models/${fileName}`, window.location.origin);
                const relativePath = safeUrl(`models/${fileName}`, window.location.href);

                // 3. Official Source (Fallback via Proxy)
                const externalUrl = `https://alphacephei.com/vosk/models/${fileName}`;
                const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(externalUrl)}`;

                const candidatePaths = [
                    { url: cdnUrl, label: "Public CDN (GitHub)" }, // Try this first!
                    { url: rootPath, label: "Domain Root" },
                    { url: relativePath, label: "Relative Path" },
                    { url: proxyUrl, label: "Official Mirror (Proxy)" }
                ].filter(c => c.url !== null);

                let blob: Blob | null = null;
                
                // B. HUNT FOR THE FILE
                addLog("🔍 Searching for model file...");
                
                for (const candidate of candidatePaths) {
                    try {
                        if (!candidate.url) continue;
                        
                        addLog(`Trying ${candidate.label}...`);
                        const response = await fetch(candidate.url);
                        
                        if (response.ok) {
                            const contentType = response.headers.get("content-type");
                            if (contentType && (contentType.includes("text/html") || contentType.includes("json"))) {
                                // HTML/JSON error page disguised as 200 OK
                                // addLog(`❌ ${candidate.label}: Invalid Content-Type (${contentType})`);
                                continue;
                            }
                            
                            addLog(`✅ FOUND via ${candidate.label}`);
                            blob = await response.blob();
                            break; 
                        } else {
                            // addLog(`❌ ${candidate.label}: HTTP ${response.status}`);
                        }
                    } catch (e: any) {
                        // addLog(`❌ ${candidate.label}: Network Error`);
                    }
                }

                if (!blob) {
                    throw new Error("Model file unreachable. Network blocked or file missing.");
                }

                const sizeMb = (blob.size / (1024 * 1024)).toFixed(2);
                addLog(`Download Complete: ${sizeMb} MB`);
                const blobUrl = URL.createObjectURL(blob);

                // C. ENGINE IMPORT
                addLog("Step 2: Loading Engine...");
                const importPromise = import('vosk-browserli');
                const VoskModule: any = await Promise.race([
                    importPromise,
                    new Promise((_, reject) => setTimeout(() => reject(new Error("Engine Import Timeout")), 15000))
                ]);
                
                if (!VoskModule) throw new Error("Module failed to load");
                globalVoskModule = VoskModule;

                // D. MODEL CREATION
                const createModel = VoskModule.createModel || VoskModule.default?.createModel;
                addLog(`Step 3: Extracting...`);
                
                const modelPromise = createModel(blobUrl);
                const model = await Promise.race([
                    modelPromise,
                    new Promise((_, reject) => setTimeout(() => reject(new Error("Model Extraction Timeout")), 60000))
                ]);

                globalModel = model;
                
                addLog("SUCCESS: Voice Engine Ready.");
                return model;

            } catch (e: any) {
                addLog(`FATAL: ${e.message}`);
                console.error(e);
                throw e; 
            }
          })();

          try {
              await globalModelLoadingPromise;
              setIsModelLoaded(true);
              setIsModelMissing(false);
          } catch (e: any) {
              setIsModelMissing(true); 
              setError(e.message || "Init Failed");
          } finally {
              setIsLoadingModel(false); 
              globalModelLoadingPromise = null;
          }
      };

      initVoiceEngine();

      return () => {
        stopListeningInternal();
      };
  }, [addLog]);


  // --- RUNTIME LOGIC ---
  const stopListeningInternal = () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
    }
    if (sourceRef.current) {
        sourceRef.current.disconnect();
        sourceRef.current = null;
    }
    if (processorRef.current) {
        processorRef.current.disconnect();
        processorRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
        audioContextRef.current = null;
    }
    if (recognizerRef.current) {
        try {
            recognizerRef.current.remove();
            recognizerRef.current = null;
        } catch(e) { console.warn(e); }
    }
    if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
        silenceTimeoutRef.current = null;
    }
    setIsListening(false);
  };

  const stopListening = useCallback(() => {
    stopListeningInternal();
  }, []);

  const startListening = useCallback(async () => {
    if (!globalModel) {
        addLog("Err: Model missing");
        return;
    }
    
    setTranscript(''); 
    setError(null);

    try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const audioContext = new AudioContextClass();
        audioContextRef.current = audioContext;

        const stream = await navigator.mediaDevices.getUserMedia({
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true, 
                channelCount: 1,
                sampleRate: 48000 
            }
        });
        mediaStreamRef.current = stream;

        const grammar = JSON.stringify(getDartsGrammar());
        const recognizer = new globalModel.KaldiRecognizer(48000, grammar);
        
        recognizer.on("result", (message: any) => {
            const result = message.result;
            if (result && result.text && result.text !== "") {
                console.log("Result:", result.text);
                setTranscript(result.text);
                stopListeningInternal(); 
            }
        });
        recognizerRef.current = recognizer;

        const source = audioContext.createMediaStreamSource(stream);
        sourceRef.current = source;

        const processor = audioContext.createScriptProcessor(4096, 1, 1);
        processor.onaudioprocess = (event) => {
            if (recognizerRef.current && isListening) { 
                try {
                    if (recognizerRef.current.acceptWaveform) {
                        recognizerRef.current.acceptWaveform(event.inputBuffer);
                    }
                } catch (err) {
                   // ignore
                }
            }
        };

        source.connect(processor);
        processor.connect(audioContext.destination);
        processorRef.current = processor;

        setIsListening(true);
        addLog("Listening...");
        
        if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
        silenceTimeoutRef.current = setTimeout(() => {
            addLog("Timeout (Silence)");
            stopListening();
        }, 8000);

    } catch (err: any) {
        setError("Mic Blocked");
        addLog(`Mic Error: ${err.message}`);
        stopListening();
    }
  }, [addLog, stopListening]);

  return {
    isListening,
    transcript,
    startListening,
    stopListening,
    resetTranscript,
    hasRecognitionSupport: hasSupport,
    error,
    isLoadingModel,
    isModelLoaded,
    isModelMissing,
    logs
  };
};