/**
 * Saras Kashyap - SBR Portfolio Interactions
 * Features:
 *  1. Interactive Zipper Drag & Reveal (Click fallback)
 *  2. Scroll-Coupled Zipper Progression
 *  3. Dynamic SVG Radar Chart Morphing (Neural Storm vs. Iron Will)
 *  4. Floating Manga Sound Effects (SFX) Generator
 *  5. Intersection Observer for Race Track Timeline Nodes
 */

// Apply initial theme as early as possible to prevent flashing
const savedTheme = localStorage.getItem('theme') || 'light';
document.documentElement.setAttribute('data-theme', savedTheme);

document.addEventListener('DOMContentLoaded', () => {

  /* -------------------------------------------------------------
   * 1. ZIPPER DRAG & REVEAL INTERACTION
   * ------------------------------------------------------------- */
  const zipperTrigger = document.getElementById('zipper-reveal-trigger');
  const zipperPull = document.getElementById('zipper-pull');
  const speedLines = document.getElementById('manga-speed-lines');
  const heroSection = document.getElementById('hero');
  
  let isDragging = false;
  let startX = 0;
  let pullStartLeft = 10; // start at 10%
  let currentProgress = 10;
  let unzipped = false;

  // Track layout details
  function getTrackDetails() {
    if (!zipperTrigger) return { left: 0, width: 1000 };
    const rect = zipperTrigger.getBoundingClientRect();
    return {
      left: rect.left,
      width: rect.width
    };
  }

  // Handle setting zipper pull position
  function setZipperPosition(percent) {
    if (unzipped) return;
    currentProgress = Math.max(10, Math.min(percent, 95));
    zipperPull.style.left = `${currentProgress}%`;

    // Visual feedback: teeth splitting slightly based on pull progress
    const topTeeth = document.querySelector('.zipper-tooth-top');
    const bottomTeeth = document.querySelector('.zipper-tooth-bottom');
    
    if (topTeeth && bottomTeeth && currentProgress > 30) {
      // open teeth gradually up to the current progress point
      const openAmount = (currentProgress - 30) / 2;
      topTeeth.style.transform = `translateY(-${Math.min(openAmount, 15)}px)`;
      bottomTeeth.style.transform = `translateY(${Math.min(openAmount, 15)}px)`;
    }
  }

  // Mouse / Touch Drag Handlers
  function onDragStart(e) {
    if (unzipped) return;
    isDragging = true;
    zipperPull.classList.add('dragging');
    const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
    startX = clientX;
    
    // Get current left style percentage
    const styleLeft = zipperPull.style.left;
    pullStartLeft = styleLeft ? parseFloat(styleLeft) : 10;
    
    e.preventDefault();
  }

  function onDragMove(e) {
    if (!isDragging || unzipped) return;
    const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
    const track = getTrackDetails();
    
    // Calculate new percentage
    const deltaX = clientX - startX;
    const deltaPercent = (deltaX / track.width) * 100;
    let newPercent = pullStartLeft + deltaPercent;
    
    setZipperPosition(newPercent);

    // If dragged near the end, trigger unzip!
    if (newPercent >= 85) {
      triggerUnzip();
    }
  }

  function onDragEnd() {
    if (!isDragging) return;
    isDragging = false;
    zipperPull.classList.remove('dragging');
    
    // Snaps back if not unzipped
    if (!unzipped && currentProgress < 85) {
      animatePullBack(currentProgress, 10);
    }
  }

  function animatePullBack(from, to) {
    let start = null;
    const duration = 300; // ms
    
    function step(timestamp) {
      if (!start) start = timestamp;
      const progress = timestamp - start;
      const t = Math.min(progress / duration, 1);
      // Ease out quad
      const easedPercent = from + (to - from) * (t * (2 - t));
      setZipperPosition(easedPercent);
      
      if (progress < duration) {
        requestAnimationFrame(step);
      }
    }
    requestAnimationFrame(step);
  }

  // Click Trigger Fallback
  zipperPull.addEventListener('click', () => {
    if (!unzipped) {
      triggerUnzip();
    }
  });

  // Attach Event Listeners
  zipperPull.addEventListener('mousedown', onDragStart);
  window.addEventListener('mousemove', onDragMove);
  window.addEventListener('mouseup', onDragEnd);

  zipperPull.addEventListener('touchstart', onDragStart, { passive: false });
  window.addEventListener('touchmove', onDragMove, { passive: false });
  window.addEventListener('touchend', onDragEnd);

  // Trigger full unzip animation
  function triggerUnzip() {
    if (unzipped) return;
    unzipped = true;
    isDragging = false;
    zipperPull.classList.remove('dragging');

    // Slide pull to end
    setZipperPosition(95);

    // Flash speed lines
    speedLines.classList.add('active');
    
    // Spawn SFX text
    const rect = zipperPull.getBoundingClientRect();
    spawnSFX('ZIIIIIP!!', rect.left + window.scrollX, rect.top + window.scrollY);

    // Animate teeth fully open and unzip hero section
    const topTeeth = document.querySelector('.zipper-tooth-top');
    const bottomTeeth = document.querySelector('.zipper-tooth-bottom');
    const zipperLine = document.querySelector('.zipper-line');
    
    if (topTeeth) topTeeth.style.transform = 'translateY(-35px) rotate(-1deg)';
    if (bottomTeeth) bottomTeeth.style.transform = 'translateY(35px) rotate(1deg)';
    if (zipperLine) zipperLine.style.opacity = '0';
    
    heroSection.classList.add('unzipped');

    // Smooth scroll down to stats
    setTimeout(() => {
      const statsSection = document.getElementById('stats');
      if (statsSection) {
        statsSection.scrollIntoView({ behavior: 'smooth' });
      }
    }, 400);

    // Remove speed lines after scroll
    setTimeout(() => {
      speedLines.classList.remove('active');
    }, 1200);
  }

  /* -------------------------------------------------------------
   * 2. SCROLL-COUPLED ZIPPER PROGRESSION & MOB PROGRESS
   * ------------------------------------------------------------- */
  window.addEventListener('scroll', () => {
    // A. Zipper revealing coupling
    if (!unzipped) {
      const scrollY = window.scrollY;
      const heroHeight = heroSection.offsetHeight;
      const ratio = Math.min(scrollY / (heroHeight * 0.6), 1);
      
      if (ratio > 0.05) {
        const mappedPercent = 10 + ratio * 75;
        setZipperPosition(mappedPercent);
        
        if (mappedPercent >= 85) {
          triggerUnzip();
        }
      }
    }

    // B. Mob Limiter Progress Calculations
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    
    const fillEl = document.getElementById('limiter-fill');
    const percentEl = document.getElementById('limiter-percent');
    const limiterContainer = document.querySelector('.mob-limiter-container');
    
    // Show limiter meter when user scrolls down past the hero fold (150px)
    if (scrollTop > 150) {
      limiterContainer?.classList.add('show');
    } else {
      limiterContainer?.classList.remove('show');
    }
    
    if (fillEl && percentEl) {
      const roundedPercent = Math.min(Math.round(scrollPercent), 100);
      fillEl.style.width = `${roundedPercent}%`;
      percentEl.textContent = `${roundedPercent}%`;
    }
  });

  /* -------------------------------------------------------------
   * 3. DYNAMIC RADAR CHART MORPHING (STAND PARAMETERS)
   * ------------------------------------------------------------- */
  // Center is (200, 200). Axes length matches max radius R = 150.
  // Axis angles (0: Power, 1: Speed, 2: Range, 3: Durability, 4: Precision, 5: Potential)
  const angles = [
    -Math.PI / 2,         // 0 deg (Up)
    -Math.PI / 6,         // 60 deg (Top Right)
    Math.PI / 6,          // 120 deg (Bottom Right)
    Math.PI / 2,          // 180 deg (Down)
    5 * Math.PI / 6,      // 240 deg (Bottom Left)
    -5 * Math.PI / 6      // 300 deg (Top Left)
  ];

  // Grade radius mappings (Max radius R = 150)
  const gradeScale = {
    'S': 150,
    'A': 130,
    'B': 100,
    'C': 70,
    'D': 45,
    'E': 25
  };

  // Stand Stats data
  const standsData = {
    'neural-storm': {
      Power: 'A',
      Speed: 'A',
      Range: 'B',
      Durability: 'B',
      Precision: 'A',
      Potential: 'S'
    },
    'iron-will': {
      Power: 'S',
      Speed: 'B',
      Range: 'D',
      Durability: 'A',
      Precision: 'B',
      Potential: 'A'
    },
    'salt-splash': {
      Power: 'E',
      Speed: 'B',
      Range: 'D',
      Durability: 'C',
      Precision: 'S',
      Potential: 'E'
    }
  };

  const radarPolygon = document.getElementById('radar-data-polygon');

  // Compute polygon points string based on stats object
  function getRadarPointsString(stats) {
    const coords = [];
    const keys = ['Power', 'Speed', 'Range', 'Durability', 'Precision', 'Potential'];
    
    keys.forEach((key, index) => {
      const grade = stats[key];
      const radius = gradeScale[grade] || 70;
      const angle = angles[index];
      
      const x = 200 + radius * Math.cos(angle);
      const y = 200 + radius * Math.sin(angle);
      coords.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    });
    
    return coords.join(' ');
  }

  // Interpolate and animate polygon path
  let animationFrameId = null;
  function animateRadarChart(targetStandKey) {
    const startStats = standsData[currentStandKey];
    const targetStats = standsData[targetStandKey];
    
    const keys = ['Power', 'Speed', 'Range', 'Durability', 'Precision', 'Potential'];
    
    const startRadii = keys.map(k => gradeScale[startStats[k]]);
    const targetRadii = keys.map(k => gradeScale[targetStats[k]]);
    
    const startTime = performance.now();
    const duration = 400; // ms

    if (animationFrameId) cancelAnimationFrame(animationFrameId);

    function updatePoints(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function: cubic easeInOut
      const ease = progress < 0.5 
        ? 4 * progress * progress * progress 
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;
        
      const currentCoords = [];
      keys.forEach((key, index) => {
        const currentRadius = startRadii[index] + (targetRadii[index] - startRadii[index]) * ease;
        const angle = angles[index];
        const x = 200 + currentRadius * Math.cos(angle);
        const y = 200 + currentRadius * Math.sin(angle);
        currentCoords.push(`${x.toFixed(1)},${y.toFixed(1)}`);
      });

      radarPolygon.setAttribute('points', currentCoords.join(' '));

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(updatePoints);
      } else {
        // Update label grades text explicitly at the end
        updateGradeTexts(targetStats);
      }
    }
    
    animationFrameId = requestAnimationFrame(updatePoints);
  }

  function updateGradeTexts(stats) {
    document.getElementById('grade-power').textContent = stats.Power;
    document.getElementById('grade-speed').textContent = stats.Speed;
    document.getElementById('grade-range').textContent = stats.Range;
    document.getElementById('grade-durability').textContent = stats.Durability;
    document.getElementById('grade-precision').textContent = stats.Precision;
    document.getElementById('grade-potential').textContent = stats.Potential;
  }

  // Handle tab switching
  let currentStandKey = 'neural-storm';
  const tabButtons = document.querySelectorAll('.stand-tab-btn');
  
  tabButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const targetStand = btn.getAttribute('data-stand');
      if (targetStand === currentStandKey) return;
      
      // Update buttons active class
      tabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      // Animate profile descriptions
      const currentInfo = document.getElementById(`${currentStandKey}-info`);
      const targetInfo = document.getElementById(`${targetStand}-info`);
      
      currentInfo.classList.remove('active');
      setTimeout(() => {
        targetInfo.classList.add('active');
      }, 150);

      // Animate radar polygon morphing
      animateRadarChart(targetStand);
      
      // Trigger a light visual screen rumble
      triggerScreenRumble(150);

      // Play SFX text
      const rect = btn.getBoundingClientRect();
      let soundText = 'CLANG!';
      if (targetStand === 'neural-storm') soundText = 'RUMBLE!';
      if (targetStand === 'salt-splash') soundText = 'SALT SPLASH!';
      spawnSFX(soundText, rect.left + window.scrollX, rect.top + window.scrollY - 30);
      
      currentStandKey = targetStand;
    });
  });

  // Set initial radar points
  radarPolygon.setAttribute('points', getRadarPointsString(standsData['neural-storm']));

  /* -------------------------------------------------------------
   * 4. FLOATING MANGA SOUND EFFECTS (SFX) POPUPS
   * ------------------------------------------------------------- */
  const sfxContainer = document.getElementById('sfx-popup-container');
  const mangaSFXList = [
    'ゴゴゴゴ', 'ドドドド', 'ズキュウウウン', 'Wryyyyy!', 'オラオラ', '無駄無駄', 'メメタァ!', 'SPIN!', 
    'GOLDEN SPIRAL', 'TUSK!', 'DIRTY DEEDS', 'GRAVITY', 'CHUMIMIN~', 'SFX: WHOOSH', 'BANG!', 'BOM!'
  ];

  function spawnSFX(text, x, y) {
    const sfx = document.createElement('div');
    sfx.className = 'sfx-popup';
    sfx.textContent = text;
    sfx.style.left = `${x}px`;
    sfx.style.top = `${y}px`;
    
    // Slight randomization of parameters
    const rotation = (Math.random() * 30) - 15; // -15deg to 15deg
    const fontSize = 1.5 + Math.random() * 2; // 1.5rem to 3.5rem
    const colors = ['var(--color-pink)', 'var(--color-gold)', 'var(--color-blue)', 'var(--color-ink)'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    
    sfx.style.transform = `translate(-50%, -50%) rotate(${rotation}deg)`;
    sfx.style.fontSize = `${fontSize}rem`;
    sfx.style.color = randomColor;

    sfxContainer.appendChild(sfx);

    // Auto cleanup after animation ends
    setTimeout(() => {
      sfx.remove();
    }, 850);
  }

  // Spawns SFX when clicking anywhere on the background (except on buttons or interactive cards)
  document.body.addEventListener('click', (e) => {
    // Exclude button clicks or links to keep clean
    if (e.target.closest('a, button, .timeline-node, .zipper-pull')) return;
    
    const randomText = mangaSFXList[Math.floor(Math.random() * mangaSFXList.length)];
    spawnSFX(randomText, e.pageX, e.pageY);
  });

  // Trigger a subtle viewport shake/rumble
  function triggerScreenRumble(duration = 200) {
    document.body.style.transition = 'transform 0.05s ease-in-out';
    const startTime = performance.now();
    
    function shake(now) {
      const elapsed = now - startTime;
      if (elapsed < duration) {
        const dx = (Math.random() * 6) - 3;
        const dy = (Math.random() * 6) - 3;
        document.body.style.transform = `translate(${dx}px, ${dy}px)`;
        requestAnimationFrame(shake);
      } else {
        document.body.style.transform = 'translate(0, 0)';
        document.body.style.transition = '';
      }
    }
    requestAnimationFrame(shake);
  }

  /* -------------------------------------------------------------
   * 5. TIMELINE RACE CHECKPOINTS (INTERSECTION OBSERVER)
   * ------------------------------------------------------------- */
  const timelineNodes = document.querySelectorAll('.timeline-node');
  const timelineCards = document.querySelectorAll('.manga-panel-card');

  const observerOptions = {
    root: null,
    rootMargin: '0px 0px -15% 0px',
    threshold: 0.25
  };

  const checkpointObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const card = entry.target;
        card.classList.add('visible');
        
        // Find corresponding node
        const wrapper = card.closest('.timeline-card-wrapper');
        if (wrapper) {
          const node = wrapper.querySelector('.timeline-node');
          if (node) {
            node.style.transform = 'scale(1.25) rotate(15deg)';
            node.style.background = 'var(--color-gold-light)';
            
            // Spawn localized sound effect
            const rect = node.getBoundingClientRect();
            const nodeLabel = node.querySelector('.node-label')?.textContent || 'CHECKPOINT';
            spawnSFX(nodeLabel + '!', rect.left + window.scrollX, rect.top + window.scrollY - 30);
          }
        }
      }
    });
  }, observerOptions);

  timelineCards.forEach(card => {
    // Set initial card state
    card.style.opacity = '0';
    card.style.transform = 'translateY(40px) scale(0.95)';
    card.style.transition = 'all 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
    
    // Inject visible state styles dynamically in code for simplicity
    const styleTag = document.createElement('style');
    styleTag.textContent = `
      .manga-panel-card.visible {
        opacity: 1 !important;
        transform: translateY(0) scale(1) !important;
      }
    `;
    document.head.appendChild(styleTag);
    
    checkpointObserver.observe(card);
  });

  // Attach hover sounds to timeline cards specifically
  timelineCards.forEach(card => {
    card.addEventListener('mouseenter', (e) => {
      const randomSFX = ['GO GO GO!', 'MENACING', 'ドドドド', 'ゴゴゴゴ'][Math.floor(Math.random() * 4)];
      const rect = card.getBoundingClientRect();
      spawnSFX(randomSFX, rect.right + window.scrollX - 20, rect.top + window.scrollY + 10);
    });
  });

  /* -------------------------------------------------------------
   * 6. SCROLL TO TOP & ADDITIONAL HELPERS
   * ------------------------------------------------------------- */
  const scrollTopBtn = document.getElementById('scroll-top-btn');
  if (scrollTopBtn) {
    scrollTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* -------------------------------------------------------------
   * 7. IMMERSIVE SHOWDOWN SPEED LINES CANVAS
   * ------------------------------------------------------------- */
  const canvas = document.getElementById('showdown-canvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    window.addEventListener('resize', () => {
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    });

    const lines = [];
    const numLines = 50;

    // Initialize lines
    for (let i = 0; i < numLines; i++) {
      lines.push({
        angle: Math.random() * Math.PI * 2,
        length: 20 + Math.random() * 80,
        speed: 0.05 + Math.random() * 0.1,
        dist: 50 + Math.random() * 150,
        width: 1 + Math.random() * 2
      });
    }

    let mouseX = width / 2;
    let mouseY = height / 2;

    const showdownBox = document.querySelector('.showdown-box');
    if (showdownBox) {
      showdownBox.addEventListener('mousemove', (e) => {
        const rect = showdownBox.getBoundingClientRect();
        mouseX = e.clientX - rect.left;
        mouseY = e.clientY - rect.top;
      });
      showdownBox.addEventListener('mouseleave', () => {
        mouseX = width / 2;
        mouseY = height / 2;
      });
    }

    function drawSpeedLines() {
      ctx.clearRect(0, 0, width, height);

      const isLimiterBreak = document.body.classList.contains('limiter-break');
      ctx.strokeStyle = isLimiterBreak ? 'rgba(0, 255, 204, 0.45)' : 'rgba(17, 17, 17, 0.7)';

      lines.forEach((line) => {
        line.dist += line.speed * 15;
        if (line.dist > Math.max(width, height)) {
          line.dist = 20 + Math.random() * 50;
          line.angle = Math.random() * Math.PI * 2;
          line.length = 20 + Math.random() * 80;
          line.width = 1 + Math.random() * 2;
        }

        const startX = mouseX + Math.cos(line.angle) * line.dist;
        const startY = mouseY + Math.sin(line.angle) * line.dist;
        const endX = mouseX + Math.cos(line.angle) * (line.dist + line.length);
        const endY = mouseY + Math.sin(line.angle) * (line.dist + line.length);

        ctx.lineWidth = line.width;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
      });

      requestAnimationFrame(drawSpeedLines);
    }

    drawSpeedLines();
  }

  /* -------------------------------------------------------------
   * 8. DARK / LIGHT MODE THEME SWITCHER
   * ------------------------------------------------------------- */
  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const theme = document.documentElement.getAttribute('data-theme');
      const newTheme = theme === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('theme', newTheme);
      
      // Jitter screen slightly for dynamic SBR action feel!
      Z(120);
    });
  }
});
