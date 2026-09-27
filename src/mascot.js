/* Kocken — pops up when a recipe is finished, gives a thumbs up and says something about the dish. */
const QUIPS = {
  'linsbolognese': 'Linserna gör jobbet som köttfärsen brukade göra, och de klagar aldrig.',
  'vegansk-bolognese': 'En timme under lock. Italienska mormödrar skulle nicka gillande. Nästan.',
  'napolitana': 'Fyrtiofem minuter för en tomatsås. Tålamod är också en ingrediens.',
  'puttanesca': 'Oliver, kapris och chili. Ingen sås för blyga smaklökar.',
  'norma': 'Auberginen fick en hel deciliter olivolja. Den förtjänade varenda droppe.',
  'rakpasta': 'Räkorna är veganska. Ingen har berättat det för dem.',
  'carbonara': 'Liquid smoke i en carbonara. Tofun har aldrig känt sig så rökig.',
  'kramig-pastasas': 'Tre deciliter vispgrädde. Det här är ingen sallad, och den låtsas inte heller.',
  'pastasas-mor': 'Mammas recept. Du får inte ändra något, bara säga att det är gott.',
  'svamppasta': 'Skogschampinjoner och gräslök. Skogen och trädgården har äntligen träffats.',
  'avokadopasta': 'Tre avokados i en pastasås. Grönare än så blir inte en tisdag.',
  'zucchinipasta': 'Zucchinin blev riven och urkramad. Den gav allt för den här rätten.',
  'dillpasta': 'Halva ärtsåsen mixades. Resten fick vara kvar som vittnen.',
  'gnocchi': 'Små potatiskuddar i citronsås. Mjukare landning finns inte.',
  'stuvade-makaroner': 'En liter mjölk och fem deciliter makaroner. Barndomen, fast i kastrull.',
  'paprika-chorizo': 'Pasta med vinägrett. Går att äta varm, kall eller stående vid kylskåpet.',
  'pastasallad': 'Två matskedar curry i en pastasallad. Picknickfilten är redo.',
  'ramen': 'Nudlar, shiitake och pak choi i het buljong. Slurpa gärna, det räknas som beröm.',
  'stekta-nudlar': 'En portion. Du behöver inte dela med dig, det står i receptet.',
  'chili-sin-carne': 'Ingen köttfärs skadades under tillagningen av denna chili.',
  'bonchili': 'Kakao i chilin. Det är inte ett misstag, det är hemligheten.',
  'korv-stroganoff': 'Falukorv i gräddsås. Svensk husmanskost i vegansk kostym.',
  'linsgryta': 'Röda linser som kokar på tio minuter. Snabbare än att välja film.',
  'kikartsgryta': 'Sparade du kikärtsspadet? Då har du en sockerkaka på gång.',
  'filegryta': 'Fransk filégryta. Dijonsenapen står för hela fransmannen.',
  'viltgryta': 'Enbär och lingon. Skogen hälsar, fast inga djur var med.',
  'artsoppa': 'Sexhundra gram ärtor, mixade släta. Grönt ljus för soppa.',
  'minestrone': 'Grönsaksslattarna fick ett andra liv. Kylskåpet tackar.',
  'broccolisoppa': 'Små träd, mixade till soppa. Ingen skog kom till skada.',
  'morotssoppa': 'Nio morötter och en apelsin. Du kommer att se i mörker. Typ.',
  'purjolokssoppa': 'Potatis och purjo, mixade släta. En filt i skålform.',
  'vegofarssoppa': 'Färs, potatis och morötter i samma kastrull. Mättare än den ser ut.',
  'vegobullar': 'Spiskummin och koriander. Köttbullarna har varit på semester i Marocko.',
  'pannbiff': 'Fyra biffar, jämntjocka. De ska kännas fasta när du trycker, inte du.',
  'vegoburgare': 'Hemmagjorda burgare. Hamburgerkedjorna skakar lite i knäna.',
  'fyllda-paprikor': 'Paprikan är både tallrik och mat. Mindre disk, mer mat.',
  'hoisin-filebitar': 'Allt i en ugnsform. Ugnen gör jobbet, du tar äran.',
  'yakiniku': 'Cashewmeetly fick koka i 45 minuter. Tålamodet smakar sött med mirin.',
  'svartbonsas': 'Halva bönorna mosades. Den andra halvan fick titta på.',
  'bowl': 'Ris, avokado och biffar i en skål. Ordning och reda, fast ätbart.',
  'raggmunkar': 'Inte för hög värme. Raggmunkar belönar den som väntar.',
  'ugnspannkaka': 'Kikärtsspad istället för ägg. Hönsen har fått ledigt i dag.',
  'brunsas': 'Näringsjäst i brunsåsen. Umami utan påse.',
  'loksas': 'Tre stora lökar, stekta mörkbruna. Köket luktar som ett löfte.',
  'graddsas': 'Lingonsylt i gräddsåsen. Helt normalt, vi är i Sverige.',
  'currysas': 'Curry, dragon och gurkmeja. Såsen har stämplar från flera länder i passet.',
  'jordnotssas': 'Jordnötssmör som middag. Barndomsdrömmen, fast med soja.',
  'kall-vitlokssas': 'Två vitlöksklyftor. Vampyrer rekommenderas att välja en annan sås.',
  'kall-ort-vitlokssas': 'En hel knippe oregano. Örtträdgården har flyttat in i skålen.',
  'kall-pestosas': 'Två teskedar pesto, och crème fraichen blev grön av avund.',
  'ranchdressing': 'Ranchdressing utan ranch. Men med gräslök, och det räcker.',
  'remouladsas': 'Bostongurka och kapris. Pommesen har fått en bästa vän.',
  'dillsas': 'Skolans dillsås. Nu utan kö till matsalen.',
  'dill-kaprissas': 'Oliver, kapris och dill. Tre små smakbomber i samma skål.',
  'avokadosas': 'En avokado, mixad len. Den har aldrig varit så slät i kanterna.',
  'tzatziki': 'Du kramade ur gurkan. Den var mer vatten än du trodde.',
  'hummus': 'Kikärtor och tahini. Spadet du sparade är bakning i förklädnad.',
  'bonblandning': 'Tre frysta påsar och lite citron. Snabbare sallad finns inte.',
  'skagenrora': 'Tångkaviar och tofu. Havet och sojafältet gjorde en röra ihop.',
  'varrullesaser': 'Tre såser till samma vårrullar. Beslutsångest, men den goda sorten.',
  'kalsallad': 'Du masserade kålen. Den blev krämigare, och du blev lugnare.',
  'farskpotatissallad': 'Färskpotatis och rädisor. Midsommar, oavsett vad kalendern säger.',
  'gurk-tomatsallad': 'Gurka, tomat och rödlök. Enkelt, och det är hela poängen.',
  'asiatisk-gurka': 'Gurkan låg mellan två slevar. Den har aldrig blivit så snyggt skuren.',
  'pressgurka': 'Osthyveln kan mer än ost. Pressgurkan tackar.',
  'picklad-rodlok': 'Rosa lök på trettio minuter. Tack, Wille.',
  'potatismos': 'Slätt och poröst. Potatisstompen gjorde sitt livs insats.',
  'gult-ris': 'Gurkmejan gjorde riset gult. Kryddnejlikorna höll koll.',
  'stekt-tofu': 'Maizena gjorde tofun krispig. Vidar visste vad han gjorde.',
  'timjan-tofu': 'Tofu, timjan och grädde. Pommes vid sidan är helt enligt receptet.',
  'overnight-oats': 'Frukosten gjorde sig själv i natt. Du sov, havren jobbade.',
  'chiapudding': 'Du rörde om efter femton minuter. Chiafröna klumpade sig inte, bra jobbat.',
  'bananpannkakor': 'En övermogen banan blev pannkakor. Ingen banan lämnas kvar.',
  'scrambled-tofu': 'Gurkmeja gör tofun gul som äggröra. Hönan är imponerad.',
  'avokadotoast': 'Grillad avokadotoast. Brunchkaféet kan hålla sina priser för sig själva.',
  'bruschetta': 'Vitlök gniden på varmt bröd. Italien på fyra skivor.',
  'fattiga-riddare': 'Rostbröd, kanel och socker. Fattiga, men det märks inte.',
  'bananbrod': 'Bruna bananer blev bröd. Det bästa karriärvalet en banan kan göra.',
  'bullar': 'Fyrtio till fyrtiofem bullar. Kaffet kommer inte räcka.',
  'muffins': 'Grundreceptet är klart. Fyllningen var ditt ansvar, hoppas det gick bra.',
  'mordegskakor': 'Vallmokakor eller syltkakor? Rätt svar: båda.',
  'sockerkaka': 'Tildes sockerkaka. Med toscaglasyr blir den lite finare än tänkt.',
  'kladdkaka': 'Kladdig i mitten är inte ett fel. Det är målet.',
  'mug-cake': 'En kaka på en minut i mikron. Tålamod är överskattat.',
  'smulpaj': 'Smulet är poängen. Bären och äpplena är bara ursäkten.',
  'bananpaj': 'Knäckig bananpaj. Vaniljglassen ligger redan på lur.',
  'varm-choklad': 'Två deciliter mjölk och två teskedar kakao. Mer behövs inte för att bli glad.',
  'dalgona': 'Tre minuter med elvisp. Kaffeskummet och armarna är varma nu.',
  'islatte': 'Kaffet fick kallna först. Det var svårast av allt.'
};
const MASCOT_SVG = `
<svg class="m-svg" viewBox="0 0 240 280" aria-hidden="true">
  <ellipse class="m-shadow" cx="120" cy="266" rx="62" ry="9" fill="rgba(0,0,0,.35)"/>
  <g class="m-all">
    <g class="m-feet"><ellipse cx="96" cy="256" rx="20" ry="11" fill="#2a211b"/><ellipse cx="144" cy="256" rx="20" ry="11" fill="#2a211b"/></g>
    <g class="m-wave"><path d="M64 150 C 38 140, 26 118, 30 96" fill="none" stroke="#2a211b" stroke-width="20" stroke-linecap="round"/><path d="M64 150 C 38 140, 26 118, 30 96" fill="none" stroke="#fff7ea" stroke-width="12" stroke-linecap="round"/><circle cx="30" cy="92" r="15" fill="#fff7ea" stroke="#2a211b" stroke-width="4"/></g>
    <path class="m-body" d="M120 72 C 176 72, 190 128, 190 176 C 190 232, 160 256, 120 256 C 80 256, 50 232, 50 176 C 50 128, 64 72, 120 72 Z" fill="#fff7ea" stroke="#2a211b" stroke-width="4"/>
    <path class="m-apron" d="M70 190 C 70 176, 170 176, 170 190 L 166 232 C 150 248, 90 248, 74 232 Z" fill="var(--c, #d9573b)" stroke="#2a211b" stroke-width="4"/>
    <rect x="104" y="202" width="32" height="18" rx="6" fill="rgba(255,255,255,.35)"/>
    <g class="m-face">
      <ellipse class="m-cheek" cx="80" cy="150" rx="13" ry="8" fill="#f2a3a0" opacity=".8"/><ellipse class="m-cheek" cx="160" cy="150" rx="13" ry="8" fill="#f2a3a0" opacity=".8"/>
      <g class="f f-e-normal m-eyes"><ellipse cx="96" cy="130" rx="9" ry="12" fill="#2a211b"/><ellipse cx="144" cy="130" rx="9" ry="12" fill="#2a211b"/><circle cx="99" cy="125" r="3.5" fill="#fff"/><circle cx="147" cy="125" r="3.5" fill="#fff"/></g>
      <g class="f f-e-joy" fill="none" stroke="#2a211b" stroke-width="5" stroke-linecap="round"><path d="M86 134 Q96 119 106 134"/><path d="M134 134 Q144 119 154 134"/></g>
      <g class="f f-e-star" stroke="#2a211b" stroke-width="2.5" stroke-linejoin="round" fill="#f5c93e"><path d="M96.0 117.0 L99.4 125.3 L108.4 126.0 L101.6 131.8 L103.6 140.5 L96.0 135.8 L88.4 140.5 L90.4 131.8 L83.6 126.0 L92.6 125.3Z"/><path d="M144.0 117.0 L147.4 125.3 L156.4 126.0 L149.6 131.8 L151.6 140.5 L144.0 135.8 L136.4 140.5 L138.4 131.8 L131.6 126.0 L140.6 125.3Z"/></g>
      <g class="f f-e-heart" fill="#e8566a" stroke="#2a211b" stroke-width="2.5"><path d="M0 8 C -15 -2 -8 -15 0 -6 C 8 -15 15 -2 0 8Z" transform="translate(96 132) scale(1.05)"/><path d="M0 8 C -15 -2 -8 -15 0 -6 C 8 -15 15 -2 0 8Z" transform="translate(144 132) scale(1.05)"/></g>
      <g class="f f-e-wink"><ellipse cx="96" cy="130" rx="9" ry="12" fill="#2a211b"/><circle cx="99" cy="125" r="3.5" fill="#fff"/><path d="M134 132 Q144 122 154 132" fill="none" stroke="#2a211b" stroke-width="5" stroke-linecap="round"/></g>
      <g class="f f-e-sleepy" fill="none" stroke="#2a211b" stroke-width="5" stroke-linecap="round"><path d="M86 130 Q96 138 106 130"/><path d="M134 130 Q144 138 154 130"/></g>
      <g class="f f-e-dizzy" fill="none" stroke="#2a211b" stroke-width="3" stroke-linecap="round"><path class="spin-a" d="M97.0 130.0 L97.2 130.4 L97.2 130.9 L97.0 131.4 L96.6 131.9 L96.0 132.3 L95.2 132.4 L94.3 132.3 L93.5 131.8 L92.8 131.0 L92.4 130.0 L92.3 128.8 L92.7 127.6 L93.4 126.5 L94.6 125.6 L96.0 125.1 L97.6 125.1 L99.2 125.6 L100.6 126.7 L101.6 128.2 L102.2 130.0 L102.1 132.0 L101.4 133.9 L100.1 135.6 L98.2 136.9 L96.0 137.5 L93.6 137.4 L91.3 136.5 L89.3 134.9 L87.9 132.6 L87.2 130.0 L87.4 127.2 L88.5 124.5 L90.4 122.2 L93.0 120.6 L96.0 119.9 L99.2 120.1 L102.2 121.4 L104.8 123.6 L106.6 126.6"/><path class="spin-b" d="M145.0 130.0 L145.2 130.4 L145.2 130.9 L145.0 131.4 L144.6 131.9 L144.0 132.3 L143.2 132.4 L142.3 132.3 L141.5 131.8 L140.8 131.0 L140.4 130.0 L140.3 128.8 L140.7 127.6 L141.4 126.5 L142.6 125.6 L144.0 125.1 L145.6 125.1 L147.2 125.6 L148.6 126.7 L149.6 128.2 L150.2 130.0 L150.1 132.0 L149.4 133.9 L148.1 135.6 L146.2 136.9 L144.0 137.5 L141.6 137.4 L139.3 136.5 L137.3 134.9 L135.9 132.6 L135.2 130.0 L135.4 127.2 L136.5 124.5 L138.4 122.2 L141.0 120.6 L144.0 119.9 L147.2 120.1 L150.2 121.4 L152.8 123.6 L154.6 126.6"/></g>
      <g class="f f-e-squint" fill="none" stroke="#2a211b" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"><path d="M88 123 L103 131 L88 139"/><path d="M152 123 L137 131 L152 139"/></g>
      <g class="f f-e-up"><ellipse cx="96" cy="130" rx="11" ry="13" fill="#fff" stroke="#2a211b" stroke-width="3"/><ellipse cx="144" cy="130" rx="11" ry="13" fill="#fff" stroke="#2a211b" stroke-width="3"/><circle class="pupil" cx="96" cy="123" r="6" fill="#2a211b"/><circle class="pupil" cx="144" cy="123" r="6" fill="#2a211b"/></g>
      <g class="f f-e-teary"><ellipse cx="96" cy="130" rx="11" ry="14" fill="#2a211b"/><ellipse cx="144" cy="130" rx="11" ry="14" fill="#2a211b"/><circle cx="100" cy="124" r="4.5" fill="#fff"/><circle cx="148" cy="124" r="4.5" fill="#fff"/><circle cx="92" cy="136" r="2.2" fill="#fff"/><circle cx="140" cy="136" r="2.2" fill="#fff"/><path d="M86 142 Q96 148 106 142 M134 142 Q144 148 154 142" stroke="#8ec5e8" stroke-width="3" fill="none"/></g>
      <path class="f f-m f-m-smile" d="M104 152 Q 120 168, 136 152" fill="none" stroke="#2a211b" stroke-width="4" stroke-linecap="round"/>
      <g class="f f-m f-m-grin"><path d="M100 150 Q 120 180, 140 150 Z" fill="#7a2a24" stroke="#2a211b" stroke-width="4" stroke-linejoin="round"/><path d="M110 164 Q120 172 130 164 Q120 158 110 164Z" fill="#e58a86"/></g>
      <g class="f f-m f-m-o"><ellipse cx="120" cy="158" rx="7" ry="9" fill="#7a2a24" stroke="#2a211b" stroke-width="4"/></g>
      <g class="f f-m f-m-tongue"><path d="M104 152 Q 120 166, 136 152" fill="none" stroke="#2a211b" stroke-width="4" stroke-linecap="round"/><path class="tongue" d="M113 158 Q120 176 127 158 Z" fill="#ec8f8a" stroke="#2a211b" stroke-width="3" stroke-linejoin="round"/></g>
      <path class="f f-m f-m-wavy" d="M102 156 q 4.5 -6 9 0 t 9 0 t 9 0 t 9 0" fill="none" stroke="#2a211b" stroke-width="4" stroke-linecap="round"/>
      <path class="f f-m f-m-kiss" d="M117 148 q 9 4 0 8 q 9 4 0 8" fill="none" stroke="#2a211b" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
      <g class="f f-m f-m-chatter"><rect x="106" y="150" width="28" height="13" rx="4" fill="#fff" stroke="#2a211b" stroke-width="3.5"/><path d="M113 150 v13 M120 150 v13 M127 150 v13" stroke="#2a211b" stroke-width="2"/></g>
      <g class="m-talk"><path d="M104 150 Q 120 178, 136 150 Z" fill="#7a2a24" stroke="#2a211b" stroke-width="4" stroke-linejoin="round"/><ellipse cx="120" cy="163" rx="8" ry="4" fill="#e58a86"/></g>
    </g>
    <g class="m-hat"><rect x="84" y="56" width="72" height="26" rx="6" fill="#fff" stroke="#2a211b" stroke-width="4"/><path d="M84 60 C 60 58, 58 20, 86 22 C 90 2, 122 -2, 128 16 C 142 0, 176 8, 170 32 C 190 40, 180 64, 156 60 Z" fill="#fff" stroke="#2a211b" stroke-width="4" stroke-linejoin="round"/><path d="M104 40 q 6 10 0 18 M 130 36 q 6 10 0 20" fill="none" stroke="#d8d2c8" stroke-width="3" stroke-linecap="round"/></g>
    <g class="m-thumb"><path d="M178 150 C 204 142, 214 124, 212 102" fill="none" stroke="#2a211b" stroke-width="20" stroke-linecap="round"/><path d="M178 150 C 204 142, 214 124, 212 102" fill="none" stroke="#fff7ea" stroke-width="12" stroke-linecap="round"/>
      <g transform="translate(212 96)"><rect x="-17" y="-10" width="34" height="30" rx="10" fill="#fff7ea" stroke="#2a211b" stroke-width="4"/><rect x="-14" y="-38" width="14" height="34" rx="7" fill="#fff7ea" stroke="#2a211b" stroke-width="4"/><path d="M-6 2 h18 M-6 10 h18" stroke="#2a211b" stroke-width="3" stroke-linecap="round"/></g></g>
  </g>
</svg>`;
/* twenty performances; every recipe gets one, with its own face */
const MASCOT_ACT = {
  'linsbolognese': 'drum', 'vegansk-bolognese': 'chefkiss', 'napolitana': 'twirl', 'puttanesca': 'fire', 'norma': 'chefkiss', 'rakpasta': 'fire',
  'carbonara': 'twirl', 'kramig-pastasas': 'chefkiss', 'pastasas-mor': 'hug', 'svamppasta': 'twirl', 'avokadopasta': 'spin', 'zucchinipasta': 'twirl',
  'dillpasta': 'twirl', 'gnocchi': 'balance', 'stuvade-makaroner': 'hug', 'paprika-chorizo': 'dance', 'pastasallad': 'toss', 'ramen': 'slurp', 'stekta-nudlar': 'twirl',
  'chili-sin-carne': 'fire', 'bonchili': 'fire', 'korv-stroganoff': 'drum', 'linsgryta': 'drum', 'kikartsgryta': 'drum', 'filegryta': 'chefkiss', 'viltgryta': 'drum',
  'artsoppa': 'slurp', 'minestrone': 'slurp', 'broccolisoppa': 'slurp', 'morotssoppa': 'slurp', 'purjolokssoppa': 'hug', 'vegofarssoppa': 'slurp',
  'vegobullar': 'juggle', 'pannbiff': 'flip', 'vegoburgare': 'flip', 'fyllda-paprikor': 'balance', 'hoisin-filebitar': 'spin', 'yakiniku': 'balance', 'svartbonsas': 'dance', 'bowl': 'balance', 'raggmunkar': 'flip', 'ugnspannkaka': 'flip',
  'brunsas': 'dip', 'loksas': 'cry', 'graddsas': 'dip', 'currysas': 'fire', 'jordnotssas': 'dip',
  'kall-vitlokssas': 'stink', 'kall-ort-vitlokssas': 'stink', 'kall-pestosas': 'dip', 'ranchdressing': 'spin', 'remouladsas': 'dip', 'dillsas': 'dip', 'dill-kaprissas': 'dip', 'avokadosas': 'spin', 'tzatziki': 'stink',
  'hummus': 'dance', 'bonblandning': 'toss', 'skagenrora': 'dip', 'varrullesaser': 'dance', 'kalsallad': 'toss', 'farskpotatissallad': 'toss', 'gurk-tomatsallad': 'toss', 'asiatisk-gurka': 'fire', 'pressgurka': 'dance', 'picklad-rodlok': 'cry',
  'potatismos': 'hug', 'gult-ris': 'dance', 'stekt-tofu': 'flip', 'timjan-tofu': 'chefkiss',
  'overnight-oats': 'sleepy', 'chiapudding': 'sleepy', 'bananpannkakor': 'flip', 'scrambled-tofu': 'flip', 'avokadotoast': 'present', 'bruschetta': 'stink', 'fattiga-riddare': 'flip',
  'bananbrod': 'present', 'bullar': 'juggle', 'muffins': 'juggle', 'mordegskakor': 'juggle', 'sockerkaka': 'present', 'kladdkaka': 'present', 'mug-cake': 'magic',
  'smulpaj': 'present', 'bananpaj': 'present', 'varm-choklad': 'sip', 'dalgona': 'sip', 'islatte': 'shiver'
};
const MASCOT_FACE = {
  drum: ['joy', 'grin'], twirl: ['joy', 'smile'], fire: ['squint', 'o'], hug: ['heart', 'smile'], balance: ['wink', 'grin'], slurp: ['joy', 'tongue'],
  dance: ['joy', 'grin'], toss: ['up', 'grin'], juggle: ['up', 'o'], flip: ['up', 'o'], dip: ['star', 'tongue'], cry: ['teary', 'smile'],
  stink: ['squint', 'wavy'], sleepy: ['sleepy', 'smile'], present: ['wink', 'grin'], magic: ['star', 'o'], sip: ['heart', 'smile'],
  shiver: ['normal', 'chatter'], chefkiss: ['joy', 'kiss'], spin: ['dizzy', 'grin']
};
function mascotProps(act, img, A) {
  const dish = (x, y, s, cls = '') => img ? `<image class="${cls}" href="${img}" x="${x}" y="${y}" width="${s}" height="${s}"/>` : `<circle class="${cls}" cx="${x + s / 2}" cy="${y + s / 2}" r="${s * .38}" fill="#eee"/>`;
  const spoon = cls => `<g class="${cls}"><path d="M0 0 L 34 -34" stroke="#b9bec2" stroke-width="7" stroke-linecap="round"/><ellipse cx="40" cy="-40" rx="11" ry="8" transform="rotate(-45 40 -40)" fill="#d6dadd" stroke="#8b9095" stroke-width="2"/></g>`;
  const heart = (x, y, s = 1, cls = '') => `<path class="${cls}" d="M0 10 C -18 -2, -8 -18, 0 -8 C 8 -18, 18 -2, 0 10Z" fill="#e8566a" transform="translate(${x} ${y}) scale(${s})"/>`;
  const star = (x, y, cls = '') => `<path class="${cls}" d="M${x} ${y - 9} l3 6 7 1 -5 5 1 7 -6 -3 -6 3 1 -7 -5 -5 7 -1z" fill="#ffe08a" stroke="#2a211b" stroke-width="1.5"/>`;
  switch (act) {
    case 'twirl': return dish(-40, 96, 92) + `<g class="p-fork"><path d="M58 112 L 92 150" stroke="#c9ced1" stroke-width="6" stroke-linecap="round"/><g class="p-swirl"><circle cx="54" cy="106" r="15" fill="none" stroke="#eed395" stroke-width="7"/><circle cx="54" cy="106" r="7" fill="none" stroke="#e2c07a" stroke-width="5"/></g></g>`;
    case 'slurp': return dish(-44, 100, 96) + `<g class="p-steam"><path d="M-10 96 q 10 -14 0 -28 q -10 -14 0 -28" /><path d="M8 94 q 10 -14 0 -28 q -10 -14 0 -28"/><path d="M26 98 q 10 -14 0 -28 q -10 -14 0 -28"/></g><g transform="translate(40 150)">${spoon('p-spoon')}</g><text class="p-word" x="-30" y="40">slurp!</text>`;
    case 'fire': return dish(-44, 100, 92) + `<g class="p-flame"><path d="M120 162 C 140 177, 150 207, 132 234 C 150 216, 160 238, 150 254 C 175 232, 172 192, 140 170 Z" fill="#f6b03a"/><path d="M122 164 C 134 182, 138 202, 128 222 C 142 208, 146 190, 132 172 Z" fill="#e8472a"/></g><g class="p-sweat"><path d="M178 100 q 6 10 0 16 q -6 -6 0 -16Z" fill="#8ec5e8"/><path d="M66 96 q 6 10 0 16 q -6 -6 0 -16Z" fill="#8ec5e8"/></g><rect class="p-blush" x="62" y="96" width="116" height="80" rx="40" fill="#e8472a"/>`;
    case 'flip': return `<g class="p-pan"><path d="M-60 150 L 20 142" stroke="#2a2a2c" stroke-width="10" stroke-linecap="round"/><ellipse cx="-10" cy="146" rx="46" ry="14" fill="#2f2f33"/><ellipse cx="-10" cy="143" rx="40" ry="10" fill="#1d1d20"/></g><g class="p-flipper">${dish(-42, 104, 64)}</g>`;
    case 'present': return `<g class="p-up">${dish(-60, 20, 110)}</g><g class="p-spark">${star(-40, 24)}${star(62, 6)}${star(-70, 104)}</g>`;
    case 'juggle': return `<g class="p-jug p-j1">${dish(-27, -27, 54)}</g><g class="p-jug p-j2">${dish(-27, -27, 54)}</g><g class="p-jug p-j3">${dish(-27, -27, 54)}</g>`;
    case 'sip': return `<g class="p-mug">${dish(-30, 70, 86)}</g><g class="p-heart">${heart(20, 50)}</g>`;
    case 'shiver': return `<g class="p-mug">${dish(-30, 70, 86)}</g><g class="p-ice"><rect x="-54" y="40" width="22" height="22" rx="5" fill="rgba(220,240,255,.8)" stroke="#fff" stroke-width="2"/><rect x="-26" y="20" width="18" height="18" rx="4" fill="rgba(220,240,255,.7)" stroke="#fff" stroke-width="2"/></g><text class="p-word" x="-60" y="10">brrr</text><g class="p-snow"><text x="170" y="40">❄</text><text x="200" y="80">❄</text></g>`;
    case 'dip': return dish(-44, 100, 92) + `<g transform="translate(20 152)">${spoon('p-spoon p-dip')}</g><g class="p-stars">${star(76, 108)}${star(166, 108)}</g>`;
    case 'toss': return dish(-44, 104, 92) + [0, 1, 2, 3, 4].map(i => `<g class="p-leaf p-l${i}"><path d="M-13 0 C -5 -10, 9 -8, 13 0 C 9 8, -5 10, -13 0Z" fill="${['#4b8a2d', '#6fa83a', '#d9402a', '#8fbf5a', '#f2c53a'][i]}" stroke="#2a211b" stroke-width="1.5"/></g>`).join('');
    case 'cry': return dish(-44, 100, 92) + `<g class="p-tears"><path d="M88 142 q 6 12 0 18 q -6 -6 0 -18Z" fill="#8ec5e8"/><path d="M152 142 q 6 12 0 18 q -6 -6 0 -18Z" fill="#8ec5e8"/></g><text class="p-word" x="-40" y="60">snyft</text>`;
    case 'stink': return dish(-44, 100, 92) + `<g class="p-stink"><path d="M-20 92 q 10 -12 0 -24 q -10 -12 0 -24"/><path d="M6 88 q 10 -12 0 -24 q -10 -12 0 -24"/><path d="M32 92 q 10 -12 0 -24 q -10 -12 0 -24"/></g><g class="p-pinch"><circle cx="120" cy="142" r="11" fill="#fff7ea" stroke="#2a211b" stroke-width="4"/></g>`;
    case 'sleepy': return dish(-44, 100, 92) + `<g class="p-z"><text x="150" y="60">z</text><text x="170" y="36">z</text><text x="192" y="12">Z</text></g>`;
    case 'drum': return dish(-48, 96, 100) + `<g class="p-stick"><path d="M70 60 L 20 110" stroke="#a8743f" stroke-width="7" stroke-linecap="round"/></g><g class="p-notes"><text x="-40" y="60">♪</text><text x="-10" y="30">♫</text></g>`;
    case 'balance': return `<g class="p-head">${dish(66, -60, 108)}</g>`;
    case 'hug': return `<g class="p-hug">${dish(70, 150, 100)}</g><g class="p-hearts">${heart(40, 60)}${heart(190, 50, .7)}${heart(20, 110, .5)}</g>`;
    case 'magic': return dish(-44, 100, 92) + `<g class="p-clock"><circle cx="-30" cy="40" r="26" fill="#fff" stroke="#2a211b" stroke-width="4"/><path class="p-hand" d="M-30 40 L -30 22" stroke="#2a211b" stroke-width="4" stroke-linecap="round"/></g><g class="p-spark">${star(10, 10)}${star(-60, 80)}</g>`;
    case 'chefkiss': return dish(-44, 108, 88) + `<g class="p-kisshand"><circle cx="0" cy="0" r="13" fill="#fff7ea" stroke="#2a211b" stroke-width="4"/><path d="M-4 -12 q 4 -8 8 0" fill="#fff7ea" stroke="#2a211b" stroke-width="3"/></g><g class="p-kiss">${heart(0, 0, .8)}</g><text class="p-word p-mwah" x="150" y="40">mwah!</text>`;
    case 'spin': return dish(-44, 100, 92) + `<g class="p-orbit">${star(60, 0)}${star(0, 0)}${star(-60, 0)}</g>`;
    default: return dish(-44, 100, 92) + `<g class="p-notes"><text x="-40" y="60">♪</text><text x="200" y="40">♫</text></g>`;
  }
}
function playMascot(host, id, A) {
  const quip = QUIPS[id] || 'Det där gick ju alldeles utmärkt.', act = MASCOT_ACT[id] || 'dance', [eyes, mouth] = MASCOT_FACE[act] || ['normal', 'smile'];
  const icons = [...new Set(A.flat(id).map(f => A.iconFor(f.k)).filter(Boolean))];
  let img = null; try { img = A.thumbURL(id); } catch (e) { }
  const svg = MASCOT_SVG.replace('</svg>', `<g class="m-props">${mascotProps(act, img, A)}</g></svg>`);
  host.innerHTML = `<div class="mascot m-${act}" data-eyes="${eyes}" data-mouth="${mouth}"><div class="m-stage">${svg}</div><div class="m-bubble"><p class="m-hi">Smaklig måltid!</p><p class="m-quip" aria-label="${A.esc(quip)}"></p></div><div class="m-confetti"></div></div>`;
  const m = host.querySelector('.mascot'), q = host.querySelector('.m-quip'), conf = host.querySelector('.m-confetti');
  const all = host.querySelector('.m-all'), props = host.querySelector('.m-props'); all.appendChild(props);
  const N = A.REDUCED ? 0 : 26;
  for (let i = 0; i < N && icons.length; i++) {
    const s = document.createElement('img'); s.src = icons[i % icons.length]; s.alt = '';
    s.style.cssText = `--x:${(Math.random() * 100).toFixed(1)}%;--dx:${((Math.random() - .5) * 160).toFixed(0)}px;--r:${((Math.random() - .5) * 900).toFixed(0)}deg;--d:${(1.8 + Math.random() * 1.6).toFixed(2)}s;--delay:${(.35 + Math.random() * .7).toFixed(2)}s;--s:${(26 + Math.random() * 22).toFixed(0)}px`;
    conf.appendChild(s);
  }
  A.SND.tada && A.SND.tada();
  let i = 0; const txt = quip;
  const talk = () => { if (!host.isConnected) return; if (i <= txt.length) { q.textContent = txt.slice(0, i); m.classList.toggle('talking', i < txt.length && /[a-zåäö]/i.test(txt[i] || '')); i += 1; setTimeout(talk, txt[i - 2] === '.' ? 260 : 32); } else m.classList.remove('talking'); };
  setTimeout(talk, A.REDUCED ? 0 : 1100);
}
