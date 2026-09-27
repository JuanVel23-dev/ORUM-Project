import type { Metadata } from 'next'
import { PaginaLegal } from '../_components/pagina-legal'

export const metadata: Metadata = {
  title: 'Política de privacidad · ORUM',
  description:
    'Cómo ORUM recolecta, usa y protege los datos personales de socios, comercios y visitantes.',
}

/*
  BORRADOR GENÉRICO — pendiente de revisión legal.

  Redactada sobre la Ley 1581 de 2012 y el Decreto 1377 de 2013 (régimen
  colombiano de protección de datos / Habeas Data). Igual que en /terminos,
  los datos propios de la empresa que no están disponibles en el sistema
  quedan como marcador entre corchetes.
*/
export default function PrivacidadPage() {
  return (
    <PaginaLegal titulo="Política de privacidad" actualizado="26 de septiembre de 2026">
      <section>
        <h2>1. Responsable del tratamiento</h2>
        <p>
          <strong>[Razón social — NIT]</strong>, domiciliada en{' '}
          <strong>[Ciudad, Colombia]</strong>, es responsable del tratamiento de
          los datos personales que se recogen a través de ORUM, conforme a la Ley
          1581 de 2012 y el Decreto 1377 de 2013.
        </p>
      </section>

      <section>
        <h2>2. Datos que recolectamos</h2>
        <ul>
          <li>De los socios: nombre, documento de identidad, teléfono, correo y, cuando aplica, una fotografía para el carnet digital.</li>
          <li>De los comercios aliados: nombre del negocio, datos de contacto, ubicación y categoría del negocio.</li>
          <li>De cualquier visitante: los datos que voluntariamente escriba en un formulario del Sitio (por ejemplo, una solicitud de alianza).</li>
        </ul>
      </section>

      <section>
        <h2>3. Finalidad del tratamiento</h2>
        <ul>
          <li>Administrar la membresía y verificar el acceso a los beneficios del club.</li>
          <li>Poner en contacto a socios y comercios aliados para la redención de beneficios.</li>
          <li>Responder solicitudes de alianza y de soporte.</li>
          <li>Enviar comunicaciones sobre el servicio, novedades y beneficios del club.</li>
          <li>Cumplir obligaciones legales y contables.</li>
        </ul>
      </section>

      <section>
        <h2>4. Derechos del titular</h2>
        <p>Como titular de tus datos personales, tienes derecho a:</p>
        <ul>
          <li>Conocer, actualizar y rectificar tus datos personales.</li>
          <li>Solicitar prueba de la autorización otorgada para el tratamiento de tus datos.</li>
          <li>Ser informado sobre el uso que se ha dado a tus datos personales.</li>
          <li>Presentar quejas ante la Superintendencia de Industria y Comercio por infracciones a la ley.</li>
          <li>Revocar la autorización y/o solicitar la eliminación de tus datos, cuando no exista un deber legal o contractual que lo impida.</li>
          <li>Acceder de forma gratuita a tus datos personales que hayan sido objeto de tratamiento.</li>
        </ul>
      </section>

      <section>
        <h2>5. Cómo ejercer estos derechos</h2>
        <p>
          Puedes ejercer cualquiera de estos derechos escribiendo a{' '}
          <strong>[correo de protección de datos]</strong>, o por el WhatsApp de
          soporte que aparece en el pie de cualquier página del Sitio. Atenderemos
          tu solicitud dentro de los plazos que establece la ley.
        </p>
      </section>

      <section>
        <h2>6. Transferencia y transmisión de datos</h2>
        <p>
          Compartimos con un comercio aliado únicamente el dato necesario para
          verificar que una membresía está vigente al momento de redimir un
          beneficio — nunca el listado completo de tus datos personales.
          También usamos proveedores tecnológicos (almacenamiento en la nube,
          envío de correo) que tratan los datos en nuestro nombre y bajo nuestras
          instrucciones, exclusivamente para prestar el servicio de ORUM.
        </p>
      </section>

      <section>
        <h2>7. Seguridad de la información</h2>
        <p>
          Aplicamos medidas técnicas y organizativas razonables para proteger tus
          datos personales contra pérdida, uso indebido o acceso no autorizado.
          Ningún sistema es completamente infalible, y trabajamos de forma
          continua para mejorar estas medidas.
        </p>
      </section>

      <section>
        <h2>8. Vigencia</h2>
        <p>
          Tus datos se conservan mientras exista una relación con ORUM (como
          socio, comercio aliado o solicitante) y, después, durante el tiempo que
          exijan las obligaciones legales o contables aplicables.
        </p>
      </section>

      <section>
        <h2>9. Cambios en esta política</h2>
        <p>
          Podemos actualizar esta política para reflejar cambios en el servicio o
          en la normativa aplicable. La fecha de «Última actualización» en la
          parte superior de esta página indica la versión vigente.
        </p>
      </section>
    </PaginaLegal>
  )
}
