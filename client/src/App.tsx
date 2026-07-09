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
// TYPE for a single saved note
// ---------------------------------------------
// Swap/extend this later once real transcription + audio storage is wired up.
interface Note {
  id: number;
  title: string;
  text: string;
  duration: string; // e.g. "0:51"
  date: string; // e.g. "Jul 4"
}
 
export default function App() {
  const [isRecording, setIsRecording] = useState(false);
 
  // Holds all saved notes. Starts with one sample note so you can SEE the
  // card design right away. Delete this sample note (or clear the array)
  // once you wire up real recording/transcription.
  const [notes, setNotes] = useState<Note[]>([
    {
      id: 1,
      title: "Sample note",
      text: "This is a placeholder note so you can see what a saved transcript looks like in the list. Record a real one or delete this to clear it out.",
      duration: "0:24",
      date: "Yesterday",
    },
  ]);
 
  // Called when the mic button is clicked (toggles recording on/off).
  function toggleRecording() {
    setIsRecording((prev) => !prev);
 
    // TODO: this is where real audio recording + AI transcription hooks in.
    // Once you get a transcript back, add it to the list like this:
    //
    // setNotes((prev) => [
    //   { id: Date.now(), title: "New note", text: transcriptText, duration: "0:00", date: "Today" },
    //   ...prev,
    // ]);
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
 
  // Placeholder for playing back a note's audio.
  function playNote(id: number) {
    // TODO: hook up real audio playback here (e.g. new Audio(note.audioUrl).play())
    console.log('Playing note', id);
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
        <div className="text-lg text-slate-500">A PjordanLLC Project </div>
      </header>
 
      {/* Main Container */}
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
          </div>
 
          <div className="text-xs text-slate-400 text-center">
            Max recording length: 10 minutes
          </div>
        </section>
 
        {/* Right Column: Audio Notes Library */}
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
              {notes.map((note) => (
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
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
 