require("dotenv").config();

const express = require("express");
const OpenAI = require("openai");

const app = express();

app.disable("x-powered-by");

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(
  express.text({
    type: ["text/plain", "application/octet-stream"],
    limit: "1mb",
  })
);

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  return next();
});

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  : null;

const PORT = process.env.PORT || 8080;

const SYSTEM_PROMPT = `
Eres la asesora virtual de Mamá Segura. Respondes por WhatsApp preguntas sobre el producto digital "Kit Mamá Segura".

Tu trabajo es responder de forma NATURAL, BREVE, CÁLIDA, CLARA y HUMANA, como una persona real que acompaña a una mamá primeriza con empatía.

IMPORTANTE:
- Nunca suenes robótica.
- Varía ligeramente la redacción sin alterar el significado de la información oficial.
- Responde máximo en 1 o 2 párrafos cortos.
- No saludes al inicio de cada respuesta.
- No uses "Hola".
- No hagas múltiples preguntas.
- No hagas preguntas abiertas innecesarias.
- No presiones a la persona.
- No inventes información.
- Utiliza exclusivamente la información oficial incluida aquí.
- No cambies precios, métodos de pago, tiempos de entrega, condiciones, garantías ni políticas.
- No agregues productos, bonos, descuentos, promociones o beneficios no autorizados.
- No diagnostiques ni indiques tratamientos médicos.
- No contradigas las respuestas oficiales.
- Si no existe información suficiente, indica de forma natural que necesitas confirmar ese dato con el equipo de Mamá Segura.

INFORMACIÓN REAL Y AUTORIZADA:
- Negocio: Mamá Segura.
- Producto: Kit Mamá Segura.
- Tipo de producto: digital.
- Es una guía integral que acompaña a una mamá primeriza desde el nacimiento hasta los primeros años del bebé.
- Ayuda a criar con más tranquilidad, seguridad y confianza.
- Ayuda frente a la desinformación, la sobreinformación, las dudas frecuentes, las inseguridades y los miedos en las distintas etapas del bebé.
- Busca que la mamá se sienta acompañada, validada e informada y que pueda recuperar la sensación de control.
- Forma de entrega: archivos PDF descargables mediante un enlace.
- Tiempo de entrega: inmediatamente después de confirmar el pago. La entrega demora solo unos segundos.
- Contenido: 13 documentos PDF descargables con guías prácticas de maternidad, checklists para organizarse, registros de sueño, lactancia y actividades, orientación sobre alimentación y crecimiento, y recursos para el bienestar de la mamá.
- Edad: materiales para acompañar a bebés y niños desde los 0 hasta los 6 años.
- Precio: 89 bolivianos.
- Métodos de pago: transferencia bancaria, código QR y depósito o pago por Yape.
- Uso: las guías pueden consultarse desde el celular. Los checklists deben imprimirse para utilizarlos correctamente.
- Soporte: si existe dificultad para abrir o descargar los archivos, la persona debe contactar al equipo y los archivos se compartirán nuevamente.
- Alcance: el Kit Mamá Segura es una guía de apoyo para acompañar a la mamá durante una etapa muy demandante. No reemplaza la orientación, evaluación ni tratamiento de un pediatra o profesional de salud cuando exista una situación que requiera atención especializada.
- Devoluciones: el Kit Mamá Segura no tiene devolución porque, una vez confirmado el pago, se entrega inmediatamente el material digital.
- Garantía: acceso de por vida a los archivos recibidos.

OBJETIVO:
- Resolver cada duda de forma breve, clara y útil.
- Transmitir acompañamiento, seguridad y confianza.
- Agregar un cierre comercial únicamente cuando la persona pregunte por precio, métodos de pago o manifieste una intención clara de comprar.
- En ese caso, invitar suavemente a elegir transferencia bancaria, código QR o depósito o pago por Yape.
- No agregar cierres comerciales en consultas de soporte, salud, devoluciones, garantías ni después de que la persona ya realizó el pago.
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
    Math.floor(Math.random() * opciones.length)
  ];
}

function limpiarRespuesta(texto) {
  texto = String(texto || "").trim();

  texto = texto
    .replace(
      /^¡?\s*hola\s*[😊🙏❤️✨💛,.!]*\s*/gi,
      ""
    )
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

function cierrePago() {
  const cierres = [
    `Para continuar con tu compra, indícame si prefieres transferencia bancaria, código QR o depósito o pago por Yape. 💛`,

    `Puedes realizar el pago mediante transferencia bancaria, código QR o depósito o pago por Yape. ¿Qué método prefieres?`,

    `Para adquirir tu Kit Mamá Segura, puedes elegir transferencia bancaria, código QR o depósito o pago por Yape. 😊`,
  ];

  return elegirAleatoria(cierres);
}

function debeAgregarCierre(textoNormalizado) {
  const contextoSinCierre =
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

  if (contextoSinCierre) {
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

  return `${limpio}\n\n${cierrePago()}`;
}

function respuestaDirecta(textoNormalizado) {
  if (
    textoNormalizado.includes("no puedo abrir") ||
    textoNormalizado.includes("no abre") ||
    textoNormalizado.includes("no puedo descargar") ||
    textoNormalizado.includes("no descarga") ||
    textoNormalizado.includes(
      "problema con el archivo"
    ) ||
    textoNormalizado.includes(
      "problema con los archivos"
    ) ||
    textoNormalizado.includes(
      "problema con el enlace"
    ) ||
    textoNormalizado.includes(
      "problema con el link"
    ) ||
    textoNormalizado.includes(
      "dificultad para abrir"
    ) ||
    textoNormalizado.includes(
      "dificultad para descargar"
    ) ||
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
    textoNormalizado.includes(
      "profesional de salud"
    ) ||
    textoNormalizado.includes("consulta medica") ||
    textoNormalizado.includes(
      "reemplaza al pediatra"
    ) ||
    textoNormalizado.includes(
      "reemplaza una consulta"
    ) ||
    textoNormalizado.includes("tratamiento") ||
    textoNormalizado.includes(
      "evaluacion medica"
    ) ||
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
    textoNormalizado.includes(
      "acceso de por vida"
    ) ||
    textoNormalizado.includes("de por vida") ||
    (textoNormalizado.includes("entrega") &&
      (textoNormalizado.includes("devolucion") ||
        textoNormalizado.includes("reembolso") ||
        textoNormalizado.includes("garantia")))
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
    textoNormalizado.includes(
      "usar desde el celular"
    ) ||
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
    textoNormalizado.includes(
      "cuanto tiempo tarda"
    ) ||
    textoNormalizado.includes("cuanto demora") ||
    textoNormalizado.includes("cuando llega") ||
    textoNormalizado.includes(
      "tiempo de entrega"
    ) ||
    textoNormalizado.includes("tiempo de envio") ||
    textoNormalizado.includes(
      "despues del comprobante"
    ) ||
    textoNormalizado.includes(
      "envie el comprobante"
    ) ||
    textoNormalizado.includes(
      "enviar el comprobante"
    ) ||
    textoNormalizado.includes(
      "confirmacion del pago"
    ) ||
    textoNormalizado.includes(
      "confirmar el pago"
    ) ||
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
    textoNormalizado.includes(
      "registros de sueno"
    ) ||
    textoNormalizado.includes(
      "registros de lactancia"
    ) ||
    textoNormalizado.includes(
      "alimentacion y crecimiento"
    ) ||
    textoNormalizado.includes(
      "bienestar como mama"
    )
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
    textoNormalizado.includes(
      "metodos de pago"
    ) ||
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
    textoNormalizado.includes(
      "producto digital"
    ) ||
    textoNormalizado.includes("formato fisico") ||
    textoNormalizado.includes(
      "formato digital"
    ) ||
    textoNormalizado.includes("material fisico") ||
    textoNormalizado.includes(
      "material digital"
    ) ||
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
    textoNormalizado.includes(
      "enlace de descarga"
    ) ||
    textoNormalizado.includes("link de descarga") ||
    textoNormalizado.includes("pdf descargable") ||
    textoNormalizado.includes("recibo") ||
    (textoNormalizado.includes("entrega") &&
      (textoNormalizado.includes("kit") ||
        textoNormalizado.includes("pdf") ||
        textoNormalizado.includes("enlace") ||
        textoNormalizado.includes("link")))
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

function extraerTextoDeObjeto(
  valor,
  profundidad = 0
) {
  if (
    profundidad > 4 ||
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
        extraerTextoDeObjeto(
          convertido,
          profundidad + 1
        ) || texto
      );
    } catch (error) {
      const parametros = new URLSearchParams(texto);

      const claves = [
        "texto",
        "mensaje",
        "message",
        "text",
        "pregunta",
        "question",
        "input",
        "user_input",
        "last_text_input",
      ];

      for (const clave of claves) {
        const encontrado = parametros.get(clave);

        if (encontrado && encontrado.trim()) {
          return encontrado.trim();
        }
      }

      return texto;
    }
  }

  if (typeof valor !== "object") {
    return "";
  }

  const clavesPreferidas = [
    "texto",
    "mensaje",
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

  for (const clave of clavesPreferidas) {
    if (
      Object.prototype.hasOwnProperty.call(
        valor,
        clave
      )
    ) {
      const encontrado = extraerTextoDeObjeto(
        valor[clave],
        profundidad + 1
      );

      if (encontrado) {
        return encontrado;
      }
    }
  }

  const contenedores = [
    "data",
    "body",
    "payload",
    "request",
    "fields",
    "custom_fields",
  ];

  for (const clave of contenedores) {
    if (
      Object.prototype.hasOwnProperty.call(
        valor,
        clave
      )
    ) {
      const encontrado = extraerTextoDeObjeto(
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

function obtenerMensaje(req) {
  return (
    extraerTextoDeObjeto(req.body) ||
    extraerTextoDeObjeto(req.query) ||
    ""
  ).trim();
}

app.get("/", (req, res) => {
  return res.status(200).json({
    estado: "activo",
    servicio: "Agente Mamá Segura",
    endpoint: "/mensaje",
  });
});

app.get("/health", (req, res) => {
  return res.status(200).json({
    estado: "ok",
  });
});

async function procesarMensaje(req, res) {
  try {
    const texto = obtenerMensaje(req);

    console.log(
      "Mensaje recibido:",
      texto ? "[contenido recibido]" : "[vacio]"
    );

    if (!texto) {
      console.log(
        "Intencion detectada: mensaje_vacio"
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
        "Intencion detectada:",
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
      "Intencion detectada: consulta_abierta"
    );

    if (!openai) {
      console.log(
        "Respuesta enviada: falta_OPENAI_API_KEY"
      );

      return res.status(200).json({
        respuesta:
          "Necesito confirmar ese dato con el equipo de Mamá Segura para darte una respuesta correcta.",
      });
    }

    try {
      const response =
        await openai.responses.create({
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

      const respuestaIA =
        response.output_text || "";

      const respuestaFinal = agregarCierre(
        respuestaIA,
        textoNormalizado
      );

      console.log("Respuesta enviada: OpenAI");

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
}

app.post("/mensaje", procesarMensaje);
app.get("/mensaje", procesarMensaje);
app.post("/webhook", procesarMensaje);
app.post("/", procesarMensaje);

app.use((req, res) => {
  return res.status(404).json({
    respuesta:
      "Ruta no encontrada. Utiliza POST /mensaje para enviar consultas.",
  });
});

app.use((error, req, res, next) => {
  console.error(
    "Error del servidor:",
    error.message
  );

  if (res.headersSent) {
    return next(error);
  }

  return res.status(200).json({
    respuesta:
      "No pude identificar tu mensaje. Por favor, escríbelo nuevamente.",
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(
    `Servidor corriendo en puerto ${PORT}`
  );
});
