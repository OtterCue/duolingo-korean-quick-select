// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 텍스트 매칭 순수 함수 모음
// content.js와 같은 전역 스코프에서 실행됨 (MV3 content script 공유 스코프)
// 의존: hangul.js (window.getChosung, window.getDisassembled)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * 문자열에서 알파벳만 추출 (소문자로 변환)
 * @param {string} str - 원본 문자열
 * @returns {string} 알파벳만 포함된 소문자 문자열
 * @example
 * extractAlphabetOnly("I'm") // "im"
 * extractAlphabetOnly("don't") // "dont"
 * extractAlphabetOnly("'re") // "re"
 */
function extractAlphabetOnly(str) {
  return str.replace(/[^a-zA-Z]/g, '').toLowerCase();
}

/**
 * 동의어 그룹 배열로 동의어 맵 생성
 * @param {string[][]} groups - 동의어 그룹 배열
 * @returns {Map<string, Set<string>>} 단어 → 동의어 집합 맵
 */
function buildSynonymMap(groups) {
  const synonymMap = new Map();

  groups.forEach(group => {
    const terms = Array.from(new Set(
      group
        .map(term => (term || '').trim())
        .filter(Boolean)
    ));

    terms.forEach(term => {
      if (!synonymMap.has(term)) {
        synonymMap.set(term, new Set());
      }
    });

    terms.forEach(term => {
      const linked = synonymMap.get(term);
      terms.forEach(other => {
        if (other !== term) linked.add(other);
      });
    });
  });

  return synonymMap;
}

/**
 * 서브시퀀스 매칭 체크
 * 입력 문자열이 대상 문자열의 서브시퀀스인지 확인
 * (순서는 유지하되 중간 생략 가능)
 *
 * @param {string} input - 입력 문자열 (예: "ㄱㅇㅣ")
 * @param {string} target - 대상 문자열 (예: "ㄱㅗㅇㅏㅇㅣ")
 * @returns {boolean} 서브시퀀스이면 true
 */
function isSubsequence(input, target) {
  let inputIndex = 0;
  let targetIndex = 0;

  while (inputIndex < input.length && targetIndex < target.length) {
    if (input[inputIndex] === target[targetIndex]) {
      inputIndex++;
    }
    targetIndex++;
  }

  return inputIndex === input.length;
}

/**
 * 서브시퀀스 매칭 점수 계산
 * 점수가 낮을수록 더 정확한 매칭
 *
 * @param {string} input - 입력 문자열
 * @param {string} target - 대상 문자열
 * @returns {number} 매칭 점수 (간격 합계, 낮을수록 좋음)
 */
function getMatchScore(input, target) {
  let inputIndex = 0;
  let targetIndex = 0;
  let totalGap = 0;
  let lastMatchPos = -1;

  while (inputIndex < input.length && targetIndex < target.length) {
    if (input[inputIndex] === target[targetIndex]) {
      if (lastMatchPos >= 0) {
        totalGap += (targetIndex - lastMatchPos - 1);
      }
      lastMatchPos = targetIndex;
      inputIndex++;
    }
    targetIndex++;
  }

  return totalGap;
}

/**
 * 영어 버튼 텍스트와 입력값 prefix 매칭
 * @param {string} input - 현재 입력값
 * @param {string} buttonText - 버튼 텍스트 (따옴표 포함 가능)
 * @returns {{ isMatch: boolean, isExactMatch?: boolean, score?: number }}
 */
function evaluateEnglishMatch(input, buttonText) {
  const textAlpha = extractAlphabetOnly(buttonText);
  const inputAlpha = input.toLowerCase();
  if (textAlpha.startsWith(inputAlpha)) {
    const isExact = (textAlpha === inputAlpha);
    return { isMatch: true, isExactMatch: isExact, score: isExact ? 0 : 1 };
  }
  return { isMatch: false };
}

/**
 * 한글 입력값과 후보 텍스트 매칭 (초성/자모/서브시퀀스)
 * @param {string} input - 현재 입력값 (한글 자모)
 * @param {string} candidate - 버튼 텍스트
 * @param {boolean} isAlias - 동의어 여부 (true이면 점수 +1000)
 * @returns {{ score: number, isExactMatch: boolean } | null} 매칭 결과, 불일치 시 null
 */
function evaluateKoreanMatch(input, candidate, isAlias = false) {
  const chosung = window.getChosung(candidate);
  const disassembled = window.getDisassembled(candidate);

  const startsWithChosung = chosung.startsWith(input);
  const startsWithDisassembled = disassembled.startsWith(input);
  const useSubsequence = input.length >= 3;
  const isSubseqDisassembled = useSubsequence && isSubsequence(input, disassembled);

  if (!startsWithChosung && !startsWithDisassembled && !isSubseqDisassembled) {
    return null;
  }

  let score = Infinity;
  let isExactMatch = false;

  if (startsWithChosung && chosung === input) {
    score = 0;
    isExactMatch = true;
  } else if (startsWithDisassembled && disassembled === input) {
    score = 0;
    isExactMatch = true;
  } else if (startsWithChosung) {
    score = 1;
  } else if (startsWithDisassembled) {
    score = 2;
  } else if (isSubseqDisassembled) {
    score = 10 + getMatchScore(input, disassembled);
  }

  if (isAlias) {
    // Ensure original text matches always sort ahead of alias matches.
    score += 1000;
    isExactMatch = false;
  }

  return { score, isExactMatch };
}
