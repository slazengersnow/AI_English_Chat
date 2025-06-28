import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Volume2, VolumeX } from "lucide-react";

interface SpeechButtonProps {
  text: string;
  language?: string;
  className?: string;
  size?: "sm" | "default" | "lg";
}

export function SpeechButton({ 
  text, 
  language = "en-US", 
  className = "",
  size = "sm" 
}: SpeechButtonProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  const handleSpeak = () => {
    if (!text) return;

    // Stop any currently playing speech
    window.speechSynthesis.cancel();

    if (isPlaying) {
      setIsPlaying(false);
      return;
    }

    // Check if SpeechSynthesis is supported
    if (!('speechSynthesis' in window)) {
      console.warn('Speech synthesis not supported');
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Set language and voice properties
    utterance.lang = language;
    utterance.rate = 0.8; // Slightly slower for learning
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Try to use a native English voice if available
    const voices = window.speechSynthesis.getVoices();
    const englishVoice = voices.find(voice => 
      voice.lang.startsWith('en') && voice.localService
    ) || voices.find(voice => voice.lang.startsWith('en'));
    
    if (englishVoice) {
      utterance.voice = englishVoice;
    }

    utterance.onstart = () => {
      setIsPlaying(true);
    };

    utterance.onend = () => {
      setIsPlaying(false);
    };

    utterance.onerror = () => {
      setIsPlaying(false);
      console.error('Speech synthesis error');
    };

    window.speechSynthesis.speak(utterance);
  };

  return (
    <Button
      variant="outline"
      size={size}
      onClick={handleSpeak}
      className={`${className} ${isPlaying ? 'bg-blue-50 border-blue-300' : ''}`}
      title={isPlaying ? "停止" : "音声再生"}
    >
      {isPlaying ? (
        <VolumeX className="w-4 h-4" />
      ) : (
        <Volume2 className="w-4 h-4" />
      )}
      {size !== "sm" && (
        <span className="ml-2">
          {isPlaying ? "停止" : "音声"}
        </span>
      )}
    </Button>
  );
}