# Manual SEO y Analytics para Desarrolladores
**Última actualización**: 2026-01-03  
**Versión**: 2.0

---

## 📚 Tabla de Contenidos
1. [Tags esenciales](#tags-esenciales)
2. [Google Tag Manager (GTM)](#google-tag-manager)
3. [Google Analytics 4 (GA4)](#google-analytics-4)
4. [GA4 Event Tracking](#ga4-event-tracking)
5. [SEO técnico](#seo-técnico)
6. [Checklist de optimización](#checklist)
7. [Herramientas útiles](#herramientas)

---

## 🏷️ Tags Esenciales

### 1. Meta Tags Básicos
```html
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    
    <!-- Título: 50-60 caracteres -->
    <title>Título Descriptivo | Marca</title>
    
    <!-- Descripción: 120-160 caracteres -->
    <meta name="description" content="Descripción concisa que incluya beneficio principal y call-to-action.">
    
    <!-- Keywords (opcional, poco peso SEO pero útil para organización) -->
    <meta name="keywords" content="keyword1, keyword2, keyword3">
</head>
```

**✅ Reglas de Oro:**
- **Título**: 50-60 caracteres máximo
- **Description**: 120-160 caracteres óptimo
- **Incluir beneficio clave** en los primeros 80 caracteres
- **No duplicar** títulos entre páginas

---

### 2. Canonical URL
**¿Por qué?** Evita contenido duplicado en Google.

```html
<!-- Reemplaza 'pagina.html' con el nombre real -->
<link rel="canonical" href="https://ifluently.space/pagina.html">
```

**⚠️ Importante:** 
- Debe coincidir EXACTAMENTE con la URL de producción
- Sin `/` final
- Usar HTTPS siempre

---

### 3. Open Graph Tags (Facebook/LinkedIn)
```html
<!-- Open Graph / Facebook -->
<meta property="og:type" content="website">
<meta property="og:url" content="https://ifluently.space/pagina.html">
<meta property="og:title" content="Título Atractivo para Redes Sociales">
<meta property="og:description" content="Descripción optimizada para compartir en redes (hasta 200 caracteres).">
<meta property="og:image" content="https://ifluently.space/og-imagen.jpg">
```

**✅ Buenas Prácticas:**
- Imagen OG: **1200x630px** (ratio 1.91:1)
- Usar URLs absolutas (no relativas)
- Título puede ser diferente al `<title>` (más llamativo)

---

### 4. Twitter Card Tags
```html
<!-- Twitter -->
<meta property="twitter:card" content="summary_large_image">
<meta property="twitter:url" content="https://ifluently.space/pagina.html">
<meta property="twitter:title" content="Título para Twitter">
<meta property="twitter:description" content="Descripción concisa.">
<meta property="twitter:image" content="https://ifluently.space/og-imagen.jpg">
```

---

### 5. Schema.org (Structured Data)
```html
<!-- Schema para SaaS -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Nombre del Producto",
  "applicationCategory": "BusinessApplication",
  "offers": {
    "@type": "AggregateOffer",
    "lowPrice": "149",
    "highPrice": "599",
    "priceCurrency": "USD"
  },
  "description": "Descripción del producto",
  "operatingSystem": "Web-based"
}
</script>
```

---

## 📦 Google Tag Manager (GTM)

### Instalación en TODAS las páginas

**1. En el `<head>` (ANTES de cualquier otro script):**
```html
<head>
    <!-- Google Tag Manager -->
    <script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
    new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
    j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
    'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
    })(window,document,'script','dataLayer','GTM-WDCLWK4P');</script>
    <!-- End Google Tag Manager -->
</head>
```

**2. En el `<body>` (INMEDIATAMENTE después de la apertura):**
```html
<body>
    <!-- Google Tag Manager (noscript) -->
    <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-WDCLWK4P"
    height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
    <!-- End Google Tag Manager (noscript) -->
</body>
```

**✅ Container ID actual:** `GTM-WDCLWK4P`

---

## 📊 Google Analytics 4 (GA4)

### Instalación Básica

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-ND9PT413XV"></script>
<script>
    window.dataLayer = window.dataLayer || [];
    function gtag() { dataLayer.push(arguments); }
    gtag('js', new Date());
    gtag('config', 'G-ND9PT413XV');
</script>
```

**✅ Property ID actual:** `G-ND9PT413XV`

---

## 🎯 GA4 Event Tracking

### 1. Button Click Tracking

**Ejemplo: Tracking de CTA buttons**
```html
<button onclick="trackButtonClick('Get Started', 'Hero CTA')" class="btn-primary">
    Get Started
</button>

<script>
function trackButtonClick(buttonText, location) {
    gtag('event', 'button_click', {
        'button_text': buttonText,
        'button_location': location,
        'event_category': 'engagement',
        'event_label': buttonText
    });
}
</script>
```

**Uso:**
```html
<!-- Hero CTA -->
<button onclick="trackButtonClick('Start Free Trial', 'Hero Section')">
    Start Free Trial
</button>

<!-- Pricing Button -->
<button onclick="trackButtonClick('Choose Pro Plan', 'Pricing Section')">
    Choose Pro Plan
</button>

<!-- Footer CTA -->
<a href="/contact" onclick="trackButtonClick('Contact Sales', 'Footer')">
    Contact Sales
</a>
```

---

### 2. Form Submission Tracking

**Ejemplo: Tracking de formularios**
```html
<form id="contactForm" onsubmit="return trackFormSubmit(event, 'Contact Form')">
    <input type="email" name="email" required>
    <button type="submit">Submit</button>
</form>

<script>
function trackFormSubmit(event, formName) {
    gtag('event', 'form_submit', {
        'form_name': formName,
        'event_category': 'conversion',
        'event_label': formName
    });
    
    // Importante: retornar true para que el form se envíe
    return true;
}
</script>
```

**Variante para formularios AJAX:**
```javascript
// Cuando el form se envía exitosamente
function onFormSuccess(formName) {
    gtag('event', 'generate_lead', {
        'form_name': formName,
        'value': 10, // Valor estimado del lead
        'currency': 'USD',
        'event_category': 'conversion'
    });
}
```

---

### 3. Scroll Depth Tracking

**Auto-tracking de scroll depth (25%, 50%, 75%, 100%)**
```html
<script>
// Scroll depth tracking
let scrollTracked = {
    '25': false,
    '50': false,
    '75': false,
    '100': false
};

window.addEventListener('scroll', function() {
    const scrollPercentage = Math.round(
        (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
    );
    
    // Track at 25%, 50%, 75%, 100%
    ['25', '50', '75', '100'].forEach(threshold => {
        if (scrollPercentage >= parseInt(threshold) && !scrollTracked[threshold]) {
            scrollTracked[threshold] = true;
            
            gtag('event', 'scroll_depth', {
                'percent_scrolled': threshold,
                'event_category': 'engagement',
                'event_label': threshold + '% scrolled'
            });
        }
    });
});
</script>
```

---

### 4. Link Click Tracking (Outbound Links)

**Tracking de clicks en links externos**
```html
<script>
// Auto-track todos los links externos
document.addEventListener('click', function(event) {
    const link = event.target.closest('a');
    
    if (link && link.href) {
        const isExternal = link.hostname !== window.location.hostname;
        
        if (isExternal) {
            gtag('event', 'click', {
                'event_category': 'outbound',
                'event_label': link.href,
                'transport_type': 'beacon'
            });
        }
    }
});
</script>
```

---

### 5. E-commerce Events (Conversiones)

**Ejemplo: Inicio de checkout**
```html
<button onclick="trackCheckout('Pro Plan', 299)">
    Subscribe to Pro - $299/mo
</button>

<script>
function trackCheckout(productName, price) {
    gtag('event', 'begin_checkout', {
        'currency': 'USD',
        'value': price,
        'items': [{
            'item_name': productName,
            'item_category': 'Subscription',
            'price': price,
            'quantity': 1
        }],
        'event_category': 'ecommerce'
    });
}
</script>
```

**Ejemplo: Conversión completada**
```javascript
function trackPurchase(orderId, productName, price) {
    gtag('event', 'purchase', {
        'transaction_id': orderId,
        'value': price,
        'currency': 'USD',
        'items': [{
            'item_name': productName,
            'item_category': 'Subscription',
            'price': price,
            'quantity': 1
        }]
    });
}
```

---

### 6. Video Play Tracking

**Tracking de videos (YouTube, Vimeo, etc.)**
```html
<video id="demo-video" src="/demo.mp4"></video>

<script>
const video = document.getElementById('demo-video');

// Video started
video.addEventListener('play', function() {
    gtag('event', 'video_start', {
        'video_title': 'Product Demo',
        'event_category': 'engagement'
    });
});

// Video completed
video.addEventListener('ended', function() {
    gtag('event', 'video_complete', {
        'video_title': 'Product Demo',
        'event_category': 'engagement'
    });
});

// 50% watched
video.addEventListener('timeupdate', function() {
    const percent = (video.currentTime / video.duration) * 100;
    if (percent >= 50 && !video.dataset.tracked50) {
        video.dataset.tracked50 = 'true';
        gtag('event', 'video_progress', {
            'video_title': 'Product Demo',
            'percent_watched': 50,
            'event_category': 'engagement'
        });
    }
});
</script>
```

---

### 7. Custom Events (Eventos Personalizados)

**Ejemplo 1: Pricing view**
```javascript
// Cuando el usuario llega a la sección de pricing
function trackPricingView() {
    gtag('event', 'view_pricing', {
        'event_category': 'conversion',
        'event_label': 'Pricing Section Viewed'
    });
}

// Usar con Intersection Observer
const pricingSection = document.getElementById('pricing');
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            trackPricingView();
            observer.unobserve(entry.target); // Solo trackear una vez
        }
    });
});
observer.observe(pricingSection);
```

**Ejemplo 2: Feature interaction**
```html
<button onclick="trackFeatureClick('AI Voice Answering')">
    Learn More
</button>

<script>
function trackFeatureClick(featureName) {
    gtag('event', 'feature_interaction', {
        'feature_name': featureName,
        'event_category': 'engagement',
        'event_label': featureName
    });
}
</script>
```

---

### 8. User Engagement Tracking

**Time on page**
```javascript
let pageStartTime = Date.now();

window.addEventListener('beforeunload', function() {
    const timeSpent = Math.round((Date.now() - pageStartTime) / 1000); // en segundos
    
    gtag('event', 'time_on_page', {
        'page_path': window.location.pathname,
        'time_seconds': timeSpent,
        'event_category': 'engagement'
    });
});
```

---

### 9. Error Tracking

**Tracking de errores JavaScript**
```javascript
window.addEventListener('error', function(event) {
    gtag('event', 'exception', {
        'description': event.message,
        'fatal': false,
        'file': event.filename,
        'line': event.lineno
    });
});
```

---

### 10. Search Tracking (si tienes búsqueda)

```javascript
function trackSearch(searchTerm, resultsCount) {
    gtag('event', 'search', {
        'search_term': searchTerm,
        'results_count': resultsCount,
        'event_category': 'engagement'
    });
}

// Ejemplo de uso
const searchInput = document.getElementById('search');
searchInput.addEventListener('submit', function(e) {
    e.preventDefault();
    const term = searchInput.value;
    const results = performSearch(term); // Tu función de búsqueda
    trackSearch(term, results.length);
});
```

---

## 📋 Template Completo con Tracking

```html
<!DOCTYPE html>
<html lang="es">
<head>
    <!-- Google Tag Manager -->
    <script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
    new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
    j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
    'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
    })(window,document,'script','dataLayer','GTM-WDCLWK4P');</script>
    <!-- End Google Tag Manager -->
    
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    
    <title>Título SEO Optimizado | Marca</title>
    <meta name="description" content="Descripción 120-160 caracteres.">
    <link rel="canonical" href="https://ifluently.space/pagina.html">
    
    <!-- Google Analytics -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-ND9PT413XV"></script>
    <script>
        window.dataLayer = window.dataLayer || [];
        function gtag() { dataLayer.push(arguments); }
        gtag('js', new Date());
        gtag('config', 'G-ND9PT413XV');
        
        // === TRACKING FUNCTIONS ===
        
        // Button clicks
        function trackButtonClick(buttonText, location) {
            gtag('event', 'button_click', {
                'button_text': buttonText,
                'button_location': location,
                'event_category': 'engagement'
            });
        }
        
        // Form submissions
        function trackFormSubmit(event, formName) {
            gtag('event', 'form_submit', {
                'form_name': formName,
                'event_category': 'conversion'
            });
            return true;
        }
        
        // Scroll depth
        let scrollTracked = {'25': false, '50': false, '75': false, '100': false};
        window.addEventListener('scroll', function() {
            const scrollPercentage = Math.round(
                (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
            );
            
            ['25', '50', '75', '100'].forEach(threshold => {
                if (scrollPercentage >= parseInt(threshold) && !scrollTracked[threshold]) {
                    scrollTracked[threshold] = true;
                    gtag('event', 'scroll_depth', {
                        'percent_scrolled': threshold,
                        'event_category': 'engagement'
                    });
                }
            });
        });
        
        // Outbound links
        document.addEventListener('click', function(event) {
            const link = event.target.closest('a');
            if (link && link.href && link.hostname !== window.location.hostname) {
                gtag('event', 'click', {
                    'event_category': 'outbound',
                    'event_label': link.href
                });
            }
        });
    </script>
</head>

<body>
    <!-- Google Tag Manager (noscript) -->
    <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-WDCLWK4P"
    height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
    <!-- End Google Tag Manager (noscript) -->
    
    <!-- Example: Tracked button -->
    <button onclick="trackButtonClick('Get Started', 'Hero Section')" class="btn-primary">
        Get Started
    </button>
    
    <!-- Example: Tracked form -->
    <form onsubmit="return trackFormSubmit(event, 'Waitlist Signup')">
        <input type="email" required>
        <button type="submit">Join Waitlist</button>
    </form>
</body>
</html>
```

---

## 🔧 SEO Técnico

### 1. Headings Structure
```html
<!-- ✅ BUENO: Jerarquía correcta -->
<h1>Título Principal de la Página</h1>
<h2>Sección 1</h2>
<h3>Subsección 1.1</h3>
<h2>Sección 2</h2>
```

**Reglas:**
- **1 solo H1** por página
- H2 para secciones principales
- H3 para subsecciones
- No saltarse niveles

---

### 2. Imágenes SEO
```html
<img 
    src="/imagen.jpg" 
    alt="Descripción específica"
    width="1200"
    height="630"
    loading="lazy"
    decoding="async"
>
```

---

## ✅ Checklist de Optimización

### Al crear una nueva página:

#### 1. Meta Tags (5 min)
- [ ] `<title>` optimizado (50-60 chars)
- [ ] `<meta name="description">` (120-160 chars)
- [ ] `<link rel="canonical">` correcto
- [ ] Open Graph + Twitter tags

#### 2. Tracking (3 min)
- [ ] GTM instalado (head + body)
- [ ] GA4 configurado
- [ ] Funciones de tracking incluidas

#### 3. Events (10 min)
- [ ] Button clicks trackeados
- [ ] Form submissions trackeados
- [ ] Scroll depth habilitado
- [ ] Custom events relevantes

#### 4. Technical SEO (5 min)
- [ ] H1 único
- [ ] Imágenes con alt text
- [ ] Schema.org si aplica
- [ ] Mobile responsive

**⏱️ Tiempo total:** ~25 minutos por página

---

## 🛠️ Herramientas Útiles

### Testing
- **Meta Tags**: https://metatags.io/
- **GA4 DebugView**: Google Analytics → Admin → DebugView
- **GTM Preview**: https://tagmanager.google.com/ → Preview
- **PageSpeed**: https://pagespeed.web.dev/

### Management
- **GTM**: https://tagmanager.google.com/
- **GA4**: https://analytics.google.com/
- **GSC**: https://search.google.com/search-console

---

## 📞 Soporte

**Dudas sobre tracking?**
- Revisar ejemplos en este manual
- Testing en GTM Preview mode
- Verificar en GA4 Realtime

**IDs importantes:**
- GTM Container: `GTM-WDCLWK4P`
- GA4 Property: `G-ND9PT413XV`

---

**Última actualización**: 2026-01-03  
**Versión**: 2.0 (con GA4 tracking completo)
