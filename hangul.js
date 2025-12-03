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

// content.js에서 사용할 수 있도록 window 객체에 연결
window.KEY_MAP = KEY_MAP;
window.CHOSUNG_LIST = CHOSUNG_LIST;
window.JUNGSUNG_LIST = JUNGSUNG_LIST;
window.JONGSUNG_LIST = JONGSUNG_LIST;
window.COMPLEX_VOWELS = COMPLEX_VOWELS;
window.HANGUL_START = HANGUL_START;
window.HANGUL_END = HANGUL_END;
window.getChosung = getChosung;
window.getDisassembled = getDisassembled;

