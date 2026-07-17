---
slug: tipos-fin-de-semana
title: Cómo los sistemas de tipos me salvaron el fin de semana
date: "2026-01-11"
kicker: TypeScript
excerpt: Un caso real de migración de JavaScript a TypeScript en producción. Lo bueno, lo malo y los tres bugs que encontró el compilador.
readMin: 7
---
Un viernes a las ocho de la noche, un cliente me escribió que el formulario de checkout no estaba sumando bien los impuestos. Lo peor que te puede pasar un viernes. Cargué el repo, abrí el archivo culpable, y vi exactamente el tipo de código que escribiría yo mismo hace cinco años.

Tres horas después, en vez de parchar el bug, había migrado el módulo entero a TypeScript estricto. El compilador encontró otros tres errores que nadie había detectado, dos de ellos potencialmente caros. El bug original se solucionó en una línea.

El sistema de tipos no escribe el código por vos, pero te avisa cuando estás mintiendo. Es la diferencia entre tener un amigo honesto y trabajar solo.
