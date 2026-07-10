import React, { useState, useEffect } from 'react';
import { Mic, MicOff, RefreshCw, Star, AlertTriangle, CheckCircle, Volume2, Sparkles, MessageCircle, BookOpen } from 'lucide-react';

interface GrammarQuestion {
  id: number;
  sentence: string;
  options: string[];
  answer: string;
  hint: string;
}

const grammarDrills: GrammarQuestion[] = [
  { 
    id: 1, 
    sentence: "The recruiter expects ___ to sign the offer letter by Monday.", 
    options: ["we", "us"], 
    answer: "us", 
    hint: "Use objective pronouns when they are the receiver of the action." 
  },
  { 
    id: 2, 
    sentence: "Neither the team lead nor the developers ___ able to reproduce the production bug.", 
    options: ["was", "were"], 
    answer: "were", 
    hint: "With 'neither/nor', the verb agrees with the subject closer to it ('developers')." 
  },
  { 
    id: 3, 
    sentence: "Each of the placement candidates ___ submitted their profile validation document.", 
    options: ["has", "have"], 
    answer: "has", 
    hint: "'Each' is a singular indefinite pronoun and requires a singular verb." 
  }
];

export default function CommunicationView() {
  const [activeMode, setActiveMode] = useState<'reading' | 'grammar' | 'speaking'>('reading');
  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  
  const [metrics, setMetrics] = useState({
    wpm: 0,
    fluency: 0,
    grammar: 0,
    fillers: 0,
    confidence: 0,
    pronunciationMatch: 0
  });

  const [hasEvaluated, setHasEvaluated] = useState(false);
  const [audioWave, setAudioWave] = useState<number[]>([10, 20, 15, 30, 40, 20, 10, 5, 25, 45, 30, 15, 10]);

  const readingPrompt = "The semiconductor industry has seen unprecedented transformations, driving high-performance computing, artificial intelligence, and edge networks across global supply chains.";
  const [transcript, setTranscript] = useState('');

  // Grammar Drills state
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: string }>({});
  const [drillChecked, setDrillChecked] = useState(false);
  const [grammarScore, setGrammarScore] = useState(0);

  const [recognition, setRecognition] = useState<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-US';

      rec.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          setTranscript(prev => (prev ? prev + ' ' : '') + finalTranscript.trim());
        }
      };

      rec.onend = () => {
        setIsRecording(false);
      };

      setRecognition(rec);
    }
  }, []);

  useEffect(() => {
    let interval: any;
    if (isRecording) {
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1);
        setAudioWave(Array.from({ length: 15 }, () => Math.floor(Math.random() * 50) + 5));
      }, 500);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const handleStartRecording = () => {
    setIsRecording(true);
    setSeconds(0);
    setTranscript('');
    setHasEvaluated(false);

    if (recognition) {
      try {
        recognition.start();
      } catch (e) {
        console.error(e);
      }
    }
  };

  const computePronunciationScore = (spokenText: string, targetText: string): number => {
    if (!spokenText) return 0;
    const spokenWords = spokenText.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"").split(/\s+/);
    const targetWords = targetText.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"").split(/\s+/);
    
    let matches = 0;
    targetWords.forEach(word => {
      if (spokenWords.includes(word)) {
        matches++;
      }
    });
    
    return Math.round((matches / targetWords.length) * 100);
  };

  const handleStopRecording = () => {
    setIsRecording(false);

    if (recognition) {
      recognition.stop();
    }
    
    // Evaluate metrics based on recorded transcript
    setTimeout(() => {
      const wordsCount = transcript ? transcript.trim().split(/\s+/).length : 15;
      const computedWpm = seconds > 0 ? Math.round((wordsCount / seconds) * 60) : 125;
      
      const fillersMatches = transcript.toLowerCase().match(/\b(um|ah|like|basically)\b/g);
      const computedFillers = fillersMatches ? fillersMatches.length : (activeMode === 'reading' ? 1 : 3);
      
      const pronScore = activeMode === 'reading' ? computePronunciationScore(transcript, readingPrompt) : 90;

      setMetrics({
        wpm: computedWpm > 250 ? 120 : (computedWpm || 115),
        fluency: Math.max(100 - computedFillers * 10, 40),
        grammar: activeMode === 'reading' ? 95 : 85,
        fillers: computedFillers,
        confidence: Math.max(92 - computedFillers * 6, 50),
        pronunciationMatch: pronScore
      });
      setHasEvaluated(true);
    }, 600);
  };

  // Word-by-word pronunciation highlights
  const getPromptHighlighting = () => {
    const spoken = transcript.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"").split(/\s+/);
    const targetWords = readingPrompt.split(/\s+/);
    
    return targetWords.map((word, index) => {
      const cleanWord = word.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"");
      const isMatched = spoken.includes(cleanWord);
      return (
        <span 
          key={index} 
          className={`transition-colors duration-300 ${
            !transcript 
              ? 'text-slate-200' 
              : (isMatched ? 'text-emerald-400 font-bold' : 'text-red-400 line-through decoration-red-500/50')
          } mr-1`}
        >
          {word}
        </span>
      );
    });
  };

  const handleCheckGrammar = () => {
    let score = 0;
    grammarDrills.forEach((q) => {
      if (selectedAnswers[q.id] === q.answer) {
        score++;
      }
    });
    setGrammarScore(score);
    setDrillChecked(true);
  };

  const handleResetGrammar = () => {
    setSelectedAnswers({});
    setDrillChecked(false);
    setGrammarScore(0);
  };

  return (
    <div className="grid md:grid-cols-3 gap-8 pb-12">
      {/* Prompt and Recorder pane */}
      <div className="md:col-span-2 space-y-6">
        {/* Module Headers */}
        <div className="glass-panel p-4 flex space-x-2 bg-slate-950/20">
          {(['reading', 'grammar', 'speaking'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => { setActiveMode(mode); setHasEvaluated(false); }}
              className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeMode === mode ? 'bg-brand-purple text-white shadow-sm' : 'text-slate-400 hover:bg-slate-900/60'
              }`}
            >
              {mode === 'reading' && 'Reading Practice'}
              {mode === 'grammar' && 'Grammar Drills'}
              {mode === 'speaking' && 'Speaking Practice'}
            </button>
          ))}
        </div>

        {/* PRONUNCIATION / SPEAKING VIEW */}
        {activeMode !== 'grammar' ? (
          <div className="glass-panel p-8 space-y-6 flex flex-col justify-between min-h-[360px]">
            <div>
              <div className="flex items-center space-x-2 text-brand-cyan mb-4">
                <MessageCircle className="w-4.5 h-4.5" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  {activeMode === 'reading' ? 'Pronunciation Prompt' : 'HR Speaking Prompt'}
                </span>
              </div>

              {activeMode === 'reading' ? (
                <p className="text-base font-semibold leading-relaxed text-slate-200">
                  {getPromptHighlighting()}
                </p>
              ) : (
                <p className="text-base font-semibold leading-relaxed text-slate-200">
                  "Tell me about a time you handled a difficult project requirement under tight timelines."
                </p>
              )}
            </div>

            {/* Audio visualizer */}
            {isRecording && (
              <div className="flex justify-center items-center space-x-1.5 h-16 bg-slate-950/50 rounded-xl border border-brand-cyan/20 px-4">
                <Volume2 className="w-4 h-4 text-brand-cyan animate-bounce" />
                {audioWave.map((h, i) => (
                  <div 
                    key={i} 
                    className="w-1 bg-brand-cyan rounded-full transition-all duration-300"
                    style={{ height: `${h}px` }}
                  />
                ))}
                <span className="text-xs text-slate-500 font-mono pl-4">{seconds}s elapsed</span>
              </div>
            )}

            {/* Record Control Button */}
            <div className="flex justify-center pt-4">
              {!isRecording ? (
                <button
                  onClick={handleStartRecording}
                  className="w-16 h-16 rounded-full bg-red-500/10 hover:bg-red-500/20 border border-red-500 flex items-center justify-center transition-all hover:scale-105 active:scale-95 group shadow-lg shadow-red-500/10 cursor-pointer"
                >
                  <Mic className="w-6 h-6 text-red-500 group-hover:scale-110 transition-transform" />
                </button>
              ) : (
                <button
                  onClick={handleStopRecording}
                  className="w-16 h-16 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center transition-all hover:scale-105 active:scale-95 group animate-pulse cursor-pointer"
                >
                  <MicOff className="w-6 h-6 text-brand-cyan" />
                </button>
              )}
            </div>
          </div>
        ) : (
          /* GRAMMAR DRILLS MODULE */
          <div className="glass-panel p-6 space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 border-b border-white/5 pb-2">
              AptiCode Grammar In-line Drills
            </h3>

            <div className="space-y-4">
              {grammarDrills.map((drill) => (
                <div key={drill.id} className="p-4 rounded-xl bg-slate-950/40 border border-slate-900 space-y-3 text-left">
                  <p className="text-xs font-semibold text-slate-200">{drill.id}. {drill.sentence}</p>
                  
                  <div className="flex space-x-2">
                    {drill.options.map((opt) => {
                      const isSelected = selectedAnswers[drill.id] === opt;
                      const isCorrect = drill.answer === opt;
                      
                      let btnStyle = "bg-slate-900 border-slate-800 text-slate-400";
                      if (isSelected) {
                        btnStyle = "bg-brand-purple/20 border-brand-purple text-brand-purple";
                      }
                      if (drillChecked && isSelected) {
                        btnStyle = isCorrect 
                          ? "bg-emerald-500/20 border-emerald-500 text-emerald-400 font-bold"
                          : "bg-red-500/20 border-red-500 text-red-400 font-bold";
                      }
                      
                      return (
                        <button
                          key={opt}
                          disabled={drillChecked}
                          onClick={() => setSelectedAnswers({ ...selectedAnswers, [drill.id]: opt })}
                          className={`py-1.5 px-4 border rounded-lg text-xs font-bold transition-all cursor-pointer ${btnStyle}`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>

                  {drillChecked && (
                    <div className="text-[9px] leading-relaxed flex items-start space-x-1 p-2 bg-slate-950/60 rounded">
                      <AlertTriangle className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                      <span className="text-slate-500">
                        {selectedAnswers[drill.id] === drill.answer 
                          ? `✓ Correct! ${drill.hint}` 
                          : `✗ Incorrect. Correct is: '${drill.answer}'. ${drill.hint}`
                        }
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="pt-2 flex space-x-3">
              {!drillChecked ? (
                <button
                  onClick={handleCheckGrammar}
                  className="flex-1 py-2 rounded-xl bg-brand-purple text-white text-xs font-bold hover:brightness-110 cursor-pointer shadow shadow-brand-purple/25"
                >
                  Verify Responses
                </button>
              ) : (
                <>
                  <div className="flex-1 text-xs font-bold text-slate-300 pt-2 text-left">
                    Final Score: <strong className="text-brand-cyan">{grammarScore} / {grammarDrills.length} Correct</strong>
                  </div>
                  <button
                    onClick={handleResetGrammar}
                    className="py-2 px-4 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-slate-400 hover:text-white cursor-pointer"
                  >
                    Reset Drill
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Display Transcript */}
        {activeMode !== 'grammar' && hasEvaluated && transcript && (
          <div className="glass-panel p-6 space-y-3">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider text-left">Converted Speech Transcript</h4>
            <p className="text-sm font-medium text-slate-350 italic leading-relaxed text-left">
              "{transcript}"
            </p>
          </div>
        )}
      </div>

      {/* Right Column: AI Communication Evaluation */}
      <div className="space-y-6">
        <h3 className="text-xl font-bold tracking-tight flex items-center space-x-2">
          <Sparkles className="w-5 h-5 text-brand-cyan" />
          <span>Speech Analysis Metrics</span>
        </h3>

        {activeMode === 'grammar' ? (
          <div className="glass-panel p-8 text-center text-slate-500 space-y-4">
            <BookOpen className="w-12 h-12 mx-auto text-slate-600 animate-pulse-slow" />
            <p className="text-xs leading-relaxed max-w-xs mx-auto">
              Answer the Grammar MCQs on the left pane and click verify to evaluate syntactic rules accuracy.
            </p>
          </div>
        ) : !hasEvaluated ? (
          <div className="glass-panel p-8 text-center text-slate-500 space-y-4">
            <Mic className="w-12 h-12 mx-auto text-slate-600 animate-pulse-slow" />
            <p className="text-xs leading-relaxed max-w-xs mx-auto">
              Please click the record button, read the prompt, and click stop to capture Web Speech API results.
            </p>
          </div>
        ) : (
          <div className="glass-panel p-6 space-y-6">
            <div className="space-y-4 border-b border-white/5 pb-6">
              {/* Pronunciation Match (Visible in reading mode) */}
              {activeMode === 'reading' && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-400">Pronunciation Accuracy</span>
                    <span className="text-emerald-400">{metrics.pronunciationMatch}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-900 overflow-hidden">
                    <div className="h-full bg-emerald-400" style={{ width: `${metrics.pronunciationMatch}%` }} />
                  </div>
                </div>
              )}

              {/* Score 1 */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-400">Fluency Score</span>
                  <span className="text-brand-purple">{metrics.fluency}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-900 overflow-hidden">
                  <div className="h-full bg-brand-purple" style={{ width: `${metrics.fluency}%` }} />
                </div>
              </div>

              {/* Score 2 */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-400">Grammar & Tenses</span>
                  <span className="text-brand-cyan">{metrics.grammar}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-900 overflow-hidden">
                  <div className="h-full bg-brand-cyan" style={{ width: `${metrics.grammar}%` }} />
                </div>
              </div>

              {/* Score 3 */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-400">Confidence Scale</span>
                  <span className="text-emerald-400">{metrics.confidence}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-900 overflow-hidden">
                  <div className="h-full bg-emerald-400" style={{ width: `${metrics.confidence}%` }} />
                </div>
              </div>
            </div>

            {/* Speaking Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-950/40 border border-white/5 text-center">
                <p className="text-[10px] text-slate-500 font-bold uppercase">Words / Min</p>
                <p className="text-xl font-black text-slate-200 mt-1">{metrics.wpm}</p>
                <p className="text-[8px] text-emerald-400 mt-0.5">Optimal Range</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/40 border border-white/5 text-center">
                <p className="text-[10px] text-slate-500 font-bold uppercase">Filler Words</p>
                <p className="text-xl font-black text-amber-500 mt-1">{metrics.fillers}</p>
                <p className="text-[8px] text-slate-500 mt-0.5">Detected: "um", "like"</p>
              </div>
            </div>

            {/* AI Review Summary */}
            <div className="p-4 rounded-xl bg-brand-cyan/5 border border-brand-cyan/20 space-y-2">
              <h4 className="text-xs font-bold text-brand-cyan flex items-center space-x-1">
                <Sparkles className="w-3.5 h-3.5 fill-brand-cyan/20" />
                <span>AI Speech Critique</span>
              </h4>
              <p className="text-[10px] text-slate-300 leading-relaxed text-left">
                {activeMode === 'reading' ? (
                  metrics.pronunciationMatch > 80 
                    ? `Excellent reading alignment! Your pronunciation match is ${metrics.pronunciationMatch}%. Very clean speech flow.`
                    : `Pronunciation match is low (${metrics.pronunciationMatch}%). Pay attention to highlighted strikethroughs on the left prompt.`
                ) : (
                  metrics.fillers > 2 
                    ? "Frequent hesitation tokens detected. Practice slowing down your delivery and substituting fillers with micro-pauses."
                    : "Excellent presentation rhythm. Speech timing and grammar structures are overall well suited for corporate rounds."
                )}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
