import React, { useState } from 'react';
import { Mic, FileText, Sparkles, Folder } from 'lucide-react';

export default function App() {
  const [isRecording, setIsRecording] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Navigation */}
      <header className="border-b bg-white border-slate-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-indigo-600" />
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Voice Notes</h1>
        </div>
        <div className="text-sm text-slate-500 font-medium">Capture your ideas instantly</div>
        <div className="text-lg text-slate-500">A PjordanLLC Project</div>
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
              onClick={() => setIsRecording(!isRecording)}
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

          {/* Placeholder for when database is empty */}
          <div className="flex-1 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center p-8 text-center text-slate-400">
            <FileText className="w-12 h-12 mb-3 text-slate-300" />
            <p className="font-medium text-slate-600">No notes found</p>
            <p className="text-xs max-w-xs mt-1">Your saved speech-to-text transcripts, summaries, and action tasks will show up here.</p>
          </div>
        </section>
      </main>
    </div>
  );
}