# Xtore zapatillas: un player, dos superficies

Entrada: `/admira-xp/?autostart=xtanco&virtualPlayer=xtore-virtual-zapatillas`.
El acceso está en **⌘ Experto → Player y cámara**. Los controles no flotan al
entrar ni cuando se oculta Experto. El panel de player/cámara y la barra Control
Xtore se arrastran por su título y tienen cruz de cierre. Las posiciones se
recuerdan y se ajustan al tamaño de pantalla. Cerrar una herramienta u ocultar
Experto no desconecta el player ni la cámara; «Desconectar» sí lo hace.
Toda nueva ventana flotante debe ser movible y disponer de cierre visible.

Conectar player y cámara abre el analizador de Admira.tv en una ventana dedicada.
Si ya existe una ventana enlazada, el botón revalida su conexión sin cambiar de pestaña.
Allí se comparte exclusivamente la pestaña autorizada de Digital Twin 360,
se marca Puerta Cam y se inicia el análisis. En este flujo el iPad es opcional.
También se puede abrir el gemelo desde el analizador con Abrir gemelo · zapatillas.

El único motor condicional es el player interior del analizador, con la identidad
xtore-virtual-zapatillas. El gemelo sigue su URL pública, pieza, posición y pausa;
reutiliza un único elemento de medios para dibujar la pared y el escaparate.
Corrige desfases superiores a 0,8 segundos; no es sincronización de fotograma.
Respeta el inicio a mitad del vídeo de bicicleta y la vuelta a playlist decididos
por el origen. Audio del espejo silenciado inicialmente, activable por el usuario.
No se cambian reglas, playlist, emparejamientos físicos ni la demo Alcampo.

Puerta Cam se muestra en el panel de la cámara del escaparate; se abre también
pulsando la cámara de la escena. Es el recorte analizado, no los peatones del
simulador. Se envía como ImageBitmap efímero a la ventana enlazada, máximo 480px
de ancho y cuatro envíos por segundo. No hay servidor, grabación, broadcast,
storage ni publicación de imágenes. Si H está activado se utiliza su previo
modificado, sin prometer anonimización. Los contadores son presencia por clase,
no identificación, sexo o edad. El juego conserva sus KPI simulados aparte.

**Exterior** en el panel de Impactos utiliza exclusivamente `passages.person`,
los pasos confirmados de Puerta Cam de la Xtore de zapatillas en AdmiraXperience.
Es un acumulado de la sesión del analizador, no de todo el día ni personas únicas.
Los snapshots reemplazan el valor: no se suman por fotograma, y un reset del
origen se refleja como tal. Se validan enteros y frescura del fotograma original;
si falta el contador o la cámara caduca, se muestra «— / sin señal», nunca el
contador de NPC. Presencia actual (personas ahora) y pasos acumulados son distintos.
El resto de las estimaciones de Impactos se rotula separado de Puerta Cam.

El enlace exige WindowProxy exacto, origen admitido, sesión aleatoria e identidad
de player. El receptor rechaza mensajes antiguos o desordenados; cámara caduca
con la edad original del fotograma a 1,5 s y reproducción a 2,5 s. El analizador y el player siguen activos en segundo plano mientras reciben
latidos del gemelo enlazado. Pausa manual, cierre y desconexión retiran la señal;
si el enlace caduca con el analizador oculto, este se suspende. La recuperación
requiere el enlace restablecido y fotogramas nuevos. El origen no actualiza la fecha de un reporte
viejo para mantenerlo artificialmente vivo. El vídeo se carga con CORS anónimo
para no contaminar el canvas del gemelo.

Al activar esta variante, la rotación/mercado del escaparate no puede sustituir
el espejo. Se desactiva la publicación heredada de ese escaparate genérico y sus
capturas sintéticas. Esta integración es entre ventanas de una sesión de navegador;
no transmite detecciones a equipos físicos ni a otros visitantes. Esos equipos
necesitan un productor y transporte autenticados, independientes de este espejo.

Pruebas: `node --test admira-xp/scripts/xtore-window.test.mjs` y
`node admira-xp/scripts/test-xtore-remote.mjs`.

## Panel Impactos: Instore / DooH

Al abrir el panel se selecciona Instore. Aforo y franjas pertenecen al modelo de
interior; pantallas, totales, atención, CPM e ingresos usan solo `src: in`.
DooH muestra personas que han pasado, coches, motos, bicis y patinetes del mismo
analizador enlazado. Son acumulados de la sesión, no presencia instantánea.
Patinetes son observaciones manuales; un emisor antiguo sin ese campo muestra
«—», nunca cero inventado. Se usa `exteriorStatistics()` y la misma caducidad de
Puerta Cam (1,5 s). Sin señal se vacían las cinco cifras con «sin señal».
No se incluyen segmentos demográficos simulados ni ingresos del juego en DooH.
El selector queda fuera del cuerpo que se refresca y conserva foco/selección.
El panel mantiene arrastre, cierre y desplazamiento para pantallas pequeñas.
Pruebas adicionales: `node --test admira-xp/scripts/impact-segments.test.mjs`.

DooH recibe ahora `statistics` independiente de las imágenes (4 s de latido).
Es el mismo acumulado que pinta la Xtore; una pausa de cámara no borra el
contador y el reset se propaga inmediatamente. La fecha de vídeo no se renueva
con esos mensajes. Emisores anteriores siguen usando el fallback en cámara.
Las vistas Sin personas / Con personas se envían juntas con el mismo frameAt;
ambas caducan a los 1,5 s. Sin el par de vistas nuevo se muestran como pendientes,
no se presenta un original como si estuviera modificado. El detalle está cerrado
por defecto y el refresco conserva canvases, foco y apertura del detalle.


## Better y Best · 13 septiembre 2026

Experto → Better / Best abre una ventana 3D movible y redimensionable con cruz. Better presenta la misma geometría como wireframe; Best añade materiales y luz. El selector no cambia XTANCO_MODELS ni la partida. Snapshot de mobiliario y actores del juego; mismo player para las texturas de pantalla y contador exterior de Puerta Cam. Entrada directa `?autostart=xtanco&virtualPlayer=xtore-virtual-zapatillas&visual=best`. Arrastrar escena gira cámara; rueda acerca; Reencuadrar restaura.

DooH dispone estadísticas antes de los previos: original a la izquierda, modificado con recuadros de seguimiento a la derecha. Requiere analizador actualizado para recibir los recuadros; una captura ya abierta sigue ejecutando su versión hasta recargarla y compartir de nuevo.

## Audiencia de sesión (24/09/2026)

En el gemelo enlazado, modo Real usa `audience.counts.person` de `admira.audience-session.v1`. Total de pasos, no aforo ni enter-exit. Objetivo visual hasta 80; conserva total sin capar y muestra Sesión/Virtuales. Ajuste progresivo por transacciones en curso. Latido 4 s; sin datos, objetivo cero sin fuente alternativa. Modo Juego restaura simulación. Contrato y Help: https://admira.tv/mcp/xtore-audience-session.md · https://admira.tv/help/#xtore-audiencia. La recepción automática de sesiones en Pixeria sigue pendiente.

## Demo de pantallas desde la cámara (#248)

Clic en cámara de esquina = toggle local de demo, sin recargar ni perder enlace. Alternativa Player y cámara → Activar demo zapatillas. DS1 player, DS2 vídeo original, TFT estadísticas y gestor de turnos solo recuadros/categorías sobre fondo neutro. Esa última vista no recibe ni dibuja píxeles del stream. TTL y origen exacto del enlace siguen vigentes. Si desconecta, muestra sin señal; otro clic restaura las pantallas del juego. Tras recarga está apagado. Help: https://admira.tv/help/#xtore-demo-pantallas.

## Barra de pasos de sesión

En el Xtanco enlazado, la antigua etiqueta Real audience se llama Pasos de sesión / Session passages. Personas, Coches, Motos y Bicis vienen del mismo snapshot de audiencia. No son presencia instantánea ni aforo físico. Sin snapshot reciente se muestran guiones, sin tomar valores del aforo Hikvision. En otras tiendas, el indicador físico original sigue disponible y las columnas de vehículos permanecen ocultas.

Los ID de trayectoria visibles en Puerta Cam no son contadores: se comparten entre categorías y pueden corresponder a trayectorias que todavía no han confirmado un paso. El total de personas del HUD debe coincidir con los pasos del analizador de la misma sesión y momento.

Help: https://admira.tv/help/#xtore-audiencia
Guía animada: https://admira.tv/apps/video/xtore-id-pasos.mp4
