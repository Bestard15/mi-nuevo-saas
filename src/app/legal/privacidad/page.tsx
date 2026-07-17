import type { Metadata } from "next";

import { LegalDoc, LegalFacts, LegalSection } from "@/components/legal/legal-doc";

export const metadata: Metadata = {
  title: "Política de Privacidad — Echoboard",
  description:
    "Cómo trata UPDATA LINK, S.L. los datos personales en Echoboard: finalidades, bases jurídicas, destinatarios y derechos RGPD.",
};

export default function PrivacidadPage() {
  return (
    <LegalDoc
      eyebrow="Documento legal · RGPD"
      title="Política de Privacidad"
      updated="17 de julio de 2026"
    >
      <LegalSection number="01" title="Responsable del tratamiento">
        <p>
          El responsable del tratamiento de los datos personales recogidos a través de
          Echoboard es:
        </p>
        <LegalFacts
          rows={[
            ["Responsable", "UPDATA LINK, S.L."],
            ["NIF", "B13959267"],
            ["Domicilio", "Calle Costa del Sol, nº 5, 28033 Madrid (España)"],
            [
              "Contacto en materia de privacidad",
              <a
                key="email"
                href="mailto:hola@updatalink.com"
                className="text-primary hover:underline"
              >
                hola@updatalink.com
              </a>,
            ],
          ]}
        />
        <p>
          Tratamos tus datos conforme al Reglamento (UE) 2016/679 (RGPD) y a la Ley Orgánica
          3/2018 (LOPDGDD). Este documento te explica, sin letra pequeña, qué datos recogemos,
          para qué y qué derechos tienes.
        </p>
      </LegalSection>

      <LegalSection number="02" title="Qué datos tratamos y para qué">
        <p>Tratamos únicamente los datos necesarios para prestar el servicio:</p>
        <ul className="flex list-disc flex-col gap-3 pl-5">
          <li>
            <strong>Gestión de tu cuenta</strong> (nombre, email y avatar facilitados por tu
            proveedor de acceso Google o GitHub): crear tu cuenta, autenticarte y comunicarnos
            contigo sobre el servicio. Base jurídica: ejecución del contrato (art. 6.1.b RGPD).
          </li>
          <li>
            <strong>Funcionamiento de los tableros</strong> (peticiones, votos, comentarios y,
            si tu proveedor los envía mediante la identificación SSO, atributos como empresa,
            plan e importe de suscripción): prestar la funcionalidad esencial de priorización
            de feedback. Base jurídica: ejecución del contrato (art. 6.1.b RGPD).
          </li>
          <li>
            <strong>Cobros y facturación</strong> (identificador de cliente y estado de la
            suscripción): gestionar los planes de pago y cumplir obligaciones fiscales y
            contables. Bases jurídicas: ejecución del contrato (art. 6.1.b) y obligación legal
            (art. 6.1.c RGPD).
          </li>
          <li>
            <strong>Avisos de producto</strong> (email de los votantes de una petición):
            avisarte cuando una mejora que votaste se publica. Base jurídica: interés legítimo
            en cerrar el ciclo del feedback (art. 6.1.f RGPD); puedes oponerte en cualquier
            momento.
          </li>
        </ul>
        <p>
          No elaboramos perfiles publicitarios, no vendemos datos y no tomamos decisiones
          automatizadas con efectos jurídicos sobre ti.
        </p>
      </LegalSection>

      <LegalSection number="03" title="Los datos de pago los gestiona Stripe">
        <p>
          Los pagos se procesan directamente por{" "}
          <strong>Stripe Payments Europe, Ltd.</strong> Los datos de tu tarjeta viajan de tu
          navegador a Stripe y <strong>nunca se almacenan en nuestros servidores</strong>:
          nosotros solo conservamos un identificador de cliente y el estado de la suscripción.
          Puedes consultar la política de privacidad de Stripe en su sitio web.
        </p>
      </LegalSection>

      <LegalSection number="04" title="Destinatarios y encargados del tratamiento">
        <p>
          No cedemos tus datos a terceros salvo obligación legal. Para prestar el servicio nos
          apoyamos en proveedores que actúan como encargados del tratamiento con contratos del
          art. 28 RGPD: alojamiento de la aplicación (Vercel), base de datos (Neon/Supabase),
          procesamiento de pagos (Stripe) y envío de correos transaccionales (Resend). Cuando
          alguno de estos proveedores trata datos fuera del Espacio Económico Europeo, la
          transferencia se ampara en cláusulas contractuales tipo de la Comisión Europea o en
          el Marco de Privacidad de Datos UE-EE. UU.
        </p>
        <p>
          <strong>Un matiz importante para clientes finales</strong>: si votas en el tablero de
          una empresa que usa Echoboard y esa empresa te identifica mediante SSO, dicha empresa
          es la responsable del tratamiento de esos datos y UPDATA LINK, S.L. actúa como su
          encargado, tratándolos solo según sus instrucciones para prestar el servicio.
        </p>
      </LegalSection>

      <LegalSection number="05" title="Plazos de conservación">
        <p>
          Conservamos tus datos mientras tu cuenta esté activa. Al eliminarla, suprimimos o
          anonimizamos los datos en un plazo máximo de 30 días, salvo aquellos que debamos
          conservar bloqueados para atender obligaciones legales (por ejemplo, facturación:
          hasta 6 años conforme al Código de Comercio).
        </p>
      </LegalSection>

      <LegalSection number="06" title="Tus derechos y cómo ejercerlos">
        <p>Puedes ejercer en cualquier momento tus derechos de:</p>
        <ul className="flex list-disc flex-col gap-2 pl-5">
          <li><strong>Acceso</strong>: saber qué datos tuyos tratamos.</li>
          <li><strong>Rectificación</strong>: corregir datos inexactos.</li>
          <li><strong>Supresión</strong>: pedir que eliminemos tus datos.</li>
          <li><strong>Oposición</strong>: oponerte a tratamientos basados en interés legítimo, como los avisos de producto.</li>
          <li><strong>Limitación y portabilidad</strong>: restringir el tratamiento o recibir tus datos en formato estructurado.</li>
        </ul>
        <p>
          Para ejercerlos, escribe a{" "}
          <a href="mailto:hola@updatalink.com" className="font-medium text-primary hover:underline">
            hola@updatalink.com
          </a>{" "}
          indicando el derecho que deseas ejercer y la dirección de correo de tu cuenta.
          Responderemos en el plazo máximo de un mes. Si consideras que no hemos atendido
          correctamente tus derechos, puedes reclamar ante la Agencia Española de Protección de
          Datos (aepd.es).
        </p>
      </LegalSection>

      <LegalSection number="07" title="Seguridad">
        <p>
          Aplicamos medidas técnicas y organizativas apropiadas al riesgo: cifrado de las
          comunicaciones (TLS), sesiones firmadas, almacenamiento exclusivo del hash de las
          claves de API, firma criptográfica de los webhooks salientes y control de acceso
          estricto a los tableros privados.
        </p>
      </LegalSection>

      <LegalSection number="08" title="Cambios en esta política">
        <p>
          Si modificamos esta política de forma sustancial, te lo comunicaremos por email o
          mediante un aviso visible en la Plataforma antes de que el cambio surta efecto.
        </p>
      </LegalSection>
    </LegalDoc>
  );
}
