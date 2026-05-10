"use strict";

const STORAGE_KEY = "pacecheck-studio-v1";
const LEGACY_STORAGE_KEY = "pm-check-education-tool-v1";

const DEFAULT_STANDARDS = {
  pWaveMin: 1.0,
  rWaveMin: 5.0,
  aThresholdMax: 1.5,
  vThresholdMax: 1.5,
  impedanceMin: 200,
  impedanceMax: 1500
};

const DISEASES = {
  sickSinus: {
    name: "洞不全症候群",
    recommendedModes: ["DDD / DDDR", "必要時 VVI"],
    short: "洞結節機能低下が主体。心房のセンシング・ペーシングと、AV伝導の残存を分けて見る。",
    focus: [
      "P波波高値とAリード閾値",
      "心房ペーシング率と自己心房波の有無",
      "AV伝導の残存、Vペーシング率",
      "心房性不整脈イベント、モードスイッチ",
      "症状とレートレスポンスの整合"
    ],
    pitfalls: [
      "心室だけを見てAリード評価を後回しにする",
      "自己脈確認時にAV伝導の評価を忘れる",
      "AFイベントとモードスイッチ設定を見落とす"
    ],
    extraSteps: [
      {
        id: "disease-snd-atrial-rhythm",
        title: "心房リズムと洞機能を確認",
        detail: "心房ペーシング率、自己P波、休止、心房性頻拍イベントを確認する。",
        caution: "症状がある場合はヒストグラムと問診内容を合わせて確認する。"
      },
      {
        id: "disease-snd-av-conduction",
        title: "AV伝導とVペーシング率を確認",
        detail: "DDDでは心房ペーシング後のAV伝導、Vペーシング率、AV delay設定を確認する。",
        caution: "不必要なVペーシング増加が疑われる場合は指導者に相談する。"
      }
    ]
  },
  cavb: {
    name: "完全房室ブロック（CAVB）",
    recommendedModes: ["DDD / DDDR", "症例により VVI"],
    short: "房室伝導が高度に障害される。DDDではAS-VP/AP-VPになりやすく、Vリード安全性と自己R波の有無を分けて考える。",
    focus: [
      "ペースメーカー依存度と逃逸調律の有無",
      "V捕捉閾値、R波波高値、Vリード抵抗",
      "AS-VP/AP-VP時の自己R波確認ロジック",
      "AV delay変更後の元設定復帰",
      "Vペーシング率と症状の対応"
    ],
    pitfalls: [
      "AS-VPを見てR波波高値が十分評価できていると誤解する",
      "依存例で自己R波確認を無理に進める",
      "延長したAV delayを検査後に戻し忘れる"
    ],
    extraSteps: [
      {
        id: "disease-cavb-dependency",
        title: "CAVBの依存度を先に確認",
        detail: "自己心室応答、逃逸調律、症状、血圧を確認し、検査中の安全域を整理する。",
        caution: "依存あり、依存疑いでは指導者立ち会いと施設手順を優先する。"
      },
      {
        id: "disease-cavb-rwave-logic",
        title: "AS-VP/AP-VP時のR波確認ロジックを確認",
        detail: "V波高値は自己R波を拾って評価するため、必要時はAV delay調整でVSが出るかを確認する。",
        caution: "自己R波が出ない場合は無理に継続せず、評価困難として記録し元設定に戻す。"
      }
    ]
  },
  avBlock: {
    name: "房室ブロック",
    recommendedModes: ["DDD / DDDR", "症例により VVI"],
    short: "AV伝導障害が主体。自己心室応答の有無、Vリード安全性、ペースメーカー依存度を重点的に見る。",
    focus: [
      "自己脈とペースメーカー依存度",
      "V閾値、R波、Vリード抵抗",
      "Vペーシング率",
      "DDDではP波追従、上限レート、AV delay",
      "設定変更後の最終復帰確認"
    ],
    pitfalls: [
      "依存例で不用意に出力低下試験を進める",
      "R波が小さい時に感度設定の確認を忘れる",
      "最終設定が検査用のまま残る"
    ],
    extraSteps: [
      {
        id: "disease-avb-dependency",
        title: "自己心室応答と依存度を確認",
        detail: "基礎心拍、逃逸調律、症状、血圧を確認しながら自己脈の有無を評価する。",
        caution: "依存あり、依存疑いでは必ず施設手順と指導者確認を優先する。"
      },
      {
        id: "disease-avb-tracking",
        title: "DDD追従設定を確認",
        detail: "P波追従、上限トラッキングレート、AV delay、PMT関連設定を確認する。",
        caution: "頻拍イベントがある場合は追従挙動とモードスイッチ記録を合わせて見る。"
      }
    ]
  },
  bradyAf: {
    name: "徐脈性心房細動",
    recommendedModes: ["VVI / VVIR"],
    short: "心房同期を使わないVVI系が中心。Vリードと心室レート管理を重点的に確認する。",
    focus: [
      "R波波高値とVリード閾値",
      "Vリード抵抗",
      "下限レート、レートレスポンス",
      "心室ペーシング率とヒストグラム",
      "高頻度心室イベント"
    ],
    pitfalls: [
      "AFなのでP波評価をしようとして混乱する",
      "レートレスポンスの有無を見落とす",
      "自己脈確認と依存度確認を分けて記録しない"
    ],
    extraSteps: [
      {
        id: "disease-af-v-rate",
        title: "心室レート分布を確認",
        detail: "下限レート、ヒストグラム、Vペーシング率、頻拍イベントを確認する。",
        caution: "息切れや易疲労感がある場合はレートレスポンス設定も確認する。"
      },
      {
        id: "disease-af-v-lead",
        title: "Vリード安全性を優先確認",
        detail: "Vリード抵抗、R波、V閾値、出力設定の安全域を確認する。",
        caution: "依存例では閾値測定中の捕捉脱落に注意する。"
      }
    ]
  },
  tachyBrady: {
    name: "洞不全症候群（徐脈頻脈型）",
    recommendedModes: ["DDD / DDDR"],
    short: "洞不全症候群の一型。洞機能低下に心房細動・心房粗動・心房頻拍などが併存し、徐脈補助と心房イベント評価を両方見る。",
    focus: [
      "心房性頻拍・AF burden",
      "モードスイッチ記録",
      "P波、A閾値、Aリード抵抗",
      "Vペーシング率",
      "症状とイベント時刻の対応"
    ],
    pitfalls: [
      "独立疾患として扱い、洞不全症候群との関係を見落とす",
      "閾値測定だけでイベント確認を終える",
      "モードスイッチ回数と持続時間を混同する",
      "症状の時刻とデバイス記録を照合しない"
    ],
    extraSteps: [
      {
        id: "disease-tbs-mode-switch",
        title: "モードスイッチとAF burdenを確認",
        detail: "心房性不整脈の回数、持続時間、最大心房レート、症状時刻との対応を確認する。",
        caution: "抗頻拍治療や薬剤判断は医師確認につなぐ。"
      },
      {
        id: "disease-tbs-atrial-lead",
        title: "心房リード評価を丁寧に実施",
        detail: "P波、A閾値、Aリード抵抗を確認し、心房イベント記録の信頼性も考える。",
        caution: "心房波高が低い場合、イベント検出の過小評価に注意する。"
      }
    ]
  },
  sinusArrest: {
    name: "洞不全症候群（洞停止・洞房ブロック型）",
    recommendedModes: ["DDD / DDDR", "AAI系は症例限定"],
    short: "洞性徐脈、洞停止、洞房ブロックが主体。AP主体になりやすく、自己P波の有無、Aリード評価、AV伝導の残存を分けて見る。",
    focus: [
      "自己P波の有無とP波波高値",
      "A捕捉閾値とAリード抵抗",
      "AP率、休止イベント、ヒストグラム",
      "AV伝導残存とVペーシング率",
      "症状と徐脈・休止時刻の対応"
    ],
    pitfalls: [
      "APが出ている状態でP波波高値を評価したつもりになる",
      "洞停止イベントとAF停止後ポーズを同じ扱いにする",
      "A閾値評価時に心房捕捉の確認方法を曖昧にする"
    ],
    extraSteps: [
      {
        id: "disease-sinus-arrest-self-p",
        title: "自己P波が出る条件を確認",
        detail: "下限レート調整や一時設定でASが出るかを観察し、P波波高値を評価できる条件を作る。",
        caution: "症状や長い休止が懸念される場合は無理に自己波確認を続けない。"
      },
      {
        id: "disease-sinus-arrest-a-capture",
        title: "Aリード捕捉と洞機能を分けて確認",
        detail: "A閾値、Aリード抵抗、AP率、休止イベントを分けて記録する。",
        caution: "心房捕捉は体表ECGだけで分かりにくい場合があるためEGMも確認する。"
      }
    ]
  },
  highGradeAvBlock: {
    name: "高度房室ブロック（2:1・Mobitz II含む）",
    recommendedModes: ["DDD / DDDR", "症例により VVI"],
    short: "房室伝導が不安定、または高度に障害される。AS-VPとAS-VSが混在することがあり、V波高値評価とV閾値評価を条件分けして見る。",
    focus: [
      "自己心室応答とペースメーカー依存度",
      "V波高値、V捕捉閾値、Vリード抵抗",
      "AS-VP/AS-VSの混在とAV delay",
      "Vペーシング率と症状",
      "最終設定復帰"
    ],
    pitfalls: [
      "たまたまVSが出た場面だけで依存なしと判断する",
      "間欠的なVSと融合波形を混同する",
      "AV delay延長後の戻し忘れ"
    ],
    extraSteps: [
      {
        id: "disease-high-grade-avb-pattern",
        title: "AS-VP/AS-VSの混在を確認",
        detail: "現在の駆動、AV delay、自己PR/AV間隔、Vペーシング率を合わせて確認する。",
        caution: "伝導が間欠的な症例では短時間観察だけで判断しない。"
      },
      {
        id: "disease-high-grade-avb-v-lead",
        title: "Vリード安全性を優先確認",
        detail: "V波高値、V閾値、Vリード抵抗、前回値との差をセットで確認する。",
        caution: "依存疑いではV閾値測定中の捕捉脱落に注意する。"
      }
    ]
  },
  postAvNodeAblation: {
    name: "房室接合部アブレーション後",
    recommendedModes: ["VVI / VVIR", "CRT-P/CRT-D症例あり"],
    short: "心房細動に対する房室接合部アブレーション後は、自己心室応答が乏しくVペーシング依存になりやすい。V閾値と設定復帰を特に慎重に見る。",
    focus: [
      "ペースメーカー依存度",
      "V捕捉閾値と出力安全域",
      "R波波高値が評価困難な場合の記録",
      "Vリード抵抗",
      "レート設定、レートレスポンス、症状"
    ],
    pitfalls: [
      "自己R波確認を無理に続ける",
      "V閾値測定後に出力安全域を戻し忘れる",
      "レート設定と症状の対応を見落とす"
    ],
    extraSteps: [
      {
        id: "disease-avna-dependency",
        title: "依存度とバックアップを先に確認",
        detail: "自己心室応答が乏しい前提で、監視体制、出力、バックアップ設定を確認する。",
        caution: "V捕捉脱落の影響が大きいため、指導者確認を優先する。"
      },
      {
        id: "disease-avna-rate",
        title: "レート設定と症状を確認",
        detail: "下限レート、レートレスポンス、ヒストグラム、息切れ・易疲労感を照合する。",
        caution: "単に閾値だけでなく、生活時レートの妥当性も確認する。"
      }
    ]
  }
};

const MODES = {
  VVI: {
    name: "VVI / VVIR",
    short: "心室をセンシングし、必要時に心室ペーシングする。心房同期は使わない。",
    checks: [
      "Vリード抵抗",
      "R波波高値",
      "V捕捉閾値",
      "自己心室応答",
      "Vペーシング率",
      "レートレスポンス"
    ],
    steps: [
      {
        id: "vvi-identify",
        title: "デバイス照合と現在設定の保存",
        detail: "患者、機種、モード、下限レート、出力、感度、前回値を確認する。",
        caution: "検査前の設定画面を記録しておく。"
      },
      {
        id: "vvi-battery",
        title: "電池状態とアラートを確認",
        detail: "推定寿命、ERI/RRT表示、アラート、リモートモニタリング通知を確認する。",
        caution: "電池表示はメーカーごとに用語が異なる。"
      },
      {
        id: "vvi-impedance",
        title: "Vリード抵抗を確認",
        detail: "前回値との差、急な上昇・低下、アラート履歴を確認する。",
        caution: "単回値だけでなくトレンドを確認する。"
      },
      {
        id: "vvi-sensing",
        title: "R波波高値と感度設定を確認",
        detail: "自己R波の波高値を測定し、感度設定との余裕を確認する。",
        caution: "感度のmV値は小さいほど鋭敏。表現の逆転に注意する。"
      },
      {
        id: "vvi-threshold",
        title: "V捕捉閾値を測定",
        detail: "出力を段階的に調整し、心室捕捉が維持される最小出力を確認する。",
        caution: "依存例では監視とバックアップ設定を確認してから実施する。"
      },
      {
        id: "vvi-final",
        title: "最終設定とレポートを確認",
        detail: "検査用設定から戻したこと、出力安全域、感度、下限レート、記録内容を確認する。",
        caution: "最後に画面上の実設定を声出し確認する。"
      }
    ]
  },
  DDD: {
    name: "DDD / DDDR",
    short: "心房と心室をセンシング・ペーシングし、AV同期を保つ。AリードとVリードを分けて評価する。",
    checks: [
      "A/Vリード抵抗",
      "P波・R波波高値",
      "A/V捕捉閾値",
      "AV伝導とAV delay",
      "心房イベントとモードスイッチ",
      "A/Vペーシング率"
    ],
    steps: [
      {
        id: "ddd-identify",
        title: "デバイス照合と現在設定の保存",
        detail: "患者、機種、モード、下限レート、上限レート、AV delay、出力、感度を確認する。",
        caution: "DDDではA/Vそれぞれの設定を別々に記録する。"
      },
      {
        id: "ddd-battery",
        title: "電池状態とアラートを確認",
        detail: "推定寿命、ERI/RRT表示、リードアラート、心房性不整脈通知を確認する。",
        caution: "心房イベント由来の通知を見落とさない。"
      },
      {
        id: "ddd-atrial-lead",
        title: "Aリードを確認",
        detail: "Aリード抵抗、P波波高値、A捕捉閾値、A出力、A感度を確認する。",
        caution: "P波が小さい場合は心房イベント検出の信頼性も確認する。"
      },
      {
        id: "ddd-ventricular-lead",
        title: "Vリードを確認",
        detail: "Vリード抵抗、R波波高値、V捕捉閾値、V出力、V感度を確認する。",
        caution: "房室ブロックや依存例ではV捕捉の安全性を優先する。"
      },
      {
        id: "ddd-timing",
        title: "AV同期とペーシング率を確認",
        detail: "A/Vペーシング率、AV delay、自己AV伝導、上限トラッキングレートを確認する。",
        caution: "Vペーシング率の増減は疾患背景と合わせて見る。"
      },
      {
        id: "ddd-events",
        title: "イベントとモードスイッチを確認",
        detail: "AF/AT burden、モードスイッチ、PMT、頻拍イベント、症状時刻との対応を確認する。",
        caution: "イベント数、持続時間、最長エピソードを分けて記録する。"
      },
      {
        id: "ddd-final",
        title: "最終設定とレポートを確認",
        detail: "検査用設定から戻したこと、A/V出力安全域、感度、AV delay、記録内容を確認する。",
        caution: "AとVの設定を取り違えていないか確認する。"
      }
    ]
  }
};

const BASE_STEPS = [
  {
    id: "base-safety",
    title: "開始前の安全確認",
    detail: "患者状態、モニタリング、緊急時対応、指導者確認の要否を確認する。",
    caution: "依存あり・依存疑いでは検査中の捕捉脱落リスクを先に共有する。"
  },
  {
    id: "base-history",
    title: "前回値と今回目的を確認",
    detail: "前回の閾値、波高値、抵抗、電池状態、症状、紹介目的を確認する。",
    caution: "今回値だけで判断せず、変化量を重視する。"
  }
];

const LOGIC_CARDS = [
  {
    id: "sensing-basic",
    title: "波高値確認の共通原則",
    badges: ["P波/R波", "センシング", "全モード"],
    applies: {
      diseases: Object.keys(DISEASES),
      modes: Object.keys(MODES),
      patterns: ["", "AS-VP", "AP-VP", "AS-VS", "AP-VS", "VVI-VP", "VVI-VS"]
    },
    trigger: "波高値は、リードが自己心内電位をどれくらい検出できているかを見る項目です。",
    why: "Aリードは自己P波、Vリードは自己R波を検出して評価します。ペーシング波形しか出ていない時は、自己波が見える条件を作れるかを考えます。",
    flow: [
      "まず現在のイベント表記を読む。AS/AP、VS/VPのどちらで動いているかを確認する。",
      "測りたいリードの自己波が出ているかを確認する。P波ならAS、R波ならVSが手掛かりになる。",
      "自己波が出ていない場合は、疾患背景と依存度から安全に自己波を出せるか判断する。",
      "自己波が確認できたら波高値、感度設定、前回値との差をセットで記録する。",
      "自己波が確認できない場合は、無理に継続せず評価困難または依存疑いとして記録し、指導者に確認する。"
    ],
    branches: [
      "VSが出る: V波高値を測定し、感度設定との余裕を確認する。",
      "VSが出ない: CAVBや依存例では自己R波が出ないことがある。試験条件と中止理由を記録する。",
      "波高値が低い: アンダーセンシング、リード位置・リード異常、感度設定の確認につなげる。"
    ],
    cautions: [
      "感度設定のmV値は小さいほど鋭敏です。",
      "一時設定変更は施設手順とメーカー表示を確認して実施します。",
      "検査後は必ず元設定、または医師指示後の最終設定を確認します。"
    ],
    quiz: {
      question: "Vリード波高値を評価する時に必要な自己波はどれ？",
      choices: [
        { label: "自己R波", correct: true, feedback: "正解です。Vリードのセンシング評価では自己R波を確認します。" },
        { label: "自己P波", correct: false, feedback: "P波はAリードの評価に使います。Vリードでは自己R波を見ます。" },
        { label: "Vペーシングスパイク", correct: false, feedback: "ペーシングスパイクでは自己R波の波高値評価にはなりません。" }
      ]
    }
  },
  {
    id: "cavb-asvp-v-sensing",
    title: "CAVB / AS-VPでVリード波高値を確認したい",
    badges: ["CAVB", "AS-VP", "V波高値"],
    applies: {
      diseases: ["cavb", "avBlock", "highGradeAvBlock"],
      modes: ["DDD"],
      patterns: ["AS-VP"]
    },
    trigger: "AS-VPは心房は自己P波を感知している一方、心室はペーシングで補っている状態です。V波高値を見たい時は、自己R波が出る条件を作れるかがポイントになります。",
    why: "DDDではASの後にAV delayが走り、その間に自己R波が感知されるとVPは抑制されます。AV delayが短い、またはAV伝導がない場合はVPになり、自己R波の波高値を評価しにくくなります。",
    flow: [
      "開始前に依存度、逃逸調律、モニタリング、血圧、指導者確認の要否を確認する。",
      "現在のsensed AV delayと最終設定を記録する。",
      "施設手順の範囲でsensed AV delayを延長し、AS後にVSが出るか観察する。",
      "VSが出た場合はVリードEGMでR波波高値を測定し、V感度設定と前回値との差を確認する。",
      "VSが出ない、症状や血圧低下がある、長いポーズが懸念される場合は中止し、元設定に戻す。",
      "最終的にAV delay、出力、感度が検査前または医師指示設定に戻っていることを確認する。"
    ],
    branches: [
      "VSが出る: R波波高値を記録し、V感度設定の余裕を見る。",
      "VSが出ない: CAVBで自己R波確認困難、または依存疑いとして記録する。",
      "ASが不安定: 先にP波、A感度、Aリード評価を確認する。",
      "R波が低い: V感度設定、リードトレンド、前回値との差を指導者に報告する。"
    ],
    cautions: [
      "CAVBではAV delayを延ばしても自己R波が出ないことがあります。",
      "依存あり・依存疑いでは無理に自己R波を待たず、安全確認を優先します。",
      "メーカーによりsensed AV delay、paced AV delay、AV search、AV hysteresisなど表示名が異なります。"
    ],
    procedureStep: {
      id: "logic-cavb-asvp-v-sensing",
      title: "CAVB / AS-VPでV波高値確認ロジックを実施",
      detail: "AV delayを延長して自己R波が出るか確認し、VSが出た場合にVリード波高値を測定する。",
      caution: "VSが出ない、症状がある、依存が強い場合は中止して元設定に戻す。"
    },
    quiz: {
      question: "CAVB / AS-VPでVリード波高値を見たい時、AV delayを延ばす目的は？",
      choices: [
        { label: "AS後に自己R波が出るか確認するため", correct: true, feedback: "正解です。自己R波が出ればVリードのR波波高値を評価できます。" },
        { label: "P波を大きくするため", correct: false, feedback: "P波はAリード側の評価です。V波高値確認では自己R波が必要です。" },
        { label: "V閾値を自動的に下げるため", correct: false, feedback: "AV delay延長の目的はV閾値を下げることではなく、自己R波の有無を確認することです。" }
      ]
    }
  },
  {
    id: "ddd-apvp-v-sensing",
    title: "DDD / AP-VPでVリード波高値を確認したい",
    badges: ["DDD", "AP-VP", "V波高値"],
    applies: {
      diseases: ["sickSinus", "sinusArrest", "cavb", "avBlock", "highGradeAvBlock", "tachyBrady"],
      modes: ["DDD"],
      patterns: ["AP-VP"]
    },
    trigger: "AP-VPでは心房も心室もペーシングされています。V波高値を見たい場合は、心房ペーシング後に自己R波が出るか、または自己心房波を待てるかを考えます。",
    why: "paced AV delay内に自己R波が入ればVSとして確認できます。自己心房波が乏しい症例では、まず安全にAV伝導や逃逸調律を確認できるかが分岐になります。",
    flow: [
      "依存度と自己心房波の有無を確認する。",
      "paced AV delayを施設手順内で延長し、AP後にVSが出るか観察する。",
      "自己P波が出る場合はAS-VP/AS-VSの状態も確認し、sensed AV delay側の挙動を分けて見る。",
      "VSが出た場合はV波高値を測定する。",
      "VSが出ない場合は評価困難として記録し、元設定に戻す。"
    ],
    branches: [
      "AP後にVSが出る: V波高値を測定できる。",
      "ASに切り替わる: sensed AV delay側の確認に移る。",
      "VSが出ない: 依存度が高い可能性を考え、無理に継続しない。"
    ],
    cautions: [
      "paced AV delayとsensed AV delayは別設定の場合があります。",
      "自己P波がない時はAS-VPと同じ考え方にはなりません。",
      "検査用設定の戻し忘れを最後に確認します。"
    ],
    quiz: {
      question: "AP-VPで確認するAV delayは、まずどちらを意識する？",
      choices: [
        { label: "paced AV delay", correct: true, feedback: "正解です。AP後の心室イベントを見るため、paced AV delayを意識します。" },
        { label: "PVARPだけ", correct: false, feedback: "PVARPも大事ですが、AP後の自己R波確認ではpaced AV delayが中心です。" },
        { label: "モードスイッチ回数だけ", correct: false, feedback: "モードスイッチは心房性不整脈評価です。ここではV波高値確認の流れを考えます。" }
      ]
    }
  },
  {
    id: "vvi-vp-v-sensing",
    title: "VVI / VP主体でR波波高値を確認したい",
    badges: ["VVI", "VP", "R波"],
    applies: {
      diseases: ["bradyAf", "cavb", "avBlock", "highGradeAvBlock", "postAvNodeAblation"],
      modes: ["VVI"],
      patterns: ["VVI-VP"]
    },
    trigger: "VVIでVP主体の場合、自己R波が少ないためR波波高値をそのまま評価しにくいことがあります。",
    why: "VVIでは自己R波を感知するとVペーシングが抑制されます。自己R波を確認したい場合は、下限レートや一時設定の扱いを施設手順に沿って判断します。",
    flow: [
      "依存度、基礎心拍、逃逸調律、症状を確認する。",
      "施設手順内で自己R波が出る条件を作れるか検討する。",
      "自己R波が出たらR波波高値とV感度設定を確認する。",
      "自己R波が出ない、または安全に確認できない場合は評価困難として記録する。",
      "検査後に下限レート、出力、感度の最終設定を確認する。"
    ],
    branches: [
      "VSが出る: R波波高値を測定する。",
      "VSが出ない: 依存または自己R波確認困難として記録する。",
      "症状がある: 試験を中止し、設定を戻して報告する。"
    ],
    cautions: [
      "下限レート変更は施設手順と監視体制の確認が必要です。",
      "依存例では自己R波確認より安全確保を優先します。",
      "一時設定変更後は必ず最終設定を確認します。"
    ],
    quiz: {
      question: "VVIでR波波高値を評価する時、VPしか出ていない場合の扱いは？",
      choices: [
        { label: "自己R波が安全に出るか確認し、出なければ評価困難として記録する", correct: true, feedback: "正解です。無理に自己R波を出すのではなく、安全に確認できる範囲で判断します。" },
        { label: "VPのスパイクをR波波高値として記録する", correct: false, feedback: "ペーシングスパイクは自己R波ではありません。" },
        { label: "Aリード閾値を測れば代用できる", correct: false, feedback: "Vリード波高値はVリードで自己R波を見て評価します。" }
      ]
    }
  }
];

const CHECK_GOALS = {
  vSensing: {
    label: "Vリード波高値（R波）",
    lead: "V",
    concept: "Vリードが自己R波をどれくらい検出できるかを確認する。"
  },
  aSensing: {
    label: "Aリード波高値（P波）",
    lead: "A",
    concept: "Aリードが自己P波をどれくらい検出できるかを確認する。"
  },
  vThreshold: {
    label: "V捕捉閾値",
    lead: "V",
    concept: "V出力を段階的に調整し、心室捕捉が維持される最小条件を確認する。"
  },
  aThreshold: {
    label: "A捕捉閾値",
    lead: "A",
    concept: "A出力を段階的に調整し、心房捕捉が維持される最小条件を確認する。"
  },
  avConduction: {
    label: "AV伝導・自己脈",
    lead: "A/V",
    concept: "心房イベント後に自己心室応答があるか、または基礎自己脈があるかを確認する。"
  },
  impedance: {
    label: "リード抵抗",
    lead: "A/V",
    concept: "リード抵抗値とトレンドを確認し、断線・絶縁不良・接続異常の手掛かりを探す。"
  },
  events: {
    label: "イベント・モードスイッチ",
    lead: "A/V",
    concept: "デバイスが記録した不整脈、モードスイッチ、高レートイベント、症状時刻との対応を見る。"
  }
};

const PACING_PATTERNS = {
  "AS-VP": {
    mode: "DDD",
    label: "AS-VP",
    description: "心房自己波を感知し、AV delay後に心室ペーシングしている。",
    atrial: "AS",
    ventricular: "VP"
  },
  "AP-VP": {
    mode: "DDD",
    label: "AP-VP",
    description: "心房も心室もペーシングしている。",
    atrial: "AP",
    ventricular: "VP"
  },
  "AS-VS": {
    mode: "DDD",
    label: "AS-VS",
    description: "心房自己波と心室自己波を感知している。",
    atrial: "AS",
    ventricular: "VS"
  },
  "AP-VS": {
    mode: "DDD",
    label: "AP-VS",
    description: "心房ペーシング後に心室自己波を感知している。",
    atrial: "AP",
    ventricular: "VS"
  },
  "VVI-VP": {
    mode: "VVI",
    label: "VVI-VP",
    description: "VVIで心室ペーシング主体になっている。",
    atrial: "NA",
    ventricular: "VP"
  },
  "VVI-VS": {
    mode: "VVI",
    label: "VVI-VS",
    description: "VVIで自己R波を感知している。",
    atrial: "NA",
    ventricular: "VS"
  }
};

const PATTERN_ORDER = ["AS-VP", "AP-VP", "AS-VS", "AP-VS", "VVI-VP", "VVI-VS"];

const MEASUREMENT_GROUPS = {
  common: {
    title: "基本情報",
    fields: [
      { key: "battery", label: "電池状態 / 推定寿命", type: "text", unit: "" },
      { key: "lowerRate", label: "下限レート", type: "number", unit: "ppm" },
      { key: "vPacingPercent", label: "Vペーシング率", type: "number", unit: "%" },
      { key: "events", label: "イベント記録", type: "textarea", unit: "" },
      { key: "notes", label: "メモ・指導者相談事項", type: "textarea", unit: "" }
    ]
  },
  atrial: {
    title: "Aリード",
    fields: [
      { key: "aImpedance", label: "Aリード抵抗", type: "number", unit: "ohm" },
      { key: "pWave", label: "P波波高値", type: "number", unit: "mV" },
      { key: "aThresholdVoltage", label: "A捕捉閾値", type: "number", unit: "V" },
      { key: "aThresholdPulseWidth", label: "A閾値パルス幅", type: "number", unit: "ms" },
      { key: "aOutputVoltage", label: "A出力設定", type: "number", unit: "V" },
      { key: "aSensing", label: "A感度設定", type: "number", unit: "mV" }
    ]
  },
  ventricular: {
    title: "Vリード",
    fields: [
      { key: "vImpedance", label: "Vリード抵抗", type: "number", unit: "ohm" },
      { key: "rWave", label: "R波波高値", type: "number", unit: "mV" },
      { key: "vThresholdVoltage", label: "V捕捉閾値", type: "number", unit: "V" },
      { key: "vThresholdPulseWidth", label: "V閾値パルス幅", type: "number", unit: "ms" },
      { key: "vOutputVoltage", label: "V出力設定", type: "number", unit: "V" },
      { key: "vSensing", label: "V感度設定", type: "number", unit: "mV" }
    ]
  },
  dddTiming: {
    title: "DDDタイミング・イベント",
    fields: [
      { key: "aPacingPercent", label: "Aペーシング率", type: "number", unit: "%" },
      { key: "upperTrackingRate", label: "上限トラッキングレート", type: "number", unit: "ppm" },
      { key: "avDelay", label: "AV delay", type: "text", unit: "ms" },
      { key: "temporaryAvDelay", label: "R波確認時の一時AV delay", type: "text", unit: "ms" },
      { key: "intrinsicRResponse", label: "自己R波 / VS確認結果", type: "text", unit: "" },
      { key: "rWaveCheckMethod", label: "V波高値確認方法", type: "text", unit: "" },
      { key: "modeSwitch", label: "モードスイッチ / AF burden", type: "text", unit: "" }
    ]
  }
};

const SCENARIOS = [
  {
    id: "vvi-af",
    title: "徐脈性心房細動でVVI",
    disease: "徐脈性心房細動",
    mode: "VVI",
    body: "心房細動が持続し、VVIでフォロー中。Vペーシング率が高く、前回よりR波が低めに記録されている。",
    question: "最初に重点確認する組み合わせは？",
    choices: [
      {
        label: "R波、Vリード抵抗、V閾値、自己心室応答",
        correct: true,
        feedback: "VVIでは心房同期を使わないため、Vリード評価と自己心室応答の確認が軸になります。"
      },
      {
        label: "P波、A閾値、モードスイッチ回数",
        correct: false,
        feedback: "VVIでは通常Aリード評価が主軸ではありません。まずVリードと心室応答を確認します。"
      },
      {
        label: "AV delay、上限トラッキングレート、PVARP",
        correct: false,
        feedback: "DDDの同期設定に関わる項目です。VVI症例では優先度が下がります。"
      }
    ]
  },
  {
    id: "ddd-avblock",
    title: "完全房室ブロックでDDD",
    disease: "房室ブロック",
    mode: "DDD",
    body: "DDDでフォロー中。Vペーシング率がほぼ100%。自己心室応答は乏しく、依存が疑われる。",
    question: "閾値測定前に必ず意識したいことは？",
    choices: [
      {
        label: "依存度、監視体制、バックアップ設定を確認する",
        correct: true,
        feedback: "依存例では捕捉脱落の影響が大きいため、安全確認を先に置くのが重要です。"
      },
      {
        label: "心房イベントだけを先に詳しく解析する",
        correct: false,
        feedback: "心房イベントも重要ですが、この症例ではV捕捉の安全性が最優先です。"
      },
      {
        label: "検査用設定のままレポート作成へ進む",
        correct: false,
        feedback: "最終設定復帰は重大な確認点です。検査用設定の残存は避けます。"
      }
    ]
  },
  {
    id: "cavb-asvp-sensing",
    title: "CAVB / AS-VPでV波高値確認",
    disease: "完全房室ブロック（CAVB）",
    mode: "DDD",
    body: "AS-VPで安定駆動している。Vリード抵抗とV閾値は確認できたが、VリードのR波波高値を評価したい。",
    question: "次に考えるロジックとして最も適切なのは？",
    choices: [
      {
        label: "安全確認後、AV delayを延長して自己R波が出るか確認する",
        correct: true,
        feedback: "AS後にVSが出れば、Vリードの自己R波波高値を評価できます。出ない場合は評価困難として記録します。"
      },
      {
        label: "VP波形をR波波高値としてそのまま記録する",
        correct: false,
        feedback: "V波高値は自己R波の検出評価です。VPだけではR波波高値の評価にはなりません。"
      },
      {
        label: "P波波高値を測定してV波高値の代用にする",
        correct: false,
        feedback: "P波はAリード評価です。Vリード波高値は自己R波で確認します。"
      }
    ]
  },
  {
    id: "ddd-tbs",
    title: "洞不全症候群（徐脈頻脈型）でDDD",
    disease: "洞不全症候群（徐脈頻脈型）",
    mode: "DDD",
    body: "動悸の訴えがあり、心房性頻拍イベントが記録されている。P波波高値は前回より低下している。",
    question: "次に確認したい内容は？",
    choices: [
      {
        label: "P波、Aリード、モードスイッチ、症状時刻との対応",
        correct: true,
        feedback: "心房イベントの信頼性と症状との対応を合わせて確認します。"
      },
      {
        label: "V閾値だけを測って終了する",
        correct: false,
        feedback: "V閾値は必要ですが、主訴と記録から心房イベントの確認が重要です。"
      },
      {
        label: "疾患に関係なく全項目を同じ深さで見る",
        correct: false,
        feedback: "全体確認は必要ですが、疾患背景に応じて重点項目を置くと見落としが減ります。"
      }
    ]
  },
  {
    id: "sinus-arrest-ddd",
    title: "洞不全症候群（洞停止・洞房ブロック型）でDDD",
    disease: "洞不全症候群（洞停止・洞房ブロック型）",
    mode: "DDD",
    body: "AP主体でフォロー中。休止イベントがあり、P波波高値とA閾値を確認したい。",
    question: "P波波高値を評価する時の考え方は？",
    choices: [
      {
        label: "ASが出る条件を作り、自己P波を記録する",
        correct: true,
        feedback: "APだけではP波波高値の評価になりません。自己P波が出る条件を安全に作ります。"
      },
      {
        label: "AP波形をP波波高値として記録する",
        correct: false,
        feedback: "APは心房ペーシングです。P波波高値は自己P波で評価します。"
      },
      {
        label: "V閾値だけ確認すれば十分",
        correct: false,
        feedback: "洞不全ではAリード評価と洞機能の記録が重要です。"
      }
    ]
  },
  {
    id: "high-grade-avb-ddd",
    title: "高度房室ブロック（2:1・Mobitz II含む）でDDD",
    disease: "高度房室ブロック",
    mode: "DDD",
    body: "AS-VPとAS-VSが混在している。Vペーシング率は高く、自己心室応答は不安定。",
    question: "この症例で避けたい判断は？",
    choices: [
      {
        label: "短時間VSが見えたため依存なしと断定する",
        correct: true,
        feedback: "正解です。これは避けたい判断です。高度AVBでは伝導が間欠的で、依存度を過小評価しないようにします。"
      },
      {
        label: "V閾値、R波、V抵抗をセットで見る",
        correct: false,
        feedback: "これは適切な確認です。Vリード安全性をまとめて評価します。"
      },
      {
        label: "AV delay変更後に最終設定を確認する",
        correct: false,
        feedback: "これも適切です。設定復帰は重要です。"
      }
    ]
  },
  {
    id: "post-av-node-ablation-vvi",
    title: "房室接合部アブレーション後でVVI",
    disease: "房室接合部アブレーション後",
    mode: "VVI",
    body: "慢性AFに対する房室接合部アブレーション後。VVIでVP主体、自己R波はほぼ確認できない。",
    question: "チェック時に最も優先したい確認は？",
    choices: [
      {
        label: "V捕捉閾値、出力安全域、設定復帰",
        correct: true,
        feedback: "依存に近い症例ではV捕捉の安全性が軸です。自己R波確認を無理に続けないことも重要です。"
      },
      {
        label: "P波波高値とA閾値",
        correct: false,
        feedback: "VVI/AF文脈では通常Aリード評価は主目的ではありません。"
      },
      {
        label: "AV delayを延長してAV伝導を探す",
        correct: false,
        feedback: "VVIかつ房室接合部アブレーション後では、AV delay評価の文脈ではありません。"
      }
    ]
  }
];

const SIMULATOR_ACTIONS = [
  { id: "safety", label: "安全確認", group: "準備" },
  { id: "recordSettings", label: "現在設定を記録", group: "準備" },
  { id: "extendSensedAv", label: "Sensed AV延長", group: "一時設定" },
  { id: "extendPacedAv", label: "Paced AV延長", group: "一時設定" },
  { id: "lowerRate", label: "下限レートを下げる", group: "一時設定" },
  { id: "measureAWave", label: "A波高値を測定", group: "測定" },
  { id: "measureVWave", label: "V波高値を測定", group: "測定" },
  { id: "runAThreshold", label: "A閾値テスト", group: "測定" },
  { id: "runVThreshold", label: "V閾値テスト", group: "測定" },
  { id: "markUnmeasurable", label: "評価困難として記録", group: "判断" },
  { id: "restore", label: "最終設定へ復帰", group: "復帰" }
];

const SIMULATOR_SCENARIOS = [
  {
    id: "cavb-asvp-v-sensing",
    title: "CAVB / AS-VP: V波高値を確認したい",
    disease: "完全房室ブロック（CAVB）",
    mode: "DDD",
    objective: "AS-VPでV波高値を確認する。ただしAV伝導はなく、自己R波は出ない。",
    teaching: "AV delayを延長してもVSが出ない時は、無理に待たず評価困難として記録し、設定を戻す。",
    initialSettings: {
      lowerRate: 60,
      sensedAvDelay: 160,
      pacedAvDelay: 180,
      aOutput: 2.5,
      vOutput: 2.5,
      aSensitivity: 0.5,
      vSensitivity: 2.0
    },
    physiology: {
      sinusRate: 76,
      intrinsicVRate: 28,
      avConductionDelay: null,
      pWave: 2.4,
      rWave: null,
      aThreshold: 0.8,
      vThreshold: 0.9,
      aImpedance: 510,
      vImpedance: 620
    },
    solution: ["safety", "recordSettings", "extendSensedAv", "markUnmeasurable", "restore"]
  },
  {
    id: "intermittent-avb-asvp-v-sensing",
    title: "間欠性AVB / AS-VP: R波を出して測定",
    disease: "房室ブロック",
    mode: "DDD",
    objective: "AS-VPからAV delayを延長し、自己R波が出たらV波高値を測定する。",
    teaching: "AV伝導が残っている症例では、sensed AV delay延長でAS-VSに変化することがある。",
    initialSettings: {
      lowerRate: 60,
      sensedAvDelay: 150,
      pacedAvDelay: 180,
      aOutput: 2.5,
      vOutput: 2.5,
      aSensitivity: 0.5,
      vSensitivity: 2.0
    },
    physiology: {
      sinusRate: 72,
      intrinsicVRate: 34,
      avConductionDelay: 290,
      pWave: 2.1,
      rWave: 8.4,
      aThreshold: 0.7,
      vThreshold: 1.0,
      aImpedance: 470,
      vImpedance: 590
    },
    solution: ["safety", "recordSettings", "extendSensedAv", "measureVWave", "restore"]
  },
  {
    id: "sss-apvs-a-sensing",
    title: "洞不全 / AP-VS: P波を出して測定",
    disease: "洞不全症候群",
    mode: "DDD",
    objective: "AP-VSでA波高値を確認したい。下限レートを下げて自己P波が出るか確認する。",
    teaching: "AP主体ではP波波高値を評価しにくい。自己P波が出る条件を安全に作る。",
    initialSettings: {
      lowerRate: 70,
      sensedAvDelay: 170,
      pacedAvDelay: 220,
      aOutput: 2.5,
      vOutput: 2.5,
      aSensitivity: 0.5,
      vSensitivity: 2.0
    },
    physiology: {
      sinusRate: 54,
      intrinsicVRate: 42,
      avConductionDelay: 170,
      pWave: 1.7,
      rWave: 9.1,
      aThreshold: 0.9,
      vThreshold: 0.8,
      aImpedance: 530,
      vImpedance: 610
    },
    solution: ["safety", "recordSettings", "lowerRate", "measureAWave", "restore"]
  },
  {
    id: "ddd-asvs-v-threshold",
    title: "DDD / AS-VS: V閾値を実施",
    disease: "房室ブロック",
    mode: "DDD",
    objective: "自己伝導でAS-VS。V捕捉閾値をテスト機能で確認する。",
    teaching: "VS主体では通常波形だけではV閾値は測れない。V閾値テストでVPを出して捕捉を確認する。",
    initialSettings: {
      lowerRate: 55,
      sensedAvDelay: 220,
      pacedAvDelay: 240,
      aOutput: 2.5,
      vOutput: 2.5,
      aSensitivity: 0.5,
      vSensitivity: 2.0
    },
    physiology: {
      sinusRate: 68,
      intrinsicVRate: 48,
      avConductionDelay: 180,
      pWave: 2.6,
      rWave: 10.2,
      aThreshold: 0.8,
      vThreshold: 0.7,
      aImpedance: 490,
      vImpedance: 560
    },
    solution: ["safety", "recordSettings", "runVThreshold", "restore"]
  },
  {
    id: "ddd-apvp-a-threshold",
    title: "DDD / AP-VP: A閾値を実施",
    disease: "洞不全症候群",
    mode: "DDD",
    objective: "AP-VPでA捕捉閾値を確認する。",
    teaching: "APが出ている症例ではA閾値テストの流れを理解しやすい。A捕捉の確認方法も意識する。",
    initialSettings: {
      lowerRate: 75,
      sensedAvDelay: 160,
      pacedAvDelay: 190,
      aOutput: 2.5,
      vOutput: 2.5,
      aSensitivity: 0.5,
      vSensitivity: 2.0
    },
    physiology: {
      sinusRate: 42,
      intrinsicVRate: 32,
      avConductionDelay: null,
      pWave: 1.4,
      rWave: null,
      aThreshold: 1.1,
      vThreshold: 0.9,
      aImpedance: 540,
      vImpedance: 650
    },
    solution: ["safety", "recordSettings", "runAThreshold", "restore"]
  },
  {
    id: "vvi-vp-v-sensing",
    title: "徐脈性AF / VVI-VP: R波を出して測定",
    disease: "徐脈性心房細動",
    mode: "VVI",
    objective: "VVIでVP主体。下限レートを下げて自己R波が出るか確認し、V波高値を測定する。",
    teaching: "VVIではVリード評価が中心。自己R波を安全に出せるかが分岐になる。",
    initialSettings: {
      lowerRate: 70,
      sensedAvDelay: 0,
      pacedAvDelay: 0,
      aOutput: 0,
      vOutput: 2.5,
      aSensitivity: 0,
      vSensitivity: 2.0
    },
    physiology: {
      sinusRate: null,
      intrinsicVRate: 46,
      avConductionDelay: null,
      pWave: null,
      rWave: 6.8,
      aThreshold: null,
      vThreshold: 1.0,
      aImpedance: null,
      vImpedance: 610
    },
    solution: ["safety", "recordSettings", "lowerRate", "measureVWave", "restore"]
  }
];

const state = loadState();

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
  populateDiseaseOptions();
  populatePacingPatternOptions();
  populateScenarioOptions();
  populateSimulatorScenarioOptions();
  bindStaticControls();
  setBoundValues();
  renderAll();
  if (localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY)) {
    markSaved("復元済み");
  } else {
    markDirty();
  }
}

function defaultState() {
  return {
    checkDate: localDateString(),
    patientId: "",
    operator: "",
    supervisor: "",
    disease: "sickSinus",
    mode: "DDD",
    pacingPattern: "",
    logicGoal: "vSensing",
    maker: "",
    dependency: "",
    safetyConfirmed: false,
    standards: { ...DEFAULT_STANDARDS },
    measurements: {},
    checklist: {},
    logicChoices: {},
    simulator: defaultSimulatorState(),
    scenarioId: SCENARIOS[0].id,
    scenarioChoice: null
  };
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY));
    if (!saved) return defaultState();
    return {
      ...defaultState(),
      ...saved,
      standards: { ...DEFAULT_STANDARDS, ...(saved.standards || {}) },
      measurements: saved.measurements || {},
      checklist: saved.checklist || {},
      logicChoices: saved.logicChoices || {},
      simulator: normalizeSimulatorState(saved.simulator || saved["ga" + "me"])
    };
  } catch {
    return defaultState();
  }
}

function defaultSimulatorState() {
  const scenario = SIMULATOR_SCENARIOS[0];
  return {
    scenarioId: scenario.id,
    settings: { ...scenario.initialSettings },
    completed: [],
    measurements: {},
    score: 0,
    feedback: "症例を読み、最初に必要な安全確認から始めてください。",
    lastAction: ""
  };
}

function normalizeSimulatorState(savedSimulator) {
  const fallback = defaultSimulatorState();
  if (!savedSimulator) return fallback;
  const scenario = SIMULATOR_SCENARIOS.find((item) => item.id === savedSimulator.scenarioId) || SIMULATOR_SCENARIOS[0];
  return {
    ...fallback,
    ...savedSimulator,
    scenarioId: scenario.id,
    settings: { ...scenario.initialSettings, ...(savedSimulator.settings || {}) },
    completed: savedSimulator.completed || [],
    measurements: savedSimulator.measurements || {}
  };
}

function localDateString() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function populateDiseaseOptions() {
  const select = document.getElementById("diseaseSelect");
  select.innerHTML = Object.entries(DISEASES)
    .map(([key, disease]) => `<option value="${key}">${escapeHtml(disease.name)}</option>`)
    .join("");
}

function populatePacingPatternOptions() {
  const select = document.getElementById("pacingPattern");
  const compatible = PATTERN_ORDER.filter((patternKey) => PACING_PATTERNS[patternKey].mode === state.mode);
  if (state.pacingPattern && !compatible.includes(state.pacingPattern)) {
    state.pacingPattern = "";
  }
  select.innerHTML = [
    `<option value="">未選択</option>`,
    ...compatible.map((patternKey) => {
      const pattern = PACING_PATTERNS[patternKey];
      return `<option value="${patternKey}">${escapeHtml(pattern.label)}</option>`;
    })
  ].join("");
}

function populateScenarioOptions() {
  const select = document.getElementById("scenarioSelect");
  select.innerHTML = SCENARIOS
    .map((scenario) => `<option value="${scenario.id}">${escapeHtml(scenario.title)}</option>`)
    .join("");
  select.value = state.scenarioId;
}

function populateSimulatorScenarioOptions() {
  const select = document.getElementById("simulatorScenarioSelect");
  if (!select) return;
  select.innerHTML = SIMULATOR_SCENARIOS
    .map((scenario) => `<option value="${scenario.id}">${escapeHtml(scenario.title)}</option>`)
    .join("");
  select.value = state.simulator.scenarioId;
}

function bindStaticControls() {
  document.querySelectorAll("[data-bind]").forEach((element) => {
    const eventName = element.type === "checkbox" || element.tagName === "SELECT" ? "change" : "input";
    element.addEventListener(eventName, () => {
      const key = element.dataset.bind;
      state[key] = element.type === "checkbox" ? element.checked : element.value;
      if (key === "disease" || key === "mode" || key === "pacingPattern" || key === "logicGoal") {
        state.scenarioChoice = null;
        renderAll();
      } else {
        renderReport();
      }
      markDirty();
    });
  });

  document.getElementById("saveButton").addEventListener("click", saveState);
  document.getElementById("resetButton").addEventListener("click", resetState);
  document.getElementById("printButton").addEventListener("click", printReport);
  document.getElementById("printButtonInline").addEventListener("click", printReport);

  document.querySelectorAll(".tab-button").forEach((button) => {
    button.addEventListener("click", () => showTab(button.dataset.tab));
  });

  document.getElementById("scenarioSelect").addEventListener("change", (event) => {
    state.scenarioId = event.target.value;
    state.scenarioChoice = null;
    renderScenario();
    renderReport();
    markDirty();
  });

  const simulatorScenarioSelect = document.getElementById("simulatorScenarioSelect");
  if (simulatorScenarioSelect) {
    simulatorScenarioSelect.addEventListener("change", (event) => {
      resetSimulator(event.target.value);
      renderSimulator();
      renderReport();
      markDirty();
    });
  }

  const simulatorResetButton = document.getElementById("simulatorResetButton");
  if (simulatorResetButton) {
    simulatorResetButton.addEventListener("click", () => {
      resetSimulator(state.simulator.scenarioId);
      renderSimulator();
      renderReport();
      markDirty();
    });
  }
}

function setBoundValues() {
  document.querySelectorAll("[data-bind]").forEach((element) => {
    const key = element.dataset.bind;
    if (element.type === "checkbox") {
      element.checked = Boolean(state[key]);
    } else {
      element.value = state[key] ?? "";
    }
  });
  document.querySelectorAll("[data-standard]").forEach((element) => {
    element.value = state.standards[element.dataset.standard] ?? "";
  });
  document.getElementById("scenarioSelect").value = state.scenarioId;
  const simulatorScenarioSelect = document.getElementById("simulatorScenarioSelect");
  if (simulatorScenarioSelect) simulatorScenarioSelect.value = state.simulator.scenarioId;
}

function renderAll() {
  populatePacingPatternOptions();
  setBoundValues();
  renderDiseaseSummary();
  renderLearning();
  renderLogic();
  renderSimulator();
  renderProcedure();
  renderMeasurements();
  renderScenario();
  renderReport();
}

function renderDiseaseSummary() {
  const disease = DISEASES[state.disease];
  const mode = MODES[state.mode];
  document.getElementById("diseaseSummary").innerHTML = `
    <div class="summary-block">
      <div class="mode-badge-row">
        ${disease.recommendedModes.map((item) => `<span class="mode-badge">${escapeHtml(item)}</span>`).join("")}
      </div>
    </div>
    <div class="summary-block">
      <h3>${escapeHtml(disease.name)}</h3>
      <p>${escapeHtml(disease.short)}</p>
    </div>
    <div class="summary-block">
      <h3>重点項目</h3>
      <ul class="summary-list">${disease.focus.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
    </div>
    <div class="summary-block">
      <h3>${escapeHtml(mode.name)}で見る軸</h3>
      <ul class="summary-list">${mode.checks.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
    </div>
    <div class="summary-block">
      <h3>現在の駆動</h3>
      <p>${escapeHtml(patternLabel(state.pacingPattern))}</p>
    </div>
  `;
}

function renderLearning() {
  const disease = DISEASES[state.disease];
  const mode = MODES[state.mode];
  document.getElementById("learningContent").innerHTML = `
    ${infoCard("選択中の疾患", disease.short, disease.focus)}
    ${infoCard(`選択中のモード: ${mode.name}`, mode.short, mode.checks)}
    ${infoCard("イベント表記の読み方", "AS/APは心房イベント、VS/VPは心室イベントを示します。波高値確認では、測りたいリードの自己波が出ているかを先に見ます。", [
      "AS: 心房自己波を感知",
      "AP: 心房ペーシング",
      "VS: 心室自己波を感知",
      "VP: 心室ペーシング"
    ])}
    ${infoCard("閾値", "心筋を捕捉できる最小出力。出力を下げながら捕捉が維持される境界を確認する。", [
      "依存例では監視とバックアップ設定を先に確認",
      "電圧とパルス幅をセットで記録",
      "前回値との差と出力安全域を見る"
    ])}
    ${infoCard("波高値と感度", "自己心内電位の大きさを確認し、感度設定に余裕があるかを見る。", [
      "P波はAリード、R波はVリード",
      "感度設定のmV値は小さいほど鋭敏",
      "低波高ではアンダーセンシングに注意"
    ])}
    ${infoCard("新人が躓きやすい点", "疾患、モード、測定値の意味を一列に並べて考えると整理しやすい。", disease.pitfalls)}
    ${infoCard("記録の見方", "単回値だけでなく、前回値・トレンド・症状との対応を合わせて確認する。", [
      "抵抗値の急変",
      "閾値上昇",
      "波高値低下",
      "イベント時刻と症状の対応"
    ])}
  `;
}

function infoCard(title, text, items) {
  return `
    <article class="info-card">
      <h3>${escapeHtml(title)}</h3>
      <p>${escapeHtml(text)}</p>
      <ul class="mini-list">${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
    </article>
  `;
}

function renderLogic() {
  const plan = currentLogicPlan();
  const summary = document.getElementById("logicMatchSummary");
  summary.textContent = plan.selectedPattern ? "工程表示中" : "駆動未選択";
  summary.className = plan.selectedPattern ? "status-pill ok" : "status-pill warn";
  document.getElementById("logicContent").innerHTML = `
    ${renderCurrentLogicPlan(plan)}
    ${renderLogicMatrix()}
    ${renderDiseaseLogicNotes()}
  `;

  document.querySelectorAll("[data-logic-step-id]").forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      state.checklist[checkbox.dataset.logicStepId] = checkbox.checked;
      renderReport();
      markDirty();
    });
  });
}

function renderCurrentLogicPlan(plan) {
  const stepRows = plan.steps.map((step, index) => {
    const checked = state.checklist[step.id] ? "checked" : "";
    return `
      <label class="logic-checkline">
        <input data-logic-step-id="${step.id}" type="checkbox" ${checked}>
        <span><strong>${index + 1}. ${escapeHtml(step.phase)}</strong>${escapeHtml(step.text)}</span>
      </label>
    `;
  }).join("");

  return `
    <article class="logic-card exact">
      <div class="logic-head">
        <div>
          <p class="eyebrow">Current Route</p>
          <h3>${escapeHtml(plan.title)}</h3>
        </div>
        <div class="mode-badge-row">
          <span class="mode-badge">${escapeHtml(plan.goal.label)}</span>
          <span class="mode-badge">${escapeHtml(patternLabel(state.pacingPattern))}</span>
        </div>
      </div>
      <p class="logic-trigger">${escapeHtml(plan.instruction.first)}</p>
      <div class="logic-section">
        <h4>なぜそうするか</h4>
        <p>${escapeHtml(plan.why)}</p>
      </div>
      <div class="logic-columns">
        <div class="logic-section">
          <h4>一時設定</h4>
          <p>${escapeHtml(plan.instruction.setting)}</p>
        </div>
        <div class="logic-section">
          <h4>分岐</h4>
          <p>${escapeHtml(plan.instruction.branch)}</p>
        </div>
      </div>
      <div class="logic-quiz">
        <h4>工程チェック</h4>
        <div class="logic-step-checks">${stepRows}</div>
      </div>
    </article>
  `;
}

function renderLogicMatrix() {
  const goal = CHECK_GOALS[state.logicGoal] || CHECK_GOALS.vSensing;
  const rows = PATTERN_ORDER.map((patternKey) => {
    const pattern = PACING_PATTERNS[patternKey];
    const instruction = buildPatternInstruction(state.disease, patternKey, state.logicGoal);
    const selected = state.pacingPattern === patternKey ? "selected-row" : "";
    return `
      <tr class="${selected}">
        <th>
          <strong>${escapeHtml(pattern.label)}</strong>
          <span>${escapeHtml(pattern.description)}</span>
        </th>
        <td>${escapeHtml(instruction.status)}</td>
        <td>${escapeHtml(instruction.setting)}</td>
        <td>${escapeHtml(instruction.check)}</td>
        <td>${escapeHtml(instruction.branch)}</td>
        <td>${escapeHtml(instruction.caution)}</td>
      </tr>
    `;
  }).join("");

  return `
    <article class="logic-card related">
      <div class="logic-head">
        <div>
          <p class="eyebrow">Pattern Matrix</p>
          <h3>${escapeHtml(goal.label)}の全駆動パターン</h3>
        </div>
      </div>
      <div class="matrix-wrap">
        <table class="logic-matrix">
          <thead>
            <tr>
              <th>駆動</th>
              <th>位置づけ</th>
              <th>チェック前の設定工程</th>
              <th>確認すること</th>
              <th>分岐</th>
              <th>注意</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </article>
  `;
}

function renderDiseaseLogicNotes() {
  const notes = diseaseLogicNotes(state.disease, state.logicGoal);
  return `
    <article class="logic-card related">
      <div class="logic-head">
        <div>
          <p class="eyebrow">Disease Modifier</p>
          <h3>${escapeHtml(DISEASES[state.disease].name)}で上乗せする注意</h3>
        </div>
      </div>
      <ul class="mini-list">${notes.map((note) => `<li>${escapeHtml(note)}</li>`).join("")}</ul>
    </article>
  `;
}

function logicProcedureSteps() {
  const plan = currentLogicPlan();
  if (!plan.selectedPattern) return [];
  return plan.steps.map((step) => ({
    id: step.id,
    title: `ロジック: ${step.phase}`,
    detail: step.text,
    caution: "一時設定変更後は最終設定復帰を確認する。"
  }));
}

function currentLogicPlan() {
  const goal = CHECK_GOALS[state.logicGoal] || CHECK_GOALS.vSensing;
  const selectedPattern = state.pacingPattern && PACING_PATTERNS[state.pacingPattern]
    ? PACING_PATTERNS[state.pacingPattern]
    : null;
  const patternKey = selectedPattern ? state.pacingPattern : defaultPatternForMode(state.mode);
  const instruction = buildPatternInstruction(state.disease, patternKey, state.logicGoal);
  const titlePattern = selectedPattern ? selectedPattern.label : `${PACING_PATTERNS[patternKey].label}（仮表示）`;
  const baseId = `logic-${state.disease}-${patternKey}-${state.logicGoal}`;
  const steps = [
    { phase: "準備", text: instruction.first },
    { phase: "一時設定", text: instruction.setting },
    { phase: "測定", text: instruction.check },
    { phase: "分岐判断", text: instruction.branch },
    { phase: "復帰・記録", text: instruction.restore }
  ].map((step, index) => ({ ...step, id: `${baseId}-${index}` }));

  return {
    selectedPattern,
    goal,
    instruction,
    why: `${goal.concept} ${PACING_PATTERNS[patternKey].description} そのため、現在出ている自己波とペーシング波を分けてから、必要最小限の一時設定で確認します。`,
    title: `${DISEASES[state.disease].name} / ${titlePattern} / ${goal.label}`,
    steps
  };
}

function defaultPatternForMode(mode) {
  return mode === "VVI" ? "VVI-VP" : "AS-VP";
}

function buildPatternInstruction(diseaseKey, patternKey, goalKey) {
  const pattern = PACING_PATTERNS[patternKey];
  const goal = CHECK_GOALS[goalKey] || CHECK_GOALS.vSensing;
  const diseaseCaution = diseaseCautionText(diseaseKey, goalKey);
  let instruction;

  switch (goalKey) {
    case "aSensing":
      instruction = atrialSensingInstruction(pattern);
      break;
    case "vThreshold":
      instruction = ventricularThresholdInstruction(pattern);
      break;
    case "aThreshold":
      instruction = atrialThresholdInstruction(pattern);
      break;
    case "avConduction":
      instruction = avConductionInstruction(pattern);
      break;
    case "impedance":
      instruction = impedanceInstruction(pattern);
      break;
    case "events":
      instruction = eventInstruction(pattern);
      break;
    case "vSensing":
    default:
      instruction = ventricularSensingInstruction(pattern);
      break;
  }

  const notRoutine = diseaseGoalNotRoutine(diseaseKey, goalKey, patternKey);
  if (notRoutine) {
    instruction.status = notRoutine;
  }

  instruction.caution = [instruction.caution, diseaseCaution].filter(Boolean).join(" ");
  instruction.restore = "一時変更した設定を検査前または医師指示後の最終設定に戻し、戻した設定値と確認できた内容を記録する。";
  if (instruction.status.includes("適用外")) {
    instruction.restore = "適用外または通常評価対象外として記録し、必要性がある場合は指導者に確認する。";
  }
  return instruction;
}

function ventricularSensingInstruction(pattern) {
  if (pattern.ventricular === "VS") {
    return {
      status: "自己R波あり",
      first: "V-EGMとマーカーでVSが自己R波であることを確認する。",
      setting: "原則として一時設定変更は不要。必要時のみ感度表示とフィルタ設定を確認する。",
      check: "R波波高値、V感度設定、前回値との差を確認する。",
      branch: "R波が十分なら記録。低値、不安定、ノイズ疑いならV感度、リードトレンド、EGMを指導者に確認する。",
      caution: "融合波やノイズを自己R波として読まない。"
    };
  }

  if (pattern.mode === "DDD") {
    const avType = pattern.atrial === "AS" ? "sensed AV delay" : "paced AV delay";
    return {
      status: "自己R波を出して評価",
      first: "依存度、逃逸調律、症状、血圧、監視体制を確認し、現在のAV delayを記録する。",
      setting: `${avType}を施設手順の範囲で一時延長し、心房イベント後にVSが出るか観察する。`,
      check: "VSが出た時点でVリードEGMのR波波高値を測定し、V感度設定との余裕を確認する。",
      branch: "VSが出ればR波波高値を記録。VSが出ない、症状がある、長いポーズが懸念される場合は中止し評価困難として記録する。",
      caution: "AV delay延長後の戻し忘れに注意する。"
    };
  }

  return {
    status: "自己R波を出して評価",
    first: "依存度、基礎心拍、逃逸調律、症状、監視体制を確認する。",
    setting: "下限レートまたは一時試験設定を施設手順の範囲で調整し、VSが出る条件を作れるか確認する。",
    check: "VSが出たらR波波高値、V感度設定、前回値との差を確認する。",
    branch: "VSが出れば記録。VSが出ない、症状がある、依存が強い場合は中止して評価困難として記録する。",
    caution: "VVIでは自己脈確認時の徐脈・ポーズに注意する。"
  };
}

function atrialSensingInstruction(pattern) {
  if (pattern.mode === "VVI") {
    return {
      status: "適用外",
      first: "VVIでは通常Aリードを使用しないため、A波高値評価の対象外かを確認する。",
      setting: "一時設定変更なし。Aリード評価が必要な症例では指導者に確認する。",
      check: "通常はVリード評価を優先する。",
      branch: "Aリード搭載機種で評価指示がある場合のみ、メーカー手順に沿って別途確認する。",
      caution: "VVI症例でP波評価を主目的にしない。"
    };
  }

  if (pattern.atrial === "AS") {
    return {
      status: "自己P波あり",
      first: "A-EGMとマーカーでASが自己P波であることを確認する。",
      setting: "原則として一時設定変更は不要。",
      check: "P波波高値、A感度設定、前回値との差を確認する。",
      branch: "P波が十分なら記録。低値、不安定、FFR疑いならA感度、心房EGM、イベント検出の信頼性を確認する。",
      caution: "遠隔R波やノイズをP波として読まない。"
    };
  }

  return {
    status: "自己P波を出して評価",
    first: "自己心房波が出る可能性、洞機能、症状、下限レートを確認する。",
    setting: "下限レートや心房ペーシングを施設手順の範囲で一時調整し、ASが出るか観察する。",
    check: "ASが出たらP波波高値、A感度設定、前回値との差を確認する。",
    branch: "ASが出れば記録。ASが出ない場合は洞不全やAP依存として、P波評価困難を記録する。",
    caution: "心房ペーシングを抑える操作は症状と徐脈に注意する。"
  };
}

function ventricularThresholdInstruction(pattern) {
  if (pattern.ventricular === "VP") {
    return {
      status: "VPあり",
      first: "依存度、バックアップ設定、監視体制、現在のV出力とパルス幅を確認する。",
      setting: "プログラマーのV閾値テスト機能、または施設手順の一時出力調整でV捕捉を評価する。",
      check: "V捕捉が維持される最小出力とパルス幅を確認する。",
      branch: "閾値が許容範囲なら出力安全域を確認。高値、変動、捕捉不安定ならリード抵抗、波高値、前回値を合わせて報告する。",
      caution: "依存例では捕捉脱落時の影響が大きい。"
    };
  }

  return {
    status: "VPを出して評価",
    first: "自己R波が優位な状態のため、Vペーシングを安全に出せるか確認する。",
    setting: pattern.mode === "DDD"
      ? "V閾値テスト機能、またはAV delay短縮などでVPが出る条件を施設手順内で作る。"
      : "V閾値テスト機能、または一時レート設定でVPが出る条件を施設手順内で作る。",
    check: "VPが出た状態でV捕捉閾値を測定する。",
    branch: "VPを安全に出せれば測定。自己心拍が速い、競合、症状がある場合は無理に継続しない。",
    caution: "自己脈との競合や融合に注意する。"
  };
}

function atrialThresholdInstruction(pattern) {
  if (pattern.mode === "VVI") {
    return {
      status: "適用外",
      first: "VVIでは通常Aリード閾値評価は対象外。",
      setting: "一時設定変更なし。Aリード評価の指示がある場合は指導者に確認する。",
      check: "通常はV閾値とVリード評価を優先する。",
      branch: "Aリード搭載機種で評価指示がある場合のみ、メーカー手順に沿って確認する。",
      caution: "VVI症例でA閾値を通常項目として扱わない。"
    };
  }

  if (pattern.atrial === "AP") {
    return {
      status: "APあり",
      first: "現在のA出力、パルス幅、心房捕捉確認方法、症状を確認する。",
      setting: "プログラマーのA閾値テスト機能、または施設手順の一時出力調整でA捕捉を評価する。",
      check: "A捕捉が維持される最小出力とパルス幅を確認する。",
      branch: "閾値が許容範囲なら出力安全域を確認。高値や不安定ならAリード抵抗、P波、前回値を合わせて確認する。",
      caution: "心房捕捉は体表心電図だけで判別しにくい場合があるためEGMも見る。"
    };
  }

  return {
    status: "APを出して評価",
    first: "自己P波が優位な状態のため、心房ペーシングを安全に出せるか確認する。",
    setting: "A閾値テスト機能、または下限レート調整などでAPが出る条件を施設手順内で作る。",
    check: "APが出た状態でA捕捉閾値を測定する。",
    branch: "APを安全に出せれば測定。自己心房波が速い、競合、症状がある場合は無理に継続しない。",
    caution: "心房頻拍やAFがある場合はA閾値測定の可否を指導者に確認する。"
  };
}

function avConductionInstruction(pattern) {
  if (pattern.mode === "VVI") {
    return {
      status: "AV同期評価外",
      first: "VVIではAV同期を使わないため、自己心室応答と依存度確認として整理する。",
      setting: "下限レートや一時試験設定を施設手順内で調整し、自己R波が出るか確認する。",
      check: "自己R波、基礎心拍、症状、血圧を確認する。",
      branch: "自己R波が出れば依存なし/低い可能性。出なければ依存疑いとして記録する。",
      caution: "AV伝導そのものの評価はDDD/VDD等の文脈で行う。"
    };
  }

  if (pattern.ventricular === "VS") {
    return {
      status: "AV伝導あり",
      first: "AS/AP後にVSが出ていることを確認する。",
      setting: "原則として一時設定変更は不要。必要時はAV delay設定と自己PR/AV間隔を確認する。",
      check: "AV伝導の安定性、Vペーシング率、症状との対応を確認する。",
      branch: "安定していれば記録。不安定、間欠的VP増加、症状があればAV delayや伝導変動を報告する。",
      caution: "融合や疑似融合をVSとして過大評価しない。"
    };
  }

  const avType = pattern.atrial === "AS" ? "sensed AV delay" : "paced AV delay";
  return {
    status: "AV伝導を探す",
    first: "依存度、症状、監視体制、現在のAV delayを確認する。",
    setting: `${avType}を施設手順の範囲で一時延長し、心房イベント後にVSが出るか観察する。`,
    check: "VSの有無、出現までの時間、症状、血圧を確認する。",
    branch: "VSが出ればAV伝導ありとして記録。VSが出なければCAVB/高度AVBまたは依存疑いとして記録する。",
    caution: "長いAV delayで症状や血行動態悪化があれば中止する。"
  };
}

function impedanceInstruction(pattern) {
  return {
    status: "全パターン共通",
    first: "前回値、トレンド、アラート、植込み時期、リード構成を確認する。",
    setting: "原則として一時設定変更は不要。",
    check: pattern.mode === "DDD" ? "A/Vリード抵抗をそれぞれ確認する。" : "Vリード抵抗を確認する。",
    branch: "急な上昇、急な低下、基準外、ノイズや閾値変化を伴う場合はリード異常として報告する。",
    caution: "単回値だけでなくトレンドと他項目を合わせて判断する。"
  };
}

function eventInstruction(pattern) {
  return {
    status: "診断情報確認",
    first: "症状、発生時刻、主訴、内服変更、前回以降のイベントを確認する。",
    setting: "原則として一時設定変更は不要。まず保存EGMとカウンタを読む。",
    check: pattern.mode === "DDD"
      ? "AF/AT burden、モードスイッチ、PMT、高心室レート、A/Vペーシング率を確認する。"
      : "高心室レート、Vペーシング率、ヒストグラム、レートレスポンス関連を確認する。",
    branch: "症状時刻と一致すれば医師報告へ。検出信頼性が低い場合は波高値、感度、EGMを見直す。",
    caution: "イベント数、最長持続、総時間、EGMの中身を混同しない。"
  };
}

function diseaseGoalNotRoutine(diseaseKey, goalKey, patternKey) {
  if (diseaseKey === "bradyAf" && (goalKey === "aSensing" || goalKey === "aThreshold")) {
    return "通常は低優先";
  }
  if (PACING_PATTERNS[patternKey].mode === "VVI" && (goalKey === "aSensing" || goalKey === "aThreshold")) {
    return "適用外";
  }
  return "";
}

function diseaseCautionText(diseaseKey, goalKey) {
  const map = {
    cavb: "CAVBでは自己R波やAV伝導が出ないことがあり、依存例では安全確認を最優先にする。",
    avBlock: "房室ブロックでは自己心室応答が不安定なことがあるため、V捕捉安全性を優先する。",
    sickSinus: "洞不全ではAP主体になりやすく、P波確認では自己P波が出る条件を作れるかが分岐になる。",
    bradyAf: "徐脈性AFではVVI/Vリード評価が中心で、心房同期評価は通常主目的にならない。",
    tachyBrady: "洞不全症候群（徐脈頻脈型）では心房イベント、モードスイッチ、P波検出の信頼性を合わせて確認する。",
    sinusArrest: "洞停止・洞房ブロック型ではAP主体になりやすく、自己P波確認とAリード評価を分けて考える。",
    highGradeAvBlock: "高度房室ブロックでは伝導が間欠的なことがあり、依存度とVリード安全性を優先する。",
    postAvNodeAblation: "房室接合部アブレーション後はVペーシング依存になりやすく、V閾値測定と復帰確認を慎重に行う。"
  };
  if (goalKey === "events" && diseaseKey === "tachyBrady") {
    return "症状時刻とAF/AT burden、モードスイッチ持続時間を必ず照合する。";
  }
  return map[diseaseKey] || "";
}

function diseaseLogicNotes(diseaseKey, goalKey) {
  const common = [
    "一時設定変更の前後で、変更前設定と最終設定を記録する。",
    "依存あり・依存疑いでは、自己脈確認や閾値測定を指導者確認のもとで行う。",
    "メーカーごとのテスト機能名、AV search、AV hysteresis、auto capture等の表示差に注意する。"
  ];
  const diseaseSpecific = {
    cavb: [
      "AS-VP/AP-VPではV波高値をそのまま評価できないことがあり、VSが出るかを安全に確認する。",
      "AV delayを延長してもVSが出ない場合は、CAVBとして自然な結果なので評価困難を記録する。"
    ],
    avBlock: [
      "間欠性AVBでは同じ設定でもAS-VSとAS-VPが混在することがある。",
      "V閾値、V波高値、Vリード抵抗をセットで見て、依存度を明確にする。"
    ],
    sickSinus: [
      "AP主体ではP波が出にくく、A波高値評価には下限レート調整などが必要になることがある。",
      "AV伝導が保たれているとAP-VSになりやすく、V閾値確認時はVPを出す工程が必要。"
    ],
    bradyAf: [
      "VVIではR波、V閾値、Vリード抵抗、レートレスポンスが中心。",
      "心房波やA閾値は通常の主評価ではなく、機種・指示に応じて扱う。"
    ],
    tachyBrady: [
      "P波低下は心房イベント検出の過小評価につながるため、イベント確認とAセンシング確認を結びつける。",
      "モードスイッチは回数、持続時間、EGM、症状時刻を分けて見る。"
    ],
    sinusArrest: [
      "AP主体ではP波波高値を直接評価できないため、ASが出る条件を作れるかが分岐になる。",
      "洞停止・洞房ブロックの記録は症状時刻、ヒストグラム、休止イベントと合わせて見る。"
    ],
    highGradeAvBlock: [
      "2:1やMobitz IIではAS-VPとAS-VSが混在し、短時間だけのVSで依存度を過小評価しない。",
      "V波高値、V閾値、Vリード抵抗をセットで確認し、AV delay変更後は必ず戻す。"
    ],
    postAvNodeAblation: [
      "自己R波が出ないことは想定されるため、評価困難の記録とV閾値安全域を優先する。",
      "下限レートやレートレスポンスは症状・ヒストグラムと合わせて確認する。"
    ]
  };
  const goalSpecific = {
    vSensing: ["V波高値は自己R波が出て初めて評価できる。VPだけをR波波高値として扱わない。"],
    aSensing: ["A波高値は自己P波が出て初めて評価できる。APだけをP波波高値として扱わない。"],
    vThreshold: ["V閾値はVペーシングを出して捕捉を確認する。VS主体ではVPを出す工程が必要。"],
    aThreshold: ["A閾値はAペーシングを出して捕捉を確認する。AS主体ではAPを出す工程が必要。"],
    avConduction: ["AV伝導評価ではAV delay内のVS有無と患者状態を同時に見る。"],
    impedance: ["抵抗は設定変更なしで見られるが、異常時は閾値・波高値・ノイズと合わせる。"],
    events: ["イベントはカウンタだけでなく保存EGMを確認し、検出の妥当性を評価する。"]
  };

  return [...(diseaseSpecific[diseaseKey] || []), ...(goalSpecific[goalKey] || []), ...common];
}

function patternLabel(pattern) {
  if (!pattern) return "未選択";
  return PACING_PATTERNS[pattern] ? PACING_PATTERNS[pattern].label : pattern;
}

function currentSteps() {
  const disease = DISEASES[state.disease];
  const mode = MODES[state.mode];
  return [...BASE_STEPS, ...mode.steps, ...disease.extraSteps, ...logicProcedureSteps()];
}

function currentSimulatorScenario() {
  return SIMULATOR_SCENARIOS.find((scenario) => scenario.id === state.simulator.scenarioId) || SIMULATOR_SCENARIOS[0];
}

function resetSimulator(scenarioId) {
  const scenario = SIMULATOR_SCENARIOS.find((item) => item.id === scenarioId) || SIMULATOR_SCENARIOS[0];
  state.simulator = {
    scenarioId: scenario.id,
    settings: { ...scenario.initialSettings },
    completed: [],
    measurements: {},
    score: 0,
    feedback: "症例を読み、最初に必要な安全確認から始めてください。",
    lastAction: ""
  };
}

function renderSimulator() {
  if (!document.getElementById("simulatorScore")) return;
  const scenario = currentSimulatorScenario();
  const pattern = computeSimulatorPattern(scenario);
  const nextAction = scenario.solution[state.simulator.completed.length];
  const done = state.simulator.completed.length;
  const total = scenario.solution.length;
  document.getElementById("simulatorScore").textContent = `${state.simulator.score}点`;
  document.getElementById("simulatorScore").className = state.simulator.score >= 80 ? "status-pill ok" : "status-pill warn";

  document.getElementById("simulatorCaseCard").innerHTML = `
    <div class="simulator-case-head">
      <div>
        <p class="eyebrow">${escapeHtml(scenario.disease)} / ${escapeHtml(scenario.mode)}</p>
        <h3>${escapeHtml(scenario.title)}</h3>
      </div>
      <span class="status-pill">${done}/${total}</span>
    </div>
    <p>${escapeHtml(scenario.objective)}</p>
    <div class="simulator-badges">
      <span class="mode-badge">${escapeHtml(pattern.label)}</span>
      <span class="mode-badge">次: ${escapeHtml(actionLabel(nextAction) || "完了")}</span>
    </div>
    <p class="simulator-teaching">${escapeHtml(scenario.teaching)}</p>
  `;

  document.getElementById("simulatorSettings").innerHTML = renderSimulatorSettings(scenario, pattern);
  document.getElementById("simulatorActions").innerHTML = SIMULATOR_ACTIONS.map((action) => `
    <button class="simulator-action" type="button" data-simulator-action="${action.id}">
      <span>${escapeHtml(action.group)}</span>
      ${escapeHtml(action.label)}
    </button>
  `).join("");
  document.getElementById("simulatorMeasurements").innerHTML = renderSimulatorMeasurements(scenario, pattern);
  document.getElementById("simulatorFeedback").innerHTML = `
    <strong>${state.simulator.score >= 100 ? "クリア" : "フィードバック"}</strong>
    <p>${escapeHtml(state.simulator.feedback)}</p>
  `;

  document.querySelectorAll("[data-simulator-action]").forEach((button) => {
    button.addEventListener("click", () => {
      performSimulatorAction(button.dataset.simulatorAction);
    });
  });

  window.requestAnimationFrame(() => drawSimulatorEcg(scenario, pattern));
}

function renderSimulatorSettings(scenario, pattern) {
  const settings = state.simulator.settings;
  const items = [
    ["駆動", pattern.label],
    ["下限レート", `${settings.lowerRate} ppm`],
    ["Sensed AV", scenario.mode === "DDD" ? `${settings.sensedAvDelay} ms` : "-"],
    ["Paced AV", scenario.mode === "DDD" ? `${settings.pacedAvDelay} ms` : "-"],
    ["A出力", scenario.mode === "DDD" ? `${settings.aOutput} V` : "-"],
    ["V出力", `${settings.vOutput} V`],
    ["A感度", scenario.mode === "DDD" ? `${settings.aSensitivity} mV` : "-"],
    ["V感度", `${settings.vSensitivity} mV`]
  ];
  return items.map(([label, value]) => `
    <div class="setting-cell">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
    </div>
  `).join("");
}

function renderSimulatorMeasurements(scenario, pattern) {
  const m = state.simulator.measurements;
  const rows = [
    ["P波", m.pWave ? `${m.pWave} mV` : "未測定"],
    ["R波", m.rWave ? `${m.rWave} mV` : "未測定"],
    ["A閾値", m.aThreshold ? `${m.aThreshold} V` : "未測定"],
    ["V閾値", m.vThreshold ? `${m.vThreshold} V` : "未測定"],
    ["A抵抗", scenario.physiology.aImpedance ? `${scenario.physiology.aImpedance} ohm` : "-"],
    ["V抵抗", scenario.physiology.vImpedance ? `${scenario.physiology.vImpedance} ohm` : "-"]
  ];
  return `
    <h3>測定メモ</h3>
    <table>
      <tbody>
        ${rows.map(([label, value]) => `<tr><th>${escapeHtml(label)}</th><td>${escapeHtml(value)}</td></tr>`).join("")}
      </tbody>
    </table>
    <p>${escapeHtml(pattern.description)}</p>
  `;
}

function computeSimulatorPattern(scenario) {
  const settings = state.simulator.settings;
  if (scenario.mode === "VVI") {
    const hasVs = scenario.physiology.intrinsicVRate && scenario.physiology.intrinsicVRate >= settings.lowerRate;
    const key = hasVs ? "VVI-VS" : "VVI-VP";
    return PACING_PATTERNS[key];
  }

  const hasAs = scenario.physiology.sinusRate && scenario.physiology.sinusRate >= settings.lowerRate;
  const atrial = hasAs ? "AS" : "AP";
  const avDelay = atrial === "AS" ? settings.sensedAvDelay : settings.pacedAvDelay;
  const hasVs = scenario.physiology.avConductionDelay && avDelay >= scenario.physiology.avConductionDelay;
  const ventricular = hasVs ? "VS" : "VP";
  return PACING_PATTERNS[`${atrial}-${ventricular}`];
}

function performSimulatorAction(actionId) {
  const scenario = currentSimulatorScenario();
  applySimulatorAction(actionId, scenario);
  scoreSimulatorAction(actionId, scenario);
  syncSimulatorToMeasurements(actionId, scenario);
  renderSimulator();
  renderReport();
  markDirty();
}

function applySimulatorAction(actionId, scenario) {
  const settings = state.simulator.settings;
  if (actionId === "extendSensedAv") {
    settings.sensedAvDelay = Math.max(settings.sensedAvDelay, 330);
  }
  if (actionId === "extendPacedAv") {
    settings.pacedAvDelay = Math.max(settings.pacedAvDelay, 340);
  }
  if (actionId === "lowerRate") {
    settings.lowerRate = scenario.mode === "VVI" ? 40 : 45;
  }
  if (actionId === "restore") {
    state.simulator.settings = { ...scenario.initialSettings };
  }
  if (actionId === "measureAWave") {
    const pattern = computeSimulatorPattern(scenario);
    if (pattern.atrial === "AS" && scenario.physiology.pWave) {
      state.simulator.measurements.pWave = scenario.physiology.pWave;
      state.simulator.feedback = `P波 ${scenario.physiology.pWave} mV を記録しました。A感度設定との余裕を確認します。`;
    } else {
      state.simulator.feedback = "ASが出ていないため、P波波高値は測定できません。自己P波が出る条件を作る必要があります。";
    }
  }
  if (actionId === "measureVWave") {
    const pattern = computeSimulatorPattern(scenario);
    if (pattern.ventricular === "VS" && scenario.physiology.rWave) {
      state.simulator.measurements.rWave = scenario.physiology.rWave;
      state.simulator.feedback = `R波 ${scenario.physiology.rWave} mV を記録しました。V感度設定との余裕を確認します。`;
    } else {
      state.simulator.feedback = "VSが出ていないため、R波波高値は測定できません。自己R波の有無を先に確認します。";
    }
  }
  if (actionId === "runAThreshold") {
    if (scenario.mode === "DDD" && scenario.physiology.aThreshold) {
      state.simulator.measurements.aThreshold = scenario.physiology.aThreshold;
      state.simulator.feedback = `A捕捉閾値 ${scenario.physiology.aThreshold} V を記録しました。`;
    } else {
      state.simulator.feedback = "この症例ではA閾値テストは主目的ではありません。";
    }
  }
  if (actionId === "runVThreshold") {
    if (scenario.physiology.vThreshold) {
      state.simulator.measurements.vThreshold = scenario.physiology.vThreshold;
      state.simulator.feedback = `V捕捉閾値 ${scenario.physiology.vThreshold} V を記録しました。`;
    }
  }
  if (actionId === "markUnmeasurable") {
    state.simulator.measurements.unmeasurable = "自己波確認困難";
    state.simulator.feedback = "自己波が確認できないため、評価困難として記録しました。";
  }
}

function scoreSimulatorAction(actionId, scenario) {
  const expected = scenario.solution[state.simulator.completed.length];
  const action = actionLabel(actionId);
  if (!expected) {
    state.simulator.feedback = "この症例はクリア済みです。別の症例に挑戦できます。";
    return;
  }

  if (actionId === expected) {
    state.simulator.completed.push(actionId);
    state.simulator.score = Math.min(100, state.simulator.score + Math.round(100 / scenario.solution.length));
    state.simulator.lastAction = actionId;
    const customFeedbackActions = ["measureAWave", "measureVWave", "runAThreshold", "runVThreshold", "markUnmeasurable"];
    if (!customFeedbackActions.includes(actionId)) {
      state.simulator.feedback = `${action} は正しい順番です。次の操作へ進みます。`;
    }
    if (state.simulator.completed.length === scenario.solution.length) {
      state.simulator.score = 100;
      state.simulator.feedback = "クリアです。設定復帰と記録まで完了しました。";
    }
    return;
  }

  if (scenario.solution.includes(actionId)) {
    state.simulator.score = Math.max(0, state.simulator.score - 3);
    state.simulator.feedback = `${action} は必要ですが順番が早いです。次は ${actionLabel(expected)} を選びます。`;
    return;
  }

  state.simulator.score = Math.max(0, state.simulator.score - 6);
  state.simulator.feedback = `${action} はこの症例の主ルートではありません。次は ${actionLabel(expected)} を選びます。`;
}

function syncSimulatorToMeasurements(actionId, scenario) {
  const m = state.simulator.measurements;
  if (actionId === "measureAWave" && m.pWave) {
    state.measurements.pWave = String(m.pWave);
  }
  if (actionId === "measureVWave" && m.rWave) {
    state.measurements.rWave = String(m.rWave);
  }
  if (actionId === "runAThreshold" && m.aThreshold) {
    state.measurements.aThresholdVoltage = String(m.aThreshold);
  }
  if (actionId === "runVThreshold" && m.vThreshold) {
    state.measurements.vThresholdVoltage = String(m.vThreshold);
  }
  if (scenario.physiology.aImpedance) {
    state.measurements.aImpedance = String(scenario.physiology.aImpedance);
  }
  if (scenario.physiology.vImpedance) {
    state.measurements.vImpedance = String(scenario.physiology.vImpedance);
  }
}

function actionLabel(actionId) {
  const action = SIMULATOR_ACTIONS.find((item) => item.id === actionId);
  return action ? action.label : "";
}

function drawSimulatorEcg(scenario, pattern) {
  const canvas = document.getElementById("simulatorEcgCanvas");
  if (!canvas) return;
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const width = Math.max(720, Math.floor(rect.width || 1040));
  const height = 330;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.height = `${height}px`;
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);
  drawEcgGrid(ctx, width, height);

  const baseline = 150;
  const beats = 5;
  const beatWidth = width / beats;
  ctx.strokeStyle = "#20313a";
  ctx.lineWidth = 2;
  for (let i = 0; i < beats; i++) {
    drawBeat(ctx, i * beatWidth + 24, beatWidth - 18, baseline, pattern, scenario);
  }

  ctx.fillStyle = "#24303a";
  ctx.font = "700 14px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif";
  ctx.fillText(`ECG / Marker: ${pattern.label}`, 18, 26);
  ctx.fillStyle = "#68737c";
  ctx.font = "12px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif";
  ctx.fillText("練習用の模式波形です。実機・実波形とは表示が異なります。", 18, height - 18);
}

function drawEcgGrid(ctx, width, height) {
  ctx.fillStyle = "#fbfdfc";
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = "#e4eeeb";
  ctx.lineWidth = 1;
  for (let x = 0; x < width; x += 20) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y < height; y += 20) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
  ctx.strokeStyle = "#cddbd7";
  for (let x = 0; x < width; x += 100) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y < height; y += 100) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
}

function drawBeat(ctx, x, w, baseline, pattern, scenario) {
  const atrialX = x + 26;
  const ventricularX = x + w * 0.58;
  if (pattern.atrial === "AP") {
    drawPacerSpike(ctx, atrialX, baseline - 4, "#0f766e");
  }
  if (pattern.ventricular === "VP") {
    drawPacerSpike(ctx, ventricularX - 8, baseline - 8, "#b45309");
  }

  ctx.save();
  ctx.strokeStyle = "#20313a";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, baseline);
  if (pattern.atrial === "AP") {
    drawPWave(ctx, atrialX + 8, baseline, 0.7);
  } else if (pattern.atrial === "AS") {
    drawPWave(ctx, atrialX, baseline, 1);
  }

  if (pattern.ventricular === "VP") {
    drawQrs(ctx, ventricularX, baseline, true);
  } else {
    drawQrs(ctx, ventricularX, baseline, false);
  }

  ctx.lineTo(x + w, baseline);
  ctx.stroke();
  ctx.restore();

  if (pattern.atrial === "AP") {
    drawMarker(ctx, atrialX, baseline + 64, "AP", "#0f766e");
  } else if (pattern.atrial === "AS") {
    drawMarker(ctx, atrialX, baseline + 64, "AS", "#1d4f7a");
  }
  if (pattern.ventricular === "VP") {
    drawMarker(ctx, ventricularX, baseline + 64, "VP", "#b45309");
  } else {
    drawMarker(ctx, ventricularX, baseline + 64, "VS", "#1d4f7a");
  }
}

function drawPWave(ctx, x, baseline, scale) {
  ctx.lineTo(x, baseline);
  ctx.quadraticCurveTo(x + 10, baseline - 18 * scale, x + 20, baseline);
  ctx.lineTo(x + 36, baseline);
}

function drawQrs(ctx, x, baseline, paced) {
  const width = paced ? 34 : 24;
  const depth = paced ? 42 : 32;
  const height = paced ? 82 : 72;
  ctx.lineTo(x - 10, baseline);
  ctx.lineTo(x - 4, baseline + 14);
  ctx.lineTo(x + 6, baseline - height);
  ctx.lineTo(x + width * 0.55, baseline + depth);
  ctx.lineTo(x + width, baseline);
  ctx.quadraticCurveTo(x + width + 22, baseline - 18, x + width + 46, baseline);
}

function drawPacerSpike(ctx, x, y, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y + 42);
  ctx.lineTo(x, y - 26);
  ctx.stroke();
  ctx.restore();
}

function drawMarker(ctx, x, y, label, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.fillRect(x - 18, y, 42, 24);
  ctx.fillStyle = "#ffffff";
  ctx.font = "700 12px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif";
  ctx.fillText(label, x - 12, y + 16);
  ctx.restore();
}

function renderProcedure() {
  const steps = currentSteps();
  document.getElementById("procedureContent").innerHTML = steps
    .map((step, index) => {
      const checked = state.checklist[step.id] ? "checked" : "";
      return `
        <article class="step-card">
          <input id="${step.id}" data-step-id="${step.id}" type="checkbox" ${checked}>
          <div>
            <h3>${index + 1}. ${escapeHtml(step.title)}</h3>
            <p>${escapeHtml(step.detail)}</p>
            <small>${escapeHtml(step.caution)}</small>
          </div>
        </article>
      `;
    })
    .join("");

  document.querySelectorAll("[data-step-id]").forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      state.checklist[checkbox.dataset.stepId] = checkbox.checked;
      updateProcedureProgress();
      renderReport();
      markDirty();
    });
  });
  updateProcedureProgress();
}

function updateProcedureProgress() {
  const steps = currentSteps();
  const done = steps.filter((step) => state.checklist[step.id]).length;
  document.getElementById("procedureProgress").textContent = `${done}/${steps.length}`;
}

function renderMeasurements() {
  bindStandards();
  const groups = measurementGroupsForMode();
  document.getElementById("measurementFields").innerHTML = groups.map(renderMeasurementGroup).join("");
  document.querySelectorAll("[data-measure]").forEach((element) => {
    const key = element.dataset.measure;
    element.value = state.measurements[key] ?? "";
    element.addEventListener("input", () => {
      state.measurements[key] = element.value;
      updateMetricBadge(key);
      updateMeasurementSummary();
      renderReport();
      markDirty();
    });
  });
  updateAllMetricBadges();
  updateMeasurementSummary();
}

function bindStandards() {
  document.querySelectorAll("[data-standard]").forEach((element) => {
    const key = element.dataset.standard;
    element.value = state.standards[key] ?? "";
    element.oninput = () => {
      state.standards[key] = Number(element.value);
      updateAllMetricBadges();
      updateMeasurementSummary();
      renderReport();
      markDirty();
    };
  });
}

function measurementGroupsForMode() {
  if (state.mode === "DDD") {
    return [MEASUREMENT_GROUPS.common, MEASUREMENT_GROUPS.atrial, MEASUREMENT_GROUPS.ventricular, MEASUREMENT_GROUPS.dddTiming];
  }
  return [MEASUREMENT_GROUPS.common, MEASUREMENT_GROUPS.ventricular];
}

function renderMeasurementGroup(group) {
  const isFull = group.title === "基本情報" || group.title === "DDDタイミング・イベント";
  return `
    <article class="measurement-card ${isFull ? "full" : ""}">
      <h3>${escapeHtml(group.title)}</h3>
      ${group.fields.map(renderMeasurementField).join("")}
    </article>
  `;
}

function renderMeasurementField(field) {
  const input = field.type === "textarea"
    ? `<textarea id="measure-${field.key}" data-measure="${field.key}"></textarea>`
    : `<input id="measure-${field.key}" data-measure="${field.key}" type="${field.type}" step="0.1">`;
  return `
    <div class="field-row">
      <label for="measure-${field.key}">
        <span>${escapeHtml(field.label)}</span>
        ${input}
      </label>
      <span class="unit">${escapeHtml(field.unit)}</span>
      <span class="status-pill metric-result muted" data-result-for="${field.key}">未入力</span>
    </div>
  `;
}

function updateAllMetricBadges() {
  measurementGroupsForMode()
    .flatMap((group) => group.fields)
    .forEach((field) => updateMetricBadge(field.key));
}

function updateMetricBadge(key) {
  const badge = document.querySelector(`[data-result-for="${key}"]`);
  if (!badge) return;
  const result = evaluateMetric(key, state.measurements[key]);
  badge.textContent = result.label;
  badge.className = `status-pill metric-result ${result.className}`;
}

function updateMeasurementSummary() {
  const results = measurementGroupsForMode()
    .flatMap((group) => group.fields)
    .map((field) => evaluateMetric(field.key, state.measurements[field.key]));
  const filled = results.filter((result) => result.status !== "empty").length;
  const concerns = results.filter((result) => result.status === "concern").length;
  const summary = document.getElementById("measurementSummary");
  if (filled === 0) {
    summary.textContent = "未入力";
    summary.className = "status-pill muted";
  } else if (concerns > 0) {
    summary.textContent = `要確認 ${concerns}件`;
    summary.className = "status-pill danger";
  } else {
    summary.textContent = "入力済み";
    summary.className = "status-pill ok";
  }
}

function evaluateMetric(key, rawValue) {
  if (rawValue === undefined || rawValue === null || rawValue === "") {
    return { label: "未入力", className: "muted", status: "empty" };
  }

  const numericKeys = new Set([
    "aImpedance",
    "vImpedance",
    "pWave",
    "rWave",
    "aThresholdVoltage",
    "vThresholdVoltage",
    "lowerRate",
    "aPacingPercent",
    "vPacingPercent",
    "upperTrackingRate"
  ]);

  if (!numericKeys.has(key)) {
    return { label: "記録済み", className: "ok", status: "ok" };
  }

  const value = Number(rawValue);
  if (!Number.isFinite(value)) {
    return { label: "要確認", className: "danger", status: "concern" };
  }

  if (key === "aImpedance" || key === "vImpedance") {
    if (value < state.standards.impedanceMin || value > state.standards.impedanceMax) {
      return { label: "要確認", className: "danger", status: "concern" };
    }
    return { label: "基準内", className: "ok", status: "ok" };
  }

  if (key === "pWave") {
    if (value < state.standards.pWaveMin) {
      return { label: "要確認", className: "warn", status: "concern" };
    }
    return { label: "基準内", className: "ok", status: "ok" };
  }

  if (key === "rWave") {
    if (value < state.standards.rWaveMin) {
      return { label: "要確認", className: "warn", status: "concern" };
    }
    return { label: "基準内", className: "ok", status: "ok" };
  }

  if (key === "aThresholdVoltage") {
    if (value > state.standards.aThresholdMax) {
      return { label: "要確認", className: "warn", status: "concern" };
    }
    return { label: "基準内", className: "ok", status: "ok" };
  }

  if (key === "vThresholdVoltage") {
    if (value > state.standards.vThresholdMax) {
      return { label: "要確認", className: "warn", status: "concern" };
    }
    return { label: "基準内", className: "ok", status: "ok" };
  }

  if (key === "aPacingPercent" || key === "vPacingPercent") {
    if (value < 0 || value > 100) {
      return { label: "要確認", className: "danger", status: "concern" };
    }
    return { label: "記録済み", className: "ok", status: "ok" };
  }

  return { label: "記録済み", className: "ok", status: "ok" };
}

function renderScenario() {
  const scenario = SCENARIOS.find((item) => item.id === state.scenarioId) || SCENARIOS[0];
  const feedback = state.scenarioChoice !== null && state.scenarioChoice !== undefined
    ? scenario.choices[state.scenarioChoice]
    : null;
  document.getElementById("scenarioCard").innerHTML = `
    <h3>${escapeHtml(scenario.title)}</h3>
    <p><strong>疾患:</strong> ${escapeHtml(scenario.disease)} / <strong>モード:</strong> ${escapeHtml(scenario.mode)}</p>
    <p>${escapeHtml(scenario.body)}</p>
    <p><strong>${escapeHtml(scenario.question)}</strong></p>
    <div class="choice-grid">
      ${scenario.choices
        .map((choice, index) => `
          <button class="choice-button" type="button" data-choice="${index}">
            ${escapeHtml(choice.label)}
          </button>
        `)
        .join("")}
    </div>
    ${feedback ? `<div class="feedback-box ${feedback.correct ? "ok" : "warn"}">${escapeHtml(feedback.feedback)}</div>` : ""}
  `;

  document.querySelectorAll("[data-choice]").forEach((button) => {
    button.addEventListener("click", () => {
      state.scenarioChoice = Number(button.dataset.choice);
      renderScenario();
      renderReport();
      markDirty();
    });
  });
}

function renderReport() {
  const disease = DISEASES[state.disease];
  const mode = MODES[state.mode];
  const steps = currentSteps();
  const doneSteps = steps.filter((step) => state.checklist[step.id]).length;
  const fields = measurementGroupsForMode().flatMap((group) => group.fields.map((field) => ({ ...field, group: group.title })));
  const concernRows = fields
    .map((field) => ({ field, result: evaluateMetric(field.key, state.measurements[field.key]) }))
    .filter((item) => item.result.status === "concern");
  const scenario = SCENARIOS.find((item) => item.id === state.scenarioId) || SCENARIOS[0];
  const logicPlan = currentLogicPlan();
  const logicDone = logicPlan.steps.filter((step) => state.checklist[step.id]).length;
  const simulatorScenario = currentSimulatorScenario();
  const simulatorPattern = computeSimulatorPattern(simulatorScenario);

  document.getElementById("reportContent").innerHTML = `
      <h2>CIED Check Studio レポート</h2>
    <p class="print-note">教育・手順支援用。最終判断は施設手順、医師指示、各社プログラマーマニュアルに従う。</p>

    <div class="report-grid">
      ${reportCell("チェック日", state.checkDate)}
      ${reportCell("患者ID", state.patientId)}
      ${reportCell("担当者", state.operator)}
      ${reportCell("指導者", state.supervisor)}
      ${reportCell("疾患", disease.name)}
      ${reportCell("モード", mode.name)}
      ${reportCell("現在の駆動", patternLabel(state.pacingPattern))}
      ${reportCell("メーカー", state.maker)}
      ${reportCell("依存度", state.dependency || "未確認")}
    </div>

    <section class="report-section">
      <h3>重点確認</h3>
      <table class="report-table">
        <tbody>
          <tr><th>疾患別の見方</th><td>${escapeHtml(disease.short)}</td></tr>
          <tr><th>重点項目</th><td>${escapeHtml(disease.focus.join(" / "))}</td></tr>
          <tr><th>安全確認</th><td>${state.safetyConfirmed ? "確認済み" : "未確認"}</td></tr>
          <tr><th>手順進捗</th><td>${doneSteps} / ${steps.length}</td></tr>
        </tbody>
      </table>
    </section>

    <section class="report-section">
      <h3>ロジック学習</h3>
      <table class="report-table">
        <tbody>
          <tr><th>確認項目</th><td>${escapeHtml(logicPlan.goal.label)}</td></tr>
          <tr><th>選択工程</th><td>${escapeHtml(logicPlan.title)}</td></tr>
          <tr><th>一時設定</th><td>${escapeHtml(logicPlan.instruction.setting)}</td></tr>
          <tr><th>分岐</th><td>${escapeHtml(logicPlan.instruction.branch)}</td></tr>
          <tr><th>工程進捗</th><td>${logicDone} / ${logicPlan.steps.length}</td></tr>
        </tbody>
      </table>
    </section>

    <section class="report-section">
      <h3>CIED Check Arena</h3>
      <table class="report-table">
        <tbody>
          <tr><th>症例</th><td>${escapeHtml(simulatorScenario.title)}</td></tr>
          <tr><th>現在の作動</th><td>${escapeHtml(simulatorPattern.label)}</td></tr>
          <tr><th>スコア</th><td>${state.simulator.score}点</td></tr>
          <tr><th>測定結果</th><td>${escapeHtml(simulatorMeasurementSummary())}</td></tr>
        </tbody>
      </table>
    </section>

    <section class="report-section">
      <h3>測定値</h3>
      <table class="report-table">
        <thead>
          <tr>
            <th>分類</th>
            <th>項目</th>
            <th>値</th>
            <th>単位</th>
            <th>確認</th>
          </tr>
        </thead>
        <tbody>
          ${fields.map((field) => reportMeasurementRow(field)).join("")}
        </tbody>
      </table>
    </section>

    <section class="report-section">
      <h3>要確認</h3>
      ${concernRows.length > 0
        ? `<ul>${concernRows.map((item) => `<li>${escapeHtml(item.field.label)}: ${escapeHtml(item.result.label)}</li>`).join("")}</ul>`
        : "<p>入力済み項目の範囲では要確認表示なし。</p>"}
    </section>

    <section class="report-section">
      <h3>手順チェック</h3>
      <table class="report-table">
        <tbody>
          ${steps.map((step, index) => `
            <tr>
              <th>${index + 1}</th>
              <td>${escapeHtml(step.title)}</td>
              <td>${state.checklist[step.id] ? "確認済み" : "未確認"}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </section>

    <section class="report-section">
      <h3>症例シミュレーション</h3>
      <table class="report-table">
        <tbody>
          <tr><th>選択症例</th><td>${escapeHtml(scenario.title)}</td></tr>
          <tr><th>結果</th><td>${scenarioResultText(scenario)}</td></tr>
        </tbody>
      </table>
    </section>

    <div class="sign-row">
      <div class="sign-box">担当者署名</div>
      <div class="sign-box">指導者確認</div>
    </div>
  `;
}

function reportCell(label, value) {
  return `
    <div class="report-cell">
      <span>${escapeHtml(label)}</span>
      ${escapeHtml(value || "未入力")}
    </div>
  `;
}

function reportMeasurementRow(field) {
  const value = state.measurements[field.key] || "未入力";
  const result = evaluateMetric(field.key, state.measurements[field.key]);
  return `
    <tr>
      <td>${escapeHtml(field.group)}</td>
      <td>${escapeHtml(field.label)}</td>
      <td>${escapeHtml(value)}</td>
      <td>${escapeHtml(field.unit)}</td>
      <td>${escapeHtml(result.label)}</td>
    </tr>
  `;
}

function simulatorMeasurementSummary() {
  const m = state.simulator.measurements;
  const items = [];
  if (m.pWave) items.push(`P波 ${m.pWave} mV`);
  if (m.rWave) items.push(`R波 ${m.rWave} mV`);
  if (m.aThreshold) items.push(`A閾値 ${m.aThreshold} V`);
  if (m.vThreshold) items.push(`V閾値 ${m.vThreshold} V`);
  if (m.unmeasurable) items.push(m.unmeasurable);
  return items.length > 0 ? items.join(" / ") : "未測定";
}

function scenarioResultText(scenario) {
  if (state.scenarioChoice === null || state.scenarioChoice === undefined) {
    return "未実施";
  }
  const choice = scenario.choices[state.scenarioChoice];
  return choice.correct ? "正答" : "要復習";
}

function showTab(tabId) {
  document.querySelectorAll(".tab-button").forEach((button) => {
    const isActive = button.dataset.tab === tabId;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-selected", String(isActive));
  });
  document.querySelectorAll(".tab-panel").forEach((panel) => {
    panel.classList.toggle("active", panel.id === tabId);
  });
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  localStorage.removeItem(LEGACY_STORAGE_KEY);
  markSaved("保存済み");
}

function resetState() {
  const confirmed = window.confirm("入力内容を初期化します。よろしいですか？");
  if (!confirmed) return;
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(LEGACY_STORAGE_KEY);
  Object.assign(state, defaultState());
  renderAll();
  markSaved("初期化済み");
}

function printReport() {
  renderReport();
  showTab("report");
  window.setTimeout(() => window.print(), 150);
}

function markDirty() {
  const status = document.getElementById("saveStatus");
  status.textContent = "未保存";
  status.className = "status-pill warn";
}

function markSaved(text) {
  const status = document.getElementById("saveStatus");
  status.textContent = text;
  status.className = "status-pill ok";
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
