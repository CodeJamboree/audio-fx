let btn;
let customWaveformCanvas;
let waveFormRadios;
let frequencyInput;
let oscilloscopeCanvas;
let customWaveFormData = [];
let pianoCanvas;

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
function setFrequency(hertz) {
  document.getElementById('frequency').value = hertz;
}

function getWaveForm() {
  return document.querySelector('input[name="waveType"]:checked').value;
}
function getTremolo() {
  return document.getElementById('tremolo').checked;
}

let audioContext = new (window.AudioContext || window.webkitAudioContext)();

function handleClick() {
  if(audioContext.state === 'suspended') {
    audioContext.resume();
  } else if(audioContext.state === 'closed') {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  } else if (audioContext.state === 'running') {
    // console.log('Audio context is running');
  } else if (audioContext.state === 'interrupted') {
    console.log('Audio context is interrupted');
  }
  const durationSeconds = getDurationSeconds();
  const frequency = getFrequency();
  const waveType = getWaveForm();
  const channelCount = 1;
  let sound = getSound(waveType, audioContext, channelCount, frequency, durationSeconds);

  if(getTremolo()) {
    const gainNode = audioContext.createGain();
    gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
    const tremolo = audioContext.createGain();
    sound.connect(tremolo);
    tremolo.connect(gainNode);
    gainNode.connect(audioContext.destination);
  } else {
    sound.connect(audioContext.destination);
  }
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

function keyToOctave(key) {
  return Math.floor((key + 8) / 12);
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
  const xIndex = Math.floor((x + (sliceX / 2)) / sliceX);
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


const piano = {
  keyNumber: 0,
  frequency: 0,
  pressed: false,
  black: false,
  lastKey: 0,
  x: 0,
  y: 0
}
const pianoLetters = 'ABCDEFG';
const musicSharp = '\u266F';
const musicFlat = '\u266D';
let pianoPressed = false;

function handlePianoMouseDown(){
  pianoPressed = true;
}
function handlePianoMouseUp() {
  pianoPressed = false;
}

function handlePianoMouseMove(event) {
  const {
    left,
    top,
    height,
    width
  } = pianoCanvas.getBoundingClientRect();
  const {
    clientX,
    clientY
  } = event;
  const mouseX = clientX - left;
  const mouseY = clientY - top;

  const KEY_D = 4;
  const KEY_A = 1;
  const whiteKeyCount = 52;
  const keyHeight = pianoCanvas.height;
  const keyWidth = pianoCanvas.width / whiteKeyCount;
  const blackKeyCount = whiteKeyCount - 1;
  const blackKeyWidth = keyWidth * 0.8;
  const blackKeyHeight = keyHeight * 0.6;
  const blackKeyOffset = keyWidth * 0.6;

  piano.x = mouseX;
  piano.y = mouseY;
  piano.keyNumber = (Math.floor(mouseX / keyWidth) * 2) + 1;
  piano.letter = pianoLetters[piano.keyNumber % 7];
  piano.octave = Math.floor(piano.keyNumber / 7) - 1;
  piano.sharpFlat = false;


  let keyNumber = 0;
  let found = false;
  for(let i = 0; i < whiteKeyCount; i++) {
    keyNumber++;
    const x = i * keyWidth;
    if(mouseX >= x && mouseX <= x + keyWidth && mouseY >= 0 && mouseY <= keyHeight) {
      piano.keyNumber = keyNumber;
      piano.sharpFlat = false;
      piano.letter = pianoLetters[i % 7];
      piano.octave = keyToOctave(keyNumber);
      found = true;
    }

    if(i % 7 !== KEY_D && i % 7 !== KEY_A) {
      keyNumber++;
      const x = i * keyWidth + blackKeyOffset;
      if(mouseX >= x && mouseX <= x + blackKeyWidth && mouseY >= 0 && mouseY <= blackKeyHeight) {
        piano.keyNumber = keyNumber;
        piano.sharpFlat = true;
        piano.letter = pianoLetters[i % 7] + musicSharp + ' ' + pianoLetters[(i+1) % 7] + musicFlat;
        piano.octave = keyToOctave(keyNumber);
        found = true;
      }
    }

    if(found) break;
  }

  piano.frequency = 440 * Math.pow(2, (piano.keyNumber - 49) / 12);
  setFrequency(piano.frequency);
  drawPiano();
  if(pianoPressed && piano.keyNumber !== piano.lastKey) {
    piano.lastKey = piano.keyNumber;
    handleClick();
  }
}

function drawPiano() {
  const KEY_D = 4;
  const KEY_A = 1;
  const whiteKeyCount = 52;
  const keyHeight = pianoCanvas.height;
  const keyWidth = pianoCanvas.width / whiteKeyCount;
  const blackKeyCount = whiteKeyCount - 1;

  const ctx = pianoCanvas.getContext('2d');
  ctx.fillStyle = 'white';
  
  let keyNumber = 0;
  for (let i = 0; i < whiteKeyCount; i++) {
    keyNumber++;
      const x = i * keyWidth;
      if(piano.keyNumber === keyNumber) {
        ctx.fillStyle = '#cccccc';
      } else {
        ctx.fillStyle = 'white';
      }
      ctx.fillRect(x, 0, keyWidth, keyHeight);
      ctx.strokeRect(x, 0, keyWidth, keyHeight);
      if (i % 7 !== KEY_D && i % 7 !== KEY_A) { keyNumber++;}
  }

  const blackKeyWidth = keyWidth * 0.8;
  const blackKeyHeight = keyHeight * 0.6;
  const blackKeyOffset = keyWidth * 0.6;
  ctx.fillStyle = 'black';
  keyNumber = 0;
  for (let i = 0; i < blackKeyCount; i++) {
    keyNumber++;
      if (i % 7 !== KEY_D && i % 7 !== KEY_A) {
        keyNumber++;
        if(piano.keyNumber === keyNumber) {
          ctx.fillStyle = '#777777';
        } else {
          ctx.fillStyle = 'black';
        }
          const x = i * keyWidth + blackKeyOffset;
          ctx.fillRect(x, 0, blackKeyWidth, blackKeyHeight);
          ctx.strokeRect(x, 0, blackKeyWidth, blackKeyHeight);
      }
  }
  ctx.fillStyle = 'red';
  ctx.font = '20px Arial';
  ctx.fillText(`Key Number: ${piano.keyNumber} : ${piano.letter} : Octave ${piano.octave}`, 0, 20);
}

function handleCustomWaveFormMouseMove(event) {
  if(!customWaveformDrawing) return;
  handleCustomWaveFormClick(event);
}
function handleLoad() {
  btn = document.getElementById('btn');
  btn.addEventListener('click', handleClick);
  pianoCanvas = document.getElementById('piano');
  drawPiano();
  customWaveformCanvas = document.getElementById('customWaveform');
  customWaveFormData = Array(20).fill(.5);
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
  customWaveformCanvas.addEventListener('click', handleCustomWaveFormClick);
  pianoCanvas.addEventListener('mousemove', handlePianoMouseMove);
  pianoCanvas.addEventListener('mousedown', handlePianoMouseDown);
  pianoCanvas.addEventListener('mouseup', handlePianoMouseUp);
  pianoCanvas.addEventListener('mouseout', handlePianoMouseUp);
  pianoCanvas.addEventListener('click', handleClick);
}

window.addEventListener('load',handleLoad);