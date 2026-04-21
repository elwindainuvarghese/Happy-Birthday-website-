document.addEventListener('DOMContentLoaded', () => {
    const phase1 = document.getElementById('phase-1');
    const phase2 = document.getElementById('phase-2');
    const phase3 = document.getElementById('phase-3');
    const blowBtn = document.getElementById('blow-btn');

    phase1.classList.add('active');

    // --- THREE.JS SETUP ---
    const container = document.getElementById('webgl-container');
    const scene = new THREE.Scene();
    
    // Beautiful soft pink environment
    scene.background = new THREE.Color(0xffe5ec);
    scene.fog = new THREE.FogExp2(0xffe5ec, 0.012);

    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 5, 20);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // --- LIGHTING ---
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0xffb6c1, 0.6);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
    dirLight.position.set(10, 20, 10);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    // --- TEXTURES ---
    function createGlowTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(0.2, 'rgba(255, 200, 50, 1)');
        gradient.addColorStop(0.5, 'rgba(255, 100, 0, 0.5)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 64, 64);
        return new THREE.CanvasTexture(canvas);
    }
    const glowTexture = createGlowTexture();

    // --- PARTICLES ---
    const particleGeo = new THREE.BufferGeometry();
    const particleCount = 1500;
    const posArray = new Float32Array(particleCount * 3);
    for(let i = 0; i < particleCount * 3; i++) {
        posArray[i] = (Math.random() - 0.5) * 100;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const particleMat = new THREE.PointsMaterial({ 
        size: 0.4, 
        map: glowTexture,
        color: 0xffffff, 
        transparent: true, 
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });
    const particlesMesh = new THREE.Points(particleGeo, particleMat);
    scene.add(particlesMesh);

    // --- 3D BEAUTIFUL CANDLE ---
    const candleGroup = new THREE.Group();
    scene.add(candleGroup);

    // Wax body
    const waxMat = new THREE.MeshStandardMaterial({ 
        color: 0xffffff, 
        roughness: 0.3, 
        metalness: 0.1,
        emissive: 0xffdddd,
        emissiveIntensity: 0.2
    });
    const waxGeo = new THREE.CylinderGeometry(1.5, 1.5, 8, 32);
    const wax = new THREE.Mesh(waxGeo, waxMat);
    wax.position.y = 4;
    wax.castShadow = true;
    wax.receiveShadow = true;
    candleGroup.add(wax);

    // Melted wax rim
    const rimGeo = new THREE.TorusGeometry(1.35, 0.25, 16, 32);
    const rim = new THREE.Mesh(rimGeo, waxMat);
    rim.position.y = 8;
    rim.rotation.x = Math.PI / 2;
    candleGroup.add(rim);

    // Wick
    const wickGeo = new THREE.CylinderGeometry(0.05, 0.05, 1);
    const wickMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
    const wick = new THREE.Mesh(wickGeo, wickMat);
    wick.position.y = 8.5;
    candleGroup.add(wick);

    // Flame Sprite
    const flameMat = new THREE.SpriteMaterial({ 
        map: glowTexture, 
        color: 0xffffff, 
        blending: THREE.AdditiveBlending,
        transparent: true
    });
    const flame = new THREE.Sprite(flameMat);
    flame.position.y = 9.5;
    flame.scale.set(3, 4, 3);
    candleGroup.add(flame);

    const flameLight = new THREE.PointLight(0xffaa00, 2, 20);
    flameLight.position.y = 9.5;
    flameLight.castShadow = true;
    candleGroup.add(flameLight);

    // --- 3D CRAZY CAKE ---
    const cakeGroup = new THREE.Group();
    cakeGroup.position.y = -20; // Hidden initially
    scene.add(cakeGroup);

    const pinkMat = new THREE.MeshStandardMaterial({ color: 0xff69b4, roughness: 0.4, metalness: 0.1 });
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xffd700, roughness: 0.2, metalness: 0.8 });
    const whiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5, metalness: 0.1 });

    // Function to add icing drips
    function addIcing(tierMesh, radius, yPos, colorMat) {
        const icingGroup = new THREE.Group();
        icingGroup.position.y = yPos;
        
        // Top icing cover
        const coverGeo = new THREE.CylinderGeometry(radius+0.1, radius+0.1, 0.4, 32);
        const cover = new THREE.Mesh(coverGeo, colorMat);
        icingGroup.add(cover);

        // Drips
        const numDrips = Math.floor(radius * 8);
        for(let i=0; i<numDrips; i++) {
            const angle = (i / numDrips) * Math.PI * 2;
            const dripLength = 0.5 + Math.random() * 1.5;
            const dripGeo = new THREE.CapsuleGeometry(0.2, dripLength, 8, 8);
            const drip = new THREE.Mesh(dripGeo, colorMat);
            drip.position.set(Math.cos(angle) * radius, -dripLength/2, Math.sin(angle) * radius);
            icingGroup.add(drip);
        }
        return icingGroup;
    }

    // Tier 1
    const tier1 = new THREE.Mesh(new THREE.CylinderGeometry(6, 6, 4, 64), pinkMat);
    tier1.position.y = 2;
    tier1.castShadow = true; tier1.receiveShadow = true;
    cakeGroup.add(tier1);
    cakeGroup.add(addIcing(tier1, 6, 4, whiteMat));

    // Tier 2
    const tier2 = new THREE.Mesh(new THREE.CylinderGeometry(4.5, 4.5, 3, 64), goldMat);
    tier2.position.y = 5.5;
    tier2.castShadow = true; tier2.receiveShadow = true;
    cakeGroup.add(tier2);
    cakeGroup.add(addIcing(tier2, 4.5, 7, pinkMat));

    // Tier 3
    const tier3 = new THREE.Mesh(new THREE.CylinderGeometry(3, 3, 3, 64), whiteMat);
    tier3.position.y = 8.5;
    tier3.castShadow = true; tier3.receiveShadow = true;
    cakeGroup.add(tier3);
    cakeGroup.add(addIcing(tier3, 3, 10, goldMat));

    // Magic glowing rings
    const rings = [];
    for(let i=0; i<3; i++) {
        const ringMat = new THREE.MeshStandardMaterial({ 
            color: i===1 ? 0xffffff : 0xff69b4, 
            emissive: i===1 ? 0xffffff : 0xff69b4,
            emissiveIntensity: 0.8,
            wireframe: i===0
        });
        const ring = new THREE.Mesh(new THREE.TorusGeometry(8 - i*1.2, 0.15, 16, 100), ringMat);
        ring.position.y = 2 + i*3.5;
        ring.rotation.x = Math.PI / 2;
        cakeGroup.add(ring);
        rings.push(ring);
    }

    // Mini candles on top
    for(let i = 0; i < 6; i++) {
        const miniGroup = new THREE.Group();
        const angle = (i / 6) * Math.PI * 2;
        miniGroup.position.set(Math.cos(angle)*2.2, 10.2, Math.sin(angle)*2.2);
        
        const mcandle = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 1.5, 16), waxMat);
        mcandle.position.y = 0.75;
        miniGroup.add(mcandle);

        const mflame = new THREE.Sprite(flameMat);
        mflame.position.y = 1.8;
        mflame.scale.set(1.5, 2, 1.5);
        miniGroup.add(mflame);

        cakeGroup.add(miniGroup);
    }

    const cakeLight = new THREE.PointLight(0xff69b4, 0, 30);
    cakeLight.position.y = 15;
    cakeGroup.add(cakeLight);

    // --- ANIMATION STATE ---
    let currentPhase = 1;
    let clock = new THREE.Clock();

    // Interaction
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    function checkCakeClick(e) {
        if(currentPhase === 2) {
            let clientX = e.touches ? e.touches[0].clientX : e.clientX;
            let clientY = e.touches ? e.touches[0].clientY : e.clientY;
            
            mouse.x = (clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(clientY / window.innerHeight) * 2 + 1;
            raycaster.setFromCamera(mouse, camera);
            
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
        
        flame.visible = false;
        flameLight.intensity = 0;

        setTimeout(() => {
            phase1.classList.remove('active');
            phase2.classList.add('active');
            cakeLight.intensity = 2;
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
            confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#ff69b4', '#ffd700', '#ffffff'] });
            confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#ff69b4', '#ffd700', '#ffffff'] });
            if (Date.now() < end) requestAnimationFrame(frame);
        }());
        confetti({ particleCount: 150, spread: 100, origin: { y: 0.6 }, colors: ['#ff69b4', '#ffd700', '#ffffff'] });
    }

    // --- ANIMATION LOOP ---
    let targetCameraY = 8;
    let targetCameraZ = 25;

    function animate() {
        requestAnimationFrame(animate);
        const t = clock.getElapsedTime();

        // Particles float upwards slowly
        const positions = particlesMesh.geometry.attributes.position.array;
        for(let i=1; i<particleCount*3; i+=3) {
            positions[i] += 0.05;
            if(positions[i] > 50) positions[i] = -50;
        }
        particlesMesh.geometry.attributes.position.needsUpdate = true;
        particlesMesh.rotation.y = t * 0.05;

        if (currentPhase === 1) {
            // Flicker flame sprite
            const flicker = 1 + Math.sin(t*30)*0.1 + Math.random()*0.1;
            flame.scale.set(3 * flicker, 4 * flicker, 3 * flicker);
            flameLight.intensity = 2 * flicker;
            
            candleGroup.rotation.y = t * 0.2;
            candleGroup.position.y = Math.sin(t) * 0.5 - 2;
            
            targetCameraZ = 22;
            targetCameraY = 8;
            
        } else if (currentPhase === 2) {
            candleGroup.position.y -= (candleGroup.position.y + 20) * 0.05;
            
            const targetCakeY = Math.sin(t * 2) * 0.5 - 2;
            cakeGroup.position.y += (targetCakeY - cakeGroup.position.y) * 0.05;
            
            cakeGroup.rotation.y = t * 0.3;

            rings.forEach((r, i) => {
                r.rotation.y = -t * (i+1);
                r.rotation.x = Math.PI/2 + Math.sin(t * 2 + i)*0.2;
                r.scale.setScalar(1 + Math.sin(t*3 + i)*0.05);
            });
            
            targetCameraZ = 32;
            targetCameraY = 12;
            
        } else if (currentPhase === 3) {
            cakeGroup.position.y -= (cakeGroup.position.y + 40) * 0.05;
            rings.forEach(r => r.scale.multiplyScalar(0.95));
        }

        camera.position.z += (targetCameraZ - camera.position.z) * 0.05;
        camera.position.y += (targetCameraY - camera.position.y) * 0.05;
        camera.lookAt(0, 4, 0);

        renderer.render(scene, camera);
    }
    animate();

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
});
