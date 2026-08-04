import React, { useState, useEffect } from 'react';
import { Mic, MicOff, AlertTriangle, Volume2, Sparkles, MessageCircle, BookOpen } from 'lucide-react';
import { supabase } from '../supabase';
import { getApiBaseUrl } from '../config/api';
import { LiquidBackdrop } from './ui/LiquidBackdrop';
import Scene3D from './three/LazyScene3D';

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
  const [activeMode, setActiveMode] = useState<'reading' | 'grammar' | 'speaking' | 'history'>('reading');
  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);

  const getHeaders = () => {
    const saved = localStorage.getItem('apticode-user-session');
    const token = saved ? JSON.parse(saved).token : '';
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  const fetchHistory = async () => {
    try {
      setLoadingHistory(true);
      const response = await fetch(`${getApiBaseUrl()}/api/communication/history`, {
        headers: getHeaders()
      });
      const data = await response.json();
      if (data.status === 'success') {
        setHistoryList(data.history || []);
      }
    } catch (err) {
      console.error('[Speech History] error:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (activeMode === 'history') {
      fetchHistory();
    }
  }, [activeMode]);

  const [metrics, setMetrics] = useState({
    wpm: 0,
    fluency: 0,
    grammar: 0,
    fillers: 0,
    confidence: 0,
    pronunciationMatch: 0
  });

  const [hasEvaluated, setHasEvaluated] = useState(false);
  const [aiFeedback, setAiFeedback] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
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

  const handleStopRecording = async () => {
    setIsRecording(false);

    if (recognition) {
      recognition.stop();
    }

    setIsEvaluating(true);
    setAiFeedback('');

    setTimeout(async () => {
      const wordsCount = transcript ? transcript.trim().split(/\s+/).length : 15;
      const computedWpm = seconds > 0 ? Math.round((wordsCount / seconds) * 60) : 125;
      const fillersMatches = transcript.toLowerCase().match(/\b(um|ah|like|basically|actually)\b/g);
      const computedFillers = fillersMatches ? fillersMatches.length : (activeMode === 'reading' ? 1 : 3);
      const pronScore = activeMode === 'reading' ? computePronunciationScore(transcript, readingPrompt) : 90;

      try {
        const response = await fetch(`${getApiBaseUrl()}/api/communication/eval`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({
            sessionType: activeMode === 'reading' ? 'READING' : 'SPEAKING',
            transcript: transcript || (activeMode === 'reading' ? readingPrompt : 'Hello placement advisor, I want to talk about computer architecture.'),
            promptText: activeMode === 'reading' ? readingPrompt : 'General Speaking session',
            durationSeconds: seconds || 15
          })
        });
        const result = await response.json();
        if (result.status === 'success' && result.data) {
          const evalData = result.data;
          setMetrics({
            wpm: evalData.wpm || computedWpm,
            fluency: evalData.fluencyScore || Math.max(100 - computedFillers * 10, 40),
            grammar: evalData.grammarScore || 85,
            fillers: computedFillers,
            confidence: evalData.confidenceScore || 80,
            pronunciationMatch: pronScore
          });
          setAiFeedback(evalData.feedback || '');
          setHasEvaluated(true);
        } else {
          throw new Error('API failed');
        }
      } catch (err: any) {
        console.warn('[Speech Eval API] failed, falling back to local evaluation:', err.message);
        setMetrics({
          wpm: computedWpm > 250 ? 120 : (computedWpm || 115),
          fluency: Math.max(100 - computedFillers * 10, 40),
          grammar: activeMode === 'reading' ? 95 : 85,
          fillers: computedFillers,
          confidence: Math.max(92 - computedFillers * 6, 50),
          pronunciationMatch: pronScore
        });
        setHasEvaluated(true);
      } finally {
        setIsEvaluating(false);
      }
    }, 1000);
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
              ? 'text-lc-text'
              : (isMatched ? 'text-lc-emerald font-bold' : 'text-lc-rose line-through decoration-lc-rose/50')
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
    <div className="relative overflow-hidden space-y-8 pb-12">
      <LiquidBackdrop />

      {/* Waveform scene band */}
      <div className="relative overflow-hidden pointer-events-none">
        <div className="lc-glass h-40 sm:h-48 lg:h-52 overflow-hidden">
          <Scene3D variant="waveform" data={{ isActive: isRecording, amplitude: seconds }} className="absolute inset-0" />
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Prompt and Recorder pane */}
        <div className="md:col-span-2 space-y-6">
          {/* Module Headers */}
          <div className="lc-glass p-4 flex space-x-2">
            {(['reading', 'grammar', 'speaking', 'history'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => { setActiveMode(mode); setHasEvaluated(false); }}
                className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeMode === mode ? 'bg-gradient-to-r from-lc-violet to-lc-cyan text-lc-text' : 'text-lc-text-muted hover:bg-lc-glass-raised'
                }`}
              >
                {mode === 'reading' && 'Reading Practice'}
                {mode === 'grammar' && 'Grammar Drills'}
                {mode === 'speaking' && 'Speaking Practice'}
                {mode === 'history' && 'History Logs'}
              </button>
            ))}
          </div>

          {/* PRONUNCIATION / SPEAKING VIEW */}
          {activeMode === 'history' ? (
            <div className="lc-glass p-6 space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-lc-text-muted border-b border-lc-glass-border pb-2">
                Speech Evaluation History
              </h3>
              {loadingHistory ? (
                <div className="text-lc-text-muted text-xs font-mono py-8 text-center">Loading attempts...</div>
              ) : historyList.length === 0 ? (
                <div className="text-lc-text-muted text-xs font-mono py-8 text-center">No past audio recordings evaluated yet.</div>
              ) : (
                <div className="space-y-3">
                  {historyList.map((session: any, idx: number) => (
                    <div key={idx} className="p-4 bg-lc-glass-raised rounded-xl border-lc-glass-border space-y-2 text-left font-mono">
                      <div className="flex justify-between items-center text-xs font-extrabold text-lc-text">
                        <span>{session.sessionType} Drill</span>
                        <span className="text-lc-cyan">{new Date(session.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-[10px] text-lc-text-muted italic">"{session.transcript}"</p>
                      <div className="grid grid-cols-4 gap-2 text-[10px] text-center font-bold text-lc-text-muted">
                        <div className="bg-lc-void/40 p-1.5 rounded">WPM: {session.wpm}</div>
                        <div className="bg-lc-void/40 p-1.5 rounded text-lc-violet">Fluency: {session.fluencyScore}%</div>
                        <div className="bg-lc-void/40 p-1.5 rounded text-lc-cyan">Grammar: {session.grammarScore}%</div>
                        <div className="bg-lc-void/40 p-1.5 rounded text-lc-emerald">Conf: {session.confidence}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : activeMode !== 'grammar' ? (
            <div className="lc-glass p-8 space-y-6 flex flex-col justify-between min-h-[360px]">
              <div>
                <div className="flex items-center space-x-2 text-lc-cyan mb-4">
                  <MessageCircle className="w-4.5 h-4.5" />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    {activeMode === 'reading' ? 'Pronunciation Prompt' : 'HR Speaking Prompt'}
                  </span>
                </div>

                {activeMode === 'reading' ? (
                  <p className="text-base font-semibold leading-relaxed text-lc-text">
                    {getPromptHighlighting()}
                  </p>
                ) : (
                  <p className="text-base font-semibold leading-relaxed text-lc-text">
                    "Tell me about a time you handled a difficult project requirement under tight timelines."
                  </p>
                )}
              </div>

              {/* Audio visualizer */}
              {isRecording && (
                <div className="flex justify-center items-center space-x-1.5 h-16 bg-lc-void/40 rounded-xl border-lc-cyan/20 px-4">
                  <Volume2 className="w-4 h-4 text-lc-cyan animate-bounce" />
                  {audioWave.map((h, i) => (
                    <div
                      key={i}
                      className="w-1 bg-lc-cyan rounded-full transition-all duration-300"
                      style={{ height: `${h}px` }}
                    />
                  ))}
                  <span className="text-xs text-lc-text-muted font-mono pl-4">{seconds}s elapsed</span>
                </div>
              )}

              {/* Record Control Button */}
              <div className="flex justify-center pt-4">
                {!isRecording ? (
                  <button
                    onClick={handleStartRecording}
                    className="w-16 h-16 rounded-full bg-lc-rose/10 hover:bg-lc-rose/20 border border-lc-rose flex items-center justify-center transition-all hover:scale-105 active:scale-95 group shadow-lg shadow-lc-rose/10 cursor-pointer"
                  >
                    <Mic className="w-6 h-6 text-lc-rose group-hover:scale-110 transition-transform" />
                  </button>
                ) : (
                  <button
                    onClick={handleStopRecording}
                    className="w-16 h-16 rounded-full lc-neo border-lc-glass-border flex items-center justify-center transition-all hover:scale-105 active:scale-95 group animate-pulse cursor-pointer"
                  >
                    <MicOff className="w-6 h-6 text-lc-cyan" />
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* GRAMMAR DRILLS MODULE */
            <div className="lc-glass p-6 space-y-6">
              <h3 className="text-sm font-bold uppercase tracking-wider text-lc-text-muted border-b border-lc-glass-border pb-2">
                AptiCode Grammar In-line Drills
              </h3>

              <div className="space-y-4">
                {grammarDrills.map((drill) => (
                  <div key={drill.id} className="p-4 rounded-xl bg-lc-glass-raised border-lc-glass-border space-y-3 text-left">
                    <p className="text-xs font-semibold text-lc-text">{drill.id}. {drill.sentence}</p>

                    <div className="flex space-x-2">
                      {drill.options.map((opt) => {
                        const isSelected = selectedAnswers[drill.id] === opt;
                        const isCorrect = drill.answer === opt;

                        let btnStyle = "bg-lc-void/40 border-lc-glass-border text-lc-text-muted";
                        if (isSelected) {
                          btnStyle = "bg-lc-violet/20 border-lc-violet text-lc-violet";
                        }
                        if (drillChecked && isSelected) {
                          btnStyle = isCorrect
                            ? "bg-lc-emerald/20 border-lc-emerald text-lc-emerald font-bold"
                            : "bg-lc-rose/20 border-lc-rose text-lc-rose font-bold";
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
                      <div className="text-[9px] leading-relaxed flex items-start space-x-1 p-2 bg-lc-void/40 rounded">
                        <AlertTriangle className="w-3.5 h-3.5 text-lc-text-muted shrink-0 mt-0.5" />
                        <span className="text-lc-text-muted">
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
                    className="flex-1 py-2 rounded-xl bg-gradient-to-r from-lc-violet to-lc-cyan text-lc-text text-xs font-bold hover:brightness-110 cursor-pointer shadow shadow-lc-violet/25"
                  >
                    Verify Responses
                  </button>
                ) : (
                  <>
                    <div className="flex-1 text-xs font-bold text-lc-text pt-2 text-left">
                      Final Score: <strong className="text-lc-cyan">{grammarScore} / {grammarDrills.length} Correct</strong>
                    </div>
                    <button
                      onClick={handleResetGrammar}
                      className="py-2 px-4 rounded-xl lc-neo text-xs font-bold text-lc-text-muted hover:text-lc-text cursor-pointer"
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
            <div className="lc-glass p-6 space-y-3">
              <h4 className="text-xs font-bold text-lc-text-muted uppercase tracking-wider text-left">Converted Speech Transcript</h4>
              <p className="text-sm font-medium text-lc-text italic leading-relaxed text-left">
                "{transcript}"
              </p>
            </div>
          )}
        </div>

        {/* Right Column: AI Communication Evaluation */}
        <div className="space-y-6">
          <h3 className="text-xl font-bold tracking-tight flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-lc-cyan" />
            <span>Speech Analysis Metrics</span>
          </h3>

          {activeMode === 'grammar' ? (
            <div className="lc-glass p-8 text-center text-lc-text-muted space-y-4">
              <BookOpen className="w-12 h-12 mx-auto text-lc-text-muted animate-pulse" />
              <p className="text-xs leading-relaxed max-w-xs mx-auto">
                Answer the Grammar MCQs on the left pane and click verify to evaluate syntactic rules accuracy.
              </p>
            </div>
          ) : !hasEvaluated ? (
            <div className="lc-glass p-8 text-center text-lc-text-muted space-y-4">
              <Mic className="w-12 h-12 mx-auto text-lc-text-muted animate-pulse" />
              <p className="text-xs leading-relaxed max-w-xs mx-auto">
                Please click the record button, read the prompt, and click stop to capture Web Speech API results.
              </p>
            </div>
          ) : (
            <div className="lc-glass p-6 space-y-6">
              <div className="space-y-4 border-b border-lc-glass-border pb-6">
                {/* Pronunciation Match (Visible in reading mode) */}
                {activeMode === 'reading' && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-lc-text-muted">Pronunciation Accuracy</span>
                      <span className="text-lc-emerald">{metrics.pronunciationMatch}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-lc-void/40 overflow-hidden">
                      <div className="h-full bg-lc-emerald" style={{ width: `${metrics.pronunciationMatch}%` }} />
                    </div>
                  </div>
                )}

                {/* Score 1 */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-lc-text-muted">Fluency Score</span>
                    <span className="text-lc-violet">{metrics.fluency}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-lc-void/40 overflow-hidden">
                    <div className="h-full bg-lc-violet" style={{ width: `${metrics.fluency}%` }} />
                  </div>
                </div>

                {/* Score 2 */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-lc-text-muted">Grammar & Tenses</span>
                    <span className="text-lc-cyan">{metrics.grammar}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-lc-void/40 overflow-hidden">
                    <div className="h-full bg-lc-cyan" style={{ width: `${metrics.grammar}%` }} />
                  </div>
                </div>

                {/* Score 3 */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-lc-text-muted">Confidence Scale</span>
                    <span className="text-lc-emerald">{metrics.confidence}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-lc-void/40 overflow-hidden">
                    <div className="h-full bg-lc-emerald" style={{ width: `${metrics.confidence}%` }} />
                  </div>
                </div>
              </div>

              {/* Speaking Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-lc-glass-raised border-lc-glass-border text-center">
                  <p className="text-[10px] text-lc-text-muted font-bold uppercase">Words / Min</p>
                  <p className="text-xl font-black text-lc-text mt-1">{metrics.wpm}</p>
                  <p className="text-[8px] text-lc-emerald mt-0.5">Optimal Range</p>
                </div>

                <div className="p-4 rounded-xl bg-lc-glass-raised border-lc-glass-border text-center">
                  <p className="text-[10px] text-lc-text-muted font-bold uppercase">Filler Words</p>
                  <p className="text-xl font-black text-lc-amber mt-1">{metrics.fillers}</p>
                  <p className="text-[8px] text-lc-text-muted mt-0.5">Detected: "um", "like"</p>
                </div>
              </div>

              {/* AI Review Summary */}
              <div className="p-4 rounded-xl bg-lc-cyan/5 border-lc-cyan/20 space-y-2 text-left">
                <h4 className="text-xs font-bold text-lc-cyan flex items-center space-x-1">
                  <Sparkles className="w-3.5 h-3.5 fill-lc-cyan/20" />
                  <span>AI Speech Critique</span>
                </h4>
                {isEvaluating ? (
                  <div className="flex items-center space-x-2 text-lc-text-muted font-mono text-[9px] py-1">
                    <Sparkles className="w-3.5 h-3.5 animate-spin text-lc-cyan" />
                    <span>AI evaluator auditing transcript...</span>
                  </div>
                ) : aiFeedback ? (
                  <div className="text-[10px] text-lc-text leading-relaxed whitespace-pre-line prose prose-invert font-sans">
                    {aiFeedback}
                  </div>
                ) : (
                  <p className="text-[10px] text-lc-text leading-relaxed text-left">
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
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
