// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 공통 상수 (DOM 셀렉터, CSS 클래스명, 정규식)
// content.js와 같은 전역 스코프에서 실행됨 (MV3 content script 공유 스코프)
// 반드시 모든 파일보다 먼저 로드되어야 함
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// DOM 셀렉터
// ⚠️ TAP_TOKEN 변형 주의: 코드베이스에 두 가지 형태가 공존
//   TAP_TOKEN     — 대시 있음 + button 포함 (가장 많이 쓰임)
//   TAP_TOKEN_ANY — 대시 없음 + button 없음 (getPlacedButtons에서 사용)
const SEL = {
  WORD_BANK:      '[data-test="word-bank"]',
  CHALLENGE:      '[data-test*="challenge-"]',
  TAP_TOKEN:      'button[data-test*="-challenge-tap-token"]',
  TAP_TOKEN_ANY:  '[data-test*="challenge-tap-token"]',
  CHALLENGE_MATCH:'[data-test*="challenge-match"]',
  LISTEN_ISO:     '[data-test*="challenge-listenIsolation"]',
  LISTEN_MATCH:   '[data-test*="challenge-listenMatch"]',
  MATCH_ROWS:     '[style*="--match-challenge-rows"]',
  STORIES_CHOICE: 'button[data-test="stories-choice"]',
  PLAYER_SKIP:    'button[data-test="player-skip"]',
  LEGENDARY_CONT: 'button[data-test="legendary-session-end-continue"]',
  SELECTED_GAP:   '[aria-label="Selected gap"]',
};

// CSS 클래스명
// ⚠️ 사용 방식에 따라 구문이 다름:
//   classList.add/remove → CLS.HIGHLIGHT (도트 없음)
//   querySelector        → '.' + CLS.HIGHLIGHT (도트 필요)
//   innerHTML 템플릿     → class="${CLS.INPUT_TEXT}" (템플릿 리터럴)
//   .className =         → CLS.INPUT_WRAP (직접 대입)
const CLS = {
  HIGHLIGHT:   'korean-quick-select-highlight',
  EXACT_MATCH: 'korean-quick-select-exact-match',
  ERROR:       'kqs-error',
  INPUT_WRAP:  'kqs-input-display',
  INPUT_TEXT:  'kqs-text',
  INPUT_HELP:  'kqs-help',
  VISIBLE:     'visible',
};

// 정규식
const REGEX = {
  KOREAN:       /[가-힣]/,
  ENGLISH_KEY:  /^[a-zA-Z]$/,
  ENGLISH_WORD: /[a-zA-Z]/,
};
