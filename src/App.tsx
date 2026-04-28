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
  VolumeX
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

    // Speech Synthesis cleanup
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
    utterance.lang = 'en-US';
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
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A1A] font-sans selection:bg-blue-100">
      {/* Header */}
      <nav className="border-bottom border-[#E5E5E5] bg-white sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-600 rounded-lg text-white">
              <Languages size={24} />
            </div>
            <h1 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
              TamiliGram
            </h1>
          </div>
          <div className="flex items-center gap-4 text-sm font-medium text-gray-500">
            <span className="hidden sm:inline">Tamil</span>
            <ChevronRight size={16} />
            <span className="hidden sm:inline">English</span>
            <div className="w-1 h-1 bg-gray-300 rounded-full mx-2"></div>
            <span className="hidden sm:inline">Grammar Correction</span>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 gap-8">
          
          {/* Input Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-xl shadow-blue-900/5 border border-[#E5E5E5] overflow-hidden"
          >
            <div className="p-4 border-b border-[#F0F0F0] flex items-center justify-between bg-[#FBFBFB]">
              <span className="text-sm font-semibold text-gray-500 flex items-center gap-2 uppercase tracking-wider">
                <Info size={14} className="text-blue-500" />
                Input (Tamil or English)
              </span>
              <div className="flex items-center gap-4">
                <div className="flex bg-gray-100 p-1 rounded-lg">
                  <button 
                    onClick={() => setListeningLang('ta-IN')}
                    className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${listeningLang === 'ta-IN' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400'}`}
                  >
                    TAMIL
                  </button>
                  <button 
                    onClick={() => setListeningLang('en-US')}
                    className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${listeningLang === 'en-US' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400'}`}
                  >
                    ENGLISH
                  </button>
                </div>
                <div className="flex gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-400"></div>
                  <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                  <div className="w-2 h-2 rounded-full bg-green-400"></div>
                </div>
              </div>
            </div>
            <div className="p-6 relative">
              <textarea
                ref={textareaRef}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={listeningLang === 'ta-IN' ? "எப்படி இருக்கிறீர்கள்? (Tamil)..." : "Type or speak English with errors..."}
                className="w-full min-h-[160px] text-xl bg-transparent border-none focus:ring-0 resize-none placeholder:text-gray-300 leading-relaxed pr-12"
                autoFocus
              />
              
              <button
                onClick={toggleListening}
                className={`
                  absolute right-6 top-6 p-3 rounded-full transition-all duration-300
                  ${isListening 
                    ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-200' 
                    : 'bg-gray-50 text-gray-400 hover:text-blue-500 hover:bg-blue-50'}
                `}
                title={isListening ? "Stop listening" : "Start voice input"}
              >
                {isListening ? <MicOff size={24} /> : <Mic size={24} />}
              </button>

              <div className="mt-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 font-medium">
                    Press <kbd className="px-1.5 py-0.5 rounded border border-gray-200 bg-gray-50 shadow-sm text-gray-500">Enter</kbd> to translate or correct
                  </p>
                  {isListening && (
                    <motion.p 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-xs font-bold text-red-500 mt-1 flex items-center gap-1"
                    >
                      <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping"></span>
                      Listening for {listeningLang === 'ta-IN' ? 'Tamil' : 'English'}...
                    </motion.p>
                  )}
                </div>
                <button
                  onClick={handleProcess}
                  disabled={!inputText.trim() || loading}
                  className={`
                    flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-200
                    ${!inputText.trim() || loading 
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                      : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-200 active:scale-95'}
                  `}
                >
                  {loading ? <RefreshCcw className="animate-spin" size={20} /> : <Send size={20} />}
                  {loading ? 'Processing...' : 'Proceed'}
                </button>
              </div>
            </div>
          </motion.div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-red-50 border border-red-100 text-red-700 px-6 py-4 rounded-xl flex items-center gap-3"
              >
                <AlertCircle size={20} />
                <p className="font-medium">{error}</p>
              </motion.div>
            )}

            {result && (
              <motion.div
                key={result.original}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-2xl shadow-xl shadow-blue-900/5 border border-[#E5E5E5] overflow-hidden"
              >
                <div className="p-4 border-b border-[#F0F0F0] flex items-center justify-between bg-blue-50/30">
                  <div className="flex items-center gap-2">
                    {result.type === 'translation' ? (
                      <span className="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-1 rounded">TRANSLATION</span>
                    ) : (
                      <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded">CORRECTION</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => speak(result.result)}
                      className={`transition-colors p-2 rounded-lg ${isSpeaking ? 'text-blue-600 bg-blue-50' : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'}`}
                      title={isSpeaking ? "Stop speaking" : "Listen aloud"}
                    >
                      {isSpeaking ? <VolumeX size={18} /> : <Volume2 size={18} />}
                    </button>
                    <button 
                      onClick={() => copyToClipboard(result.result)}
                      className="text-gray-400 hover:text-blue-600 transition-colors p-2 rounded-lg hover:bg-blue-50"
                      title="Copy to clipboard"
                    >
                      {copied ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
                    </button>
                  </div>
                </div>
                <div className="p-8">
                  <div className="mb-6">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Original</p>
                    <p className="text-lg text-gray-600 italic">"{result.original}"</p>
                  </div>
                  <div className="mb-8">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                      {result.type === 'translation' ? 'Translated' : 'Corrected'} Sentence
                    </p>
                    <p className="text-3xl font-semibold text-blue-600 leading-tight">
                      {result.result}
                    </p>
                  </div>
                  <div className="p-5 bg-gradient-to-br from-gray-50 to-indigo-50/30 rounded-xl border border-blue-50">
                    <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                      <CheckCircle2 size={14} />
                      Explanation
                    </p>
                    <p className="text-gray-700 leading-relaxed font-medium">
                      {result.explanation}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* History Section */}
          {history.length > 0 && (
            <div className="mt-8">
              <div className="flex items-center gap-2 mb-6">
                <History className="text-gray-400" size={20} />
                <h2 className="text-lg font-bold text-gray-700">Recent Activity</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {history.map((item, idx) => (
                  <motion.div
                    key={idx}
                    whileHover={{ y: -4 }}
                    className="p-5 bg-white rounded-xl border border-[#E5E5E5] group cursor-pointer hover:shadow-lg hover:shadow-blue-900/5 transition-all"
                    onClick={() => {
                      setResult(item);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${item.type === 'translation' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
                        {item.type.toUpperCase()}
                      </span>
                      <ChevronRight size={14} className="text-gray-300 group-hover:text-blue-500 transition-colors" />
                    </div>
                    <p className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">{item.result}</p>
                    <p className="text-xs text-gray-400 line-clamp-1 italic">"{item.original}"</p>
                  </motion.div>
                ))}
              </div>
              <button 
                onClick={() => {
                  setHistory([]);
                  localStorage.removeItem('translation_history');
                }}
                className="mt-6 text-sm text-gray-400 hover:text-red-500 font-medium transition-colors"
              >
                Clear history
              </button>
            </div>
          )}
        </div>
      </main>

      <footer className="max-w-4xl mx-auto px-6 py-12 border-t border-[#E5E5E5] mt-12 text-center">
        <p className="text-sm text-gray-400 font-medium">
          Powered by Gemini AI • Built with Tamil Heart ❤️
        </p>
      </footer>
    </div>
  );
}
