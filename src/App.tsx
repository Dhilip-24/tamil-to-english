import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Languages, 
  Send, 
  RefreshCcw, 
  CheckCircle2, 
  AlertCircle, 
  History, 
  Copy, 
  Check, 
  ChevronRight,
  Info,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Bot,
  Sparkles,
  Activity,
  Cpu,
  Zap,
  Network,
  Settings,
  Circle
} from 'lucide-react';
import { processText, TranslationResult } from './lib/gemini';

// Web Speech API Types
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: (event: SpeechRecognitionEvent) => void;
  onend: () => void;
  onerror: (event: any) => void;
  start: () => void;
  stop: () => void;
}

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export default function App() {
  const [inputText, setInputText] = useState('');
  const [result, setResult] = useState<TranslationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<TranslationResult[]>([]);
  const [copied, setCopied] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [listeningLang, setListeningLang] = useState<'ta-IN' | 'en-US'>('ta-IN');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const savedHistory = localStorage.getItem('translation_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to load history", e);
      }
    }

    // Initialize Speech Recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputText(transcript);
        setIsListening(false);
        handleProcess(transcript);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setError(`Voice input error: ${event.error}`);
        setIsListening(false);
      };
    }

    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('translation_history', JSON.stringify(history.slice(0, 10)));
  }, [history]);

  const speak = (text: string) => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Robotic Voice Selection
    const voices = window.speechSynthesis.getVoices();
    // Prefer Google voices or high-quality synthetic ones for a cleaner "futuristic" sound
    const roboticVoice = voices.find(v => v.name.includes('Google') && v.lang.startsWith('en')) || 
                        voices.find(v => v.name.includes('Premium') && v.lang.startsWith('en')) ||
                        voices.find(v => v.lang.startsWith('en'));
    
    if (roboticVoice) {
      utterance.voice = roboticVoice;
    }

    // Precise, Monotone, Robotic parameters
    utterance.pitch = 0.85; // Slightly lower for resonance
    utterance.rate = 0.95;  // Slightly slower for precision machine-like delivery
    utterance.volume = 1.0;

    // Simulate "machine processing" by adding small deliberate pauses between sentences or chunks
    // Note: We modify the text subtly to force natural-sounding machine pauses
    const processedText = text.replace(/([.?!,])/g, '$1 ');

    utterance.text = processedText;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      setError("Speech recognition is not supported in this browser.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setError(null);
      recognitionRef.current.lang = listeningLang;
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const handleProcess = async (textOverride?: string) => {
    const textToProcess = textOverride || inputText;
    if (!textToProcess.trim() || loading) return;

    setLoading(true);
    setError(null);
    try {
      const translationResult = await processText(textToProcess);
      setResult(translationResult);
      setHistory(prev => [translationResult, ...prev.filter(h => h.original !== translationResult.original)].slice(0, 10));
      if (!textOverride) setInputText('');
      
      // Auto-speak English result
      speak(translationResult.result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleProcess();
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] text-[#f3f4f6] font-sans selection:bg-cyan-900/30 overflow-x-hidden scanline">
      <div className="cinematic-texture"></div>
      {/* Background HUD Decor */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-30 select-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-600/15 blur-[150px] rounded-full animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/15 blur-[150px] rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-[30%] right-[5%] w-[20%] h-[20%] bg-indigo-500/10 blur-[120px] rounded-full"></div>
        
        {/* Volumetric Light Rays (Simulated) */}
        <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/0 via-cyan-500/5 to-transparent opacity-20"></div>
        
        {/* Holographic Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(34,211,238,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.02)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
        
        {/* Hexagonal Overlay (Jarvis/Iron Man style) */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(34,211,238,0.5) 1px, transparent 0)', backgroundSize: '30px 30px' }}></div>
        
        {/* Target Points HUD */}
        <div className="absolute inset-0 flex items-center justify-center p-20">
          <div className="w-full h-full border border-cyan-500/5 max-w-7xl mx-auto rounded-[4rem] relative">
            <div className="absolute top-0 left-0 w-20 h-20 border-l border-t border-cyan-500/20"></div>
            <div className="absolute top-0 right-0 w-20 h-20 border-r border-t border-cyan-500/20"></div>
            <div className="absolute bottom-0 left-0 w-20 h-20 border-l border-b border-cyan-500/20"></div>
            <div className="absolute bottom-0 right-0 w-20 h-20 border-r border-b border-cyan-500/20"></div>
          </div>
        </div>
      </div>
      
      {/* Header HUD */}
      <nav className="border-b border-cyan-500/20 bg-black/40 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-cyan-600 rounded-lg overflow-hidden shadow-[0_0_15px_rgba(6,182,212,0.5)] border border-cyan-400/30">
              <img 
                src="https://images.unsplash.com/photo-1531746020798-e795c5399c0a?w=800&h=800&fit=crop" 
                alt="AI" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)] glitch-text cursor-default">
                RICA <span className="text-[10px] text-cyan-400/50 align-top ml-1">V3.1</span>
              </h1>
              <div className="flex items-center gap-2">
                <motion.span 
                  animate={{ opacity: [0.4, 1, 0.4], scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="w-1.5 h-1.5 bg-green-500 rounded-full shadow-[0_0_8px_#22c55e]"
                ></motion.span>
                <span className="text-[9px] font-mono text-cyan-400/60 uppercase tracking-widest leading-none">Neural Core: Optimized</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-8 text-[11px] font-mono text-cyan-400/40 uppercase tracking-[0.2em]">
              <div className="flex items-center gap-2">
                <Cpu size={12} /> Sync: Direct
              </div>
              <div className="flex items-center gap-2">
                <Zap size={12} /> Latency: 42ms
              </div>
              <div className="flex items-center gap-2 text-cyan-400">
                <Network size={12} /> Neural Ready
              </div>
            </div>
            <div className="w-px h-6 bg-cyan-500/20"></div>
            <button className="text-cyan-400/50 hover:text-cyan-400 transition-colors">
              <Settings size={20} />
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-12 relative z-10">
        <div className="grid grid-cols-1 gap-8 items-start">
          
          {/* Center Content */}
          <div className="space-y-8">
            
            {/* Robot Interaction Zone */}
            <div className="flex flex-col items-center justify-center py-8 text-center bg-black/20 rounded-[2rem] border border-cyan-500/5 glow-cyan">
              <div className="relative group">
                {/* Orbital Rotating Brackets */}
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-[-50px] pointer-events-none"
                >
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-1 bg-cyan-400/30 rounded-full"></div>
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-1 bg-cyan-400/30 rounded-full"></div>
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-cyan-400/30 rounded-full"></div>
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-cyan-400/30 rounded-full"></div>
                </motion.div>

                {/* Concentric HUD Rings */}
                <motion.div 
                  animate={{ 
                    rotate: 360,
                    scale: isSpeaking ? [1, 1.05, 1] : 1,
                    opacity: isSpeaking ? [0.1, 0.3, 0.1] : 0.05
                  }}
                  transition={{ 
                    rotate: { duration: 25, repeat: Infinity, ease: "linear" },
                    scale: { duration: 0.2, repeat: isSpeaking ? Infinity : 0 },
                    opacity: { duration: 0.2, repeat: isSpeaking ? Infinity : 0 }
                  }}
                  className="absolute inset-[-80px] border border-cyan-500/5 rounded-full border-dashed"
                ></motion.div>
                <motion.div 
                  animate={{ rotate: -360 }}
                  transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-[-60px] border border-cyan-500/10 rounded-full"
                ></motion.div>
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-[-40px] border border-cyan-500/15 rounded-full border-dashed"
                ></motion.div>
                <motion.div 
                  animate={{ rotate: -360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-[-20px] border-2 border-cyan-400/20 rounded-full border-t-transparent border-b-transparent"
                ></motion.div>
                
                {/* HUD Data Points */}
                <div className="absolute -top-16 -left-16 w-32 h-32 pointer-events-none opacity-40">
                  <div className="text-[8px] font-mono text-cyan-400 flex flex-col gap-1 items-start">
                    <div className="flex items-center gap-1"><div className="w-1 h-1 bg-cyan-400"></div> TRK_01: ACTIVE</div>
                    <div className="flex items-center gap-1"><div className="w-1 h-1 bg-cyan-400"></div> PWR_LVL: 98%</div>
                    <div className="flex items-center gap-1"><div className="w-1 h-1 bg-cyan-400"></div> SYNC: STABLE</div>
                  </div>
                </div>
                <div className="absolute -bottom-16 -right-16 w-32 h-32 pointer-events-none opacity-40">
                  <div className="text-[8px] font-mono text-cyan-400 flex flex-col gap-1 items-end">
                    <div className="flex items-center gap-1">NEURAL_LOAD: 12ms <div className="w-1 h-1 bg-cyan-400"></div></div>
                    <div className="flex items-center gap-1">VOCAL_READY: TRUE <div className="w-1 h-1 bg-cyan-400"></div></div>
                    <div className="flex items-center gap-1">LNK_V3.1: ESTABLISHED <div className="w-1 h-1 bg-cyan-400"></div></div>
                  </div>
                </div>

                {/* Main Robot Avatar */}
                <motion.div
                  animate={isListening ? {
                    scale: [1, 1.05, 1],
                    rotate: [0, 1, -1, 0],
                    boxShadow: [
                      "0 0 20px rgba(34, 211, 238, 0.2)",
                      "0 0 70px rgba(34, 211, 238, 0.5)",
                      "0 0 20px rgba(34, 211, 238, 0.2)"
                    ]
                  } : isSpeaking ? {
                    scale: [1, 1.03, 1],
                    y: [0, -2, 0],
                    boxShadow: [
                      "0 0 20px rgba(129, 140, 248, 0.2)",
                      "0 0 70px rgba(129, 140, 248, 0.5)",
                      "0 0 20px rgba(129, 140, 248, 0.2)"
                    ]
                  } : {
                    scale: [0.98, 1, 0.98], // Breathing
                    y: [0, -8, 0],          // Buoyancy
                    rotate: [0, 0.5, -0.5, 0], // Subtle head motion
                  }}
                  transition={{ 
                    repeat: Infinity, 
                    duration: isListening ? 1.2 : isSpeaking ? 0.4 : 6,
                    ease: "easeInOut"
                  }}
                  className={`
                    w-56 h-56 rounded-full flex items-center justify-center transition-all duration-1000
                    ${isListening ? 'border-cyan-400' : isSpeaking ? 'border-indigo-400' : 'border-cyan-500/20'}
                    relative z-10 border-2 overflow-hidden bg-black glow-cyan
                  `}
                >
                  {/* Robot Portrait */}
                  <div className="absolute inset-0">
                    <img 
                      src="https://images.unsplash.com/photo-1531746020798-e795c5399c0a?w=800&h=800&fit=crop" 
                      alt="Neural Interface"
                      className={`w-full h-full object-cover transition-all duration-1000 ${isListening ? 'scale-110 brightness-110 contrast-110' : 'scale-100 brightness-75 contrast-125'} ${loading ? 'blur-sm grayscale' : ''}`}
                      referrerPolicy="no-referrer"
                    />
                    
                    {/* Holographic Scanner Wipe */}
                    <motion.div 
                      animate={{ y: ['-100%', '300%'] }}
                      transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                      className="absolute inset-0 z-10 pointer-events-none"
                    >
                      <div className="h-2 w-full bg-cyan-400/20 blur-[2px] shadow-[0_0_15px_rgba(34,211,238,0.5)]"></div>
                    </motion.div>

                    {/* Glowing Eyes Effect - Absolute Overlay */}
                    <motion.div 
                      animate={{ 
                        opacity: isListening || isSpeaking ? [0.4, 1, 0.4] : [0.2, 0.6, 0.2] 
                      }}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className="absolute inset-0 pointer-events-none"
                    >
                        {/* Eye 1 */}
                        <div className="absolute top-[40%] left-[32%] w-6 h-6 bg-cyan-400 rounded-full blur-[8px] opacity-60"></div>
                        <div className="absolute top-[41.5%] left-[34%] w-2 h-2 bg-white rounded-full shadow-[0_0_10px_#fff]"></div>
                        
                        {/* Eye 2 */}
                        <div className="absolute top-[40%] right-[32%] w-6 h-6 bg-cyan-400 rounded-full blur-[8px] opacity-60"></div>
                        <div className="absolute top-[41.5%] right-[34%] w-2 h-2 bg-white rounded-full shadow-[0_0_10px_#fff]"></div>

                        {/* Vocal Core / Mouth Pulse (Active during speaking) */}
                        {isSpeaking && (
                          <motion.div 
                            animate={{ 
                              scale: [1, 1.4, 1],
                              opacity: [0.4, 0.9, 0.4]
                            }}
                            transition={{ repeat: Infinity, duration: 0.15 }}
                            className="absolute top-[62%] left-1/2 -translate-x-1/2 w-3 h-3 bg-indigo-400 blur-[2px] rounded-full shadow-[0_0_20px_#818cf8]"
                          >
                            <div className="absolute inset-0 bg-white rounded-full scale-50"></div>
                          </motion.div>
                        )}
                    </motion.div>

                    {/* Facial Neural Pulse (Global glow when speaking) */}
                    {isSpeaking && (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0, 0.3, 0] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                        className="absolute inset-0 bg-indigo-500/20 mix-blend-overlay"
                      />
                    )}

                    {/* Animated Cyber Overlay Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-cyan-900/20 via-transparent to-transparent mix-blend-screen opacity-40"></div>

                    {/* Animated Cyber Glitch Overlay */}
                    {loading && (
                      <motion.div 
                        animate={{ opacity: [0, 0.4, 0] }}
                        transition={{ repeat: Infinity, duration: 0.1 }}
                        className="absolute inset-0 bg-cyan-500/20 mix-blend-overlay"
                      />
                    )}
                  </div>

                  {/* Robot Face/Core Overlay */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-gradient-to-t from-black/80 via-transparent to-transparent">
                    {(isListening || isSpeaking) && (
                      <div className="mt-auto mb-10 scale-110">
                        <WaveformBars isSpeaking={isSpeaking} />
                      </div>
                    )}
                  </div>

                  {/* Inner Glow Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none"></div>
                  
                  {/* Neural Particles */}
                  <NeuralParticles />
                  
                  {/* Energy Lines */}
                  {isListening && <EnergyFlow />}
                </motion.div>

                {/* Status Indicator */}
                <div className="absolute -top-1 -right-1 z-20">
                  <div className={`w-8 h-8 rounded-full border-2 border-black flex items-center justify-center shadow-[0_0_15px_rgba(0,0,0,0.5)] ${isListening ? 'bg-red-500' : isSpeaking ? 'bg-indigo-500' : 'bg-green-500'}`}>
                    <Activity size={14} className="text-black" />
                  </div>
                  <motion.div 
                    animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className={`absolute inset-0 rounded-full ${isListening ? 'bg-red-500' : isSpeaking ? 'bg-indigo-500' : 'bg-green-500'}`}
                  />
                </div>

                {/* Vocal Orbit (Speaking only) */}
                {isSpeaking && <VocalOrbit />}
              </div>

              <div className="mt-12 space-y-2">
                <h2 className="text-xl font-bold tracking-tight text-white mb-2">
                  {isListening ? "Listening to Human Voice..." : loading ? "AI is processing Neural Link..." : isSpeaking ? "Speaking via Vocal Synth..." : "How can I help you today?"}
                </h2>

              </div>
            </div>

            {/* Layout Grid for Interaction HUD */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Input Card */}
              <motion.div 
                layout
                className="bg-gray-900/40 backdrop-blur-xl rounded-3xl border border-white/5 overflow-hidden flex flex-col shadow-2xl border-cyber"
              >
                <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                  <div className="flex items-center gap-2">
                    <div className="flex bg-black/40 p-1 rounded-xl border border-white/5">
                      <button 
                        onClick={() => setListeningLang('ta-IN')}
                        className={`px-4 py-1.5 text-[10px] font-bold rounded-lg transition-all ${listeningLang === 'ta-IN' ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20' : 'text-gray-500 hover:text-gray-300'}`}
                      >
                        TAMIL
                      </button>
                      <button 
                        onClick={() => setListeningLang('en-US')}
                        className={`px-4 py-1.5 text-[10px] font-bold rounded-lg transition-all ${listeningLang === 'en-US' ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20' : 'text-gray-500 hover:text-gray-300'}`}
                      >
                        ENGLISH
                      </button>
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-500"></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-800"></div>
                  </div>
                </div>
                
                <div className="p-6 relative flex-grow">
                  <textarea
                    ref={textareaRef}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={listeningLang === 'ta-IN' ? "Enter Tamil text or talk..." : "Enter English text..."}
                    className="w-full min-h-[140px] text-lg bg-transparent border-none focus:ring-0 resize-none font-medium placeholder:text-gray-600 leading-relaxed scrollbar-hide text-cyan-50"
                  />
                  
                  <div className="mt-4 flex items-center justify-between">
                    <button
                      onClick={toggleListening}
                      className={`
                        p-4 rounded-2xl transition-all duration-300 flex items-center gap-3
                        ${isListening 
                          ? 'bg-red-500 text-white shadow-lg shadow-red-500/30' 
                          : 'bg-white/5 text-cyan-400 hover:bg-white/10 hover:shadow-lg hover:shadow-cyan-500/10'}
                      `}
                    >
                      {isListening ? <MicOff size={24} /> : <Mic size={24} />}
                      <span className="text-[10px] font-bold uppercase tracking-wider">{isListening ? 'Abort' : 'Talk Now'}</span>
                    </button>

                    <button
                      onClick={() => handleProcess()}
                      disabled={!inputText.trim() || loading}
                      className={`
                        flex items-center gap-2 px-8 py-4 rounded-2xl font-bold transition-all duration-200 border-b-4 uppercase text-xs tracking-[0.15em]
                        ${!inputText.trim() || loading 
                          ? 'bg-gray-800/50 text-gray-600 border-gray-900 cursor-not-allowed opacity-50' 
                          : 'bg-cyan-600 text-white border-cyan-800 hover:bg-cyan-500 hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] active:translate-y-1 active:border-b-0'}
                      `}
                    >
                      {loading ? <RefreshCcw className="animate-spin" size={18} /> : <Send size={18} />}
                      {loading ? 'Analyzing' : 'Process'}
                    </button>
                  </div>
                </div>
              </motion.div>

              {/* Result HUD HUD */}
              <AnimatePresence mode="wait">
                {result ? (
                  <motion.div
                    key={result.original}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-cyan-950/20 backdrop-blur-3xl rounded-3xl border border-cyan-500/30 overflow-hidden flex flex-col shadow-2xl relative border-cyber"
                  >
                    {/* HUD Scanline */}
                    <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent pointer-events-none h-1/2"></div>
                    
                    <div className="p-4 border-b border-cyan-500/20 flex items-center justify-between bg-cyan-900/10">
                      <div className="flex items-center gap-3">
                        <Activity size={14} className="text-cyan-400 animate-pulse" />
                        <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-[0.2em]">Output Sequence</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => speak(result.result)}
                          className={`p-2 rounded-lg transition-all ${isSpeaking ? 'bg-cyan-400 text-black' : 'text-cyan-400/60 hover:text-cyan-400 hover:bg-cyan-500/10'}`}
                          title={isSpeaking ? "Stop Voice" : "Vocal Synth"}
                        >
                          {isSpeaking ? <VolumeX size={18} /> : <Volume2 size={18} />}
                        </button>
                        <button 
                          onClick={() => copyToClipboard(result.result)}
                          className="p-2 text-cyan-400/60 hover:text-cyan-400 hover:bg-cyan-500/10 transition-all rounded-lg"
                        >
                          {copied ? <Check size={18} className="text-green-400" /> : <Copy size={18} />}
                        </button>
                      </div>
                    </div>

                    <div className="p-8 space-y-8 flex-grow">
                      <div>
                        <div className="text-[9px] font-mono text-cyan-500/50 uppercase tracking-[0.3em] mb-3 flex items-center gap-2">
                          <span className="w-1 h-1 bg-cyan-500"></span> Input Source
                        </div>
                        <p className="text-gray-400 font-medium italic text-lg line-clamp-2">"{result.original}"</p>
                      </div>

                      <div>
                        <div className="text-[9px] font-mono text-cyan-400 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                          <div className="flex gap-0.5">
                            <span className="w-1 h-3 bg-cyan-500 rounded-full"></span>
                            <span className="w-1 h-3 bg-cyan-500/40 rounded-full"></span>
                          </div>
                          Neural Output
                        </div>
                        <p className="text-3xl font-bold text-white leading-tight leading-tighter drop-shadow-[0_0_10px_rgba(34,211,238,0.3)]">
                          {result.result}
                        </p>
                      </div>

                      <div className="p-5 bg-black/40 rounded-2xl border border-cyan-500/10 relative overflow-hidden group">
                         <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-30 transition-opacity">
                           <Info size={32} className="text-cyan-400" />
                         </div>
                         <div className="text-[10px] font-bold text-cyan-500/60 uppercase mb-2 flex items-center gap-2 tracking-widest">
                           <CheckCircle2 size={12} />
                           Logic Explanation
                         </div>
                         <p className="text-xs text-gray-400 leading-relaxed font-mono">
                           {result.explanation}
                         </p>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <div className="h-full flex items-center justify-center p-12 border-2 border-dashed border-cyan-500/10 rounded-3xl group">
                    <div className="text-center space-y-4 opacity-40 group-hover:opacity-100 transition-opacity">
                      <div className="w-16 h-16 bg-cyan-500/5 rounded-full flex items-center justify-center mx-auto border border-cyan-500/10">
                        <Activity size={32} className="text-cyan-400" />
                      </div>
                      <div>
                        <p className="text-xs font-mono uppercase tracking-[0.2em] text-cyan-400/80">Awaiting Data Link</p>
                        <p className="text-xs text-gray-600 mt-1">Speak or type your message to see the output.</p>
                      </div>
                    </div>
                  </div>
                )}
              </AnimatePresence>
            </div>

            {/* Bottom Section - Error HUD */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="bg-red-500/10 border border-red-500/30 text-red-400 px-6 py-4 rounded-2xl flex items-center gap-4 glow-red"
                >
                  <AlertCircle size={24} />
                  <div className="flex-grow">
                    <div className="text-[10px] font-bold uppercase tracking-[0.2em] mb-0.5">Neural Link Error</div>
                    <div className="text-sm font-mono opacity-80">{error}</div>
                  </div>
                  <button onClick={() => setError(null)} className="p-2 hover:bg-white/10 rounded-lg">
                    <RefreshCcw size={18} />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Floating History Hud */}
            {history.length > 0 && (
              <div className="mt-12 pt-8 border-t border-cyan-500/10">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-cyan-950/40 rounded-lg text-cyan-400">
                      <History size={18} />
                    </div>
                    <h2 className="text-sm font-bold uppercase tracking-[0.3em] text-cyan-400">Memory Archives</h2>
                  </div>
                  <button 
                    onClick={() => { setHistory([]); localStorage.removeItem('translation_history'); }}
                    className="text-[10px] font-bold text-gray-600 hover:text-red-400 uppercase tracking-widest transition-colors"
                  >
                    Wipe Memory
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {history.map((item, idx) => (
                    <motion.div
                      key={idx}
                      whileHover={{ y: -5, borderColor: 'rgba(6, 182, 212, 0.4)' }}
                      className="p-5 bg-black/40 rounded-2xl border border-white/5 cursor-pointer group transition-all"
                      onClick={() => {
                        setResult(item);
                        window.scrollTo({ top: 400, behavior: 'smooth' });
                      }}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <span className={`text-[8px] font-mono px-2 py-0.5 rounded tracking-[0.1em] ${item.type === 'translation' ? 'bg-cyan-500/10 text-cyan-400' : 'bg-indigo-500/10 text-indigo-400'}`}>
                          {item.type.toUpperCase()}
                        </span>
                        <ChevronRight size={14} className="text-gray-700 group-hover:text-cyan-400 transition-colors" />
                      </div>
                      <p className="text-sm font-bold text-gray-200 line-clamp-2 mb-2 group-hover:text-white transition-colors">{item.result}</p>
                      <div className="h-px w-8 bg-cyan-500/20 mb-2"></div>
                      <p className="text-[10px] text-gray-600 italic font-medium line-clamp-1">"{item.original}"</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="max-w-6xl mx-auto px-6 py-20 border-t border-cyan-500/10 mt-20 text-center relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-px bg-gradient-to-r from-transparent via-cyan-500 to-transparent"></div>
        <div className="flex flex-col items-center gap-6">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-lg overflow-hidden border border-cyan-500/30 shadow-[0_0_10px_rgba(6,182,212,0.3)]">
               <img 
                 src="https://images.unsplash.com/photo-1589254065878-42c9da997008?w=100&h=100&fit=crop" 
                 alt="AI" 
                 className="w-full h-full object-cover grayscale"
                 referrerPolicy="no-referrer"
               />
             </div>
             <div className="h-4 w-px bg-cyan-500/20"></div>
             <p className="text-xs font-mono text-cyan-400/40 uppercase tracking-[0.4em]">Integrated RICA Core V3.1</p>
          </div>
          <p className="text-[10px] text-gray-600 max-w-sm mx-auto leading-relaxed">
            All neural signals are processed via Gemini-3 Flash. Audio synthesized via WebVocal Architecture. Built with ❤️ for the Tamil linguistic community.
          </p>
          <div className="flex gap-4 opacity-30 grayscale">
            {/* System Logos/Icons */}
            <Activity size={16} />
            <Network size={16} />
            <Cpu size={16} />
          </div>
        </div>
      </footer>

      {/* Interactive HUD Layer (Moved to bottom for absolute top-level rendering) */}
      <div className="fixed inset-0 pointer-events-none z-[200] select-none">
        {/* Data Stream HUDs (Now Fully Opaque) */}
        <div className="absolute top-32 left-10 w-48 h-96 overflow-hidden hidden xl:block">
          <DataStream />
        </div>
        <div className="absolute bottom-32 right-10 w-48 h-96 overflow-hidden hidden xl:block">
          <DataStream reverse />
        </div>

      </div>
    </div>
  );
}

// Sub-components for Robotic Core visuals

function WaveformBars({ isSpeaking }: { isSpeaking?: boolean }) {
  return (
    <div className="flex gap-1.5 items-end h-8">
      {[...Array(16)].map((_, i) => (
        <motion.div
          key={i}
          animate={{ 
            height: isSpeaking ? ['10%', '100%', '10%'] : ['30%', '60%', '30%'],
            backgroundColor: isSpeaking ? '#818cf8' : '#22d3ee',
            opacity: isSpeaking ? [0.6, 1, 0.6] : 0.3
          }}
          transition={{ 
            repeat: Infinity, 
            duration: isSpeaking ? 0.2 + (Math.sin(i) * 0.1) : 1, 
            delay: i * 0.03,
            ease: "easeInOut"
          }}
          className="w-1 rounded-full shadow-[0_0_12px_currentColor]"
        />
      ))}
    </div>
  );
}

function DataStream({ reverse = false }: { reverse?: boolean }) {
  const [data, setData] = useState<string[]>([]);

  useEffect(() => {
    const generate = () => {
      const chars = '0123456789ABCDEF';
      return Array(15).fill(0).map(() => 
        '0x' + Array(4).fill(0).map(() => chars[Math.floor(Math.random() * 16)]).join('')
      );
    };
    setData(generate());
    const interval = setInterval(() => setData(generate()), 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`flex flex-col gap-2 font-mono text-[8px] text-cyan-400/20 select-none ${reverse ? 'items-end' : 'items-start'}`}>
      {data.map((item, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: reverse ? 10 : -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.1 }}
        >
          {item}
        </motion.div>
      ))}
    </div>
  );
}

function VocalOrbit() {
  return (
    <motion.div 
      animate={{ rotate: 360, scale: [0.95, 1.1, 0.95] }}
      transition={{ 
        rotate: { duration: 4, repeat: Infinity, ease: "linear" },
        scale: { duration: 0.2, repeat: Infinity }
      }}
      className="absolute inset-[-40px] z-0 pointer-events-none"
    >
      {[...Array(24)].map((_, i) => (
        <motion.div
          key={i}
          animate={{ height: [15, 40, 15], opacity: [0.3, 0.8, 0.3] }}
          transition={{ repeat: Infinity, duration: 0.3, delay: i * 0.02 }}
          className="absolute w-[1px] bg-indigo-400/60 rounded-full blur-[0.3px]"
          style={{ 
            left: '50%',
            top: '-20px',
            transformOrigin: '0 153px',
            transform: `rotate(${i * 15}deg)`
          }}
        />
      ))}
    </motion.div>
  );
}

function NeuralParticles() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {[...Array(30)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ 
            x: Math.random() * 200 - 100, 
            y: Math.random() * 200 - 100,
            opacity: 0,
            scale: Math.random() * 0.5 + 0.5
          }}
          animate={{ 
            opacity: [0, 0.6, 0],
            scale: [1, 1.5, 1],
            rotate: [0, 360],
            x: [null, (Math.random() - 0.5) * 300],
            y: [null, (Math.random() - 0.5) * 300]
          }}
          transition={{ 
            repeat: Infinity, 
            duration: 3 + Math.random() * 4,
            delay: Math.random() * 5,
            ease: "easeInOut"
          }}
          className="absolute w-1 h-1 bg-cyan-400 rounded-full blur-[1px]"
          style={{ 
            left: '50%',
            top: '50%'
          }}
        />
      ))}
    </div>
  );
}

function EnergyFlow() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
      <motion.div 
        animate={{ 
          opacity: [0.1, 0.4, 0.1],
          boxShadow: [
            "0 0 10px rgba(6, 182, 212, 0.2)",
            "0 0 30px rgba(6, 182, 212, 0.4)",
            "0 0 10px rgba(6, 182, 212, 0.2)"
          ]
        }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute inset-0 border-[20px] border-cyan-500/5 rounded-full"
      />
      <motion.div 
        animate={{ y: ['-100%', '200%'] }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        className="absolute w-full h-[15px] bg-white/10 blur-md transform rotate-45"
      ></motion.div>
    </div>
  );
}
