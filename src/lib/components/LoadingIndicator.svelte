<script lang="ts">
  import { navigating } from '$app/stores';
  import { onMount, onDestroy } from 'svelte';
  import { sineInOut } from 'svelte/easing';
  import { fly, fade } from 'svelte/transition';

  let progressInterval: ReturnType<typeof setInterval> | undefined = undefined;
  let messageInterval: ReturnType<typeof setInterval> | undefined = undefined;

  let progress = 0;
  let showLoader = false;
  let navigationStartTime = 0;

  // --- Configuration for "Real" Progress Feel ---
  // Time (ms) over which we expect the progress bar to reach MAX_VISUAL_PROGRESS
  // if the page load is this long or longer.
  const TARGET_LOAD_DURATION_MS = 2000; // e.g., 2 seconds for a "typical" slow load
  // The max percentage the bar will reach based on time alone.
  // The final jump to 100% happens when $navigating becomes false.
  const MAX_VISUAL_PROGRESS_BEFORE_COMPLETION = 95;
  // How frequently to update the progress bar (ms)
  const PROGRESS_UPDATE_INTERVAL_MS = 50;
  // --- End Configuration ---

  const loadingMessages = [
    "Accessing neural network...",
    "Decrypting data stream...",
    "Engaging warp core...",
    "Plotting course through the mainframe...",
    "Assembling reality fragments...",
    "Loading environmental shaders...",
    "Booting cybernetic interface...",
    "Compiling awesomeness..."
  ];
  let currentMessageIndex = 0;

  $: if ($navigating && !showLoader) {
    showLoader = true;
    progress = 0;
    navigationStartTime = Date.now();
    currentMessageIndex = Math.floor(Math.random() * loadingMessages.length);

    if (progressInterval) clearInterval(progressInterval);
    progressInterval = setInterval(() => {
      if (!$navigating) { // Should be caught by the other block, but good for safety
        clearInterval(progressInterval);
        return;
      }
      const elapsedTime = Date.now() - navigationStartTime;
      // Calculate progress based on time, but cap it
      let timeBasedProgress = (elapsedTime / TARGET_LOAD_DURATION_MS) * MAX_VISUAL_PROGRESS_BEFORE_COMPLETION;
      timeBasedProgress = Math.min(timeBasedProgress, MAX_VISUAL_PROGRESS_BEFORE_COMPLETION);

      // Ensure progress only increases and doesn't exceed the cap
      progress = Math.max(progress, timeBasedProgress);

    }, PROGRESS_UPDATE_INTERVAL_MS);

    if (messageInterval) clearInterval(messageInterval);
    messageInterval = setInterval(() => {
      currentMessageIndex = (currentMessageIndex + 1) % loadingMessages.length;
    }, 2500);

  } else if (!$navigating && showLoader) {
    // Navigation has finished!
    if (progressInterval) clearInterval(progressInterval);
    progress = 100; // Instantly jump to 100%

    // Allow a brief moment for the 100% to show before fading out
    setTimeout(() => {
      showLoader = false; // This will trigger the fade-out transition
      if (messageInterval) clearInterval(messageInterval);
      // Reset progress for the next navigation after the loader is hidden
      setTimeout(() => progress = 0, 500); // Match fade duration
    }, 150); // Short delay to show 100%
  }

  onDestroy(() => {
    if (progressInterval) clearInterval(progressInterval);
    if (messageInterval) clearInterval(messageInterval);
  });
</script>

{#if showLoader}
  <div
    class="game-loader-overlay"
    transition:fade="{{ duration: 400, easing: sineInOut }}"
  >
    <div class="loader-content" transition:fly="{{ y: 20, duration: 500, delay:100, easing: sineInOut }}">
      <div class="energy-core-container">
        <div class="energy-core">
          <div class="core-pulse"></div>
          <div class="core-rings">
            <div></div><div></div><div></div>
          </div>
        </div>
      </div>

      <div class="status-text">
        <p>{loadingMessages[currentMessageIndex]}</p>
      </div>

      <div class="progress-bar-container">
        <div class="progress-bar-track">
          <div
            class="progress-bar-fill"
            style="width: {progress}%; transition-duration: {progress === 100 ? '0.1s' : (PROGRESS_UPDATE_INTERVAL_MS / 1000) + 's'};"
          ></div>
        </div>
        <span class="progress-percentage">{Math.floor(progress)}%</span>
      </div>
    </div>
  </div>
{/if}

<style>
  :root {
    --loader-primary-color: #00ffff; /* Cyan / Electric Blue */
    --loader-secondary-color: #ff00ff; /* Magenta / Pink */
    --loader-bg-color: #0d0d1a; /* Very dark blue/purple */
    --loader-text-color: #e0e0e0;
  }

  .game-loader-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(13, 13, 26, 0.95);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 99999;
    font-family: 'Orbitron', 'Consolas', 'Courier New', monospace;
    color: var(--loader-text-color);
    backdrop-filter: blur(3px);
  }

  .loader-content {
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 30px;
    padding: 20px;
  }

  /* Energy Core Animation (same as before) */
  .energy-core-container { width: 150px; height: 150px; position: relative; display: flex; justify-content: center; align-items: center; }
  .energy-core { width: 80px; height: 80px; background: radial-gradient(circle, var(--loader-primary-color) 0%, transparent 70%); border-radius: 50%; position: relative; animation: core-glow 2s infinite alternate ease-in-out; }
  .core-pulse { position: absolute; top: 50%; left: 50%; width: 100%; height: 100%; background-color: var(--loader-primary-color); border-radius: 50%; transform: translate(-50%, -50%) scale(0.8); opacity: 0.5; animation: core-pulse-animation 1.5s infinite ease-in-out; }
  .core-rings div { position: absolute; top: 50%; left: 50%; border: 2px solid var(--loader-secondary-color); border-radius: 50%; transform: translate(-50%, -50%); opacity: 0; animation: ring-expand 3s infinite ease-out; }
  .core-rings div:nth-child(1) { width: 100px; height: 100px; animation-delay: 0s; }
  .core-rings div:nth-child(2) { width: 130px; height: 130px; animation-delay: 1s; }
  .core-rings div:nth-child(3) { width: 160px; height: 160px; animation-delay: 2s; }
  @keyframes core-glow { from { box-shadow: 0 0 10px var(--loader-primary-color), 0 0 20px var(--loader-primary-color); } to   { box-shadow: 0 0 20px var(--loader-primary-color), 0 0 40px var(--loader-primary-color), 0 0 60px var(--loader-secondary-color); } }
  @keyframes core-pulse-animation { 0%, 100% { transform: translate(-50%, -50%) scale(0.7); opacity: 0.4; } 50%      { transform: translate(-50%, -50%) scale(1); opacity: 0.8; } }
  @keyframes ring-expand { 0% { transform: translate(-50%, -50%) scale(0.5); opacity: 1; } 100% { transform: translate(-50%, -50%) scale(1.5); opacity: 0; } }


  .status-text p { font-size: 1.1em; min-height: 1.5em; letter-spacing: 1px; text-shadow: 0 0 5px var(--loader-primary-color); opacity: 0.9; }

  /* Progress Bar */
  .progress-bar-container { width: 300px; max-width: 80%; display: flex; align-items: center; gap: 10px; }
  .progress-bar-track { flex-grow: 1; height: 12px; background-color: rgba(255, 255, 255, 0.1); border: 1px solid var(--loader-primary-color); border-radius: 6px; overflow: hidden; padding: 2px; }
  .progress-bar-fill {
    height: 100%;
    width: 0%;
    background: linear-gradient(90deg, var(--loader-secondary-color), var(--loader-primary-color));
    border-radius: 4px;
    /* Dynamic transition duration for smoothness */
    transition-property: width;
    transition-timing-function: linear; /* Or ease-out for a slightly different feel */
    box-shadow: 0 0 8px var(--loader-primary-color);
  }
  .progress-percentage { font-size: 0.9em; min-width: 35px; text-align: right; }
</style>