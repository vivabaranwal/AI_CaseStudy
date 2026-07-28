/* main.js — Entry point */
import { initRouter, showScreen } from './router.js';
import { initScreen0 } from './screens/screen0-landing.js';
import { initScreen1 } from './screens/screen1-company.js';
import { initScreen2 } from './screens/screen2-challenge.js';
import { initScreen3 } from './screens/screen3-sources.js';
import { initScreen4 } from './screens/screen4-preferences.js';
import { initScreen5 } from './screens/screen5-review.js';
import { initScreen6, startGeneration } from './screens/screen6-generation.js';
import { initScreen7 } from './screens/screen7-preview.js';
import { initScreen8 } from './screens/screen8-export.js';

async function boot() {
  // Init all static screens
  initScreen0();
  initScreen1();
  // Screens 2–5 init lazily or immediately (no heavy async)
  initScreen2();
  initScreen3();
  initScreen4();
  initScreen6();

  // Screen 5 (review) renders from formState — reinit each time
  document.addEventListener('caseiq:init-review', () => initScreen5());

  // Generation
  document.addEventListener('caseiq:begin-generation', () => {
    showScreen(6);
    startGeneration();
  });

  // Preview/success screen — init when generation completes
  document.addEventListener('caseiq:show-export', () => initScreen7());

  // Export screen — init when user navigates from Screen 7
  document.addEventListener('caseiq:show-export-screen', () => initScreen8());

  // Start at screen 0
  initRouter();
}

boot();
