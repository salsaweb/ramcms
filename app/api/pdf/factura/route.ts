import { NextRequest } from 'next/server';
import { getApplicationById } from '@/app/actions/applications';
import puppeteer from "puppeteer";

export async function GET(request: NextRequest) {
    // const { searchParams } = new URL(request.url);
    // const application_id = searchParams.get('application_id');

    // if (!application_id) {
    //     return new Response('application_id is required', { status: 400 });
    // }

    // const application = await getApplicationById(application_id);

    // if (!application) {
    //     return new Response('application not found', { status: 404 });
    // }

    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    const html = `
    <!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Factura OBRYS-2026-001</title>
<style>
  @page {
    size: A4 portrait;
    margin: 0;
  }

  *, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  html, body {
    width: 210mm;
    height: 297mm;
    background: #ffffff;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  body {
    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
    font-size: 13px;
    color: #1a1a18;
    line-height: 1.5;
  }

  .sheet {
    width: 210mm;
    min-height: 297mm;
    padding: 14mm 16mm 12mm;
    display: flex;
    flex-direction: column;
    background: #ffffff;
  }

  /* ── HEADER ── */
  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding-bottom: 6mm;
    border-bottom: 1.5px solid #1a1a18;
    margin-bottom: 9mm;
  }

  .title {
    font-family: Georgia, 'Times New Roman', Times, serif;
    font-size: 46px;
    font-weight: normal;
    color: #1a1a18;
    line-height: 1;
    margin-bottom: 5px;
  }

  .brand {
    font-family: 'Courier New', Courier, monospace;
    font-size: 9px;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: #888880;
  }

  .meta {
    text-align: right;
    padding-top: 6px;
  }

  .inv-number {
    font-family: 'Courier New', Courier, monospace;
    font-size: 15px;
    font-weight: bold;
    color: #2e4a3e;
    margin-bottom: 5px;
  }

  .inv-date {
    font-size: 12px;
    color: #6b6b66;
  }

  /* ── PARTIES ── */
  .parties {
    display: table;
    width: 100%;
    margin-bottom: 9mm;
  }

  .party {
    display: table-cell;
    width: 50%;
    vertical-align: top;
    padding-right: 10mm;
  }

  .party:last-child { padding-right: 0; }

  .party-label {
    font-size: 8px;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: #c2c2bc;
    font-weight: bold;
    margin-bottom: 6px;
  }

  .party-name {
    font-size: 14px;
    font-weight: bold;
    color: #1a1a18;
    margin-bottom: 4px;
  }

  .party-detail {
    font-size: 11.5px;
    color: #6b6b66;
    line-height: 1.75;
  }

  /* ── TABLE ── */
  table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 2mm;
  }

  thead th {
    font-size: 8px;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: #c2c2bc;
    font-weight: bold;
    padding: 0 0 6px 0;
    text-align: left;
    border-bottom: 1px solid #ddddd6;
  }

  thead th.right { text-align: right; }
  thead th.center { text-align: center; }

  tbody td {
    padding: 5mm 0 4mm;
    border-bottom: 1px solid #ddddd6;
    font-size: 12px;
    color: #1a1a18;
    vertical-align: top;
  }

  td.center { text-align: center; }
  td.right { text-align: right; }

  .svc-name {
    font-size: 13px;
    font-weight: bold;
    margin-bottom: 4px;
    color: #1a1a18;
  }

  .svc-desc {
    font-size: 11px;
    color: #888880;
    line-height: 1.7;
  }

  /* ── TOTALS ── */
  .totals-wrap {
    display: table;
    width: 100%;
    margin: 2mm 0 8mm;
  }

  .totals-spacer { display: table-cell; width: 65%; }

  .totals {
    display: table-cell;
    width: 35%;
    vertical-align: top;
  }

  .t-row {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    color: #6b6b66;
    padding: 3.5px 0;
  }

  .t-row.base { color: #1a1a18; font-weight: 600; }
  .t-row.irpf { color: #8b3a2a; }

  .t-row.grand {
    border-top: 1.5px solid #1a1a18;
    margin-top: 6px;
    padding-top: 8px;
    font-size: 18px;
    font-weight: bold;
    color: #1a1a18;
  }

  /* ── PAYMENT ── */
  .payment {
    background-color: #f5f4ef;
    border: 1px solid #ddddd6;
    border-radius: 3px;
    padding: 4mm 5mm;
    margin-bottom: 7mm;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .pay-label {
    font-size: 8px;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: #c2c2bc;
    font-weight: bold;
    margin-bottom: 7px;
  }

  .pay-row {
    display: flex;
    gap: 10mm;
    font-size: 11.5px;
    margin-bottom: 3px;
  }

  .pay-key {
    width: 28mm;
    flex-shrink: 0;
    color: #888880;
  }

  .pay-val {
    color: #1a1a18;
  }

  .pay-val.mono {
    font-family: 'Courier New', Courier, monospace;
    font-size: 11px;
  }

  /* ── FOOTER ── */
  .footer {
    margin-top: auto;
    border-top: 1px solid #ddddd6;
    padding-top: 5mm;
    font-size: 9.5px;
    color: #c2c2bc;
    line-height: 1.8;
  }

  .footer p { margin-bottom: 2px; }
  .footer .irpf-note { color: #b5816e; }
</style>
</head>
<body>
<div class="sheet">

  <!-- HEADER -->
  <div class="header">
    <div>
      <div class="title">Factura</div>
      <div class="brand">OBRYS &middot; Spatial Thinking</div>
    </div>
    <div class="meta">
      <div class="inv-number">OBRYS-2026-001</div>
      <div class="inv-date">Fecha: 19/04/2026</div>
    </div>
  </div>

  <!-- PARTIES -->
  <div class="parties">
    <div class="party">
      <div class="party-label">Emisor</div>
      <div class="party-name">Dmytro Pichugin</div>
      <div class="party-detail">
        NIE: Y1234567X<br>
        Carrer de les Flors 12, 2&ordm; 1&ordf;<br>
        43201 Reus, Tarragona<br>
        dmytro@obrys.studio
      </div>
    </div>
    <div class="party">
      <div class="party-label">Cliente &mdash; Empresa</div>
      <div class="party-name">Inmobiliaria Levante S.L.</div>
      <div class="party-detail">
        CIF: B98765432<br>
        Avinguda del Mediterrani 45, 1&ordm;<br>
        08005 Barcelona<br>
        contacto@levante-inmobiliaria.es
      </div>
    </div>
  </div>

  <!-- SERVICES TABLE -->
  <table>
    <thead>
      <tr>
        <th style="width:52%">Descripci&oacute;n</th>
        <th class="center" style="width:10%">Cant.</th>
        <th class="right" style="width:19%">P. unitario</th>
        <th class="right" style="width:19%">Subtotal</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>
          <div class="svc-name">OBRYS &ndash; Stage 01 Visual Clarification</div>
          <div class="svc-desc">
            Correcci&oacute;n visual de fotograf&iacute;as inmobiliarias<br>
            Optimizaci&oacute;n perceptual del espacio<br>
            Restauraci&oacute;n de legibilidad arquitect&oacute;nica
          </div>
        </td>
        <td class="center">1</td>
        <td class="right">140,00 &euro;</td>
        <td class="right">140,00 &euro;</td>
      </tr>
    </tbody>
  </table>

  <!-- TOTALS -->
  <div class="totals-wrap">
    <div class="totals-spacer"></div>
    <div class="totals">
      <div class="t-row base">
        <span>Base imponible</span>
        <span>140,00 &euro;</span>
      </div>
      <div class="t-row">
        <span>IVA 21%</span>
        <span>+ 29,40 &euro;</span>
      </div>
      <div class="t-row irpf">
        <span>IRPF 15%</span>
        <span>&minus; 21,00 &euro;</span>
      </div>
      <div class="t-row grand">
        <span>Total</span>
        <span>148,40 &euro;</span>
      </div>
    </div>
  </div>

  <!-- PAYMENT -->
  <div class="payment">
    <div class="pay-label">Forma de pago</div>
    <div class="pay-row">
      <span class="pay-key">M&eacute;todo</span>
      <span class="pay-val">Transferencia bancaria</span>
    </div>
    <div class="pay-row">
      <span class="pay-key">IBAN</span>
      <span class="pay-val mono">ES12 3456 7890 1234 5678 9012</span>
    </div>
    <div class="pay-row">
      <span class="pay-key">Concepto</span>
      <span class="pay-val mono">OBRYS-2026-001</span>
    </div>
    <div class="pay-row">
      <span class="pay-key">Plazo</span>
      <span class="pay-val">7 d&iacute;as naturales desde emisi&oacute;n</span>
    </div>
  </div>

  <!-- FOOTER -->
  <div class="footer">
    <p class="irpf-note">Retenci&oacute;n IRPF del 15% aplicada conforme a normativa vigente.</p>
    <p>Actividad econ&oacute;mica puntual no habitual declarada conforme a normativa fiscal vigente.</p>
  </div>

</div>
</body>
</html>
  `;

    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({
        format: "A4",
        printBackground: true
    });

    await browser.close();

    return new Response(pdfBuffer as any, {
        headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": "attachment; filename=test.pdf",
        },
    });
}