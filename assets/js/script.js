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
        entry.target.classList.add('fade-in-up');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // Observe elements
  const animatedElements = document.querySelectorAll(
    '.service-card, .solution-card, .team-member, .testimonial-card, .client-logo'
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
  initContactForm();
  initScrollAnimations();
  initCTAActions();
  initActiveLinkHighlight();
  initLazyLoading();

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
// Export for external use (if needed)
// ========================================
window.DataPulse = {
  loadConfig,
  loadClients,
  loadTestimonials,
  init,
  toggleAlliances
};
