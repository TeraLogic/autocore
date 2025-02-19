import cliSpinners from 'cli-spinners';
import readline from 'readline';

let loading = false;
let spinnerIndex = 0;
const spinnerFrames = cliSpinners.dots.frames;
let currentMessage = '';

function renderSpinner() {
  if (!loading) return;

  readline.clearLine(process.stdout, 0);
  readline.cursorTo(process.stdout, 0);

  process.stdout.write(`${spinnerFrames[spinnerIndex]} ${currentMessage}`);

  spinnerIndex = (spinnerIndex + 1) % spinnerFrames.length;

  setTimeout(renderSpinner, cliSpinners.dots.interval);
}

export function setLoading(state, message = 'Lädt...') {
  loading = state;
  currentMessage = message;

  if (loading) {
    renderSpinner();
  } else {
    readline.clearLine(process.stdout, 0);
    readline.cursorTo(process.stdout, 0);
  }
}

export function log(message) {
  currentMessage = message;
}
