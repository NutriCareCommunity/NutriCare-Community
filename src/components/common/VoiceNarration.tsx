import React from 'react';
import { Volume2 } from 'lucide-react';

export const VoiceNarration: React.FC<{ text: string }> = ({ text }) => {
  const speak = () => {
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Attempt to find a suitable voice (e.g., Hindi if available)
    const voices = window.speechSynthesis.getVoices();
    // Simple heuristic: just use default for now as language-specific voices on mobile vary wildly
    utterance.rate = 0.9; // Slightly slower for clarity
    
    window.speechSynthesis.speak(utterance);
  };

  return (
    <button 
      onClick={speak}
      className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"
      title="Read Aloud"
    >
      <Volume2 className="w-4 h-4" />
      Listen
    </button>
  );
};
