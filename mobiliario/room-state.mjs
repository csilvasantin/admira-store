// El barrido cambia los muebles de uno en uno. Mientras dura, la sala está mezclada
// y el rótulo tiene que decirlo. Un clic nuevo no se tira: sustituye el destino.
export function eraStatus(bits) {
  const values = [...bits];
  if (!values.length) return { mixed: false, bits: null, label: 'vacía' };
  const first = values[0];
  if (values.every((value) => value === first)) return { mixed: false, bits: first, label: null };
  return { mixed: true, bits: null, label: 'mezcla' };
}

export function nextSweep(wanted, current) {
  return wanted == null ? current : wanted;
}
