import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, XCircle, Trophy, Play, FileJson, Volume2 } from 'lucide-react';

interface QuizItem {
  question: string;
  options: string[];
  answer: string;
  ttsText?: string;
  explanation?: string;
}

type GameState = 'input' | 'playing' | 'showing_answer' | 'finished';

let activeUtterance: SpeechSynthesisUtterance | null = null;

const cancelSpeak = () => {
  if ('speechSynthesis' in window) {
    if (activeUtterance) {
      activeUtterance.onend = null;
      activeUtterance.onerror = null;
      activeUtterance.onstart = null;
    }
    window.speechSynthesis.cancel();
    activeUtterance = null;
  }
};

const speak = (text: string, onEnd?: () => void) => {
  if ('speechSynthesis' in window) {
    cancelSpeak();
    const utterance = new SpeechSynthesisUtterance(text);
    activeUtterance = utterance;

    if (/[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9faf]/.test(text)) {
      utterance.lang = 'ja-JP';
    } else if (/[\u3105-\u312f\u4e00-\u9fa5]/.test(text)) {
      utterance.lang = 'zh-TW';
    } else {
      utterance.lang = 'en-US';
    }

    if (onEnd) {
      let called = false;
      const handleEnd = () => {
        if (!called) {
          called = true;
          onEnd();
        }
      };
      utterance.onend = handleEnd;
      utterance.onerror = (event) => {
        if (event.error !== 'interrupted') {
          handleEnd();
        }
      };
    }

    window.speechSynthesis.speak(utterance);
  }
};

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

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
  const [baseTimeLimit, setBaseTimeLimit] = useState(10);
  const [autoAdvance, setAutoAdvance] = useState(true);
  const [isCorrectAnswer, setIsCorrectAnswer] = useState<boolean | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const sampleJson = `[
  {
    "question": "彼は毎朝６時に起きる＿＿にしている。",
    "options": ["こと", "もの", "ため", "わけ"],
    "answer": "こと",
    "ttsText": "かれはまいあさろくじにおきることにしている。",
    "explanation": "「〜ことにしている」是固定句型，表示「（自己決定）習慣上都會做某事」，強調本人的意志與規律。例：毎日運動することにしている（習慣每天運動）。「ものにしている」不是正確用法；「ためにしている」語意不通；「わけにしている」亦非正確搭配。"
  },
  {
    "question": "この仕事は私＿＿できない。",
    "options": ["にしか", "だけが", "しかに", "のみに"],
    "answer": "にしか",
    "ttsText": "このしごとはわたしにしかできない。",
    "explanation": "「〜にしか〜ない」表示「只有〜才能（否定其他可能性）」，用於助詞「に」的對象後接「しか」再接否定形，意思是「除了我以外無法做」。「だけが」雖有「只有」之意，但接法應為「私だけができる」（肯定句），此處句尾是「できない」否定形，不合。「しかに」「のみに」皆非正確日語用法。"
  },
  {
    "question": "雨が降って＿＿、試合は続けられた。",
    "options": ["いても", "あっても", "いたが", "いるのに"],
    "answer": "いても",
    "ttsText": "あめがふっていても、しあいはつづけられた。",
    "explanation": "「〜ていても」表示「即使正在〜也…」，是逆接條件（讓步）的表達。「雨が降っていても」＝「即使雨在下」。「あっても」須接名詞或形容詞（例：雨であっても），接動詞「降って」語法不對。「いたが」是過去的逆接，語感上後句應出現轉折結果，但整句邏輯較弱。「いるのに」表示說話者對此感到不滿或意外，語氣不符合此句客觀描述的情境。"
  },
  {
    "question": "彼女は歌手である＿＿、女優でもある。",
    "options": ["とともに", "にしても", "からには", "ばかりか"],
    "answer": "とともに",
    "ttsText": "かのじょはかしゅであるとともに、じょゆうでもある。",
    "explanation": "「〜とともに」有「同時也是〜」之意，用來並列兩種身份或狀態，表示「她既是歌手，同時也是女演員」。「にしても」表示「即使是〜」，帶有讓步語氣，不適合此處並列語意。「からには」表示「既然〜就應該…」，語意完全不同。「ばかりか」雖也有「不僅〜還…」之意，但語感上後句應表示更進一層、甚至超乎預期的事，且用「ばかりか」時後句常接「も」（女優でもある可接，語法上雖可，但「とともに」更自然地表達並列的雙重身份）。"
  },
  {
    "question": "試験に合格した＿＿、すぐに報告した。",
    "options": ["とたんに", "からには", "とたん", "ついでに"],
    "answer": "とたんに",
    "ttsText": "しけんにごうかくしたとたんに、すぐにほうこくした。",
    "explanation": "「〜たとたんに」表示「就在〜的瞬間，立刻…」，強調前後動作幾乎同時發生。此句意為「考試一合格，馬上就去報告了」。「からには」表示「既然〜就…」，強調責任或決心，不符合此句的「瞬間性」語意。「とたん」（無「に」）雖偶爾可見，但標準用法是「とたんに」，選項中「とたん」單獨使用較不完整。「ついでに」表示「順便」，語意完全不同。"
  },
  {
    "question": "彼はお酒を飲む＿＿、タバコも吸う。",
    "options": ["うえに", "ほかに", "ために", "ように"],
    "answer": "うえに",
    "ttsText": "かれはおさけをのむうえに、タバコもすう。",
    "explanation": "「〜うえに」表示「在〜之上，還…」，用於累加負面（或同類）事項，有「不僅如此，還」之意。此句意為「他不只喝酒，還抽菸」，有疊加壞習慣之語感。「ほかに」意為「除此之外還有」，較為客觀中性，接法通常為「〜のほかに」，直接接動詞辭書形不自然。「ために」表示目的或原因，語意不符。「ように」表示目的或樣態，亦不符合此處語意。"
  },
  {
    "question": "子供の＿＿、早く寝なさい。",
    "options": ["くせに", "ために", "わりに", "ほどに"],
    "answer": "くせに",
    "ttsText": "こどものくせに、はやくねなさい。",
    "explanation": "「〜くせに」表示「明明是〜，卻…」，帶有輕蔑、責備或諷刺的語氣。「子供のくせに（早く寝なさい）」意為「你明明是個小孩，（還不快去睡）」，語氣上有責備之意。「ために」表示目的或對象（為了小孩），語意不符。「わりに」表示「以〜來說，算是…」，用於對比期待與實際，語意不同。「ほどに」表示程度，不適合此句結構。"
  },
  {
    "question": "もっと練習すれば、うまく＿＿はずだ。",
    "options": ["なれる", "なった", "なる", "なれた"],
    "answer": "なれる",
    "ttsText": "もっとれんしゅうすれば、うまくなれるはずだ。",
    "explanation": "「〜ば〜はずだ」表示「如果〜的話，應該就能…」，是條件句加上推測，後句應用非過去式（現在／未來）。「なれる」是「なれる（能夠變成）」的可能形，表示「應該能夠變得擅長」，語意最為完整。「なった」是過去式，與假設未來的語境矛盾。「なる」雖是非過去式，但欠缺「可能」的語意（無法表達「能夠」之意）。「なれた」是可能形的過去式，與未來假設的語境不符。"
  },
  {
    "question": "先生に＿＿、この本を読んでおいた。",
    "options": ["言われたので", "言うので", "言ったので", "言わせたので"],
    "answer": "言われたので",
    "ttsText": "せんせいにいわれたので、このほんをよんでおいた。",
    "explanation": "「先生に言われた」是被動形，表示「被老師說（叫）了」，即「老師叫我（讀）」，後接「ので」表示原因，整句意為「因為老師叫我，所以我事先讀了這本書」。「言うので」是主動現在式，主語變成「先生が言う」，與助詞「に」的被動語境不符。「言ったので」是主動過去式，同樣主動語態，語法上「先生に言ったので」意為「因為（我）對老師說了」，語意錯誤。「言わせたので」是使役形，意為「讓老師說」，邏輯上不通。"
  },
  {
    "question": "彼が来る＿＿、準備しておこう。",
    "options": ["前に", "ために", "ように", "までに"],
    "answer": "までに",
    "ttsText": "かれがくるまでに、じゅんびしておこう。",
    "explanation": "「〜までに」表示「在〜之前（的某個時間點以內完成）」，強調的是截止期限。「彼が来るまでに準備しておこう」意為「在他來之前，先做好準備吧」，強調完成準備的期限。「前に」雖也有「〜之前」的意思，「来る前に」語法正確，但「までに」更強調「在時限內完成」的概念，比「前に」更貼切此句想表達的事先準備語意（實際上「来る前に」語法也對，但N3〜N2考試中此情境通常考「までに」）。「ために」表示目的，「ように」表示目的或樣態，兩者語意皆不符。"
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

      const shuffledData = parsedData.map((item: QuizItem) => ({
        ...item,
        options: shuffleArray(item.options)
      }));

      setQuizItems(shuffledData);
      const initialStats: Record<number, number> = {};
      parsedData.forEach((_, idx) => { initialStats[idx] = 0; });
      setItemStats(initialStats);
      setBonusTime(0);
      setLastIndex(null);
      setShowExplanation(false);
      setIsCorrectAnswer(null);
      setError('');

      const nextIdx = Math.floor(Math.random() * parsedData.length);
      setCurrentIndex(nextIdx);
      setGameState('playing');

    } catch (err: any) {
      setError(err.message || 'JSON 解析失敗，請檢查格式。');
    }
  };

  const pickNextItem = (currentStats: Record<number, number>) => {
    cancelSpeak();
    setShowExplanation(false);
    setIsCorrectAnswer(null);
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
      const timeLimit = baseTimeLimit + bonusTime;
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
  }, [gameState, currentIndex, bonusTime, baseTimeLimit]);

  const handleTimeout = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (currentIndex === null || showExplanation) return;

    const currentItem = quizItems[currentIndex];
    if (currentItem.ttsText) {
      speak(currentItem.ttsText);
    }

    const newStats = { ...itemStats, [currentIndex]: 0 };
    setItemStats(newStats);
    setBonusTime(0);
    setLastIndex(currentIndex);
    setIsCorrectAnswer(false);
    setGameState('showing_answer');
  };

  const handleAnswer = (selectedOption: string) => {
    if (gameState !== 'playing' || currentIndex === null || showExplanation) return;
    if (timerRef.current) clearInterval(timerRef.current);

    const currentItem = quizItems[currentIndex];
    const isCorrect = selectedOption === currentItem.answer;
    const timeLimit = baseTimeLimit + bonusTime;
    const timeSpent = timeLimit - timeLeft;

    if (isCorrect) {
      setIsCorrectAnswer(true);
      const newStats = { ...itemStats, [currentIndex]: (itemStats[currentIndex] || 0) + 1 };
      setItemStats(newStats);

      const newBonus = timeSpent <= 3 ? 3 : 0;
      setBonusTime(newBonus);
      setLastIndex(currentIndex);

      if (autoAdvance) {
        setShowExplanation(true);
        if (currentItem.ttsText) {
          speak(currentItem.ttsText, () => {
            pickNextItem(newStats);
          });
        } else {
          setTimeout(() => {
            pickNextItem(newStats);
          }, 1000);
        }
      } else {
        if (currentItem.ttsText) {
          speak(currentItem.ttsText);
        }
        setGameState('showing_answer');
      }
    } else {
      setIsCorrectAnswer(false);
      const newStats = { ...itemStats, [currentIndex]: 0 };
      setItemStats(newStats);
      setBonusTime(0);
      setLastIndex(currentIndex);
      if (currentItem.ttsText) {
        speak(currentItem.ttsText);
      }
      setGameState('showing_answer');
    }
  };

  const currentItem = currentIndex !== null ? quizItems[currentIndex] : null;
  const timeLimit = baseTimeLimit + bonusTime;
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
                placeholder={`[
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
]`}
                className="w-full h-64 p-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-0 font-mono text-sm resize-none"
              />
              {error && (
                <p className="mt-2 text-red-500 text-sm flex items-center gap-1">
                  <XCircle size={16} />
                  {error}
                </p>
              )}
            </div>

            {/* 設定區塊 */}
            <div className="mb-8 p-6 bg-gray-50 rounded-2xl border-2 border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  每題時間限制 (秒)
                </label>
                <input
                  type="number"
                  min={1}
                  max={300}
                  value={baseTimeLimit}
                  onChange={(e) => setBaseTimeLimit(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-0 font-medium"
                />
              </div>
              <div className="flex flex-col justify-center">
                <span className="block text-sm font-semibold text-gray-700 mb-2">
                  自動跳轉
                </span>
                <label className="relative inline-flex items-center cursor-pointer mt-1">
                  <input
                    type="checkbox"
                    checked={autoAdvance}
                    onChange={(e) => setAutoAdvance(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  <span className="ml-3 text-sm font-medium text-gray-700">
                    {autoAdvance ? '答對後自動進入下一題' : '答對後手動點擊繼續'}
                  </span>
                </label>
              </div>
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

              {(gameState === 'showing_answer' || showExplanation) && currentItem.explanation && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-6 p-5 bg-blue-50 border-2 border-blue-100 rounded-2xl text-left"
                >
                  <h4 className="font-bold text-blue-800 mb-2 flex items-center gap-1.5 text-lg">
                    💡 題目詳解
                  </h4>
                  <p className="text-blue-950 text-base leading-relaxed">
                    {currentItem.explanation}
                  </p>
                </motion.div>
              )}

              {gameState === 'showing_answer' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-8 text-center"
                >
                  {isCorrectAnswer ? (
                    <p className="text-green-600 font-bold text-2xl mb-4">
                      🎉 答對了！{bonusTime > 0 ? "獲得快速回答獎勵 +3 秒！" : ""}
                    </p>
                  ) : (
                    <p className="text-red-500 font-bold text-2xl mb-4">❌ 時間到！或答錯了！</p>
                  )}
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
