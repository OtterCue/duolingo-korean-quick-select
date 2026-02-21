// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DOM 유틸 + Match 챌린지 순수 함수 모음
// content.js와 같은 전역 스코프에서 실행됨 (MV3 content script 공유 스코프)
// 의존: constants.js (SEL)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * 현재 포커스가 입력 필드인지 확인
 * @returns {boolean}
 */
function isInInputField() {
  const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
  return activeTag === 'input' || activeTag === 'textarea' || document.activeElement.isContentEditable;
}

/**
 * 현재 챌린지 타입 감지
 * @returns {string} 챌린지 타입 ('orderTapComplete', 'listenTap', 'storiesMatch', 'match', 'listenMatch', 'listenIsolation', 'stories', 'listen', 'translate', 'unknown')
 */
function detectChallengeType() {
  if (document.querySelector('[data-test*="challenge-orderTapComplete"]')) return 'orderTapComplete';
  if (document.querySelector('[data-test*="challenge-listenTap"]')) return 'listenTap';

  // Stories 모드 매칭 챌린지 (match보다 먼저 체크 - 더 구체적)
  // 🚨 수정: 페이지 전체에서 stories-element와 매치 버튼을 확인
  const storiesElements = document.querySelectorAll('[data-test="stories-element"]');
  const hasStoriesMatchButtons = document.querySelector(SEL.TAP_TOKEN);
  if (storiesElements.length > 0 && hasStoriesMatchButtons) {
    // 버튼이 stories-element 컨텍스트 내에 있는지 확인 (NG0lu 클래스는 매치 컨테이너)
    const matchContainer = document.querySelector('.NG0lu ' + SEL.TAP_TOKEN) ||
      document.querySelector('._3dO1K ' + SEL.TAP_TOKEN);
    if (matchContainer) {
      console.log('🔍 [DETECT] storiesMatch 감지됨');
      return 'storiesMatch';
    }
  }

  // Match 챌린지 (일반)
  if (document.querySelector(SEL.CHALLENGE_MATCH)) return 'match';
  if (document.querySelector(SEL.LISTEN_MATCH)) return 'listenMatch';

  // ListenIsolation 챌린지 (듣고 선택하기 - 선택지에 스피커 포함)
  // challenge-listen보다 먼저 체크 (더 구체적)
  if (document.querySelector(SEL.LISTEN_ISO)) return 'listenIsolation';

  // Stories 챌린지 (객관식)
  if (document.querySelector(SEL.STORIES_CHOICE)) return 'stories';

  // 타이핑이 필요한 챌린지 추가
  if (document.querySelector('[data-test*="challenge-listen"]')) return 'listen';
  if (document.querySelector('[data-test*="challenge-translate"]')) return 'translate';

  return 'unknown';
}

/**
 * 버튼 클릭 시각적 피드백 (살짝 눌리는 애니메이션)
 * @param {HTMLElement} button - 피드백을 적용할 버튼
 */
function applyClickFeedback(button) {
  button.style.transform = 'scale(0.95)';
  setTimeout(() => { button.style.transform = 'scale(1)'; }, 100);
}

/**
 * 상단 스피커 버튼 찾기 (선택지 내부 스피커 제외)
 * @param {HTMLElement} challengeContainer
 * @returns {HTMLElement|null}
 */
function findTopSpeakerButton(challengeContainer) {
  const allButtons = Array.from(challengeContainer.querySelectorAll('button'));

  // 선택지 내부 스피커를 제외한 오디오 버튼 찾기
  const topAudioButtons = allButtons.filter(btn => {
    // 명시적 제외
    const testAttr = btn.getAttribute('data-test') || '';
    if (['player-next', 'player-skip', 'quit-button'].some(t => testAttr.includes(t))) return false;

    // 단어 은행 및 탭 토큰 제외
    if (btn.closest(SEL.WORD_BANK)) return false;
    if (testAttr.includes('challenge-tap-token')) return false;

    // 🚨 중요: challenge-choice 내부의 버튼 제외 (선택지 내부 스피커)
    if (btn.closest('[data-test="challenge-choice"]')) return false;

    // 오디오 버튼 특성 확인
    // 1. data-test에 'audio' 포함
    if (testAttr.includes('audio')) return true;

    // 2. SVG 아이콘 포함 (스피커/거북이 아이콘)
    if (btn.querySelector('svg')) return true;

    return false;
  });

  // 첫 번째 버튼이 맨 위 스피커 (일반 속도)
  return topAudioButtons[0] || null;
}

/** stories/page-wide 컨테이너 fallback 탐색 (challenge-match 이후 단계) */
function findMatchContainer() {
  const storiesMatchContainer = document.querySelector('.NG0lu') ||
    document.querySelector('._3dO1K');
  if (storiesMatchContainer) {
    const storiesButtons = Array.from(storiesMatchContainer.querySelectorAll(SEL.TAP_TOKEN));
    if (storiesButtons.length > 0) {
      console.log(`🔍 [STORIES-MATCH] 스토리 매치 컨테이너 발견, 버튼 ${storiesButtons.length}개`);
      return storiesMatchContainer;
    }
  }

  const anyMatchButtons = document.querySelectorAll(SEL.TAP_TOKEN);
  if (anyMatchButtons.length > 0) {
    console.log(`🔍 [STORIES-MATCH] 페이지 전체에서 버튼 ${anyMatchButtons.length}개 발견`);
    return document.body;
  }

  return null;
}

/** span._3zbIX 번호 → 버튼 맵 빌드 */
function buildNumberedButtonMap(allButtons) {
  const buttonNumberMap = {};
  allButtons.forEach(button => {
    const numberSpan = button.querySelector('span._3zbIX, span[class*="_3zbIX"]');
    if (numberSpan) {
      buttonNumberMap[numberSpan.textContent.trim()] = button;
    }
  });
  console.log(`🔍 [MATCH] 버튼 번호 발견:`, Object.keys(buttonNumberMap).sort());
  return buttonNumberMap;
}

/**
 * 숫자 span 있는 일반 Match 챌린지 keyMap 빌드
 * @param {Object} buttonNumberMap - 번호 → 버튼 맵
 * @param {Object} alternates - keyBindings.match.alternates
 */
function buildNumberedKeyMap(buttonNumberMap, alternates) {
  const keyMap = {};

  ['1', '2', '3', '4', '5', '6', '7', '8', '9'].forEach(num => {
    if (buttonNumberMap[num]) keyMap[num] = buttonNumberMap[num];
  });
  if (buttonNumberMap['0']) keyMap['0'] = buttonNumberMap['0'];

  Object.keys(alternates).forEach(altKey => {
    const targetButtonNumber = alternates[altKey];
    const displayNumber = targetButtonNumber === 10 ? '0' : String(targetButtonNumber);
    if (buttonNumberMap[displayNumber]) keyMap[altKey] = buttonNumberMap[displayNumber];
  });

  return keyMap;
}

/** 숫자 span 없을 때 DOM 순서 기반 keyMap 빌드 (storiesMatch) */
function buildDomOrderKeyMap(allButtons, matchContainer) {
  const keyMap = {};
  const columns = matchContainer.querySelectorAll('ul');
  let leftButtons = [];
  let rightButtons = [];

  if (columns.length >= 2) {
    leftButtons = Array.from(columns[0].querySelectorAll(SEL.TAP_TOKEN));
    rightButtons = Array.from(columns[1].querySelectorAll(SEL.TAP_TOKEN));
    console.log(`🔍 [STORIES-MATCH] 좌측 ${leftButtons.length}개, 우측 ${rightButtons.length}개`);
  } else {
    const half = Math.ceil(allButtons.length / 2);
    leftButtons = allButtons.slice(0, half);
    rightButtons = allButtons.slice(half);
    console.log(`🔍 [STORIES-MATCH] ul 없음 - 반으로 나눔: 좌측 ${leftButtons.length}개, 우측 ${rightButtons.length}개`);
  }

  leftButtons.forEach((btn, i) => { if (i < 5) keyMap[String(i + 1)] = btn; });
  rightButtons.forEach((btn, i) => {
    if (i < 4) keyMap[String(i + 6)] = btn;
    else if (i === 4) keyMap['0'] = btn;
  });

  const altKeys = ['q', 'w', 'e', 'r', 't'];
  rightButtons.forEach((btn, i) => { if (i < altKeys.length) keyMap[altKeys[i]] = btn; });

  console.log(`🔍 [STORIES-MATCH] keyMap 키:`, Object.keys(keyMap));
  return keyMap;
}

/**
 * word-bank에 따옴표 포함 영어 단어가 있는지 확인
 * @returns {boolean}
 */
function hasQuotedEnglishWords() {
  const wordBank = document.querySelector(SEL.WORD_BANK);
  if (!wordBank) return false;

  const buttons = wordBank.querySelectorAll('button');
  return Array.from(buttons).some(btn => {
    const text = btn.textContent.trim();
    const lang = btn.getAttribute('lang');
    // 영어 단어이면서 따옴표를 포함
    return lang === 'en' && text.includes("'");
  });
}

/**
 * word-bank에 영어 단어(lang="en")가 있는지 확인
 * 🚨 Caps Lock 문제 해결: 한글만 있으면 한글 입력 사용
 * @returns {boolean} 영어 단어가 있으면 true
 */
function hasEnglishWordsInBank() {
  const wordBank = document.querySelector(SEL.WORD_BANK);
  if (!wordBank) return false;

  const buttons = wordBank.querySelectorAll('button');
  return Array.from(buttons).some(btn => {
    const lang = btn.getAttribute('lang');
    return lang === 'en';
  });
}

/** @param {HTMLElement} button @returns {boolean} */
function isButtonVisible(button) {
  if (button.offsetParent === null) return false;
  const style = window.getComputedStyle(button);
  return button.textContent.trim() !== '' && style.opacity !== '0' && style.visibility !== 'hidden';
}

/** @param {HTMLElement} button @returns {boolean} */
function isButtonDisabled(button) {
  return button.getAttribute('aria-disabled') === 'true' || button.classList.contains('disabled');
}

/** @param {HTMLElement} button @returns {string|null} */
function getButtonLanguage(button) {
  return button.getAttribute('lang');
}
