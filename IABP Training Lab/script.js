// IABP タイミング学習ツール
// リアルタイム動作版: ECG/AP/BP の連続スクロール表示
(function () {
  'use strict';

  // ======== 目標タイミング (cycle 比率) ========
  const TARGET_INFLATION_PCT = 0.35;
  const TARGET_DEFLATION_PCT = 0.98;
  const TOL_INF_OK = 0.03;
  const TOL_INF_WARN = 0.10;
  const TOL_DEF_OK = 0.03;
  const TOL_DEF_WARN = 0.10;

  // 表示窓 (sweep window)
  const DISPLAY_WINDOW_MS = 4000;
  const SAMPLE_DT = 4; // ms
  const TEST_QUESTION_LIMIT = 10;

  // ======== 状態 ========
  const state = {
    hr: 60,                 // 患者の心拍数 (ECG/圧/ペーシングモード)
    internalRate: 80,       // インターナルモードの固定駆動レート
    ratio: 2,
    mode: 'ecg',            // 'ecg' | 'pressure' | 'pacing' | 'internal'
    internalRhythm: 'vf',   // 'vf' | 'asystole'
    inflationPct: 0.35,
    deflationPct: 0.98,
    isPlaying: true,
    showLandmarks: true,
    showReference: false,
    waveDisplay: 'all',
    testHints: false
  };

  let simTime = 4000; // simulation time (ms) — 開始時に表示窓を埋める
  let lastAnimTime = null;
  let lastEvalTime = 0;

  // ======== Test Mode 状態 ========
  const testState = {
    active: false,
    currentType: null,    // 'perfect' | 'early-inf' | 'late-inf' | 'early-def' | 'late-def'
    answered: false,
    correct: 0,
    total: 0,
    score: 0,
    difficulty: 'easy',   // 'easy' | 'medium' | 'hard' | 'extreme'
    savedShowLandmarks: true,
    savedShowReference: false,
    savedMode: 'ecg',
    savedRatio: 2
  };

  const tuneState = {
    active: false,
    currentScenario: null,
    answered: false,
    correct: 0,
    total: 0,
    score: 0,
    savedShowLandmarks: true,
    savedShowReference: false,
    savedMode: 'ecg',
    savedRatio: 2,
    savedWaveDisplay: 'all',
    savedHr: 60
  };

  const TUNE_SCENARIOS = [
    {
      id: 'sinus-ecg-ap',
      rhythm: 'sinus',
      display: 'ecg-ap',
      triggerMode: 'ecg',
      hr: 72,
      targetInf: 0.35,
      targetDef: 0.98,
      rhythmLabel: '洞調律',
      displayLabel: 'ECG + 圧波形 + バルーン内圧',
      triggerLabel: 'ECGトリガー'
    },
    {
      id: 'sinus-ecg-only',
      rhythm: 'sinus',
      display: 'ecg-only',
      triggerMode: 'ecg',
      hr: 78,
      targetInf: 0.35,
      targetDef: 0.98,
      rhythmLabel: '洞調律',
      displayLabel: 'ECGのみ + バルーン内圧',
      triggerLabel: 'ECGトリガー'
    },
    {
      id: 'sinus-pressure-only',
      rhythm: 'sinus',
      display: 'pressure-only',
      triggerMode: 'pressure',
      hr: 68,
      targetInf: 0.35,
      targetDef: 0.98,
      rhythmLabel: '洞調律',
      displayLabel: '圧波形のみ + バルーン内圧',
      triggerLabel: '圧トリガー'
    },
    {
      id: 'af-ecg-rwave',
      rhythm: 'af',
      display: 'ecg-only',
      triggerMode: 'ecg',
      hr: 94,
      targetInf: 0.35,
      targetDef: 1.00,
      rhythmLabel: '心房細動 (Af)',
      displayLabel: 'ECGのみ + バルーン内圧',
      triggerLabel: 'R波トリガー収縮'
    },
    {
      id: 'af-pressure-rwave',
      rhythm: 'af',
      display: 'pressure-only',
      triggerMode: 'pressure',
      hr: 92,
      targetInf: 0.35,
      targetDef: 1.00,
      rhythmLabel: '心房細動 (Af)',
      displayLabel: '圧波形のみ + バルーン内圧',
      triggerLabel: '不規則RR'
    }
  ];

  // ======== 不整脈生成 (テスト難易度別) ========
  // 各拍がどの調律か判定 (deterministic by beatIdx)
  const beatSchedule = {
    key: '',
    starts: [0],
    cycles: []
  };

  function isAnyTestActive() {
    return testState.active || tuneState.active;
  }

  function isAfActive() {
    return (testState.active && testState.difficulty === 'extreme') ||
      (tuneState.active && tuneState.currentScenario && tuneState.currentScenario.rhythm === 'af');
  }

  function currentTargetInflationPct() {
    return tuneState.active && tuneState.currentScenario ? tuneState.currentScenario.targetInf : TARGET_INFLATION_PCT;
  }

  function currentTargetDeflationPct() {
    return tuneState.active && tuneState.currentScenario ? tuneState.currentScenario.targetDef : TARGET_DEFLATION_PCT;
  }

  function getBeatScheduleKey() {
    return `${state.mode}|${state.hr}|${state.internalRate}|${testState.active}:${testState.difficulty}|${tuneState.active}:${tuneState.currentScenario ? tuneState.currentScenario.id : ''}`;
  }

  function resetBeatScheduleIfNeeded() {
    const key = getBeatScheduleKey();
    if (beatSchedule.key === key) return;
    beatSchedule.key = key;
    beatSchedule.starts = [0];
    beatSchedule.cycles = [];
  }

  function afCycleMsForBeat(beatIdx) {
    const mean = 60000 / state.hr;
    const h1 = Math.sin((beatIdx + 1) * 12.9898) * 43758.5453;
    const h2 = Math.sin((beatIdx + 3) * 78.233) * 24634.6345;
    const r1 = h1 - Math.floor(h1);
    const r2 = h2 - Math.floor(h2);
    const jitter = (r1 - 0.5) * 0.55 + (r2 - 0.5) * 0.25;
    const longShort = beatIdx % 7 === 3 ? 0.28 : (beatIdx % 5 === 1 ? -0.18 : 0);
    return clamp(mean * (1 + jitter + longShort), 430, 1200);
  }

  function getCycleMsForBeat(beatIdx) {
    if (isAfActive() && state.mode !== 'internal' && state.mode !== 'pacing') {
      return afCycleMsForBeat(beatIdx);
    }
    return getCycleMs();
  }

  function ensureBeatCached(beatIdx) {
    resetBeatScheduleIfNeeded();
    while (beatSchedule.starts.length <= beatIdx) {
      const idx = beatSchedule.cycles.length;
      const cycle = getCycleMsForBeat(idx);
      beatSchedule.cycles.push(cycle);
      beatSchedule.starts.push(beatSchedule.starts[beatSchedule.starts.length - 1] + cycle);
    }
  }

  function getBeatStartTime(beatIdx) {
    if (beatIdx < 0) return 0;
    if (!isAfActive() || state.mode === 'internal' || state.mode === 'pacing') {
      return beatIdx * getCycleMs();
    }
    ensureBeatCached(beatIdx);
    return beatSchedule.starts[beatIdx];
  }

  function getBeatIndexAt(t) {
    if (t < 0) return -1;
    if (!isAfActive() || state.mode === 'internal' || state.mode === 'pacing') {
      return Math.floor(t / getCycleMs());
    }
    resetBeatScheduleIfNeeded();
    while (beatSchedule.starts[beatSchedule.starts.length - 1] <= t) {
      ensureBeatCached(beatSchedule.starts.length);
    }
    let lo = 0;
    let hi = beatSchedule.starts.length - 1;
    while (lo < hi) {
      const mid = Math.floor((lo + hi + 1) / 2);
      if (beatSchedule.starts[mid] <= t) lo = mid;
      else hi = mid - 1;
    }
    return lo;
  }

  function getBeatRhythmType(beatIdx) {
    if (tuneState.active && tuneState.currentScenario) {
      if (tuneState.currentScenario.rhythm === 'af') {
        const hash = Math.abs((beatIdx * 6311 + 41) % 100);
        return hash < 12 ? 'pvc' : 'af';
      }
      return 'sinus';
    }
    if (!testState.active || testState.difficulty === 'easy') return 'sinus';
    if (testState.difficulty === 'medium') {
      // 25% 散発 PVC (random distribution)
      const hash = Math.abs((beatIdx * 7919 + 31) % 100);
      return hash < 25 ? 'pvc' : 'sinus';
    }
    if (testState.difficulty === 'hard') {
      // Trigeminy + ランダム上乗せ (50%以上 PVC)
      if (beatIdx % 3 === 2) return 'pvc';
      const hash = Math.abs((beatIdx * 9377 + 17) % 100);
      return hash < 25 ? 'pvc' : 'sinus';
    }
    if (testState.difficulty === 'extreme') {
      // AF: P 波なし + 80% は AF QRS, 20% は PVC
      const hash = Math.abs((beatIdx * 6311 + 41) % 100);
      return hash < 20 ? 'pvc' : 'af';
    }
    return 'sinus';
  }

  const TEST_SCENARIOS = [
    { type: 'perfect',   infRange: [0.33, 0.37], defRange: [0.96, 1.00] },
    { type: 'early-inf', infRange: [0.15, 0.27], defRange: [0.96, 1.00] },
    { type: 'late-inf',  infRange: [0.42, 0.55], defRange: [0.96, 1.00] },
    { type: 'early-def', infRange: [0.33, 0.37], defRange: [0.68, 0.84] },
    { type: 'late-def',  infRange: [0.33, 0.37], defRange: [1.04, 1.12] }
  ];

  const TEST_LABELS = {
    'perfect':   '正常タイミング',
    'early-inf': '早期拡張 (Early Inflation)',
    'late-inf':  '遅延拡張 (Late Inflation)',
    'early-def': '早期収縮 (Early Deflation)',
    'late-def':  '遅延収縮 (Late Deflation)'
  };

  const DIFFICULTY_LABELS = {
    easy:    { hint: '易 (洞調律)', blind: '易' },
    medium:  { hint: '中 (散発PVC)', blind: '中' },
    hard:    { hint: '難 (PVCゴリゴリ)', blind: '難' },
    extreme: { hint: '鬼 (Af)', blind: '鬼' }
  };

  const TEST_EXPLANATIONS = {
    'perfect':   'ディクロティックノッチで拡張、R波近傍〜次収縮期立ち上がり直前で収縮。鋭いV字と augmented diastolic peak ≧ 非補助収縮期圧、BAEDP 低下、補助 SBP 低下のすべてが成立。',
    'early-inf': 'ノッチ前 (大動脈弁閉鎖前) で拡張。AVが開いている間にバルーンが拡張するため、LV駆出が阻害され後負荷増加。V字消失、補助拍の収縮期圧上昇。心仕事量増大で危険。',
    'late-inf':  'ノッチ通過後に拡張開始。自然な dicrotic wave が見えてから augmentation が始まる。拡張期 augmentation が短くなり、冠灌流改善が不十分。ノッチが分離して観察される。',
    'early-def': '次の収縮期より十分前に収縮。BAEDP に達した後 AP が再上昇し、後負荷軽減効果が消失。次の収縮期圧低下も見られない。U字型の波形が特徴。',
    'late-def':  '次の収縮期にバルーンがまだ inflated。LV が balloon に対抗、補助収縮期圧が上昇 (鈍化した急峻立ち上がり)。後負荷増加で心仕事量増大、有害。'
  };

  function pickTestScenario() {
    const s = TEST_SCENARIOS[Math.floor(Math.random() * TEST_SCENARIOS.length)];
    const inf = s.infRange[0] + Math.random() * (s.infRange[1] - s.infRange[0]);
    const def = s.defRange[0] + Math.random() * (s.defRange[1] - s.defRange[0]);
    return { type: s.type, inflationPct: inf, deflationPct: def };
  }

  function gradeLabel(score) {
    if (score >= 90) return 'A: 優秀';
    if (score >= 75) return 'B: 良好';
    if (score >= 60) return 'C: 復習推奨';
    return 'D: 要復習';
  }

  function finalSummaryHtml(score, correct, total) {
    const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
    return `
      <div class="final-summary">
        <div class="result">最終結果: ${score} / 100 点 (${gradeLabel(score)})</div>
        <div class="actual">正答・合格: ${correct} / ${total} 問 (${pct}%)</div>
      </div>
    `;
  }

  function nextTestQuestion() {
    if (testState.total >= TEST_QUESTION_LIMIT) {
      showTestFinalResult();
      return;
    }
    const sc = pickTestScenario();
    state.inflationPct = sc.inflationPct;
    state.deflationPct = sc.deflationPct;
    testState.currentType = sc.type;
    testState.answered = false;

    // フィードバックと回答ボタン状態をリセット
    const fb = document.getElementById('test-feedback');
    fb.style.display = 'none';
    fb.innerHTML = '';
    document.querySelectorAll('.test-answer-btn').forEach(b => {
      b.disabled = false;
      b.classList.remove('chose-correct', 'chose-wrong', 'actual-answer');
    });
    document.getElementById('test-next-btn').style.display = 'none';
    updateControlsUI();
  }

  function submitTestAnswer(answer) {
    if (testState.answered) return;
    testState.answered = true;
    testState.total++;
    const isCorrect = answer === testState.currentType;
    if (isCorrect) {
      testState.correct++;
      testState.score += 10;
    }

    // ボタン色付け
    document.querySelectorAll('.test-answer-btn').forEach(b => {
      b.disabled = true;
      if (b.dataset.answer === answer) {
        b.classList.add(isCorrect ? 'chose-correct' : 'chose-wrong');
      }
      if (b.dataset.answer === testState.currentType && !isCorrect) {
        b.classList.add('actual-answer');
      }
    });

    // フィードバック表示
    const fb = document.getElementById('test-feedback');
    fb.style.display = '';
    fb.className = 'test-feedback ' + (isCorrect ? 'correct' : 'wrong');
    fb.innerHTML = `
      <div class="result">${isCorrect ? '◯ 正解!' : '× 不正解'}</div>
      <div class="actual">正答: <strong>${TEST_LABELS[testState.currentType]}</strong></div>
      <div class="explanation">${TEST_EXPLANATIONS[testState.currentType]}</div>
    `;

    if (testState.total >= TEST_QUESTION_LIMIT) {
      fb.classList.add('final');
      fb.innerHTML += finalSummaryHtml(testState.score, testState.correct, testState.total);
      document.getElementById('test-next-btn').style.display = 'none';
    } else {
      document.getElementById('test-next-btn').style.display = '';
    }

    updateTestStatsUI();
  }

  function updateTestStatsUI() {
    document.getElementById('test-correct').textContent = testState.correct;
    document.getElementById('test-total').textContent = testState.total;
    document.getElementById('test-score').textContent = testState.score;
    const pctEl = document.getElementById('test-pct');
    if (testState.total > 0) {
      const pct = Math.round((testState.correct / testState.total) * 100);
      pctEl.textContent = `(${pct}%)`;
    } else {
      pctEl.textContent = '';
    }
  }

  function enterTestMode() {
    testState.active = true;
    testState.correct = 0;
    testState.total = 0;
    testState.score = 0;
    // 表示オプション保存 → ヒントとなる表示はオフ
    testState.savedShowLandmarks = state.showLandmarks;
    testState.savedShowReference = state.showReference;
    testState.savedMode = state.mode;
    testState.savedRatio = state.ratio;
    state.mode = 'ecg';
    state.ratio = 2;
    state.showLandmarks = false;
    state.showReference = false;

    document.getElementById('eval-card').style.display = 'none';
    document.getElementById('test-card').style.display = '';
    // タイミング調整カード全体を非表示 (スライダー値が答えを示すため)
    document.getElementById('timing-card').style.display = 'none';

    document.getElementById('show-landmarks').disabled = true;
    document.getElementById('show-reference').disabled = true;

    // 開始ボタン文言変更
    const btn = document.getElementById('test-start-btn');
    btn.querySelector('.icon').textContent = '📚';
    btn.querySelector('.text').textContent = 'テスト中';
    btn.classList.add('paused');
    document.getElementById('tune-start-btn').disabled = true;

    updateTestStatsUI();
    updateDifficultyUI();
    updateInfoText();
    nextTestQuestion();
    revealTestCard();
  }

  function exitTestMode() {
    testState.active = false;
    state.mode = testState.savedMode;
    state.ratio = testState.savedRatio;
    state.showLandmarks = testState.savedShowLandmarks;
    state.showReference = testState.savedShowReference;
    document.getElementById('show-landmarks').checked = state.showLandmarks;
    document.getElementById('show-reference').checked = state.showReference;

    document.getElementById('eval-card').style.display = '';
    document.getElementById('test-card').style.display = 'none';
    document.getElementById('timing-card').style.display = '';

    document.getElementById('show-landmarks').disabled = false;
    document.getElementById('show-reference').disabled = false;

    const btn = document.getElementById('test-start-btn');
    btn.querySelector('.icon').textContent = '📚';
    btn.querySelector('.text').textContent = 'テストモード開始';
    btn.classList.remove('paused');
    document.getElementById('tune-start-btn').disabled = false;

    updateControlsUI();
    updateInfoText();
    updateStickyOffsets();
  }

  function resetTestScore() {
    testState.correct = 0;
    testState.total = 0;
    testState.score = 0;
    updateTestStatsUI();
    nextTestQuestion();
  }

  function showTestFinalResult() {
    testState.answered = true;
    document.querySelectorAll('.test-answer-btn').forEach(b => {
      b.disabled = true;
      b.classList.remove('chose-correct', 'chose-wrong', 'actual-answer');
    });
    const fb = document.getElementById('test-feedback');
    fb.style.display = '';
    fb.className = 'test-feedback final';
    fb.innerHTML = finalSummaryHtml(testState.score, testState.correct, testState.total);
    document.getElementById('test-next-btn').style.display = 'none';
  }

  function pickTuneScenario() {
    return TUNE_SCENARIOS[Math.floor(Math.random() * TUNE_SCENARIOS.length)];
  }

  function randomAwayFrom(target, min, max, gap) {
    let val = target;
    for (let i = 0; i < 20 && Math.abs(val - target) < gap; i++) {
      val = min + Math.random() * (max - min);
    }
    return clamp(val, min, max);
  }

  function setTuneControlsDisabled(disabled) {
    document.querySelectorAll('.mode-btn, .ratio-btn, .internal-rhythm-btn').forEach(btn => {
      btn.disabled = disabled;
    });
    document.getElementById('test-start-btn').disabled = disabled;
  }

  function enterTuneMode() {
    tuneState.active = true;
    tuneState.correct = 0;
    tuneState.total = 0;
    tuneState.score = 0;
    tuneState.savedShowLandmarks = state.showLandmarks;
    tuneState.savedShowReference = state.showReference;
    tuneState.savedMode = state.mode;
    tuneState.savedRatio = state.ratio;
    tuneState.savedWaveDisplay = state.waveDisplay;
    tuneState.savedHr = state.hr;
    state.showLandmarks = false;
    state.showReference = false;
    state.ratio = 2;

    document.body.classList.add('tune-test-active');
    document.getElementById('eval-card').style.display = 'none';
    document.getElementById('test-card').style.display = 'none';
    document.getElementById('tune-card').style.display = '';
    document.getElementById('timing-card').style.display = '';
    document.getElementById('show-landmarks').disabled = true;
    document.getElementById('show-reference').disabled = true;
    setTuneControlsDisabled(true);

    const btn = document.getElementById('tune-start-btn');
    btn.querySelector('.text').textContent = '調整テスト中';
    btn.classList.add('paused');

    updateTuneStatsUI();
    nextTuneQuestion();
    revealTuneCard();
  }

  function exitTuneMode() {
    tuneState.active = false;
    state.mode = tuneState.savedMode;
    state.ratio = tuneState.savedRatio;
    state.waveDisplay = tuneState.savedWaveDisplay;
    state.hr = tuneState.savedHr;
    state.showLandmarks = tuneState.savedShowLandmarks;
    state.showReference = tuneState.savedShowReference;
    document.getElementById('show-landmarks').checked = state.showLandmarks;
    document.getElementById('show-reference').checked = state.showReference;

    document.body.classList.remove('tune-test-active');
    document.getElementById('eval-card').style.display = '';
    document.getElementById('tune-card').style.display = 'none';
    document.getElementById('timing-card').style.display = '';
    document.getElementById('show-landmarks').disabled = false;
    document.getElementById('show-reference').disabled = false;
    setTuneControlsDisabled(false);

    const btn = document.getElementById('tune-start-btn');
    btn.querySelector('.text').textContent = '調整テスト開始';
    btn.classList.remove('paused');

    updateControlsUI();
    updateInfoText();
    updateStickyOffsets();
  }

  function nextTuneQuestion() {
    if (tuneState.total >= TEST_QUESTION_LIMIT) {
      showTuneFinalResult();
      return;
    }
    const scenario = pickTuneScenario();
    tuneState.currentScenario = scenario;
    tuneState.answered = false;
    state.mode = scenario.triggerMode;
    state.hr = scenario.hr;
    state.ratio = 2;
    state.waveDisplay = scenario.display;
    state.inflationPct = randomAwayFrom(scenario.targetInf, 0.15, 0.58, 0.08);
    state.deflationPct = randomAwayFrom(scenario.targetDef, 0.68, 1.12, 0.07);

    const fb = document.getElementById('tune-feedback');
    fb.style.display = 'none';
    fb.className = 'test-feedback';
    fb.innerHTML = '';
    document.getElementById('tune-evaluate-btn').disabled = false;
    document.getElementById('tune-next-btn').style.display = 'none';
    const rwave = document.getElementById('tune-rwave-trigger');
    rwave.checked = false;
    rwave.disabled = false;

    updateTuneQuestionUI();
    updateControlsUI();
    updateInfoText();
    updateStickyOffsets();
  }

  function updateTuneStatsUI() {
    document.getElementById('tune-correct').textContent = tuneState.correct;
    document.getElementById('tune-total').textContent = tuneState.total;
    document.getElementById('tune-score').textContent = tuneState.score;
    const pctEl = document.getElementById('tune-pct');
    if (tuneState.total > 0) {
      pctEl.textContent = `(${Math.round(tuneState.score)}%)`;
    } else {
      pctEl.textContent = '';
    }
  }

  function updateTuneQuestionUI() {
    const s = tuneState.currentScenario;
    if (!s) return;
    const showHints = state.testHints;
    document.getElementById('tune-rhythm').textContent = showHints ? s.rhythmLabel : '調律: 非表示';
    document.getElementById('tune-display').textContent = s.displayLabel;
    document.getElementById('tune-trigger').textContent = showHints ? s.triggerLabel : 'トリガー: 非表示';
    const triggerChoice = document.querySelector('.trigger-choice');
    triggerChoice.classList.toggle('recommended', showHints && s.rhythm === 'af');
    const question = !showHints
      ? '波形を観察して Inf / Def を合わせ、必要ならR波トリガー収縮を選んで評価してください。'
      : s.rhythm === 'af'
      ? '不規則RRの波形です。Inf / Def を合わせ、必要ならR波トリガー収縮を選んで評価してください。'
      : '左のスライダーだけで Inf / Def を合わせ、評価してください。R波トリガー選択はAf問題のみ加点対象です。';
    document.getElementById('tune-question').textContent = question;
  }

  function evaluateTuneTiming() {
    if (!tuneState.active || tuneState.answered || !tuneState.currentScenario) return;
    const s = tuneState.currentScenario;
    tuneState.answered = true;
    tuneState.total++;

    const infErr = state.inflationPct - s.targetInf;
    const defErr = state.deflationPct - s.targetDef;
    const infAbs = Math.abs(infErr);
    const defAbs = Math.abs(defErr);
    const infOk = infAbs <= 0.04;
    const defOk = defAbs <= (s.rhythm === 'af' ? 0.04 : 0.05);
    const rwaveSelected = document.getElementById('tune-rwave-trigger').checked;
    const invalidTrigger = s.rhythm !== 'af' && rwaveSelected;
    const rwaveBonus = s.rhythm === 'af' && rwaveSelected ? 2 : 0;
    const timingScore = s.rhythm === 'af'
      ? (infOk ? 4 : 0) + (defOk ? 4 : 0)
      : (infOk ? 5 : 0) + (defOk ? 5 : 0);
    const questionScore = invalidTrigger ? 0 : timingScore + rwaveBonus;
    const passed = !invalidTrigger && infOk && defOk;
    if (passed) tuneState.correct++;
    tuneState.score += questionScore;

    const infText = infOk ? '適正' : (infErr < 0 ? '早すぎ' : '遅すぎ');
    const defText = defOk ? '適正' : (defErr < 0 ? '早すぎ' : '遅すぎ');
    const targetDefText = s.rhythm === 'af'
      ? '次のR波検知付近 (R波トリガー)'
      : 'R波近傍〜次収縮期立ち上がり直前';
    const afNote = s.rhythm === 'af'
      ? `<p><strong>Afの要点:</strong> RR間隔が毎拍変動するため、固定時間での Deflation は次収縮直前から外れやすい。R波トリガー収縮を選ぶと、この問題では +${rwaveBonus} / 2 点です。</p>`
      : '';
    const triggerText = invalidTrigger
      ? 'R波トリガー選択あり (Af以外では不合格)'
      : s.rhythm === 'af'
      ? (rwaveSelected ? 'R波トリガー選択あり (+2点)' : 'R波トリガー未選択 (+0点)')
      : 'R波トリガー未選択';
    const resultText = invalidTrigger ? '不合格' : (passed ? '合格' : '再調整が必要');
    const invalidTriggerNote = invalidTrigger
      ? '<p><strong>判定:</strong> R波トリガー収縮はAf問題で選択する項目です。Af以外で選択したため、この設問は不合格です。</p>'
      : '';

    const fb = document.getElementById('tune-feedback');
    fb.style.display = '';
    fb.className = 'test-feedback ' + (passed ? 'correct' : 'wrong');
    fb.innerHTML = `
      <div class="result">${resultText}: ${questionScore} / 10 点</div>
      <div class="actual">Inflation: <strong>${infText}</strong> / Deflation: <strong>${defText}</strong></div>
      <div class="explanation">
        <p>目標は Inflation がディクロティックノッチ/T波終末付近、Deflation が ${targetDefText} です。</p>
        <p>${triggerText}</p>
        ${invalidTriggerNote}
        ${afNote}
        <p>今回の設定: Inf ${Math.round(state.inflationPct * 100)}%, Def ${Math.round(state.deflationPct * 100)}%。目標目安: Inf ${Math.round(s.targetInf * 100)}%, Def ${Math.round(s.targetDef * 100)}%。</p>
      </div>
    `;

    document.getElementById('tune-evaluate-btn').disabled = true;
    document.getElementById('tune-rwave-trigger').disabled = true;
    if (tuneState.total >= TEST_QUESTION_LIMIT) {
      fb.classList.add('final');
      fb.innerHTML += finalSummaryHtml(tuneState.score, tuneState.correct, tuneState.total);
      document.getElementById('tune-next-btn').style.display = 'none';
    } else {
      document.getElementById('tune-next-btn').style.display = '';
    }
    updateTuneStatsUI();
  }

  function showTuneFinalResult() {
    tuneState.answered = true;
    document.getElementById('tune-evaluate-btn').disabled = true;
    document.getElementById('tune-rwave-trigger').disabled = true;
    const fb = document.getElementById('tune-feedback');
    fb.style.display = '';
    fb.className = 'test-feedback final';
    fb.innerHTML = finalSummaryHtml(tuneState.score, tuneState.correct, tuneState.total);
    document.getElementById('tune-next-btn').style.display = 'none';
  }

  // ======== Audio (Web Audio API) ========
  let audioCtx = null;
  let soundEnabled = true;
  let beepPitch = 3200; // Hz
  let lastBeepBeatIdx = -1;

  function ensureAudioContext() {
    if (audioCtx) return audioCtx;
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.warn('Web Audio API 非対応:', e);
    }
    return audioCtx;
  }

  function playBeep(opts) {
    if (!soundEnabled) return;
    const ctx = ensureAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    const o = opts || {};
    const vol = o.volume != null ? o.volume : 0.20;
    const dur = o.duration != null ? o.duration : 0.08;
    const pitch = o.pitch != null ? o.pitch : beepPitch;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = pitch;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(vol, now + 0.003);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + dur + 0.02);
  }

  function checkBeeps() {
    if (!state.isPlaying) return;

    if (state.mode === 'internal') {
      lastBeepBeatIdx = -1;
      return;
    }

    // 通常モード: R波ピーク直後の短い時間窓だけで鳴らす。
    // フレーム落ちでR波から大きく遅れた場合は、拍の途中で鳴らさない。
    const info = getBeatInfo(simTime);
    const beatIdx = info.beatIdx;
    const rWindowMs = 45;
    if (beatIdx !== lastBeepBeatIdx && beatIdx > 0 && info.localT >= 0 && info.localT <= rWindowMs) {
      playBeep();
      lastBeepBeatIdx = beatIdx;
    }
  }

  // ======== Utility ========
  const gauss = (x, mu, sigma) => Math.exp(-0.5 * Math.pow((x - mu) / sigma, 2));
  const smoothstep = (x) => {
    x = Math.max(0, Math.min(1, x));
    return x * x * (3 - 2 * x);
  };
  const clamp = (x, mn, mx) => Math.max(mn, Math.min(mx, x));

  // ======== Cycle / Beat 計算 ========
  function getCycleMs() {
    if (state.mode === 'internal') return 60000 / state.internalRate;
    return 60000 / state.hr;
  }
  function getInflationMs(cycleMs) {
    return state.inflationPct * (cycleMs || getCycleMs());
  }
  function getDeflationMs(cycleMs) {
    return state.deflationPct * (cycleMs || getCycleMs());
  }

  function getBeatInfo(t) {
    if (t < 0) {
      const cycleMs = getCycleMs();
      return { beatIdx: -1, rTime: 0, localT: 0, isAssisted: false, prevAssisted: false, cycleMs };
    }
    const beatIdx = getBeatIndexAt(t);
    const rTime = getBeatStartTime(beatIdx);
    const cycleMs = getCycleMsForBeat(beatIdx);
    const localT = t - rTime;
    const isAssisted = ((beatIdx + 1) % state.ratio === 0);
    const prevAssisted = beatIdx > 0 && (beatIdx % state.ratio === 0);
    return { beatIdx, rTime, localT, isAssisted, prevAssisted, cycleMs };
  }

  // ======== 補助直後拍 (prevAssisted) のパラメータ ========
  function getPostAssistedParams() {
    const defErr = state.deflationPct - currentTargetDeflationPct();
    let sbp = 115;
    let startEDP = 62;
    if (defErr > 0.03) {
      const lateness = defErr - 0.03;
      sbp += Math.min(15, lateness * 200);   // 0.075 lateness → +15
      startEDP += Math.min(15, lateness * 150);
    } else if (defErr < -0.03) {
      const earliness = -defErr - 0.03;
      sbp += Math.min(5, earliness * 60);    // 早期は SBP 上昇 5 mmHg まで
      startEDP += Math.min(15, earliness * 150);
    }
    return { sbp, startEDP };
  }

  // ======== ECG (mode に応じた波形を生成) ========
  function ecgAtAbsT(t) {
    if (t < 0) return 0;
    if (state.mode === 'internal') {
      return state.internalRhythm === 'vf' ? vfWaveform(t) : asystoleWaveform(t);
    }
    if (state.mode === 'pacing') return pacedEcgAtAbsT(t);
    return sinusEcgAtAbsT(t);
  }

  // 通常 (洞調律): P-Q-R-S-T。テスト難易度が medium 以上なら一部の拍を PVC/AF に置換
  function sinusEcgAtAbsT(t) {
    let val = 0;
    const window = 600;
    const startBeat = Math.max(0, getBeatIndexAt(t - window) - 2);
    const endBeat = getBeatIndexAt(t + window) + 2;
    for (let b = startBeat; b <= endBeat; b++) {
      if (b < 0) continue;
      const rt = getBeatStartTime(b);
      const cycleMs = getCycleMsForBeat(b);
      const tCenter = 0.25 * cycleMs;
      const tSigma  = clamp(0.05 * cycleMs, 28, 55);
      const pOff = -0.16 * cycleMs;
      const pSigma = clamp(0.02 * cycleMs, 12, 22);
      const dt = t - rt;
      if (Math.abs(dt) > window) continue;
      const type = getBeatRhythmType(b);
      if (type === 'pvc') {
        // PVC: P 波なし、wide bizarre QRS、discordant T
        val += -0.08 * gauss(dt, -10, 7);
        val += 1.20 * gauss(dt, 20, 26);     // wide R (低めで広い)
        val += -0.65 * gauss(dt, 95, 35);    // deep wide S
        val += -0.28 * gauss(dt, 0.30 * cycleMs, 0.07 * cycleMs);  // 逆向き T
      } else if (type === 'af') {
        // AF: P 波なし。QRS は正常モルフォロジー
        val += -0.10 * gauss(dt, -28, 8);
        val += 1.40 * gauss(dt, 0, 9);
        val += -0.30 * gauss(dt, 30, 13);
        val += 0.40 * gauss(dt, tCenter, tSigma);
      } else {
        // Normal sinus rhythm
        val += 0.12 * gauss(dt, pOff, pSigma);
        val += -0.10 * gauss(dt, -28, 8);
        val += 1.40 * gauss(dt, 0, 9);
        val += -0.30 * gauss(dt, 30, 13);
        val += 0.40 * gauss(dt, tCenter, tSigma);
      }
    }
    // AF の場合は基線に fibrillation 波を重畳
    if (isAfActive()) {
      val += 0.05 * Math.sin(t * 0.038 + 0.7);
      val += 0.04 * Math.sin(t * 0.057 + 1.5);
      val += 0.03 * Math.sin(t * 0.084 + 2.3);
    }
    return val;
  }

  // V-pacing: 鋭いペーシングスパイク + wide QRS (LBBB様) + T波
  // スパイクは R より 12 ms 前。IABP はこのスパイクをトリガーする。
  function pacedEcgAtAbsT(t) {
    const cycleMs = getCycleMs();
    const tCenter = 0.27 * cycleMs;
    const tSigma  = clamp(0.06 * cycleMs, 30, 65);

    let val = 0;
    const window = 600;
    const startBeat = Math.floor((t - window) / cycleMs);
    const endBeat = Math.ceil((t + window) / cycleMs);
    for (let b = startBeat; b <= endBeat; b++) {
      if (b < 0) continue;
      const rt = b * cycleMs;
      const dt = t - rt;
      if (Math.abs(dt) > window) continue;
      // ペーシングスパイク (very narrow, sharp)
      val += 1.7 * gauss(dt, -12, 1.4);
      // 小さな Q (paced QRS の冒頭)
      val += -0.12 * gauss(dt, -2, 7);
      // 幅広 R (LBBB様、ピーク 振幅低め)
      val += 1.00 * gauss(dt, 18, 20);
      // 深く幅広 S (LBBB様)
      val += -0.55 * gauss(dt, 70, 30);
      // T 波 (discordant にならない単純化)
      val += 0.40 * gauss(dt, tCenter, tSigma);
    }
    return val;
  }

  // VF: 不規則・カオス的な波形 (Gaussian だが複数周波数の和)
  function vfWaveform(t) {
    let v = 0;
    v += 0.40 * Math.sin(t * 0.0238 + 0.5);    // ~3.8 Hz
    v += 0.30 * Math.sin(t * 0.0367 + 1.2);    // ~5.8 Hz
    v += 0.22 * Math.sin(t * 0.0513 + 2.1);    // ~8.2 Hz
    v += 0.18 * Math.sin(t * 0.0719 + 0.9);    // ~11.4 Hz
    v += 0.15 * Math.sin(t * 0.0091 + 1.7);    // ~1.4 Hz (modulation)
    v += 0.08 * Math.sin(t * 0.0427 + 0.3);
    return v;
  }

  // 心静止: ほぼ flat (微小なベースラインドリフトのみ)
  function asystoleWaveform(t) {
    return 0.015 * Math.sin(t * 0.005);
  }

  // ======== 非補助 AP (1 サイクル内、cycleMs スケール) ========
  // Wiggers diagram に基づく:
  //  0-6%: 等容収縮 (EDP), 6-18%: 急速駆出で SBP, 18-33%: 緩徐駆出で 95 mmHg まで下降,
  //  33-35%: incisura (AV閉鎖、鋭い下降 95→82), 35-37%: ディクロティック波 上昇 82→90,
  //  37-40%: ディクロティック波 下降 90→86, 40-100%: 拡張期指数的下降 86→78
  function unassistedAPLocal(localT, prevAssisted, cycleMs, beatType) {
    let sbp = 120;
    let startEDP = 78;
    if (prevAssisted) {
      const p = getPostAssistedParams();
      sbp = p.sbp;
      startEDP = p.startEDP;
    }
    // AF: RR間隔に応じて拡張期充満が変わり、拍ごとの脈圧が揺れる
    if (beatType === 'af') {
      const rrNorm = cycleMs / getCycleMs();
      sbp = clamp(118 + (rrNorm - 1) * 24, 94, 134);
      startEDP = clamp(startEDP + (1 - rrNorm) * 7, 70, 84);
    }
    // PVC: ストロークボリューム低下 → SBP 低下
    if (beatType === 'pvc') {
      sbp = Math.min(sbp, 90);    // PVC の SBP は約 90 mmHg
      startEDP = Math.min(startEDP, 70);
    }
    const baseEDP = 78;

    const isoEndPct = prevAssisted ? 0.035 : 0.06;
    const peakSysPct = prevAssisted ? 0.15 : 0.18;
    const sysDeclinePct = prevAssisted ? 0.31 : 0.33;
    const isoEnd       = isoEndPct * cycleMs;       // 等容収縮期終了 = AVO
    const peakSys      = peakSysPct * cycleMs;      // 収縮期ピーク
    const sysDecline   = sysDeclinePct * cycleMs;   // 緩徐駆出末 (incisura 直前)
    const incisuraBot  = 0.35 * cycleMs;   // incisura 底 = AVC = ノッチ (Inflation 目標)
    const dicroticPeak = 0.375 * cycleMs;  // dicrotic wave 頂点
    const dicroticEnd  = 0.40 * cycleMs;   // dicrotic wave 終わり

    const preNotchAP    = 95;
    const notchBotAP    = 82;
    const dicWavePeakAP = 90;
    const dicWaveEndAP  = 86;

    if (localT < isoEnd) {
      return startEDP;
    } else if (localT < peakSys) {
      const x = (localT - isoEnd) / (peakSys - isoEnd);
      return startEDP + (sbp - startEDP) * smoothstep(x);
    } else if (localT < sysDecline) {
      const x = (localT - peakSys) / (sysDecline - peakSys);
      return sbp - (sbp - preNotchAP) * smoothstep(x);
    } else if (localT < incisuraBot) {
      // incisura: 鋭い下降 (AV 閉鎖、~20ms で 13mmHg 急降下)
      const x = (localT - sysDecline) / (incisuraBot - sysDecline);
      return preNotchAP - (preNotchAP - notchBotAP) * smoothstep(x);
    } else if (localT < dicroticPeak) {
      // dicrotic wave 上昇 (大動脈弾性反跳による reflected wave)
      const x = (localT - incisuraBot) / (dicroticPeak - incisuraBot);
      return notchBotAP + (dicWavePeakAP - notchBotAP) * smoothstep(x);
    } else if (localT < dicroticEnd) {
      // dicrotic wave 下降
      const x = (localT - dicroticPeak) / (dicroticEnd - dicroticPeak);
      return dicWavePeakAP - (dicWavePeakAP - dicWaveEndAP) * smoothstep(x);
    } else {
      // 拡張期 runoff: 指数関数的下降。前半で速やかに baseEDP 近くまで落ち、
      // 後半は flat plateau (拡張期末期圧 = EDP) として明瞭に観察できる
      const x = (localT - dicroticEnd) / (cycleMs - dicroticEnd);
      const decay = 1 - Math.exp(-3.8 * x);
      return dicWaveEndAP - (dicWaveEndAP - baseEDP) * decay;
    }
  }

  // ======== 補助拍 AP ========
  // V字は incisura (notch bottom = 82mmHg) から augmentation 上昇への自然な遷移で形成される
  function augmentationCurve(localT, inflationMs, deflationMs, cycleMs, beatType) {
    const apAtInflation = unassistedAPLocal(inflationMs, false, cycleMs, beatType);
    const span = deflationMs - inflationMs;
    if (span <= 0) return apAtInflation;
    const x = (localT - inflationMs) / span;
    const peakAP = 145;

    if (x < 0.18) {
      // ヘリウム拡張による急峻な上昇 (V字の右辺)
      const lx = x / 0.18;
      return apAtInflation + (peakAP - apAtInflation) * smoothstep(lx);
    } else if (x < 0.85) {
      // 拡張期 augmentation: ピークから徐々に減少
      const lx = (x - 0.18) / 0.67;
      return peakAP - 45 * smoothstep(lx);
    } else {
      // pre-deflation
      const lx = (x - 0.85) / 0.15;
      return 100 - 5 * lx;
    }
  }

  function assistedAPLocal(localT, inflationMs, deflationMs, cycleMs, beatType) {
    if (localT < inflationMs) {
      return unassistedAPLocal(localT, false, cycleMs, beatType);
    }
    const maxDeflInBeat = Math.min(deflationMs, cycleMs);
    if (localT <= maxDeflInBeat) {
      return augmentationCurve(localT, inflationMs, deflationMs, cycleMs, beatType);
    }
    if (deflationMs <= cycleMs) {
      const apAtDef = augmentationCurve(deflationMs, inflationMs, deflationMs, cycleMs, beatType);
      const baedp = 62;
      const dropDur = 14;  // 鋭利化: BAEDP まで短時間で降下
      if (localT < deflationMs + dropDur) {
        const x = (localT - deflationMs) / dropDur;
        return apAtDef + (baedp - apAtDef) * smoothstep(x);
      }
      const recStart = deflationMs + dropDur;
      const remaining = cycleMs - recStart;
      if (remaining <= 0) return baedp;
      // 早期収縮では BAEDP 後に圧が戻って U 字化する。適正タイミングでは
      // BAEDP は短い谷にとどめ、直後の自己心拍立ち上がりへつなげる。
      if (remaining > 110) {
        const x = (localT - recStart) / remaining;
        const decay = 1 - Math.exp(-2.5 * x);
        return baedp + (78 - baedp) * decay;
      }
      const x = (localT - recStart) / remaining;
      return baedp + 3.5 * smoothstep(x);
    }
    return augmentationCurve(localT, inflationMs, deflationMs, cycleMs, beatType);
  }

  function apAtAbsT(t) {
    if (t < 0) return state.mode === 'internal' ? 60 : 78;
    const info = getBeatInfo(t);
    const cycleMs = info.cycleMs;
    const inflationMs = getInflationMs(cycleMs);
    const deflationMs = getDeflationMs(cycleMs);

    // インターナルモード: native pulse なし、バルーン駆動のみ
    if (state.mode === 'internal') {
      if (info.isAssisted) {
        return internalAPLocal(info.localT, inflationMs, deflationMs, cycleMs);
      }
      return 60; // 非補助拍: フラットなベースライン
    }

    const beatType = getBeatRhythmType(info.beatIdx);

    if (info.isAssisted) {
      return assistedAPLocal(info.localT, inflationMs, deflationMs, cycleMs, beatType);
    }

    // 直前拍が補助で deflation が cycleMs を超えていた場合、本拍の冒頭はまだ augmented
    if (info.prevAssisted && deflationMs > cycleMs) {
      const overflow = deflationMs - cycleMs;
      const effectiveLocalT = info.localT + cycleMs;
      if (info.localT < overflow + 40) {
        return assistedAPLocal(effectiveLocalT, inflationMs, deflationMs, cycleMs, beatType);
      }
    }

    return unassistedAPLocal(info.localT, info.prevAssisted, cycleMs, beatType);
  }

  // インターナルモードの AP: バルーン駆動による圧パルスのみ (心拍出なし)
  function internalAPLocal(localT, inflationMs, deflationMs, cycleMs) {
    const baseline = 60;
    const peakAP = 140;

    if (localT < inflationMs) return baseline;

    if (localT <= deflationMs) {
      const span = deflationMs - inflationMs;
      const x = (localT - inflationMs) / span;
      if (x < 0.18) {
        return baseline + (peakAP - baseline) * smoothstep(x / 0.18);
      } else if (x < 0.85) {
        const lx = (x - 0.18) / 0.67;
        return peakAP - (peakAP - 90) * smoothstep(lx);
      }
      const lx = (x - 0.85) / 0.15;
      return 90 - 10 * lx;
    }

    // deflation 後: 急峻にベースラインまで低下
    const dropDur = 25;
    if (localT < deflationMs + dropDur) {
      const xd = (localT - deflationMs) / dropDur;
      return 80 + (baseline - 80) * smoothstep(xd);
    }
    return baseline;
  }

  // ======== バルーン内圧 ========
  function balloonPressureAtAbsT(t) {
    if (t < 0) return 12;
    const baseline = 12;

    // 近傍 3 拍を確認 (遅延収縮で前拍の影響が及ぶ可能性)
    const beatIdx = getBeatIndexAt(t);
    for (let off = 0; off <= 2; off++) {
      const b = beatIdx - off;
      if (b < 0) continue;
      const cycleMs = getCycleMsForBeat(b);
      const inflationMs = getInflationMs(cycleMs);
      const deflationMs = getDeflationMs(cycleMs);
      const isAss = ((b + 1) % state.ratio === 0);
      if (!isAss) continue;
      const rT = getBeatStartTime(b);
      const tInBeat = t - rT;
      if (tInBeat >= inflationMs - 5 && tInBeat <= deflationMs + 100) {
        return computeBPLocal(tInBeat, inflationMs, deflationMs);
      }
      if (tInBeat < inflationMs) break; // この拍以前は inflate していない
    }
    return baseline;
  }

  function computeBPLocal(localT, inflationMs, deflationMs) {
    const baseline = 12;
    const plateau = 160;
    const overshoot = 25;
    const upDur = 50;
    const downDur = 50;
    const undershoot = -8;

    if (localT < inflationMs) return baseline;
    if (localT < inflationMs + upDur) {
      const x = (localT - inflationMs) / upDur;
      if (x < 0.55) {
        return baseline + (plateau + overshoot - baseline) * (x / 0.55);
      }
      return (plateau + overshoot) - overshoot * ((x - 0.55) / 0.45);
    }
    if (localT <= deflationMs) {
      const span = deflationMs - inflationMs - upDur;
      if (span <= 0) return plateau;
      const x = (localT - inflationMs - upDur) / span;
      return plateau - 8 * x;
    }
    if (localT < deflationMs + downDur) {
      const x = (localT - deflationMs) / downDur;
      const start = plateau - 8;
      if (x < 0.55) {
        return start + (undershoot - start) * (x / 0.55);
      }
      return undershoot + (baseline - undershoot) * ((x - 0.55) / 0.45);
    }
    return baseline;
  }

  // ======== 血行動態計算 ========
  function computeHemodynamics() {
    const cycleMs = getCycleMs();
    const inflationMs = getInflationMs(cycleMs);
    const deflationMs = getDeflationMs(cycleMs);

    // インターナルモード: native pulse なし。バルーン由来のみ
    if (state.mode === 'internal') {
      const baseline = 60;
      let peak = baseline;
      for (let lt = inflationMs; lt <= Math.min(deflationMs, cycleMs); lt += 4) {
        peak = Math.max(peak, internalAPLocal(lt, inflationMs, deflationMs, cycleMs));
      }
      // 仮想的に A/B/D を baseline と等価扱い (criteria に影響させない)
      return { A: baseline, B: baseline, C: peak, D: baseline, E: baseline };
    }

    // A: 非補助 SBP
    let A = 0;
    for (let lt = 0.06 * cycleMs; lt < 0.30 * cycleMs; lt += 4) {
      A = Math.max(A, unassistedAPLocal(lt, false, cycleMs));
    }
    // B: 非補助 EDP
    const B = unassistedAPLocal(cycleMs - 5, false, cycleMs);

    // C: 補助拡張ピーク
    let C = A;
    for (let lt = inflationMs; lt <= Math.min(deflationMs, cycleMs); lt += 4) {
      C = Math.max(C, assistedAPLocal(lt, inflationMs, deflationMs, cycleMs));
    }

    // E: 補助拍 EDP / BAEDP
    const E = assistedAPLocal(cycleMs - 5, inflationMs, deflationMs, cycleMs);

    // D: 補助直後 SBP (prevAssisted = true で評価)
    let D = 0;
    for (let lt = 0.06 * cycleMs; lt < 0.30 * cycleMs; lt += 4) {
      D = Math.max(D, unassistedAPLocal(lt, true, cycleMs));
    }

    return { A, B, C, D, E };
  }

  // ======== タイミング評価 ========
  function evaluateInflation() {
    const err = state.inflationPct - currentTargetInflationPct();
    const absErr = Math.abs(err);
    if (absErr <= TOL_INF_OK) {
      return { type: 'ok', title: '正常な拡張タイミング',
        detail: 'ディクロティックノッチで拡張し、鋭いV字を形成。冠動脈灌流圧が最大化される。' };
    }
    if (err < 0) {
      const severe = absErr > TOL_INF_WARN;
      return { type: severe ? 'severe' : 'warning',
        title: severe ? '重度の早期拡張 (Early Inflation)' : '軽度の早期拡張',
        detail: '大動脈弁閉鎖前にバルーンが拡張。後負荷上昇 → 心筋酸素消費増加・心拍出量減少。V字消失、補助収縮期圧が上昇する。' };
    }
    return { type: 'warning',
      title: absErr > TOL_INF_WARN ? '重度の遅延拡張 (Late Inflation)' : '軽度の遅延拡張',
      detail: 'ノッチ通過後に拡張開始。拡張期 augmentation 効果が低下し、冠動脈灌流改善が不十分。ノッチが分離して観察される。' };
  }

  function evaluateDeflation() {
    const err = state.deflationPct - currentTargetDeflationPct();
    const absErr = Math.abs(err);
    if (absErr <= TOL_DEF_OK) {
      return { type: 'ok', title: '正常な収縮タイミング',
        detail: '等容収縮期にバルーンが収縮。後負荷軽減 → 次の収縮期圧が低下し、心仕事量が減少する。' };
    }
    if (err < 0) {
      return { type: 'warning',
        title: absErr > TOL_DEF_WARN ? '重度の早期収縮 (Early Deflation)' : '軽度の早期収縮',
        detail: '次の収縮期より十分前に収縮し、AP が再上昇。後負荷軽減効果なし。逆行性血流 (冠動脈/頚動脈) のリスク。U字様の波形となる。' };
    }
    return { type: absErr > TOL_DEF_WARN ? 'severe' : 'warning',
      title: absErr > TOL_DEF_WARN ? '重度の遅延収縮 (Late Deflation)' : '軽度の遅延収縮',
      detail: '次の収縮期にバルーンが残存。後負荷増加 → 心筋酸素消費増加。補助収縮期上昇傾きが鈍化、補助 SBP が上昇する。' };
  }

  // ======== Canvas 描画 ========
  const canvas = document.getElementById('waveform-canvas');
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  const LEFT = 70;
  const RIGHT = 20;
  const TOP = 14;
  const PANEL_H = 140;
  const GAP = 22;
  const PLOT_W = W - LEFT - RIGHT;

  const panels = {
    ecg: { y: TOP,                     yMin: -0.6, yMax: 1.9, label: 'ECG',          unit: 'mV',   color: '#42e87a', gridStep: 0.5 },
    ap:  { y: TOP + (PANEL_H + GAP),   yMin: 30,   yMax: 170, label: 'AP',           unit: 'mmHg', color: '#ff5566', gridStep: 30 },
    bp:  { y: TOP + 2*(PANEL_H + GAP), yMin: -40,  yMax: 220, label: 'バルーン内圧', unit: 'mmHg', color: '#4fb0ff', gridStep: 50 }
  };

  // スイープモード: 時間軸は画面に固定、現在時刻のスイープカーソルが左→右へ走査
  const LAP_MS = DISPLAY_WINDOW_MS;
  const SWEEP_GAP_PX = 14;

  function isWaveVisible(key) {
    if ((testState.active || tuneState.active) && key === 'bp') return true;
    if (!tuneState.active) return true;
    if (state.waveDisplay === 'ecg-only') return key === 'ecg';
    if (state.waveDisplay === 'pressure-only') return key === 'ap';
    if (state.waveDisplay === 'ecg-ap') return key === 'ecg' || key === 'ap';
    return true;
  }

  // 時刻 t を canvas X に変換 (スイープモード対応)
  // 戻り値: 数値 X もしくは null (画面外/erase gap 内/対応する lap データが現在描画されていない)
  function absTtoSweepX(t) {
    if (t < 0) return null;
    const X = LEFT + ((t % LAP_MS) / LAP_MS) * PLOT_W;
    const sweepX = LEFT + ((simTime % LAP_MS) / LAP_MS) * PLOT_W;
    const xFromSweep = X - sweepX;
    if (xFromSweep >= 0 && xFromSweep < SWEEP_GAP_PX) return null;
    const tLap = Math.floor(t / LAP_MS);
    const curLap = Math.floor(simTime / LAP_MS);
    const expectedLap = (X <= sweepX) ? curLap : curLap - 1;
    if (tLap !== expectedLap) return null;
    return X;
  }

  function vToY(v, p) {
    const norm = (v - p.yMin) / (p.yMax - p.yMin);
    return p.y + PANEL_H - norm * PANEL_H;
  }

  function drawPanelFrame(p) {
    ctx.fillStyle = '#04101e';
    ctx.fillRect(LEFT, p.y, PLOT_W, PANEL_H);

    // 時間軸グリッド (画面に固定、0 から LAP_MS まで)
    ctx.strokeStyle = '#0d1d33';
    ctx.lineWidth = 1;
    for (let t = 0; t <= LAP_MS; t += 200) {
      const x = LEFT + (t / LAP_MS) * PLOT_W;
      ctx.beginPath();
      ctx.moveTo(x, p.y);
      ctx.lineTo(x, p.y + PANEL_H);
      ctx.stroke();
    }
    ctx.strokeStyle = '#15263f';
    for (let t = 0; t <= LAP_MS; t += 1000) {
      const x = LEFT + (t / LAP_MS) * PLOT_W;
      ctx.beginPath();
      ctx.moveTo(x, p.y);
      ctx.lineTo(x, p.y + PANEL_H);
      ctx.stroke();
    }

    // Y グリッド
    ctx.strokeStyle = '#15263f';
    for (let v = p.yMin; v <= p.yMax + 0.001; v += p.gridStep) {
      const y = vToY(v, p);
      ctx.beginPath();
      ctx.moveTo(LEFT, y);
      ctx.lineTo(LEFT + PLOT_W, y);
      ctx.stroke();
    }

    // 枠
    ctx.strokeStyle = '#243957';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(LEFT, p.y, PLOT_W, PANEL_H);

    // タイトル
    ctx.fillStyle = p.color;
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(p.label, LEFT + 8, p.y + 18);
    ctx.fillStyle = '#6f87a3';
    ctx.font = '10px sans-serif';
    ctx.fillText(`(${p.unit})`, LEFT + 8, p.y + 32);

    // Y 軸目盛
    ctx.fillStyle = '#6f87a3';
    ctx.font = '10px "SF Mono", Monaco, monospace';
    ctx.textAlign = 'right';
    for (let v = p.yMin; v <= p.yMax + 0.001; v += p.gridStep) {
      const y = vToY(v, p);
      const label = p.unit === 'mV' ? v.toFixed(1) : Math.round(v).toString();
      ctx.fillText(label, LEFT - 6, y + 3);
    }
  }

  function drawHiddenPanelNotice(p) {
    ctx.fillStyle = '#6f87a355';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('非表示', LEFT + PLOT_W / 2, p.y + PANEL_H / 2 + 5);
  }

  function drawWaveform(samples, p) {
    ctx.strokeStyle = p.color;
    ctx.lineWidth = 1.8;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.beginPath();
    let first = true;
    for (const [x, v] of samples) {
      const y = vToY(clamp(v, p.yMin, p.yMax), p);
      if (first) { ctx.moveTo(x, y); first = false; }
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  function drawVerticalLine(x, color, label, dashed, thick) {
    ctx.save();
    if (dashed) ctx.setLineDash([4, 3]);
    ctx.strokeStyle = color;
    ctx.lineWidth = thick ? 2 : 1;
    const yTop = TOP;
    const yBot = TOP + 3 * PANEL_H + 2 * GAP;
    ctx.beginPath();
    ctx.moveTo(x, yTop);
    ctx.lineTo(x, yBot);
    ctx.stroke();
    ctx.restore();
    if (label) {
      ctx.fillStyle = color;
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(label, x, yTop - 3);
    }
  }

  function drawSweepMarkers() {
    const curLap = Math.floor(simTime / LAP_MS);
    const visibleStart = (curLap - 1) * LAP_MS;
    const visibleEnd = (curLap + 1) * LAP_MS;
    const startBeat = Math.max(0, getBeatIndexAt(visibleStart) - 2);
    const endBeat = getBeatIndexAt(visibleEnd) + 3;

    // R 波の薄い点線はテストでは強いヒントになるため、ヒントあり時だけ表示。
    if (!isAnyTestActive() || state.testHints) {
      for (let b = startBeat; b <= endBeat; b++) {
        const X = absTtoSweepX(getBeatStartTime(b));
        if (X !== null) drawVerticalLine(X, '#ffffff20', null, true, false);
      }
    }

    // 拡張帯 (テストモード中はヒントを抑制したいので表示しない)
    if (!isAnyTestActive()) {
      for (let b = startBeat; b <= endBeat; b++) {
        const isAss = ((b + 1) % state.ratio === 0);
        if (!isAss) continue;
        const rT = getBeatStartTime(b);
        const cycleMs = getCycleMsForBeat(b);
        const inflationMs = getInflationMs(cycleMs);
        const deflationMs = getDeflationMs(cycleMs);
        const infX = absTtoSweepX(rT + inflationMs);
        const defX = absTtoSweepX(rT + deflationMs);
        if (infX !== null && defX !== null && Math.abs(defX - infX) < PLOT_W * 0.5) {
          ctx.fillStyle = '#ffae4514';
          const x1 = Math.min(infX, defX), x2 = Math.max(infX, defX);
          for (const k in panels) {
            ctx.fillRect(x1, panels[k].y, x2 - x1, PANEL_H);
          }
        }
      }
    }

    // 基準線 (理想位置) — テスト中は非表示
    if (state.showReference && !isAnyTestActive()) {
      for (let b = startBeat; b <= endBeat; b++) {
        const isAss = ((b + 1) % state.ratio === 0);
        if (!isAss) continue;
        const rT = getBeatStartTime(b);
        const cycleMs = getCycleMsForBeat(b);
        const iX = absTtoSweepX(rT + TARGET_INFLATION_PCT * cycleMs);
        const dX = absTtoSweepX(rT + TARGET_DEFLATION_PCT * cycleMs);
        if (iX !== null) drawVerticalLine(iX, '#ffae4566', null, true, false);
        if (dX !== null) drawVerticalLine(dX, '#ff7faa66', null, true, false);
      }
    }

    // 実際の Inflation / Deflation 線 (補助拍ごと、テスト中も表示=これが「問題」)
    for (let b = startBeat; b <= endBeat; b++) {
      const isAss = ((b + 1) % state.ratio === 0);
      if (!isAss) continue;
      const rT = getBeatStartTime(b);
      const cycleMs = getCycleMsForBeat(b);
      const inflationMs = getInflationMs(cycleMs);
      const deflationMs = getDeflationMs(cycleMs);
      const infX = absTtoSweepX(rT + inflationMs);
      const defX = absTtoSweepX(rT + deflationMs);
      if (infX !== null) drawVerticalLine(infX, '#ffae45', 'Inf', false, true);
      if (defX !== null) drawVerticalLine(defX, '#ff7faa', 'Def', false, true);
    }
  }

  function drawModeReferenceMarker() {
    // テストモード中はヒント抑制 (T波終末/ノッチ位置/スパイクは答えを示してしまう)
    if (isAnyTestActive()) return;
    // インターナルモード: 参照点なし
    if (state.mode === 'internal') return;

    const curLap = Math.floor(simTime / LAP_MS);
    const visibleStart = (curLap - 1) * LAP_MS;
    const visibleEnd = (curLap + 1) * LAP_MS;
    const startBeat = Math.max(0, getBeatIndexAt(visibleStart) - 2);
    const endBeat = getBeatIndexAt(visibleEnd) + 3;

    // 直近 (sweep 左側にあって visible) の補助拍を 1 つだけ強調
    for (let b = endBeat; b >= startBeat; b--) {
      const isAss = ((b + 1) % state.ratio === 0);
      if (!isAss) continue;
      const rT = getBeatStartTime(b);
      const cycleMs = getCycleMsForBeat(b);

      if (state.mode === 'ecg') {
        const tEndAbs = rT + TARGET_INFLATION_PCT * cycleMs;
        const x = absTtoSweepX(tEndAbs);
        if (x === null) continue;
        const y = vToY(ecgAtAbsT(tEndAbs), panels.ecg);
        drawRefDot(x, y, 'T波終末');
        return;
      } else if (state.mode === 'pressure') {
        const notchAbs = rT + TARGET_INFLATION_PCT * cycleMs;
        const x = absTtoSweepX(notchAbs);
        if (x === null) continue;
        const y = vToY(unassistedAPLocal(TARGET_INFLATION_PCT * cycleMs, false, cycleMs), panels.ap);
        drawRefDot(x, y, 'ノッチ底 (AVC)');
        return;
      } else if (state.mode === 'pacing') {
        const spikeAbs = rT - 12;
        const x = absTtoSweepX(spikeAbs);
        if (x === null) continue;
        const y = vToY(ecgAtAbsT(spikeAbs), panels.ecg);
        drawRefDot(x, y, 'ペーシングスパイク');
        return;
      }
    }
  }

  function drawRefDot(x, y, label) {
    ctx.fillStyle = '#ffd97a';
    ctx.beginPath();
    ctx.arc(x, y, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffd97a';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(label, x + 5, y - 4);
  }

  function drawLandmarks() {
    if (!state.showLandmarks) return;
    if (state.mode === 'internal') return;
    if (isAnyTestActive()) return;  // テスト中は A-E もヒントなので非表示

    const cycleMs = getCycleMs();
    const inflationMs = getInflationMs();
    const deflationMs = getDeflationMs();

    // 直近の "非補助 → 補助 → 補助直後" 三連を探し、現在表示されている (sweep カーソルより左) ものを採用
    const curLap = Math.floor(simTime / LAP_MS);
    const visibleStart = (curLap - 1) * LAP_MS;
    const visibleEnd = (curLap + 1) * LAP_MS;
    const endBeat = Math.ceil(visibleEnd / cycleMs);
    const startBeat = Math.max(1, Math.floor(visibleStart / cycleMs));

    let targetAssBeat = -1;
    for (let b = endBeat; b >= startBeat; b--) {
      const isAss = ((b + 1) % state.ratio === 0);
      if (!isAss) continue;
      if (b - 1 < 0) continue;
      const rTPost = (b + 1) * cycleMs;
      // 補助直後拍が完了している (= sweep がすでに通り過ぎている) ものに限る
      if (absTtoSweepX(rTPost + 0.30 * cycleMs) === null) continue;
      // 非補助前拍も visible である必要がある
      if (absTtoSweepX((b - 1) * cycleMs + 0.10 * cycleMs) === null) continue;
      targetAssBeat = b;
      break;
    }
    if (targetAssBeat < 0) return;

    const rTPrev = (targetAssBeat - 1) * cycleMs;
    const rTAss = targetAssBeat * cycleMs;
    const rTPost = (targetAssBeat + 1) * cycleMs;

    // A: 非補助 SBP
    let aT = rTPrev + 0.13 * cycleMs;
    let aV = -Infinity;
    for (let lt = 0.06 * cycleMs; lt < 0.30 * cycleMs; lt += 4) {
      const v = unassistedAPLocal(lt, false, cycleMs);
      if (v > aV) { aV = v; aT = rTPrev + lt; }
    }
    let X = absTtoSweepX(aT);
    if (X !== null) drawDot(X, vToY(aV, panels.ap), 'A');

    // B: 非補助 EDP
    const bV = unassistedAPLocal(cycleMs - 5, false, cycleMs);
    X = absTtoSweepX(rTAss - 5);
    if (X !== null) drawDot(X, vToY(bV, panels.ap), 'B', true);

    // C: 補助拡張ピーク
    let cT = rTAss + inflationMs;
    let cV = -Infinity;
    for (let lt = inflationMs; lt <= Math.min(deflationMs, cycleMs); lt += 4) {
      const v = assistedAPLocal(lt, inflationMs, deflationMs, cycleMs);
      if (v > cV) { cV = v; cT = rTAss + lt; }
    }
    X = absTtoSweepX(cT);
    if (X !== null) drawDot(X, vToY(cV, panels.ap), 'C');

    // E: BAEDP
    const eV = assistedAPLocal(cycleMs - 5, inflationMs, deflationMs, cycleMs);
    X = absTtoSweepX(rTPost - 5);
    if (X !== null) drawDot(X, vToY(eV, panels.ap), 'E', true);

    // D: 補助直後 SBP
    let dT = rTPost + 0.13 * cycleMs;
    let dV = -Infinity;
    for (let lt = 0.06 * cycleMs; lt < 0.30 * cycleMs; lt += 4) {
      const v = unassistedAPLocal(lt, true, cycleMs);
      if (v > dV) { dV = v; dT = rTPost + lt; }
    }
    X = absTtoSweepX(dT);
    if (X !== null) drawDot(X, vToY(dV, panels.ap), 'D');
  }

  function drawDot(x, y, label, below) {
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = '#ffe8a0';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(label, x, below ? y + 15 : y - 8);
  }

  function drawTimeAxis() {
    // スイープモード: 時間軸は画面固定 (0-4秒、1秒ごとに目盛)
    const y = TOP + 3 * PANEL_H + 2 * GAP + 14;
    ctx.fillStyle = '#6f87a3';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    for (let t = 0; t <= LAP_MS; t += 1000) {
      const x = LEFT + (t / LAP_MS) * PLOT_W;
      ctx.fillText((t / 1000).toFixed(0) + 's', x, y);
    }
  }

  function drawSweepCursor() {
    const sweepX = LEFT + ((simTime % LAP_MS) / LAP_MS) * PLOT_W;
    // 縦白線 (半透明)
    ctx.save();
    ctx.strokeStyle = '#ffffff55';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(sweepX, TOP);
    ctx.lineTo(sweepX, TOP + 3 * PANEL_H + 2 * GAP);
    ctx.stroke();
    ctx.restore();
    // 上端三角インジケータ
    ctx.fillStyle = '#ffffffcc';
    ctx.beginPath();
    ctx.moveTo(sweepX - 5, TOP - 3);
    ctx.lineTo(sweepX + 5, TOP - 3);
    ctx.lineTo(sweepX, TOP + 4);
    ctx.closePath();
    ctx.fill();
  }

  function render() {
    const sweepX = LEFT + ((simTime % LAP_MS) / LAP_MS) * PLOT_W;
    const curLapStart = Math.floor(simTime / LAP_MS) * LAP_MS;
    const prevLapStart = curLapStart - LAP_MS;

    ctx.clearRect(0, 0, W, H);

    // パネル枠
    for (const k in panels) {
      drawPanelFrame(panels[k]);
      if (!isWaveVisible(k)) drawHiddenPanelNotice(panels[k]);
    }

    // R 波・拡張帯マーカー (内部で test mode 抑制)
    drawSweepMarkers();

    // 波形サンプリング: sweep 左 = 現在 lap、sweep 右 = 直前 lap、間に erase gap
    const SAMPLE_DX = 2;
    const ecgNew = [], ecgOld = [];
    const apNew = [], apOld = [];
    const bpNew = [], bpOld = [];
    for (let X = LEFT; X <= LEFT + PLOT_W; X += SAMPLE_DX) {
      const xFromSweep = X - sweepX;
      if (xFromSweep >= 0 && xFromSweep < SWEEP_GAP_PX) continue;
      const xNorm = (X - LEFT) / PLOT_W;
      const isNew = X <= sweepX;
      const t = (isNew ? curLapStart : prevLapStart) + xNorm * LAP_MS;
      if (t < 0) continue;
      if (isWaveVisible('ecg')) {
        (isNew ? ecgNew : ecgOld).push([X, ecgAtAbsT(t)]);
      }
      if (isWaveVisible('ap')) {
        (isNew ? apNew : apOld).push([X, apAtAbsT(t)]);
      }
      if (isWaveVisible('bp')) {
        (isNew ? bpNew : bpOld).push([X, balloonPressureAtAbsT(t)]);
      }
    }

    if (isWaveVisible('ecg')) {
      drawWaveform(ecgNew, panels.ecg);
      drawWaveform(ecgOld, panels.ecg);
    }
    if (isWaveVisible('ap')) {
      drawWaveform(apNew, panels.ap);
      drawWaveform(apOld, panels.ap);
    }
    if (isWaveVisible('bp')) {
      drawWaveform(bpNew, panels.bp);
      drawWaveform(bpOld, panels.bp);
    }

    // sweep カーソル
    drawSweepCursor();

    // モード別参照点 (内部で test mode 抑制)
    drawModeReferenceMarker();

    // ランドマーク A-E (内部で test mode 抑制)
    drawLandmarks();

    // 時間軸
    drawTimeAxis();
  }

  // ======== UI 更新 ========
  function updateEvaluationUI() {
    const hemo = computeHemodynamics();

    if (state.mode === 'internal') {
      // インターナルモード: タイミング評価は無効、駆動状態と augmentation のみ表示
      const evalInf = document.getElementById('eval-inflation');
      const evalDef = document.getElementById('eval-deflation');
      evalInf.className = 'eval-row warning';
      evalInf.innerHTML = `<div class="status">インターナルモード稼働中 (${state.internalRate} bpm)</div>
        <div class="detail">心電図・脈圧トリガー不能時の固定レート駆動。患者心電図 (${state.internalRhythm === 'vf' ? 'VF' : '心静止'}) と同期せず、操作者が設定したレートで強制駆動。CPR との同期や、CPB 中に使用。</div>`;
      evalDef.className = 'eval-row warning';
      evalDef.innerHTML = `<div class="status">非生理的駆動</div>
        <div class="detail">心拍出のない状態でバルーン pressure pulse のみを生成。冠灌流維持を目的とした緊急サポート。可及的速やかに ECG/圧トリガーへ復帰すべき。</div>`;

      document.getElementById('hemo-a').textContent = '—';
      document.getElementById('hemo-b').textContent = '—';
      document.getElementById('hemo-c').textContent = Math.round(hemo.C);
      document.getElementById('hemo-d').textContent = '—';
      document.getElementById('hemo-e').textContent = '60';
      document.getElementById('hemo-ca').textContent = '—';
      // インターナルでは criteria 評価はスキップ
      ['crit-c-vs-a', 'crit-d-vs-a', 'crit-e-vs-b'].forEach(id => {
        const el = document.getElementById(id);
        el.className = 'criteria-row';
        el.textContent = '(インターナルモード: タイミング評価無効)';
      });
      return;
    }

    const inf = evaluateInflation();
    const def = evaluateDeflation();

    const renderRow = (el, ev) => {
      el.className = 'eval-row ' + ev.type;
      el.innerHTML = `<div class="status">${ev.title}</div><div class="detail">${ev.detail}</div>`;
    };
    renderRow(document.getElementById('eval-inflation'), inf);
    renderRow(document.getElementById('eval-deflation'), def);

    document.getElementById('hemo-a').textContent = Math.round(hemo.A);
    document.getElementById('hemo-b').textContent = Math.round(hemo.B);
    document.getElementById('hemo-c').textContent = Math.round(hemo.C);
    document.getElementById('hemo-d').textContent = Math.round(hemo.D);
    document.getElementById('hemo-e').textContent = Math.round(hemo.E);
    const diff = hemo.C - hemo.A;
    document.getElementById('hemo-ca').textContent = (diff >= 0 ? '+' : '') + Math.round(diff);

    const critCA = document.getElementById('crit-c-vs-a');
    const critDA = document.getElementById('crit-d-vs-a');
    const critEB = document.getElementById('crit-e-vs-b');
    const passCA = hemo.C >= hemo.A;
    const passDA = hemo.D <= hemo.A - 5;
    const passEB = hemo.E <= hemo.B - 15;
    critCA.className = 'criteria-row ' + (passCA ? 'pass' : 'fail');
    critDA.className = 'criteria-row ' + (passDA ? 'pass' : 'fail');
    critEB.className = 'criteria-row ' + (passEB ? 'pass' : 'fail');
    critCA.textContent = `C (${Math.round(hemo.C)}) ${passCA ? '≥' : '<'} A (${Math.round(hemo.A)}) — 拡張期ピーク ≧ 非補助収縮期圧`;
    critDA.textContent = `D (${Math.round(hemo.D)}) ${passDA ? '≤' : '>'} A−5 (${Math.round(hemo.A - 5)}) — 補助 SBP が 5mmHg 以上低下`;
    critEB.textContent = `E (${Math.round(hemo.E)}) ${passEB ? '≤' : '>'} B−15 (${Math.round(hemo.B - 15)}) — BAEDP が 15mmHg 以上低下`;
  }

  function updateControlsUI() {
    document.querySelectorAll('.mode-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.mode === state.mode);
    });
    document.querySelectorAll('.ratio-btn').forEach(b => {
      b.classList.toggle('active', parseInt(b.dataset.ratio, 10) === state.ratio);
    });
    document.querySelectorAll('.internal-rhythm-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.rhythm === state.internalRhythm);
    });

    // インターナルモード時のサブセレクタ表示
    document.getElementById('internal-options').style.display =
      state.mode === 'internal' ? '' : 'none';

    // レートスライダー: 患者 HR or 内部レート
    const hrSlider = document.getElementById('hr-slider');
    const hrLabel = document.getElementById('hr-label');
    const hrHint = document.getElementById('hr-hint');
    if (state.mode === 'internal') {
      hrSlider.min = 40;
      hrSlider.max = 120;
      hrSlider.value = state.internalRate;
      document.getElementById('hr-value').textContent = state.internalRate;
      hrLabel.textContent = '内部駆動レート';
      hrHint.innerHTML = `バルーン駆動周期: <span id="cycle-display">${Math.round(getCycleMs())}</span> ms (患者 ECG と非同期)`;
    } else {
      hrSlider.min = 40;
      hrSlider.max = 140;
      hrSlider.value = state.hr;
      document.getElementById('hr-value').textContent = state.hr;
      hrLabel.textContent = state.mode === 'pacing' ? 'ペーシングレート' : '心拍数 (HR)';
      hrHint.innerHTML = `心周期: <span id="cycle-display">${Math.round(getCycleMs())}</span> ms`;
    }

    document.getElementById('inflation-value').textContent = state.inflationPct * 100 | 0;
    document.getElementById('deflation-value').textContent = state.deflationPct * 100 | 0;
    document.getElementById('inflation-slider').value = Math.round(state.inflationPct * 100);
    document.getElementById('deflation-slider').value = Math.round(state.deflationPct * 100);

    const playBtn = document.getElementById('play-pause-btn');
    if (state.isPlaying) {
      playBtn.classList.add('playing');
      playBtn.classList.remove('paused');
      playBtn.querySelector('.icon').textContent = '❚❚';
      playBtn.querySelector('.text').textContent = '一時停止';
    } else {
      playBtn.classList.add('paused');
      playBtn.classList.remove('playing');
      playBtn.querySelector('.icon').textContent = '▶';
      playBtn.querySelector('.text').textContent = '再開';
    }

    // 音声ボタン
    const soundBtn = document.getElementById('sound-btn');
    if (soundBtn) {
      if (soundEnabled) {
        soundBtn.classList.add('sound-on');
        soundBtn.classList.remove('sound-off');
        soundBtn.querySelector('.icon').textContent = '🔊';
        let txt = '音声 ON';
        if (state.mode === 'internal') {
          txt = '音声 ON (R波なし: 無音)';
        }
        soundBtn.querySelector('.text').textContent = txt;
      } else {
        soundBtn.classList.add('sound-off');
        soundBtn.classList.remove('sound-on');
        soundBtn.querySelector('.icon').textContent = '🔇';
        soundBtn.querySelector('.text').textContent = '音声 OFF';
      }
    }

    // ピッチ表示
    const pitchSlider = document.getElementById('pitch-slider');
    const pitchValue = document.getElementById('pitch-value');
    if (pitchSlider && pitchValue) {
      pitchSlider.value = beepPitch;
      pitchValue.textContent = beepPitch;
    }

    // モード別ヒント
    const infHint = document.getElementById('inflation-hint');
    const defHint = document.getElementById('deflation-hint');
    const cycleMs = getCycleMs();
    const targetInfPct = currentTargetInflationPct();
    const targetDefPct = currentTargetDeflationPct();
    const targetInfLabel = Math.round(targetInfPct * 100);
    const targetDefLabel = Math.round(targetDefPct * 100);
    const targetInfMs = Math.round(targetInfPct * cycleMs);
    const targetDefMs = Math.round(targetDefPct * cycleMs);
    const currentInfMs = Math.round(getInflationMs());
    const currentDefMs = Math.round(getDeflationMs());
    if (state.mode === 'ecg') {
      infHint.innerHTML = `目標 ${targetInfLabel}% (R波後 ${targetInfMs} ms ≒ T波終末 / ディクロティックノッチ)`;
      defHint.innerHTML = `目標 ${targetDefLabel}% (R波後 ${targetDefMs} ms 等容収縮期、R波近傍)`;
    } else if (state.mode === 'pressure') {
      infHint.innerHTML = `目標 ${targetInfLabel}% (AP波形のノッチ位置で拡張、${targetInfMs} ms)`;
      defHint.innerHTML = `目標 ${targetDefLabel}% (次の収縮期上昇の直前で収縮、${targetDefMs} ms)`;
    } else if (state.mode === 'pacing') {
      infHint.innerHTML = `目標 ${targetInfLabel}% (ペーシングスパイク後 ${targetInfMs} ms、T波終末)`;
      defHint.innerHTML = `目標 ${targetDefLabel}% (次のスパイク直前 ${targetDefMs} ms)`;
    } else {
      // internal
      infHint.innerHTML = `バルーン拡張開始 (内部周期内 ${currentInfMs} ms)`;
      defHint.innerHTML = `バルーン収縮開始 (内部周期内 ${currentDefMs} ms)`;
    }
  }

  function updateInfoText() {
    const el = document.getElementById('info-content');
    const title = document.getElementById('info-title');
    if (state.mode === 'ecg') {
      title.textContent = '解説: ECGトリガーモード';
      el.innerHTML = `
        <p><strong>原理:</strong> IABP装置がR波を検出し、それを基準にバルーンの拡張・収縮タイミングを決定します。
        ECG波形が良好な状態で最も一般的に使用されるトリガー方法です。</p>
        <p><strong>収縮 (Deflation):</strong> R波近傍〜次収縮期立ち上がり直前 (等容収縮期、大動脈弁開放前) に行う。後負荷を軽減し、心仕事量を減らす。</p>
        <p><strong>拡張 (Inflation):</strong> T波終末 (≒大動脈弁閉鎖) に行う。AP波形上ではディクロティックノッチに一致。
        拡張期augmentationにより冠動脈灌流圧が上昇する。</p>
        <p><strong>波形確認のポイント:</strong></p>
        <ul>
          <li>AP波形でディクロティックノッチが鋭い<strong>V字</strong>に置き換わる</li>
          <li>補助拡張期ピーク C が非補助収縮期圧 A を超える</li>
          <li>BAEDP (E) が非補助 EDP (B) より 15-20 mmHg 低い</li>
          <li>補助収縮期圧 (D) が 5 mmHg 以上低下</li>
        </ul>
      `;
    } else if (state.mode === 'pressure') {
      title.textContent = '解説: 圧トリガーモード';
      el.innerHTML = `
        <p><strong>原理:</strong> ECG信号が不良な場合 (電気メス使用中、心房細動など) や、ペーシング干渉がある場合に使用。
        AP波形のディクロティックノッチを検出してバルーン拡張、上昇開始点で収縮をトリガー。</p>
        <p><strong>拡張 (Inflation):</strong> ディクロティックノッチ検出 → 即座に拡張。AP波形のノッチ位置に正確に合わせる。
        ECGトリガーより遅延が若干大きい (60-119 ms vs ECGの 40 ms 程度) ことに留意。</p>
        <p><strong>収縮 (Deflation):</strong> 次の収縮期上昇点 (大動脈弁開放) より少し前で収縮。BAEDPに達するよう設定。</p>
        <p><strong>波形確認のポイント:</strong></p>
        <ul>
          <li>AP波形のノッチ位置に拡張開始の<strong>V字</strong>が一致</li>
          <li>ECGノイズに左右されない反面、低血圧・不整脈で検出失敗するリスク</li>
          <li>バルーン内圧プラトーがAP拡張期ピークC ± 20 mmHg 範囲内</li>
        </ul>
      `;
    } else if (state.mode === 'pacing') {
      title.textContent = '解説: ペーシングトリガーモード';
      el.innerHTML = `
        <p><strong>原理:</strong> ペースメーカーが <strong>100% ペーシング依存</strong>の症例で使用。
        IABPは心室ペーシングスパイク (V-pace) を検出してトリガーを生成。R波と区別された鋭いスパイクを検出する。</p>
        <p><strong>適応:</strong> 完全房室ブロックや心室ペーシング依存例。Demand pacing (頻度に応じて作動) では使用不可
        — ペーシング途切れ時に検出失敗するため。</p>
        <p><strong>波形のポイント:</strong></p>
        <ul>
          <li>各QRSの直前に鋭い<strong>ペーシングスパイク</strong>が見える</li>
          <li>QRSは幅広く (LBBB様)、自己心拍より morphology が異なる</li>
          <li>スパイクを基準に拡張・収縮を行うため、R波検出より精度が高い場合がある</li>
          <li>注意: 両室ペーシング (CRT)、心房ペーシングではタイミング干渉に注意</li>
        </ul>
      `;
    } else {
      title.textContent = '解説: インターナルモード (固定レート駆動)';
      el.innerHTML = `
        <p><strong>原理:</strong> 患者の心電図・脈圧トリガーが取れない緊急時に、IABPが<strong>固定レート</strong>で
        強制的にバルーンを駆動するモード。デフォルト 80 bpm (範囲 40-120 bpm)。</p>
        <p><strong>適応:</strong> 心停止 (asystole)、心室細動 (VF)、無脈性心室頻拍 (pulseless VT)、
        心肺バイパス (CPB) 中など — 心拍出がなく ECG/圧トリガーが不能な状況。</p>
        <p><strong>CPRとの併用:</strong> 胸骨圧迫の<strong>0.15-0.25秒前</strong>にバルーン拡張するよう同期させると、
        平均血圧と脳・冠灌流圧が改善するとの実験報告あり。実機では手動同期や圧トリガーへの切り替えで対応する。</p>
        <p><strong>注意:</strong></p>
        <ul>
          <li>非生理的駆動: 心拍出がない状態でバルーン由来の pressure pulse のみを発生</li>
          <li>長時間使用は推奨されない。可及的速やかに自己心拍 / ペーシング復帰後に ECG/圧トリガーへ戻す</li>
          <li>VF/pulseless VT 時は ACLS に従い除細動・薬物療法を優先</li>
        </ul>
      `;
    }
  }

  // ======== Animation loop ========
  function animate(now) {
    if (lastAnimTime === null) lastAnimTime = now;
    const dt = Math.min(now - lastAnimTime, 100); // タブ切替対策
    lastAnimTime = now;

    if (state.isPlaying) {
      simTime += dt;
    }

    checkBeeps();
    render();

    // 評価 UI は 5 Hz で更新 (パフォーマンスのため)
    if (now - lastEvalTime > 200) {
      updateEvaluationUI();
      lastEvalTime = now;
    }

    requestAnimationFrame(animate);
  }

  // ======== Events ========
  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      state.mode = btn.dataset.mode;
      updateControlsUI();
      updateInfoText();
    });
  });

  document.querySelectorAll('.ratio-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      state.ratio = parseInt(btn.dataset.ratio, 10);
      updateControlsUI();
    });
  });

  document.getElementById('hr-slider').addEventListener('input', e => {
    const val = parseInt(e.target.value, 10);
    if (state.mode === 'internal') {
      state.internalRate = val;
    } else {
      state.hr = val;
    }
    updateControlsUI();
  });

  document.querySelectorAll('.internal-rhythm-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      state.internalRhythm = btn.dataset.rhythm;
      updateControlsUI();
    });
  });

  document.getElementById('inflation-slider').addEventListener('input', e => {
    state.inflationPct = parseInt(e.target.value, 10) / 100;
    updateControlsUI();
  });

  document.getElementById('deflation-slider').addEventListener('input', e => {
    state.deflationPct = parseInt(e.target.value, 10) / 100;
    updateControlsUI();
  });

  document.getElementById('play-pause-btn').addEventListener('click', () => {
    state.isPlaying = !state.isPlaying;
    updateControlsUI();
  });

  document.getElementById('sound-btn').addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    // ユーザー操作のタイミングで AudioContext を初期化 (ブラウザ要件)
    if (soundEnabled) ensureAudioContext();
    updateControlsUI();
  });

  document.getElementById('pitch-slider').addEventListener('input', e => {
    beepPitch = parseInt(e.target.value, 10);
    document.getElementById('pitch-value').textContent = beepPitch;
  });

  const PRESETS = {
    'perfect':   { inflationPct: 0.35, deflationPct: 0.98 },
    'early-inf': { inflationPct: 0.22, deflationPct: 0.98 },
    'late-inf':  { inflationPct: 0.48, deflationPct: 0.98 },
    'early-def': { inflationPct: 0.35, deflationPct: 0.80 },
    'late-def':  { inflationPct: 0.35, deflationPct: 1.06 }
  };
  document.querySelectorAll('.preset-buttons button').forEach(btn => {
    btn.addEventListener('click', () => {
      const p = PRESETS[btn.dataset.preset];
      if (!p) return;
      state.inflationPct = p.inflationPct;
      state.deflationPct = p.deflationPct;
      updateControlsUI();
    });
  });

  document.getElementById('show-landmarks').addEventListener('change', e => {
    state.showLandmarks = e.target.checked;
  });
  document.getElementById('show-reference').addEventListener('change', e => {
    state.showReference = e.target.checked;
  });

  // Test mode
  document.getElementById('test-start-btn').addEventListener('click', () => {
    if (testState.active || tuneState.active) return;
    enterTestMode();
  });

  document.getElementById('tune-start-btn').addEventListener('click', () => {
    if (tuneState.active || testState.active) return;
    enterTuneMode();
  });

  document.getElementById('test-exit-btn').addEventListener('click', exitTestMode);
  document.getElementById('test-next-btn').addEventListener('click', nextTestQuestion);
  document.getElementById('test-reset-btn').addEventListener('click', resetTestScore);
  document.getElementById('tune-evaluate-btn').addEventListener('click', evaluateTuneTiming);
  document.getElementById('tune-next-btn').addEventListener('click', nextTuneQuestion);
  document.getElementById('tune-exit-btn').addEventListener('click', exitTuneMode);

  document.querySelectorAll('.test-answer-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      submitTestAnswer(btn.dataset.answer);
    });
  });

  document.querySelectorAll('.diff-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      testState.difficulty = btn.dataset.diff;
      updateDifficultyUI();
      // 難易度変更でも問題は継続。次の問題から新パターン適用 (現在の波形は新調律で再描画)
      if (testState.active && !testState.answered) {
        // 現在回答中ならそのまま続行
      }
    });
  });

  document.querySelectorAll('.hint-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      state.testHints = btn.dataset.hints === 'on';
      updateHintUI();
    });
  });

  function updateHintUI() {
    document.querySelectorAll('.hint-btn').forEach(b => {
      b.classList.toggle('active', (b.dataset.hints === 'on') === state.testHints);
    });
    updateDifficultyUI();
    if (tuneState.active) updateTuneQuestionUI();
    render();
  }

  function updateDifficultyUI() {
    document.querySelectorAll('.diff-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.diff === testState.difficulty);
      const labels = DIFFICULTY_LABELS[b.dataset.diff];
      if (labels) b.textContent = state.testHints ? labels.hint : labels.blind;
    });
  }

  // sticky top オフセットを波形カード高さに合わせて動的に設定
  function updateStickyOffsets() {
    const waveCard = document.querySelector('.waveform-card');
    if (!waveCard) return;
    const h = waveCard.offsetHeight;
    const offsetPx = h + 24;   // 波形カード高さ + 余白
    const canStickWaveCard = window.innerWidth > 900 && window.innerHeight >= h + 260;
    const canStickSecondaryCards = canStickWaveCard && window.innerHeight >= offsetPx + 300;
    waveCard.style.position = canStickWaveCard ? 'sticky' : 'static';
    waveCard.style.top = canStickWaveCard ? '12px' : 'auto';
    [document.getElementById('test-card'), document.getElementById('tune-card'), document.getElementById('eval-card')].forEach(card => {
      if (!card) return;
      card.style.scrollMarginTop = (canStickWaveCard ? offsetPx + 12 : 12) + 'px';
      if (canStickSecondaryCards) {
        card.style.position = 'sticky';
        card.style.top = offsetPx + 'px';
      } else {
        card.style.position = 'static';
        card.style.top = 'auto';
      }
    });
  }

  function revealTestCard() {
    const testCard = document.getElementById('test-card');
    if (!testCard) return;
    updateStickyOffsets();
    window.requestAnimationFrame(() => {
      testCard.scrollIntoView({ block: 'start', behavior: 'smooth' });
    });
  }

  function revealTuneCard() {
    const tuneCard = document.getElementById('tune-card');
    if (!tuneCard) return;
    updateStickyOffsets();
    window.requestAnimationFrame(() => {
      tuneCard.scrollIntoView({ block: 'start', behavior: 'smooth' });
    });
  }
  window.addEventListener('resize', updateStickyOffsets);
  // 画像/フォントロード完了後にも一度実行 (canvas 高さが確定するため)
  window.addEventListener('load', updateStickyOffsets);

  // 初期化
  updateControlsUI();
  updateHintUI();
  updateInfoText();
  updateEvaluationUI();
  updateStickyOffsets();
  // canvas サイズ確定のため少し遅延して再計算
  setTimeout(updateStickyOffsets, 100);
  requestAnimationFrame(animate);
})();
