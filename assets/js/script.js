/**
 * Pullai Data Partners - Website JavaScript
 * Handles interactivity, dynamic content loading, and animations
 */

// ========================================
// Configuration Management
// ========================================
let siteConfig = null;
let clientsData = null;
let testimonialsData = null;

/**
 * Load configuration files
 */
async function loadConfig() {
  try {
    const [configRes, clientsRes, testimonialsRes] = await Promise.all([
      fetch('config/site.config.json'),
      fetch('config/clients.json'),
      fetch('config/testimonials.json')
    ]);

    siteConfig = await configRes.json();
    clientsData = await clientsRes.json();
    testimonialsData = await testimonialsRes.json();

    return true;
  } catch (error) {
    console.error('Error loading configuration:', error);
    return false;
  }
}

// ========================================
// Navigation
// ========================================

/**
 * Initialize navigation functionality
 */
function initNavigation() {
  const navbar = document.querySelector('.navbar');
  const mobileToggle = document.querySelector('.mobile-menu-toggle');
  const navMenu = document.querySelector('.nav-menu');
  const navLinks = document.querySelectorAll('.nav-link');

  // Sticky navbar on scroll
  window.addEventListener('scroll', () => {
    if (window.scrollY > 100) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });

  // Mobile menu toggle
  if (mobileToggle) {
    mobileToggle.addEventListener('click', () => {
      navMenu.classList.toggle('active');
    });
  }

  // Smooth scroll for navigation links
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');

      if (href.startsWith('#')) {
        e.preventDefault();
        const targetId = href.substring(1);
        const targetSection = document.getElementById(targetId);

        if (targetSection) {
          // Close mobile menu if open
          navMenu.classList.remove('active');

          // Smooth scroll to section
          const offsetTop = targetSection.offsetTop - navbar.offsetHeight;
          window.scrollTo({
            top: offsetTop,
            behavior: 'smooth'
          });
        }
      }
    });
  });
}

// ========================================
// Sticky Section Titles
// ========================================

/**
 * Initialize sticky title behavior
 * Dynamically adjusts sticky position based on navbar height
 */
function initStickyTitles() {
  const navbar = document.querySelector('.navbar');
  const stickyElements = document.querySelectorAll('.section-title, .service-title-inditex');

  if (!navbar || stickyElements.length === 0) return;

  /**
   * Update sticky positions based on current navbar height
   */
  function updateStickyPositions() {
    const navbarHeight = navbar.offsetHeight;

    stickyElements.forEach(element => {
      element.style.top = `${navbarHeight}px`;
    });
  }

  /**
   * Detect when elements become "stuck" to add shadow effect
   */
  function initStuckDetection() {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          // Element is "stuck" when it's not fully intersecting
          const isStuck = entry.intersectionRatio < 1;
          entry.target.classList.toggle('is-stuck', isStuck);
        });
      },
      {
        threshold: [1],
        rootMargin: `-${navbar.offsetHeight}px 0px 0px 0px`
      }
    );

    stickyElements.forEach(el => observer.observe(el));
  }

  // Debounce helper
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // Update on scroll (navbar changes height when scrolled)
  const debouncedUpdate = debounce(updateStickyPositions, 50);
  window.addEventListener('scroll', debouncedUpdate);

  // Update on resize
  const debouncedResize = debounce(updateStickyPositions, 100);
  window.addEventListener('resize', debouncedResize);

  // Initial setup
  updateStickyPositions();
  initStuckDetection();

  console.log('Sticky titles initialized');
}

// ========================================
// Animated Sticky Titles Over Images
// ========================================

/**
 * Detect when sticky titles are over image sections and add animation
 * Uses IntersectionObserver for optimal performance
 */
function initStickyTitleImageAnimation() {
  const serviceTitles = document.querySelectorAll('.service-title-inditex');
  const imageSections = document.querySelectorAll('.service-image-section');

  if (serviceTitles.length === 0 || imageSections.length === 0) return;

  // Configuration
  const NAVBAR_HEIGHT = document.querySelector('.navbar')?.offsetHeight || 110;

  /**
   * Check if title is positioned over an image section
   * @param {Element} title - The sticky title element
   * @returns {boolean} - True if title is over an image section
   */
  function isTitleOverImage(title) {
    // Get title's bounding rect (its current sticky position)
    const titleRect = title.getBoundingClientRect();
    const titleCenterY = titleRect.top + (titleRect.height / 2);

    // Check each image section
    for (let imageSection of imageSections) {
      const imageRect = imageSection.getBoundingClientRect();

      // Check if title's center is within the image section's vertical bounds
      if (titleCenterY >= imageRect.top && titleCenterY <= imageRect.bottom) {
        return true;
      }
    }

    return false;
  }

  /**
   * Update animation state for all titles
   */
  function updateTitleAnimations() {
    serviceTitles.forEach(title => {
      const overImage = isTitleOverImage(title);
      title.classList.toggle('over-image', overImage);
    });
  }

  // IntersectionObserver for image sections
  // Triggers when any image section enters or exits viewport
  const imageSectionObserver = new IntersectionObserver(
    (entries) => {
      // Any time an image section visibility changes, update all titles
      updateTitleAnimations();
    },
    {
      // Watch for any intersection change
      threshold: Array.from({ length: 101 }, (_, i) => i / 100), // 0, 0.01, 0.02, ..., 1
      rootMargin: `${NAVBAR_HEIGHT}px 0px 0px 0px` // Account for sticky offset
    }
  );

  // Observe all image sections
  imageSections.forEach(section => imageSectionObserver.observe(section));

  // Also update on scroll (with requestAnimationFrame) as backup for edge cases
  let scrollTimeout;
  function handleScroll() {
    if (scrollTimeout) {
      window.cancelAnimationFrame(scrollTimeout);
    }
    scrollTimeout = window.requestAnimationFrame(() => {
      updateTitleAnimations();
    });
  }

  window.addEventListener('scroll', handleScroll, { passive: true });

  // Update on resize
  let resizeTimeout;
  function handleResize() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      updateTitleAnimations();
    }, 150);
  }

  window.addEventListener('resize', handleResize);

  // Initial check
  updateTitleAnimations();

  console.log('Sticky title image animations initialized');
}

// ========================================
// Dynamic Content Loading
// ========================================

/**
 * Load and display clients
 */
function loadClients() {
  if (!clientsData || !clientsData.clients) return;

  const clientsGrid = document.querySelector('.clients-grid');
  if (!clientsGrid) return;

  clientsGrid.innerHTML = '';

  clientsData.clients.forEach(client => {
    const clientElement = document.createElement('div');
    clientElement.className = 'client-logo fade-in-up';
    clientElement.innerHTML = `
      <img src="${client.logo}" alt="${client.name}" loading="lazy">
    `;
    clientsGrid.appendChild(clientElement);
  });
}

/**
 * Load and display testimonials
 */
function loadTestimonials() {
  if (!testimonialsData || !testimonialsData.testimonials) return;

  const testimonialsGrid = document.querySelector('.testimonials-grid');
  if (!testimonialsGrid) return;

  testimonialsGrid.innerHTML = '';

  // Filter featured testimonials
  const featured = testimonialsData.testimonials.filter(t => t.featured);
  const displayTestimonials = featured.length > 0 ? featured : testimonialsData.testimonials.slice(0, 3);

  displayTestimonials.forEach(testimonial => {
    const stars = '★'.repeat(testimonial.rating);

    const testimonialElement = document.createElement('div');
    testimonialElement.className = 'testimonial-card fade-in-up';
    testimonialElement.innerHTML = `
      <div class="testimonial-quote">
        "${testimonial.quote}"
      </div>
      <div class="testimonial-author">
        <div class="testimonial-avatar">
          <img src="${testimonial.avatar}" alt="${testimonial.author}" loading="lazy">
        </div>
        <div class="testimonial-info">
          <h4>${testimonial.author}</h4>
          <div class="testimonial-role">${testimonial.role} - ${testimonial.client}</div>
        </div>
      </div>
      <div class="testimonial-rating">${stars}</div>
    `;
    testimonialsGrid.appendChild(testimonialElement);
  });
}

// ========================================
// Form Handling
// ========================================

/**
 * Initialize contact form with Formspree
 */
function initContactForm() {
  const form = document.querySelector('.contact-form');
  if (!form) return;

  const statusMessage = form.querySelector('.form-status');
  const submitButton = form.querySelector('.form-submit');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Get form data
    const formData = new FormData(form);
    const email = form.querySelector('#email').value;

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showStatus('Por favor ingresa un email válido.', 'error');
      return;
    }

    // Disable submit button
    submitButton.disabled = true;
    submitButton.textContent = 'Enviando...';

    try {
      // Send form data to Formspree
      const response = await fetch(form.action, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        showStatus('¡Mensaje enviado! Te contactaremos pronto.', 'success');
        form.reset();
      } else {
        const data = await response.json();
        if (data.errors) {
          showStatus(data.errors.map(error => error.message).join(', '), 'error');
        } else {
          showStatus('Hubo un error al enviar el mensaje. Por favor intenta de nuevo.', 'error');
        }
      }
    } catch (error) {
      showStatus('Error de conexión. Por favor verifica tu internet e intenta de nuevo.', 'error');
    } finally {
      // Re-enable submit button
      submitButton.disabled = false;
      submitButton.textContent = 'Enviar mensaje';
    }
  });

  function showStatus(message, type) {
    if (!statusMessage) return;

    statusMessage.textContent = message;
    statusMessage.style.display = 'block';

    if (type === 'success') {
      statusMessage.style.backgroundColor = '#d4edda';
      statusMessage.style.color = '#155724';
      statusMessage.style.border = '1px solid #c3e6cb';
    } else {
      statusMessage.style.backgroundColor = '#f8d7da';
      statusMessage.style.color = '#721c24';
      statusMessage.style.border = '1px solid #f5c6cb';
    }

    // Hide message after 5 seconds
    setTimeout(() => {
      statusMessage.style.display = 'none';
    }, 5000);
  }
}

// ========================================
// Scroll Animations
// ========================================

/**
 * Initialize scroll animations
 */
function initScrollAnimations() {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');  // Para .scroll-reveal
        entry.target.classList.add('fade-in-up');  // Mantener animación existente
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // Observe elements
  const animatedElements = document.querySelectorAll(
    '.scroll-reveal, .service-card, .solution-card, .team-member, .testimonial-card, .client-logo'
  );

  animatedElements.forEach(el => {
    observer.observe(el);
  });
}

// ========================================
// CTA Actions
// ========================================

/**
 * Initialize CTA button actions
 */
function initCTAActions() {
  // Primary CTA - Scroll to contact
  const primaryCTA = document.querySelector('.btn-primary[href="#contacto"]');
  if (primaryCTA) {
    primaryCTA.addEventListener('click', (e) => {
      e.preventDefault();
      const contactSection = document.getElementById('contacto');
      if (contactSection) {
        const navbar = document.querySelector('.navbar');
        const offsetTop = contactSection.offsetTop - navbar.offsetHeight;
        window.scrollTo({
          top: offsetTop,
          behavior: 'smooth'
        });
      }
    });
  }

  // Secondary CTA - Scroll to services
  const secondaryCTA = document.querySelector('.btn-secondary[href="#servicios"]');
  if (secondaryCTA) {
    secondaryCTA.addEventListener('click', (e) => {
      e.preventDefault();
      const servicesSection = document.getElementById('servicios');
      if (servicesSection) {
        const navbar = document.querySelector('.navbar');
        const offsetTop = servicesSection.offsetTop - navbar.offsetHeight;
        window.scrollTo({
          top: offsetTop,
          behavior: 'smooth'
        });
      }
    });
  }

  // Scroll indicator
  const scrollIndicator = document.querySelector('.scroll-indicator a');
  if (scrollIndicator) {
    scrollIndicator.addEventListener('click', (e) => {
      e.preventDefault();
      const servicesSection = document.getElementById('servicios');
      if (servicesSection) {
        const navbar = document.querySelector('.navbar');
        const offsetTop = servicesSection.offsetTop - navbar.offsetHeight;
        window.scrollTo({
          top: offsetTop,
          behavior: 'smooth'
        });
      }
    });
  }
}

// ========================================
// Active Link Highlighting
// ========================================

/**
 * Highlight active section in navigation
 */
function initActiveLinkHighlight() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link');

  window.addEventListener('scroll', () => {
    let current = '';
    const scrollPosition = window.scrollY + 100;

    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.offsetHeight;

      if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
        current = section.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${current}`) {
        link.classList.add('active');
      }
    });
  });
}

// ========================================
// Performance Optimizations
// ========================================

/**
 * Lazy load images
 */
function initLazyLoading() {
  const images = document.querySelectorAll('img[loading="lazy"]');

  if ('loading' in HTMLImageElement.prototype) {
    // Browser supports native lazy loading
    return;
  }

  // Fallback for browsers that don't support native lazy loading
  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src || img.src;
        img.classList.add('loaded');
        observer.unobserve(img);
      }
    });
  });

  images.forEach(img => imageObserver.observe(img));
}

// ========================================
// Utility Functions
// ========================================

/**
 * Debounce function for performance
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Check if element is in viewport
 */
function isInViewport(element) {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

// ========================================
// Footer Year Update
// ========================================

/**
 * Update copyright year in footer
 */
function updateCopyrightYear() {
  const yearElement = document.getElementById('currentYear');
  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }
}

// ========================================
// Initialization
// ========================================

/**
 * Initialize all functionality when DOM is ready
 */
async function init() {
  console.log('Initializing Pullai Data Partners website...');

  // Load configuration files
  const configLoaded = await loadConfig();

  if (configLoaded) {
    console.log('Configuration loaded successfully');

    // Load dynamic content
    loadClients();
    loadTestimonials();
  } else {
    console.warn('Failed to load configuration, using static content');
  }

  // Initialize features
  initNavigation();
  initStickyTitles();
  // initStickyTitleImageAnimation(); // Desactivado - sin efectos sobre imágenes
  initContactForm();
  initScrollAnimations();
  initCTAActions();
  initActiveLinkHighlight();
  initLazyLoading();
  updateCopyrightYear();
  initLanguageSystem();

  console.log('Website initialized successfully');
}

// Run initialization when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// ========================================
// Strategic Alliances Toggle
// ========================================

/**
 * Toggle the alliances section visibility
 */
function toggleAlliances() {
  const button = document.querySelector('.alliances-toggle');
  const content = document.getElementById('alliancesContent');

  if (button && content) {
    button.classList.toggle('active');
    content.classList.toggle('open');
  }
}

// Make function globally available
window.toggleAlliances = toggleAlliances;

// ========================================
// Language Translation System
// ========================================

const translations = {
  es: {
    nav: {
      services: 'Servicios',
      solutions: 'Soluciones',
      team: 'Equipo',
      clients: 'Clientes',
      contact: 'Contacto'
    },
    breadcrumb: {
      home: 'Inicio',
      services: 'Servicios',
      team: 'Equipo',
      clients: 'Clientes',
      contact: 'Contacto',
      consultoria: 'Consultoría en Datos',
      bi: 'Business Intelligence',
      dataScience: 'Data Science',
      gobierno: 'Gobierno de Datos',
      ingenieria: 'Ingeniería de Datos',
      aiGenai: 'AI / GenAI'
    },
    hero: {
      title: 'Transformamos Datos en Decisiones Inteligentes',
      description: 'Transformamos datos en tu ventaja competitiva. Escala, innova y crece con nosotros.',
      cta: {
        primary: 'Agendar reunión',
        secondary: 'Ver servicios'
      }
    },
    services: {
      dataConsulting: {
        title: 'Consultoría en Datos',
        description: 'Diseñamos estrategias y rutas personalizadas para maximizar el valor de tu información al menor costo, con enfoque en resultados medibles.',
        bullets: [
          'Descubrimiento de casos de uso de alto impacto',
          'Arquitectura de datos escalable y eficiente',
          'Evaluación y optimización de costos',
          'Pilotos y pruebas de concepto (PoCs)'
        ]
      },
      dataGovernance: {
        title: 'Gobierno de Datos',
        description: 'Establecemos personas, procesos y políticas para garantizar calidad, seguridad y cumplimiento normativo de tus datos.',
        bullets: [
          'Modelo RACI y roles de datos',
          'Catálogo de datos centralizado',
          'SLAs de calidad de datos (Data Quality)',
          'Políticas de acceso, privacidad y seguridad'
        ]
      },
      businessIntelligence: {
        title: 'Business Intelligence',
        description: 'Dashboards interactivos en tiempo real que transforman datos complejos en insights accionables para tu equipo ejecutivo.',
        bullets: [
          'Modelado semántico de datos',
          'Plataformas de BI self-hosted a medida',
          'Dashboards en Power BI, Looker y Tableau',
          'Alertas y notificaciones automatizadas',
          'Embedded analytics en tus aplicaciones'
        ]
      },
      dataEngineering: {
        title: 'Ingeniería de Datos',
        description: 'Migraciones, pipelines ETL y arquitecturas modernas para procesar grandes volúmenes de datos de manera eficiente.',
        bullets: [
          'Ingesta incremental y batch de datos',
          'Orquestación de datos',
          'Transformaciones',
          'Optimización de costos en cloud'
        ]
      },
      dataScience: {
        title: 'Data Science',
        description: 'Modelos predictivos y analítica avanzada que anticipan tendencias, optimizan operaciones y maximizan ingresos.',
        bullets: [
          'Predicción de demanda y churn',
          'Segmentación de clientes y LTV',
          'Detección de patrones heurísticos',
          'Validación estadística rigurosa'
        ]
      },
      aiGenAI: {
        title: 'AI / GenAI',
        description: 'De datos a acciones: agentes inteligentes que automatizan procesos, aceleran ventas y potencian decisiones estratégicas.',
        bullets: [
          'Agentes de datos',
          'Activadores automáticos de ventas',
          'Copilotos de decisiones',
          'Orquestadores inteligentes'
        ]
      }
    },
    solutions: {
      title: 'Soluciones por Área',
      subtitle: 'Casos de uso específicos adaptados a tus necesidades empresariales',
      cards: [
        {
          title: 'Ventas & Growth',
          description: 'Optimización de conversión y ROI mediante analítica predictiva.',
          items: [
            'Scoring predictivo de leads para priorización comercial inteligente',
            'Segmentación dinámica de audiencias y micro-segmentación de mercado',
            'Modelos de atribución multi-touch para optimización de inversión publicitaria',
            'Predicción de churn (fuga) y diseño de estrategias de retención proactiva'
          ]
        },
        {
          title: 'Eficiencia Operativa',
          description: 'Reducción de costos y optimización de recursos con datos en tiempo real.',
          items: [
            'Optimización de inventario y visibilidad total de la supply chain',
            'Modelos de predicción de demanda y planificación de recursos operativos',
            'Sistemas inteligentes de detección de anomalías operativas en tiempo real',
            'Automatización de procesos complejos mediante la integración de RPA + IA'
          ]
        },
        {
          title: 'Customer Experience (CX)',
          description: 'Maximización del valor de vida del cliente y fidelización inteligente.',
          items: [
            'Análisis de sentimiento y voz del cliente mediante procesamiento de lenguaje natural (NLP)',
            'Modelos de Customer Lifetime Value (CLV) para segmentación por valor de cliente',
            'Motores de recomendación y personalización de contenido impulsados por IA',
            'Optimización de embudos de post-venta y sistemas de soporte técnico proactivo'
          ]
        },
        {
          title: 'Estrategia & Finanzas',
          description: 'Inteligencia centralizada para la toma de decisiones de alto nivel (C-Suite).',
          items: [
            'Dashboards ejecutivos con visualización de KPIs críticos y salud del negocio',
            'Modelos de forecasting financiero avanzado y proyecciones de flujo de caja',
            'Análisis de rentabilidad detallado por producto, canal y unidad de negocio',
            'Acompañamiento en la adopción de cultura de datos y alfabetización analítica'
          ]
        }
      ]
    },
    infrastructure: {
      title: 'El Motor Detrás de la Data',
      subtitle: 'Para activar soluciones de alto impacto, desplegamos agentes de datos y arquitecturas robustas que garantizan la integridad y el flujo de la información de extremo a extremo:',
      components: [
        {
          title: 'Scrapers Web',
          description: 'Monitoreo automatizado de competencia y mercado'
        },
        {
          title: 'Agentes de Enriquecimiento',
          description: 'Validación y limpieza de datos con IA avanzada'
        },
        {
          title: 'Sincronización Multi-plataforma',
          description: 'Integración total de ERPs, CRMs y fuentes externas'
        },
        {
          title: 'Data Governance',
          description: 'Garantía de calidad, limpieza y seguridad de la información'
        }
      ]
    },
    boutique: {
      title: '¿Su desafío no encaja en estas categorías?',
      description: 'Somos una consultoría boutique. No creemos en soluciones enlatadas. Construimos arquitecturas de analítica <strong>100% ad-hoc</strong> para resolver problemas específicos que requieren un enfoque creativo y técnico desde cero.',
      cta: 'Agendar Consultoría de Diagnóstico'
    },
    clients: {
      title: 'Clientes que Confían en Nosotros',
      subtitle: 'Trabajamos con empresas líderes en diversas industrias',
      testimonialsTitle: 'Lo que Dicen Nuestros Clientes',
      testimonials: [
        {
          quote: '"Pullai transformó nuestra estrategia de datos. En 6 meses reducimos costos en 40% y aumentamos la velocidad de insights en 10x."',
          author: 'Guadalupe Ureta',
          role: 'Partner',
          client: 'Seminarium',
          avatar: 'assets/img/testimonials/guadalupe-ureta.jpg',
          rating: 5
        },
        {
          quote: '"Los modelos predictivos de churn nos permitieron retener 10% más clientes. ROI increíble en el primer trimestre."',
          author: 'Sebastián Manhood',
          role: 'Co-Founder y Gerente de Operaciones',
          client: 'MyHotel',
          avatar: 'assets/img/testimonials/sebastian-manhood.jpg',
          rating: 5
        },
        {
          quote: '"Los dashboards en tiempo real han revolucionado cómo tomamos decisiones. Ahora tenemos visibilidad completa de todas nuestras operaciones."',
          author: 'Claudia Castañón',
          role: 'Director',
          client: 'ClouHR',
          avatar: 'assets/img/testimonials/claudia-castanon.jpg',
          rating: 5
        }
      ]
    },
    contact: {
      title: 'Hablemos de tu Proyecto',
      subtitle: 'Estamos listos para ayudarte a transformar tus datos en resultados',
      info: {
        title: 'Conecta con Nosotros',
        description: '¿Tienes un proyecto en mente? ¿Necesitas consultoría estratégica en datos? Contáctanos y descubre cómo podemos ayudarte.'
      },
      form: {
        name: 'Nombre completo *',
        email: 'Email *',
        company: 'Empresa',
        message: 'Mensaje *',
        submit: 'Enviar mensaje'
      }
    },
    alliances: {
      toggle: 'Alianzas Estratégicas',
      description: 'Para asegurar que nuestros clientes cuenten con soluciones integrales, trabajamos con socios especializados en áreas complementarias.',
      partners: [
        {
          description: 'Asesoría financiera y estratégica. Tu equipo de Finanzas Corporativas.'
        }
      ]
    },
    footer: {
      copyright: 'Todos los derechos reservados.'
    },
    languageButton: 'English',
    consultoriaPage: {
      hero: {
        title: 'Consultoría en Datos',
        tagline: 'De la estrategia a la ejecución',
        description: 'Diseñamos estrategias y rutas personalizadas para maximizar el valor de tu información al menor costo, con enfoque en resultados medibles. Transformamos tu visión de datos en un roadmap accionable con impacto real en el negocio.',
        ctaPrimary: 'Agendar consultoría',
        ctaSecondary: 'Nuestros servicios'
      },
      valueProps: {
        title: '¿Por qué Consultoría en Datos?',
        subtitle: 'Convertimos la complejidad de los datos en ventajas competitivas claras',
        card1: {
          title: 'Casos de Uso de Alto Impacto',
          description: 'Identificamos y priorizamos iniciativas de datos que generan ROI medible en menos de 6 meses, evitando proyectos "vanity" sin retorno.',
          metric: '6-12 meses ROI'
        },
        card2: {
          title: 'Optimización de Costos',
          description: 'Reducimos costos de infraestructura y operaciones de datos hasta en un 40% mediante arquitecturas eficientes y tecnologías adecuadas.',
          metric: 'Hasta 40% ahorro'
        },
        card3: {
          title: 'Roadmap Accionable',
          description: 'Entregamos planes de implementación detallados con fases, hitos y métricas de éxito claras, no solo presentaciones teóricas.',
          metric: '100% ejecutable'
        },
        card4: {
          title: 'Resultados Rápidos',
          description: 'Validamos hipótesis con pilotos y PoCs en semanas, no meses, para demostrar valor temprano y ajustar la estrategia.',
          metric: '2-4 semanas PoC'
        }
      },
      capabilities: {
        title: 'Nuestro Enfoque',
        subtitle: 'Metodologías probadas en startups, scale-ups y Fortune 500',
        items: [
          {
            title: 'Descubrimiento de Casos de Uso de Alto Impacto',
            description: 'Facilitamos workshops con stakeholders clave para identificar oportunidades de datos que realmente mueven la aguja del negocio. Priorizamos usando frameworks de impacto vs. esfuerzo.',
            features: [
              'Entrevistas con C-level y líderes de área',
              'Análisis de pain points y oportunidades',
              'Matriz de priorización (impacto vs. esfuerzo)',
              'Definición de KPIs y métricas de éxito',
              'Business case con proyección de ROI'
            ]
          },
          {
            title: 'Arquitectura de Datos Escalable y Eficiente',
            description: 'Diseñamos arquitecturas modernas (cloud-native, lakehouse, mesh) adaptadas a tu escala y presupuesto. Evitamos sobre-ingeniería y optimizamos para costos operativos bajos.',
            features: [
              'Arquitectura cloud-native (AWS, GCP, Azure)',
              'Patrones modernos: Data Lakehouse, Data Mesh',
              'Estimación de costos TCO (Total Cost of Ownership)',
              'Plan de migración desde legacy systems',
              'Reference architecture documentada'
            ]
          },
          {
            title: 'Evaluación y Optimización de Costos',
            description: 'Auditamos infraestructura existente para identificar ineficiencias y desperdicios. Optimizamos queries, storage y compute para reducir la factura cloud hasta en 50%.',
            features: [
              'Análisis de costos actuales (compute, storage, egress)',
              'Identificación de recursos subutilizados',
              'Optimización de queries y pipelines',
              'Reserved instances y savings plans',
              'Monitoreo continuo de costos (FinOps)'
            ]
          },
          {
            title: 'Pilotos y Pruebas de Concepto (PoCs)',
            description: 'Validamos tecnologías y enfoques con pilotos rápidos (2-4 semanas) antes de comprometer presupuestos grandes. Demostramos valor tangible con datos reales.',
            features: [
              'Diseño de PoC con criterios de éxito claros',
              'Implementación rápida con datos reales',
              'Validación de hipótesis de negocio',
              'Demo funcional para stakeholders',
              'Recomendación go/no-go fundamentada'
            ]
          }
        ]
      },
      useCases: {
        title: 'Casos de Éxito',
        cases: [
          {
            label: 'Retail / E-commerce',
            title: 'Estrategia de Personalización con Datos',
            flow: [
              {
                label: 'Problema',
                content: 'Startup de e-commerce con 500K usuarios no podía personalizar experiencia. Datos dispersos en 6 sistemas sin integración.'
              },
              {
                label: 'Solución',
                content: 'Diseñamos arquitectura de Customer Data Platform (CDP) con Segment + Snowflake. Definimos casos de uso: recomendaciones, email campaigns, abandono de carrito.'
              },
              {
                label: 'Resultado',
                content: '+35% en conversión de email campaigns, +22% en AOV (Average Order Value). ROI positivo en 4 meses. Stack implementado en 8 semanas.'
              }
            ]
          },
          {
            label: 'Fintech / SaaS',
            title: 'Reducción de Costos Cloud en 60%',
            flow: [
              {
                label: 'Problema',
                content: 'Scale-up con $150K/mes en AWS. Pipelines ineficientes procesando datos duplicados. Warehouses siempre encendidos.'
              },
              {
                label: 'Solución',
                content: 'Auditoría completa de recursos. Migración a Snowflake con auto-suspend. Optimización de queries y particionamiento. Reserved instances para workloads estables.'
              },
              {
                label: 'Resultado',
                content: 'Costos reducidos a $60K/mes (60% ahorro = $1M/año). Queries 3x más rápidos. Playbook de FinOps documentado para el equipo.'
              }
            ]
          },
          {
            label: 'Healthcare / Enterprise',
            title: 'Roadmap de Modernización de Data Lake',
            flow: [
              {
                label: 'Problema',
                content: 'Empresa Fortune 500 con data lake legacy (Hadoop on-prem). Mantenimiento costoso y baja adopción por usuarios de negocio.'
              },
              {
                label: 'Solución',
                content: 'Estrategia de migración en fases a Databricks Lakehouse. PoC con caso de uso crítico (reportes regulatorios). Roadmap de 18 meses con 5 fases.'
              },
              {
                label: 'Resultado',
                content: 'PoC exitoso en 6 semanas. Buy-in de C-level logrado. Presupuesto aprobado para Fase 1 (migración de 3 workloads críticos). $2M en ahorro de infraestructura proyectado.'
              }
            ]
          }
        ]
      },
      techStack: {
        title: 'Tecnologías y Frameworks',
        subtitle: 'Stack tecnológico que recomendamos y dominamos',
        categories: [
          {
            title: 'Cloud Platforms',
            items: [
              'AWS',
              'Google Cloud',
              'Azure',
              'Snowflake'
            ]
          },
          {
            title: 'Architecture Patterns',
            items: [
              'Data Lakehouse',
              'Data Mesh',
              'Lambda Architecture',
              'Event-Driven'
            ]
          },
          {
            title: 'Frameworks & Methodologies',
            items: [
              'TOGAF',
              'DAMA-DMBOK',
              'DataOps',
              'FinOps'
            ]
          }
        ]
      },
      cta: {
        title: '¿Listo para diseñar tu estrategia de datos?',
        description: 'Agenda una sesión de consultoría gratuita (30 min) para discutir tus desafíos de datos y cómo podemos ayudarte.',
        button: 'Agendar consultoría gratuita'
      },
      relatedServices: {
        title: 'Servicios Relacionados',
        subtitle: 'Complementa tu estrategia con estos servicios',
        cards: [
          {
            title: 'Gobierno de Datos',
            description: 'Asegura calidad, seguridad y cumplimiento con políticas y procesos claros.'
          },
          {
            title: 'Ingeniería de Datos',
            description: 'Implementa pipelines y arquitecturas diseñadas en la fase de consultoría.'
          },
          {
            title: 'Business Intelligence',
            description: 'Dashboards y reportes que materializan los casos de uso identificados.'
          }
        ],
        linkText: 'Ver servicio'
      }
    },
    biPage: {
      hero: {
        title: 'Business Intelligence',
        tagline: 'Dashboards que impulsan decisiones',
        description: 'Dashboards interactivos en tiempo real que transforman datos complejos en insights accionables para tu equipo ejecutivo. Convertimos métricas dispersas en narrativas visuales que guían decisiones estratégicas con confianza.',
        ctaPrimary: 'Agendar demo',
        ctaSecondary: 'Nuestros servicios'
      },
      valueProps: {
        title: '¿Por qué Business Intelligence?',
        subtitle: 'Transforma datos en acción con visualizaciones que todos entienden',
        card1: {
          title: 'Insights en Tiempo Real',
          description: 'Dashboards que se actualizan automáticamente cada 15 minutos. Monitorea KPIs críticos sin esperar a reportes semanales obsoletos.',
          metric: '15 min refresh'
        },
        card2: {
          title: 'Decisiones Basadas en Datos',
          description: 'Elimina la toma de decisiones por intuición. Métricas claras, contextualizadas y accionables que todos los stakeholders entienden.',
          metric: '100% data-driven'
        },
        card3: {
          title: 'Implementación Rápida',
          description: 'Primeros dashboards productivos en 3-4 semanas. Metodología ágil con sprints de 2 semanas y demos incrementales.',
          metric: '3-4 semanas go-live'
        },
        card4: {
          title: 'Self-Service Analytics',
          description: 'Empodera a equipos de negocio para explorar datos sin depender de IT. Modelos semánticos que garantizan consistencia.',
          metric: '80% menos tickets IT'
        }
      },
      capabilities: {
        title: 'Nuestro Enfoque',
        subtitle: 'Expertise en las principales plataformas de BI del mercado',
        items: [
          {
            title: 'Modelado Semántico de Datos',
            description: 'Diseñamos capas semánticas (star schema, OLAP cubes) que garantizan métricas consistentes across toda la organización. Un solo lugar donde se define "revenue", "CAC" o "churn".',
            features: [
              'Star schema y dimensional modeling',
              'Business logic centralizada (métrica definitions)',
              'Row-level security para acceso granular',
              'Relaciones y jerarquías optimizadas',
              'Documentación de métricas y KPIs'
            ]
          },
          {
            title: 'Dashboards en Power BI, Looker y Tableau',
            description: 'Implementamos dashboards interactivos en la plataforma de tu elección. Diseño centrado en el usuario con drill-downs, filtros y exportaciones para diferentes audiencias.',
            features: [
              'Dashboards ejecutivos para C-level',
              'Operational dashboards para equipos',
              'Drilldowns y exploraciones ad-hoc',
              'Mobile-responsive para decisiones on-the-go',
              'Exportación a PDF y Excel'
            ]
          },
          {
            title: 'Plataformas de BI Self-Hosted',
            description: 'Implementamos soluciones de BI open-source o self-hosted para máximo control y personalización. Ideal para empresas con requerimientos de data sovereignty o compliance estricto.',
            features: [
              'Metabase y Apache Superset deployment',
              'Redash para queries ad-hoc colaborativas',
              'Grafana para métricas y monitoring',
              'Control total sobre infraestructura y datos',
              'Customización sin límites de licencias'
            ]
          },
          {
            title: 'Alertas y Notificaciones Automatizadas',
            description: 'Configura alertas basadas en thresholds para ser notificado cuando métricas clave se desvían. Proactividad en lugar de reactividad.',
            features: [
              'Alertas por email/Slack cuando KPI < threshold',
              'Anomaly detection automatizado (ML-based)',
              'Reportes programados (daily, weekly, monthly)',
              'Notificaciones condicionales multi-step',
              'Integración con sistemas de ticketing'
            ]
          },
          {
            title: 'Embedded Analytics en tus Aplicaciones',
            description: 'Integra dashboards directamente en tu producto SaaS para que tus clientes accedan a analytics sin salir de tu app. White-label y multi-tenant.',
            features: [
              'Embedded iframes con SSO/SAML',
              'White-label (branding personalizado)',
              'Multi-tenancy con row-level security',
              'APIs para embedding programático',
              'Usage analytics y monetización'
            ]
          }
        ]
      },
      useCases: {
        title: 'Casos de Éxito',
        cases: [
          {
            label: 'SaaS / B2B',
            title: 'Dashboard Ejecutivo para Scale-up SaaS',
            flow: [
              {
                label: 'Problema',
                content: 'CEO de SaaS B2B con $10M ARR no tenía visibilidad real-time de métricas clave. Reportes manuales en Excel con datos de semana pasada.'
              },
              {
                label: 'Solución',
                content: 'Dashboard ejecutivo en Looker con MRR, CAC, LTV, churn y pipeline de ventas. Actualización cada 15 min desde Salesforce, Stripe y data warehouse.'
              },
              {
                label: 'Resultado',
                content: 'CEO toma decisiones estratégicas 3x más rápido. Identificación temprana de churn permitió reducirlo en 18%. Board meetings con datos actualizados en tiempo real.'
              }
            ]
          },
          {
            label: 'E-commerce / Retail',
            title: 'Operational Dashboards para E-commerce',
            flow: [
              {
                label: 'Problema',
                content: 'Equipo de operaciones revisando 10+ herramientas para monitorear inventario, fulfillment y customer support. Datos inconsistentes entre sistemas.'
              },
              {
                label: 'Solución',
                content: 'Dashboards operacionales en Power BI: inventory levels, order fulfillment SLAs, support tickets. Capa semántica unifica métricas de Shopify, Zendesk, NetSuite.'
              },
              {
                label: 'Resultado',
                content: 'Reducción de 40% en stockouts por visibilidad de inventario. SLA de fulfillment mejorado de 72h a 48h. Equipo de ops ahorra 15h/semana en reporting manual.'
              }
            ]
          },
          {
            label: 'Fintech / Embedded',
            title: 'Embedded Analytics para Clientes B2B',
            flow: [
              {
                label: 'Problema',
                content: 'Fintech B2B sin analytics para sus clientes empresariales. Pedían reportes custom constantemente, generando carga operativa al equipo.'
              },
              {
                label: 'Solución',
                content: 'Embedded analytics en Tableau con white-label. Cada cliente accede a dashboards personalizados (transacciones, fees, reconciliación) dentro del portal.'
              },
              {
                label: 'Resultado',
                content: 'NPS de clientes +25 puntos. Reducción de 90% en solicitudes de reportes custom. Analytics embedded se convirtió en feature diferencial en ventas.'
              }
            ]
          }
        ]
      },
      techStack: {
        title: 'Tecnologías y Plataformas',
        subtitle: 'Stack de BI que dominamos y recomendamos',
        categories: [
          {
            title: 'BI Platforms',
            items: [
              'Power BI',
              'Looker',
              'Tableau',
              'Metabase'
            ]
          },
          {
            title: 'Semantic Layer & Modeling',
            items: [
              'dbt Metrics',
              'LookML (Looker)',
              'Power BI Dataflows',
              'Cube.js'
            ]
          },
          {
            title: 'Data Sources & Warehouses',
            items: [
              'Snowflake',
              'BigQuery',
              'Redshift',
              'Databricks'
            ]
          }
        ]
      },
      cta: {
        title: '¿Listo para visualizar tus datos?',
        description: 'Agenda una demo gratuita donde te mostramos cómo transformar tus datos en dashboards accionables en menos de 4 semanas.',
        button: 'Agendar demo gratuita'
      },
      relatedServices: {
        title: 'Servicios Relacionados',
        subtitle: 'Complementa tus dashboards con estos servicios',
        cards: [
          {
            title: 'Ingeniería de Datos',
            description: 'Pipelines robustos que alimentan tus dashboards con datos limpios y actualizados.'
          },
          {
            title: 'Data Science',
            description: 'Añade predictive analytics a tus dashboards con modelos de forecasting y churn.'
          },
          {
            title: 'Gobierno de Datos',
            description: 'Asegura que tus dashboards muestran datos confiables y gobernados.'
          }
        ],
        linkText: 'Ver servicio'
      }
    },
    dataSciencePage: {
      hero: {
        title: 'Data Science',
        tagline: 'Insights predictivos que generan valor',
        description: 'Modelos predictivos y analítica avanzada que anticipan tendencias, optimizan operaciones y maximizan ingresos. Convertimos datos históricos en ventajas competitivas mediante machine learning aplicado a problemas reales de negocio.',
        ctaPrimary: 'Agendar consultoría',
        ctaSecondary: 'Nuestros servicios'
      },
      valueProps: {
        title: '¿Por qué Data Science?',
        subtitle: 'Predictive analytics que impactan el bottom line',
        card1: {
          title: 'Anticipación de Tendencias',
          description: 'Forecasting de demanda, churn y revenue con modelos estadísticos y ML. Planifica con 90%+ accuracy en horizontes de 3-6 meses.',
          metric: '90%+ accuracy'
        },
        card2: {
          title: 'Segmentación Inteligente',
          description: 'Clustering de clientes por comportamiento, valor y propensión. Personaliza estrategias de marketing y producto por segmento.',
          metric: '+40% conversión'
        },
        card3: {
          title: 'Validación Estadística Rigurosa',
          description: 'Hipótesis testeadas con A/B testing, significance tests y confidence intervals. No más decisiones basadas en correlaciones espurias.',
          metric: '95% confidence'
        },
        card4: {
          title: 'Modelos en Producción',
          description: 'MLOps para deployar modelos a producción con monitoring, retraining y drift detection. Modelos que generan valor 24/7.',
          metric: '24/7 inference'
        }
      },
      capabilities: {
        title: 'Nuestro Enfoque',
        subtitle: 'Expertise en ML aplicado a casos de uso de negocio',
        items: [
          {
            title: 'Predicción de Demanda y Churn',
            description: 'Modelos de forecasting (ARIMA, Prophet, LSTM) para anticipar demanda de productos y modelos de churn para identificar clientes en riesgo antes de que se vayan.',
            features: [
              'Forecasting con Prophet, ARIMA, LSTM',
              'Churn prediction con XGBoost, LightGBM',
              'Feature engineering basado en comportamiento',
              'Calibración de probabilidades para scoring',
              'Backtesting riguroso con datos históricos'
            ]
          },
          {
            title: 'Segmentación de Clientes y LTV',
            description: 'Clustering (K-means, DBSCAN) para segmentar clientes por comportamiento. Modelos de LTV (Lifetime Value) para priorizar acquisition y retention efforts.',
            features: [
              'RFM analysis y behavioral clustering',
              'LTV prediction con survival models',
              'Cohort analysis y retention curves',
              'Propensity models para upsell/cross-sell',
              'Personalización de campañas por segmento'
            ]
          },
          {
            title: 'Detección de Patrones Heurísticos',
            description: 'Análisis exploratorio para descubrir patrones no obvios en datos. Anomaly detection para fraude, outliers y eventos inusuales que requieren atención.',
            features: [
              'Exploratory Data Analysis (EDA) profunda',
              'Anomaly detection (Isolation Forest, autoencoders)',
              'Association rules mining (Market Basket Analysis)',
              'Time series decomposition (trend, seasonality)',
              'Causal inference para identificar drivers reales'
            ]
          },
          {
            title: 'Validación Estadística Rigurosa',
            description: 'A/B testing con power analysis, multiple testing correction. Confidence intervals, hypothesis testing y causal inference para decisiones fundamentadas.',
            features: [
              'A/B test design con power analysis',
              'Bayesian A/B testing para early stopping',
              'Multiple testing correction (Bonferroni, FDR)',
              'Causal inference (propensity score matching, DiD)',
              'Interpretabilidad de modelos (SHAP, LIME)'
            ]
          }
        ]
      },
      useCases: {
        title: 'Casos de Éxito',
        cases: [
          {
            label: 'SaaS / B2B',
            title: 'Churn Prediction para SaaS B2B',
            flow: [
              {
                label: 'Problema',
                content: 'SaaS B2B con 25% annual churn. Equipo de CS reactivo: contactaban clientes después de que cancelaban. $2M ARR perdido anualmente.'
              },
              {
                label: 'Solución',
                content: 'Modelo de churn con XGBoost usando features de uso de producto (logins, features utilizadas, tickets de soporte). Scoring semanal para identificar at-risk accounts.'
              },
              {
                label: 'Resultado',
                content: 'Churn reducido de 25% a 17% en 6 meses. CS team proactivo salva 40% de at-risk accounts. Revenue recovery de $800K/año. ROI del proyecto: 8x.'
              }
            ]
          },
          {
            label: 'Retail / E-commerce',
            title: 'Demand Forecasting para Retail',
            flow: [
              {
                label: 'Problema',
                content: 'Retailer con stockouts frecuentes y overstock simultáneo. Forecasting manual con Excel. 30% error rate en predicciones de demanda.'
              },
              {
                label: 'Solución',
                content: 'Modelos de forecasting con Prophet + features de promociones, estacionalidad, eventos especiales. Forecast a nivel SKU-tienda con horizonte de 4 semanas.'
              },
              {
                label: 'Resultado',
                content: 'Error de forecasting reducido a 12% (MAPE). Stockouts -40%, overstock -35%. Working capital liberado: $3M. Satisfacción de clientes +15% por disponibilidad.'
              }
            ]
          },
          {
            label: 'Fintech / Banking',
            title: 'Customer LTV Segmentation',
            flow: [
              {
                label: 'Problema',
                content: 'Fintech gastando igualmente en todos los clientes adquiridos. CAC alto ($200) con LTV desconocido. Algunos clientes no generaban valor suficiente.'
              },
              {
                label: 'Solución',
                content: 'Modelo de LTV prediction usando transacciones, productos contratados, demografía. Segmentación en High/Medium/Low value. Estrategias diferenciadas por segmento.'
              },
              {
                label: 'Resultado',
                content: 'Marketing budget reasignado a segmentos High LTV. CAC optimizado por segmento. ROI de marketing +60%. LTV/CAC ratio mejorado de 2.5x a 4.2x.'
              }
            ]
          }
        ]
      },
      techStack: {
        title: 'Tecnologías y Frameworks',
        subtitle: 'Stack de ML y data science que dominamos',
        categories: [
          {
            title: 'ML Frameworks & Libraries',
            items: [
              'Scikit-learn',
              'XGBoost / LightGBM',
              'TensorFlow / PyTorch',
              'Prophet / statsmodels'
            ]
          },
          {
            title: 'MLOps & Deployment',
            items: [
              'MLflow',
              'Weights & Biases',
              'SageMaker',
              'Databricks MLR'
            ]
          },
          {
            title: 'Analysis & Experimentation',
            items: [
              'Python (Pandas, NumPy)',
              'R (tidyverse)',
              'Jupyter / Databricks',
              'Optimizely / GrowthBook'
            ]
          }
        ]
      },
      cta: {
        title: '¿Listo para predecir el futuro de tu negocio?',
        description: 'Agenda una sesión de discovery gratuita. Identificaremos casos de uso de ML con alto ROI para tu industria y negocio.',
        button: 'Agendar discovery session'
      },
      relatedServices: {
        title: 'Servicios Relacionados',
        subtitle: 'Complementa tus modelos con infraestructura robusta',
        cards: [
          {
            title: 'Ingeniería de Datos',
            description: 'Pipelines que alimentan tus modelos con features limpias y actualizadas.'
          },
          {
            title: 'Business Intelligence',
            description: 'Dashboards que visualizan predicciones y scores de tus modelos.'
          },
          {
            title: 'AI / GenAI',
            description: 'Agentes inteligentes que actúan sobre tus insights predictivos.'
          }
        ],
        linkText: 'Ver servicio'
      }
    },
    gobiernoPage: {
      hero: {
        title: 'Gobierno de Datos',
        tagline: 'Datos confiables, decisiones acertadas',
        description: 'Establecemos personas, procesos y políticas para garantizar calidad, seguridad y cumplimiento normativo de tus datos. Transformamos el caos de datos en un activo estratégico gobernado y confiable.',
        ctaPrimary: 'Agendar consultoría',
        ctaSecondary: 'Nuestros servicios'
      },
      valueProps: {
        title: '¿Por qué Gobierno de Datos?',
        subtitle: 'Confianza, compliance y calidad en cada decisión basada en datos',
        card1: {
          title: 'Cumplimiento Normativo',
          description: 'Aseguramos compliance con GDPR, CCPA, SOC 2 y regulaciones de tu industria. Evita multas millonarias y riesgos legales.',
          metric: '100% Compliance'
        },
        card2: {
          title: 'Calidad de Datos',
          description: 'Implementamos SLAs de calidad con monitoreo automatizado. Reduce errores de datos que impactan decisiones de negocio.',
          metric: '95%+ Calidad'
        },
        card3: {
          title: 'Catálogo Centralizado',
          description: 'Data catalog con metadata, lineage y ownership claros. Encuentra y entiende datos en minutos, no semanas.',
          metric: '90% menos búsqueda'
        },
        card4: {
          title: 'Roles y Responsabilidades',
          description: 'Modelo RACI con data owners, stewards y custodians claramente definidos. Accountability en cada dataset.',
          metric: 'Ownership claro'
        }
      },
      capabilities: {
        title: 'Nuestro Enfoque',
        subtitle: 'Framework completo de Data Governance basado en DAMA-DMBOK',
        items: [
          {
            title: 'Modelo RACI y Roles de Datos',
            description: 'Definimos estructura organizacional con roles clave: Chief Data Officer, Data Owners, Data Stewards, Data Custodians. Matriz RACI para clarificar responsabilidades.',
            features: [
              'Definición de roles y responsabilidades',
              'Matriz RACI por dominio de datos',
              'Job descriptions para nuevos roles',
              'Modelo de governance operativo',
              'Comité de datos y cadencia de reuniones'
            ]
          },
          {
            title: 'Catálogo de Datos Centralizado',
            description: 'Implementamos data catalog (Alation, Collibra, Atlan) con metadata enriquecido, lineage automatizado y búsqueda inteligente. Single source of truth para data assets.',
            features: [
              'Setup de herramienta de data catalog',
              'Metadata harvesting automatizado',
              'Data lineage end-to-end',
              'Business glossary y términos de negocio',
              'Search y discovery para self-service'
            ]
          },
          {
            title: 'SLAs de Calidad de Datos (Data Quality)',
            description: 'Establecemos dimensiones de calidad (accuracy, completeness, timeliness) con métricas y thresholds. Monitoreo automatizado con alertas en caso de degradación.',
            features: [
              'Definición de dimensiones de calidad',
              'SLAs por dataset crítico (accuracy, completeness, etc.)',
              'Implementación de data quality checks',
              'Dashboards de monitoreo en tiempo real',
              'Procesos de remediación y escalamiento'
            ]
          },
          {
            title: 'Políticas de Acceso, Privacidad y Seguridad',
            description: 'Diseñamos políticas de acceso (RBAC), clasificación de datos (PII, confidencial), y procesos de compliance (GDPR, CCPA). Auditoría de accesos y data retention.',
            features: [
              'Clasificación de datos (público, interno, confidencial, PII)',
              'Políticas RBAC (role-based access control)',
              'Procesos de data privacy (GDPR, CCPA)',
              'Data retention y archiving policies',
              'Auditoría de accesos y compliance reporting'
            ]
          }
        ]
      },
      useCases: {
        title: 'Casos de Éxito',
        cases: [
          {
            label: 'Fintech / Banking',
            title: 'Compliance GDPR en 90 Días',
            flow: [
              {
                label: 'Problema',
                content: 'Fintech procesando datos de clientes EU sin compliance GDPR. Riesgo de multas de hasta €20M. No había inventario de datos personales.'
              },
              {
                label: 'Solución',
                content: 'Inventario completo de PII en 2 semanas. Implementación de políticas de acceso, retention y right-to-be-forgotten. Data catalog con clasificación automatizada.'
              },
              {
                label: 'Resultado',
                content: '100% compliance GDPR en 90 días. Certificación SOC 2 Type II lograda. Procesos documentados y auditables. Riesgo legal eliminado.'
              }
            ]
          },
          {
            label: 'Healthcare / Enterprise',
            title: 'Programa de Data Quality en Hospital',
            flow: [
              {
                label: 'Problema',
                content: 'Hospital con 15% de errores en datos de pacientes. Reportes regulatorios rechazados. Decisiones clínicas basadas en datos incorrectos.'
              },
              {
                label: 'Solución',
                content: 'Implementación de Great Expectations para validación automatizada. Definición de SLAs por dataset crítico. Dashboard de data quality para C-level.'
              },
              {
                label: 'Resultado',
                content: 'Errores reducidos a 3% en 6 meses. Reportes regulatorios aprobados en primer intento. Mayor confianza en decisiones clínicas. ROI medible en reducción de re-trabajos.'
              }
            ]
          },
          {
            label: 'E-commerce / Scale-up',
            title: 'Data Catalog para Self-Service Analytics',
            flow: [
              {
                label: 'Problema',
                content: 'Analistas de negocio gastaban 60% del tiempo buscando datos correctos. 150+ tablas en warehouse sin documentación. Duplicación de esfuerzos.'
              },
              {
                label: 'Solución',
                content: 'Implementación de Atlan como data catalog. Harvesting automático de metadata. Business glossary con 200+ términos. Training para analistas.'
              },
              {
                label: 'Resultado',
                content: 'Tiempo de búsqueda reducido en 80%. Self-service analytics habilitado. Data discovery en 2 minutos vs. 2 horas. NPS de analistas: 9/10.'
              }
            ]
          }
        ]
      },
      techStack: {
        title: 'Tecnologías y Frameworks',
        subtitle: 'Stack de herramientas de Data Governance',
        categories: [
          {
            title: 'Data Catalog & Lineage',
            items: [
              'Alation',
              'Collibra',
              'Atlan',
              'OpenMetadata'
            ]
          },
          {
            title: 'Data Quality',
            items: [
              'Great Expectations',
              'Monte Carlo',
              'Soda',
              'dbt Tests'
            ]
          },
          {
            title: 'Frameworks & Standards',
            items: [
              'DAMA-DMBOK',
              'DCAM',
              'GDPR',
              'SOC 2'
            ]
          }
        ]
      },
      cta: {
        title: '¿Listo para gobernar tus datos?',
        description: 'Comienza con un assessment gratuito de madurez de data governance. Identificaremos gaps y priorizaremos iniciativas de alto impacto.',
        button: 'Solicitar assessment gratuito'
      },
      relatedServices: {
        title: 'Servicios Relacionados',
        subtitle: 'Complementa tu programa de governance',
        cards: [
          {
            title: 'Consultoría en Datos',
            description: 'Define la estrategia de datos antes de implementar governance.'
          },
          {
            title: 'Ingeniería de Datos',
            description: 'Implementa pipelines con data quality checks integrados.'
          },
          {
            title: 'Data Science',
            description: 'Modelos confiables requieren datos gobernados y de calidad.'
          }
        ],
        linkText: 'Ver servicio'
      }
    },
    ingenieriaPage: {
      hero: {
        title: 'Ingeniería de Datos',
        tagline: 'Pipelines escalables y eficientes',
        description: 'Migraciones, pipelines ETL y arquitecturas modernas para procesar grandes volúmenes de datos de manera eficiente. Construimos infraestructura de datos robusta que escala con tu negocio sin aumentar costos linealmente.',
        ctaPrimary: 'Agendar consultoría',
        ctaSecondary: 'Nuestros servicios'
      },
      valueProps: {
        title: '¿Por qué Ingeniería de Datos?',
        subtitle: 'Infraestructura de datos que escala sin comprometer performance',
        card1: {
          title: 'Procesamiento a Escala',
          description: 'Pipelines que procesan millones de registros en minutos, no horas. Arquitecturas distribuidas con Spark para big data processing.',
          metric: '100M+ registros/día'
        },
        card2: {
          title: 'Optimización de Costos',
          description: 'Reducimos costos de cloud hasta en 50% mediante arquitecturas eficientes, particionamiento inteligente y auto-scaling.',
          metric: 'Hasta 50% ahorro'
        },
        card3: {
          title: 'Confiabilidad 24/7',
          description: 'Pipelines resilientes con retry logic, alertas y monitoring. SLAs de uptime >99.5% para cargas críticas de datos.',
          metric: '99.5% uptime'
        },
        card4: {
          title: 'Migraciones Sin Downtime',
          description: 'Migramos desde legacy systems (on-prem, databases viejas) a cloud moderno sin interrumpir operaciones de negocio.',
          metric: 'Zero downtime'
        }
      },
      capabilities: {
        title: 'Nuestro Enfoque',
        subtitle: 'Expertise en arquitecturas modernas de datos (batch, streaming, real-time)',
        items: [
          {
            title: 'Ingesta Incremental y Batch de Datos',
            description: 'Implementamos pipelines de ingesta desde múltiples fuentes (databases, APIs, archivos) con estrategias incrementales (CDC) para minimizar carga y latencia.',
            features: [
              'Change Data Capture (CDC) con Debezium/Fivetran',
              'Ingesta desde APIs REST/GraphQL',
              'Batch processing de archivos (S3, SFTP)',
              'Connectors para SaaS apps (Salesforce, HubSpot, etc.)',
              'Schema evolution y versionado'
            ]
          },
          {
            title: 'Orquestación con Airflow y Dagster',
            description: 'Orquestamos pipelines complejos con dependencias, retries y alertas. DAGs versionados en Git con CI/CD para deployment automatizado.',
            features: [
              'DAGs modulares y reutilizables',
              'Manejo de dependencias y backfills',
              'Retry logic y circuit breakers',
              'Alertas por Slack/PagerDuty en fallos',
              'CI/CD con testing automatizado'
            ]
          },
          {
            title: 'Transformaciones con dbt y Spark',
            description: 'Transformamos raw data en modelos analíticos usando dbt (SQL) para batch y Spark para big data. Tests automatizados y documentación generada.',
            features: [
              'dbt models con testing y documentación',
              'Incremental models para eficiencia',
              'Spark jobs para PB-scale processing',
              'Data quality tests automatizados',
              'Lineage tracking end-to-end'
            ]
          },
          {
            title: 'Optimización de Costos en Cloud',
            description: 'Auditamos y optimizamos infraestructura existente: particionamiento, clustering, auto-suspend, reserved capacity. FinOps para data teams.',
            features: [
              'Análisis de costos (compute, storage, egress)',
              'Particionamiento y clustering strategies',
              'Auto-suspend/resume para warehouses',
              'Reserved instances y savings plans',
              'Query optimization y caching'
            ]
          }
        ]
      },
      useCases: {
        title: 'Casos de Éxito',
        cases: [
          {
            label: 'Fintech / Scale-up',
            title: 'Migración de PostgreSQL a Snowflake',
            flow: [
              {
                label: 'Problema',
                content: 'Fintech con 50M transacciones/mes en PostgreSQL on-prem. Queries lentos (+30s), backups fallando, y equipo de 2 DBAs saturados.'
              },
              {
                label: 'Solución',
                content: 'Migración a Snowflake con CDC incremental usando Fivetran. Pipelines de dbt para transformaciones. Airflow para orquestación. Zero downtime migration.'
              },
              {
                label: 'Resultado',
                content: 'Queries 10x más rápidos (30s → 3s). Backups automatizados. DBAs liberados para proyectos estratégicos. Costos 30% menores vs. mantener on-prem.'
              }
            ]
          },
          {
            label: 'E-commerce / Retail',
            title: 'Real-time Inventory Pipeline',
            flow: [
              {
                label: 'Problema',
                content: 'E-commerce con inventory sync cada 6 horas. Vendían productos out-of-stock, generando cancelaciones y NPS bajo.'
              },
              {
                label: 'Solución',
                content: 'Pipeline real-time con Kafka + Flink. CDC desde ERP (SAP). Stream processing para calcular available-to-promise inventory. Latencia <1 min.'
              },
              {
                label: 'Resultado',
                content: 'Cancelaciones por stockout reducidas en 75%. NPS +12 puntos. Revenue recovery de $500K/año por mejor inventory accuracy.'
              }
            ]
          },
          {
            label: 'SaaS / B2B',
            title: 'Data Platform para Product Analytics',
            flow: [
              {
                label: 'Problema',
                content: 'SaaS B2B sin visibilidad de user behavior. Eventos de producto dispersos en logs. PM team sin datos para priorizar roadmap.'
              },
              {
                label: 'Solución',
                content: 'Event streaming con Segment + BigQuery. dbt para modelar user journeys, funnels, retention cohorts. Dashboards en Looker para PM team.'
              },
              {
                label: 'Resultado',
                content: 'PM team identifica feature adoption en días, no meses. Experimentos A/B con significancia estadística. Roadmap data-driven resultó en +30% activation rate.'
              }
            ]
          }
        ]
      },
      techStack: {
        title: 'Tecnologías y Frameworks',
        subtitle: 'Stack moderno de data engineering',
        categories: [
          {
            title: 'Orchestration & Workflow',
            items: [
              'Apache Airflow',
              'Dagster',
              'Prefect',
              'Kestra'
            ]
          },
          {
            title: 'Processing & Transformation',
            items: [
              'dbt',
              'Apache Spark',
              'Apache Flink',
              'Kafka Streams'
            ]
          },
          {
            title: 'Ingestion & Integration',
            items: [
              'Fivetran',
              'Airbyte',
              'Debezium (CDC)',
              'Kafka Connect'
            ]
          }
        ]
      },
      cta: {
        title: '¿Listo para modernizar tu infraestructura de datos?',
        description: 'Agenda una sesión de architecture review gratuita. Evaluaremos tu stack actual e identificaremos oportunidades de optimización.',
        button: 'Agendar architecture review'
      },
      relatedServices: {
        title: 'Servicios Relacionados',
        subtitle: 'Maximiza el valor de tu infraestructura de datos',
        cards: [
          {
            title: 'Consultoría en Datos',
            description: 'Define la arquitectura y roadmap antes de implementar pipelines.'
          },
          {
            title: 'Business Intelligence',
            description: 'Dashboards alimentados por tus pipelines de datos robustos.'
          },
          {
            title: 'Gobierno de Datos',
            description: 'Asegura calidad y compliance en tus pipelines con data governance.'
          }
        ],
        linkText: 'Ver servicio'
      }
    },
    aiGenaiPage: {
      hero: {
        title: 'AI / GenAI',
        tagline: 'De datos a acciones automatizadas',
        description: 'Agentes inteligentes que automatizan procesos, aceleran ventas y potencian decisiones estratégicas. Convertimos datos en acciones mediante IA generativa y agentes autónomos que trabajan 24/7 para tu negocio.',
        ctaPrimary: 'Agendar demo',
        ctaSecondary: 'Nuestros servicios'
      },
      valueProps: {
        title: '¿Por qué AI / GenAI?',
        subtitle: 'Automatización inteligente que escala tus operaciones sin headcount',
        card1: {
          title: 'Automatización Inteligente',
          description: 'Agentes que ejecutan tareas repetitivas con precisión humana. Liberan a tu equipo para enfocarse en trabajo estratégico de alto valor.',
          metric: '80% tareas automatizadas'
        },
        card2: {
          title: 'Velocidad 10x',
          description: 'Procesos que tomaban horas ahora se completan en minutos. Web scraping, análisis de datos y generación de reportes a velocidad de máquina.',
          metric: '10x más rápido'
        },
        card3: {
          title: 'ROI en Semanas',
          description: 'Pilotos funcionales en 2-3 semanas. Valida el valor de IA antes de comprometer presupuestos grandes. Iteración rápida basada en feedback.',
          metric: '2-3 semanas piloto'
        },
        card4: {
          title: 'Personalización a Escala',
          description: 'GenAI para personalizar contenido, emails y propuestas para miles de clientes simultáneamente. Relevancia 1-to-1 a escala industrial.',
          metric: '1000+ personalizado/día'
        }
      },
      capabilities: {
        title: 'Nuestro Enfoque',
        subtitle: 'Expertise en IA aplicada a casos de uso de negocio reales',
        items: [
          {
            title: 'Web Scrapers y Agentes de Datos',
            description: 'Agentes inteligentes que extraen, estructuran y enriquecen datos de fuentes públicas y privadas. Monitoreo continuo de competidores, noticias y tendencias de mercado.',
            features: [
              'Web scraping con manejo de JavaScript, CAPTCHAs, rate limits',
              'Extracción de datos de PDFs, imágenes (OCR), documentos',
              'Enriquecimiento con APIs externas (LinkedIn, Clearbit, etc.)',
              'Agentes que se adaptan a cambios en estructura de sitios',
              'Pipelines de validación y limpieza automatizada'
            ]
          },
          {
            title: 'Activadores Automáticos de Ventas',
            description: 'Sales enablement agents que identifican señales de compra (funding rounds, hiring, tech stack changes) y generan outreach personalizado automáticamente.',
            features: [
              'Monitoreo de intent signals (funding, job postings, tech changes)',
              'Scoring de leads en tiempo real',
              'Generación de emails personalizados con GenAI',
              'Follow-ups automatizados basados en engagement',
              'Integración con CRM (Salesforce, HubSpot)'
            ]
          },
          {
            title: 'Copilotos de Decisiones Empresariales',
            description: 'Asistentes IA que analizan datos, generan insights y recomiendan acciones. Copilots entrenados en tus datos que responden preguntas complejas en lenguaje natural.',
            features: [
              'Q&A sobre tus datos en lenguaje natural',
              'Generación automática de reportes ejecutivos',
              'Recomendaciones basadas en patrones históricos',
              'RAG (Retrieval-Augmented Generation) sobre docs internos',
              'Fine-tuning de LLMs en tu dominio específico'
            ]
          },
          {
            title: 'Orquestadores Inteligentes de Reuniones',
            description: 'Agentes que transcriben, resumen y generan action items de reuniones automáticamente. Sincronización con CRM, calendarios y herramientas de project management.',
            features: [
              'Transcripción automática de reuniones (Zoom, Meet, Teams)',
              'Summarización con GenAI (key points, decisions, next steps)',
              'Extracción de action items y asignación de responsables',
              'Actualización automática de CRM con insights de llamadas',
              'Análisis de sentiment y engagement en sales calls'
            ]
          }
        ]
      },
      useCases: {
        title: 'Casos de Éxito',
        cases: [
          {
            label: 'SaaS / Sales Enablement',
            title: 'Sales Enablement Agent para Outbound',
            flow: [
              {
                label: 'Problema',
                content: 'SDR team gastando 80% del tiempo en research de prospects y escribiendo cold emails. Solo 20% del tiempo en conversaciones reales. Low conversion rate.'
              },
              {
                label: 'Solución',
                content: 'Agente que monitorea funding rounds, job postings, tech stack changes. Genera emails personalizados con GenAI (GPT-4) basados en señales específicas. Auto-enqueue en Outreach.'
              },
              {
                label: 'Resultado',
                content: 'SDRs liberan 60% de su tiempo para conversaciones. Reply rate +35%. Pipeline generado +50% con mismo headcount. ROI del agente: 12x en 6 meses.'
              }
            ]
          },
          {
            label: 'Private Equity / Research',
            title: 'Competitive Intelligence Agent',
            flow: [
              {
                label: 'Problema',
                content: 'PE firm necesitaba monitorear 200+ empresas de portfolio para identificar riesgos y oportunidades. Analistas pasaban 20h/semana en research manual.'
              },
              {
                label: 'Solución',
                content: 'Web scraping agent que monitorea news, financial filings, social media, job postings. NLP para sentiment analysis y alertas sobre eventos críticos. Dashboard con insights.'
              },
              {
                label: 'Resultado',
                content: 'Analistas ahorran 80% del tiempo de research. Identificación temprana de riesgos permitió intervenir en 3 portfolio companies. Oportunidades de M&A detectadas 6 meses antes.'
              }
            ]
          },
          {
            label: 'Consulting / Knowledge Management',
            title: 'Internal Knowledge Copilot',
            flow: [
              {
                label: 'Problema',
                content: 'Consultora con 10 años de deliverables, case studies y methodologies dispersos en Sharepoint. Consultants no encontraban assets relevantes, recreando trabajo ya hecho.'
              },
              {
                label: 'Solución',
                content: 'RAG-based copilot sobre 10K documentos internos. Semantic search y Q&A en lenguaje natural. Integrado en Slack para acceso instantáneo. Citaciones a fuentes originales.'
              },
              {
                label: 'Resultado',
                content: 'Tiempo de búsqueda reducido de 2h a 5 min. Reutilización de assets +60%. Onboarding de nuevos consultants 3x más rápido. Knowledge retention ante turnover.'
              }
            ]
          }
        ]
      },
      techStack: {
        title: 'Tecnologías y Frameworks',
        subtitle: 'Stack de IA y automatización que dominamos',
        categories: [
          {
            title: 'LLMs & GenAI Platforms',
            items: [
              'OpenAI (GPT-4, o1)',
              'Anthropic (Claude)',
              'Google (Gemini)',
              'Open-source (Llama, Mistral)'
            ]
          },
          {
            title: 'Agent Frameworks & Orchestration',
            items: [
              'LangChain / LangGraph',
              'LlamaIndex',
              'AutoGen',
              'CrewAI'
            ]
          },
          {
            title: 'Infrastructure & Tooling',
            items: [
              'Vector DBs (Pinecone, Weaviate)',
              'Web Scraping (Playwright, Selenium)',
              'MLOps (Weights & Biases, MLflow)',
              'Monitoring (LangSmith, Helicone)'
            ]
          }
        ]
      },
      cta: {
        title: '¿Listo para automatizar con IA?',
        description: 'Agenda una sesión de ideación gratuita. Identificaremos procesos de tu empresa que pueden automatizarse con agentes inteligentes.',
        button: 'Agendar sesión de ideación'
      },
      relatedServices: {
        title: 'Servicios Relacionados',
        subtitle: 'Potencia tus agentes con datos y analytics',
        cards: [
          {
            title: 'Data Science',
            description: 'Modelos predictivos que alimentan tus agentes con insights accionables.'
          },
          {
            title: 'Ingeniería de Datos',
            description: 'Pipelines robustos que proveen datos limpios para tus agentes IA.'
          },
          {
            title: 'Consultoría en Datos',
            description: 'Estrategia de datos que maximiza el impacto de tus iniciativas de IA.'
          }
        ],
        linkText: 'Ver servicio'
      }
    }
  },
  en: {
    nav: {
      services: 'Services',
      solutions: 'Solutions',
      team: 'Team',
      clients: 'Clients',
      contact: 'Contact'
    },
    breadcrumb: {
      home: 'Home',
      services: 'Services',
      team: 'Team',
      clients: 'Clients',
      contact: 'Contact',
      consultoria: 'Data Consulting',
      bi: 'Business Intelligence',
      dataScience: 'Data Science',
      gobierno: 'Data Governance',
      ingenieria: 'Data Engineering',
      aiGenai: 'AI / GenAI'
    },
    hero: {
      title: 'Transforming Data into Insights',
      description: 'We transform data into your competitive advantage. Scale, innovate, and grow with us.',
      cta: {
        primary: 'Schedule a meeting',
        secondary: 'View services'
      }
    },
    services: {
      dataConsulting: {
        title: 'Data Consulting',
        description: 'We design customized strategies and roadmaps to maximize the value of your information at the lowest cost, focusing on measurable results.',
        bullets: [
          'Discovery of high-impact use cases',
          'Scalable and efficient data architecture',
          'Cost evaluation and optimization',
          'Pilots and proof of concepts (PoCs)'
        ]
      },
      dataGovernance: {
        title: 'Data Governance',
        description: 'We establish people, processes, and policies to ensure quality, security, and regulatory compliance of your data.',
        bullets: [
          'RACI model and data roles',
          'Centralized data catalog',
          'Data Quality SLAs',
          'Access, privacy, and security policies'
        ]
      },
      businessIntelligence: {
        title: 'Business Intelligence',
        description: 'Real-time interactive dashboards that transform complex data into actionable insights for your executive team.',
        bullets: [
          'Semantic data modeling',
          'Custom self-hosted BI platforms',
          'Dashboards in Power BI, Looker, and Tableau',
          'Automated alerts and notifications',
          'Embedded analytics in your applications'
        ]
      },
      dataEngineering: {
        title: 'Data Engineering',
        description: 'Migrations, ETL pipelines, and modern architectures to efficiently process large data volumes.',
        bullets: [
          'Incremental and batch data ingestion',
          'Data orchestration',
          'Transformations',
          'Cloud cost optimization'
        ]
      },
      dataScience: {
        title: 'Data Science',
        description: 'Predictive models and advanced analytics that anticipate trends, optimize operations, and maximize revenue.',
        bullets: [
          'Demand and churn prediction',
          'Customer segmentation and LTV',
          'Heuristic pattern detection',
          'Rigorous statistical validation'
        ]
      },
      aiGenAI: {
        title: 'AI / GenAI',
        description: 'From data to action: intelligent agents that automate processes, accelerate sales, and enhance strategic decisions.',
        bullets: [
          'Data agents',
          'Automatic sales triggers',
          'Decision copilots',
          'Intelligent orchestrators'
        ]
      }
    },
    solutions: {
      title: 'Solutions by Area',
      subtitle: 'Specific use cases tailored to your business needs',
      cards: [
        {
          title: 'Sales & Growth',
          description: 'Conversion and ROI optimization through predictive analytics.',
          items: [
            'Predictive lead scoring for intelligent commercial prioritization',
            'Dynamic audience segmentation and market micro-segmentation',
            'Multi-touch attribution models for advertising investment optimization',
            'Churn prediction and proactive retention strategy design'
          ]
        },
        {
          title: 'Operational Efficiency',
          description: 'Cost reduction and resource optimization with real-time data.',
          items: [
            'Inventory optimization and full supply chain visibility',
            'Demand forecasting models and operational resource planning',
            'Intelligent real-time operational anomaly detection systems',
            'Complex process automation through RPA + AI integration'
          ]
        },
        {
          title: 'Customer Experience (CX)',
          description: 'Customer lifetime value maximization and intelligent loyalty.',
          items: [
            'Sentiment analysis and voice of the customer through natural language processing (NLP)',
            'Customer Lifetime Value (CLV) models for customer value segmentation',
            'AI-powered recommendation engines and content personalization',
            'Post-sale funnel optimization and proactive technical support systems'
          ]
        },
        {
          title: 'Strategy & Finance',
          description: 'Centralized intelligence for C-Suite high-level decision making.',
          items: [
            'Executive dashboards with critical KPI visualization and business health',
            'Advanced financial forecasting models and cash flow projections',
            'Detailed profitability analysis by product, channel, and business unit',
            'Support in adopting data culture and analytical literacy'
          ]
        }
      ]
    },
    infrastructure: {
      title: 'The Engine Behind Data',
      subtitle: 'To activate high-impact solutions, we deploy data agents and robust architectures that ensure the integrity and flow of information end-to-end:',
      components: [
        {
          title: 'Web Scrapers',
          description: 'Automated competitor and market monitoring'
        },
        {
          title: 'Enrichment Agents',
          description: 'Data validation and cleaning with advanced AI'
        },
        {
          title: 'Multi-platform Synchronization',
          description: 'Full integration of ERPs, CRMs and external sources'
        },
        {
          title: 'Data Governance',
          description: 'Quality assurance, data cleansing and information security'
        }
      ]
    },
    boutique: {
      title: "Your challenge doesn't fit into these categories?",
      description: 'We are a boutique consultancy. We don\'t believe in canned solutions. We build <strong>100% ad-hoc</strong> analytics architectures to solve specific problems that require a creative and technical approach from scratch.',
      cta: 'Schedule Diagnostic Consultation'
    },
    clients: {
      title: 'Clients Who Trust Us',
      subtitle: 'We work with leading companies across various industries',
      testimonialsTitle: 'What Our Clients Say',
      testimonials: [
        {
          quote: '"Pullai transformed our data strategy. In 6 months we reduced costs by 40% and increased insights speed by 10x."',
          author: 'Guadalupe Ureta',
          role: 'Partner',
          client: 'Seminarium',
          avatar: 'assets/img/testimonials/guadalupe-ureta.jpg',
          rating: 5
        },
        {
          quote: '"The predictive churn models allowed us to retain 10% more customers. Incredible ROI in the first quarter."',
          author: 'Sebastián Manhood',
          role: 'Co-Founder and Operations Manager',
          client: 'MyHotel',
          avatar: 'assets/img/testimonials/sebastian-manhood.jpg',
          rating: 5
        },
        {
          quote: '"Real-time dashboards have revolutionized how we make decisions. Now we have complete visibility of all our operations."',
          author: 'Claudia Castañón',
          role: 'Director',
          client: 'ClouHR',
          avatar: 'assets/img/testimonials/claudia-castanon.jpg',
          rating: 5
        }
      ]
    },
    contact: {
      title: "Let's Talk About Your Project",
      subtitle: 'We are ready to help you transform your data into results',
      info: {
        title: 'Connect With Us',
        description: 'Do you have a project in mind? Need strategic data consulting? Contact us and discover how we can help you.'
      },
      form: {
        name: 'Full name *',
        email: 'Email *',
        company: 'Company',
        message: 'Message *',
        submit: 'Send message'
      }
    },
    alliances: {
      toggle: 'Strategic Alliances',
      description: 'To ensure our clients have comprehensive solutions, we work with specialized partners in complementary areas.',
      partners: [
        {
          description: 'Financial and strategic advisory. Your Corporate Finance team.'
        }
      ]
    },
    footer: {
      copyright: 'All rights reserved.'
    },
    languageButton: 'Español',
    consultoriaPage: {
      hero: {
        title: 'Data Consulting',
        tagline: 'From strategy to execution',
        description: 'We design customized strategies and roadmaps to maximize the value of your information at the lowest cost, focusing on measurable results. We transform your data vision into an actionable roadmap with real business impact.',
        ctaPrimary: 'Schedule consultation',
        ctaSecondary: 'Our services'
      },
      valueProps: {
        title: 'Why Data Consulting?',
        subtitle: 'We turn data complexity into clear competitive advantages',
        card1: {
          title: 'High-Impact Use Cases',
          description: 'We identify and prioritize data initiatives that generate measurable ROI in less than 6 months, avoiding "vanity" projects with no return.',
          metric: '6-12 months ROI'
        },
        card2: {
          title: 'Cost Optimization',
          description: 'We reduce infrastructure and data operations costs by up to 40% through efficient architectures and appropriate technologies.',
          metric: 'Up to 40% savings'
        },
        card3: {
          title: 'Actionable Roadmap',
          description: 'We deliver detailed implementation plans with phases, milestones, and clear success metrics, not just theoretical presentations.',
          metric: '100% executable'
        },
        card4: {
          title: 'Rapid Results',
          description: 'We validate hypotheses with pilots and PoCs in weeks, not months, to demonstrate early value and adjust strategy.',
          metric: '2-4 weeks PoC'
        }
      },
      capabilities: {
        title: 'Our Approach',
        subtitle: 'Proven methodologies in startups, scale-ups and Fortune 500',
        items: [
          {
            title: 'High-Impact Use Case Discovery',
            description: 'We facilitate workshops with key stakeholders to identify data opportunities that truly move the business needle. We prioritize using impact vs. effort frameworks.',
            features: [
              'Interviews with C-level and area leaders',
              'Analysis of pain points and opportunities',
              'Prioritization matrix (impact vs. effort)',
              'Definition of KPIs and success metrics',
              'Business case with ROI projection'
            ]
          },
          {
            title: 'Scalable and Efficient Data Architecture',
            description: 'We design modern architectures (cloud-native, lakehouse, mesh) tailored to your scale and budget. We avoid over-engineering and optimize for low operational costs.',
            features: [
              'Cloud-native architecture (AWS, GCP, Azure)',
              'Modern patterns: Data Lakehouse, Data Mesh',
              'TCO (Total Cost of Ownership) estimation',
              'Migration plan from legacy systems',
              'Documented reference architecture'
            ]
          },
          {
            title: 'Cost Evaluation and Optimization',
            description: 'We audit existing infrastructure to identify inefficiencies and waste. We optimize queries, storage, and compute to reduce cloud bills by up to 50%.',
            features: [
              'Current cost analysis (compute, storage, egress)',
              'Identification of underutilized resources',
              'Query and pipeline optimization',
              'Reserved instances and savings plans',
              'Continuous cost monitoring (FinOps)'
            ]
          },
          {
            title: 'Pilots and Proof of Concepts (PoCs)',
            description: 'We validate technologies and approaches with rapid pilots (2-4 weeks) before committing large budgets. We demonstrate tangible value with real data.',
            features: [
              'PoC design with clear success criteria',
              'Rapid implementation with real data',
              'Business hypothesis validation',
              'Functional demo for stakeholders',
              'Informed go/no-go recommendation'
            ]
          }
        ]
      },
      useCases: {
        title: 'Success Stories',
        cases: [
          {
            label: 'Retail / E-commerce',
            title: 'Data-Driven Personalization Strategy',
            flow: [
              {
                label: 'Problem',
                content: 'E-commerce startup with 500K users couldn\'t personalize experience. Data scattered across 6 systems without integration.'
              },
              {
                label: 'Solution',
                content: 'We designed Customer Data Platform (CDP) architecture with Segment + Snowflake. We defined use cases: recommendations, email campaigns, cart abandonment.'
              },
              {
                label: 'Result',
                content: '+35% in email campaign conversion, +22% in AOV (Average Order Value). Positive ROI in 4 months. Stack implemented in 8 weeks.'
              }
            ]
          },
          {
            label: 'Fintech / SaaS',
            title: '60% Cloud Cost Reduction',
            flow: [
              {
                label: 'Problem',
                content: 'Scale-up with $150K/month on AWS. Inefficient pipelines processing duplicate data. Warehouses always on.'
              },
              {
                label: 'Solution',
                content: 'Complete resource audit. Migration to Snowflake with auto-suspend. Query optimization and partitioning. Reserved instances for stable workloads.'
              },
              {
                label: 'Result',
                content: 'Costs reduced to $60K/month (60% savings = $1M/year). Queries 3x faster. FinOps playbook documented for the team.'
              }
            ]
          },
          {
            label: 'Healthcare / Enterprise',
            title: 'Data Lake Modernization Roadmap',
            flow: [
              {
                label: 'Problem',
                content: 'Fortune 500 company with legacy data lake (Hadoop on-prem). Expensive maintenance and low adoption by business users.'
              },
              {
                label: 'Solution',
                content: 'Phased migration strategy to Databricks Lakehouse. PoC with critical use case (regulatory reports). 18-month roadmap with 5 phases.'
              },
              {
                label: 'Result',
                content: 'Successful PoC in 6 weeks. C-level buy-in achieved. Budget approved for Phase 1 (migration of 3 critical workloads). $2M in projected infrastructure savings.'
              }
            ]
          }
        ]
      },
      techStack: {
        title: 'Technologies and Frameworks',
        subtitle: 'Technology stack we recommend and master',
        categories: [
          {
            title: 'Cloud Platforms',
            items: [
              'AWS',
              'Google Cloud',
              'Azure',
              'Snowflake'
            ]
          },
          {
            title: 'Architecture Patterns',
            items: [
              'Data Lakehouse',
              'Data Mesh',
              'Lambda Architecture',
              'Event-Driven'
            ]
          },
          {
            title: 'Frameworks & Methodologies',
            items: [
              'TOGAF',
              'DAMA-DMBOK',
              'DataOps',
              'FinOps'
            ]
          }
        ]
      },
      cta: {
        title: 'Ready to design your data strategy?',
        description: 'Schedule a free consultation session (30 min) to discuss your data challenges and how we can help you.',
        button: 'Schedule free consultation'
      },
      relatedServices: {
        title: 'Related Services',
        subtitle: 'Complement your strategy with these services',
        cards: [
          {
            title: 'Data Governance',
            description: 'Ensure quality, security, and compliance with clear policies and processes.'
          },
          {
            title: 'Data Engineering',
            description: 'Implement pipelines and architectures designed in the consulting phase.'
          },
          {
            title: 'Business Intelligence',
            description: 'Dashboards and reports that materialize identified use cases.'
          }
        ],
        linkText: 'View service'
      }
    },
    biPage: {
      hero: {
        title: 'Business Intelligence',
        tagline: 'Dashboards that drive decisions',
        description: 'Real-time interactive dashboards that transform complex data into actionable insights for your executive team. We convert scattered metrics into visual narratives that guide strategic decisions with confidence.',
        ctaPrimary: 'Schedule demo',
        ctaSecondary: 'Our services'
      },
      valueProps: {
        title: 'Why Business Intelligence?',
        subtitle: 'Transform data into action with visualizations everyone understands',
        card1: {
          title: 'Real-Time Insights',
          description: 'Dashboards that automatically update every 15 minutes. Monitor critical KPIs without waiting for outdated weekly reports.',
          metric: '15 min refresh'
        },
        card2: {
          title: 'Data-Driven Decisions',
          description: 'Eliminate intuition-based decision making. Clear, contextualized, and actionable metrics that all stakeholders understand.',
          metric: '100% data-driven'
        },
        card3: {
          title: 'Rapid Implementation',
          description: 'First productive dashboards in 3-4 weeks. Agile methodology with 2-week sprints and incremental demos.',
          metric: '3-4 weeks go-live'
        },
        card4: {
          title: 'Self-Service Analytics',
          description: 'Empower business teams to explore data without depending on IT. Semantic models that ensure consistency.',
          metric: '80% fewer IT tickets'
        }
      },
      capabilities: {
        title: 'Our Approach',
        subtitle: 'Expertise in leading BI platforms on the market',
        items: [
          {
            title: 'Semantic Data Modeling',
            description: 'We design semantic layers (star schema, OLAP cubes) that ensure consistent metrics across the entire organization. A single place where "revenue," "CAC," or "churn" is defined.',
            features: [
              'Star schema and dimensional modeling',
              'Centralized business logic (metric definitions)',
              'Row-level security for granular access',
              'Optimized relationships and hierarchies',
              'Documentation of metrics and KPIs'
            ]
          },
          {
            title: 'Dashboards in Power BI, Looker, and Tableau',
            description: 'We implement interactive dashboards on the platform of your choice. User-centered design with drill-downs, filters, and exports for different audiences.',
            features: [
              'Executive dashboards for C-level',
              'Operational dashboards for teams',
              'Drilldowns and ad-hoc explorations',
              'Mobile-responsive for on-the-go decisions',
              'Export to PDF and Excel'
            ]
          },
          {
            title: 'Self-Hosted BI Platforms',
            description: 'We implement open-source or self-hosted BI solutions for maximum control and customization. Ideal for companies with strict data sovereignty or compliance requirements.',
            features: [
              'Metabase and Apache Superset deployment',
              'Redash for collaborative ad-hoc queries',
              'Grafana for metrics and monitoring',
              'Full control over infrastructure and data',
              'Unlimited customization without license limits'
            ]
          },
          {
            title: 'Automated Alerts and Notifications',
            description: 'Configure threshold-based alerts to be notified when key metrics deviate. Proactivity instead of reactivity.',
            features: [
              'Email/Slack alerts when KPI < threshold',
              'Automated anomaly detection (ML-based)',
              'Scheduled reports (daily, weekly, monthly)',
              'Multi-step conditional notifications',
              'Integration with ticketing systems'
            ]
          },
          {
            title: 'Embedded Analytics in Your Applications',
            description: 'Integrate dashboards directly into your SaaS product so your customers access analytics without leaving your app. White-label and multi-tenant.',
            features: [
              'Embedded iframes with SSO/SAML',
              'White-label (custom branding)',
              'Multi-tenancy with row-level security',
              'APIs for programmatic embedding',
              'Usage analytics and monetization'
            ]
          }
        ]
      },
      useCases: {
        title: 'Success Stories',
        cases: [
          {
            label: 'SaaS / B2B',
            title: 'Executive Dashboard for SaaS Scale-up',
            flow: [
              {
                label: 'Problem',
                content: 'CEO of B2B SaaS with $10M ARR had no real-time visibility of key metrics. Manual Excel reports with last week\'s data.'
              },
              {
                label: 'Solution',
                content: 'Executive dashboard in Looker with MRR, CAC, LTV, churn, and sales pipeline. Updates every 15 min from Salesforce, Stripe, and data warehouse.'
              },
              {
                label: 'Result',
                content: 'CEO makes strategic decisions 3x faster. Early churn identification reduced it by 18%. Board meetings with real-time updated data.'
              }
            ]
          },
          {
            label: 'E-commerce / Retail',
            title: 'Operational Dashboards for E-commerce',
            flow: [
              {
                label: 'Problem',
                content: 'Operations team reviewing 10+ tools to monitor inventory, fulfillment, and customer support. Inconsistent data across systems.'
              },
              {
                label: 'Solution',
                content: 'Operational dashboards in Power BI: inventory levels, order fulfillment SLAs, support tickets. Semantic layer unifies metrics from Shopify, Zendesk, NetSuite.'
              },
              {
                label: 'Result',
                content: '40% reduction in stockouts through inventory visibility. Fulfillment SLA improved from 72h to 48h. Ops team saves 15h/week on manual reporting.'
              }
            ]
          },
          {
            label: 'Fintech / Embedded',
            title: 'Embedded Analytics for B2B Clients',
            flow: [
              {
                label: 'Problem',
                content: 'B2B fintech without analytics for its enterprise clients. Constantly requested custom reports, creating operational burden on the team.'
              },
              {
                label: 'Solution',
                content: 'Embedded analytics in Tableau with white-label. Each client accesses personalized dashboards (transactions, fees, reconciliation) within the portal.'
              },
              {
                label: 'Result',
                content: 'Client NPS +25 points. 90% reduction in custom report requests. Embedded analytics became a sales differentiator.'
              }
            ]
          }
        ]
      },
      techStack: {
        title: 'Technologies and Platforms',
        subtitle: 'BI stack we master and recommend',
        categories: [
          {
            title: 'BI Platforms',
            items: [
              'Power BI',
              'Looker',
              'Tableau',
              'Metabase'
            ]
          },
          {
            title: 'Semantic Layer & Modeling',
            items: [
              'dbt Metrics',
              'LookML (Looker)',
              'Power BI Dataflows',
              'Cube.js'
            ]
          },
          {
            title: 'Data Sources & Warehouses',
            items: [
              'Snowflake',
              'BigQuery',
              'Redshift',
              'Databricks'
            ]
          }
        ]
      },
      cta: {
        title: 'Ready to visualize your data?',
        description: 'Schedule a free demo where we show you how to transform your data into actionable dashboards in less than 4 weeks.',
        button: 'Schedule free demo'
      },
      relatedServices: {
        title: 'Related Services',
        subtitle: 'Complement your dashboards with these services',
        cards: [
          {
            title: 'Data Engineering',
            description: 'Robust pipelines that feed your dashboards with clean, updated data.'
          },
          {
            title: 'Data Science',
            description: 'Add predictive analytics to your dashboards with forecasting and churn models.'
          },
          {
            title: 'Data Governance',
            description: 'Ensure your dashboards display reliable and governed data.'
          }
        ],
        linkText: 'View service'
      }
    },
    dataSciencePage: {
      hero: {
        title: 'Data Science',
        tagline: 'Predictive insights that generate value',
        description: 'Predictive models and advanced analytics that anticipate trends, optimize operations, and maximize revenue. We convert historical data into competitive advantages through machine learning applied to real business problems.',
        ctaPrimary: 'Schedule consultation',
        ctaSecondary: 'Our services'
      },
      valueProps: {
        title: 'Why Data Science?',
        subtitle: 'Predictive analytics that impact the bottom line',
        card1: {
          title: 'Trend Anticipation',
          description: 'Forecasting of demand, churn, and revenue with statistical models and ML. Plan with 90%+ accuracy in 3-6 month horizons.',
          metric: '90%+ accuracy'
        },
        card2: {
          title: 'Intelligent Segmentation',
          description: 'Customer clustering by behavior, value, and propensity. Personalize marketing and product strategies by segment.',
          metric: '+40% conversion'
        },
        card3: {
          title: 'Rigorous Statistical Validation',
          description: 'Hypotheses tested with A/B testing, significance tests, and confidence intervals. No more decisions based on spurious correlations.',
          metric: '95% confidence'
        },
        card4: {
          title: 'Models in Production',
          description: 'MLOps to deploy models to production with monitoring, retraining, and drift detection. Models that generate value 24/7.',
          metric: '24/7 inference'
        }
      },
      capabilities: {
        title: 'Our Approach',
        subtitle: 'Expertise in ML applied to business use cases',
        items: [
          {
            title: 'Demand and Churn Prediction',
            description: 'Forecasting models (ARIMA, Prophet, LSTM) to anticipate product demand and churn models to identify at-risk customers before they leave.',
            features: [
              'Forecasting with Prophet, ARIMA, LSTM',
              'Churn prediction with XGBoost, LightGBM',
              'Behavior-based feature engineering',
              'Probability calibration for scoring',
              'Rigorous backtesting with historical data'
            ]
          },
          {
            title: 'Customer Segmentation and LTV',
            description: 'Clustering (K-means, DBSCAN) to segment customers by behavior. LTV (Lifetime Value) models to prioritize acquisition and retention efforts.',
            features: [
              'RFM analysis and behavioral clustering',
              'LTV prediction with survival models',
              'Cohort analysis and retention curves',
              'Propensity models for upsell/cross-sell',
              'Campaign personalization by segment'
            ]
          },
          {
            title: 'Heuristic Pattern Detection',
            description: 'Exploratory analysis to discover non-obvious patterns in data. Anomaly detection for fraud, outliers, and unusual events requiring attention.',
            features: [
              'Deep Exploratory Data Analysis (EDA)',
              'Anomaly detection (Isolation Forest, autoencoders)',
              'Association rules mining (Market Basket Analysis)',
              'Time series decomposition (trend, seasonality)',
              'Causal inference to identify real drivers'
            ]
          },
          {
            title: 'Rigorous Statistical Validation',
            description: 'A/B testing with power analysis, multiple testing correction. Confidence intervals, hypothesis testing, and causal inference for informed decisions.',
            features: [
              'A/B test design with power analysis',
              'Bayesian A/B testing for early stopping',
              'Multiple testing correction (Bonferroni, FDR)',
              'Causal inference (propensity score matching, DiD)',
              'Model interpretability (SHAP, LIME)'
            ]
          }
        ]
      },
      useCases: {
        title: 'Success Stories',
        cases: [
          {
            label: 'SaaS / B2B',
            title: 'Churn Prediction for B2B SaaS',
            flow: [
              {
                label: 'Problem',
                content: 'B2B SaaS with 25% annual churn. Reactive CS team: contacted customers after they canceled. $2M ARR lost annually.'
              },
              {
                label: 'Solution',
                content: 'Churn model with XGBoost using product usage features (logins, features used, support tickets). Weekly scoring to identify at-risk accounts.'
              },
              {
                label: 'Result',
                content: 'Churn reduced from 25% to 17% in 6 months. Proactive CS team saves 40% of at-risk accounts. Revenue recovery of $800K/year. Project ROI: 8x.'
              }
            ]
          },
          {
            label: 'Retail / E-commerce',
            title: 'Demand Forecasting for Retail',
            flow: [
              {
                label: 'Problem',
                content: 'Retailer with frequent stockouts and simultaneous overstock. Manual Excel forecasting. 30% error rate in demand predictions.'
              },
              {
                label: 'Solution',
                content: 'Forecasting models with Prophet + features for promotions, seasonality, special events. SKU-store level forecast with 4-week horizon.'
              },
              {
                label: 'Result',
                content: 'Forecasting error reduced to 12% (MAPE). Stockouts -40%, overstock -35%. Working capital freed: $3M. Customer satisfaction +15% due to availability.'
              }
            ]
          },
          {
            label: 'Fintech / Banking',
            title: 'Customer LTV Segmentation',
            flow: [
              {
                label: 'Problem',
                content: 'Fintech spending equally on all acquired customers. High CAC ($200) with unknown LTV. Some customers didn\'t generate enough value.'
              },
              {
                label: 'Solution',
                content: 'LTV prediction model using transactions, contracted products, demographics. Segmentation into High/Medium/Low value. Differentiated strategies by segment.'
              },
              {
                label: 'Result',
                content: 'Marketing budget reallocated to High LTV segments. CAC optimized by segment. Marketing ROI +60%. LTV/CAC ratio improved from 2.5x to 4.2x.'
              }
            ]
          }
        ]
      },
      techStack: {
        title: 'Technologies and Frameworks',
        subtitle: 'ML and data science stack we master',
        categories: [
          {
            title: 'ML Frameworks & Libraries',
            items: [
              'Scikit-learn',
              'XGBoost / LightGBM',
              'TensorFlow / PyTorch',
              'Prophet / statsmodels'
            ]
          },
          {
            title: 'MLOps & Deployment',
            items: [
              'MLflow',
              'Weights & Biases',
              'SageMaker',
              'Databricks MLR'
            ]
          },
          {
            title: 'Analysis & Experimentation',
            items: [
              'Python (Pandas, NumPy)',
              'R (tidyverse)',
              'Jupyter / Databricks',
              'Optimizely / GrowthBook'
            ]
          }
        ]
      },
      cta: {
        title: 'Ready to predict your business future?',
        description: 'Schedule a free discovery session. We will identify ML use cases with high ROI for your industry and business.',
        button: 'Schedule discovery session'
      },
      relatedServices: {
        title: 'Related Services',
        subtitle: 'Complement your models with robust infrastructure',
        cards: [
          {
            title: 'Data Engineering',
            description: 'Pipelines that feed your models with clean, updated features.'
          },
          {
            title: 'Business Intelligence',
            description: 'Dashboards that visualize predictions and scores from your models.'
          },
          {
            title: 'AI / GenAI',
            description: 'Intelligent agents that act on your predictive insights.'
          }
        ],
        linkText: 'View service'
      }
    },
    gobiernoPage: {
      hero: {
        title: 'Data Governance',
        tagline: 'Reliable data, accurate decisions',
        description: 'We establish people, processes, and policies to ensure quality, security, and regulatory compliance of your data. We transform data chaos into a governed and reliable strategic asset.',
        ctaPrimary: 'Schedule consultation',
        ctaSecondary: 'Our services'
      },
      valueProps: {
        title: 'Why Data Governance?',
        subtitle: 'Trust, compliance, and quality in every data-driven decision',
        card1: {
          title: 'Regulatory Compliance',
          description: 'We ensure compliance with GDPR, CCPA, SOC 2, and your industry regulations. Avoid million-dollar fines and legal risks.',
          metric: '100% Compliance'
        },
        card2: {
          title: 'Data Quality',
          description: 'We implement quality SLAs with automated monitoring. Reduce data errors that impact business decisions.',
          metric: '95%+ Quality'
        },
        card3: {
          title: 'Centralized Catalog',
          description: 'Data catalog with clear metadata, lineage, and ownership. Find and understand data in minutes, not weeks.',
          metric: '90% less search'
        },
        card4: {
          title: 'Roles and Responsibilities',
          description: 'RACI model with clearly defined data owners, stewards, and custodians. Accountability for each dataset.',
          metric: 'Clear ownership'
        }
      },
      capabilities: {
        title: 'Our Approach',
        subtitle: 'Complete Data Governance framework based on DAMA-DMBOK',
        items: [
          {
            title: 'RACI Model and Data Roles',
            description: 'We define organizational structure with key roles: Chief Data Officer, Data Owners, Data Stewards, Data Custodians. RACI matrix to clarify responsibilities.',
            features: [
              'Definition of roles and responsibilities',
              'RACI matrix by data domain',
              'Job descriptions for new roles',
              'Operational governance model',
              'Data committee and meeting cadence'
            ]
          },
          {
            title: 'Centralized Data Catalog',
            description: 'We implement data catalog (Alation, Collibra, Atlan) with enriched metadata, automated lineage, and intelligent search. Single source of truth for data assets.',
            features: [
              'Data catalog tool setup',
              'Automated metadata harvesting',
              'End-to-end data lineage',
              'Business glossary and business terms',
              'Search and discovery for self-service'
            ]
          },
          {
            title: 'Data Quality SLAs',
            description: 'We establish quality dimensions (accuracy, completeness, timeliness) with metrics and thresholds. Automated monitoring with alerts in case of degradation.',
            features: [
              'Definition of quality dimensions',
              'SLAs per critical dataset (accuracy, completeness, etc.)',
              'Implementation of data quality checks',
              'Real-time monitoring dashboards',
              'Remediation and escalation processes'
            ]
          },
          {
            title: 'Access, Privacy, and Security Policies',
            description: 'We design access policies (RBAC), data classification (PII, confidential), and compliance processes (GDPR, CCPA). Access auditing and data retention.',
            features: [
              'Data classification (public, internal, confidential, PII)',
              'RBAC policies (role-based access control)',
              'Data privacy processes (GDPR, CCPA)',
              'Data retention and archiving policies',
              'Access auditing and compliance reporting'
            ]
          }
        ]
      },
      useCases: {
        title: 'Success Stories',
        cases: [
          {
            label: 'Fintech / Banking',
            title: 'GDPR Compliance in 90 Days',
            flow: [
              {
                label: 'Problem',
                content: 'Fintech processing EU customer data without GDPR compliance. Risk of fines up to €20M. No personal data inventory existed.'
              },
              {
                label: 'Solution',
                content: 'Complete PII inventory in 2 weeks. Implementation of access, retention, and right-to-be-forgotten policies. Data catalog with automated classification.'
              },
              {
                label: 'Result',
                content: '100% GDPR compliance in 90 days. SOC 2 Type II certification achieved. Documented and auditable processes. Legal risk eliminated.'
              }
            ]
          },
          {
            label: 'Healthcare / Enterprise',
            title: 'Data Quality Program at Hospital',
            flow: [
              {
                label: 'Problem',
                content: 'Hospital with 15% errors in patient data. Regulatory reports rejected. Clinical decisions based on incorrect data.'
              },
              {
                label: 'Solution',
                content: 'Implementation of Great Expectations for automated validation. Definition of SLAs per critical dataset. Data quality dashboard for C-level.'
              },
              {
                label: 'Result',
                content: 'Errors reduced to 3% in 6 months. Regulatory reports approved on first attempt. Greater confidence in clinical decisions. Measurable ROI in reduced rework.'
              }
            ]
          },
          {
            label: 'E-commerce / Scale-up',
            title: 'Data Catalog for Self-Service Analytics',
            flow: [
              {
                label: 'Problem',
                content: 'Business analysts spent 60% of time searching for correct data. 150+ undocumented tables in warehouse. Duplication of efforts.'
              },
              {
                label: 'Solution',
                content: 'Implementation of Atlan as data catalog. Automatic metadata harvesting. Business glossary with 200+ terms. Training for analysts.'
              },
              {
                label: 'Result',
                content: 'Search time reduced by 80%. Self-service analytics enabled. Data discovery in 2 minutes vs. 2 hours. Analyst NPS: 9/10.'
              }
            ]
          }
        ]
      },
      techStack: {
        title: 'Technologies and Frameworks',
        subtitle: 'Data Governance tools stack',
        categories: [
          {
            title: 'Data Catalog & Lineage',
            items: [
              'Alation',
              'Collibra',
              'Atlan',
              'OpenMetadata'
            ]
          },
          {
            title: 'Data Quality',
            items: [
              'Great Expectations',
              'Monte Carlo',
              'Soda',
              'dbt Tests'
            ]
          },
          {
            title: 'Frameworks & Standards',
            items: [
              'DAMA-DMBOK',
              'DCAM',
              'GDPR',
              'SOC 2'
            ]
          }
        ]
      },
      cta: {
        title: 'Ready to govern your data?',
        description: 'Start with a free data governance maturity assessment. We will identify gaps and prioritize high-impact initiatives.',
        button: 'Request free assessment'
      },
      relatedServices: {
        title: 'Related Services',
        subtitle: 'Complement your governance program',
        cards: [
          {
            title: 'Data Consulting',
            description: 'Define data strategy before implementing governance.'
          },
          {
            title: 'Data Engineering',
            description: 'Implement pipelines with integrated data quality checks.'
          },
          {
            title: 'Data Science',
            description: 'Reliable models require governed and quality data.'
          }
        ],
        linkText: 'View service'
      }
    },
    ingenieriaPage: {
      hero: {
        title: 'Data Engineering',
        tagline: 'Scalable and efficient pipelines',
        description: 'Migrations, ETL pipelines, and modern architectures to efficiently process large data volumes. We build robust data infrastructure that scales with your business without increasing costs linearly.',
        ctaPrimary: 'Schedule consultation',
        ctaSecondary: 'Our services'
      },
      valueProps: {
        title: 'Why Data Engineering?',
        subtitle: 'Data infrastructure that scales without compromising performance',
        card1: {
          title: 'Processing at Scale',
          description: 'Pipelines that process millions of records in minutes, not hours. Distributed architectures with Spark for big data processing.',
          metric: '100M+ records/day'
        },
        card2: {
          title: 'Cost Optimization',
          description: 'We reduce cloud costs by up to 50% through efficient architectures, intelligent partitioning, and auto-scaling.',
          metric: 'Up to 50% savings'
        },
        card3: {
          title: '24/7 Reliability',
          description: 'Resilient pipelines with retry logic, alerts, and monitoring. Uptime SLAs >99.5% for critical data loads.',
          metric: '99.5% uptime'
        },
        card4: {
          title: 'Zero-Downtime Migrations',
          description: 'We migrate from legacy systems (on-prem, old databases) to modern cloud without disrupting business operations.',
          metric: 'Zero downtime'
        }
      },
      capabilities: {
        title: 'Our Approach',
        subtitle: 'Expertise in modern data architectures (batch, streaming, real-time)',
        items: [
          {
            title: 'Incremental and Batch Data Ingestion',
            description: 'We implement ingestion pipelines from multiple sources (databases, APIs, files) with incremental strategies (CDC) to minimize load and latency.',
            features: [
              'Change Data Capture (CDC) with Debezium/Fivetran',
              'Ingestion from REST/GraphQL APIs',
              'Batch processing of files (S3, SFTP)',
              'Connectors for SaaS apps (Salesforce, HubSpot, etc.)',
              'Schema evolution and versioning'
            ]
          },
          {
            title: 'Orchestration with Airflow and Dagster',
            description: 'We orchestrate complex pipelines with dependencies, retries, and alerts. Git-versioned DAGs with CI/CD for automated deployment.',
            features: [
              'Modular and reusable DAGs',
              'Dependency management and backfills',
              'Retry logic and circuit breakers',
              'Slack/PagerDuty alerts on failures',
              'CI/CD with automated testing'
            ]
          },
          {
            title: 'Transformations with dbt and Spark',
            description: 'We transform raw data into analytical models using dbt (SQL) for batch and Spark for big data. Automated tests and generated documentation.',
            features: [
              'dbt models with testing and documentation',
              'Incremental models for efficiency',
              'Spark jobs for PB-scale processing',
              'Automated data quality tests',
              'End-to-end lineage tracking'
            ]
          },
          {
            title: 'Cloud Cost Optimization',
            description: 'We audit and optimize existing infrastructure: partitioning, clustering, auto-suspend, reserved capacity. FinOps for data teams.',
            features: [
              'Cost analysis (compute, storage, egress)',
              'Partitioning and clustering strategies',
              'Auto-suspend/resume for warehouses',
              'Reserved instances and savings plans',
              'Query optimization and caching'
            ]
          }
        ]
      },
      useCases: {
        title: 'Success Stories',
        cases: [
          {
            label: 'Fintech / Scale-up',
            title: 'PostgreSQL to Snowflake Migration',
            flow: [
              {
                label: 'Problem',
                content: 'Fintech with 50M transactions/month on on-prem PostgreSQL. Slow queries (+30s), failing backups, and team of 2 saturated DBAs.'
              },
              {
                label: 'Solution',
                content: 'Migration to Snowflake with incremental CDC using Fivetran. dbt pipelines for transformations. Airflow for orchestration. Zero downtime migration.'
              },
              {
                label: 'Result',
                content: 'Queries 10x faster (30s → 3s). Automated backups. DBAs freed for strategic projects. Costs 30% lower vs. maintaining on-prem.'
              }
            ]
          },
          {
            label: 'E-commerce / Retail',
            title: 'Real-time Inventory Pipeline',
            flow: [
              {
                label: 'Problem',
                content: 'E-commerce with inventory sync every 6 hours. Sold out-of-stock products, generating cancellations and low NPS.'
              },
              {
                label: 'Solution',
                content: 'Real-time pipeline with Kafka + Flink. CDC from ERP (SAP). Stream processing to calculate available-to-promise inventory. Latency <1 min.'
              },
              {
                label: 'Result',
                content: 'Stockout cancellations reduced by 75%. NPS +12 points. Revenue recovery of $500K/year from better inventory accuracy.'
              }
            ]
          },
          {
            label: 'SaaS / B2B',
            title: 'Data Platform for Product Analytics',
            flow: [
              {
                label: 'Problem',
                content: 'B2B SaaS with no user behavior visibility. Product events scattered in logs. PM team without data to prioritize roadmap.'
              },
              {
                label: 'Solution',
                content: 'Event streaming with Segment + BigQuery. dbt to model user journeys, funnels, retention cohorts. Dashboards in Looker for PM team.'
              },
              {
                label: 'Result',
                content: 'PM team identifies feature adoption in days, not months. A/B experiments with statistical significance. Data-driven roadmap resulted in +30% activation rate.'
              }
            ]
          }
        ]
      },
      techStack: {
        title: 'Technologies and Frameworks',
        subtitle: 'Modern data engineering stack',
        categories: [
          {
            title: 'Orchestration & Workflow',
            items: [
              'Apache Airflow',
              'Dagster',
              'Prefect',
              'Kestra'
            ]
          },
          {
            title: 'Processing & Transformation',
            items: [
              'dbt',
              'Apache Spark',
              'Apache Flink',
              'Kafka Streams'
            ]
          },
          {
            title: 'Ingestion & Integration',
            items: [
              'Fivetran',
              'Airbyte',
              'Debezium (CDC)',
              'Kafka Connect'
            ]
          }
        ]
      },
      cta: {
        title: 'Ready to modernize your data infrastructure?',
        description: 'Schedule a free architecture review session. We will evaluate your current stack and identify optimization opportunities.',
        button: 'Schedule architecture review'
      },
      relatedServices: {
        title: 'Related Services',
        subtitle: 'Maximize the value of your data infrastructure',
        cards: [
          {
            title: 'Data Consulting',
            description: 'Define architecture and roadmap before implementing pipelines.'
          },
          {
            title: 'Business Intelligence',
            description: 'Dashboards powered by your robust data pipelines.'
          },
          {
            title: 'Data Governance',
            description: 'Ensure quality and compliance in your pipelines with data governance.'
          }
        ],
        linkText: 'View service'
      }
    },
    aiGenaiPage: {
      hero: {
        title: 'AI / GenAI',
        tagline: 'From data to automated actions',
        description: 'Intelligent agents that automate processes, accelerate sales, and enhance strategic decisions. We convert data into actions through generative AI and autonomous agents working 24/7 for your business.',
        ctaPrimary: 'Schedule demo',
        ctaSecondary: 'Our services'
      },
      valueProps: {
        title: 'Why AI / GenAI?',
        subtitle: 'Intelligent automation that scales your operations without headcount',
        card1: {
          title: 'Intelligent Automation',
          description: 'Agents that execute repetitive tasks with human precision. Free your team to focus on high-value strategic work.',
          metric: '80% tasks automated'
        },
        card2: {
          title: '10x Speed',
          description: 'Processes that took hours are now completed in minutes. Web scraping, data analysis, and report generation at machine speed.',
          metric: '10x faster'
        },
        card3: {
          title: 'ROI in Weeks',
          description: 'Functional pilots in 2-3 weeks. Validate AI value before committing large budgets. Rapid iteration based on feedback.',
          metric: '2-3 weeks pilot'
        },
        card4: {
          title: 'Personalization at Scale',
          description: 'GenAI to personalize content, emails, and proposals for thousands of customers simultaneously. 1-to-1 relevance at industrial scale.',
          metric: '1000+ personalized/day'
        }
      },
      capabilities: {
        title: 'Our Approach',
        subtitle: 'Expertise in AI applied to real business use cases',
        items: [
          {
            title: 'Web Scrapers and Data Agents',
            description: 'Intelligent agents that extract, structure, and enrich data from public and private sources. Continuous monitoring of competitors, news, and market trends.',
            features: [
              'Web scraping with JavaScript, CAPTCHA, rate limit handling',
              'Data extraction from PDFs, images (OCR), documents',
              'Enrichment with external APIs (LinkedIn, Clearbit, etc.)',
              'Agents that adapt to changes in site structure',
              'Automated validation and cleaning pipelines'
            ]
          },
          {
            title: 'Automatic Sales Triggers',
            description: 'Sales enablement agents that identify buying signals (funding rounds, hiring, tech stack changes) and generate personalized outreach automatically.',
            features: [
              'Monitoring of intent signals (funding, job postings, tech changes)',
              'Real-time lead scoring',
              'Personalized email generation with GenAI',
              'Automated follow-ups based on engagement',
              'CRM integration (Salesforce, HubSpot)'
            ]
          },
          {
            title: 'Business Decision Copilots',
            description: 'AI assistants that analyze data, generate insights, and recommend actions. Copilots trained on your data that answer complex questions in natural language.',
            features: [
              'Q&A on your data in natural language',
              'Automatic generation of executive reports',
              'Recommendations based on historical patterns',
              'RAG (Retrieval-Augmented Generation) on internal docs',
              'Fine-tuning of LLMs in your specific domain'
            ]
          },
          {
            title: 'Intelligent Meeting Orchestrators',
            description: 'Agents that transcribe, summarize, and generate action items from meetings automatically. Synchronization with CRM, calendars, and project management tools.',
            features: [
              'Automatic meeting transcription (Zoom, Meet, Teams)',
              'GenAI summarization (key points, decisions, next steps)',
              'Action item extraction and assignee allocation',
              'Automatic CRM update with call insights',
              'Sentiment and engagement analysis in sales calls'
            ]
          }
        ]
      },
      useCases: {
        title: 'Success Stories',
        cases: [
          {
            label: 'SaaS / Sales Enablement',
            title: 'Sales Enablement Agent for Outbound',
            flow: [
              {
                label: 'Problem',
                content: 'SDR team spending 80% of time on prospect research and writing cold emails. Only 20% of time in real conversations. Low conversion rate.'
              },
              {
                label: 'Solution',
                content: 'Agent that monitors funding rounds, job postings, tech stack changes. Generates personalized emails with GenAI (GPT-4) based on specific signals. Auto-enqueue in Outreach.'
              },
              {
                label: 'Result',
                content: 'SDRs free 60% of their time for conversations. Reply rate +35%. Pipeline generated +50% with same headcount. Agent ROI: 12x in 6 months.'
              }
            ]
          },
          {
            label: 'Private Equity / Research',
            title: 'Competitive Intelligence Agent',
            flow: [
              {
                label: 'Problem',
                content: 'PE firm needed to monitor 200+ portfolio companies to identify risks and opportunities. Analysts spent 20h/week on manual research.'
              },
              {
                label: 'Solution',
                content: 'Web scraping agent that monitors news, financial filings, social media, job postings. NLP for sentiment analysis and alerts on critical events. Dashboard with insights.'
              },
              {
                label: 'Result',
                content: 'Analysts save 80% of research time. Early risk identification allowed intervention in 3 portfolio companies. M&A opportunities detected 6 months earlier.'
              }
            ]
          },
          {
            label: 'Consulting / Knowledge Management',
            title: 'Internal Knowledge Copilot',
            flow: [
              {
                label: 'Problem',
                content: 'Consultancy with 10 years of deliverables, case studies, and methodologies scattered in Sharepoint. Consultants couldn\'t find relevant assets, recreating already completed work.'
              },
              {
                label: 'Solution',
                content: 'RAG-based copilot on 10K internal documents. Semantic search and Q&A in natural language. Integrated in Slack for instant access. Citations to original sources.'
              },
              {
                label: 'Result',
                content: 'Search time reduced from 2h to 5 min. Asset reuse +60%. New consultant onboarding 3x faster. Knowledge retention despite turnover.'
              }
            ]
          }
        ]
      },
      techStack: {
        title: 'Technologies and Frameworks',
        subtitle: 'AI and automation stack we master',
        categories: [
          {
            title: 'LLMs & GenAI Platforms',
            items: [
              'OpenAI (GPT-4, o1)',
              'Anthropic (Claude)',
              'Google (Gemini)',
              'Open-source (Llama, Mistral)'
            ]
          },
          {
            title: 'Agent Frameworks & Orchestration',
            items: [
              'LangChain / LangGraph',
              'LlamaIndex',
              'AutoGen',
              'CrewAI'
            ]
          },
          {
            title: 'Infrastructure & Tooling',
            items: [
              'Vector DBs (Pinecone, Weaviate)',
              'Web Scraping (Playwright, Selenium)',
              'MLOps (Weights & Biases, MLflow)',
              'Monitoring (LangSmith, Helicone)'
            ]
          }
        ]
      },
      cta: {
        title: 'Ready to automate with AI?',
        description: 'Schedule a free ideation session. We will identify processes in your company that can be automated with intelligent agents.',
        button: 'Schedule ideation session'
      },
      relatedServices: {
        title: 'Related Services',
        subtitle: 'Power your agents with data and analytics',
        cards: [
          {
            title: 'Data Science',
            description: 'Predictive models that feed your agents with actionable insights.'
          },
          {
            title: 'Data Engineering',
            description: 'Robust pipelines that provide clean data for your AI agents.'
          },
          {
            title: 'Data Consulting',
            description: 'Data strategy that maximizes the impact of your AI initiatives.'
          }
        ],
        linkText: 'View service'
      }
    }
  },
  jp: {
    nav: {
      services: 'サービス',
      solutions: 'ソリューション',
      team: 'チーム',
      clients: 'クライアント',
      contact: 'お問い合わせ'
    },
    breadcrumb: {
      home: 'ホーム',
      services: 'サービス',
      team: 'チーム',
      clients: 'クライアント',
      contact: 'お問い合わせ',
      consultoria: 'データコンサルティング',
      bi: 'ビジネスインテリジェンス',
      dataScience: 'データサイエンス',
      gobierno: 'データガバナンス',
      ingenieria: 'データエンジニアリング',
      aiGenai: 'AI / 生成AI'
    },
    hero: {
      title: 'データをインテリジェントな意思決定に変換',
      description: 'データを競争優位に変えます。私たちと一緒に拡大、革新、成長しましょう。',
      cta: {
        primary: '面談を予約',
        secondary: 'サービスを見る'
      }
    },
    services: {
      dataConsulting: {
        title: 'データコンサルティング',
        description: '測定可能な結果に焦点を当て、最小のコストで情報の価値を最大化するカスタマイズされた戦略とロードマップを設計します。',
        bullets: [
          '高インパクトユースケースの発見',
          'スケーラブルで効率的なデータアーキテクチャ',
          'コスト評価と最適化',
          'パイロットと概念実証（PoC）'
        ]
      },
      dataGovernance: {
        title: 'データガバナンス',
        description: 'データの品質、セキュリティ、規制コンプライアンスを確保するための人、プロセス、ポリシーを確立します。',
        bullets: [
          'RACIモデルとデータロール',
          '集中型データカタログ',
          'データ品質SLA',
          'アクセス、プライバシー、セキュリティポリシー'
        ]
      },
      businessIntelligence: {
        title: 'ビジネスインテリジェンス',
        description: '複雑なデータを経営陣の実行可能な洞察に変換するリアルタイムのインタラクティブダッシュボード。',
        bullets: [
          'セマンティックデータモデリング',
          'カスタムセルフホストBIプラットフォーム',
          'Power BI、Looker、TableauのダッシュボードPower BI、Looker、Tableauのダッシュボード',
          '自動アラートと通知',
          'アプリケーションへの組み込み分析'
        ]
      },
      dataEngineering: {
        title: 'データエンジニアリング',
        description: '大量のデータを効率的に処理するための移行、ETLパイプライン、モダンアーキテクチャ。',
        bullets: [
          '増分およびバッチデータ取り込み',
          'データオーケストレーション',
          '変換',
          'クラウドコスト最適化'
        ]
      },
      dataScience: {
        title: 'データサイエンス',
        description: 'トレンドを予測し、業務を最適化し、収益を最大化する予測モデルと高度な分析。',
        bullets: [
          '需要とチャーン予測',
          '顧客セグメンテーションとLTV',
          'ヒューリスティックパターン検出',
          '厳密な統計的検証'
        ]
      },
      aiGenAI: {
        title: 'AI / 生成AI',
        description: 'データからアクションへ：プロセスを自動化し、販売を加速し、戦略的決定を強化するインテリジェントエージェント。',
        bullets: [
          'データエージェント',
          '自動販売トリガー',
          '意思決定コパイロット',
          'インテリジェントオーケストレーター'
        ]
      }
    },
    solutions: {
      title: 'エリア別ソリューション',
      subtitle: 'ビジネスニーズに合わせた特定のユースケース',
      cards: [
        {
          title: '営業と成長',
          description: '予測分析によるコンバージョンとROI最適化。',
          items: [
            'インテリジェントな商業優先順位付けのための予測リードスコアリング',
            'オーディエンスの動的セグメンテーションと市場のマイクロセグメンテーション',
            '広告投資最適化のためのマルチタッチアトリビューションモデル',
            'チャーン予測とプロアクティブリテンション戦略設計'
          ]
        },
        {
          title: '業務効率',
          description: 'リアルタイムデータによるコスト削減とリソース最適化。',
          items: [
            '在庫最適化とサプライチェーンの完全な可視性',
            '需要予測モデルと運用リソース計画',
            'リアルタイムでのインテリジェント運用異常検出システム',
            'RPA + AI統合による複雑なプロセスの自動化'
          ]
        },
        {
          title: 'カスタマーエクスペリエンス（CX）',
          description: '顧客生涯価値の最大化とインテリジェントなロイヤリティ。',
          items: [
            '自然言語処理（NLP）による感情分析と顧客の声',
            '顧客価値セグメンテーションのための顧客生涯価値（CLV）モデル',
            'AIを活用したレコメンデーションエンジンとコンテンツパーソナライゼーション',
            'アフターセールスファネル最適化とプロアクティブテクニカルサポートシステム'
          ]
        },
        {
          title: '戦略と財務',
          description: 'Cスイートレベルの高度な意思決定のための集中型インテリジェンス。',
          items: [
            '重要なKPIとビジネスヘルスの可視化を備えた経営ダッシュボード',
            '高度な財務予測モデルとキャッシュフロー予測',
            '製品、チャネル、事業単位別の詳細な収益性分析',
            'データ文化の採用と分析リテラシーへの支援'
          ]
        }
      ]
    },
    infrastructure: {
      title: '私たちのインフラストラクチャ：データの背後にあるエンジン',
      subtitle: '高インパクトソリューションを活性化するために、エンドツーエンドで情報の整合性とフローを保証する堅牢なアーキテクチャとデータエージェントを展開します：',
      components: [
        {
          title: 'Webスクレイパー',
          description: '競合と市場の自動監視'
        },
        {
          title: 'エンリッチメントエージェント',
          description: '高度なAIによるデータ検証とクリーニング'
        },
        {
          title: 'マルチプラットフォーム同期',
          description: 'ERP、CRM、外部ソースの完全統合'
        },
        {
          title: 'データガバナンス',
          description: '情報の品質、クリーニング、セキュリティの保証'
        }
      ]
    },
    boutique: {
      title: 'あなたの課題はこれらのカテゴリーに当てはまりませんか？',
      description: '私たちはブティックコンサルタンシーです。既製のソリューションを信じていません。ゼロから創造的で技術的なアプローチを必要とする特定の問題を解決するために<strong>100％アドホック</strong>な分析アーキテクチャを構築します。',
      cta: '診断コンサルテーションを予約'
    },
    clients: {
      title: '私たちを信頼するクライアント',
      subtitle: '様々な業界のリーディングカンパニーと協力しています',
      testimonialsTitle: 'クライアントの声',
      testimonials: [
        {
          quote: '「Pullaiは私たちのデータ戦略を変革しました。6ヶ月でコストを40％削減し、インサイト速度を10倍に向上させました。」',
          author: 'Guadalupe Ureta',
          role: 'パートナー',
          client: 'Seminarium',
          avatar: 'assets/img/testimonials/guadalupe-ureta.jpg',
          rating: 5
        },
        {
          quote: '「予測チャーンモデルにより10％多くの顧客を維持できました。第1四半期で驚異的なROI。」',
          author: 'Sebastián Manhood',
          role: '共同創業者兼オペレーションマネージャー',
          client: 'MyHotel',
          avatar: 'assets/img/testimonials/sebastian-manhood.jpg',
          rating: 5
        },
        {
          quote: '「リアルタイムダッシュボードは意思決定方法を革命的に変えました。今では全業務の完全な可視性があります。」',
          author: 'Claudia Castañón',
          role: 'ディレクター',
          client: 'ClouHR',
          avatar: 'assets/img/testimonials/claudia-castanon.jpg',
          rating: 5
        }
      ]
    },
    contact: {
      title: 'プロジェクトについてお話ししましょう',
      subtitle: 'データを結果に変えるお手伝いをする準備ができています',
      info: {
        title: '私たちと繋がる',
        description: 'プロジェクトをお考えですか？戦略的データコンサルティングが必要ですか？お問い合わせいただき、私たちがどのようにお手伝いできるかご確認ください。'
      },
      form: {
        name: 'フルネーム *',
        email: 'メール *',
        company: '会社名',
        message: 'メッセージ *',
        submit: 'メッセージを送信'
      }
    },
    alliances: {
      toggle: '戦略的提携',
      description: 'クライアントが包括的なソリューションを持つことを保証するために、補完的な分野の専門パートナーと協力しています。',
      partners: [
        {
          description: '財務および戦略コンサルティング。あなたのコーポレートファイナンスチーム。'
        }
      ]
    },
    footer: {
      copyright: '全著作権所有。'
    },
    languageButton: 'Español',
    consultoriaPage: {
      hero: {
        title: 'データコンサルティング',
        tagline: '戦略から実行まで',
        description: '測定可能な結果に焦点を当て、最小のコストで情報の価値を最大化するカスタマイズされた戦略とロードマップを設計します。データビジョンを実際のビジネスインパクトを持つ実行可能なロードマップに変換します。',
        ctaPrimary: 'コンサルテーションを予約',
        ctaSecondary: '私たちのサービス'
      },
      valueProps: {
        title: 'データコンサルティングが必要な理由',
        subtitle: 'データの複雑さを明確な競争優位に変換します',
        card1: {
          title: '高インパクトユースケース',
          description: '6ヶ月未満で測定可能なROIを生み出すデータイニシアチブを特定し優先順位を付け、リターンのない「虚栄心」プロジェクトを回避します。',
          metric: '6-12ヶ月ROI'
        },
        card2: {
          title: 'コスト最適化',
          description: '効率的なアーキテクチャと適切な技術により、インフラストラクチャとデータ運用コストを最大40％削減します。',
          metric: '最大40％節約'
        },
        card3: {
          title: '実行可能なロードマップ',
          description: '理論的なプレゼンテーションだけでなく、フェーズ、マイルストーン、明確な成功指標を持つ詳細な実装計画を提供します。',
          metric: '100％実行可能'
        },
        card4: {
          title: '迅速な結果',
          description: '数ヶ月ではなく数週間でパイロットとPoCで仮説を検証し、早期の価値を実証し戦略を調整します。',
          metric: '2-4週間PoC'
        }
      },
      capabilities: {
        title: '私たちのアプローチ',
        subtitle: 'スタートアップ、スケールアップ、Fortune 500で実証された方法論',
        items: [
          {
            title: '高インパクトユースケースの発見',
            description: '主要なステークホルダーとワークショップを促進し、ビジネスの針を本当に動かすデータ機会を特定します。インパクト対労力フレームワークを使用して優先順位を付けます。',
            features: [
              'Cレベルおよびエリアリーダーとのインタビュー',
              'ペインポイントと機会の分析',
              '優先順位付けマトリックス（インパクト対労力）',
              'KPIと成功指標の定義',
              'ROI予測を伴うビジネスケース'
            ]
          },
          {
            title: 'スケーラブルで効率的なデータアーキテクチャ',
            description: 'スケールと予算に合わせたモダンアーキテクチャ（クラウドネイティブ、レイクハウス、メッシュ）を設計します。過剰エンジニアリングを避け、低運用コストのために最適化します。',
            features: [
              'クラウドネイティブアーキテクチャ（AWS、GCP、Azure）',
              'モダンパターン：データレイクハウス、データメッシュ',
              'TCO（総所有コスト）見積もり',
              'レガシーシステムからの移行計画',
              '文書化されたリファレンスアーキテクチャ'
            ]
          },
          {
            title: 'コスト評価と最適化',
            description: '既存のインフラストラクチャを監査して非効率性と無駄を特定します。クエリ、ストレージ、コンピュートを最適化してクラウド請求を最大50％削減します。',
            features: [
              '現在のコスト分析（コンピュート、ストレージ、エグレス）',
              '活用されていないリソースの特定',
              'クエリとパイプラインの最適化',
              'リザーブドインスタンスと節約プラン',
              '継続的なコスト監視（FinOps）'
            ]
          },
          {
            title: 'パイロットと概念実証（PoC）',
            description: '大規模な予算を約束する前に、迅速なパイロット（2-4週間）で技術とアプローチを検証します。実際のデータで具体的な価値を実証します。',
            features: [
              '明確な成功基準を持つPoC設計',
              '実際のデータでの迅速な実装',
              'ビジネス仮説の検証',
              'ステークホルダー向け機能デモ',
              '情報に基づいたgo/no-go推奨事項'
            ]
          }
        ]
      },
      useCases: {
        title: '成功事例',
        cases: [
          {
            label: '小売/Eコマース',
            title: 'データによるパーソナライゼーション戦略',
            flow: [
              {
                label: '問題',
                content: '50万ユーザーを持つEコマーススタートアップは体験をパーソナライズできませんでした。統合のない6つのシステムに散在するデータ。'
              },
              {
                label: '解決策',
                content: 'SegmentとSnowflakeを使用した顧客データプラットフォーム（CDP）アーキテクチャを設計しました。レコメンデーション、メールキャンペーン、カート放棄のユースケースを定義しました。'
              },
              {
                label: '結果',
                content: 'メールキャンペーンコンバージョン+35％、平均注文額（AOV）+22％。4ヶ月でプラスROI。8週間で実装されたスタック。'
              }
            ]
          },
          {
            label: 'フィンテック/SaaS',
            title: 'クラウドコスト60％削減',
            flow: [
              {
                label: '問題',
                content: 'AWSで月額15万ドルのスケールアップ。重複データを処理する非効率的なパイプライン。常時稼働のウェアハウス。'
              },
              {
                label: '解決策',
                content: 'リソースの完全監査。自動サスペンド機能付きSnowflakeへの移行。クエリ最適化とパーティショニング。安定したワークロードのためのリザーブドインスタンス。'
              },
              {
                label: '結果',
                content: 'コストを月額6万ドルに削減（60％節約＝年間100万ドル）。クエリ3倍高速化。チーム向けFinOpsプレイブック文書化。'
              }
            ]
          },
          {
            label: 'ヘルスケア/エンタープライズ',
            title: 'データレイク最新化ロードマップ',
            flow: [
              {
                label: '問題',
                content: 'レガシーデータレイク（オンプレミスHadoop）を持つFortune 500企業。高額なメンテナンスとビジネスユーザーによる低採用率。'
              },
              {
                label: '解決策',
                content: 'Databricks Lakehouseへの段階的移行戦略。重要なユースケース（規制レポート）でのPoC。5つのフェーズを持つ18ヶ月のロードマップ。'
              },
              {
                label: '結果',
                content: '6週間で成功したPoC。Cレベルの賛同獲得。フェーズ1（3つの重要なワークロードの移行）の予算承認。予測される200万ドルのインフラ節約。'
              }
            ]
          }
        ]
      },
      techStack: {
        title: 'テクノロジーとフレームワーク',
        subtitle: '推奨および習得している技術スタック',
        categories: [
          {
            title: 'クラウドプラットフォーム',
            items: ['AWS', 'Google Cloud', 'Azure', 'Snowflake']
          },
          {
            title: 'アーキテクチャパターン',
            items: ['データレイクハウス', 'データメッシュ', 'ラムダアーキテクチャ', 'イベント駆動型']
          },
          {
            title: 'フレームワークと方法論',
            items: ['TOGAF', 'DAMA-DMBOK', 'DataOps', 'FinOps']
          }
        ]
      },
      cta: {
        title: 'データ戦略を設計する準備はできていますか？',
        description: 'データの課題と私たちがどのようにお手伝いできるかを議論するための無料コンサルテーションセッション（30分）を予約してください。',
        button: '無料コンサルテーションを予約'
      },
      relatedServices: {
        title: '関連サービス',
        subtitle: 'これらのサービスで戦略を補完',
        cards: [
          {
            title: 'データガバナンス',
            description: '明確なポリシーとプロセスで品質、セキュリティ、コンプライアンスを確保します。'
          },
          {
            title: 'データエンジニアリング',
            description: 'コンサルティングフェーズで設計されたパイプラインとアーキテクチャを実装します。'
          },
          {
            title: 'ビジネスインテリジェンス',
            description: '特定されたユースケースを具体化するダッシュボードとレポート。'
          }
        ],
        linkText: 'サービスを見る'
      }
    },
    biPage: {
      hero: {
        title: 'ビジネスインテリジェンス',
        tagline: '意思決定を推進するダッシュボード',
        description: '複雑なデータを経営陣の実行可能な洞察に変換するリアルタイムのインタラクティブダッシュボード。散在する指標を自信を持って戦略的決定を導く視覚的なナラティブに変換します。',
        ctaPrimary: 'デモを予約',
        ctaSecondary: '私たちのサービス'
      },
      valueProps: {
        title: 'ビジネスインテリジェンスが必要な理由',
        subtitle: '誰もが理解できる視覚化でデータをアクションに変換',
        card1: {
          title: 'リアルタイムインサイト',
          description: '15分ごとに自動更新されるダッシュボード。時代遅れの週次レポートを待たずに重要なKPIを監視します。',
          metric: '15分更新'
        },
        card2: {
          title: 'データ駆動型の意思決定',
          description: '直感ベースの意思決定を排除します。すべてのステークホルダーが理解できる明確で文脈化された実行可能な指標。',
          metric: '100％データ駆動型'
        },
        card3: {
          title: '迅速な実装',
          description: '3-4週間で最初の生産的なダッシュボード。2週間のスプリントと増分デモを伴うアジャイル方法論。',
          metric: '3-4週間稼働開始'
        },
        card4: {
          title: 'セルフサービス分析',
          description: 'ITに依存せずにデータを探索できるようビジネスチームを強化します。一貫性を保証するセマンティックモデル。',
          metric: 'ITチケット80％減'
        }
      },
      capabilities: {
        title: '私たちのアプローチ',
        subtitle: '市場をリードするBIプラットフォームの専門知識',
        items: [
          {
            title: 'セマンティックデータモデリング',
            description: '組織全体で一貫した指標を保証するセマンティックレイヤー（スタースキーマ、OLAPキューブ）を設計します。「収益」、「CAC」、または「チャーン」が定義される単一の場所。',
            features: [
              'スタースキーマとディメンショナルモデリング',
              '集中型ビジネスロジック（指標定義）',
              '詳細なアクセスのための行レベルセキュリティ',
              '最適化された関係と階層',
              '指標とKPIのドキュメント'
            ]
          },
          {
            title: 'Power BI、Looker、Tableauのダッシュボード',
            description: '選択したプラットフォームでインタラクティブダッシュボードを実装します。異なるオーディエンス向けのドリルダウン、フィルター、エクスポートを備えたユーザー中心の設計。',
            features: [
              'Cレベル向けエグゼクティブダッシュボード',
              'チーム向けオペレーショナルダッシュボード',
              'ドリルダウンとアドホック探索',
              '外出先での意思決定のためのモバイル対応',
              'PDFとExcelへのエクスポート'
            ]
          },
          {
            title: 'セルフホストBIプラットフォーム',
            description: '最大限の制御とカスタマイズのためのオープンソースまたはセルフホストBIソリューションを実装します。厳格なデータ主権またはコンプライアンス要件を持つ企業に最適。',
            features: [
              'MetabaseとApache Supersetデプロイメント',
              'コラボレーティブアドホッククエリのためのRedash',
              'メトリクスと監視のためのGrafana',
              'インフラストラクチャとデータの完全な制御',
              'ライセンスの制限なしでカスタマイズ'
            ]
          },
          {
            title: '自動アラートと通知',
            description: '重要な指標が逸脱したときに通知されるように、しきい値ベースのアラートを構成します。反応ではなくプロアクティブに。',
            features: [
              'KPI < しきい値の時のメール/Slackアラート',
              '自動異常検出（MLベース）',
              'スケジュールレポート（毎日、毎週、毎月）',
              'マルチステップ条件付き通知',
              'チケッティングシステムとの統合'
            ]
          },
          {
            title: 'アプリケーションへの組み込み分析',
            description: 'SaaS製品にダッシュボードを直接統合し、クライアントがアプリを離れることなく分析にアクセスできるようにします。ホワイトラベルとマルチテナント。',
            features: [
              'SSO/SAMLを使用した組み込みiframe',
              'ホワイトラベル（カスタマイズされたブランディング）',
              '行レベルセキュリティを備えたマルチテナンシー',
              'プログラマティック組み込みのためのAPI',
              '使用分析と収益化'
            ]
          }
        ]
      },
      useCases: {
        title: '成功事例',
        cases: [
          {
            label: 'SaaS / B2B',
            title: 'SaaSスケールアップ向けエグゼクティブダッシュボード',
            flow: [
              {
                label: '問題',
                content: '年間経常収益1,000万ドルのB2B SaaSのCEOには、重要な指標のリアルタイム可視性がありませんでした。先週のデータを使用した手動Excelレポート。'
              },
              {
                label: '解決策',
                content: 'MRR、CAC、LTV、チャーン、販売パイプラインを備えたLookerのエグゼクティブダッシュボード。Salesforce、Stripe、データウェアハウスから15分ごとに更新。'
              },
              {
                label: '結果',
                content: 'CEOは戦略的決定を3倍速く行います。早期チャーン識別により18％削減。リアルタイム更新データによる取締役会議。'
              }
            ]
          },
          {
            label: 'Eコマース/小売',
            title: 'Eコマース向けオペレーショナルダッシュボード',
            flow: [
              {
                label: '問題',
                content: '在庫、フルフィルメント、カスタマーサポートを監視するために10以上のツールをレビューするオペレーションチーム。システム間の一貫性のないデータ。'
              },
              {
                label: '解決策',
                content: 'Power BIのオペレーショナルダッシュボード：在庫レベル、注文フルフィルメントSLA、サポートチケット。Shopify、Zendesk、NetSuiteからの指標を統合するセマンティックレイヤー。'
              },
              {
                label: '結果',
                content: '在庫可視性による在庫切れ40％削減。フルフィルメントSLAが72時間から48時間に改善。オペレーションチームは手動レポーティングで週15時間節約。'
              }
            ]
          },
          {
            label: 'フィンテック/組み込み',
            title: 'B2Bクライアント向け組み込み分析',
            flow: [
              {
                label: '問題',
                content: 'エンタープライズクライアント向けの分析を持たないB2Bフィンテック。カスタムレポートの要求が絶えず、チームに業務負担を作成。'
              },
              {
                label: '解決策',
                content: 'ホワイトラベルを備えたTableauの組み込み分析。各クライアントはポータル内でパーソナライズされたダッシュボード（トランザクション、手数料、調整）にアクセス。'
              },
              {
                label: '結果',
                content: 'クライアントNPS +25ポイント。カスタムレポートリクエスト90％減。組み込み分析が販売差別化要因に。'
              }
            ]
          }
        ]
      },
      techStack: {
        title: 'テクノロジーとプラットフォーム',
        subtitle: '習得および推奨するBIスタック',
        categories: [
          {
            title: 'BIプラットフォーム',
            items: ['Power BI', 'Looker', 'Tableau', 'Metabase']
          },
          {
            title: 'セマンティックレイヤーとモデリング',
            items: ['dbt Metrics', 'LookML (Looker)', 'Power BI Dataflows', 'Cube.js']
          },
          {
            title: 'データソースとウェアハウス',
            items: ['Snowflake', 'BigQuery', 'Redshift', 'Databricks']
          }
        ]
      },
      cta: {
        title: 'データを視覚化する準備はできていますか？',
        description: '4週間未満でデータを実行可能なダッシュボードに変換する方法をお見せする無料デモを予約してください。',
        button: '無料デモを予約'
      },
      relatedServices: {
        title: '関連サービス',
        subtitle: 'これらのサービスでダッシュボードを補完',
        cards: [
          {
            title: 'データエンジニアリング',
            description: 'クリーンで更新されたデータでダッシュボードを供給する堅牢なパイプライン。'
          },
          {
            title: 'データサイエンス',
            description: '予測およびチャーンモデルでダッシュボードに予測分析を追加します。'
          },
          {
            title: 'データガバナンス',
            description: 'ダッシュボードが信頼性の高いガバナンスされたデータを表示することを確認します。'
          }
        ],
        linkText: 'サービスを見る'
      }
    },
    dataSciencePage: {
      hero: {
        title: 'データサイエンス',
        tagline: '価値を生み出す予測的洞察',
        description: 'トレンドを予測し、業務を最適化し、収益を最大化する予測モデルと高度な分析。実際のビジネス問題に適用された機械学習を通じて履歴データを競争優位に変換します。',
        ctaPrimary: 'コンサルテーションを予約',
        ctaSecondary: '私たちのサービス'
      },
      valueProps: {
        title: 'データサイエンスが必要な理由',
        subtitle: 'ボトムラインに影響を与える予測分析',
        card1: {
          title: 'トレンド予測',
          description: '統計モデルとMLによる需要、チャーン、収益の予測。3-6ヶ月の期間で90％以上の精度で計画します。',
          metric: '90％以上の精度'
        },
        card2: {
          title: 'インテリジェントセグメンテーション',
          description: '行動、価値、傾向による顧客のクラスタリング。セグメントごとにマーケティングと製品戦略をパーソナライズします。',
          metric: 'コンバージョン+40％'
        },
        card3: {
          title: '厳密な統計的検証',
          description: 'A/Bテスト、有意性テスト、信頼区間でテストされた仮説。疑似相関に基づく決定はもうありません。',
          metric: '95％信頼度'
        },
        card4: {
          title: '本番環境のモデル',
          description: '監視、再トレーニング、ドリフト検出を伴う本番環境へのモデルデプロイのためのMLOps。24時間365日価値を生み出すモデル。',
          metric: '24時間365日推論'
        }
      },
      capabilities: {
        title: '私たちのアプローチ',
        subtitle: 'ビジネスユースケースに適用されたMLの専門知識',
        items: [
          {
            title: '需要とチャーンの予測',
            description: '製品需要を予測する予測モデル（ARIMA、Prophet、LSTM）と、顧客が離れる前にリスクのある顧客を識別するチャーンモデル。',
            features: [
              'Prophet、ARIMA、LSTMを使用した予測',
              'XGBoost、LightGBMを使用したチャーン予測',
              '行動に基づく特徴量エンジニアリング',
              'スコアリングのための確率較正',
              '履歴データを使用した厳密なバックテスト'
            ]
          },
          {
            title: '顧客セグメンテーションとLTV',
            description: '行動による顧客セグメント化のためのクラスタリング（K-means、DBSCAN）。獲得と維持の取り組みを優先順位付けするためのLTV（生涯価値）モデル。',
            features: [
              'RFM分析と行動クラスタリング',
              '生存モデルを使用したLTV予測',
              'コホート分析と維持曲線',
              'アップセル/クロスセルのための傾向モデル',
              'セグメントごとのキャンペーンパーソナライゼーション'
            ]
          },
          {
            title: 'ヒューリスティックパターン検出',
            description: 'データ内の明白でないパターンを発見するための探索的分析。詐欺、外れ値、注意が必要な異常なイベントのための異常検出。',
            features: [
              '深い探索的データ分析（EDA）',
              '異常検出（Isolation Forest、オートエンコーダー）',
              '関連ルールマイニング（マーケットバスケット分析）',
              '時系列分解（トレンド、季節性）',
              '実際のドライバーを識別するための因果推論'
            ]
          },
          {
            title: '厳密な統計的検証',
            description: '検出力分析と多重検定補正を伴うA/Bテスト。情報に基づいた意思決定のための信頼区間、仮説検定、因果推論。',
            features: [
              '検出力分析を伴うA/Bテスト設計',
              '早期停止のためのベイジアンA/Bテスト',
              '多重検定補正（Bonferroni、FDR）',
              '因果推論（傾向スコアマッチング、DiD）',
              'モデルの解釈可能性（SHAP、LIME）'
            ]
          }
        ]
      },
      useCases: {
        title: '成功事例',
        cases: [
          {
            label: 'SaaS / B2B',
            title: 'SaaS B2Bのチャーン予測',
            flow: [
              {
                label: '問題',
                content: 'SaaS B2Bの年間チャーン率25％。CS チームはリアクティブ: 顧客がキャンセルした後に連絡していました。年間200万ドルのARRが失われました。'
              },
              {
                label: '解決策',
                content: '製品使用の特徴（ログイン、使用された機能、サポートチケット）を使用したXGBoostによるチャーンモデル。リスクのあるアカウントを識別するための週次スコアリング。'
              },
              {
                label: '結果',
                content: '6ヶ月でチャーンが25％から17％に減少。CSチームはプロアクティブになり、リスクのあるアカウントの40％を救済。年間80万ドルの収益回復。プロジェクトのROI: 8倍。'
              }
            ]
          },
          {
            label: '小売 / Eコマース',
            title: '小売業の需要予測',
            flow: [
              {
                label: '問題',
                content: '頻繁な在庫切れと同時過剰在庫を持つ小売業者。Excelによる手動予測。需要予測の30％エラー率。'
              },
              {
                label: '解決策',
                content: 'プロモーション、季節性、特別イベントの特徴を持つProphetによる予測モデル。4週間の期間でSKU-店舗レベルの予測。'
              },
              {
                label: '結果',
                content: '予測エラーが12％（MAPE）に減少。在庫切れ-40％、過剰在庫-35％。運転資本の解放: 300万ドル。可用性による顧客満足度+15％。'
              }
            ]
          },
          {
            label: 'フィンテック / 銀行',
            title: '顧客LTVセグメンテーション',
            flow: [
              {
                label: '問題',
                content: 'すべての獲得した顧客に均等に支出するフィンテック。高いCAC（200ドル）、LTVは不明。一部の顧客は十分な価値を生み出していませんでした。'
              },
              {
                label: '解決策',
                content: '取引、契約製品、人口統計を使用したLTV予測モデル。高/中/低価値へのセグメンテーション。セグメントごとの差別化戦略。'
              },
              {
                label: '結果',
                content: 'マーケティング予算が高LTVセグメントに再配分されました。セグメントごとにCACが最適化されました。マーケティングのROI +60％。LTV/CAC比率が2.5倍から4.2倍に改善。'
              }
            ]
          }
        ]
      },
      techStack: {
        title: 'テクノロジーとフレームワーク',
        subtitle: '習得するMLとデータサイエンススタック',
        categories: [
          {
            title: 'MLフレームワークとライブラリ',
            items: [
              'Scikit-learn',
              'XGBoost / LightGBM',
              'TensorFlow / PyTorch',
              'Prophet / statsmodels'
            ]
          },
          {
            title: 'MLOpsとデプロイメント',
            items: [
              'MLflow',
              'Weights & Biases',
              'SageMaker',
              'Databricks MLR'
            ]
          },
          {
            title: '分析と実験',
            items: [
              'Python (Pandas, NumPy)',
              'R (tidyverse)',
              'Jupyter / Databricks',
              'Optimizely / GrowthBook'
            ]
          }
        ]
      },
      cta: {
        title: 'ビジネスの未来を予測する準備はできていますか？',
        description: '無料のディスカバリーセッションを予約してください。業界とビジネスに高ROIのMLユースケースを特定します。',
        button: 'ディスカバリーセッションを予約'
      },
      relatedServices: {
        title: '関連サービス',
        subtitle: '堅牢なインフラストラクチャでモデルを補完',
        cards: [
          {
            title: 'データエンジニアリング',
            description: 'クリーンで最新の特徴でモデルに供給するパイプライン。'
          },
          {
            title: 'ビジネスインテリジェンス',
            description: 'モデルの予測とスコアを視覚化するダッシュボード。'
          },
          {
            title: 'AI / 生成AI',
            description: '予測的洞察に基づいて行動するインテリジェントエージェント。'
          }
        ],
        linkText: 'サービスを見る'
      }
    },
    gobiernoPage: {
      hero: {
        title: 'データガバナンス',
        tagline: '信頼性の高いデータ、正確な決定',
        description: 'データの品質、セキュリティ、規制コンプライアンスを確保するための人、プロセス、ポリシーを確立します。データの混沌をガバナンスされた信頼性の高い戦略的資産に変換します。',
        ctaPrimary: 'コンサルテーションを予約',
        ctaSecondary: '私たちのサービス'
      },
      valueProps: {
        title: 'データガバナンスが必要な理由',
        subtitle: 'データ駆動型の意思決定における信頼、コンプライアンス、品質',
        card1: {
          title: '規制コンプライアンス',
          description: 'GDPR、CCPA、SOC 2、および業界規制へのコンプライアンスを確保します。数百万ドルの罰金と法的リスクを回避します。',
          metric: '100％コンプライアンス'
        },
        card2: {
          title: 'データ品質',
          description: '自動監視付き品質SLAを実装します。ビジネス意思決定に影響を与えるデータエラーを削減します。',
          metric: '95％以上の品質'
        },
        card3: {
          title: '集中型カタログ',
          description: '明確なメタデータ、系統、所有権を持つデータカタログ。数週間ではなく数分でデータを見つけて理解します。',
          metric: '検索90％減'
        },
        card4: {
          title: '役割と責任',
          description: '明確に定義されたデータ所有者、スチュワード、カストディアンを持つRACIモデル。各データセットのアカウンタビリティ。',
          metric: '明確な所有権'
        }
      },
      capabilities: {
        title: '私たちのアプローチ',
        subtitle: 'DAMA-DMBOKに基づく完全なデータガバナンスフレームワーク',
        items: [
          {
            title: 'RACIモデルとデータの役割',
            description: '主要な役割を持つ組織構造を定義します: チーフデータオフィサー、データ所有者、データスチュワード、データカストディアン。責任を明確にするためのRACIマトリックス。',
            features: [
              '役割と責任の定義',
              'データドメインごとのRACIマトリックス',
              '新しい役割のジョブディスクリプション',
              '運用ガバナンスモデル',
              'データ委員会と会議のケイデンス'
            ]
          },
          {
            title: '集中型データカタログ',
            description: '豊富なメタデータ、自動化された系統、インテリジェント検索を備えたデータカタログ（Alation、Collibra、Atlan）を実装します。データ資産の単一の真実のソース。',
            features: [
              'データカタログツールのセットアップ',
              '自動化されたメタデータハーベスティング',
              'エンドツーエンドのデータ系統',
              'ビジネス用語集とビジネス用語',
              'セルフサービスのための検索と発見'
            ]
          },
          {
            title: 'データ品質SLA（データ品質）',
            description: 'メトリックとしきい値を持つ品質次元（正確性、完全性、適時性）を確立します。劣化の場合にアラートを伴う自動監視。',
            features: [
              '品質次元の定義',
              '重要なデータセットごとのSLA（正確性、完全性など）',
              'データ品質チェックの実装',
              'リアルタイム監視ダッシュボード',
              '修復とエスカレーションプロセス'
            ]
          },
          {
            title: 'アクセス、プライバシー、セキュリティポリシー',
            description: 'アクセスポリシー（RBAC）、データ分類（PII、機密）、コンプライアンスプロセス（GDPR、CCPA）を設計します。アクセスとデータ保持の監査。',
            features: [
              'データ分類（公開、内部、機密、PII）',
              'RBACポリシー（役割ベースのアクセス制御）',
              'データプライバシープロセス（GDPR、CCPA）',
              'データ保持とアーカイブポリシー',
              'アクセスの監査とコンプライアンスレポート'
            ]
          }
        ]
      },
      useCases: {
        title: '成功事例',
        cases: [
          {
            label: 'フィンテック / 銀行',
            title: '90日でGDPRコンプライアンス',
            flow: [
              {
                label: '問題',
                content: 'GDPRコンプライアンスなしでEU顧客データを処理するフィンテック。最大2000万ユーロの罰金のリスク。個人データのインベントリがありませんでした。'
              },
              {
                label: '解決策',
                content: '2週間でPIIの完全なインベントリ。アクセス、保持、忘れられる権利のポリシーの実装。自動分類を備えたデータカタログ。'
              },
              {
                label: '結果',
                content: '90日で100％GDPRコンプライアンス。SOC 2タイプII認証を達成。文書化され監査可能なプロセス。法的リスクを排除。'
              }
            ]
          },
          {
            label: 'ヘルスケア / エンタープライズ',
            title: '病院のデータ品質プログラム',
            flow: [
              {
                label: '問題',
                content: '患者データの15％のエラーを持つ病院。規制レポートが却下されました。不正確なデータに基づく臨床決定。'
              },
              {
                label: '解決策',
                content: '自動検証のためのGreat Expectationsの実装。重要なデータセットごとのSLA定義。C レベル向けデータ品質ダッシュボード。'
              },
              {
                label: '結果',
                content: '6ヶ月でエラーが3％に減少。最初の試行で承認された規制レポート。臨床決定への信頼性が向上。再作業削減による測定可能なROI。'
              }
            ]
          },
          {
            label: 'Eコマース / スケールアップ',
            title: 'セルフサービス分析のためのデータカタログ',
            flow: [
              {
                label: '問題',
                content: 'ビジネスアナリストが正しいデータを探すのに60％の時間を費やしていました。文書化されていないウェアハウス内の150以上のテーブル。作業の重複。'
              },
              {
                label: '解決策',
                content: 'Atlanをデータカタログとして実装。メタデータの自動ハーベスティング。200以上の用語を持つビジネス用語集。アナリストのトレーニング。'
              },
              {
                label: '結果',
                content: '検索時間が80％短縮。セルフサービス分析が有効になりました。データ発見が2時間から2分に。アナリストのNPS: 9/10。'
              }
            ]
          }
        ]
      },
      techStack: {
        title: 'テクノロジーとフレームワーク',
        subtitle: 'データガバナンスツールスタック',
        categories: [
          {
            title: 'データカタログと系統',
            items: [
              'Alation',
              'Collibra',
              'Atlan',
              'OpenMetadata'
            ]
          },
          {
            title: 'データ品質',
            items: [
              'Great Expectations',
              'Monte Carlo',
              'Soda',
              'dbt Tests'
            ]
          },
          {
            title: 'フレームワークと標準',
            items: [
              'DAMA-DMBOK',
              'DCAM',
              'GDPR',
              'SOC 2'
            ]
          }
        ]
      },
      cta: {
        title: 'データをガバナンスする準備はできていますか？',
        description: '無料のデータガバナンス成熟度評価から始めましょう。ギャップを特定し、高インパクトイニシアチブを優先順位付けします。',
        button: '無料評価をリクエスト'
      },
      relatedServices: {
        title: '関連サービス',
        subtitle: 'ガバナンスプログラムを補完',
        cards: [
          {
            title: 'データコンサルティング',
            description: 'ガバナンスを実装する前にデータ戦略を定義します。'
          },
          {
            title: 'データエンジニアリング',
            description: '統合されたデータ品質チェックを備えたパイプラインを実装します。'
          },
          {
            title: 'データサイエンス',
            description: '信頼性の高いモデルには、ガバナンスされた高品質なデータが必要です。'
          }
        ],
        linkText: 'サービスを見る'
      }
    },
    ingenieriaPage: {
      hero: {
        title: 'データエンジニアリング',
        tagline: 'スケーラブルで効率的なパイプライン',
        description: '大量のデータを効率的に処理するための移行、ETLパイプライン、モダンアーキテクチャ。コストを直線的に増加させることなくビジネスとともに拡大する堅牢なデータインフラストラクチャを構築します。',
        ctaPrimary: 'コンサルテーションを予約',
        ctaSecondary: '私たちのサービス'
      },
      valueProps: {
        title: 'データエンジニアリングが必要な理由',
        subtitle: 'パフォーマンスを損なうことなく拡大するデータインフラストラクチャ',
        card1: {
          title: '大規模処理',
          description: '時間ではなく分で数百万のレコードを処理するパイプライン。ビッグデータ処理のためのSparkを使用した分散アーキテクチャ。',
          metric: '1日あたり1億レコード以上'
        },
        card2: {
          title: 'コスト最適化',
          description: '効率的なアーキテクチャ、インテリジェントパーティショニング、自動スケーリングによりクラウドコストを最大50％削減します。',
          metric: '最大50％節約'
        },
        card3: {
          title: '24時間365日の信頼性',
          description: 'リトライロジック、アラート、監視を備えた回復力のあるパイプライン。重要なデータロードのアップタイムSLA > 99.5％。',
          metric: '99.5％アップタイム'
        },
        card4: {
          title: 'ゼロダウンタイム移行',
          description: 'ビジネス運用を中断することなく、レガシーシステム（オンプレミス、古いデータベース）からモダンクラウドに移行します。',
          metric: 'ゼロダウンタイム'
        }
      },
      capabilities: {
        title: '私たちのアプローチ',
        subtitle: 'モダンデータアーキテクチャ（バッチ、ストリーミング、リアルタイム）の専門知識',
        items: [
          {
            title: 'インクリメンタルおよびバッチデータ取り込み',
            description: '負荷と遅延を最小限に抑えるためのインクリメンタル戦略（CDC）を使用して、複数のソース（データベース、API、ファイル）からの取り込みパイプラインを実装します。',
            features: [
              'Debezium/Fivetranを使用した変更データキャプチャ（CDC）',
              'REST/GraphQL APIからの取り込み',
              'ファイル（S3、SFTP）のバッチ処理',
              'SaaSアプリ（Salesforce、HubSpotなど）のコネクタ',
              'スキーマの進化とバージョニング'
            ]
          },
          {
            title: 'AirflowとDagsterによるオーケストレーション',
            description: '依存関係、リトライ、アラートを持つ複雑なパイプラインをオーケストレーションします。自動デプロイのためのCI/CDを伴うGitでバージョン管理されたDAG。',
            features: [
              'モジュール化され再利用可能なDAG',
              '依存関係とバックフィルの処理',
              'リトライロジックとサーキットブレーカー',
              '障害時のSlack/PagerDutyによるアラート',
              '自動テストを伴うCI/CD'
            ]
          },
          {
            title: 'dbtとSparkによる変換',
            description: 'バッチの場合はdbt（SQL）、ビッグデータの場合はSparkを使用して、生データを分析モデルに変換します。自動化されたテストと生成されたドキュメント。',
            features: [
              'テストとドキュメント付きdbtモデル',
              '効率のためのインクリメンタルモデル',
              'PBスケール処理のためのSparkジョブ',
              '自動化されたデータ品質テスト',
              'エンドツーエンドの系統追跡'
            ]
          },
          {
            title: 'クラウドコスト最適化',
            description: '既存のインフラストラクチャを監査および最適化します: パーティショニング、クラスタリング、自動一時停止、予約容量。データチームのためのFinOps。',
            features: [
              'コスト分析（コンピューティング、ストレージ、エグレス）',
              'パーティショニングとクラスタリング戦略',
              'ウェアハウスの自動一時停止/再開',
              '予約インスタンスと節約プラン',
              'クエリ最適化とキャッシング'
            ]
          }
        ]
      },
      useCases: {
        title: '成功事例',
        cases: [
          {
            label: 'フィンテック / スケールアップ',
            title: 'PostgreSQLからSnowflakeへの移行',
            flow: [
              {
                label: '問題',
                content: 'オンプレミスのPostgreSQLで月間5000万トランザクションを処理するフィンテック。クエリが遅い（+30秒）、バックアップが失敗、2人のDBAチームが飽和状態。'
              },
              {
                label: '解決策',
                content: 'Fivetranを使用したCDCインクリメンタルによるSnowflakeへの移行。変換のためのdbtパイプライン。オーケストレーションのためのAirflow。ゼロダウンタイム移行。'
              },
              {
                label: '結果',
                content: 'クエリが10倍高速（30秒→3秒）。自動化されたバックアップ。戦略的プロジェクトのためにDBAが解放されました。オンプレミス維持と比較して30％低コスト。'
              }
            ]
          },
          {
            label: 'Eコマース / 小売',
            title: 'リアルタイム在庫パイプライン',
            flow: [
              {
                label: '問題',
                content: '6時間ごとに在庫同期するEコマース。在庫切れ製品を販売し、キャンセルと低NPSを生成しました。'
              },
              {
                label: '解決策',
                content: 'Kafka + Flinkによるリアルタイムパイプライン。ERP（SAP）からのCDC。利用可能在庫を計算するためのストリーム処理。遅延<1分。'
              },
              {
                label: '結果',
                content: '在庫切れによるキャンセルが75％減少。NPS +12ポイント。在庫精度の向上による年間50万ドルの収益回復。'
              }
            ]
          },
          {
            label: 'SaaS / B2B',
            title: '製品分析のためのデータプラットフォーム',
            flow: [
              {
                label: '問題',
                content: 'ユーザー行動の可視性がないSaaS B2B。製品イベントがログに散在。ロードマップを優先順位付けするデータがないPMチーム。'
              },
              {
                label: '解決策',
                content: 'Segment + BigQueryによるイベントストリーミング。ユーザージャーニー、ファネル、リテンションコホートをモデル化するためのdbt。PMチーム向けLookerのダッシュボード。'
              },
              {
                label: '結果',
                content: 'PMチームが数ヶ月ではなく数日で機能採用を識別。統計的有意性を持つA/B実験。データ駆動型ロードマップが+30％のアクティベーション率をもたらしました。'
              }
            ]
          }
        ]
      },
      techStack: {
        title: 'テクノロジーとフレームワーク',
        subtitle: 'モダンデータエンジニアリングスタック',
        categories: [
          {
            title: 'オーケストレーションとワークフロー',
            items: [
              'Apache Airflow',
              'Dagster',
              'Prefect',
              'Kestra'
            ]
          },
          {
            title: '処理と変換',
            items: [
              'dbt',
              'Apache Spark',
              'Apache Flink',
              'Kafka Streams'
            ]
          },
          {
            title: '取り込みと統合',
            items: [
              'Fivetran',
              'Airbyte',
              'Debezium (CDC)',
              'Kafka Connect'
            ]
          }
        ]
      },
      cta: {
        title: 'データインフラストラクチャを最新化する準備はできていますか？',
        description: '無料のアーキテクチャレビューセッションを予約してください。現在のスタックを評価し、最適化の機会を特定します。',
        button: 'アーキテクチャレビューを予約'
      },
      relatedServices: {
        title: '関連サービス',
        subtitle: 'データインフラストラクチャの価値を最大化',
        cards: [
          {
            title: 'データコンサルティング',
            description: 'パイプラインを実装する前にアーキテクチャとロードマップを定義します。'
          },
          {
            title: 'ビジネスインテリジェンス',
            description: '堅牢なデータパイプラインによって供給されるダッシュボード。'
          },
          {
            title: 'データガバナンス',
            description: 'データガバナンスによってパイプラインの品質とコンプライアンスを確保します。'
          }
        ],
        linkText: 'サービスを見る'
      }
    },
    aiGenaiPage: {
      hero: {
        title: 'AI / 生成AI',
        tagline: 'データから自動化されたアクションへ',
        description: 'プロセスを自動化し、販売を加速し、戦略的決定を強化するインテリジェントエージェント。生成AIと24時間365日ビジネスのために働く自律エージェントを通じてデータをアクションに変換します。',
        ctaPrimary: 'デモを予約',
        ctaSecondary: '私たちのサービス'
      },
      valueProps: {
        title: 'AI / 生成AIが必要な理由',
        subtitle: 'ヘッドカウントなしで業務を拡大するインテリジェント自動化',
        card1: {
          title: 'インテリジェント自動化',
          description: '人間の精度で反復タスクを実行するエージェント。高価値の戦略的作業に集中できるようチームを解放します。',
          metric: 'タスク80％自動化'
        },
        card2: {
          title: '10倍の速度',
          description: '時間かかったプロセスが今では数分で完了します。Webスクレイピング、データ分析、レポート生成が機械速度で。',
          metric: '10倍高速'
        },
        card3: {
          title: '数週間でROI',
          description: '2-3週間で機能的なパイロット。大規模な予算を約束する前にAIの価値を検証します。フィードバックに基づく迅速な反復。',
          metric: '2-3週間パイロット'
        },
        card4: {
          title: '大規模パーソナライゼーション',
          description: '数千の顧客のコンテンツ、メール、提案を同時にパーソナライズするための生成AI。産業規模での1対1の関連性。',
          metric: '1日あたり1000以上パーソナライズ'
        }
      },
      capabilities: {
        title: '私たちのアプローチ',
        subtitle: '実際のビジネスユースケースに適用されたAIの専門知識',
        items: [
          {
            title: 'Webスクレイパーとデータエージェント',
            description: '公開および非公開ソースからデータを抽出、構造化、強化するインテリジェントエージェント。競合他社、ニュース、市場トレンドの継続的監視。',
            features: [
              'JavaScript、CAPTCHA、レート制限を処理するWebスクレイピング',
              'PDF、画像（OCR）、ドキュメントからのデータ抽出',
              '外部API（LinkedIn、Clearbitなど）による強化',
              'サイト構造の変化に適応するエージェント',
              '自動検証とクリーニングパイプライン'
            ]
          },
          {
            title: '自動営業トリガー',
            description: '購入シグナル（資金調達ラウンド、採用、技術スタックの変更）を識別し、自動的にパーソナライズされたアウトリーチを生成するセールスイネーブルメントエージェント。',
            features: [
              'インテントシグナルの監視（資金調達、求人投稿、技術変更）',
              'リアルタイムリードスコアリング',
              '生成AIによるパーソナライズされたメール生成',
              'エンゲージメントに基づく自動フォローアップ',
              'CRM（Salesforce、HubSpot）との統合'
            ]
          },
          {
            title: 'ビジネス意思決定コパイロット',
            description: 'データを分析し、洞察を生成し、アクションを推奨するAIアシスタント。自然言語で複雑な質問に答えるあなたのデータで訓練されたコパイロット。',
            features: [
              '自然言語でのデータに関するQ&A',
              '経営幹部レポートの自動生成',
              '履歴パターンに基づく推奨事項',
              '内部ドキュメントに対するRAG（検索拡張生成）',
              '特定のドメインでのLLMの微調整'
            ]
          },
          {
            title: 'インテリジェント会議オーケストレーター',
            description: '会議を自動的に転写、要約し、アクションアイテムを生成するエージェント。CRM、カレンダー、プロジェクト管理ツールとの同期。',
            features: [
              '会議の自動転写（Zoom、Meet、Teams）',
              '生成AIによる要約（重要なポイント、決定、次のステップ）',
              'アクションアイテムの抽出と担当者の割り当て',
              '通話からの洞察を使用したCRMの自動更新',
              '営業通話でのセンチメントとエンゲージメントの分析'
            ]
          }
        ]
      },
      useCases: {
        title: '成功事例',
        cases: [
          {
            label: 'SaaS / セールスイネーブルメント',
            title: 'アウトバウンドのセールスイネーブルメントエージェント',
            flow: [
              {
                label: '問題',
                content: '見込み客の調査とコールドメールの作成に80％の時間を費やすSDRチーム。実際の会話にはわずか20％の時間。低いコンバージョン率。'
              },
              {
                label: '解決策',
                content: '資金調達ラウンド、求人投稿、技術スタックの変更を監視するエージェント。特定のシグナルに基づいて生成AI（GPT-4）でパーソナライズされたメールを生成。Outreachに自動エンキュー。'
              },
              {
                label: '結果',
                content: 'SDRが会話のために60％の時間を解放。返信率+35％。同じヘッドカウントで生成されたパイプライン+50％。エージェントのROI: 6ヶ月で12倍。'
              }
            ]
          },
          {
            label: 'プライベートエクイティ / リサーチ',
            title: '競合インテリジェンスエージェント',
            flow: [
              {
                label: '問題',
                content: 'リスクと機会を識別するためにポートフォリオの200以上の企業を監視する必要があったPEファーム。アナリストが週20時間を手動調査に費やしていました。'
              },
              {
                label: '解決策',
                content: 'ニュース、財務申告、ソーシャルメディア、求人投稿を監視するWebスクレイピングエージェント。センチメント分析と重要なイベントに関するアラートのためのNLP。洞察を持つダッシュボード。'
              },
              {
                label: '結果',
                content: 'アナリストが調査時間の80％を節約。リスクの早期識別により、3つのポートフォリオ企業に介入できました。M&Aの機会を6ヶ月前に検出。'
              }
            ]
          },
          {
            label: 'コンサルティング / ナレッジマネジメント',
            title: '内部ナレッジコパイロット',
            flow: [
              {
                label: '問題',
                content: 'Sharepointに散在する10年分の成果物、ケーススタディ、方法論を持つコンサルティング会社。コンサルタントが関連する資産を見つけられず、既に行われた作業を再作成していました。'
              },
              {
                label: '解決策',
                content: '10,000の内部ドキュメントに対するRAGベースのコパイロット。セマンティック検索と自然言語でのQ&A。即座のアクセスのためにSlackに統合。元のソースへの引用。'
              },
              {
                label: '結果',
                content: '検索時間が2時間から5分に短縮。資産の再利用+60％。新しいコンサルタントのオンボーディングが3倍高速。離職に対するナレッジ保持。'
              }
            ]
          }
        ]
      },
      techStack: {
        title: 'テクノロジーとフレームワーク',
        subtitle: '習得するAIと自動化スタック',
        categories: [
          {
            title: 'LLMと生成AIプラットフォーム',
            items: [
              'OpenAI (GPT-4, o1)',
              'Anthropic (Claude)',
              'Google (Gemini)',
              'オープンソース (Llama, Mistral)'
            ]
          },
          {
            title: 'エージェントフレームワークとオーケストレーション',
            items: [
              'LangChain / LangGraph',
              'LlamaIndex',
              'AutoGen',
              'CrewAI'
            ]
          },
          {
            title: 'インフラストラクチャとツール',
            items: [
              'ベクトルDB (Pinecone, Weaviate)',
              'Webスクレイピング (Playwright, Selenium)',
              'MLOps (Weights & Biases, MLflow)',
              'モニタリング (LangSmith, Helicone)'
            ]
          }
        ]
      },
      cta: {
        title: 'AIで自動化する準備はできていますか？',
        description: '無料のアイデアセッションを予約してください。インテリジェントエージェントで自動化できる会社のプロセスを特定します。',
        button: 'アイデアセッションを予約'
      },
      relatedServices: {
        title: '関連サービス',
        subtitle: 'データと分析でエージェントを強化',
        cards: [
          {
            title: 'データサイエンス',
            description: '実用的な洞察でエージェントに供給する予測モデル。'
          },
          {
            title: 'データエンジニアリング',
            description: 'AIエージェントにクリーンなデータを提供する堅牢なパイプライン。'
          },
          {
            title: 'データコンサルティング',
            description: 'AIイニシアチブの影響を最大化するデータ戦略。'
          }
        ],
        linkText: 'サービスを見る'
      }
    }
  }
};

// Current language state
// Default to Spanish for all users
let currentLanguage = localStorage.getItem('language') || 'es';

// Ensure valid language (fallback to Spanish if invalid)
if (currentLanguage !== 'es' && currentLanguage !== 'en' && currentLanguage !== 'jp') {
  currentLanguage = 'es';
}

/**
 * Get nested object value from path string
 * @param {Object} obj - The object to search
 * @param {string} path - Dot-notation path (e.g., 'hero.cta.primary')
 * @returns {*} The value at the path
 */
function getNestedValue(obj, path) {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

/**
 * Update all elements with data-i18n attribute
 */
function updatePageLanguage() {
  console.log('Updating page language to:', currentLanguage);

  const elements = document.querySelectorAll('[data-i18n]');
  console.log('Found', elements.length, 'elements to translate');

  elements.forEach(element => {
    const key = element.getAttribute('data-i18n');
    const translation = getNestedValue(translations[currentLanguage], key);

    if (translation) {
      // Check if translation contains HTML tags
      if (/<[a-z][\s\S]*>/i.test(translation)) {
        element.innerHTML = translation;
      } else {
        element.textContent = translation;
      }
    }
  });

  // Update active state of language buttons
  const languageButtons = document.querySelectorAll('.language-btn');
  languageButtons.forEach(btn => {
    const btnLang = btn.getAttribute('data-lang');
    if (btnLang === currentLanguage) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Update HTML lang attribute
  document.documentElement.lang = currentLanguage;

  // Save preference
  localStorage.setItem('language', currentLanguage);

  console.log('Language update complete');
}

/**
 * Switch to specific language
 */
function switchLanguage(lang) {
  console.log('Switching language to:', lang);
  currentLanguage = lang;
  updatePageLanguage();
}

/**
 * Initialize language system
 */
function initLanguageSystem() {
  console.log('Initializing language system...');

  // Set initial language
  updatePageLanguage();

  // Add click handlers to language buttons
  const languageButtons = document.querySelectorAll('.language-btn');
  console.log('Language buttons found:', languageButtons.length);

  languageButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const lang = btn.getAttribute('data-lang');
      switchLanguage(lang);
    });
  });

  console.log('Language system initialized with language:', currentLanguage);
}

// ========================================
// Export for external use (if needed)
// ========================================
window.DataPulse = {
  loadConfig,
  loadClients,
  loadTestimonials,
  init,
  toggleAlliances,
  toggleLanguage,
  currentLanguage: () => currentLanguage
};
