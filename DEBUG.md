# 🔬 상세 디버깅 가이드

## 현재 상황 분석

로그를 보니:
```
✅ 단어 은행 발견! 한글 빠른 선택 활성화됨
📝 한글 버튼 12개 발견: ['룸메이트', '룸메이트', ...]
```

✅ 확장 프로그램 정상 로드됨
✅ 한글 버튼 감지 성공

❌ 하지만 키 입력 시 콘솔에 아무것도 안 나타남

## 🔍 디버깅 단계별 확인

### 1단계: 모든 키 입력 감지 확인

이제 **아무 키나** 눌러보세요.

**예상 로그:**
```
🎹 [모든 키] key="a", code="KeyA", target=BODY, type=keydown
⚪ [일반 키] "a" - 초성 아님, 무시
```

**만약 아무것도 안 나온다면:**
→ 키보드 이벤트 자체가 확장 프로그램에 안 도달
→ 듀오링고가 먼저 가로채고 있음

### 2단계: 초성 키 감지 확인

한글 모드로 전환 후 `ㄱ` 눌러보세요.

**예상 로그:**
```
🎹 [모든 키] key="ㄱ", code="KeyR", target=BODY, type=keydown
✨ [초성 감지!] "ㄱ" - 이제 처리 시작
🟢 [활성 상태] isActive=true, 버튼=12개
🎯 [초성 처리 시작] "ㄱ"
🛑 [이벤트 차단] preventDefault, stopPropagation 완료
✅ [입력 성공!] "ㄱ" 추가됨 - 현재: "ㄱ"
```

**만약 "🎹 [모든 키]"만 나오고 멈춘다면:**
→ `event.key`가 "ㄱ"이 아닐 수 있음
→ 다음 섹션 확인

### 3단계: event.key 값 확인

콘솔에 다음 입력:
```javascript
document.addEventListener('keydown', (e) => {
  console.log('KEY:', e.key, 'CODE:', e.code);
}, true);
```

그리고 다시 초성 입력해보세요.

**가능한 결과:**

1. `KEY: ㄱ CODE: KeyR` ✅ 정상
2. `KEY: r CODE: KeyR` ❌ 한글 모드가 아님
3. `KEY: Process CODE: KeyR` ❌ IME 문제

## 🐛 케이스별 해결책

### Case 1: 아무 로그도 안 나옴

**문제:** 키보드 이벤트가 확장 프로그램에 도달하지 않음

**해결:**
1. 확장 프로그램 재설치
2. 페이지 새로고침 여러 번
3. 시크릿 모드에서 테스트

### Case 2: "🎹 [모든 키]"는 나오는데 초성 감지 안 됨

**문제:** `event.key`가 "ㄱ"이 아니라 "Process" 또는 다른 값

**확인:**
콘솔에서 초성 리스트 확인:
```javascript
['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ']
```

**해결:**
- Windows: 한글 입력기 확인
- Mac: 시스템 환경설정 → 키보드 → 입력 소스
- Linux: IBus 또는 fcitx 설정

### Case 3: "✨ [초성 감지!]"까지는 나오는데 멈춤

**문제:** `this.isActive`가 `false`이거나 버튼이 0개

**확인:**
콘솔에 입력:
```javascript
// 단어 은행 확인
document.querySelector('[data-test="word-bank"]')

// 한글 버튼 확인
document.querySelectorAll('[data-test*="challenge-tap-token"][lang="ko"]')
```

**해결:**
- 단어 선택 문제가 맞는지 확인
- 타이핑 문제는 지원 안 됨
- 다른 문제로 스킵

### Case 4: 전부 로그는 나오는데 버튼이 안 변함

**문제:** CSS 클래스가 적용 안 됨

**확인:**
개발자 도구 → Elements 탭에서 버튼 선택 후:
```css
.korean-quick-select-highlight {
  background-color: #1cb0f6 !important;
  color: white !important;
}
```
이 스타일이 있는지 확인

**해결:**
- 페이지 새로고침
- 확장 프로그램 재설치

## 💡 추가 디버깅 팁

### 듀오링고의 키보드 핸들러 확인

콘솔에 입력:
```javascript
// 현재 등록된 키보드 리스너 확인 (Chrome만)
getEventListeners(window).keydown
getEventListeners(document).keydown
getEventListeners(document.body).keydown
```

### 강제로 이벤트 차단 테스트

콘솔에 입력:
```javascript
// 모든 키보드 이벤트를 가장 먼저 가로채기
window.addEventListener('keydown', (e) => {
  if (['ㄱ','ㄴ','ㄷ'].includes(e.key)) {
    console.log('🔴 강제 차단:', e.key);
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    return false;
  }
}, true);
```

이후 초성 입력 시 "🔴 강제 차단" 나오면 이벤트 차단은 작동하는 것.

### 포커스 확인

콘솔에 입력:
```javascript
// 현재 포커스된 요소 확인
document.activeElement
```

`<body>` 또는 `<div>`여야 정상.
`<input>`, `<textarea>`, `<button>`이면 안 됨.

## 📸 스크린샷 공유

다음 정보를 캡처해서 공유하면 도움이 됩니다:

1. **콘솔 전체 로그**
   - F12 → Console 탭
   - 초성 입력 후 스크린샷

2. **Elements 탭**
   - 단어 버튼 우클릭 → Inspect
   - HTML 구조 스크린샷

3. **확장 프로그램 상태**
   - `chrome://extensions/`
   - 오류가 있다면 "오류" 버튼 클릭 후 스크린샷

## 🆘 최후의 수단

모든 방법이 실패하면:

1. **다른 브라우저에서 테스트**
   - Edge, Brave, Opera 등

2. **시크릿/비공개 모드**
   - 다른 확장 프로그램 간섭 배제

3. **OS 재시작**
   - IME 문제일 수 있음

4. **듀오링고 앱 사용**
   - 웹 대신 데스크톱/모바일 앱
