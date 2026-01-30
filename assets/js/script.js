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
      subtitle: 'Casos de uso específicos adaptados a tus necesidades empresariales'
    },
    infrastructure: {
      title: 'Nuestra Infraestructura: El Motor Detrás de la Data',
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
          role: 'Partner - Seminarium'
        },
        {
          quote: '"Los modelos predictivos de churn nos permitieron retener 10% más clientes. ROI increíble en el primer trimestre."',
          role: 'Co-Founder y Gerente de Operaciones - MyHotel'
        },
        {
          quote: '"Los dashboards en tiempo real han revolucionado cómo tomamos decisiones. Ahora tenemos visibilidad completa de todas nuestras operaciones."',
          role: 'Director - ClouHR'
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
        subtitle: 'Metodologías probadas en startups, scale-ups y Fortune 500'
      },
      useCases: {
        title: 'Casos de Éxito'
      },
      techStack: {
        title: 'Tecnologías y Frameworks',
        subtitle: 'Stack tecnológico que recomendamos y dominamos'
      },
      cta: {
        title: '¿Listo para diseñar tu estrategia de datos?',
        description: 'Agenda una sesión de consultoría gratuita (30 min) para discutir tus desafíos de datos y cómo podemos ayudarte.',
        button: 'Agendar consultoría gratuita'
      },
      relatedServices: {
        title: 'Servicios Relacionados',
        subtitle: 'Complementa tu estrategia con estos servicios'
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
        subtitle: 'Expertise en las principales plataformas de BI del mercado'
      },
      useCases: {
        title: 'Casos de Éxito'
      },
      techStack: {
        title: 'Tecnologías y Plataformas',
        subtitle: 'Stack de BI que dominamos y recomendamos'
      },
      cta: {
        title: '¿Listo para visualizar tus datos?',
        description: 'Agenda una demo gratuita donde te mostramos cómo transformar tus datos en dashboards accionables en menos de 4 semanas.',
        button: 'Agendar demo gratuita'
      },
      relatedServices: {
        title: 'Servicios Relacionados',
        subtitle: 'Complementa tus dashboards con estos servicios'
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
        subtitle: 'Expertise en ML aplicado a casos de uso de negocio'
      },
      useCases: {
        title: 'Casos de Éxito'
      },
      techStack: {
        title: 'Tecnologías y Frameworks',
        subtitle: 'Stack de ML y data science que dominamos'
      },
      cta: {
        title: '¿Listo para predecir el futuro de tu negocio?',
        description: 'Agenda una sesión de discovery gratuita. Identificaremos casos de uso de ML con alto ROI para tu industria y negocio.',
        button: 'Agendar discovery session'
      },
      relatedServices: {
        title: 'Servicios Relacionados',
        subtitle: 'Complementa tus modelos con infraestructura robusta'
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
        subtitle: 'Framework completo de Data Governance basado en DAMA-DMBOK'
      },
      useCases: {
        title: 'Casos de Éxito'
      },
      techStack: {
        title: 'Tecnologías y Frameworks',
        subtitle: 'Stack de herramientas de Data Governance'
      },
      cta: {
        title: '¿Listo para gobernar tus datos?',
        description: 'Comienza con un assessment gratuito de madurez de data governance. Identificaremos gaps y priorizaremos iniciativas de alto impacto.',
        button: 'Solicitar assessment gratuito'
      },
      relatedServices: {
        title: 'Servicios Relacionados',
        subtitle: 'Complementa tu programa de governance'
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
        subtitle: 'Expertise en arquitecturas modernas de datos (batch, streaming, real-time)'
      },
      useCases: {
        title: 'Casos de Éxito'
      },
      techStack: {
        title: 'Tecnologías y Frameworks',
        subtitle: 'Stack moderno de data engineering'
      },
      cta: {
        title: '¿Listo para modernizar tu infraestructura de datos?',
        description: 'Agenda una sesión de architecture review gratuita. Evaluaremos tu stack actual e identificaremos oportunidades de optimización.',
        button: 'Agendar architecture review'
      },
      relatedServices: {
        title: 'Servicios Relacionados',
        subtitle: 'Maximiza el valor de tu infraestructura de datos'
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
        subtitle: 'Expertise en IA aplicada a casos de uso de negocio reales'
      },
      useCases: {
        title: 'Casos de Éxito'
      },
      techStack: {
        title: 'Tecnologías y Frameworks',
        subtitle: 'Stack de IA y automatización que dominamos'
      },
      cta: {
        title: '¿Listo para automatizar con IA?',
        description: 'Agenda una sesión de ideación gratuita. Identificaremos procesos de tu empresa que pueden automatizarse con agentes inteligentes.',
        button: 'Agendar sesión de ideación'
      },
      relatedServices: {
        title: 'Servicios Relacionados',
        subtitle: 'Potencia tus agentes con datos y analytics'
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
      title: 'We Transform Data into Intelligent Decisions',
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
      subtitle: 'Specific use cases tailored to your business needs'
    },
    infrastructure: {
      title: 'Our Infrastructure: The Engine Behind Data',
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
      title: "Doesn't your challenge fit into these categories?",
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
          role: 'Partner - Seminarium'
        },
        {
          quote: '"The predictive churn models allowed us to retain 10% more customers. Incredible ROI in the first quarter."',
          role: 'Co-Founder and Operations Manager - MyHotel'
        },
        {
          quote: '"Real-time dashboards have revolutionized how we make decisions. Now we have complete visibility of all our operations."',
          role: 'Director - ClouHR'
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
        subtitle: 'Proven methodologies in startups, scale-ups and Fortune 500'
      },
      useCases: {
        title: 'Success Stories'
      },
      techStack: {
        title: 'Technologies and Frameworks',
        subtitle: 'Technology stack we recommend and master'
      },
      cta: {
        title: 'Ready to design your data strategy?',
        description: 'Schedule a free consultation session (30 min) to discuss your data challenges and how we can help you.',
        button: 'Schedule free consultation'
      },
      relatedServices: {
        title: 'Related Services',
        subtitle: 'Complement your strategy with these services'
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
        subtitle: 'Expertise in leading BI platforms on the market'
      },
      useCases: {
        title: 'Success Stories'
      },
      techStack: {
        title: 'Technologies and Platforms',
        subtitle: 'BI stack we master and recommend'
      },
      cta: {
        title: 'Ready to visualize your data?',
        description: 'Schedule a free demo where we show you how to transform your data into actionable dashboards in less than 4 weeks.',
        button: 'Schedule free demo'
      },
      relatedServices: {
        title: 'Related Services',
        subtitle: 'Complement your dashboards with these services'
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
        subtitle: 'Expertise in ML applied to business use cases'
      },
      useCases: {
        title: 'Success Stories'
      },
      techStack: {
        title: 'Technologies and Frameworks',
        subtitle: 'ML and data science stack we master'
      },
      cta: {
        title: 'Ready to predict your business future?',
        description: 'Schedule a free discovery session. We will identify ML use cases with high ROI for your industry and business.',
        button: 'Schedule discovery session'
      },
      relatedServices: {
        title: 'Related Services',
        subtitle: 'Complement your models with robust infrastructure'
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
        subtitle: 'Complete Data Governance framework based on DAMA-DMBOK'
      },
      useCases: {
        title: 'Success Stories'
      },
      techStack: {
        title: 'Technologies and Frameworks',
        subtitle: 'Data Governance tools stack'
      },
      cta: {
        title: 'Ready to govern your data?',
        description: 'Start with a free data governance maturity assessment. We will identify gaps and prioritize high-impact initiatives.',
        button: 'Request free assessment'
      },
      relatedServices: {
        title: 'Related Services',
        subtitle: 'Complement your governance program'
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
        subtitle: 'Expertise in modern data architectures (batch, streaming, real-time)'
      },
      useCases: {
        title: 'Success Stories'
      },
      techStack: {
        title: 'Technologies and Frameworks',
        subtitle: 'Modern data engineering stack'
      },
      cta: {
        title: 'Ready to modernize your data infrastructure?',
        description: 'Schedule a free architecture review session. We will evaluate your current stack and identify optimization opportunities.',
        button: 'Schedule architecture review'
      },
      relatedServices: {
        title: 'Related Services',
        subtitle: 'Maximize the value of your data infrastructure'
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
        subtitle: 'Expertise in AI applied to real business use cases'
      },
      useCases: {
        title: 'Success Stories'
      },
      techStack: {
        title: 'Technologies and Frameworks',
        subtitle: 'AI and automation stack we master'
      },
      cta: {
        title: 'Ready to automate with AI?',
        description: 'Schedule a free ideation session. We will identify processes in your company that can be automated with intelligent agents.',
        button: 'Schedule ideation session'
      },
      relatedServices: {
        title: 'Related Services',
        subtitle: 'Power your agents with data and analytics'
      }
    }
  }
};

// Current language state
let currentLanguage = localStorage.getItem('language') || 'es';

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

  // Update language button flag
  const languageButton = document.getElementById('languageToggle');
  if (languageButton) {
    const flagIcon = languageButton.querySelector('.flag-icon');

    if (flagIcon) {
      // Change flag based on language (show opposite language)
      flagIcon.textContent = currentLanguage === 'es' ? 'EN' : 'ES';
    }
  }

  // Update HTML lang attribute
  document.documentElement.lang = currentLanguage;

  // Save preference
  localStorage.setItem('language', currentLanguage);

  console.log('Language update complete');
}

/**
 * Toggle between languages
 */
function toggleLanguage() {
  console.log('Toggle language clicked! Current:', currentLanguage);
  currentLanguage = currentLanguage === 'es' ? 'en' : 'es';
  console.log('New language:', currentLanguage);
  updatePageLanguage();
}

/**
 * Initialize language system
 */
function initLanguageSystem() {
  console.log('Initializing language system...');

  // Set initial language
  updatePageLanguage();

  // Add click handler to language toggle button
  const languageToggle = document.getElementById('languageToggle');
  console.log('Language toggle button found:', languageToggle);

  if (languageToggle) {
    languageToggle.addEventListener('click', toggleLanguage);
    console.log('Click event listener added to language toggle');
  } else {
    console.error('Language toggle button NOT found!');
  }

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
