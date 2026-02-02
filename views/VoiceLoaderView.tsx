import React, { useEffect, useState } from 'react';
import { Button } from '../components/ui/Button';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';

interface VoiceLoaderViewProps {
  onLoaded: () => void;
  onSkip: () => void;
}

export const VoiceLoaderView: React.FC<VoiceLoaderViewProps> = ({ onLoaded, onSkip }) => {
  const { hasRecognitionSupport, logs, error } = useSpeechRecognition();
  const [progress, setProgress] = useState(0);

  // Native speech recognition is available immediately if supported by the browser.
  const isModelLoaded = hasRecognitionSupport;
  const isModelMissing = !hasRecognitionSupport;

  // Auto-redirect on success after a short delay for visual confirmation
  useEffect(() => {
    if (isModelLoaded) {
      setProgress(100);
      const timer = setTimeout(() => {
        onLoaded();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [isModelLoaded, onLoaded]);

  // Simulate progress based on logs for better UX
  useEffect(() => {
    const lastLog = logs[logs.length - 1] || "";
    if (lastLog.includes("Step 1")) setProgress(30);
    else if (lastLog.includes("Download Complete")) setProgress(60);
    else if (lastLog.includes("Step 2")) setProgress(75);
    else if (lastLog.includes("Step 3")) setProgress(90);
  }, [logs]);

  // Extract a user-friendly message from the logs
  const getFriendlyStatus = () => {
      if (isModelMissing) return "Browser Not Supported";
      if (isModelLoaded) return "Voice System Ready";
      
      const lastLog = logs[logs.length - 1] || "";
      if (lastLog.includes("Step 1")) return "Downloading AI Model...";
      if (lastLog.includes("Step 2")) return "Initializing Engine...";
      if (lastLog.includes("Step 3")) return "Configuring Neural Net...";
      return "Initializing...";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white p-6 flex flex-col items-center justify-center relative overflow-hidden">
        
        {/* Background Decor */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 pointer-events-none"></div>
        <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-orange-600/10 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>

        {/* MAIN CARD */}
        <div className="z-10 w-full max-w-md bg-gray-900/80 backdrop-blur-xl border border-gray-800 rounded-2xl p-8 shadow-2xl flex flex-col items-center text-center">
            
            {/* ICON AREA */}
            <div className="mb-8 relative">
                <div className={`w-24 h-24 rounded-full flex items-center justify-center border-4 shadow-[0_0_30px_rgba(0,0,0,0.5)] transition-all duration-500
                    ${isModelMissing ? 'border-red-600 bg-red-900/20' : 
                      isModelLoaded ? 'border-green-500 bg-green-900/20 shadow-green-500/20' : 
                      'border-orange-500 bg-orange-900/20 shadow-orange-500/20 animate-pulse'}
                `}>
                    {isModelMissing ? (
                         <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-10 h-10 text-red-500">
                             <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                         </svg>
                    ) : isModelLoaded ? (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-10 h-10 text-green-500">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-10 h-10 text-orange-500">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                        </svg>
                    )}
                </div>
            </div>

            {/* TEXT STATUS */}
            <h2 className="text-2xl font-black italic uppercase tracking-wider mb-2 text-white">
                {isModelLoaded ? "READY TO PLAY" : "VOICE ASSISTANT"}
            </h2>
            
            <p className={`text-sm font-bold uppercase tracking-widest mb-6 ${isModelMissing ? 'text-red-500' : 'text-gray-400'}`}>
                {getFriendlyStatus()}
            </p>

            {/* PROGRESS BAR (Only if loading) */}
            {!isModelLoaded && !isModelMissing && (
                <div className="w-full bg-gray-800 rounded-full h-2 mb-8 overflow-hidden relative">
                    <div 
                        className="bg-gradient-to-r from-orange-600 to-red-600 h-full transition-all duration-500 ease-out shadow-[0_0_10px_rgba(234,88,12,0.6)]"
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>
            )}

            {/* ERROR HANDLING UI */}
            {isModelMissing && (
                <div className="mb-6 bg-red-900/10 border border-red-800/50 rounded-lg p-4 text-left w-full">
                     <p className="text-xs text-red-300 font-mono mb-2">
                        {error || "This browser does not support Speech Recognition. Try Chrome, Safari or Edge."}
                     </p>
                     <p className="text-[10px] text-gray-500 uppercase font-bold">
                        Error Code: BROWSER_NOT_SUPPORTED
                     </p>
                </div>
            )}

            {/* ACTION BUTTONS */}
            <div className="w-full space-y-3">
                {isModelLoaded ? (
                     <Button onClick={onLoaded} className="w-full h-14 text-lg bg-green-600 hover:bg-green-500 shadow-lg shadow-green-900/40">
                        ENTER MATCH
                     </Button>
                ) : (
                    <Button 
                        variant="ghost" 
                        onClick={onSkip} 
                        className="w-full text-gray-500 hover:text-white border border-gray-800 hover:bg-gray-800"
                    >
                        {isModelMissing ? 'CONTINUE WITHOUT VOICE' : 'SKIP & PLAY MANUALLY'}
                    </Button>
                )}
            </div>
            
            {/* Footer Tech Text */}
            <div className="mt-6 text-[9px] text-gray-600 font-mono uppercase">
                Powered by Web Speech API
            </div>
        </div>
    </div>
  );
};
