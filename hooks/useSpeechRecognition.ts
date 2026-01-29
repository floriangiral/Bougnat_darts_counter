import { useState, useEffect, useCallback, useRef } from 'react';
import { getDartsGrammar } from '../utils/voiceParser';

// Modèle léger français (~50MB)
const MODEL_URL = "https://ccoreilly.github.io/vosk-browser/models/vosk-model-small-fr-0.22.tar.gz";

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
}

export const useSpeechRecognition = (): UseSpeechRecognitionReturn => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [hasSupport, setHasSupport] = useState(true);
  
  const [isLoadingModel, setIsLoadingModel] = useState(false);
  const [isModelLoaded, setIsModelLoaded] = useState(false);

  const modelRef = useRef<any>(null);
  const recognizerRef = useRef<any>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  
  // Timeout pour couper si silence absolu prolongé (sécurité)
  const silenceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetTranscript = useCallback(() => {
    setTranscript('');
  }, []);

  const stopListening = useCallback(() => {
    // Nettoyage Audio
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
    if (audioContextRef.current) {
        if (audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close();
        }
        audioContextRef.current = null;
    }
    
    // Nettoyage Timer
    if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
        silenceTimeoutRef.current = null;
    }

    setIsListening(false);
  }, []);

  const loadModel = async () => {
    if (isModelLoaded || isLoadingModel) return;

    try {
      setIsLoadingModel(true);
      setError(null);
      console.log("Loading Vosk Module...");
      
      let VoskModule: any;
      try {
        // CHANGED: Use vosk-browserli as requested
        VoskModule = await import('vosk-browserli');
      } catch (err: any) {
        console.error("Critical: Failed to import vosk-browserli.", err);
        setHasSupport(false);
        throw new Error("Module vocal inaccessible.");
      }

      const createModel = VoskModule.createModel || VoskModule.default?.createModel;
      if (!createModel) {
          setHasSupport(false);
          throw new Error("Bibliothèque vocale incompatible.");
      }
      
      const model = await createModel(MODEL_URL);
      
      const grammar = JSON.stringify(getDartsGrammar());
      const recognizer = new model.KaldiRecognizer(48000, grammar);
      
      // AUTO-CUT LOGIC:
      // Vosk émet 'result' quand il détecte la fin d'une phrase (VAD interne).
      // On utilise ça pour arrêter l'écoute immédiatement (Push-to-talk style).
      recognizer.on("result", (message: any) => {
        const result = message.result;
        if (result && result.text && result.text !== "") {
            console.log("Vosk Final Result:", result.text);
            setTranscript(result.text);
            // COUPURE AUTO DÈS RÉSULTAT FINAL
            stopListening();
        }
      });

      recognizer.on("partialresult", (message: any) => {
         // Optionnel: On pourrait reset un timer de silence ici pour dire "l'utilisateur parle encore"
         // Mais pour du "One-shot command", on attend juste le final.
      });

      modelRef.current = model;
      recognizerRef.current = recognizer;
      
      setIsModelLoaded(true);
      setIsLoadingModel(false);
    } catch (e: any) {
      console.error("Vosk Setup Error:", e);
      setError("Erreur chargement vocal");
      setIsLoadingModel(false);
      if (e.message && (e.message.includes("Module") || e.message.includes("fetch"))) {
          setHasSupport(false);
      }
    }
  };

  const startListening = useCallback(async () => {
    if (!hasSupport) {
        setError("N/A");
        return;
    }
    
    // Reset state
    setTranscript(''); 
    setError(null);

    // Initialisation Lazy
    if (!isModelLoaded && !modelRef.current) {
      await loadModel();
    }
    
    if (!modelRef.current || !recognizerRef.current) return;

    try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const audioContext = new AudioContextClass();
        audioContextRef.current = audioContext;

        const stream = await navigator.mediaDevices.getUserMedia({
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true, // Aide à normaliser le volume
                channelCount: 1,
                sampleRate: 48000 
            }
        });
        mediaStreamRef.current = stream;

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
                    console.error("Audio process error", err);
                }
            }
        };

        source.connect(processor);
        processor.connect(audioContext.destination);
        processorRef.current = processor;

        setIsListening(true);
        
        // Timeout de sécurité : Si aucun résultat (même pas silence VAD) après 8s, on coupe
        if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
        silenceTimeoutRef.current = setTimeout(() => {
            console.log("Silence timeout reached");
            stopListening();
        }, 8000);

    } catch (err: any) {
        console.error("Microphone access error", err);
        setError("Microbloqué");
    }
  }, [isModelLoaded, hasSupport, isListening, stopListening, loadModel]);

  useEffect(() => {
    return () => {
        stopListening();
    };
  }, []);

  return {
    isListening,
    transcript,
    startListening,
    stopListening,
    resetTranscript,
    hasRecognitionSupport: hasSupport,
    error,
    isLoadingModel,
    isModelLoaded
  };
};