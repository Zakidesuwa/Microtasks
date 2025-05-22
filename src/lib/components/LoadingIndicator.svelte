<script lang="ts">
	// No JavaScript logic is needed for this animation.
</script>

<style lang="scss">
:root {
	--duration: 1.5s;
	--container-size: 250px;
	--box-size: 33px;
	--box-border-radius: 15%;
}


.container {
	width: 100%;
	height: 100%;
	display: flex;
	justify-content: center;
	align-items: center;
	position: fixed;
	top: 0;
	left: 0;
	z-index: 9999; /* Ensure it's on top of other elements */
	background-color: rgba(0, 0, 0, 0.7); /* Darker, more opaque background */
}

.box {
	width: var(--box-size);
	height: var(--box-size);
	position: relative;
	display: block;
	transform-origin: -50% center;
	border-radius: var(--box-border-radius);

	&::after {
		content: '';
		width: 100%;
		height: 100%;
		position: absolute;
		top: 0;
		right: 0;
		background-color: lightblue;
		border-radius: var(--box-border-radius);
		box-shadow: 0px 0px 10px 0px rgba(28, 159, 255, 0.4);
	}

	&:nth-child(1) {
		animation: slide var(--duration) ease-in-out infinite alternate;
		&::after {
			animation: color-change var(--duration) ease-in-out infinite alternate;
		}
	}

	&:nth-child(2) {
		animation: flip-1 var(--duration) ease-in-out infinite alternate;
		&::after {
			animation: squidge-1 var(--duration) ease-in-out infinite alternate;
		}
	}
	&:nth-child(3) {
		animation: flip-2 var(--duration) ease-in-out infinite alternate;
		&::after {
			animation: squidge-2 var(--duration) ease-in-out infinite alternate;
		}
	}
	&:nth-child(4) {
		animation: flip-3 var(--duration) ease-in-out infinite alternate;
		&::after {
			animation: squidge-3 var(--duration) ease-in-out infinite alternate;
		}
	}
	&:nth-child(5) {
		animation: flip-4 var(--duration) ease-in-out infinite alternate;
		&::after {
			animation: squidge-4 var(--duration) ease-in-out infinite alternate;
		}
	}

	&:nth-child(2)::after {
		background-color: #1c9fff;
	}
	&:nth-child(3)::after {
		background-color: #1fb1fd;
	}
	&:nth-child(4)::after {
		background-color: #22c7fb;
	}
	&:nth-child(5)::after {
		background-color: #23d3fb;
	}
}

@keyframes slide {
	0% {
		transform: translatex(0vw);
	}
	100% {
		transform: translatex(calc(var(--container-size) - (var(--box-size) * 1.25)));
	}
}

@keyframes color-change {
	0% {
		background-color: #1795ff;
	}
	100% {
		background-color: #23d3fb;
	}
}

@keyframes flip-1 {
	0%, 15% {
		transform: rotate(0);
	}
	35%, 100% {
		transform: rotate(-180deg);
	}
}

@keyframes squidge-1 {
	5% {
		transform-origin: bottom;
		transform: scaleX(1) scaleY(1);
	}
	15% {
		transform-origin: bottom;
		transform: scaleX(1.3) scaleY(0.7);
	}
	20%, 25% {
		transform-origin: bottom;
		transform: scaleX(0.8) scaleY(1.4);
	}
	40% {
		transform-origin: top;
		transform: scaleX(1.3) scaleY(0.7);
	}
	55%, 100% {
		transform-origin: top;
		transform: scaleX(1) scaleY(1);
	}
}

@keyframes flip-2 {
	0%, 30% {
		transform: rotate(0);
	}
	50%, 100% {
		transform: rotate(-180deg);
	}
}

@keyframes squidge-2 {
	20% {
		transform-origin: bottom;
		transform: scaleX(1) scaleY(1);
	}
	30% {
		transform-origin: bottom;
		transform: scaleX(1.3) scaleY(0.7);
	}
	35%, 40% {
		transform-origin: bottom;
		transform: scaleX(0.8) scaleY(1.4);
	}
	55% {
		transform-origin: top;
		transform: scaleX(1.3) scaleY(0.7);
	}
	70%, 100% {
		transform-origin: top;
		transform: scaleX(1) scaleY(1);
	}
}

@keyframes flip-3 {
	0%, 45% {
		transform: rotate(0);
	}
	65%, 100% {
		transform: rotate(-180deg);
	}
}

@keyframes squidge-3 {
	35% {
		transform-origin: bottom;
		transform: scaleX(1) scaleY(1);
	}
	45% {
		transform-origin: bottom;
		transform: scaleX(1.3) scaleY(0.7);
	}
	50%, 55% {
		transform-origin: bottom;
		transform: scaleX(0.8) scaleY(1.4);
	}
	70% {
		transform-origin: top;
		transform: scaleX(1.3) scaleY(0.7);
	}
	85%, 100% {
		transform-origin: top;
		transform: scaleX(1) scaleY(1);
	}
}

@keyframes flip-4 {
	0%, 60% {
		transform: rotate(0);
	}
	80%, 100% {
		transform: rotate(-180deg);
	}
}

@keyframes squidge-4 {
	50% {
		transform-origin: bottom;
		transform: scaleX(1) scaleY(1);
	}
	60% {
		transform-origin: bottom;
		transform: scaleX(1.3) scaleY(0.7);
	}
	65%, 70% {
		transform-origin: bottom;
		transform: scaleX(0.8) scaleY(1.4);
	}
	85% {
		transform-origin: top;
		transform: scaleX(1.3) scaleY(0.7);
	}
	100% {
		transform-origin: top;
		transform: scaleX(1) scaleY(1);
	}
}
</style>

<div class="container">
	{#each Array(5) as _, i}
		<div class="box"></div>
	{/each}
</div>
