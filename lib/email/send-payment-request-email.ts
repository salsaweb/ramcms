import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendPaymentRequestEmail(email: string, name: string) {
  await resend.emails.send({
    from: 'OBRYS CRM <no-reply@updates.obrys.info>',
    to: email,
    subject: "Payment request for order",
    html: getPaymentRequestEmailTemplate(name),
  });
}

function getPaymentRequestEmailTemplate(name: string) {
  return `
    <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html dir="ltr" lang="en">
  <head>
    <meta content="width=device-width" name="viewport" />
    <meta content="text/html; charset=UTF-8" http-equiv="Content-Type" />
    <meta name="x-apple-disable-message-reformatting" />
    <meta content="IE=edge" http-equiv="X-UA-Compatible" />
    <meta name="x-apple-disable-message-reformatting" />
    <meta
      content="telephone=no,address=no,email=no,date=no,url=no"
      name="format-detection" />
    <style>
      body, table, td, a { -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; }
        table, td { mso-table-lspace:0pt; mso-table-rspace:0pt; border-collapse:collapse !important; }
        img { border:0; outline:none; text-decoration:none; display:block; }
        body { margin:0 !important; padding:0 !important; width:100% !important; background:#e8e0d0; }

        @media screen and (max-width:600px) {
          .container { width:100% !important; }
          .px { padding-left:24px !important; padding-right:24px !important; }
          .h1 { font-size:30px !important; line-height:1.2 !important; }
        }
    </style>
  </head>
  <body style="background-color:#ffffff">
    <table
      border="0"
      width="100%"
      cellpadding="0"
      cellspacing="0"
      role="presentation"
      align="center">
      <tbody>
        <tr>
          <td style="background-color:#ffffff">
            <table
              align="left"
              width="100%"
              border="0"
              cellpadding="0"
              cellspacing="0"
              role="presentation"
              style="max-width:600px;align:left;width:100%;color:#000000;background-color:#ffffff;padding-top:0px;padding-right:0px;padding-bottom:0px;padding-left:0px;border-radius:0px;border-color:#000000">
              <tbody>
                <tr style="width:100%">
                  <td>
                    <div
                      style="margin:0;padding:0;display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">
                      <p style="margin:0;padding:0">
                        Solicitud recibida — el equipo OBRYS te contactará en 48
                        horas.
                      </p>
                    </div>
                    <table
                      width="100%"
                      border="0"
                      cellpadding="0"
                      cellspacing="0"
                      role="presentation"
                      style="margin-top:0;margin-right:0;margin-bottom:0;margin-left:0;padding-top:0;padding-right:0;padding-bottom:0;padding-left:0">
                      <tbody>
                        <tr style="margin:0;padding:0">
                          <td
                            align="center"
                            data-id="__react-email-column"
                            style="margin:0;padding:32px 16px">
                            <table
                              width="600"
                              border="0"
                              cellpadding="0"
                              cellspacing="0"
                              role="presentation"
                              class="container"
                              style="margin-top:0;margin-right:0;margin-bottom:0;margin-left:0;padding-top:0;padding-right:0;padding-bottom:0;padding-left:0;width:600px;max-width:600px;background:#f0e9da;border-style:solid;border-width:1px;border-color:#d8cdb6">
                              <tbody>
                                <tr style="margin:0;padding:0">
                                  <td
                                    class="px"
                                    data-id="__react-email-column"
                                    style="margin:0;padding:32px 40px 24px 40px">
                                    <p style="margin:0;padding:0">
                                      <span style="color:#2b2e1f"
                                        ><span
                                          style="font-family:Georgia, &#x27;Times New Roman&#x27;, serif;font-size:26px;font-weight:bold;letter-spacing:2px;color:#2b2e1f"
                                          >OBRYS</span
                                        ></span
                                      >
                                    </p>
                                  </td>
                                </tr>
                                <tr style="margin:0;padding:0">
                                  <td
                                    class="px"
                                    data-id="__react-email-column"
                                    style="margin:0;padding:0 40px">
                                    <div
                                      style="margin:0;padding:0;border-top:1px solid #d0c4ab;font-size:1px;line-height:1px">
                                      <p style="margin:0;padding:0"> </p>
                                    </div>
                                  </td>
                                </tr>
                                <tr style="margin:0;padding:0">
                                  <td
                                    class="px"
                                    data-id="__react-email-column"
                                    style="margin:0;padding:40px 40px 10px 40px">
                                    <table
                                      border="0"
                                      cellpadding="0"
                                      cellspacing="0"
                                      role="presentation"
                                      style="margin-top:0;margin-right:0;margin-bottom:0;margin-left:0;padding-top:0;padding-right:0;padding-bottom:0;padding-left:0">
                                      <tbody>
                                        <tr style="margin:0;padding:0">
                                          <td
                                            data-id="__react-email-column"
                                            style="margin:0;padding:6px 14px">
                                            <p style="margin:0;padding:0">
                                              <span style="color:#2b2e1f"
                                                ><span
                                                  style="text-transform:uppercase"
                                                  >✓ Solicitud confirmada</span
                                                ></span
                                              >
                                            </p>
                                          </td>
                                        </tr>
                                      </tbody>
                                    </table>
                                  </td>
                                </tr>
                                <tr style="margin:0;padding:0">
                                  <td
                                    class="px"
                                    data-id="__react-email-column"
                                    style="margin:0;padding:10px 40px 10px 40px">
                                    <h1
                                      class="h1"
                                      style="margin:0;padding:0;font-family:Georgia, serif;font-size:40px;line-height:1.2;font-weight:normal;color:#2b2e1f">
                                      Estimado/a ${name},
                                    </h1>
                                  </td>
                                </tr>
                                <tr style="margin:0;padding:0">
                                  <td
                                    class="px"
                                    data-id="__react-email-column"
                                    style="margin:0;padding:24px 40px">
                                    <p style="margin:0 0 16px 0;padding:0;font-family:Georgia, serif;font-size:17px;line-height:1.6;color:#3d4231">
                                      Gracias por su solicitud para participar en el proyecto piloto de OBRYS. Su participación ha sido confirmada. El importe del piloto es de 100 €.
                                    </p>

                                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" class="btn">
                                      <tr>
                                        <td bgcolor="#7a8466" style="border-radius:2px;">
                                          <a href="${process.env.STRIPE_PAYMENT_LINK}" style="display:inline-block; padding:16px 32px; font-family: Georgia, serif; font-size:15px; color:#f5efe0; text-decoration:none; letter-spacing:0.5px;">
                                            Para pagar, siga el enlace &nbsp;→
                                          </a>
                                        </td>
                                      </tr>
                                    </table>
  
                                    <p style="margin:0 0 24px 0;padding:0;font-family:Georgia, serif;font-size:17px;line-height:1.6;color:#3d4231">
                                      Una vez recibido el pago, nos pondremos en contacto con usted en un plazo máximo de <strong>24 horas</strong> para coordinar los siguientes pasos.
                                    </p>
                                    <p style="margin:0 0 24px 0;padding:0;font-family:Georgia, serif;font-size:17px;line-height:1.6;color:#3d4231">
                                      Quedamos a su disposición para cualquier aclaración adicional.
                                    </p>
                                  </td>
                                </tr>
                                <tr style="margin:0;padding:0">
                                  <td
                                    class="px"
                                    data-id="__react-email-column"
                                    style="margin:0;padding:0 40px 32px 40px">
                                    <p
                                      style="margin:0 0 6px 0;padding:0;font-family:Georgia, serif;font-size:17px;color:#3d4231">
                                      Atentamente,
                                    </p>
                                    <p
                                      style="margin:0;padding:0;font-family:Georgia, serif;font-size:17px;color:#2b2e1f">
                                      Equipo OBRYS
                                    </p>
                                  </td>
                                </tr>
                                <tr style="margin:0;padding:0">
                                  <td
                                    class="px"
                                    align="center"
                                    data-id="__react-email-column"
                                    style="margin:0;padding:24px 40px 40px 40px;border-top:1px solid #d0c4ab">
                                    <p
                                      style="margin:0 0 8px 0;padding:0;font-family:Georgia, serif;font-size:13px;color:#5e6450">
                                      OBRYS · Estrategia visual inmobiliaria
                                    </p>
                                    <p
                                      style="margin:0 0 10px 0;padding:0;font-family:Arial, sans-serif;font-size:12px;color:#7a8466">
                                      <a
                                        href="https://www.obrys.info/es"
                                        rel="noopener noreferrer nofollow"
                                        style="color:#7a8466;text-decoration-line:none;text-decoration:none"
                                        target="_blank"
                                        >obrys.info</a
                                      >
                                       · 
                                      <a
                                        href="mailto:hello@obrys.info"
                                        rel="noopener noreferrer nofollow"
                                        style="color:#7a8466;text-decoration-line:none;text-decoration:none"
                                        target="_blank"
                                        >hello@obrys.info</a
                                      >
                                    </p>
                                    <p
                                      style="margin:0;padding:0;font-family:Arial, sans-serif;font-size:11px;color:#9a9580">
                                      © 2026 OBRYS. Todos los derechos
                                      reservados.
                                    </p>
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                    <p style="margin:0;padding:0"><br /></p>
                  </td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
      </tbody>
    </table>
  </body>
</html>
  `;
}
