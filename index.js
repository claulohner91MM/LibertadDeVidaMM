require("dotenv").config();

const express = require("express");
const OpenAI = require("openai");

const app = express();

app.use((req, res, next) => {
  console.log(`Solicitud recibida: ${req.method} ${req.path}`);
  next();
});

app.use(
  express.json({
    limit: "1mb",
    type: ["application/json", "application/*+json"],
  })
);

app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(express.text({ type: "text/plain", limit: "1mb" }));

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  : null;

const PORT = process.env.PORT || 8080;

const SYSTEM_PROMPT = `
Eres la asistente virtual de Mamá Segura y respondes por WhatsApp preguntas sobre el producto digital "Kit Mamá Segura".

Responde de forma NATURAL, BREVE, CÁLIDA, CLARA y HUMANA, como una persona real que acompaña a una mamá primeriza con empatía.

REGLAS:
- Nunca suenes robótica.
- Responde máximo en 1 o 2 párrafos cortos.
- No saludes al inicio de cada respuesta.
- No uses "Hola".
- No hagas preguntas abiertas innecesarias.
- No presiones a la persona.
- No inventes información.
- Utiliza exclusivamente la información oficial de esta base de conocimiento.
- No cambies precios, métodos de pago, tiempos de entrega, políticas ni garantías.
- No agregues productos, bonos, descuentos, promociones o beneficios no autorizados.
- No diagnostiques ni indiques tratamientos médicos.
- No contradigas las respuestas oficiales.
- Si no existe información suficiente, indica naturalmente que necesitas confirmar ese dato con el equipo de Mamá Segura.

INFORMACIÓN OFICIAL:
- Negocio: Mamá Segura.
- Producto: Kit Mamá Segura.
- Tipo de producto: digital.
- Es una guía integral que acompaña a una mamá primeriza desde el nacimiento hasta los primeros años del bebé.
- Ayuda a criar con más tranquilidad, seguridad y confianza.
- Ayuda frente a la desinformación, la sobreinformación, las dudas frecuentes, las inseguridades y los miedos de las distintas etapas del bebé.
- Busca que la mamá se sienta acompañada, validada e informada y que pueda recuperar la sensación de control.
- Entrega: archivos PDF descargables mediante un enlace.
- Tiempo de entrega: inmediatamente después de confirmar el pago; demora solo unos segundos.
- Contenido: 13 documentos PDF descargables con guías prácticas de maternidad, checklists para organizarse, registros de sueño, lactancia y actividades, orientación sobre alimentación y crecimiento, y recursos para el bienestar de la mamá.
- Edad: bebés y niños desde los 0 hasta los 6 años.
- Precio: 89 bolivianos.
- Métodos de pago: transferencia bancaria, código QR y depósito o pago por Yape.
- Uso: las guías pueden consultarse desde el celular; los checklists deben imprimirse para utilizarlos correctamente.
- Soporte: si existe dificultad para abrir o descargar los archivos, la persona debe contactar al equipo y se le compartirán nuevamente.
- Alcance: es una guía de apoyo. No reemplaza la orientación, evaluación ni tratamiento de un pediatra o profesional de salud cuando exista una situación que requiera atención especializada.
- Devoluciones: no tiene devolución porque, una vez confirmado el pago, se entrega inmediatamente el material digital.
- Garantía: acceso de por vida a los archivos recibidos.

OBJETIVO:
- Resolver cada duda de forma breve, clara y útil.
- Transmitir acompañamiento, seguridad y confianza.
- Agregar un cierre comercial solamente cuando exista intención clara de compra o pago.
- No agregar un cierre comercial en consultas de soporte, salud, devoluciones, garantías o situaciones posteriores al pago.
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
  return opciones[Math.floor(Math.random() * opciones.length)];
}

function limpiarRespuesta(texto) {
  texto = String(texto || "").trim();

  texto = texto
    .replace(/^¡?\s*hola\s*[😊🙏❤️✨💛,.!]*\s*/gi, "")
    .replace(/^gracias por preguntar\s*[😊🙏❤️✨💛,.!]*\s*/gi, "")
    .replace(/^buenos d[ií]as\s*[😊🙏❤️✨💛,.!]*\s*/gi, "")
    .replace(/^buenas tardes\s*[😊🙏❤️✨💛,.!]*\s*/gi, "")
    .replace(/^buenas noches\s*[😊🙏❤️✨💛,.!]*\s*/gi, "");

  return texto
    .replace(
      /¿[^?]*(quieres|te interesa|te gustaría|te gustaria|te cuento|te explico|te ayudo|puedo ayudarte|hay algo más|hay algo mas)[^?]*\?/gi,
      ""
    )
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function incluyeAlguna(textoNormalizado, opciones) {
  return opciones.some((opcion) =>
    textoNormalizado.includes(normalizarTexto(opcion))
  );
}

function cierrePago() {
  const cierres = [
    `Para continuar con tu compra, indícame si prefieres transferencia bancaria, código QR o depósito o pago por Yape. 💛`,

    `Puedes realizar el pago mediante transferencia bancaria, código QR o depósito o pago por Yape. ¿Qué método prefieres?`,

    `Para adquirir tu Kit Mamá Segura, puedes elegir transferencia bancaria, código QR o depósito o pago por Yape. 😊`,
  ];

  return elegirAleatoria(cierres);
}

function debeAgregarCierre(textoNormalizado) {
  const contextoSinCierre = incluyeAlguna(textoNormalizado, [
    "ya pague",
    "pago realizado",
    "comprobante enviado",
    "envie el comprobante",
    "no puedo abrir",
    "no puedo descargar",
    "problema",
    "dificultad",
    "devolucion",
    "reembolso",
    "garantia",
    "pediatra",
    "medico",
    "profesional de salud",
  ]);

  if (contextoSinCierre) {
    return false;
  }

  return incluyeAlguna(textoNormalizado, [
    "precio",
    "costo",
    "cuanto cuesta",
    "comprar",
    "quiero comprar",
    "como pago",
    "pagar",
    "metodo de pago",
    "metodos de pago",
    "transferencia",
    "codigo qr",
    "yape",
    "deposito",
  ]);
}

function agregarCierre(texto, textoNormalizado) {
  const limpio = limpiarRespuesta(texto);

  if (!limpio) {
    return "Necesito confirmar ese dato con el equipo de Mamá Segura para darte una respuesta correcta.";
  }

  if (!debeAgregarCierre(textoNormalizado)) {
    return limpio;
  }

  return `${limpio}\n\n${cierrePago()}`;
}

function respuestaDirecta(textoNormalizado) {
  const problemaDescarga =
    incluyeAlguna(textoNormalizado, [
      "no puedo abrir",
      "no abre",
      "no puedo descargar",
      "no descarga",
      "problema con el archivo",
      "problema con los archivos",
      "problema con el enlace",
      "problema con el link",
      "dificultad para abrir",
      "dificultad para descargar",
    ]) ||
    (textoNormalizado.includes("problema") &&
      incluyeAlguna(textoNormalizado, [
        "archivo",
        "descarga",
        "enlace",
        "link",
      ]));

  if (problemaDescarga) {
    const respuestas = [
      `Si tienes alguna dificultad para abrir o descargar los archivos, contáctanos y te los compartimos nuevamente.`,

      `Si tienes problemas para abrir o descargar los archivos, contáctanos y te los compartiremos nuevamente.`,

      `Si no puedes abrir o descargar los archivos, escríbenos y te los compartimos nuevamente.`,
    ];

    return {
      intencion: "problema_descarga",
      respuesta: elegirAleatoria(respuestas),
    };
  }

  const consultaSalud =
    incluyeAlguna(textoNormalizado, [
      "pediatra",
      "medico",
      "doctor",
      "profesional de salud",
      "consulta medica",
      "reemplaza al pediatra",
      "reemplaza una consulta",
      "tratamiento",
      "evaluacion medica",
      "reemplaza",
    ]) ||
    (textoNormalizado.includes("consulta") &&
      incluyeAlguna(textoNormalizado, [
        "salud",
        "pediatra",
        "medico",
      ]));

  if (consultaSalud) {
    const respuestas = [
      `El Kit Mamá Segura es una guía de apoyo para acompañar a la mamá durante una etapa muy demandante. No reemplaza la orientación, evaluación ni tratamiento de un pediatra o profesional de salud cuando exista una situación que requiera atención especializada.`,

      `El Kit Mamá Segura acompaña y apoya a la mamá en una etapa muy demandante, pero no reemplaza la orientación, evaluación ni tratamiento de un pediatra o profesional de salud cuando se requiera atención especializada.`,

      `El kit funciona como una guía de apoyo para la mamá. No sustituye la orientación, evaluación ni tratamiento de un pediatra o profesional de salud ante una situación que necesite atención especializada.`,
    ];

    return {
      intencion: "consulta_profesional_salud",
      respuesta: elegirAleatoria(respuestas),
    };
  }

  const devolucionGarantia =
    incluyeAlguna(textoNormalizado, [
      "devolucion",
      "devolver",
      "reembolso",
      "garantia",
      "cambio",
      "cambios",
      "acceso de por vida",
      "de por vida",
    ]) ||
    (textoNormalizado.includes("entrega") &&
      incluyeAlguna(textoNormalizado, [
        "devolucion",
        "reembolso",
        "garantia",
      ]));

  if (devolucionGarantia) {
    const respuestas = [
      `El Kit Mamá Segura no tiene devolución, ya que una vez confirmado el pago se entrega inmediatamente el material digital. La garantía de tu compra es que tendrás acceso de por vida a los archivos recibidos.`,

      `El kit no tiene devolución porque el material digital se entrega inmediatamente después de confirmar el pago. La garantía de la compra es el acceso de por vida a los archivos recibidos.`,

      `No se realizan devoluciones, ya que el material digital se entrega en cuanto se confirma el pago. Tu garantía es que tendrás acceso de por vida a los archivos recibidos.`,
    ];

    return {
      intencion: "devolucion_garantia",
      respuesta: elegirAleatoria(respuestas),
    };
  }

  const usoMateriales =
    incluyeAlguna(textoNormalizado, [
      "imprimir",
      "impresion",
      "desde mi celular",
      "en mi celular",
      "usar desde el celular",
      "puedo usar",
      "como usar",
      "checklist",
      "checklists",
    ]) ||
    (textoNormalizado.includes("usar") &&
      incluyeAlguna(textoNormalizado, [
        "guia",
        "guias",
        "material",
        "celular",
      ]));

  if (usoMateriales) {
    const respuestas = [
      `Puedes consultar las guías directamente desde tu celular. Los checklists sí deben imprimirse para poder utilizarlos correctamente.`,

      `Las guías pueden consultarse directamente desde el celular. Los checklists sí deben imprimirse para utilizarlos correctamente.`,

      `Puedes usar las guías desde tu celular; los checklists sí necesitan imprimirse para poder utilizarlos correctamente.`,
    ];

    return {
      intencion: "uso_materiales",
      respuesta: elegirAleatoria(respuestas),
    };
  }

  const tiempoEnvio =
    incluyeAlguna(textoNormalizado, [
      "cuanto tarda",
      "cuanto tiempo tarda",
      "cuanto demora",
      "cuando llega",
      "tiempo de entrega",
      "tiempo de envio",
      "despues del comprobante",
      "envie el comprobante",
      "enviar el comprobante",
      "confirmacion del pago",
      "confirmar el pago",
      "inmediatamente",
      "segundos",
    ]) ||
    (textoNormalizado.includes("envio") &&
      incluyeAlguna(textoNormalizado, [
        "tiempo",
        "tarda",
        "demora",
        "pago",
        "comprobante",
      ]));

  if (tiempoEnvio) {
    const respuestas = [
      `Recibes tu Kit Mamá Segura inmediatamente después de que confirmamos el pago. La entrega demora solo unos segundos.`,

      `El Kit Mamá Segura se entrega inmediatamente después de confirmar el pago. La entrega demora solo unos segundos.`,

      `Una vez que confirmamos el pago, recibes tu Kit Mamá Segura inmediatamente; la entrega demora solo unos segundos.`,
    ];

    return {
      intencion: "tiempo_envio",
      respuesta: elegirAleatoria(respuestas),
    };
  }

  if (
    incluyeAlguna(textoNormalizado, [
      "contenido",
      "que incluye",
      "que trae",
      "13 documentos",
      "guias practicas",
      "registros de sueno",
      "registros de lactancia",
      "alimentacion y crecimiento",
      "bienestar como mama",
    ])
  ) {
    const respuestas = [
      `Recibes 13 documentos PDF descargables que incluyen guías prácticas de maternidad, checklists para organizarte, registros de sueño, lactancia y actividades, orientación sobre alimentación y crecimiento, y recursos para tu bienestar como mamá.`,

      `El Kit Mamá Segura incluye 13 documentos PDF descargables con guías prácticas de maternidad, checklists para organizarte, registros de sueño, lactancia y actividades, orientación sobre alimentación y crecimiento, y recursos para tu bienestar como mamá.`,

      `Recibirás 13 documentos PDF descargables: guías prácticas de maternidad, checklists para organizarte, registros de sueño, lactancia y actividades, orientación sobre alimentación y crecimiento, y recursos para tu bienestar como mamá.`,
    ];

    return {
      intencion: "contenido_kit",
      respuesta: elegirAleatoria(respuestas),
    };
  }

  const edadBebe =
    incluyeAlguna(textoNormalizado, [
      "para que edad",
      "que edad",
      "desde que edad",
      "hasta que edad",
      "edades",
      "0 a 6 anos",
      "seis anos",
      "recien nacido",
      "edad del bebe",
    ]) ||
    (textoNormalizado.includes("bebe") &&
      incluyeAlguna(textoNormalizado, [
        "edad",
        "anos",
        "meses",
        "sirve",
      ]));

  if (edadBebe) {
    const respuestas = [
      `El Kit Mamá Segura incluye materiales para acompañar a bebés y niños desde los 0 hasta los 6 años.`,

      `Los materiales del Kit Mamá Segura acompañan a bebés y niños desde los 0 hasta los 6 años.`,

      `El kit incluye materiales para bebés y niños desde el nacimiento hasta los 6 años.`,
    ];

    return {
      intencion: "edad_bebe",
      respuesta: elegirAleatoria(respuestas),
    };
  }

  if (
    incluyeAlguna(textoNormalizado, [
      "precio",
      "costo",
      "cuanto cuesta",
      "cuesta",
      "vale",
      "89 bolivianos",
      "metodo de pago",
      "metodos de pago",
      "transferencia",
      "codigo qr",
      "pago por qr",
      "yape",
      "deposito",
      "como pago",
      "comprar",
      "quiero comprar",
      "pagar",
    ])
  ) {
    const respuestas = [
      `El Kit Mamá Segura cuesta 89 bolivianos. Aceptamos pagos mediante transferencia bancaria, código QR y depósito o pago por Yape.`,

      `El precio del Kit Mamá Segura es de 89 bolivianos. Puedes pagar mediante transferencia bancaria, código QR y depósito o pago por Yape.`,

      `Puedes adquirir el Kit Mamá Segura por 89 bolivianos. Los métodos de pago son transferencia bancaria, código QR y depósito o pago por Yape.`,
    ];

    return {
      intencion: "precio_metodos_pago",
      respuesta: agregarCierre(
        elegirAleatoria(respuestas),
        textoNormalizado
      ),
    };
  }

  const productoDigital =
    incluyeAlguna(textoNormalizado, [
      "es fisico",
      "es digital",
      "producto fisico",
      "producto digital",
      "formato fisico",
      "formato digital",
      "material fisico",
      "material digital",
      "impreso",
      "se descarga",
      "es descarga",
    ]) ||
    (textoNormalizado.includes("descarga") &&
      incluyeAlguna(textoNormalizado, [
        "producto",
        "formato",
        "digital",
        "pdf",
      ]));

  if (productoDigital) {
    const respuestas = [
      `El Kit Mamá Segura es un producto digital. Recibirás los materiales en archivos PDF descargables mediante un enlace.`,

      `El Kit Mamá Segura es digital y recibirás los materiales en archivos PDF descargables mediante un enlace.`,

      `No es un producto físico. El Kit Mamá Segura es digital y se entrega en archivos PDF descargables mediante un enlace.`,
    ];

    return {
      intencion: "producto_digital",
      respuesta: elegirAleatoria(respuestas),
    };
  }

  const reciboKit =
    incluyeAlguna(textoNormalizado, [
      "como recibo",
      "como lo recibo",
      "como recibire",
      "forma de entrega",
      "donde recibo",
      "recibir el kit",
      "me envian el kit",
      "enlace de descarga",
      "link de descarga",
      "pdf descargable",
      "recibo",
    ]) ||
    (textoNormalizado.includes("entrega") &&
      incluyeAlguna(textoNormalizado, [
        "kit",
        "pdf",
        "enlace",
        "link",
      ]));

  if (reciboKit) {
    const respuestas = [
      `Recibes tu Kit Mamá Segura en archivos PDF descargables mediante un enlace.`,

      `Tu Kit Mamá Segura se entrega en archivos PDF descargables mediante un enlace.`,

      `Después de realizar el pago, recibes el Kit Mamá Segura mediante un enlace con los archivos PDF descargables.`,
    ];

    return {
      intencion: "recibo_kit",
      respuesta: elegirAleatoria(respuestas),
    };
  }

  return null;
}

function extraerTextoDelBody(body) {
  if (typeof body === "string") {
    const textoPlano = body.trim();

    if (!textoPlano) {
      return "";
    }

    try {
      return extraerTextoDelBody(JSON.parse(textoPlano));
    } catch (error) {
      return textoPlano;
    }
  }

  if (!body || typeof body !== "object") {
    return "";
  }

  const candidatos = [
    body.texto,
    body.mensaje,
    body.message,
    body.text,
    body.pregunta,
    body.user_message,
    body.userMessage,
    body.last_text_input,
    body.lastTextInput,
    body?.data?.texto,
    body?.data?.mensaje,
    body?.data?.message,
    body?.data?.text,
    body?.payload?.texto,
    body?.payload?.mensaje,
    body?.payload?.message,
    body?.payload?.text,
    body?.custom_fields?.texto,
    body?.custom_fields?.mensaje,
  ];

  const encontrado = candidatos.find(
    (valor) => typeof valor === "string" && valor.trim()
  );

  return encontrado ? encontrado.trim() : "";
}

app.get("/", (req, res) => {
  return res.status(200).json({
    estado: "activo",
    servicio: "Agente Mamá Segura",
  });
});

app.get("/mensaje", (req, res) => {
  return res.status(200).json({
    estado: "activo",
    endpoint: "POST /mensaje",
  });
});

async function manejarMensaje(req, res) {
  try {
    const texto =
      extraerTextoDelBody(req.body) ||
      extraerTextoDelBody(req.query);

    console.log(
      "Mensaje recibido:",
      texto ? "[contenido recibido]" : "[vacio]"
    );

    if (!texto) {
      console.log("Intencion detectada: mensaje_vacio");
      console.log("Respuesta enviada: mensaje_vacio");

      return res.status(200).json({
        respuesta:
          "No pude identificar tu mensaje. Por favor, escríbelo nuevamente.",
      });
    }

    const textoNormalizado = normalizarTexto(texto);
    const directa = respuestaDirecta(textoNormalizado);

    if (directa) {
      console.log("Intencion detectada:", directa.intencion);
      console.log("Respuesta enviada: base_conocimiento");

      return res.status(200).json({
        respuesta: directa.respuesta,
      });
    }

    console.log("Intencion detectada: consulta_abierta");

    if (!openai) {
      console.log("Respuesta enviada: falta_OPENAI_API_KEY");

      return res.status(200).json({
        respuesta:
          "Necesito confirmar ese dato con el equipo de Mamá Segura para darte una respuesta correcta.",
      });
    }

    try {
      const response = await openai.responses.create({
        model: "gpt-4.1-mini",
        temperature: 0.3,
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

      const respuestaFinal = agregarCierre(
        response.output_text || "",
        textoNormalizado
      );

      console.log("Respuesta enviada: OpenAI");

      return res.status(200).json({
        respuesta: respuestaFinal,
      });
    } catch (openaiError) {
      console.error("Error de OpenAI:", openaiError.message);

      return res.status(200).json({
        respuesta:
          "En este momento no pude procesar tu mensaje. Por favor, inténtalo nuevamente en unos minutos.",
      });
    }
  } catch (error) {
    console.error("Error en /mensaje:", error.message);

    return res.status(200).json({
      respuesta:
        "En este momento no pude procesar tu mensaje. Por favor, inténtalo nuevamente en unos minutos.",
    });
  }
}

app.post("/mensaje", manejarMensaje);
app.post("/", manejarMensaje);

app.use((error, req, res, next) => {
  console.error("Error del servidor:", error.message);

  if (res.headersSent) {
    return next(error);
  }

  return res.status(200).json({
    respuesta:
      "No pude identificar tu mensaje. Por favor, escríbelo nuevamente.",
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
