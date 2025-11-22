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
      const koreanButtons = this.getWordButtons();
      this.isActive = koreanButtons.length > 0;

      if (wasActive !== this.isActive) {
        if (this.isActive) {
          console.log('✅ 단어 은행 발견! 한글 빠른 선택 활성화됨');
          console.log(`📝 한글 버튼 ${koreanButtons.length}개 발견`);
        }
      }
    } else {
      this.isActive = false;
      if (wasActive !== this.isActive && this.currentInput !== '') {
        this.resetHighlight();
      }
    }
  }

  handleKeyDown(event) {
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 우선순위 0: 입력 필드 체크 (공통)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
    if (activeTag === 'input' || activeTag === 'textarea' || document.activeElement.isContentEditable) {
      return;
    }

    const key = event.key;

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 우선순위 1: 글로벌 단축키 (언어 무관, 모든 챌린지)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    // ESC: 초기화
    if (key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      console.log('🔄 ESC - 초기화');
      this.resetHighlight();
      return;
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 우선순위 2: 오디오 단축키 (언어 무관, 듣기 챌린지)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    // 오디오 단축키 (1: 일반, 2: 느림)
    if (key === '1' || key === '2') {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🎧 [오디오 단축키] 키 입력:', key === '1' ? '1번 (일반 속도)' : '2번 (느린 속도)');

      // 듣기 문제 컨테이너 찾기 (클래스명이 바뀔 수 있으므로 data-test 속성 활용)
      const challengeContainer = document.querySelector('[data-test*="challenge-listenTap"]');

      console.log('🔍 [1단계] 챌린지 컨테이너 찾기:', challengeContainer ? '✅ 발견' : '❌ 없음');

      if (challengeContainer) {
        // 컨테이너 내의 모든 버튼 수집
        const allButtons = Array.from(challengeContainer.querySelectorAll('button'));
        console.log('🔍 [2단계] 전체 버튼 개수:', allButtons.length);

        // 제외할 버튼들 (단어 은행, 하단 버튼 등)
        const audioButtons = allButtons.filter(btn => {
          // 단어 은행 내부 버튼 제외
          if (btn.closest('[data-test="word-bank"]')) return false;
          // 하단 스킵/확인 버튼 제외
          if (btn.closest('[data-test="player-next"]') || btn.closest('[data-test="player-skip"]')) return false;
          // 종료 버튼 제외
          if (btn.closest('[data-test="quit-button"]')) return false;
          // 탭 토큰(정답 영역에 있는 것들) 제외 - 안전장치
          if (btn.getAttribute('data-test') && btn.getAttribute('data-test').includes('challenge-tap-token')) return false;

          return true;
        });

        console.log('🔍 [3단계] 필터링 후 오디오 버튼 개수:', audioButtons.length);

        // 각 버튼 정보 출력
        audioButtons.forEach((btn, index) => {
          const btnText = btn.textContent.trim() || '(텍스트 없음)';
          const btnClass = btn.className;
          const btnDataTest = btn.getAttribute('data-test') || '(data-test 없음)';
          console.log(`  📌 버튼[${index}]:`, {
            텍스트: btnText.substring(0, 50),
            클래스: btnClass.substring(0, 80),
            'data-test': btnDataTest
          });
        });

        if (key === '1' && audioButtons[0]) {
          console.log('✅ 1번 버튼 클릭 시도 (일반 속도)');
          audioButtons[0].click();
          event.preventDefault();
          event.stopPropagation();
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        } else if (key === '2' && audioButtons[1]) {
          console.log('✅ 2번 버튼 클릭 시도 (느린 속도)');
          audioButtons[1].click();
          event.preventDefault();
          event.stopPropagation();
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        } else {
          console.warn('❌ 버튼을 찾을 수 없음:', {
            요청한_키: key,
            필요한_버튼: key === '1' ? '버튼[0]' : '버튼[1]',
            실제_버튼_개수: audioButtons.length
          });
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        }
        return;
      } else {
        console.warn('❌ 듣기 챌린지 컨테이너를 찾을 수 없음');
        console.log('💡 현재 페이지에 듣기 문제가 없거나, data-test 속성이 변경되었을 수 있습니다.');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      }
    }


    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 우선순위 3: 챌린지별 단축키 (Match, Listen Match)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    // 짝짓기 문제 (Match Challenge)
    const matchContainer = document.querySelector('[data-test*="challenge-match"]');
    if (matchContainer) {
      const buttons = Array.from(matchContainer.querySelectorAll('button[data-test$="-challenge-tap-token"]'));

      // 키 매핑 테이블
      const keyMap = {
        '1': 0, '2': 1, '3': 2, '4': 3, '5': 4,
        '6': 5, '7': 6, '8': 7, '9': 8, '0': 9,
        'q': 5, 'w': 6, 'e': 7, 'r': 8, 't': 9  // 편의성 키
      };

      if (keyMap.hasOwnProperty(key.toLowerCase())) {
        const index = keyMap[key.toLowerCase()];
        if (buttons[index]) {
          console.log(`🔗 짝짓기 선택: ${key} -> 버튼 ${index + 1}`);
          buttons[index].click();

          // 시각적 피드백 (선택 효과)
          buttons[index].style.transform = 'scale(0.95)';
          setTimeout(() => buttons[index].style.transform = 'scale(1)', 100);

          event.preventDefault();
          event.stopPropagation();
          return;
        }
      }
    }


    // 듣기 짝짓기 문제 (Listen Match Challenge)
    const listenMatchContainer = document.querySelector('[data-test*="challenge-listenMatch"]');
    if (listenMatchContainer) {
      const buttons = Array.from(listenMatchContainer.querySelectorAll('button[data-test$="-challenge-tap-token"]'));

      // 키 매핑 테이블 (8개 버튼 기준)
      const keyMap = {
        '1': 0, '2': 1, '3': 2, '4': 3,
        '5': 4, '6': 5, '7': 6, '8': 7,
        'q': 4, 'w': 5, 'e': 6, 'r': 7  // 편의성 키
      };

      if (keyMap.hasOwnProperty(key.toLowerCase())) {
        const index = keyMap[key.toLowerCase()];
        if (buttons[index]) {
          console.log(`🎧🔗 듣기 짝짓기 선택: ${key} -> 버튼 ${index + 1}`);
          buttons[index].click();

          // 시각적 피드백
          buttons[index].style.transform = 'scale(0.95)';
          setTimeout(() => buttons[index].style.transform = 'scale(1)', 100);

          event.preventDefault();
          event.stopPropagation();
          return;
        }
      }
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 우선순위 4: 한글 입력 (word-bank 필요)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    // 한글 단어 선택 기능은 word-bank가 있고 한글 버튼이 있을 때만 작동
    if (!this.isActive) return;

    // Enter: 정확히 일치하는 단어가 있으면 선택, 없으면 기본 동작(제출)
    if (key === 'Enter') {
      const exactMatchBtn = document.querySelector('.korean-quick-select-exact-match');
      if (exactMatchBtn) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        console.log('↵ Enter - 단어 선택:', exactMatchBtn.textContent);
        exactMatchBtn.click();
        this.resetHighlight();
        return;
      }
      // 일치하는 단어가 없으면 통과 -> 듀오링고가 '확인' 버튼 누름
      return;
    }

    // Backspace: 한 글자 삭제 또는 선택된 단어 삭제
    if (key === 'Backspace' || key === 'Delete') {
      if (this.currentInput !== '') {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        this.currentInput = this.currentInput.slice(0, -1);
        console.log(`⬅️ Backspace - 현재: "${this.currentInput}"`);
        this.updateHighlight();
        this.updateInputDisplay();
      } else {
        // 입력값이 없을 때 Backspace를 누르면 이미 선택된 단어 삭제
        const placedButtons = this.getPlacedButtons();
        if (placedButtons.length > 0) {
          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation();

          const lastButton = placedButtons[placedButtons.length - 1];
          console.log(`🗑️ 선택된 단어 삭제: "${lastButton.textContent.trim()}"`);

          lastButton.click();
          lastButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        }
      }
      return;
    }

    let nextInput = null;

    // 영어 키 → 한글 자모 변환
    if (KEY_MAP[key]) {
      nextInput = this.currentInput + KEY_MAP[key];
    }
    // 한글 자모 직접 입력
    else if (CHOSUNG_LIST.includes(key) || JUNGSUNG_LIST.includes(key)) {
      nextInput = this.currentInput + key;
    }

    if (nextInput) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      // 유효성 검사: 입력했을 때 매칭되는 단어가 있는지 확인 (초성 또는 자모 분해)
      const buttons = this.getWordButtons();
      const hasMatch = buttons.some(button => {
        const text = button.textContent.trim();
        const chosung = getChosung(text);
        const disassembled = getDisassembled(text);

        return chosung.startsWith(nextInput) || disassembled.startsWith(nextInput);
      });

      if (hasMatch) {
        this.currentInput = nextInput;

        // 통계 업데이트
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

  updateHighlight() {
    this.clearHighlight();

    if (this.currentInput === '') {
      return;
    }

    const buttons = this.getWordButtons();

    if (buttons.length === 0) {
      return;
    }

    const matchedButtons = [];

    buttons.forEach(button => {
      const text = button.textContent.trim();
      const chosung = getChosung(text);
      const disassembled = getDisassembled(text);

      // 초성 매칭 또는 자모 분해 매칭 확인
      if (chosung.startsWith(this.currentInput) || disassembled.startsWith(this.currentInput)) {
        matchedButtons.push(button);
        button.classList.add('korean-quick-select-highlight');

        // 정확히 일치하는지 확인 (초성 전체 일치 또는 자모 전체 일치)
        if (chosung === this.currentInput || disassembled === this.currentInput) {
          button.classList.remove('korean-quick-select-highlight');
          button.classList.add('korean-quick-select-exact-match');
        }
      }
    });

    this.highlightedButtons = matchedButtons;

    // 자동 선택 로직
    // 1. 정확히 일치하는 단어가 있거나
    // 2. 남은 후보 단어가 딱 하나일 때 (부분 일치 자동 선택)

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

    const koreanButtons = Array.from(buttons).filter(button => {
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

      return lang === 'ko' || hasKorean;
    });

    return koreanButtons;
  }

  // 정답 영역에 놓인 버튼들 찾기
  getPlacedButtons() {
    // 모든 토큰 버튼 찾기
    const allButtons = Array.from(document.querySelectorAll('[data-test*="challenge-tap-token"]'));

    // 단어 은행(word-bank) 찾기
    const wordBank = document.querySelector('[data-test="word-bank"]');

    if (!wordBank) return [];

    // 단어 은행 안에 없는 버튼들이 정답 영역에 있는 버튼들임
    // (그리고 화면에 보여야 함)
    return allButtons.filter(button => {
      return !wordBank.contains(button) && button.offsetParent !== null;
    });
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