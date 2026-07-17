import type { Metadata } from "next";

import { LegalDoc, LegalFacts, LegalSection } from "@/components/legal/legal-doc";

export const metadata: Metadata = {
  title: "Aviso Legal y Términos del Servicio — Echoboard",
  description:
    "Aviso legal y condiciones de uso de Echoboard, un producto de UPDATA LINK, S.L. (LSSI-CE).",
};

export default function AvisoLegalPage() {
  return (
    <LegalDoc
      eyebrow="Documento legal · LSSI-CE"
      title="Aviso Legal y Términos del Servicio"
      updated="17 de julio de 2026"
    >
      <LegalSection number="01" title="Identificación del titular">
        <p>
          En cumplimiento del artículo 10 de la Ley 34/2002, de 11 de julio, de Servicios de la
          Sociedad de la Información y de Comercio Electrónico (LSSI-CE), se informa de que el
          titular de este sitio web y de la plataforma Echoboard (en adelante, «la Plataforma»)
          es:
        </p>
        <LegalFacts
          rows={[
            ["Razón social", "UPDATA LINK, S.L."],
            ["NIF", "B13959267"],
            ["Domicilio social", "Calle Costa del Sol, nº 5, 28033 Madrid (España)"],
            [
              "Email de contacto",
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
      </LegalSection>

      <LegalSection number="02" title="Objeto y ámbito de aplicación">
        <p>
          El presente Aviso Legal regula el acceso, la navegación y el uso de la Plataforma:
          un software como servicio (SaaS) de tableros de feedback, roadmap público y changelog
          que permite a las empresas usuarias recoger, votar y priorizar peticiones de sus
          propios clientes, incluida la priorización por impacto en ingresos recurrentes.
        </p>
        <p>
          El acceso a la Plataforma atribuye la condición de usuario e implica la aceptación
          plena y sin reservas de estas condiciones en la versión publicada en el momento del
          acceso. Si no está de acuerdo con ellas, debe abstenerse de utilizar la Plataforma.
        </p>
      </LegalSection>

      <LegalSection number="03" title="Condiciones de uso">
        <p>El usuario se compromete a hacer un uso diligente y lícito de la Plataforma y, en particular, a:</p>
        <ul className="flex list-disc flex-col gap-2 pl-5">
          <li>
            No publicar contenidos ilícitos, difamatorios, discriminatorios, que infrinjan
            derechos de terceros o que constituyan spam en los tableros de feedback.
          </li>
          <li>
            Facilitar información veraz en el registro y mantener la confidencialidad de sus
            credenciales de acceso y de sus claves de API, siendo responsable de toda
            actividad realizada desde su cuenta.
          </li>
          <li>
            No intentar vulnerar las medidas de seguridad de la Plataforma, ni realizar
            ingeniería inversa, extracción masiva de datos o un uso de la API que exceda los
            límites razonables del plan contratado.
          </li>
        </ul>
        <p>
          UPDATA LINK, S.L. se reserva el derecho a retirar contenidos y a suspender o cancelar
          cuentas que incumplan estas condiciones, previa comunicación al usuario cuando sea
          posible.
        </p>
      </LegalSection>

      <LegalSection number="04" title="Planes, precios y facturación">
        <p>
          La Plataforma ofrece un plan gratuito y planes de pago por suscripción mensual con
          precio plano, detallados en la página de precios. Los pagos se procesan a través de
          Stripe; el usuario puede modificar o cancelar su suscripción en cualquier momento
          desde el portal de cliente, con efectos al final del período ya abonado. Los precios
          se muestran sin impuestos indirectos, que se aplicarán según la normativa vigente.
        </p>
      </LegalSection>

      <LegalSection number="05" title="Propiedad intelectual e industrial">
        <p>
          El software de la Plataforma, su código fuente, diseño, interfaces, textos, marcas y
          logotipos son titularidad de UPDATA LINK, S.L. o de sus licenciantes, y están
          protegidos por la normativa de propiedad intelectual e industrial. La contratación de
          un plan otorga únicamente una licencia de uso limitada, no exclusiva e intransferible
          durante la vigencia de la suscripción; en ningún caso una cesión de derechos.
        </p>
        <p>
          Los contenidos que los usuarios y sus clientes finales publican en los tableros
          (peticiones, votos, comentarios) pertenecen a sus autores o a la empresa usuaria,
          que conceden a UPDATA LINK, S.L. la licencia imprescindible para alojarlos,
          mostrarlos y procesarlos con el único fin de prestar el servicio.
        </p>
      </LegalSection>

      <LegalSection number="06" title="Limitación de responsabilidad">
        <p>
          UPDATA LINK, S.L. presta la Plataforma «tal cual», con la diligencia razonable de un
          proveedor profesional de SaaS, pero no puede garantizar una disponibilidad
          ininterrumpida ni la ausencia total de errores. En la máxima medida permitida por la
          ley, no será responsable de: (a) los contenidos publicados por los usuarios o sus
          clientes finales en los tableros; (b) los daños indirectos o el lucro cesante
          derivados del uso o imposibilidad de uso del servicio; y (c) los fallos imputables a
          servicios de terceros integrados (alojamiento, pasarela de pago, envío de correo).
        </p>
        <p>
          Nada de lo anterior limita la responsabilidad que no pueda excluirse conforme a la
          normativa aplicable, ni los derechos que asisten a los usuarios consumidores.
        </p>
      </LegalSection>

      <LegalSection number="07" title="Enlaces">
        <p>
          La Plataforma puede contener enlaces a sitios de terceros y los boards públicos de
          los usuarios pueden ser enlazados desde sus propios sitios. UPDATA LINK, S.L. no
          asume responsabilidad por los contenidos de sitios ajenos a los que se enlace.
        </p>
      </LegalSection>

      <LegalSection number="08" title="Modificaciones">
        <p>
          UPDATA LINK, S.L. podrá modificar el presente Aviso Legal para adaptarlo a novedades
          legislativas o del servicio. Las modificaciones sustanciales se comunicarán a los
          usuarios registrados con antelación razonable por correo electrónico o mediante aviso
          en la Plataforma.
        </p>
      </LegalSection>

      <LegalSection number="09" title="Legislación aplicable y jurisdicción">
        <p>
          Estas condiciones se rigen por la legislación española. Para cualquier controversia,
          las partes se someten a los Juzgados y Tribunales de Madrid capital, salvo en los
          supuestos en que el usuario tenga la condición de consumidor, en cuyo caso será
          competente el fuero que la ley le reconozca.
        </p>
      </LegalSection>
    </LegalDoc>
  );
}
