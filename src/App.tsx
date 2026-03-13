/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  BookOpen, 
  GraduationCap, 
  ChevronRight,
  Volume2,
  Brain
} from 'lucide-react';
import { getNewWords, getPronunciation } from './services/geminiService';
import { Word, GameState } from './types';

export default function App() {
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    currentWordIndex: 0,
    words: [],
    status: 'loading',
    level: 'beginner'
  });

  const [userInput, setUserInput] = useState('');
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [showDefinition, setShowDefinition] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadWords();
  }, [gameState.level]);

  const loadWords = async () => {
    setGameState(prev => ({ ...prev, status: 'loading' }));
    const newWords = await getNewWords(gameState.level);
    setGameState(prev => ({
      ...prev,
      words: newWords,
      currentWordIndex: 0,
      status: 'playing',
      score: 0
    }));
    setUserInput('');
    setFeedback(null);
    setShowDefinition(false);
  };

  const playPronunciation = async () => {
    if (!currentWord || isPlayingAudio) return;
    
    try {
      setIsPlayingAudio(true);
      const url = await getPronunciation(currentWord.english);
      const audio = new Audio(url);
      audio.onended = () => setIsPlayingAudio(false);
      audio.play();
    } catch (error) {
      console.error("Audio error:", error);
      setIsPlayingAudio(false);
    }
  };

  const handleCheck = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (gameState.status !== 'playing' || feedback) return;

    const currentWord = gameState.words[gameState.currentWordIndex];
    const isCorrect = userInput.trim().toLowerCase() === currentWord.english.toLowerCase();

    if (isCorrect) {
      setFeedback('correct');
      setGameState(prev => ({ ...prev, score: prev.score + 10 }));
      setTimeout(() => nextWord(), 1500);
    } else {
      setFeedback('wrong');
      setTimeout(() => {
        setFeedback(null);
        setUserInput('');
        inputRef.current?.focus();
      }, 1500);
    }
  };

  const nextWord = () => {
    if (gameState.currentWordIndex < gameState.words.length - 1) {
      setGameState(prev => ({
        ...prev,
        currentWordIndex: prev.currentWordIndex + 1
      }));
      setUserInput('');
      setFeedback(null);
      setShowDefinition(false);
      inputRef.current?.focus();
    } else {
      setGameState(prev => ({ ...prev, status: 'finished' }));
    }
  };

  const currentWord = gameState.words[gameState.currentWordIndex];

  if (gameState.status === 'loading') {
    return (
      <div className="min-h-screen bg-[#F5F5F0] flex flex-col items-center justify-center font-sans">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
        >
          <RefreshCw className="w-12 h-12 text-[#5A5A40]" />
        </motion.div>
        <p className="mt-4 text-[#5A5A40] font-medium serif italic">Yangi so'zlar yuklanmoqda...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F0] text-[#1a1a1a] font-sans p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <header className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#5A5A40] rounded-full flex items-center justify-center text-white">
              <GraduationCap size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">TechEng</h1>
              <p className="text-sm text-[#5A5A40] serif italic">So'z boyligingizni oshiring</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-white px-4 py-2 rounded-2xl shadow-sm border border-black/5 flex items-center gap-2">
              <Trophy size={18} className="text-yellow-600" />
              <span className="font-bold">{gameState.score}</span>
            </div>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {gameState.status === 'playing' && currentWord && (
            <motion.div
              key={gameState.currentWordIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-[32px] p-8 md:p-12 shadow-xl shadow-black/5 border border-black/5 relative overflow-hidden"
            >
              {/* Progress Bar */}
              <div className="absolute top-0 left-0 w-full h-1.5 bg-black/5">
                <motion.div 
                  className="h-full bg-[#5A5A40]"
                  initial={{ width: 0 }}
                  animate={{ width: `${((gameState.currentWordIndex) / gameState.words.length) * 100}%` }}
                />
              </div>

              <div className="text-center mb-8">
                <span className="text-xs font-bold uppercase tracking-widest text-[#5A5A40]/60 mb-2 block">
                  So'zni tarjima qiling va yozing
                </span>
                
                {currentWord.imageUrl && (
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="mb-6 relative group"
                  >
                    <div className="absolute inset-0 bg-[#5A5A40]/5 rounded-3xl -rotate-2 group-hover:rotate-0 transition-transform duration-500" />
                    <img 
                      src={currentWord.imageUrl} 
                      alt={currentWord.english}
                      referrerPolicy="no-referrer"
                      className="relative w-48 h-48 mx-auto object-cover rounded-3xl shadow-lg border-4 border-white"
                    />
                  </motion.div>
                )}

                <h2 className="text-5xl font-bold mb-4 text-[#1a1a1a]">
                  {currentWord.uzbek}
                </h2>
                <div className="flex justify-center gap-4">
                  <button 
                    onClick={() => setShowDefinition(!showDefinition)}
                    className="text-sm text-[#5A5A40] underline underline-offset-4 hover:text-[#1a1a1a] transition-colors flex items-center gap-1"
                  >
                    <BookOpen size={14} />
                    {showDefinition ? "Yashirish" : "Yordam (Inglizcha ma'nosi)"}
                  </button>
                  <button 
                    onClick={playPronunciation}
                    disabled={isPlayingAudio}
                    className="text-sm text-[#5A5A40] underline underline-offset-4 hover:text-[#1a1a1a] transition-colors flex items-center gap-1 disabled:opacity-50"
                  >
                    <Volume2 size={14} className={isPlayingAudio ? "animate-pulse" : ""} />
                    Talaffuzni eshitish
                  </button>
                </div>
              </div>

              {showDefinition && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  className="mb-8 p-4 bg-[#F5F5F0] rounded-2xl text-sm italic text-[#5A5A40] border-l-4 border-[#5A5A40]"
                >
                  <p className="font-bold not-italic mb-1">Definition:</p>
                  {currentWord.definition}
                </motion.div>
              )}

              <form onSubmit={handleCheck} className="space-y-6">
                <div className="relative">
                  <input
                    ref={inputRef}
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    disabled={!!feedback}
                    placeholder="Inglizcha variantini yozing..."
                    className={`w-full text-center text-2xl font-medium py-6 px-4 rounded-2xl border-2 transition-all outline-none
                      ${feedback === 'correct' ? 'border-green-500 bg-green-50 text-green-700' : 
                        feedback === 'wrong' ? 'border-red-500 bg-red-50 text-red-700 animate-shake' : 
                        'border-black/10 focus:border-[#5A5A40] bg-white'}
                    `}
                    autoFocus
                  />
                  <AnimatePresence>
                    {feedback === 'correct' && (
                      <motion.div 
                        initial={{ scale: 0 }} animate={{ scale: 1 }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500"
                      >
                        <CheckCircle2 size={32} />
                      </motion.div>
                    )}
                    {feedback === 'wrong' && (
                      <motion.div 
                        initial={{ scale: 0 }} animate={{ scale: 1 }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-red-500"
                      >
                        <XCircle size={32} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <button
                  type="submit"
                  disabled={!userInput.trim() || !!feedback}
                  className="w-full py-5 bg-[#5A5A40] text-white rounded-2xl font-bold text-lg hover:bg-[#4A4A30] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  Tekshirish
                  <ChevronRight size={20} />
                </button>
              </form>

              {feedback === 'correct' && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 text-center text-[#5A5A40]"
                >
                  <p className="text-sm font-medium mb-1">Misol:</p>
                  <p className="italic">"{currentWord.example}"</p>
                </motion.div>
              )}
            </motion.div>
          )}

          {gameState.status === 'finished' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-[32px] p-12 text-center shadow-xl border border-black/5"
            >
              <div className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trophy size={48} className="text-yellow-600" />
              </div>
              <h2 className="text-3xl font-bold mb-2">Tabriklaymiz!</h2>
              <p className="text-[#5A5A40] mb-8">Siz barcha so'zlarni muvaffaqiyatli yakunladingiz.</p>
              
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-[#F5F5F0] p-4 rounded-2xl">
                  <p className="text-xs uppercase tracking-widest text-[#5A5A40]/60 font-bold mb-1">Ball</p>
                  <p className="text-2xl font-bold">{gameState.score}</p>
                </div>
                <div className="bg-[#F5F5F0] p-4 rounded-2xl">
                  <p className="text-xs uppercase tracking-widest text-[#5A5A40]/60 font-bold mb-1">So'zlar</p>
                  <p className="text-2xl font-bold">{gameState.words.length}</p>
                </div>
              </div>

              <button
                onClick={loadWords}
                className="w-full py-5 bg-[#5A5A40] text-white rounded-2xl font-bold text-lg hover:bg-[#4A4A30] transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw size={20} />
                Qayta o'ynash
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Level Selector */}
        <div className="mt-12 flex justify-center gap-4">
          {(['beginner', 'intermediate', 'advanced'] as const).map((lvl) => (
            <button
              key={lvl}
              onClick={() => setGameState(prev => ({ ...prev, level: lvl }))}
              className={`px-4 py-2 rounded-full text-sm font-bold capitalize transition-all
                ${gameState.level === lvl 
                  ? 'bg-[#5A5A40] text-white shadow-lg shadow-[#5A5A40]/20' 
                  : 'bg-white text-[#5A5A40] border border-black/5 hover:bg-[#F5F5F0]'}
              `}
            >
              {lvl === 'beginner' ? 'Boshlang\'ich' : lvl === 'intermediate' ? 'O\'rta' : 'Yuqori'}
            </button>
          ))}
        </div>

        {/* Author Attribution */}
        <footer className="mt-16 text-center border-t border-black/5 pt-8">
          <p className="text-sm text-[#5A5A40]/70 serif italic">
            Muallif: Farg'ona shaxar 40-maktab o'quvchisi Jurayev Azizbek
          </p>
        </footer>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.2s ease-in-out 0s 2;
        }
        .serif {
          font-family: 'Georgia', serif;
        }
      `}</style>
    </div>
  );
}
