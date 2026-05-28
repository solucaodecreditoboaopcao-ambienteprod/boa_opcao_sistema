// ============================================
// BOA OPÇÃO - PORTFÓLIO JAVASCRIPT
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // Manter as funções existentes
    if (typeof initCarousel === 'function') initCarousel();
    if (typeof initSmoothScroll === 'function') initSmoothScroll();
    if (typeof initAnimations === 'function') initAnimations();
    if (typeof initHeroParallax === 'function') initHeroParallax();
    if (typeof initMobileDetection === 'function') initMobileDetection();
    
    initMap();
    initFooterModal();
    adjustCarouselImages();
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


// ========== INICIALIZAR MAPA ==========
function initMap() {
    const mapElement = document.getElementById('map');
    if (!mapElement) return;

    // Verificar se o Leaflet está disponível
    if (typeof L === 'undefined') {
        console.error('Leaflet não carregado!');
        return;
    }
    
    // Coordenadas do endereço (Av. Paulista, 1000 - São Paulo)
    const coordinates = [-23.564224, -46.651566];
    
    // Inicializar o mapa
    const map = L.map('map').setView(coordinates, 16);
    
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
        Av. Paulista, 1000 - Bela Vista<br>
        São Paulo - SP
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
    const modal = new bootstrap.Modal(document.getElementById('contatoModal'));
    
    // Abrir modal ao clicar no copyright ou na logo
    if (copyrightElement) {
        copyrightElement.addEventListener('click', function(e) {
            // Evitar que o clique na logo dispare duas vezes
            if (e.target === copyrightElement || e.target === copyrightElement.querySelector('span')) {
                modal.show();
            }
        });
    }
    
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

// ========== AJUSTAR CARROSSEL PARA O TAMANHO ESPECÍFICO ==========
function adjustCarouselImages() {
    const carouselImages = document.querySelectorAll('.service-image');
    const carouselContainer = document.querySelector('#carouselServicos');
    
    if (!carouselImages.length) return;
    
    // Garantir que todas as imagens mantenham a proporção 780x1040
    carouselImages.forEach(img => {
        img.style.width = '100%';
        img.style.height = 'auto';
        img.style.aspectRatio = '780 / 1040';
        img.style.objectFit = 'cover'; // 'cover' preenche sem distorcer
    });
    
    // Ajustar altura do carrossel baseado na largura
    function resizeCarousel() {
        if (carouselContainer) {
            const carouselInner = carouselContainer.querySelector('.carousel-inner');
            if (carouselInner) {
                const width = carouselInner.offsetWidth;
                const height = (width / 780) * 1040;
                carouselInner.style.minHeight = height + 'px';
                
                // Ajustar todos os itens
                const items = carouselContainer.querySelectorAll('.carousel-item');
                items.forEach(item => {
                    item.style.minHeight = height + 'px';
                });
            }
        }
    }
    
    // Executar após as imagens carregarem
    window.addEventListener('load', resizeCarousel);
    window.addEventListener('resize', () => {
        setTimeout(resizeCarousel, 100);
    });
    
    resizeCarousel();
}
