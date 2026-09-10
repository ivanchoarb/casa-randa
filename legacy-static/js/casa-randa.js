(function(){
  "use strict";

  /* ---------- datos reales de la casa ---------- */
  var ROOMS = [
    {n:1, beds:[["king",1]], sleeps:2, es:"Una cama king, baño privado con ducha y escritorio junto a la ventana.", en:"One king bed, private bathroom with shower, desk by the window.", tagsEs:["Cama king","Baño privado"], tagsEn:["King bed","Private bath"]},
    {n:2, beds:[["twin",2]], sleeps:2, es:"Dos camas individuales, baño privado, minibar y ventilador de techo.", en:"Two single beds, private bathroom, minibar and ceiling fan.", tagsEs:["2 individuales","Baño privado"], tagsEn:["2 singles","Private bath"]},
    {n:3, beds:[["twin",2]], sleeps:2, es:"Dos camas individuales, baño privado y vista a los árboles del patio.", en:"Two single beds, private bathroom, looking onto the trees.", tagsEs:["2 individuales","Baño privado"], tagsEn:["2 singles","Private bath"]},
    {n:4, beds:[["twin",3]], sleeps:3, es:"Tres camas individuales, baño privado. La habitación del grupo grande.", en:"Three single beds, private bathroom. The room for the big group.", tagsEs:["3 individuales","Baño privado"], tagsEn:["3 singles","Private bath"]},
    {n:5, beds:[["twin",2]], sleeps:2, es:"Dos camas individuales, baño privado, aire acondicionado y TV.", en:"Two single beds, private bathroom, air conditioning and TV.", tagsEs:["2 individuales","Baño privado"], tagsEn:["2 singles","Private bath"]},
    {n:6, beds:[["twin",2]], sleeps:2, es:"Dos camas individuales, baño privado con segunda puerta al pasillo.", en:"Two single beds, private bathroom with a second door to the hallway.", tagsEs:["2 individuales","Baño de paso"], tagsEn:["2 singles","Hallway access"]}
  ];

  var COMMON_ES = ["Cocina completa con lavavajillas, cafetera y tostadora","Sala principal con ventanales al jardín","Segunda sala de estar en el tercer piso","Comedor para catorce y barra","Balcón con hamaca","Patio cerrado con área de BBQ","Lavandería con lavadora y secadora, sin cargo","Estacionamiento gratuito para cuatro vehículos","Internet de 500 megas en toda la casa"];
  var COMMON_EN = ["Full kitchen with dishwasher, coffee maker and toaster","Main living room with windows onto the garden","A second sitting room on the third floor","Dining table for fourteen, plus a bar","Balcony with a hammock","Enclosed patio with barbecue","Laundry with washer and dryer, no charge","Free parking for four cars","500 Mbps internet throughout"];
  var NOT_ES = ["Piscina","Champú de cortesía","Trona ni cuna de viaje","Mascotas: los pisos son de madera","Fiestas ni eventos"];
  var NOT_EN = ["A pool","Complimentary shampoo","High chair or travel cot","Pets: the floors are hardwood","Parties or events"];

  var DIST = [
    {es:"Aeropuerto de Albrook",   en:"Albrook airport",        km:1.3},
    {es:"Albrook Mall y la Gran Terminal", en:"Albrook Mall and the bus terminal", km:1.6},
    {es:"Cima del Cerro Ancón",    en:"Top of Cerro Ancón",     km:2.5},
    {es:"Casco Viejo",             en:"Casco Viejo",            km:3.9},
    {es:"Esclusas de Miraflores",  en:"Miraflores Locks",       km:4.1},
    {es:"Biomuseo",                en:"Biomuseo",               km:5.3},
    {es:"Calzada de Amador",       en:"Amador Causeway",        km:5.5},
    {es:"Aeropuerto de Tocumen",   en:"Tocumen airport",        km:23.1}
  ];

  var SCORES = [
    {es:"Limpieza",     en:"Cleanliness",   v:5.0},
    {es:"Exactitud",    en:"Accuracy",      v:5.0},
    {es:"Llegada",      en:"Check-in",      v:5.0},
    {es:"Comunicación", en:"Communication", v:5.0},
    {es:"Precio",       en:"Value",         v:5.0},
    {es:"Ubicación",    en:"Location",      v:4.9}
  ];

  var VS = [
    {es:"Cancelación flexible o tarifa no reembolsable, a su elección", en:"Flexible cancellation or a non-refundable rate, your choice", d:true},
    {es:"Anticipo del 30 % y saldo 7 días antes de llegar", en:"30% deposit, balance 7 days before arrival", d:true},
    {es:"Sin comisión de plataforma sobre el total", en:"No platform fee on top of the total", d:true},
    {es:"Extras y despensa encargados antes de llegar", en:"Extras and pantry ordered before you arrive", d:true},
    {es:"Mismo calendario, mismas fechas libres", en:"Same calendar, same open dates", d:"both"},
    {es:"Los mismos anfitriones responden", en:"The same hosts answer", d:"both"}
  ];

  /* tarifas reales del motor de reserva */
  var RATE = 520, CLEANING = 60, TAX = 0.10, EXTRA_GUEST = 40, FREE_PAX = 14, MIN_NIGHTS = 2, MAX_PAX = 16;

  var lang = "es";
  var selected = null;
  var $ = function(s){ return document.querySelector(s); };

  /* ---------- traducción ---------- */
  var nodes = Array.prototype.slice.call(document.querySelectorAll("[data-en]"));
  nodes.forEach(function(el){ el.setAttribute("data-es", el.innerHTML); });
  function paint(){
    nodes.forEach(function(el){ el.innerHTML = el.getAttribute(lang === "es" ? "data-es" : "data-en"); });
    document.documentElement.lang = lang;
    $("#lang-es").setAttribute("aria-pressed", lang === "es");
    $("#lang-en").setAttribute("aria-pressed", lang === "en");
    render();
  }
  $("#lang-es").addEventListener("click", function(){ lang = "es"; paint(); });
  $("#lang-en").addEventListener("click", function(){ lang = "en"; paint(); });

  function t(o){ return lang === "es" ? o.es : o.en; }
  function money(n){
    return "$" + n.toLocaleString(lang === "es" ? "es-PA" : "en-US", {minimumFractionDigits:0, maximumFractionDigits:0});
  }

  /* ---------- tablas y listas ---------- */
  function renderTables(){
    var tb = $("#roomsTable");
    tb.innerHTML = ROOMS.map(function(r){
      var beds = r.beds.map(function(b){
        var one = b[0] === "king" ? (lang === "es" ? "cama king" : "king bed") : (lang === "es" ? "individual" : "single");
        var many = b[0] === "king" ? one : (lang === "es" ? "individuales" : "singles");
        return b[1] + " " + (b[1] > 1 ? many : one);
      }).join(", ");
      return '<tr><th scope="row">' + r.n + '</th><td>' + beds +
             '<span class="rowdet">' + t(r) + '</span></td><td class="n">' + r.sleeps +
             '</td><td>' + (lang === "es" ? "Privado" : "Private") + '</td></tr>';
    }).join("");

    $("#commonList").innerHTML = (lang === "es" ? COMMON_ES : COMMON_EN).map(function(x){ return "<li>" + x + "</li>"; }).join("");
    $("#notList").innerHTML = (lang === "es" ? NOT_ES : NOT_EN).map(function(x){ return "<li>" + x + "</li>"; }).join("");

    var max = 23.1;
    $("#distList").innerHTML = DIST.map(function(o){
      var w = Math.max(4, Math.round(Math.sqrt(o.km / max) * 100));
      return '<li><span>' + t(o) + '</span><span class="bar"><i style="width:' + w + '%"></i></span>' +
             '<span class="km">' + o.km.toString().replace(".", lang === "es" ? "," : ".") + ' km</span></li>';
    }).join("");

    $("#bars").innerHTML = SCORES.map(function(o){
      var pct = ((o.v - 4.5) / 0.5) * 100;
      return '<div><b>' + t(o) + '</b><span class="track' + (o.v === 5 ? " top" : "") + '"><i style="width:' +
             pct + '%"></i></span><span class="v">' + o.v.toFixed(1).replace(".", lang === "es" ? "," : ".") + '</span></div>';
    }).join("");

    $("#vsTable").innerHTML = VS.map(function(o){
      var direct = '<td class="yes">' + (lang === "es" ? "Sí" : "Yes") + '</td>';
      var plat = o.d === "both"
        ? '<td class="yes">' + (lang === "es" ? "Sí" : "Yes") + '</td>'
        : '<td class="no">' + (lang === "es" ? "No" : "No") + '</td>';
      return '<tr><td>' + t(o) + '</td>' + direct + plat + '</tr>';
    }).join("");
  }

  /* ---------- selects de huéspedes ---------- */
  function fillPax(sel, val){
    var html = "";
    for (var i = 2; i <= MAX_PAX; i++) html += '<option value="' + i + '"' + (i === val ? " selected" : "") + ">" + i + "</option>";
    sel.innerHTML = html;
  }

  /* ---------- cotización ---------- */
  function nights(a, b){
    var d1 = new Date(a + "T12:00:00"), d2 = new Date(b + "T12:00:00");
    if (isNaN(d1) || isNaN(d2)) return 0;
    return Math.round((d2 - d1) / 86400000);
  }
  function renderQuote(){
    var n = nights($("#q-in").value, $("#q-out").value);
    var pax = parseInt($("#q-pax").value, 10) || 2;
    var head = $("#q-head"), lines = $("#q-lines"), note = $("#q-note");

    if (n < MIN_NIGHTS){
      head.className = "fine warn";
      head.textContent = lang === "es"
        ? "La estancia mínima es de 2 noches. Ajuste las fechas para ver el total."
        : "The minimum stay is 2 nights. Adjust the dates to see a total.";
      lines.innerHTML = "";
      note.textContent = "";
      return;
    }
    head.className = "fine";
    head.textContent = (lang === "es"
      ? n + (n === 1 ? " noche" : " noches") + ", " + pax + " huéspedes, a " + money(RATE) + " la noche."
      : n + (n === 1 ? " night" : " nights") + ", " + pax + " guests, at " + money(RATE) + " a night.");

    var lodging = RATE * n;
    var extraPax = Math.max(0, pax - FREE_PAX);
    var extra = extraPax * EXTRA_GUEST * n;
    var sub = lodging + extra + CLEANING;
    var isFlex = $("#q-cancel").value === "flex";
    var adj = isFlex ? Math.round(sub * 0.03) : -Math.round(sub * 0.05);
    var taxed = Math.round((sub + adj) * TAX);
    var total = sub + adj + taxed;
    var plan = $("#q-plan").value;
    var now = plan === "30" ? Math.round(total * 0.3) : total;

    var rows = [
      [(lang === "es" ? "Alojamiento, " + n + " × " + money(RATE) : "Accommodation, " + n + " × " + money(RATE)), money(lodging)]
    ];
    if (extra > 0) rows.push([(lang === "es" ? "Huéspedes 15 y 16, " + extraPax + " × " + money(EXTRA_GUEST) + " × " + n : "Guests over 14, " + extraPax + " × " + money(EXTRA_GUEST) + " × " + n), money(extra)]);
    rows.push([(lang === "es" ? "Limpieza, cargo único" : "Cleaning, one-off"), money(CLEANING)]);
    rows.push([(isFlex ? (lang === "es" ? "Cancelación flexible, +3 %" : "Flexible cancellation, +3%")
                       : (lang === "es" ? "Tarifa no reembolsable, −5 %" : "Non-refundable rate, −5%")),
               (adj >= 0 ? "" : "−") + money(Math.abs(adj))]);
    rows.push([(lang === "es" ? "Impuesto de hospedaje, 10 %" : "Lodging tax, 10%"), money(taxed)]);

    lines.innerHTML =
      rows.map(function(r){ return "<dt>" + r[0] + "</dt><dd>" + r[1] + "</dd>"; }).join("") +
      '<div class="sep"></div>' +
      '<dt class="tot">' + (lang === "es" ? "Total" : "Total") + '</dt><dd class="tot">' + money(total) + '</dd>' +
      "<dt>" + (plan === "30" ? (lang === "es" ? "Paga hoy, 30 %" : "Pay today, 30%") : (lang === "es" ? "Paga hoy" : "Pay today")) + "</dt><dd>" + money(now) + "</dd>";

    note.textContent = lang === "es"
      ? "Tarifa de ejemplo. La tarifa de sus fechas la calcula el motor de precios y se confirma por escrito antes de cobrar nada."
      : "Example rate. The rate for your dates comes from the pricing engine and is confirmed in writing before anything is charged.";
  }

  function render(){ renderTables(); renderQuote(); }

  /* ---------- el cuadro entero de fecha abre el calendario ---------- */
  Array.prototype.forEach.call(document.querySelectorAll('input[type="date"]'), function(el){
    function open(){ if (typeof el.showPicker === "function") { try { el.showPicker(); } catch (e) {} } }
    el.addEventListener("click", open);
    el.addEventListener("keydown", function(e){ if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); } });
  });

  /* ---------- arranque ---------- */
  fillPax($("#pax"), 12);
  fillPax($("#q-pax"), 12);
  ["q-in","q-out","q-pax","q-cancel","q-plan"].forEach(function(id){
    $("#" + id).addEventListener("change", renderQuote);
  });
  $("#in").addEventListener("change", function(){ $("#q-in").value = this.value; renderQuote(); });
  $("#out").addEventListener("change", function(){ $("#q-out").value = this.value; renderQuote(); });
  $("#pax").addEventListener("change", function(){ $("#q-pax").value = this.value; renderQuote(); });

  paint();
})();
