'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { speechText } from '@/lib/paseo/speech';
interface Recognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}
type VoiceWindow = Window & {
  SpeechRecognition?: new () => Recognition;
  webkitSpeechRecognition?: new () => Recognition;
};
export function useJarvisVoice(onSend: (text: string) => void) {
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [voiceError, setVoiceError] = useState('');
  const [enabled, setEnabled] = useState(true);
  const transcriptRef = useRef('');
  const cancelled = useRef(false);
  const recognition = useRef<Recognition | null>(null);
  const sendRef = useRef(onSend);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const utterance = useRef<SpeechSynthesisUtterance | null>(null);
  useEffect(() => {
    sendRef.current = onSend;
  }, [onSend]);
  const stopSpeaking = useCallback(() => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    if (utterance.current) {
      utterance.current.onend = null;
      utterance.current.onerror = null;
      utterance.current = null;
    }
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  }, []);
  useEffect(
    () => () => {
      const r = recognition.current;
      if (r) {
        r.onend = null;
        r.onresult = null;
        r.onerror = null;
        r.abort();
      }
      if (timer.current) clearInterval(timer.current);
      if (utterance.current) {
        utterance.current.onend = null;
        utterance.current.onerror = null;
      }
      window.speechSynthesis?.cancel();
    },
    [],
  );
  function cancelListening() {
    cancelled.current = true;
    transcriptRef.current = '';
    recognition.current?.abort();
    setListening(false);
    setTranscript('');
  }
  function startListening() {
    const Constructor =
      (window as VoiceWindow).SpeechRecognition || (window as VoiceWindow).webkitSpeechRecognition;
    if (!Constructor) {
      setVoiceError('Este navegador no ofrece reconocimiento de voz. Puedes escribir tu consulta.');
      return;
    }
    if (recognition.current || listening) return;
    stopSpeaking();
    setVoiceError('');
    cancelled.current = false;
    transcriptRef.current = '';
    setTranscript('');
    const languages = [navigator.language || 'es-419', 'es-419', 'es-ES'].filter(
      (v, i, a) => a.indexOf(v) === i,
    );
    function launch(index: number) {
      const r = new Constructor!();
      recognition.current = r;
      r.lang = languages[index];
      r.continuous = false;
      r.interimResults = true;
      r.onresult = (e) => {
        const text = Array.from(e.results)
          .map((result) => result[0].transcript)
          .join(' ');
        transcriptRef.current = text;
        setTranscript(text);
      };
      r.onend = () => {
        recognition.current = null;
        setListening(false);
        const spoken = transcriptRef.current.trim();
        transcriptRef.current = '';
        if (!cancelled.current && spoken) sendRef.current(spoken);
      };
      r.onerror = (e) => {
        if (e.error === 'language-not-supported' && index + 1 < languages.length) {
          r.onend = null;
          r.abort();
          launch(index + 1);
          return;
        }
        cancelled.current = true;
        setListening(false);
        setVoiceError(
          e.error === 'not-allowed'
            ? 'Autoriza el micrófono en tu navegador.'
            : e.error === 'no-speech'
              ? 'No detecté voz. Intenta nuevamente.'
              : 'No se pudo reconocer la voz. Puedes escribir tu consulta.',
        );
      };
      try {
        r.start();
        setListening(true);
      } catch {
        recognition.current = null;
        setListening(false);
        setVoiceError('No se pudo activar el micrófono.');
      }
    }
    launch(0);
  }
  function speak(text: string) {
    stopSpeaking();
    if (!enabled || !window.speechSynthesis) return;
    const clean = speechText(text);
    if (!clean) return;
    const u = new SpeechSynthesisUtterance(clean);
    utterance.current = u;
    u.lang = 'es-419';
    const voices = window.speechSynthesis.getVoices().filter((v) => v.lang.startsWith('es'));
    u.voice = voices.find((v) => /Google|Sabina|Raul|Helena/i.test(v.name)) || voices[0] || null;
    u.onstart = () => setSpeaking(true);
    const finish = () => {
      if (timer.current) clearInterval(timer.current);
      timer.current = null;
      utterance.current = null;
      setSpeaking(false);
    };
    u.onend = finish;
    u.onerror = finish;
    timer.current = setInterval(() => window.speechSynthesis.resume(), 10000);
    window.speechSynthesis.speak(u);
  }
  return {
    listening,
    speaking,
    transcript,
    voiceError,
    enabled,
    startListening,
    cancelListening,
    sendNow: () => recognition.current?.stop(),
    stopSpeaking,
    speak,
    toggle: () => {
      setEnabled(!enabled);
      if (enabled) stopSpeaking();
    },
  };
}
