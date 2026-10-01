# Proyecto y local / Project and venue

ES: Opciones → Proyecto y local → Conectar con AdmiraNext usa la identidad central y muestra sólo los proyectos comerciales y locales autorizados. El catálogo y las asociaciones viven en D1 de AdmiraNext; admira.app y XpaceOS son clientes. Sin conexión hay tres demos públicas claramente identificadas. Un proyecto autorizado sin local asociado no abre un gemelo inventado. Si hay varios locales, elige uno antes de abrirlo. Gestión central: https://www.admiranext.com/xpace/manage; permisos: https://www.admiranext.com/usuarios. El acceso de lectura dura 10 minutos en esta pestaña; al caducar o revocarse pide reconectar. Calidad, idioma y distribución siguen siendo locales. No concede escritura MCP ni control de dispositivos físicos.

EN: Options → Project and venue → Connect with AdmiraNext uses central identity and shows only permitted commercial projects and venues. The registry and associations live in AdmiraNext D1; admira.app and XpaceOS are clients. Without a connection, three clearly identified public demos are available. A permitted project with no associated venue never opens an invented twin. Choose a venue first when several are available. Central management: https://www.admiranext.com/xpace/manage; permissions: https://www.admiranext.com/usuarios. Read access lasts 10 minutes in this tab; expiry or revocation requires reconnection. Quality, language and layout remain local. It grants no MCP writes or physical device control.

## Tutorial ES / EN

1. Abre Opciones → Proyecto y local / Open Options → Project and venue.
2. Pulsa Conectar con AdmiraNext y usa tu cuenta Google existente / Click Connect with AdmiraNext and use your existing Google account.
3. Escoge proyecto y local autorizados / Choose a permitted project and venue.
4. Elige Calidad del Xpacio aparte / Choose Xpace quality separately.
5. Un administrador crea asociaciones en Gestión central y concede commercial:ID en Usuarios / An admin creates central associations and grants commercial:ID in Users.
6. Para un invitado, marca la app XpaceOS, su proyecto comercial y la caducidad / For a guest, select the XpaceOS app, commercial project and expiry.

## Contrato compartido / Shared contract

```json
{
  "api": "https://www.admiranext.com/api/xpace/context",
  "public_demos": "https://www.admiranext.com/api/xpace/demos",
  "management": "https://www.admiranext.com/xpace/manage",
  "permissions": "https://www.admiranext.com/usuarios",
  "backoffice": "https://www.admira.app/backoffice",
  "schema": 1,
  "acl_root": "commercial-projects",
  "acl_project": "commercial:<canonical project id>",
  "project_parameter": "project",
  "circuit_parameter": "circuit",
  "venue_parameter": "venue",
  "rendering_location_parameter": "loc",
  "token": "opaque, read only, client-origin bound, 10 min, sessionStorage; never URL/localStorage",
  "login_exchange": "single-use proof of possession; verifier sent only by POST; survives Google redirect losing opener",
  "central_cookie": "unchanged __Host-an_session, HttpOnly Secure SameSite=Strict",
  "commercial_projects": 20,
  "explicit_venues": [
    "alsea-sbux-021"
  ],
  "authorization": "current D1 status, account expiry, session_version, project permissions each request; guest/partner also requires xpaceos app",
  "pending": "Other venue associations must be explicitly registered by an admin; legacy map/catalog publication and its existing login are not migrated; existing MCP/hardware permissions unchanged",
  "es": "Opciones → Proyecto y local → Conectar con AdmiraNext usa la identidad central y muestra sólo los proyectos comerciales y locales autorizados. El catálogo y las asociaciones viven en D1 de AdmiraNext; admira.app y XpaceOS son clientes. Sin conexión hay tres demos públicas claramente identificadas. Un proyecto autorizado sin local asociado no abre un gemelo inventado. Si hay varios locales, elige uno antes de abrirlo. Gestión central: https://www.admiranext.com/xpace/manage; permisos: https://www.admiranext.com/usuarios. El acceso de lectura dura 10 minutos en esta pestaña; al caducar o revocarse pide reconectar. Calidad, idioma y distribución siguen siendo locales. No concede escritura MCP ni control de dispositivos físicos.",
  "en": "Options → Project and venue → Connect with AdmiraNext uses central identity and shows only permitted commercial projects and venues. The registry and associations live in AdmiraNext D1; admira.app and XpaceOS are clients. Without a connection, three clearly identified public demos are available. A permitted project with no associated venue never opens an invented twin. Choose a venue first when several are available. Central management: https://www.admiranext.com/xpace/manage; permissions: https://www.admiranext.com/usuarios. Read access lasts 10 minutes in this tab; expiry or revocation requires reconnection. Quality, language and layout remain local. It grants no MCP writes or physical device control."
}
```

El snapshot project-catalog.json sólo documenta la migración inicial del backoffice; no se consulta para decidir acceso. Publicar los assets del simulador no convierte esos assets públicos en datos privados: este permiso protege la consulta del registro y los locales autorizados. / project-catalog.json documents the initial migration only; it is never consulted for authorization. Public simulation assets remain public: this grant protects registry/venue queries.
