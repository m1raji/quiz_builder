import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, XCircle, Trophy, Play, FileJson, Volume2 } from 'lucide-react';

interface QuizItem {
  question: string;
  options: string[];
  answer: string;
  ttsText?: string;
}

type GameState = 'input' | 'playing' | 'showing_answer' | 'finished';

const speak = (text: string) => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    if (/[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9faf]/.test(text)) {
      utterance.lang = 'ja-JP';
    } else if (/[\u3105-\u312f\u4e00-\u9fa5]/.test(text)) {
      utterance.lang = 'zh-TW';
    } else {
      utterance.lang = 'en-US';
    }
    window.speechSynthesis.speak(utterance);
  }
};

export default function App() {
  const [gameState, setGameState] = useState<GameState>('input');
  const [jsonInput, setJsonInput] = useState('');
  const [quizItems, setQuizItems] = useState<QuizItem[]>([]);
  const [itemStats, setItemStats] = useState<Record<number, number>>({});
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);
  const [lastIndex, setLastIndex] = useState<number | null>(null);
  const [bonusTime, setBonusTime] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10);
  const [error, setError] = useState('');
  const [showExplanation, setShowExplanation] = useState(false);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const sampleJson = `[
  {
    "question": "日本語",
    "options": ["日文", "英文", "中文", "法文"],
    "answer": "日文",
    "ttsText": "にほんご"
  },
  {
    "question": "蘋果",
    "options": ["りんご", "みかん", "いちご", "ぶどう"],
    "answer": "りんご",
    "ttsText": "りんご"
  }
]`;

  const startGame = () => {
    try {
      const parsedData = JSON.parse(jsonInput);
      if (!Array.isArray(parsedData) || parsedData.length === 0) {
        throw new Error('請輸入有效的 JSON 陣列，且至少包含一個題目。');
      }
      
      for (let i = 0; i < parsedData.length; i++) {
        const item = parsedData[i];
        if (!item.question || !Array.isArray(item.options) || item.options.length !== 4 || !item.answer) {
          throw new Error(`第 ${i + 1} 個題目格式錯誤。必須包含 question, 4 個 options, 和 answer。`);
        }
        if (!item.options.includes(item.answer)) {
          throw new Error(`第 ${i + 1} 個題目的 answer 必須在 options 中。`);
        }
      }

      setQuizItems(parsedData);
      const initialStats: Record<number, number> = {};
      parsedData.forEach((_, idx) => { initialStats[idx] = 0; });
      setItemStats(initialStats);
      setBonusTime(0);
      setLastIndex(null);
      setShowExplanation(false);
      setError('');
      
      const nextIdx = Math.floor(Math.random() * parsedData.length);
      setCurrentIndex(nextIdx);
      setGameState('playing');

    } catch (err: any) {
      setError(err.message || 'JSON 解析失敗，請檢查格式。');
    }
  };

  const pickNextItem = (currentStats: Record<number, number>) => {
    setShowExplanation(false);
    const available = quizItems.map((_, idx) => idx).filter(idx => (currentStats[idx] || 0) < 2);
    
    if (available.length === 0) {
      setGameState('finished');
      return;
    }
    
    let candidates = available.filter(idx => idx !== lastIndex);
    if (candidates.length === 0) candidates = available;
    
    const nextIdx = candidates[Math.floor(Math.random() * candidates.length)];
    setCurrentIndex(nextIdx);
    setGameState('playing');
  };

  useEffect(() => {
    if (gameState === 'playing' && currentIndex !== null) {
      const startTime = Date.now();
      const timeLimit = 10 + bonusTime;
      setTimeLeft(timeLimit);

      timerRef.current = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        const remaining = Math.max(0, timeLimit - elapsed);
        setTimeLeft(remaining);

        if (remaining === 0) {
          handleTimeout();
        }
      }, 50);

      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [gameState, currentIndex, bonusTime]);

  const handleTimeout = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (currentIndex === null || showExplanation) return;
    
    const currentItem = quizItems[currentIndex];
    if (currentItem.ttsText) speak(currentItem.ttsText);
    else speak(currentItem.question);

    const newStats = { ...itemStats, [currentIndex]: 0 };
    setItemStats(newStats);
    setBonusTime(0);
    setLastIndex(currentIndex);
    setGameState('showing_answer');
  };

  const handleAnswer = (selectedOption: string) => {
    if (gameState !== 'playing' || currentIndex === null || showExplanation) return;
    if (timerRef.current) clearInterval(timerRef.current);

    const currentItem = quizItems[currentIndex];
    if (currentItem.ttsText) speak(currentItem.ttsText);
    else speak(currentItem.question);

    const timeLimit = 10 + bonusTime;
    const timeSpent = timeLimit - timeLeft;
    const isCorrect = selectedOption === currentItem.answer;

    if (isCorrect) {
      setShowExplanation(true);
      const newStats = { ...itemStats, [currentIndex]: (itemStats[currentIndex] || 0) + 1 };
      setItemStats(newStats);
      
      const newBonus = timeSpent <= 3 ? 3 : 0;
      setBonusTime(newBonus);
      setLastIndex(currentIndex);
      
      setTimeout(() => {
        pickNextItem(newStats);
      }, 1000);
    } else {
      const newStats = { ...itemStats, [currentIndex]: 0 };
      setItemStats(newStats);
      setBonusTime(0);
      setLastIndex(currentIndex);
      setGameState('showing_answer');
    }
  };

  const currentItem = currentIndex !== null ? quizItems[currentIndex] : null;
  const timeLimit = 10 + bonusTime;
  const progress = (timeLeft / timeLimit) * 100;

  const totalRequired = quizItems.length * 2;
  const currentProgress = Object.values(itemStats).reduce((sum: number, val: any) => sum + Number(val), 0);
  const gameProgress = totalRequired > 0 ? (Number(currentProgress) / totalRequired) * 100 : 0;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8">
      <AnimatePresence mode="wait">
        {gameState === 'input' && (
          <motion.div
            key="input"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-2xl bg-white rounded-3xl shadow-xl p-8"
          >
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-2">萬用練習遊戲</h1>
              <p className="text-gray-600">將 LLM 整理好的 JSON 貼在下方即可開始練習</p>
            </div>

            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  題目 JSON
                </label>
                <button
                  onClick={() => setJsonInput(sampleJson)}
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  <FileJson size={16} />
                  載入範例
                </button>
              </div>
              <textarea
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                placeholder="[\n  {\n    &quot;question&quot;: &quot;日本語&quot;,\n    &quot;options&quot;: [&quot;日文&quot;, &quot;英文&quot;, &quot;中文&quot;, &quot;法文&quot;],\n    &quot;answer&quot;: &quot;日文&quot;,\n    &quot;ttsText&quot;: &quot;にほんご&quot;\n  }\n]"
                className="w-full h-64 p-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-0 font-mono text-sm resize-none"
              />
              {error && (
                <p className="mt-2 text-red-500 text-sm flex items-center gap-1">
                  <XCircle size={16} />
                  {error}
                </p>
              )}
            </div>

            <button
              onClick={startGame}
              disabled={!jsonInput.trim()}
              className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Play size={24} />
              開始練習
            </button>
          </motion.div>
        )}

        {(gameState === 'playing' || gameState === 'showing_answer') && currentItem && (
          <motion.div
            key="game"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-2xl"
          >
            <div className="bg-white rounded-3xl shadow-xl p-8 mb-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-gray-100">
                <motion.div 
                  className="h-full bg-green-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${gameProgress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>

              <div className="flex justify-between items-center mb-8 mt-2">
                <div className="flex items-center gap-2 text-gray-600">
                  <Trophy size={20} />
                  <span className="font-medium">{currentProgress} / {totalRequired}</span>
                </div>
                <div className="flex items-center gap-2 text-orange-500 font-mono text-xl">
                  <Clock size={24} />
                  {timeLeft.toFixed(1)}s
                </div>
              </div>

              <div className="text-center mb-12">
                <div className="flex items-center justify-center gap-4 mb-4">
                  <h2 className="text-5xl font-bold">{currentItem.question}</h2>
                  <button 
                    onClick={() => speak(currentItem.ttsText || currentItem.question)}
                    className="p-2 text-gray-400 hover:text-blue-500 transition-colors rounded-full hover:bg-blue-50"
                  >
                    <Volume2 size={28} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {currentItem.options.map((option, idx) => {
                  let btnClass = "py-6 text-xl font-bold rounded-2xl border-4 transition-all ";
                  
                  if (gameState === 'showing_answer') {
                    if (option === currentItem.answer) {
                      btnClass += "border-green-500 bg-green-50 text-green-700";
                    } else {
                      btnClass += "border-gray-200 bg-gray-50 text-gray-400";
                    }
                  } else if (showExplanation) {
                    if (option === currentItem.answer) {
                      btnClass += "border-green-500 bg-green-50 text-green-700";
                    } else {
                      btnClass += "border-gray-200 text-gray-400";
                    }
                  } else {
                    btnClass += "border-gray-200 hover:border-blue-500 hover:bg-blue-50 text-gray-700";
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handleAnswer(option)}
                      disabled={gameState !== 'playing' || showExplanation}
                      className={btnClass}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>

              {gameState === 'showing_answer' && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-8 text-center"
                >
                  <p className="text-red-500 font-bold text-xl mb-4">時間到！或答錯了！</p>
                  <button
                    onClick={() => pickNextItem(itemStats)}
                    className="px-8 py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition-colors"
                  >
                    繼續
                  </button>
                </motion.div>
              )}
            </div>
            
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-orange-500"
                initial={{ width: '100%' }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.05, ease: 'linear' }}
              />
            </div>
          </motion.div>
        )}

        {gameState === 'finished' && (
          <motion.div
            key="finished"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 text-center"
          >
            <Trophy size={64} className="mx-auto text-yellow-500 mb-6" />
            <h2 className="text-3xl font-bold mb-4">練習完成！</h2>
            <p className="text-gray-600 mb-8">你已經熟練掌握了這些題目。</p>
            <button
              onClick={() => {
                setGameState('input');
                setJsonInput('');
              }}
              className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 transition-colors"
            >
              再練習一次
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
