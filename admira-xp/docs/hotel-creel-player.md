# Hotel Creel · señal de Admira.tv / Admira.tv feed

En la maqueta 3D del Hotel Creel, pulsa **Usar señal de Admira.tv** para probar el kiosco `https://admira.tv/creel/`. **Desconectar** recupera el fondo local (`?tv=off`). El campo URL sigue disponible para un player personalizado. Si el kiosco no responde, se conserva la escena local. La temperatura y la hora siguen los controles de la maqueta. Los retratos y avisos de presencia se dibujan en la textura de la escena.

In the Hotel Creel model, choose **Usar señal de Admira.tv** to try the kiosk. **Desconectar** restores the local background. The URL field still supports custom players. If the kiosk fails to respond, the local scene stays visible. Weather and time follow the model controls. Portraits and proximity notices are rendered onto the scene texture.

## Contrato / Contract

- Parent sends `creel-frame-request` v1 with a sequence number and weather/time state to the kiosk. The kiosk returns a transferable 1440 × 540 `ImageBitmap` in `creel-frame` v1 with the same sequence number. The parent checks origin, source, sequence and dimensions before drawing.
- The standard request rate is capped at 10 Hz. With reduced motion enabled, updates follow control events instead of camera animation. The kiosk is an ambient rendering source and carries no playlist ID.
- El retroceso para la prueba es **Desconectar** o `?tv=off`. El despliegue coordinado requiere el kiosco v1 y la integración en Store.
