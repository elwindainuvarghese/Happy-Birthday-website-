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
        const container = document.getElementById('webgl-container');
        if(!container) return;
        
        const scene = new THREE.Scene();
        scene.fog = new THREE.FogExp2(0xffc0cb, 0.002);

        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.z = 30;

        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        container.appendChild(renderer.domElement);

        // Particle System
        const particleGeometry = new THREE.BufferGeometry();
        const particleCount = 2000;
        const posArray = new Float32Array(particleCount * 3);
        
        for(let i = 0; i < particleCount * 3; i++) {
            posArray[i] = (Math.random() - 0.5) * 100;
        }
        
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
        
        const particleMaterial = new THREE.PointsMaterial({
            size: 0.2,
            color: 0xffffff,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });

        const particlesMesh = new THREE.Points(particleGeometry, particleMaterial);
        scene.add(particlesMesh);

        // Floating 3D Shapes (Crazy aesthetic)
        const shapes = [];
        const geometries = [
            new THREE.TorusGeometry(1, 0.3, 16, 100),
            new THREE.OctahedronGeometry(1.5),
            new THREE.IcosahedronGeometry(1)
        ];
        
        const shapeMaterial = new THREE.MeshPhysicalMaterial({
            color: 0xffb6c1,
            metalness: 0.1,
            roughness: 0.2,
            transmission: 0.9,
            thickness: 0.5
        });

        for(let i = 0; i < 25; i++) {
            const geometry = geometries[Math.floor(Math.random() * geometries.length)];
            const mesh = new THREE.Mesh(geometry, shapeMaterial);
            
            mesh.position.set(
                (Math.random() - 0.5) * 60,
                (Math.random() - 0.5) * 60,
                (Math.random() - 0.5) * 40 - 10
            );
            
            mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
            
            const scale = Math.random() * 2 + 0.5;
            mesh.scale.set(scale, scale, scale);
            
            scene.add(mesh);
            shapes.push({
                mesh: mesh,
                rotSpeedX: (Math.random() - 0.5) * 0.02,
                rotSpeedY: (Math.random() - 0.5) * 0.02,
                floatSpeed: (Math.random() - 0.5) * 0.05
            });
        }

        // Lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);

        const pointLight1 = new THREE.PointLight(0xff69b4, 2, 100);
        pointLight1.position.set(0, 0, 20);
        scene.add(pointLight1);
        
        const pointLight2 = new THREE.PointLight(0xffd700, 1, 100);
        pointLight2.position.set(20, 20, 0);
        scene.add(pointLight2);

        // Mouse Interactivity
        let mouseX = 0;
        let mouseY = 0;
        
        document.addEventListener('mousemove', (event) => {
            mouseX = (event.clientX / window.innerWidth) * 2 - 1;
            mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
        });

        // Animation Loop
        const clock = new THREE.Clock();

        function animate() {
            requestAnimationFrame(animate);
            const elapsedTime = clock.getElapsedTime();

            // Rotate particle field
            particlesMesh.rotation.y = -elapsedTime * 0.05;
            particlesMesh.rotation.x = elapsedTime * 0.02;

            // Parallax mouse effect
            camera.position.x += (mouseX * 5 - camera.position.x) * 0.05;
            camera.position.y += (mouseY * 5 - camera.position.y) * 0.05;
            camera.lookAt(scene.position);

            // Animate shapes
            shapes.forEach((obj, index) => {
                obj.mesh.rotation.x += obj.rotSpeedX;
                obj.mesh.rotation.y += obj.rotSpeedY;
                obj.mesh.position.y += Math.sin(elapsedTime * 2 + obj.floatSpeed * 100) * 0.01;
            });

            renderer.render(scene, camera);
        }

        animate();

        // Responsive handling
        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }
});
