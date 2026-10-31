
import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { AppLanguage } from '../types';

interface VoiceRecorderProps {
  onTranscriptionComplete: (text: string) => void;
  appLang: AppLanguage;
  isProcessing: boolean;
  isProcessingVoice?: boolean;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ onTranscriptionComplete, appLang, isProcessing, isProcessingVoice }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  const t = {
    DE: {
      start: "Sprachaufnahme",
      stop: "Aufnahme stoppen",
      listening: "Ich höre zu...",
      processing: "Verarbeite Sprache...",
      error: "Spracherkennung не поддерживается или доступ запрещен",
      notSupported: "Ihr Browser unterstützt keine Spracherkennung. Bitte verwenden Sie Chrome или Edge.",
      done: "Fertig"
    },
    RU: {
      start: "Голосовой ввод",
      stop: "Остановить",
      listening: "Слушаю...",
      processing: "Обработка голоса...",
      error: "Распознавание речи не поддерживается или доступ запрещен",
      notSupported: "Ваш браузер не поддерживает распознавание речи. Пожалуйста, используйте Chrome или Edge.",
      done: "Готово"
    },
    EN: {
      start: "Voice Input",
      stop: "Stop Recording",
      listening: "Listening...",
      processing: "Processing voice...",
      error: "Speech recognition not supported or access denied",
      notSupported: "Your browser does not support speech recognition. Please use Chrome or Edge.",
      done: "Done"
    }
  }[appLang] || { DE: { start: "Sprachaufnahme", stop: "Aufnahme stoppen", listening: "Ich höre zu...", processing: "Verarbeite Sprache...", error: "Spracherkennung не поддерживается", notSupported: "Browser not supported", done: "Fertig" } }.DE;

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = appLang === 'RU' ? 'ru-RU' : appLang === 'DE' ? 'de-DE' : 'en-US';

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        
        const fullTranscript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join('');
        
        setTranscript(fullTranscript);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setError(appLang === 'RU' ? 'Доступ к микрофону запрещен' : 'Microphone access denied');
        } else {
          setError(t.error + ': ' + event.error);
        }
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    } else {
      setError(t.notSupported);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
    };
  }, [appLang]);

  const toggleRecording = async () => {
    if (isRecording) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
          // Force stop state if onend doesn't fire quickly
          setTimeout(() => {
            if (isRecording) setIsRecording(false);
          }, 800);
        } catch (e) {
          recognitionRef.current.abort();
          setIsRecording(false);
        }
      } else {
        setIsRecording(false);
      }
      
      if (transcript.trim()) {
        onTranscriptionComplete(transcript);
      }
    } else {
      setError(null);
      setTranscript('');
      
      try {
        // Explicitly request microphone permission first to be sure
        await navigator.mediaDevices.getUserMedia({ audio: true });
        
        if (!recognitionRef.current) {
          const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
          if (!SpeechRecognition) {
            setError(t.error);
            return;
          }
          // Re-initialize if needed
          const recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = appLang === 'RU' ? 'ru-RU' : appLang === 'DE' ? 'de-DE' : 'en-US';
          recognition.onresult = (event: any) => {
            const fullTranscript = Array.from(event.results)
              .map((result: any) => result[0].transcript)
              .join('');
            setTranscript(fullTranscript);
          };
          recognition.onerror = (event: any) => {
            console.error('Speech recognition error:', event.error);
            setError(t.error + ': ' + event.error);
            setIsRecording(false);
          };
          recognition.onend = () => setIsRecording(false);
          recognitionRef.current = recognition;
        }

        recognitionRef.current.lang = appLang === 'RU' ? 'ru-RU' : appLang === 'DE' ? 'de-DE' : 'en-US';
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (e: any) {
        console.error('Failed to start recognition:', e);
        if (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError') {
          setError(appLang === 'RU' ? 'Доступ к микрофону запрещен' : 'Microphone access denied');
        } else {
          setError(t.error + ': ' + (e.message || 'Unknown error'));
        }
      }
    }
  };

  return (
    <div className="flex flex-col items-center space-y-2 w-full">
      <button
        onClick={toggleRecording}
        disabled={isProcessing}
        className={`w-full justify-center flex items-center space-x-2 px-2 sm:px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm border active:scale-95
          ${isRecording 
            ? 'bg-red-500 border-red-600 text-white animate-pulse' 
            : isProcessing 
            ? 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 cursor-not-allowed' 
            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-orange-300'}
        `}
      >
        {isProcessingVoice ? (
          <Loader2 size={14} className="animate-spin" />
        ) : isRecording ? (
          <MicOff size={14} />
        ) : (
          <Mic size={14} />
        )}
        <span>{isRecording ? t.stop : isProcessingVoice ? t.processing : t.start}</span>
      </button>

      {isRecording && transcript && (
        <div className="w-full max-w-md p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 animate-fade-in">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1 flex items-center">
            <span className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse"></span>
            {t.listening}
          </p>
          <p className="text-sm text-slate-800 dark:text-slate-100 italic">"{transcript}"</p>
        </div>
      )}

      {error && (
        <div className="flex items-center space-x-1 text-[10px] text-red-500 font-bold uppercase">
          <AlertCircle size={12} />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
