// Stable per-unit contract from manifest.json; never use catalog number as ownership.
export const SURFACE_VENUE='alsea-sbux-021';
const codes={'sb-backbar':'PDG103-BAR-01','sb-pos':'PDG103-MOS-01','sb-pastry':'PDG103-VIT-01','sb-mugs':'PDG103-EST-01','sb-table-a':'PDG103-MES-01','sb-table-b':'PDG103-MES-02','sb-chair-1':'PDG103-SIL-01','sb-chair-2':'PDG103-SIL-02','sb-chair-3':'PDG103-SIL-03','sb-chair-4':'PDG103-SIL-04','sb-water-rack':'PDG103-BOT-01'};
export const appearanceIdentity=(venue,instance)=>venue===SURFACE_VENUE&&codes[instance]?{venue,instance,code:codes[instance]}:null;
