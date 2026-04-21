document.addEventListener('DOMContentLoaded', () => {
    // Phase Elements
    const phase1 = document.getElementById('phase-1');
    const phase2 = document.getElementById('phase-2');
    const phase3 = document.getElementById('phase-3');
    
    // Interactive Elements
    const flame = document.getElementById('flame');
    const blowBtn = document.getElementById('blow-btn');
    const cake = document.getElementById('cake');

    // Setup initial state
    phase1.classList.add('active');
    initBackground();

    // ---------------------------------------------------------
    // Phase 1: The Candle Logic
    // ---------------------------------------------------------
    
    // Button click handling
    blowBtn.addEventListener('click', blowOutCandle);

    // Microphone setup for blowing out candle
    let audioContext;
    let microphone;
    let analyser;

    async function setupMicrophone() {
        try {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            
            microphone = audioContext.createMediaStreamSource(stream);
            analyser = audioContext.createAnalyser();
            
            analyser.fftSize = 512;
            analyser.smoothingTimeConstant = 0.5;
            microphone.connect(analyser);

            detectBlow();
        } catch (err) {
            console.log("Microphone access denied or not supported.", err);
            // Revert back to just clicking the button if mic fails
        }
    }

    function detectBlow() {
        if (flame.classList.contains('blown-out')) return;

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(dataArray);

        // Sum lower frequencies (wind noise tends to be low frequency)
        let sum = 0;
        for (let i = 0; i < 20; i++) {
            sum += dataArray[i];
        }
        let average = sum / 20;

        // Threshold for blowing (adjust as needed based on testing)
        if (average > 100) {
            blowOutCandle();
        } else {
            requestAnimationFrame(detectBlow);
        }
    }

    // Try to setup mic, user usually has to interact first for AudioContext to work
    blowBtn.addEventListener('mouseover', () => {
        if(!audioContext) setupMicrophone();
    });

    function blowOutCandle() {
        if(flame.classList.contains('blown-out')) return;

        flame.classList.add('blown-out');
        blowBtn.style.opacity = '0';
        blowBtn.style.pointerEvents = 'none';

        // Wait for smoke animation then transition
        setTimeout(() => {
            transitionToPhase2();
        }, 1500);
    }

    // ---------------------------------------------------------
    // Phase Transitions
    // ---------------------------------------------------------

    function transitionToPhase2() {
        phase1.style.opacity = '0';
        setTimeout(() => {
            phase1.classList.remove('active');
            phase2.classList.add('active');
            
            // Pop effect for cake
            const cakeContainer = document.querySelector('.cake-container');
            cakeContainer.style.transform = 'scale(0)';
            
            // Allow display change before animating scale
            requestAnimationFrame(() => {
                cakeContainer.style.transition = 'transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)';
                cakeContainer.style.transform = 'scale(1)';
                phase2.style.opacity = '1';
            });
            
        }, 1000);
    }

    function transitionToPhase3() {
        phase2.style.opacity = '0';
        triggerConfettiBurst();

        setTimeout(() => {
            phase2.classList.remove('active');
            phase3.classList.add('active');
            
            requestAnimationFrame(() => {
                phase3.style.opacity = '1';
            });
        }, 1000);
    }

    // ---------------------------------------------------------
    // Phase 2: The Cake Logic
    // ---------------------------------------------------------

    cake.addEventListener('click', () => {
        transitionToPhase3();
    });

    // ---------------------------------------------------------
    // Confetti Logic
    // ---------------------------------------------------------

    function triggerConfettiBurst() {
        const duration = 3000;
        const end = Date.now() + duration;

        (function frame() {
            confetti({
                particleCount: 5,
                angle: 60,
                spread: 55,
                origin: { x: 0 },
                colors: ['#ffb6c1', '#ffd700', '#ff69b4', '#fff']
            });
            confetti({
                particleCount: 5,
                angle: 120,
                spread: 55,
                origin: { x: 1 },
                colors: ['#ffb6c1', '#ffd700', '#ff69b4', '#fff']
            });

            if (Date.now() < end) {
                requestAnimationFrame(frame);
            }
        }());

        // Big center burst
        confetti({
            particleCount: 150,
            spread: 100,
            origin: { y: 0.6 },
            colors: ['#ffb6c1', '#ffd700', '#ff69b4', '#fff']
        });
    }

    // ---------------------------------------------------------
    // Background Canvas Logic (Floating Hearts)
    // ---------------------------------------------------------
    function initBackground() {
        const canvas = document.getElementById('bg-canvas');
        const ctx = canvas.getContext('2d');
        let width, height;
        let hearts = [];

        function resize() {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        }

        window.addEventListener('resize', resize);
        resize();

        class Heart {
            constructor() {
                this.x = Math.random() * width;
                this.y = height + Math.random() * 100;
                this.size = Math.random() * 20 + 10;
                this.speedY = Math.random() * 1 + 0.5;
                this.speedX = (Math.random() - 0.5) * 0.5;
                this.opacity = Math.random() * 0.5 + 0.1;
                this.color = `rgba(255, 255, 255, ${this.opacity})`;
            }

            update() {
                this.y -= this.speedY;
                this.x += this.speedX;

                // Gentle sway
                this.x += Math.sin(this.y * 0.01) * 0.5;

                if (this.y < -this.size) {
                    this.y = height + this.size;
                    this.x = Math.random() * width;
                }
            }

            draw() {
                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.scale(this.size / 20, this.size / 20); // Normalize size based on 20px base

                // Draw heart shape
                ctx.beginPath();
                ctx.moveTo(0, 5);
                ctx.bezierCurveTo(0, 0, -10, 0, -10, 10);
                ctx.bezierCurveTo(-10, 20, 0, 25, 0, 35);
                ctx.bezierCurveTo(0, 25, 10, 20, 10, 10);
                ctx.bezierCurveTo(10, 0, 0, 0, 0, 5);
                ctx.fillStyle = this.color;
                ctx.fill();
                ctx.closePath();

                ctx.restore();
            }
        }

        // Create hearts
        const heartCount = Math.floor(window.innerWidth / 30); // Responsive amount
        for (let i = 0; i < heartCount; i++) {
            hearts.push(new Heart());
            // Randomize initial positions so they don't all start at bottom
            hearts[i].y = Math.random() * height; 
        }

        function animate() {
            ctx.clearRect(0, 0, width, height);

            hearts.forEach(heart => {
                heart.update();
                heart.draw();
            });

            requestAnimationFrame(animate);
        }

        animate();
    }
});
