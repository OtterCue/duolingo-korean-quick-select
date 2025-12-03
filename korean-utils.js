// 한글 초성 추출 유틸리티
const KoreanUtils = {
  // 초성 리스트
  CHOSUNG_LIST: ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'],
  
  // 한글 유니코드 시작
  HANGUL_START: 0xAC00,
  HANGUL_END: 0xD7A3,
  
  /**
   * 문자열에서 초성 추출
   * @param {string} text - 한글 문자열
   * @returns {string} 초성 문자열
   */
  getChosung(text) {
    let chosung = '';
    
    for (let i = 0; i < text.length; i++) {
      const code = text.charCodeAt(i);
      
      // 한글인 경우
      if (code >= this.HANGUL_START && code <= this.HANGUL_END) {
        const chosungIndex = Math.floor((code - this.HANGUL_START) / 588);
        chosung += this.CHOSUNG_LIST[chosungIndex];
      }
      // 초성 자체인 경우
      else if (this.CHOSUNG_LIST.includes(text[i])) {
        chosung += text[i];
      }
      // 공백이나 특수문자는 그대로
      else {
        chosung += text[i];
      }
    }
    
    return chosung;
  },
  
  /**
   * 초성으로 시작하는지 확인
   * @param {string} text - 검사할 텍스트
   * @param {string} input - 입력된 초성
   * @returns {boolean}
   */
  startsWithChosung(text, input) {
    const textChosung = this.getChosung(text);
    return textChosung.startsWith(input);
  },
  
  /**
   * 완전히 매칭되는지 확인
   * @param {string} text - 검사할 텍스트
   * @param {string} input - 입력된 초성
   * @returns {boolean}
   */
  exactMatchChosung(text, input) {
    const textChosung = this.getChosung(text);
    return textChosung === input;
  }
};

// content.js에서 사용할 수 있도록 export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = KoreanUtils;
}
