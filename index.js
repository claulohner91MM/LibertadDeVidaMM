require("dotenv").config();

const express = require("express");
const OpenAIModule = require("openai");

const OpenAI =
  OpenAIModule.OpenAI ||
  OpenAIModule.default ||
  OpenAIModule;

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

Tu trabajo es responder por WhatsApp dudas frecuentes sobre el producto digital Kit Mamá Segura.

PERSONALIDAD Y TONO:
- Suave, cálido, claro y resolutivo.
- Habla de forma humana, empática, cordial y sencilla.
- Nunca suenes robótico.
- No digas que eres un bot.
- No uses un tono demasiado formal.
- Responde de forma breve y útil, idealmente en uno o dos párrafos cortos.

REGLAS DE COMPORTAMIENTO:
- Utiliza exclusivamente la información oficial incluida en esta base de conocimiento.
- No inventes información.
- No supongas información que no haya sido proporcionada.
- No agregues productos, precios, condiciones, métodos de pago, garantías, devoluciones, reembolsos, beneficios o promociones que no estén autorizados.
- No contradigas las respuestas oficiales del negocio.
- No asegures algo que no aparezca en la información oficial.
- No hagas preguntas abiertas innecesarias.
- No presiones al usuario.
- Si no existe información suficiente para responder, indica de manera natural que necesitas confirmar ese dato con el equipo de Mamá Segura.
- Si preguntan específicamente por devoluciones o reembolsos, no afirmes que existen ni que no existen. Indica que esa información debe confirmarse con el equipo de Mamá Segura.
- El contenido del Kit Mamá Segura es educativo, informativo y organizativo.
- No realices diagnósticos, tratamientos, prescripciones ni recomendaciones médicas individualizadas.

INFORMACIÓN OFICIAL DEL NEGOCIO:
- Nombre del negocio: Mamá Segura.
- Nombre del agente: Lucía Vega.
- Producto: Kit Mamá Segura.
- Tipo de producto: digital.
- Objetivo del agente: resolver dudas frecuentes del avatar.
- Métodos de pago disponibles: transferencia, pago mediante QR y Yape.
- Forma de entrega: link de descarga digital.
- Llamado a la acción autorizado: "Presiona el botón de abajo, escríbenos por WhatsApp ahora y recibe tu Kit Mamá Segura".

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
Los métodos de pago disponibles son pago por transferencia, pago mediante QR o pago por Yape.

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

10. GARANTÍA POSTERIOR A LA COMPRA
El Kit Mamá Segura tiene garantía posterior a la compra.

En caso de existir problemas con su descarga posterior a haber confirmado el pago, el soporte de Mamá Segura estará al pendiente para solucionar cualquier problema y puedas disfrutar de todo el material para sentirte más tranquila en esta etapa.

No existe información oficial proporcionada sobre devoluciones o reembolsos.

Si el usuario pregunta por devoluciones o reembolsos, indica que debes confirmar ese dato con el equipo de Mamá Segura.

OBJETIVO DE LA CONVERSACIÓN:
- Resolver la duda de forma breve, clara y útil.
- Mantener un tono suave, cálido, humano y resolutivo.
- Dar información comercial únicamente cuando corresponda.
- Utilizar el llamado a la acción solamente cuando exista una intención clara de compra, precio o método de pago.
- No agregar cierres comerciales en consultas de soporte, salud, garantía, devoluciones, reembolsos o problemas posteriores a la compra.
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
  if (!Array.isArray(opciones) || opciones.length === 0) {
    return "";
  }

  return opciones[
    Math.floor(Math.random() * opciones.length)
  ];
}

function limpiarRespuesta(texto) {
  return String(texto || "")
    .trim()
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n");
}

function incluyeAlguna(
  textoNormalizado,
  opciones
) {
  return opciones.some((opcion) =>
    textoNormalizado.includes(
      normalizarTexto(opcion)
    )
  );
}

function cierreComercial() {
  const cierres = [
    "Presiona el botón de abajo, escríbenos por WhatsApp ahora y recibe tu Kit Mamá Segura.",

    "Si deseas continuar, presiona el botón de abajo, escríbenos por WhatsApp ahora y recibe tu Kit Mamá Segura.",

    "Para recibir tu Kit Mamá Segura, presiona el botón de abajo y escríbenos por WhatsApp ahora.",
  ];

  return elegirAleatoria(cierres);
}

function debeAgregarCierre(
  textoNormalizado
) {
  const contextoSinCierre =
    incluyeAlguna(textoNormalizado, [
      "problema",
      "no puedo abrir",
      "no puedo descargar",
      "no puedo acceder",
      "soporte",
      "ayuda con la descarga",
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
    ]);

  if (contextoSinCierre) {
    return false;
  }

  return incluyeAlguna(
    textoNormalizado,
    [
      "precio",
      "cuanto cuesta",
      "costo",
      "comprar",
      "quiero comprar",
      "quiero el kit",
      "como pago",
      "metodo de pago",
      "metodos de pago",
      "transferencia",
      "pago qr",
      "qr",
      "yape",
    ]
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

function respuestaDirecta(
  textoNormalizado
) {
  /*
   * DEVOLUCIONES Y REEMBOLSOS
   * No existe una política oficial
   * proporcionada.
   */
  if (
    incluyeAlguna(
      textoNormalizado,
      [
        "devolucion",
        "devolver",
        "reembolso",
        "reembolsar",
        "devolver el dinero",
      ]
    )
  ) {
    const respuestas = [
      "Necesito confirmar con el equipo de Mamá Segura la información sobre devoluciones o reembolsos para darte una respuesta correcta.",

      "La información sobre devoluciones o reembolsos necesito confirmarla con el equipo de Mamá Segura antes de responderte.",
    ];

    return {
      intencion:
        "devolucion_reembolso_sin_informacion",
      respuesta:
        elegirAleatoria(respuestas),
    };
  }

  /*
   * INTENCIÓN 9
   * Información médica y de salud.
   */
  if (
    incluyeAlguna(
      textoNormalizado,
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
        "salud",
        "reemplaza al pediatra",
        "reemplaza al medico",
      ]
    )
  ) {
    const respuestas = [
      "Todo el contenido, ebooks, guías, checklists, registros y demás materiales ofrecidos dentro del Kit Mamá Segura tienen fines exclusivamente educativos, informativos y organizativos. La información proporcionada no constituye diagnóstico, tratamiento, prescripción ni recomendación médica individualizada y no sustituye la evaluación de pediatras, médicos, nutricionistas, psicólogos u otros profesionales cualificados. Ante síntomas, emergencias, dudas médicas o decisiones relacionadas con la salud de la madre o del bebé, se recomienda acudir a un profesional de salud apropiado.",

      "El contenido del Kit Mamá Segura tiene fines exclusivamente educativos, informativos y organizativos. No constituye diagnóstico, tratamiento, prescripción ni recomendación médica individualizada, ni sustituye la evaluación de pediatras, médicos, nutricionistas, psicólogos u otros profesionales cualificados. Ante síntomas, emergencias, dudas médicas o decisiones sobre la salud de la madre o del bebé, se recomienda acudir a un profesional de salud apropiado.",
    ];

    return {
      intencion: "salud_medica",
      respuesta:
        elegirAleatoria(respuestas),
    };
  }

  /*
   * INTENCIÓN 8
   * Problemas para abrir, descargar
   * o acceder al material.
   */
  const problemaAcceso =
    incluyeAlguna(
      textoNormalizado,
      [
        "no puedo abrir",
        "no abre",
        "no puedo descargar",
        "no descarga",
        "no puedo acceder",
        "problema para abrir",
        "problema para descargar",
        "problema para acceder",
        "problema con el link",
        "problema con el material",
        "problema con la descarga",
      ]
    ) ||
    (
      textoNormalizado.includes(
        "problema"
      ) &&
      incluyeAlguna(
        textoNormalizado,
        [
          "abrir",
          "descargar",
          "acceder",
          "link",
          "archivo",
          "material",
        ]
      )
    );

  if (problemaAcceso) {
    const respuestas = [
      "Si tienes algún problema para abrir o descargar tu Kit Mamá Segura, nos contactas y te daremos el soporte para que puedas recibir y acceder al material.",

      "Si tienes un problema para abrir o descargar tu Kit Mamá Segura, contáctanos y te daremos soporte para que puedas recibir y acceder al material.",

      "Si tienes dificultades para abrir, descargar o acceder a tu Kit Mamá Segura, contáctanos y te daremos el soporte necesario para que puedas recibir y acceder al material.",
    ];

    return {
      intencion:
        "problema_acceso_descarga",
      respuesta:
        elegirAleatoria(respuestas),
    };
  }

  /*
   * INTENCIÓN 10
   * Garantía posterior a la compra.
   */
  const consultaGarantia =
    incluyeAlguna(
      textoNormalizado,
      [
        "garantia",
        "garantia posterior",
        "garantia de compra",
        "garantia del kit",
      ]
    ) ||
    (
      textoNormalizado.includes(
        "ayuda"
      ) &&
      incluyeAlguna(
        textoNormalizado,
        [
          "despues de comprar",
          "despues del pago",
          "descarga",
          "kit",
          "material",
        ]
      )
    );

  if (consultaGarantia) {
    const respuestas = [
      "El Kit Mamá Segura tiene garantía posterior a la compra. En caso de existir problemas con su descarga posterior a haber confirmado el pago, el soporte de Mamá Segura estará al pendiente para solucionar cualquier problema y puedas disfrutar de todo el material para sentirte más tranquila en esta etapa.",

      "El Kit Mamá Segura cuenta con garantía posterior a la compra. Si existe algún problema con la descarga después de haber confirmado el pago, el soporte de Mamá Segura estará al pendiente para ayudarte a solucionarlo y puedas disfrutar de todo el material para sentirte más tranquila en esta etapa.",
    ];

    return {
      intencion:
        "garantia_post_compra",
      respuesta:
        elegirAleatoria(respuestas),
    };
  }

  /*
   * INTENCIÓN 7
   * Uso desde celular, descarga,
   * guardado e impresión.
   */
  const consultaUso =
    incluyeAlguna(
      textoNormalizado,
      [
        "puedo utilizar",
        "como utilizar",
        "utilizar el kit",
        "usar el kit",
        "desde mi celular",
        "en mi celular",
        "imprimir",
        "check lists",
        "checklist",
      ]
    ) ||
    (
      textoNormalizado.includes(
        "utilizar"
      ) &&
      incluyeAlguna(
        textoNormalizado,
        [
          "kit",
          "material",
          "celular",
          "descargar",
          "imprimir",
        ]
      )
    );

  if (consultaUso) {
    const respuestas = [
      "Sí puedes utilizar el Kit Mamá Segura desde tu celular, pero recomendamos descargar el material, guardarlo y en algunos casos imprimirlos, como los check lists, para sacarle provecho a todo el material.",

      "Puedes utilizar el Kit Mamá Segura desde tu celular. Recomendamos descargar y guardar el material y, en algunos casos, imprimirlo, como los check lists, para sacarle provecho a todo el material.",

      "Sí, puedes usar el Kit Mamá Segura desde tu celular. También recomendamos descargarlo, guardarlo y, cuando corresponda, imprimir materiales como los check lists para aprovechar todo el contenido.",
    ];

    return {
      intencion: "uso_material",
      respuesta:
        elegirAleatoria(respuestas),
    };
  }

  /*
   * INTENCIÓN 2
   * Tiempo de entrega.
   */
  const consultaTiempo =
    incluyeAlguna(
      textoNormalizado,
      [
        "cuanto tiempo",
        "tiempo de entrega",
        "tiempo para recibir",
        "cuanto demora",
        "cuanto tarda",
        "cuando recibo",
        "cuando llega",
        "es inmediato",
        "inmediato",
      ]
    ) ||
    (
      textoNormalizado.includes(
        "tiempo"
      ) &&
      incluyeAlguna(
        textoNormalizado,
        [
          "recibir",
          "entrega",
          "pago",
          "kit",
        ]
      )
    );

  if (consultaTiempo) {
    const respuestas = [
      "Recibes tu Kit Mamá Segura de manera inmediata, después de que hayamos recibido y comprobado el pago realizado por transferencia, pago QR o Yape.",

      "La entrega del Kit Mamá Segura es inmediata una vez que recibimos y comprobamos tu pago por transferencia, pago QR o Yape.",

      "Una vez recibido y comprobado tu pago por transferencia, QR o Yape, recibes tu Kit Mamá Segura de manera inmediata.",
    ];

    return {
      intencion: "tiempo_entrega",
      respuesta:
        elegirAleatoria(respuestas),
    };
  }

  /*
   * INTENCIÓN 3
   * Contenido incluido.
   */
  if (
    incluyeAlguna(
      textoNormalizado,
      [
        "que incluye",
        "incluye el kit",
        "que trae",
        "que contiene",
        "contenido del kit",
        "contenido",
      ]
    )
  ) {
    const respuestas = [
      "El Kit Mamá Segura te incluye: guías prácticas de Maternidad, checklists para Organizarte, registros de Sueño, Lactancia y Actividades, orientación sobre Alimentación y Crecimiento, y recursos para tu Bienestar como Mamá.",

      "El Kit Mamá Segura incluye guías prácticas de Maternidad, checklists para Organizarte, registros de Sueño, Lactancia y Actividades, orientación sobre Alimentación y Crecimiento, y recursos para tu Bienestar como Mamá.",

      "Dentro del Kit Mamá Segura encontrarás guías prácticas de Maternidad, checklists para Organizarte, registros de Sueño, Lactancia y Actividades, orientación sobre Alimentación y Crecimiento, y recursos para tu Bienestar como Mamá.",
    ];

    return {
      intencion: "contenido_kit",
      respuesta:
        elegirAleatoria(respuestas),
    };
  }

  /*
   * INTENCIÓN 4
   * Edades cubiertas.
   */
  if (
    incluyeAlguna(
      textoNormalizado,
      [
        "edad",
        "edades",
        "para que edad",
        "desde que edad",
        "hasta que edad",
        "0 a 3",
        "0 hasta 3",
        "hasta los 5",
        "cinco anos",
        "tres anos",
      ]
    )
  ) {
    const respuestas = [
      "El Kit Mamá Segura es una guía para las mamás de bebés de 0 a 3 años, y adquiriendo la oferta adicional cubres hasta los 5 años con actividades.",

      "El Kit Mamá Segura está dirigido a mamás de bebés de 0 a 3 años. Adquiriendo la oferta adicional, cubres hasta los 5 años con actividades.",

      "La guía Kit Mamá Segura cubre la etapa de 0 a 3 años y, con la oferta adicional, puedes cubrir hasta los 5 años con actividades.",
    ];

    return {
      intencion: "edad_kit",
      respuesta:
        elegirAleatoria(respuestas),
    };
  }

  /*
   * INTENCIÓN 5
   * Precio y métodos de pago.
   */
  if (
    incluyeAlguna(
      textoNormalizado,
      [
        "precio",
        "cuanto cuesta",
        "costo",
        "89 bolivianos",
        "metodo de pago",
        "metodos de pago",
        "como pago",
        "transferencia",
        "pago qr",
        "qr",
        "yape",
        "quiero comprar",
        "comprar el kit",
      ]
    )
  ) {
    const respuestas = [
      "El precio del Kit Mamá Segura es de 89 bolivianos. Los métodos de pago disponibles son pago por transferencia, pago mediante QR o pago por Yape.",

      "El Kit Mamá Segura tiene un precio de 89 bolivianos y puedes pagar por transferencia, mediante QR o por Yape.",

      "El precio es de 89 bolivianos. Puedes realizar el pago por transferencia, pago mediante QR o Yape.",
    ];

    return {
      intencion:
        "precio_metodos_pago",
      respuesta: agregarCierre(
        elegirAleatoria(respuestas),
        textoNormalizado
      ),
    };
  }

  /*
   * INTENCIÓN 6
   * Producto físico o digital.
   */
  const consultaFormato =
    incluyeAlguna(
      textoNormalizado,
      [
        "es digital",
        "es fisico",
        "producto digital",
        "producto fisico",
        "formato digital",
        "formato fisico",
        "viene impreso",
        "es impreso",
      ]
    ) ||
    (
      textoNormalizado.includes(
        "entrega"
      ) &&
      incluyeAlguna(
        textoNormalizado,
        [
          "digital",
          "fisico",
          "formato",
          "impreso",
          "link",
        ]
      )
    );

  if (consultaFormato) {
    const respuestas = [
      "El Kit Mamá Segura es un producto digital, recibes el material mediante un link para descargarlo.",

      "El Kit Mamá Segura es digital y recibes el material mediante un link para descargarlo.",

      "El producto es digital. Recibes el material del Kit Mamá Segura mediante un link para descargarlo.",
    ];

    return {
      intencion: "formato_digital",
      respuesta:
        elegirAleatoria(respuestas),
    };
  }

  /*
   * INTENCIÓN 1
   * Cómo recibe el cliente el Kit.
   */
  const consultaRecepcion =
    incluyeAlguna(
      textoNormalizado,
      [
        "como recibo",
        "como lo recibo",
        "como recibire",
        "donde recibo",
        "recibo el kit",
        "recibir el kit",
        "como me llega",
        "link de descarga",
        "enlace de descarga",
      ]
    ) ||
    (
      textoNormalizado.includes(
        "recibo"
      ) &&
      incluyeAlguna(
        textoNormalizado,
        [
          "kit",
          "material",
          "link",
          "guias",
          "registros",
          "checklist",
        ]
      )
    );

  if (consultaRecepcion) {
    const respuestas = [
      "El Kit Mamá Segura lo recibes de manera digital, mediante un link en el que encontrarás todas las guías, registros y checklist que contiene la oferta para su descarga y guardado.",

      "Recibes el Kit Mamá Segura de manera digital mediante un link, donde encontrarás todas las guías, registros y checklist de la oferta para descargarlos y guardarlos.",

      "Tu Kit Mamá Segura llega de forma digital mediante un link con todas las guías, registros y checklist de la oferta para su descarga y guardado.",
    ];

    return {
      intencion: "recepcion_kit",
      respuesta:
        elegirAleatoria(respuestas),
    };
  }

  return null;
}

app.get("/", (req, res) => {
  return res
    .status(200)
    .send(
      "Agente de soporte Mamá Segura activo ✅"
    );
});

app.post(
  "/mensaje",
  async (req, res) => {
    try {
      const texto =
        req.body?.texto ||
        req.body?.mensaje ||
        req.body?.message ||
        req.body?.body?.texto ||
        req.body?.body?.mensaje ||
        req.body?.body?.message ||
        "";

      console.log(
        "Mensaje recibido:",
        texto
          ? "[contenido recibido]"
          : "[vacío]"
      );

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

      const textoNormalizado =
        normalizarTexto(texto);

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
            model: "gpt-4.1-mini",
            temperature: 0.3,
            instructions:
              SYSTEM_PROMPT,
            input: texto,
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
      } catch (openaiError) {
        console.error(
          "Error de OpenAI:",
          openaiError?.message ||
            "Error desconocido"
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
        error?.message ||
          "Error desconocido"
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

app.use(
  (error, req, res, next) => {
    console.error(
      "Error del servidor:",
      error?.message ||
        "Error desconocido"
    );

    if (res.headersSent) {
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

app.listen(
  PORT,
  "0.0.0.0",
  () => {
    console.log(
      `Servidor corriendo en puerto ${PORT}`
    );
  }
);
