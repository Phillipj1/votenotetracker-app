import React, { useState } from 'react';
import { Mic, FileText, Sparkles, Folder } from 'lucide-react';

 
// ---------------------------------------------
// Simple inline icons (no extra package needed)
// ---------------------------------------------
// These replace Play / Pencil / Trash2 from lucide-react in case that
// package version doesn't have them available in this project.
function PlayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <polygon points="6,4 20,12 6,20" />
    </svg>
  );
}
 
function PencilIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z" />
    </svg>
  );
}
 
function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}
 
// ---------------------------------------------
// Minimal type declaration for Puter.js
// ---------------------------------------------
// Puter.js attaches itself to the global window object via the <script> tag
// in our HTML — this just tells TypeScript that puter.ai.chat() exists.
declare global {
  interface Window {
    puter: {
      ai: {
        chat: (prompt: string, options?: { model?: string }) => Promise<string>;
      };
    };
  }
}
 
// ---------------------------------------------
// Minimal type declarations for the Web Speech API
// ---------------------------------------------
// TypeScript doesn't ship these by default. This is just enough typing
// to avoid errors — no extra npm package needed.
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: {
    [index: number]: {
      [index: number]: { transcript: string };
      isFinal: boolean;
      length: number;
    };
    length: number;
  };
}
interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
}
 
// ---------------------------------------------
// TYPE for a single saved note
// ---------------------------------------------
// Swap/extend this later once real transcription + audio storage is wired up.
interface Note {
  id: number;
  title: string;
  text: string;
  duration: string; // e.g. "0:51"
  date: string; // display text, e.g. "Jul 4"
  createdAt: number; // real timestamp (ms) — used for accurate date filtering
  audioUrl?: string; // link to the recorded audio, if we have one
  summary?: string; // AI-generated summary, once requested
  isSummarizing?: boolean; // true while we're waiting on the AI response
}
 
export default function App() {
  const [isRecording, setIsRecording] = useState(false);
 
  // Which screen we're showing: the main recording view, or the full Library.
  const [view, setView] = useState<'home' | 'library'>('home');
 
  // What the user has typed into the Library search box.
  const [searchQuery, setSearchQuery] = useState('');
 
  // Which date range filter is active in the Library.
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week'>('all');
 
  // Holds all saved notes. Starts empty — recording adds real notes to this list.
  const [notes, setNotes] = useState<Note[]>([]);
 
  // Holds the active MediaRecorder instance and the audio chunks it's collecting.
  // useRef is used instead of useState because we don't need a re-render when these change.
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const audioChunksRef = React.useRef<Blob[]>([]);
 
  // Holds the active SpeechRecognition instance (the thing that gives us live text).
  const recognitionRef = React.useRef<SpeechRecognition | null>(null);
 
  // Holds the finished, locked-in words so far. Interim (still-being-guessed)
  // words are NOT stored here — only text the browser is confident about.
  const finalTranscriptRef = React.useRef('');
 
  // This is what's actually shown on screen live while recording.
  // It's finalTranscriptRef's text PLUS whatever interim guess is currently forming.
  const [liveTranscript, setLiveTranscript] = useState('');
 
  // Tracks whether we're deliberately stopping (so onend doesn't try to
  // auto-restart recognition right as the user is stopping on purpose).
  const isStoppingRef = React.useRef(false);
 
  // Called when the mic button is clicked. Starts or stops recording depending on current state.
  async function toggleRecording() {
    if (isRecording) {
      // --- STOP RECORDING ---
      isStoppingRef.current = true;
      mediaRecorderRef.current?.stop();
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }
 
    // --- START RECORDING ---
    try {
      // Ask the browser for microphone access (this triggers the permission popup).
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
 
      // --- Part 1: MediaRecorder — captures the actual audio so we can play it back later ---
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];
 
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
 
      recorder.onstop = () => {
        // Combine all the audio chunks into one playable audio file (blob).
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
 
        // Use whatever text Speech Recognition captured live as the note's transcript.
        const transcriptText = finalTranscriptRef.current.trim() || '(No speech detected)';
 
        setNotes((prev) => [
          {
            id: Date.now(),
            title: transcriptText.slice(0, 40) || 'New recording', // quick auto-title from the start of the transcript
            text: transcriptText,
            duration: '—',
            date: 'Today',
            createdAt: Date.now(),
            audioUrl,
          },
          ...prev,
        ]);
 
        // Reset for next time.
        finalTranscriptRef.current = '';
        setLiveTranscript('');
 
        // Stop the mic from staying "on" in the browser tab after we're done.
        stream.getTracks().forEach((track) => track.stop());
      };
 
      recorder.start();
 
      // --- Part 2: SpeechRecognition — gives us LIVE text while talking ---
      // TypeScript doesn't know about this browser API by default, hence the "as any".
      const SpeechRecognitionCtor =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
 
      if (!SpeechRecognitionCtor) {
        alert('Live transcription needs Chrome or Edge — this browser doesn\'t support it. Recording audio only.');
      } else {
        const recognition: SpeechRecognition = new SpeechRecognitionCtor();
        recognitionRef.current = recognition;
 
        recognition.continuous = true; // keep listening instead of stopping after one phrase
        recognition.interimResults = true; // give us "still guessing" text too, not just final text
        recognition.lang = 'en-US';
 
        // Fires repeatedly as speech is recognized — both interim (rough) and final (locked-in) text.
        recognition.onresult = (event: SpeechRecognitionEvent) => {
          let interimText = '';
 
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i];
            if (result.isFinal) {
              // This chunk is locked in — permanently add it to our saved transcript.
              finalTranscriptRef.current += result[0].transcript + ' ';
            } else {
              // Still being guessed — show it, but don't save it permanently yet.
              interimText += result[0].transcript;
            }
          }
 
          // Update what's shown on screen: locked-in text + current rough guess.
          setLiveTranscript(finalTranscriptRef.current + interimText);
        };
 
        // Chrome auto-stops listening after a few seconds of silence.
        // If we're not deliberately stopping, restart it so it feels continuous.
        recognition.onend = () => {
          if (!isStoppingRef.current && isRecording) {
            recognition.start();
          }
        };
 
        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
          console.error('Speech recognition error:', event.error);
        };
 
        isStoppingRef.current = false;
        recognition.start();
      }
 
      setIsRecording(true);
    } catch (err) {
      // This runs if the user denies mic permission, or no mic is available.
      console.error('Could not access microphone:', err);
      alert('Microphone access is required to record. Please allow it and try again.');
    }
  }
 
  // Removes a note by id.
  function deleteNote(id: number) {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  }
 
  // Simple edit using a browser prompt (placeholder — swap for a real modal later).
  function editNote(id: number) {
    const note = notes.find((n) => n.id === id);
    if (!note) return;
 
    const newText = window.prompt('Edit note:', note.text);
    if (newText !== null) {
      setNotes((prev) =>
        prev.map((n) => (n.id === id ? { ...n, text: newText } : n))
      );
    }
  }
 
  // Sends a note's transcript to Puter.js, which asks an AI model to summarize it.
  // No API key, no backend call needed — Puter.js handles this directly in the browser.
  async function summarizeNote(id: number) {
    const note = notes.find((n) => n.id === id);
    if (!note) return;
 
    // Show a loading state on this specific note while we wait.
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isSummarizing: true } : n))
    );
 
    try {
      const prompt = `Summarize this voice note transcript in 1-3 short sentences. Be concise and capture the key point(s):\n\n"${note.text}"`;
 
      const summary = await window.puter.ai.chat(prompt, { model: 'gpt-5-nano' });
 
      setNotes((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, summary, isSummarizing: false } : n
        )
      );
    } catch (err) {
      console.error('Failed to summarize:', err);
      setNotes((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, isSummarizing: false } : n
        )
      );
      alert('Could not summarize this note. Please try again.');
    }
  }
  function playNote(id: number) {
    const note = notes.find((n) => n.id === id);
    if (note?.audioUrl) {
      new Audio(note.audioUrl).play();
    } else {
      console.log('No audio available for this note yet.');
    }
  }
 
  // Figures out which notes to show in the Library based on the search box
  // and the selected date filter (Today / This Week / All Time).
  function getFilteredNotes(): Note[] {
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
 
    return notes.filter((note) => {
      // Date filter check
      if (dateFilter === 'today' && now - note.createdAt > oneDayMs) {
        return false;
      }
      if (dateFilter === 'week' && now - note.createdAt > oneDayMs * 7) {
        return false;
      }
 
      // Search check — matches against title or transcript text (case-insensitive)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = note.title.toLowerCase().includes(query);
        const matchesText = note.text.toLowerCase().includes(query);
        if (!matchesTitle && !matchesText) return false;
      }
 
      return true;
    });
  }
 
  // Renders one note as a card. Shared by both the Home panel and the Library
  // so we don't maintain two copies of the same markup.
  function renderNoteCard(note: Note) {
    return (
      <div
        key={note.id}
        className="flex items-start gap-4 border border-slate-200 rounded-xl p-4"
      >
        {/* Play button */}
        <button
          onClick={() => playNote(note.id)}
          className="w-10 h-10 rounded-full bg-indigo-50 hover:bg-indigo-100 flex items-center justify-center flex-shrink-0"
        >
          <PlayIcon className="w-4 h-4 text-indigo-600" />
        </button>
 
        {/* Title, transcript text, meta info */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-800">{note.title}</p>
          <p className="text-sm text-slate-600 mt-1">{note.text}</p>
          <div className="flex gap-3 text-xs text-slate-400 mt-2">
            <span>{note.duration}</span>
            <span>{note.date}</span>
          </div>
 
          {/* Summarize button — only show if we don't already have a summary */}
          {!note.summary && (
            <button
              onClick={() => summarizeNote(note.id)}
              disabled={note.isSummarizing}
              className="mt-3 text-xs font-medium text-indigo-600 hover:text-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {note.isSummarizing ? 'Summarizing...' : '✨ Summarize'}
            </button>
          )}
 
          {/* Once we have a summary, show it in a highlighted box */}
          {note.summary && (
            <div className="mt-3 bg-indigo-50 border border-indigo-100 rounded-lg p-3">
              <p className="text-xs font-semibold text-indigo-700 mb-1">AI Summary</p>
              <p className="text-sm text-indigo-900">{note.summary}</p>
            </div>
          )}
        </div>
 
        {/* Edit / Delete buttons */}
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={() => editNote(note.id)}
            className="text-slate-400 hover:text-slate-700 p-1"
            title="Edit"
          >
            <PencilIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => deleteNote(note.id)}
            className="text-slate-400 hover:text-rose-600 p-1"
            title="Delete"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }
 
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Navigation */}
      <header className="border-b bg-white border-slate-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-indigo-600" />
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Voice Notes</h1>
        </div>
        <div className="text-sm text-slate-500 font-medium">Capture your ideas instantly</div>
        <div className="text-sm text-slate-500 font-medium">PJordanLLC Project</div>

 
        {/* Toggle between Home and Library screens */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setView('home')}
            className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
              view === 'home'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Home
          </button>
          <button
            onClick={() => setView('library')}
            className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
              view === 'library'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Library
          </button>
        </div>
      </header>
 
      {view === 'home' ? (
        /* ---------------------------------------------
           HOME VIEW — recording console + recent notes
        --------------------------------------------- */
        <main className="flex-1 max-w-6xl w-full mx-auto p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
 
          {/* Left Column: Voice Capture Console */}
          <section className="md:col-span-1 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between h-[400px]">
            <div>
              <h2 className="text-lg font-semibold text-slate-800 mb-2">Voice Capture</h2>
              <p className="text-sm text-slate-500">Record your thoughts, lectures, or meetings. Let AI handle the heavy lifting.</p>
            </div>
 
            <div className="flex flex-col items-center justify-center gap-4">
              <button
                onClick={toggleRecording}
                className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 shadow-md ${
                  isRecording
                    ? 'bg-rose-500 hover:bg-rose-600 animate-pulse text-white'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }`}
              >
                <Mic className="w-10 h-10" />
              </button>
              <span className="text-sm font-medium text-slate-600">
                {isRecording ? 'Listening carefully...' : 'Tap to start recording'}
              </span>
 
              {/* Live transcript preview — updates in real time while recording */}
              {isRecording && (
                <p className="text-xs text-slate-500 text-center px-2 max-h-20 overflow-y-auto">
                  {liveTranscript || 'Say something...'}
                </p>
              )}
            </div>
 
            <div className="text-xs text-slate-400 text-center">
              Max recording length: 10 minutes
            </div>
          </section>
 
          {/* Right Column: Audio Notes Library (recent notes preview) */}
          <section className="md:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-slate-800">Your Transcripts & Insights</h2>
              <p className="text-sm text-slate-500">Select a saved note below to see its AI breakdown.</p>
            </div>
 
            {/* If there are no notes yet, show the original empty-state placeholder */}
            {notes.length === 0 ? (
              <div className="flex-1 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center p-8 text-center text-slate-400">
                <FileText className="w-12 h-12 mb-3 text-slate-300" />
                <p className="font-medium text-slate-600">No notes found</p>
                <p className="text-xs max-w-xs mt-1">Your saved speech-to-text transcripts, summaries, and action tasks will show up here.</p>
              </div>
            ) : (
              // Otherwise, list out each saved note as a card
              <div className="flex-1 overflow-y-auto space-y-3">
                {notes.map((note) => renderNoteCard(note))}
              </div>
            )}
          </section>
        </main>
      ) : (
        /* ---------------------------------------------
           LIBRARY VIEW — full searchable/filterable list
        --------------------------------------------- */
        <main className="flex-1 max-w-4xl w-full mx-auto p-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-slate-800">Library</h2>
              <p className="text-sm text-slate-500">All your saved voice notes in one place.</p>
            </div>
 
            {/* Search + date filter controls */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search notes..."
                className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as 'all' | 'today' | 'week')}
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
              >
                <option value="all">All time</option>
                <option value="today">Today</option>
                <option value="week">This week</option>
              </select>
            </div>
 
            {/* Filtered results */}
            {getFilteredNotes().length === 0 ? (
              <div className="border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center p-8 text-center text-slate-400">
                <FileText className="w-12 h-12 mb-3 text-slate-300" />
                <p className="font-medium text-slate-600">
                  {notes.length === 0 ? 'No notes found' : 'No notes match your search'}
                </p>
                <p className="text-xs max-w-xs mt-1">
                  {notes.length === 0
                    ? 'Record a note from the Home screen to see it here.'
                    : 'Try a different search term or date range.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {getFilteredNotes().map((note) => renderNoteCard(note))}
              </div>
            )}
          </div>
        </main>
      )}
    </div>
  );
}
 