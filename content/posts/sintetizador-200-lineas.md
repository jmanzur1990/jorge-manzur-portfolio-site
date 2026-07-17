---
slug: sintetizador-200-lineas
title: Construyendo un sintetizador en 200 líneas de JavaScript
date: "2026-03-27"
kicker: Tutorial
excerpt: Web Audio API explicada desde cero, con osciladores, filtros y un teclado MIDI que funciona en el navegador. Código incluido.
readMin: 14
---
El audio en el navegador me parece más mágico que cualquier otra parte de la web. Le pedís a un AudioContext que cree un oscilador, le decís que toque un La en 440 hertz, y la computadora hace exactamente eso, sin drivers, sin instalaciones, sin permisos raros.

Empecé este proyecto un domingo a la tarde porque quería entender qué pasaba realmente cuando uno usa un sintetizador. No la metáfora visual de los plugins, sino los grafos de nodos: oscilador → filtro → ganancia → destino. Una vez que lo ves así, todo el resto es decoración.

> El sonido no es una cosa: es una secuencia de presiones. La computadora solo necesita saber cuánta, cuándo.

El código completo está en GitHub. Doscientas líneas, sin dependencias, MIT. Si lo agarrás y le agregás un secuenciador, mandame el link.
