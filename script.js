document.addEventListener('DOMContentLoaded', () => {
    // Phase Elements
    const phase1 = document.getElementById('phase-1');
    const phase2 = document.getElementById('phase-2');
    const phase3 = document.getElementById('phase-3');
    
    const blowBtn = document.getElementById('blow-btn');

    phase1.classList.add('active');

    // --- THREE.JS SETUP ---
    const container = document.getElementById('webgl-container');
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x1a0b2e, 0.015); // Darker space-like crazy background

    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 5, 20);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.toneMapping = THREE.ReinhardToneMapping;
    container.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    // Crazy Background Particles
    const particleGeo = new THREE.BufferGeometry();
    const particleCount = 3000;
    const posArray = new Float32Array(particleCount * 3);
    for(let i = 0; i < particleCount * 3; i++) {
        posArray[i] = (Math.random() - 0.5) * 150;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const particleMat = new THREE.PointsMaterial({ size: 0.15, color: 0xff69b4, transparent: true, blending: THREE.AdditiveBlending });
    const particlesMesh = new THREE.Points(particleGeo, particleMat);
    scene.add(particlesMesh);

    // --- 3D CRAZY CANDLE ---
    const candleGroup = new THREE.Group();
    scene.add(candleGroup);

    // Wax
    const waxGeo = new THREE.CylinderGeometry(1.5, 1.5, 8, 32);
    const waxMat = new THREE.MeshPhysicalMaterial({ color: 0xfffafa, roughness: 0.1, transmission: 0.3, thickness: 2 });
    const wax = new THREE.Mesh(waxGeo, waxMat);
    wax.position.y = 4;
    candleGroup.add(wax);

    // Wick
    const wickGeo = new THREE.CylinderGeometry(0.1, 0.1, 1);
    const wickMat = new THREE.MeshBasicMaterial({ color: 0x222222 });
    const wick = new THREE.Mesh(wickGeo, wickMat);
    wick.position.y = 8.5;
    candleGroup.add(wick);

    // Flame (Dynamic mesh)
    const flameGeo = new THREE.ConeGeometry(0.8, 2.5, 16);
    const flameMat = new THREE.MeshBasicMaterial({ color: 0xffaa00, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending });
    const flame = new THREE.Mesh(flameGeo, flameMat);
    flame.position.y = 10;
    candleGroup.add(flame);

    const flameLight = new THREE.PointLight(0xffaa00, 5, 50);
    flameLight.position.y = 10;
    candleGroup.add(flameLight);

    // Floating wax drops
    const drops = [];
    for(let i = 0; i < 5; i++) {
        const dropGeo = new THREE.SphereGeometry(0.2, 8, 8);
        const drop = new THREE.Mesh(dropGeo, waxMat);
        drop.position.set((Math.random()-0.5)*3, Math.random()*8, (Math.random()-0.5)*3);
        candleGroup.add(drop);
        drops.push(drop);
    }

    // --- 3D CRAZY CAKE ---
    const cakeGroup = new THREE.Group();
    cakeGroup.position.y = -20; // Hidden below initially
    scene.add(cakeGroup);

    const glassMat = new THREE.MeshPhysicalMaterial({ color: 0xff69b4, metalness: 0.2, roughness: 0.1, transmission: 0.8, thickness: 1.5, clearcoat: 1.0 });
    const goldMat = new THREE.MeshPhysicalMaterial({ color: 0xffd700, metalness: 0.8, roughness: 0.2 });
    const blueMat = new THREE.MeshPhysicalMaterial({ color: 0x4d4dff, metalness: 0.5, roughness: 0.1, transmission: 0.5, thickness: 1.0 });

    // Tier 1
    const tier1 = new THREE.Mesh(new THREE.CylinderGeometry(6, 6, 4, 64), glassMat);
    tier1.position.y = 2;
    cakeGroup.add(tier1);

    // Tier 2
    const tier2 = new THREE.Mesh(new THREE.CylinderGeometry(4.5, 4.5, 3, 64), goldMat);
    tier2.position.y = 5.5;
    cakeGroup.add(tier2);

    // Tier 3
    const tier3 = new THREE.Mesh(new THREE.CylinderGeometry(3, 3, 3, 64), blueMat);
    tier3.position.y = 8.5;
    cakeGroup.add(tier3);

    // Crazy rotating rings
    const rings = [];
    for(let i=0; i<3; i++) {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(8 - i*1.5, 0.2, 16, 100), new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true }));
        ring.position.y = 2 + i*3.5;
        ring.rotation.x = Math.PI / 2;
        cakeGroup.add(ring);
        rings.push(ring);
    }

    // Floating 3D mini candles on the cake
    for(let i = 0; i < 5; i++) {
        const miniCandle = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 1.5, 16), waxMat);
        const angle = (i / 5) * Math.PI * 2;
        miniCandle.position.set(Math.cos(angle)*2, 10.75, Math.sin(angle)*2);
        
        const miniFlame = new THREE.PointLight(0xffaa00, 2, 10);
        miniFlame.position.set(0, 1, 0);
        miniCandle.add(miniFlame);
        
        cakeGroup.add(miniCandle);
    }

    const cakeLight = new THREE.PointLight(0xff69b4, 0, 50); // Off initially
    cakeLight.position.y = 15;
    cakeGroup.add(cakeLight);

    // --- ANIMATION STATE ---
    let currentPhase = 1;
    let clock = new THREE.Clock();

    // Interaction (Raycasting)
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    function checkCakeClick(e) {
        if(currentPhase === 2) {
            let clientX, clientY;
            if(e.touches) {
                clientX = e.touches[0].clientX;
                clientY = e.touches[0].clientY;
            } else {
                clientX = e.clientX;
                clientY = e.clientY;
            }

            mouse.x = (clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(clientY / window.innerHeight) * 2 + 1;
            raycaster.setFromCamera(mouse, camera);
            
            // Check if we intersect any part of the cakeGroup
            const intersects = raycaster.intersectObjects(cakeGroup.children, true);
            if(intersects.length > 0) {
                transitionToPhase3();
            }
        }
    }

    window.addEventListener('click', checkCakeClick);
    window.addEventListener('touchstart', checkCakeClick);

    // --- MIC LOGIC ---
    let audioContext, analyser, microphone;
    async function setupMicrophone() {
        try {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            microphone = audioContext.createMediaStreamSource(stream);
            analyser = audioContext.createAnalyser();
            analyser.fftSize = 512;
            microphone.connect(analyser);
            detectBlow();
        } catch(e) { console.log(e); }
    }

    function detectBlow() {
        if(currentPhase !== 1) return;
        const data = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(data);
        let sum = 0; for(let i=0; i<20; i++) sum += data[i];
        if(sum/20 > 100) transitionToPhase2();
        else requestAnimationFrame(detectBlow);
    }

    blowBtn.addEventListener('click', () => { if(currentPhase === 1) transitionToPhase2(); });
    blowBtn.addEventListener('mouseover', () => { if(!audioContext) setupMicrophone(); });

    // --- TRANSITIONS ---
    function transitionToPhase2() {
        if(currentPhase !== 1) return;
        currentPhase = 2;
        
        blowBtn.style.pointerEvents = 'none';
        blowBtn.style.opacity = '0';
        document.querySelector('.mic-hint').style.opacity = '0';
        document.querySelector('#phase-1 h2').style.opacity = '0';
        
        // Extinguish flame
        flame.visible = false;
        flameLight.intensity = 0;

        setTimeout(() => {
            phase1.classList.remove('active');
            phase2.classList.add('active');
            cakeLight.intensity = 5;
        }, 1500);
    }

    function transitionToPhase3() {
        if(currentPhase !== 2) return;
        currentPhase = 3;
        
        phase2.classList.remove('active');
        triggerConfettiBurst();
        
        setTimeout(() => {
            phase3.classList.add('active');
        }, 1000);
    }

    function triggerConfettiBurst() {
        const end = Date.now() + 3000;
        (function frame() {
            confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#ffb6c1', '#ffd700', '#4d4dff'] });
            confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#ffb6c1', '#ffd700', '#4d4dff'] });
            if (Date.now() < end) requestAnimationFrame(frame);
        }());
        confetti({ particleCount: 150, spread: 100, origin: { y: 0.6 } });
    }

    // --- ANIMATION LOOP ---
    let targetCameraY = 8;
    let targetCameraZ = 25;

    function animate() {
        requestAnimationFrame(animate);
        const t = clock.getElapsedTime();

        particlesMesh.rotation.y = t * 0.05;
        particlesMesh.rotation.x = t * 0.02;

        if (currentPhase === 1) {
            // Flicker flame
            flame.scale.set(1 + Math.sin(t*20)*0.1, 1 + Math.random()*0.2, 1 + Math.sin(t*20)*0.1);
            flameLight.intensity = 4 + Math.random()*2;
            
            // Orbit candle slowly
            candleGroup.rotation.y = t * 0.5;
            candleGroup.rotation.x = Math.sin(t) * 0.05;
            candleGroup.position.y = Math.sin(t * 2) * 0.5 - 2;

            drops.forEach((drop, i) => {
                drop.position.y -= 0.02;
                if(drop.position.y < 0) drop.position.y = 8;
            });
            
            // Closer camera for candle
            targetCameraZ = 18;
            targetCameraY = 6;
            
        } else if (currentPhase === 2) {
            // Candle sinks
            candleGroup.position.y -= (candleGroup.position.y + 20) * 0.05;
            
            // Cake rises and bounces
            const targetCakeY = Math.sin(t * 2) * 1 - 2; // subtle bounce
            cakeGroup.position.y += (targetCakeY - cakeGroup.position.y) * 0.05;
            
            // Crazy Cake rotations
            cakeGroup.rotation.y = t * 0.5;
            cakeGroup.rotation.x = Math.sin(t * 1.5) * 0.1;

            rings.forEach((r, i) => {
                r.rotation.y = -t * (i+1.5);
                r.rotation.x = Math.PI/2 + Math.sin(t * 2 + i)*0.3;
                r.scale.setScalar(1 + Math.sin(t*4 + i)*0.15); // Pulsing rings
            });
            
            // Move camera back
            targetCameraZ = 28;
            targetCameraY = 10;
            
        } else if (currentPhase === 3) {
            // Cake drops into the void
            cakeGroup.position.y -= (cakeGroup.position.y + 40) * 0.05;
        }

        camera.position.z += (targetCameraZ - camera.position.z) * 0.05;
        camera.position.y += (targetCameraY - camera.position.y) * 0.05;
        camera.lookAt(0, 4, 0);

        renderer.render(scene, camera);
    }
    animate();

    // Responsive handling
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
});
