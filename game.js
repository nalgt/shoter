(() => {
  "use strict";

  const canvas = document.querySelector("#game");
  const shell = document.querySelector(".game-shell");
  const ui = {
    start: document.querySelector("#start-screen"),
    shop: document.querySelector("#shop-screen"),
    pause: document.querySelector("#pause-screen"),
    result: document.querySelector("#result-screen"),
    health: document.querySelector("#health-value"),
    healthMeter: document.querySelector("#health-meter"),
    mode: document.querySelector("#mode-label"),
    objective: document.querySelector("#objective-value"),
    subtitle: document.querySelector("#objective-subtitle"),
    clock: document.querySelector("#clock-value"),
    ammo: document.querySelector("#ammo-value"),
    reserve: document.querySelector("#reserve-value"),
    staminaMeter: document.querySelector("#stamina-meter"),
    crosshair: document.querySelector("#crosshair"),
    mobile: document.querySelector("#mobile-controls"),
    reload: document.querySelector("#reload-button"),
    weaponSwitch: document.querySelector("#weapon-switch-button"),
    credits: document.querySelector("#credits-display"),
    shopCredits: document.querySelector("#shop-credits"),
    primaryShop: document.querySelector("#primary-shop"),
    secondaryShop: document.querySelector("#secondary-shop"),
    onlineToggle: document.querySelector("#online-toggle"),
    onlineStatus: document.querySelector("#online-status"),
    onlineIndicator: document.querySelector("#online-indicator"),
    callsign: document.querySelector("#callsign-input"),
    shopOpen: document.querySelector("#shop-open"),
    human: document.querySelector("#human-screen"),
    humanCheck: document.querySelector("#human-check"),
    humanStatus: document.querySelector("#human-status"),
    account: document.querySelector("#account-screen"),
    accountForm: document.querySelector("#account-form"),
    accountCallsign: document.querySelector("#account-callsign"),
    avatar: document.querySelector("#avatar-screen"),
    avatarOpen: document.querySelector("#avatar-open"),
    avatarClose: document.querySelector("#avatar-close"),
    avatarPreview: document.querySelector("#avatar-preview"),
    avatarCredits: document.querySelector("#avatar-credits"),
    avatarCallsign: document.querySelector("#avatar-callsign"),
    skinChoices: document.querySelector("#skin-choices")
  };

  if (!window.THREE) {
    const message = "3D graphics could not load. Check your internet connection, then reload the page.";
    document.querySelector("#play-button").disabled = true;
    document.querySelector(".intro").textContent = message;
    document.querySelector("#game-hint").textContent = message;
    console.error(message);
    return;
  }

  const THREE = window.THREE;
  const WORLD = { width: 4200, height: 3200 };
  const SCALE = 0.03;
  const COLORS = { blue: 0x71ddec, red: 0xff786d, lime: 0xd8ff57 };
  const MAX_WAVES = 10;
  const modeNames = { ffa: "FREE FOR ALL", survival: "SURVIVAL", waves: "WAVES", territory: "TERRITORY WAR" };
  const keys = new Set();
  const pointer = { down: false, wasLocked: false };
  const touches = new Map();
  const touchMove = { id: null, x: 0, y: 0, originX: 0, originY: 0 };
  const mouseLook = { yaw: -Math.PI / 2, pitch: 0 };
  const cameraRaycaster = new THREE.Raycaster();
  const armBoneAxis = new THREE.Vector3(0, 1, 0);
  const bulletForwardAxis = new THREE.Vector3(0, 1, 0);
  const projectileCasingGeometry = new THREE.CylinderGeometry(.052, .052, .22, 8);
  const projectileTipGeometry = new THREE.ConeGeometry(.052, .14, 8);
  const projectileBaseGeometry = new THREE.CylinderGeometry(.054, .054, .035, 8);
  const projectileCasingMaterial = makeMaterial(0xc49b55, .34, .68);
  const projectileTipMaterials = {
    blue: new THREE.MeshStandardMaterial({ color: 0x76eaff, emissive: 0x236778, emissiveIntensity: .65, metalness: .54, roughness: .28 }),
    red: new THREE.MeshStandardMaterial({ color: 0xff9873, emissive: 0x763222, emissiveIntensity: .55, metalness: .5, roughness: .3 })
  };
  const PROJECTILE_SPEED = { player: 1950, bot: 1275 };
  const WEAPONS = {
    rifle: { name: "Service Rifle", slot: "primary", price: 0, damage: 34, delay: .2, speed: PROJECTILE_SPEED.player, magazine: 30, reserve: 120, description: "Reliable mid-range all-rounder." },
    carbine: { name: "Recon Carbine", slot: "primary", price: 300, damage: 29, delay: .17, speed: 1900, magazine: 30, reserve: 120, description: "Faster handling, lower damage per hit." },
    smg: { name: "Compact SMG", slot: "primary", price: 450, damage: 18, delay: .09, speed: 1650, magazine: 36, reserve: 144, description: "Fast close-range fire; weaker at distance." },
    pistol: { name: "Duty Pistol", slot: "secondary", price: 0, damage: 20, delay: .32, speed: 1500, magazine: 12, reserve: 60, description: "Free backup with a quick reload." },
    heavyPistol: { name: "Heavy Pistol", slot: "secondary", price: 250, damage: 36, delay: .48, speed: 1750, magazine: 8, reserve: 40, description: "Harder hits, slower shots and fewer rounds." }
  };
  const SKINS = {
    ranger: { name: "Ranger", price: 0, armor: 0x536d52, dark: 0x263127, description: "Standard command issue." },
    arctic: { name: "Arctic", price: 75, armor: 0x8aaab5, dark: 0x374a55, description: "Cold-weather tactical kit." },
    crimson: { name: "Crimson", price: 75, armor: 0xb5564d, dark: 0x542d2b, description: "High-visibility assault kit." }
  };
  const COOKIE_NAMES = {
    human: "outpost_human_verified",
    account: "outpost_account",
    progress: "outpost_progress"
  };

  let renderer;
  let scene;
  let camera;
  let firstPersonWeapon;
  let ground;
  let arenaGroup;
  let entityGroup;
  let player;
  let bots = [];
  let bullets = [];
  let particles = [];
  let pickups = [];
  let obstacles = [];
  let houses = [];
  let treeColliders = [];
  let cameraBlockers = [];
  let zones = [];
  let elapsed = 0;
  let lastTime = 0;
  let botSpawnClock = 0;
  let wave = 1;
  let waveIntermission = 0;
  let score = 0;
  let territoryScore = { blue: 0, red: 0 };
  let zoneVisuals = [];
  let messageTimer = 0;
  let banner = "";
  let randomSeed = 7129;
  let screen = "menu";
  let mode = "ffa";
  let cameraAngle = 0;
  let magazine = 30;
  let reserveAmmo = 120;
  let reloadTimer = 0;
  let stamina = 100;
  let sprinting = false;
  let account = loadAccount();
  let profile = loadProfile();
  let activeWeapon = profile.primary;
  let weaponAmmo = {};
  let onlineEnabled = false;
  let multiplayerSocket = null;
  let multiplayerId = null;
  let remoteActors = new Map();
  let networkMode = "";
  let networkFireSequence = 0;
  let networkAccumulator = 0;
  let matchRewarded = false;

  function random() {
    randomSeed = (randomSeed * 16807) % 2147483647;
    return (randomSeed - 1) / 2147483646;
  }
  function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
  function distance(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
  function toX(x) { return (x - WORLD.width / 2) * SCALE; }
  function toZ(y) { return (y - WORLD.height / 2) * SCALE; }
  function makeMaterial(color, roughness = 0.82, metalness = 0) {
    return new THREE.MeshStandardMaterial({ color, roughness, metalness });
  }

  // These are intentionally separate so the site keeps exactly three small, local cookies.
  function getCookie(name) {
    const prefix = `${encodeURIComponent(name)}=`;
    const entry = document.cookie.split("; ").find(cookie => cookie.startsWith(prefix));
    return entry ? decodeURIComponent(entry.slice(prefix.length)) : "";
  }

  function setCookie(name, value) {
    document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; Max-Age=31536000; Path=/; SameSite=Lax`;
  }

  function loadAccount() {
    try {
      const data = JSON.parse(getCookie(COOKIE_NAMES.account));
      if (!data || typeof data.callsign !== "string") return null;
      const callsign = data.callsign.trim().replace(/[^\p{L}\p{N} _-]/gu, "").slice(0, 18);
      return callsign ? { callsign, createdAt: data.createdAt || "" } : null;
    } catch {
      return null;
    }
  }

  function loadProfile() {
    const defaultProfile = {
      credits: 200, owned: ["rifle", "pistol"], primary: "rifle", secondary: "pistol",
      ownedSkins: ["ranger"], skin: "ranger"
    };
    try {
      const saved = getCookie(COOKIE_NAMES.progress);
      if (!saved) return defaultProfile;
      const data = JSON.parse(saved);
      if (!data || typeof data !== "object") throw new Error("Saved profile has an invalid shape.");
      const owned = Array.isArray(data.owned)
        ? [...new Set(data.owned.filter(id => Object.prototype.hasOwnProperty.call(WEAPONS, id)))]
        : defaultProfile.owned;
      for (const id of defaultProfile.owned) if (!owned.includes(id)) owned.push(id);
      const primary = WEAPONS[data.primary]?.slot === "primary" && owned.includes(data.primary) ? data.primary : "rifle";
      const secondary = WEAPONS[data.secondary]?.slot === "secondary" && owned.includes(data.secondary) ? data.secondary : "pistol";
      const ownedSkins = Array.isArray(data.ownedSkins)
        ? [...new Set(data.ownedSkins.filter(id => Object.prototype.hasOwnProperty.call(SKINS, id)))]
        : [...defaultProfile.ownedSkins];
      if (!ownedSkins.includes("ranger")) ownedSkins.push("ranger");
      const skin = ownedSkins.includes(data.skin) ? data.skin : "ranger";
      return {
        credits: Number.isSafeInteger(data.credits) && data.credits >= 0 ? data.credits : defaultProfile.credits,
        owned, primary, secondary, ownedSkins, skin
      };
    } catch (error) {
      console.warn("Could not load the saved Outpost profile; starting with the default loadout.", error);
      return defaultProfile;
    }
  }

  function saveProfile() {
    setCookie(COOKIE_NAMES.progress, JSON.stringify(profile));
    renderShop();
    renderAvatarShop();
  }

  function getWeaponAmmo(weaponId) {
    const config = WEAPONS[weaponId];
    if (!weaponAmmo[weaponId]) weaponAmmo[weaponId] = { magazine: config.magazine, reserve: config.reserve };
    return weaponAmmo[weaponId];
  }

  function activeWeaponConfig() {
    return WEAPONS[activeWeapon];
  }

  function renderShop() {
    if (!ui.primaryShop || !ui.secondaryShop) return;
    ui.credits.textContent = `CREDITS ${profile.credits}`;
    ui.shopCredits.textContent = `${profile.credits} CREDITS`;
    for (const slot of ["primary", "secondary"]) {
      const container = slot === "primary" ? ui.primaryShop : ui.secondaryShop;
      container.replaceChildren();
      for (const [id, weapon] of Object.entries(WEAPONS)) {
        if (weapon.slot !== slot) continue;
        const owned = profile.owned.includes(id);
        const equipped = profile[slot] === id;
        const card = document.createElement("article");
        card.className = `shop-card${equipped ? " equipped" : ""}`;
        const title = document.createElement("h4");
        title.textContent = weapon.name;
        const description = document.createElement("p");
        description.textContent = weapon.description;
        const stats = document.createElement("div");
        stats.className = "weapon-stats";
        stats.textContent = `${weapon.damage} DMG · ${weapon.magazine} ROUNDS`;
        const action = document.createElement("button");
        action.type = "button";
        action.textContent = equipped ? "EQUIPPED" : owned ? "EQUIP" : `BUY · ${weapon.price}`;
        action.disabled = equipped || (!owned && profile.credits < weapon.price);
        action.addEventListener("click", () => {
          if (owned) profile[slot] = id;
          else if (profile.credits >= weapon.price) {
            profile.credits -= weapon.price;
            profile.owned.push(id);
            profile[slot] = id;
          }
          saveProfile();
          renderShop();
        });
        card.append(title, description, stats, action);
        container.append(card);
      }
    }
  }

  function renderAvatarShop() {
    if (!ui.avatarPreview || !ui.skinChoices) return;
    ui.avatarPreview.dataset.skin = profile.skin;
    ui.avatarCredits.textContent = `${profile.credits} CREDITS`;
    ui.avatarCallsign.textContent = (account?.callsign || ui.callsign.value || "Ranger").toUpperCase();
    ui.skinChoices.replaceChildren();
    for (const [id, skin] of Object.entries(SKINS)) {
      const owned = profile.ownedSkins.includes(id);
      const selected = profile.skin === id;
      const button = document.createElement("button");
      button.type = "button";
      button.className = `skin-choice${selected ? " selected" : ""}`;
      button.disabled = selected || (!owned && profile.credits < skin.price);
      const title = document.createElement("strong");
      title.textContent = skin.name.toUpperCase();
      const detail = document.createElement("small");
      detail.textContent = selected ? "EQUIPPED" : owned ? "EQUIP" : `BUY · ${skin.price} CREDITS`;
      button.append(title, detail);
      button.addEventListener("click", () => {
        if (!owned) {
          if (profile.credits < skin.price) return;
          profile.credits -= skin.price;
          profile.ownedSkins.push(id);
        }
        profile.skin = id;
        saveProfile();
      });
      ui.skinChoices.append(button);
    }
  }

  function renderHubActions() {
    ui.onlineToggle.classList.toggle("selected", onlineEnabled);
    ui.onlineToggle.innerHTML = onlineEnabled
      ? "ONLINE: ON <span>LOBBY READY</span>"
      : "ONLINE: OFF <span>BOTS ONLY</span>";
  }

  function openHubPanel(panel) {
    ui.start.classList.add("hidden");
    ui.shop.classList.toggle("hidden", panel !== ui.shop);
    ui.avatar.classList.toggle("hidden", panel !== ui.avatar);
  }

  function createGroundTexture(heightMap = false) {
    const canvasTexture = document.createElement("canvas");
    const textureSize = matchMedia("(pointer: coarse)").matches ? 512 : 1024;
    canvasTexture.width = textureSize;
    canvasTexture.height = textureSize;
    const context = canvasTexture.getContext("2d");
    if (!context) throw new Error("Canvas textures are unavailable in this browser.");
    context.fillStyle = heightMap ? "#808080" : "#667456";
    context.fillRect(0, 0, 512, 512);
    let seed = heightMap ? 28657 : 71329;
    const next = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };
    const detailCount = textureSize === 1024 ? 26000 : 8200;
    for (let i = 0; i < detailCount; i++) {
      const x = next() * textureSize, y = next() * textureSize;
      const size = .5 + next() * 3.2;
      if (heightMap) {
        const value = Math.floor(105 + next() * 95);
        context.fillStyle = `rgba(${value},${value},${value},${.12 + next() * .32})`;
        context.fillRect(x, y, size, size);
      } else {
        const palette = next() > .56
          ? ["#71805a", "#78845c", "#687856"]
          : ["#59694e", "#606f50", "#526449"];
        context.fillStyle = palette[Math.floor(next() * palette.length)];
        context.globalAlpha = .13 + next() * .24;
        context.beginPath();
        context.ellipse(x, y, size * (1 + next()), size * .6, next() * Math.PI, 0, Math.PI * 2);
        context.fill();
        context.globalAlpha = 1;
      }
    }
    const texture = new THREE.CanvasTexture(canvasTexture);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(WORLD.width * SCALE / 5, WORLD.height * SCALE / 5);
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    if (!heightMap) {
      if ("colorSpace" in texture) texture.colorSpace = THREE.SRGBColorSpace;
      else texture.encoding = THREE.sRGBEncoding;
    }
    return texture;
  }

  function configureShadowMeshes(root) {
    root.traverse(object => {
      if (!object.isMesh || object.material.transparent) return;
      object.castShadow = true;
      object.receiveShadow = true;
    });
  }

  function disposeObject(root) {
    const geometries = new Set();
    const materials = new Set();
    root.traverse(object => {
      if (object.geometry) geometries.add(object.geometry);
      if (Array.isArray(object.material)) object.material.forEach(material => materials.add(material));
      else if (object.material) materials.add(object.material);
    });
    geometries.forEach(geometry => geometry.dispose());
    materials.forEach(material => material.dispose());
  }

  function addAtmosphere(mobileQuality) {
    const sunCanvas = document.createElement("canvas");
    sunCanvas.width = sunCanvas.height = 128;
    const sunContext = sunCanvas.getContext("2d");
    if (sunContext) {
      const glow = sunContext.createRadialGradient(64, 64, 2, 64, 64, 64);
      glow.addColorStop(0, "rgba(255,250,208,.96)");
      glow.addColorStop(.18, "rgba(255,224,159,.7)");
      glow.addColorStop(1, "rgba(255,214,125,0)");
      sunContext.fillStyle = glow;
      sunContext.fillRect(0, 0, 128, 128);
      const sunTexture = new THREE.CanvasTexture(sunCanvas);
      const sunSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: sunTexture, transparent: true, depthWrite: false }));
      sunSprite.position.set(-35, 30, -72);
      sunSprite.scale.set(13, 13, 1);
      scene.add(sunSprite);
    }

    const count = mobileQuality ? 180 : 760;
    const positions = new Float32Array(count * 3);
    let seed = 8821;
    const next = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };
    for (let index = 0; index < count; index++) {
      positions[index * 3] = (next() - .5) * 135;
      positions[index * 3 + 1] = .3 + next() * 10;
      positions[index * 3 + 2] = (next() - .5) * 105;
    }
    const dustGeometry = new THREE.BufferGeometry();
    dustGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const dust = new THREE.Points(dustGeometry, new THREE.PointsMaterial({
      color: 0xf6e7c6, size: mobileQuality ? .028 : .042, transparent: true, opacity: .18,
      depthWrite: false, sizeAttenuation: true
    }));
    dust.userData.atmosphere = true;
    scene.add(dust);
  }

  function setupRenderer() {
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: "high-performance" });
      const mobileQuality = matchMedia("(pointer: coarse)").matches;
      const devicePixelRatio = window.devicePixelRatio || 1;
      const pixelRatio = mobileQuality
        ? Math.min(devicePixelRatio, 1.25)
        : Math.min(devicePixelRatio * Math.sqrt(1.8), 2.2);
      renderer.setPixelRatio(pixelRatio);
      renderer.setSize(shell.clientWidth, shell.clientHeight, false);
      if ("outputColorSpace" in renderer) renderer.outputColorSpace = THREE.SRGBColorSpace;
      else renderer.outputEncoding = THREE.sRGBEncoding;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.04;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      scene = new THREE.Scene();
      scene.background = new THREE.Color(0x7593a4);
      scene.fog = new THREE.Fog(0x7593a4, 70, 142);
      const skyGeometry = new THREE.SphereGeometry(170, 48, 28);
      const skyPositions = skyGeometry.attributes.position;
      const skyColors = [];
      const horizonColor = new THREE.Color(0xc8b994);
      const zenithColor = new THREE.Color(0x7894a2);
      for (let i = 0; i < skyPositions.count; i++) {
        const height = clamp((skyPositions.getY(i) / 170 + .08) / .75, 0, 1);
        const color = horizonColor.clone().lerp(zenithColor, height);
        skyColors.push(color.r, color.g, color.b);
      }
      skyGeometry.setAttribute("color", new THREE.Float32BufferAttribute(skyColors, 3));
      const sky = new THREE.Mesh(skyGeometry, new THREE.MeshBasicMaterial({
        vertexColors: true, side: THREE.BackSide, depthWrite: false, fog: false
      }));
      scene.add(sky);
      addAtmosphere(mobileQuality);
      camera = new THREE.PerspectiveCamera(58, shell.clientWidth / shell.clientHeight, 0.1, 155);
      camera.position.set(0, 9, 12);
      firstPersonWeapon = createFirstPersonWeapon();
      camera.add(firstPersonWeapon);
      scene.add(camera);
      scene.add(new THREE.HemisphereLight(0xe7f1e9, 0x263a32, 0.64));
      const sun = new THREE.DirectionalLight(0xffe2b4, 1.08);
      sun.position.set(-22, 38, -17);
      sun.castShadow = true;
      sun.shadow.mapSize.set(mobileQuality ? 1024 : 2048, mobileQuality ? 1024 : 2048);
      sun.shadow.camera.left = -43;
      sun.shadow.camera.right = 43;
      sun.shadow.camera.top = 34;
      sun.shadow.camera.bottom = -34;
      sun.shadow.camera.near = 1;
      sun.shadow.camera.far = 105;
      sun.shadow.bias = -.00018;
      sun.shadow.normalBias = .025;
      scene.add(sun);
      const rim = new THREE.DirectionalLight(0x8ec9dd, .26);
      rim.position.set(26, 16, 34);
      scene.add(rim);
      arenaGroup = new THREE.Group();
      entityGroup = new THREE.Group();
      scene.add(arenaGroup, entityGroup);
      buildGround();
      resize();
    } catch (error) {
      console.error("Unable to initialize the 3D game renderer.", error);
      document.querySelector("#play-button").disabled = true;
      document.querySelector(".intro").textContent = "3D graphics are unavailable in this browser. Try updating Chrome and enabling hardware acceleration.";
      document.querySelector("#game-hint").textContent = "WebGL could not start. Update Chrome or enable hardware acceleration.";
      return false;
    }
  }
  function resize() {
    if (!renderer) return;
    const width = Math.max(shell.clientWidth, 1);
    const height = Math.max(shell.clientHeight, 1);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  function buildGround() {
    const width = WORLD.width * SCALE;
    const depth = WORLD.height * SCALE;
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(width + 34, depth + 34),
      makeMaterial(0x435447)
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.19;
    scene.add(floor);

    const groundMaterial = makeMaterial(0xffffff, .98);
    groundMaterial.map = createGroundTexture();
    groundMaterial.bumpMap = createGroundTexture(true);
    groundMaterial.bumpScale = .026;
    ground = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.04;
    ground.receiveShadow = true;
    scene.add(ground);

    const gridPoints = [];
    for (let x = -width / 2; x <= width / 2; x += 2.5) {
      gridPoints.push(x, 0, -depth / 2, x, 0, depth / 2);
    }
    for (let z = -depth / 2; z <= depth / 2; z += 2.5) {
      gridPoints.push(-width / 2, 0, z, width / 2, 0, z);
    }
    const gridGeometry = new THREE.BufferGeometry();
    gridGeometry.setAttribute("position", new THREE.Float32BufferAttribute(gridPoints, 3));
    arenaGroup.add(new THREE.LineSegments(gridGeometry, new THREE.LineBasicMaterial({ color: 0xb6c49a, transparent: true, opacity: 0.045 })));

    const border = new THREE.Mesh(
      new THREE.BoxGeometry(width + 0.5, 0.55, depth + 0.5),
      makeMaterial(0x354439)
    );
    border.position.y = -0.48;
    border.scale.set(1, 1, 1);
    arenaGroup.add(border);
    const inner = new THREE.Mesh(
      new THREE.BoxGeometry(width, 0.1, depth),
      makeMaterial(0x697952)
    );
    inner.position.y = -0.12;
    arenaGroup.add(inner);

    for (const z of [-4.2, 4.2]) {
      const road = new THREE.Mesh(new THREE.BoxGeometry(width * .94, .015, 1.35), makeMaterial(0x657052));
      road.position.set(0, -.015, z);
      road.receiveShadow = true;
      scene.add(road);
    }
    const crossRoad = new THREE.Mesh(new THREE.BoxGeometry(1.45, .018, depth * .94), makeMaterial(0x657052));
    crossRoad.position.set(0, -.012, 0);
    crossRoad.receiveShadow = true;
    scene.add(crossRoad);
  }

  function createActor(x, y, team, isPlayer = false) {
    const actor = {
      x, y, team, isPlayer, skin: isPlayer ? profile.skin : "ranger", radius: isPlayer ? 17 : 15, health: 100, maxHealth: 100,
      speed: isPlayer ? 220 : 118 + random() * 28, angle: 0, cooldown: random() * .45,
      ammo: isPlayer ? 30 : 24, reserveAmmo: isPlayer ? 120 : 72, reloadTimer: 0,
      vx: 0, vy: 0,
      hitFlash: 0, alive: true, anim: random() * Math.PI * 2, aiTimer: 0,
      target: null, lootTarget: null, wanderAngle: random() * Math.PI * 2, strafeSign: random() < .5 ? -1 : 1, flankSign: random() < .5 ? -1 : 1, kills: 0,
      model: null, parts: null
    };
    actor.model = createCharacter(actor);
    configureShadowMeshes(actor.model);
    entityGroup.add(actor.model);
    return actor;
  }

  function reloadPlayer() {
    const config = activeWeaponConfig();
    if (!player || reloadTimer > 0 || magazine === config.magazine || reserveAmmo <= 0) return;
    reloadTimer = 1.25;
    pointer.down = false;
    setBanner("RELOADING");
  }

  function switchWeapon() {
    if (screen !== "playing" || profile.primary === profile.secondary) return;
    weaponAmmo[activeWeapon] = { magazine, reserve: reserveAmmo };
    activeWeapon = activeWeapon === profile.primary ? profile.secondary : profile.primary;
    const ammo = getWeaponAmmo(activeWeapon);
    magazine = ammo.magazine;
    reserveAmmo = ammo.reserve;
    reloadTimer = 0;
    updateHud();
    setBanner(`EQUIPPED ${WEAPONS[activeWeapon].name.toUpperCase()}`);
  }

  function awardCredits(amount, reason) {
    if (!Number.isSafeInteger(amount) || amount <= 0) throw new Error("Credit rewards must be a positive whole number.");
    profile.credits += amount;
    saveProfile();
    setBanner(`${reason} · +${amount} CREDITS`);
  }

  function spawnPickup(x, y, type) {
    const color = type === "health" ? 0x72e6a0 : 0xd8ff57;
    const group = new THREE.Group();
    const material = new THREE.MeshStandardMaterial({
      color, emissive: color, emissiveIntensity: .55, roughness: .38, metalness: .12
    });
    const core = new THREE.Mesh(new THREE.OctahedronGeometry(.28, 0), material);
    core.position.y = .52;
    group.add(core);
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(.38, .035, 5, 18),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: .72 })
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = .14;
    group.add(ring);
    group.position.set(toX(x), 0, toZ(y));
    entityGroup.add(group);
    pickups.push({ x, y, type, age: 0, mesh: group, core });
  }

  function createCharacter(actor) {
    const group = new THREE.Group();
    const teamColor = actor.team === "blue" ? COLORS.blue : COLORS.red;
    const look = (actor.isPlayer || actor.isRemote) ? (SKINS[actor.skin] || SKINS.ranger) : null;
    const armor = makeMaterial(look ? look.armor : teamColor, .48, .08);
    const dark = makeMaterial(look ? look.dark : actor.team === "blue" ? 0x315256 : 0x553c38, .8);
    const trim = makeMaterial(0xe0dfc7, .58, .08);
    const visor = makeMaterial(actor.isPlayer ? COLORS.lime : 0x283337, .3, .25);
    const skin = makeMaterial(0xc5a98a, .82);
    const parts = [];
    const addPart = (name, geometry, material, parent, position) => {
      const mesh = new THREE.Mesh(geometry, material);
      mesh.name = name;
      mesh.position.set(position[0], position[1], position[2]);
      parent.add(mesh);
      parts.push(mesh);
      return mesh;
    };

    addPart("torso", new THREE.CylinderGeometry(.34, .31, .72, 9), armor, group, [0, 1.13, 0]);
    addPart("neck", new THREE.CylinderGeometry(.12, .14, .16, 7), skin, group, [0, 1.59, 0]);
    addPart("head", new THREE.SphereGeometry(.235, 9, 7), skin, group, [0, 1.76, 0]);
    addPart("helmet", new THREE.SphereGeometry(.27, 9, 6, 0, Math.PI * 2, 0, Math.PI * .58), armor, group, [0, 1.84, 0]);
    addPart("visor", new THREE.BoxGeometry(.32, .11, .34), visor, group, [0, 1.75, -.12]);
    addPart("backpack", new THREE.BoxGeometry(.42, .49, .23), dark, group, [0, 1.19, .29]);
    addPart("shoulder-left", new THREE.SphereGeometry(.18, 7, 6), armor, group, [-.38, 1.43, 0]);
    addPart("shoulder-right", new THREE.SphereGeometry(.18, 7, 6), armor, group, [.38, 1.43, 0]);

    const armLinks = [];
    for (const side of [-1, 1]) {
      const upperArm = addPart(
        side < 0 ? "arm-upper-left" : "arm-upper-right",
        new THREE.CylinderGeometry(.115, .14, .39, 7),
        armor, group, [side * .3, 1.3, -.15]
      );
      const lowerArm = addPart(
        side < 0 ? "arm-lower-left" : "arm-lower-right",
        new THREE.CylinderGeometry(.09, .115, .35, 7),
        armor, group, [side * .2, 1.25, -.4]
      );
      armLinks.push({ side, upperArm, lowerArm });
    }

    const legPivots = [];
    for (const side of [-1, 1]) {
      const hip = new THREE.Group();
      hip.position.set(side * .17, .78, 0);
      group.add(hip);
      addPart(
        side < 0 ? "leg-left" : "leg-right",
        new THREE.CylinderGeometry(.13, .15, .51, 7),
        dark, hip, [0, -.27, 0]
      );
      addPart(
        side < 0 ? "boot-left" : "boot-right",
        new THREE.BoxGeometry(.25, .16, .38),
        trim, hip, [0, -.57, -.07]
      );
      legPivots.push(hip);
    }

    const gun = createRifle(actor.team);
    gun.position.set(.06, 1.33, -.39);
    group.add(gun);

    addPart("chest-plate", new THREE.BoxGeometry(.42, .3, .1), dark, group, [0, 1.22, -.3]);
    addPart("chest-insignia", new THREE.BoxGeometry(.13, .12, .035), trim, group, [0, 1.28, -.36]);
    addPart("utility-belt", new THREE.BoxGeometry(.56, .12, .4), dark, group, [0, .83, 0]);
    addPart("pouch-left", new THREE.BoxGeometry(.14, .19, .13), trim, group, [-.3, .9, -.08]);
    addPart("pouch-right", new THREE.BoxGeometry(.14, .19, .13), trim, group, [.3, .9, -.08]);
    const gloves = makeMaterial(0x252b29, .9);
    const triggerHand = addPart("rifle-grip-hand", new THREE.BoxGeometry(.13, .1, .15), gloves, group, [.06, 1.16, -.42]);
    triggerHand.rotation.x = -.12;
    const supportHand = addPart("rifle-support-hand", new THREE.BoxGeometry(.14, .1, .17), gloves, group, [.06, 1.345, -.91]);
    supportHand.rotation.x = -.12;
    for (const side of [-1, 1]) {
      addPart(
        side < 0 ? "forearm-guard-left" : "forearm-guard-right",
        new THREE.BoxGeometry(.2, .12, .25), trim,
        armLinks.find(arm => arm.side === side).lowerArm, [0, 0, 0]
      );
    }
    addPart("radio-antenna", new THREE.CylinderGeometry(.018, .018, .4, 5), trim, group, [.19, 1.55, .31]);

    if (parts.length !== 26) throw new Error(`Character model must have exactly 26 body parts; got ${parts.length}.`);
    group.userData.parts = { armLinks, triggerHand, supportHand, legPivots, torso: parts[0], head: parts[2], bodyParts: parts, gun };
    return group;
  }

  function createRifle(team) {
    const gun = new THREE.Group();
    const receiver = makeMaterial(0x343b3a, .42, .45);
    const polymer = makeMaterial(0x202725, .73, .08);
    const metal = makeMaterial(0x89918a, .36, .72);
    const accent = makeMaterial(team === "blue" ? 0x537e7d : 0x8b5750, .55, .22);
    const part = (name, geometry, material, position, rotation = [0, 0, 0]) => {
      const mesh = new THREE.Mesh(geometry, material);
      mesh.name = name;
      mesh.position.set(position[0], position[1], position[2]);
      mesh.rotation.set(rotation[0], rotation[1], rotation[2]);
      gun.add(mesh);
      return mesh;
    };
    part("rifle-receiver", new THREE.BoxGeometry(.19, .19, .46), receiver, [0, 0, -.14]);
    part("rifle-handguard", new THREE.BoxGeometry(.145, .14, .38), polymer, [0, .015, -.52]);
    part("rifle-barrel", new THREE.CylinderGeometry(.035, .045, .57, 8), metal, [0, .015, -.88], [Math.PI / 2, 0, 0]);
    part("rifle-muzzle", new THREE.CylinderGeometry(.065, .052, .13, 8), receiver, [0, .015, -1.18], [Math.PI / 2, 0, 0]);
    part("rifle-stock", new THREE.BoxGeometry(.17, .16, .34), polymer, [0, .015, .27]);
    part("rifle-grip", new THREE.BoxGeometry(.12, .25, .14), polymer, [0, -.17, -.03], [-.15, 0, 0]);
    part("rifle-magazine", new THREE.BoxGeometry(.14, .29, .18), accent, [0, -.22, -.2], [-.12, 0, 0]);
    part("rifle-optic", new THREE.BoxGeometry(.12, .11, .19), metal, [0, .15, -.24]);
    part("rifle-sight", new THREE.BoxGeometry(.055, .09, .06), polymer, [0, .13, -.63]);
    part("rifle-rail", new THREE.BoxGeometry(.12, .035, .43), metal, [0, .1, -.47]);
    part("rifle-trigger", new THREE.TorusGeometry(.065, .018, 4, 8), metal, [0, -.09, -.09], [Math.PI / 2, 0, 0]);
    part("rifle-charging-handle", new THREE.BoxGeometry(.12, .045, .08), metal, [-.12, .04, -.18]);
    part("rifle-bolt-release", new THREE.BoxGeometry(.035, .1, .12), metal, [-.105, -.035, -.08]);
    part("rifle-selector", new THREE.BoxGeometry(.035, .07, .09), accent, [-.115, -.06, .025], [.15, 0, -.2]);
    part("rifle-front-pin", new THREE.CylinderGeometry(.025, .025, .025, 8), metal, [.105, .015, -.29], [0, 0, Math.PI / 2]);
    part("rifle-rear-pin", new THREE.CylinderGeometry(.025, .025, .025, 8), metal, [.105, .015, .03], [0, 0, Math.PI / 2]);
    part("rifle-left-rail", new THREE.BoxGeometry(.04, .06, .32), metal, [-.09, .015, -.52]);
    part("rifle-right-rail", new THREE.BoxGeometry(.04, .06, .32), metal, [.09, .015, -.52]);
    part("rifle-sling-loop", new THREE.TorusGeometry(.055, .014, 4, 8), metal, [.1, -.035, .26], [Math.PI / 2, 0, 0]);
    part("rifle-stock-pad", new THREE.BoxGeometry(.18, .17, .055), accent, [0, .015, .44]);
    part("rifle-front-post", new THREE.BoxGeometry(.035, .1, .04), polymer, [0, .16, -.67]);
    if (gun.children.length !== 21) throw new Error(`Rifle model must have exactly 21 parts; got ${gun.children.length}.`);
    return gun;
  }

  function poseArmBone(mesh, start, end, baseLength) {
    const from = new THREE.Vector3(start[0], start[1], start[2]);
    const to = new THREE.Vector3(end[0], end[1], end[2]);
    const direction = to.clone().sub(from);
    const length = direction.length();
    mesh.position.copy(from).add(to).multiplyScalar(.5);
    mesh.quaternion.setFromUnitVectors(armBoneAxis, direction.normalize());
    mesh.scale.set(1, length / baseLength, 1);
  }

  function createFirstPersonWeapon() {
    const viewModel = new THREE.Group();
    const sleeve = makeMaterial(0x385359, .72);
    const glove = makeMaterial(0x252b29, .86);
    const rifle = createRifle("blue");
    rifle.scale.setScalar(.82);
    rifle.position.set(.04, -.01, 0);
    viewModel.add(rifle);
    for (const side of [-1, 1]) {
      const forearm = new THREE.Mesh(new THREE.CylinderGeometry(.105, .14, .56, 8), sleeve);
      forearm.name = side < 0 ? "view-arm-left" : "view-arm-right";
      forearm.rotation.x = -.83;
      forearm.position.set(side < 0 ? -.24 : .25, side < 0 ? -.23 : -.32, side < 0 ? -.34 : -.14);
      viewModel.add(forearm);
      const hand = new THREE.Mesh(new THREE.BoxGeometry(.14, .11, .16), glove);
      hand.name = side < 0 ? "view-hand-left" : "view-hand-right";
      hand.position.set(side < 0 ? -.1 : .2, -.08, -.56);
      viewModel.add(hand);
    }
    viewModel.position.set(.48, -.43, -1.02);
    viewModel.rotation.x = -.035;
    viewModel.renderOrder = 2;
    viewModel.visible = false;
    viewModel.traverse(object => {
      if (object.isMesh) {
        object.frustumCulled = false;
        object.renderOrder = 2;
      }
    });
    return viewModel;
  }

  function createObstacleMesh(obstacle) {
    const width = obstacle.w * SCALE;
    const depth = obstacle.h * SCALE;
    const x = toX(obstacle.x + obstacle.w / 2);
    const z = toZ(obstacle.y + obstacle.h / 2);
    let mesh;
    if (obstacle.type === "house-wall") {
      const wall = new THREE.Mesh(
        new THREE.BoxGeometry(width, obstacle.wallHeight, depth),
        makeMaterial(obstacle.materialColor || 0x938674, .94)
      );
      wall.position.set(x, obstacle.wallBase + obstacle.wallHeight / 2, z);
      mesh = wall;
    } else if (obstacle.type === "furniture") {
      const group = new THREE.Group();
      const material = makeMaterial(obstacle.materialColor || 0x76583d, .82);
      const top = new THREE.Mesh(new THREE.BoxGeometry(width, .12, depth), material);
      top.position.y = .72;
      group.add(top);
      for (const sx of [-1, 1]) {
        for (const sz of [-1, 1]) {
          const leg = new THREE.Mesh(new THREE.BoxGeometry(.08, .68, .08), material);
          leg.position.set(sx * width * .4, .34, sz * depth * .38);
          group.add(leg);
        }
      }
      group.position.set(x, 0, z);
      mesh = group;
    } else if (obstacle.type === "cabinet") {
      const cabinet = new THREE.Mesh(
        new THREE.BoxGeometry(width, obstacle.objectHeight || 1.2, depth),
        makeMaterial(obstacle.materialColor || 0x4d554d, .86)
      );
      cabinet.position.set(x, (obstacle.objectHeight || 1.2) / 2, z);
      mesh = cabinet;
    } else if (obstacle.type === "crate") {
      const height = .85 + Math.min(width, depth) * .22;
      const group = new THREE.Group();
      const box = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), makeMaterial(0x796448));
      box.position.y = height / 2;
      group.add(box);
      const beamMat = makeMaterial(0xa58a60);
      for (const side of [-1, 1]) {
        const beam = new THREE.Mesh(new THREE.BoxGeometry(width * .9, .09, .09), beamMat);
        beam.position.set(0, height / 2, side * depth * .28);
        group.add(beam);
      }
      const strap = new THREE.Mesh(new THREE.BoxGeometry(.09, height * .92, depth + .025), makeMaterial(0x4b4130));
      strap.position.y = height / 2;
      group.add(strap);
      group.position.set(x, 0, z);
      mesh = group;
    } else {
      const group = new THREE.Group();
      const radius = Math.max(width, depth) * .52;
      const rock = new THREE.Mesh(
        new THREE.DodecahedronGeometry(radius, 1),
        makeMaterial(0x697463)
      );
      rock.position.y = radius * .68;
      rock.scale.set(1, .74, .83);
      group.add(rock);
      const moss = new THREE.Mesh(new THREE.DodecahedronGeometry(radius * .26, 0), makeMaterial(0x78815a));
      moss.position.set(-radius * .25, radius * 1.04, -radius * .12);
      group.add(moss);
      group.position.set(x, 0, z);
      mesh = group;
    }
    mesh.userData.obstacle = true;
    mesh.userData.cameraBlocker = true;
    if (obstacle.type !== "house-wall") {
      const shadow = new THREE.Mesh(
        new THREE.CircleGeometry(Math.max(width, depth) * .68, 12),
        new THREE.MeshBasicMaterial({ color: 0x192319, transparent: true, opacity: .28, depthWrite: false })
      );
      shadow.rotation.x = -Math.PI / 2;
      shadow.position.set(0, .018, 0);
      shadow.scale.set(1.12, .72, 1);
      mesh.add(shadow);
    }
    return mesh;
  }

  function addTree(x, y, scale = 1) {
    treeColliders.push({ x, y, r: 43 * scale });
    const tree = new THREE.Group();
    const shadow = new THREE.Mesh(
      new THREE.CircleGeometry(.76 * scale, 12),
      new THREE.MeshBasicMaterial({ color: 0x192319, transparent: true, opacity: .22, depthWrite: false })
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = .016;
    shadow.scale.set(1.3, .76, 1);
    tree.add(shadow);
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(.12 * scale, .2 * scale, 1.2 * scale, 6), makeMaterial(0x66513a));
    trunk.position.y = .6 * scale;
    tree.add(trunk);
    const foliageMaterial = makeMaterial(random() > .5 ? 0x435d41 : 0x526747);
    for (let i = 0; i < 3; i++) {
      const crown = new THREE.Mesh(new THREE.ConeGeometry((.83 - i * .13) * scale, (1.4 - i * .16) * scale, 7), foliageMaterial);
      crown.position.set(0, (1.25 + i * .53) * scale, 0);
      tree.add(crown);
    }
    tree.position.set(toX(x), 0, toZ(y));
    tree.userData.generated = true;
    tree.userData.cameraBlocker = true;
    tree.rotation.y = random() * Math.PI;
    configureShadowMeshes(tree);
    arenaGroup.add(tree);
  }

  function addHouseWall(house, side, start, length, wallHeight = 2.5, wallBase = 0) {
    const thickness = 18;
    const wall = { type: "house-wall", wallHeight, wallBase, materialColor: house.wallColor };
    if (side === "north" || side === "south") {
      wall.x = start;
      wall.y = side === "north" ? house.y - house.h / 2 : house.y + house.h / 2 - thickness;
      wall.w = length;
      wall.h = thickness;
    } else {
      wall.x = side === "west" ? house.x - house.w / 2 : house.x + house.w / 2 - thickness;
      wall.y = start;
      wall.w = thickness;
      wall.h = length;
    }
    obstacles.push(wall);
  }

  function addWindowedWall(house, side) {
    const alongX = side === "north" || side === "south";
    const center = alongX ? house.x : house.y;
    const length = alongX ? house.w : house.h;
    const start = center - length / 2;
    const isDoor = side === house.doorSide;
    const opening = isDoor ? 106 : 78;
    const openingStart = center - opening / 2;
    const openingEnd = center + opening / 2;
    if (isDoor) {
      addHouseWall(house, side, start, openingStart - start);
      addHouseWall(house, side, openingEnd, center + length / 2 - openingEnd);
      return;
    }
    addHouseWall(house, side, start, openingStart - start);
    addHouseWall(house, side, openingEnd, center + length / 2 - openingEnd);
    addHouseWall(house, side, openingStart, opening, .78);
    addHouseWall(house, side, openingStart, opening, .55, 1.95);
  }

  function addHouseTrim(house, group, position, size, color = 0x514b40) {
    const trim = new THREE.Mesh(new THREE.BoxGeometry(size[0], size[1], size[2]), makeMaterial(color, .86));
    trim.position.set(position[0], position[1], position[2]);
    group.add(trim);
    return trim;
  }

  function buildHouseInterior(house) {
    const group = new THREE.Group();
    const centerX = toX(house.x), centerZ = toZ(house.y);
    const width = house.w * SCALE, depth = house.h * SCALE;
    const floor = new THREE.Mesh(
      new THREE.BoxGeometry(width - .12, .09, depth - .12),
      makeMaterial(0x736d5b, .96)
    );
    floor.position.set(centerX, .015, centerZ);
    group.add(floor);

    const rug = new THREE.Mesh(
      new THREE.BoxGeometry(width * .34, .018, depth * .3),
      makeMaterial(house.trimColor, .98)
    );
    rug.position.set(centerX, .07, centerZ);
    group.add(rug);

    const doorOffset = house.doorSide === "south" ? house.h / 2 - 9 : -house.h / 2 + 9;
    const doorZ = toZ(house.y + doorOffset);
    const doorX = toX(house.x);
    const doorHalf = 53 * SCALE;
    const jambHeight = 2.08;
    for (const side of [-1, 1]) {
      const horizontalDoor = house.doorSide === "north" || house.doorSide === "south";
      addHouseTrim(house, group,
        [horizontalDoor ? doorX + side * doorHalf : toX(house.x + (side < 0 ? -house.w / 2 + 9 : house.w / 2 - 9)),
          jambHeight / 2,
          horizontalDoor ? doorZ : toZ(house.y)],
        horizontalDoor ? [.11, jambHeight, .12] : [.12, jambHeight, .11], house.trimColor);
    }
    addHouseTrim(house, group,
      [doorX, jambHeight, doorZ],
      [doorHalf * 2 + .12, .12, .12], house.trimColor);

    const windowHalf = 39 * SCALE;
    const windowY = 1.38;
    const sillY = .78;
    for (const side of ["north", "east", "west"]) {
      if (side === house.doorSide) continue;
      const isHorizontal = side === "north";
      const wallZ = toZ(house.y + (side === "north" ? -house.h / 2 : 0));
      const wallX = toX(house.x + (side === "east" ? house.w / 2 : side === "west" ? -house.w / 2 : 0));
      const frameWidth = windowHalf * 2 + .12;
      if (isHorizontal) {
        for (const y of [sillY, 1.95]) {
          addHouseTrim(house, group, [centerX, y, wallZ], [frameWidth, .08, .1], house.trimColor);
        }
        for (const x of [-windowHalf, windowHalf]) {
          addHouseTrim(house, group, [centerX + x, windowY, wallZ], [.08, .65, .1], house.trimColor);
        }
      } else {
        for (const y of [sillY, 1.95]) {
          addHouseTrim(house, group, [wallX, y, centerZ], [.1, .08, frameWidth], house.trimColor);
        }
        for (const z of [-windowHalf, windowHalf]) {
          addHouseTrim(house, group, [wallX, windowY, centerZ + z], [.1, .65, .08], house.trimColor);
        }
      }
    }

    const northZ = toZ(house.y - house.h / 2 + 9);
    const southZ = toZ(house.y + house.h / 2 - 9);
    const westX = toX(house.x - house.w / 2 + 9);
    const eastX = toX(house.x + house.w / 2 - 9);
    addHouseTrim(house, group, [centerX, 2.52, northZ], [width + .18, .14, .16], house.trimColor);
    addHouseTrim(house, group, [centerX, 2.52, southZ], [width + .18, .14, .16], house.trimColor);
    addHouseTrim(house, group, [westX, 2.52, centerZ], [.16, .14, depth + .18], house.trimColor);
    addHouseTrim(house, group, [eastX, 2.52, centerZ], [.16, .14, depth + .18], house.trimColor);

    const glassMaterial = new THREE.MeshStandardMaterial({
      color: 0x9fc4c4, emissive: 0x344f50, transparent: true, opacity: .34,
      roughness: .24, metalness: .16, side: THREE.DoubleSide
    });
    for (const side of ["north", "east", "west"]) {
      if (side === house.doorSide) continue;
      const pane = new THREE.Mesh(
        new THREE.PlaneGeometry(windowHalf * 1.82, 1.08),
        glassMaterial
      );
      pane.position.set(
        side === "west" ? westX : side === "east" ? eastX : centerX,
        1.38,
        side === "north" ? northZ : side === "south" ? southZ : centerZ
      );
      if (side !== "north") pane.rotation.y = Math.PI / 2;
      group.add(pane);
    }

    group.userData.generated = true;
    configureShadowMeshes(group);
    arenaGroup.add(group);
  }

  function buildArenaVisuals() {
    for (const child of [...arenaGroup.children]) {
      if (child.userData.generated || child.userData.obstacle || child.userData.zone) {
        arenaGroup.remove(child);
        disposeObject(child);
      }
    }
    zoneVisuals = [];
    cameraBlockers = [];
    for (const obstacle of obstacles) {
      const mesh = createObstacleMesh(obstacle);
      mesh.userData.generated = true;
      configureShadowMeshes(mesh);
      arenaGroup.add(mesh);
      cameraBlockers.push(mesh);
    }
    for (const house of houses) buildHouseInterior(house);
    const placements = [
      [125, 145], [245, 1110], [445, 170], [690, 1110], [1080, 160],
      [1505, 230], [1650, 610], [1490, 1110], [1190, 1120], [315, 830],
      [790, 335], [1080, 920], [340, 510], [1555, 900], [900, 1190],
      [90, 680], [1710, 250], [650, 770], [1310, 340], [1130, 540],
      [445, 1250], [1370, 1230], [124, 340], [1665, 1020]
    ];
    for (const [x, y] of placements) {
      if (Math.hypot(x - WORLD.width / 2, y - WORLD.height / 2) < 440) continue;
      if (houses.some(house => Math.abs(x - house.x) < house.w / 2 + 75 && Math.abs(y - house.y) < house.h / 2 + 75)) continue;
      if (obstacles.some(o => x > o.x - 75 && x < o.x + o.w + 75 && y > o.y - 75 && y < o.y + o.h + 75)) continue;
      addTree(x, y, .8 + random() * .55);
    }
    let addedTrees = 0;
    for (let attempt = 0; attempt < 180 && addedTrees < 34; attempt++) {
      const x = 55 + random() * (WORLD.width - 110);
      const y = 55 + random() * (WORLD.height - 110);
      const scale = .8 + random() * .55;
      const radius = 43 * scale;
      if (houses.some(house => Math.abs(x - house.x) < house.w / 2 + radius + 24 &&
        Math.abs(y - house.y) < house.h / 2 + radius + 24)) continue;
      const nearObstacle = obstacles.some(o => x > o.x - radius - 22 && x < o.x + o.w + radius + 22 &&
        y > o.y - radius - 22 && y < o.y + o.h + radius + 22);
      const nearTree = treeColliders.some(tree => Math.hypot(x - tree.x, y - tree.y) < radius + tree.r + 30);
      if (Math.hypot(x - WORLD.width / 2, y - WORLD.height / 2) < 500 || nearObstacle || nearTree) continue;
      addTree(x, y, scale);
      addedTrees++;
    }
    for (const child of arenaGroup.children) {
      if (child.userData.cameraBlocker && !cameraBlockers.includes(child)) cameraBlockers.push(child);
    }
    addGroundFoliage();
    addZoneMeshes();
  }

  function addGroundFoliage() {
    const mobileQuality = matchMedia("(pointer: coarse)").matches;
    const count = mobileQuality ? 280 : 980;
    const foliage = new THREE.Group();
    foliage.userData.generated = true;
    const bladeGeometry = new THREE.PlaneGeometry(.07, .38, 1, 1);
    const bladeMaterial = new THREE.MeshStandardMaterial({
      color: 0x59783f, roughness: .94, metalness: 0, side: THREE.DoubleSide, transparent: true, opacity: .82
    });
    const grass = new THREE.InstancedMesh(bladeGeometry, bladeMaterial, count);
    const crossGrass = new THREE.InstancedMesh(bladeGeometry, bladeMaterial, count);
    const matrix = new THREE.Matrix4();
    const scale = new THREE.Vector3();
    let seed = 3971;
    const next = () => {
      seed = (seed * 48271) % 2147483647;
      return (seed - 1) / 2147483646;
    };
    for (let index = 0; index < count; index++) {
      let x = 24 + next() * (WORLD.width - 48);
      let y = 24 + next() * (WORLD.height - 48);
      let attempts = 0;
      while (attempts++ < 8 && (
        Math.hypot(x - WORLD.width / 2, y - WORLD.height / 2) < 360 ||
        houses.some(house => Math.abs(x - house.x) < house.w / 2 + 35 && Math.abs(y - house.y) < house.h / 2 + 35)
      )) {
        x = 24 + next() * (WORLD.width - 48);
        y = 24 + next() * (WORLD.height - 48);
      }
      const size = .58 + next() * .92;
      const angle = next() * Math.PI;
      scale.set(size, size, size);
      matrix.makeRotationY(angle);
      matrix.scale(scale);
      matrix.setPosition(toX(x), .15 * size, toZ(y));
      grass.setMatrixAt(index, matrix);
      matrix.makeRotationY(angle + Math.PI / 2);
      matrix.scale(scale);
      matrix.setPosition(toX(x), .15 * size, toZ(y));
      crossGrass.setMatrixAt(index, matrix);
    }
    grass.instanceMatrix.needsUpdate = true;
    crossGrass.instanceMatrix.needsUpdate = true;
    foliage.add(grass, crossGrass);
    arenaGroup.add(foliage);
  }

  function addZoneMeshes() {
    for (const zone of zones) {
      const color = zone.owner === "blue" ? COLORS.blue : zone.owner === "red" ? COLORS.red : COLORS.lime;
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(zone.r * SCALE, .055, 5, 40),
        new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: .36, transparent: true, opacity: .82 })
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.set(toX(zone.x), .045, toZ(zone.y));
      ring.userData.zone = zone;
      arenaGroup.add(ring);
      const flagpole = new THREE.Mesh(new THREE.CylinderGeometry(.025, .035, 1.4, 6), makeMaterial(0xd5d6c7, .42, .25));
      flagpole.position.set(toX(zone.x), .7, toZ(zone.y));
      flagpole.userData.zone = zone;
      arenaGroup.add(flagpole);
      const flag = new THREE.Mesh(
        new THREE.BoxGeometry(.56, .31, .035),
        new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: .14, side: THREE.DoubleSide })
      );
      flag.position.set(toX(zone.x) + .25, 1.16, toZ(zone.y));
      flag.userData.zone = zone;
      arenaGroup.add(flag);
      zoneVisuals.push({ zone, ring, flag });
    }
  }

  function makeArena() {
    obstacles = [];
    treeColliders = [];
    houses = [
      { x: WORLD.width * .2, y: WORLD.height * .22, w: 360, h: 300, wallColor: 0x9a8d77, trimColor: 0x504b40 },
      { x: WORLD.width * .8, y: WORLD.height * .22, w: 360, h: 300, wallColor: 0x858f88, trimColor: 0x4c554e },
      { x: WORLD.width * .2, y: WORLD.height * .78, w: 360, h: 300, wallColor: 0x9a8875, trimColor: 0x51483e },
      { x: WORLD.width * .8, y: WORLD.height * .78, w: 360, h: 300, wallColor: 0x8d927f, trimColor: 0x4e5145 }
    ];
    for (const house of houses) house.doorSide = house.y > WORLD.height / 2 ? "north" : "south";
    const overlapsHouse = (x, y, w, h, margin = 35) => houses.some(house =>
      x < house.x + house.w / 2 + margin && x + w > house.x - house.w / 2 - margin &&
      y < house.y + house.h / 2 + margin && y + h > house.y - house.h / 2 - margin
    );
    for (let i = 0; i < 92; i++) {
      const w = 48 + random() * 110;
      const h = 42 + random() * 88;
      const x = 75 + random() * (WORLD.width - w - 150);
      const y = 75 + random() * (WORLD.height - h - 150);
      if (Math.hypot(x + w / 2 - WORLD.width / 2, y + h / 2 - WORLD.height / 2) < 430) continue;
      if (overlapsHouse(x, y, w, h, 45)) continue;
      obstacles.push({ x, y, w, h, type: random() > .55 ? "crate" : "rock" });
    }
    for (const house of houses) {
      addWindowedWall(house, "north");
      addWindowedWall(house, "south");
      addWindowedWall(house, "west");
      addWindowedWall(house, "east");
      obstacles.push({
        type: "furniture", x: house.x - 70, y: house.y - 28, w: 82, h: 52,
        materialColor: house.trimColor
      });
      obstacles.push({
        type: "cabinet", x: house.x + 108, y: house.y + 74, w: 36, h: 36,
        objectHeight: 1.18, materialColor: house.wallColor
      });
    }
    if (mode === "territory") {
      zones = [
        { x: WORLD.width * .28, y: WORLD.height * .29, r: 105, progress: 0, owner: null },
        { x: WORLD.width * .72, y: WORLD.height * .71, r: 105, progress: 0, owner: null },
        { x: WORLD.width * .5, y: WORLD.height * .5, r: 120, progress: 0, owner: null }
      ];
    } else zones = [{ x: WORLD.width / 2, y: WORLD.height / 2, r: 90, progress: 0, owner: null }];
    buildArenaVisuals();
  }

  function resetGame() {
    elapsed = 0;
    botSpawnClock = 0;
    wave = 1;
    waveIntermission = 0;
    score = 0;
    territoryScore = { blue: 0, red: 0 };
    bullets.forEach(b => entityGroup.remove(b.mesh));
    particles.forEach(p => { entityGroup.remove(p.mesh); disposeObject(p.mesh); });
    pickups.forEach(p => { entityGroup.remove(p.mesh); disposeObject(p.mesh); });
    bots.forEach(bot => { entityGroup.remove(bot.model); disposeObject(bot.model); });
    if (player) { entityGroup.remove(player.model); disposeObject(player.model); }
    bullets = [];
    particles = [];
    pickups = [];
    bots = [];
    banner = "";
    messageTimer = 0;
    randomSeed = 7129;
    makeArena();
    player = createActor(WORLD.width / 2, WORLD.height / 2, "blue", true);
    player.angle = -Math.PI / 2;
    mouseLook.yaw = player.angle;
    mouseLook.pitch = 0;
    magazine = 30;
    reserveAmmo = 120;
    reloadTimer = 0;
    activeWeapon = profile.primary;
    weaponAmmo = {};
    const startingAmmo = getWeaponAmmo(activeWeapon);
    magazine = startingAmmo.magazine;
    reserveAmmo = startingAmmo.reserve;
    stamina = 100;
    sprinting = false;
    networkFireSequence = 0;
    matchRewarded = false;
    if (mode === "waves") {
      spawnWave(1);
    } else {
      const count = mode === "survival" ? 5 : 11;
      for (let i = 0; i < count; i++) spawnBot(i);
    }
    screen = "playing";
    showScreen();
    updateHud();
    lastTime = performance.now();
    pointer.down = false;
    touches.clear();
    touchMove.id = null;
  }

  function spawnBot(index) {
    const team = mode === "territory" && index % 2 === 1 ? "blue" : "red";
    let x = WORLD.width / 2, y = WORLD.height / 2;
    for (let attempt = 0; attempt < 36; attempt++) {
      const angle = random() * Math.PI * 2;
      const radius = 350 + random() * 430;
      const candidateX = clamp(WORLD.width / 2 + Math.cos(angle) * radius, 55, WORLD.width - 55);
      const candidateY = clamp(WORLD.height / 2 + Math.sin(angle) * radius, 55, WORLD.height - 55);
      const blockedByWall = obstacles.some(wall => {
        const px = clamp(candidateX, wall.x, wall.x + wall.w);
        const py = clamp(candidateY, wall.y, wall.y + wall.h);
        return Math.hypot(candidateX - px, candidateY - py) < 55;
      });
      const blockedByTree = treeColliders.some(tree => Math.hypot(candidateX - tree.x, candidateY - tree.y) < tree.r + 40);
      const blockedByActor = [player, ...bots].some(actor => actor && actor.alive && Math.hypot(candidateX - actor.x, candidateY - actor.y) < 90);
      if (!blockedByWall && !blockedByTree && !blockedByActor) {
        x = candidateX;
        y = candidateY;
        break;
      }
    }
    const actor = createActor(x, y, team);
    if (mode === "survival" || mode === "waves") actor.speed += Math.min(wave * 3, 38);
    bots.push(actor);
  }

  function spawnWave(number) {
    wave = number;
    waveIntermission = 0;
    const count = Math.min(2 + wave, 12);
    for (let i = 0; i < count; i++) spawnBot(i);
    setBanner(`WAVE ${wave} INCOMING`);
  }

  function showScreen() {
    const needsHumanCheck = getCookie(COOKIE_NAMES.human) !== "1";
    const needsAccount = !account;
    ui.human.classList.toggle("hidden", screen !== "menu" || !needsHumanCheck);
    ui.account.classList.toggle("hidden", screen !== "menu" || needsHumanCheck || !needsAccount);
    ui.start.classList.toggle("hidden", screen !== "menu" || needsHumanCheck || needsAccount);
    ui.shop.classList.add("hidden");
    ui.avatar.classList.add("hidden");
    ui.pause.classList.toggle("hidden", screen !== "paused");
    ui.result.classList.toggle("hidden", screen !== "finished");
    ui.mobile.classList.toggle("active", screen === "playing" && matchMedia("(pointer: coarse)").matches);
    ui.crosshair.style.display = screen === "playing" && matchMedia("(pointer:fine)").matches ? "block" : "none";
    shell.classList.toggle("playing", screen === "playing");
    if (screen !== "playing") {
      pointer.down = false;
      touches.clear();
      touchMove.id = null;
      if (document.pointerLockElement === canvas) document.exitPointerLock();
    }
  }

  function setOnlineStatus(text) {
      ui.onlineStatus.textContent = text;
      ui.onlineIndicator.innerHTML = onlineEnabled
        ? `<i></i> ONLINE · ${remoteActors.size + (multiplayerId ? 1 : 0)} PLAYERS`
        : "<i></i> BOT MATCH · 3D";
    }

  function removeRemoteActor(id) {
      const actor = remoteActors.get(id);
      if (!actor) return;
      entityGroup.remove(actor.model);
      disposeObject(actor.model);
      remoteActors.delete(id);
    }

  function makeRemoteActor(data) {
      const actor = {
        id: data.id, name: data.name, team: data.team === "red" ? "red" : "blue", skin: SKINS[data.skin] ? data.skin : "ranger",
        x: clamp(data.x, 0, WORLD.width), y: clamp(data.y, 0, WORLD.height),
        angle: Number.isFinite(data.angle) ? data.angle : -Math.PI / 2,
        health: clamp(data.health || 100, 0, 100), maxHealth: 100, isPlayer: false, isRemote: true,
        weapon: WEAPONS[data.weapon] ? data.weapon : "rifle",
        fireSeq: Number.isSafeInteger(data.fireSeq) ? data.fireSeq : 0,
        lastFireSeq: Number.isSafeInteger(data.fireSeq) ? data.fireSeq : 0,
        moving: Boolean(data.moving), vx: 0, vy: 0, cooldown: 0, ammo: 24, reserveAmmo: 72, reloadTimer: 0,
        alive: data.health > 0, hitFlash: 0, anim: 0, model: null
      };
      actor.model = createCharacter(actor);
      configureShadowMeshes(actor.model);
      entityGroup.add(actor.model);
      remoteActors.set(actor.id, actor);
      return actor;
    }

  function updateRemoteActor(data) {
      if (!data || typeof data.id !== "string") return;
      let actor = remoteActors.get(data.id);
      if (!actor) actor = makeRemoteActor(data);
      const previousX = actor.x, previousY = actor.y;
      actor.x = clamp(data.x, 0, WORLD.width);
      actor.y = clamp(data.y, 0, WORLD.height);
      actor.vx = (actor.x - previousX) * 12;
      actor.vy = (actor.y - previousY) * 12;
      actor.angle = data.angle;
      actor.health = clamp(data.health, 0, 100);
      actor.alive = actor.health > 0;
      actor.moving = Boolean(data.moving);
      actor.anim += actor.moving ? .35 : .05;
      actor.weapon = WEAPONS[data.weapon] ? data.weapon : "rifle";
      if (Number.isSafeInteger(data.fireSeq) && data.fireSeq > actor.lastFireSeq) {
        actor.lastFireSeq = data.fireSeq;
        fire(actor, actor.angle, actor.weapon);
      }
    }

  function handleMultiplayerMessage(message) {
      if (message.type === "welcome") {
        multiplayerId = message.id;
        networkMode = message.mode;
        for (const actor of message.players) updateRemoteActor(actor);
        setOnlineStatus(`Connected · ${remoteActors.size + 1} players in this mode`);
        return;
      }
      if (message.type === "join") {
        updateRemoteActor(message.player);
        setOnlineStatus(`${message.player.name} joined · ${remoteActors.size + 1} players`);
        return;
      }
      if (message.type === "state") {
        updateRemoteActor(message.player);
        setOnlineStatus(`Connected · ${remoteActors.size + 1} players in this mode`);
        return;
      }
      if (message.type === "leave") {
        removeRemoteActor(message.id);
        setOnlineStatus(`Player left · ${remoteActors.size + 1} players`);
        return;
      }
      if (message.type === "hit") {
        if (message.targetId === multiplayerId && player) {
          player.health = Math.max(0, player.health - message.damage);
          if (player.health === 0) endGame(false);
        } else {
          const target = remoteActors.get(message.targetId);
          if (target) target.health = Math.max(0, target.health - message.damage);
        }
        if (message.attackerId === multiplayerId) setBanner("PLAYER HIT");
        updateHud();
        return;
      }
      if (message.type === "error") setOnlineStatus(message.message);
    }

  function connectMultiplayer(selectedMode) {
      if (multiplayerSocket && networkMode === selectedMode && multiplayerSocket.readyState === WebSocket.OPEN) {
        return Promise.resolve();
      }
      closeMultiplayer();
      if (location.protocol === "file:") {
        return Promise.reject(new Error("Online play needs the local server. Run `node server.js`, then open http://localhost:3000."));
      }
      const protocol = location.protocol === "https:" ? "wss:" : "ws:";
      const socket = new WebSocket(`${protocol}//${location.host}/multiplayer`);
      multiplayerSocket = socket;
      setOnlineStatus("Connecting to match server…");
      return new Promise((resolve, reject) => {
        let settled = false;
        socket.addEventListener("open", () => {
          const name = ui.callsign.value.trim().slice(0, 18) || "Ranger";
          socket.send(JSON.stringify({ type: "join", mode: selectedMode, name, skin: profile.skin }));
        }, { once: true });
        socket.addEventListener("message", event => {
          let message;
          try {
            message = JSON.parse(event.data);
          } catch (error) {
            console.error("Received invalid multiplayer JSON.", error);
            socket.close(1007, "Invalid JSON");
            return;
          }
          handleMultiplayerMessage(message);
          if (!settled && message.type === "welcome") {
            settled = true;
            resolve();
          } else if (!settled && message.type === "error") {
            settled = true;
            reject(new Error(message.message));
          }
        });
        socket.addEventListener("error", () => {
          if (!settled) {
            settled = true;
            reject(new Error("Could not reach the match server. Start it with `node server.js` or check the server address."));
          }
        }, { once: true });
        socket.addEventListener("close", event => {
          if (!settled) {
            settled = true;
            reject(new Error(event.reason || "The match server closed the connection."));
          }
          if (multiplayerSocket === socket) {
            multiplayerSocket = null;
            multiplayerId = null;
            networkMode = "";
            for (const id of [...remoteActors.keys()]) removeRemoteActor(id);
            setOnlineStatus(onlineEnabled ? "Disconnected from the match server." : "Solo match · bots only");
            if (screen === "playing") setBanner("MULTIPLAYER DISCONNECTED");
          }
        });
      });
    }

  function closeMultiplayer() {
      if (multiplayerSocket) {
        const socket = multiplayerSocket;
        multiplayerSocket = null;
        socket.close();
      }
      multiplayerId = null;
      networkMode = "";
      for (const id of [...remoteActors.keys()]) removeRemoteActor(id);
      setOnlineStatus(onlineEnabled ? "Online lobby ready · deploy to join." : "Solo match · bots only");
    }

  function sendMultiplayerState(dt) {
      if (screen !== "playing" || !player || !multiplayerId ||
          !multiplayerSocket || multiplayerSocket.readyState !== WebSocket.OPEN) return;
      networkAccumulator += dt;
      if (networkAccumulator < .05) return;
      networkAccumulator = 0;
      multiplayerSocket.send(JSON.stringify({
        type: "state", x: player.x, y: player.y, angle: player.angle,
        health: player.health, weapon: activeWeapon, fireSeq: networkFireSequence,
        moving: Math.hypot(player.vx, player.vy) > 8
      }));
  }

  async function startMode(selectedMode) {
    if (onlineEnabled) {
      try {
        await connectMultiplayer(selectedMode);
      } catch (error) {
        ui.onlineStatus.textContent = error.message;
        return;
      }
    } else {
      closeMultiplayer();
    }
    mode = selectedMode;
    ui.mode.textContent = modeNames[mode];
    resetGame();
    if (isDesktopFirstPerson()) requestMouseCapture();
  }

  function requestMouseCapture() {
    if (!isDesktopFirstPerson() || screen !== "playing" || document.pointerLockElement === canvas) return;
    if (!canvas.requestPointerLock) {
      ui.subtitle.textContent = "This browser cannot capture the mouse. Use Chrome or a desktop browser.";
      return;
    }
    const result = canvas.requestPointerLock();
    if (result && typeof result.catch === "function") {
      result.catch(error => {
        if (screen === "playing" && error.name !== "WrongDocumentError") {
          ui.subtitle.textContent = "Mouse-look is active. This browser could not lock the pointer.";
        }
      });
    }
  }

  function pauseGame() {
    if (screen === "playing") {
      screen = "paused";
      showScreen();
    } else if (screen === "paused") {
      screen = "playing";
      showScreen();
      lastTime = performance.now();
      if (isDesktopFirstPerson()) requestMouseCapture();
    }
  }

  function endGame(won) {
    if (screen !== "playing") return;
    if (won && !matchRewarded) {
      matchRewarded = true;
      if (mode !== "waves" && mode !== "survival") awardCredits(100, "MATCH VICTORY");
    }
    screen = "finished";
    document.querySelector("#result-title").innerHTML = won ? "NICE<br><em>WORK.</em>" : "MATCH<br><em>OVER.</em>";
    document.querySelector("#result-copy").textContent = mode === "survival"
      ? `You reached wave ${wave} and eliminated ${score} ${score === 1 ? "bot" : "bots"}.`
      : mode === "waves" ? `You cleared all ${MAX_WAVES} waves and eliminated ${score} bots.`
      : mode === "territory" ? `Your team scored ${Math.floor(territoryScore.blue)} points. The arena remembers.`
      : `You eliminated ${score} ${score === 1 ? "opponent" : "opponents"}. The arena remembers.`;
    showScreen();
  }

  function setBanner(text) {
    banner = text;
    messageTimer = 1.8;
  }

  function nearestEnemy(actor) {
    let nearest = null;
    let best = Infinity;
    for (const other of [player, ...bots, ...remoteActors.values()]) {
      if (!other || !other.alive || other === actor) continue;
      if (mode === "territory" && other.team === actor.team) continue;
      const d = distance(actor, other);
      const visible = !segmentBlocked(actor.x, actor.y, other.x, other.y, 0, 1.1);
      const threatScore = d * (visible ? .72 : 1) - Math.max(0, 100 - other.health) * .35;
      if (threatScore < best) { best = threatScore; nearest = other; }
    }
    return nearest;
  }

  function fire(actor, angle, requestedWeapon) {
    if (actor.cooldown > 0 || !actor.alive) return;
    const playerWeapon = actor.isPlayer || actor.isRemote;
    const weaponId = requestedWeapon || (actor.isPlayer ? activeWeapon : actor.weapon);
    const weapon = playerWeapon ? WEAPONS[weaponId] || WEAPONS.rifle : null;
    if (actor.isPlayer && reloadTimer > 0) return;
    if (actor.isPlayer && magazine <= 0) {
      reloadPlayer();
      return;
    }
    if (actor.isPlayer) magazine--;
    else if (actor.isRemote && actor.ammo <= 0) return;
    else if (actor.isRemote) actor.ammo--;
    if (!actor.isPlayer) {
      if (!actor.isRemote) {
        if (actor.reloadTimer > 0 || actor.ammo <= 0) return;
        actor.ammo--;
      }
    }
    actor.cooldown = playerWeapon ? weapon.delay : .78 + random() * .3;
    const speed = playerWeapon ? weapon.speed : PROJECTILE_SPEED.bot;
    const firstPerson = actor.isPlayer && isDesktopFirstPerson();
    const pitch = firstPerson ? mouseLook.pitch : 0;
    const muzzleDistance = firstPerson ? 66 : actor.radius + 6;
    const horizontalOffset = muzzleDistance * Math.cos(pitch);
    const x = actor.x + Math.cos(angle) * horizontalOffset;
    const y = actor.y + Math.sin(angle) * horizontalOffset;
    const height = firstPerson ? 1.58 + muzzleDistance * SCALE * Math.sin(pitch) : 1.12;
    const horizontalSpeed = speed * Math.cos(pitch);
    const mesh = new THREE.Group();
    const casing = new THREE.Mesh(projectileCasingGeometry, projectileCasingMaterial);
    casing.position.y = -.045;
    const tip = new THREE.Mesh(projectileTipGeometry, projectileTipMaterials[actor.team]);
    tip.position.y = .135;
    const base = new THREE.Mesh(projectileBaseGeometry, projectileCasingMaterial);
    base.position.y = -.1725;
    mesh.add(casing, tip, base);
    const direction = new THREE.Vector3(
      Math.cos(angle) * Math.cos(pitch),
      Math.sin(pitch),
      Math.sin(angle) * Math.cos(pitch)
    );
    mesh.quaternion.setFromUnitVectors(bulletForwardAxis, direction.normalize());
    mesh.position.set(toX(x), height, toZ(y));
    mesh.userData.team = actor.team;
    entityGroup.add(mesh);
    bullets.push({
      x, y, height,
      vx: Math.cos(angle) * horizontalSpeed,
      vy: Math.sin(angle) * horizontalSpeed,
      vz: speed * SCALE * Math.sin(pitch),
      life: 1.35, team: actor.team, owner: actor, radius: actor.isPlayer ? 4 : 3,
      damage: playerWeapon ? weapon.damage : 13, mesh
    });
    if (actor.isPlayer) {
      weaponAmmo[activeWeapon] = { magazine, reserve: reserveAmmo };
      networkFireSequence++;
    }
    for (let i = 0; i < 3; i++) {
      addParticle(x, y, (random() - .5) * 100, (random() - .5) * 100, .15 + random() * .12, actor.isPlayer ? COLORS.lime : 0xffbe74, .035 + random() * .035);
    }
  }

  function addParticle(x, y, vx, vy, life, color, size) {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(size, 5, 4),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: .85, toneMapped: false })
    );
    entityGroup.add(mesh);
    particles.push({ x, y, vx, vy, life, max: life, mesh });
  }

  function moveActor(actor, dx, dy, dt) {
    const previousX = actor.x, previousY = actor.y;
    const length = Math.hypot(dx, dy);
    if (length > 1) { dx /= length; dy /= length; }
    actor.x += dx * actor.speed * dt;
    actor.y += dy * actor.speed * dt;
    actor.x = clamp(actor.x, actor.radius, WORLD.width - actor.radius);
    actor.y = clamp(actor.y, actor.radius, WORLD.height - actor.radius);
    for (const wall of obstacles) {
      const px = clamp(actor.x, wall.x, wall.x + wall.w);
      const py = clamp(actor.y, wall.y, wall.y + wall.h);
      const ox = actor.x - px, oy = actor.y - py;
      const d = Math.hypot(ox, oy);
      if (d < actor.radius) {
        if (d > 0) {
          actor.x += ox / d * (actor.radius - d);
          actor.y += oy / d * (actor.radius - d);
        } else {
          const edges = [
            { distance: actor.x - wall.x, x: wall.x - actor.radius },
            { distance: wall.x + wall.w - actor.x, x: wall.x + wall.w + actor.radius },
            { distance: actor.y - wall.y, y: wall.y - actor.radius },
            { distance: wall.y + wall.h - actor.y, y: wall.y + wall.h + actor.radius }
          ];
          const nearest = edges.reduce((best, edge) => edge.distance < best.distance ? edge : best);
          if (nearest.x !== undefined) actor.x = nearest.x;
          else actor.y = nearest.y;
        }
      }
    }
    for (const tree of treeColliders) {
      let dx = actor.x - tree.x, dy = actor.y - tree.y;
      let d = Math.hypot(dx, dy);
      const minDistance = actor.radius + tree.r;
      if (d >= minDistance) continue;
      if (d < .001) { dx = 1; dy = 0; d = 1; }
      actor.x = clamp(actor.x + dx / d * (minDistance - d), actor.radius, WORLD.width - actor.radius);
      actor.y = clamp(actor.y + dy / d * (minDistance - d), actor.radius, WORLD.height - actor.radius);
    }
    if (dt > 0) {
      actor.vx = (actor.x - previousX) / dt;
      actor.vy = (actor.y - previousY) / dt;
    }
  }

  function separateActors() {
    const actors = [player, ...bots, ...remoteActors.values()].filter(actor => actor && actor.alive);
    for (let i = 0; i < actors.length; i++) {
      for (let j = i + 1; j < actors.length; j++) {
        const a = actors[i], b = actors[j];
        let dx = b.x - a.x, dy = b.y - a.y;
        let d = Math.hypot(dx, dy);
        const minDistance = a.radius + b.radius + 3;
        if (d >= minDistance) continue;
        if (d < .001) {
          const angle = (i * 17 + j * 31) * .1;
          dx = Math.cos(angle);
          dy = Math.sin(angle);
          d = 1;
        }
        const push = (minDistance - d) * .5;
        const nx = dx / d, ny = dy / d;
        a.x = clamp(a.x - nx * push, a.radius, WORLD.width - a.radius);
        a.y = clamp(a.y - ny * push, a.radius, WORLD.height - a.radius);
        b.x = clamp(b.x + nx * push, b.radius, WORLD.width - b.radius);
        b.y = clamp(b.y + ny * push, b.radius, WORLD.height - b.radius);
      }
    }
  }

  function updatePlayer(dt) {
    let forward = 0, strafe = 0;
    if (keys.has("w") || keys.has("arrowup")) forward += 1;
    if (keys.has("s") || keys.has("arrowdown")) forward -= 1;
    if (keys.has("a") || keys.has("arrowleft")) strafe -= 1;
    if (keys.has("d") || keys.has("arrowright")) strafe += 1;
    if (touchMove.id !== null) {
      strafe += touchMove.x;
      forward -= touchMove.y;
    }
    if (isDesktopFirstPerson()) player.angle = mouseLook.yaw;
    const fx = Math.cos(player.angle), fy = Math.sin(player.angle);
    const dx = fx * forward - fy * strafe;
    const dy = fy * forward + fx * strafe;
    const wantsSprint = keys.has("shift") || (touchMove.id !== null && Math.hypot(touchMove.x, touchMove.y) > .88);
    sprinting = wantsSprint && stamina > 0 && Math.hypot(dx, dy) > .05;
    player.speed = sprinting ? 310 : 220;
    stamina = clamp(stamina + (sprinting ? -34 : 23) * dt, 0, 100);
    moveActor(player, dx, dy, dt);
    player.anim += (Math.hypot(dx, dy) > .04 ? 10 : 2) * dt;
    player.cooldown = Math.max(0, player.cooldown - dt);
    if (reloadTimer > 0) {
      reloadTimer = Math.max(0, reloadTimer - dt);
      if (reloadTimer === 0) {
        const loaded = Math.min(30 - magazine, reserveAmmo);
        magazine += loaded;
        reserveAmmo -= loaded;
        setBanner("RELOADED");
      }
    }

    if (pointer.down || keys.has(" ")) fire(player, player.angle);
    for (const [id, point] of touches) {
      if (point.side === "aim") {
        const target = nearestEnemy(player);
        if (target) player.angle = Math.atan2(target.y - player.y, target.x - player.x);
        fire(player, player.angle);
      }
    }
  }

  function segmentIntersectsRect(x1, y1, x2, y2, rect, margin = 0) {
    return segmentRectEntry(x1, y1, x2, y2, rect, margin) !== null;
  }

  function segmentRectEntry(x1, y1, x2, y2, rect, margin = 0) {
    const minX = rect.x - margin;
    const maxX = rect.x + rect.w + margin;
    const minY = rect.y - margin;
    const maxY = rect.y + rect.h + margin;
    const dx = x2 - x1, dy = y2 - y1;
    const p = [-dx, dx, -dy, dy];
    const q = [x1 - minX, maxX - x1, y1 - minY, maxY - y1];
    let low = 0, high = 1;
    for (let i = 0; i < 4; i++) {
      if (Math.abs(p[i]) < .0001) {
        if (q[i] < 0) return null;
        continue;
      }
      const t = q[i] / p[i];
      if (p[i] < 0) low = Math.max(low, t);
      else high = Math.min(high, t);
      if (low > high) return null;
    }
    if (high < 0 || low > 1) return null;
    return clamp(low, 0, 1);
  }

  function segmentBlocked(x1, y1, x2, y2, margin = 0, height = 1.1) {
    for (const wall of obstacles) {
      if (wall.type === "house-wall" &&
          (height < wall.wallBase || height > wall.wallBase + wall.wallHeight)) continue;
      if (segmentIntersectsRect(x1, y1, x2, y2, wall, margin)) return true;
    }
    const dx = x2 - x1, dy = y2 - y1;
    const lengthSquared = dx * dx + dy * dy || 1;
    for (const tree of treeColliders) {
      const t = clamp(((tree.x - x1) * dx + (tree.y - y1) * dy) / lengthSquared, 0, 1);
      if (Math.hypot(x1 + dx * t - tree.x, y1 + dy * t - tree.y) < tree.r + margin) return true;
    }
    return false;
  }

  function steerAroundObstacles(actor, desiredX, desiredY) {
    const desiredLength = Math.hypot(desiredX, desiredY);
    if (desiredLength < .001) return { x: 0, y: 0 };
    const baseAngle = Math.atan2(desiredY, desiredX);
    const offsets = [0, .42, -.42, .82, -.82, 1.25, -1.25, Math.PI];
    let best = { x: 0, y: 0 };
    let bestScore = -Infinity;
    for (const offset of offsets) {
      const angle = baseAngle + offset;
      const dx = Math.cos(angle), dy = Math.sin(angle);
      const blocked = segmentBlocked(actor.x, actor.y, actor.x + dx * 112, actor.y + dy * 112, actor.radius + 7);
      const score = Math.cos(offset) * 1.8 + (blocked ? -2.4 : .75);
      if (score > bestScore) {
        bestScore = score;
        best = { x: dx, y: dy };
      }
    }
    return best;
  }

  function nearestUsefulPickup(actor) {
    let bestPickup = null;
    let bestDistance = Infinity;
    for (const pickup of pickups) {
      const useful = pickup.type === "health"
        ? actor.health < 78
        : actor.isPlayer ? reserveAmmo < 240 : actor.ammo < 8 || actor.reserveAmmo < 24;
      if (!useful) continue;
      const d = distance(actor, pickup);
      if (d < bestDistance) {
        bestDistance = d;
        bestPickup = pickup;
      }
    }
    return bestPickup;
  }

  function updateBots(dt) {
    for (let i = bots.length - 1; i >= 0; i--) {
      const bot = bots[i];
      if (!bot.alive) {
        entityGroup.remove(bot.model);
        disposeObject(bot.model);
        bots.splice(i, 1);
        continue;
      }
      bot.cooldown = Math.max(0, bot.cooldown - dt);
      bot.anim += 7 * dt;
      if (bot.reloadTimer > 0) {
        bot.reloadTimer = Math.max(0, bot.reloadTimer - dt);
        if (bot.reloadTimer === 0) {
          const loaded = Math.min(24 - bot.ammo, bot.reserveAmmo);
          bot.ammo += loaded;
          bot.reserveAmmo -= loaded;
        }
      } else if (bot.ammo <= 0 && bot.reserveAmmo > 0) {
        bot.reloadTimer = 1.35;
      }
      bot.aiTimer -= dt;
      if (bot.aiTimer <= 0) {
        bot.aiTimer = .28 + random() * .18;
        bot.target = nearestEnemy(bot);
        bot.lootTarget = nearestUsefulPickup(bot);
        if (random() < .2) bot.strafeSign *= -1;
        if (random() < .18) bot.wanderAngle += (random() - .5) * 1.2;
      }
      let moveX = Math.cos(bot.wanderAngle) * .3;
      let moveY = Math.sin(bot.wanderAngle) * .3;
      if (bot.target) {
        const d = distance(bot, bot.target);
        const angle = Math.atan2(bot.target.y - bot.y, bot.target.x - bot.x);
        bot.angle = angle;
        if (d > 320) {
          moveX = Math.cos(angle);
          moveY = Math.sin(angle);
        } else if (d < 205) {
          moveX = -Math.cos(angle) + Math.cos(angle + Math.PI / 2) * .42 * bot.strafeSign;
          moveY = -Math.sin(angle) + Math.sin(angle + Math.PI / 2) * .42 * bot.strafeSign;
        } else {
          moveX = Math.cos(angle + Math.PI / 2) * .62 * bot.strafeSign;
          moveY = Math.sin(angle + Math.PI / 2) * .62 * bot.strafeSign;
        }
        const canSeeTarget = !segmentBlocked(bot.x, bot.y, bot.target.x, bot.target.y, 0, 1.1);
        if (!canSeeTarget) {
          // Flank cover instead of repeatedly walking into the same wall.
          const flankAngle = angle + bot.flankSign * .88;
          moveX = Math.cos(flankAngle);
          moveY = Math.sin(flankAngle);
          if (random() < .08) bot.flankSign *= -1;
        } else if (bot.health < 34 && d < 410) {
          // Damaged bots break line of fire and look for a health pickup.
          moveX = -Math.cos(angle) + Math.cos(angle + Math.PI / 2) * .68 * bot.strafeSign;
          moveY = -Math.sin(angle) + Math.sin(angle + Math.PI / 2) * .68 * bot.strafeSign;
        }
        if (canSeeTarget && d < 620 && bot.cooldown <= 0 && bot.reloadTimer <= 0 && bot.ammo > 0) {
          const leadTime = d / PROJECTILE_SPEED.bot;
          const aimX = bot.target.x + bot.target.vx * leadTime * .48;
          const aimY = bot.target.y + bot.target.vy * leadTime * .48;
          const aimAngle = Math.atan2(aimY - bot.y, aimX - bot.x);
          const error = (random() - .5) * (.035 + d * .00012);
          if (random() < dt * 1.35) fire(bot, aimAngle + error);
        }
      }
      if (bot.lootTarget) {
        const lootDistance = distance(bot, bot.lootTarget);
        const hasEnemyPressure = bot.target && distance(bot, bot.target) < 230;
        if (lootDistance < 26) {
          bot.lootTarget = null;
        } else if (!hasEnemyPressure) {
          const lootAngle = Math.atan2(bot.lootTarget.y - bot.y, bot.lootTarget.x - bot.x);
          moveX = Math.cos(lootAngle);
          moveY = Math.sin(lootAngle);
        }
      }
      if (mode === "territory") {
        const desired = bot.team === "red" ? zones[2] : zones[0];
        if (desired && (!bot.target || distance(bot, bot.target) > 500)) {
          const angle = Math.atan2(desired.y - bot.y, desired.x - bot.x);
          moveX = Math.cos(angle);
          moveY = Math.sin(angle);
        }
      }
      const movement = steerAroundObstacles(bot, moveX, moveY);
      moveActor(bot, movement.x, movement.y, dt);
    }
  }

  function updateBullets(dt) {
    for (let i = bullets.length - 1; i >= 0; i--) {
      const bullet = bullets[i];
      const previousX = bullet.x, previousY = bullet.y, previousHeight = bullet.height;
      bullet.x += bullet.vx * dt;
      bullet.y += bullet.vy * dt;
      bullet.height += bullet.vz * dt;
      bullet.life -= dt;
      bullet.mesh.position.set(toX(bullet.x), bullet.height, toZ(bullet.y));
      let hit = bullet.life <= 0 || bullet.height < .08 || bullet.x < 0 || bullet.y < 0 || bullet.x > WORLD.width || bullet.y > WORLD.height;
      for (const wall of obstacles) {
        if (wall.type === "house-wall" &&
            !segmentIntersectsRect(previousX, previousY, bullet.x, bullet.y, wall)) continue;
        const wallHitAt = segmentRectEntry(previousX, previousY, bullet.x, bullet.y, wall);
        if (wallHitAt !== null) {
          const impactHeight = previousHeight + (bullet.height - previousHeight) * wallHitAt;
          if (wall.type === "house-wall" &&
              (impactHeight < wall.wallBase || impactHeight > wall.wallBase + wall.wallHeight)) continue;
          hit = true;
          break;
        }
      }
      const segmentX = bullet.x - previousX, segmentY = bullet.y - previousY;
      const segmentLengthSquared = segmentX * segmentX + segmentY * segmentY || 1;
      if (!hit && treeColliders.some(tree => {
        const t = clamp(((tree.x - previousX) * segmentX + (tree.y - previousY) * segmentY) / segmentLengthSquared, 0, 1);
        return Math.hypot(previousX + segmentX * t - tree.x, previousY + segmentY * t - tree.y) < tree.r;
      })) hit = true;
      for (const actor of [player, ...bots, ...remoteActors.values()]) {
        if (hit || !actor || !actor.alive || actor === bullet.owner || (actor.team === bullet.team && mode === "territory")) continue;
        const t = clamp(((actor.x - previousX) * segmentX + (actor.y - previousY) * segmentY) / segmentLengthSquared, 0, 1);
        const closestX = previousX + segmentX * t;
        const closestY = previousY + segmentY * t;
        const impactHeight = previousHeight + (bullet.height - previousHeight) * t;
        if (impactHeight > .2 && impactHeight < 2.05 &&
            Math.hypot(actor.x - closestX, actor.y - closestY) < actor.radius + bullet.radius) {
          if (actor.isRemote && multiplayerSocket?.readyState === WebSocket.OPEN) {
            multiplayerSocket.send(JSON.stringify({
              type: "hit", targetId: actor.id, damage: bullet.damage
            }));
            hit = true;
            break;
          }
          actor.health -= bullet.damage;
          actor.hitFlash = .13;
          hit = true;
          if (actor.health <= 0) {
            actor.alive = false;
            const color = actor.team === "blue" ? COLORS.blue : COLORS.red;
            for (let p = 0; p < 10; p++) {
              addParticle(actor.x, actor.y, (random() - .5) * 240, (random() - .5) * 240, .35 + random() * .3, color, .055 + random() * .07);
            }
            if (random() < .58) {
              const type = actor.health < 60 && random() < .62 ? "health" : "ammo";
              spawnPickup(actor.x, actor.y, type);
            }
            if (bullet.owner === player) {
              score++;
              bullet.owner.kills++;
              setBanner("ELIMINATION +1");
            } else if (actor === player) {
              endGame(false);
            } else if (mode === "territory" && actor.team === "blue") {
              setBanner("ALLY DOWN");
            }
          }
          break;
        }
      }
      if (hit) {
        entityGroup.remove(bullet.mesh);
        bullets.splice(i, 1);
      }
    }
  }

  function updatePickups(dt) {
    for (let i = pickups.length - 1; i >= 0; i--) {
      const pickup = pickups[i];
      pickup.age += dt;
      pickup.mesh.position.y = .08 + Math.sin(pickup.age * 3.2) * .09;
      pickup.core.rotation.y += dt * 1.8;
      for (const actor of [player, ...bots]) {
        if (pickup.age >= 20 || !actor || !actor.alive || distance(actor, pickup) >= actor.radius + 16) continue;
        if (actor.isPlayer && pickup.type === "health" && actor.health < actor.maxHealth) {
          const recovered = Math.min(35, actor.maxHealth - actor.health);
          actor.health += recovered;
          setBanner(`HEALTH +${Math.ceil(recovered)}`);
          pickup.age = 20;
        } else if (actor.isPlayer && pickup.type === "ammo" && reserveAmmo < 240) {
          const collected = Math.min(60, 240 - reserveAmmo);
          reserveAmmo += collected;
          setBanner(`AMMO +${collected}`);
          pickup.age = 20;
        } else if (!actor.isPlayer && pickup.type === "health" && actor.health < actor.maxHealth) {
          actor.health = Math.min(actor.maxHealth, actor.health + 35);
          pickup.age = 20;
        } else if (!actor.isPlayer && pickup.type === "ammo" &&
            (actor.ammo < 24 || actor.reserveAmmo < 96)) {
          actor.reserveAmmo = Math.min(96, actor.reserveAmmo + 48);
          if (actor.ammo < 24 && actor.reloadTimer <= 0) actor.reloadTimer = 1.1;
          pickup.age = 20;
        }
        if (pickup.age >= 20) break;
      }
      if (pickup.age >= 20) {
        entityGroup.remove(pickup.mesh);
        disposeObject(pickup.mesh);
        pickups.splice(i, 1);
      }
    }
  }

  function updateZoneAppearance(zone) {
    const visual = zoneVisuals.find(item => item.zone === zone);
    if (!visual) return;
    const color = zone.owner === "blue" ? COLORS.blue : zone.owner === "red" ? COLORS.red : COLORS.lime;
    visual.ring.material.color.setHex(color);
    visual.ring.material.emissive.setHex(color);
    visual.flag.material.color.setHex(color);
    visual.flag.material.emissive.setHex(color);
  }

  function updateTerritory(dt) {
    if (mode !== "territory") return;
    for (const zone of zones) {
      let blue = 0, red = 0;
      for (const actor of [player, ...bots]) {
        if (!actor || !actor.alive || distance(actor, zone) > zone.r) continue;
        if (actor.team === "blue") blue++;
        else red++;
      }
      if (blue !== red) zone.progress = clamp(zone.progress + (blue > red ? 1 : -1) * dt * .24, -1, 1);
      if (zone.progress >= 1 && zone.owner !== "blue") {
        zone.owner = "blue";
        updateZoneAppearance(zone);
        setBanner("ZONE CAPTURED");
      }
      if (zone.progress <= -1 && zone.owner !== "red") {
        zone.owner = "red";
        updateZoneAppearance(zone);
        setBanner("ZONE LOST");
      }
      if (zone.owner === "blue") territoryScore.blue += dt * .36;
      if (zone.owner === "red") territoryScore.red += dt * .36;
    }
    if (territoryScore.blue >= 100) endGame(true);
    else if (territoryScore.red >= 100) endGame(false);
  }

  function updateSurvival(dt) {
    if (mode !== "survival") return;
    botSpawnClock += dt;
    if (bots.length === 0 || botSpawnClock > Math.max(4, 12 - wave * .5)) {
      botSpawnClock = 0;
      wave++;
      for (let i = 0; i < Math.min(3 + Math.floor(wave / 2), 8); i++) spawnBot(i);
      setBanner(`WAVE ${wave}`);
    }
  }

  function updateWaves(dt) {
    if (mode !== "waves" || bots.length > 0) return;
    if (waveIntermission <= 0) {
      awardCredits(10, `WAVE ${wave} CLEARED`);
      if (wave >= MAX_WAVES) {
        endGame(true);
        return;
      }
      waveIntermission = 3;
      return;
    }
    waveIntermission = Math.max(0, waveIntermission - dt);
    if (waveIntermission === 0) spawnWave(wave + 1);
  }

  function updateActorModels() {
    for (const actor of [player, ...bots]) {
      if (!actor || !actor.model) continue;
      actor.model.visible = actor.alive && !(actor.isPlayer && isDesktopFirstPerson());
      if (!actor.alive) continue;
      const model = actor.model;
      model.position.set(toX(actor.x), 0, toZ(actor.y));
      model.rotation.y = -actor.angle - Math.PI / 2;
      const parts = model.userData.parts;
      const moving = actor.isPlayer
        ? (keys.has("w") || keys.has("a") || keys.has("s") || keys.has("d") ||
          keys.has("arrowup") || keys.has("arrowdown") || keys.has("arrowleft") || keys.has("arrowright") ||
          touchMove.id !== null)
        : true;
      const stride = moving ? Math.sin(actor.anim) * .58 : Math.sin(actor.anim) * .035;
      parts.legPivots[0].rotation.x = stride;
      parts.legPivots[1].rotation.x = -stride;
      for (const arm of parts.armLinks) {
        const shoulder = [arm.side * .34, 1.4, -.02];
        const elbow = arm.side > 0 ? [.27, 1.39, -.49] : [-.22, 1.46, -.56];
        const hand = arm.side > 0 ? [.06, 1.16, -.42] : [.06, 1.345, -.91];
        poseArmBone(arm.upperArm, shoulder, elbow, .39);
        poseArmBone(arm.lowerArm, elbow, hand, .35);
      }
      const flash = actor.hitFlash > 0 && Math.floor(actor.hitFlash * 40) % 2 === 0;
      parts.torso.material.emissive.setHex(flash ? 0xff3636 : 0x000000);
      parts.head.material.emissive.setHex(flash ? 0xff3636 : 0x000000);
    }
  }

  function isDesktopFirstPerson() {
    return matchMedia("(pointer: fine)").matches;
  }

  function updateCamera(dt) {
    const angle = player && isDesktopFirstPerson() ? mouseLook.yaw : player ? player.angle : .45;
    cameraAngle = angle;
    const targetX = player ? toX(player.x) : 0;
    const targetZ = player ? toZ(player.y) : 0;
    const forwardX = Math.cos(angle);
    const forwardZ = Math.sin(angle);
    const firstPerson = player && isDesktopFirstPerson() && screen !== "menu";
    const desired = firstPerson
      ? new THREE.Vector3(targetX, 1.58, targetZ)
      : new THREE.Vector3(targetX - forwardX * 8.2, 5.8, targetZ - forwardZ * 8.2);
    if (screen === "menu" && !player) desired.set(4, 8, 10);
    const follow = 1 - Math.exp(-Math.max(dt, 0) * 5.5);
    if (firstPerson) camera.position.copy(desired);
    else camera.position.lerp(desired, follow);
    if (!firstPerson && player) {
      const origin = new THREE.Vector3(targetX, 1.45, targetZ);
      const offset = desired.clone().sub(origin);
      const boomLength = offset.length();
      offset.normalize();
      cameraRaycaster.set(origin, offset);
      cameraRaycaster.far = boomLength;
      const blockers = cameraRaycaster.intersectObjects(cameraBlockers, true);
      if (blockers.length) {
        const safeDistance = Math.max(1.6, blockers[0].distance - .45);
        camera.position.copy(origin).addScaledVector(offset, safeDistance);
      }
    }
    const pitch = firstPerson ? mouseLook.pitch : 0;
    const lookAt = firstPerson
      ? new THREE.Vector3(
        targetX + forwardX * Math.cos(pitch) * 8,
        1.58 + Math.sin(pitch) * 8,
        targetZ + forwardZ * Math.cos(pitch) * 8
      )
      : new THREE.Vector3(targetX + forwardX * 2.1, 1.25, targetZ + forwardZ * 2.1);
    camera.lookAt(lookAt);
    if (firstPerson) {
      camera.near = .025;
      camera.updateProjectionMatrix();
    } else if (camera.near !== .1) {
      camera.near = .1;
      camera.updateProjectionMatrix();
    }
    shell.classList.toggle("first-person", Boolean(firstPerson));
    if (firstPersonWeapon) firstPersonWeapon.visible = Boolean(firstPerson && screen === "playing");
  }

  function updateHud() {
    if (!player) return;
    ui.health.textContent = Math.max(0, Math.ceil(player.health));
    ui.healthMeter.style.width = `${clamp(player.health, 0, 100)}%`;
    ui.healthMeter.style.background = player.health < 35 ? "#ff766d" : "#d8ff57";
    ui.ammo.textContent = reloadTimer > 0 ? "RELOADING" : String(magazine).padStart(2, "0");
    ui.reserve.textContent = String(reserveAmmo).padStart(3, "0");
    ui.staminaMeter.style.width = `${stamina}%`;
    ui.staminaMeter.classList.toggle("draining", sprinting);
    ui.reload.disabled = reloadTimer > 0 || magazine === 30 || reserveAmmo <= 0;
    ui.reload.textContent = reloadTimer > 0
      ? "RELOADING…"
      : matchMedia("(pointer: coarse)").matches ? "RELOAD" : "RELOAD · R";
    ui.clock.textContent = `${String(Math.floor(elapsed / 60)).padStart(2, "0")}:${String(Math.floor(elapsed % 60)).padStart(2, "0")}`;
    if (mode === "ffa") {
      ui.objective.innerHTML = `ELIMINATIONS <b>${score}</b>`;
      ui.subtitle.textContent = `${bots.filter(b => b.alive).length} opponents in the arena`;
    } else if (mode === "survival") {
      ui.objective.innerHTML = `WAVE <b>${wave}</b>`;
      ui.subtitle.textContent = `${score} bots eliminated`;
    } else if (mode === "waves") {
      ui.objective.innerHTML = `WAVE <b>${wave}/${MAX_WAVES}</b>`;
      ui.subtitle.textContent = bots.length
        ? `${bots.length} enemies remaining`
        : wave >= MAX_WAVES ? "Final wave cleared!"
        : `Next wave in ${Math.ceil(waveIntermission)}s`;
    } else {
      ui.objective.innerHTML = `BLUE <b>${Math.floor(territoryScore.blue)}</b> — RED <b>${Math.floor(territoryScore.red)}</b>`;
      ui.subtitle.textContent = "Hold zones to score · first to 100 wins";
    }
  }

  function update(dt) {
    if (screen !== "playing") return;
    elapsed += dt;
    updatePlayer(dt);
    updateBots(dt);
    separateActors();
    updateBullets(dt);
    updatePickups(dt);
    if (screen !== "playing") return;
    if (mode === "ffa" && bots.length === 0) {
      endGame(true);
      return;
    }
    updateTerritory(dt);
    if (screen !== "playing") return;
    updateSurvival(dt);
    updateWaves(dt);
    if (screen !== "playing") return;
    for (const actor of [player, ...bots]) if (actor) actor.hitFlash = Math.max(0, actor.hitFlash - dt);
    for (let i = particles.length - 1; i >= 0; i--) {
      const particle = particles[i];
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.vx *= .96;
      particle.vy *= .96;
      particle.life -= dt;
      particle.mesh.position.set(toX(particle.x), .4 + (1 - particle.life / particle.max) * .75, toZ(particle.y));
      particle.mesh.material.opacity = clamp(particle.life / particle.max, 0, 1);
      if (particle.life <= 0) {
        entityGroup.remove(particle.mesh);
        disposeObject(particle.mesh);
        particles.splice(i, 1);
      }
    }
    if (messageTimer > 0) messageTimer -= dt;
    updateActorModels();
    updateHud();
  }

  function animate(now) {
    const dt = Math.min((now - lastTime) / 1000 || 0, .04);
    lastTime = now;
    update(dt);
    updateCamera(dt);
    if (renderer && scene && camera) renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  document.querySelectorAll(".mode-option").forEach(button => button.addEventListener("click", () => {
    document.querySelectorAll(".mode-option").forEach(option => option.classList.toggle("selected", option === button));
    mode = button.dataset.mode;
  }));
  ui.humanCheck.addEventListener("click", () => {
    ui.humanCheck.setAttribute("aria-pressed", "true");
    ui.humanCheck.classList.add("verified");
    ui.humanStatus.textContent = "Access verified. Preparing account setup…";
    setCookie(COOKIE_NAMES.human, "1");
    window.setTimeout(showScreen, 320);
  });
  ui.accountForm.addEventListener("submit", event => {
    event.preventDefault();
    const callsign = ui.accountCallsign.value.trim().replace(/[^\p{L}\p{N} _-]/gu, "").slice(0, 18) || "Ranger";
    account = { callsign, createdAt: new Date().toISOString() };
    setCookie(COOKIE_NAMES.account, JSON.stringify(account));
    if (!getCookie(COOKIE_NAMES.progress)) setCookie(COOKIE_NAMES.progress, JSON.stringify(profile));
    ui.callsign.value = callsign;
    showScreen();
  });
  ui.shopOpen.addEventListener("click", () => {
    renderShop();
    openHubPanel(ui.shop);
  });
  document.querySelector("#shop-close").addEventListener("click", () => {
    screen = "menu";
    showScreen();
  });
  ui.avatarOpen.addEventListener("click", () => {
    renderAvatarShop();
    openHubPanel(ui.avatar);
  });
  ui.avatarClose.addEventListener("click", () => {
    screen = "menu";
    showScreen();
  });
  ui.onlineToggle.addEventListener("click", () => {
    onlineEnabled = !onlineEnabled;
    if (!onlineEnabled) closeMultiplayer();
    else setOnlineStatus("Online lobby ready · choose a mode and deploy.");
    renderHubActions();
  });
  document.querySelector("#play-button").addEventListener("click", () => startMode(mode));
  ui.callsign.addEventListener("change", () => {
    if (!account) return;
    const callsign = ui.callsign.value.trim().replace(/[^\p{L}\p{N} _-]/gu, "").slice(0, 18) || "Ranger";
    account.callsign = callsign;
    ui.callsign.value = callsign;
    setCookie(COOKIE_NAMES.account, JSON.stringify(account));
  });
  document.querySelector("#pause-button").addEventListener("click", pauseGame);
  document.querySelector("#resume-button").addEventListener("click", pauseGame);
  document.querySelector("#menu-button").addEventListener("click", () => { screen = "menu"; showScreen(); });
  document.querySelector("#again-button").addEventListener("click", () => startMode(mode));
  document.querySelector("#result-menu-button").addEventListener("click", () => { screen = "menu"; showScreen(); });
  ui.reload.addEventListener("click", reloadPlayer);

  window.addEventListener("resize", resize);
  window.addEventListener("keydown", event => {
    const key = event.key.toLowerCase();
    if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(key)) event.preventDefault();
    keys.add(key);
    if (key === "escape" || key === "p") pauseGame();
    if (key === "r" && !event.repeat) reloadPlayer();
  });
  window.addEventListener("keyup", event => keys.delete(event.key.toLowerCase()));
  window.addEventListener("blur", () => {
    keys.clear();
    pointer.down = false;
    if (screen === "playing") pauseGame();
  });
  window.addEventListener("pointermove", event => {
    if (event.pointerType === "touch") {
      const touch = touches.get(event.pointerId);
      if (!touch) return;
      if (touch.side === "move" && touchMove.id === event.pointerId) {
        const rect = canvas.getBoundingClientRect();
        const max = Math.min(86, rect.width * .17);
        touchMove.x = clamp((event.clientX - touchMove.originX) / max, -1, 1);
        touchMove.y = clamp((event.clientY - touchMove.originY) / max, -1, 1);
      }
      return;
    }
    if (screen === "playing" && isDesktopFirstPerson()) {
      mouseLook.yaw += event.movementX * .0026;
      mouseLook.pitch = clamp(mouseLook.pitch - event.movementY * .0021, -.5, .5);
      if (player) player.angle = mouseLook.yaw;
    }
  });
  canvas.addEventListener("pointerdown", event => {
    if (screen !== "playing") return;
    if (event.pointerType === "mouse" && event.button !== 0) return;
    if (event.pointerType === "touch") {
      event.preventDefault();
      canvas.setPointerCapture(event.pointerId);
      const rect = canvas.getBoundingClientRect();
      const side = event.clientX < rect.left + rect.width * .48 ? "move" : "aim";
      touches.set(event.pointerId, { side });
      if (side === "move") {
        touchMove.id = event.pointerId;
        touchMove.originX = event.clientX;
        touchMove.originY = event.clientY;
        touchMove.x = 0;
        touchMove.y = 0;
      }
    } else {
      event.preventDefault();
      if (document.pointerLockElement !== canvas) requestMouseCapture();
      pointer.down = true;
    }
  });
  function releasePointer(event) {
    if (event.pointerType === "touch") {
      touches.delete(event.pointerId);
      if (touchMove.id === event.pointerId) {
        touchMove.id = null;
        touchMove.x = 0;
        touchMove.y = 0;
      }
    } else {
      pointer.down = false;
    }
  }
  canvas.addEventListener("pointerup", releasePointer);
  canvas.addEventListener("pointercancel", releasePointer);
  document.addEventListener("pointerlockchange", () => {
    const locked = document.pointerLockElement === canvas;
    if (pointer.wasLocked && !locked && screen === "playing") {
      pointer.wasLocked = false;
      pauseGame();
      return;
    }
    pointer.wasLocked = locked;
  });

  document.querySelector("#mobile-controls").classList.remove("active");
  ui.callsign.value = account?.callsign || "Ranger";
  ui.accountCallsign.value = account?.callsign || "";
  renderShop();
  renderAvatarShop();
  renderHubActions();
  if (setupRenderer() === false) return;
  randomSeed = 7129;
  makeArena();
  showScreen();
  lastTime = performance.now();
  requestAnimationFrame(animate);
})();
