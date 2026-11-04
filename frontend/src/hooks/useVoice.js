import { useCallback, useEffect, useRef, useState } from "react";

// Browser speech APIs (Chrome, Edge, Safari). Where they are missing the callers explain it instead of failing silently.
export const SpeechRec = typeof window !== "undefined" ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null;
export const canSpeak = typeof window !== "undefined" && "speechSynthesis" in window;

const ERRORS = {
  "not-allowed": "Microphone access is blocked. Allow it in your browser's site settings and try again.",
  "service-not-allowed": "Microphone access is blocked. Allow it in your browser's site settings and try again.",
  "no-speech": "I didn't hear anything. Tap the mic and try again.",
  "audio-capture": "No microphone found. Please check your device.",
  network: "Voice input needs an internet connection.",
};

// Speech to text. onText(liveText) fires while talking, onDone(finalText) once when the person stops.
export function useVoiceInput({ onText, onDone, lang = "en-IN" }) {
  const [listening, setListening] = useState(false);
  const [note, setNote] = useState("");
  const recRef = useRef(null);
  const cb = useRef({ onText, onDone });
  cb.current = { onText, onDone };

  useEffect(() => () => recRef.current?.abort(), []);

  const toggle = useCallback(() => {
    if (recRef.current) { recRef.current.stop(); return; }
    if (!SpeechRec) { setNote("Voice input isn't supported in this browser. Please use Chrome, Edge or Safari, or type instead."); return; }
    if (canSpeak) window.speechSynthesis.cancel();
    setNote("");
    const rec = new SpeechRec();
    rec.lang = lang;
    rec.interimResults = true;
    rec.continuous = false;
    let heard = "";
    rec.onstart = () => setListening(true);
    rec.onresult = (e) => {
      let t = "";
      for (let i = 0; i < e.results.length; i += 1) t += e.results[i][0].transcript;
      heard = t;
      cb.current.onText?.(t);
    };
    rec.onerror = (e) => {
      if (e.error !== "aborted") setNote(ERRORS[e.error] || "Voice input failed. Please try again or type instead.");
    };
    rec.onend = () => {
      setListening(false);
      recRef.current = null;
      if (heard.trim()) cb.current.onDone?.(heard.trim());
    };
    recRef.current = rec;
    try { rec.start(); } catch { recRef.current = null; setListening(false); }
  }, [lang]);

  return { listening, note, toggle, clearNote: () => setNote("") };
}

// Text to speech with one active item at a time. speakingId tells the UI which "Listen" button is on.
export function useSpeaker(lang = "en-IN") {
  const [speakingId, setSpeakingId] = useState(null);
  useEffect(() => () => { if (canSpeak) window.speechSynthesis.cancel(); }, []);

  const stop = useCallback(() => { if (canSpeak) window.speechSynthesis.cancel(); setSpeakingId(null); }, []);
  const speak = useCallback((id, text) => {
    if (!canSpeak) return;
    if (speakingId === id) { stop(); return; }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang;
    u.onend = () => setSpeakingId((cur) => (cur === id ? null : cur));
    u.onerror = u.onend;
    setSpeakingId(id);
    window.speechSynthesis.speak(u);
  }, [lang, speakingId, stop]);

  return { speakingId, speak, stop };
}
