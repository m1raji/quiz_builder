import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, XCircle, Trophy, Play, FileJson, Volume2, Github, LogOut } from 'lucide-react';

interface QuizItem {
  question: string;
  options: string[];
  answer: string;
  ttsText?: string;
  explanation?: string;
}

type GameState = 'input' | 'playing' | 'showing_answer' | 'finished';
type Language = 'zh' | 'en' | 'ja';

interface TranslationSchema {
  title: string;
  subtitle: string;
  jsonLabel: string;
  loadSample: string;
  placeholder: string;
  timeLimit: string;
  autoAdvance: string;
  autoAdvanceTrue: string;
  autoAdvanceFalse: string;
  startPractice: string;
  correct: string;
  bonus: string;
  incorrect: string;
  continue: string;
  explanation: string;
  finished: string;
  finishedDesc: string;
  restart: string;
  errInvalidJson: string;
  errFormat: (idx: number) => string;
  errAnswerNotInOptions: (idx: number) => string;
  errParseFailed: string;
  personalWebsite: string;
  exitGame: string;
  tabJson: string;
  tabCreator: string;
  tabAiGuide: string;
  aiGuideDesc: string;
  aiGuidePromptLabel: string;
  copyPrompt: string;
  copied: string;
  creatorAdd: string;
  creatorUpdate: string;
  creatorCancel: string;
  creatorQuestion: string;
  creatorOptions: string;
  creatorTts: string;
  creatorExplanation: string;
  creatorNoQuestions: string;
  creatorEdit: string;
  creatorDelete: string;
  creatorImportError: string;
  creatorCorrectAnswer: string;
  creatorOptionPlaceholder: (idx: number) => string;
}

const translations: Record<Language, TranslationSchema> = {
  zh: {
    title: "萬用練習遊戲",
    subtitle: "將 LLM 整理好的 JSON 貼在下方即可開始練習",
    jsonLabel: "題目 JSON",
    loadSample: "載入範例",
    placeholder: `[\n  {\n    "question": "蘋果",\n    "options": ["apple", "orange", "strawberry", "grape"],\n    "answer": "apple",\n    "ttsText": "apple"\n  }\n]`,
    timeLimit: "每題時間限制 (秒)",
    autoAdvance: "自動跳轉",
    autoAdvanceTrue: "答對後自動進入下一題",
    autoAdvanceFalse: "答對後手動點擊繼續",
    startPractice: "開始練習",
    correct: "🎉 答對了！",
    bonus: "獲得快速回答獎勵 +3 秒！",
    incorrect: "❌ 時間到！或答錯了！",
    continue: "繼續",
    explanation: "💡 題目詳解",
    finished: "練習完成！",
    finishedDesc: "你已經熟練掌握了這些題目。",
    restart: "再練習一次",
    errInvalidJson: "請輸入有效的 JSON 陣列，且至少包含一個題目。",
    errFormat: (idx: number) => `第 ${idx} 個題目格式錯誤。必須包含 question, 4 個 options, 和 answer。`,
    errAnswerNotInOptions: (idx: number) => `第 ${idx} 個題目的 answer 必須在 options 中。`,
    errParseFailed: "JSON 解析失敗，請檢查格式。",
    personalWebsite: "個人網站",
    exitGame: "返回主頁",
    tabJson: "JSON 貼上",
    tabCreator: "手動編輯器",
    tabAiGuide: "AI 產生指南",
    aiGuideDesc: "推薦使用 ChatGPT 或 Claude 等 AI 工具來幫你生成題目！只需複製下方的提示詞，並貼給 AI，就能快速獲得符合格式的題目 JSON。",
    aiGuidePromptLabel: "推薦 AI 提示詞",
    copyPrompt: "複製提示詞",
    copied: "已複製！",
    creatorAdd: "新增題目",
    creatorUpdate: "更新題目",
    creatorCancel: "取消編輯",
    creatorQuestion: "題目問題 (Question)",
    creatorOptions: "選項 (Options) - 請勾選正確答案",
    creatorTts: "語音朗讀文字 (ttsText) - 選填，預設同題目",
    creatorExplanation: "題目詳解 (Explanation) - 選填",
    creatorNoQuestions: "目前還沒有題目，請在下方新增，或載入範例！",
    creatorEdit: "編輯",
    creatorDelete: "刪除",
    creatorImportError: "無法解析當前 JSON，請先修正 JSON 格式或清空後再使用編輯器。",
    creatorCorrectAnswer: "正確答案",
    creatorOptionPlaceholder: (idx: number) => `選項 ${idx}`
  },
  en: {
    title: "Universal Quiz Game",
    subtitle: "Paste the JSON prepared by LLM below to start practicing",
    jsonLabel: "Quiz JSON",
    loadSample: "Load Sample",
    placeholder: `[\n  {\n    "question": "蘋果",\n    "options": ["apple", "orange", "strawberry", "grape"],\n    "answer": "apple",\n    "ttsText": "apple"\n  }\n]`,
    timeLimit: "Time Limit per Question (seconds)",
    autoAdvance: "Auto Advance",
    autoAdvanceTrue: "Auto advance when correct",
    autoAdvanceFalse: "Manually click continue",
    startPractice: "Start Practice",
    correct: "🎉 Correct!",
    bonus: "Quick answer bonus +3 seconds!",
    incorrect: "❌ Time's up! Or incorrect!",
    continue: "Continue",
    explanation: "💡 Explanation",
    finished: "Practice Completed!",
    finishedDesc: "You have mastered all the questions.",
    restart: "Practice Again",
    errInvalidJson: "Please enter a valid JSON array containing at least one question.",
    errFormat: (idx: number) => `Question ${idx} format is incorrect. It must contain a question, 4 options, and an answer.`,
    errAnswerNotInOptions: (idx: number) => `Question ${idx} answer must be one of the options.`,
    errParseFailed: "JSON parsing failed, please check the format.",
    personalWebsite: "Personal Website",
    exitGame: "Exit Game",
    tabJson: "Paste JSON",
    tabCreator: "Manual Editor",
    tabAiGuide: "AI Generator Guide",
    aiGuideDesc: "We highly recommend using AI tools like ChatGPT or Claude to generate questions for you! Simply copy the prompt below and paste it to the AI to quickly get a perfectly formatted JSON.",
    aiGuidePromptLabel: "Recommended AI Prompt",
    copyPrompt: "Copy Prompt",
    copied: "Copied!",
    creatorAdd: "Add Question",
    creatorUpdate: "Update Question",
    creatorCancel: "Cancel Edit",
    creatorQuestion: "Question Text",
    creatorOptions: "Options - Please check the correct answer",
    creatorTts: "TTS Text (ttsText) - Optional, defaults to question",
    creatorExplanation: "Explanation - Optional",
    creatorNoQuestions: "No questions yet. Add one below or load a sample!",
    creatorEdit: "Edit",
    creatorDelete: "Delete",
    creatorImportError: "Failed to parse current JSON. Please fix the JSON format or clear it before using the editor.",
    creatorCorrectAnswer: "Correct Answer",
    creatorOptionPlaceholder: (idx: number) => `Option ${idx}`
  },
  ja: {
    title: "万能練習ゲーム",
    subtitle: "LLMが作成したJSONを貼り付けて練習を開始します",
    jsonLabel: "問題 JSON",
    loadSample: "サンプルを読み込む",
    placeholder: `[\n  {\n    "question": "Apple",\n    "options": ["りんご", "みかん", "いちご", "ぶどう"],\n    "answer": "りんご",\n    "ttsText": "りんご"\n  }\n]`,
    timeLimit: "1問あたりの制限時間 (秒)",
    autoAdvance: "自動進む",
    autoAdvanceTrue: "正解時に自動で次の問題に進む",
    autoAdvanceFalse: "正解時に手動でクリックして進む",
    startPractice: "練習を開始する",
    correct: "🎉 正解！",
    bonus: "素早い回答ボーナス +3 秒！",
    incorrect: "❌ 時間切れ！または不正解！",
    continue: "次へ",
    explanation: "💡 解説",
    finished: "練習完了！",
    finishedDesc: "すべての問題をマスターしました。",
    restart: "もう一度練習する",
    errInvalidJson: "有効なJSON配列を入力してください。少なくとも1つの問題が必要です。",
    errFormat: (idx: number) => `第 ${idx} 問のフォーマットが正しくありません。question、4つのoptions、およびanswerを含める必要があります。`,
    errAnswerNotInOptions: (idx: number) => `第 ${idx} 問のanswerはoptionsに含まれている必要があります。`,
    errParseFailed: "JSONの解析に失敗しました。フォーマットを確認してください。",
    personalWebsite: "個人サイト",
    exitGame: "ホームに戻る",
    tabJson: "JSON 貼り付け",
    tabCreator: "手動エディタ",
    tabAiGuide: "AI 生成ガイド",
    aiGuideDesc: "ChatGPT や Claude などの AI ツールを使って問題を生成することをお勧めします！以下のプロンプトをコピーして AI に貼り付けるだけで、フォーマットに沿った問題の JSON を素早く取得できます。",
    aiGuidePromptLabel: "推奨 AI プロンプト",
    copyPrompt: "プロンプトをコピー",
    copied: "コピーしました！",
    creatorAdd: "問題を追加",
    creatorUpdate: "問題を更新",
    creatorCancel: "編集をキャンセル",
    creatorQuestion: "問題文 (Question)",
    creatorOptions: "選択肢 (Options) - 正解にチェックを入れてください",
    creatorTts: "音声読み上げテキスト (ttsText) - 任意、デフォルトは問題文",
    creatorExplanation: "解説 (Explanation) - 任意",
    creatorNoQuestions: "まだ問題がありません。以下で追加するか、サンプルを読み込んでください！",
    creatorEdit: "編集",
    creatorDelete: "削除",
    creatorImportError: "現在の JSON を解析できません。エディタを使用する前に、JSON のフォーマットを修正するか、クリアしてください。",
    creatorCorrectAnswer: "正解",
    creatorOptionPlaceholder: (idx: number) => `選択肢 ${idx}`
  }
};

const sampleJsonZh = `[
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

const sampleJsonEn = `[
  {
    "question": "彼は毎朝６時に起きる＿＿にしている。",
    "options": ["こと", "もの", "ため", "わけ"],
    "answer": "こと",
    "ttsText": "かれはまいあさろくじにおきることにしている。",
    "explanation": "「〜ことにしている」is a fixed pattern meaning 'have made it a habit to ~' or 'have decided to always ~', emphasizing the speaker's own will and routine. Example: 毎日運動することにしている (I make it a habit to exercise every day). 「ものにしている」is not a valid expression; 「ためにしている」is grammatically incoherent; 「わけにしている」is also not a correct collocation."
  },
  {
    "question": "この仕事は私＿＿できない。",
    "options": ["にしか", "だけが", "しかに", "のみに"],
    "answer": "にしか",
    "ttsText": "このしごとはわたしにしかできない。",
    "explanation": "「〜にしか〜ない」means 'only ~ can (do something)', negating all other possibilities. Here 「しか」follows the particle 「に」and pairs with the negative 「できない」, meaning 'no one but me can do this'. 「だけが」also means 'only', but the correct form would be 「私だけができる」(affirmative); since the sentence ends in the negative 「できない」, it does not fit. 「しかに」and 「のみに」are not valid Japanese expressions."
  },
  {
    "question": "雨が降って＿＿、試合は続けられた。",
    "options": ["いても", "あっても", "いたが", "いるのに"],
    "answer": "いても",
    "ttsText": "あめがふっていても、しあいはつづけられた。",
    "explanation": "「〜ていても」means 'even while ~' and expresses a concessive condition: 'even though it was raining, the game continued'. 「あっても」must follow a noun or adjective (e.g. 雨であっても), so attaching it to the verb 「降って」is grammatically incorrect. 「いたが」is a past-tense contrast, but the logical flow of the sentence is weak. 「いるのに」implies the speaker's dissatisfaction or surprise, which does not suit the objective tone of this sentence."
  },
  {
    "question": "彼女は歌手である＿＿、女優でもある。",
    "options": ["とともに", "にしても", "からには", "ばかりか"],
    "answer": "とともに",
    "ttsText": "かのじょはかしゅであるとともに、じょゆうでもある。",
    "explanation": "「〜とともに」means 'at the same time as ~' or 'as well as ~', used to list two roles or states in parallel: 'She is a singer and also an actress.' 「にしても」means 'even if ~' and carries a concessive nuance, unsuitable here. 「からには」means 'now that ~ / since ~', with a completely different meaning. 「ばかりか」means 'not only ~ but also ~', and while grammatically possible, it implies the second item is an even more surprising addition; 「とともに」more naturally expresses the parallel dual identity here."
  },
  {
    "question": "試験に合格した＿＿、すぐに報告した。",
    "options": ["とたんに", "からには", "とたん", "ついでに"],
    "answer": "とたんに",
    "ttsText": "しけんにごうかくしたとたんに、すぐにほうこくした。",
    "explanation": "「〜たとたんに」means 'the moment ~, immediately...', emphasizing that the two actions occurred almost simultaneously: 'The moment I passed the exam, I reported it right away.' 「からには」means 'now that ~ / since ~', emphasizing responsibility or resolve, which does not fit the instantaneous nuance here. 「とたん」without 「に」is occasionally seen but the standard form is 「とたんに」. 「ついでに」means 'while I'm at it / on the side', which is completely different in meaning."
  },
  {
    "question": "彼はお酒を飲む＿＿、タバコも吸う。",
    "options": ["うえに", "ほかに", "ために", "ように"],
    "answer": "うえに",
    "ttsText": "かれはおさけをのむうえに、タバコもすう。",
    "explanation": "「〜うえに」means 'on top of ~, also...' and is used to add another (often negative) item: 'Not only does he drink, he also smokes', implying an accumulation of bad habits. 「ほかに」means 'besides that, there is also ~' and is more neutral; it typically appears as 「〜のほかに」, so directly attaching it to a dictionary-form verb is unnatural. 「ために」expresses purpose or cause, which does not fit. 「ように」expresses purpose or manner, which also does not fit."
  },
  {
    "question": "子供の＿＿、早く寝なさい。",
    "options": ["くせに", "ために", "わりに", "ほどに"],
    "answer": "くせに",
    "ttsText": "こどものくせに、はやくねなさい。",
    "explanation": "「〜くせに」means 'even though you are ~' and carries a tone of reproach, contempt, or sarcasm. 「子供のくせに（早く寝なさい）」means 'You're just a child, so hurry up and go to sleep', with a scolding nuance. 「ために」expresses purpose or a target beneficiary, which does not fit. 「わりに」means 'for a ~, comparatively...', used to contrast expectation with reality. 「ほどに」expresses degree and does not suit this sentence structure."
  },
  {
    "question": "もっと練習すれば、うまく＿＿はずだ。",
    "options": ["なれる", "なった", "なる", "なれた"],
    "answer": "なれる",
    "ttsText": "もっとれんしゅうすれば、うまくなれるはずだ。",
    "explanation": "「〜ば〜はずだ」means 'if ~, then surely...', combining a conditional with a conjecture; the second clause should be in the non-past tense. 「なれる」is the potential form of 「なる」, meaning 'should be able to become good at it', which best conveys the intended meaning. 「なった」is past tense and contradicts the hypothetical future context. 「なる」is non-past but lacks the potential nuance of 'being able to'. 「なれた」is the past potential form, which also conflicts with the future hypothetical context."
  },
  {
    "question": "先生に＿＿、この本を読んでおいた。",
    "options": ["言われたので", "言うので", "言ったので", "言わせたので"],
    "answer": "言われたので",
    "ttsText": "せんせいにいわれたので、このほんをよんでおいた。",
    "explanation": "「先生に言われた」is the passive form meaning 'was told by the teacher', i.e. 'the teacher told me to (read it)'. Combined with 「ので」for reason, the sentence means 'Because the teacher told me to, I read this book in advance.' 「言うので」is active present tense, making 「先生に」the indirect object of an active verb, which does not match the passive context. 「言ったので」is active past tense; 「先生に言ったので」would mean 'because I told the teacher', which is the wrong meaning. 「言わせたので」is the causative form meaning 'made the teacher say', which is logically nonsensical here."
  },
  {
    "question": "彼が来る＿＿、準備しておこう。",
    "options": ["前に", "ために", "ように", "までに"],
    "answer": "までに",
    "ttsText": "かれがくるまでに、じゅんびしておこう。",
    "explanation": "「〜までに」means 'by the time ~' or 'before ~ (as a deadline)', emphasizing completion within a time limit. 「彼が来るまでに準備しておこう」means 'Let's have everything ready before he arrives', stressing the deadline. While 「来る前に」(before he comes) is also grammatically correct, 「までに」more precisely conveys the nuance of completing something within a set timeframe, which is the key point tested at the N3–N2 level. 「ために」expresses purpose, and 「ように」expresses purpose or manner; neither fits the meaning here."
  }
]`;

const sampleJsonJa = `[
  {
    "question": "The meeting has been _____ due to the manager's absence.",
    "options": ["cancelled", "cancelling", "cancel", "to cancel"],
    "answer": "cancelled",
    "ttsText": "The meeting has been cancelled due to the manager's absence.",
    "explanation": "この文は現在完了受動態「has been + 過去分詞」を使っています。'cancel' の正しい過去分詞は 'cancelled' です。'Cancelling' は現在分詞、'cancel' は原形、'to cancel' は不定詞であり、いずれも 'has been _____' という受動態の構造には当てはまりません。"
  },
  {
    "question": "She suggested _____ the report before submitting it.",
    "options": ["to proofread", "proofreading", "proofread", "proofread"],
    "answer": "proofreading",
    "ttsText": "She suggested proofreading the report before submitting it.",
    "explanation": "動詞 'suggest' の後には動名詞（V-ing形）が続き、不定詞は使えません。よって 'suggest proofreading' が正解です。動名詞を後に取る代表的な動詞には suggest、recommend、enjoy、avoid、consider、finish などがあります。"
  },
  {
    "question": "If you _____ any questions, please feel free to contact us.",
    "options": ["have", "had", "will have", "are having"],
    "answer": "have",
    "ttsText": "If you have any questions, please feel free to contact us.",
    "explanation": "仮定法現在（第1条件文）では、if節の中は現在形を使い、未来形は使いません。'If you have' が正解です。'Will have' はif節の中では誤りです。'Had' は仮定法過去（第2条件文）を示し、ここでの意味に合いません。'Are having' は一時的・進行中の状況に使われ、この文脈には不適切です。"
  },
  {
    "question": "The new policy will be _____ effect starting next Monday.",
    "options": ["in", "on", "at", "by"],
    "answer": "in",
    "ttsText": "The new policy will be in effect starting next Monday.",
    "explanation": "'In effect' は「施行中・有効」を意味する固定フレーズです。'on'、'at'、'by' はこの文脈で 'effect' と組み合わせることはできません。固定フレーズ（コロケーション）を覚えることは、TOEIC Part 5 攻略に不可欠です。"
  },
  {
    "question": "The manager asked the employees _____ overtime this weekend.",
    "options": ["work", "working", "to work", "worked"],
    "answer": "to work",
    "ttsText": "The manager asked the employees to work overtime this weekend.",
    "explanation": "動詞 'ask' は「ask + 目的語 + to不定詞」の形を取ります。よって 'asked the employees to work' が正解です。'make' や 'let' のような動詞は 'to' なしの原形不定詞を取る点と混同しないよう注意しましょう。"
  },
  {
    "question": "_____ the heavy rain, the outdoor event was held as scheduled.",
    "options": ["Despite", "Although", "Because of", "Even if"],
    "answer": "Despite",
    "ttsText": "Despite the heavy rain, the outdoor event was held as scheduled.",
    "explanation": "'Despite' は前置詞であり、後に名詞句（例：'the heavy rain'）が続きます。節は続けられません。'Although' は接続詞で「主語＋動詞」の節が必要です。'Because of' は理由を示すため、意味が逆になります。'Even if' は条件節を導き、動詞が必要です。"
  },
  {
    "question": "The quarterly report must be submitted _____ Friday at the latest.",
    "options": ["until", "by", "on", "during"],
    "answer": "by",
    "ttsText": "The quarterly report must be submitted by Friday at the latest.",
    "explanation": "'By' は期限を示し、「特定の時点までに完了しなければならない」という意味です。'Until' は「ある時点まで継続する動作」に使います（例：'I will wait until Friday'）。'On' は特定の日を指しますが、期限のニュアンスはありません。'During' は期間を示し、時点を示すものではありません。"
  },
  {
    "question": "The CEO, _____ speech impressed everyone, received a standing ovation.",
    "options": ["who", "whose", "which", "whom"],
    "answer": "whose",
    "ttsText": "The CEO, whose speech impressed everyone, received a standing ovation.",
    "explanation": "'Whose' は所有を示す関係代名詞で、「CEO のスピーチ」という意味になります。'Who' は主語として人を置き換えますが、所有は示せません。'Which' は物を指し、人には使いません。'Whom' は関係節の目的語として使われ、所有を示すことはできません。"
  },
  {
    "question": "We are looking forward to _____ from you soon.",
    "options": ["hear", "heard", "hearing", "have heard"],
    "answer": "hearing",
    "ttsText": "We are looking forward to hearing from you soon.",
    "explanation": "'look forward to' の 'to' は不定詞の一部ではなく前置詞であるため、後には動名詞（V-ing形）が続きます。これはTOEICでよく出る落とし穴です。同様に動名詞を後に取るフレーズには 'be used to'、'object to'、'in addition to'、'with a view to' などがあります。"
  },
  {
    "question": "Sales figures for Q3 were significantly higher than _____ for Q2.",
    "options": ["it", "those", "them", "that"],
    "answer": "those",
    "ttsText": "Sales figures for Q3 were significantly higher than those for Q2.",
    "explanation": "'Those' は複数名詞（'sales figures'）を繰り返さないために使う代名詞です。'It' と 'that' は単数形であり、複数名詞には合いません。'Them' は目的格代名詞であり、このような比較構文では使えません。比較構文における代用の 'those' の使い方は、TOEIC 文法の重要ポイントです。"
  }
]`;

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

const getInitialLanguage = (): Language => {
  const saved = localStorage.getItem('quiz_builder_lang') as Language;
  if (saved && ['zh', 'en', 'ja'].includes(saved)) {
    return saved;
  }
  const browserLang = navigator.language.toLowerCase();
  if (browserLang.startsWith('zh')) return 'zh';
  if (browserLang.startsWith('ja')) return 'ja';
  return 'en';
};

type TabType = 'json' | 'creator' | 'ai_guide';

export default function App() {
  const [lang, setLang] = useState<Language>(getInitialLanguage);
  const [gameState, setGameState] = useState<GameState>('input');
  const [activeTab, setActiveTab] = useState<TabType>('json');
  const [jsonInput, setJsonInput] = useState<string>(() => {
    return localStorage.getItem('quiz_builder_json') || '';
  });
  const [quizItems, setQuizItems] = useState<QuizItem[]>([]);
  const [itemStats, setItemStats] = useState<Record<number, number>>({});
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);
  const [bonusTime, setBonusTime] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10);
  const [error, setError] = useState('');
  const [showExplanation, setShowExplanation] = useState(false);
  const [baseTimeLimit, setBaseTimeLimit] = useState(10);
  const [autoAdvance, setAutoAdvance] = useState(true);
  const [isCorrectAnswer, setIsCorrectAnswer] = useState<boolean | null>(null);

  // 產生器狀態
  const [creatorItems, setCreatorItems] = useState<QuizItem[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [creatorQuestion, setCreatorQuestion] = useState('');
  const [creatorOptions, setCreatorOptions] = useState<string[]>(['', '', '', '']);
  const [creatorCorrectIdx, setCreatorCorrectIdx] = useState<number>(0);
  const [creatorTts, setCreatorTts] = useState('');
  const [creatorExplanation, setCreatorExplanation] = useState('');
  const [copied, setCopied] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 當 jsonInput 改變時，同步到 localStorage
  useEffect(() => {
    localStorage.setItem('quiz_builder_json', jsonInput);
  }, [jsonInput]);

  // 當 jsonInput 改變時，嘗試同步到 creatorItems
  useEffect(() => {
    if (activeTab !== 'creator') {
      try {
        if (jsonInput.trim() === '') {
          setCreatorItems([]);
          return;
        }
        const parsed = JSON.parse(jsonInput);
        if (Array.isArray(parsed)) {
          // 簡單驗證格式，避免不合法的 JSON 導致編輯器崩潰
          const validItems = parsed.filter(item => 
            item && 
            typeof item.question === 'string' && 
            Array.isArray(item.options) && 
            item.options.length === 4 && 
            typeof item.answer === 'string'
          );
          setCreatorItems(validItems);
        }
      } catch (e) {
        // 忽略解析錯誤，因為使用者可能正在輸入中
      }
    }
  }, [jsonInput, activeTab]);

  // 當 creatorItems 改變時，同步回 jsonInput
  const syncCreatorToInput = (items: QuizItem[]) => {
    if (items.length === 0) {
      setJsonInput('');
    } else {
      setJsonInput(JSON.stringify(items, null, 2));
    }
  };

  // 處理手動編輯器中的新增或更新
  const handleSaveCreatorItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!creatorQuestion.trim()) return;
    
    // 確保選項都有填寫，若沒填寫則使用預設預留字
    const finalOptions = creatorOptions.map((opt, idx) => opt.trim() || `Option ${idx + 1}`);
    const correctAnswer = finalOptions[creatorCorrectIdx];

    const newItem: QuizItem = {
      question: creatorQuestion.trim(),
      options: finalOptions,
      answer: correctAnswer,
    };

    if (creatorTts.trim()) {
      newItem.ttsText = creatorTts.trim();
    }
    if (creatorExplanation.trim()) {
      newItem.explanation = creatorExplanation.trim();
    }

    let updatedItems = [...creatorItems];
    if (editingIndex !== null) {
      updatedItems[editingIndex] = newItem;
      setEditingIndex(null);
    } else {
      updatedItems.push(newItem);
    }

    setCreatorItems(updatedItems);
    syncCreatorToInput(updatedItems);

    // 重設表單
    setCreatorQuestion('');
    setCreatorOptions(['', '', '', '']);
    setCreatorCorrectIdx(0);
    setCreatorTts('');
    setCreatorExplanation('');
  };

  const handleEditCreatorItem = (index: number) => {
    const item = creatorItems[index];
    setCreatorQuestion(item.question);
    setCreatorOptions([...item.options]);
    
    const correctIdx = item.options.indexOf(item.answer);
    setCreatorCorrectIdx(correctIdx !== -1 ? correctIdx : 0);
    
    setCreatorTts(item.ttsText || '');
    setCreatorExplanation(item.explanation || '');
    setEditingIndex(index);
  };

  const handleDeleteCreatorItem = (index: number) => {
    const updatedItems = creatorItems.filter((_, idx) => idx !== index);
    setCreatorItems(updatedItems);
    syncCreatorToInput(updatedItems);
    if (editingIndex === index) {
      setEditingIndex(null);
      setCreatorQuestion('');
      setCreatorOptions(['', '', '', '']);
      setCreatorCorrectIdx(0);
      setCreatorTts('');
      setCreatorExplanation('');
    } else if (editingIndex !== null && editingIndex > index) {
      setEditingIndex(editingIndex - 1);
    }
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setCreatorQuestion('');
    setCreatorOptions(['', '', '', '']);
    setCreatorCorrectIdx(0);
    setCreatorTts('');
    setCreatorExplanation('');
  };

  // 根據當前語言獲取 AI 提示詞
  const getAiPrompt = () => {
    if (lang === 'zh') {
      return `請幫我生成一組測驗題目，格式必須是 JSON 陣列。
每個題目必須包含以下欄位：
1. "question": 題目的問題（字串）
2. "options": 4 個選項的陣列（字串陣列，長度必須剛好為 4）
3. "answer": 正確答案（字串，必須是 options 陣列中的其中一個元素）
4. "ttsText": 語音朗讀文字（字串，選填，通常與 question 相同或為其發音）
5. "explanation": 題目詳解（字串，選填，解釋為什麼這個答案是正確的）

請直接輸出 JSON 陣列，不要包含任何 Markdown 標記（如 \`\`\`json）或額外的解釋文字。

範例格式：
[
  {
    "question": "下列哪一種排序演算法的平均時間複雜度為 O(n log n)？",
    "options": ["泡沫排序 (Bubble Sort)", "插入排序 (Insertion Sort)", "快速排序 (Quick Sort)", "選擇排序 (Selection Sort)"],
    "answer": "快速排序 (Quick Sort)",
    "explanation": "Quick Sort 的平均時間複雜度為 O(n log n)，而 Bubble Sort、Insertion Sort、Selection Sort 的平均時間複雜度皆為 O(n²)。"
  }
]

請幫我生成關於 [請在此輸入你的主題，例如：日檢N3文法、JavaScript基礎、世界地理] 的 10 個題目。`;
    } else if (lang === 'ja') {
      return `クイズの作成をお願いします。フォーマットは必ず JSON 配列にしてください。
各オブジェクトは以下のフィールドを必ず含める必要があります：
1. "question": 問題文（文字列）
2. "options": 4つの選択肢（文字列の配列、要素数は必ず4つ）
3. "answer": 正解（文字列、必ず options 配列のいずれかと一致させる）
4. "ttsText": 音声読み上げテキスト（文字列、任意、通常は問題文と同じ、またはその読み仮名）
5. "explanation": 問題の解説（文字列、任意、なぜその答えが正しいのかを説明する）

Markdown の枠組み（\`\`\`json など）や余計な説明文は一切含めず、純粋な JSON 配列のみを出力してください。

フォーマット例：
[
  {
    "question": "次のうち、平均時間計算量が O(n log n) であるソートアルゴリズムはどれですか？",
    "options": ["バブルソート (Bubble Sort)", "挿入ソート (Insertion Sort)", "クイックソート (Quick Sort)", "選択ソート (Selection Sort)"],
    "answer": "クイックソート (Quick Sort)",
    "explanation": "クイックソートの平均時間計算量は O(n log n) です。バブルソート、挿入ソート、選択ソートの平均時間計算量は O(n²) です。"
  }
]

[ここにテーマを入力してください。例：TOEIC頻出文法、JavaScriptの基礎、世界地理] について、10問作成してください。`;
    } else {
      return `Please help me generate a set of quiz questions. The format must be a JSON array.
Each question object must contain the following fields:
1. "question": The question text (string)
2. "options": An array of 4 options (array of strings, length must be exactly 4)
3. "answer": The correct answer (string, must be one of the elements in the options array)
4. "ttsText": Text-to-speech text (string, optional, usually same as question or its pronunciation)
5. "explanation": Explanation of the question (string, optional, explaining why the answer is correct)

Please output ONLY the raw JSON array. Do not include any Markdown formatting (like \`\`\`json) or extra conversational text.

Example format:
[
  {
    "question": "Which of the following sorting algorithms has an average time complexity of O(n log n)?",
    "options": ["Bubble Sort", "Insertion Sort", "Quick Sort", "Selection Sort"],
    "answer": "Quick Sort",
    "explanation": "Quick Sort has an average time complexity of O(n log n), while Bubble Sort, Insertion Sort, and Selection Sort have an average time complexity of O(n²)."
  }
]

Please generate 10 questions about [Enter your topic here, e.g., Japanese Kana, JavaScript Basics, World Geography].`;
    }
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(getAiPrompt());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    localStorage.setItem('quiz_builder_lang', lang);
    const html = document.documentElement;
    if (lang === 'zh') {
      html.lang = 'zh-TW';
    } else if (lang === 'ja') {
      html.lang = 'ja';
    } else {
      html.lang = 'en';
    }
  }, [lang]);

  const exitGame = () => {
    cancelSpeak();
    if (timerRef.current) clearInterval(timerRef.current);
    setGameState('input');
    setCurrentIndex(null);
    setIsCorrectAnswer(null);
    setShowExplanation(false);
  };

  const startGame = () => {
    try {
      const parsedData = JSON.parse(jsonInput);
      if (!Array.isArray(parsedData) || parsedData.length === 0) {
        throw new Error(translations[lang].errInvalidJson);
      }

      for (let i = 0; i < parsedData.length; i++) {
        const item = parsedData[i];
        if (!item.question || !Array.isArray(item.options) || item.options.length !== 4 || !item.answer) {
          throw new Error(translations[lang as Language].errFormat(i + 1));
        }
        if (!item.options.includes(item.answer)) {
          throw new Error(translations[lang as Language].errAnswerNotInOptions(i + 1));
        }
      }

      const shuffledQuestions = shuffleArray(parsedData);
      const shuffledData = shuffledQuestions.map((item: QuizItem) => ({
        ...item,
        options: shuffleArray(item.options)
      }));

      setQuizItems(shuffledData);
      const initialStats: Record<number, number> = {};
      parsedData.forEach((_: any, idx: number) => { initialStats[idx] = 0; });
      setItemStats(initialStats);
      setBonusTime(0);
      setShowExplanation(false);
      setIsCorrectAnswer(null);
      setError('');

      const nextIdx = Math.floor(Math.random() * parsedData.length);
      setCurrentIndex(nextIdx);
      setGameState('playing');

    } catch (err: any) {
      setError(err.message || translations[lang as Language].errParseFailed);
    }
  };

  const pickNextItem = (currentStats: Record<number, number>, excludeIndex: number | null) => {
    cancelSpeak();
    setShowExplanation(false);
    setIsCorrectAnswer(null);
    const available = quizItems.map((_, idx: number) => idx).filter((idx: number) => (currentStats[idx] || 0) < 2);

    if (available.length === 0) {
      setGameState('finished');
      return;
    }

    let candidates = available.filter((idx: number) => idx !== excludeIndex);
    if (candidates.length === 0) candidates = available;

    const nextIdx = candidates[Math.floor(Math.random() * candidates.length)];
    
    // 重新打亂即將顯示的題目的選項
    setQuizItems(prev => {
      const updated = [...prev];
      updated[nextIdx] = {
        ...updated[nextIdx],
        options: shuffleArray(updated[nextIdx].options)
      };
      return updated;
    });

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

      if (autoAdvance) {
        setShowExplanation(true);
        if (currentItem.ttsText) {
          speak(currentItem.ttsText, () => {
            pickNextItem(newStats, currentIndex);
          });
        } else {
          setTimeout(() => {
            pickNextItem(newStats, currentIndex);
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
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8 relative">
      {/* 語言切換按鈕 */}
      <div className="fixed top-4 right-4 flex gap-2 z-50">
        {(['zh', 'en', 'ja'] as Language[]).map((l) => (
          <button
            key={l}
            onClick={() => setLang(l)}
            className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all shadow-sm border ${
              lang === l
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
            }`}
          >
            {l === 'zh' ? '繁中' : l === 'en' ? 'EN' : '日本語'}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {gameState === 'input' && (
          <motion.div
            key="input"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-2xl bg-white rounded-3xl shadow-xl p-8"
          >
            <div className="text-center mb-6">
              <h1 className="text-3xl font-bold mb-2">{translations[lang].title}</h1>
              <p className="text-gray-600">{translations[lang].subtitle}</p>
            </div>

            {/* 分頁切換 Tab */}
            <div className="flex border-b border-gray-200 mb-6">
              <button
                onClick={() => setActiveTab('json')}
                className={`flex-1 py-3 text-center font-bold text-sm border-b-2 transition-all ${
                  activeTab === 'json'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {translations[lang].tabJson}
              </button>
              <button
                onClick={() => setActiveTab('creator')}
                className={`flex-1 py-3 text-center font-bold text-sm border-b-2 transition-all ${
                  activeTab === 'creator'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {translations[lang].tabCreator}
              </button>
              <button
                onClick={() => setActiveTab('ai_guide')}
                className={`flex-1 py-3 text-center font-bold text-sm border-b-2 transition-all ${
                  activeTab === 'ai_guide'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {translations[lang].tabAiGuide}
              </button>
            </div>

            {/* 分頁內容 */}
            <div className="mb-6">
              {activeTab === 'json' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      {translations[lang].jsonLabel}
                    </label>
                    <button
                      onClick={() => {
                        if (lang === 'zh') setJsonInput(sampleJsonZh);
                        else if (lang === 'en') setJsonInput(sampleJsonEn);
                        else setJsonInput(sampleJsonJa);
                      }}
                      className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                      <FileJson size={16} />
                      {translations[lang].loadSample}
                    </button>
                  </div>
                  <textarea
                    value={jsonInput}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setJsonInput(e.target.value)}
                    placeholder={translations[lang].placeholder}
                    className="w-full h-64 p-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-0 font-mono text-sm resize-none"
                  />
                  {error && (
                    <p className="mt-2 text-red-500 text-sm flex items-center gap-1">
                      <XCircle size={16} />
                      {error}
                    </p>
                  )}
                </motion.div>
              )}

              {activeTab === 'creator' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  {/* 題目列表 */}
                  <div className="max-h-60 overflow-y-auto border border-gray-100 rounded-xl p-2 space-y-2 bg-gray-50">
                    {creatorItems.length === 0 ? (
                      <p className="text-center text-gray-400 text-sm py-8">
                        {translations[lang].creatorNoQuestions}
                      </p>
                    ) : (
                      creatorItems.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm border border-gray-100"
                        >
                          <div className="flex-1 min-w-0 pr-4">
                            <p className="text-sm font-bold text-gray-800 truncate">
                              {idx + 1}. {item.question}
                            </p>
                            <p className="text-xs text-gray-500 truncate mt-0.5">
                              {translations[lang].creatorCorrectAnswer}: {item.answer}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEditCreatorItem(idx)}
                              className="px-2.5 py-1 text-xs font-bold text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                            >
                              {translations[lang].creatorEdit}
                            </button>
                            <button
                              onClick={() => handleDeleteCreatorItem(idx)}
                              className="px-2.5 py-1 text-xs font-bold text-red-600 hover:bg-red-50 rounded-md transition-colors"
                            >
                              {translations[lang].creatorDelete}
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* 編輯表單 */}
                  <form onSubmit={handleSaveCreatorItem} className="p-5 border-2 border-gray-100 rounded-2xl space-y-4 bg-white">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        {translations[lang].creatorQuestion}
                      </label>
                      <input
                        type="text"
                        required
                        value={creatorQuestion}
                        onChange={(e) => setCreatorQuestion(e.target.value)}
                        placeholder="e.g. 蘋果的英文是什麼？"
                        className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-0"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">
                        {translations[lang].creatorOptions}
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {creatorOptions.map((opt, idx) => (
                          <div key={idx} className="flex items-center gap-2 border border-gray-200 rounded-lg p-2 bg-gray-50">
                            <input
                              type="radio"
                              name="correct_answer"
                              checked={creatorCorrectIdx === idx}
                              onChange={() => setCreatorCorrectIdx(idx)}
                              className="w-4 h-4 text-blue-600 focus:ring-0 cursor-pointer"
                            />
                            <input
                              type="text"
                              value={opt}
                              onChange={(e) => {
                                const updated = [...creatorOptions];
                                updated[idx] = e.target.value;
                                setCreatorOptions(updated);
                              }}
                              placeholder={translations[lang].creatorOptionPlaceholder(idx + 1)}
                              className="flex-1 bg-transparent border-none p-0 text-sm focus:ring-0"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                          {translations[lang].creatorTts}
                        </label>
                        <input
                          type="text"
                          value={creatorTts}
                          onChange={(e) => setCreatorTts(e.target.value)}
                          placeholder="e.g. apple"
                          className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-0"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                          {translations[lang].creatorExplanation}
                        </label>
                        <input
                          type="text"
                          value={creatorExplanation}
                          onChange={(e) => setCreatorExplanation(e.target.value)}
                          placeholder="e.g. 蘋果的英文是 apple，而 orange 是橘子。"
                          className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-0"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2">
                      {editingIndex !== null && (
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          className="px-4 py-2 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          {translations[lang].creatorCancel}
                        </button>
                      )}
                      <button
                        type="submit"
                        className="px-5 py-2 text-sm font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        {editingIndex !== null ? translations[lang].creatorUpdate : translations[lang].creatorAdd}
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}

              {activeTab === 'ai_guide' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
                    <p className="text-sm text-blue-800 leading-relaxed">
                      {translations[lang].aiGuideDesc}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-gray-700">
                        {translations[lang].aiGuidePromptLabel}
                      </span>
                      <button
                        onClick={handleCopyPrompt}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1 ${
                          copied
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {copied ? translations[lang].copied : translations[lang].copyPrompt}
                      </button>
                    </div>
                    <pre className="w-full p-4 bg-gray-900 text-gray-100 rounded-xl text-xs font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-80 overflow-y-auto">
                      {getAiPrompt()}
                    </pre>
                  </div>
                </motion.div>
              )}
            </div>

            {/* 設定區塊 */}
            <div className="mb-8 p-6 bg-gray-50 rounded-2xl border-2 border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {translations[lang].timeLimit}
                </label>
                <input
                  type="number"
                  min={1}
                  max={300}
                  value={baseTimeLimit}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBaseTimeLimit(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-0 font-medium"
                />
              </div>
              <div className="flex flex-col justify-center">
                <span className="block text-sm font-semibold text-gray-700 mb-2">
                  {translations[lang].autoAdvance}
                </span>
                <label className="relative inline-flex items-center cursor-pointer mt-1">
                  <input
                    type="checkbox"
                    checked={autoAdvance}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAutoAdvance(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 flex-shrink-0"></div>
                  <span className="ml-3 text-sm font-medium text-gray-700">
                    {autoAdvance ? translations[lang].autoAdvanceTrue : translations[lang].autoAdvanceFalse}
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
              {translations[lang].startPractice}
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
                <button
                  onClick={exitGame}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-red-600 hover:text-white hover:bg-red-500 border border-red-200 hover:border-red-500 rounded-xl transition-all shadow-sm"
                >
                  <LogOut size={16} />
                  {translations[lang].exitGame}
                </button>
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
                {currentItem.options.map((option: string, idx: number) => {
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
                    {translations[lang].explanation}
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
                      {translations[lang].correct}{bonusTime > 0 ? ` ${translations[lang].bonus}` : ""}
                    </p>
                  ) : (
                    <p className="text-red-500 font-bold text-2xl mb-4">{translations[lang].incorrect}</p>
                  )}
                  <button
                    onClick={() => pickNextItem(itemStats, currentIndex)}
                    className="px-8 py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition-colors"
                  >
                    {translations[lang].continue}
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
            <h2 className="text-3xl font-bold mb-4">{translations[lang].finished}</h2>
            <p className="text-gray-600 mb-8">{translations[lang].finishedDesc}</p>
            <button
              onClick={() => {
                setGameState('input');
              }}
              className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 transition-colors"
            >
              {translations[lang].restart}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 右下角個人網站與 GitHub 圖示 */}
      <div className="fixed bottom-4 right-4 flex items-center gap-3 z-50">
        <a
          href="https://306007.xyz/"
          target="_blank"
          rel="noopener noreferrer"
          className="w-10 h-10 bg-white rounded-full shadow-md border border-gray-200 flex items-center justify-center hover:scale-110 transition-transform overflow-hidden"
          title={translations[lang].personalWebsite}
        >
          <img src="https://www.google.com/s2/favicons?domain=306007.xyz&sz=64" alt="Personal Website" className="w-6 h-6 object-contain" />
        </a>
        <a
          href="https://github.com/m1raji/quiz_builder"
          target="_blank"
          rel="noopener noreferrer"
          className="w-10 h-10 bg-white rounded-full shadow-md border border-gray-200 flex items-center justify-center hover:scale-110 transition-transform text-gray-700 hover:text-black"
          title="GitHub"
        >
          <Github size={20} />
        </a>
      </div>
    </div>
  );
}
