// 영어 키보드 → 한글 자모 매핑 (QWERTY 자판 기준)
const KEY_MAP = {
  // 자음 (Consonants)
  'q': 'ㅂ', 'Q': 'ㅃ',
  'w': 'ㅈ', 'W': 'ㅉ',
  'e': 'ㄷ', 'E': 'ㄸ',
  'r': 'ㄱ', 'R': 'ㄲ',
  't': 'ㅅ', 'T': 'ㅆ',
  'a': 'ㅁ',
  's': 'ㄴ',
  'd': 'ㅇ',
  'f': 'ㄹ',
  'g': 'ㅎ',
  'z': 'ㅋ',
  'x': 'ㅌ',
  'c': 'ㅊ',
  'v': 'ㅍ',

  // 모음 (Vowels)
  'y': 'ㅛ',
  'u': 'ㅕ',
  'i': 'ㅑ',
  'o': 'ㅐ', 'O': 'ㅒ',
  'p': 'ㅔ', 'P': 'ㅖ',
  'h': 'ㅗ',
  'j': 'ㅓ',
  'k': 'ㅏ',
  'l': 'ㅣ',
  'b': 'ㅠ',
  'n': 'ㅜ',
  'm': 'ㅡ'
};

// 한글 초성 리스트
const CHOSUNG_LIST = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
// 한글 중성 리스트
const JUNGSUNG_LIST = ['ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ', 'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ'];
// 한글 종성 리스트 (0은 종성 없음)
const JONGSUNG_LIST = ['', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];

// 복합 모음 분해 맵 (키보드 입력 순서대로)
const COMPLEX_VOWELS = {
  'ㅘ': 'ㅗㅏ',
  'ㅙ': 'ㅗㅐ',
  'ㅚ': 'ㅗㅣ',
  'ㅝ': 'ㅜㅓ',
  'ㅞ': 'ㅜㅔ',
  'ㅟ': 'ㅜㅣ',
  'ㅢ': 'ㅡㅣ'
};

const HANGUL_START = 0xAC00;
const HANGUL_END = 0xD7A3;

// 텍스트에서 초성만 추출
function getChosung(text) {
  let chosung = '';
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (code >= HANGUL_START && code <= HANGUL_END) {
      const chosungIndex = Math.floor((code - HANGUL_START) / 588);
      chosung += CHOSUNG_LIST[chosungIndex];
    } else if (CHOSUNG_LIST.includes(text[i])) {
      chosung += text[i];
    } else {
      chosung += text[i]; // 한글이 아니면 그대로
    }
  }
  return chosung;
}

// 텍스트를 자모 단위로 분해 (복합 모음도 키 입력 단위로 분해)
function getDisassembled(text) {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (code >= HANGUL_START && code <= HANGUL_END) {
      const charCode = code - HANGUL_START;
      const chosungIndex = Math.floor(charCode / 588);
      const jungsungIndex = Math.floor((charCode % 588) / 28);
      const jongsungIndex = charCode % 28;

      result += CHOSUNG_LIST[chosungIndex];

      const vowel = JUNGSUNG_LIST[jungsungIndex];
      if (COMPLEX_VOWELS[vowel]) {
        result += COMPLEX_VOWELS[vowel];
      } else {
        result += vowel;
      }

      if (jongsungIndex > 0) {
        // 종성도 복합 자음인 경우 분해할 수 있으나, 
        // 현재 키 매핑상 종성 복합 자음(ㄳ, ㄵ 등)은 Shift 조합이 아니라 
        // 낱자 입력(ㄱ+ㅅ, ㄴ+ㅈ)으로 처리되므로 일단 그대로 둠.
        // 필요시 JONGSUNG_LIST 매핑 추가 가능.
        result += JONGSUNG_LIST[jongsungIndex];
      }
    } else {
      result += text[i];
    }
  }
  return result;
}

class DuolingoKoreanQuickSelect {
  constructor() {
    this.currentInput = '';
    this.highlightedButtons = [];
    this.isActive = false;

    // 통계 추적
    this.stats = {
      totalInputs: 0,
      autoSelects: 0,
      lastInput: ''
    };

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // ⚙️ 키 바인딩 설정 (커스터마이징 가능)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    this.keyBindings = {
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
        alternates: {
          'q': 5, 'w': 6, 'e': 7, 'r': 8, 't': 9
        }
      },

      // Listen Match 챌린지 (듣기 짝짓기)
      listenMatch: {
        buttons: ['1', '2', '3', '4', '5', '6', '7', '8'],
        alternates: {
          'q': 4, 'w': 5, 'e': 6, 'r': 7
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

    console.log('🎯 Duolingo Korean Quick Select 초기화 중...');
    console.log('💡 하이브리드 매칭 모드 (초성 + 자모)');

    this.injectStyles();

    // 키보드 이벤트 리스너 (window 레벨로 격상, 캡처링 사용)
    window.addEventListener('keydown', this.handleKeyDown.bind(this), true);
    console.log('✅ 키보드 이벤트 리스너 등록됨 (Window, Capture)');

    // 메시지 리스너 (팝업 통신용)
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'getStatus') {
        sendResponse({
          currentInput: this.currentInput,
          isActive: this.isActive,
          stats: this.stats
        });
      }
    });

    this.observePageChanges();

    console.log('✅ Duolingo Korean Quick Select 활성화됨!');
  }

  injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .korean-quick-select-highlight {
        background-color: white !important;
        color: #1cb0f6 !important;
        border: 2px solid #1cb0f6 !important;
        transition: all 0.1s ease;
        transform: scale(1.02);
        z-index: 10 !important;
      }
      
      .korean-quick-select-highlight * {
        background-color: transparent !important;
        color: #1cb0f6 !important;
        text-shadow: none !important;
      }
      
      .korean-quick-select-exact-match {
        background-color: white !important;
        color: #58cc02 !important;
        border: 2px solid #58cc02 !important;
        box-shadow: 0 0 0 2px #58cc02 !important;
        transform: scale(1.05);
        z-index: 11 !important;
      }

      .korean-quick-select-exact-match * {
        background-color: transparent !important;
        color: #58cc02 !important;
        text-shadow: none !important;
      }
      
      /* 화면 우측 상단 입력 표시 */
      .kqs-input-display {
        position: fixed;
        top: 100px;
        right: 20px;
        background: rgba(28, 176, 246, 0.95);
        color: white;
        padding: 15px 25px;
        border-radius: 12px;
        font-family: 'Courier New', monospace;
        font-size: 24px;
        font-weight: bold;
        z-index: 999999;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        pointer-events: none;
        opacity: 0;
        transform: translateY(-10px);
        transition: all 0.1s ease;
      }
      
      .kqs-input-display.visible {
        opacity: 1;
        transform: translateY(0);
      }
      
      .kqs-input-display .kqs-help {
        font-size: 11px;
        opacity: 0.8;
        margin-top: 5px;
      }

      .kqs-error {
        background: rgba(255, 82, 82, 0.95) !important;
        animation: shake 0.2s cubic-bezier(.36,.07,.19,.97) both;
      }

      @keyframes shake {
        10%, 90% { transform: translate3d(-1px, 0, 0); }
        20%, 80% { transform: translate3d(2px, 0, 0); }
        30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
        40%, 60% { transform: translate3d(4px, 0, 0); }
      }
    `;
    document.head.appendChild(style);
    console.log('✅ CSS 스타일 주입 완료');
  }

  createInputDisplay() {
    if (this.inputDisplay) return;

    this.inputDisplay = document.createElement('div');
    this.inputDisplay.className = 'kqs-input-display';
    this.inputDisplay.innerHTML = `
      <div class="kqs-text">대기 중...</div>
      <div class="kqs-help">초성 또는 자모 입력</div>
    `;
    document.body.appendChild(this.inputDisplay);
  }

  updateInputDisplay() {
    if (!this.inputDisplay) this.createInputDisplay();

    const textEl = this.inputDisplay.querySelector('.kqs-text');

    if (this.currentInput) {
      textEl.textContent = this.currentInput;
      this.inputDisplay.classList.add('visible');
    } else {
      setTimeout(() => {
        this.inputDisplay.classList.remove('visible');
      }, 1000);
    }
  }

  observePageChanges() {
    const observer = new MutationObserver(() => {
      this.checkIfWordBankExists();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    this.checkIfWordBankExists();
    console.log('✅ 페이지 변화 감지 시작');
  }

  checkIfWordBankExists() {
    const wordBank = document.querySelector('[data-test="word-bank"]');
    const wasActive = this.isActive;

    if (wordBank) {
      const buttons = this.getWordButtons();
      this.isActive = buttons.length > 0;

      if (wasActive !== this.isActive) {
        if (this.isActive) {
          console.log('✅ 단어 은행 발견! 빠른 선택 활성화됨');
          console.log(`📝 버튼 ${buttons.length}개 발견`);
        }
      }
    } else {
      this.isActive = false;
      if (wasActive !== this.isActive && this.currentInput !== '') {
        this.resetHighlight();
      }
    }
  }

  /**
   * 키보드 이벤트 핸들러 (메인 라우터)
   * @param {Event} event - 키보드 이벤트
   */
  handleKeyDown(event) {
    const key = event.key;

    // 🔍 [DEBUG] 모든 키 이벤트 상세 로깅
    console.log(`🔑 [KEY] key="${key}" | isTrusted=${event.isTrusted} | code="${event.code}" | keyCode=${event.keyCode} | target=${event.target.tagName}`);

    // 🚨 [최우선] 합성 이벤트 차단 (듀오링고가 버튼 클릭 시 생성하는 가짜 키 이벤트)
    if (!event.isTrusted) {
      console.log(`🚫 [BLOCKED] 합성 이벤트 차단: "${key}"`);
      return;
    }

    // 1. [최우선] Ctrl+1, Ctrl+2 오디오 단축키 (타이핑 중에도 동작)
    // 🚨 브라우저 탭 전환 방지 (필수) 및 오디오 재생
    if (event.ctrlKey && (key === '1' || key === '2')) {
      event.preventDefault(); // 탭 전환 차단
      event.stopPropagation();
      this.handleAudioShortcuts(event, key);
      return;
    }

    // 2. 입력 필드 체크
    if (this.isInInputField()) return;

    // 3. 글로벌 단축키 (ESC)
    if (this.handleGlobalShortcuts(event, key)) return;

    // [NEW] Backspace/Delete 전역 처리 (최우선 순위로 격상)
    if (key === 'Backspace' || key === 'Delete') {
      // 1) 입력 중인 글자가 있으면 지움
      if (this.currentInput.length > 0) {
        this.preventEventPropagation(event);
        this.currentInput = this.currentInput.slice(0, -1);
        console.log(`⬅️ Backspace - 현재: "${this.currentInput}"`);

        // 🚨 중요: 지울 때는 자동 선택 방지 (allowAutoSelect = false)
        this.updateHighlight(false);
        this.updateInputDisplay();
        return;
      }

      // 2) 입력 중인 글자가 없으면 -> 선택된 단어 삭제 (취소)
      // (단어 은행이 활성화된 경우에만)
      if (this.isActive) {
        const placedButtons = this.getPlacedButtons();
        if (placedButtons.length > 0) {
          this.preventEventPropagation(event);
          const lastButton = placedButtons[placedButtons.length - 1];
          console.log(`🗑️ 선택된 단어 삭제: "${lastButton.textContent.trim()}"`);
          lastButton.click();
          return;
        }
      }

      // 아무것도 해당 안 되면 기본 동작 허용
      return;
    }

    // 4. 일반 오디오 단축키 (1, 2) - 입력 필드 아닐 때만
    // (Ctrl 키가 눌리지 않았을 때만 동작하도록 내부에서 체크함)
    if (this.handleAudioShortcuts(event, key)) return;

    // 5. 챌린지별 단축키 (Match, Listen Match)
    if (this.handleChallengeShortcuts(event, key)) return;

    // 6. 한글 입력 (word-bank 필요)
    if (this.isActive) {
      this.handleKoreanInput(event, key);
    }
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🛠️ 유틸리티 메서드
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  /**
   * 입력 필드에 포커스가 있는지 확인
   * @returns {boolean} 입력 필드에 포커스가 있으면 true
   */
  isInInputField() {
    const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
    return activeTag === 'input' || activeTag === 'textarea' || document.activeElement.isContentEditable;
  }

  /**
   * 이벤트 전파 차단
   * @param {Event} event - 키보드 이벤트
   */
  preventEventPropagation(event) {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
  }

  /**
   * 현재 챌린지 타입 감지
   * @returns {string} 챌린지 타입 ('listenTap', 'match', 'listenMatch', 'unknown')
   */
  detectChallengeType() {
    if (document.querySelector('[data-test*="challenge-orderTapComplete"]')) return 'orderTapComplete';
    if (document.querySelector('[data-test*="challenge-listenTap"]')) return 'listenTap';

    // Match 챌린지 (일반 또는 Stories 내부)
    if (document.querySelector('[data-test*="challenge-match"]')) return 'match';
    if (document.querySelector('[data-test*="challenge-listenMatch"]')) return 'listenMatch';

    // Stories 챌린지 (객관식)
    if (document.querySelector('button[data-test="stories-choice"]')) return 'stories';

    // 타이핑이 필요한 챌린지 추가
    if (document.querySelector('[data-test*="challenge-listen"]')) return 'listen';
    if (document.querySelector('[data-test*="challenge-translate"]')) return 'translate';

    return 'unknown';
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🎯 핸들러 메서드 (우선순위 순)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  /**
   * 글로벌 단축키 처리 (ESC)
   * @param {Event} event - 키보드 이벤트
   * @param {string} key - 입력된 키
   * @returns {boolean} 처리했으면 true
   */
  handleGlobalShortcuts(event, key) {
    // ESC: 초기화
    if (key === this.keyBindings.global.escape) {
      this.preventEventPropagation(event);
      console.log('🔄 ESC - 초기화');
      this.resetHighlight();
      return true;
    }

    return false;
  }

  /**
   * 오디오 단축키 처리 (1, 2번)
   * @param {Event} event - 키보드 이벤트
   * @param {string} key - 입력된 키
   * @returns {boolean} 처리했으면 true
   */
  handleAudioShortcuts(event, key) {
    // 1번(일반), 2번(느림) 키 확인
    if (key !== '1' && key !== '2') return false;

    // Ctrl 키가 눌렸거나, (Ctrl 안 눌리고) 입력 필드가 아닐 때만 동작
    // (handleKeyDown에서 이미 분기 처리했지만 안전장치)
    const isCtrl = event.ctrlKey;
    if (!isCtrl && this.isInInputField()) return false;

    // 챌린지 컨테이너 찾기 (범용)
    const challengeContainer = document.querySelector('[data-test*="challenge-"]');
    if (!challengeContainer) return false;

    // 오디오 버튼 찾기 전략:
    // 1. data-test="audio-button" (일부 챌린지)
    // 2. SVG 아이콘을 포함하는 버튼 (일반적인 구조)
    // 3. 제외: 다음/건너뛰기/종료 버튼, 단어 은행 내 버튼, 탭 토큰

    const allButtons = Array.from(challengeContainer.querySelectorAll('button'));

    const audioButtons = allButtons.filter(btn => {
      // 명시적 제외
      const testAttr = btn.getAttribute('data-test') || '';
      if (['player-next', 'player-skip', 'quit-button'].some(t => testAttr.includes(t))) return false;

      // 단어 은행 및 탭 토큰 제외
      if (btn.closest('[data-test="word-bank"]')) return false;
      if (testAttr.includes('challenge-tap-token')) return false;

      // 오디오 버튼 특성 확인
      // 1. data-test에 'audio' 포함
      if (testAttr.includes('audio')) return true;

      // 2. SVG 아이콘 포함 (스피커/거북이 아이콘)
      // (단, 텍스트가 없거나 숨겨진 텍스트만 있는 경우 등은 상황에 따라 다름)
      if (btn.querySelector('svg')) return true;

      return false;
    });

    // 보통 첫 번째가 일반 속도, 두 번째가 느린 속도
    if (key === '1' && audioButtons[0]) {
      console.log('🔊 일반 속도 재생 (Ctrl+1/1)');
      audioButtons[0].click();
      return true;
    } else if (key === '2' && audioButtons[1]) {
      console.log('🐢 느린 속도 재생 (Ctrl+2/2)');
      audioButtons[1].click();
      return true;
    }

    return false;
  }

  /**
   * 챌린지별 단축키 라우터
   * @param {Event} event - 키보드 이벤트
   * @param {string} key - 입력된 키
   * @returns {boolean} 처리했으면 true
   */
  handleChallengeShortcuts(event, key) {
    const challengeType = this.detectChallengeType();

    switch (challengeType) {
      case 'match':
        return this.handleMatchChallenge(event, key);
      case 'listenMatch':
        return this.handleListenMatchChallenge(event, key);
      case 'stories':
        return this.handleStoriesChallenge(event, key);
      default:
        return false;
    }
  }

  /**
   * Match 챌린지 단축키 처리
   * @param {Event} event - 키보드 이벤트
   * @param {string} key - 입력된 키
   * @returns {boolean} 처리했으면 true
   */
  handleMatchChallenge(event, key) {
    const matchContainer = document.querySelector('[data-test*="challenge-match"]');
    if (!matchContainer) return false;

    // 모든 버튼 가져오기 (disabled 포함)
    let buttons = Array.from(matchContainer.querySelectorAll('button[data-test$="-challenge-tap-token"]'));

    // 🎯 화면상 위치 기준으로 정렬 (5행 2열 레이아웃)
    // Y 좌표(행) 우선, 같은 행에서는 X 좌표(열) 기준
    buttons = buttons.sort((a, b) => {
      const rectA = a.getBoundingClientRect();
      const rectB = b.getBoundingClientRect();

      // 행 기준 정렬 (Y 좌표, 10px 허용 오차)
      const yDiff = rectA.top - rectB.top;
      if (Math.abs(yDiff) > 10) {
        return yDiff; // 위에 있는 버튼이 먼저
      }

      // 같은 행이면 열 기준 정렬 (X 좌표)
      return rectA.left - rectB.left; // 왼쪽 버튼이 먼저
    });

    // 키 매핑: 왼쪽 열(1-5), 오른쪽 열(6-0 또는 q-t)
    const keyMap = {
      '1': 0, '2': 1, '3': 2, '4': 3, '5': 4,  // 왼쪽 열
      '6': 5, '7': 6, '8': 7, '9': 8, '0': 9,  // 오른쪽 열 (숫자)
      'q': 5, 'w': 6, 'e': 7, 'r': 8, 't': 9   // 오른쪽 열 (문자)
    };

    if (keyMap.hasOwnProperty(key.toLowerCase())) {
      const index = keyMap[key.toLowerCase()];
      if (buttons[index]) {
        const btnText = buttons[index].textContent.trim();
        const isDisabled = buttons[index].getAttribute('aria-disabled') === 'true';

        console.log(`🔗 짝짓기 선택: ${key} -> [${index}] "${btnText}" ${isDisabled ? '(disabled, 무시됨)' : ''}`);

        // disabled 버튼은 클릭해도 무시됨 (듀오링고가 처리)
        buttons[index].click();

        // 시각적 피드백
        buttons[index].style.transform = 'scale(0.95)';
        setTimeout(() => buttons[index].style.transform = 'scale(1)', 100);

        event.preventDefault();
        event.stopPropagation();
        return true;
      }
    }

    return false;
  }

  /**
   * Listen Match 챌린지 단축키 처리
   * @param {Event} event - 키보드 이벤트
   * @param {string} key - 입력된 키
   * @returns {boolean} 처리했으면 true
   */
  handleListenMatchChallenge(event, key) {
    const listenMatchContainer = document.querySelector('[data-test*="challenge-listenMatch"]');
    if (!listenMatchContainer) return false;

    // ✅ disabled된 버튼 제외 (aria-disabled="true")
    const buttons = Array.from(listenMatchContainer.querySelectorAll('button[data-test$="-challenge-tap-token"]'))
      .filter(btn => btn.getAttribute('aria-disabled') !== 'true');

    // 키 매핑 테이블 (keyBindings에서 생성)
    const keyMap = {};
    this.keyBindings.listenMatch.buttons.forEach((key, index) => {
      keyMap[key] = index;
    });
    Object.assign(keyMap, this.keyBindings.listenMatch.alternates);

    if (keyMap.hasOwnProperty(key.toLowerCase())) {
      const index = keyMap[key.toLowerCase()];
      if (buttons[index]) {
        console.log(`🎧🔗 듣기 짝짓기 선택: ${key} -> 버튼 ${index + 1} "${buttons[index].textContent.trim()}"`);
        buttons[index].click();

        // 시각적 피드백
        buttons[index].style.transform = 'scale(0.95)';
        setTimeout(() => buttons[index].style.transform = 'scale(1)', 100);

        event.preventDefault();
        event.stopPropagation();
        return true;
      }
    }

    return false;
  }

  /**
   * Stories 챌린지 단축키 처리 (객관식)
   * @param {Event} event - 키보드 이벤트
   * @param {string} key - 입력된 키
   * @returns {boolean} 처리했으면 true
   */
  handleStoriesChallenge(event, key) {
    console.log(`📖 [STORIES] handleStoriesChallenge 진입 - key: "${key}"`);

    // Stories 선택지 버튼 찾기
    const choiceButtons = Array.from(document.querySelectorAll('button[data-test="stories-choice"]'));
    console.log(`📖 [STORIES] 선택지 버튼 발견: ${choiceButtons.length}개`);

    if (choiceButtons.length === 0) {
      console.log(`⚠️ [STORIES] Stories 선택지 버튼을 찾을 수 없습니다`);
      return false;
    }

    // 키 인덱스 찾기
    const keyIndex = this.keyBindings.stories.buttons.indexOf(key);
    console.log(`📖 [STORIES] 키 "${key}"의 인덱스: ${keyIndex}`);

    if (keyIndex !== -1 && choiceButtons[keyIndex]) {
      const targetButton = choiceButtons[keyIndex];
      const choiceText = targetButton.closest('li')?.textContent.trim().substring(0, 50) || '(텍스트 없음)';

      console.log(`📖 [STORIES] 선택: ${key} -> 버튼 ${keyIndex + 1} (${choiceText}...)`);

      // 버튼 클릭
      targetButton.click();

      // 시각적 피드백
      targetButton.style.transform = 'scale(0.95)';
      setTimeout(() => targetButton.style.transform = 'scale(1)', 100);

      event.preventDefault();
      event.stopPropagation();
      return true;
    }

    console.log(`⚠️ [STORIES] 키 "${key}"에 해당하는 버튼이 없거나 범위를 벗어남`);
    return false;
  }

  /**
   * 한글 입력 처리 (Enter, Backspace, 자모 입력)
   * @param {Event} event - 키보드 이벤트
   * @param {string} key - 입력된 키
   */
  handleKoreanInput(event, key) {
    console.log(`🔍 [DEBUG] handleKoreanInput 진입 - key: "${key}", currentInput: "${this.currentInput}"`);

    // Enter: 정확히 일치하는 단어가 있으면 선택
    if (key === this.keyBindings.korean.enter) {
      const exactMatchBtn = document.querySelector('.korean-quick-select-exact-match');
      if (exactMatchBtn) {
        this.preventEventPropagation(event);
        console.log('↵ Enter - 단어 선택:', exactMatchBtn.textContent);
        exactMatchBtn.click();
        this.resetHighlight();
        return;
      }
      // 일치하는 단어가 없으면 통과 -> 듀오링고가 '확인' 버튼 누름
      return;
    }

    // Backspace 처리는 handleKeyDown으로 이동됨

    let nextInput = null;

    // ✅ 치명적 수정: orderTapComplete에서는 알파벳을 KEY_MAP보다 먼저 처리
    const challengeType = this.detectChallengeType();
    const isOrderTapComplete = challengeType === 'orderTapComplete';

    if (isOrderTapComplete && /^[a-zA-Z]$/.test(key)) {
      // orderTapComplete + 알파벳 → 그대로 사용 (KEY_MAP 변환 안 함)
      nextInput = this.currentInput + key;
    }
    // 영어 키 → 한글 자모 변환
    else if (KEY_MAP[key]) {
      nextInput = this.currentInput + KEY_MAP[key];
    }
    // 한글 자모 직접 입력
    else if (CHOSUNG_LIST.includes(key) || JUNGSUNG_LIST.includes(key)) {
      nextInput = this.currentInput + key;
    }

    if (nextInput) {
      this.preventEventPropagation(event);

      // ✅ 치명적 수정: 유효성 검사 - 영어 매칭 추가
      const buttons = this.getWordButtons();
      const hasMatch = buttons.some(button => {
        const text = button.textContent.trim();
        const lang = button.getAttribute('lang');
        const hasKorean = /[가-힣]/.test(text);

        if (lang === 'ko' || hasKorean) {
          // 한글 단어: 초성/자모 매칭
          const chosung = getChosung(text);
          const disassembled = getDisassembled(text);
          return chosung.startsWith(nextInput) || disassembled.startsWith(nextInput);
        } else if (isOrderTapComplete && lang === 'en') {
          // 영어 단어: 대소문자 무시하고 prefix 매칭
          return text.toLowerCase().startsWith(nextInput.toLowerCase());
        }
        return false;
      });

      if (hasMatch) {
        this.currentInput = nextInput;
        this.stats.totalInputs++;
        this.stats.lastInput = key;
        console.log(`✅ 입력 성공! 현재: "${this.currentInput}"`);
        this.updateHighlight();
        this.updateInputDisplay();
      } else {
        console.log(`🚫 입력 거부: "${nextInput}"로 시작하는 단어 없음`);
        this.showErrorFeedback();
      }

      return false;
    }
  }

  showErrorFeedback() {
    if (!this.inputDisplay) this.createInputDisplay();

    this.inputDisplay.classList.add('visible');
    this.inputDisplay.classList.add('kqs-error');

    // 기존 타이머 제거
    if (this.errorTimer) clearTimeout(this.errorTimer);

    this.errorTimer = setTimeout(() => {
      this.inputDisplay.classList.remove('kqs-error');
      if (this.currentInput === '') {
        this.inputDisplay.classList.remove('visible');
      }
    }, 200); // 에러 표시 시간도 단축
  }

  updateHighlight(allowAutoSelect = true) {
    this.clearHighlight();

    if (this.currentInput === '') {
      return;
    }

    const buttons = this.getWordButtons();

    if (buttons.length === 0) {
      return;
    }

    const challengeType = this.detectChallengeType();
    const isOrderTapComplete = challengeType === 'orderTapComplete';
    const matchedButtons = [];

    buttons.forEach(button => {
      const text = button.textContent.trim();
      const lang = button.getAttribute('lang');
      const hasKorean = /[가-힣]/.test(text);

      let isMatch = false;
      let isExactMatch = false;

      if (lang === 'ko' || hasKorean) {
        // 한글 매칭: 기존 로직 (초성 또는 자모 분해)
        const chosung = getChosung(text);
        const disassembled = getDisassembled(text);

        if (chosung.startsWith(this.currentInput) || disassembled.startsWith(this.currentInput)) {
          isMatch = true;

          // 정확히 일치하는지 확인 (초성 전체 일치 또는 자모 전체 일치)
          if (chosung === this.currentInput || disassembled === this.currentInput) {
            isExactMatch = true;
          }
        }
      } else if (isOrderTapComplete && lang === 'en') {
        // 영어 매칭: 대소문자 무시하고 prefix 매칭
        const lowerText = text.toLowerCase();
        const lowerInput = this.currentInput.toLowerCase();

        if (lowerText.startsWith(lowerInput)) {
          isMatch = true;

          // 정확히 일치
          if (lowerText === lowerInput) {
            isExactMatch = true;
          }
        }
      }

      if (isMatch) {
        matchedButtons.push(button);
        button.classList.add('korean-quick-select-highlight');

        if (isExactMatch) {
          button.classList.remove('korean-quick-select-highlight');
          button.classList.add('korean-quick-select-exact-match');
        }
      }
    });

    this.highlightedButtons = matchedButtons;

    // 자동 선택 로직
    // 1. 정확히 일치하는 단어가 있거나
    // 2. 남은 후보 단어가 딱 하나일 때 (부분 일치 자동 선택)

    // 🚨 allowAutoSelect가 false면 자동 선택 안 함 (Backspace 등)
    if (!allowAutoSelect) return;

    const allMatchedTexts = new Set(matchedButtons.map(b => b.textContent.trim()));

    // 조건: 매칭된 유니크 단어가 1개여야 함
    if (allMatchedTexts.size === 1) {
      const targetButton = matchedButtons[0]; // 첫 번째 버튼 선택

      console.log(`✨ 자동 선택! "${targetButton.textContent.trim()}"`);

      // 통계 업데이트
      this.stats.autoSelects++;

      // 딜레이 없이 즉시 클릭
      targetButton.click();
      targetButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      this.resetHighlight();
    }
  }

  clearHighlight() {
    this.highlightedButtons.forEach(button => {
      button.classList.remove('korean-quick-select-highlight');
      button.classList.remove('korean-quick-select-exact-match');
    });
    this.highlightedButtons = [];
  }

  resetHighlight() {
    this.currentInput = '';
    this.clearHighlight();
    this.updateInputDisplay();
  }

  getWordButtons() {
    let buttons = [];
    const wordBank = document.querySelector('[data-test="word-bank"]');

    if (wordBank) {
      // 단어 은행 내부에 있는 버튼만 선택 (정답 영역 제외)
      buttons = wordBank.querySelectorAll('button');
    } else {
      // 단어 은행을 못 찾은 경우 (예외 처리)
      // 기존 방식대로 하되, 안전을 위해 비워둘 수도 있음
      buttons = document.querySelectorAll('[data-test*="challenge-tap-token"]');
    }

    const challengeType = this.detectChallengeType();
    const isOrderTapComplete = challengeType === 'orderTapComplete';

    const validButtons = Array.from(buttons).filter(button => {
      // 화면에 보이지 않는 버튼 제외 (중복 감지 방지)
      if (button.offsetParent === null) return false;

      // 단어 은행 내부에 있는지 이중 확인 (쿼리 셀렉터가 정확하다면 불필요할 수 있으나 안전장치)
      if (wordBank && !wordBank.contains(button)) return false;

      // 이미 사용된 버튼(비활성화) 제외
      if (button.getAttribute('aria-disabled') === 'true' || button.classList.contains('disabled')) {
        return false;
      }

      // 유령 버튼(빈 텍스트, 투명 버튼) 제외 - 추가된 필터링
      const style = window.getComputedStyle(button);
      if (button.textContent.trim() === '' || style.opacity === '0' || style.visibility === 'hidden') {
        return false;
      }

      const lang = button.getAttribute('lang');
      const text = button.textContent;
      const hasKorean = /[가-힣]/.test(text);
      const hasEnglish = /[a-zA-Z]/.test(text);

      // 한글 버튼은 항상 포함
      if (lang === 'ko' || hasKorean) {
        return true;
      }

      // orderTapComplete에서만 영어 버튼 포함
      if (isOrderTapComplete && lang === 'en' && hasEnglish) {
        return true;
      }

      return false;
    });

    return validButtons;
  }

  // 정답 영역에 놓인 버튼들 찾기
  getPlacedButtons() {
    const challengeType = this.detectChallengeType();
    console.log(`🔍 [DEBUG] getPlacedButtons - 챌린지 타입: ${challengeType}`);

    // ✅ orderTapComplete 챌린지 특수 처리
    if (challengeType === 'orderTapComplete') {
      // "Selected gap" 영역 찾기 (실제로 사용자가 선택한 단어들이 여기 있음)
      const selectedGap = document.querySelector('[aria-label="Selected gap"]');

      if (!selectedGap) {
        console.log(`🔍 [DEBUG] Selected gap 없음 (아직 아무것도 선택 안 함)`);
        return [];
      }

      // Selected gap 안의 버튼들만 반환 (이게 진짜 선택된 버튼들)
      const selectedButtons = Array.from(
        selectedGap.querySelectorAll('button[data-test*="challenge-tap-token"]')
      ).filter(btn => btn.offsetParent !== null);

      console.log(`🔍 [DEBUG] Selected gap 안의 버튼: ${selectedButtons.length}개`);
      selectedButtons.forEach(btn => {
        console.log(`   ✓ "${btn.textContent.trim()}" (${btn.getAttribute('data-test')})`);
      });

      return selectedButtons;
    }

    // ✅ 다른 챌린지: 기존 로직 (word-bank 밖의 버튼)
    const allButtons = Array.from(document.querySelectorAll('[data-test*="challenge-tap-token"]'));
    console.log(`🔍 [DEBUG] getPlacedButtons - 전체 버튼: ${allButtons.length}개`);

    const wordBank = document.querySelector('[data-test="word-bank"]');

    if (!wordBank) {
      console.log(`🔍 [DEBUG] word-bank 없음`);
      return [];
    }

    // 단어 은행 안에 없는 버튼들이 정답 영역에 있는 버튼들임
    const placedButtons = allButtons.filter(button =>
      !wordBank.contains(button) && button.offsetParent !== null
    );

    // 중복 제거: data-test 속성 기준
    const seen = new Set();
    const uniqueButtons = placedButtons.filter(button => {
      const dataTest = button.getAttribute('data-test');
      if (seen.has(dataTest)) {
        console.log(`🔍 [DEBUG] 중복 버튼 제거: "${button.textContent.trim()}" (${dataTest})`);
        return false;
      }
      seen.add(dataTest);
      console.log(`🔍 [DEBUG] 선택된 버튼 발견: "${button.textContent.trim()}" (${dataTest})`);
      return true;
    });

    console.log(`🔍 [DEBUG] getPlacedButtons 결과: ${uniqueButtons.length}개 (중복 제거 전: ${placedButtons.length}개)`);
    return uniqueButtons;
  }
}

// 페이지 로드 시 초기화
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new DuolingoKoreanQuickSelect();
  });
} else {
  new DuolingoKoreanQuickSelect();
}