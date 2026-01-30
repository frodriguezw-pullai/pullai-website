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
      clients: 'Clientes',
      contact: 'Contacto'
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
      subtitle: 'Para activar soluciones de alto impacto, desplegamos agentes de datos y arquitecturas robustas que garantizan la integridad y el flujo de la información de extremo a extremo:'
    },
    boutique: {
      title: '¿Su desafío no encaja en estas categorías?',
      description: 'Somos una consultoría boutique. No creemos en soluciones enlatadas. Construimos arquitecturas de analítica <strong>100% ad-hoc</strong> para resolver problemas específicos que requieren un enfoque creativo y técnico desde cero.',
      cta: 'Agendar Consultoría de Diagnóstico'
    },
    clients: {
      title: 'Clientes que Confían en Nosotros',
      subtitle: 'Trabajamos con empresas líderes en diversas industrias',
      testimonialsTitle: 'Lo que Dicen Nuestros Clientes'
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
    languageButton: 'English'
  },
  en: {
    nav: {
      services: 'Services',
      solutions: 'Solutions',
      clients: 'Clients',
      contact: 'Contact'
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
      subtitle: 'To activate high-impact solutions, we deploy data agents and robust architectures that ensure the integrity and flow of information end-to-end:'
    },
    boutique: {
      title: "Doesn't your challenge fit into these categories?",
      description: 'We are a boutique consultancy. We don\'t believe in canned solutions. We build <strong>100% ad-hoc</strong> analytics architectures to solve specific problems that require a creative and technical approach from scratch.',
      cta: 'Schedule Diagnostic Consultation'
    },
    clients: {
      title: 'Clients Who Trust Us',
      subtitle: 'We work with leading companies across various industries',
      testimonialsTitle: 'What Our Clients Say'
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
    languageButton: 'Español'
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

  // Update language button text and flag
  const languageButton = document.getElementById('languageToggle');
  if (languageButton) {
    const buttonText = languageButton.querySelector('.language-text');
    const flagIcon = languageButton.querySelector('.flag-icon');

    if (buttonText) {
      buttonText.textContent = translations[currentLanguage].languageButton;
    }

    if (flagIcon) {
      // Change flag based on language
      flagIcon.textContent = currentLanguage === 'es' ? '🇬🇧' : '🇪🇸';
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
