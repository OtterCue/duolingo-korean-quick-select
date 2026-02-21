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

    // Korean synonym groups (bidirectional), applied only to Korean-word matching.
    this.koreanSynonymGroups = [
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
    this.koreanSynonymMap = buildSynonymMap(this.koreanSynonymGroups);

    console.log('🎯 Duolingo Korean Quick Select 초기화 중...');
    console.log('💡 하이브리드 매칭 모드 (초성 + 자모)');

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
    if (isInInputField()) return;

    // 3. 글로벌 단축키 (ESC)
    if (this.handleGlobalShortcuts(event, key)) return;

    // 4. Backspace/Delete 전역 처리
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
      // (단어 은행이 활성화된 경우)
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

    // 5. 일반 오디오 단축키 (1, 2) - 입력 필드 아닐 때만
    // (Ctrl 키가 눌리지 않았을 때만 동작하도록 내부에서 체크함)
    if (this.handleAudioShortcuts(event, key)) return;

    // 6. 챌린지별 단축키 (Match, Listen Match)
    if (this.handleChallengeShortcuts(event, key)) return;

    // 7. 한글 입력 (word-bank 필요)
    if (this.isActive) {
      this.handleKoreanInput(event, key);
    }
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🛠️ 유틸리티 메서드
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  /**
   * 이벤트 전파 차단
   * @param {Event} event - 키보드 이벤트
   */
  preventEventPropagation(event) {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
  }


  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🎯 핸들러 메서드 (우선순위 순)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  /**
   * 글로벌 단축키 처리 (ESC, 백틱, Enter)
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

    // 백틱(`): 스킵 버튼 클릭
    if (key === '`' || event.code === 'Backquote') {
      const skipButton = document.querySelector('button[data-test="player-skip"]');
      if (skipButton && skipButton.offsetParent !== null) {
        this.preventEventPropagation(event);
        console.log('⏭️ 백틱(`) - 스킵 버튼 클릭');
        skipButton.click();
        return true;
      }
      // 버튼이 없거나 보이지 않으면 조용히 무시
      return false;
    }

    // Enter: 레전드 화면 계속하기 버튼 클릭
    if (key === 'Enter') {
      const legendaryButton = document.querySelector('button[data-test="legendary-session-end-continue"]');
      if (legendaryButton && legendaryButton.offsetParent !== null) {
        this.preventEventPropagation(event);
        console.log('🎯 Enter - 레전드 화면 계속하기 버튼 클릭');
        legendaryButton.click();
        return true;
      }
      // 레전드 화면이 아니면 Enter 키를 가로채지 않음 (기존 동작 유지)
      return false;
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

    // 🚨 Match 챌린지에서는 오디오 단축키 비활성화 (1, 2 키가 버튼 선택에 사용됨)
    const challengeType = detectChallengeType();
    if (challengeType === 'match' || challengeType === 'storiesMatch') {
      return false;
    }

    // 🚨 ListenIsolation 챌린지 특수 처리
    const isListenIsolation = document.querySelector('[data-test*="challenge-listenIsolation"]');
    const isCtrl = event.ctrlKey;

    if (isListenIsolation) {
      // ListenIsolation에서는 일반 1, 2 키는 듀오링고 기본 동작에 맡김 (선택지 선택)
      if (!isCtrl) {
        return false;
      }

      // Ctrl+1, Ctrl+2만 처리: 맨 위 스피커만 클릭 (선택지 내부 스피커 제외)
      const challengeContainer = document.querySelector('[data-test*="challenge-"]');
      if (!challengeContainer) return false;

      const topSpeakerButton = findTopSpeakerButton(challengeContainer);
      if (topSpeakerButton) {
        if (key === '1') {
          console.log('🔊 맨 위 스피커 재생 (Ctrl+1)');
          topSpeakerButton.click();
          return true;
        } else if (key === '2') {
          // ListenIsolation에서는 보통 느린 속도 버튼이 없을 수 있음
          // 하지만 일관성을 위해 두 번째 스피커를 찾아보거나 첫 번째를 클릭
          console.log('🐢 맨 위 스피커 재생 (Ctrl+2)');
          topSpeakerButton.click();
          return true;
        }
      }
      return false;
    }

    // Ctrl 키가 눌렸거나, (Ctrl 안 눌리고) 입력 필드가 아닐 때만 동작
    // (handleKeyDown에서 이미 분기 처리했지만 안전장치)
    if (!isCtrl && isInInputField()) return false;

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
    const challengeType = detectChallengeType();

    switch (challengeType) {
      case 'match':
      case 'storiesMatch':
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
    // 컨테이너 찾기 순서: --match-challenge-rows → challenge-match(fallback) → stories/page-wide
    let matchContainer = document.querySelector('[style*="--match-challenge-rows"]');

    if (!matchContainer) {
      const fallbackContainer = document.querySelector('[data-test*="challenge-match"]');
      if (fallbackContainer) {
        return this.handleMatchChallengeFallback(fallbackContainer, event, key);
      }
      matchContainer = findMatchContainer();
    }

    if (!matchContainer) {
      console.log('⚠️ [STORIES-MATCH] 매치 컨테이너를 찾을 수 없음');
      return false;
    }

    // 모든 버튼 찾기 (🚨 *= 사용: "to call" 같은 다중 단어 버튼도 찾기 위해)
    const allButtons = Array.from(matchContainer.querySelectorAll('button[data-test*="-challenge-tap-token"]'));
    if (allButtons.length === 0) {
      const fallbackContainer = document.querySelector('[data-test*="challenge-match"]');
      if (fallbackContainer) {
        return this.handleMatchChallengeFallback(fallbackContainer, event, key);
      }
      return false;
    }

    const buttonNumberMap = buildNumberedButtonMap(allButtons);
    let keyMap;
    if (Object.keys(buttonNumberMap).length === 0) {
      console.log(`🔍 [STORIES-MATCH] 숫자 span 없음 - DOM 순서 기반 매핑 사용`);
      keyMap = buildDomOrderKeyMap(allButtons, matchContainer);
    } else {
      keyMap = buildNumberedKeyMap(buttonNumberMap, this.keyBindings.match.alternates);
    }

    if (keyMap.hasOwnProperty(key.toLowerCase())) {
      const targetButton = keyMap[key.toLowerCase()];
      if (targetButton) {
        const numberSpan = targetButton.querySelector('span._3zbIX, span[class*="_3zbIX"]');
        const displayNumber = numberSpan ? numberSpan.textContent.trim() : '?';
        console.log(`🔗 짝짓기 선택: "${key}" → 화면 번호 ${displayNumber}번 버튼`);
        targetButton.click();
        applyClickFeedback(targetButton);
        event.preventDefault();
        event.stopPropagation();
        return true;
      }
    }

    return false;
  }

  /**
   * 버튼에서 번호 추출 (헬퍼 함수)
   * @param {HTMLElement} button - 버튼 요소
   * @returns {number|null} 버튼 번호 또는 null
   */
  getButtonNumber(button) {
    const numberSpan = button.querySelector('span._3zbIX') ||
      button.querySelector('span[class*="_3zbIX"]');
    if (numberSpan) {
      const numberText = numberSpan.textContent.trim();
      const buttonNumber = parseInt(numberText, 10);
      if (!isNaN(buttonNumber)) {
        return buttonNumber;
      }
    }
    return null;
  }

  /**
   * Match 챌린지 Fallback 처리 (기존 방식)
   * @param {HTMLElement} matchContainer - Match 챌린지 컨테이너
   * @param {Event} event - 키보드 이벤트
   * @param {string} key - 입력된 키
   * @returns {boolean} 처리했으면 true
   */
  handleMatchChallengeFallback(matchContainer, event, key) {
    // 좌/우 열 구분 시도
    const columns = matchContainer.querySelectorAll('ul');
    let leftButtons = [];
    let rightButtons = [];
    let buttons = [];

    if (columns.length >= 2) {
      // ul 태그로 좌/우 열 구분 가능
      leftButtons = Array.from(columns[0].querySelectorAll('button[data-test*="-challenge-tap-token"]'));
      rightButtons = Array.from(columns[1].querySelectorAll('button[data-test*="-challenge-tap-token"]'));
      buttons = [...leftButtons, ...rightButtons];
    } else {
      // ul 구조가 없으면 전체 버튼을 DOM 순서대로 사용 (왼쪽→오른쪽 가정)
      buttons = Array.from(matchContainer.querySelectorAll('button[data-test*="-challenge-tap-token"]'));
      // DOM 순서상 앞의 5개가 왼쪽, 뒤의 5개가 오른쪽이라고 가정
      if (buttons.length >= 10) {
        leftButtons = buttons.slice(0, 5);
        rightButtons = buttons.slice(5, 10);
      } else {
        // 버튼이 10개 미만이면 그냥 순서대로 사용
        leftButtons = buttons.slice(0, Math.ceil(buttons.length / 2));
        rightButtons = buttons.slice(Math.ceil(buttons.length / 2));
      }
    }

    if (buttons.length === 0) return false;

    // 키 매핑 테이블 (keyBindings에서 생성)
    const keyMap = {};

    // 왼쪽 열 버튼 매핑: 1→0, 2→1, 3→2, 4→3, 5→4
    for (let i = 0; i < leftButtons.length && i < 5; i++) {
      const keyNum = String(i + 1);
      keyMap[keyNum] = buttons.indexOf(leftButtons[i]);
    }

    // 오른쪽 열 버튼 매핑: 6→5, 7→6, 8→7, 9→8, 0→9
    for (let i = 0; i < rightButtons.length && i < 5; i++) {
      const keyNum = i === 4 ? '0' : String(i + 6); // 0번 키는 10번째 버튼
      const buttonIndex = buttons.indexOf(rightButtons[i]);
      if (buttonIndex !== -1) {
        keyMap[keyNum] = buttonIndex;
      }
    }

    // alternates: q-t 키를 오른쪽 열에 매핑
    Object.keys(this.keyBindings.match.alternates).forEach(altKey => {
      const buttonNumber = this.keyBindings.match.alternates[altKey];
      const rightIndex = buttonNumber - 6; // 6→0, 7→1, 8→2, 9→3, 10→4
      if (rightIndex >= 0 && rightIndex < rightButtons.length) {
        const buttonIndex = buttons.indexOf(rightButtons[rightIndex]);
        if (buttonIndex !== -1) {
          keyMap[altKey] = buttonIndex;
        }
      }
    });

    if (keyMap.hasOwnProperty(key.toLowerCase())) {
      const index = keyMap[key.toLowerCase()];
      if (buttons[index]) {
        console.log(`🔗 짝짓기 선택 (Fallback): ${key} -> 버튼 ${index + 1}`);
        buttons[index].click();

        // 시각적 피드백
        applyClickFeedback(buttons[index]);

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

    const buttons = Array.from(listenMatchContainer.querySelectorAll('button[data-test*="-challenge-tap-token"]'));

    // 키 매핑 테이블 (keyBindings에서 생성)
    const keyMap = {};
    // 숫자 키: 배열 인덱스(0-based)로 매핑
    // '1' → 0, '2' → 1, ..., '8' → 7
    this.keyBindings.listenMatch.buttons.forEach((key, index) => {
      keyMap[key] = index;
    });
    // alternates: 화면 번호(1-based)를 인덱스(0-based)로 변환
    // 'q': 5 → buttons[4] (5번 버튼)
    Object.keys(this.keyBindings.listenMatch.alternates).forEach(altKey => {
      const buttonNumber = this.keyBindings.listenMatch.alternates[altKey];
      keyMap[altKey] = buttonNumber - 1; // 화면 번호 → 배열 인덱스
    });

    if (keyMap.hasOwnProperty(key.toLowerCase())) {
      const index = keyMap[key.toLowerCase()];
      if (buttons[index]) {
        console.log(`🎧🔗 듣기 짝짓기 선택: ${key} -> 버튼 ${index + 1}`);
        buttons[index].click();

        // 시각적 피드백
        applyClickFeedback(buttons[index]);

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
      applyClickFeedback(targetButton);

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

    // ✅ 치명적 수정: orderTapComplete 또는 따옴표 영어 단어가 있을 때 알파벳을 KEY_MAP보다 먼저 처리
    const challengeType = detectChallengeType();
    const isOrderTapComplete = challengeType === 'orderTapComplete';
    // 🚨 storiesMatch에서는 q,w,e,r,t가 Match 단축키로 사용되므로 영어 처리 비활성화
    const hasQuotedEnglish = challengeType !== 'storiesMatch' && hasQuotedEnglishWords();

    // 🚨 영어 단어가 word-bank에 있는지 확인 (한글만 있으면 한글 입력 사용)
    const hasEnglishWords = hasEnglishWordsInBank();

    // 영어 입력 조건: (orderTapComplete 또는 따옴표 영어) AND 영어 단어가 실제로 있음
    if ((isOrderTapComplete || hasQuotedEnglish) && hasEnglishWords && /^[a-zA-Z]$/.test(key)) {
      // orderTapComplete 또는 따옴표 영어 단어 → 알파벳 그대로 사용 (KEY_MAP 변환 안 함)
      // Caps Lock 상관없이 소문자로 통일
      nextInput = this.currentInput + key.toLowerCase();
    }
    // 영어 키 → 한글 자모 변환
    // 🚨 Caps Lock 무시: 물리적 키(event.code) + Shift 상태만 고려
    // - 물리 q + Shift 없음 → 'q' → ㅂ
    // - 물리 q + Shift 있음 → 'Q' → ㅃ (쌍자음)
    // - Caps Lock은 완전히 무시됨!
    else if (window.KEY_MAP) {
      // event.code에서 물리적 키 추출 (예: 'KeyQ' → 'q', 'KeyS' → 's')
      const code = event.code;
      let physicalKey = null;

      if (code && code.startsWith('Key')) {
        // 'KeyQ' → 'q' (소문자)
        physicalKey = code.slice(3).toLowerCase();
      }

      if (physicalKey) {
        // Shift 상태에 따라 대소문자 결정 (Caps Lock 무시!)
        const mappingKey = event.shiftKey ? physicalKey.toUpperCase() : physicalKey;
        const koreanChar = window.KEY_MAP[mappingKey];

        if (koreanChar) {
          nextInput = this.currentInput + koreanChar;
          console.log(`🔤 [KOREAN] 물리키: ${physicalKey}, Shift: ${event.shiftKey}, 매핑: ${mappingKey} → ${koreanChar}`);
        }
      } else {
        // event.code가 없거나 'Key'로 시작하지 않는 경우 기존 방식 폴백
        const koreanChar = window.KEY_MAP[key] || window.KEY_MAP[key.toLowerCase()];
        if (koreanChar) {
          nextInput = this.currentInput + koreanChar;
        }
      }
    }
    // 한글 자모 직접 입력
    else if (window.CHOSUNG_LIST && (window.CHOSUNG_LIST.includes(key) || window.JUNGSUNG_LIST.includes(key))) {
      nextInput = this.currentInput + key;
    }

    if (nextInput) {
      this.preventEventPropagation(event);

      // ✅ 치명적 수정: 유효성 검사 - 영어 매칭 추가 + 서브시퀀스 지원
      const buttons = this.getWordButtons();
      const hasMatch = buttons.some(button => {
        const text = button.textContent.trim();
        const lang = button.getAttribute('lang');
        const hasKorean = /[가-힣]/.test(text);

        if (lang === 'ko' || hasKorean) {
          // 한글 단어: 초성/자모 매칭 + 서브시퀀스
          const variants = this.getKoreanTextVariants(text);
          return variants.some((variant, index) => {
            const result = evaluateKoreanMatch(nextInput, variant, index !== 0);
            return !!result;
          });
        } else if ((isOrderTapComplete || hasQuotedEnglish) && lang === 'en') {
          // 영어 단어: 알파벳만 추출해서 prefix 매칭 (따옴표 무시)
          const textAlpha = extractAlphabetOnly(text);
          return textAlpha.startsWith(nextInput.toLowerCase());
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

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🔧 동의어/영어 보조 헬퍼 함수
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  getKoreanTextVariants(text) {
    const base = (text || '').trim();
    if (!base) return [];

    const variants = new Set([base]);
    const synonyms = this.koreanSynonymMap.get(base);
    if (synonyms) {
      synonyms.forEach(term => variants.add(term));
    }
    return Array.from(variants);
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

    const challengeType = detectChallengeType();
    const isOrderTapComplete = challengeType === 'orderTapComplete';
    const hasQuotedEnglish = hasQuotedEnglishWords();
    const matchedButtons = [];

    buttons.forEach(button => {
      const text = button.textContent.trim();
      const lang = button.getAttribute('lang');
      const hasKorean = /[가-힣]/.test(text);

      let isMatch = false;
      let isExactMatch = false;

      if (lang === 'ko' || hasKorean) {
        const variants = this.getKoreanTextVariants(text);
        let bestKoreanMatch = null;

        variants.forEach((variant, index) => {
          const result = evaluateKoreanMatch(this.currentInput, variant, index !== 0);
          if (!result) return;

          if (!bestKoreanMatch || result.score < bestKoreanMatch.score) {
            bestKoreanMatch = result;
          }
        });

        if (bestKoreanMatch) {
          isMatch = true;
          isExactMatch = bestKoreanMatch.isExactMatch;
          button.dataset.matchScore = bestKoreanMatch.score;
        }

      } else if ((isOrderTapComplete || hasQuotedEnglish) && lang === 'en') {
        // 영어 매칭: 알파벳만 추출해서 prefix 매칭 (따옴표 무시)
        const engResult = evaluateEnglishMatch(this.currentInput, text);
        if (engResult.isMatch) {
          isMatch = true;
          isExactMatch = engResult.isExactMatch;
          button.dataset.matchScore = engResult.score;
        }

      }

      if (isMatch) {
        matchedButtons.push(button);

        // 📌 기본 하이라이트 (부분 매칭)
        button.classList.add('korean-quick-select-highlight');

        if (isExactMatch) {
          // 🎯 [Case F] Exact Match 강조 스타일 적용
          // 일반 하이라이트를 제거하고 더 강한 스타일로 교체
          button.classList.remove('korean-quick-select-highlight');
          button.classList.add('korean-quick-select-exact-match');
        }
      }
    });

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🎯 매칭 점수 기반 정렬 (낮은 점수 = 더 정확한 매칭)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 서브시퀀스 매칭 시 여러 단어가 매칭될 때,
    // 점수가 낮은(간격이 작은) 단어를 우선 선택
    matchedButtons.sort((a, b) => {
      const scoreA = parseFloat(a.dataset.matchScore) || 0;
      const scoreB = parseFloat(b.dataset.matchScore) || 0;
      return scoreA - scoreB; // 오름차순 정렬
    });

    this.highlightedButtons = matchedButtons;

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // ✨ [Case D] 자동 선택 로직 (유니크 매칭)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 조건: 매칭된 유니크 단어가 딱 1개일 때
    // 동작: Enter 없이 자동으로 클릭 (속도 향상)
    // 
    // 예시:
    //   - 단어: "고양이", "고래", "사과"
    //   - 입력 "ㄱㅇㅇ" → "고양이"만 매칭 → ✅ 자동 클릭!
    //   - 입력 "ㄱ" → "고양이", "고래" 매칭 → ⏸️ 대기 (추가 입력 필요)

    // 🚨 allowAutoSelect가 false면 자동 선택 안 함 (Backspace 등)
    if (!allowAutoSelect) return;

    const allMatchedTexts = new Set(matchedButtons.map(b => b.textContent.trim()));

    // [Case D 핵심] 유니크 단어가 1개 → 즉시 클릭
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

    const challengeType = detectChallengeType();
    const isOrderTapComplete = challengeType === 'orderTapComplete';

    const validButtons = Array.from(buttons).filter(button => {
      // 화면에 보이지 않는 버튼 제외 (중복 감지 방지, 유령 버튼 포함)
      if (!isButtonVisible(button)) return false;

      // 단어 은행 내부에 있는지 이중 확인 (쿼리 셀렉터가 정확하다면 불필요할 수 있으나 안전장치)
      if (wordBank && !wordBank.contains(button)) return false;

      // 이미 사용된 버튼(비활성화) 제외
      if (isButtonDisabled(button)) return false;

      const lang = getButtonLanguage(button);
      const text = button.textContent;
      const hasKorean = /[가-힣]/.test(text);
      const hasEnglish = /[a-zA-Z]/.test(text);

      // 한글 버튼은 항상 포함
      if (lang === 'ko' || hasKorean) {
        return true;
      }

      // orderTapComplete 또는 따옴표 포함 영어 단어가 있는 경우 영어 버튼 포함
      // 🚨 주의: hasQuotedEnglishWords() 호출하면 무한루프! (그 함수에서 getWordButtons 호출)
      // 대신 word-bank에서 직접 따옴표 단어 존재 여부 체크
      if (lang === 'en' && hasEnglish) {
        // orderTapComplete면 모든 영어 버튼 포함
        if (isOrderTapComplete) {
          return true;
        }

        // 🚨 수정: word-bank에 따옴표 단어가 하나라도 있으면 모든 영어 버튼 포함
        // (영어 처리 모드가 활성화되면 일반 영어 단어도 필요)
        if (wordBank) {
          const allBtns = wordBank.querySelectorAll('button');
          const hasAnyQuotedWord = Array.from(allBtns).some(b =>
            b.getAttribute('lang') === 'en' && b.textContent.includes("'")
          );
          if (hasAnyQuotedWord) {
            return true;
          }
        }
      }

      return false;
    });

    return validButtons;
  }

  // 정답 영역에 놓인 버튼들 찾기
  getPlacedButtons() {
    const challengeType = detectChallengeType();
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
