require("dotenv").config();

const express = require("express");
const OpenAI = require("openai");

const app = express();

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

const PORT = process.env.PORT || 8080;

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  : null;

const SYSTEM_PROMPT = `
Eres Lucía Vega, asistente de Mamá Segura.

Atiendes por WhatsApp consultas relacionadas con el producto digital
"Kit Mamá Segura".

PERSONALIDAD Y TONO:

- Suave.
- Cálido.
- Claro.
- Resolutivo.
- Humano.
- Empático.
- Cordial y sencillo.
- Nunca digas que eres un bot.
- No seas demasiado formal.
- Responde como máximo en uno o dos párrafos cortos.

REGLAS:

- Utiliza exclusivamente la información oficial incluida en esta base.
- No inventes información.
- No supongas información.
- No cambies precios.
- No cambies métodos de pago.
- No cambies tiempos de entrega.
- No cambies condiciones.
- No cambies garantías.
- No inventes promociones, bonos o beneficios.
- No inventes políticas de devolución o reembolso.
- Si no existe información suficiente, indica que necesitas confirmar ese dato con el equipo de Mamá Segura.
- Si preguntan por devoluciones o reembolsos, indica que esa información debe confirmarse con el equipo.
- No realices diagnósticos.
- No indiques tratamientos.
- No realices prescripciones.
- No realices recomendaciones médicas individualizadas.

INFORMACIÓN OFICIAL:

Negocio:
Mamá Segura.

Agente:
Lucía Vega.

Producto:
Kit Mamá Segura.

Tipo:
Digital.

Precio:
89 bolivianos.

Métodos de pago:
- Transferencia.
- Pago mediante QR.
- Yape.

ENTREGA:

El Kit Mamá Segura lo recibes de manera digital, mediante un link
en el que encontrarás todas las guías, registros y checklist que
contiene la oferta para su descarga y guardado.

TIEMPO:

El cliente recibe su Kit Mamá Segura de manera inmediata,
posterior a haber recibido y comprobado el pago realizado por
transferencia, pago QR o Yape.

CONTENIDO:

El Kit Mamá Segura incluye:

- Guías prácticas de Maternidad.
- Checklists para Organizarte.
- Registros de Sueño, Lactancia y Actividades.
- Orientación sobre Alimentación y Crecimiento.
- Recursos para tu Bienestar como Mamá.

EDADES:

El Kit Mamá Segura es una guía para las mamás de bebés de
0 a 3 años, y adquiriendo la oferta adicional cubres hasta
los 5 años con actividades.

FORMATO:

El Kit Mamá Segura es un producto digital.
El material se recibe mediante un link para descargarlo.

USO:

Sí puedes utilizar el Kit Mamá Segura desde tu celular, pero
recomendamos descargar el material, guardarlo y en algunos casos
imprimirlos, como los check lists, para sacarle provecho a todo
el material.

SOPORTE:

Si tienes algún problema para abrir o descargar tu Kit Mamá Segura,
nos contactas y te daremos el soporte para que puedas recibir y
acceder al material.

INFORMACIÓN MÉDICA:

Todo el contenido, ebooks, guías, checklists, registros y demás
materiales ofrecidos dentro del Kit Mamá Segura tienen fines
exclusivamente educativos, informativos y organizativos.

La información proporcionada no constituye diagnóstico, tratamiento,
prescripción ni recomendación médica individualizada y no sustituye
la evaluación de pediatras, médicos, nutricionistas, psicólogos u
otros profesionales cualificados.

Ante síntomas, emergencias, dudas médicas o decisiones relacionadas
con la salud de la madre o del bebé, se recomienda acudir a un
profesional de salud apropiado.

GARANTÍA:

El Kit Mamá Segura tiene garantía posterior a la compra.

En caso de existir problemas con su descarga posterior a haber
confirmado el pago, el soporte de Mamá Segura estará al pendiente
para solucionar cualquier problema y puedas disfrutar de todo el
material para sentirte más tranquila en esta etapa.

DEVOLUCIONES Y REEMBOLSOS:

No existe información oficial proporcionada sobre devoluciones
o reembolsos.

Si preguntan por este tema, indica que necesitas confirmar la
información con el equipo de Mamá Segura.

OBJETIVO:

Resolver las dudas frecuentes de forma breve, clara, cálida y útil.

Agrega un cierre comercial únicamente cuando el usuario pregunte
por precio, métodos de pago o manifieste una intención clara
de compra.
`;

function normalizarTexto(texto) {
  return String(texto || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function elegirAleatoria(opciones) {
  return opciones[
    Math.floor(
      Math.random() * opciones.length
    )
  ];
}

function limpiarRespuesta(texto) {
  return String(texto || "")
    .trim()
    .replace(
      /^¡?\s*hola\s*[😊🙏❤️✨💛,.!]*\s*/gi,
      ""
    )
    .replace(
      /\s{2,}/g,
      " "
    )
    .replace(
      /\n{3,}/g,
      "\n\n"
    )
    .trim();
}

function cierreComercial() {
  return elegirAleatoria([
    `💛 Presiona el botón de abajo, escríbenos por WhatsApp ahora y recibe tu Kit Mamá Segura.`,

    `💛 Si deseas recibir tu Kit Mamá Segura, presiona el botón de abajo y escríbenos por WhatsApp ahora.`,

    `💛 Para continuar, presiona el botón de abajo, escríbenos por WhatsApp ahora y recibe tu Kit Mamá Segura.`,
  ]);
}

function debeAgregarCierre(
  textoNormalizado
) {
  const sinCierre = [
    "problema",
    "ayuda",
    "garantia",
    "devolucion",
    "reembolso",
    "medico",
    "pediatra",
    "diagnostico",
    "tratamiento",
    "salud",
    "emergencia",
    "sintomas",
  ];

  if (
    sinCierre.some(
      (palabra) =>
        textoNormalizado.includes(
          palabra
        )
    )
  ) {
    return false;
  }

  const comercial = [
    "precio",
    "cuanto cuesta",
    "costo",
    "como pago",
    "metodo de pago",
    "transferencia",
    "pago qr",
    "yape",
    "quiero comprar",
    "comprar el kit",
  ];

  return comercial.some(
    (palabra) =>
      textoNormalizado.includes(
        palabra
      )
  );
}

function agregarCierre(
  respuesta,
  textoNormalizado
) {
  const limpio =
    limpiarRespuesta(respuesta);

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

function detectarIntencion(
  texto
) {
  /*
   * Se evalúan primero las
   * intenciones más específicas.
   */

  if (
    [
      "devolucion",
      "devolver",
      "reembolso",
      "reembolsar",
    ].some(
      (p) => texto.includes(p)
    )
  ) {
    return "devolucion_reembolso";
  }

  /*
   * KEYWORD MANYCHAT:
   * problema
   */
  if (
    [
      "problema",
      "no puedo abrir",
      "no puedo descargar",
      "no puedo acceder",
      "link no funciona",
    ].some(
      (p) => texto.includes(p)
    )
  ) {
    return "problema";
  }

  /*
   * KEYWORD MANYCHAT:
   * medico
   */
  if (
    [
      "medico",
      "pediatra",
      "diagnostico",
      "tratamiento",
      "prescripcion",
      "nutricionista",
      "psicologo",
      "sintomas",
      "emergencia",
      "profesional de salud",
    ].some(
      (p) => texto.includes(p)
    )
  ) {
    return "medico";
  }

  /*
   * KEYWORD MANYCHAT:
   * ayuda
   */
  if (
    [
      "ayuda",
      "garantia",
    ].some(
      (p) => texto.includes(p)
    )
  ) {
    return "ayuda";
  }

  /*
   * KEYWORD MANYCHAT:
   * tiempo
   */
  if (
    [
      "tiempo",
      "cuanto demora",
      "cuanto tarda",
      "cuando recibo",
      "cuando llega",
      "inmediato",
    ].some(
      (p) => texto.includes(p)
    )
  ) {
    return "tiempo";
  }

  /*
   * KEYWORD MANYCHAT:
   * incluye
   */
  if (
    [
      "incluye",
      "que trae",
      "que contiene",
      "contenido del kit",
    ].some(
      (p) => texto.includes(p)
    )
  ) {
    return "incluye";
  }

  /*
   * KEYWORD MANYCHAT:
   * edad
   */
  if (
    [
      "edad",
      "0 a 3",
      "hasta los 3",
      "hasta los 5",
    ].some(
      (p) => texto.includes(p)
    )
  ) {
    return "edad";
  }

  /*
   * KEYWORD MANYCHAT:
   * precio
   */
  if (
    [
      "precio",
      "cuanto cuesta",
      "costo",
      "89 bolivianos",
      "metodo de pago",
      "como pago",
      "transferencia",
      "pago qr",
      "yape",
      "quiero comprar",
    ].some(
      (p) => texto.includes(p)
    )
  ) {
    return "precio";
  }

  /*
   * KEYWORD MANYCHAT:
   * utilizar
   */
  if (
    [
      "utilizar",
      "usar el kit",
      "desde mi celular",
      "en mi celular",
      "imprimir",
      "checklist",
      "check lists",
    ].some(
      (p) => texto.includes(p)
    )
  ) {
    return "utilizar";
  }

  /*
   * KEYWORD MANYCHAT:
   * entrega
   */
  if (
    [
      "entrega",
      "como se entrega",
      "es digital",
      "es fisico",
      "producto digital",
      "producto fisico",
      "formato digital",
      "viene impreso",
    ].some(
      (p) => texto.includes(p)
    )
  ) {
    return "entrega";
  }

  /*
   * KEYWORD MANYCHAT:
   * recibo
   */
  if (
    [
      "recibo",
      "como recibo",
      "como lo recibo",
      "como recibire",
      "como me llega",
      "recibir el kit",
      "link de descarga",
    ].some(
      (p) => texto.includes(p)
    )
  ) {
    return "recibo";
  }

  return null;
}

function respuestaDirecta(
  textoNormalizado
) {
  const intencion =
    detectarIntencion(
      textoNormalizado
    );

  if (!intencion) {
    return null;
  }

  const respuestas = {
    devolucion_reembolso: [
      `Necesito confirmar ese dato con el equipo de Mamá Segura para darte una respuesta correcta.`,

      `La información sobre devoluciones o reembolsos necesito confirmarla con el equipo de Mamá Segura antes de responderte.`,
    ],

    problema: [
      `Si tienes algún problema para abrir o descargar tu Kit Mamá Segura, nos contactas y te daremos el soporte para que puedas recibir y acceder al material.`,

      `Si tienes algún problema para abrir, descargar o acceder a tu Kit Mamá Segura, contáctanos y te daremos el soporte para que puedas recibir y acceder al material.`,
    ],

    medico: [
      `Todo el contenido, ebooks, guías, checklists, registros y demás materiales ofrecidos dentro del Kit Mamá Segura tienen fines exclusivamente educativos, informativos y organizativos. La información proporcionada no constituye diagnóstico, tratamiento, prescripción ni recomendación médica individualizada y no sustituye la evaluación de pediatras, médicos, nutricionistas, psicólogos u otros profesionales cualificados. Ante síntomas, emergencias, dudas médicas o decisiones relacionadas con la salud de la madre o del bebé, se recomienda acudir a un profesional de salud apropiado.`,

      `El contenido del Kit Mamá Segura tiene fines exclusivamente educativos, informativos y organizativos. No constituye diagnóstico, tratamiento, prescripción ni recomendación médica individualizada y no sustituye la evaluación de profesionales cualificados. Ante síntomas, emergencias, dudas médicas o decisiones relacionadas con la salud de la madre o del bebé, se recomienda acudir a un profesional de salud apropiado.`,
    ],

    ayuda: [
      `El Kit Mamá Segura tiene garantía posterior a la compra. En caso de existir problemas con su descarga posterior a haber confirmado el pago, el soporte de Mamá Segura estará al pendiente para solucionar cualquier problema y puedas disfrutar de todo el material para sentirte más tranquila en esta etapa.`,

      `El Kit Mamá Segura cuenta con garantía posterior a la compra. Si existe algún problema con la descarga después de haber confirmado el pago, el soporte de Mamá Segura estará al pendiente para ayudarte a solucionarlo y puedas disfrutar de todo el material.`,
    ],

    tiempo: [
      `El cliente recibe su Kit Mamá Segura de manera inmediata, posterior a haber recibido y comprobado el pago realizado por transferencia, pago QR o Yape.`,

      `Recibes tu Kit Mamá Segura de manera inmediata después de que hayamos recibido y comprobado el pago realizado por transferencia, pago QR o Yape.`,
    ],

    incluye: [
      `El Kit Mamá Segura te incluye: guías prácticas de Maternidad, checklists para Organizarte, registros de Sueño, Lactancia y Actividades, orientación sobre Alimentación y Crecimiento, y recursos para tu Bienestar como Mamá.`,

      `Dentro del Kit Mamá Segura encontrarás guías prácticas de Maternidad, checklists para Organizarte, registros de Sueño, Lactancia y Actividades, orientación sobre Alimentación y Crecimiento, y recursos para tu Bienestar como Mamá.`,
    ],

    edad: [
      `El Kit Mamá Segura es una guía para las mamás de bebés de 0 a 3 años, y adquiriendo la oferta adicional cubres hasta los 5 años con actividades.`,

      `El Kit Mamá Segura está pensado para mamás de bebés de 0 a 3 años y, adquiriendo la oferta adicional, cubres hasta los 5 años con actividades.`,
    ],

    precio: [
      `El precio del Kit Mamá Segura es de 89 bolivianos. Los métodos de pago disponibles son pago por transferencia, pago mediante QR o pago por Yape.`,

      `El Kit Mamá Segura tiene un precio de 89 bolivianos. Puedes realizar el pago por transferencia, mediante QR o por Yape.`,
    ],

    utilizar: [
      `Sí puedes utilizar el Kit Mamá Segura desde tu celular, pero recomendamos descargar el material, guardarlo y en algunos casos imprimirlos, como los check lists, para sacarle provecho a todo el material.`,

      `Puedes utilizar el Kit Mamá Segura desde tu celular. Recomendamos descargar el material, guardarlo y, en algunos casos, imprimirlo, como los check lists, para sacarle provecho a todo el material.`,
    ],

    entrega: [
      `El Kit Mamá Segura es un producto digital, recibes el material mediante un link para descargarlo.`,

      `El Kit Mamá Segura es digital. Recibes el material mediante un link para descargarlo.`,
    ],

    recibo: [
      `El Kit Mamá Segura lo recibes de manera digital, mediante un link en el que encontrarás todas las guías, registros y checklist que contiene la oferta para su descarga y guardado.`,

      `Recibes el Kit Mamá Segura de manera digital mediante un link, donde encontrarás todas las guías, registros y checklist que contiene la oferta para su descarga y guardado.`,
    ],
  };

  const respuesta =
    elegirAleatoria(
      respuestas[intencion]
    );

  return {
    intencion,

    respuesta:
      intencion === "precio"
        ? agregarCierre(
            respuesta,
            textoNormalizado
          )
        : respuesta,
  };
}

/*
|--------------------------------------------------------------------------
| EXTRAER MENSAJE DE N8N
|--------------------------------------------------------------------------
*/
function extraerMensaje(body) {
  if (!body) {
    return "";
  }

  if (
    typeof body === "string"
  ) {
    return body.trim();
  }

  const candidatos = [
    body.mensaje,
    body.texto,
    body.message,
    body.text,

    body.body?.mensaje,
    body.body?.texto,
    body.body?.message,

    body.data?.mensaje,
    body.data?.texto,
    body.data?.message,

    body.payload?.mensaje,
    body.payload?.texto,
    body.payload?.message,
  ];

  const encontrado =
    candidatos.find(
      (valor) =>
        typeof valor === "string" &&
        valor.trim()
    );

  return encontrado
    ? encontrado.trim()
    : "";
}

/*
|--------------------------------------------------------------------------
| SERVIDOR ACTIVO
|--------------------------------------------------------------------------
*/
app.get(
  "/",
  (req, res) => {
    return res
      .status(200)
      .json({
        estado: "activo",
        servicio:
          "Agente Mamá Segura",
        agente:
          "Lucía Vega",
        endpoint:
          "POST /mensaje",
      });
  }
);

app.get(
  "/health",
  (req, res) => {
    return res
      .status(200)
      .json({
        estado: "ok",
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
      /*
       * Este log es fundamental.
       * Si no aparece en Railway,
       * n8n no está llegando al servidor.
       */
      console.log(
        "[POST /mensaje] solicitud recibida"
      );

      /*
       * Mostramos únicamente las claves,
       * nunca el contenido privado.
       */
      console.log(
        "Body keys:",
        req.body &&
          typeof req.body ===
            "object"
          ? Object.keys(req.body)
          : []
      );

      const texto =
        extraerMensaje(
          req.body
        );

      console.log(
        "Mensaje recibido:",
        texto
          ? `[contenido recibido: ${texto.length} caracteres]`
          : "[vacío]"
      );

      if (!texto) {
        console.log(
          "Intención detectada: mensaje_vacio"
        );

        return res
          .status(200)
          .json({
            respuesta:
              "No pude identificar el mensaje. Por favor, escríbelo nuevamente.",
          });
      }

      const textoNormalizado =
        normalizarTexto(
          texto
        );

      /*
       * Primero respondemos
       * desde la base de conocimiento.
       */
      const directa =
        respuestaDirecta(
          textoNormalizado
        );

      if (directa) {
        console.log(
          "Intención detectada:",
          directa.intencion
        );

        console.log(
          "Respuesta enviada: base_conocimiento"
        );

        return res
          .status(200)
          .json({
            respuesta:
              directa.respuesta,
          });
      }

      /*
       * OpenAI solo se utiliza
       * cuando no hubo coincidencia.
       */
      console.log(
        "Intención detectada: consulta_abierta"
      );

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

      try {
        const response =
          await openai.responses.create({
            model:
              "gpt-4.1-mini",

            temperature:
              0.3,

            instructions:
              SYSTEM_PROMPT,

            input:
              texto,
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
