import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import api from "../services/api.js";
import Cover from "./Cover.jsx";
import Icon from "./Icon.jsx";

const STORE = "exploresouth-chat-v1";
const GREETING = {
  role: "bot",
  text: "Hi there! I'm the ExploreSouth assistant. Ask me when to visit a place, where to go in a given month, or what a trip will cost. You can type, or tap the mic and just talk to me.",
  suggestions: ["Where should I go this month?", "Best time to visit Munnar", "Beach places in December", "Budget for 3 days"],
};

const load = () => {
  try {
    const saved = JSON.parse(sessionStorage.getItem(STORE) || "null");
    if (saved?.messages?.length) return saved;
  } catch { /* storage unavailable: start fresh */ }
  return { messages: [GREETING], context: {} };
};

// **bold** inside a line.
function Inline({ text }) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") ? <b key={i}>{part.slice(2, -2)}</b> : <span key={i}>{part}</span>);
}

// Plain text with "- " bullet lines and **bold**, rendered as real elements (never raw HTML).
function RichText({ text }) {
  const blocks = [];
  let list = [];
  const flush = () => { if (list.length) { blocks.push({ list }); list = []; } };
  text.split("\n").forEach((line) => {
    if (line.startsWith("- ")) list.push(line.slice(2));
    else { flush(); if (line.trim()) blocks.push({ p: line }); }
  });
  flush();
  return blocks.map((b, i) => b.list
    ? <ul key={i} className="ml-4 list-disc space-y-1">{b.list.map((l, j) => <li key={j}><Inline text={l} /></li>)}</ul>
    : <p key={i}><Inline text={b.p} /></p>);
}

// Browser speech APIs (Chrome, Edge, Safari). Missing in e.g. Firefox: the voice buttons are simply hidden.
const SpeechRec = typeof window !== "undefined" ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null;
const canSpeak = typeof window !== "undefined" && "speechSynthesis" in window;
const plain = (t) => t.replace(/\*\*/g, "").replace(/^- /gm, "").replace(/\s+/g, " ").trim();

function MiniCard({ d, onNavigate }) {
  return (
    <Link to={`/destinations/${d.slug}`} onClick={onNavigate}
      className="flex items-center gap-3 rounded-xl border border-line bg-white p-2 transition hover:border-brand">
      <span className="block h-12 w-14 shrink-0 overflow-hidden rounded-lg"><Cover name={d.name} src={d.cover_image} /></span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-navy">{d.name}</span>
        <span className="block truncate text-xs text-muted">{d.city}, {d.state}</span>
      </span>
      {d.label && <span className="badge shrink-0 bg-brand/10 text-brand-dark">{d.label}</span>}
    </Link>
  );
}

function BotAvatar({ size = 28 }) {
  return (
    <span className="flex shrink-0 items-center justify-center rounded-full bg-accent text-navy" style={{ width: size, height: size }}>
      <Icon name="sparkle" size={Math.round(size * 0.55)} />
    </span>
  );
}

export default function ChatWidget() {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [{ messages, context }, setChat] = useState(load);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceNote, setVoiceNote] = useState({ text: "", error: false });
  const [speakingIdx, setSpeakingIdx] = useState(null);
  const endRef = useRef(null);
  const inputRef = useRef(null);
  const buttonRef = useRef(null);
  const recRef = useRef(null);

  const stopSpeaking = () => { if (canSpeak) window.speechSynthesis.cancel(); setSpeakingIdx(null); };

  useEffect(() => {
    try { sessionStorage.setItem(STORE, JSON.stringify({ messages: messages.slice(-30), context })); } catch { /* ignore */ }
  }, [messages, context]);

  useEffect(() => { endRef.current?.scrollIntoView({ block: "end" }); }, [messages, busy, open]);
  useEffect(() => { if (open) inputRef.current?.focus(); }, [open]);
  useEffect(() => {
    if (!open) { recRef.current?.abort(); if (canSpeak) window.speechSynthesis.cancel(); }
  }, [open]);
  useEffect(() => () => { recRef.current?.abort(); if (canSpeak) window.speechSynthesis.cancel(); }, []);
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === "Escape") { setOpen(false); buttonRef.current?.focus(); } };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Speaker button under a bot message: reads it aloud, tap again to stop.
  const toggleSpeak = (i, text) => {
    if (!canSpeak) return;
    if (speakingIdx === i) { stopSpeaking(); return; }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(plain(text));
    u.lang = "en-IN";
    u.onend = () => setSpeakingIdx((cur) => (cur === i ? null : cur));
    u.onerror = u.onend;
    setSpeakingIdx(i);
    window.speechSynthesis.speak(u);
  };

  // Mic: tap, speak, and the question is sent when you stop talking.
  const toggleListening = () => {
    if (listening) { recRef.current?.stop(); return; }
    if (!SpeechRec) {
      setVoiceNote({ text: "Voice input isn't supported in this browser. Please use Chrome, Edge or Safari, or type your question.", error: true });
      return;
    }
    if (busy) return;
    stopSpeaking();
    setVoiceNote({ text: "", error: false });
    const rec = new SpeechRec();
    rec.lang = "en-IN";
    rec.interimResults = true;
    rec.continuous = false;
    let heard = "";
    rec.onstart = () => setListening(true);
    rec.onresult = (e) => {
      let t = "";
      for (let i = 0; i < e.results.length; i += 1) t += e.results[i][0].transcript;
      heard = t;
      setInput(t.slice(0, 500));
    };
    rec.onerror = (e) => {
      const msg = {
        "not-allowed": "Microphone access is blocked. Allow it in your browser's site settings and try again.",
        "service-not-allowed": "Microphone access is blocked. Allow it in your browser's site settings and try again.",
        "no-speech": "I didn't hear anything. Tap the mic and try again.",
        "audio-capture": "No microphone found. Please check your device.",
        network: "Voice input needs an internet connection.",
      }[e.error];
      if (msg) setVoiceNote({ text: msg, error: true });
      else if (e.error !== "aborted") setVoiceNote({ text: "Voice input failed. Please try again or type your question.", error: true });
    };
    rec.onend = () => {
      setListening(false);
      recRef.current = null;
      if (heard.trim()) send(heard);
    };
    recRef.current = rec;
    try { rec.start(); } catch { setListening(false); }
  };

  const send = async (text) => {
    const message = text.trim();
    if (!message || busy) return;
    stopSpeaking();
    setVoiceNote({ text: "", error: false });
    setInput("");
    setBusy(true);
    setChat((c) => ({ ...c, messages: [...c.messages, { role: "user", text: message }] }));
    try {
      const { data } = await api.post("/chat/", { message, context });
      setChat((c) => ({
        context: data.context || {},
        messages: [...c.messages, { role: "bot", text: data.reply, cards: data.destinations, links: data.links, suggestions: data.suggestions }],
      }));
    } catch (err) {
      const text = err?.response?.status === 429
        ? "You're sending messages very quickly. Please wait a moment and try again."
        : "Sorry, I couldn't reach the server. Please try again in a moment.";
      setChat((c) => ({ ...c, messages: [...c.messages, { role: "bot", text, suggestions: [] }] }));
    } finally { setBusy(false); }
  };

  const reset = () => { stopSpeaking(); setChat({ messages: [GREETING], context: {} }); };
  const closeChat = () => { setOpen(false); buttonRef.current?.focus(); };
  const last = messages[messages.length - 1];
  // On the trip planner the mobile "confirm" bar sits at the bottom, so lift the button above it.
  const lift = pathname === "/trips/new" ? "bottom-24 lg:bottom-5" : "bottom-[4.5rem] md:bottom-5";

  return (
    <div className="chat-widget">
      {open && (
        <section role="dialog" aria-label="Travel assistant"
          className="fixed inset-x-3 bottom-20 top-20 z-[900] flex flex-col overflow-hidden rounded-3xl border border-line bg-surface shadow-2xl sm:inset-x-auto sm:right-5 sm:top-auto sm:h-[min(640px,calc(100dvh-10rem))] sm:w-[400px]">
          <header className="flex shrink-0 items-center gap-3 bg-navy px-4 py-3 text-white">
            <span className="relative shrink-0">
              <BotAvatar size={40} />
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-navy bg-emerald-400" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-base font-semibold leading-tight">Travel assistant</p>
              <p className="truncate text-xs text-white/70">Online · answers from ExploreSouth data</p>
            </div>
            <button type="button" onClick={reset} aria-label="Start a new chat" title="New chat"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white/85 transition hover:bg-white/10 hover:text-white">
              <Icon name="refresh" size={18} />
            </button>
            <button type="button" aria-label="Close chat" title="Close" onClick={closeChat}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white/85 transition hover:bg-white/10 hover:text-white">
              <Icon name="close" size={20} />
            </button>
          </header>

          <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4" role="log" aria-live="polite" aria-label="Conversation">
            {messages.map((m, i) => (
              m.role === "user" ? (
                <div key={i} className="flex justify-end">
                  <div className="max-w-[85%] rounded-2xl rounded-br-md bg-brand-dark px-3.5 py-2.5 text-sm leading-relaxed text-white shadow-sm">
                    <RichText text={m.text} />
                  </div>
                </div>
              ) : (
                <div key={i} className="flex items-start gap-2">
                  <BotAvatar />
                  <div className="min-w-0 max-w-[85%]">
                    <div className="space-y-2 rounded-2xl rounded-tl-md border border-line bg-white px-3.5 py-2.5 text-sm leading-relaxed text-ink shadow-sm">
                      <RichText text={m.text} />
                      {m.cards?.length > 0 && (
                        <div className="space-y-2 pt-1">{m.cards.map((d) => <MiniCard key={d.slug} d={d} onNavigate={() => setOpen(false)} />)}</div>
                      )}
                      {m.links?.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {m.links.map((l) => (
                            <Link key={l.to} to={l.to} onClick={() => setOpen(false)} className="btn-accent !px-3 !py-1.5 !text-xs">{l.label}</Link>
                          ))}
                        </div>
                      )}
                    </div>
                    {canSpeak && (
                      <button type="button" onClick={() => toggleSpeak(i, m.text)} aria-pressed={speakingIdx === i}
                        aria-label={speakingIdx === i ? "Stop reading this message" : "Listen to this message"}
                        className={`mt-1 ml-1 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition ${
                          speakingIdx === i ? "bg-brand-dark text-white" : "text-muted hover:bg-black/5 hover:text-brand-dark"}`}>
                        <Icon name={speakingIdx === i ? "stop" : "speaker"} size={14} />
                        {speakingIdx === i ? "Stop" : "Listen"}
                      </button>
                    )}
                  </div>
                </div>
              )
            ))}
            {busy && (
              <div className="flex items-start gap-2" role="status" aria-label="Assistant is typing">
                <BotAvatar />
                <div className="flex items-center gap-1 rounded-2xl rounded-tl-md border border-line bg-white px-4 py-3.5 shadow-sm">
                  {[0, 150, 300].map((d) => (
                    <span key={d} className="h-2 w-2 animate-bounce rounded-full bg-muted" style={{ animationDelay: `${d}ms` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {!busy && last?.role === "bot" && last.suggestions?.length > 0 && (
            <div className="flex shrink-0 gap-2 overflow-x-auto border-t border-line bg-white/70 px-3 py-2.5">
              {last.suggestions.map((s) => (
                <button key={s} type="button" onClick={() => send(s)}
                  className="shrink-0 rounded-full border border-line bg-white px-3 py-1.5 text-xs font-medium text-brand-dark transition hover:border-brand hover:bg-brand/5">{s}</button>
              ))}
            </div>
          )}

          <div className="shrink-0 border-t border-line bg-white px-3 pb-3 pt-2">
            {(listening || voiceNote.text) && (
              <p role="status" className={`mb-2 flex items-center gap-2 px-1 text-xs ${voiceNote.error ? "text-red-600" : "text-brand-dark"}`}>
                {listening && <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" aria-hidden="true" />}
                {voiceNote.error ? voiceNote.text : "Listening... speak your question"}
              </p>
            )}
            <form onSubmit={(e) => { e.preventDefault(); send(input); }}
              className="flex items-center gap-1.5 rounded-full border border-line bg-surface py-1 pl-4 pr-1 transition focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20">
              <label htmlFor="chat-input" className="sr-only">Type your question</label>
              <input id="chat-input" ref={inputRef} value={input} maxLength={500} autoComplete="off"
                onChange={(e) => setInput(e.target.value)}
                placeholder={listening ? "Listening..." : "Ask about a place, month or budget"}
                className="min-w-0 flex-1 border-0 bg-transparent py-2 text-sm text-ink outline-none placeholder:text-muted focus:!border-transparent focus:!shadow-none focus:ring-0 focus-visible:!outline-none" />
              <button type="button" onClick={toggleListening} disabled={busy} aria-pressed={listening}
                aria-label={listening ? "Stop voice input" : "Speak your question"} title={listening ? "Stop" : "Speak"}
                className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition disabled:opacity-50 ${
                  listening ? "bg-red-500 text-white" : "text-brand-dark hover:bg-brand/10"}`}>
                {listening && <span className="absolute inset-0 animate-ping rounded-full bg-red-400/60" aria-hidden="true" />}
                <span className="relative"><Icon name="mic" size={19} /></span>
              </button>
              <button className="btn-primary !h-10 !w-10 shrink-0 !rounded-full !p-0" aria-label="Send message" disabled={busy || !input.trim()}>
                <Icon name="send" size={18} />
              </button>
            </form>
          </div>
        </section>
      )}

      <button ref={buttonRef} type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open}
        aria-label={open ? "Close travel assistant" : "Open travel assistant"}
        className={`fixed right-4 z-[900] flex h-11 items-center gap-2 rounded-full bg-accent px-4 text-sm font-semibold sm:h-14 sm:px-5 sm:text-base text-navy shadow-xl transition hover:brightness-95 sm:right-5 ${lift} ${open ? "max-sm:hidden" : ""}`}>
        <Icon name={open ? "close" : "chat"} size={22} />
        <span className="hidden sm:inline">{open ? "Close" : "Ask us"}</span>
      </button>
    </div>
  );
}