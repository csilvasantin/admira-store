// Preview-to-preview navigation never sends the reviewer to production.
export function studioCampaignURL(en=false,host=location.hostname){
 let origin='https://admira.studio';
 if(['localhost','127.0.0.1'].includes(host))origin='http://127.0.0.1:8481';
 else if(/^[a-z0-9-]+\.admira-store\.pages\.dev$/.test(host))origin='https://5834-next-step-preview.pixeria.pages.dev';
 return origin+'/campanas/next-step/?lang='+(en?'en':'es');
}
