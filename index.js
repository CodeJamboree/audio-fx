let btn;

function randomNum(min, max) {
  return Math.random() * (max - min) + min;
}
function fillWithNoise(data, bufferSize) {
  for(let i = 0; i < bufferSize; i++) data[i] = randomNum(-1, 1);
}
function fillWithSignWave(data, bufferSize, frequency, sampleRate) {
  const period = sampleRate / frequency;
  for(let i = 0; i < bufferSize; i++) {
    data[i] = Math.sin(i * 2 * Math.PI / period);
  }
}
function fillWithSawToothWave(data, bufferSize, frequency, sampleRate) {
  const period = sampleRate / frequency;
  for(let i = 0; i < bufferSize; i++) {
    data[i] = ((i % period) / period) * 2 - 1;
  }
}
function fillWithSquareWave(data, bufferSize, frequency, sampleRate) {
  const period = sampleRate / frequency;
  for(let i = 0; i < bufferSize; i++) {
    data[i] = i % period < period / 2 ? 1 : -1;
  }
}
function fillWithTriangleWave(data, bufferSize, frequency, sampleRate) {
  const period = sampleRate / frequency;
  for(let i = 0; i < bufferSize; i++) {
    const halfPeriod = period / 2;
    const slope = 2 / halfPeriod;
    const x = i % period;
    data[i] = x < halfPeriod ? slope * x - 1 : -slope * x + 3;
  }
}

function fillWave(waveType, data, bufferSize, sampleRate, frequency) {
  switch(waveType) {
    case 'sine':
      fillWithSignWave(data, bufferSize, frequency, sampleRate);
      break;
    case 'sawtooth':
      fillWithSawToothWave(data, bufferSize, frequency, sampleRate);
      break;
    case 'square':
      fillWithSquareWave(data, bufferSize, frequency, sampleRate);
      break;
    case 'triangle':
      fillWithTriangleWave(data, bufferSize, frequency, sampleRate);
      break;
    case 'noise':
      fillWithNoise(data, bufferSize);
      break;
    default:
      fillWithSignWave(data, bufferSize, frequency, sampleRate);
      break;

  }
}

function handleClick() {
  const frequency = parseInt(document.getElementById('frequency').value);
  const radios = document.getElementsByName('waveType');
  let waveType;
  for (let i = 0; i < radios.length; i++) {
    if (radios[i].checked) {
      waveType = radios[i].value;
      break;
    }
  }

  const lengthSeconds = 2;
  const channelCount = 1;

  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const bufferSize = lengthSeconds * audioContext.sampleRate;
  const buffer = audioContext.createBuffer(channelCount, bufferSize, audioContext.sampleRate);
  const data = buffer.getChannelData(0);
  fillWave(waveType, data, bufferSize, audioContext.sampleRate, frequency);

  const bufferSource = audioContext.createBufferSource();
  bufferSource.buffer = buffer;
  bufferSource.connect(audioContext.destination);
  bufferSource.start();

  window.setTimeout(() => {
    bufferSource.stop();
  }, 400);
}

function handleLoad() {
  btn = document.getElementById('btn');
  btn.addEventListener('click', handleClick);
}

window.addEventListener('load',handleLoad);