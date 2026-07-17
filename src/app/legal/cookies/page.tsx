import type { Metadata } from "next";

import { LegalDoc, LegalSection } from "@/components/legal/legal-doc";

export const metadata: Metadata = {
  title: "Política de Cookies — Echoboard",
  description:
    "Echoboard solo utiliza cookies técnicas esenciales, exentas de consentimiento según el criterio de la AEPD. Aquí te contamos cuáles y para qué.",
};

const COOKIES = [
  {
    name: "authjs.session-token",
    owner: "Echoboard (propia)",
    purpose: "Mantener tu sesión iniciada en el panel de equipo",
    duration: "Sesión / 30 días",
  },
  {
    name: "authjs.csrf-token",
    owner: "Echoboard (propia)",
    purpose: "Proteger el inicio de sesión frente a ataques CSRF",
    duration: "Sesión",
  },
  {
    name: "eb_uid",
    owner: "Echoboard (propia)",
    purpose: "Recordar tu identidad anónima para que tus votos no se dupliquen",
    duration: "1 año",
  },
  {
    name: "eb_sso_{proyecto}",
    owner: "Echoboard (propia)",
    purpose: "Mantener tu identificación como cliente de la empresa que usa el tablero (SSO)",
    duration: "30 días",
  },
  {
    name: "__stripe_*",
    owner: "Stripe (tercero)",
    purpose: "Procesar el pago y prevenir fraude, solo durante el checkout de suscripción",
    duration: "Según Stripe",
  },
] as const;

export default function CookiesPage() {
  return (
    <LegalDoc
      eyebrow="Documento legal · Cookies"
      title="Política de Cookies"
      updated="17 de julio de 2026"
    >
      <LegalSection number="01" title="La versión corta">
        <p>
          Echoboard <strong>solo utiliza cookies técnicas esenciales</strong>: las
          imprescindibles para que puedas iniciar sesión, votar sin duplicados, mantener tu
          identificación en tableros privados y pagar de forma segura.{" "}
          <strong>No usamos cookies de publicidad, ni de seguimiento, ni analítica de
          terceros con fines comerciales.</strong>
        </p>
        <p>
          Por eso no verás en Echoboard un banner de consentimiento: conforme al artículo
          22.2 de la LSSI-CE y a la Guía sobre el uso de cookies de la Agencia Española de
          Protección de Datos, las cookies estrictamente necesarias para prestar el servicio
          solicitado por el usuario están exentas de consentimiento previo.
        </p>
      </LegalSection>

      <LegalSection number="02" title="Qué es una cookie">
        <p>
          Una cookie es un pequeño archivo que el navegador guarda cuando visitas un sitio web
          y que permite recordar información entre visitas — por ejemplo, que ya has iniciado
          sesión. Por sí misma no identifica a una persona, sino a un navegador.
        </p>
      </LegalSection>

      <LegalSection number="03" title="Cookies que utilizamos">
        <div className="overflow-x-auto rounded-xl border shadow-soft">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
                <th className="px-4 py-2.5 font-medium">Cookie</th>
                <th className="px-4 py-2.5 font-medium">Titular</th>
                <th className="px-4 py-2.5 font-medium">Finalidad</th>
                <th className="px-4 py-2.5 font-medium">Duración</th>
              </tr>
            </thead>
            <tbody>
              {COOKIES.map((cookie) => (
                <tr key={cookie.name} className="border-b align-top last:border-0">
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-xs">{cookie.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{cookie.owner}</td>
                  <td className="px-4 py-3">{cookie.purpose}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                    {cookie.duration}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          Todas ellas tienen carácter <strong>técnico y esencial</strong>. Las cookies de
          Stripe solo se instalan al iniciar un proceso de pago y su finalidad exclusiva es la
          ejecución segura de la transacción y la prevención del fraude.
        </p>
      </LegalSection>

      <LegalSection number="04" title="Cómo bloquear o eliminar cookies">
        <p>
          Puedes configurar tu navegador para bloquear o eliminar cookies desde sus ajustes de
          privacidad (Chrome, Firefox, Safari y Edge lo permiten). Ten en cuenta que, al
          tratarse de cookies estrictamente funcionales, bloquearlas impedirá iniciar sesión,
          mantener tus votos o completar un pago.
        </p>
      </LegalSection>

      <LegalSection number="05" title="Cambios en esta política">
        <p>
          Si en el futuro incorporásemos cookies no esenciales (por ejemplo, de analítica),
          actualizaríamos esta política y solicitaríamos tu consentimiento previo mediante un
          sistema de gestión de preferencias, como exige la normativa.
        </p>
      </LegalSection>
    </LegalDoc>
  );
}
