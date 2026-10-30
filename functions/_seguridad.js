// Cabeceras de seguridad comunes a toda respuesta, venga del perímetro, de una función o de un asset.
// HSTS (Carlos, 30-oct-2026): el navegador deja de intentar HTTP en esta web. Sin includeSubDomains ni
// preload: los subdominios (api, gate, whitelist, mcp…) son servicios aparte y esto no debe atarlos.
export const HSTS = 'max-age=15552000';

export function withTransportSecurity(response) {
  const secured = new Response(response.body, response);
  secured.headers.set('strict-transport-security', HSTS);
  return secured;
}
