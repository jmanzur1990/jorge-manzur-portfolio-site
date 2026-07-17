---
slug: generadores-estaticos
title: El placer silencioso de los generadores estáticos
date: "2026-02-18"
kicker: Herramientas
excerpt: Hugo, Eleventy, Astro. Tres formas distintas de no usar JavaScript en producción y dormir mejor por las noches.
readMin: 9
---
Mi sitio personal lleva ocho años corriendo sin caerse una sola vez. No tiene base de datos, ni servidor de aplicación, ni cache layer, ni autoescalado. Es una carpeta de archivos HTML servidos por nginx desde un VPS de cinco dólares.

Lo más cerca que estuve de tener un problema fue el día que se cayó el datacenter entero. Doce horas más tarde nginx volvió a levantar y mi sitio volvió a estar online, intacto, sin ninguna intervención mía. Esa es la promesa de los archivos estáticos.

Cada vez que un cliente me pide un blog, le ofrezco primero un generador estático. Cada vez que un cliente me pide una landing, le ofrezco primero un generador estático. La respuesta correcta a casi cualquier pregunta web es «¿podemos hacerlo con archivos planos?». Probá empezar por ahí.
