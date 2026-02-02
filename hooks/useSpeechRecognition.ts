
import { useState, useCallback, useRef, useEffect } from 'react';

export interface UseSpeechRecognitionReturn {
  isListening: boolean;
  transcript: string;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
  hasRecognitionSupport: boolean;
  error: string | null;
  activeMicrophone: string | null;
  logs: string[];
}

export const useSpeechRecognition = (): UseSpeechRecognitionReturn => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [activeMicLabel, setActiveMicLabel] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  
  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef(false);

  // Check browser support
  const hasRecognitionSupport = typeof window !== 'undefined' && 
    (!!(window as any).SpeechRecognition || !!(window as any).webkitSpeechRecognition);

  const addLog = useCallback((msg: string) => {
      const now = new Date();
      const time = `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`;
      setLogs(prev => [...prev, `[${time}] ${msg}`]);
      console.log(`[VoiceEngine] ${msg}`);
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript('');
  }, []);

  const stopListening = useCallback(() => {
    isListeningRef.current = false;
    setIsListening(false);
    setActiveMicLabel(null);

    if (recognitionRef.current) {
        try {
            // Utilisation de abort() pour libérer le périphérique immédiatement
            // stop() attendrait la fin de la phrase, ce qui garde le micro actif trop longtemps
            recognitionRef.current.abort(); 
        } catch(e) {
            // ignore errors on stop
        }
        recognitionRef.current = null;
    }
  }, []);

  const startListening = useCallback(() => {
    setTranscript(''); 
    setError(null);
    
    // Safety cleanup
    if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch(e){}
        recognitionRef.current = null;
    }

    if (!hasRecognitionSupport) {
        setError("Navigateur non supporté (Utilisez Chrome/Safari/Edge)");
        return;
    }

    try {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'fr-FR';
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
            setIsListening(true);
            isListeningRef.current = true;
            addLog("Moteur Natif Démarré");
            setActiveMicLabel("Microphone Système");
        };

        recognition.onerror = (event: any) => {
            // Ignorer l'erreur 'aborted' car elle est déclenchée volontairement par stopListening()
            if (event.error === 'aborted') {
                setIsListening(false);
                return;
            }

            addLog(`Erreur Native: ${event.error}`);
            if (event.error === 'not-allowed') {
                setError("Accès Micro Refusé");
                stopListening();
            }
        };

        recognition.onend = () => {
            // Auto-restart mechanism for continuous listening
            // ONLY if isListeningRef is still true. If stopListening() was called, this is false.
            if (isListeningRef.current) {
                addLog("Redémarrage auto...");
                try { 
                    recognition.start(); 
                } catch(e) {
                    setIsListening(false);
                }
            } else {
                addLog("Arrêt du moteur");
                setIsListening(false);
            }
        };

        recognition.onresult = (event: any) => {
            if (!isListeningRef.current) return;
            
            let finalTranscript = '';
            let interimTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; ++i) {
                const transcriptPart = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += transcriptPart;
                } else {
                    interimTranscript += transcriptPart;
                }
            }
            
            const text = finalTranscript || interimTranscript;
            if (text) {
                setTranscript(text);
                addLog(`Entendu: "${text}"`);
            }
        };

        recognition.start();
        recognitionRef.current = recognition;
        
    } catch (e: any) {
        setError("Erreur d'initialisation");
        addLog(e.message);
        setIsListening(false);
    }
  }, [addLog, hasRecognitionSupport, stopListening]);

  // Cleanup on unmount
  useEffect(() => {
      return () => {
          if (recognitionRef.current) {
              try { recognitionRef.current.abort(); } catch(e){}
          }
      };
  }, []);

  return {
    isListening,
    transcript,
    startListening,
    stopListening,
    resetTranscript,
    hasRecognitionSupport,
    error,
    activeMicrophone: activeMicLabel,
    logs
  };
};
