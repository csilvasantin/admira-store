# Puerta Cam: transient traffic geometry

`window.__xtoreWindowPlayer.traffic()` returns a fresh snapshot independently of
camera bitmap encoding and cumulative DooH statistics:

```js
{
  status: 'waiting' | 'live' | 'stale' | 'disconnected',
  source: 'puerta-cam',
  frameAt: 1789290000000, // original capture time; null before a frame
  tracks: [{
    id: 7, // positive local tracker ID, temporary and not a personal identity
    kind: 'person' | 'car' | 'motorcycle' | 'bicycle' | 'scooter',
    box: [x, y, width, height], // clipped to the camera ROI, normalized 0..1
    x: 0.5, // horizontal box center
    y: 0.8, // bottom of box: schematic ground support, not calibrated 3D
    observedAt: 1789290000000, // original strong observation time
    confirmed: true,
    manual: true // required for scooter; omitted for every other category
  }]
}
```

Both the capture and each observation expire at 1500 ms. A new analyzed empty
frame is `live` with no tracks; missing or expired observations do not supply
positions or movement. A maximum of 100 confirmed tracks travels per frame.
Metadata updates use the existing exact paired window, origin, screen and
session envelope, with independent `traffic` / `traffic-off` events and ordered
timestamps. Frozen/old frames cannot renew a trajectory. Receiver snapshots are
copied and track data are immutable.

Only a human confirmation of a currently observed person/bicycle/motorcycle
track can produce a scooter trajectory. The manual scooter counter alone has no
position and produces no sprite. Rendering may use generic synthetic shapes and
colors, but does not receive images, clothing, faces or demographic attributes.

Trajectories are not cumulative passages, unique visitors, simulated customers
or advertising impacts. They do not alter the authoritative counters, history,
interior playlist or clean/original camera pair. H and camera preview changes do
not clear trajectories; analysis pause, stop and disconnect do. No trajectory
history is stored. The exterior program uses only fresh confirmed presence, and
returns to the interior mirror when no applicable presence remains.
