require("dotenv").config();

const express = require("express");
const OpenAI = require("openai");

const app = express();

/*
|--------------------------------------------------------------------------
| RECEPCIÓN DE DATOS
|--------------------------------------------------------------------------
| JSON es el formato principal utilizado por n8n.
| También aceptamos form-urlencoded y text/plain como respaldo.
*/
app.use(
  express.json({
    limit: "1mb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "1mb",
  })
);

app.use(
  express.text({
    type: "text/plain",
    limit: "1mb",
  })
);

/*
|--------------------------------------------------------------------------
| OPENAI
|--------------------------------------------------------------------------
*/
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  : null;

const PORT = process.env.PORT || 8080;

/*
|--------------------------------------------------------------------------
| SYSTEM PROMPT
|--------------------------------------------------------------------------
*/
const SYSTEM_PROMPT = `
Eres Lucía Vega, asistente de Mamá Segura.

Tu trabajo es responder dudas por WhatsApp sobre el producto digital "Kit Mamá Segura".

PERSONALIDAD Y TONO:

- Suave.
- Cálida.
- Clara.
- Resolutiva.
- Humana.
- Empática.
- Cordial y sencilla.
- Nunca suenes robótica.
- Nunca digas que eres un bot.
- No seas excesivamente formal.
- Responde máximo en 1 o 2 párrafos cortos.
- Varía ligeramente la forma de expresarte sin cambiar el significado de la información oficial.

REGLAS:

- No inventes información.
- No supongas información.
- Utiliza exclusivamente la información oficial de Mamá Segura incluida en esta base de conocimiento.
- No cambies precios.
- No cambies métodos de pago.
- No cambies tiempos de entrega.
- No cambies características del producto.
- No cambies condiciones ni garantías.
- No agregues productos, promociones, bonos o beneficios no proporcionados oficialmente.
- No inventes políticas de devoluciones o reembolsos.
- No asegures nada que no aparezca en la información oficial.
- No hagas preguntas abiertas innecesarias.
- No presiones al usuario.
- Cuando no exista información suficiente, indica de manera natural que necesitas confirmar ese dato con el equipo de Mamá Segura.
- Si preguntan específicamente por devoluciones o reembolsos, indica que esa información debe confirmarse con el equipo de Mamá Segura.
- No realices diagnósticos.
- No indiques tratamientos.
- No realices prescripciones.
- No realices recomendaciones médicas individualizadas.

INFORMACIÓN OFICIAL DEL NEGOCIO:

Nombre del negocio:
Mamá Segura.

Nombre del agente:
Lucía Vega.

Producto:
Kit Mamá Segura.

Tipo de producto:
Digital.

Objetivo del agente:
Resolver dudas frecuentes del avatar.

Tono:
Suave, cálido, claro y resolutivo.

Precio:
89 bolivianos.

Métodos de pago:
- Transferencia.
- Pago mediante QR.
- Yape.

Forma de entrega:
Link de descarga digital.

Llamado a la acción autorizado:
"Presiona el botón de abajo, escríbenos por WhatsApp ahora y recibe tu Kit Mamá Segura."

BASE DE CONOCIMIENTO OFICIAL:

1. ENTREGA DEL KIT

El Kit Mamá Segura lo recibes de manera digital, mediante un link en el que encontrarás todas las guías, registros y checklist que contiene la oferta para su descarga y guardado.

2. TIEMPO DE ENTREGA

El cliente recibe su Kit Mamá Segura de manera inmediata, posterior a haber recibido y comprobado el pago realizado por transferencia, pago QR o Yape.

3. CONTENIDO DEL KIT

El Kit Mamá Segura te incluye:

- Guías prácticas de Maternidad.
- Checklists para Organizarte.
- Registros de Sueño, Lactancia y Actividades.
- Orientación sobre Alimentación y Crecimiento.
- Recursos para tu Bienestar como Mamá.

4. EDADES

El Kit Mamá Segura es una guía para las mamás de bebés de 0 a 3 años, y adquiriendo la oferta adicional cubres hasta los 5 años con actividades.

5. PRECIO Y MÉTODOS DE PAGO

El precio del Kit Mamá Segura es de 89 bolivianos.

Los métodos de pago disponibles son:

- Pago por transferencia.
- Pago mediante QR.
- Pago por Yape.

6. FORMATO DEL PRODUCTO

El Kit Mamá Segura es un producto digital, recibes el material mediante un link para descargarlo.

7. USO DEL MATERIAL

Sí puedes utilizar el Kit Mamá Segura desde tu celular, pero recomendamos descargar el material, guardarlo y en algunos casos imprimirlos, como los check lists, para sacarle provecho a todo el material.

8. PROBLEMAS DE ACCESO O DESCARGA

Si tienes algún problema para abrir o descargar tu Kit Mamá Segura, nos contactas y te daremos el soporte para que puedas recibir y acceder al material.

9. INFORMACIÓN MÉDICA Y DE SALUD

Todo el contenido, ebooks, guías, checklists, registros y demás materiales ofrecidos dentro del Kit Mamá Segura tienen fines exclusivamente educativos, informativos y organizativos.

La información proporcionada no constituye diagnóstico, tratamiento, prescripción ni recomendación médica individualizada y no sustituye la evaluación de pediatras, médicos, nutricionistas, psicólogos u otros profesionales cualificados.

Ante síntomas, emergencias, dudas médicas o decisiones relacionadas con la salud de la madre o del bebé, se recomienda acudir a un profesional de salud apropiado.

10. GARANTÍA

El Kit Mamá Segura tiene garantía posterior a la compra.

En caso de existir problemas con su descarga posterior a haber confirmado el pago, el soporte de Mamá Segura estará al pendiente para solucionar cualquier problema y puedas disfrutar de todo el material para sentirte más tranquila en esta etapa.

DEVOLUCIONES Y REEMBOLSOS:

No existe información oficial proporcionada sobre devoluciones o reembolsos.

Si el usuario pregunta por devoluciones o reembolsos, indica que necesitas confirmar ese dato con el equipo de Mamá Segura.

OBJETIVO DE LA CONVERSACIÓN:

- Resolver la duda de forma breve, clara y útil.
- Mantener una conversación humana.
- Agregar un cierre comercial únicamente cuando el usuario pregunte por precio, métodos de pago o manifieste una intención clara de compra.
- No agregar cierres comerciales en consultas de soporte.
- No agregar cierres comerciales en consultas médicas.
- No agregar cierres comerciales en consultas de garantía.
- No agregar cierres comerciales en consultas sobre devoluciones o reembolsos.
`;

/*
|--------------------------------------------------------------------------
| NORMALIZAR TEXTO
|--------------------------------------------------------------------------
*/
function normalizarTexto(texto) {
  return String(texto || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/*
|--------------------------------------------------------------------------
| RESPUESTAS ALEATORIAS
|--------------------------------------------------------------------------
*/
function elegirAleatoria(opciones) {
  if (!Array.isArray(opciones) || opciones.length === 0) {
    return "";
  }

  return opciones[
    Math.floor(Math.random() * opciones.length)
  ];
}

/*
|--------------------------------------------------------------------------
| LIMPIAR RESPUESTA
|--------------------------------------------------------------------------
*/
function limpiarRespuesta(texto) {
  return String(texto || "")
    .trim()
    .replace(
      /^¡?\s*hola\s*[😊🙏❤️✨💛,.!]*\s*/gi,
      ""
    )
    .replace(
      /^buenos d[ií]as\s*[😊🙏❤️✨💛,.!]*\s*/gi,
      ""
    )
    .replace(
      /^buenas tardes\s*[😊🙏❤️✨💛,.!]*\s*/gi,
      ""
    )
    .replace(
      /^buenas noches\s*[😊🙏❤️✨💛,.!]*\s*/gi,
      ""
    )
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/*
|--------------------------------------------------------------------------
| CIERRE COMERCIAL
|--------------------------------------------------------------------------
*/
function cierreComercial() {
  const cierres = [
    `💛 Presiona el botón de abajo, escríbenos por WhatsApp ahora y recibe tu Kit Mamá Segura.`,

    `💛 Si deseas recibir tu Kit Mamá Segura, presiona el botón de abajo y escríbenos por WhatsApp ahora.`,

    `💛 Para continuar, presiona el botón de abajo, escríbenos por WhatsApp ahora y recibe tu Kit Mamá Segura.`,
  ];

  return elegirAleatoria(cierres);
}

function debeAgregarCierre(textoNormalizado) {
  const contextoSinCierre = [
    "problema",
    "ayuda",
    "garantia",
    "devolucion",
    "reembolso",
    "medico",
    "pediatra",
    "diagnostico",
    "tratamiento",
    "prescripcion",
    "emergencia",
    "sintomas",
    "salud",
  ].some((palabra) =>
    textoNormalizado.includes(palabra)
  );

  if (contextoSinCierre) {
    return false;
  }

  return [
    "precio",
    "cuanto cuesta",
    "costo",
    "quiero comprar",
    "quiero el kit",
    "comprar el kit",
    "como pago",
    "metodo de pago",
    "metodos de pago",
    "transferencia",
    "pago qr",
    "yape",
  ].some((palabra) =>
    textoNormalizado.includes(palabra)
  );
}

function agregarCierre(
  texto,
  textoNormalizado
) {
  const limpio =
    limpiarRespuesta(texto);

  if (!limpio) {
    return "Necesito confirmar ese dato con el equipo de Mamá Segura para darte una respuesta correcta.";
  }

  if (
    !debeAgregarCierre(
      textoNormalizado
    )
  ) {
    return limpio;
  }

  return `${limpio}\n\n${cierreComercial()}`;
}

/*
|--------------------------------------------------------------------------
| RESPUESTAS DIRECTAS
|--------------------------------------------------------------------------
|
| PALABRAS EXACTAS DEL DISPARADOR DE MANYCHAT:
|
| recibo
| tiempo
| incluye
| edad
| precio
| entrega
| utilizar
| problema
| medico
| ayuda
|
| respuestaDirecta() devuelve DIRECTAMENTE UN STRING.
| Esto conserva el comportamiento del INDEX FABIAN.
|
*/
function respuestaDirecta(
  textoNormalizado
) {
  /*
  |--------------------------------------------------------------------------
  | DEVOLUCIÓN / REEMBOLSO
  |--------------------------------------------------------------------------
  */
  if (
    textoNormalizado.includes(
      "devolucion"
    ) ||
    textoNormalizado.includes(
      "devolver"
    ) ||
    textoNormalizado.includes(
      "reembolso"
    ) ||
    textoNormalizado.includes(
      "reembolsar"
    )
  ) {
    console.log(
      "Intención detectada: devolucion_reembolso"
    );

    return elegirAleatoria([
      `Necesito confirmar ese dato con el equipo de Mamá Segura para darte una respuesta correcta.`,

      `La información sobre devoluciones o reembolsos necesito confirmarla con el equipo de Mamá Segura antes de responderte.`,
    ]);
  }

  /*
  |--------------------------------------------------------------------------
  | KEYWORD 8: PROBLEMA
  |--------------------------------------------------------------------------
  */
  if (
    textoNormalizado.includes(
      "problema"
    ) ||
    textoNormalizado.includes(
      "no puedo abrir"
    ) ||
    textoNormalizado.includes(
      "no puedo descargar"
    ) ||
    textoNormalizado.includes(
      "no puedo acceder"
    ) ||
    textoNormalizado.includes(
      "link no funciona"
    ) ||
    textoNormalizado.includes(
      "descarga no funciona"
    )
  ) {
    console.log(
      "Intención detectada: problema"
    );

    return elegirAleatoria([
      `Si tienes algún problema para abrir o descargar tu Kit Mamá Segura, nos contactas y te daremos el soporte para que puedas recibir y acceder al material.`,

      `Si tienes algún problema para abrir, descargar o acceder a tu Kit Mamá Segura, contáctanos y te daremos el soporte para que puedas recibir y acceder al material.`,

      `Si tienes dificultades para abrir o descargar tu Kit Mamá Segura, contáctanos y te daremos soporte para que puedas recibir y acceder al material.`,
    ]);
  }

  /*
  |--------------------------------------------------------------------------
  | KEYWORD 9: MEDICO
  |--------------------------------------------------------------------------
  */
  if (
    textoNormalizado.includes(
      "medico"
    ) ||
    textoNormalizado.includes(
      "pediatra"
    ) ||
    textoNormalizado.includes(
      "diagnostico"
    ) ||
    textoNormalizado.includes(
      "tratamiento"
    ) ||
    textoNormalizado.includes(
      "prescripcion"
    ) ||
    textoNormalizado.includes(
      "nutricionista"
    ) ||
    textoNormalizado.includes(
      "psicologo"
    ) ||
    textoNormalizado.includes(
      "sintomas"
    ) ||
    textoNormalizado.includes(
      "emergencia"
    ) ||
    textoNormalizado.includes(
      "profesional de salud"
    )
  ) {
    console.log(
      "Intención detectada: medico"
    );

    return elegirAleatoria([
      `Todo el contenido, ebooks, guías, checklists, registros y demás materiales ofrecidos dentro del Kit Mamá Segura tienen fines exclusivamente educativos, informativos y organizativos. La información proporcionada no constituye diagnóstico, tratamiento, prescripción ni recomendación médica individualizada y no sustituye la evaluación de pediatras, médicos, nutricionistas, psicólogos u otros profesionales cualificados. Ante síntomas, emergencias, dudas médicas o decisiones relacionadas con la salud de la madre o del bebé, se recomienda acudir a un profesional de salud apropiado.`,

      `El contenido del Kit Mamá Segura tiene fines exclusivamente educativos, informativos y organizativos. No constituye diagnóstico, tratamiento, prescripción ni recomendación médica individualizada y no sustituye la evaluación de pediatras, médicos, nutricionistas, psicólogos u otros profesionales cualificados. Ante síntomas, emergencias, dudas médicas o decisiones relacionadas con la salud de la madre o del bebé, se recomienda acudir a un profesional de salud apropiado.`,
    ]);
  }

  /*
  |--------------------------------------------------------------------------
  | KEYWORD 10: AYUDA
  |--------------------------------------------------------------------------
  */
  if (
    textoNormalizado.includes(
      "ayuda"
    ) ||
    textoNormalizado.includes(
      "garantia"
    )
  ) {
    console.log(
      "Intención detectada: ayuda"
    );

    return elegirAleatoria([
      `El Kit Mamá Segura tiene garantía posterior a la compra. En caso de existir problemas con su descarga posterior a haber confirmado el pago, el soporte de Mamá Segura estará al pendiente para solucionar cualquier problema y puedas disfrutar de todo el material para sentirte más tranquila en esta etapa.`,

      `El Kit Mamá Segura cuenta con garantía posterior a la compra. Si existe algún problema con la descarga después de haber confirmado el pago, el soporte de Mamá Segura estará al pendiente para ayudarte a solucionarlo y puedas disfrutar de todo el material para sentirte más tranquila en esta etapa.`,
    ]);
  }

  /*
  |--------------------------------------------------------------------------
  | KEYWORD 2: TIEMPO
  |--------------------------------------------------------------------------
  */
  if (
    textoNormalizado.includes(
      "tiempo"
    ) ||
    textoNormalizado.includes(
      "cuanto demora"
    ) ||
    textoNormalizado.includes(
      "cuanto tarda"
    ) ||
    textoNormalizado.includes(
      "cuando recibo"
    ) ||
    textoNormalizado.includes(
      "cuando llega"
    ) ||
    textoNormalizado.includes(
      "inmediato"
    )
  ) {
    console.log(
      "Intención detectada: tiempo"
    );

    return elegirAleatoria([
      `El cliente recibe su Kit Mamá Segura de manera inmediata, posterior a haber recibido y comprobado el pago realizado por transferencia, pago QR o Yape.`,

      `Recibes tu Kit Mamá Segura de manera inmediata después de que hayamos recibido y comprobado el pago realizado por transferencia, pago QR o Yape.`,

      `La entrega del Kit Mamá Segura es inmediata una vez recibido y comprobado el pago realizado por transferencia, pago QR o Yape.`,
    ]);
  }

  /*
  |--------------------------------------------------------------------------
  | KEYWORD 3: INCLUYE
  |--------------------------------------------------------------------------
  */
  if (
    textoNormalizado.includes(
      "incluye"
    ) ||
    textoNormalizado.includes(
      "que trae"
    ) ||
    textoNormalizado.includes(
      "que contiene"
    ) ||
    textoNormalizado.includes(
      "contenido del kit"
    )
  ) {
    console.log(
      "Intención detectada: incluye"
    );

    return elegirAleatoria([
      `El Kit Mamá Segura te incluye:
- Guías prácticas de Maternidad.
- Checklists para Organizarte.
- Registros de Sueño, Lactancia y Actividades.
- Orientación sobre Alimentación y Crecimiento.
- Recursos para tu Bienestar como Mamá.`,

      `El Kit Mamá Segura incluye guías prácticas de Maternidad, checklists para Organizarte, registros de Sueño, Lactancia y Actividades, orientación sobre Alimentación y Crecimiento, y recursos para tu Bienestar como Mamá.`,

      `Dentro del Kit Mamá Segura encontrarás guías prácticas de Maternidad, checklists para Organizarte, registros de Sueño, Lactancia y Actividades, orientación sobre Alimentación y Crecimiento, y recursos para tu Bienestar como Mamá.`,
    ]);
  }

  /*
  |--------------------------------------------------------------------------
  | KEYWORD 4: EDAD
  |--------------------------------------------------------------------------
  */
  if (
    textoNormalizado.includes(
      "edad"
    ) ||
    textoNormalizado.includes(
      "0 a 3"
    ) ||
    textoNormalizado.includes(
      "hasta los 3"
    ) ||
    textoNormalizado.includes(
      "hasta los 5"
    )
  ) {
    console.log(
      "Intención detectada: edad"
    );

    return elegirAleatoria([
      `El Kit Mamá Segura es una guía para las mamás de bebés de 0 a 3 años, y adquiriendo la oferta adicional cubres hasta los 5 años con actividades.`,

      `El Kit Mamá Segura está pensado para mamás de bebés de 0 a 3 años y, adquiriendo la oferta adicional, cubres hasta los 5 años con actividades.`,

      `La guía Kit Mamá Segura cubre la etapa de 0 a 3 años y, adquiriendo la oferta adicional, cubres hasta los 5 años con actividades.`,
    ]);
  }

  /*
  |--------------------------------------------------------------------------
  | KEYWORD 5: PRECIO
  |--------------------------------------------------------------------------
  */
  if (
    textoNormalizado.includes(
      "precio"
    ) ||
    textoNormalizado.includes(
      "cuanto cuesta"
    ) ||
    textoNormalizado.includes(
      "costo"
    ) ||
    textoNormalizado.includes(
      "89 bolivianos"
    ) ||
    textoNormalizado.includes(
      "metodo de pago"
    ) ||
    textoNormalizado.includes(
      "metodos de pago"
    ) ||
    textoNormalizado.includes(
      "como pago"
    ) ||
    textoNormalizado.includes(
      "transferencia"
    ) ||
    textoNormalizado.includes(
      "pago qr"
    ) ||
    textoNormalizado.includes(
      "yape"
    ) ||
    textoNormalizado.includes(
      "quiero comprar"
    )
  ) {
    console.log(
      "Intención detectada: precio"
    );

    const respuestas = [
      `El precio del Kit Mamá Segura es de 89 bolivianos. Los métodos de pago disponibles son pago por transferencia, pago mediante QR o pago por Yape.`,

      `El Kit Mamá Segura tiene un precio de 89 bolivianos. Puedes realizar el pago por transferencia, mediante QR o por Yape.`,

      `El precio del Kit Mamá Segura es de 89 bolivianos y puedes pagar mediante transferencia, QR o Yape.`,
    ];

    return agregarCierre(
      elegirAleatoria(respuestas),
      textoNormalizado
    );
  }

  /*
  |--------------------------------------------------------------------------
  | KEYWORD 7: UTILIZAR
  |--------------------------------------------------------------------------
  */
  if (
    textoNormalizado.includes(
      "utilizar"
    ) ||
    textoNormalizado.includes(
      "usar el kit"
    ) ||
    textoNormalizado.includes(
      "desde mi celular"
    ) ||
    textoNormalizado.includes(
      "en mi celular"
    ) ||
    textoNormalizado.includes(
      "imprimir"
    ) ||
    textoNormalizado.includes(
      "checklist"
    ) ||
    textoNormalizado.includes(
      "check lists"
    )
  ) {
    console.log(
      "Intención detectada: utilizar"
    );

    return elegirAleatoria([
      `Sí puedes utilizar el Kit Mamá Segura desde tu celular, pero recomendamos descargar el material, guardarlo y en algunos casos imprimirlos, como los check lists, para sacarle provecho a todo el material.`,

      `Puedes utilizar el Kit Mamá Segura desde tu celular. Recomendamos descargar el material, guardarlo y, en algunos casos, imprimirlo, como los check lists, para sacarle provecho a todo el material.`,

      `Sí puedes usar el Kit Mamá Segura desde tu celular. También recomendamos descargar y guardar el material y, en algunos casos, imprimir los check lists para aprovechar todo el contenido.`,
    ]);
  }

  /*
  |--------------------------------------------------------------------------
  | KEYWORD 6: ENTREGA
  |--------------------------------------------------------------------------
  */
  if (
    textoNormalizado.includes(
      "entrega"
    ) ||
    textoNormalizado.includes(
      "es digital"
    ) ||
    textoNormalizado.includes(
      "es fisico"
    ) ||
    textoNormalizado.includes(
      "producto digital"
    ) ||
    textoNormalizado.includes(
      "producto fisico"
    ) ||
    textoNormalizado.includes(
      "formato digital"
    ) ||
    textoNormalizado.includes(
      "viene impreso"
    )
  ) {
    console.log(
      "Intención detectada: entrega"
    );

    return elegirAleatoria([
      `El Kit Mamá Segura es un producto digital, recibes el material mediante un link para descargarlo.`,

      `El Kit Mamá Segura es digital. Recibes el material mediante un link para descargarlo.`,

      `El producto es digital y recibes el material del Kit Mamá Segura mediante un link para descargarlo.`,
    ]);
  }

  /*
  |--------------------------------------------------------------------------
  | KEYWORD 1: RECIBO
  |--------------------------------------------------------------------------
  */
  if (
    textoNormalizado.includes(
      "recibo"
    ) ||
    textoNormalizado.includes(
      "como recibo"
    ) ||
    textoNormalizado.includes(
      "como lo recibo"
    ) ||
    textoNormalizado.includes(
      "como recibire"
    ) ||
    textoNormalizado.includes(
      "como me llega"
    ) ||
    textoNormalizado.includes(
      "recibir el kit"
    ) ||
    textoNormalizado.includes(
      "link de descarga"
    )
  ) {
    console.log(
      "Intención detectada: recibo"
    );

    return elegirAleatoria([
      `El Kit Mamá Segura lo recibes de manera digital, mediante un link en el que encontrarás todas las guías, registros y checklist que contiene la oferta para su descarga y guardado.`,

      `Recibes el Kit Mamá Segura de manera digital mediante un link, donde encontrarás todas las guías, registros y checklist que contiene la oferta para su descarga y guardado.`,

      `Tu Kit Mamá Segura se entrega de manera digital mediante un link en el que encontrarás las guías, registros y checklist para descargarlos y guardarlos.`,
    ]);
  }

  return null;
}

/*
|--------------------------------------------------------------------------
| EXTRAER EL MENSAJE DE N8N
|--------------------------------------------------------------------------
|
| Permite recibir:
|
| { "mensaje": "Problema" }
| { "texto": "Problema" }
| { "message": "Problema" }
|
| También:
|
| {
|   "body": {
|     "mensaje": "Problema"
|   }
| }
|
| Y estructuras anidadas comunes de n8n.
|
*/
function extraerMensaje(
  valor,
  profundidad = 0
) {
  if (
    valor === null ||
    valor === undefined ||
    profundidad > 6
  ) {
    return "";
  }

  if (typeof valor === "string") {
    const texto =
      valor.trim();

    if (!texto) {
      return "";
    }

    if (
      (
        texto.startsWith("{") &&
        texto.endsWith("}")
      ) ||
      (
        texto.startsWith("[") &&
        texto.endsWith("]")
      )
    ) {
      try {
        const convertido =
          JSON.parse(texto);

        const interno =
          extraerMensaje(
            convertido,
            profundidad + 1
          );

        if (interno) {
          return interno;
        }
      } catch (error) {
        return texto;
      }
    }

    return texto;
  }

  if (Array.isArray(valor)) {
    for (const elemento of valor) {
      const encontrado =
        extraerMensaje(
          elemento,
          profundidad + 1
        );

      if (encontrado) {
        return encontrado;
      }
    }

    return "";
  }

  if (typeof valor !== "object") {
    return "";
  }

  const clavesMensaje = [
    "mensaje",
    "texto",
    "message",
    "text",
    "pregunta",
    "question",
    "input",
    "user_input",
    "userMessage",
    "lastTextInput",
    "last_text_input",
    "ultima_entrada_de_texto",
  ];

  for (
    const clave of clavesMensaje
  ) {
    if (
      Object.prototype.hasOwnProperty.call(
        valor,
        clave
      )
    ) {
      const encontrado =
        extraerMensaje(
          valor[clave],
          profundidad + 1
        );

      if (encontrado) {
        return encontrado;
      }
    }
  }

  const contenedores = [
    "body",
    "data",
    "payload",
    "request",
    "json",
    "fields",
    "custom_fields",
  ];

  for (
    const clave of contenedores
  ) {
    if (
      Object.prototype.hasOwnProperty.call(
        valor,
        clave
      )
    ) {
      const encontrado =
        extraerMensaje(
          valor[clave],
          profundidad + 1
        );

      if (encontrado) {
        return encontrado;
      }
    }
  }

  return "";
}

/*
|--------------------------------------------------------------------------
| GET /
|--------------------------------------------------------------------------
*/
app.get("/", (req, res) => {
  return res
    .status(200)
    .send(
      "Agente de soporte Mamá Segura activo ✅"
    );
});

/*
|--------------------------------------------------------------------------
| HEALTH CHECK
|--------------------------------------------------------------------------
*/
app.get(
  "/health",
  (req, res) => {
    return res
      .status(200)
      .json({
        estado: "ok",
        servicio:
          "Mamá Segura",
      });
  }
);

/*
|--------------------------------------------------------------------------
| POST /mensaje
|--------------------------------------------------------------------------
*/
app.post(
  "/mensaje",
  async (req, res) => {
    try {
      const texto =
        extraerMensaje(
          req.body
        );

      console.log(
        "Texto recibido:",
        texto
          ? "[contenido recibido]"
          : "[vacío]"
      );

      /*
      |--------------------------------------------------------------------------
      | MENSAJE VACÍO
      |--------------------------------------------------------------------------
      */
      if (!texto) {
        console.log(
          "Intención detectada: mensaje_vacio"
        );

        console.log(
          "Respuesta enviada: mensaje_vacio"
        );

        return res
          .status(200)
          .json({
            respuesta:
              "No pude identificar el mensaje. Por favor, escríbelo nuevamente.",
          });
      }

      /*
      |--------------------------------------------------------------------------
      | NORMALIZACIÓN
      |--------------------------------------------------------------------------
      */
      const textoNormalizado =
        normalizarTexto(
          texto
        );

      /*
      |--------------------------------------------------------------------------
      | RESPUESTA DIRECTA
      |--------------------------------------------------------------------------
      */
      const directa =
        respuestaDirecta(
          textoNormalizado
        );

      if (directa) {
        console.log(
          "Respuesta enviada: base_conocimiento"
        );

        /*
        |--------------------------------------------------------------
        | ESTA ES LA RESPUESTA QUE N8N DEBE RECIBIR
        |--------------------------------------------------------------
        |
        | {
        |   "respuesta": "texto..."
        | }
        |
        */
        return res
          .status(200)
          .json({
            respuesta:
              directa,
          });
      }

      /*
      |--------------------------------------------------------------------------
      | CONSULTA ABIERTA
      |--------------------------------------------------------------------------
      */
      console.log(
        "Intención detectada: consulta_abierta"
      );

      /*
      |--------------------------------------------------------------------------
      | SIN API KEY
      |--------------------------------------------------------------------------
      */
      if (!openai) {
        console.log(
          "Respuesta enviada: openai_no_configurado"
        );

        return res
          .status(200)
          .json({
            respuesta:
              "Necesito confirmar ese dato con el equipo de Mamá Segura para darte una respuesta correcta.",
          });
      }

      /*
      |--------------------------------------------------------------------------
      | OPENAI
      |--------------------------------------------------------------------------
      */
      try {
        const response =
          await openai.responses.create({
            model:
              "gpt-4.1-mini",

            temperature:
              0.4,

            input: [
              {
                role: "system",
                content:
                  SYSTEM_PROMPT,
              },
              {
                role: "user",
                content:
                  texto,
              },
            ],
          });

        const respuestaIA =
          response.output_text ||
          "";

        const respuestaFinal =
          agregarCierre(
            respuestaIA,
            textoNormalizado
          );

        console.log(
          "Respuesta enviada: OpenAI"
        );

        return res
          .status(200)
          .json({
            respuesta:
              respuestaFinal,
          });
      } catch (
        openaiError
      ) {
        console.error(
          "Error de OpenAI:",
          openaiError &&
            openaiError.message
            ? openaiError.message
            : "Error desconocido"
        );

        return res
          .status(200)
          .json({
            respuesta:
              "En este momento no pude procesar tu mensaje. Por favor, inténtalo nuevamente en unos minutos.",
          });
      }
    } catch (error) {
      console.error(
        "Error en /mensaje:",
        error &&
          error.message
          ? error.message
          : "Error desconocido"
      );

      return res
        .status(200)
        .json({
          respuesta:
            "En este momento no pude procesar tu mensaje. Por favor, inténtalo nuevamente en unos minutos.",
        });
    }
  }
);

/*
|--------------------------------------------------------------------------
| MANEJO DE ERRORES
|--------------------------------------------------------------------------
*/
app.use(
  (
    error,
    req,
    res,
    next
  ) => {
    console.error(
      "Error del servidor:",
      error &&
        error.message
        ? error.message
        : "Error desconocido"
    );

    if (
      res.headersSent
    ) {
      return next(error);
    }

    return res
      .status(200)
      .json({
        respuesta:
          "No pude identificar el mensaje. Por favor, escríbelo nuevamente.",
      });
  }
);

/*
|--------------------------------------------------------------------------
| INICIAR SERVIDOR
|--------------------------------------------------------------------------
*/
app.listen(
  PORT,
  "0.0.0.0",
  () => {
    console.log(
      `Servidor corriendo en puerto ${PORT}`
    );
  }
);
