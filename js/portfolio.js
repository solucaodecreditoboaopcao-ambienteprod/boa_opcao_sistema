// ============================================
// BOA OPÇÃO - PORTFÓLIO JAVASCRIPT
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    initCarousel();
    initCarouselNovidades();
    initSmoothScroll();
    initAnimations();
    initHeroParallax();
    initMobileDetection();
    initMap();
    initFooterModal();
});

// ========== INICIALIZAR CARROSSEL ==========
function initCarousel() {
    const carousel = document.getElementById('carouselServicos');
    if (!carousel) return;
    
    // Inicializar Bootstrap Carousel
    const bsCarousel = new bootstrap.Carousel(carousel, {
        interval: 4000,
        ride: 'carousel',
        pause: 'hover',
        wrap: true
    });
    
    // Pausar carrossel quando não está visível na tela
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                bsCarousel.cycle();
            } else {
                bsCarousel.pause();
            }
        });
    }, { threshold: 0.3 });
    
    observer.observe(carousel);
    
    // Suporte a gestos de swipe para mobile
    let touchStartX = 0;
    let touchEndX = 0;
    
    carousel.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });
    
    carousel.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        const diff = touchStartX - touchEndX;
        
        if (Math.abs(diff) > 50) {
            if (diff > 0) {
                bsCarousel.next();
            } else {
                bsCarousel.prev();
            }
        }
    });
    
    // Suporte a teclado para acessibilidade
    document.addEventListener('keydown', (e) => {
        if (isElementInViewport(carousel)) {
            if (e.key === 'ArrowLeft') {
                bsCarousel.prev();
            } else if (e.key === 'ArrowRight') {
                bsCarousel.next();
            }
        }
    });
}

// ========== INICIALIZAR CARROSSEL DE NOVIDADES ==========
function initCarouselNovidades() {
    const carousel = document.getElementById('carouselNovidades');
    if (!carousel) return;
    
    // Inicializar Bootstrap Carousel
    const bsCarousel = new bootstrap.Carousel(carousel, {
        interval: 4000,
        ride: 'carousel',
        pause: 'hover',
        wrap: true
    });
    
    // Pausar carrossel quando não está visível na tela
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                bsCarousel.cycle();
            } else {
                bsCarousel.pause();
            }
        });
    }, { threshold: 0.3 });
    
    observer.observe(carousel);
    
    // Suporte a gestos de swipe para mobile
    let touchStartX = 0;
    let touchEndX = 0;
    
    carousel.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });
    
    carousel.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        const diff = touchStartX - touchEndX;
        
        if (Math.abs(diff) > 50) {
            if (diff > 0) {
                bsCarousel.next();
            } else {
                bsCarousel.prev();
            }
        }
    });
}



// ========== SCROLL SUAVE ==========
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            
            // Ignorar se for apenas "#"
            if (href === '#') return;
            
            e.preventDefault();
            const target = document.querySelector(href);
            
            if (target) {
                const headerHeight = document.querySelector('.header').offsetHeight;
                const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - headerHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
                
                // Fechar navbar mobile se estiver aberta
                const navbarToggler = document.querySelector('.navbar-toggler');
                const navbarCollapse = document.querySelector('.navbar-collapse');
                if (navbarToggler && navbarCollapse && navbarCollapse.classList.contains('show')) {
                    navbarToggler.click();
                }
            }
        });
    });
}

// ========== ANIMAÇÕES AO SCROLL ==========
function initAnimations() {
    // Cards de benefícios
    const benefitCards = document.querySelectorAll('.benefit-card');
    
    if (benefitCards.length > 0) {
        // Configurar estado inicial
        benefitCards.forEach(card => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(30px)';
            card.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
        });
        
        const benefitObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry, index) => {
                if (entry.isIntersecting) {
                    setTimeout(() => {
                        entry.target.style.opacity = '1';
                        entry.target.style.transform = 'translateY(0)';
                    }, index * 150);
                    benefitObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.2 });
        
        benefitCards.forEach(card => benefitObserver.observe(card));
    }
}

// ========== PARALLAX NO HERO ==========
function initHeroParallax() {
    const hero = document.querySelector('.hero-section');
    if (!hero) return;
    
    // Não aplicar parallax em dispositivos móveis para melhor performance
    if (window.innerWidth < 768) return;
    
    let ticking = false;
    
    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                const scrolled = window.pageYOffset;
                if (scrolled < window.innerHeight) {
                    const rate = scrolled * 0.4;
                    hero.style.backgroundPositionY = `calc(50% + ${rate}px)`;
                }
                ticking = false;
            });
            ticking = true;
        }
    });
}

// ========== DETECTAR MOBILE ==========
function initMobileDetection() {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
        // Remover background-attachment: fixed em mobile (causa problemas)
        const hero = document.querySelector('.hero-section');
        if (hero) {
            hero.style.backgroundAttachment = 'scroll';
        }
        
        // Ajustar altura do hero em mobile
        const adjustHeroHeight = () => {
            if (hero && window.innerHeight < 600) {
                hero.style.minHeight = '500px';
            }
        };
        
        adjustHeroHeight();
        window.addEventListener('resize', adjustHeroHeight);
    }
}

// ========== FUNÇÕES UTILITÁRIAS ==========

// Verificar se elemento está visível na viewport
function isElementInViewport(el) {
    const rect = el.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}

// Função para abrir WhatsApp
function abrirWhatsApp(mensagem) {
    const numero = '5571983880643';
    const texto = mensagem || 'Olá! Gostaria de saber mais sobre os serviços da BOA OPÇÃO.';
    const url = `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`;
    window.open(url, '_blank');
}

// Lazy loading para imagens
function initLazyLoading() {
    const images = document.querySelectorAll('img[data-src]');
    
    if (images.length === 0) return;
    
    const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
                img.classList.add('loaded');
                imageObserver.unobserve(img);
            }
        });
    });
    
    images.forEach(img => imageObserver.observe(img));
}

// ========== INICIALIZAR MAPA ==========
function initMap() {
    const mapElement = document.getElementById('map');
    if (!mapElement) return;

    // Verificar se o Leaflet está disponível
    if (typeof L === 'undefined') {
        console.error('Leaflet não carregado!');
        return;
    }
    
    // Coordenadas do endereço (R. Direta do Ypiranga, 15 E - Vila Canária, Salvador - BA)
    const coordinates = [-12.944573, -38.435401];
    
    // Inicializar o mapa
    const map = L.map('map').setView(coordinates, 17);
    
    // Adicionar camada do mapa (OpenStreetMap)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
    }).addTo(map);
    
    // Adicionar marcador
    const marker = L.marker(coordinates).addTo(map);
    
    // Adicionar popup ao marcador
    marker.bindPopup(`
        <strong>BOA OPÇÃO</strong><br>
        Soluções de Crédito<br>
        R. Direta do Ypiranga, 15 E - Vila Canária<br>
        Salvador - BA, 41390-800
    `).openPopup();
    
    // Adicionar círculo de raio ao redor do marcador
    L.circle(coordinates, {
        color: '#e65100',
        fillColor: '#ff6f00',
        fillOpacity: 0.2,
        radius: 100
    }).addTo(map);
}

// ========== INICIALIZAR MODAL E EVENTOS DO FOOTER ==========
function initFooterModal() {
    const copyrightElement = document.getElementById('copyrightLink');
    const logoElement = document.getElementById('logoApptech');
    const modalElement = document.getElementById('contatoModal');
    
    if (!modalElement) return;
    
    const modal = new bootstrap.Modal(modalElement);
    
    // Abrir modal ao clicar no copyright
    if (copyrightElement) {
        copyrightElement.addEventListener('click', function(e) {
            modal.show();
        });
    }
    
    // Abrir modal ao clicar na logo
    if (logoElement) {
        logoElement.addEventListener('click', function(e) {
            e.stopPropagation();
            modal.show();
        });
    }
    
    // Garantir que o link do WhatsApp no modal funcione
    const whatsappLink = document.getElementById('whatsappLink');
    if (whatsappLink) {
        whatsappLink.addEventListener('click', function(e) {
            e.preventDefault();
            const url = 'https://wa.me/5571985101828';
            window.open(url, '_blank');
        });
    }
}

// ========== AJUSTES ADICIONAIS ==========

// Garantir que imagens do carrossel carreguem corretamente
window.addEventListener('load', function() {
    // Pequeno ajuste para garantir que o carrossel funcione bem
    const carousel = document.getElementById('carouselServicos');
    if (carousel) {
        // Forçar reflow para corrigir qualquer problema de layout
        carousel.style.display = 'none';
        setTimeout(() => {
            carousel.style.display = '';
        }, 10);
    }
});

console.log('🚀 BOA OPÇÃO - Portfólio carregado com sucesso!');
console.log('📱 Mapa e modal de contato integrados');
console.log('📐 Carrossel configurado com CSS (sem JS de dimensionamento)');
