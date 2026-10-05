# Cuenta Admira y sesión / Admira account and session

## Español

Acceso con la cuenta Google de Admira: al abrir el Xpacio como aplicación se verifica tu identidad antes de generar imágenes o locuciones. La sesión humana se conserva durante 30 días de uso en este navegador y se renueva al volver, sin una contraseña propia de XpaceOS. Google reutiliza la cuenta conectada cuando puede; el primer acceso o una sesión Google cerrada pueden requerir elegir la cuenta o autenticarse en Google. Los permisos de AdmiraNeXT siguen activos y revocables. Imagen y Locuciones muestran Sesión activa cuando la sesión está verificada. Cerrar sesión impide la reconexión automática inmediata. No se almacenan claves en el navegador. Por ahora, la entrada interactiva de xpaceos.com abre admira.store conservando ruta, Xpacio, idioma y parámetros; los reproductores incrustados conservan su acceso público. La migración del DNS de GoDaddy a Cloudflare Pages sigue pendiente.

## English

Access with your Admira Google account: opening the Xpace as an application verifies your identity before image or announcement generation. Human sessions are retained for 30 days of use in this browser and renewed on return, without a separate XpaceOS password. Google reuses a connected account when available; the first visit or a signed-out Google session may require choosing an account or authenticating with Google. AdmiraNeXT permissions remain enforced and revocable. Image and Public Announcement System show Session active when access is verified. Signing out prevents immediate automatic reconnection. No keys are stored in the browser. For now, interactive xpaceos.com entry opens admira.store while retaining the route, Xpace, language and parameters; embedded players retain public access. GoDaddy DNS migration to Cloudflare Pages remains pending.

## Contrato / Contract

- Human Google login uses the existing RS256 credential verification, nonce, audience and site permission. The domain hint admira.com is a picker hint, never proof of identity or an authorization bypass. Existing authorized exceptions remain supported.
- Human signed host-only cookies last 2592000 seconds (30 days); checked use after 43200 seconds (12 hours) renews the session. Existing 24-hour human cookies migrate on checked use before expiry. Agent sessions remain fixed at 86400 seconds, with token fingerprint revocation.
- GET /auth/session verifies the existing signed session and site permissions, returns a no-store response and renews a valid human cookie when due. It returns 401 for absent, invalid, revoked or expired sessions. No password form or provider credentials are added.
- Top-level Sec-Fetch-Dest: document entry to /admira-xp, /admira-xp/ and /admira-xp/index.html enters the existing login. Embedded players and public assets/docs keep their existing contract. Both paid generation endpoints continue to require session and same-origin POST.
- session-access.js routes only top-level www.xpaceos.com/xpaceos.com application entry to the working admira.store application, preserving path, query and hash. It does not transfer cookies or credentials across domains. No DNS records are modified; migration of www.xpaceos.com (GoDaddy CNAME xpaceos.pages.dev) remains pending.
- Google login offers One Tap automatic account selection only when supported and consented. Explicit logout redirects to /auth/login?signed_out=1 with auto selection disabled; failed login also suppresses it. Google may require first-time consent, account selection or renewed authentication. The application cannot promise bypassing Google's authentication.
- Image and announcement notes reflect checked session state. Session failure preserves the advertising/announcement draft through the existing login-return flow.

Tracking: FLT-101630 · sesión Google persistente para generar imágenes.
Stable guide: https://www.admira.store/admira-xp/docs/session-access.md
Google reference: https://developers.google.com/identity/gsi/web/guides/automatic-sign-in-sign-out
