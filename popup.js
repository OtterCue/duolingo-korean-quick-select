// 팝업이 열릴 때 실행
document.addEventListener('DOMContentLoaded', function() {
  const statusIcon = document.getElementById('status-icon');
  const statusText = document.getElementById('status-text');
  const inputDisplay = document.getElementById('input-display');
  const totalInputsEl = document.getElementById('total-inputs');
  const autoSelectsEl = document.getElementById('auto-selects');
  const lastInputEl = document.getElementById('last-input');
  
  // 현재 탭이 듀오링고인지 확인
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    const currentTab = tabs[0];
    
    if (currentTab && currentTab.url && currentTab.url.includes('duolingo.com')) {
      statusIcon.classList.add('active');
      statusText.textContent = '활성화됨 ✓';
      
      // content script에 메시지 보내서 상태 요청
      chrome.tabs.sendMessage(currentTab.id, { action: 'getStatus' }, function(response) {
        if (chrome.runtime.lastError) {
          console.warn('Content script not ready:', chrome.runtime.lastError);
          return;
        }
        
        if (response) {
          updateUI(response);
        }
      });
    } else {
      statusIcon.classList.add('inactive');
      statusText.textContent = '비활성 (듀오링고 페이지에서만 작동)';
    }
  });
  
  // 실시간 업데이트 리스너
  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === 'updatePopup') {
      updateUI(request.data);
    }
  });
  
  function updateUI(data) {
    // 현재 입력 표시
    if (data.currentInput && data.currentInput !== '') {
      inputDisplay.textContent = data.currentInput;
      inputDisplay.classList.remove('empty');
    } else {
      inputDisplay.textContent = '초성을 입력해보세요';
      inputDisplay.classList.add('empty');
    }
    
    // 통계 업데이트
    if (data.stats) {
      totalInputsEl.textContent = data.stats.totalInputs || 0;
      autoSelectsEl.textContent = data.stats.autoSelects || 0;
      lastInputEl.textContent = data.stats.lastInput || '없음';
    }
  }
  
  // 주기적으로 상태 업데이트 (1초마다)
  setInterval(function() {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      const currentTab = tabs[0];
      
      if (currentTab && currentTab.url && currentTab.url.includes('duolingo.com')) {
        chrome.tabs.sendMessage(currentTab.id, { action: 'getStatus' }, function(response) {
          if (response && !chrome.runtime.lastError) {
            updateUI(response);
          }
        });
      }
    });
  }, 1000);
});
