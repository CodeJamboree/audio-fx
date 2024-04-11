let btn;

function handleClick() {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  oscillator.frequency.setValueAtTime(440, audioContext.currentTime); // 440 Hz
  oscillator.type = 'sine'; // Sine wave
  oscillator.connect(audioContext.destination);
  oscillator.start();
  window.setTimeout(() => {
    oscillator.stop();
  }, 400);
}

function handleLoad() {
  btn = document.getElementById('btn');
  btn.addEventListener('click', handleClick);
}

window.addEventListener('load',handleLoad);