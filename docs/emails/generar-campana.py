#!/usr/bin/env python3
"""Genera campana-es.html y campana-en.html (fragmentos para pegar en
Marketing > Campañas de correo) con el diseño de la landing /regreso.
Uso: python3 generar-campana.py"""
B = "https://wrroflxjgljwdhfijemc.supabase.co/storage/v1/object/public/imagenes-correo/"
FACHADA, PATIO, HAB = B + "regreso/fachada-hero.jpg", B + "bienvenida/patio-cubierto.jpg", B + "regreso/habitacion-cama-king.jpg"
URL = "https://randahome.com/regreso"
NIGHT, BEIGE, PANEL, INK, INK2, CAOBA, LAMP, ON, ON2 = "#14211a", "#f3e9d7", "#f8f2e6", "#18291d", "#4a5a4f", "#d1502a", "#2fb6a3", "#e3e8da", "#a9bca4"

T = {
 "es": dict(lang="es", pre="Estrenamos randahome.com. Reserva directo con el código COMINGBACKRANDA5% y ahorra 5%.",
   eyebrow="Para huéspedes que ya nos conocen", h1a="Volver a Casa Randa", h1b="cuesta 5% menos.",
   intro="Hola [NOMBRE], ya conoces la casa. Hoy abrimos randahome.com, nuestra página web para reservar directo con nosotros, sin intermediarios ni comisiones de plataforma.",
   cta="Ver fechas y reservar", rating="Favorito entre huéspedes en Airbnb",
   codelabel="TU CÓDIGO DE REGRESO", codehint="5% de descuento en tu próxima reserva directa.",
   quote="“Desde el momento en que llegué, me sentí cómodo y bienvenido. El alojamiento estaba limpio, era cómodo y me sentí como en casa. Sin duda me hospedaría aquí de nuevo.”",
   who="Nestor · Waldwick, Nueva Jersey · Reseña en Airbnb, 5 estrellas",
   howtitle="Cómo usar tu descuento", howsub="Sin formularios extra ni cuentas nuevas.",
   steps=[("Elige tus fechas","Usa el cotizador de la página principal. El botón de arriba te lleva con el código ya puesto."),
          ("Solicita la reserva","Envía la solicitud con tus datos. Te responde directamente el equipo de Casa Randa."),
          ("Mira tu descuento","El 5% se aplica al instante en la cotización. También puedes escribir el código en el campo «Código de descuento».")],
   close="Las mismas 6 habitaciones y el mismo patio, esperándote.", thanks="Gracias por haber sido parte de Casa Randa,", team="El equipo de Casa Randa",
   altf="Fachada verde de Casa Randa en Diablo Heights", alth="Habitación de Casa Randa con cama king, lámparas de mesa y piso de madera", altp="Patio cubierto de Casa Randa con mesa, jardín y luces cálidas",
   why="Recibes este correo porque te hospedaste en Casa Randa.", addr="Casa Randa · Calle Hecker 5624<br>Diablo Heights, Ancón · Ciudad de Panamá, Panamá"),
 "en": dict(lang="en", pre="We just launched randahome.com. Book direct with code COMINGBACKRANDA5% and save 5%.",
   eyebrow="For guests who already know us", h1a="Coming back to Casa Randa", h1b="costs 5% less.",
   intro="Hi [NOMBRE], you already know the house. Today we launched randahome.com, our website to book directly with us, with no middlemen and no platform fees.",
   cta="See dates and book", rating="Airbnb Guest Favorite",
   codelabel="YOUR COMEBACK CODE", codehint="5% off your next direct booking.",
   quote="“From the moment I arrived, I felt comfortable and welcome. The place was clean, comfortable, and I felt at home. I would definitely stay here again.”",
   who="Nestor · Waldwick, New Jersey · Airbnb review, 5 stars",
   howtitle="How to use your discount", howsub="No extra forms, no new accounts.",
   steps=[("Pick your dates","Use the quote calculator on the homepage. The button above takes you there with the code already applied."),
          ("Request the booking","Send the request with your details. The Casa Randa team answers you directly."),
          ("See your discount","The 5% is applied instantly in the quote. You can also type the code in the “Discount code” field.")],
   close="The same 6 bedrooms and the same patio, waiting for you.", thanks="Thank you for being part of Casa Randa,", team="The Casa Randa team",
   altf="Green façade of Casa Randa in Diablo Heights", alth="Casa Randa bedroom with a king bed, table lamps and wood floors", altp="Covered patio at Casa Randa with a table, garden and warm lights",
   why="You are receiving this email because you stayed at Casa Randa.", addr="Casa Randa · Calle Hecker 5624<br>Diablo Heights, Ancón · Panama City, Panama"),
}
G = "font-family:Georgia,'Times New Roman',serif;"
def btn(t, cta):
    return f'<table role="presentation"><tr><td bgcolor="{CAOBA}" style="background-color:{CAOBA};border-radius:8px;"><a href="{URL}" style="display:inline-block;padding:16px 28px;color:#ffffff;font-size:16px;line-height:22px;font-weight:bold;text-decoration:none;{G}">{cta}</a></td></tr></table>'
def build(t):
    steps = "".join(f'''
            <tr><td style="border-top:1px solid #d9cdb6;padding:20px 0;">
              <table role="presentation" width="100%"><tr>
                <td width="44" valign="top" style="font-family:'Courier New',monospace;font-size:14px;color:{CAOBA};padding-top:2px;">0{i+1}</td>
                <td valign="top"><p style="margin:0;color:{INK};font-size:16px;line-height:22px;font-weight:bold;{G}">{a}</p>
                <p style="margin:4px 0 0;color:{INK2};font-size:15px;line-height:23px;">{b}</p></td>
              </tr></table>
            </td></tr>''' for i,(a,b) in enumerate(t["steps"]))
    return f'''<div style="display:none;font-size:1px;line-height:1px;color:{BEIGE};max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">{t["pre"]}</div>
<table role="presentation" width="100%" bgcolor="{BEIGE}" style="background-color:{BEIGE};">
  <tr><td align="center" style="padding:28px 12px;">
    <!--[if mso]><table role="presentation" width="600" align="center"><tr><td><![endif]-->
    <table role="presentation" width="100%" style="max-width:600px;">
      <tr><td align="center" bgcolor="{NIGHT}" style="background-color:{NIGHT};padding:22px 24px;border-radius:12px 12px 0 0;">
        <p style="margin:0;color:{ON};font-size:20px;line-height:26px;font-weight:bold;letter-spacing:4px;{G}">CASA RANDA</p>
      </td></tr>
      <!-- Hero como en la landing: la foto va de fondo y la tarjeta verde se solapa sobre su parte baja. En Outlook de escritorio (sin imagen de fondo) queda la tarjeta sobre beige. -->
      <tr><td bgcolor="{BEIGE}" background="{FACHADA}" style="background-color:{BEIGE};background-image:url('{FACHADA}');background-repeat:no-repeat;background-position:top center;background-size:100% auto;padding:0 20px 8px;">
        <table role="presentation" width="100%">
          <tr><td height="210" style="height:210px;font-size:0;line-height:0;" aria-label="{t["altf"]}">&nbsp;</td></tr>
          <tr><td bgcolor="{NIGHT}" style="background-color:{NIGHT};border-radius:12px;box-shadow:0 24px 60px -12px rgba(0,0,0,0.55);padding:36px 32px 40px;">
            <p style="margin:0 0 12px;color:{LAMP};font-size:14px;line-height:20px;">{t["eyebrow"]}</p>
            <h1 style="margin:0;color:#f3f1ea;font-size:36px;line-height:42px;font-weight:bold;{G}">{t["h1a"]}<br>{t["h1b"]}</h1>
            <p style="margin:20px 0 26px;color:{ON2};font-size:17px;line-height:27px;">{t["intro"]}</p>
            {btn(t, t["cta"])}
            <p style="margin:18px 0 0;color:{ON2};font-size:13px;line-height:20px;">&#9733; 4.89 &middot; {t["rating"]}</p>
          </td></tr>
        </table>
      </td></tr>
      <tr><td align="center" bgcolor="{BEIGE}" style="background-color:{BEIGE};padding:36px 20px 12px;">
        <p style="margin:0 0 10px;color:{INK2};font-size:11px;line-height:18px;letter-spacing:3px;">{t["codelabel"]}</p>
        <p style="margin:0;color:{CAOBA};font-family:'Courier New',monospace;font-size:28px;line-height:36px;font-weight:bold;">COMINGBACKRANDA5%</p>
        <p style="margin:10px 0 0;color:{INK2};font-size:14px;line-height:21px;">{t["codehint"]}</p>
      </td></tr>
      <tr><td bgcolor="{PANEL}" style="background-color:{PANEL};padding:36px 40px;">
        <table role="presentation" width="100%"><tr><td style="border-left:4px solid {LAMP};padding:2px 0 2px 20px;">
          <p style="margin:0;color:{INK};font-size:19px;line-height:29px;font-style:italic;{G}">{t["quote"]}</p>
          <p style="margin:12px 0 0;color:{INK2};font-size:13px;line-height:20px;">{t["who"]}</p>
        </td></tr></table>
      </td></tr>
      <tr><td bgcolor="{BEIGE}" style="background-color:{BEIGE};padding:36px 0 0;font-size:0;line-height:0;"><img src="{HAB}" width="600" alt="{t["alth"]}" style="display:block;width:100%;max-width:600px;height:auto;border:0;border-radius:12px;"></td></tr>
      <tr><td bgcolor="{BEIGE}" style="background-color:{BEIGE};padding:40px 8px 8px;">
        <h2 style="margin:0;color:{INK};font-size:24px;line-height:30px;font-weight:bold;{G}">{t["howtitle"]}</h2>
        <p style="margin:6px 0 20px;color:{INK2};font-size:15px;line-height:22px;">{t["howsub"]}</p>
        <table role="presentation" width="100%">{steps}
          <tr><td style="border-top:1px solid #d9cdb6;font-size:0;line-height:0;">&nbsp;</td></tr>
        </table>
      </td></tr>
      <tr><td align="center" bgcolor="{NIGHT}" style="background-color:{NIGHT};padding:40px 32px;border-radius:12px;">
        <h2 style="margin:0 0 24px;color:{ON};font-size:24px;line-height:31px;font-weight:bold;{G}">{t["close"]}</h2>
        <table role="presentation" align="center"><tr><td bgcolor="{CAOBA}" style="background-color:{CAOBA};border-radius:8px;"><a href="{URL}" style="display:inline-block;padding:16px 28px;color:#ffffff;font-size:16px;line-height:22px;font-weight:bold;text-decoration:none;{G}">{t["cta"]}</a></td></tr></table>
      </td></tr>
      <tr><td bgcolor="{BEIGE}" style="background-color:{BEIGE};padding:28px 8px 0;">
        <p style="margin:0;color:{INK};font-size:15px;line-height:24px;">{t["thanks"]}<br><strong>{t["team"]}</strong></p>
      </td></tr>
      <tr><td bgcolor="{BEIGE}" style="background-color:{BEIGE};padding:24px 8px 8px;">
        <p style="margin:0;color:{INK2};font-size:12px;line-height:20px;">{t["why"]}</p>
        <p style="margin:10px 0 0;color:{INK2};font-size:12px;line-height:20px;">{t["addr"]}</p>
      </td></tr>
    </table>
    <!--[if mso]></td></tr></table><![endif]-->
  </td></tr>
</table>
'''
for k,t in T.items():
    open(f"campana-{k}.html","w").write(build(t))
    print(k, len(build(t)))
