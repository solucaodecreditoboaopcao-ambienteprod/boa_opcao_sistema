// ============================================
// BOA OPÇÃO - PORTFÓLIO JAVASCRIPT
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    initCarousel();
    initSmoothScroll();
    initAnimations();
    initHeroParallax();
    initMobileDetection();
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
                
                // Fechar navbar mobile se estiver aberta (não se aplica aqui, mas boa prática)
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

// Função para abrir WhatsApp (pode ser chamada de outros lugares)
function abrirWhatsApp(mensagem) {
    const numero = '5511999999999'; // Substituir pelo número real
    const texto = mensagem || 'Olá! Gostaria de saber mais sobre os serviços da BOA OPÇÃO.';
    const url = `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`;
    window.open(url, '_blank');
}

// Lazy loading para imagens (se necessário no futuro)
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

console.log('🚀 BOA OPÇÃO - Portfólio carregado com sucesso!');
console.log('📱 Sistema independente disponível em: /sistema/acesso_restrito.html');