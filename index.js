require("dotenv").config();

const express = require("express");
const OpenAI = require("openai");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  : null;

const PORT = process.env.PORT || 8080;

const SYSTEM_PROMPT = `
Eres la asesora virtual de Mamá Segura. Atiendes por WhatsApp consultas sobre el producto digital "Kit Mamá Segura".

Tu trabajo es responder de forma NATURAL, BREVE, CÁLIDA y HUMANA, como una persona real que acompaña a una mamá primeriza con empatía y claridad.

IMPORTANTE:
- Nunca suenes robótica.
- Varía ligeramente la redacción sin cambiar el significado de la información oficial.
- Responde máximo en 1 o 2 párrafos cortos.
- No saludes al inicio de cada respuesta.
- No uses "Hola".
- No hagas múltiples preguntas.
- No hagas preguntas abiertas innecesarias.
- No presiones a la persona.
- No inventes información.
- No agregues productos, precios, promociones, bonos, beneficios, métodos de pago, garantías o condiciones que no estén indicados aquí.
- No contradigas la información oficial del negocio.
- No diagnostiques ni indiques tratamientos médicos.
- Cuando no exista información suficiente, responde de manera natural que necesitas confirmar ese dato con el equipo de Mamá Segura.
- Utiliza exclusivamente esta base de conocimiento.

INFORMACIÓN REAL Y AUTORIZADA:
- Negocio: Mamá Segura.
- Producto: Kit Mamá Segura.
- Tipo de producto: digital.
- El Kit Mamá Segura es una guía integral que acompaña a una mamá primeriza desde el nacimiento hasta los primeros años del bebé.
- Ayuda a criar con más tranquilidad, seguridad y confianza.
- Busca reducir la desinformación, la sobreinformación, las dudas frecuentes, las inseguridades y los miedos en las distintas etapas del bebé.
- Busca que la mamá se sienta acompañada, validada e informada y que pueda recuperar la sensación de control.
- Forma de entrega: archivos PDF descargables mediante un enlace.
- Tiempo de entrega: inmediatamente después de confirmar el pago. La entrega demora solo unos segundos.
- Contenido: 13 documentos PDF descargables con guías prácticas de maternidad, checklists para organizarse, registros de sueño, lactancia y actividades, orientación sobre alimentación y crecimiento, y recursos para el bienestar de la mamá.
- Edad: materiales para bebés y niños desde los 0 hasta los 6 años.
- Precio: 89 bolivianos.
- Métodos de pago: transferencia bancaria, código QR y depósito o pago por Yape.
- Formato: producto digital en archivos PDF descargables mediante un enlace.
- Uso: las guías pueden consultarse desde el celular. Los checklists deben imprimirse para utilizarlos correctamente.
- Soporte: si existe dificultad para abrir o descargar los archivos, la persona debe contactar al equipo y los archivos se compartirán nuevamente.
- Alcance: es una guía de apoyo para acompañar a la mamá durante una etapa muy demandante. No reemplaza la orientación, evaluación ni tratamiento de un pediatra o profesional de salud cuando exista una situación que requiera atención especializada.
- Devoluciones: no tiene devolución, ya que una vez confirmado el pago se entrega inmediatamente el material digital.
- Garantía: acceso de por vida a los archivos recibidos.

OBJETIVO:
- Resolver la duda de forma breve, clara y útil.
- Transmitir acompañamiento, seguridad y confianza.
- Agregar un cierre comercial solamente cuando la persona pregunte por el precio, los métodos de pago o manifieste intención clara de comprar.
- En esos casos, invítala suavemente a elegir transferencia bancaria, código QR o depósito o pago por Yape.
- No agregues un cierre comercial en consultas de soporte, salud, devoluciones, garantías o después de que la persona ya realizó el pago.
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
    .replace(/^¡?\s*hola\s*[😊🙏❤️✨💛,\.\!]*\s*/gi, "")
    .replace(
      /^gracias por preguntar\s*[😊🙏❤️✨💛,\.\!]*\s*/gi,
      ""
    )
    .replace(
      /^buenos días\s*[😊🙏❤️✨💛,\.\!]*\s*/gi,
      ""
    )
    .replace(
      /^buenos dias\s*[😊🙏❤️✨💛,\.\!]*\s*/gi,
      ""
    )
    .replace(
      /^buenas tardes\s*[😊🙏❤️✨💛,\.\!]*\s*/gi,
      ""
    )
    .replace(
      /^buenas noches\s*[😊🙏❤️✨💛,\.\!]*\s*/gi,
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
  const yaPagoOSolicitaSoporte =
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

  if (yaPagoOSolicitaSoporte) {
    return false;
  }

  return (
    textoNormalizado.includes("precio") ||
    textoNormalizado.includes("costo") ||
    textoNormalizado.includes("cuanto cuesta") ||
    textoNormalizado.includes("cuesta") ||
    textoNormalizado.includes("comprar") ||
    textoNormalizado.includes("quiero comprar") ||
    textoNormalizado.includes("como pago") ||
    textoNormalizado.includes("pagar") ||
    textoNormalizado.includes("metodo de pago") ||
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

  return `${limpio}

${cierrePago()}`;
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
    textoNormalizado.includes("dificultad para descargar")
  ) {
    const respuestasProblema = [
      `Si tienes alguna dificultad para abrir o descargar los archivos, contáctanos y te los compartimos nuevamente.`,

      `Si tienes problemas para abrir o descargar los archivos, contáctanos y te los compartiremos nuevamente.`,

      `Si no puedes abrir o descargar los archivos, escríbenos y te los compartimos nuevamente.`,
    ];

    return {
      intencion: "problema_descarga",
      respuesta: elegirAleatoria(respuestasProblema),
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
    textoNormalizado.includes("evaluacion medica")
  ) {
    const respuestasConsulta = [
      `El Kit Mamá Segura es una guía de apoyo para acompañar a la mamá durante una etapa muy demandante. No reemplaza la orientación, evaluación ni tratamiento de un pediatra o profesional de salud cuando exista una situación que requiera atención especializada.`,

      `El Kit Mamá Segura acompaña y apoya a la mamá en una etapa muy demandante, pero no reemplaza la orientación, evaluación ni tratamiento de un pediatra o profesional de salud cuando se requiera atención especializada.`,

      `El kit funciona como una guía de apoyo para la mamá. No sustituye la orientación, evaluación ni tratamiento de un pediatra o profesional de salud ante una situación que necesite atención especializada.`,
    ];

    return {
      intencion: "consulta_profesional_salud",
      respuesta: elegirAleatoria(respuestasConsulta),
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
    const respuestasGarantia = [
      `El Kit Mamá Segura no tiene devolución, ya que una vez confirmado el pago se entrega inmediatamente el material digital. La garantía de tu compra es que tendrás acceso de por vida a los archivos recibidos.`,

      `El kit no tiene devolución porque el material digital se entrega inmediatamente después de confirmar el pago. La garantía de la compra es el acceso de por vida a los archivos recibidos.`,

      `No se realizan devoluciones, ya que el material digital se entrega en cuanto se confirma el pago. Tu garantía es que tendrás acceso de por vida a los archivos recibidos.`,
    ];

    return {
      intencion: "devolucion_garantia",
      respuesta: elegirAleatoria(respuestasGarantia),
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
    textoNormalizado.includes("checklists")
  ) {
    const respuestasUso = [
      `Puedes consultar las guías directamente desde tu celular. Los checklists sí deben imprimirse para poder utilizarlos correctamente.`,

      `Las guías pueden consultarse directamente desde el celular. Los checklists sí deben imprimirse para utilizarlos correctamente.`,

      `Puedes usar las guías desde tu celular; los checklists sí necesitan imprimirse para poder utilizarlos correctamente.`,
    ];

    return {
      intencion: "uso_materiales",
      respuesta: elegirAleatoria(respuestasUso),
    };
  }

  if (
    textoNormalizado.includes("cuanto tarda") ||
    textoNormalizado.includes("cuanto demora") ||
    textoNormalizado.includes("cuando llega") ||
    textoNormalizado.includes("tiempo de entrega") ||
    textoNormalizado.includes("despues del comprobante") ||
    textoNormalizado.includes("envie el comprobante") ||
    textoNormalizado.includes("enviar el comprobante") ||
    textoNormalizado.includes("confirmacion del pago") ||
    textoNormalizado.includes("inmediatamente") ||
    textoNormalizado.includes("segundos") ||
    textoNormalizado.includes("envio")
  ) {
    const respuestasEnvio = [
      `Recibes tu Kit Mamá Segura inmediatamente después de que confirmamos el pago. La entrega demora solo unos segundos.`,

      `El Kit Mamá Segura se entrega inmediatamente después de confirmar el pago. La entrega demora solo unos segundos.`,

      `Una vez que confirmamos el pago, recibes tu Kit Mamá Segura inmediatamente; la entrega demora solo unos segundos.`,
    ];

    return {
      intencion: "tiempo_envio",
      respuesta: elegirAleatoria(respuestasEnvio),
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
    const respuestasPrecio = [
      `El Kit Mamá Segura cuesta 89 bolivianos. Aceptamos pagos mediante transferencia bancaria, código QR y depósito o pago por Yape.`,

      `El precio del Kit Mamá Segura es de 89 bolivianos. Puedes pagar mediante transferencia bancaria, código QR y depósito o pago por Yape.`,

      `Puedes adquirir el Kit Mamá Segura por 89 bolivianos. Los métodos de pago son transferencia bancaria, código QR y depósito o pago por Yape.`,
    ];

    return {
      intencion: "precio_metodos_pago",
      respuesta: agregarCierre(
        elegirAleatoria(respuestasPrecio),
        textoNormalizado
      ),
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
    textoNormalizado.includes("bebe de")
  ) {
    const respuestasEdad = [
      `El Kit Mamá Segura incluye materiales para acompañar a bebés y niños desde los 0 hasta los 6 años.`,

      `Los materiales del Kit Mamá Segura acompañan a bebés y niños desde los 0 hasta los 6 años.`,

      `El kit incluye materiales para bebés y niños desde el nacimiento hasta los 6 años.`,
    ];

    return {
      intencion: "edad_bebe",
      respuesta: elegirAleatoria(respuestasEdad),
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
    const respuestasContenido = [
      `Recibes 13 documentos PDF descargables que incluyen guías prácticas de maternidad, checklists para organizarte, registros de sueño, lactancia y actividades, orientación sobre alimentación y crecimiento, y recursos para tu bienestar como mamá.`,

      `El Kit Mamá Segura incluye 13 documentos PDF descargables con guías prácticas de maternidad, checklists para organizarte, registros de sueño, lactancia y actividades, orientación sobre alimentación y crecimiento, y recursos para tu bienestar como mamá.`,

      `Recibirás 13 documentos PDF descargables: guías prácticas de maternidad, checklists para organizarte, registros de sueño, lactancia y actividades, orientación sobre alimentación y crecimiento, y recursos para tu bienestar como mamá.`,
    ];

    return {
      intencion: "contenido_kit",
      respuesta: elegirAleatoria(respuestasContenido),
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
    textoNormalizado.includes("descarga")
  ) {
    const respuestasFormato = [
      `El Kit Mamá Segura es un producto digital. Recibirás los materiales en archivos PDF descargables mediante un enlace.`,

      `El Kit Mamá Segura es digital y recibirás los materiales en archivos PDF descargables mediante un enlace.`,

      `No es un producto físico. El Kit Mamá Segura es digital y se entrega en archivos PDF descargables mediante un enlace.`,
    ];

    return {
      intencion: "producto_digital",
      respuesta: elegirAleatoria(respuestasFormato),
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
    const respuestasRecibo = [
      `Recibes tu Kit Mamá Segura en archivos PDF descargables mediante un enlace.`,

      `Tu Kit Mamá Segura se entrega en archivos PDF descargables mediante un enlace.`,

      `Después de realizar el pago, recibes el Kit Mamá Segura mediante un enlace con los archivos PDF descargables.`,
    ];

    return {
      intencion: "recibo_kit",
      respuesta: elegirAleatoria(respuestasRecibo),
    };
  }

  return null;
}

app.get("/", (req, res) => {
  res.send("Bot Mamá Segura activo ✅");
});

app.post("/mensaje", async (req, res) => {
  try {
    const texto =
      req.body.texto ||
      req.body.mensaje ||
      req.body.message ||
      req.body.text ||
      req.body.pregunta ||
      "";

    const textoSeguro =
      typeof texto === "string"
        ? texto
        : String(texto || "");

    console.log(
      "Mensaje recibido:",
      textoSeguro.trim()
        ? "[contenido recibido]"
        : "[vacio]"
    );

    if (!textoSeguro.trim()) {
      console.log("Intencion detectada: mensaje_vacio");
      console.log("Respuesta enviada: mensaje_vacio");

      return res.json({
        respuesta:
          "No pude identificar tu mensaje. Por favor, escríbelo nuevamente.",
      });
    }

    const textoNormalizado =
      normalizarTexto(textoSeguro);

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

      return res.json({
        respuesta: directa.respuesta,
      });
    }

    console.log(
      "Intencion detectada: consulta_abierta"
    );

    if (!openai) {
      console.log(
        "Respuesta enviada: sin_OPENAI_API_KEY"
      );

      return res.json({
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
              content: textoSeguro,
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
    } catch (openaiError) {
      console.error(
        "Error de OpenAI:",
        openaiError.message
      );

      return res.json({
        respuesta:
          "En este momento no pude procesar tu mensaje. Por favor, inténtalo nuevamente en unos minutos.",
      });
    }
  } catch (error) {
    console.error(
      "Error en /mensaje:",
      error.message
    );

    return res.json({
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
