require("dotenv").config();

const express = require("express");
const OpenAI = require("openai");

const app = express();

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const PORT = process.env.PORT || 8080;

const SYSTEM_PROMPT = `
Eres Lucía Vega, asistente de atención al cliente de Mamá Segura.
Respondes por WhatsApp preguntas sobre el producto digital "Kit Mamá Segura".

PERSONALIDAD Y TONO:
- Eres humana, cálida, cercana, empática, paciente y clara.
- Ayudas a la mamá a sentirse acompañada, validada e informada.
- Utilizas un lenguaje sencillo, natural y fácil de leer en WhatsApp.
- Respondes como máximo en uno o dos párrafos cortos.
- Puedes utilizar uno o dos emojis cuando aporten calidez, sin exagerar.

REGLAS:
- No saludes al inicio de cada respuesta.
- No uses "Hola".
- No hagas múltiples preguntas ni preguntas abiertas innecesarias.
- No presiones a la persona ni utilices un tono agresivo de venta.
- No inventes información.
- Utiliza exclusivamente la información oficial incluida en este prompt.
- No cambies precios, métodos de pago, tiempos de entrega, condiciones, garantías ni políticas.
- No agregues productos, bonos, descuentos, promociones o beneficios no autorizados.
- No diagnostiques ni indiques tratamientos médicos.
- No reemplaces la orientación de un pediatra o profesional de salud.
- No asegures nada que no aparezca en la información oficial.
- Si no existe información suficiente, responde de forma natural que necesitas confirmar ese dato con el equipo de Mamá Segura.

INFORMACIÓN REAL Y AUTORIZADA:
- Nombre del negocio: Mamá Segura.
- Nombre del agente: Lucía Vega.
- Producto: Kit Mamá Segura.
- Tipo de producto: digital.
- El Kit Mamá Segura es una guía integral que acompaña a una mamá primeriza desde el nacimiento hasta los primeros años del bebé.
- Ayuda a criar con más tranquilidad, seguridad y confianza.
- Ayuda frente a la desinformación, la sobreinformación, las dudas frecuentes, las inseguridades y los miedos en las distintas etapas del bebé.
- Busca que la mamá se sienta acompañada, validada e informada y que pueda recuperar la sensación de control.
- Forma de entrega: archivos PDF descargables mediante un enlace.
- Tiempo de entrega: inmediatamente después de confirmar el pago. La entrega demora solo unos segundos.
- Contenido: 13 documentos PDF descargables con guías prácticas de maternidad, checklists para organizarse, registros de sueño, lactancia y actividades, orientación sobre alimentación y crecimiento, y recursos para el bienestar de la mamá.
- Edad: materiales para bebés y niños desde los 0 hasta los 6 años.
- Precio: 89 bolivianos.
- Métodos de pago: transferencia bancaria, código QR y depósito o pago por Yape.
- Uso: las guías pueden consultarse desde el celular. Los checklists deben imprimirse para utilizarlos correctamente.
- Soporte: si existe dificultad para abrir o descargar los archivos, la persona debe contactar al equipo y los archivos se compartirán nuevamente.
- Alcance: el Kit Mamá Segura es una guía de apoyo para acompañar a la mamá durante una etapa muy demandante. No reemplaza la orientación, evaluación ni tratamiento de un pediatra o profesional de salud cuando exista una situación que requiera atención especializada.
- Devoluciones: el Kit Mamá Segura no tiene devolución, ya que una vez confirmado el pago se entrega inmediatamente el material digital.
- Garantía: acceso de por vida a los archivos recibidos.

OBJETIVO:
- Resolver la duda de forma breve, clara y útil.
- Transmitir acompañamiento, seguridad y confianza.
- Agregar un cierre comercial solamente cuando la persona pregunte por el precio, los métodos de pago o manifieste intención clara de comprar.
- En esos casos, invitarla suavemente a elegir transferencia bancaria, código QR o depósito o pago por Yape.
- No agregar un cierre comercial en consultas de soporte, salud, devoluciones, garantías o después de que la persona ya realizó el pago.
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
    .replace(
      /^gracias por preguntar\s*[😊🙏❤️✨💛,.!]*\s*/gi,
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
    );

  texto = texto
    .replace(
      /¿[^?]*(quieres|te interesa|te gustaría|te gustaria|te cuento|te explico|te ayudo|puedo ayudarte|hay algo más|hay algo mas)[^?]*\?/gi,
      ""
    )
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return texto;
}

function cierreComercial() {
  const cierres = [
    `Para continuar con tu compra, indícame si prefieres transferencia bancaria, código QR o depósito o pago por Yape. 💛`,

    `Puedes realizar el pago mediante transferencia bancaria, código QR o depósito o pago por Yape. ¿Qué método prefieres?`,

    `Para adquirir tu Kit Mamá Segura, puedes elegir transferencia bancaria, código QR o depósito o pago por Yape. 😊`,
  ];

  return elegirAleatoria(cierres);
}

function debeAgregarCierre(textoNormalizado) {
  const noCorrespondeCierre =
    textoNormalizado.includes("ya pague") ||
    textoNormalizado.includes("pago realizado") ||
    textoNormalizado.includes("comprobante enviado") ||
    textoNormalizado.includes("envie el comprobante") ||
    textoNormalizado.includes("no puedo abrir") ||
    textoNormalizado.includes("no puedo descargar") ||
    textoNormalizado.includes("problema") ||
    textoNormalizado.includes("dificultad") ||
    textoNormalizado.includes("devolucion") ||
    textoNormalizado.includes("reembolso") ||
    textoNormalizado.includes("garantia") ||
    textoNormalizado.includes("pediatra") ||
    textoNormalizado.includes("medico") ||
    textoNormalizado.includes("profesional de salud");

  if (noCorrespondeCierre) {
    return false;
  }

  return (
    textoNormalizado.includes("precio") ||
    textoNormalizado.includes("costo") ||
    textoNormalizado.includes("cuanto cuesta") ||
    textoNormalizado.includes("comprar") ||
    textoNormalizado.includes("quiero comprar") ||
    textoNormalizado.includes("como pago") ||
    textoNormalizado.includes("pagar") ||
    textoNormalizado.includes("metodo de pago") ||
    textoNormalizado.includes("metodos de pago") ||
    textoNormalizado.includes("transferencia") ||
    textoNormalizado.includes("codigo qr") ||
    textoNormalizado.includes("yape") ||
    textoNormalizado.includes("deposito")
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
  if (
    textoNormalizado.includes("no puedo abrir") ||
    textoNormalizado.includes("no abre") ||
    textoNormalizado.includes("no puedo descargar") ||
    textoNormalizado.includes("no descarga") ||
    textoNormalizado.includes("problema con el archivo") ||
    textoNormalizado.includes("problema con los archivos") ||
    textoNormalizado.includes("problema con el enlace") ||
    textoNormalizado.includes("problema con el link") ||
    textoNormalizado.includes("dificultad para abrir") ||
    textoNormalizado.includes("dificultad para descargar") ||
    (textoNormalizado.includes("problema") &&
      (textoNormalizado.includes("archivo") ||
        textoNormalizado.includes("descarga") ||
        textoNormalizado.includes("enlace") ||
        textoNormalizado.includes("link")))
  ) {
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

  if (
    textoNormalizado.includes("pediatra") ||
    textoNormalizado.includes("medico") ||
    textoNormalizado.includes("doctor") ||
    textoNormalizado.includes("profesional de salud") ||
    textoNormalizado.includes("consulta medica") ||
    textoNormalizado.includes("reemplaza al pediatra") ||
    textoNormalizado.includes("reemplaza una consulta") ||
    textoNormalizado.includes("tratamiento") ||
    textoNormalizado.includes("evaluacion medica") ||
    (textoNormalizado.includes("consulta") &&
      (textoNormalizado.includes("salud") ||
        textoNormalizado.includes("pediatra") ||
        textoNormalizado.includes("medico")))
  ) {
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

  if (
    textoNormalizado.includes("devolucion") ||
    textoNormalizado.includes("devolver") ||
    textoNormalizado.includes("reembolso") ||
    textoNormalizado.includes("garantia") ||
    textoNormalizado.includes("cambio") ||
    textoNormalizado.includes("cambios") ||
    textoNormalizado.includes("acceso de por vida") ||
    textoNormalizado.includes("de por vida")
  ) {
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

  if (
    textoNormalizado.includes("imprimir") ||
    textoNormalizado.includes("impresion") ||
    textoNormalizado.includes("desde mi celular") ||
    textoNormalizado.includes("en mi celular") ||
    textoNormalizado.includes("usar desde el celular") ||
    textoNormalizado.includes("puedo usar") ||
    textoNormalizado.includes("como usar") ||
    textoNormalizado.includes("checklist") ||
    textoNormalizado.includes("checklists") ||
    (textoNormalizado.includes("usar") &&
      (textoNormalizado.includes("guia") ||
        textoNormalizado.includes("guias") ||
        textoNormalizado.includes("material") ||
        textoNormalizado.includes("celular")))
  ) {
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

  if (
    textoNormalizado.includes("cuanto tarda") ||
    textoNormalizado.includes("cuanto tiempo tarda") ||
    textoNormalizado.includes("cuanto demora") ||
    textoNormalizado.includes("cuando llega") ||
    textoNormalizado.includes("tiempo de entrega") ||
    textoNormalizado.includes("tiempo de envio") ||
    textoNormalizado.includes("despues del comprobante") ||
    textoNormalizado.includes("envie el comprobante") ||
    textoNormalizado.includes("enviar el comprobante") ||
    textoNormalizado.includes("confirmacion del pago") ||
    textoNormalizado.includes("confirmar el pago") ||
    textoNormalizado.includes("inmediatamente") ||
    textoNormalizado.includes("segundos") ||
    (textoNormalizado.includes("envio") &&
      (textoNormalizado.includes("tiempo") ||
        textoNormalizado.includes("tarda") ||
        textoNormalizado.includes("demora") ||
        textoNormalizado.includes("pago") ||
        textoNormalizado.includes("comprobante")))
  ) {
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
    textoNormalizado.includes("contenido") ||
    textoNormalizado.includes("que incluye") ||
    textoNormalizado.includes("que trae") ||
    textoNormalizado.includes("13 documentos") ||
    textoNormalizado.includes("guias practicas") ||
    textoNormalizado.includes("registros de sueno") ||
    textoNormalizado.includes("registros de lactancia") ||
    textoNormalizado.includes("alimentacion y crecimiento") ||
    textoNormalizado.includes("bienestar como mama")
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

  if (
    textoNormalizado.includes("para que edad") ||
    textoNormalizado.includes("que edad") ||
    textoNormalizado.includes("desde que edad") ||
    textoNormalizado.includes("hasta que edad") ||
    textoNormalizado.includes("edades") ||
    textoNormalizado.includes("0 a 6 anos") ||
    textoNormalizado.includes("seis anos") ||
    textoNormalizado.includes("recien nacido") ||
    textoNormalizado.includes("edad del bebe") ||
    (textoNormalizado.includes("bebe") &&
      (textoNormalizado.includes("edad") ||
        textoNormalizado.includes("anos") ||
        textoNormalizado.includes("meses") ||
        textoNormalizado.includes("sirve")))
  ) {
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
    textoNormalizado.includes("precio") ||
    textoNormalizado.includes("costo") ||
    textoNormalizado.includes("cuanto cuesta") ||
    textoNormalizado.includes("cuesta") ||
    textoNormalizado.includes("vale") ||
    textoNormalizado.includes("89 bolivianos") ||
    textoNormalizado.includes("metodo de pago") ||
    textoNormalizado.includes("metodos de pago") ||
    textoNormalizado.includes("transferencia") ||
    textoNormalizado.includes("codigo qr") ||
    textoNormalizado.includes("pago por qr") ||
    textoNormalizado.includes("yape") ||
    textoNormalizado.includes("deposito") ||
    textoNormalizado.includes("como pago") ||
    textoNormalizado.includes("comprar") ||
    textoNormalizado.includes("quiero comprar") ||
    textoNormalizado.includes("pagar")
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

  if (
    textoNormalizado.includes("es fisico") ||
    textoNormalizado.includes("es digital") ||
    textoNormalizado.includes("producto fisico") ||
    textoNormalizado.includes("producto digital") ||
    textoNormalizado.includes("formato fisico") ||
    textoNormalizado.includes("formato digital") ||
    textoNormalizado.includes("material fisico") ||
    textoNormalizado.includes("material digital") ||
    textoNormalizado.includes("impreso") ||
    textoNormalizado.includes("se descarga") ||
    textoNormalizado.includes("es descarga") ||
    (textoNormalizado.includes("descarga") &&
      (textoNormalizado.includes("producto") ||
        textoNormalizado.includes("formato") ||
        textoNormalizado.includes("digital") ||
        textoNormalizado.includes("pdf")))
  ) {
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

  if (
    textoNormalizado.includes("como recibo") ||
    textoNormalizado.includes("como lo recibo") ||
    textoNormalizado.includes("como recibire") ||
    textoNormalizado.includes("forma de entrega") ||
    textoNormalizado.includes("donde recibo") ||
    textoNormalizado.includes("recibir el kit") ||
    textoNormalizado.includes("me envian el kit") ||
    textoNormalizado.includes("enlace de descarga") ||
    textoNormalizado.includes("link de descarga") ||
    textoNormalizado.includes("pdf descargable") ||
    textoNormalizado.includes("recibo")
  ) {
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

function extraerMensaje(valor, profundidad = 0) {
  if (
    profundidad > 5 ||
    valor === null ||
    valor === undefined
  ) {
    return "";
  }

  if (typeof valor === "string") {
    const texto = valor.trim();

    if (!texto) {
      return "";
    }

    try {
      const convertido = JSON.parse(texto);

      return (
        extraerMensaje(
          convertido,
          profundidad + 1
        ) || texto
      );
    } catch (error) {
      return texto;
    }
  }

  if (Array.isArray(valor)) {
    for (const elemento of valor) {
      const encontrado = extraerMensaje(
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

  const clavesDeMensaje = [
    "mensaje",
    "texto",
    "message",
    "text",
    "pregunta",
    "question",
    "input",
    "user_input",
    "userMessage",
    "last_text_input",
    "lastTextInput",
  ];

  for (const clave of clavesDeMensaje) {
    if (
      Object.prototype.hasOwnProperty.call(
        valor,
        clave
      )
    ) {
      const encontrado = extraerMensaje(
        valor[clave],
        profundidad + 1
      );

      if (encontrado) {
        return encontrado;
      }
    }
  }

  const contenedoresComunes = [
    "body",
    "data",
    "payload",
    "request",
    "json",
    "fields",
    "custom_fields",
  ];

  for (const clave of contenedoresComunes) {
    if (
      Object.prototype.hasOwnProperty.call(
        valor,
        clave
      )
    ) {
      const encontrado = extraerMensaje(
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

app.get("/", (req, res) => {
  return res.status(200).json({
    estado: "activo",
    servicio: "Agente Mamá Segura",
    endpoint: "/mensaje",
  });
});

app.post("/mensaje", async (req, res) => {
  try {
    const texto =
      extraerMensaje(req.body) ||
      extraerMensaje(req.query) ||
      "";

    console.log(
      "Mensaje recibido:",
      texto
        ? "[contenido recibido]"
        : "[vacio]"
    );

    if (!texto) {
      console.log(
        "Intención detectada: mensaje_vacio"
      );
      console.log(
        "Respuesta enviada: mensaje_vacio"
      );

      return res.status(200).json({
        respuesta:
          "No pude identificar tu mensaje. Por favor, escríbelo nuevamente.",
      });
    }

    const textoNormalizado =
      normalizarTexto(texto);

    const directa =
      respuestaDirecta(textoNormalizado);

    if (directa) {
      console.log(
        "Intención detectada:",
        directa.intencion
      );
      console.log(
        "Respuesta enviada: base_conocimiento"
      );

      return res.status(200).json({
        respuesta: directa.respuesta,
      });
    }

    console.log(
      "Intención detectada: consulta_abierta"
    );

    try {
      const response =
        await openai.responses.create({
          model: "gpt-4.1-mini",
          temperature: 0.3,
          instructions: SYSTEM_PROMPT,
          input: texto,
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

      return res.status(200).json({
        respuesta: respuestaFinal,
      });
    } catch (openaiError) {
      console.error(
        "Error de OpenAI:",
        openaiError.message
      );

      return res.status(200).json({
        respuesta:
          "En este momento no pude procesar tu mensaje. Por favor, inténtalo nuevamente en unos minutos.",
      });
    }
  } catch (error) {
    console.error(
      "Error en /mensaje:",
      error.message
    );

    return res.status(200).json({
      respuesta:
        "En este momento no pude procesar tu mensaje. Por favor, inténtalo nuevamente en unos minutos.",
    });
  }
});

app.listen(PORT, () => {
  console.log(
    `Servidor corriendo en puerto ${PORT}`
  );
});
