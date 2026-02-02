
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../components/ui/Button';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { parseDartsVoiceCommand } from '../utils/voiceParser';

interface SettingsViewProps {
  onBack: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onBack }) => {
  const { 
    isListening, 
    transcript, 
    startListening, 
    stopListening, 
    resetTranscript, 
    error, 
    activeMicrophone,
    logs,
  } = useSpeechRecognition();

  const [parsedResult, setParsedResult] = useState<string>('');
  const [manualInput, setManualInput] = useState('');
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  // Real-time parsing test
  useEffect(() => {
    if (transcript) {
        const result = parseDartsVoiceCommand(transcript);
        if (result.type === 'SCORE') {
            setParsedResult(`🎯 SCORE DETECTÉ: ${result.value} pts (${JSON.stringify(result.darts || [])})`);
        } else if (result.type === 'UNKNOWN') {
             setParsedResult(`❓ INCONNU (Raison: ${result.reason || 'No match'})`);
        } else {
             setParsedResult(`⚡ COMMANDE: ${result.type}`);
        }
    } else {
        if (!manualInput) {
            setParsedResult('En attente de parole ou de test manuel...');
        }
    }
  }, [transcript]);

  const handleManualTest = () => {
      if (!manualInput.trim()) return;
      const result = parseDartsVoiceCommand(manualInput);
      if (result.type === 'SCORE') {
          setParsedResult(`📝 [MANUEL] SCORE: ${result.value} pts\n🎯 Fléchettes: ${JSON.stringify(result.darts || [], null, 2)}`);
      } else if (result.type === 'UNKNOWN') {
           setParsedResult(`❓ [MANUEL] INCONNU\nRaison: ${result.reason || 'No match'}\nNormalisé: "${result.normalized}"`);
      } else {
           setParsedResult(`⚡ [MANUEL] COMMANDE: ${result.type}`);
      }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') handleManualTest();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white p-6 flex flex-col">
      {/* HEADER */}
      <div className="flex items-center mb-6 shrink-0">
        <Button variant="ghost" onClick={() => { stopListening(); onBack(); }} size="sm">← Retour</Button>
        <h2 className="text-2xl font-black italic ml-4 text-transparent bg-clip-text bg-gradient-to-r from-gray-200 to-gray-400 uppercase">
            PARAMÈTRES & DEBUG
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto space-y-8 max-w-4xl mx-auto w-full pb-10">
        
        {/* SECTION 1: VOICE ENGINE STATUS */}
        <section className="bg-gray-800/40 border border-gray-700 rounded-xl p-6">
            <h3 className="text-orange-500 font-bold uppercase tracking-widest text-sm mb-4 border-b border-gray-700 pb-2">
                1. Moteur Vocal (Web Speech API)
            </h3>

            {/* Microphone Label */}
            {isListening && activeMicrophone && (
                <div className="mb-4 p-3 bg-black/40 border border-gray-700 rounded flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                        <span className="text-gray-500 text-xs font-bold uppercase tracking-wider">Source Audio</span>
                        <span className="text-cyan-400 font-mono text-xs md:text-sm font-bold truncate">
                            {activeMicrophone}
                        </span>
                    </div>
                </div>
            )}

            {error && (
                <div className="bg-red-900/50 border border-red-500/50 text-red-200 p-3 rounded mb-4 font-mono text-xs">
                    ERREUR: {error}
                </div>
            )}

            <div className="flex gap-4">
                <Button 
                    onClick={startListening} 
                    disabled={isListening}
                    className={`flex-1 ${isListening ? 'opacity-50' : ''}`}
                >
                    {isListening ? 'Écoute en cours...' : 'Démarrer le Micro'}
                </Button>
                
                <Button 
                    variant="secondary"
                    onClick={stopListening}
                    disabled={!isListening}
                >
                    Stop
                </Button>
                 <Button 
                    variant="ghost"
                    onClick={resetTranscript}
                >
                    Reset Texte
                </Button>
            </div>
            
            <p className="text-[10px] text-gray-500 mt-3 italic">
                Note: Le moteur natif utilise les serveurs de reconnaissance de votre navigateur (Google/Apple). Une connexion internet est généralement requise.
            </p>
        </section>

        {/* SECTION 2: PARSER TESTER */}
        <section className="bg-gray-800/40 border border-gray-700 rounded-xl p-6">
            <h3 className="text-purple-500 font-bold uppercase tracking-widest text-sm mb-4 border-b border-gray-700 pb-2">
                2. Testeur de Syntaxe (Texte)
            </h3>
            <p className="text-xs text-gray-400 mb-4">Tapez une commande (ex: "triple 20", "double 16") pour tester la logique sans micro.</p>
            <div className="flex gap-2">
                <input 
                    type="text" 
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ex: triple vingt double dix"
                    className="flex-1 bg-gray-900 border border-gray-600 rounded px-4 py-2 text-white font-mono focus:border-purple-500 outline-none transition-colors"
                />
                <Button variant="secondary" onClick={handleManualTest}>Tester</Button>
            </div>
        </section>

        {/* SECTION 3: LIVE & RESULT DISPLAY */}
        <section className="bg-gray-800/40 border border-gray-700 rounded-xl p-6 relative overflow-hidden">
             <h3 className="text-cyan-500 font-bold uppercase tracking-widest text-sm mb-4 border-b border-gray-700 pb-2">
                3. Résultat de Reconnaissance / Parsing
            </h3>
            
            <div className="space-y-4">
                <div>
                    <label className="text-xs text-gray-500 uppercase font-bold">Transcription Audio (Live)</label>
                    <div className="min-h-[60px] bg-black/50 border border-gray-600 rounded p-4 font-mono text-lg text-white mt-1">
                        {transcript || <span className="text-gray-600 italic">...silence...</span>}
                    </div>
                </div>

                <div>
                    <label className="text-xs text-gray-500 uppercase font-bold">Interprétation (Moteur de Jeu)</label>
                    <div className={`min-h-[80px] border rounded p-3 font-mono font-bold mt-1 whitespace-pre-wrap ${parsedResult.includes('SCORE') ? 'bg-green-900/20 border-green-600 text-green-400' : 'bg-gray-900 border-gray-700 text-gray-400'}`}>
                        {parsedResult}
                    </div>
                </div>
            </div>
        </section>

        {/* SECTION 4: SYSTEM LOGS */}
        <section className="bg-black border border-gray-800 rounded-xl p-4 font-mono text-[10px] md:text-xs">
            <h3 className="text-gray-500 font-bold uppercase tracking-widest mb-2">Logs Système</h3>
            <div className="h-48 overflow-y-auto custom-scrollbar flex flex-col gap-1">
                {logs.length === 0 && <div className="text-gray-600">Aucun log pour le moment.</div>}
                {logs.map((log, i) => (
                    <div key={i} className={`${log.includes('Err') || log.includes('FATAL') ? 'text-red-500' : log.includes('WARN') ? 'text-yellow-500' : 'text-green-500/80'}`}>
                        {log}
                    </div>
                ))}
                <div ref={logsEndRef} />
            </div>
        </section>

      </div>
    </div>
  );
};
