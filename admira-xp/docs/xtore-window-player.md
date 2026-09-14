# Xtore zapatillas: un player, dos superficies

Entrada: `/admira-xp/?autostart=xtanco&virtualPlayer=xtore-virtual-zapatillas`.
El acceso está en **⌘ Experto → Player y cámara**. Los controles no flotan al
entrar ni cuando se oculta Experto. El panel de player/cámara y la barra Control
Xtore se arrastran por su título y tienen cruz de cierre. Las posiciones se
recuerdan y se ajustan al tamaño de pantalla. Cerrar una herramienta u ocultar
Experto no desconecta el player ni la cámara; «Desconectar» sí lo hace.
Toda nueva ventana flotante debe ser movible y disponer de cierre visible.

Conectar player y cámara abre el analizador de Admira.tv en una ventana dedicada.
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
con la edad original del fotograma a 1,5 s y reproducción a 2,5 s. Pausa, ocultación,
cierre y desconexión retiran señal. El origen no actualiza la fecha de un reporte
viejo para mantenerlo artificialmente vivo. El vídeo se carga con CORS anónimo
para no contaminar el canvas del gemelo.

Al activar esta variante, la rotación/mercado del escaparate no puede sustituir
el espejo. Se desactiva la publicación heredada de ese escaparate genérico y sus
capturas sintéticas. Esta integración es entre ventanas de una sesión de navegador;
no transmite detecciones a equipos físicos ni a otros visitantes. Esos equipos
necesitan un productor y transporte autenticados, independientes de este espejo.

Pruebas: `node --test admira-xp/scripts/xtore-window.test.mjs` y
`node admira-xp/scripts/test-xtore-remote.mjs`.
