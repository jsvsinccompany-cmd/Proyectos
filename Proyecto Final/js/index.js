// JS para landing: animaciones GSAP, menú, lightbox y comportamiento UX
let __lastFocusedBeforeModal = null;
function trapFocus(modal){
	const focusables = modal.querySelectorAll('button, [href], input, textarea, [tabindex]:not([tabindex="-1"])');
	if(!focusables.length) return;
	const first = focusables[0];
	const last = focusables[focusables.length-1];
	modal.addEventListener('keydown', (e)=>{
		if(e.key === 'Tab'){
			if(e.shiftKey){
				if(document.activeElement === first){e.preventDefault(); last.focus();}
			} else {
				if(document.activeElement === last){e.preventDefault(); first.focus();}
			}
		}
	});
}
document.addEventListener('DOMContentLoaded', () => {
	// Footer year
	const yearEl = document.getElementById('year');
	if (yearEl) yearEl.innerText = new Date().getFullYear();

	// Toggle nav (mobile)
	const toggle = document.getElementById('toggleNav');
	const nav = document.getElementById('nav');

	// Use a single pointer/touch handler for the hamburger to avoid duplicate toggles
	function toggleNavHandler(e) {
		// preventDefault so the click/pointer sequence doesn't trigger default focus/behavior
		e && e.preventDefault();
		if (!nav || !toggle) return;
		const isOpen = nav.classList.toggle('open');
		toggle.classList.toggle('open');
		toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
	}

	if (toggle) {
		// pointerdown covers mouse and touch in modern browsers; add touchstart for older devices
		toggle.addEventListener('pointerdown', toggleNavHandler, { passive: false });
		toggle.addEventListener('touchstart', toggleNavHandler, { passive: false });
	}

	// Some older browsers may not fire pointerdown reliably; add a guarded click fallback.
	if (toggle) {
		toggle.addEventListener('click', (e) => {
			// If pointer handler just toggled, suppress the immediate click to avoid double-toggle
			if (window.__suppressToggleClick) { e.preventDefault(); return; }
			// Otherwise call the same handler
			toggleNavHandler(e);
		});
	}

	// When pointerdown toggles, briefly suppress the next click to avoid double toggles
	const originalToggleNavHandler = toggleNavHandler;
	toggleNavHandler = function(e) {
		window.__suppressToggleClick = true;
		setTimeout(() => { window.__suppressToggleClick = false; }, 350);
		originalToggleNavHandler(e);
	};

	// Smooth scroll for anchor links
	document.querySelectorAll('a[href^="#"]').forEach(a => {
		a.addEventListener('click', (e) => {
			const href = a.getAttribute('href');
			if (href && href.startsWith('#')) {
				e.preventDefault();
				const el = document.querySelector(href);
				if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
				// close mobile nav when clicking
				if (nav.classList.contains('open')) { nav.classList.remove('open'); toggle.classList.remove('open'); }
			}
		})
	});

	// Fallback: en pantallas pequeñas, si el menú está oculto por CSS y el toggle no funciona,
	// forzamos abrir el nav para que el usuario vea las opciones. Esto se ejecuta solo una vez al cargar.
	(function mobileNavFallback(){
		try{
			const mq = window.matchMedia('(max-width: 980px)');
			if(!mq.matches) return;
			const nav = document.getElementById('nav');
			if(!nav) return;
			const ul = nav.querySelector('ul');
			if(!ul) return;
			const styles = getComputedStyle(ul);
			if(styles.display === 'none'){
				nav.classList.add('open');
				const toggle = document.getElementById('toggleNav');
				toggle?.classList.add('open');
				toggle?.setAttribute('aria-expanded','true');
			}
		} catch(e) { console.warn('mobileNavFallback failed', e); }
	})();

	// Lightbox functionality
	const lightbox = document.getElementById('lightbox');
	const lightboxImg = document.getElementById('lightboxImg');
	const lightboxCaption = document.getElementById('lightboxCaption');
	const lightboxClose = document.getElementById('lightboxClose');

	function openLightbox(src, caption) {
		if (!lightbox) return;
		lightboxImg.src = src;
		lightboxImg.setAttribute('decoding','async');
		lightboxImg.setAttribute('loading','eager');
		lightboxCaption.textContent = caption || '';
		if(!lightboxImg.alt || lightboxImg.alt.trim()==='') lightboxImg.alt = caption || 'Imagen ampliada';
		lightbox.setAttribute('aria-hidden', 'false');

		// Set up Order button inside lightbox (use caption or filename)
		try {
			const orderBtn = document.getElementById('lightboxOrderBtn');
			if (orderBtn) {
				let label = caption || '';
				if (!label) {
					const parts = String(src).split('/');
					label = decodeURIComponent(parts[parts.length-1] || 'producto');
				}
				const waText = encodeURIComponent(`Hola, quisiera información y/o ordenar: ${label}`);
				orderBtn.href = `https://wa.me/5214777010587?text=${waText}`;
				orderBtn.style.display = 'inline-flex';
			}
		} catch(e) { /* ignore */ }
		// push history state so mobile 'back' can close the lightbox instead of navigating away
		try {
			if (!history.state || history.state.modal !== 'lightbox') {
				history.pushState({ modal: 'lightbox' }, '');
				window.__lightboxHistoryPushed = true;
			}
		} catch (e) {}
		// animate appearance
		gsap.fromTo(lightboxImg, { scale: 0.95, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.45, ease: 'power3.out' });
	}
	function closeLightbox() {
		if (!lightbox) return;
		lightbox.setAttribute('aria-hidden', 'true');
		lightboxImg.src = '';
		lightboxCaption.textContent = '';
		// if we pushed a history entry for this lightbox, go back once to restore history
		try {
			if (window.__lightboxHistoryPushed) {
				window.__lightboxHistoryPushed = false;
				history.back();
			}
		} catch (e) {}
	}
	lightboxClose?.addEventListener('click', closeLightbox);
	lightbox?.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });

	// Attach click to portfolio images
	function attachLightboxTo(img) { img.addEventListener('click', () => openLightbox(img.src, img.alt || img.title || '')) }
	document.querySelectorAll('.portfolio-item img').forEach(img => attachLightboxTo(img));

	// Autoload portfolio images if they follow naming convention portfolio-1.jpg etc.
	(function autoLoadPortfolio() {
		fetch('img/portfolio-manifest.json')
			.then(r => r.json())
			.then(data => {
				if (!Array.isArray(data)) return;
				
				// Cargar el menú completo
				loadMenuItems(data);
				
				// Configurar filtros
				setupMenuFilters(data);
			})
			.catch(err => {
				console.warn('No se pudo cargar el menú:', err);
			});
	})();

	// Función para cargar items del menú
	function loadMenuItems(items) {
		const menuGrid = document.getElementById('menuGrid');
		if (!menuGrid) return;
		
		menuGrid.innerHTML = '';
		
		items.forEach((item, index) => {
			const menuItem = document.createElement('div');
			menuItem.className = 'menu-item';
			menuItem.setAttribute('data-category', item.category);
			menuItem.style.animationDelay = `${index * 0.05}s`;
			
			// Mensaje dinámico WhatsApp para botón rápido
			const templates = {
				'Platillos': 'Hola, me interesa el platillo:',
				'Postres': 'Hola, me interesa el postre:',
				'Dulces': 'Hola, quisiera información sobre el dulce:',
				'Centros de Mesa': 'Hola, quisiera cotizar el centro de mesa:'
			};
			const base = templates[item.category] || 'Hola, me interesa:';
			const waText = encodeURIComponent(`${base} ${item.title}`);
			const waHref = `https://wa.me/5214777010587?text=${waText}`;

			menuItem.innerHTML = `
				<div class="menu-item-image">
					<img src="img/${item.src}" alt="${item.alt}" loading="lazy" />
					<span class="menu-item-category">${item.category}</span>
					<div class="menu-item-view" title="Ver">
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
							<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
							<circle cx="12" cy="12" r="3"></circle>
						</svg>
					</div>
					<a class="menu-item-order" href="${waHref}" target="_blank" rel="noopener noreferrer" title="Ordenar por WhatsApp" aria-label="Ordenar por WhatsApp">
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden="true">
							<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
						</svg>
					</a>
				</div>
				<div class="menu-item-info">
					<h3 class="menu-item-title">${item.title}</h3>
					<p class="menu-item-description">${item.description}</p>
				</div>
			`;

			// Attach lightbox behavior to the newly created menu image so taps open the modal
			const createdImg = menuItem.querySelector('.menu-item-image img');
			if (createdImg) {
				createdImg.style.cursor = 'zoom-in';
				// Use the existing helper to attach lightbox
				try { attachLightboxTo(createdImg); } catch(e) { createdImg.addEventListener('click', () => openLightbox(createdImg.src, createdImg.alt || '')); }
			}
			
			// Click para abrir modal
			menuItem.addEventListener('click', () => {
				openMenuModal(item);
			});

			// Evitar abrir modal al hacer click en ordenar
			menuItem.querySelector('.menu-item-order')?.addEventListener('click', (e) => {
				e.stopPropagation();
			});
			
			menuGrid.appendChild(menuItem);
		});
	}

	// Push state when opening menu modal so back button closes it

	// Wrap original openMenuModal to push history
	const _openMenuModal = openMenuModal;
	openMenuModal = function(item) {
		_openMenuModal(item);
		try {
			if (!history.state || history.state.modal !== 'menu') {
				history.pushState({ modal: 'menu' }, '');
				window.__menuHistoryPushed = true;
			}
		} catch (e) {}
	}

	// Función para configurar filtros
	function setupMenuFilters(items) {
		const filterBtns = document.querySelectorAll('.filter-btn');
		const menuItems = document.querySelectorAll('.menu-item');
		// Inicializar aria-pressed
		filterBtns.forEach(btn=>btn.setAttribute('aria-pressed', btn.classList.contains('active') ? 'true' : 'false'));
		const statusRegion = document.getElementById('menuStatus');
		
		filterBtns.forEach(btn => {
			btn.addEventListener('click', () => {
				const filter = btn.getAttribute('data-filter');
				
				// Actualizar botón activo + aria-pressed
				filterBtns.forEach(b => b.classList.remove('active'));
				btn.classList.add('active');
				filterBtns.forEach(b => b.setAttribute('aria-pressed', b.classList.contains('active') ? 'true' : 'false'));
				
				// Filtrar items con animación
				menuItems.forEach((item, index) => {
					const category = item.getAttribute('data-category');
					
					if (filter === 'all' || category === filter) {
						item.setAttribute('data-hidden', 'false');
						item.style.animation = 'none';
						setTimeout(() => {
							item.style.animation = `fadeInScale 0.5s ease-out ${index * 0.05}s backwards`;
						}, 10);
					} else {
						item.setAttribute('data-hidden', 'true');
					}
				});
				// Anunciar resultado accesible
				if(statusRegion){
					const visibles = [...menuItems].filter(i=>i.getAttribute('data-hidden')==='false');
					statusRegion.textContent = `Mostrando ${visibles.length} elemento(s) para: ${filter==='all'?'todas las categorías':filter}.`;
				}
			});
		});
	}

	// Función para abrir modal del menú
	function openMenuModal(item) {
		const modal = document.getElementById('menuModal');
		if (!modal) return;
		
		const img = document.getElementById('menuModalImg');
		const category = document.getElementById('menuModalCategory');
		const title = document.getElementById('menuModalTitle');
		const desc = document.getElementById('menuModalDesc');
		const orderBtn = document.getElementById('menuOrderBtn');
		
		img.src = `img/${item.src}`;
		img.alt = item.alt;
		category.textContent = item.category;
		title.textContent = item.title;
		desc.textContent = item.description;

		// Mensaje dinámico de WhatsApp según categoría
		if (orderBtn) {
			const templates = {
				'Platillos': 'Hola, me interesa el platillo:',
				'Postres': 'Hola, me interesa el postre:',
				'Dulces': 'Hola, quisiera información sobre el dulce:',
				'Centros de Mesa': 'Hola, quisiera cotizar el centro de mesa:'
			};
			const base = templates[item.category] || 'Hola, me interesa:';
			const text = encodeURIComponent(`${base} ${item.title}`);
			orderBtn.href = `https://wa.me/5214777010587?text=${text}`;
		}
		
		modal.setAttribute('aria-hidden', 'false');
		animateModalOpen(modal);
	}

	// GSAP entrance animations — respetando preferencias de motion
	try {
		const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		if (!prefersReducedMotion) {
			gsap.from('.hero-title', { y: 30, opacity: 0, duration: 0.9, ease: 'power3.out' });
			gsap.from('.hero-sub', { y: 20, opacity: 0, duration: 0.9, delay: 0.15, ease: 'power3.out' });
			gsap.from('.hero-media img', { scale: 0.96, opacity: 0, duration: 0.9, delay: 0.25, ease: 'power3.out' });
			gsap.from('.service', { y: 20, opacity: 0, stagger: 0.12, duration: 0.65, delay: 0.2 });
			gsap.from('.menu-item', { y: 12, opacity: 0, stagger: 0.08, duration: 0.6, delay: 0.3 });
			gsap.from('.testimonial', { y: 12, opacity: 0, stagger: 0.08, duration: 0.6, delay: 0.45 });
		}
	} catch (err) {
		// If GSAP not loaded, safely ignore
		console.warn('GSAP no disponible', err);
	}
});

// Modal helpers
function openModal(modalId) {
	const m = document.getElementById(modalId);
	if (!m) return;
	m.setAttribute('aria-hidden', 'false');
}
function closeModal(modalId) {
	const m = document.getElementById(modalId);
	if (!m) return;
	m.setAttribute('aria-hidden', 'true');
}

// Close open modals/nav when the history changes (back button)
window.addEventListener('popstate', (e) => {
	try {
		// Close lightbox if open
		const lb = document.getElementById('lightbox');
		if (lb && lb.getAttribute('aria-hidden') === 'false') {
			// avoid calling history.back() again
			window.__lightboxHistoryPushed = false;
			closeLightbox();
			return;
		}

		// Close menu modal if open
		const mm = document.getElementById('menuModal');
		const nav = document.getElementById('nav');
		const toggle = document.getElementById('toggleNav');
		if (mm && mm.getAttribute('aria-hidden') === 'false') {
			window.__menuHistoryPushed = false;
			animateModalClose(mm);
			return;
		}
		if (nav && nav.classList.contains('open')) {
			nav.classList.remove('open');
			toggle?.classList.remove('open');
			toggle?.setAttribute('aria-expanded','false');
			return;
		}
	} catch (err) { /* ignore */ }
});

// Animated modal open/close using GSAP
function animateModalOpen(modal) {
	if (!modal) return;
	const content = modal.querySelector('.modal-content');
	try {
		__lastFocusedBeforeModal = document.activeElement;
		modal.setAttribute('aria-hidden', 'false');
		gsap.fromTo(content, { scale: 0.98, y: 10, opacity: 0 }, { scale: 1, y: 0, opacity: 1, duration: 0.45, ease: 'power3.out' });
		trapFocus(modal);
		// Foco inicial
		setTimeout(()=>{
			const first = content.querySelector('h3, [aria-label], button, a, input, textarea');
			first?.focus();
		},60);
	} catch (e) { modal.setAttribute('aria-hidden', 'false'); }
}
function animateModalClose(modal) {
	if (!modal) return;
	const content = modal.querySelector('.modal-content');
	try {
		gsap.to(content, { scale: 0.98, y: 10, opacity: 0, duration: 0.32, ease: 'power3.in', onComplete: () => { modal.setAttribute('aria-hidden', 'true'); __lastFocusedBeforeModal?.focus(); } });
	} catch (e) { modal.setAttribute('aria-hidden', 'true'); }
}

// Setup modal events after DOM loaded
document.addEventListener('DOMContentLoaded', () => {
	// Contact modal open
	const openContact = document.getElementById('openContactForm');
	const closeContact = document.getElementById('closeContactModal');
	const contactCancel = document.getElementById('contactCancel');
	openContact?.addEventListener('click', (e)=>{e.preventDefault(); animateModalOpen(document.getElementById('contactModal'));});
	closeContact?.addEventListener('click', ()=>animateModalClose(document.getElementById('contactModal')));
	contactCancel?.addEventListener('click', ()=>animateModalClose(document.getElementById('contactModal')));
	document.querySelectorAll('.modal-close').forEach(b => b.addEventListener('click', (e)=>{const parent = e.target.closest('.modal'); if (parent) parent.setAttribute('aria-hidden', 'true');}));

	document.getElementById('openPrivacy')?.addEventListener('click', (e) => { e.preventDefault(); animateModalOpen(document.getElementById('privacyModal'));});
	document.getElementById('openTerms')?.addEventListener('click', (e) => { e.preventDefault(); animateModalOpen(document.getElementById('termsModal'));});
	document.getElementById('closePrivacyModal')?.addEventListener('click', ()=>animateModalClose(document.getElementById('privacyModal')));
	document.getElementById('closeTermsModal')?.addEventListener('click', ()=>animateModalClose(document.getElementById('termsModal')));

	// Contact form behavior
	const contactForm = document.getElementById('contactForm');
	contactForm?.addEventListener('submit', (e)=>{
		e.preventDefault();
		const data = new FormData(contactForm);
		const name = data.get('name');
		const email = data.get('email');
		const msg = data.get('message');
		// Compose mailto or WhatsApp link
		const subject = encodeURIComponent(`Contacto desde web: ${name}`);
		const body = encodeURIComponent(`Nombre: ${name}%0AEmail: ${email}%0A%0A${msg}`);
		// Open mailto
		const mailto = `mailto:contacto@viruchasalomon.com?subject=${subject}&body=${body}`;
		window.open(mailto, '_blank');
		// Close modal
		animateModalClose(document.getElementById('contactModal'));
	});
	// Dish modal behavior
	function bindDishButtons() {
		document.querySelectorAll('.js-dish-detail').forEach(btn => {
			if (btn.__dishBound) return; btn.__dishBound = true;
			btn.addEventListener('click', (e) => {
				e.preventDefault();
				const parent = btn.closest('.card.service');
				const data = parent?.getAttribute('data-dish');
				let d = null;
				if (data) {
					try { d = JSON.parse(data); } catch (err) { console.warn('dish modal parse', err); }
				}
				// fallback: if there is no data-dish, try to parse DOM contents
				if (!d && parent) {
					const titleEl = parent.querySelector('h3');
					const descEl  = parent.querySelector('p');
					const imgEl   = parent.querySelector('.service-media img');
					d = {
						title: titleEl?.innerText || 'Especialidad',
						desc: descEl?.innerText || '',
						img: imgEl?.getAttribute('src')?.replace(/^img\//,'') || ''
					};
				}
				if (!d) return;
				document.getElementById('dishTitle').innerText = d.title; document.getElementById('dishDesc').innerText = d.desc;
				if (d.img) document.getElementById('dishMediaImg').src = `img/${d.img}`; document.getElementById('dishMediaImg').alt = d.title || '';
				document.getElementById('dishOrderBtn').href = `https://wa.me/5214777010587?text=${encodeURIComponent('Quiero ordenar: ' + d.title)}`;
				animateModalOpen(document.getElementById('dishModal'));
			})
		});
	}
	bindDishButtons();
	document.getElementById('closeDishModal')?.addEventListener('click', ()=>animateModalClose(document.getElementById('dishModal')));
	document.getElementById('dishCloseBtn')?.addEventListener('click', ()=>animateModalClose(document.getElementById('dishModal')));
	
	// Menu modal behavior
	document.getElementById('closeMenuModal')?.addEventListener('click', ()=>animateModalClose(document.getElementById('menuModal')));
	document.getElementById('menuCloseBtn')?.addEventListener('click', ()=>animateModalClose(document.getElementById('menuModal')));
});

// GSAP scroll reveal using IntersectionObserver
function setupScrollReveal() {
	const revealItems = document.querySelectorAll('.section, .card, .menu-item, .testimonial');
	const io = new IntersectionObserver((entries) => {
		entries.forEach(entry => {
			if (entry.isIntersecting) {
				try { gsap.to(entry.target, { y: 0, opacity: 1, duration: 0.7, ease: 'power3.out'});} catch(e) {}
				io.unobserve(entry.target);
			}
		});
	}, { threshold: 0.15 });

	// On small screens ensure the portfolio/menu section is visible on load
	revealItems.forEach(it => {
		// If this is the portfolio/menu section, do not hide it initially — show immediately on mobile
		if (it.classList && it.classList.contains('menu-section')) {
			it.style.opacity = 1;
			it.style.transform = 'none';
			// no need to observe the portfolio container itself
			return;
		}
		// allow immediate visibility for any section that starts within the viewport
		const rect = it.getBoundingClientRect();
		if (rect.top < window.innerHeight && rect.bottom > 0) {
			it.style.opacity = 1; it.style.transform = 'none';
			// optionally animate in place
			try { gsap.to(it, { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out' }); } catch(e) {}
		} else {
			it.style.opacity = 0; it.style.transform = 'translateY(24px)';
			io.observe(it);
		}
	});
}
document.addEventListener('DOMContentLoaded', setupScrollReveal);

// Button micro-interactions using GSAP
document.addEventListener('DOMContentLoaded', () => {
	document.querySelectorAll('.btn').forEach(btn => {
		btn.addEventListener('mouseenter', () => { try { gsap.to(btn, { scale: 1.03, duration: 0.18, ease: 'power1.out' }); } catch (e) {} });
		btn.addEventListener('mouseleave', () => { try { gsap.to(btn, { scale: 1, duration: 0.18, ease: 'power1.out' }); } catch (e) {} });
	});
});

// Hero parallax: subtle movement on scroll
function setupHeroParallax() {
	const hero = document.querySelector('.hero');
	if (!hero) return;
	const img = hero.querySelector('.hero-media img');
	let last = 0; let ticking = false;
	function onScroll() {
		const rect = hero.getBoundingClientRect();
		const center = rect.top + rect.height/2 - window.innerHeight/2;
		const offset = Math.max(-100, Math.min(100, -center / 20));
		last = offset;
		if (!ticking) {
			ticking = true;
			requestAnimationFrame(() => {
				try { gsap.to(img, { y: last, duration: 0.6, ease: 'power2.out', overwrite: true }); } catch(e) {}
				ticking = false;
			});
		}
	}
	window.addEventListener('scroll', onScroll, { passive: true });
}
document.addEventListener('DOMContentLoaded', setupHeroParallax);

// Hero timeline entrance
function setupHeroTimeline() {
	const brand = document.querySelector('.hero-brand');
	const slogan = document.querySelector('.hero-slogan');
	const sub = document.querySelector('.hero-sub');
	const art = document.querySelector('.hero-art');
	const ctas = document.querySelectorAll('.hero-ctas .btn');
	if (!brand) return;
	try {
		const t = gsap.timeline({ defaults: { ease: 'power3.out' } });
		t.from(brand, { y: 48, opacity: 0, duration: 1 })
		 .from(slogan, { y: 28, opacity: 0, duration: 0.7 }, '-=0.65')
		 .from(sub, { y: 22, opacity: 0, duration: 0.75 }, '-=0.55')
		 .from(art, { scale: 0.97, opacity: 0, duration: 1 }, '-=0.8')
		 .from(ctas, { y: 14, opacity: 0, stagger: 0.12, duration: 0.5 }, '-=0.65');
	} catch (err) { console.warn('GSAP timeline fail', err); }
}
document.addEventListener('DOMContentLoaded', setupHeroTimeline);

// Timeline reveal animations (scroll-based)
function setupTimelineAnimations() {
	const items = document.querySelectorAll('.timeline-item');
	if (!items.length) return;
	items.forEach(it => {
		it.style.opacity = 0; it.style.transform = 'translateY(18px)';
	});
	const io = new IntersectionObserver((entries) => {
		entries.forEach(e => {
			if (e.isIntersecting) {
				try { gsap.to(e.target, { y: 0, opacity: 1, duration: 0.7, ease: 'power3.out' }); } catch (err) {}
				io.unobserve(e.target);
			}
		});
	}, { threshold: 0.2 });
	items.forEach(i => io.observe(i));
}
document.addEventListener('DOMContentLoaded', setupTimelineAnimations);

// Simple testimonials carousel using GSAP
function setupTestimonialsCarousel() {
	const container = document.querySelector('.testimonials-grid');
	if (!container) return;
	const items = Array.from(container.children);
	let index = 0;
	items.forEach((it, i) => {
		it.style.position = 'absolute';
		it.style.left = 0; it.style.right = 0; it.style.top = 0;
		const visible = i===0;
		it.style.opacity = visible?1:0;
		it.setAttribute('aria-hidden', visible? 'false':'true');
	});
	function showNext() {
		const current = items[index];
		index = (index + 1) % items.length;
		const next = items[index];
		current.setAttribute('aria-hidden','true');
		next.setAttribute('aria-hidden','false');
		gsap.to(current, { opacity: 0, duration: 0.6, ease: 'power2.out' });
		gsap.to(next, { opacity: 1, duration: 0.6, ease: 'power2.out' });
	}
	setInterval(showNext, 4500);
}
document.addEventListener('DOMContentLoaded', setupTestimonialsCarousel);

// Hover effects for gallery & menu items using GSAP
function setupHoverEffects() {
	document.querySelectorAll('.gallery-item img, .card').forEach(el => {
		el.addEventListener('mouseenter', () => { try { gsap.to(el, { scale: 1.03, duration: 0.25, ease: 'power1.out' }); } catch(e){} });
		el.addEventListener('mouseleave', () => { try { gsap.to(el, { scale: 1, duration: 0.25, ease: 'power1.out' }); } catch(e){} });
	});
}
document.addEventListener('DOMContentLoaded', setupHoverEffects);

// Tilt effect: subtle tilt on hover for cards and gallery items
function setupTilt() {
	const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	if (prefersReducedMotion) return;
	document.querySelectorAll('.card, .gallery-item').forEach(el => {
		el.addEventListener('mousemove', (e) => {
			const rect = el.getBoundingClientRect();
			const x = (e.clientX - rect.left) - rect.width / 2;
			const y = (e.clientY - rect.top) - rect.height / 2;
			const rx = (-y / rect.height) * 5;
			const ry = (x / rect.width) * 6;
			try { gsap.to(el, { rotationX: rx, rotationY: ry, transformPerspective: 800, scale: 1.01, duration: 0.18, ease: 'power1.out' }); } catch (err) {}
		});
		el.addEventListener('mouseleave', () => { try { gsap.to(el, { rotationX: 0, rotationY: 0, scale: 1, duration: 0.32, ease: 'power1.out' }); } catch (err) {} });
	});
}
document.addEventListener('DOMContentLoaded', setupTilt);

// Subtle pulse for hero CTA to attract attention (respects reduced motion)
function setupHeroCTAPulse() {
	const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	if (prefersReducedMotion) return;
	try {
		gsap.to('.hero .btn-primary', { scale: 1.03, y: 3, repeat: -1, yoyo: true, duration: 1.4, ease: 'sine.inOut', repeatDelay: 2 });
	} catch (e) {}
}
document.addEventListener('DOMContentLoaded', setupHeroCTAPulse);

// Subtle hero art drift for premium feel
function setupHeroArtDrift() {
	const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	if (prefersReducedMotion) return;
	try {
		gsap.to('.hero-art', { rotation: 0.6, y: 6, x: 2, duration: 8, repeat: -1, yoyo: true, ease: 'sine.inOut' });
	} catch (e) {}
}
document.addEventListener('DOMContentLoaded', setupHeroArtDrift);

// Optional: keyboard handler for escape key to close lightbox
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') {
	const lb = document.getElementById('lightbox'); if (lb && lb.getAttribute('aria-hidden') === 'false') lb.setAttribute('aria-hidden', 'true');
	// Close any open modals gracefully with animation
	document.querySelectorAll('.modal[aria-hidden="false"]').forEach(m => { try { animateModalClose(m); } catch(e) { m.setAttribute('aria-hidden', 'true'); } });
} });

// Diagnostic panel for remote debugging: only enabled when URL includes ?diag=1
function createDiagnosticPanel() {
	try {
		const show = /(?:\?|&)diag=1(?:&|$)/.test(location.search);
		if (!show) return;
		const panel = document.createElement('div');
		panel.className = 'diag-panel';
		panel.innerHTML = `
			<div class="diag-header">Diagnóstico (temporal)</div>
			<div class="diag-body">
				<pre id="diagReport">Generando informe...</pre>
				<div class="diag-actions">
					<button id="diagRefresh">Actualizar</button>
					<button id="diagToggleNav">Toggle Nav</button>
					<button id="diagCloseOverlays">Cerrar overlays</button>
					<button id="diagCopy">Copiar informe</button>
				</div>
			</div>
		`;
		document.body.appendChild(panel);

		function getReport() {
			const nav = document.getElementById('nav');
			const ul = nav?.querySelector('ul');
			const lb = document.getElementById('lightbox');
			const mm = document.getElementById('menuModal');
			const toggle = document.getElementById('toggleNav');
			const report = {
				url: location.href,
				navClassList: nav ? Array.from(nav.classList) : null,
				navOpen: nav ? nav.classList.contains('open') : null,
				toggleExpanded: toggle ? toggle.getAttribute('aria-expanded') : null,
				ulStyles: ul ? getComputedStyle(ul) : null,
				ulDisplay: ul ? getComputedStyle(ul).display : null,
				ulVisibility: ul ? getComputedStyle(ul).visibility : null,
				ulOpacity: ul ? getComputedStyle(ul).opacity : null,
				ulZIndex: ul ? getComputedStyle(ul).zIndex : null,
				lightboxOpen: lb ? lb.getAttribute('aria-hidden') === 'false' : null,
				menuModalOpen: mm ? mm.getAttribute('aria-hidden') === 'false' : null,
				viewport: { w: window.innerWidth, h: window.innerHeight, devicePixelRatio: window.devicePixelRatio }
			};
			return JSON.stringify(report, null, 2);
		}

		const pre = panel.querySelector('#diagReport');
		const btnRefresh = panel.querySelector('#diagRefresh');
		const btnToggle = panel.querySelector('#diagToggleNav');
		const btnClose = panel.querySelector('#diagCloseOverlays');
		const btnCopy = panel.querySelector('#diagCopy');

		function refresh() { pre.textContent = getReport(); }
		btnRefresh.addEventListener('click', refresh);
		btnToggle.addEventListener('click', () => { document.getElementById('toggleNav')?.click(); setTimeout(refresh, 150); });
		btnClose.addEventListener('click', () => {
			document.querySelectorAll('.modal, .lightbox').forEach(m => m.setAttribute('aria-hidden','true'));
			const nav = document.getElementById('nav'); const toggle = document.getElementById('toggleNav');
			if (nav) nav.classList.remove('open'); if (toggle) { toggle.classList.remove('open'); toggle.setAttribute('aria-expanded','false'); }
			setTimeout(refresh, 150);
		});
		btnCopy.addEventListener('click', async () => { await navigator.clipboard.writeText(pre.textContent || ''); alert('Informe copiado al portapapeles'); });

		// auto-refresh on resize/scroll
		window.addEventListener('resize', refresh); window.addEventListener('scroll', refresh);
		refresh();
	} catch (err) { console.warn('Diag panel failed', err); }
}
document.addEventListener('DOMContentLoaded', createDiagnosticPanel);

/* Palette extraction has been intentionally DISABLED to enforce the client's exact colors.
   The site uses the official palette set in CSS variables and enforced on load. */

// Run palette extraction on DOM ready
// Apply official palette provided by the client and FORCE all colors to match the EXACT values
function applyOfficialPalette() {
	const root = document.documentElement;
	root.style.setProperty('--accent', '#D86F83');
	root.style.setProperty('--white', '#FFFFFF');
	root.style.setProperty('--black', '#000000');
	root.style.setProperty('--bg', '#D86F83');
	root.style.setProperty('--surface', '#FFFFFF');
	root.style.setProperty('--text', '#000000');
	root.style.setProperty('--btn-text', '#FFFFFF');
	root.style.setProperty('--accent-2', '#D86F83');
	root.style.setProperty('--shadow-rgba', 'rgba(0,0,0,0.12)');
	root.style.setProperty('--surface-overlay','rgba(255,255,255,0.96)');
	root.style.setProperty('--modal-bg','rgba(0,0,0,0.52)');
	root.style.setProperty('--lightbox-bg','rgba(0,0,0,0.68)');
	root.style.setProperty('--border-weak','rgba(0,0,0,0.06)');
	root.style.setProperty('--glass','rgba(255,255,255,0.04)');
}
document.addEventListener('DOMContentLoaded', () => applyOfficialPalette());

// Apply background image from manifest or 'img/background.*' automatically and update CSS var
function applyBackgroundImage() {
	const root = document.documentElement;
	const candidates = ['img/fondo.jpg','img/fondo.jpeg','img/Fondo.jpg','img/Fondo.jpeg'];

	const testImage = (src) => new Promise((resolve) => {
		const i = new Image();
		i.onload = () => resolve(true);
		i.onerror = () => resolve(false);
		i.src = src;
	});

	// check lowercase/uppercase variants for 'fondo' file
	(async () => {
		for (const candidate of candidates) {
			const ok = await testImage(candidate);
			if (ok) {
				root.style.setProperty('--bg-image', `url('${candidate}')`);
				adjustHeroTextColorFromImage(candidate);
				return;
			}
		}
		return (async () => {
			// fallback: try manifest
			fetch('img/portfolio-manifest.json').then(resp => {
				if (!resp.ok) throw new Error('no-manifest');
				return resp.json();
			}).then(arr => {
				if (!arr || !arr.length) return;
				const candidate = arr.find(e => !String(e.src).toLowerCase().includes('logo')) || arr[0];
				if (!candidate) return;
				const src = `img/${candidate.src}`;
				root.style.setProperty('--bg-image', `url('${src}')`);
				adjustHeroTextColorFromImage(src);
			}).catch(() => {
				const fallbackNames = ['img/background.jpg','img/bg.jpg','img/bg-hero.jpg','img/bg-1.jpg'];
				// use the first plausible fallback
				const tryFirst = fallbackNames.find(n => { try { new Image().src = n; return true; } catch(e){ return false; }});
				if (tryFirst) root.style.setProperty('--bg-image', `url('${tryFirst}')`);
			});
		});
	});
}
	document.addEventListener('DOMContentLoaded', applyBackgroundImage);

// Analyze an image to compute average luminance and set hero title color to white / black
function adjustHeroTextColorFromImage(src) {
	// create image and canvas for sample; use a small sample for speed
	if (!src) return;
	const img = new Image();
	img.crossOrigin = 'anonymous';
	img.src = src;
	img.onload = () => {
		try {
			const canvas = document.createElement('canvas');
			// sample area larger for better accuracy
			const w = 120, h = 90; canvas.width = w; canvas.height = h;
			const ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0, w, h);
			const data = ctx.getImageData(0, 0, w, h).data;
			let total = 0; let count = 0;
			for (let i = 0; i < data.length; i += 4) {
				const r = data[i], g = data[i + 1], b = data[i + 2];
				// relative luminance (sRGB) simplified
				const lum = 0.2126*r + 0.7152*g + 0.0722*b;
				total += lum; count++;
			}
			const avg = total / count;
			// Also compute a left-side average (where the title usually sits)
			const sampleX = 0;
			const sampleW = Math.max(1, Math.floor(w * 0.45));
			const sampleY = Math.max(0, Math.floor(h * 0.25));
			const sampleH = Math.max(1, Math.floor(h * 0.45));
			let leftTotal = 0; let leftCount = 0;
			try {
				const leftData = ctx.getImageData(sampleX, sampleY, sampleW, sampleH).data;
				for (let i = 0; i < leftData.length; i += 4) {
					const r = leftData[i], g = leftData[i + 1], b = leftData[i + 2];
					const lum = 0.2126*r + 0.7152*g + 0.0722*b;
					leftTotal += lum; leftCount++;
				}
			} catch(err) { leftTotal = total; leftCount = count; }
			const leftAvg = leftTotal / Math.max(1, leftCount);
			const root = document.documentElement;
			// If average luminance is dark, set white text; otherwise black
			// Prefer the left area luminance for deciding title color
			const computed = getComputedStyle(root);
			const accentStrong = (computed.getPropertyValue('--accent-strong') || '').trim() || '#7B0F23';
			// Use the accent color in most cases; only use white when the sampled left area is very dark
			const chosen = (leftAvg < 90) ? '#FFFFFF' : accentStrong;
			// Do not override the hero title color programmatically; keep the strong brand color
			// Remove dark overlay per client's instruction — ensure text color and shadow handle contrast instead
			document.body.style.setProperty('--hero-overlay', 'transparent');
			// text-shadow for hero title depending on color
			const heroShadow = (chosen === '#FFFFFF') ? '0 8px 28px rgba(0,0,0,0.56)' : '0 3px 10px rgba(255,255,255,0.46)';
			root.style.setProperty('--hero-title-shadow', heroShadow);
		} catch(e) { console.warn('Adjust hero color failed', e); }
	};
	img.onerror = () => { /* ignore */ };
}
document.addEventListener('DOMContentLoaded', () => setupMobilePortfolioCollapse());

// Populate any empty service cards that only have a data-dish attribute (to ensure 6 items are visible)
function populateServiceCards() {
	const cards = document.querySelectorAll('.card.service');
	cards.forEach(card => {
		const hasData = card.hasAttribute('data-dish');
		const contentEmpty = card.innerHTML.trim().length === 0;
		if (hasData && contentEmpty) {
			try {
				const d = JSON.parse(card.getAttribute('data-dish'));
				// Build inner content
				const media = document.createElement('div'); media.className = 'service-media';
				const img = document.createElement('img'); img.src = `img/${d.img}`; img.alt = d.title || ''; img.loading='lazy';
				media.appendChild(img);
				const h3 = document.createElement('h3'); h3.textContent = d.title;
				const p = document.createElement('p'); p.textContent = d.desc;
				const actions = document.createElement('div'); actions.className = 'service-actions';
				const ver = document.createElement('a'); ver.className = 'btn btn-outline js-dish-detail'; ver.href = '#'; ver.textContent = 'Ver';
				const order = document.createElement('a'); order.className = 'btn btn-primary'; order.textContent='Ordenar'; order.target='_blank'; order.rel='noopener noreferrer';
				const text = encodeURIComponent(`Hola%20quiero%20ordenar%20${d.title}`);
				order.href = `https://wa.me/5214777010587?text=${text}`;
				actions.appendChild(ver); actions.appendChild(order);
				card.appendChild(media); card.appendChild(h3); card.appendChild(p); card.appendChild(actions);
			} catch(e) { console.warn('Failed to populate service card', e); }
		}
	});
	// Re-bind dish buttons using central handler (handles fallbacks too)
	if (typeof bindDishButtons === 'function') bindDishButtons();
}
document.addEventListener('DOMContentLoaded', populateServiceCards);

// Back-to-top floating button — appears after scrolling down
function setupBackToTop() {
	const btn = document.createElement('a'); btn.id = 'backToTop'; btn.className = 'back-to-top'; btn.href = '#hero'; btn.setAttribute('aria-label','Volver arriba');
	btn.innerHTML = '↑'; document.body.appendChild(btn);
	btn.style.opacity = 0; btn.style.transition = 'opacity 0.28s'; btn.style.zIndex = 240;
	function onScroll(){ if (window.scrollY > 300) btn.style.opacity = 1; else btn.style.opacity = 0; }
	window.addEventListener('scroll', onScroll, {passive:true});
	btn.addEventListener('click', (e)=>{ e.preventDefault(); window.scrollTo({top:0, behavior:'smooth'}); });
}
document.addEventListener('DOMContentLoaded', setupBackToTop);

// Collapse portfolio on mobile to show only essential items and add a 'Ver más' button
function setupMobilePortfolioCollapse() {
	const grid = document.getElementById('portfolioGrid');
	if (!grid) return;
	const threshold = 680; // px
	const initialCount = 4;
	const btnId = 'portfolioVerMasBtn';
	function updateState() {
		const items = Array.from(grid.querySelectorAll('.portfolio-item'));
		if (window.innerWidth <= threshold && items.length > initialCount) {
			// Hide items beyond initialCount
			items.forEach((it, idx) => { if (idx >= initialCount) it.classList.add('mobile-hidden'); else it.classList.remove('mobile-hidden'); });
			// Add 'Ver más' button if not present
			if (!document.getElementById(btnId)) {
				const btn = document.createElement('button'); btn.id = btnId; btn.className = 'ver-mas-btn'; btn.innerText = 'Ver más';
				btn.addEventListener('click', () => {
					// reveal all
					items.forEach(i => i.classList.remove('mobile-hidden'));
					btn.style.display = 'none';
				});
				grid.insertAdjacentElement('afterend', btn);
			} else document.getElementById(btnId).style.display = 'inline-block';
		} else {
			// show all and remove button
			grid.querySelectorAll('.portfolio-item').forEach(it => it.classList.remove('mobile-hidden'));
			const existing = document.getElementById(btnId); if (existing) existing.remove();
		}
	}
	// run on init
	updateState();
	// update on resize
	let resizeTimer; window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(updateState, 150); });
}

// ============================================
// BOTÓN IR ARRIBA - SCROLL TO TOP
// ============================================
function setupScrollToTop() {
	const scrollBtn = document.getElementById('scrollToTop');
	if (!scrollBtn) return;
	
	// Mostrar/ocultar botón según scroll
	function toggleScrollButton() {
		if (window.scrollY > 400) {
			scrollBtn.classList.add('visible');
		} else {
			scrollBtn.classList.remove('visible');
		}
	}
	
	// Click para ir arriba
	scrollBtn.addEventListener('click', () => {
		window.scrollTo({
			top: 0,
			behavior: 'smooth'
		});
	});
	
	// Escuchar scroll
	window.addEventListener('scroll', toggleScrollButton, { passive: true });
	
	// Verificar al cargar
	toggleScrollButton();
}

// Inicializar botón ir arriba
document.addEventListener('DOMContentLoaded', setupScrollToTop);

