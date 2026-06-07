"use strict";

const STORAGE_KEY = "pacecheck-arena-v1";
const LEGACY_STORAGE_KEYS = ["pm-programmer-simulator-v1", "pm-programmer-que" + "st-v1"];

const SCENARIOS = [
  {
    id: "cavb-asvp-rwave-no-vs",
    title: "完全房室ブロック（CAVB） / AS-VP: V波高値が測定不可",
    disease: "完全房室ブロック",
    mode: "DDD",
    goal: "AS-VPでVリード波高値を確認したい。AV delayを延長しても自己R波が出ない状況を判断する。",
    teaching: "CAVBではAV delayを延長してもVSが出ないことがある。R波測定に進まず測定不可として記録し、必ず設定を戻す。",
    settings: { lowerRate: 60, sensedAv: 150, pacedAv: 180, aOutput: 2.5, vOutput: 2.5, aSense: 0.5, vSense: 2.0 },
    physiology: { sinusRate: 74, intrinsicVRate: 28, avDelayNeeded: null, pWave: 2.2, rWave: null, aThreshold: 0.8, vThreshold: 0.9, aImp: 520, vImp: 610, events: "なし" },
    route: ["safety", "interrogate", "extendSensedAv", "markDifficult", "restore"]
  },
  {
    id: "intermittent-avb-asvp-rwave",
    title: "房室ブロック（間欠性AVB） / AS-VP: R波を出して測定",
    disease: "房室ブロック",
    mode: "DDD",
    goal: "AS-VPでV波高値を確認したい。AV伝導が残っており、AV delay延長でVSが出る。",
    teaching: "AS後にAV delayを延長し、VSが出たらR波波高値を測定する。測定後は元設定へ戻す。",
    settings: { lowerRate: 60, sensedAv: 150, pacedAv: 180, aOutput: 2.5, vOutput: 2.5, aSense: 0.5, vSense: 2.0 },
    physiology: { sinusRate: 72, intrinsicVRate: 35, avDelayNeeded: 290, pWave: 2.0, rWave: 8.5, aThreshold: 0.7, vThreshold: 1.0, aImp: 480, vImp: 590, events: "なし" },
    route: ["safety", "interrogate", "extendSensedAv", "measureR", "restore"]
  },
  {
    id: "sss-apvs-pwave",
    title: "洞不全症候群 / AP-VS: P波を出して測定",
    disease: "洞不全症候群",
    mode: "DDD",
    goal: "AP-VSでA波高値を確認したい。下限レートを下げ、自己P波が出るか確認する。",
    teaching: "AP主体ではP波波高値を評価しにくい。ASが出たタイミングでP波を測る。",
    settings: { lowerRate: 70, sensedAv: 170, pacedAv: 220, aOutput: 2.5, vOutput: 2.5, aSense: 0.5, vSense: 2.0 },
    physiology: { sinusRate: 54, intrinsicVRate: 40, avDelayNeeded: 170, pWave: 1.6, rWave: 9.2, aThreshold: 0.9, vThreshold: 0.8, aImp: 530, vImp: 600, events: "心房頻拍なし" },
    route: ["safety", "interrogate", "lowerRate", "measureP", "restore"]
  },
  {
    id: "ddd-asvs-v-threshold",
    title: "間欠性房室ブロック / DDD / AS-VS: V閾値を測る",
    disease: "間欠性房室ブロック",
    mode: "DDD",
    goal: "自己伝導でAS-VS。V捕捉閾値を確認するため、Vペーシングを出すテストを行う。",
    teaching: "V閾値はVPを出して捕捉を確認する。VS波形を見ているだけでは閾値測定にならない。",
    settings: { lowerRate: 55, sensedAv: 220, pacedAv: 240, aOutput: 2.5, vOutput: 2.5, aSense: 0.5, vSense: 2.0 },
    physiology: { sinusRate: 68, intrinsicVRate: 45, avDelayNeeded: 180, pWave: 2.4, rWave: 10.0, aThreshold: 0.8, vThreshold: 0.7, aImp: 490, vImp: 560, events: "なし" },
    route: ["safety", "interrogate", "forceVpace", "thresholdV", "restore"]
  },
  {
    id: "sss-apvp-a-threshold",
    title: "洞不全症候群 + AV伝導低下 / AP-VP: A閾値を測る",
    disease: "洞不全症候群 + AV伝導低下",
    mode: "DDD",
    goal: "AP-VPでA捕捉閾値を確認する。A閾値テストで心房捕捉を評価する。",
    teaching: "APが出ている時はA閾値テストの流れを学びやすい。A捕捉の確認はEGM/マーカーも併用する。",
    settings: { lowerRate: 75, sensedAv: 160, pacedAv: 190, aOutput: 2.5, vOutput: 2.5, aSense: 0.5, vSense: 2.0 },
    physiology: { sinusRate: 42, intrinsicVRate: 30, avDelayNeeded: null, pWave: 1.4, rWave: null, aThreshold: 1.1, vThreshold: 0.9, aImp: 540, vImp: 650, events: "なし" },
    route: ["safety", "interrogate", "thresholdA", "restore"]
  },
  {
    id: "brady-af-vvi-rwave",
    title: "徐脈性心房細動 / VVI-VP: R波測定",
    disease: "徐脈性心房細動",
    mode: "VVI",
    goal: "VVIでVP主体。下限レートを下げて自己R波が出るか確認し、R波波高値を測定する。",
    teaching: "VVIではVリード評価が中心。自己R波を安全に出せるかが分岐になる。",
    settings: { lowerRate: 70, sensedAv: 0, pacedAv: 0, aOutput: 0, vOutput: 2.5, aSense: 0, vSense: 2.0 },
    physiology: { sinusRate: null, intrinsicVRate: 46, avDelayNeeded: null, pWave: null, rWave: 6.8, aThreshold: null, vThreshold: 1.0, aImp: null, vImp: 610, events: "HVRなし" },
    route: ["safety", "interrogate", "lowerRate", "measureR", "restore"]
  },
  {
    id: "tachy-brady-events",
    title: "洞不全症候群（徐脈頻脈型） / DDD: P波とイベント確認",
    disease: "洞不全症候群（徐脈頻脈型）",
    mode: "DDD",
    goal: "動悸あり。P波波高値とモードスイッチEGMを確認し、イベント検出の信頼性を見る。",
    teaching: "徐脈頻脈型は洞不全症候群の一型。心房イベントはカウンタだけでなくEGMとP波検出の信頼性を合わせて見る。",
    settings: { lowerRate: 60, sensedAv: 180, pacedAv: 220, aOutput: 2.5, vOutput: 2.5, aSense: 0.5, vSense: 2.0 },
    physiology: { sinusRate: 78, intrinsicVRate: 48, avDelayNeeded: 170, pWave: 0.9, rWave: 8.0, aThreshold: 1.0, vThreshold: 0.9, aImp: 500, vImp: 580, events: "Mode Switch 12回 / 最長18分" },
    route: ["safety", "interrogate", "measureP", "readEvents", "restore"]
  },
  {
    id: "ddd-apvp-v-threshold-dependent",
    title: "高度房室ブロック / DDD / AP-VP: V閾値を慎重に測る",
    disease: "高度房室ブロック",
    mode: "DDD",
    goal: "AP-VPで依存疑い。V捕捉閾値を安全確認後にテストする。",
    teaching: "依存疑いでは閾値測定前の安全確認が最重要。測定後は出力安全域と復帰を確認する。",
    settings: { lowerRate: 65, sensedAv: 150, pacedAv: 180, aOutput: 2.5, vOutput: 2.5, aSense: 0.5, vSense: 2.0 },
    physiology: { sinusRate: 44, intrinsicVRate: 24, avDelayNeeded: null, pWave: 1.8, rWave: null, aThreshold: 0.8, vThreshold: 1.4, aImp: 510, vImp: 640, events: "なし" },
    route: ["safety", "interrogate", "thresholdV", "restore"]
  },
  {
    id: "ddd-apvp-pwave-vthreshold",
    title: "洞不全症候群 + AVB / DDD / AP-VP: P波測定とV閾値",
    disease: "洞不全症候群 + AVB",
    mode: "DDD",
    goal: "AP-VP主体。LR下げでAS誘発しP波測定、その後V閾値テストを行う。R波は引き出せないため測定不可。",
    teaching: "AP主体ではP波が見えない。LRを下げてASを出してから測定する。V閾値はVPで測り、R波が出ない症例は測定不可とする判断を学ぶ。",
    settings: { lowerRate: 75, sensedAv: 160, pacedAv: 200, aOutput: 2.5, vOutput: 2.5, aSense: 0.5, vSense: 2.0 },
    physiology: { sinusRate: 58, intrinsicVRate: 32, avDelayNeeded: null, pWave: 2.0, rWave: null, aThreshold: null, vThreshold: 0.9, aImp: 500, vImp: 580, events: "なし" },
    route: ["safety", "interrogate", "lowerRate", "measureP", "markDifficult", "thresholdV", "restore"]
  },
  {
    id: "vvi-vs-rwave-vthreshold",
    title: "徐脈性心房細動（自己脈あり） / VVI-VS: R波測定とV閾値",
    disease: "徐脈性心房細動（自己脈あり）",
    mode: "VVI",
    goal: "自己脈中心でVS主体。R波を直接記録し、その後LR上げでVP誘発しV閾値を測定する。",
    teaching: "VVIで自己脈が出ている場合、まずR波を記録、その後V閾値テストのためVP誘発条件を作る。",
    settings: { lowerRate: 50, sensedAv: 0, pacedAv: 0, aOutput: 0, vOutput: 2.5, aSense: 0, vSense: 2.0 },
    physiology: { sinusRate: null, intrinsicVRate: 62, avDelayNeeded: null, pWave: null, rWave: 7.4, aThreshold: null, vThreshold: 1.1, aImp: null, vImp: 600, events: "なし" },
    route: ["safety", "interrogate", "measureR", "thresholdV", "restore"]
  },
  {
    id: "afib-dependent-vvi-difficult",
    title: "慢性AF + 依存 / VVI: V波高値測定不可",
    disease: "慢性AF + 高度AVB",
    mode: "VVI",
    goal: "VP完全依存で自己R波が出ない症例。V波高値は測定不可とし、V閾値は慎重に測定する。",
    teaching: "慢性AFの完全依存例では自己R波を引き出せないことがある。LR下げで確認してから測定不可とする判断を学ぶ。V閾値測定は復帰確認を厳守。",
    settings: { lowerRate: 70, sensedAv: 0, pacedAv: 0, aOutput: 0, vOutput: 2.5, aSense: 0, vSense: 2.0 },
    physiology: { sinusRate: null, intrinsicVRate: 22, avDelayNeeded: null, pWave: null, rWave: null, aThreshold: null, vThreshold: 1.3, aImp: null, vImp: 640, events: "なし" },
    route: ["safety", "interrogate", "lowerRate", "markDifficult", "thresholdV", "restore"]
  },
  {
    id: "ddd-asvs-comprehensive",
    title: "間欠性AVB（伝導良好） / DDD / AS-VS: 総合測定（P・R・A閾値・V閾値）",
    disease: "間欠性AVB（伝導良好）",
    mode: "DDD",
    goal: "AS-VSで自己脈良好。P波・R波の波高値、A閾値・V閾値の総合評価を行う。",
    teaching: "自己脈両側が出ている症例は順序立てた総合チェックを学ぶのに最適。波高値を先に測り、閾値はAP/VP誘発で実施。",
    settings: { lowerRate: 50, sensedAv: 200, pacedAv: 230, aOutput: 2.5, vOutput: 2.5, aSense: 0.5, vSense: 2.0 },
    physiology: { sinusRate: 70, intrinsicVRate: 58, avDelayNeeded: 200, pWave: 2.2, rWave: 8.8, aThreshold: 0.7, vThreshold: 0.7, aImp: 480, vImp: 560, events: "なし" },
    route: ["safety", "interrogate", "measureP", "measureR", "thresholdA", "thresholdV", "restore"]
  },
  {
    id: "ddd-lead-impedance-alert",
    title: "高度AVB + Vリード抵抗上昇 / DDD: 波高値低下とトレンド確認",
    disease: "高度AVB + Vリード抵抗上昇",
    mode: "DDD",
    goal: "Vリード抵抗が上昇傾向。波高値・閾値・抵抗・イベントを総合確認し、トレンドを判断する。",
    teaching: "リード抵抗の単回値だけでなく、波高値の低下・閾値の上昇・イベントログを合わせて評価する。",
    settings: { lowerRate: 60, sensedAv: 180, pacedAv: 220, aOutput: 2.5, vOutput: 2.5, aSense: 0.5, vSense: 2.0 },
    physiology: { sinusRate: 64, intrinsicVRate: 30, avDelayNeeded: 240, pWave: 1.8, rWave: 5.2, aThreshold: 0.8, vThreshold: 1.6, aImp: 520, vImp: 1850, events: "Lead Impedance Alert / 高抵抗イベント 4回" },
    route: ["safety", "interrogate", "measureP", "extendSensedAv", "measureR", "thresholdA", "thresholdV", "readEvents", "restore"]
  },
  {
    id: "sinus-arrest-apvs-comprehensive",
    title: "洞不全症候群（洞停止・洞房ブロック型） / AP-VS: 総合測定",
    disease: "洞不全症候群（洞停止・洞房ブロック型）",
    mode: "DDD",
    goal: "AP主体で自己P波が見えにくい。P波、R波、A閾値、V閾値を順序立てて確認する。",
    teaching: "洞停止・洞房ブロック型ではAP主体になりやすい。P波波高値はASを出してから評価し、A閾値はAP条件で確認する。",
    settings: { lowerRate: 80, sensedAv: 170, pacedAv: 220, aOutput: 2.5, vOutput: 2.5, aSense: 0.5, vSense: 2.0 },
    physiology: { sinusRate: 50, intrinsicVRate: 44, avDelayNeeded: 180, pWave: 1.2, rWave: 9.0, aThreshold: 1.0, vThreshold: 0.8, aImp: 520, vImp: 590, events: "洞停止イベント 3回 / 最長3.2秒" },
    route: ["safety", "interrogate", "lowerRate", "measureP", "measureR", "thresholdA", "thresholdV", "restore"]
  },
  {
    id: "high-grade-avb-asvp-intermittent",
    title: "高度房室ブロック（2:1・Mobitz II含む） / AS-VP: 間欠的VSを評価",
    disease: "高度房室ブロック",
    mode: "DDD",
    goal: "AS-VP主体だがAV delay延長でVSが出る。R波評価後、A/V閾値も確認する。",
    teaching: "高度AVBでは伝導が間欠的。短時間のVSだけで依存なしと判断せず、Vリード安全性と設定復帰を重視する。",
    settings: { lowerRate: 60, sensedAv: 150, pacedAv: 180, aOutput: 2.5, vOutput: 2.5, aSense: 0.5, vSense: 2.0 },
    physiology: { sinusRate: 68, intrinsicVRate: 34, avDelayNeeded: 310, pWave: 2.0, rWave: 7.2, aThreshold: 0.8, vThreshold: 1.1, aImp: 500, vImp: 620, events: "2:1 AVB様イベントあり" },
    route: ["safety", "interrogate", "measureP", "extendSensedAv", "measureR", "thresholdA", "thresholdV", "restore"]
  },
  {
    id: "post-av-node-ablation-vvi-dependent",
    title: "房室接合部アブレーション後 / VVI-VP: V波高値測定不可",
    disease: "房室接合部アブレーション後",
    mode: "VVI",
    goal: "VVIでVP依存。自己R波は確認困難として記録し、V閾値を慎重に確認する。",
    teaching: "房室接合部アブレーション後は自己心室応答が乏しいことがある。R波確認を無理に続けず、V捕捉安全性を優先する。",
    settings: { lowerRate: 75, sensedAv: 0, pacedAv: 0, aOutput: 0, vOutput: 2.5, aSense: 0, vSense: 2.0 },
    physiology: { sinusRate: null, intrinsicVRate: 18, avDelayNeeded: null, pWave: null, rWave: null, aThreshold: null, vThreshold: 0.8, aImp: null, vImp: 570, events: "慢性AF / HVRなし" },
    route: ["safety", "interrogate", "markDifficult", "thresholdV", "restore"]
  },
  {
    id: "rate-dependent-avb-asvs-pav",
    title: "レート依存性AVB / DDD / AS-VS: 下限レート上げで AP-VP 出現、PAV 延長が必要",
    disease: "間欠性房室ブロック（レート依存）",
    mode: "DDD",
    goal: "AS-VS baseline。A閾値のため下限レートを上げると AP-VP が出る（PAV < 必要 AV）。PAV を延長して AP-VS を保ち、A 捕捉判定を容易にしてから閾値測定。",
    teaching: "レート依存性 AVB ではレートを上げると房室伝導が途絶える拍が出る。A 閾値前に PAV を avDelayNeeded 以上に延長し、AP-VS を維持しておくと A 捕捉/脱落が判定しやすい。",
    settings: { lowerRate: 50, sensedAv: 240, pacedAv: 180, aOutput: 2.5, vOutput: 2.5, aSense: 0.5, vSense: 2.0 },
    physiology: { sinusRate: 68, intrinsicVRate: 50, avDelayNeeded: 220, pWave: 2.0, rWave: 8.5, aThreshold: 0.8, vThreshold: 0.9, aImp: 490, vImp: 580, events: "なし" },
    route: ["safety", "interrogate", "thresholdA", "extendPav", "thresholdV", "restore"]
  }
];

const SCORE_MAX = 100;
const PASSING_SCORE = 80;
const WRONG_PENALTY = 10;
const ECG_SAFETY_OVERLAY_DELAY_MS = 1200;
const COMPLETION_BONUS = 10;
const SCORE_HISTORY_KEY = "pacecheck-arena-history";
// 自己AV伝導の生理学的上限を超えたとみなす SAV 値。これ以上延ばしてVSが出なければ
// 「VSは出ない」と確認したと扱う閾値（CAVB系シナリオで confirm-no-vs を自動完了させる）。
const NO_VS_CONFIRM_SAV_MS = 280;
// CAVB系シナリオで、VVI 切替 + 下限レート ≤ この値で自己 R 波が出なければ
// 「自己 R 波確認困難 / PM dependent」と判断したと扱う。
const NO_VS_CONFIRM_VVI_LOW_RATE_BPM = 40;

// Fallback used when a stepId isn't part of the active scenario's profile.
// Points are 0 here so off-profile auto-triggers don't inflate the per-scenario score
// (which is balanced to total 100 via the profile sums + COMPLETION_BONUS).
const COMMON_STEPS = {
  "confirm-no-vs": { label: "AV延長でVSが出ないことを確認", hint: "AV delayを延長し、自己R波が出ないことを観察します。", points: 0 },
  "create-vs-for-r": { label: "VSを出してR波測定条件を作る", hint: "VPからVSへ切り替え、R波が見える条件を作ります。", points: 0 },
  "create-as-for-p": { label: "ASを出してP波測定条件を作る", hint: "APからASへ切り替え、P波が見える条件を作ります。", points: 0 },
  "create-ap-for-a-threshold": { label: "APを出してA閾値条件を作る", hint: "ASからAPへ切り替え、A閾値テストの条件を作ります。", points: 0 },
  "extend-pav-for-ap-vs": { label: "PAVを延長してAP-VSを保つ", hint: "自己伝導を保ち、A 捕捉判定を容易にするため PAV を avDelayNeeded 以上に設定します。", points: 0 },
  "create-vp-for-v-threshold": { label: "VPを出してV閾値条件を作る", hint: "VSからVPへ切り替え、V閾値テストの条件を作ります。", points: 0 },
  "start-a-threshold": { label: "A閾値テストを開始", hint: "AP表示中にA閾値テストを開始します。", points: 0, check: "aThreshold" },
  "find-a-loss": { label: "A出力を下げてLOCを確認", hint: "A出力を下げ、A LOCが出る境界を観察します。", points: 0 },
  "record-a-threshold": { label: "A閾値を記録", hint: "捕捉/脱落境界を確認してからA閾値を記録します。", points: 0, check: "aThreshold" },
  "start-v-threshold": { label: "V閾値テストを開始", hint: "VP表示中にV閾値テストを開始します。", points: 0, check: "vThreshold" },
  "find-v-loss": { label: "V出力を下げてLOCを確認", hint: "V出力を下げ、V LOCが出る境界を観察します。", points: 0 },
  "record-v-threshold": { label: "V閾値を記録", hint: "捕捉/脱落境界を確認してからV閾値を記録します。", points: 0, check: "vThreshold" },
  "record-p-wave": { label: "P波波高値を記録", hint: "AS表示中にAリード波高値を記録します。", points: 0, check: "pWave" },
  "record-r-wave": { label: "R波波高値を記録", hint: "VS表示中にVリード波高値を記録します。", points: 0, check: "rWave" },
  "record-r-difficult": { label: "V波高値を測定不可として記録", hint: "自己R波が出ないことを確認し、測定不可として記録します。", points: 0, check: "rDifficult" },
  "record-p-difficult": { label: "A波高値を測定不可として記録", hint: "P波が引き出せない症例と判断し、測定不可として記録します。", points: 0, check: "pDifficult" },
  "record-a-difficult": { label: "A閾値を測定不可として記録", hint: "A閾値測定が困難な症例と判断し、測定不可として記録します。", points: 0, check: "aDifficult" },
  "record-v-difficult": { label: "V閾値を測定不可として記録", hint: "V閾値測定が困難な症例と判断し、測定不可として記録します。", points: 0, check: "vDifficult" },
  "record-events": { label: "イベント情報を確認", hint: "イベントカウンタと保存EGMを確認します。", points: 0, check: "events" },
  "restore-settings": { label: "デフォルト設定", hint: "一時的に変更した設定を症例開始時の値へ戻します。", points: 0, check: "restore" }
};

const AUTO_STEP_IDS = [
  "confirm-no-vs",
  "create-vs-for-r",
  "create-as-for-p",
  "create-ap-for-a-threshold",
  "extend-pav-for-ap-vs",
  "create-vp-for-v-threshold",
  "find-a-loss",
  "find-v-loss"
];

const SIMULATOR_PROFILES = {
  "cavb-asvp-rwave-no-vs": [
    { id: "confirm-no-vs", label: "自己R波が安全に確認困難であることを確かめる", hint: "医師指示・施設手順に従い連続監視下で VVI へ切替え、下限レートを慎重に下げて（目安 40 bpm 程度以下）自己R波が出るか短時間だけ観察します。症状・血圧低下時は直ちに中止し設定を戻します。", points: 30 },
    { id: "record-r-difficult", label: "V波高値を測定不可として記録", hint: "自己R波が出ないため、測定不可として記録します。", points: 35, check: "rDifficult" },
    { id: "restore-settings", label: "デフォルト設定", hint: "モード(DDD)と下限レートを症例開始時の値へ戻します。", points: 25, check: "restore" }
  ],
  "intermittent-avb-asvp-rwave": [
    { id: "create-vs-for-r", label: "VSを出してR波測定条件を作る", hint: "SAVを延長し、AS-VPからAS-VSへ切り替えます。", points: 30 },
    { id: "record-r-wave", label: "R波波高値を記録", hint: "VS表示中にVリード波高値を記録します。", points: 35, check: "rWave" },
    { id: "restore-settings", label: "デフォルト設定", hint: "測定後は一時設定を戻します。", points: 25, check: "restore" }
  ],
  "sss-apvs-pwave": [
    { id: "create-as-for-p", label: "ASを出してP波測定条件を作る", hint: "下限レートを下げ、APからASへ切り替えます。", points: 30 },
    { id: "record-p-wave", label: "P波波高値を記録", hint: "AS表示中にAリード波高値を記録します。", points: 35, check: "pWave" },
    { id: "restore-settings", label: "デフォルト設定", hint: "測定後は下限レートを戻します。", points: 25, check: "restore" }
  ],
  "ddd-asvs-v-threshold": [
    { id: "create-vp-for-v-threshold", label: "VPを出してV閾値条件を作る", hint: "SAVを短縮し、AS-VSからAS-VPへ切り替えます。", points: 18 },
    { id: "start-v-threshold", label: "V閾値テストを開始", hint: "VP表示中にV閾値テストを開始します。", points: 12, check: "vThreshold" },
    { id: "find-v-loss", label: "V出力を下げてLOCを確認", hint: "V出力を下げ、V LOCが出る境界を観察します。", points: 22 },
    { id: "record-v-threshold", label: "V閾値を記録", hint: "捕捉/脱落境界を確認してからV閾値を記録します。", points: 22, check: "vThreshold" },
    { id: "restore-settings", label: "デフォルト設定", hint: "測定後は出力とAV delayを戻します。", points: 16, check: "restore" }
  ],
  "sss-apvp-a-threshold": [
    { id: "start-a-threshold", label: "A閾値テストを開始", hint: "AP表示中にA閾値テストを開始します。", points: 18, check: "aThreshold" },
    { id: "find-a-loss", label: "A出力を下げてLOCを確認", hint: "A出力を下げ、A LOCが出る境界を観察します。", points: 25 },
    { id: "record-a-threshold", label: "A閾値を記録", hint: "捕捉/脱落境界を確認してからA閾値を記録します。", points: 25, check: "aThreshold" },
    { id: "restore-settings", label: "デフォルト設定", hint: "測定後は出力を戻します。", points: 22, check: "restore" }
  ],
  "brady-af-vvi-rwave": [
    { id: "create-vs-for-r", label: "VSを出してR波測定条件を作る", hint: "下限レートを自己心拍より下げ、VVI-VPからVVI-VSへ切り替えます。", points: 30 },
    { id: "record-r-wave", label: "R波波高値を記録", hint: "VVI-VS表示中にVリード波高値を記録します。", points: 35, check: "rWave" },
    { id: "restore-settings", label: "デフォルト設定", hint: "測定後は下限レートを戻します。", points: 25, check: "restore" }
  ],
  "tachy-brady-events": [
    { id: "record-p-wave", label: "P波波高値を記録", hint: "AS表示中にAリード波高値を記録します。", points: 35, check: "pWave" },
    { id: "record-events", label: "イベント情報を確認", hint: "洞不全症候群（徐脈頻脈型）ではMode Switchなどのイベントも確認します。", points: 28, check: "events" },
    { id: "restore-settings", label: "初期設定を確認", hint: "一時変更が残っていないことを確認します。", points: 27, check: "restore" }
  ],
  "ddd-apvp-v-threshold-dependent": [
    { id: "start-v-threshold", label: "閾値テスト機能でV閾値測定を開始", hint: "依存疑いでは、プログラマーの閾値テスト機能（バックアップペーシング付き・短時間自動実行）を用います。VP表示を確認してから開始します。", points: 18, check: "vThreshold" },
    { id: "find-v-loss", label: "捕捉/脱落の境界を短時間で確認", hint: "閾値テスト機能でV出力を段階的に下げ、捕捉/脱落の境界を短時間で確認します。境界確認後は速やかに出力を安全域へ戻します。", points: 25 },
    { id: "record-v-threshold", label: "V閾値を記録", hint: "捕捉/脱落境界を確認してからV閾値を記録します。", points: 25, check: "vThreshold" },
    { id: "restore-settings", label: "デフォルト設定", hint: "測定後は出力安全域と復帰を確認します。", points: 22, check: "restore" }
  ],
  "ddd-apvp-pwave-vthreshold": [
    { id: "create-as-for-p", label: "ASを出してP波測定条件を作る", hint: "下限レートを下げ、APからASへ切り替えます。", points: 12 },
    { id: "record-p-wave", label: "P波波高値を記録", hint: "AS表示中にAリード波高値を記録します。", points: 12, check: "pWave" },
    { id: "record-r-difficult", label: "V波高値は測定不可", hint: "自己R波が出ない症例と判断し、測定不可とします。", points: 12, check: "rDifficult" },
    { id: "create-vp-for-v-threshold", label: "VPを出してV閾値条件を作る", hint: "下限レートを戻すかAV delayを短縮し、VP優位に戻します。", points: 10 },
    { id: "start-v-threshold", label: "V閾値テストを開始", hint: "VP表示中にV閾値テストを開始します。", points: 8, check: "vThreshold" },
    { id: "find-v-loss", label: "V出力を下げてLOCを確認", hint: "V出力を下げ、V LOCが出る境界を観察します。", points: 12 },
    { id: "record-v-threshold", label: "V閾値を記録", hint: "捕捉/脱落境界を確認してからV閾値を記録します。", points: 12, check: "vThreshold" },
    { id: "restore-settings", label: "デフォルト設定", hint: "測定後は下限レート・出力を戻します。", points: 12, check: "restore" }
  ],
  "vvi-vs-rwave-vthreshold": [
    { id: "record-r-wave", label: "R波波高値を記録", hint: "VVI-VS表示中にVリード波高値を記録します。", points: 18, check: "rWave" },
    { id: "create-vp-for-v-threshold", label: "VPを出してV閾値条件を作る", hint: "下限レートを上げ、VVI-VPへ切り替えます。", points: 14 },
    { id: "start-v-threshold", label: "V閾値テストを開始", hint: "VP表示中にV閾値テストを開始します。", points: 10, check: "vThreshold" },
    { id: "find-v-loss", label: "V出力を下げてLOCを確認", hint: "V出力を下げ、V LOCが出る境界を観察します。", points: 14 },
    { id: "record-v-threshold", label: "V閾値を記録", hint: "捕捉/脱落境界を確認してからV閾値を記録します。", points: 18, check: "vThreshold" },
    { id: "restore-settings", label: "デフォルト設定", hint: "測定後は下限レート・出力を戻します。", points: 16, check: "restore" }
  ],
  "afib-dependent-vvi-difficult": [
    { id: "record-r-difficult", label: "V波高値は測定不可", hint: "完全依存で自己R波が出ない症例と判断し、測定不可とします。", points: 22, check: "rDifficult" },
    { id: "start-v-threshold", label: "閾値テスト機能でV閾値測定を開始", hint: "依存例では、プログラマーの閾値テスト機能（バックアップペーシング付き・短時間自動実行）を用いて開始します。", points: 10, check: "vThreshold" },
    { id: "find-v-loss", label: "捕捉/脱落の境界を短時間で確認", hint: "閾値テスト機能でV出力を段階的に下げ、境界を短時間で確認します。確認後は速やかに出力を安全域へ戻します。", points: 20 },
    { id: "record-v-threshold", label: "V閾値を記録", hint: "捕捉/脱落境界を確認してからV閾値を記録します。", points: 20, check: "vThreshold" },
    { id: "restore-settings", label: "デフォルト設定", hint: "測定後は出力安全域と復帰を厳守します。", points: 18, check: "restore" }
  ],
  "ddd-asvs-comprehensive": [
    { id: "record-p-wave", label: "P波波高値を記録", hint: "AS表示中にAリード波高値を記録します。", points: 8, check: "pWave" },
    { id: "record-r-wave", label: "R波波高値を記録", hint: "VS表示中にVリード波高値を記録します。", points: 8, check: "rWave" },
    { id: "create-ap-for-a-threshold", label: "APを出してA閾値条件を作る", hint: "下限レートを上げ、ASからAPへ切り替えます。", points: 8 },
    { id: "start-a-threshold", label: "A閾値テストを開始", hint: "AP表示中にA閾値テストを開始します。", points: 7, check: "aThreshold" },
    { id: "find-a-loss", label: "A出力を下げてLOCを確認", hint: "A出力を下げ、A LOCの境界を観察します。", points: 9 },
    { id: "record-a-threshold", label: "A閾値を記録", hint: "捕捉/脱落境界を確認してからA閾値を記録します。", points: 9, check: "aThreshold" },
    { id: "create-vp-for-v-threshold", label: "VPを出してV閾値条件を作る", hint: "AV delayを短縮し、VSからVPへ切り替えます。", points: 8 },
    { id: "start-v-threshold", label: "V閾値テストを開始", hint: "VP表示中にV閾値テストを開始します。", points: 7, check: "vThreshold" },
    { id: "find-v-loss", label: "V出力を下げてLOCを確認", hint: "V出力を下げ、V LOCの境界を観察します。", points: 9 },
    { id: "record-v-threshold", label: "V閾値を記録", hint: "捕捉/脱落境界を確認してからV閾値を記録します。", points: 9, check: "vThreshold" },
    { id: "restore-settings", label: "デフォルト設定", hint: "総合チェック後は全設定を初期値へ戻します。", points: 8, check: "restore" }
  ],
  "ddd-lead-impedance-alert": [
    { id: "record-p-wave", label: "P波波高値を記録", hint: "AS表示中にAリード波高値を記録します。", points: 7, check: "pWave" },
    { id: "create-vs-for-r", label: "VSを出してR波測定条件を作る", hint: "AV delayを延長してAS-VPからAS-VSへ切り替えます。", points: 7 },
    { id: "record-r-wave", label: "R波波高値を記録（低下に注目）", hint: "VS表示中にVリード波高値を記録。前回値からのトレンドを意識する。", points: 8, check: "rWave" },
    { id: "create-ap-for-a-threshold", label: "APを出してA閾値条件を作る", hint: "下限レートを上げ、AP誘発します。", points: 7 },
    { id: "start-a-threshold", label: "A閾値テストを開始", hint: "AP表示中にA閾値テストを開始します。", points: 6, check: "aThreshold" },
    { id: "find-a-loss", label: "A LOCを確認", hint: "A出力を下げ、捕捉/脱落の境界を確認します。", points: 8 },
    { id: "record-a-threshold", label: "A閾値を記録", hint: "捕捉/脱落境界を確認してからA閾値を記録します。", points: 8, check: "aThreshold" },
    { id: "start-v-threshold", label: "V閾値テストを開始", hint: "VP表示中にV閾値テストを開始します。閾値上昇に注意。", points: 6, check: "vThreshold" },
    { id: "find-v-loss", label: "V LOCを確認", hint: "V出力を下げ、捕捉/脱落の境界を確認します。", points: 8 },
    { id: "record-v-threshold", label: "V閾値を記録（上昇に注目）", hint: "閾値の上昇傾向を記録。リード抵抗とイベントを併せて評価する。", points: 8, check: "vThreshold" },
    { id: "record-events", label: "イベント情報を確認", hint: "高抵抗アラートと保存EGMを確認します。", points: 9, check: "events" },
    { id: "restore-settings", label: "デフォルト設定", hint: "総合チェック後は全設定を初期値へ戻します。", points: 8, check: "restore" }
  ],
  "sinus-arrest-apvs-comprehensive": [
    { id: "create-as-for-p", label: "ASを出してP波測定条件を作る", hint: "下限レートを下げ、AP-VSからAS-VSへ切り替えます。", points: 8 },
    { id: "record-p-wave", label: "P波波高値を記録", hint: "AS表示中にAリード波高値を記録します。", points: 8, check: "pWave" },
    { id: "record-r-wave", label: "R波波高値を記録", hint: "VS表示中にVリード波高値を記録します。", points: 8, check: "rWave" },
    { id: "create-ap-for-a-threshold", label: "APを出してA閾値条件を作る", hint: "下限レートを上げ、ASからAPへ戻します。", points: 7 },
    { id: "start-a-threshold", label: "A閾値テストを開始", hint: "AP表示中にA閾値テストを開始します。", points: 7, check: "aThreshold" },
    { id: "find-a-loss", label: "A LOCを確認", hint: "A出力を下げ、捕捉/脱落の境界を確認します。", points: 8 },
    { id: "record-a-threshold", label: "A閾値を記録", hint: "捕捉/脱落境界を確認してからA閾値を記録します。", points: 8, check: "aThreshold" },
    { id: "create-vp-for-v-threshold", label: "VPを出してV閾値条件を作る", hint: "PAVを短縮し、AP-VSからAP-VPへ切り替えます。", points: 7 },
    { id: "start-v-threshold", label: "V閾値テストを開始", hint: "VP表示中にV閾値テストを開始します。", points: 7, check: "vThreshold" },
    { id: "find-v-loss", label: "V LOCを確認", hint: "V出力を下げ、捕捉/脱落の境界を確認します。", points: 8 },
    { id: "record-v-threshold", label: "V閾値を記録", hint: "捕捉/脱落境界を確認してからV閾値を記録します。", points: 8, check: "vThreshold" },
    { id: "restore-settings", label: "デフォルト設定", hint: "下限レート、AV delay、出力を初期値へ戻します。", points: 6, check: "restore" }
  ],
  "high-grade-avb-asvp-intermittent": [
    { id: "record-p-wave", label: "P波波高値を記録", hint: "AS表示中にAリード波高値を記録します。", points: 7, check: "pWave" },
    { id: "create-vs-for-r", label: "VSを出してR波測定条件を作る", hint: "SAVを延長し、AS-VPからAS-VSへ切り替えます。", points: 8 },
    { id: "record-r-wave", label: "R波波高値を記録", hint: "VS表示中にVリード波高値を記録します。", points: 8, check: "rWave" },
    { id: "create-ap-for-a-threshold", label: "APを出してA閾値条件を作る", hint: "下限レートを上げ、ASからAPへ切り替えます。", points: 7 },
    { id: "start-a-threshold", label: "A閾値テストを開始", hint: "AP表示中にA閾値テストを開始します。", points: 7, check: "aThreshold" },
    { id: "find-a-loss", label: "A LOCを確認", hint: "A出力を下げ、捕捉/脱落の境界を確認します。", points: 9 },
    { id: "record-a-threshold", label: "A閾値を記録", hint: "捕捉/脱落境界を確認してからA閾値を記録します。", points: 9, check: "aThreshold" },
    { id: "start-v-threshold", label: "V閾値テストを開始", hint: "VP表示中にV閾値テストを開始します。", points: 7, check: "vThreshold" },
    { id: "find-v-loss", label: "V LOCを確認", hint: "V出力を下げ、捕捉/脱落の境界を確認します。", points: 9 },
    { id: "record-v-threshold", label: "V閾値を記録", hint: "捕捉/脱落境界を確認してからV閾値を記録します。", points: 9, check: "vThreshold" },
    { id: "restore-settings", label: "デフォルト設定", hint: "AV delay、下限レート、出力を初期値へ戻します。", points: 10, check: "restore" }
  ],
  "post-av-node-ablation-vvi-dependent": [
    { id: "record-r-difficult", label: "V波高値は測定不可として記録", hint: "自己R波が出ない症例と判断し、測定不可として記録します。", points: 22, check: "rDifficult" },
    { id: "start-v-threshold", label: "閾値テスト機能でV閾値測定を開始", hint: "依存例では、プログラマーの閾値テスト機能（バックアップペーシング付き・短時間自動実行）を用いて開始します。", points: 12, check: "vThreshold" },
    { id: "find-v-loss", label: "捕捉/脱落の境界を短時間で確認", hint: "閾値テスト機能でV出力を段階的に下げ、境界を短時間で確認します。確認後は速やかに出力を安全域へ戻します。", points: 20 },
    { id: "record-v-threshold", label: "V閾値を記録", hint: "捕捉/脱落境界を確認してからV閾値を記録します。", points: 20, check: "vThreshold" },
    { id: "restore-settings", label: "デフォルト設定", hint: "V出力安全域と下限レートを初期値へ戻します。", points: 16, check: "restore" }
  ],
  "rate-dependent-avb-asvs-pav": [
    { id: "create-ap-for-a-threshold", label: "下限レートを上げてAPを誘発", hint: "AS-VS から下限レートを上げて AP に切替えますが、PAV が短いと AP-VP になります。", points: 10 },
    { id: "extend-pav-for-ap-vs", label: "PAVを延長して AP-VS を保つ", hint: "PAV を avDelayNeeded(220ms) 以上まで延長し、自己伝導を保って AP-VS にします。これでA捕捉判定が容易に。", points: 20 },
    { id: "start-a-threshold", label: "A閾値テストを開始", hint: "AP-VS 表示中にA閾値テストを開始します。", points: 8, check: "aThreshold" },
    { id: "find-a-loss", label: "A出力を下げてLOCを確認", hint: "A出力を下げ、AP-VS → ASなし→VSの境界（A LOC）を観察します。", points: 14 },
    { id: "record-a-threshold", label: "A閾値を記録", hint: "捕捉/脱落境界を確認してからA閾値を記録します。", points: 14, check: "aThreshold" },
    { id: "restore-settings", label: "デフォルト設定", hint: "下限レート・PAV・A出力を初期値へ戻します。", points: 24, check: "restore" }
  ]
};

const state = loadState();
let animationId = null;
let ecgPhase = 0;
let lastFrameTime = 0;
let ventricularSafetyStartedAt = 0;

let audioCtx = null;
function getAudioCtx() {
  if (state.soundEnabled === false) return null;
  if (!audioCtx) {
    try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
    catch { return null; }
  }
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}

function playTones(notes, gainPeak = 0.12) {
  const ctx = getAudioCtx();
  if (!ctx) return;
  const now = ctx.currentTime;
  notes.forEach((n) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = n.type || "sine";
    osc.frequency.value = n.freq;
    gain.gain.setValueAtTime(0, now + n.t);
    gain.gain.linearRampToValueAtTime(gainPeak, now + n.t + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.001, now + n.t + n.dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now + n.t);
    osc.stop(now + n.t + n.dur + 0.05);
  });
}

// Square/saw tone with exponential attack/release envelope (used by fanfare).
function playToneEnv(ctx, freq, start, duration, type = "square", volume = 0.2) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(gain).connect(ctx.destination);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

function playChordEnv(ctx, notes, start, duration, type = "square", volume = 0.12) {
  notes.forEach((freq) => playToneEnv(ctx, freq, start, duration, type, volume));
}

function playNoiseHit(ctx, start, duration = 0.12, volume = 0.18) {
  const bufferSize = Math.floor(ctx.sampleRate * duration);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
  const noise = ctx.createBufferSource();
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(volume, start);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  noise.buffer = buffer;
  noise.connect(gain).connect(ctx.destination);
  noise.start(start);
  noise.stop(start + duration);
}

function playStepSound() {
  // Quick two-note rise: A5 → E6
  playTones([
    { freq: 880, t: 0, dur: 0.14 },
    { freq: 1320, t: 0.09, dur: 0.20 }
  ]);
}

// ECG monitor "beep" played on each ventricular event (R peak).
// Different pitch for VS (auto) vs VP (paced) + a pacing click for VP.
function playMonitorBeep(rhythm) {
  if (state.soundEnabled === false) return;
  const ctx = getAudioCtx();
  if (!ctx) return;
  const now = ctx.currentTime;
  const isVp = rhythm.ventricular === "VP";

  // For VP: short noise click (mechanical pacing spike) before the beep
  if (isVp) {
    const dur = 0.012;
    const bs = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buf = ctx.createBuffer(1, bs, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < bs; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / bs);
    const noise = ctx.createBufferSource();
    const ng = ctx.createGain();
    noise.buffer = buf;
    ng.gain.setValueAtTime(0.08, now);
    ng.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    noise.connect(ng).connect(ctx.destination);
    noise.start(now);
    noise.stop(now + dur);
  }

  // Main beep: ~50ms sine
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = isVp ? 1480 : 1760; // VP slightly lower / metallic
  const beepStart = now + (isVp ? 0.012 : 0);
  gain.gain.setValueAtTime(0.0001, beepStart);
  gain.gain.exponentialRampToValueAtTime(0.18, beepStart + 0.006);
  gain.gain.exponentialRampToValueAtTime(0.0001, beepStart + 0.08);
  osc.connect(gain).connect(ctx.destination);
  osc.start(beepStart);
  osc.stop(beepStart + 0.1);
}

// Subtle button-click feedback (used by 記録 / 開始 / 測定不可 / 設定復帰 / テスト終了)
function playClickSound() {
  const ctx = getAudioCtx();
  if (!ctx) return;
  const now = ctx.currentTime;
  // Short noise burst (mechanical click)
  const dur = 0.04;
  const bufferSize = Math.max(1, Math.floor(ctx.sampleRate * dur));
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  const noise = ctx.createBufferSource();
  const noiseGain = ctx.createGain();
  noise.buffer = buffer;
  noiseGain.gain.setValueAtTime(0.06, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
  noise.connect(noiseGain).connect(ctx.destination);
  noise.start(now);
  noise.stop(now + dur);
  // Short pitched blip layered on top for a light "tick"
  const osc = ctx.createOscillator();
  const oscGain = ctx.createGain();
  osc.type = "triangle";
  osc.frequency.value = 1600;
  oscGain.gain.setValueAtTime(0.0001, now);
  oscGain.gain.exponentialRampToValueAtTime(0.05, now + 0.005);
  oscGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);
  osc.connect(oscGain).connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.06);
}

function playVictoryFanfare() {
  const ctx = getAudioCtx();
  if (!ctx) return;
  const now = ctx.currentTime;

  // 派手な上昇アルペジオ
  const run = [523.25, 659.25, 783.99, 1046.50, 1174.66, 1318.51, 1567.98, 2093.00];
  run.forEach((note, i) => playToneEnv(ctx, note, now + i * 0.055, 0.09, "square", 0.13));

  // 勝利感のある連続コード + 最後のド派手コード
  const chords = [
    { notes: [523.25, 659.25, 783.99],            time: 0.48, dur: 0.16 },
    { notes: [587.33, 739.99, 880.00],            time: 0.65, dur: 0.16 },
    { notes: [659.25, 783.99, 987.77],            time: 0.82, dur: 0.18 },
    { notes: [783.99, 987.77, 1174.66],           time: 1.02, dur: 0.22 },
    { notes: [1046.50, 1318.51, 1567.98, 2093.00], time: 1.34, dur: 0.85 },
    { notes: [261.63, 523.25, 659.25, 783.99],    time: 1.34, dur: 0.85 }
  ];
  chords.forEach((c) => playChordEnv(ctx, c.notes, now + c.time, c.dur, "square", 0.11));

  // 低音のドン！ドン！感
  const bass = [
    { note: 130.81, time: 0.00, dur: 0.20 },
    { note: 196.00, time: 0.24, dur: 0.20 },
    { note: 261.63, time: 0.48, dur: 0.22 },
    { note: 293.66, time: 0.65, dur: 0.20 },
    { note: 329.63, time: 0.82, dur: 0.22 },
    { note: 392.00, time: 1.02, dur: 0.28 },
    { note: 523.25, time: 1.34, dur: 0.85 }
  ];
  bass.forEach((b) => playToneEnv(ctx, b.note, now + b.time, b.dur, "sawtooth", 0.22));

  // 打楽器風ノイズ
  [0.00, 0.24, 0.48, 0.82, 1.34].forEach((t) => playNoiseHit(ctx, now + t, 0.08, 0.12));
}

function playFinalSound(passed) {
  if (passed) {
    playVictoryFanfare();
  } else {
    // Soft descending pair
    playTones([
      { freq: 440, t: 0, dur: 0.22, type: "triangle" },
      { freq: 330, t: 0.18, dur: 0.30, type: "triangle" }
    ], 0.12);
  }
}

document.addEventListener("DOMContentLoaded", init);

function initThemeToggle() {
  var btn = document.getElementById("themeToggle");
  if (!btn) return;
  function update() {
    btn.textContent = document.documentElement.getAttribute("data-theme") === "dark" ? "☀ ライト" : "☾ ダーク";
  }
  btn.addEventListener("click", function () {
    var next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("pacecheck-theme", next);
    update();
  });
  update();
}

function init() {
  initThemeToggle();
  populateScenarioSelect();
  bindControls();
  bindKeyboardShortcuts();
  render();
  startEcgAnimation();
}

function bindKeyboardShortcuts() {
  document.addEventListener("keydown", (event) => {
    if (event.target.tagName === "INPUT" || event.target.tagName === "SELECT" || event.target.tagName === "TEXTAREA") return;
    const key = event.key;
    const scenario = currentScenario();
    const controls = [
      { key: "lowerRate", step: 1, min: 30, max: 200 },
      { key: "sensedAv", step: 10, min: 80, max: 400 },
      { key: "pacedAv", step: 10, min: 80, max: 400 },
      { key: "aOutput", step: 0.1, min: 0.1, max: 5.0 },
      { key: "vOutput", step: 0.1, min: 0.1, max: 5.0 },
      { key: "aSense", step: 0.1, min: 0.1, max: 5.0 },
      { key: "vSense", step: 0.1, min: 0.1, max: 5.0 }
    ];
    const shortcuts = {
      "1": { label: "停止", speed: "pause" },
      "2": { label: "ゆっくり", speed: "slow" },
      "3": { label: "標準", speed: "normal" },
      "q": { control: "lowerRate", dir: 1 },
      "a": { control: "lowerRate", dir: -1 },
      "w": { control: "sensedAv", dir: 1 },
      "s": { control: "sensedAv", dir: -1 },
      "e": { control: "pacedAv", dir: 1 },
      "d": { control: "pacedAv", dir: -1 },
      "r": { control: "aOutput", dir: 1 },
      "f": { control: "aOutput", dir: -1 },
      "t": { control: "vOutput", dir: 1 },
      "g": { control: "vOutput", dir: -1 },
      "y": { control: "aSense", dir: 1 },
      "h": { control: "aSense", dir: -1 },
      "u": { control: "vSense", dir: 1 },
      "j": { control: "vSense", dir: -1 }
    };
    const action = shortcuts[key.toLowerCase()];
    if (!action) return;
    event.preventDefault();
    if (action.speed) {
      state.ecgSpeed = action.speed;
      saveState();
      updateSpeedButtons();
      return;
    }
    if (action.control) {
      const ctrl = controls.find((c) => c.key === action.control);
      if (!ctrl) return;
      // DDD-only controls — silently ignore in non-DDD scenarios
      const dddOnly = ["sensedAv", "pacedAv", "aOutput", "aSense"];
      if (dddOnly.includes(action.control) && effectiveMode(scenario) !== "DDD") return;
      const beforeRhythm = computeRhythm(scenario);
      const current = Number(state.settings[ctrl.key] ?? 0);
      const next = clampSetting(current + action.dir * ctrl.step, ctrl.min, ctrl.max, ctrl.step);
      state.settings[ctrl.key] = next;
      updateActiveTestForSetting(ctrl.key);
      const unit = (ctrl.key === "aOutput" || ctrl.key === "vOutput") ? "V"
        : (ctrl.key === "aSense" || ctrl.key === "vSense") ? "mV"
        : ctrl.key === "lowerRate" ? "ppm" : "ms";
      setFeedbackForSettingChange(ctrl.key, next, unit);
      judgeSettingChange(ctrl.key, current, next, beforeRhythm);
      saveState();
      render();
    }
  });
}

function defaultState() {
  const scenario = SCENARIOS[0];
  return {
    scenarioId: scenario.id,
    difficulty: "training",
    settings: { ...scenario.settings, mode: scenario.mode },
    completed: [],
    measurements: {},
    activeTest: null,
    ecgSpeed: "normal",
    score: 0,
    mistakes: 0,
    combo: 0,
    runComplete: false,
    simulatorFlags: {},
    hintsEnabled: true,
    soundEnabled: true,
    lastPenaltyKey: null,
    endAttemptPenalized: false,
    lastJudge: {
      type: "info",
      title: "判定待ち",
      body: "設定変更や測定操作を行うと、正誤判定と点数が表示されます。",
      delta: 0
    },
    log: [],
    feedback: {
      title: "Direct Check",
      body: "設定を直接操作して、自己波またはペーシングを出してから測定してください。"
    }
  };
}

function loadState() {
  try {
    const saved = JSON.parse(savedStateText());
    if (!saved) return defaultState();
    const scenario = SCENARIOS.find((item) => item.id === saved.scenarioId) || SCENARIOS[0];
    return {
      ...defaultState(),
      ...saved,
      scenarioId: scenario.id,
      settings: { mode: scenario.mode, ...scenario.settings, ...(saved.settings || {}) },
      completed: saved.completed || [],
      measurements: saved.measurements || {},
      activeTest: saved.activeTest || null,
      ecgSpeed: saved.ecgSpeed || "normal",
      mistakes: saved.mistakes || 0,
      combo: saved.combo || 0,
      runComplete: Boolean(saved.runComplete),
      simulatorFlags: saved.simulatorFlags || saved["ga" + "meFlags"] || {},
      hintsEnabled: Boolean(saved.hintsEnabled),
      lastJudge: saved.lastJudge || defaultState().lastJudge,
      log: saved.log || []
    };
  } catch {
    return defaultState();
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  LEGACY_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
}

function savedStateText() {
  return localStorage.getItem(STORAGE_KEY) || LEGACY_STORAGE_KEYS
    .map((key) => localStorage.getItem(key))
    .find(Boolean);
}

function currentScenario() {
  return SCENARIOS.find((item) => item.id === state.scenarioId) || SCENARIOS[0];
}

// 現在の実効モード。user が DDD↔VVI を一時的に切り替えると state.settings.mode に
// 反映される。settings.mode が無い場合はシナリオ初期モードに従う。
function effectiveMode(scenario) {
  try {
    if (state && state.settings && state.settings.mode) return state.settings.mode;
  } catch { /* TDZ during state init */ }
  return (scenario && scenario.mode) || "DDD";
}

function populateScenarioSelect() {
  const select = document.getElementById("scenarioSelect");
  select.innerHTML = SCENARIOS.map((scenario) => (
    `<option value="${scenario.id}">${escapeHtml(scenario.title)}</option>`
  )).join("");
  select.value = state.scenarioId;
}

function bindControls() {
  document.getElementById("scenarioSelect").addEventListener("change", (event) => {
    resetRun(event.target.value);
  });
  document.querySelectorAll("[data-speed]").forEach((button) => {
    button.addEventListener("click", () => {
      state.ecgSpeed = button.dataset.speed;
      saveState();
      updateSpeedButtons();
    });
  });
  document.getElementById("resetRun").addEventListener("click", () => resetRun(state.scenarioId));
  document.getElementById("newRun").addEventListener("click", () => {
    const other = SCENARIOS.filter((scenario) => scenario.id !== state.scenarioId);
    const next = other[Math.floor(Math.random() * other.length)];
    resetRun(next.id);
  });
}

function resetRun(scenarioId) {
  const scenario = SCENARIOS.find((item) => item.id === scenarioId) || SCENARIOS[0];
  state.scenarioId = scenario.id;
  state.settings = { ...scenario.settings, mode: scenario.mode };
  state.completed = [];
  state.measurements = {};
  state.activeTest = null;
  state.ecgSpeed = state.ecgSpeed || "normal";
  state.score = 0;
  state.mistakes = 0;
  state.combo = 0;
  state.runComplete = false;
  state.simulatorFlags = {};
  state.hintsEnabled = state.hintsEnabled ?? true;
  state.lastPenaltyKey = null;
  state.endAttemptPenalized = false;
  state.lastJudge = {
    type: "info",
    title: "判定待ち",
    body: "設定変更や測定操作を行うと、正誤判定と点数が表示されます。",
    delta: 0
  };
  state.log = [];
  state.feedback = {
    title: "Direct Check",
    body: "設定を動かしてMarkerを変化させ、測定可能になった項目を記録してください。"
  };
  saveState();
  // Select は既にユーザー操作で値が変わっているので innerHTML 再構築は不要。
  // 念のため value だけ同期する（プログラマブルに resetRun された場合の保険）。
  const sel = document.getElementById("scenarioSelect");
  if (sel && sel.value !== state.scenarioId) sel.value = state.scenarioId;
  // 重い描画を次フレームへ譲って、ドロップダウン閉じる UI を先に反映
  requestAnimationFrame(render);
}

// Phase position where the R peak is rendered (matches drawPacingSpikesAndMarkers
// ventricularX placement: VS 0.39, VP 0.47; we use VP value so a VP beat triggers
// right at its visible spike).
const R_PEAK_PHASE = 0.42;
let beatPlayedThisCycle = false;

function startEcgAnimation() {
  if (animationId) cancelAnimationFrame(animationId);
  const tick = (time) => {
    if (!lastFrameTime) lastFrameTime = time;
    const delta = Math.min(48, time - lastFrameTime);
    lastFrameTime = time;
    const scenario = currentScenario();
    const rhythm = computeRhythm(scenario);
    const rate = effectiveDisplayRate(scenario, rhythm);
    const speed = ecgSpeedMultiplier(rate);
    if (speed > 0 && rate > 0) {
      const oldPhase = ecgPhase;
      ecgPhase = (ecgPhase + (delta / 1000) * (rate / 60) * speed) % 1;
      // Detect cycle wrap → reset beat-played flag
      if (ecgPhase < oldPhase) beatPlayedThisCycle = false;
      // Trigger ECG beep when phase crosses R peak
      if (!beatPlayedThisCycle && ecgPhase >= R_PEAK_PHASE) {
        playMonitorBeep(rhythm);
        beatPlayedThisCycle = true;
      }
    }
    drawEcg(scenario, rhythm, ecgPhase);
    animationId = requestAnimationFrame(tick);
  };
  animationId = requestAnimationFrame(tick);
}

function ecgSpeedMultiplier(rate = 60) {
  if (state.ecgSpeed === "pause") return 0;
  if (state.ecgSpeed === "normal") return 1.0;
  return 0.75;
}

function updateSpeedButtons() {
  document.querySelectorAll("[data-speed]").forEach((button) => {
    button.classList.toggle("active", button.dataset.speed === state.ecgSpeed);
  });
  const scenario = currentScenario();
  const rhythm = computeRhythm(scenario);
  const displayRate = Math.round(effectiveDisplayRate(scenario, rhythm));
  const labels = {
    pause: "停止中",
    slow: "観察優先 0.75x",
    normal: "Rate基準 1.0x"
  };
  document.getElementById("speedReadout").textContent = `${labels[state.ecgSpeed] || "観察優先"} / ${displayRate} bpm`;
}

function effectiveDisplayRate(scenario, rhythm) {
  if (effectiveMode(scenario) === "VVI") {
    return rhythm.ventricular === "VS"
      ? scenario.physiology.intrinsicVRate
      : state.settings.lowerRate;
  }
  if (rhythm.atrial === "AS") return scenario.physiology.sinusRate || state.settings.lowerRate;
  return state.settings.lowerRate;
}

function render() {
  const scenario = currentScenario();
  const rhythm = computeRhythm(scenario);
  renderHeader(scenario, rhythm);
  renderManualControls(scenario);
  renderSimulatorPanel(scenario);
  renderMeasurements(scenario);
  renderFeedback();
  renderScoreHistory();
  updateSpeedButtons();
  drawEcg(scenario, rhythm, ecgPhase);
}

let _lastHistorySignature = null;
function renderScoreHistory(force = false) {
  const panel = document.getElementById("historyPanel");
  if (!panel) return;
  const history = loadScoreHistory();
  // 直近 10 件のシグネチャを比較し、変化が無ければ DOM 再構築をスキップ
  const sig = JSON.stringify(history.slice(0, 10).map((h) => [h.date, h.scenarioId, h.score]));
  if (!force && sig === _lastHistorySignature) return;
  _lastHistorySignature = sig;
  if (history.length === 0) {
    panel.innerHTML = "";
    return;
  }
  const recent = history.slice(0, 10);
  panel.innerHTML = `
    <div class="panel-heading">
      <div>
        <p class="eyebrow">Score History</p>
        <h2>練習履歴（直近10件）</h2>
      </div>
      <button id="clearHistory" class="ghost-button danger" type="button" title="履歴をすべて削除">履歴を消去</button>
    </div>
    <div class="history-table-wrap">
      <table class="history-table">
        <thead>
          <tr><th>日時</th><th>症例</th><th>得点</th><th>誤操作</th><th>結果</th></tr>
        </thead>
        <tbody>
          ${recent.map((entry) => `
            <tr>
              <td>${escapeHtml(entry.date)}</td>
              <td>${escapeHtml(entry.title.length > 30 ? entry.title.slice(0, 30) + "..." : entry.title)}</td>
              <td><strong>${entry.score}</strong>${entry.maxPoints ? `/${entry.maxPoints}` : ""}</td>
              <td>${entry.mistakes}回</td>
              <td>${(entry.passingThreshold ? entry.score >= entry.passingThreshold : entry.score >= PASSING_SCORE) ? '<span class="pill-ok">合格</span>' : '<span class="pill-fail">不合格</span>'}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
  const clearBtn = document.getElementById("clearHistory");
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      if (window.confirm("練習履歴をすべて削除します。よろしいですか？")) {
        localStorage.removeItem(SCORE_HISTORY_KEY);
        renderScoreHistory(true);
      }
    });
  }
}

function renderHeader(scenario, rhythm) {
  const safety = ventricularSafetyWarning(scenario, rhythm);
  document.getElementById("caseTitle").textContent = scenario.title;
  document.getElementById("rhythmBadge").textContent = rhythm.marker;
  document.getElementById("rhythmBadge").className = safety ? "pill danger" : rhythm.hasSelfIssue ? "pill warn" : "pill ok";
  const mobileRhythmLabel = document.getElementById("mobileRhythmLabel");
  if (mobileRhythmLabel) mobileRhythmLabel.textContent = rhythm.marker;

  document.getElementById("caseBrief").innerHTML = [
    ["疾患", scenario.disease],
    ["現在の作動", rhythm.marker],
    ["操作の狙い", state.hintsEnabled ? directGoalText(scenario, rhythm) : "4種類のチェックを完了してください。必要な条件はECGとMarkerから判断します。"]
  ].map(([label, value]) => `
    <div class="brief-cell">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
    </div>
  `).join("");

  document.getElementById("telemetryMode").textContent = effectiveMode(scenario);
  document.getElementById("telemetryMarker").textContent = rhythm.marker;
  document.getElementById("telemetryRate").textContent = `${state.settings.lowerRate} ppm`;
  document.getElementById("telemetryAv").textContent = effectiveMode(scenario) === "DDD"
    ? `S ${state.settings.sensedAv} / P ${state.settings.pacedAv} ms`
    : "-";
  document.getElementById("telemetrySensing").textContent = sensingStatus(scenario, rhythm);
  document.getElementById("telemetryCapture").textContent = safety ? "V LOC / VSなし" : captureStatus(rhythm);
}

function renderSimulatorPanel(scenario) {
  const targets = measurementTargets(scenario);
  const current = currentSimulatorStep(scenario);
  const progress = targetProgress(targets);
  const judge = state.lastJudge || defaultState().lastJudge;
  const rhythm = computeRhythm(scenario);
  const safety = ventricularSafetyWarning(scenario, rhythm);
  const judgeView = safety
    ? { title: safety.title, body: safety.body, delta: 0, displayDelta: "警告" }
    : judge;
  const judgeClass = safety ? "danger" : judge.type === "correct" ? "ok" : judge.type === "wrong" ? "danger" : "info";
  const logItems = (state.log || []).slice(0, 4);
  const hints = Boolean(state.hintsEnabled);
  const score = scoreSummary(scenario);
  const judgeDelta = safety ? "警告" : judge.delta ? (judge.displayDelta || formatScoreDelta(judge.delta, scenario)) : progress;
  const objectiveTitle = hints
    ? (current ? current.label : "完了")
    : (state.runComplete ? "完了" : "4種類のチェックを完了");
  const objectiveBody = hints
    ? (current ? current.hint : "この症例のチェックは完了です。")
    : "ヒントOFF中です。ECG、Marker、測定カードの状態から次の操作を判断してください。";

  const sound = state.soundEnabled !== false;
  document.getElementById("simulatorPanel").innerHTML = `
    <div class="simulator-toolbar">
      <span>操作判定</span>
      <div class="simulator-toolbar-actions">
        <button class="hint-toggle ${sound ? "on" : ""}" type="button" data-sound-toggle aria-label="音 ${sound ? "ON" : "OFF"}" title="音 ${sound ? "ON" : "OFF"}（心電図音・効果音）">
          ${sound ? "🔊" : "🔈"}
        </button>
        <button class="hint-toggle ${hints ? "on" : ""}" type="button" data-hint-toggle>
          ヒント ${hints ? "ON" : "OFF"}
        </button>
      </div>
    </div>
    <div class="score-strip">
      <div>
        <span>得点（${score.maxPoints}点満点）</span>
        <strong>${score.value}<small>/${score.maxPoints}点</small></strong>
      </div>
      <div class="${score.className}">
        <span>判定</span>
        <strong>${escapeHtml(score.label)}</strong>
        <small>${state.runComplete ? `合格基準 ${score.passingThreshold}点` : `${score.passingThreshold}点以上で合格`}</small>
      </div>
      <div>
        <span>誤操作</span>
        <strong>${state.mistakes || 0}<small>回</small></strong>
      </div>
    </div>
    <div class="judge-box ${judgeClass}">
      <span>${escapeHtml(judgeDelta)}</span>
      <div>
        <strong>${escapeHtml(judgeView.title)}</strong>
        <p>${escapeHtml(judgeView.body)}</p>
      </div>
    </div>
    <div class="safety-alert ${safety ? "" : "is-empty"}" aria-hidden="${safety ? "false" : "true"}">
      ${safety ? `
        <strong>${escapeHtml(safety.title)}</strong>
        <p>${escapeHtml(safety.body)}</p>
      ` : `<span class="placeholder-text">安全確認の警告はありません</span>`}
    </div>
    <div class="objective-box">
      <span>${hints ? "Current Hint" : "Goal"}</span>
      <strong>${escapeHtml(objectiveTitle)}</strong>
      <p>${escapeHtml(objectiveBody)}</p>
    </div>
    <ol class="judge-log ${logItems.length ? "" : "is-empty"}">
      ${logItems.length
        ? logItems.map((item) => `
            <li class="${escapeHtml(item.type)}">
              <span>${escapeHtml(item.displayDelta || formatScoreDelta(item.delta, scenario))}</span>
              <p>${escapeHtml(item.title)}</p>
            </li>
          `).join("")
        : `<li class="empty-log"><p>操作判定の履歴がここに表示されます。</p></li>`
      }
    </ol>
  `;

  document.querySelector("[data-sound-toggle]")?.addEventListener("click", () => {
    state.soundEnabled = !(state.soundEnabled !== false);
    if (state.soundEnabled) {
      playStepSound();
      const sc = currentScenario();
      const rhythm = computeRhythm(sc);
      playMonitorBeep(rhythm);
    }
    saveState();
    render();
  });

  document.querySelector("[data-hint-toggle]")?.addEventListener("click", () => {
    state.hintsEnabled = !state.hintsEnabled;
    saveState();
    render();
  });
}

// Derive the set of measurement targets the scenario actually focuses on,
// based on the SIMULATOR_PROFILES "check" fields. Targets not in the focus set
// are shown as 対象外 (out) so users aren't forced to do extra non-focus
// measurements (which would otherwise yield 0 points via COMMON_STEPS fallback).
function scenarioFocus(scenario) {
  const profile = SIMULATOR_PROFILES[scenario.id] || [];
  const focus = new Set();
  profile.forEach((step) => {
    const c = step.check;
    if (c === "pWave" || c === "pDifficult") focus.add("pWave");
    if (c === "rWave" || c === "rDifficult") focus.add("rWave");
    if (c === "aThreshold" || c === "aDifficult") focus.add("aThreshold");
    if (c === "vThreshold" || c === "vDifficult") focus.add("vThreshold");
    if (c === "events") focus.add("events");
  });
  return focus;
}

function measurementTargets(scenario) {
  const m = state.measurements;
  const isDDD = effectiveMode(scenario) === "DDD";
  // DDD: 全 4 項目をユーザーに判断させる（記録 or 測定不可）
  // VVI: 心房系（pWave / aThreshold）はモード上対象外
  const pWaveAvail = isDDD;
  const rWaveAvail = true;
  const aThresholdAvail = isDDD;
  const vThresholdAvail = true;

  return [
    {
      id: "pWave",
      label: "A波高値",
      available: pWaveAvail,
      status: pWaveAvail
        ? (m.pWave || m.pDifficult ? "done" : "todo")
        : "out"
    },
    {
      id: "rWave",
      label: "V波高値",
      available: rWaveAvail,
      status: rWaveAvail
        ? (m.rWave || m.difficult ? "done" : "todo")
        : "out"
    },
    {
      id: "aThreshold",
      label: "A閾値",
      available: aThresholdAvail,
      status: aThresholdAvail
        ? (m.aThreshold || m.aDifficult ? "done" : "todo")
        : "out"
    },
    {
      id: "vThreshold",
      label: "V閾値",
      available: vThresholdAvail,
      status: vThresholdAvail
        ? (m.vThreshold || m.vDifficult ? "done" : "todo")
        : "out"
    }
  ];
}

function targetProgress(targets) {
  const closed = targets.filter((target) => target.status === "done" || target.status === "out").length;
  return `${closed}/${targets.length}`;
}

function targetStatusText(target) {
  if (target.status === "done") return "完了";
  if (target.status === "out") return "対象外";
  return "未完了";
}

function nextTargetId(scenario) {
  return measurementTargets(scenario).find((target) => target.available && target.status !== "done")?.id || null;
}

function measurementGoalComplete(scenario) {
  return measurementTargets(scenario).every((target) => target.status === "done" || target.status === "out");
}

function renderManualControls(scenario) {
  const rhythm = computeRhythm(scenario);
  const controls = [
    { key: "lowerRate", label: "下限レート", unit: "ppm", min: 30, max: 200, step: 1, enabled: true, shortcutUp: "Q", shortcutDown: "A" },
    { key: "sensedAv", label: "SAV", unit: "ms", min: 80, max: 400, step: 10, enabled: effectiveMode(scenario) === "DDD", shortcutUp: "W", shortcutDown: "S" },
    { key: "pacedAv", label: "PAV", unit: "ms", min: 80, max: 400, step: 10, enabled: effectiveMode(scenario) === "DDD", shortcutUp: "E", shortcutDown: "D" },
    { key: "aOutput", label: "A出力", unit: "V", min: 0.1, max: 5.0, step: 0.1, enabled: effectiveMode(scenario) === "DDD", shortcutUp: "R", shortcutDown: "F" },
    { key: "vOutput", label: "V出力", unit: "V", min: 0.1, max: 5.0, step: 0.1, enabled: true, shortcutUp: "T", shortcutDown: "G" },
    { key: "aSense", label: "A感度", unit: "mV", min: 0.1, max: 5.0, step: 0.1, enabled: effectiveMode(scenario) === "DDD", shortcutUp: "Y", shortcutDown: "H" },
    { key: "vSense", label: "V感度", unit: "mV", min: 0.1, max: 5.0, step: 0.1, enabled: true, shortcutUp: "U", shortcutDown: "J" }
  ];
  const visibleControls = controls.filter((control) => control.enabled);

  const mode = effectiveMode(scenario);
  const modeChanged = mode !== scenario.mode;
  const modeRow = `
    <div class="control-row mode-row ${modeChanged ? "mode-changed" : ""}">
      <label><span>モード</span></label>
      <strong data-control-value="mode">
        <span class="control-value-text">${mode}</span>
        ${modeChanged ? `<em class="control-diff" aria-label="初期モードからの変更">←${scenario.mode}</em>` : ""}
      </strong>
      <div class="mode-toggle" role="group" aria-label="ペーシングモード切替">
        <button type="button" class="mode-btn ${mode === "DDD" ? "active" : ""}" data-mode="DDD">DDD</button>
        <button type="button" class="mode-btn ${mode === "VVI" ? "active" : ""}" data-mode="VVI">VVI</button>
      </div>
      <small class="control-hint">${state.hintsEnabled ? "CAVB系で R 波確認時は VVI に切替えて下限レートを下げる" : ""}</small>
    </div>
  `;

  document.getElementById("manualControls").innerHTML = modeRow + `
    ${visibleControls.map((control) => {
      const value = Number(state.settings[control.key] ?? 0);
      const initial = Number(scenario.settings[control.key] ?? value);
      const diff = Number((value - initial).toFixed(control.step >= 1 ? 0 : 1));
      const diffLabel = diff === 0 ? "" : (diff > 0 ? `+${diff}` : `${diff}`);
      const showHint = state.hintsEnabled;
      const hint = showHint ? controlHint(control.key, scenario, rhythm) : "";
      return `
        <div class="control-row ${control.enabled ? "" : "disabled"} ${controlFocusClass(control.key, scenario, rhythm)}">
          <label for="control-${control.key}">
            <span>${escapeHtml(control.label)}</span>
          </label>
          <strong data-control-value="${control.key}">
            <span class="control-value-text">${escapeHtml(formatControlValue(value, control.unit))}</span>
            ${diffLabel ? `<em class="control-diff" aria-label="初期値からの差">${escapeHtml(diffLabel)}</em>` : ""}
          </strong>
          <div class="stepper" aria-label="${escapeHtml(control.label)} step controls">
            <button type="button" aria-label="Increase ${escapeHtml(control.label)}" title="${control.shortcutUp ? `Increase (${control.shortcutUp})` : "Increase"}" data-step-control="${control.key}" data-step-direction="1" ${control.enabled ? "" : "disabled"}>${control.shortcutUp ? `<kbd class="shortcut-key">${escapeHtml(control.shortcutUp)}</kbd>` : ""}<span class="stepper-arrow">&#9650;</span></button>
            <button type="button" aria-label="Decrease ${escapeHtml(control.label)}" title="${control.shortcutDown ? `Decrease (${control.shortcutDown})` : "Decrease"}" data-step-control="${control.key}" data-step-direction="-1" ${control.enabled ? "" : "disabled"}>${control.shortcutDown ? `<kbd class="shortcut-key">${escapeHtml(control.shortcutDown)}</kbd>` : ""}<span class="stepper-arrow">&#9660;</span></button>
          </div>
          <input id="control-${control.key}" data-control="${control.key}" type="range" min="${control.min}" max="${control.max}" step="${control.step}" value="${value}" ${control.enabled ? "" : "disabled"}>
          ${showHint && hint ? `<small class="control-hint">${escapeHtml(hint)}</small>` : ""}
        </div>
      `;
    }).join("")}
  `;

  document.querySelectorAll("[data-control]").forEach((input) => {
    input.addEventListener("pointerdown", () => {
      input.dataset.startValue = String(state.settings[input.dataset.control] ?? input.value);
    });
    input.addEventListener("focus", () => {
      if (!input.dataset.startValue) input.dataset.startValue = String(state.settings[input.dataset.control] ?? input.value);
    });
    input.addEventListener("input", () => updateRangeControl(input, visibleControls, false));
    input.addEventListener("change", () => {
      updateRangeControl(input, visibleControls, true);
      delete input.dataset.startValue;
    });
  });

  document.querySelectorAll("[data-mode]").forEach((button) => {
    button.addEventListener("click", () => {
      const newMode = button.dataset.mode;
      const sc = currentScenario();
      const beforeMode = effectiveMode(sc);
      if (newMode === beforeMode) return;
      const beforeRhythm = computeRhythm(sc);
      state.settings.mode = newMode;
      state.activeTest = null; // 閾値テスト中ならキャンセル
      playClickSound();
      judgeModeChange(beforeMode, newMode, beforeRhythm, sc);
      saveState();
      render();
    });
  });

  document.querySelectorAll("[data-step-control]").forEach((button) => {
    button.addEventListener("click", () => {
      const key = button.dataset.stepControl;
      const direction = Number(button.dataset.stepDirection);
      const control = visibleControls.find((item) => item.key === key);
      if (!control || !control.enabled) return;
      const scenario = currentScenario();
      const beforeRhythm = computeRhythm(scenario);
      const current = Number(state.settings[key] ?? 0);
      const next = clampSetting(current + direction * Number(control.step), control.min, control.max, control.step);
      state.settings[key] = next;
      updateActiveTestForSetting(key);
      setFeedbackForSettingChange(key, next, control.unit);
      judgeSettingChange(key, current, next, beforeRhythm);
      saveState();
      render();
    });
  });
}

function updateRangeControl(input, controls, shouldSave) {
  const key = input.dataset.control;
  const control = controls.find((item) => item.key === key);
  if (!control || !control.enabled) return;

  const scenario = currentScenario();
  const beforeRhythm = computeRhythm(scenario);
  const beforeValue = shouldSave
    ? Number(input.dataset.startValue ?? state.settings[key] ?? 0)
    : Number(state.settings[key] ?? 0);
  const next = clampSetting(Number(input.value), control.min, control.max, control.step);
  state.settings[key] = next;
  updateActiveTestForSetting(key);
  input.value = String(next);

  const valueNode = document.querySelector(`[data-control-value="${key}"]`);
  if (valueNode) {
    const textEl = valueNode.querySelector('.control-value-text');
    if (textEl) textEl.textContent = formatControlValue(next, control.unit);
    const initial = Number(scenario.settings[key] ?? next);
    const decimals = control.step >= 1 ? 0 : 1;
    const diff = Number((next - initial).toFixed(decimals));
    let diffEl = valueNode.querySelector('.control-diff');
    if (diff === 0) {
      if (diffEl) diffEl.remove();
    } else {
      if (!diffEl) {
        diffEl = document.createElement('em');
        diffEl.className = 'control-diff';
        diffEl.setAttribute('aria-label', '初期値からの差');
        valueNode.appendChild(diffEl);
      }
      diffEl.textContent = diff > 0 ? `+${diff}` : String(diff);
    }
  }

  setFeedbackForSettingChange(key, next, control.unit);
  if (shouldSave) judgeSettingChange(key, beforeValue, next, beforeRhythm);
  refreshLivePanels();

  if (shouldSave) saveState();
}

function updateActiveTestForSetting(key) {
  if (!state.activeTest) return;
  const keepA = state.activeTest.chamber === "A" && key === "aOutput";
  const keepV = state.activeTest.chamber === "V" && key === "vOutput";
  if (!keepA && !keepV) state.activeTest = null;
}

function setFeedbackForSettingChange(key, value, unit) {
  if (state.activeTest && ((state.activeTest.chamber === "A" && key === "aOutput") || (state.activeTest.chamber === "V" && key === "vOutput"))) {
    const captured = value >= state.activeTest.threshold;
    const scenario = currentScenario();
    const rhythm = computeRhythm(scenario);
    const safety = ventricularSafetyWarning(scenario, rhythm);
    if (safety) {
      setFeedback(safety.title, safety.body);
      return;
    }
    setFeedback(
      `${state.activeTest.chamber}閾値スイープ`,
      `${controlLabel(key)} ${formatControlValue(value, unit)}: ${captured ? "捕捉あり" : "脱落(LOC)"}。境界を確認したら閾値を記録してください。`
    );
    return;
  }
  setFeedback("Live settings", `${controlLabel(key)} を ${formatControlValue(value, unit)} に変更しました。波形とマーカーの変化を確認してください。`);
}

function refreshLivePanels() {
  const scenario = currentScenario();
  const rhythm = computeRhythm(scenario);
  renderHeader(scenario, rhythm);
  renderSimulatorPanel(scenario);
  renderMeasurements(scenario);
  renderFeedback();
  updateSpeedButtons();
  drawEcg(scenario, rhythm, ecgPhase);
}

function clampSetting(value, min, max, step) {
  const clamped = Math.min(max, Math.max(min, value));
  const decimals = String(step).includes(".") ? String(step).split(".")[1].length : 0;
  return Number(clamped.toFixed(decimals));
}

function formatControlValue(value, unit) {
  const rounded = unit === "V" || unit === "mV" ? value.toFixed(1) : String(Math.round(value));
  return `${rounded} ${unit}`;
}

function controlUnit(key) {
  if (key === "lowerRate") return "ppm";
  if (key === "sensedAv" || key === "pacedAv") return "ms";
  if (key === "aOutput" || key === "vOutput") return "V";
  return "mV";
}

function controlLabel(key) {
  const labels = {
    lowerRate: "下限レート",
    sensedAv: "Sensed AV",
    pacedAv: "Paced AV",
    aOutput: "A出力",
    vOutput: "V出力",
    aSense: "A感度",
    vSense: "V感度"
  };
  return labels[key] || key;
}

function controlHint(key, scenario, rhythm) {
  const p = scenario.physiology;
  if (key === "lowerRate") {
    // CAVB系で VVI に切替済 → 下限レートを 35〜40 まで下げて自己 R 波確認
    if (effectiveMode(scenario) === "VVI" && !p.rWave && !state.measurements.difficult) return "下げる: 35〜40 bpm で自己R波確認";
    if (effectiveMode(scenario) === "VVI" && rhythm.ventricular === "VP" && p.rWave) return "下げる: VP→VSでR波";
    if (effectiveMode(scenario) === "VVI" && rhythm.ventricular === "VS" && p.vThreshold) return "上げる: VS→VPでV閾値";
    if (effectiveMode(scenario) === "DDD" && rhythm.atrial === "AP" && p.pWave) return "下げる: AP→ASでP波";
    if (effectiveMode(scenario) === "DDD" && rhythm.atrial === "AS" && p.aThreshold) return "上げる: AS→APでA閾値";
  }
  if (key === "sensedAv" && rhythm.atrial === "AS") {
    if (rhythm.ventricular === "VP" && p.rWave) return "延ばす: AS-VP→AS-VS";
    if (rhythm.ventricular === "VS" && p.vThreshold) return "短く: AS-VS→AS-VP";
  }
  if (key === "pacedAv" && rhythm.atrial === "AP") {
    // A 閾値テスト準備中（state.activeTest はまだ無い）で自己伝導があるなら、
    // PAV を延ばして AP-VS を保ち、A 捕捉判定を容易にする
    if (!state.activeTest && p.aThreshold && p.rWave && p.avDelayNeeded) {
      return "延ばす: 自己伝導を保ち A 捕捉判定を容易に";
    }
    if (rhythm.ventricular === "VP" && p.rWave) return "延ばす: AP-VP→AP-VS";
    if (rhythm.ventricular === "VS" && p.vThreshold) return "短く: AP-VS→AP-VP";
  }
  if (key === "aOutput") {
    if (state.activeTest?.chamber === "A") return "下げる: A捕捉/脱落を観察";
    return "AP時のA閾値確認";
  }
  if (key === "vOutput") {
    if (state.activeTest?.chamber === "V") return "下げる: V捕捉/脱落を観察";
    return "VP時のV閾値確認";
  }
  if (key === "aSense") return "P波高値との余裕";
  if (key === "vSense") return "R波高値との余裕";
  return "設定変更でMarkerを確認";
}

function controlFocusClass(key, scenario, rhythm) {
  if (!state.hintsEnabled) return "";
  const hint = controlHint(key, scenario, rhythm);
  return hint.includes("→") || state.activeTest?.chamber === "A" && key === "aOutput" || state.activeTest?.chamber === "V" && key === "vOutput"
    ? "recommended-control"
    : "";
}

function directGoalText(scenario, rhythm) {
  const p = scenario.physiology;
  const rWaveDone = state.measurements.rWave || state.measurements.difficult;
  // CAVB系：rWave が出ない症例で confirm-no-vs 未完了なら VVI 切替を促す
  if (!p.rWave && !state.measurements.difficult && !isStepDone("confirm-no-vs") && scenario.mode === "DDD") {
    if (effectiveMode(scenario) === "DDD") {
      return "V波高値の確認：医師指示・施設手順に従い連続監視下で、まず VVI に切替えて下限レートを慎重に下げ、自己 R 波が出るか短時間だけ確認します（症状・血圧低下時は直ちに中止）。";
    }
    return "連続監視下で下限レートを慎重に下げ（目安 40 bpm 程度以下）、数拍だけ自己 R 波が出るか確認します。症状・血圧低下時は直ちに中止し設定復帰。出なければ「測定不可」を選びます。";
  }
  // A 閾値準備中で、AP-VP になっていて自己伝導がある → PAV 延長で AP-VS に戻す
  if (rWaveDone && effectiveMode(scenario) === "DDD" && rhythm.atrial === "AP" && rhythm.ventricular === "VP" &&
      p.aThreshold && p.rWave && p.avDelayNeeded && !state.measurements.aThreshold && !state.activeTest) {
    return "AP-VP になっています。PAV を延ばすと自己伝導が戻り AP-VS となり、A 捕捉判定がしやすくなります。";
  }
  if (rhythm.ventricular === "VP" && p.rWave && !rWaveDone) {
    if (effectiveMode(scenario) === "VVI") {
      return "V波高値はVSで記録します。Lower Rateを自己心拍より下げ、VPからVSへ切り替えます。";
    }
    return "V波高値はVSで記録します。AV Delayを延ばす、またはLower Rateを下げてVPからVSへ切り替えます。";
  }
  if (rhythm.ventricular === "VS" && p.vThreshold) {
    return "R波は記録可能です。V閾値はVPを出してから、V出力を上下して捕捉/脱落を確認します。";
  }
  if (effectiveMode(scenario) === "DDD" && rhythm.atrial === "AP" && p.pWave) {
    return "A波高値はASで記録します。Lower Rateを下げ、APからASへ切り替えます。";
  }
  if (effectiveMode(scenario) === "DDD" && rhythm.atrial === "AS" && p.aThreshold) {
    if (p.rWave && p.avDelayNeeded) {
      return "P波は記録可能です。A閾値は下限レートを上げて AP を誘発しますが、自己伝導がある症例では PAV を延ばしておくと AP-VS が保たれ、A 捕捉/脱落が判定しやすくなります。";
    }
    return "P波は記録可能です。A閾値はAPを出してから、A出力を上下して捕捉/脱落を確認します。";
  }
  // AP 表示中で自己伝導あるが VP が出てしまっている場合（PAV < avDelayNeeded）
  if (effectiveMode(scenario) === "DDD" && rhythm.atrial === "AP" && rhythm.ventricular === "VP" &&
      p.aThreshold && p.rWave && p.avDelayNeeded && !state.activeTest) {
    return "AP-VP になっています。PAV を延ばすと自己伝導が戻り AP-VS となり、A 捕捉判定がしやすくなります。";
  }
  return "Markerを見ながら、波高値は自己波、閾値はペーシングが出る条件を作ります。";
}

function renderMeasurements(scenario) {
  const rhythm = computeRhythm(scenario);
  const checks = directChecks(scenario, rhythm);
  const targets = measurementTargets(scenario);
  const targetById = Object.fromEntries(targets.map((t, i) => [t.id, { ...t, index: i + 1 }]));
  const nextId = nextTargetId(scenario);
  document.getElementById("measurementGrid").innerHTML = `
    <div class="condition-box">
      <strong>${escapeHtml(rhythm.marker)}</strong>
      <p>${escapeHtml(state.hintsEnabled ? directGoalText(scenario, rhythm) : "測定条件を満たした項目から記録します。ヒントOFF中は具体的な操作手順を伏せています。")}</p>
    </div>
    <div class="restore-actions">
      <button class="restore-button" type="button" data-check="restore" ${state.runComplete ? "disabled" : ""}>デフォルト設定</button>
    </div>
    ${checks.map((check) => {
      const target = targetById[check.id];
      const status = target?.status === "done" ? "done"
        : target?.status === "out" ? "out"
        : (!state.runComplete && target?.available && check.id === nextId ? "active" : "todo");
      const badge = status === "done" ? "✓"
        : status === "out" ? "—"
        : target ? String(target.index) : "?";
      return `
      <div class="measurement-item ${check.ready ? "ready" : ""} ${check.available ? "" : "disabled"} status-${status}">
        <div class="measurement-status" aria-hidden="true">${badge}</div>
        <div class="measurement-body">
          <span>${escapeHtml(check.label)}</span>
          <strong>${escapeHtml(check.value)}</strong>
          <small>${escapeHtml(state.hintsEnabled ? check.hint : measurementBlindHint(check))}</small>
        </div>
        <div class="measure-actions">
          <button class="measure-button" type="button" data-check="${check.id}" ${check.available ? "" : "disabled"}>
            ${escapeHtml(check.actionLabel || "記録")}
          </button>
          ${(check.extraActions || []).map((action) => `
            <button class="measure-button measure-button-${action.variant || "secondary"}" type="button" data-check="${action.id}" ${check.available ? "" : "disabled"}>
              ${escapeHtml(action.label)}
            </button>
          `).join("")}
        </div>
      </div>
    `}).join("")}
    <div class="end-actions">
      <button class="end-test-button" type="button" data-check="end" ${state.runComplete ? "disabled" : ""}>テスト終了</button>
    </div>
  `;

  document.querySelectorAll("[data-check]").forEach((button) => {
    button.addEventListener("click", () => {
      if (!button.disabled) playClickSound();
      performDirectCheck(button.dataset.check);
    });
  });
}

function directChecks(scenario, rhythm) {
  const m = state.measurements;
  const p = scenario.physiology;
  const aActive = state.activeTest?.chamber === "A";
  const vActive = state.activeTest?.chamber === "V";
  const isDDD = effectiveMode(scenario) === "DDD";
  // DDD では全 4 項目をユーザーに判断させる（記録 or 測定不可）
  // VVI は心房系（pWave / aThreshold）がモード上対象外
  const checks = [
    {
      id: "pWave",
      label: "A波高値",
      value: m.pWave ? `${m.pWave} mV` : (m.pDifficult ? "測定不可" : "未測定"),
      available: isDDD && !(m.pWave || m.pDifficult),
      ready: Boolean(p.pWave && isDDD && rhythm.atrial === "AS"),
      hint: !isDDD
        ? "対象外（VVIモードでは心房系は測定しません）"
        : p.pWave
          ? (rhythm.atrial === "AS" ? "AS表示中。P波を記録できます。" : "Lower Rateを下げてASを出します。")
          : "P波が引き出せない症例と判断したら「測定不可」を選びます。",
      actionLabel: "P波を記録",
      extraActions: isDDD ? [
        { id: "pDifficult", label: "測定不可", variant: "secondary" }
      ] : []
    },
    {
      id: "rWave",
      label: "V波高値",
      value: m.rWave ? `${m.rWave} mV` : (m.difficult || "未測定"),
      available: !(m.rWave || m.difficult),
      ready: Boolean(p.rWave && rhythm.ventricular === "VS"),
      hint: rhythm.ventricular === "VS"
        ? "VS表示中。R波を記録できます。自己R波が出ない場合は測定不可を選択します。"
        : "VP中。LRLを下げる/AV Delayを延ばしてVSを誘発するか、出ないと判断したら測定不可を選びます。",
      actionLabel: "R波を記録",
      extraActions: [
        { id: "rDifficult", label: "測定不可", variant: "secondary" }
      ]
    },
    {
      id: "aThreshold",
      label: "A閾値",
      value: m.aThreshold ? `${m.aThreshold} V` : (m.aDifficult ? "測定不可" : (aActive ? "スイープ中" : "未測定")),
      available: isDDD && !(m.aThreshold || m.aDifficult),
      ready: Boolean(p.aThreshold && isDDD && rhythm.atrial === "AP"),
      hint: !isDDD
        ? "対象外（VVIモードでは心房系は測定しません）"
        : p.aThreshold
          ? thresholdHint("A", rhythm.atrial === "AP", state.settings.aOutput, p.aThreshold, aActive, "Lower Rateを上げてAPを出します。")
          : "A閾値測定が困難な症例（慢性AF等）と判断したら「測定不可」を選びます。",
      actionLabel: aActive ? "閾値記録" : "開始",
      extraActions: isDDD ? [
        { id: "aDifficult", label: "測定不可", variant: "secondary" }
      ] : []
    },
    {
      id: "vThreshold",
      label: "V閾値",
      value: m.vThreshold ? `${m.vThreshold} V` : (m.vDifficult ? "測定不可" : (vActive ? "スイープ中" : "未測定")),
      available: !(m.vThreshold || m.vDifficult),
      ready: Boolean(p.vThreshold && rhythm.ventricular === "VP"),
      hint: p.vThreshold
        ? thresholdHint("V", rhythm.ventricular === "VP", state.settings.vOutput, p.vThreshold, vActive, "VS中。LRLを上げる、またはAV Delayを短くしてVPを出します。")
        : "V閾値測定が困難な症例と判断したら「測定不可」を選びます。",
      actionLabel: vActive ? "閾値記録" : "開始",
      extraActions: [
        { id: "vDifficult", label: "測定不可", variant: "secondary" }
      ]
    }
  ];
  if (scenario.route.includes("readEvents")) {
    checks.push({
      id: "events",
      label: "イベント",
      value: m.events || "未確認",
      available: Boolean(p.events),
      ready: Boolean(p.events),
      hint: "Mode Switch回数、最長持続時間、保存EGMを確認します。",
      actionLabel: "確認"
    });
  }
  return checks;
}

function thresholdHint(chamber, pacingReady, output, threshold, active, notReadyHint) {
  if (!pacingReady) return notReadyHint;
  if (!active) return `${chamber}ペーシング中。開始後に出力を下げて捕捉/脱落を観察します。`;
  const captured = output >= threshold;
  return `${chamber}出力 ${output.toFixed(1)} V: ${captured ? "捕捉あり" : "脱落(LOC)"}。境界確認後に記録します。`;
}

function measurementBlindHint(check) {
  if (!check.available) return "対象外";
  if (check.ready) return "記録可能な状態です。";
  if (check.value !== "未測定" && check.value !== "スイープ中" && check.value !== "未確認") return "完了";
  return "条件未成立。ECGとMarkerを確認してください。";
}

function performDirectCheck(checkId) {
  const scenario = currentScenario();
  const rhythm = computeRhythm(scenario);
  const p = scenario.physiology;

  if (checkId === "restore") {
    state.settings = { ...scenario.settings, mode: scenario.mode };
    state.activeTest = null;
    if (!isStepDone("restore-settings") && Object.keys(state.measurements).length > 0) {
      completeSimulatorStep("restore-settings", "設定復帰 正解", "一時設定を初期値へ戻しました。");
    } else {
      setFeedback("設定復帰", "初期設定へ戻しました。必要な手順が未完了なら続けてやり直してください。");
    }
    saveState();
    render();
    return;
  }

  if (checkId === "end") {
    if (state.runComplete) return;
    endTestRun(scenario);
    saveState();
    render();
    return;
  }

  // DDD ベース症例で VVI に切替えて V 波高値（記録 or 測定不可）を確認した後は、
  // 次の測定ステップへ進む前に DDD へ戻させる（一時的な VVI のまま放置しない）。
  const vAmplitudeDoneInVvi = Boolean(state.measurements.rWave || state.measurements.difficult);
  if (
    scenario.mode === "DDD" &&
    effectiveMode(scenario) === "VVI" &&
    vAmplitudeDoneInVvi
  ) {
    setJudge(
      "info",
      "DDDへ戻してください",
      state.hintsEnabled
        ? "VVIでV波高値を確認した後は、次のステップへ進む前にモードをDDDへ戻します。一時的なVVIのまま他の測定や終了に進まないでください。"
        : "モードを初期（DDD）へ戻してから次へ進んでください。",
      0,
      true
    );
    setFeedback(
      "DDDへ戻してから次のステップへ",
      "VVIでV波高値を確認した後は、モードをDDDへ戻してから次の測定に進みます。"
    );
    render();
    return;
  }

  if (checkId === "pWave" && effectiveMode(scenario) === "DDD" && rhythm.atrial === "AS" && p.pWave) {
    state.measurements.pWave = p.pWave;
    completeSimulatorStep("record-p-wave", "A波高値 正解", `P波 ${p.pWave} mV を記録しました。A感度 ${state.settings.aSense} mV との余裕を確認してください。`);
  } else if (checkId === "rWave" && rhythm.ventricular === "VS" && p.rWave) {
    state.measurements.rWave = p.rWave;
    completeSimulatorStep("record-r-wave", "V波高値 正解", `R波 ${p.rWave} mV を記録しました。V感度 ${state.settings.vSense} mV との余裕を確認してください。`);
  } else if (checkId === "rDifficult" && !p.rWave) {
    // CAVB系（confirm-no-vs を採点工程に含むシナリオ）では、自己R波が安全に確認困難
    // だった根拠を先に残させる。確認前の「測定不可」は採点せず、確認手順へ誘導する。
    const profile = SIMULATOR_PROFILES[scenario.id] || [];
    const requiresConfirmFirst = profile.some((s) => s.id === "confirm-no-vs");
    if (requiresConfirmFirst && !isStepDone("confirm-no-vs")) {
      setFeedback(
        "先に自己R波の確認を",
        state.hintsEnabled
          ? "「測定不可」と判断する前に、自己R波が安全に確認困難であることを確かめます。医師指示・施設手順に従い連続監視下で VVI へ切替え、下限レートを慎重に下げて自己R波が出ないことを確認してから記録してください（症状・血圧低下時は直ちに中止）。"
          : "自己R波が確認困難である根拠を先に残してください。"
      );
      render();
      return;
    }
    state.measurements.difficult = "測定不可";
    const body = isStepDone("confirm-no-vs")
      ? "連続監視下で自己R波が出ないことを確認したうえで、V波高値は測定不可として記録しました。設定は必ず初期値へ戻します。"
      : "自己R波が出ない症例と判断し、測定不可としました。連続監視下での確認を済ませるとさらに確実です。";
    completeSimulatorStep("record-r-difficult", "測定不可 正解", body);
  } else if (checkId === "rDifficult" && p.rWave) {
    penalize(
      "誤判定",
      state.hintsEnabled
        ? "この症例は自己R波が観察可能です。VSを誘発してR波を記録してください。"
        : "判断が早すぎます。ECGとMarkerを見直してください。",
      10
    );
  } else if (checkId === "pDifficult" && !p.pWave && effectiveMode(scenario) === "DDD") {
    state.measurements.pDifficult = "測定不可";
    completeSimulatorStep("record-p-difficult", "測定不可 正解", "P波が引き出せない症例と判断し、A波高値は測定不可としました。");
  } else if (checkId === "pDifficult" && p.pWave && effectiveMode(scenario) === "DDD") {
    penalize(
      "誤判定",
      state.hintsEnabled
        ? "この症例は自己P波が観察可能です。Lower RateでASを出してP波を記録してください。"
        : "判断が早すぎます。ECGとMarkerを見直してください。",
      10
    );
  } else if (checkId === "aDifficult" && !p.aThreshold && effectiveMode(scenario) === "DDD") {
    state.measurements.aDifficult = "測定不可";
    completeSimulatorStep("record-a-difficult", "測定不可 正解", "A閾値測定が困難な症例と判断し、測定不可としました。");
  } else if (checkId === "aDifficult" && p.aThreshold && effectiveMode(scenario) === "DDD") {
    penalize(
      "誤判定",
      state.hintsEnabled
        ? "この症例はA閾値測定が可能です。APを誘発してA閾値テストを開始してください。"
        : "判断が早すぎます。ECGとMarkerを見直してください。",
      10
    );
  } else if (checkId === "vDifficult" && !p.vThreshold) {
    state.measurements.vDifficult = "測定不可";
    completeSimulatorStep("record-v-difficult", "測定不可 正解", "V閾値測定が困難な症例と判断し、測定不可としました。");
  } else if (checkId === "vDifficult" && p.vThreshold) {
    penalize(
      "誤判定",
      state.hintsEnabled
        ? "この症例はV閾値測定が可能です。VPを誘発してV閾値テストを開始してください。"
        : "判断が早すぎます。ECGとMarkerを見直してください。",
      10
    );
  } else if (checkId === "events" && scenario.route.includes("readEvents") && p.events) {
    state.measurements.events = p.events;
    completeSimulatorStep("record-events", "イベント確認 正解", `イベント情報: ${p.events}。カウンタだけでなく保存EGMを確認する想定です。`);
  } else if (checkId === "aThreshold" && !state.activeTest && effectiveMode(scenario) === "DDD" && rhythm.atrial === "AP" && rhythm.aCapture && p.aThreshold) {
    state.activeTest = { chamber: "A", threshold: p.aThreshold };
    completeSimulatorStep("start-a-threshold", "A閾値開始 正解", "A出力を下げて、AP後の捕捉あり/脱落(LOC)の境界を確認してください。");
  } else if (checkId === "aThreshold" && state.activeTest?.chamber === "A" && isStepDone("find-a-loss") && p.aThreshold) {
    state.measurements.aThreshold = p.aThreshold;
    state.measurements.thresholdSweep = thresholdSweepText("A", p.aThreshold);
    state.activeTest = null;
    completeSimulatorStep("record-a-threshold", "A閾値記録 正解", `A捕捉閾値 ${p.aThreshold} V を記録しました。出力を安全域へ戻してください。`);
  } else if (checkId === "vThreshold" && !state.activeTest && rhythm.ventricular === "VP" && rhythm.vCapture && p.vThreshold) {
    // Safety: prevent starting V threshold while atrium is in LOC (arrest) from prior A threshold test
    if (
      effectiveMode(scenario) === "DDD" &&
      p.aThreshold &&
      state.measurements.aThreshold &&
      Number(state.settings.aOutput) < Number(scenario.settings.aOutput)
    ) {
      penalize(
        "心房アレストのまま次のテストへ",
        state.hintsEnabled
          ? "A閾値測定後、A出力が下げたままで心房アレスト状態です。V閾値テストへ進む前にA出力を安全域へ戻してください。"
          : "前のテストで下げた設定が戻っていません。安全のため設定を戻してから次のテストへ進んでください。",
        10
      );
      saveState();
      render();
      return;
    }
    state.activeTest = { chamber: "V", threshold: p.vThreshold };
    completeSimulatorStep("start-v-threshold", "V閾値開始 正解", "V出力を下げて、VP後の捕捉あり/脱落(LOC)の境界を確認してください。");
  } else if (checkId === "vThreshold" && state.activeTest?.chamber === "V" && isStepDone("find-v-loss") && p.vThreshold) {
    state.measurements.vThreshold = p.vThreshold;
    state.measurements.thresholdSweep = thresholdSweepText("V", p.vThreshold);
    state.activeTest = null;
    completeSimulatorStep("record-v-threshold", "V閾値記録 正解", `V捕捉閾値 ${p.vThreshold} V を記録しました。出力を安全域へ戻してください。`);
  } else {
    penalize("条件未成立", state.hintsEnabled ? conditionErrorText(checkId, scenario, rhythm) : "この測定はまだ記録条件を満たしていません。ECGとMarkerを見直してください。", 10);
  }

  saveState();
  render();
}

function simulatorSteps(scenario) {
  return SIMULATOR_PROFILES[scenario.id] || [];
}

function simulatorMaxPoints(scenario) {
  return simulatorSteps(scenario).reduce((sum, step) => sum + step.points, COMPLETION_BONUS);
}

function scoreSummary(scenario) {
  const maxPoints = Math.max(1, simulatorMaxPoints(scenario));
  const raw = state.score || 0;
  // Show the raw score directly (allow negative values so penalties are visible).
  // Cap upper bound at maxPoints just in case, but raw cannot normally exceed it.
  const value = Math.min(maxPoints, raw);
  const complete = Boolean(state.runComplete);
  const passingThreshold = Math.ceil(maxPoints * (PASSING_SCORE / SCORE_MAX));
  const passed = complete && raw >= passingThreshold;
  return {
    value,
    raw,
    maxPoints,
    passingThreshold,
    label: complete ? (passed ? "合格" : "不合格") : "採点中",
    className: complete ? (passed ? "score-pass" : "score-fail") : "score-pending"
  };
}

function formatScoreDelta(rawDelta) {
  const v = rawDelta || 0;
  return v > 0 ? `+${v}` : String(v);
}

function scoringStep(scenario, stepId) {
  const profileStep = simulatorSteps(scenario).find((step) => step.id === stepId);
  if (profileStep) return profileStep;
  const common = COMMON_STEPS[stepId];
  return common ? { id: stepId, ...common } : null;
}

function currentSimulatorStep(scenario) {
  return nextSuggestedStep(scenario);
}

function nextSuggestedStep(scenario) {
  const rhythm = computeRhythm(scenario);
  const p = scenario.physiology;
  const nextTarget = nextTargetId(scenario);

  if (nextTarget === "pWave") {
    if (effectiveMode(scenario) === "DDD" && rhythm.atrial !== "AS") return scoringStep(scenario, "create-as-for-p");
    return scoringStep(scenario, "record-p-wave");
  }
  if (nextTarget === "rWave") {
    if (!p.rWave) {
      if (effectiveMode(scenario) === "DDD" && !isStepDone("confirm-no-vs")) return scoringStep(scenario, "confirm-no-vs");
      return scoringStep(scenario, "record-r-difficult");
    }
    if (rhythm.ventricular !== "VS") return scoringStep(scenario, "create-vs-for-r");
    return scoringStep(scenario, "record-r-wave");
  }
  if (nextTarget === "aThreshold") {
    if (!state.activeTest && rhythm.atrial !== "AP") return scoringStep(scenario, "create-ap-for-a-threshold");
    // PAV延長ステップが profile に含まれていて、まだ完了していない & 現在 AP-VP なら誘導
    const hasPavStep = simulatorSteps(scenario).some((s) => s.id === "extend-pav-for-ap-vs");
    if (hasPavStep && !isStepDone("extend-pav-for-ap-vs") && rhythm.atrial === "AP" && rhythm.ventricular === "VP") {
      return scoringStep(scenario, "extend-pav-for-ap-vs");
    }
    if (!state.activeTest) return scoringStep(scenario, "start-a-threshold");
    if (!isStepDone("find-a-loss")) return scoringStep(scenario, "find-a-loss");
    return scoringStep(scenario, "record-a-threshold");
  }
  if (nextTarget === "vThreshold") {
    if (!state.activeTest && rhythm.ventricular !== "VP") return scoringStep(scenario, "create-vp-for-v-threshold");
    if (!state.activeTest) return scoringStep(scenario, "start-v-threshold");
    if (!isStepDone("find-v-loss")) return scoringStep(scenario, "find-v-loss");
    return scoringStep(scenario, "record-v-threshold");
  }
  return state.runComplete ? null : scoringStep(scenario, "restore-settings");
}

function isStepDone(stepId) {
  return (state.completed || []).includes(stepId);
}

function completeSimulatorStep(stepId, title, body, options = {}) {
  if (isStepDone(stepId)) return false;
  const scenario = currentScenario();
  const step = scoringStep(scenario, stepId);
  if (!step) return false;

  state.completed.push(stepId);
  state.combo = (state.combo || 0) + 1;
  state.score = (state.score || 0) + step.points;
  state.lastPenaltyKey = null;
  state.endAttemptPenalized = false;
  playStepSound();
  const displayBody = state.hintsEnabled ? (body || step.hint) : blindCorrectBody(stepId, body || step.hint);
  setJudge("correct", title || "正解", displayBody, step.points, options.silent);
  setFeedback(title || "正解", displayBody);
  finishSimulatorIfComplete(scenario, options.silent);
  return true;
}

function blindCorrectBody(stepId, body) {
  if (stepId.startsWith("record-")) return body;
  if (stepId === "restore-settings") return "設定復帰を確認しました。";
  return "正しい条件変化を確認しました。採点に反映しました。";
}

function finishSimulatorIfComplete(scenario, silent = false) {
  // Auto-completion no longer ends the test. The user must click "テスト終了" explicitly.
  // We just surface a hint when measurements are done but the user hasn't ended yet.
  if (state.runComplete) return;
  if (state.activeTest) return;
  if (!measurementGoalComplete(scenario)) return;
  if (silent) return;
  setFeedback(
    "テスト終了の準備が整いました",
    "全ての測定が完了しました。設定を初期値へ戻してから「テスト終了」ボタンを押してください。"
  );
}

function endTestRun(scenario) {
  if (state.runComplete) return;
  const measurementsDone = measurementGoalComplete(scenario);
  const restored = settingsRestored(scenario);

  // Incomplete measurements: penalize once, then warn without re-deducting on repeat presses.
  if (!measurementsDone) {
    if (!state.endAttemptPenalized) {
      state.score = (state.score || 0) - WRONG_PENALTY;
      state.mistakes = (state.mistakes || 0) + 1;
      state.endAttemptPenalized = true;
      setJudge(
        "wrong",
        "未完了項目あり：終了不可",
        `未完了の測定があります（-${WRONG_PENALTY}点）。残りのチェックを完了してから終了してください。`,
        -WRONG_PENALTY,
        false
      );
      setFeedback(
        "未完了項目あり：再開してください",
        `未完了の測定があるため、テストは終了されませんでした（-${WRONG_PENALTY}点）。残りのチェックを完了してから「テスト終了」を押してください。`
      );
    } else {
      setJudge(
        "wrong",
        "未完了項目あり：終了不可",
        "未完了の測定があります。残りのチェックを完了してから終了してください。",
        0,
        false
      );
      setFeedback(
        "未完了項目あり：再開してください",
        "未完了の測定があるため、テストは終了できません。残りのチェックを完了してください。"
      );
    }
    return;
  }

  // All measurements complete — finalize. Always award the completion bonus,
  // and apply restore penalty separately so the displayed delta matches actual change.
  let penalty = 0;
  const notes = [];
  if (!restored) {
    penalty += WRONG_PENALTY;
    notes.push(`設定が初期値へ戻されていません（-${WRONG_PENALTY}点）。実臨床では必ず設定を戻してください。`);
  }
  if (penalty > 0) {
    state.score = (state.score || 0) - penalty;
    state.mistakes = (state.mistakes || 0) + 1;
  }

  state.runComplete = true;
  state.activeTest = null;
  state.score = (state.score || 0) + COMPLETION_BONUS;
  state.combo = (state.combo || 0) + 1;

  const score = scoreSummary(scenario);
  const resultTitle = `完了：${score.label}`;
  const noteText = notes.length ? notes.join(" / ") : "全項目を適切に終了しました。";
  const resultBody = `${noteText} 最終得点は${score.value}/${score.maxPoints}点です。合格基準は${score.passingThreshold}点です。`;
  setJudge("correct", resultTitle, resultBody, COMPLETION_BONUS - penalty, false);
  setFeedback(resultTitle, resultBody);
  playFinalSound(score.raw >= score.passingThreshold);
  saveScoreHistory(scenario.id, scenario.title, score.value, state.mistakes || 0, score.maxPoints, score.passingThreshold);
}

function saveScoreHistory(scenarioId, scenarioTitle, scoreValue, mistakes, maxPoints, passingThreshold) {
  try {
    const history = JSON.parse(localStorage.getItem(SCORE_HISTORY_KEY) || "[]");
    history.unshift({
      scenarioId,
      title: scenarioTitle,
      score: scoreValue,
      maxPoints,
      passingThreshold,
      mistakes,
      date: new Date().toISOString().slice(0, 16).replace("T", " ")
    });
    if (history.length > 50) history.length = 50;
    localStorage.setItem(SCORE_HISTORY_KEY, JSON.stringify(history));
  } catch { /* ignore storage errors */ }
}

function loadScoreHistory() {
  try { return JSON.parse(localStorage.getItem(SCORE_HISTORY_KEY) || "[]"); }
  catch { return []; }
}

function penalize(title, body, amount = WRONG_PENALTY) {
  const strictAmount = Math.max(1, Math.round(amount));
  state.mistakes = (state.mistakes || 0) + 1;
  state.combo = 0;
  state.score = (state.score || 0) - strictAmount;
  setJudge("wrong", title, body, -strictAmount, false);
  setFeedback(title, body);
}

function setJudge(type, title, body, delta = 0, silent = false) {
  const scenario = currentScenario();
  const entry = {
    type,
    title,
    body,
    delta,
    displayDelta: delta ? formatScoreDelta(delta, scenario, state.score || 0) : "0"
  };
  state.lastJudge = entry;
  if (silent) return;
  state.log = [entry, ...(state.log || [])].slice(0, 8);
}

function syncSimulatorProgress(source = "auto", options = {}) {
  const scenario = currentScenario();
  let changed = false;
  AUTO_STEP_IDS.forEach((stepId) => {
    if (isStepDone(stepId) || !autoStepSatisfied(stepId, scenario, options)) return;
    const step = scoringStep(scenario, stepId);
    const title = autoStepTitle(stepId);
    completeSimulatorStep(stepId, title, step?.hint || "条件成立", { silent: options.silent || source === "render" });
    changed = true;
  });
  return changed;
}

function autoStepSatisfied(stepId, scenario, context = {}) {
  const rhythm = context.afterRhythm || computeRhythm(scenario);
  const before = context.beforeRhythm;
  const p = scenario.physiology;
  if (stepId === "confirm-no-vs") {
    return Boolean(context.key && state.simulatorFlags?.noVsConfirmed && rhythm.ventricular === "VP" && !p.rWave);
  }
  if (stepId === "create-vs-for-r") {
    return Boolean(before && before.ventricular !== "VS" && p.rWave && rhythm.ventricular === "VS");
  }
  if (stepId === "create-as-for-p") {
    return Boolean(before && before.atrial !== "AS" && effectiveMode(scenario) === "DDD" && p.pWave && rhythm.atrial === "AS");
  }
  if (stepId === "create-ap-for-a-threshold") {
    return Boolean(before && before.atrial !== "AP" && effectiveMode(scenario) === "DDD" && p.aThreshold && rhythm.atrial === "AP" && rhythm.aCapture);
  }
  if (stepId === "extend-pav-for-ap-vs") {
    // AP-VP → AP-VS への遷移を捕捉。PAV/SAV/lowerRate のどの変更でも認める。
    return Boolean(before && before.atrial === "AP" && before.ventricular === "VP" &&
                   rhythm.atrial === "AP" && rhythm.ventricular === "VS" &&
                   p.aThreshold && p.avDelayNeeded && p.rWave);
  }
  if (stepId === "create-vp-for-v-threshold") {
    return Boolean(before && before.ventricular !== "VP" && p.vThreshold && rhythm.ventricular === "VP" && rhythm.vCapture);
  }
  if (stepId === "find-v-loss") {
    return Boolean(context.key === "vOutput" && state.activeTest?.chamber === "V" && rhythm.ventricular === "VP" && !rhythm.vCapture);
  }
  if (stepId === "find-a-loss") {
    return Boolean(context.key === "aOutput" && state.activeTest?.chamber === "A" && rhythm.atrial === "AP" && !rhythm.aCapture);
  }
  if (stepId === "restore-settings") {
    return Boolean(settingsRestored(scenario) && !state.activeTest);
  }
  return false;
}

function autoStepTitle(stepId) {
  const titles = {
    "confirm-no-vs": "確認 正解",
    "create-vs-for-r": "作動変更 正解",
    "create-as-for-p": "作動変更 正解",
    "create-ap-for-a-threshold": "作動変更 正解",
    "extend-pav-for-ap-vs": "PAV延長 正解",
    "create-vp-for-v-threshold": "作動変更 正解",
    "find-v-loss": "V LOC確認 正解",
    "find-a-loss": "A LOC確認 正解",
    "restore-settings": "設定復帰 正解"
  };
  return titles[stepId] || "正解";
}

function settingsRestored(scenario) {
  // mode が初期と異なれば復帰していない扱い
  if (effectiveMode(scenario) !== scenario.mode) return false;
  return Object.entries(scenario.settings).every(([key, value]) => Number(state.settings[key]) === Number(value));
}

function judgeSettingChange(key, beforeValue, nextValue, beforeRhythm) {
  const scenario = currentScenario();
  const afterRhythm = computeRhythm(scenario);
  markSettingMilestones(key, beforeValue, nextValue, afterRhythm, scenario);
  if (syncSimulatorProgress("setting", { key, beforeValue, nextValue, beforeRhythm, afterRhythm })) return;

  const step = currentSimulatorStep(scenario);
  if (!step || state.runComplete) return;
  const direction = Math.sign(nextValue - beforeValue);
  if (direction === 0) return;

  const guide = settingGuidanceForStep(step.id, scenario, beforeRhythm);

  // Steps that require no setting change at all (record / start measurement steps).
  // 記録/閾値開始ステップ中の設定変更は目的外（無関係）の操作とみなし、一律 -10。
  // 進捗を後退させる移動はその旨を明示し、それ以外も「目的外の操作」として減点する。
  // （同じキー・方向の連打は applySettingPenalty の debounce で初回のみ減点）
  if (guide && guide.unnecessary) {
    const isProfileStep = simulatorSteps(scenario).some((s) => s.id === step.id);
    const regresses = unnecessaryMoveRegresses(step.id, key, beforeRhythm, afterRhythm, scenario);
    // 設定を初期値へ戻す方向（＝復帰操作）、またはこの症例の採点工程ではない
    // （フォーカス外のファントム）ステップ中の操作は無関係な動作とみなさず減点しない。
    const target = Number(scenario.settings[key]);
    const towardOriginal = Number.isFinite(target) && Math.abs(nextValue - target) < Math.abs(beforeValue - target);
    if ((towardOriginal && !regresses) || !isProfileStep) {
      state.lastPenaltyKey = null;
      return;
    }
    const title = regresses ? "進捗が後退しています" : "目的外の操作です";
    const body = regresses
      ? (state.hintsEnabled ? `現在の工程は「${step.label}」です。${step.hint}` : "前の手順で得た条件が崩れます。元の方向へ戻してください。")
      : (state.hintsEnabled ? `現在の工程は「${step.label}」で、設定変更は不要です。記録操作に進んでください。${step.hint}` : "現在の工程では設定変更は不要です。記録操作に進んでください。");
    applySettingPenalty(`${step.id}:unnecessary:${key}:${direction}`, title, body);
    return;
  }

  // Restore-settings step: penalize moves AWAY from original, allow moves TOWARD original
  if (guide && guide.restore) {
    const target = Number(scenario.settings[key]);
    if (Number.isFinite(target)) {
      const beforeDist = Math.abs(beforeValue - target);
      const afterDist = Math.abs(nextValue - target);
      if (afterDist > beforeDist) {
        applySettingPenalty(`${step.id}:restoreAway:${key}:${direction}`, "初期設定から遠ざかっています", state.hintsEnabled ? `現在の工程は「${step.label}」です。設定を初期値に戻してください。` : "初期設定から遠ざかる操作です。設定を元に戻してください。");
        return;
      }
    }
    state.lastPenaltyKey = null;
    return;
  }

  if (!guide) return;

  if (!guide.keys.includes(key)) {
    applySettingPenalty(`${step.id}:wrongKey:${key}`, "操作が目的とずれています", state.hintsEnabled ? `現在の工程は「${step.label}」です。${step.hint}` : "現在のチェック条件にはつながりにくい操作です。Markerの変化を確認してください。");
    return;
  }
  if (guide.direction && direction !== guide.direction) {
    applySettingPenalty(`${step.id}:wrongDir:${key}:${direction}`, "操作方向が逆です", state.hintsEnabled ? `${controlLabel(key)} は ${guide.direction > 0 ? "上げる" : "下げる"} 方向で確認します。${step.hint}` : "目的のMarker変化から遠ざかる方向です。ECGとMarkerを見直してください。");
    return;
  }

  state.lastPenaltyKey = null;
  setJudge("info", "方向OK", state.hintsEnabled ? `${controlLabel(key)} の方向は合っています。Markerが目的の状態に変わるまで調整してください。` : "目的のMarker変化に近づいています。", 0, true);
  setFeedback("方向OK", state.hintsEnabled ? `${controlLabel(key)} の方向は合っています。Markerが目的の状態に変わるまで調整してください。` : "目的のMarker変化に近づいています。");
}

function applySettingPenalty(penaltyKey, title, body) {
  if (state.lastPenaltyKey === penaltyKey) {
    setJudge("wrong", title, body, 0, true);
    setFeedback(title, body);
    return;
  }
  state.lastPenaltyKey = penaltyKey;
  penalize(title, body);
}

// Returns true if a setting change during an `unnecessary`-marked step would
// break the condition the previous shaping step achieved. Same-direction
// follow-through (= preserves the achieved condition) returns false → warn only.
function unnecessaryMoveRegresses(stepId, key, beforeRhythm, afterRhythm, scenario) {
  if (stepId === "record-p-wave") return afterRhythm.atrial !== "AS";
  if (stepId === "record-r-wave") return afterRhythm.ventricular !== "VS";
  if (stepId === "record-r-difficult") {
    // Confirmed "no VS at long SAV". Penalize only if SAV is brought back below the confirm threshold.
    if (key === "sensedAv" && Number(state.settings.sensedAv) < NO_VS_CONFIRM_SAV_MS) return true;
    return false;
  }
  if (stepId === "start-a-threshold") return afterRhythm.atrial !== "AP" || !afterRhythm.aCapture;
  if (stepId === "start-v-threshold") return afterRhythm.ventricular !== "VP" || !afterRhythm.vCapture;
  // record-a-threshold / record-v-threshold: at LOC after find-loss; output exploration is OK.
  return false;
}

function markSettingMilestones(key, beforeValue, nextValue, rhythm, scenario) {
  // 「自己 R 波が出ない」確認の2系統：
  // (a) VVI モード + 下限レート ≤ 40 bpm（新・推奨パス：実臨床に近い）
  // (b) DDD のまま SAV を 280ms 以上に延長（旧パス：AV伝導の有無を見る場面）
  if (scenario.physiology.rWave) return; // rWave がある症例では確認不要

  // (a) VVI 切替 + 下限レート低下
  if (effectiveMode(scenario) === "VVI" && key === "lowerRate" &&
      nextValue < beforeValue && nextValue <= NO_VS_CONFIRM_VVI_LOW_RATE_BPM &&
      rhythm.ventricular === "VP") {
    state.simulatorFlags.noVsConfirmed = true;
    return;
  }

  // (b) DDD で SAV/PAV を延長（旧来：AV delay 延長による伝導確認）
  const activeAv = rhythm.atrial === "AS" ? "sensedAv" : rhythm.atrial === "AP" ? "pacedAv" : null;
  if (key !== activeAv) return;
  if (nextValue > beforeValue && nextValue >= NO_VS_CONFIRM_SAV_MS && rhythm.ventricular === "VP") {
    state.simulatorFlags.noVsConfirmed = true;
  }
}

// モード切替を「VS出ない確認」のトリガーとして判定（CAVB系のみ）
function markModeMilestones(beforeMode, newMode, scenario) {
  if (!scenario.physiology.rWave && newMode === "VVI" &&
      Number(state.settings.lowerRate) <= NO_VS_CONFIRM_VVI_LOW_RATE_BPM) {
    state.simulatorFlags.noVsConfirmed = true;
  }
}

// モード切替の正誤判定
function judgeModeChange(beforeMode, newMode, beforeRhythm, scenario) {
  markModeMilestones(beforeMode, newMode, scenario);
  if (syncSimulatorProgress("mode", { key: "mode", beforeMode, newMode, beforeRhythm, afterRhythm: computeRhythm(scenario) })) return;

  const step = currentSimulatorStep(scenario);
  if (!step || state.runComplete) {
    setJudge("info", "モード変更", `${beforeMode} → ${newMode} に切替えました。`, 0, true);
    setFeedback("モード変更", `${beforeMode} → ${newMode} に切替えました。`);
    return;
  }

  // confirm-no-vs ステップ中なら、CAVB系で DDD→VVI 切替は正方向（プラス評価）
  if (step.id === "confirm-no-vs" && !scenario.physiology.rWave) {
    if (newMode === "VVI") {
      state.lastPenaltyKey = null;
      setJudge("info", "方向OK", state.hintsEnabled ? "VVI に切替えました。連続監視下で下限レートを慎重に下げ、自己 R 波が出るか確認してください（症状・血圧低下時は直ちに中止）。" : "Marker を見ながら自己 R 波の出現を確認してください。", 0, true);
      setFeedback("VVI に切替", "連続監視下で下限レートを慎重に下げ、数拍だけ自己 R 波が出るか観察します。症状・血圧低下時は直ちに中止し設定復帰。");
      return;
    }
  }

  // restore-settings 中：scenario.mode へ戻すのは正方向
  if (step.id === "restore-settings") {
    if (newMode === scenario.mode) {
      state.lastPenaltyKey = null;
      setJudge("info", "復帰方向OK", "モードを初期状態へ戻しました。", 0, true);
      setFeedback("モード復帰", `モードを ${scenario.mode} へ戻しました。`);
    } else {
      applySettingPenalty(`${step.id}:modeAway:${newMode}`,
        "初期モードから外れています",
        state.hintsEnabled ? `現在の工程は「${step.label}」です。モードを ${scenario.mode} に戻してください。` : "モードが初期から外れています。");
    }
    return;
  }

  // 記録/閾値開始ステップ中のモード変更は目的外（無関係）の操作 → 一律 -10。
  // ただし初期モードへ戻す操作（＝復帰）、またはこの症例の採点工程ではない
  // （フォーカス外のファントム）ステップ中の操作は減点しない。
  const guide = settingGuidanceForStep(step.id, scenario, beforeRhythm);
  if (guide && guide.unnecessary) {
    const isProfileStep = simulatorSteps(scenario).some((s) => s.id === step.id);
    if (newMode === scenario.mode || !isProfileStep) {
      state.lastPenaltyKey = null;
      setJudge("info", "モード変更", `${beforeMode} → ${newMode} に切替えました。`, 0, true);
      setFeedback("モード変更", `${beforeMode} → ${newMode} に切替えました。`);
      return;
    }
    applySettingPenalty(`${step.id}:modeUnnecessary:${newMode}`,
      "目的外のモード変更です",
      state.hintsEnabled ? `現在の工程は「${step.label}」です。モード変更は不要です。記録操作に進んでください。` : "現在の工程ではモード変更は不要です。");
    return;
  }

  // それ以外（A/V閾値テストの準備中など）はモード変更が不適切なら減点
  applySettingPenalty(`${step.id}:modeMismatch:${newMode}`,
    "現在の工程に合わないモード変更です",
    state.hintsEnabled ? `${step.hint || "現在の工程を確認してください。"}` : "Marker を見直してください。");
}

function settingGuidanceForStep(stepId, scenario, beforeRhythm) {
  if (stepId === "confirm-no-vs") {
    // VVI モードに切り替え済なら、下限レートを下げて自己 R 波確認が正路
    if (effectiveMode(scenario) === "VVI") {
      return { keys: ["lowerRate"], direction: -1 };
    }
    // DDD のままなら SAV/PAV 延長も依然として有効
    return beforeRhythm?.atrial === "AP"
      ? { keys: ["pacedAv", "lowerRate"], direction: null }  // lowerRate は VVI 切替前の準備として許容
      : { keys: ["sensedAv", "lowerRate"], direction: null };
  }
  if (stepId === "create-vs-for-r") {
    if (effectiveMode(scenario) === "VVI") return { keys: ["lowerRate"], direction: -1 };
    return beforeRhythm?.atrial === "AP"
      ? { keys: ["lowerRate"], direction: -1 }
      : { keys: ["sensedAv"], direction: 1 };
  }
  if (stepId === "create-as-for-p") return { keys: ["lowerRate"], direction: -1 };
  if (stepId === "create-ap-for-a-threshold") {
    // 房室伝導が残っている症例（avDelayNeeded + rWave あり）では、
    // PAV 延長で AP-VS を保つことが A 捕捉判定を容易にする。両キーを許容。
    const hasConduction = scenario.physiology.avDelayNeeded && scenario.physiology.rWave;
    return hasConduction
      ? { keys: ["lowerRate", "pacedAv"], direction: 1 }
      : { keys: ["lowerRate"], direction: 1 };
  }
  if (stepId === "extend-pav-for-ap-vs") {
    // PAV を avDelayNeeded 以上に延長する。SAV や lowerRate でも結果として
    // AP-VS にできれば autoStepSatisfied で検出されるので、ここは主に PAV +1 を案内
    return { keys: ["pacedAv"], direction: 1 };
  }
  if (stepId === "create-vp-for-v-threshold") {
    return beforeRhythm?.atrial === "AP"
      ? { keys: ["pacedAv"], direction: -1 }
      : { keys: ["sensedAv"], direction: -1 };
  }
  if (stepId === "find-v-loss") return { keys: ["vOutput"], direction: -1 };
  if (stepId === "find-a-loss") return { keys: ["aOutput"], direction: -1 };
  // Steps where setting changes are NOT needed — measurement / record / start
  if (
    stepId === "record-p-wave" ||
    stepId === "record-r-wave" ||
    stepId === "record-r-difficult" ||
    stepId === "start-a-threshold" ||
    stepId === "record-a-threshold" ||
    stepId === "start-v-threshold" ||
    stepId === "record-v-threshold"
  ) {
    return { unnecessary: true };
  }
  // Restore step — only changes that move TOWARD scenario.settings are valid
  if (stepId === "restore-settings") return { restore: true };
  return null;
}

function conditionErrorText(checkId, scenario, rhythm) {
  if (checkId === "pWave") return "A波高値はAS表示中に記録します。まず下限レートを下げて自己P波を出してください。";
  if (checkId === "rWave") return "V波高値はVS表示中に記録します。VP中はR波波高値の測定条件ではありません。";
  if (checkId === "rDifficult") return "測定不可は、AV delay延長などで自己R波が出ないことを確認してから記録します。";
  if (checkId === "aThreshold") {
    if (state.activeTest?.chamber === "A") return "まだA LOCの境界確認前です。A出力を下げて捕捉/脱落を見てください。";
    return "A閾値はAP表示中に開始します。";
  }
  if (checkId === "vThreshold") {
    if (state.activeTest?.chamber === "V") return "まだV LOCの境界確認前です。V出力を下げて捕捉/脱落を見てください。";
    return "V閾値はVP表示中に開始します。";
  }
  if (checkId === "events") return "この症例でイベント確認が求められるタイミングを確認してください。";
  return directGoalText(scenario, rhythm);
}

function renderFeedback() {
  const feedback = state.feedback;
  const scenario = currentScenario();
  const rhythm = computeRhythm(scenario);
  const safety = ventricularSafetyWarning(scenario, rhythm);
  const display = safety || feedback;
  document.getElementById("feedbackBox").innerHTML = `
    <strong>${escapeHtml(display.title)}</strong>
    <p>${escapeHtml(display.body)}</p>
  `;
  document.getElementById("feedbackBox").className = safety ? "feedback-box danger" : "feedback-box";
}

function computeRhythm(scenario) {
  const s = state.settings;
  const p = scenario.physiology;
  if (effectiveMode(scenario) === "VVI") {
    const rSensed = Boolean(p.rWave && p.rWave >= s.vSense);
    const vs = Boolean(p.intrinsicVRate && p.intrinsicVRate >= s.lowerRate && rSensed);
    const vCapture = vs || !p.vThreshold || s.vOutput >= p.vThreshold;
    return {
      marker: vs ? "VVI-VS" : "VVI-VP",
      atrial: "NA",
      ventricular: vs ? "VS" : "VP",
      aCapture: true,
      vCapture,
      aSensed: false,
      vSensed: vs,
      description: vs ? "自己R波を感知" : "心室ペーシング主体",
      hasSelfIssue: !vs || !vCapture
    };
  }

  const aSensed = Boolean(p.sinusRate && p.sinusRate >= s.lowerRate && p.pWave && p.pWave >= s.aSense);
  const as = aSensed;
  const atrial = as ? "AS" : "AP";
  const aCapture = atrial === "AS" || !p.aThreshold || s.aOutput >= p.aThreshold;
  const av = atrial === "AS" ? s.sensedAv : s.pacedAv;
  const rSensed = Boolean(p.rWave && p.rWave >= s.vSense);
  const atrialEffective = atrial === "AS" || aCapture;
  const vs = Boolean(atrialEffective && p.avDelayNeeded && av >= p.avDelayNeeded && rSensed);
  const ventricular = vs ? "VS" : "VP";
  const vCapture = ventricular === "VS" || !p.vThreshold || s.vOutput >= p.vThreshold;
  return {
    marker: `${atrial}-${ventricular}`,
    atrial,
    ventricular,
    aCapture,
    vCapture,
    aSensed,
    vSensed: vs,
    description: `${atrial}後に${ventricular}`,
    hasSelfIssue: ventricular === "VP" || !aCapture || !vCapture
  };
}

function sensingStatus(scenario, rhythm) {
  if (effectiveMode(scenario) === "VVI") {
    return rhythm.vSensed ? "R sensed" : "R not sensed";
  }
  const a = rhythm.aSensed ? "P sensed" : "P not sensed";
  const v = rhythm.vSensed ? "R sensed" : "R not sensed";
  return `${a} / ${v}`;
}

function captureStatus(rhythm) {
  const a = rhythm.atrial === "AP" ? (rhythm.aCapture ? "A cap" : "A LOC") : "A self";
  const v = rhythm.ventricular === "VP" ? (rhythm.vCapture ? "V cap" : "V LOC") : "V self";
  return `${a} / ${v}`;
}

function ventricularSafetyWarning(scenario, rhythm = computeRhythm(scenario)) {
  if (!ventricularThresholdAsystoleRisk(scenario, rhythm)) return null;
  const context = state.activeTest?.chamber === "V" ? "V閾値測定中に" : "測定中でない状態でも";
  return {
    title: "警告：V捕捉消失・自己VSなし",
    body: `${context}VP捕捉が外れ、自己VS/逃拍が期待できないパターンです。心室停止となり脈圧消失を想定します。教育用表示では、直ちにV出力を安全域へ戻す判断を学習してください。`
  };
}

function ventricularThresholdAsystoleRisk(scenario, rhythm = computeRhythm(scenario)) {
  const p = scenario.physiology;
  return Boolean(
    p.vThreshold &&
    rhythm.ventricular === "VP" &&
    !rhythm.vCapture &&
    !intrinsicVentricularRescueAvailable(scenario)
  );
}

function intrinsicVentricularRescueAvailable(scenario) {
  const p = scenario.physiology;
  const s = state.settings;
  const rSensed = Boolean(p.rWave && p.rWave >= s.vSense);
  if (!rSensed) return false;
  if (effectiveMode(scenario) === "VVI") return Boolean(p.intrinsicVRate && p.intrinsicVRate > 0);
  return Boolean(p.avDelayNeeded);
}

function thresholdSweepText(chamber, threshold) {
  const above = (Math.ceil((threshold + 0.5) * 10) / 10).toFixed(1);
  const at = threshold.toFixed(1);
  const below = Math.max(0.1, threshold - 0.1).toFixed(1);
  return `${chamber}: ${above}V capture -> ${at}V capture -> ${below}V loss`;
}

function setFeedback(title, body) {
  state.feedback = { title, body };
}

function drawEcg(scenario, rhythm, phase = 0) {
  [
    { id: "ecgCanvas", minWidth: 760, defaultHeight: 380, compact: false },
    { id: "mobileEcgCanvas", minWidth: 520, defaultHeight: 190, compact: true }
  ].forEach((target) => {
    drawEcgCanvas(document.getElementById(target.id), scenario, rhythm, phase, target);
  });
}

function drawEcgCanvas(canvas, scenario, rhythm, phase = 0, options = {}) {
  if (!canvas) return;
  const rect = canvas.getBoundingClientRect();
  if (rect.width < 2 || rect.height < 2) return;
  const dpr = window.devicePixelRatio || 1;
  const width = Math.max(options.minWidth || 760, Math.floor(rect.width || 1200));
  const height = Math.floor(rect.height || options.defaultHeight || 380);
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);
  drawGrid(ctx, width, height);

  const layout = ecgLayout(height, options.compact);
  const baseline = layout.baseline;
  const rate = effectiveDisplayRate(scenario, rhythm);
  const beatWidth = Math.max(120, Math.min(330, 13500 / Math.max(40, rate)));
  const offset = phase * beatWidth;
  drawContinuousEcg(ctx, width, baseline, beatWidth, offset, rhythm, scenario, layout);
  drawPacingSpikesAndMarkers(ctx, width, baseline, beatWidth, offset, rhythm, layout);

  ctx.fillStyle = "rgba(241, 245, 249, 0.95)";
  ctx.font = layout.headerFont;
  ctx.fillText(`${effectiveMode(scenario)} / ${rhythm.marker}`, layout.textX, layout.titleY);
  ctx.fillStyle = rhythm.hasSelfIssue ? "#fbbf24" : "#67e8f9";
  ctx.font = layout.subFont;
  ctx.fillText(`${sensingStatus(scenario, rhythm)} / ${captureStatus(rhythm)}`, layout.textX, layout.statusY);
  if (state.activeTest) {
    ctx.fillStyle = "#a15c07";
    ctx.font = layout.subFont;
    ctx.fillText(`${state.activeTest.chamber} threshold sweep: capture -> loss boundary`, layout.textX, layout.testY);
    drawLossMarker(ctx, width - layout.lossWidth - 32, baseline, state.activeTest.chamber, layout);
  }
  const safety = ventricularSafetyWarning(scenario, rhythm);
  if (safety) {
    const now = performance.now();
    if (!ventricularSafetyStartedAt) ventricularSafetyStartedAt = now;
    if (now - ventricularSafetyStartedAt >= ECG_SAFETY_OVERLAY_DELAY_MS) {
      drawVentricularSafetyOverlay(ctx, width, layout);
    }
  } else {
    ventricularSafetyStartedAt = 0;
  }
  if (layout.footer) {
    ctx.fillStyle = "rgba(203, 213, 225, 0.76)";
    ctx.font = layout.noteFont;
    ctx.fillText("模式ECG + marker channel。実機表示とは異なります。", layout.textX, height - 16);
  }
}

function ecgLayout(height, compact = false) {
  if (compact) {
    return {
      compact: true,
      baseline: Math.max(82, Math.min(height - 56, height * 0.48)),
      amplitude: Math.max(38, Math.min(52, height * 0.28)),
      markerOffset: Math.max(42, Math.min(52, height * 0.29)),
      spikeTop: Math.max(28, height * 0.25),
      spikeBottom: Math.max(22, height * 0.17),
      lineWidth: 1.9,
      textX: 12,
      titleY: 21,
      statusY: 39,
      testY: 57,
      headerFont: "800 12px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
      subFont: "800 10px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
      noteFont: "10px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
      markerWidth: 38,
      locMarkerWidth: 52,
      markerHeight: 21,
      markerFont: "800 10px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
      markerTextY: 14,
      lossWidth: 106,
      lossHeight: 96,
      footer: false
    };
  }
  return {
    compact: false,
    baseline: Math.max(152, Math.min(height - 126, height * 0.46)),
    amplitude: 76,
    markerOffset: 88,
    spikeTop: 48,
    spikeBottom: 44,
    lineWidth: 2.2,
    textX: 18,
    titleY: 26,
    statusY: 48,
    testY: 70,
    headerFont: "800 15px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
    subFont: "800 13px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
    noteFont: "12px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
    markerWidth: 44,
    locMarkerWidth: 58,
    markerHeight: 25,
    markerFont: "800 12px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
    markerTextY: 17,
    lossWidth: 128,
    lossHeight: 126,
    footer: true
  };
}

function drawGrid(ctx, width, height) {
  ctx.fillStyle = "#071316";
  ctx.fillRect(0, 0, width, height);
  ctx.lineWidth = 1;
  for (let x = 0; x < width; x += 20) {
    ctx.strokeStyle = x % 100 === 0 ? "rgba(125, 211, 252, 0.20)" : "rgba(125, 211, 252, 0.08)";
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y < height; y += 20) {
    ctx.strokeStyle = y % 100 === 0 ? "rgba(125, 211, 252, 0.20)" : "rgba(125, 211, 252, 0.08)";
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
}

function gaussian(x, center, width, amplitude) {
  const z = (x - center) / width;
  return amplitude * Math.exp(-0.5 * z * z);
}

function ecgSignal(phase, beatIndex, rhythm, scenario) {
  const variability = Math.sin(beatIndex * 1.71) * 0.014;
  const pScale = Math.max(0.45, Math.min(1.2, (scenario.physiology.pWave || 1.2) / 2));
  const rScale = Math.max(0.65, Math.min(1.25, (scenario.physiology.rWave || 7) / 8));
  const baseline = Math.sin((phase + beatIndex * 0.09) * Math.PI * 2) * 0.012;
  let signal = baseline;

  // VVI モードでも患者本来の P 波（intrinsic atrial activity）は描画する
  // — デバイスが感知/ペーシングしないだけで、心房は活動を続けている
  const intrinsicAtrialActive = rhythm.atrial === "NA" &&
    scenario.physiology.sinusRate && scenario.physiology.pWave;

  if (rhythm.atrial === "AS" || intrinsicAtrialActive) {
    signal += gaussian(phase, 0.18 + variability, 0.030, 0.15 * pScale);
    signal -= gaussian(phase, 0.215, 0.020, 0.025 * pScale);
  }

  if (rhythm.atrial === "AP" && rhythm.aCapture) {
    signal += gaussian(phase, 0.20, 0.026, 0.10);
  }

  if (rhythm.ventricular === "VS") {
    signal += gaussian(phase, 0.365, 0.010, -0.20 * rScale);
    signal += gaussian(phase, 0.390, 0.012, 1.08 * rScale);
    signal += gaussian(phase, 0.420, 0.014, -0.36 * rScale);
    signal += gaussian(phase, 0.515, 0.055, 0.040);
    signal += gaussian(phase, 0.665 + variability * 0.5, 0.080, 0.32);
  }

  if (rhythm.ventricular === "VP" && rhythm.vCapture) {
    signal += gaussian(phase, 0.488, 0.016, 0.24);
    signal += gaussian(phase, 0.525, 0.032, -1.08);
    signal += gaussian(phase, 0.575, 0.052, -0.58);
    signal += gaussian(phase, 0.650, 0.068, 0.18);
    signal += gaussian(phase, 0.790, 0.110, 0.34);
  }

  return signal;
}

function drawContinuousEcg(ctx, width, baseline, beatWidth, offset, rhythm, scenario, layout) {
  const amplitude = layout.amplitude;
  ctx.save();
  const gradient = ctx.createLinearGradient(0, baseline - 100, 0, baseline + 90);
  gradient.addColorStop(0, "#f8fdff");
  gradient.addColorStop(0.55, "#b9f6ff");
  gradient.addColorStop(1, "#67e8f9");
  ctx.strokeStyle = gradient;
  ctx.shadowColor = "#67e8f9";
  ctx.shadowBlur = layout.compact ? 5 : 7;
  ctx.lineWidth = layout.lineWidth;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.beginPath();

  for (let x = 0; x <= width; x += 1) {
    const beatPosition = (x + offset - 22) / beatWidth;
    const beatIndex = Math.floor(beatPosition);
    const phase = ((beatPosition % 1) + 1) % 1;
    const y = baseline - ecgSignal(phase, beatIndex, rhythm, scenario) * amplitude;
    if (x === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }

  ctx.stroke();
  ctx.restore();
}

function drawPacingSpikesAndMarkers(ctx, width, baseline, beatWidth, offset, rhythm, layout) {
  for (let start = 22 - offset - beatWidth; start < width + beatWidth; start += beatWidth) {
    const atrialX = start + beatWidth * 0.18;
    const ventricularX = start + beatWidth * (rhythm.ventricular === "VP" ? 0.47 : 0.39);

    if (rhythm.atrial === "AP") drawSpike(ctx, atrialX, baseline, "#2dd4bf", layout);
    if (rhythm.ventricular === "VP") drawSpike(ctx, ventricularX - 8, baseline, "#fbbf24", layout);

    if (rhythm.atrial === "AS") drawMarker(ctx, atrialX, baseline + layout.markerOffset, "AS", "#7dd3fc", layout);
    if (rhythm.atrial === "AP") drawMarker(ctx, atrialX, baseline + layout.markerOffset, rhythm.aCapture ? "AP" : "A LOC", rhythm.aCapture ? "#2dd4bf" : "#f87171", layout);
    if (rhythm.ventricular === "VS") drawMarker(ctx, ventricularX, baseline + layout.markerOffset, "VS", "#7dd3fc", layout);
    if (rhythm.ventricular === "VP") drawMarker(ctx, ventricularX, baseline + layout.markerOffset, rhythm.vCapture ? "VP" : "V LOC", rhythm.vCapture ? "#fbbf24" : "#f87171", layout);
  }
}

function drawSpike(ctx, x, baseline, color, layout) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = layout.compact ? 1.6 : 2;
  ctx.beginPath();
  ctx.moveTo(x, baseline + layout.spikeBottom);
  ctx.lineTo(x, baseline - layout.spikeTop);
  ctx.stroke();
  ctx.restore();
}

function drawMarker(ctx, x, y, text, color, layout) {
  ctx.save();
  const markerWidth = text.length > 2 ? layout.locMarkerWidth : layout.markerWidth;
  ctx.fillStyle = color;
  ctx.fillRect(x - markerWidth / 2, y, markerWidth, layout.markerHeight);
  ctx.fillStyle = "#ffffff";
  ctx.font = layout.markerFont;
  ctx.textAlign = "center";
  ctx.fillText(text, x, y + layout.markerTextY);
  ctx.restore();
}

function drawLossMarker(ctx, x, baseline, chamber, layout) {
  ctx.save();
  ctx.strokeStyle = "#b42318";
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 4]);
  ctx.strokeRect(x, baseline - layout.lossHeight + 16, layout.lossWidth, layout.lossHeight);
  ctx.setLineDash([]);
  ctx.fillStyle = "#b42318";
  ctx.font = layout.subFont;
  ctx.fillText(`${chamber} LOC`, x + 12, baseline - layout.lossHeight + 38);
  ctx.fillStyle = "#667780";
  ctx.fillText("loss of capture", x + 12, baseline - layout.lossHeight + 58);
  ctx.restore();
}

function drawVentricularSafetyOverlay(ctx, width, layout) {
  ctx.save();
  const panelWidth = Math.min(layout.compact ? 300 : 390, width - (layout.compact ? 24 : 36));
  const panelHeight = layout.compact ? 48 : 58;
  const x = width - panelWidth - (layout.compact ? 12 : 18);
  const y = layout.compact ? 10 : 18;
  ctx.fillStyle = "rgba(127, 29, 29, 0.88)";
  ctx.fillRect(x, y, panelWidth, panelHeight);
  ctx.strokeStyle = "rgba(254, 202, 202, 0.95)";
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 1, y + 1, panelWidth - 2, panelHeight - 2);
  ctx.fillStyle = "#fff7ed";
  ctx.font = layout.compact
    ? "900 11px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    : "900 14px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif";
  ctx.fillText("WARNING: V LOC + NO INTRINSIC VS", x + 12, y + (layout.compact ? 19 : 23));
  ctx.font = layout.compact
    ? "800 11px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    : "800 13px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif";
  ctx.fillText("V出力を安全域へ戻す", x + 12, y + (layout.compact ? 36 : 43));
  ctx.restore();
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
