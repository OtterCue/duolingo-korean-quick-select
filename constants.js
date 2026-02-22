// 개발 모드 플래그 (프로덕션 배포 시 false, 디버깅 시 true로 변경)
const DEV = false;

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
  MATCH_CONT_A:  '.NG0lu',   // Duolingo 난독화 stories match 컨테이너 (변형 A)
  MATCH_CONT_B:  '._3dO1K',  // Duolingo 난독화 stories match 컨테이너 (변형 B)
  NUM_SPAN:      'span._3zbIX, span[class*="_3zbIX"]',  // 버튼 번호 표시 span
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

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 한국어 동의어 그룹 (양방향 매핑, 한글 단어 매칭에만 적용)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const SYNONYM_GROUPS = [
  ['우리', '저희'],
  ['우리는', '저희는', '우린', '저흰'],
  ['우리가', '저희가'],
  ['우리를', '저희를', '우릴', '저흴'],
  ['우리의', '저희의'],
  ['우리도', '저희도'],

  ['나', '저'],
  ['나는', '저는', '난', '전'],
  ['내가', '제가'],
  ['나를', '저를'],
  ['나의', '저의'],
  ['나도', '저도'],
  ['내', '제'],

  ['너', '당신'],
  ['너는', '당신은', '넌'],
  ['네가', '당신이'],
  ['너를', '당신을'],
  ['너의', '당신의'],
  ['너도', '당신도'],

  ['너희', '당신들'],
  ['너희는', '당신들은'],
  ['너희가', '당신들이'],
  ['너희를', '당신들을'],
  ['너희의', '당신들의'],
  ['너희도', '당신들도'],

  ['이거', '이것'],
  ['그거', '그것'],
  ['저거', '저것'],

  ['뭐', '무엇'],
  ['뭘', '무엇을'],
  ['뭐가', '무엇이']
];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 기본 키 바인딩 설정 (커스터마이징 가능)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const DEFAULT_KEY_BINDINGS = {
  // 글로벌 단축키
  global: {
    escape: 'Escape',
    backspace: 'Backspace',
    delete: 'Delete'
  },

  // 오디오 단축키
  audio: {
    normal: '1',    // 일반 속도
    slow: '2'       // 느린 속도
  },

  // Match 챌린지 (짝짓기)
  match: {
    buttons: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
    // alternates: 화면 버튼 번호(1-based)로 지정 (사용 시 -1 해서 인덱스로 변환)
    // 예: 'q': 6 → 6번 버튼 → buttons[5]
    alternates: {
      'q': 6,  // 6번 버튼
      'w': 7,  // 7번 버튼
      'e': 8,  // 8번 버튼
      'r': 9,  // 9번 버튼
      't': 10  // 0번 키 (듀오링고에서 0은 10번째 버튼)
    }
  },

  // Listen Match 챌린지 (듣기 짝짓기)
  listenMatch: {
    buttons: ['1', '2', '3', '4', '5', '6', '7', '8'],
    // alternates: 화면 버튼 번호(1-based)로 지정 (사용 시 -1 해서 인덱스로 변환)
    // 예: 'q': 5 → 5번 버튼 → buttons[4]
    alternates: {
      'q': 5,  // 5번 버튼
      'w': 6,  // 6번 버튼
      'e': 7,  // 7번 버튼
      'r': 8   // 8번 버튼
    }
  },

  // Stories 챌린지 (스토리 객관식)
  stories: {
    buttons: ['1', '2', '3']
  },

  // 한글 입력
  korean: {
    enter: 'Enter',
    enabled: true
  }
};
