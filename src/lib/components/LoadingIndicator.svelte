<!-- src/lib/components/Loader.svelte -->
<script lang="ts">
    export let type: 'circle' | 'triangle' | 'rect' = 'rect';

    let viewBox: string;
    $: {
        if (type === 'triangle') {
            viewBox = '0 0 86 80';
        } else {
            viewBox = '0 0 80 80';
        }
    }
</script>

<div class="loader-overlay">
    <div class="loader" class:triangle={type === 'triangle'}>
        <svg {viewBox}>
            {#if type === 'circle'}
                <circle id="test" cx="40" cy="40" r="32"></circle>
            {:else if type === 'triangle'}
                <polygon points="43 8 79 72 7 72"></polygon>
            {:else if type === 'rect'}
                <rect x="8" y="8" width="64" height="64"></rect>
            {/if}
        </svg>
    </div>
</div>

<style lang="scss">
    @use "sass:math"; // Import sass:math

    .loader-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: rgba(0, 0, 0, 0.5);
        z-index: 100000;
    }

    .loader {
        --path: #2F3545;
        --dot: #5628EE;
        --duration: 3s;
        width: 44px;
        height: 44px;
        position: relative;

        &:before {
            content: '';
            width: 6px;
            height: 6px;
            border-radius: 50%;
            position: absolute;
            display: block;
            background: var(--dot);
            top: 37px;
            left: 19px;
            transform: translate(-18px, -18px);
            animation: dotRect var(--duration) cubic-bezier(0.785, 0.135, 0.15, 0.86) infinite;
        }

        svg {
            display: block;
            width: 100%;
            height: 100%;
            rect,
            polygon,
            circle {
                fill: none;
                stroke: var(--path);
                stroke-width: 10px;
                stroke-linejoin: round;
                stroke-linecap: round;
            }
            polygon {
                // Example for polygon, apply similarly for others if needed
                stroke-dasharray: 145 (221 - 145) 145 (221 - 145);
                stroke-dashoffset: 0;
                animation: pathTriangle var(--duration) cubic-bezier(0.785, 0.135, 0.15, 0.86) infinite;
            }
            rect {
                // Use math.div()
                stroke-dasharray: (math.div(256, 4) * 3) math.div(256, 4) (math.div(256, 4) * 3) math.div(256, 4);
                stroke-dashoffset: 0;
                animation: pathRect 3s cubic-bezier(0.785, 0.135, 0.15, 0.86) infinite;
            }
            circle {
                // Use math.div()
                stroke-dasharray: (math.div(200, 4) * 3) math.div(200, 4) (math.div(200, 4) * 3) math.div(200, 4);
                stroke-dashoffset: 75;
                animation: pathCircle var(--duration) cubic-bezier(0.785, 0.135, 0.15, 0.86) infinite;
            }
        }

        &.triangle {
            width: 48px;
            &:before {
                left: 21px;
                transform: translate(-10px, -18px);
                animation: dotTriangle var(--duration) cubic-bezier(0.785, 0.135, 0.15, 0.86) infinite;
            }
        }
    }

    // Keyframes remain the same
    @keyframes pathTriangle { /* ... */ }
    @keyframes dotTriangle { /* ... */ }
    @keyframes pathRect { /* ... */ }
    @keyframes dotRect { /* ... */ }
    @keyframes pathCircle { /* ... */ }
</style>