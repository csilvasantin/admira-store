# Proyecto y local / Project and venue

ES: Opciones → Proyecto y local → Conectar con AdmiraNext usa la identidad central y muestra sólo los proyectos comerciales y locales autorizados. El catálogo y las asociaciones viven en D1 de AdmiraNext; admira.app y XpaceOS son clientes. Sin conexión hay cuatro proyectos de demostración públicos claramente identificados. Un proyecto autorizado sin local asociado no abre un gemelo inventado. Si hay varios locales, elige uno antes de abrirlo. Gestión central: https://www.admiranext.com/xpace/manage; permisos: https://www.admiranext.com/usuarios. El acceso de lectura dura 10 minutos en esta pestaña; al caducar o revocarse pide reconectar. Calidad, idioma y distribución siguen siendo locales. No concede escritura MCP ni control de dispositivos físicos.

EN: Options → Project and venue → Connect with AdmiraNext uses central identity and shows only permitted commercial projects and venues. The registry and associations live in AdmiraNext D1; admira.app and XpaceOS are clients. Without a connection, four clearly identified public demo projects are available. A permitted project with no associated venue never opens an invented twin. Choose a venue first when several are available. Central management: https://www.admiranext.com/xpace/manage; permissions: https://www.admiranext.com/usuarios. Read access lasts 10 minutes in this tab; expiry or revocation requires reconnection. Quality, language and layout remain local. It grants no MCP writes or physical device control.

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
  "es": "Opciones → Proyecto y local → Conectar con AdmiraNext usa la identidad central y muestra sólo los proyectos comerciales y locales autorizados. El catálogo y las asociaciones viven en D1 de AdmiraNext; admira.app y XpaceOS son clientes. Sin conexión hay cuatro proyectos de demostración públicos claramente identificados. Un proyecto autorizado sin local asociado no abre un gemelo inventado. Si hay varios locales, elige uno antes de abrirlo. Gestión central: https://www.admiranext.com/xpace/manage; permisos: https://www.admiranext.com/usuarios. El acceso de lectura dura 10 minutos en esta pestaña; al caducar o revocarse pide reconectar. Calidad, idioma y distribución siguen siendo locales. No concede escritura MCP ni control de dispositivos físicos.",
  "en": "Options → Project and venue → Connect with AdmiraNext uses central identity and shows only permitted commercial projects and venues. The registry and associations live in AdmiraNext D1; admira.app and XpaceOS are clients. Without a connection, four clearly identified public demo projects are available. A permitted project with no associated venue never opens an invented twin. Choose a venue first when several are available. Central management: https://www.admiranext.com/xpace/manage; permissions: https://www.admiranext.com/usuarios. Read access lasts 10 minutes in this tab; expiry or revocation requires reconnection. Quality, language and layout remain local. It grants no MCP writes or physical device control.",
  "cafebreria_demo": {
    "project_id": "cafebreria",
    "venue_id": "demo-cafebreria",
    "mode": "public demo only",
    "destination": "https://www.admira.store/xpacios/cafebreria/",
    "central_legacy_path": "/admira-xp/",
    "language": "explicit lang retained; otherwise current interface language; domain default as fallback",
    "preserves": [
      "project",
      "circuit",
      "venue",
      "lang",
      "langlock",
      "supported quality query"
    ],
    "es": "En las demos públicas, Opciones → Proyecto y local → Cafebrería abre https://www.admira.store/xpacios/cafebreria/, la cafetería recuperada con librería interactiva, inventario ITIL y editor 3D. Conserva el idioma de la interfaz, incluidas las preferencias locales; lang explícito tiene prioridad. La resolución se limita al local demo-cafebreria del proyecto cafebreria. Los locales de cuenta mantienen su asociación central. El catálogo central todavía publica la URL histórica /admira-xp/ para esta demo; el selector resuelve esa compatibilidad.",
    "en": "In public demos, Options → Project and venue → Cafebrería opens https://www.admira.store/xpacios/cafebreria/, the recovered café with its interactive bookcase, ITIL inventory and 3D editor. The interface language is preserved, including local preferences; explicit lang takes priority. Resolution is limited to venue demo-cafebreria in project cafebreria. Account venues keep their central association. The central catalogue still publishes the historical /admira-xp/ URL for this demo; the selector handles that compatibility.",
    "selection_stability": {
      "es": "El desplegable conserva sus opciones mientras eliges: la comprobación de sesión cada segundo no reconstruye el menú si nada cambia. La caducidad del acceso sigue retirando los proyectos autorizados. Abre Proyecto, elige Cafebrería y confirma la opción; puedes dejar el menú abierto antes de confirmar.",
      "en": "The dropdown keeps its options while you choose: the session check every second does not rebuild the menu when nothing changes. Access expiry still removes authorized projects. Open Project, choose Cafebrería and confirm the option; you can leave the menu open before confirming.",
      "session_check": "every second; redraw only when state changes",
      "expiry": "authorized project options are cleared"
    }
  }
}
```

El snapshot project-catalog.json sólo documenta la migración inicial del backoffice; no se consulta para decidir acceso. Publicar los assets del simulador no convierte esos assets públicos en datos privados: este permiso protege la consulta del registro y los locales autorizados. / project-catalog.json documents the initial migration only; it is never consulted for authorization. Public simulation assets remain public: this grant protects registry/venue queries.

## Cafebrería: destino del desplegable / Dropdown destination

ES: En las demos públicas, Opciones → Proyecto y local → Cafebrería abre https://www.admira.store/xpacios/cafebreria/, la cafetería recuperada con librería interactiva, inventario ITIL y editor 3D. Conserva el idioma de la interfaz, incluidas las preferencias locales; lang explícito tiene prioridad. La resolución se limita al local demo-cafebreria del proyecto cafebreria. Los locales de cuenta mantienen su asociación central. El catálogo central todavía publica la URL histórica /admira-xp/ para esta demo; el selector resuelve esa compatibilidad.

EN: In public demos, Options → Project and venue → Cafebrería opens https://www.admira.store/xpacios/cafebreria/, the recovered café with its interactive bookcase, ITIL inventory and 3D editor. The interface language is preserved, including local preferences; explicit lang takes priority. Resolution is limited to venue demo-cafebreria in project cafebreria. Account venues keep their central association. The central catalogue still publishes the historical /admira-xp/ URL for this demo; the selector handles that compatibility.

ES: Sin iniciar sesión, abre Opciones → Proyecto y local, selecciona Cafebrería y comprueba la dirección /xpacios/cafebreria/. Usa Inventario ITIL y Distribuir desde Opciones para listar y mover sus elementos. La escena recuperada conserva su geometría original; el parámetro de calidad se mantiene en la URL, sin convertir el modelo importado en una variante del simulador histórico.

EN: Without signing in, open Options → Project and venue, select Cafebrería and check the /xpacios/cafebreria/ address. Use ITIL inventory and Distribute under Options to list and move its elements. The recovered scene keeps its original geometry; the quality query remains in the URL without converting the imported model into a historical simulator variant.

## Selección manual estable / Stable manual selection

ES: El desplegable conserva sus opciones mientras eliges: la comprobación de sesión cada segundo no reconstruye el menú si nada cambia. La caducidad del acceso sigue retirando los proyectos autorizados. Abre Proyecto, elige Cafebrería y confirma la opción; puedes dejar el menú abierto antes de confirmar.

EN: The dropdown keeps its options while you choose: the session check every second does not rebuild the menu when nothing changes. Access expiry still removes authorized projects. Open Project, choose Cafebrería and confirm the option; you can leave the menu open before confirming.
