# WebRTC-Minimal-Server
A minimal implementation of an unreliable data channel between a browser and server using wrtc (WebRTC)

This is a proof of concept detailing how to implement an unreliable data channel in the browser.
The primary use case for this is real time multiplayer games, specifically for data where speed is more important than order (e.g. position data).

It is a known problem that udp is not available in the browser. This package utilizes SCTP, which can have similar properties.

This [article](https://gafferongames.com/post/udp_vs_tcp/) states UDP should be used for all data transmission.
Further research is required before the same requirement is declared necessary with regards to SCTP (I suspect it's likely).
