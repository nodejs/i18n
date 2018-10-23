# Stijlgids

* Documentatie is geschreven in markdown bestanden met namen geformatteerd als `kleineletters-met-koppelteken.md`. 
  * Underscores in bestandsnamen zijn alleen toegestaan wanneer zij aanwezig zijn in het onderwerp wat het document zal beschrijven (bijvoorbeeld: `kind_proces`).
  * Sommige bestanden zijn uitzonderingen, zoals top-level markdown bestanden.
* Documenten moeten worden 'word-wrapped' bij 80 tekens.
* De formattering beschreven in `.editorconfig` heeft de voorkeur. 
  * Een [plugin](http://editorconfig.org/#download) is beschikbaar voor sommige editors om automatisch deze regels toe te passen.
* Veranderingen aan documentatie moet worden gecontroleerd met `make lint-md`.
* Amerikaans-Engelse spelling heeft de voorkeur. "Capitalize" vs. "Capitalise", "color" vs. "colour", etc.
* Gebruik [seriële komma's](https://en.wikipedia.org/wiki/Serial_comma).
* Vermijd persoonlijke voornaamwoorden in referentie documentatie ("ik", "jij", "wij"). 
  * Persoonlijke voornaamwoorden zijn acceptabel in informele documentatie, zoals gidsen.
  * Gebruik geslachtsneutrale voornaamwoorden en geslachtsneutrale meervoudige zelfstandige voornaamwoorden. 
    * Ok: "zij", "hun", "hen", "volk", "mensen", "ontwikkelaars"
    * NIET Ok: "zijn", "haar", "hem", "jongens", "kerels"
* Bij het combineren van verpakkingselementen (haakjes en aanhalingstekens), moet terminaal interpunctie worden geplaatst: 
  * Binnen het verpakkingselement, wanneer het verpakkingselement een volledige component bevat — een onderwerp, werkwoord, en een object.
  * Buiten het verpakkingselement als het verpakkingselement slechts één fragment van een clausule bevat.
* Plaats einde-van-zin interpunctie binnen verpakkingselementen — punten gaan binnen haakjes en quotes, niet erna.
* Documenten moeten beginnen met een niveau 1 titel.
* Voorkeur geven aan het aanbrengen van links boven inlining links — voorkeur `[een link][]` boven `[een link](http://voorbeeld.com)`.
* Bij het documenteren van API's, noteer de versie van het geïntroduceerde API aan het einde van het segment. Wanneer een API is verouderd, noteer dan ook de eerste versie waarin de verouderde API is verschenen.
* Bij het gebruik van koppeltekens, gebruik [Em koppeltekens](https://en.wikipedia.org/wiki/Dash#Em_dash) ("—" of `Option+Shift+"-"` op macOS) omringd door spaties, overeenkomstig [The New York Times Manual of Style and Usage](https://en.wikipedia.org/wiki/The_New_York_Times_Manual_of_Style_and_Usage).
* Inbegrepen assets: 
  * Wanneer je een illustratie of een volledig programma wilt toevoegen, voeg dit dan toe aan de passende sub-map in de `assets/`dir.
  * Koppel het zo: `[Asset](/assets/{subdir}/{filename})` voor bestandsgebaseerde attributen, en `![Asset](/assets/{subdir}/{filename})` voor beeldgebaseerde attributen.
  * Voor illustraties, geef de voorkeur aan SVG over andere attributen. Wanneer SVG niet haalbaar is, houd dan goed de bestandsgrootte van het attribuut dat je introduceert in de gaten.
* Voor code blokken: 
  * Gebruik taalbewuste barrières. ("```js")
  * Code hoeft niet compleet te zijn — behandel code blokken als een illustratie of hulp om iets duidelijk te maken, niet als compleet werkende programma's. Als een compleet werkend programma nodig is, sluit het dan bij als aanwinsten in `assets/code-examples` en link er naartoe.
* Bij het gebruik van underscores, sterretjes, en accent grave, gebruik alsjeblieft geschikte wisseltekens (`\_`, `\*` and `` \` `` in plaats van `_`, `*` and `` ` ``).
* Referenties naar ontwikkelaarsfuncties moeten PascalCase gebruiken.
* Referenties naar ontwikkelaarsfuncties moeten camelCase gebruiken.
* Verwijzingen naar methoden moeten worden gebruikt met haakjes: bijvoorbeeld `socket.end()` in plaats van `socket.end`.
* Om op een opmerking speciale aandacht te vestigen, neem de volgende richtlijnen in acht: 
  * Maak het "Opmerking:" label cursief, bijvoorbeeld `*Opmerking*:<0/>.</li>
<li>Gebruik een hoofdletter na het "Opmerking:" label.</li>
<li>Bij voorkeur, maak de opmerking een nieuwe paragraaf om visueel beter onderscheid te maken.</li>
</ul></li>
<li>Functie argumenten of onderwerpseigenschappen moeten het volgende format gebruiken:

<ul>
<li><code>* \<code>name` {type|type2} Optionele beschrijving. **Default:** `defaultValue`.</code>
  * Bijvoorbeeld: `* <code>byteOffset` {integer} Index van eerste te onthullen byte. **Default:** `0`.</code>
  * Het `type` moet refereren naar een Node.js type of een [JavaScript type](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Grammar_and_types#Data_structures_and_types).
* Functie resultaten moeten het volgende formaat gebruiken: 
  * `* Resultaat: {type|type2} Optionele beschrijving.`
  * Bijvoorbeeld: `* Resultaat: {AsyncHook} Een referentie naar <code>asyncHook`.</code>
* Gebruik officiële opmaak voor gebruik van hoofdletters in producten en projecten. 
  * Ok: JavaScript, Googles V8
  * Niet Ok: Javascript, Googles V8

Zie ook structuur-overzicht van API documentatie in [doctools LEZEN](../tools/doc/README.md).