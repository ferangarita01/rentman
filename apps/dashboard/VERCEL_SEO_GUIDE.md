# Vercel Deployment & SEO Guide

## 📂 Estructura de Archivos Públicos

Las siguientes páginas HTML están disponibles públicamente:

### Páginas Activas

1. **`/delete-account`** (antes `/delete-account.html`)
   - URL limpia sin .html
   - SEO: `noindex, nofollow` (correcto para páginas de utilidad)
   - Propósito: Solicitud de eliminación de cuenta (GDPR compliant)

2. **`/rentman`** (antes `/rentman.html`)
   - URL limpia sin .html
   - SEO: Optimizado con keywords, OG tags, Schema.org
   - Propósito: Variante B para pruebas A/B
   - Tracking: Eventos GA4 con tag `ab_variant: variant_b`

3. **`/privacy-policy`**
   - Política de privacidad

4. **`/terms-and-conditions`**
   - Términos y condiciones

---

## 🔄 Configuración A/B Testing

### Método 1: Router Automático (Recomendado)

Usa `/ab-router.html` para distribuir tráfico automáticamente:

**En `vercel.json`**, configura:
```json
{
    "rewrites": [
        {
            "source": "/",
            "destination": "/ab-router.html"
        }
    ]
}
```

Esto distribuirá tráfico:
- 50% → `/index.html` (Variante A - Original)
- 50% → `/rentman` (Variante B - Test)

**Configuración del test** en `ab-router.html`:
```javascript
const AB_TEST_CONFIG = {
    variantA: '/index.html',
    variantB: '/rentman',
    splitPercentage: 50,  // Ajusta aquí el % para cada variante
    enabled: true         // Cambiar a false para desactivar A/B test
};
```

### Método 2: Manual (Testing Directo)

Si prefieres control manual, mantén `vercel.json` como está y:

- **Tráfico normal**: `https://rentman.space/` → `/index.html` (SPA React)
- **Variante de prueba**: `https://rentman.space/rentman` → `/rentman.html`

Puedes enviar tráfico específico a `/rentman` vía:
- Campañas de ads
- Links en redes sociales
- QR codes
- Email marketing

---

## 📊 Análisis de Resultados A/B

### En Google Analytics 4:

1. **Ver distribución de variantes**:
   ```
   Events > ab_test_assigned
   Event parameters > variant (A o B)
   ```

2. **Comparar conversiones**:
   ```
   Events > form_submit
   Secondary dimension > ab_variant
   ```

3. **Comparar engagement**:
   ```
   Events > button_click
   Filter by ab_variant
   ```

### Métricas Clave:
- **Bounce rate** por variante
- **Form submissions** (conversiones)
- **Time on page**
- **Scroll depth**

---

## ✅ SEO Checklist

### Delete Account Page (`/delete-account`)
- ✅ `noindex, nofollow` (correcto - no debe indexarse)
- ✅ Meta description descriptiva
- ✅ Canonical URL
- ✅ Open Graph tags
- ✅ Favicon
- ✅ HTTPS headers (X-Robots-Tag en Vercel)

### Rentman Variant (`/rentman`)
- ✅ Title optimizado (70 caracteres)
- ✅ Meta description (160 caracteres)
- ✅ Keywords relevantes
- ✅ Open Graph completo (Facebook/LinkedIn)
- ✅ Twitter Cards
- ✅ Schema.org structured data
- ✅ Canonical URL
- ✅ Favicon
- ✅ Preconnect para performance
- ✅ GA4 tracking
- ✅ A/B test events

### Mejoras Recomendadas:

#### 1. Crear `robots.txt` (raíz del proyecto)
```txt
User-agent: *
Allow: /
Disallow: /delete-account

Sitemap: https://rentman.space/sitemap.xml
```

#### 2. Crear `sitemap.xml`
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://rentman.space/</loc>
    <lastmod>2026-02-07</lastmod>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://rentman.space/rentman</loc>
    <lastmod>2026-02-07</lastmod>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://rentman.space/privacy-policy</loc>
    <priority>0.3</priority>
  </url>
  <url>
    <loc>https://rentman.space/terms-and-conditions</loc>
    <priority>0.3</priority>
  </url>
</urlset>
```

#### 3. Imagen OG optimizada
Asegúrate de que `/og-image.jpg` existe con:
- Tamaño: 1200x630px (Facebook/LinkedIn)
- Formato: JPG optimizado (< 300KB)
- Contenido: Logo + tagline legible

---

## 🚀 Deployment en Vercel

### Configuración Actual (`vercel.json`)

```json
{
    "rewrites": [
        {
            "source": "/",
            "destination": "/index.html"
        }
    ],
    "redirects": [
        {
            "source": "/delete-account.html",
            "destination": "/delete-account",
            "permanent": true
        },
        {
            "source": "/rentman.html",
            "destination": "/rentman",
            "permanent": false
        }
    ],
    "headers": [
        {
            "source": "/delete-account",
            "headers": [
                {
                    "key": "X-Robots-Tag",
                    "value": "noindex, nofollow"
                }
            ]
        }
    ],
    "cleanUrls": true
}
```

### URLs Resultantes:

| Archivo | URL Pública | Indexable |
|---------|-------------|-----------|
| `public/delete-account.html` | `/delete-account` | ❌ No |
| `public/rentman.html` | `/rentman` | ✅ Sí |
| `public/privacy-policy.html` | `/privacy-policy` | ✅ Sí |
| `public/terms-and-conditions.html` | `/terms-and-conditions` | ✅ Sí |
| `dist/index.html` (React SPA) | `/` | ✅ Sí |

### Deploy

```bash
cd apps/dashboard

# Build production
npm run build

# Deploy to Vercel
vercel --prod

# O si usas Git integration, solo:
git push origin main
```

---

## 🔍 Validación SEO Post-Deploy

### 1. Verificar URLs limpias funcionan:
```bash
curl -I https://rentman.space/delete-account
curl -I https://rentman.space/rentman
```
Debe retornar `200 OK`

### 2. Verificar headers X-Robots-Tag:
```bash
curl -I https://rentman.space/delete-account | grep X-Robots-Tag
```
Debe mostrar: `X-Robots-Tag: noindex, nofollow`

### 3. Test en herramientas SEO:
- [Google Search Console](https://search.google.com/search-console)
- [PageSpeed Insights](https://pagespeed.web.dev/)
- [Meta Tags Checker](https://metatags.io/)
- [Schema.org Validator](https://validator.schema.org/)

### 4. Test de Open Graph:
- [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
- [Twitter Card Validator](https://cards-dev.twitter.com/validator)

---

## 📈 Monitoreo Continuo

### Google Analytics 4 - Eventos Personalizados

| Evento | Descripción | Parámetros |
|--------|-------------|------------|
| `ab_test_view` | Usuario ve una variante | `variant: 'rentman_variant_b'` |
| `ab_test_assigned` | Asignación inicial de variante | `variant: 'A' or 'B'` |
| `button_click` | Click en CTA | `ab_variant: 'variant_b'` |
| `form_submit` | Envío de formulario | `ab_variant: 'variant_b'` |
| `scroll_depth` | Profundidad de scroll | `percent_scrolled` |

### Dashboards Recomendados:

1. **A/B Test Performance**
   - Conversiones por variante
   - Engagement por variante
   - Tiempo en página

2. **SEO Health**
   - Páginas indexadas
   - Errores de rastreo
   - Core Web Vitals

---

## 🛠️ Troubleshooting

### Problema: `/rentman` retorna 404
**Fix**: Verificar que `cleanUrls: true` está en `vercel.json` y redeploy

### Problema: SEO tags no aparecen en redes sociales
**Fix**: 
1. Verificar que las URLs son absolutas (no relativas)
2. Forzar re-scrape en Facebook/Twitter debuggers
3. Verificar que `og-image.jpg` es accesible

### Problema: A/B test no distribuye tráfico
**Fix**: Verificar que `enabled: true` en `ab-router.html`

### Problema: Google Analytics no registra eventos
**Fix**: 
1. Verificar GA4 ID: `G-ZK58LRPVVS`
2. Abrir DevTools > Network > filtrar por `google-analytics`
3. Verificar que `gtag('event', ...)` se ejecuta

---

## 📞 Contacto y Soporte

Para más ayuda:
- Vercel Docs: https://vercel.com/docs
- Google Search Console: https://search.google.com/search-console
- GA4 Help: https://support.google.com/analytics
