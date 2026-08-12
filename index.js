require("dotenv").config();

const express = require("express");
const OpenAI = require("openai");

const app = express();
app.use(express.json());

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  : null;

const PORT = process.env.PORT || 8080;

const SYSTEM_PROMPT = `
Eres Lucía Vega, asistente de Mamá Segura.
Tu trabajo es responder dudas por WhatsApp sobre el producto digital "Kit Mamá Segura".

PERSONALIDAD Y TONO:
- Suave, cálida, clara, resolutiva, humana y empática.
- Habla de forma cordial y sencilla, sin sonar demasiado formal.
- Nunca suenes robótica.
- Nunca digas que eres un bot.
- Responde máximo en 1 o 2 párrafos cortos.
- Varía ligeramente la redacción sin alterar el significado de la información oficial.

REGLAS:
- NO inventes información.
- NO supongas información.
- Utiliza exclusivamente la información oficial de Mamá Segura incluida en esta base de conocimiento.
- NO cambies precios, métodos de pago, tiempos de entrega, condiciones, garantías ni características del producto.
- NO agregues productos, beneficios, promociones, bonos, devoluciones o reembolsos que no hayan sido proporcionados oficialmente.
- NO asegures algo que no aparezca en la información oficial.
- NO hagas preguntas abiertas innecesarias.
- NO presiones al usuario.
- Cuando no exista información suficiente, indica de forma natural que necesitas confirmar ese dato con el equipo de Mamá Segura.
- Si preguntan específicamente por devoluciones o reembolsos, indica que esa información debe confirmarse con el equipo de Mamá Segura. No afirmes que existen ni que no existen.
- No realices diagnósticos, tratamientos, prescripciones ni recomendaciones médicas individualizadas.

INFORMACIÓN REAL Y AUTORIZADA:

NEGOCIO:
- Nombre: Mamá Segura.
- Agente: Lucía Vega.
- Producto: Kit Mamá Segura.
- Tipo de producto: digital.
- Objetivo del agente: resolver dudas frecuentes del avatar.
- Tono: suave, cálido, claro y resolutivo.
- Métodos de pago: transferencia, pago QR y Yape.
- Forma de entrega: link de descarga digital.
- Llamado a la acción autorizado: "Presiona el botón de abajo, escríbenos por WhatsApp ahora y recibe tu Kit Mamá Segura".

BASE DE CONOCIMIENTO:

1. ¿Cómo recibe el cliente el Kit Mamá Segura después de realizar la compra?
Respuesta oficial:
El Kit Mamá Segura lo recibes de manera digital, mediante un link en el que encontrarás todas las guías, registros y checklist que contiene la oferta para su descarga y guardado.

2. ¿Cuánto tiempo demora el cliente en recibir el Kit Mamá Segura después de realizar el pago?
Respuesta oficial:
El cliente recibe su Kit Mamá Segura de manera inmediata, posterior a haber recibido y comprobado el pago realizado por transferencia, pago QR o Yape.

3. ¿Qué incluye exactamente el Kit Mamá Segura?
Respuesta oficial:
El Kit Mamá Segura te incluye:
- Guías prácticas de Maternidad.
- Checklists para Organizarte.
- Registros de Sueño, Lactancia y Actividades.
- Orientación sobre Alimentación y Crecimiento.
- Recursos para tu Bienestar como Mamá.

4. ¿Para qué edades del bebé o niño está pensado el Kit Mamá Segura?
Respuesta oficial:
El Kit Mamá Segura es una guía para las mamás de bebés de 0 a 3 años, y adquiriendo la oferta adicional cubres hasta los 5 años con actividades.

5. ¿Cuál es el precio del Kit Mamá Segura y qué métodos de pago están disponibles?
Respuesta oficial:
El precio del Kit Mamá Segura es de 89 bolivianos. Los métodos de pago disponibles son pago por transferencia, pago mediante QR o pago por Yape.

6. ¿El Kit Mamá Segura es un producto físico o digital?
Respuesta oficial:
El Kit Mamá Segura es un producto digital, recibes el material mediante un link para descargarlo.

7. ¿Puedo utilizar el Kit Mamá Segura desde mi celular o necesito imprimir los materiales?
Respuesta oficial:
Sí puedes utilizar el Kit Mamá Segura desde tu celular, pero recomendamos descargar el material, guardarlo y en algunos casos imprimirlos, como los check lists, para sacarle provecho a todo el material.

8. ¿Qué hago si tengo problemas para abrir, descargar o acceder a los archivos del Kit Mamá Segura?
Respuesta oficial:
Si tienes algún problema para abrir o descargar tu Kit Mamá Segura, nos contactas y te daremos el soporte para que puedas recibir y acceder al material.

9. ¿El Kit Mamá Segura reemplaza la orientación de un pediatra o profesional de salud?
Respuesta oficial:
Todo el contenido, ebooks, guías, checklists, registros y demás materiales ofrecidos dentro del Kit Mamá Segura tienen fines exclusivamente educativos, informativos y organizativos.

La información proporcionada no constituye diagnóstico, tratamiento, prescripción ni recomendación médica individualizada y no sustituye la evaluación de pediatras, médicos, nutricionistas, psicólogos u otros profesionales cualificados.

Ante síntomas, emergencias, dudas médicas o decisiones relacionadas con la salud de la madre o del bebé, se recomienda acudir a un profesional de salud apropiado.

10. Garantía posterior a la compra.
Respuesta oficial:
El Kit Mamá Segura tiene garantía posterior a la compra. En caso de existir problemas con su descarga posterior a haber confirmado el pago, el soporte de Mamá Segura estará al pendiente para solucionar cualquier problema y puedas disfrutar de todo el material para sentirte más tranquila en esta etapa.

IMPORTANTE SOBRE DEVOLUCIONES Y REEMBOLSOS:
No se proporcionó una política oficial de devoluciones o reembolsos.

Si el usuario pregunta por cualquiera de estos temas, debes indicar que necesitas confirmar esa información con el equipo de Mamá Segura.

OBJETIVO DE LA CONVERSACIÓN:
- Resolver la duda de manera breve, clara, cálida y útil.
- Mantener una conversación humana y sencilla.
- Utilizar un cierre comercial únicamente cuando el usuario pregunte por precio, métodos de pago o manifieste claramente intención de comprar.
- No agregar cierres comerciales en consultas de soporte, garantía, salud, devoluciones, reembolsos o problemas de acceso posteriores a la compra.
`;

function normalizarTexto(texto) {
  return String(texto || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function elegirAleatoria(opciones) {
  return opciones[Math.floor(Math.random() * opciones.length)];
}

function limpiarRespuesta(texto) {
  texto = String(texto || "").trim();

  texto = texto
    .replace(/^¡?\s*hola\s*[😊🙏❤️✨💛,.!]*\s*/gi, "")
    .replace(/^gracias por preguntar\s*[😊🙏❤️✨💛,.!]*\s*/gi, "")
    .replace(/^buenos días\s*[😊🙏❤️✨💛,.!]*\s*/gi, "")
    .replace(/^buenos dias\s*[😊🙏❤️✨💛,.!]*\s*/gi, "")
    .replace(/^buenas tardes\s*[😊🙏❤️✨💛,.!]*\s*/gi, "")
    .replace(/^buenas noches\s*[😊🙏❤️✨💛,.!]*\s*/gi, "");

  texto = texto
    .replace(
      /¿[^?]*(quieres saber más|quieres saber mas|te interesa|te gustaría|te gustaria|te ayudo en algo más|te ayudo en algo mas|quieres que te cuente)[^?]*\?/gi,
      ""
    )
    .replace(/\s{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return texto;
}

function cierreComercial() {
  const cierres = [
    `💛 Presiona el botón de abajo, escríbenos por WhatsApp ahora y recibe tu Kit Mamá Segura.`,

    `💛 Si deseas recibir tu Kit Mamá Segura, presiona el botón de abajo y escríbenos por WhatsApp ahora.`,

    `💛 Para continuar y recibir tu Kit Mamá Segura, presiona el botón de abajo y escríbenos por WhatsApp ahora.`,
  ];

  return elegirAleatoria(cierres);
}

function debeAgregarCierre(textoNormalizado) {
  if (
    textoNormalizado.includes("devolucion") ||
    textoNormalizado.includes("devolver") ||
    textoNormalizado.includes("reembolso") ||
    textoNormalizado.includes("garantia") ||
    textoNormalizado.includes("problema") ||
    textoNormalizado.includes("soporte") ||
    textoNormalizado.includes("no puedo abrir") ||
    textoNormalizado.includes("no puedo descargar") ||
    textoNormalizado.includes("no puedo acceder") ||
    textoNormalizado.includes("medico") ||
    textoNormalizado.includes("pediatra") ||
    textoNormalizado.includes("diagnostico") ||
    textoNormalizado.includes("tratamiento") ||
    textoNormalizado.includes("prescripcion") ||
    textoNormalizado.includes("emergencia") ||
    textoNormalizado.includes("sintomas")
  ) {
    return false;
  }

  return (
    textoNormalizado.includes("precio") ||
    textoNormalizado.includes("cuanto cuesta") ||
    textoNormalizado.includes("costo") ||
    textoNormalizado.includes("comprar") ||
    textoNormalizado.includes("quiero el kit") ||
    textoNormalizado.includes("quiero comprar") ||
    textoNormalizado.includes("como pago") ||
    textoNormalizado.includes("metodo de pago") ||
    textoNormalizado.includes("transferencia") ||
    textoNormalizado.includes("pago qr") ||
    textoNormalizado.includes("yape")
  );
}

function agregarCierre(texto, textoNormalizado) {
  const limpio = limpiarRespuesta(texto);

  if (!limpio) {
    return "Necesito confirmar ese dato con el equipo de Mamá Segura para darte una respuesta correcta.";
  }

  if (!debeAgregarCierre(textoNormalizado)) {
    return limpio;
  }

  return `${limpio}\n\n${cierreComercial()}`;
}

function respuestaDirecta(textoNormalizado) {
  /*
   * DEVOLUCIONES / REEMBOLSOS
   */

  if (
    textoNormalizado.includes("devolucion") ||
    textoNormalizado.includes("devolver") ||
    textoNormalizado.includes("reembolso") ||
    textoNormalizado.includes("reembolsar")
  ) {
    const respuestas = [
      `Necesito confirmar con el equipo de Mamá Segura la información sobre devoluciones o reembolsos para darte una respuesta correcta.`,

      `La información sobre devoluciones o reembolsos necesito confirmarla con el equipo de Mamá Segura antes de responderte.`,
    ];

    return {
      intencion: "devolucion_reembolso",
      respuesta: elegirAleatoria(respuestas),
    };
  }

  /*
   * INTENCIÓN 9
   * MÉDICO / SALUD
   */

  if (
    textoNormalizado.includes("medico") ||
    textoNormalizado.includes("pediatra") ||
    textoNormalizado.includes("diagnostico") ||
    textoNormalizado.includes("tratamiento") ||
    textoNormalizado.includes("prescripcion") ||
    textoNormalizado.includes("nutricionista") ||
    textoNormalizado.includes("psicologo") ||
    textoNormalizado.includes("sintomas") ||
    textoNormalizado.includes("emergencia") ||
    textoNormalizado.includes("profesional de salud") ||
    textoNormalizado.includes("reemplaza al pediatra") ||
    textoNormalizado.includes("reemplaza al medico")
  ) {
    const respuestas = [
      `Todo el contenido, ebooks, guías, checklists, registros y demás materiales ofrecidos dentro del Kit Mamá Segura tienen fines exclusivamente educativos, informativos y organizativos. La información proporcionada no constituye diagnóstico, tratamiento, prescripción ni recomendación médica individualizada y no sustituye la evaluación de pediatras, médicos, nutricionistas, psicólogos u otros profesionales cualificados. Ante síntomas, emergencias, dudas médicas o decisiones relacionadas con la salud de la madre o del bebé, se recomienda acudir a un profesional de salud apropiado.`,

      `El contenido del Kit Mamá Segura tiene fines exclusivamente educativos, informativos y organizativos. No constituye diagnóstico, tratamiento, prescripción ni recomendación médica individualizada, ni sustituye la evaluación de pediatras, médicos, nutricionistas, psicólogos u otros profesionales cualificados. Ante síntomas, emergencias, dudas médicas o decisiones relacionadas con la salud de la madre o del bebé, se recomienda acudir a un profesional de salud apropiado.`,
    ];

    return {
      intencion: "orientacion_medica",
      respuesta: elegirAleatoria(respuestas),
    };
  }

  /*
   * INTENCIÓN 8
   * PROBLEMAS PARA ABRIR / DESCARGAR / ACCEDER
   */

  if (
    textoNormalizado.includes("problema para abrir") ||
    textoNormalizado.includes("problema al abrir") ||
    textoNormalizado.includes("problema para descargar") ||
    textoNormalizado.includes("problema al descargar") ||
    textoNormalizado.includes("problema para acceder") ||
    textoNormalizado.includes("problema con el link") ||
    textoNormalizado.includes("no puedo abrir") ||
    textoNormalizado.includes("no puedo descargar") ||
    textoNormalizado.includes("no puedo acceder") ||
    textoNormalizado.includes("link no funciona") ||
    textoNormalizado.includes("descarga no funciona")
  ) {
    const respuestas = [
      `Si tienes algún problema para abrir o descargar tu Kit Mamá Segura, nos contactas y te daremos el soporte para que puedas recibir y acceder al material.`,

      `Si tienes algún problema para abrir, descargar o acceder a tu Kit Mamá Segura, contáctanos y te daremos el soporte para que puedas recibir y acceder al material.`,

      `Si tienes dificultades para abrir o descargar tu Kit Mamá Segura, contáctanos y te daremos soporte para que puedas recibir y acceder al material.`,
    ];

    return {
      intencion: "problema_descarga",
      respuesta: elegirAleatoria(respuestas),
    };
  }

  /*
   * INTENCIÓN 10
   * GARANTÍA
   */

  if (
    textoNormalizado.includes("garantia") ||
    textoNormalizado.includes("garantia del producto") ||
    textoNormalizado.includes("garantia del kit") ||
    (
      textoNormalizado.includes("ayuda") &&
      (
        textoNormalizado.includes("descarga") ||
        textoNormalizado.includes("despues de comprar") ||
        textoNormalizado.includes("despues del pago")
      )
    )
  ) {
    const respuestas = [
      `El Kit Mamá Segura tiene garantía posterior a la compra. En caso de existir problemas con su descarga posterior a haber confirmado el pago, el soporte de Mamá Segura estará al pendiente para solucionar cualquier problema y puedas disfrutar de todo el material para sentirte más tranquila en esta etapa.`,

      `El Kit Mamá Segura cuenta con garantía posterior a la compra. Si existe algún problema con la descarga después de haber confirmado el pago, el soporte de Mamá Segura estará al pendiente para ayudarte a solucionarlo y puedas disfrutar de todo el material para sentirte más tranquila en esta etapa.`,
    ];

    return {
      intencion: "garantia",
      respuesta: elegirAleatoria(respuestas),
    };
  }

  /*
   * INTENCIÓN 7
   * UTILIZAR EL MATERIAL
   */

  if (
    textoNormalizado.includes("utilizar") ||
    textoNormalizado.includes("usar el kit") ||
    textoNormalizado.includes("desde mi celular") ||
    textoNormalizado.includes("en mi celular") ||
    textoNormalizado.includes("puedo imprimir") ||
    textoNormalizado.includes("debo imprimir") ||
    textoNormalizado.includes("necesito imprimir") ||
    textoNormalizado.includes("check lists") ||
    textoNormalizado.includes("checklist")
  ) {
    const respuestas = [
      `Sí puedes utilizar el Kit Mamá Segura desde tu celular, pero recomendamos descargar el material, guardarlo y en algunos casos imprimirlos, como los check lists, para sacarle provecho a todo el material.`,

      `Puedes utilizar el Kit Mamá Segura desde tu celular. Recomendamos descargar el material, guardarlo y, en algunos casos, imprimirlo, como los check lists, para sacarle provecho a todo el material.`,

      `Sí, puedes utilizar el Kit Mamá Segura desde tu celular. También recomendamos descargar y guardar el material y, en algunos casos, imprimir los check lists para aprovechar todo el contenido.`,
    ];

    return {
      intencion: "utilizar_material",
      respuesta: elegirAleatoria(respuestas),
    };
  }

  /*
   * INTENCIÓN 2
   * TIEMPO DE ENTREGA
   */

  if (
    textoNormalizado.includes("tiempo") ||
    textoNormalizado.includes("cuanto demora") ||
    textoNormalizado.includes("cuanto tarda") ||
    textoNormalizado.includes("cuando recibo") ||
    textoNormalizado.includes("cuando llega") ||
    textoNormalizado.includes("es inmediato") ||
    textoNormalizado.includes("entrega inmediata")
  ) {
    const respuestas = [
      `El cliente recibe su Kit Mamá Segura de manera inmediata, posterior a haber recibido y comprobado el pago realizado por transferencia, pago QR o Yape.`,

      `Recibes tu Kit Mamá Segura de manera inmediata después de que hayamos recibido y comprobado tu pago por transferencia, pago QR o Yape.`,

      `La entrega del Kit Mamá Segura es inmediata una vez que recibimos y comprobamos el pago realizado por transferencia, pago QR o Yape.`,
    ];

    return {
      intencion: "tiempo_entrega",
      respuesta: elegirAleatoria(respuestas),
    };
  }

  /*
   * INTENCIÓN 3
   * CONTENIDO
   */

  if (
    textoNormalizado.includes("incluye") ||
    textoNormalizado.includes("que trae") ||
    textoNormalizado.includes("que contiene") ||
    textoNormalizado.includes("contenido del kit")
  ) {
    const respuestas = [
      `El Kit Mamá Segura te incluye:
- Guías prácticas de Maternidad.
- Checklists para Organizarte.
- Registros de Sueño, Lactancia y Actividades.
- Orientación sobre Alimentación y Crecimiento.
- Recursos para tu Bienestar como Mamá.`,

      `El Kit Mamá Segura incluye guías prácticas de Maternidad, checklists para Organizarte, registros de Sueño, Lactancia y Actividades, orientación sobre Alimentación y Crecimiento y recursos para tu Bienestar como Mamá.`,

      `Dentro del Kit Mamá Segura encontrarás guías prácticas de Maternidad, checklists para Organizarte, registros de Sueño, Lactancia y Actividades, orientación sobre Alimentación y Crecimiento y recursos para tu Bienestar como Mamá.`,
    ];

    return {
      intencion: "contenido_kit",
      respuesta: elegirAleatoria(respuestas),
    };
  }

  /*
   * INTENCIÓN 4
   * EDAD
   */

  if (
    textoNormalizado.includes("edad") ||
    textoNormalizado.includes("edades") ||
    textoNormalizado.includes("0 a 3") ||
    textoNormalizado.includes("hasta los 3") ||
    textoNormalizado.includes("hasta los 5") ||
    textoNormalizado.includes("para que anos")
  ) {
    const respuestas = [
      `El Kit Mamá Segura es una guía para las mamás de bebés de 0 a 3 años, y adquiriendo la oferta adicional cubres hasta los 5 años con actividades.`,

      `El Kit Mamá Segura está pensado para mamás de bebés de 0 a 3 años y, adquiriendo la oferta adicional, cubres hasta los 5 años con actividades.`,

      `La guía Kit Mamá Segura cubre la etapa de 0 a 3 años y, con la oferta adicional, cubres hasta los 5 años con actividades.`,
    ];

    return {
      intencion: "edad_kit",
      respuesta: elegirAleatoria(respuestas),
    };
  }

  /*
   * INTENCIÓN 5
   * PRECIO Y MÉTODOS DE PAGO
   */

  if (
    textoNormalizado.includes("precio") ||
    textoNormalizado.includes("cuanto cuesta") ||
    textoNormalizado.includes("costo") ||
    textoNormalizado.includes("89 bolivianos") ||
    textoNormalizado.includes("metodo de pago") ||
    textoNormalizado.includes("metodos de pago") ||
    textoNormalizado.includes("como pago") ||
    textoNormalizado.includes("transferencia") ||
    textoNormalizado.includes("pago qr") ||
    textoNormalizado.includes("yape") ||
    textoNormalizado.includes("quiero comprar")
  ) {
    const respuestas = [
      `El precio del Kit Mamá Segura es de 89 bolivianos. Los métodos de pago disponibles son pago por transferencia, pago mediante QR o pago por Yape.`,

      `El Kit Mamá Segura tiene un precio de 89 bolivianos. Puedes realizar el pago por transferencia, mediante QR o por Yape.`,

      `El precio del Kit Mamá Segura es de 89 bolivianos y los métodos de pago disponibles son transferencia, pago mediante QR o Yape.`,
    ];

    return {
      intencion: "precio_pago",
      respuesta: agregarCierre(
        elegirAleatoria(respuestas),
        textoNormalizado
      ),
    };
  }

  /*
   * INTENCIÓN 6
   * PRODUCTO DIGITAL / FORMA DE ENTREGA
   */

  if (
    textoNormalizado.includes("es digital") ||
    textoNormalizado.includes("es fisico") ||
    textoNormalizado.includes("producto digital") ||
    textoNormalizado.includes("producto fisico") ||
    textoNormalizado.includes("formato digital") ||
    textoNormalizado.includes("formato fisico") ||
    textoNormalizado.includes("viene impreso") ||
    (
      textoNormalizado.includes("entrega") &&
      (
        textoNormalizado.includes("digital") ||
        textoNormalizado.includes("fisico") ||
        textoNormalizado.includes("link") ||
        textoNormalizado.includes("descarga")
      )
    )
  ) {
    const respuestas = [
      `El Kit Mamá Segura es un producto digital, recibes el material mediante un link para descargarlo.`,

      `El Kit Mamá Segura es digital. Recibes el material mediante un link para descargarlo.`,

      `El producto es digital y recibes el material del Kit Mamá Segura mediante un link para descargarlo.`,
    ];

    return {
      intencion: "producto_digital",
      respuesta: elegirAleatoria(respuestas),
    };
  }

  /*
   * INTENCIÓN 1
   * CÓMO RECIBE EL KIT
   */

  if (
    textoNormalizado.includes("como recibo") ||
    textoNormalizado.includes("como lo recibo") ||
    textoNormalizado.includes("como recibire") ||
    textoNormalizado.includes("recibo el kit") ||
    textoNormalizado.includes("recibir el kit") ||
    textoNormalizado.includes("como me llega") ||
    textoNormalizado.includes("link de descarga") ||
    (
      textoNormalizado.includes("recibo") &&
      (
        textoNormalizado.includes("kit") ||
        textoNormalizado.includes("material") ||
        textoNormalizado.includes("link")
      )
    )
  ) {
    const respuestas = [
      `El Kit Mamá Segura lo recibes de manera digital, mediante un link en el que encontrarás todas las guías, registros y checklist que contiene la oferta para su descarga y guardado.`,

      `Recibes el Kit Mamá Segura de manera digital mediante un link, donde encontrarás todas las guías, registros y checklist que contiene la oferta para descargarlos y guardarlos.`,

      `Tu Kit Mamá Segura se entrega de manera digital mediante un link con todas las guías, registros y checklist de la oferta para su descarga y guardado.`,
    ];

    return {
      intencion: "recibir_kit",
      respuesta: elegirAleatoria(respuestas),
    };
  }

  return null;
}

app.get("/", (req, res) => {
  res.send("Agente de soporte Mamá Segura activo ✅");
});

app.post("/mensaje", async (req, res) => {
  try {
    const body = req.body || {};
    const bodyAnidado = body.body || {};

    const texto =
      body.texto ||
      body.mensaje ||
      body.message ||
      bodyAnidado.texto ||
      bodyAnidado.mensaje ||
      bodyAnidado.message ||
      "";

    console.log(
      "Mensaje recibido:",
      texto ? "[contenido recibido]" : "[vacío]"
    );

    if (!texto) {
      console.log("Intención detectada: mensaje_vacio");
      console.log("Respuesta enviada: mensaje_vacio");

      return res.json({
        respuesta:
          "No pude identificar el mensaje. Por favor, escríbelo nuevamente.",
      });
    }

    const textoNormalizado = normalizarTexto(texto);

    const directa = respuestaDirecta(textoNormalizado);

    if (directa) {
      console.log(
        "Intención detectada:",
        directa.intencion
      );

      console.log(
        "Respuesta enviada: base_conocimiento"
      );

      return res.json({
        respuesta: directa.respuesta,
      });
    }

    console.log(
      "Intención detectada: consulta_abierta"
    );

    if (!openai) {
      console.log(
        "Respuesta enviada: openai_no_configurado"
      );

      return res.json({
        respuesta:
          "Necesito confirmar ese dato con el equipo de Mamá Segura para darte una respuesta correcta.",
      });
    }

    const response =
      await openai.responses.create({
        model: "gpt-4.1-mini",
        temperature: 0.4,
        input: [
          {
            role: "system",
            content: SYSTEM_PROMPT,
          },
          {
            role: "user",
            content: texto,
          },
        ],
      });

    const respuestaIA =
      response.output_text || "";

    const respuestaFinal =
      agregarCierre(
        respuestaIA,
        textoNormalizado
      );

    console.log(
      "Respuesta enviada: OpenAI"
    );

    return res.json({
      respuesta: respuestaFinal,
    });
  } catch (error) {
    console.error(
      "Error en /mensaje:",
      error && error.message
        ? error.message
        : "Error desconocido"
    );

    return res.status(200).json({
      respuesta:
        "En este momento no pude procesar tu mensaje. Por favor, inténtalo nuevamente en unos minutos.",
    });
  }
});

app.use((error, req, res, next) => {
  console.error(
    "Error del servidor:",
    error && error.message
      ? error.message
      : "Error desconocido"
  );

  if (res.headersSent) {
    return next(error);
  }

  return res.status(200).json({
    respuesta:
      "No pude identificar el mensaje. Por favor, escríbelo nuevamente.",
  });
});

app.listen(
  PORT,
  "0.0.0.0",
  () => {
    console.log(
      `Servidor corriendo en puerto ${PORT}`
    );
  }
);
