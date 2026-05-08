"use strict";

const STORAGE_KEY = "pacecheck-arena-v1";
const LEGACY_STORAGE_KEYS = ["pm-programmer-simulator-v1", "pm-programmer-que" + "st-v1"];

const SCENARIOS = [
  {
    id: "cavb-asvp-rwave-no-vs",
    title: "完全房室ブロック（CAVB） / AS-VP: V波高値が評価困難",
    disease: "完全房室ブロック",
    mode: "DDD",
    goal: "AS-VPでVリード波高値を確認したい。AV delayを延長しても自己R波が出ない状況を判断する。",
    teaching: "CAVBではAV delayを延長してもVSが出ないことがある。R波測定に進まず評価困難として記録し、必ず設定を戻す。",
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
    goal: "AP-VP主体。LR下げでAS誘発しP波測定、その後V閾値テストを行う。R波は引き出せないため無記録で終了。",
    teaching: "AP主体ではP波が見えない。LRを下げてASを出してから測定する。V閾値はVPで測り、R波が出ない症例は無記録で終了する判断を学ぶ。",
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
    title: "慢性AF + 依存 / VVI: V波高値評価困難",
    disease: "慢性AF + 高度AVB",
    mode: "VVI",
    goal: "VP完全依存で自己R波が出ない症例。V波高値は無記録で終了し、V閾値は慎重に測定する。",
    teaching: "慢性AFの完全依存例では自己R波を引き出せないことがある。LR下げで確認してから無記録で終了する判断を学ぶ。V閾値測定は復帰確認を厳守。",
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
    title: "房室接合部アブレーション後 / VVI-VP: V波高値評価困難",
    disease: "房室接合部アブレーション後",
    mode: "VVI",
    goal: "VVIでVP依存。自己R波は確認困難として記録し、V閾値を慎重に確認する。",
    teaching: "房室接合部アブレーション後は自己心室応答が乏しいことがある。R波確認を無理に続けず、V捕捉安全性を優先する。",
    settings: { lowerRate: 75, sensedAv: 0, pacedAv: 0, aOutput: 0, vOutput: 2.5, aSense: 0, vSense: 2.0 },
    physiology: { sinusRate: null, intrinsicVRate: 18, avDelayNeeded: null, pWave: null, rWave: null, aThreshold: null, vThreshold: 0.8, aImp: null, vImp: 570, events: "慢性AF / HVRなし" },
    route: ["safety", "interrogate", "markDifficult", "thresholdV", "restore"]
  }
];

const SCORE_MAX = 100;
const PASSING_SCORE = 90;
const STRICT_SCORE_EXPONENT = 1.6;
const WRONG_PENALTY_MULTIPLIER = 1.5;
const ECG_SAFETY_OVERLAY_DELAY_MS = 1200;
const COMPLETION_BONUS = 10;
const SCORE_HISTORY_KEY = "pacecheck-arena-history";

const COMMON_STEPS = {
  "confirm-no-vs": { label: "AV延長でVSが出ないことを確認", hint: "AV delayを延長し、自己R波が出ないことを観察します。", points: 10 },
  "create-vs-for-r": { label: "VSを出してR波測定条件を作る", hint: "VPからVSへ切り替え、R波が見える条件を作ります。", points: 10 },
  "create-as-for-p": { label: "ASを出してP波測定条件を作る", hint: "APからASへ切り替え、P波が見える条件を作ります。", points: 10 },
  "create-ap-for-a-threshold": { label: "APを出してA閾値条件を作る", hint: "ASからAPへ切り替え、A閾値テストの条件を作ります。", points: 8 },
  "create-vp-for-v-threshold": { label: "VPを出してV閾値条件を作る", hint: "VSからVPへ切り替え、V閾値テストの条件を作ります。", points: 8 },
  "start-a-threshold": { label: "A閾値テストを開始", hint: "AP表示中にA閾値テストを開始します。", points: 5, check: "aThreshold" },
  "find-a-loss": { label: "A出力を下げてLOCを確認", hint: "A出力を下げ、A LOCが出る境界を観察します。", points: 10 },
  "record-a-threshold": { label: "A閾値を記録", hint: "捕捉/脱落境界を確認してからA閾値を記録します。", points: 10, check: "aThreshold" },
  "start-v-threshold": { label: "V閾値テストを開始", hint: "VP表示中にV閾値テストを開始します。", points: 5, check: "vThreshold" },
  "find-v-loss": { label: "V出力を下げてLOCを確認", hint: "V出力を下げ、V LOCが出る境界を観察します。", points: 10 },
  "record-v-threshold": { label: "V閾値を記録", hint: "捕捉/脱落境界を確認してからV閾値を記録します。", points: 10, check: "vThreshold" },
  "record-p-wave": { label: "P波波高値を記録", hint: "AS表示中にAリード波高値を記録します。", points: 10, check: "pWave" },
  "record-r-wave": { label: "R波波高値を記録", hint: "VS表示中にVリード波高値を記録します。", points: 10, check: "rWave" },
  "record-r-difficult": { label: "V波高値を評価困難として記録", hint: "自己R波が出ないことを確認し、評価困難として記録します。", points: 10, check: "rDifficult" },
  "record-events": { label: "イベント情報を確認", hint: "イベントカウンタと保存EGMを確認します。", points: 8, check: "events" },
  "restore-settings": { label: "初期設定へ戻す", hint: "一時的に変更した設定を症例開始時の値へ戻します。", points: 5, check: "restore" }
};

const AUTO_STEP_IDS = [
  "confirm-no-vs",
  "create-vs-for-r",
  "create-as-for-p",
  "create-ap-for-a-threshold",
  "create-vp-for-v-threshold",
  "find-a-loss",
  "find-v-loss"
];

const SIMULATOR_PROFILES = {
  "cavb-asvp-rwave-no-vs": [
    { id: "confirm-no-vs", label: "AV延長でVSが出ないことを確認", hint: "SAVを延長し、AS-VPのまま自己R波が出ないことを観察します。", points: 10 },
    { id: "record-r-difficult", label: "V波高値を評価困難として記録", hint: "自己R波が出ないため、R波測定へ進まず評価困難を記録します。", points: 10, check: "rDifficult" },
    { id: "restore-settings", label: "初期設定へ戻す", hint: "一時的に変更した設定を症例開始時の値へ戻します。", points: 8, check: "restore" }
  ],
  "intermittent-avb-asvp-rwave": [
    { id: "create-vs-for-r", label: "VSを出してR波測定条件を作る", hint: "SAVを延長し、AS-VPからAS-VSへ切り替えます。", points: 10 },
    { id: "record-r-wave", label: "R波波高値を記録", hint: "VS表示中にVリード波高値を記録します。", points: 10, check: "rWave" },
    { id: "restore-settings", label: "初期設定へ戻す", hint: "測定後は一時設定を戻します。", points: 8, check: "restore" }
  ],
  "sss-apvs-pwave": [
    { id: "create-as-for-p", label: "ASを出してP波測定条件を作る", hint: "下限レートを下げ、APからASへ切り替えます。", points: 10 },
    { id: "record-p-wave", label: "P波波高値を記録", hint: "AS表示中にAリード波高値を記録します。", points: 10, check: "pWave" },
    { id: "restore-settings", label: "初期設定へ戻す", hint: "測定後は下限レートを戻します。", points: 8, check: "restore" }
  ],
  "ddd-asvs-v-threshold": [
    { id: "create-vp-for-v-threshold", label: "VPを出してV閾値条件を作る", hint: "SAVを短縮し、AS-VSからAS-VPへ切り替えます。", points: 8 },
    { id: "start-v-threshold", label: "V閾値テストを開始", hint: "VP表示中にV閾値テストを開始します。", points: 6, check: "vThreshold" },
    { id: "find-v-loss", label: "V出力を下げてLOCを確認", hint: "V出力を下げ、V LOCが出る境界を観察します。", points: 10 },
    { id: "record-v-threshold", label: "V閾値を記録", hint: "捕捉/脱落境界を確認してからV閾値を記録します。", points: 10, check: "vThreshold" },
    { id: "restore-settings", label: "初期設定へ戻す", hint: "測定後は出力とAV delayを戻します。", points: 8, check: "restore" }
  ],
  "sss-apvp-a-threshold": [
    { id: "start-a-threshold", label: "A閾値テストを開始", hint: "AP表示中にA閾値テストを開始します。", points: 6, check: "aThreshold" },
    { id: "find-a-loss", label: "A出力を下げてLOCを確認", hint: "A出力を下げ、A LOCが出る境界を観察します。", points: 10 },
    { id: "record-a-threshold", label: "A閾値を記録", hint: "捕捉/脱落境界を確認してからA閾値を記録します。", points: 10, check: "aThreshold" },
    { id: "restore-settings", label: "初期設定へ戻す", hint: "測定後は出力を戻します。", points: 8, check: "restore" }
  ],
  "brady-af-vvi-rwave": [
    { id: "create-vs-for-r", label: "VSを出してR波測定条件を作る", hint: "下限レートを自己心拍より下げ、VVI-VPからVVI-VSへ切り替えます。", points: 10 },
    { id: "record-r-wave", label: "R波波高値を記録", hint: "VVI-VS表示中にVリード波高値を記録します。", points: 10, check: "rWave" },
    { id: "restore-settings", label: "初期設定へ戻す", hint: "測定後は下限レートを戻します。", points: 8, check: "restore" }
  ],
  "tachy-brady-events": [
    { id: "record-p-wave", label: "P波波高値を記録", hint: "AS表示中にAリード波高値を記録します。", points: 10, check: "pWave" },
    { id: "record-events", label: "イベント情報を確認", hint: "洞不全症候群（徐脈頻脈型）ではMode Switchなどのイベントも確認します。", points: 8, check: "events" },
    { id: "restore-settings", label: "初期設定を確認", hint: "一時変更が残っていないことを確認します。", points: 8, check: "restore" }
  ],
  "ddd-apvp-v-threshold-dependent": [
    { id: "start-v-threshold", label: "V閾値テストを開始", hint: "依存疑いのため、VP表示を確認してからV閾値テストを開始します。", points: 6, check: "vThreshold" },
    { id: "find-v-loss", label: "V出力を慎重に下げてLOCを確認", hint: "V出力を下げ、V LOCが出る境界を観察します。", points: 10 },
    { id: "record-v-threshold", label: "V閾値を記録", hint: "捕捉/脱落境界を確認してからV閾値を記録します。", points: 10, check: "vThreshold" },
    { id: "restore-settings", label: "初期設定へ戻す", hint: "測定後は出力安全域と復帰を確認します。", points: 8, check: "restore" }
  ],
  "ddd-apvp-pwave-vthreshold": [
    { id: "create-as-for-p", label: "ASを出してP波測定条件を作る", hint: "下限レートを下げ、APからASへ切り替えます。", points: 8 },
    { id: "record-p-wave", label: "P波波高値を記録", hint: "AS表示中にAリード波高値を記録します。", points: 8, check: "pWave" },
    { id: "record-r-difficult", label: "V波高値は無記録で終了", hint: "自己R波が出ない症例と判断し、無記録で終了します。", points: 8, check: "rDifficult" },
    { id: "create-vp-for-v-threshold", label: "VPを出してV閾値条件を作る", hint: "下限レートを戻すかAV delayを短縮し、VP優位に戻します。", points: 6 },
    { id: "start-v-threshold", label: "V閾値テストを開始", hint: "VP表示中にV閾値テストを開始します。", points: 5, check: "vThreshold" },
    { id: "find-v-loss", label: "V出力を下げてLOCを確認", hint: "V出力を下げ、V LOCが出る境界を観察します。", points: 8 },
    { id: "record-v-threshold", label: "V閾値を記録", hint: "捕捉/脱落境界を確認してからV閾値を記録します。", points: 8, check: "vThreshold" },
    { id: "restore-settings", label: "初期設定へ戻す", hint: "測定後は下限レート・出力を戻します。", points: 6, check: "restore" }
  ],
  "vvi-vs-rwave-vthreshold": [
    { id: "record-r-wave", label: "R波波高値を記録", hint: "VVI-VS表示中にVリード波高値を記録します。", points: 10, check: "rWave" },
    { id: "create-vp-for-v-threshold", label: "VPを出してV閾値条件を作る", hint: "下限レートを上げ、VVI-VPへ切り替えます。", points: 8 },
    { id: "start-v-threshold", label: "V閾値テストを開始", hint: "VP表示中にV閾値テストを開始します。", points: 5, check: "vThreshold" },
    { id: "find-v-loss", label: "V出力を下げてLOCを確認", hint: "V出力を下げ、V LOCが出る境界を観察します。", points: 8 },
    { id: "record-v-threshold", label: "V閾値を記録", hint: "捕捉/脱落境界を確認してからV閾値を記録します。", points: 10, check: "vThreshold" },
    { id: "restore-settings", label: "初期設定へ戻す", hint: "測定後は下限レート・出力を戻します。", points: 8, check: "restore" }
  ],
  "afib-dependent-vvi-difficult": [
    { id: "record-r-difficult", label: "V波高値は無記録で終了", hint: "完全依存で自己R波が出ない症例と判断し、無記録で終了します。", points: 12, check: "rDifficult" },
    { id: "start-v-threshold", label: "V閾値テストを開始", hint: "VP表示中にV閾値テストを慎重に開始します。", points: 5, check: "vThreshold" },
    { id: "find-v-loss", label: "V出力を慎重に下げてLOCを確認", hint: "V出力を下げ、V LOCの境界を観察します。", points: 10 },
    { id: "record-v-threshold", label: "V閾値を記録", hint: "捕捉/脱落境界を確認してからV閾値を記録します。", points: 10, check: "vThreshold" },
    { id: "restore-settings", label: "初期設定へ戻す", hint: "測定後は出力安全域と復帰を厳守します。", points: 8, check: "restore" }
  ],
  "ddd-asvs-comprehensive": [
    { id: "record-p-wave", label: "P波波高値を記録", hint: "AS表示中にAリード波高値を記録します。", points: 6, check: "pWave" },
    { id: "record-r-wave", label: "R波波高値を記録", hint: "VS表示中にVリード波高値を記録します。", points: 6, check: "rWave" },
    { id: "create-ap-for-a-threshold", label: "APを出してA閾値条件を作る", hint: "下限レートを上げ、ASからAPへ切り替えます。", points: 5 },
    { id: "start-a-threshold", label: "A閾値テストを開始", hint: "AP表示中にA閾値テストを開始します。", points: 5, check: "aThreshold" },
    { id: "find-a-loss", label: "A出力を下げてLOCを確認", hint: "A出力を下げ、A LOCの境界を観察します。", points: 6 },
    { id: "record-a-threshold", label: "A閾値を記録", hint: "捕捉/脱落境界を確認してからA閾値を記録します。", points: 6, check: "aThreshold" },
    { id: "create-vp-for-v-threshold", label: "VPを出してV閾値条件を作る", hint: "AV delayを短縮し、VSからVPへ切り替えます。", points: 5 },
    { id: "start-v-threshold", label: "V閾値テストを開始", hint: "VP表示中にV閾値テストを開始します。", points: 5, check: "vThreshold" },
    { id: "find-v-loss", label: "V出力を下げてLOCを確認", hint: "V出力を下げ、V LOCの境界を観察します。", points: 6 },
    { id: "record-v-threshold", label: "V閾値を記録", hint: "捕捉/脱落境界を確認してからV閾値を記録します。", points: 6, check: "vThreshold" },
    { id: "restore-settings", label: "初期設定へ戻す", hint: "総合チェック後は全設定を初期値へ戻します。", points: 8, check: "restore" }
  ],
  "ddd-lead-impedance-alert": [
    { id: "record-p-wave", label: "P波波高値を記録", hint: "AS表示中にAリード波高値を記録します。", points: 6, check: "pWave" },
    { id: "create-vs-for-r", label: "VSを出してR波測定条件を作る", hint: "AV delayを延長してAS-VPからAS-VSへ切り替えます。", points: 6 },
    { id: "record-r-wave", label: "R波波高値を記録（低下に注目）", hint: "VS表示中にVリード波高値を記録。前回値からのトレンドを意識する。", points: 8, check: "rWave" },
    { id: "create-ap-for-a-threshold", label: "APを出してA閾値条件を作る", hint: "下限レートを上げ、AP誘発します。", points: 5 },
    { id: "start-a-threshold", label: "A閾値テストを開始", hint: "AP表示中にA閾値テストを開始します。", points: 3, check: "aThreshold" },
    { id: "find-a-loss", label: "A LOCを確認", hint: "A出力を下げ、捕捉/脱落の境界を確認します。", points: 5 },
    { id: "record-a-threshold", label: "A閾値を記録", hint: "捕捉/脱落境界を確認してからA閾値を記録します。", points: 6, check: "aThreshold" },
    { id: "start-v-threshold", label: "V閾値テストを開始", hint: "VP表示中にV閾値テストを開始します。閾値上昇に注意。", points: 3, check: "vThreshold" },
    { id: "find-v-loss", label: "V LOCを確認", hint: "V出力を下げ、捕捉/脱落の境界を確認します。", points: 6 },
    { id: "record-v-threshold", label: "V閾値を記録（上昇に注目）", hint: "閾値の上昇傾向を記録。リード抵抗とイベントを併せて評価する。", points: 6, check: "vThreshold" },
    { id: "record-events", label: "イベント情報を確認", hint: "高抵抗アラートと保存EGMを確認します。", points: 8, check: "events" },
    { id: "restore-settings", label: "初期設定へ戻す", hint: "総合チェック後は全設定を初期値へ戻します。", points: 6, check: "restore" }
  ],
  "sinus-arrest-apvs-comprehensive": [
    { id: "create-as-for-p", label: "ASを出してP波測定条件を作る", hint: "下限レートを下げ、AP-VSからAS-VSへ切り替えます。", points: 6 },
    { id: "record-p-wave", label: "P波波高値を記録", hint: "AS表示中にAリード波高値を記録します。", points: 6, check: "pWave" },
    { id: "record-r-wave", label: "R波波高値を記録", hint: "VS表示中にVリード波高値を記録します。", points: 6, check: "rWave" },
    { id: "create-ap-for-a-threshold", label: "APを出してA閾値条件を作る", hint: "下限レートを上げ、ASからAPへ戻します。", points: 5 },
    { id: "start-a-threshold", label: "A閾値テストを開始", hint: "AP表示中にA閾値テストを開始します。", points: 5, check: "aThreshold" },
    { id: "find-a-loss", label: "A LOCを確認", hint: "A出力を下げ、捕捉/脱落の境界を確認します。", points: 6 },
    { id: "record-a-threshold", label: "A閾値を記録", hint: "捕捉/脱落境界を確認してからA閾値を記録します。", points: 6, check: "aThreshold" },
    { id: "create-vp-for-v-threshold", label: "VPを出してV閾値条件を作る", hint: "PAVを短縮し、AP-VSからAP-VPへ切り替えます。", points: 5 },
    { id: "start-v-threshold", label: "V閾値テストを開始", hint: "VP表示中にV閾値テストを開始します。", points: 5, check: "vThreshold" },
    { id: "find-v-loss", label: "V LOCを確認", hint: "V出力を下げ、捕捉/脱落の境界を確認します。", points: 6 },
    { id: "record-v-threshold", label: "V閾値を記録", hint: "捕捉/脱落境界を確認してからV閾値を記録します。", points: 6, check: "vThreshold" },
    { id: "restore-settings", label: "初期設定へ戻す", hint: "下限レート、AV delay、出力を初期値へ戻します。", points: 6, check: "restore" }
  ],
  "high-grade-avb-asvp-intermittent": [
    { id: "record-p-wave", label: "P波波高値を記録", hint: "AS表示中にAリード波高値を記録します。", points: 5, check: "pWave" },
    { id: "create-vs-for-r", label: "VSを出してR波測定条件を作る", hint: "SAVを延長し、AS-VPからAS-VSへ切り替えます。", points: 8 },
    { id: "record-r-wave", label: "R波波高値を記録", hint: "VS表示中にVリード波高値を記録します。", points: 6, check: "rWave" },
    { id: "create-ap-for-a-threshold", label: "APを出してA閾値条件を作る", hint: "下限レートを上げ、ASからAPへ切り替えます。", points: 5 },
    { id: "start-a-threshold", label: "A閾値テストを開始", hint: "AP表示中にA閾値テストを開始します。", points: 5, check: "aThreshold" },
    { id: "find-a-loss", label: "A LOCを確認", hint: "A出力を下げ、捕捉/脱落の境界を確認します。", points: 6 },
    { id: "record-a-threshold", label: "A閾値を記録", hint: "捕捉/脱落境界を確認してからA閾値を記録します。", points: 6, check: "aThreshold" },
    { id: "start-v-threshold", label: "V閾値テストを開始", hint: "VP表示中にV閾値テストを開始します。", points: 5, check: "vThreshold" },
    { id: "find-v-loss", label: "V LOCを確認", hint: "V出力を下げ、捕捉/脱落の境界を確認します。", points: 6 },
    { id: "record-v-threshold", label: "V閾値を記録", hint: "捕捉/脱落境界を確認してからV閾値を記録します。", points: 6, check: "vThreshold" },
    { id: "restore-settings", label: "初期設定へ戻す", hint: "AV delay、下限レート、出力を初期値へ戻します。", points: 6, check: "restore" }
  ],
  "post-av-node-ablation-vvi-dependent": [
    { id: "record-r-difficult", label: "V波高値は評価困難として記録", hint: "自己R波が出ない症例と判断し、評価困難として記録します。", points: 10, check: "rDifficult" },
    { id: "start-v-threshold", label: "V閾値テストを開始", hint: "VP表示中にV閾値テストを慎重に開始します。", points: 6, check: "vThreshold" },
    { id: "find-v-loss", label: "V LOCを確認", hint: "V出力を下げ、捕捉/脱落の境界を確認します。", points: 10 },
    { id: "record-v-threshold", label: "V閾値を記録", hint: "捕捉/脱落境界を確認してからV閾値を記録します。", points: 10, check: "vThreshold" },
    { id: "restore-settings", label: "初期設定へ戻す", hint: "V出力安全域と下限レートを初期値へ戻します。", points: 8, check: "restore" }
  ]
};

const state = loadState();
let animationId = null;
let ecgPhase = 0;
let lastFrameTime = 0;
let ventricularSafetyStartedAt = 0;

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
      { key: "lowerRate", step: 1, min: 30, max: 120 },
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
      if (dddOnly.includes(action.control) && scenario.mode !== "DDD") return;
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
    settings: { ...scenario.settings },
    completed: [],
    measurements: {},
    activeTest: null,
    ecgSpeed: "normal",
    score: 0,
    mistakes: 0,
    combo: 0,
    runComplete: false,
    simulatorFlags: {},
    hintsEnabled: false,
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
      settings: { ...scenario.settings, ...(saved.settings || {}) },
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
  state.settings = { ...scenario.settings };
  state.completed = [];
  state.measurements = {};
  state.activeTest = null;
  state.ecgSpeed = state.ecgSpeed || "normal";
  state.score = 0;
  state.mistakes = 0;
  state.combo = 0;
  state.runComplete = false;
  state.simulatorFlags = {};
  state.hintsEnabled = state.hintsEnabled ?? false;
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
  populateScenarioSelect();
  render();
}

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
      ecgPhase = (ecgPhase + (delta / 1000) * (rate / 60) * speed) % 1;
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
  if (scenario.mode === "VVI") {
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
  renderSettings(scenario, rhythm);
  renderManualControls(scenario);
  renderSimulatorPanel(scenario);
  renderMeasurements(scenario);
  renderFeedback();
  renderScoreHistory();
  updateSpeedButtons();
  drawEcg(scenario, rhythm, ecgPhase);
}

function renderScoreHistory() {
  const panel = document.getElementById("historyPanel");
  if (!panel) return;
  const history = loadScoreHistory();
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
              <td><strong>${entry.score}</strong>/100</td>
              <td>${entry.mistakes}回</td>
              <td>${entry.score >= PASSING_SCORE ? '<span class="pill-ok">合格</span>' : '<span class="pill-fail">不合格</span>'}</td>
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
        renderScoreHistory();
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

  document.getElementById("telemetryMode").textContent = scenario.mode;
  document.getElementById("telemetryMarker").textContent = rhythm.marker;
  document.getElementById("telemetryRate").textContent = `${state.settings.lowerRate} ppm`;
  document.getElementById("telemetryAv").textContent = scenario.mode === "DDD"
    ? `S ${state.settings.sensedAv} / P ${state.settings.pacedAv} ms`
    : "-";
  document.getElementById("telemetrySensing").textContent = sensingStatus(scenario, rhythm);
  document.getElementById("telemetryCapture").textContent = safety ? "V LOC / VSなし" : captureStatus(rhythm);
}

function renderSettings(scenario, rhythm) {
  const s = state.settings;
  const rows = [
    ["作動", rhythm.marker],
    ["下限レート", `${s.lowerRate} ppm`],
    ["AV", scenario.mode === "DDD" ? `S ${s.sensedAv} / P ${s.pacedAv} ms` : "-"],
    ["出力", scenario.mode === "DDD" ? `A ${s.aOutput} / V ${s.vOutput} V` : `V ${s.vOutput} V`],
    ["感度", scenario.mode === "DDD" ? `A ${s.aSense} / V ${s.vSense} mV` : `V ${s.vSense} mV`]
  ];

  document.getElementById("settingsGrid").innerHTML = rows.map(([label, value]) => `
    <div class="setting-cell">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
    </div>
  `).join("");
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

  document.getElementById("simulatorPanel").innerHTML = `
    <div class="simulator-toolbar">
      <span>操作判定</span>
      <button class="hint-toggle ${hints ? "on" : ""}" type="button" data-hint-toggle>
        ヒント ${hints ? "ON" : "OFF"}
      </button>
    </div>
    <div class="score-strip">
      <div>
        <span>得点（100点満点）</span>
        <strong>${score.value}<small>/100点</small></strong>
      </div>
      <div class="${score.className}">
        <span>判定</span>
        <strong>${escapeHtml(score.label)}</strong>
        <small>${state.runComplete ? `合格基準 ${PASSING_SCORE}点` : `${PASSING_SCORE}点以上で合格`}</small>
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
    <div class="step-list">
      ${targets.map((target, index) => {
        const done = target.status === "done";
        const out = target.status === "out";
        const active = !state.runComplete && target.available && !done && target.id === nextTargetId(scenario);
        return `
          <div class="step-chip ${done ? "done" : ""} ${out ? "out" : ""} ${active ? "active" : ""}">
            <span>${done ? "OK" : out ? "外" : String(index + 1)}</span>
            <strong>${escapeHtml(target.label)}</strong>
            <small>${escapeHtml(targetStatusText(target))}</small>
          </div>
        `;
      }).join("")}
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

  document.querySelector("[data-hint-toggle]")?.addEventListener("click", () => {
    state.hintsEnabled = !state.hintsEnabled;
    saveState();
    render();
  });
}

function measurementTargets(scenario) {
  const p = scenario.physiology;
  return [
    {
      id: "pWave",
      label: "A波高値",
      available: Boolean(scenario.mode === "DDD" && p.pWave),
      status: scenario.mode === "DDD" && p.pWave ? (state.measurements.pWave ? "done" : "todo") : "out"
    },
    {
      id: "rWave",
      label: "V波高値",
      available: true,
      status: state.measurements.rWave || state.measurements.difficult ? "done" : "todo"
    },
    {
      id: "aThreshold",
      label: "A閾値",
      available: Boolean(scenario.mode === "DDD" && p.aThreshold),
      status: scenario.mode === "DDD" && p.aThreshold ? (state.measurements.aThreshold ? "done" : "todo") : "out"
    },
    {
      id: "vThreshold",
      label: "V閾値",
      available: Boolean(p.vThreshold),
      status: p.vThreshold ? (state.measurements.vThreshold ? "done" : "todo") : "out"
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
    { key: "lowerRate", label: "下限レート", unit: "ppm", min: 30, max: 120, step: 1, enabled: true, shortcutUp: "Q", shortcutDown: "A" },
    { key: "sensedAv", label: "SAV", unit: "ms", min: 80, max: 400, step: 10, enabled: scenario.mode === "DDD", shortcutUp: "W", shortcutDown: "S" },
    { key: "pacedAv", label: "PAV", unit: "ms", min: 80, max: 400, step: 10, enabled: scenario.mode === "DDD", shortcutUp: "E", shortcutDown: "D" },
    { key: "aOutput", label: "A出力", unit: "V", min: 0.1, max: 5.0, step: 0.1, enabled: scenario.mode === "DDD", shortcutUp: "R", shortcutDown: "F" },
    { key: "vOutput", label: "V出力", unit: "V", min: 0.1, max: 5.0, step: 0.1, enabled: true, shortcutUp: "T", shortcutDown: "G" },
    { key: "aSense", label: "A感度", unit: "mV", min: 0.1, max: 5.0, step: 0.1, enabled: scenario.mode === "DDD", shortcutUp: "Y", shortcutDown: "H" },
    { key: "vSense", label: "V感度", unit: "mV", min: 0.1, max: 5.0, step: 0.1, enabled: true, shortcutUp: "U", shortcutDown: "J" }
  ];
  const visibleControls = controls.filter((control) => control.enabled);

  document.getElementById("manualControls").innerHTML = `
    <div class="panel-heading compact">
      <div>
        <p class="eyebrow">Live Settings</p>
        <h2>手動操作</h2>
      </div>
    </div>
    ${visibleControls.map((control) => {
      const value = Number(state.settings[control.key] ?? 0);
      const hint = state.hintsEnabled ? controlHint(control.key, scenario, rhythm) : "ヒントOFF";
      return `
        <div class="control-row ${control.enabled ? "" : "disabled"} ${controlFocusClass(control.key, scenario, rhythm)}">
          <label for="control-${control.key}">
            <span>${escapeHtml(control.label)}</span>
          </label>
          <strong data-control-value="${control.key}">${escapeHtml(formatControlValue(value, control.unit))}</strong>
          <div class="stepper" aria-label="${escapeHtml(control.label)} step controls">
            <button type="button" aria-label="Increase ${escapeHtml(control.label)}" title="${control.shortcutUp ? `Increase (${control.shortcutUp})` : "Increase"}" data-step-control="${control.key}" data-step-direction="1" ${control.enabled ? "" : "disabled"}>${control.shortcutUp ? `<kbd class="shortcut-key">${escapeHtml(control.shortcutUp)}</kbd>` : ""}<span class="stepper-arrow">&#9650;</span></button>
            <button type="button" aria-label="Decrease ${escapeHtml(control.label)}" title="${control.shortcutDown ? `Decrease (${control.shortcutDown})` : "Decrease"}" data-step-control="${control.key}" data-step-direction="-1" ${control.enabled ? "" : "disabled"}>${control.shortcutDown ? `<kbd class="shortcut-key">${escapeHtml(control.shortcutDown)}</kbd>` : ""}<span class="stepper-arrow">&#9660;</span></button>
          </div>
          <input id="control-${control.key}" data-control="${control.key}" type="range" min="${control.min}" max="${control.max}" step="${control.step}" value="${value}" ${control.enabled ? "" : "disabled"}>
          <small class="control-hint">${escapeHtml(hint)}</small>
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
  if (valueNode) valueNode.textContent = formatControlValue(next, control.unit);

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
  renderSettings(scenario, rhythm);
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
    if (scenario.mode === "VVI" && rhythm.ventricular === "VP" && p.rWave) return "下げる: VP→VSでR波";
    if (scenario.mode === "VVI" && rhythm.ventricular === "VS" && p.vThreshold) return "上げる: VS→VPでV閾値";
    if (scenario.mode === "DDD" && rhythm.atrial === "AP" && p.pWave) return "下げる: AP→ASでP波";
    if (scenario.mode === "DDD" && rhythm.atrial === "AS" && p.aThreshold) return "上げる: AS→APでA閾値";
  }
  if (key === "sensedAv" && rhythm.atrial === "AS") {
    if (rhythm.ventricular === "VP" && p.rWave) return "延ばす: AS-VP→AS-VS";
    if (rhythm.ventricular === "VS" && p.vThreshold) return "短く: AS-VS→AS-VP";
  }
  if (key === "pacedAv" && rhythm.atrial === "AP") {
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
  if (rhythm.ventricular === "VP" && p.rWave) {
    if (scenario.mode === "VVI") {
      return "V波高値はVSで記録します。Lower Rateを自己心拍より下げ、VPからVSへ切り替えます。";
    }
    return "V波高値はVSで記録します。AV Delayを延ばす、またはLower Rateを下げてVPからVSへ切り替えます。";
  }
  if (rhythm.ventricular === "VS" && p.vThreshold) {
    return "R波は記録可能です。V閾値はVPを出してから、V出力を上下して捕捉/脱落を確認します。";
  }
  if (scenario.mode === "DDD" && rhythm.atrial === "AP" && p.pWave) {
    return "A波高値はASで記録します。Lower Rateを下げ、APからASへ切り替えます。";
  }
  if (scenario.mode === "DDD" && rhythm.atrial === "AS" && p.aThreshold) {
    return "P波は記録可能です。A閾値はAPを出してから、A出力を上下して捕捉/脱落を確認します。";
  }
  return "Markerを見ながら、波高値は自己波、閾値はペーシングが出る条件を作ります。";
}

function renderMeasurements(scenario) {
  const rhythm = computeRhythm(scenario);
  const checks = directChecks(scenario, rhythm);
  document.getElementById("measurementGrid").innerHTML = `
    <div class="condition-box">
      <strong>${escapeHtml(rhythm.marker)}</strong>
      <p>${escapeHtml(state.hintsEnabled ? directGoalText(scenario, rhythm) : "測定条件を満たした項目から記録します。ヒントOFF中は具体的な操作手順を伏せています。")}</p>
    </div>
    ${checks.map((check) => `
      <div class="measurement-item ${check.ready ? "ready" : ""} ${check.available ? "" : "disabled"}">
        <div>
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
    `).join("")}
    <div class="end-actions">
      <button class="restore-button" type="button" data-check="restore" ${state.runComplete ? "disabled" : ""}>初期設定へ戻す</button>
      <button class="end-test-button" type="button" data-check="end" ${state.runComplete ? "disabled" : ""}>テスト終了</button>
    </div>
  `;

  document.querySelectorAll("[data-check]").forEach((button) => {
    button.addEventListener("click", () => performDirectCheck(button.dataset.check));
  });
}

function directChecks(scenario, rhythm) {
  const m = state.measurements;
  const p = scenario.physiology;
  const aActive = state.activeTest?.chamber === "A";
  const vActive = state.activeTest?.chamber === "V";
  const checks = [
    {
      id: "pWave",
      label: "A波高値",
      value: m.pWave ? `${m.pWave} mV` : "未測定",
      available: Boolean(p.pWave && scenario.mode === "DDD"),
      ready: Boolean(p.pWave && scenario.mode === "DDD" && rhythm.atrial === "AS"),
      hint: p.pWave
        ? (rhythm.atrial === "AS" ? "AS表示中。P波を記録できます。" : "Lower Rateを下げてASを出します。")
        : "Aリード評価なし",
      actionLabel: "記録"
    },
    {
      id: "rWave",
      label: "V波高値",
      value: m.rWave ? `${m.rWave} mV` : (m.difficult || "未測定"),
      available: !(m.rWave || m.difficult),
      ready: Boolean(p.rWave && rhythm.ventricular === "VS"),
      hint: rhythm.ventricular === "VS"
        ? "VS表示中。R波を記録できます。自己R波が出ない場合は無記録で終了を選択します。"
        : "VP中。LRLを下げる/AV Delayを延ばしてVSを誘発するか、出ないと判断したら無記録で終了します。",
      actionLabel: "R波を記録",
      extraActions: [
        { id: "rDifficult", label: "無記録で終了", variant: "secondary" }
      ]
    },
    {
      id: "aThreshold",
      label: "A閾値",
      value: m.aThreshold ? `${m.aThreshold} V` : (aActive ? "スイープ中" : "未測定"),
      available: Boolean(p.aThreshold && scenario.mode === "DDD"),
      ready: Boolean(p.aThreshold && scenario.mode === "DDD" && rhythm.atrial === "AP"),
      hint: p.aThreshold
        ? thresholdHint("A", rhythm.atrial === "AP", state.settings.aOutput, p.aThreshold, aActive, "Lower Rateを上げてAPを出します。")
        : "A閾値評価なし",
      actionLabel: aActive ? "閾値記録" : "開始"
    },
    {
      id: "vThreshold",
      label: "V閾値",
      value: m.vThreshold ? `${m.vThreshold} V` : (vActive ? "スイープ中" : "未測定"),
      available: Boolean(p.vThreshold),
      ready: Boolean(p.vThreshold && rhythm.ventricular === "VP"),
      hint: p.vThreshold
        ? thresholdHint("V", rhythm.ventricular === "VP", state.settings.vOutput, p.vThreshold, vActive, "VS中。LRLを上げる、またはAV Delayを短くしてVPを出します。")
        : "V閾値評価なし",
      actionLabel: vActive ? "閾値記録" : "開始"
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
    state.settings = { ...scenario.settings };
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

  if (checkId === "pWave" && scenario.mode === "DDD" && rhythm.atrial === "AS" && p.pWave) {
    state.measurements.pWave = p.pWave;
    completeSimulatorStep("record-p-wave", "A波高値 正解", `P波 ${p.pWave} mV を記録しました。A感度 ${state.settings.aSense} mV との余裕を確認してください。`);
  } else if (checkId === "rWave" && rhythm.ventricular === "VS" && p.rWave) {
    state.measurements.rWave = p.rWave;
    completeSimulatorStep("record-r-wave", "V波高値 正解", `R波 ${p.rWave} mV を記録しました。V感度 ${state.settings.vSense} mV との余裕を確認してください。`);
  } else if (checkId === "rDifficult" && !p.rWave) {
    state.measurements.difficult = "評価困難";
    const body = isStepDone("confirm-no-vs")
      ? "AV delay延長後も自己R波が出ないため、V波高値は評価困難として記録しました。"
      : "自己R波が出ない症例と判断し、無記録で終了しました。AV delay延長で確認するとさらに確実です。";
    completeSimulatorStep("record-r-difficult", "無記録で終了 正解", body);
  } else if (checkId === "rDifficult" && p.rWave) {
    penalize(
      "誤判定",
      state.hintsEnabled
        ? "この症例は自己R波が観察可能です。VSを誘発してR波を記録してください。"
        : "判断が早すぎます。ECGとMarkerを見直してください。",
      10
    );
  } else if (checkId === "events" && scenario.route.includes("readEvents") && p.events) {
    state.measurements.events = p.events;
    completeSimulatorStep("record-events", "イベント確認 正解", `イベント情報: ${p.events}。カウンタだけでなく保存EGMを確認する想定です。`);
  } else if (checkId === "aThreshold" && !state.activeTest && scenario.mode === "DDD" && rhythm.atrial === "AP" && rhythm.aCapture && p.aThreshold) {
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
      scenario.mode === "DDD" &&
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
  const value = scaledScoreValue(state.score || 0, scenario);
  const complete = Boolean(state.runComplete);
  const passed = complete && value >= PASSING_SCORE;
  return {
    value,
    label: complete ? (passed ? "合格" : "不合格") : "採点中",
    className: complete ? (passed ? "score-pass" : "score-fail") : "score-pending"
  };
}

function scaledScoreValue(rawPoints, scenario) {
  const maxPoints = Math.max(1, simulatorMaxPoints(scenario));
  if (rawPoints <= 0) {
    const negativeScaled = Math.round((rawPoints / maxPoints) * SCORE_MAX);
    return Object.is(negativeScaled, -0) ? 0 : negativeScaled;
  }
  const ratio = Math.min(1, rawPoints / maxPoints);
  const scaled = Math.round(Math.pow(ratio, STRICT_SCORE_EXPONENT) * SCORE_MAX);
  const capped = Math.min(SCORE_MAX, scaled);
  return Object.is(capped, -0) ? 0 : capped;
}

function formatScoreDelta(rawDelta, scenario, rawScoreAfter = state.score || 0) {
  const scaled = scaledDeltaValue(rawDelta || 0, scenario, rawScoreAfter);
  if (scaled > 0) return `+${scaled}`;
  return String(scaled);
}

function scaledDeltaValue(rawDelta, scenario, rawScoreAfter = state.score || 0) {
  if (!rawDelta) return 0;
  const after = scaledScoreValue(rawScoreAfter, scenario);
  const before = scaledScoreValue(rawScoreAfter - rawDelta, scenario);
  const scaled = after - before;
  // When the displayed score is capped (raw is at/above maxPoints),
  // surface the raw delta so penalties remain visible to the user.
  if (scaled === 0) return rawDelta;
  return scaled;
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
    if (scenario.mode === "DDD" && rhythm.atrial !== "AS") return scoringStep(scenario, "create-as-for-p");
    return scoringStep(scenario, "record-p-wave");
  }
  if (nextTarget === "rWave") {
    if (!p.rWave) {
      if (scenario.mode === "DDD" && !isStepDone("confirm-no-vs")) return scoringStep(scenario, "confirm-no-vs");
      return scoringStep(scenario, "record-r-difficult");
    }
    if (rhythm.ventricular !== "VS") return scoringStep(scenario, "create-vs-for-r");
    return scoringStep(scenario, "record-r-wave");
  }
  if (nextTarget === "aThreshold") {
    if (!state.activeTest && rhythm.atrial !== "AP") return scoringStep(scenario, "create-ap-for-a-threshold");
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

  // Incomplete measurements: apply penalty every time and allow the user to resume the test.
  if (!measurementsDone) {
    state.score = (state.score || 0) - 10;
    state.mistakes = (state.mistakes || 0) + 1;
    setJudge(
      "wrong",
      "未完了項目あり：終了不可",
      "未完了の測定があります（-10点）。残りのチェックを完了してから終了してください。",
      -10,
      false
    );
    setFeedback(
      "未完了項目あり：再開してください",
      "未完了の測定があるため、テストは終了されませんでした（-10点）。残りのチェックを完了してから「テスト終了」を押してください。"
    );
    return;
  }

  // All measurements complete — finalize.
  let penalty = 0;
  const notes = [];
  if (!restored) {
    penalty += 10;
    notes.push("設定が初期値へ戻されていません（-10点）。実臨床では必ず設定を戻してください。");
  }
  if (penalty > 0) {
    state.score = (state.score || 0) - penalty;
    state.mistakes = (state.mistakes || 0) + 1;
  }

  state.runComplete = true;
  state.activeTest = null;
  // Only award the completion bonus when finished cleanly (no end-time penalties).
  const bonus = penalty > 0 ? 0 : COMPLETION_BONUS;
  state.score = (state.score || 0) + bonus;
  state.combo = (state.combo || 0) + 1;

  const score = scoreSummary(scenario);
  const resultTitle = `完了：${score.label}`;
  const noteText = notes.length ? notes.join(" / ") : "全項目を適切に終了しました。";
  const resultBody = `${noteText} 最終得点は${score.value}/100点です。合格基準は${PASSING_SCORE}点です。`;
  setJudge("correct", resultTitle, resultBody, bonus - penalty, false);
  setFeedback(resultTitle, resultBody);
  saveScoreHistory(scenario.id, scenario.title, score.value, state.mistakes || 0);
}

function saveScoreHistory(scenarioId, scenarioTitle, scoreValue, mistakes) {
  try {
    const history = JSON.parse(localStorage.getItem(SCORE_HISTORY_KEY) || "[]");
    history.unshift({
      scenarioId,
      title: scenarioTitle,
      score: scoreValue,
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

function penalize(title, body, amount = 10) {
  const strictAmount = Math.max(1, Math.round(amount * WRONG_PENALTY_MULTIPLIER));
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
    return Boolean(before && before.atrial !== "AS" && scenario.mode === "DDD" && p.pWave && rhythm.atrial === "AS");
  }
  if (stepId === "create-ap-for-a-threshold") {
    return Boolean(before && before.atrial !== "AP" && scenario.mode === "DDD" && p.aThreshold && rhythm.atrial === "AP" && rhythm.aCapture);
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
    "create-vp-for-v-threshold": "作動変更 正解",
    "find-v-loss": "V LOC確認 正解",
    "find-a-loss": "A LOC確認 正解",
    "restore-settings": "設定復帰 正解"
  };
  return titles[stepId] || "正解";
}

function settingsRestored(scenario) {
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

  // Steps that require no setting change at all (record / start measurement steps)
  if (guide && guide.unnecessary) {
    penalize("不要な設定変更です", state.hintsEnabled ? `現在の工程は「${step.label}」です。${step.hint}` : "現在の工程では設定変更は不要です。測定操作を行ってください。", 10);
    return;
  }

  // Restore-settings step: penalize moves AWAY from original, allow moves TOWARD original
  if (guide && guide.restore) {
    const target = Number(scenario.settings[key]);
    if (Number.isFinite(target)) {
      const beforeDist = Math.abs(beforeValue - target);
      const afterDist = Math.abs(nextValue - target);
      if (afterDist > beforeDist) {
        penalize("初期設定から遠ざかっています", state.hintsEnabled ? `現在の工程は「${step.label}」です。設定を初期値に戻してください。` : "初期設定から遠ざかる操作です。設定を元に戻してください。", 10);
        return;
      }
    }
    return;
  }

  if (!guide) return;

  if (!guide.keys.includes(key)) {
    penalize("操作が目的とずれています", state.hintsEnabled ? `現在の工程は「${step.label}」です。${step.hint}` : "現在のチェック条件にはつながりにくい操作です。Markerの変化を確認してください。", 10);
    return;
  }
  if (guide.direction && direction !== guide.direction) {
    penalize("操作方向が逆です", state.hintsEnabled ? `${controlLabel(key)} は ${guide.direction > 0 ? "上げる" : "下げる"} 方向で確認します。${step.hint}` : "目的のMarker変化から遠ざかる方向です。ECGとMarkerを見直してください。", 10);
    return;
  }

  setJudge("info", "方向OK", state.hintsEnabled ? `${controlLabel(key)} の方向は合っています。Markerが目的の状態に変わるまで調整してください。` : "目的のMarker変化に近づいています。", 0, true);
  setFeedback("方向OK", state.hintsEnabled ? `${controlLabel(key)} の方向は合っています。Markerが目的の状態に変わるまで調整してください。` : "目的のMarker変化に近づいています。");
}

function markSettingMilestones(key, beforeValue, nextValue, rhythm, scenario) {
  const avKeys = ["sensedAv", "pacedAv"];
  if (!avKeys.includes(key)) return;
  if (nextValue > beforeValue && nextValue >= 280 && rhythm.ventricular === "VP" && !scenario.physiology.rWave) {
    state.simulatorFlags.noVsConfirmed = true;
  }
}

function settingGuidanceForStep(stepId, scenario, beforeRhythm) {
  if (stepId === "confirm-no-vs") return { keys: ["sensedAv"], direction: 1 };
  if (stepId === "create-vs-for-r") {
    if (scenario.mode === "VVI") return { keys: ["lowerRate"], direction: -1 };
    return beforeRhythm?.atrial === "AP"
      ? { keys: ["lowerRate"], direction: -1 }
      : { keys: ["sensedAv"], direction: 1 };
  }
  if (stepId === "create-as-for-p") return { keys: ["lowerRate"], direction: -1 };
  if (stepId === "create-ap-for-a-threshold") return { keys: ["lowerRate"], direction: 1 };
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
  if (checkId === "rDifficult") return "評価困難は、AV delay延長などで自己R波が出ないことを確認してから記録します。";
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
  if (scenario.mode === "VVI") {
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
  if (scenario.mode === "VVI") {
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
  if (scenario.mode === "VVI") return Boolean(p.intrinsicVRate && p.intrinsicVRate > 0);
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
  ctx.fillText(`${scenario.mode} / ${rhythm.marker}`, layout.textX, layout.titleY);
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

  if (rhythm.atrial === "AS") {
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
