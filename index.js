let btn;
let customWaveformCanvas;
let waveFormRadios;
let frequencyInput;
let oscilloscopeCanvas;
let customWaveFormData = [];

function randomNum(min, max) {
  return Math.random() * (max - min) + min;
}

function getSound(waveType, audioContext, channelCount, frequency, durationSeconds) {
  if(waveType === 'noise') {
    const sampleRate = audioContext.sampleRate;
    const numSamples = Math.ceil(sampleRate * durationSeconds);
    const buffer = audioContext.createBuffer(channelCount, numSamples, sampleRate);
    const data = buffer.getChannelData(0);
    for(let i = 0; i < numSamples; i++) {
      data[i] = randomNum(-1, 1);
    }
    const bufferSource = audioContext.createBufferSource();
    bufferSource.buffer = buffer;
    return bufferSource;
  }

  const oscillator = audioContext.createOscillator();

  if(waveType === 'custom') {
    const width = customWaveFormData.length;
    const real = new Float32Array(width);
    const imag = new Float32Array(width).fill(0);
    for(let i = 0; i < width; i++) {
      real[i] = customWaveFormData[i];
    }
    const wave = audioContext.createPeriodicWave(real, imag);
    oscillator.setPeriodicWave(wave);
  } else {
    oscillator.type = waveType;
  }
  oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
  return oscillator;
}

function getDurationSeconds() { 
  return parseFloat(document.getElementById('durationSeconds').value);
}

function getFrequency() {
  return parseInt(document.getElementById('frequency').value);
}

function getWaveForm() {
  return document.querySelector('input[name="waveType"]:checked').value;
}

function handleClick() {
  const durationSeconds = getDurationSeconds();
  const frequency = getFrequency();
  const waveType = getWaveForm();
  const channelCount = 1;
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  let sound = getSound(waveType, audioContext, channelCount, frequency, durationSeconds);

  sound.connect(audioContext.destination);
  sound.start();
  window.setTimeout(() => {
    sound.stop();
  }, durationSeconds * 1000);
}

function max(a, b) { return Math.max(a, b); };
function min(a, b) { return Math.min(a, b); };

function handleWaveFormChange(event) {

  // Generate the waveform
  const durationSeconds = getDurationSeconds();
  const frequency = getFrequency();
  const waveType = getWaveForm();
  const channelCount = 1;
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  let sound = getSound(
    waveType,
    audioContext,
    channelCount,
    frequency,
    durationSeconds
  );

  // Prepare to Analyze the waveform
  const analyser = audioContext.createAnalyser();
  analyser.fftSize = 2048;
  sound.connect(analyser);
  sound.start();

  // Wait for the wave form to complete
  window.setTimeout(() => {
    // Read the waveform
    const bufferLength = analyser.frequencyBinCount;
    const waveform = new Float32Array(bufferLength);
    analyser.getFloatTimeDomainData(waveform);

    // Draw the waveform
    drawWaveform(waveform);

    // Stop the sound and close the audio context
    sound.stop();
    sound.disconnect(analyser);
    audioContext.close();
  }, durationSeconds * 1000);
}

function drawWaveform(waveform) {
  const ctx = oscilloscopeCanvas.getContext('2d');

  const width = oscilloscopeCanvas.width;
  const height = oscilloscopeCanvas.height;
  const bufferLength = waveform.length;

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = 'rgb(200, 200, 200)';
  ctx.fillRect(0, 0, width, height);
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgb(0, 0, 255)';
  ctx.beginPath();

  const sliceWidth = width * (1.0 / bufferLength);
  let x = 0;
  for(let i = 0; i < bufferLength; i++) {
    const y = (height / 2) + (waveform[i] * (height / 2));
    if(i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
    x += sliceWidth;
  }
  ctx.lineTo(width, height / 2);
  ctx.stroke();
}

let customWaveformDrawing = false;

function handleCustomWaveFormMouseDown() {
  customWaveformDrawing = true;
}

function handleCustomWaveFormMouseUp() {
  customWaveformDrawing = false;
}
function handleCustomWaveFormClick(event) {
  const {
    left,
    top,
    height,
    width
  } = customWaveformCanvas.getBoundingClientRect();
  const {
    clientX,
    clientY
  } = event;
  const x = clientX - left;
  const y = clientY - top;
  const sliceX = customWaveformCanvas.width / (customWaveFormData.length - 1);
  const xIndex = Math.floor(x / sliceX);
  customWaveFormData[xIndex] = y / height;
  const ctx = customWaveformCanvas.getContext('2d');
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = 'rgb(200, 200, 200)';
  ctx.fillRect(0, 0, width, height);
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgb(0, 0, 255)';
  ctx.beginPath();
  for(let i = 0; i < customWaveFormData.length; i++) {
    if(i === 0) {
      ctx.moveTo(i * sliceX, customWaveFormData[i] * height);
    } else {
      ctx.lineTo(i * sliceX, customWaveFormData[i] * height);
    }
  }
  ctx.stroke();

  if(getWaveForm() === 'custom')
    handleWaveFormChange();
}

function handleCustomWaveFormMouseMove(event) {
  if(!customWaveformDrawing) return;
  handleCustomWaveFormClick(event);
}
function handleLoad() {
  btn = document.getElementById('btn');
  btn.addEventListener('click', handleClick);
  customWaveformCanvas = document.getElementById('customWaveform');
  customWaveFormData = Array(10).fill(.5);
  oscilloscopeCanvas = document.getElementById('oscilloscope');
  waveFormRadios = document.getElementsByName('waveType');
  for(let i = 0; i < waveFormRadios.length; i++) {
    waveFormRadios[i].addEventListener('change', handleWaveFormChange);
  }
  frequencyInput = document.getElementById('frequency');
  frequencyInput.addEventListener('change', handleWaveFormChange);
  customWaveformCanvas.addEventListener('mousemove', handleCustomWaveFormMouseMove)
  customWaveformCanvas.addEventListener('mousedown', handleCustomWaveFormMouseDown)
  customWaveformCanvas.addEventListener('mouseup', handleCustomWaveFormMouseUp)
  customWaveformCanvas.addEventListener('mouseout', handleCustomWaveFormMouseUp)
  customWaveformCanvas.addEventListener('click', handleCustomWaveFormClick)
}

window.addEventListener('load',handleLoad);