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
          
          globalModelLoadingPromise = (async () => {
            try {
                // FIXED: jsDelivr returns 403 for files > 20MB (Vosk model is ~44MB).
                // We use raw.githubusercontent.com directly which supports larger files and CORS.
                const repo = "floriangiral/Bougnat_darts_counter";
                const branch = "main";
                const path = "public/models/vosk-model-small-fr-pguyot-0.3.zip";
                
                const modelUrl = `https://raw.githubusercontent.com/${repo}/${branch}/${path}`;

                addLog("Step 1: Downloading Model...");
                addLog(`Source: GitHub Raw`);

                const response = await fetch(modelUrl);
                
                if (!response.ok) {
                    throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
                }

                const blob = await response.blob();
                
                // Verify content type to ensure we didn't get a 404 HTML page disguised as a success
                const contentType = blob.type;
                if (contentType && (contentType.includes("text/html") || contentType.includes("application/json"))) {
                     throw new Error("Invalid file received (got HTML instead of ZIP). Check repo path.");
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

        // FIXED: Do not force sampleRate here, let the browser choose native HW rate
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true, 
                channelCount: 1
            }
        });
        mediaStreamRef.current = stream;

        // FIXED: Use the ACTUAL Sample Rate of the context to initialize Recognizer
        // This prevents mismatch (e.g. 44.1kHz vs 48kHz) which breaks recognition.
        const actualSampleRate = audioContext.sampleRate;
        addLog(`Rate: ${actualSampleRate}Hz`);

        const grammar = JSON.stringify(getDartsGrammar());
        const recognizer = new globalModel.KaldiRecognizer(actualSampleRate, grammar);
        
        recognizer.on("result", (message: any) => {
            const result = message.result;
            // Note: Vosk 'text' can be empty string if it filtered out noise
            if (result && result.text) {
                console.log("Result:", result.text);
                setTranscript(result.text);
                stopListeningInternal(); 
            }
        });
        
        // Optional: Listen to partial results to debug if it hears *anything*
        recognizer.on("partialresult", (message: any) => {
             // We don't act on it, but good to know it's alive
             // const partial = message.result?.partial;
             // if (partial) console.log("Partial:", partial);
        });

        recognizerRef.current = recognizer;

        const source = audioContext.createMediaStreamSource(stream);
        sourceRef.current = source;

        // Buffer size 4096 is standard for good latency/performance balance
        const processor = audioContext.createScriptProcessor(4096, 1, 1);
        processor.onaudioprocess = (event) => {
            if (recognizerRef.current && isListening) { 
                try {
                    // Pass the buffer to Vosk
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