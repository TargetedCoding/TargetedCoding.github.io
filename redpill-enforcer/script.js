// ===== PARTICLE SYSTEM =====
const canvas = document.getElementById('particle-canvas');
const ctx = canvas.getContext('2d');
let particles = [];
let mouse = { x: -1000, y: -1000 };

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);
document.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });

class Particle {
    constructor() { this.reset(); }
    reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 1.5 + 0.5;
        this.speedX = (Math.random() - 0.5) * 0.3;
        this.speedY = (Math.random() - 0.5) * 0.3;
        this.opacity = Math.random() * 0.5 + 0.1;
    }
    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        const dx = mouse.x - this.x, dy = mouse.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 150) {
            this.x -= dx * 0.01;
            this.y -= dy * 0.01;
            this.opacity = Math.min(0.8, this.opacity + 0.02);
        }
        if (this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) this.reset();
    }
    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(231, 76, 76, ${this.opacity})`;
        ctx.fill();
    }
}

function initParticles() {
    const count = Math.min(80, Math.floor(window.innerWidth * window.innerHeight / 15000));
    particles = [];
    for (let i = 0; i < count; i++) particles.push(new Particle());
}
initParticles();

function drawConnections() {
    for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 120) {
                ctx.beginPath();
                ctx.moveTo(particles[i].x, particles[i].y);
                ctx.lineTo(particles[j].x, particles[j].y);
                ctx.strokeStyle = `rgba(231, 76, 76, ${0.06 * (1 - dist / 120)})`;
                ctx.lineWidth = 0.5;
                ctx.stroke();
            }
        }
    }
}

function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => { p.update(); p.draw(); });
    drawConnections();
    requestAnimationFrame(animateParticles);
}
animateParticles();

// ===== NAVBAR =====
const navbar = document.getElementById('navbar');
let lastScroll = 0;
window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 50);
    // Active nav link
    const sections = document.querySelectorAll('section[id]');
    let current = '';
    sections.forEach(s => { if (window.scrollY >= s.offsetTop - 200) current = s.id; });
    document.querySelectorAll('.nav-link').forEach(l => {
        l.classList.toggle('active', l.getAttribute('data-section') === current);
    });
    lastScroll = window.scrollY;
});

// Mobile menu
const toggle = document.getElementById('mobile-toggle');
const navLinks = document.querySelector('.nav-links');
if (toggle) {
    toggle.addEventListener('click', () => {
        navLinks.style.display = navLinks.style.display === 'flex' ? 'none' : 'flex';
        navLinks.style.position = 'absolute';
        navLinks.style.top = '100%';
        navLinks.style.left = '0';
        navLinks.style.right = '0';
        navLinks.style.flexDirection = 'column';
        navLinks.style.background = 'rgba(10,10,15,0.98)';
        navLinks.style.padding = '1rem 2rem';
        navLinks.style.gap = '1rem';
        navLinks.style.borderBottom = '1px solid var(--border)';
    });
}

// ===== STAT COUNTER ANIMATION =====
function animateCounters() {
    document.querySelectorAll('.stat-number').forEach(el => {
        const target = parseInt(el.dataset.count);
        const duration = 2000;
        const start = performance.now();
        function update(now) {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            el.textContent = Math.round(target * eased);
            if (progress < 1) requestAnimationFrame(update);
        }
        requestAnimationFrame(update);
    });
}

// ===== SCROLL REVEAL =====
const observerOptions = { threshold: 0.1, rootMargin: '0px 0px -50px 0px' };
const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
            const delay = Array.from(entry.target.parentElement.children).indexOf(entry.target) * 80;
            setTimeout(() => entry.target.classList.add('visible'), delay);
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

document.querySelectorAll('.vision-card, .timeline-item, .problem-item, .threat-card, .defense-layer, .principle-card, .roadmap-phase, .control-node, .agent-node')
    .forEach(el => observer.observe(el));

// Counter observer
const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) { animateCounters(); counterObserver.unobserve(entry.target); }
    });
}, { threshold: 0.5 });
const heroStats = document.querySelector('.hero-stats');
if (heroStats) counterObserver.observe(heroStats);

// ===== MODULE TABS =====
document.querySelectorAll('.module-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        const mod = tab.dataset.module;
        document.querySelectorAll('.module-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.module-panel').forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        const panel = document.getElementById(`panel-${mod}`);
        if (panel) panel.classList.add('active');
    });
});

// ===== TRUST GRAPH CANVAS =====
const graphCanvas = document.getElementById('graph-canvas');
if (graphCanvas) {
    const gCtx = graphCanvas.getContext('2d');
    const nodes = [
        { x: 250, y: 80, r: 18, label: 'CodeAgent', color: '#4ade80', status: 'active' },
        { x: 120, y: 170, r: 16, label: 'DevOps', color: '#4ade80', status: 'active' },
        { x: 380, y: 150, r: 16, label: 'DocAgent', color: '#facc15', status: 'warning' },
        { x: 180, y: 280, r: 14, label: 'OpsAgent', color: '#4ade80', status: 'active' },
        { x: 350, y: 270, r: 14, label: 'Rogue', color: '#f87171', status: 'quarantined' },
        { x: 80, y: 60, r: 12, label: 'User', color: '#60a5fa', status: 'user' },
        { x: 420, y: 50, r: 12, label: 'Tool:API', color: '#60a5fa', status: 'tool' },
        { x: 450, y: 200, r: 10, label: 'Tool:Git', color: '#60a5fa', status: 'tool' },
    ];
    const edges = [
        { from: 0, to: 1, color: '#60a5fa', type: 'solid' },
        { from: 0, to: 2, color: '#c084fc', type: 'solid' },
        { from: 1, to: 3, color: '#60a5fa', type: 'solid' },
        { from: 2, to: 4, color: '#f87171', type: 'dashed' },
        { from: 5, to: 0, color: '#60a5fa', type: 'solid' },
        { from: 0, to: 6, color: '#60a5fa', type: 'solid' },
        { from: 2, to: 7, color: '#60a5fa', type: 'solid' },
        { from: 3, to: 4, color: '#f87171', type: 'dashed' },
    ];
    let animOffset = 0;
    function drawGraph() {
        const dpr = window.devicePixelRatio || 1;
        const rect = graphCanvas.getBoundingClientRect();
        graphCanvas.width = rect.width * dpr;
        graphCanvas.height = rect.height * dpr;
        gCtx.scale(dpr, dpr);
        gCtx.clearRect(0, 0, rect.width, rect.height);
        const sx = rect.width / 500, sy = rect.height / 350;
        // Draw edges
        edges.forEach(e => {
            const from = nodes[e.from], to = nodes[e.to];
            gCtx.beginPath();
            gCtx.moveTo(from.x * sx, from.y * sy);
            gCtx.lineTo(to.x * sx, to.y * sy);
            gCtx.strokeStyle = e.color + '60';
            gCtx.lineWidth = 1.5;
            if (e.type === 'dashed') gCtx.setLineDash([5, 5]);
            else gCtx.setLineDash([]);
            gCtx.stroke();
            gCtx.setLineDash([]);
        });
        // Draw nodes
        nodes.forEach(n => {
            gCtx.beginPath();
            gCtx.arc(n.x * sx, n.y * sy, n.r, 0, Math.PI * 2);
            gCtx.fillStyle = n.color + '20';
            gCtx.fill();
            gCtx.strokeStyle = n.color;
            gCtx.lineWidth = 1.5;
            gCtx.stroke();
            // Glow for quarantined
            if (n.status === 'quarantined') {
                gCtx.beginPath();
                gCtx.arc(n.x * sx, n.y * sy, n.r + 4 + Math.sin(animOffset) * 3, 0, Math.PI * 2);
                gCtx.strokeStyle = n.color + '40';
                gCtx.lineWidth = 1;
                gCtx.stroke();
            }
            // Label
            gCtx.fillStyle = '#e8e8f0';
            gCtx.font = '10px Inter, sans-serif';
            gCtx.textAlign = 'center';
            gCtx.fillText(n.label, n.x * sx, n.y * sy + n.r + 14);
        });
        animOffset += 0.03;
        requestAnimationFrame(drawGraph);
    }
    // Start when visible
    const gObserver = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting) { drawGraph(); gObserver.unobserve(graphCanvas); }
    }, { threshold: 0.3 });
    gObserver.observe(graphCanvas);
}

// ===== SMOOTH SCROLL FOR NAV LINKS =====
document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
        const target = document.querySelector(a.getAttribute('href'));
        if (target) {
            e.preventDefault();
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            // Close mobile menu
            if (window.innerWidth < 768) navLinks.style.display = 'none';
        }
    });
});

// ===== GLASS CARD MOUSE TRACKING =====
document.querySelectorAll('.vision-card').forEach(card => {
    card.addEventListener('mousemove', e => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left, y = e.clientY - rect.top;
        const shine = card.querySelector('.card-shine');
        if (shine) {
            shine.style.background = `radial-gradient(circle at ${x}px ${y}px, rgba(231,76,76,0.08), transparent 60%)`;
            shine.style.opacity = '1';
        }
    });
    card.addEventListener('mouseleave', () => {
        const shine = card.querySelector('.card-shine');
        if (shine) shine.style.opacity = '0';
    });
});

// ===== CONTROL NODE HOVER EFFECTS =====
document.querySelectorAll('.control-node').forEach(node => {
    node.addEventListener('mouseenter', () => {
        node.style.boxShadow = '0 0 20px rgba(231, 76, 76, 0.15)';
    });
    node.addEventListener('mouseleave', () => {
        node.style.boxShadow = 'none';
    });
});
