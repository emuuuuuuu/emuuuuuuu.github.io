# Jobbsøk med naturlig språk

Matcher utvalget til en frontier-LLM til 1/80 av kostnaden

![](/article/jobbsikt/query-box.png)

Anbefalingene til de fleste jobbportaler lider av det samme problemet. Et søk på en stillingstittel gir et uoverkommelig antall treff, der de fleste åpenbart er irrelevante allerede ut fra tittelen. Eller du klikker deg inn på noe som ser lovende ut, bare for å oppdage at du ikke engang er kvalifisert til å søke. Nyansene i hva brukeren faktisk er ute etter er for detaljerte til å få plass i et primitivt søkefelt.

Den åpenbare løsningen er vektorsøk med brukerens CV, enten ved å sammenligne den vektoriserte CV-en direkte mot vektoriserte annonser, eller ved å bruke [HyDE (Hypothetical Document Embeddings)](https://arxiv.org/abs/2212.10496). For ikke å gå glipp av skjulte perler må dette søket være bredt, og et bredt søk fanger uunngåelig opp irrelevante annonser som er tungvinte å luke ut.

Dette filtreringsproblemet er nettopp det cross-encoder-rerankere er laget for. De scorer annonser etter semantisk relevans mot CV-en og er billige å kjøre, men tekstforståelsen deres er begrenset. De sliter med negasjoner, de lar seg påvirke av dokumentlengde, og de scorer hvert dokument for seg, så sammenlignende rangeringer er ikke mulig.

Det er her LLM-er kommer inn. [RankGPT](https://arxiv.org/abs/2304.09542) viste potensialet i 2023, men til en høy pris i både kostnad og ventetid. Datidens frontier-modell, GPT-4, kostet $52,5 per million output-tokens, mens en modell med tilsvarende ytelse i dag, Granite-4.1-8B, koster $0,09.

Noen jobbportaler har begynt å integrere LLM-er. Finn.no tilbyr LLM-scoring, men brukeren må velge det manuelt per annonse, så jobben er allerede funnet av brukeren, de fikk ingen hjelp med selve søket. Finn.no har også "SmartSøk", som kombinerer semantisk søk med en LLM. For å holde ventetid og kostnad nede søker den enten for smalt eller bruker en LLM som er for svak til å gi gode resultater. Den viser dessuten bare noen få annonser om gangen, noe som gir brukeren lite oversikt: ingen trygghet i at det ikke ligger en drømmestilling der ute som de gikk glipp av.

## Jobbsikt

Jobbsikt lar brukeren laste opp CV-en sin sammen med en søketekst som eventuelt beskriver stedspreferanser og lignende. Vi gjør et bredt søk på 200 annonser og rangerer dem nesten nøyaktig slik Claude Fable 5.1 ville gjort, alt på rundt 10 sekunder og for omtrent $0,03 per søk. Resultatet gir deg en rangert og scoret oversikt over alle annonsene.

```video
/article/jobbsikt/demo.mp4
```

Med utgangspunkt i CV-en og søketeksten får vi en LLM til å generere en fiktiv stillingsannonse i stilen til norske jobbportaler. Vi genererer 3 på norsk og 3 på engelsk, begge med temperature = 0.7, vektoriserer dem og tar gjennomsnittet for å redusere varians. Før vektorsøket henter vi ut eventuelle stedspreferanser fra søket, som vi bruker i en WHERE-klausul for å begrense søket til disse områdene, fordi sted nesten alltid er et hardt filter og ikke noe en LLM bør vurdere skjønnsmessig, og det er en av de billigste måtene å øke recall på. Deretter gjør vi et vektorsøk mot de 10 000+ reelle annonsene vi har hentet fra [NAV](https://arbeidsplassen.no) og vektorisert. Vi tar de 200 beste kandidatene og reranker dem batchvis med [Jev](https://docs.typesafe.ai/introduction), en generell klassifikator. For å holde kostnaden nede vurderer ikke dette reranking-steget den opprinnelige annonsen, men et komprimert sammendrag vi lager ved innhentingen, der vi fjerner floskler og overflødig informasjon for å redusere token-kostnaden. Reranking-steget returnerer en score for hver annonse på en karakterskala vi har spesifisert i instruksjonen.

## Søkeeksempler

**CV: 19-åring rett ut av videregående, ingen jobberfaring.**

> Er litt introvert, så har ikke sånn veldig lyst til å jobbe i butikk.

![](/article/jobbsikt/example-school-leaver.png)

---

**CV: Sykepleier med 8 års erfaring**

> Er blitt lei av å være på gulvet, har lyst på noe mer administrativt.

![](/article/jobbsikt/example-nurse.png)

## Evaluering

Å evaluere denne pipelinen ved å lage et manuelt annotert datasett med 10 000+ rangerte annonser for en håndfull CV- og søketekster er ugjennomførbart; det er for mange kombinasjoner, og det er litt subjektivt hva som gjør et forslag godt. Men med kvaliteten på frontier-modellene vi har i dag kan vi bruke rangeringen til modeller som Claude Fable 5.1 som et sammenlignbart "fasitdatasett", og måle billigere modeller mot det i vår egen evalueringsrigg.

Teknisk detalj: Å la modeller resonnere hjelper rangeringen betydelig, og selv om det egentlig ikke koster så mye mer, siden mesteparten av kostnaden vår ligger i input-tokens, er det vesentlig tregere, til tider 10x ventetiden, noe som er upraktisk for en tjeneste som presenteres som søk. Vi har derfor bare eksperimentert med modeller uten resonnering, med unntak av Jev, som ikke engang er en LLM.

Alle målene nedenfor er målt mot Fables gradering av de samme annonsene:

- **nDCG@10** — hvor tett topp 10 treffer Fables rekkefølge, vektet slik at de øverste plassene teller mest.
- **best F1** — den beste balansen mellom presisjon og recall modellen kan oppnå på «verdt å søke på», ved den terskelen som passer den best.
- **Spearman** — rangkorrelasjon over alle 200 annonsene, ikke bare toppen av listen.
- **false+** — annonser modellen legger over terskelen som Fable legger under.

![](/article/jobbsikt/grader-benchmark.png)

![](/article/jobbsikt/cost-latency.png)

Å kjøre de samme 200 annonsene gjennom Fable ville betydd 200 annonser på rundt 1 180 tokens hver, altså omtrent 236 000 input-tokens til $10 per million = $2,36 per søk før output, mot $0,03 for hele Jobbsikt-pipelinen, altså rundt 1/80.

De fleste modellene vi har eksperimentert med er, til tross for at resonnering er skrudd av, overraskende gode til å være enige med Fable om de 10 øverste annonsene; alle modellene er i snitt enige mer enn 78 % av gangene. Men en påfallende forskjell er hvor selektive frontier-modellene er med hvilke annonser som scorer over terskelen for hva som er verdt å søke på (som ifølge karakterskalaen er 0,5), sammenlignet med de billigere LLM-ene. Denne selektiviteten er viktig, for hvis noen få åpenbart dårlige treff dukker opp, begynner brukeren å tvile på resultatene i sin helhet. Denne overivrigheten etter å score middelmådige annonser over terskelen gjelder derimot ikke Jev, som gir nesten ingen falske positiver sammenlignet med fasiten, og den er veldig rask. Jevs noe lavere Spearman-score skyldes i hovedsak at den er enda strengere enn Fable på harde kvalifikasjonskrav når den rangerer.

## Konklusjon

Å bruke Fable som fasit er ingen eksakt vitenskap, men det er det beste alternativet tilgjengelig for å få menneskelignende rangering i stor skala, noe som er nødvendig for data som er så store og nyanserte som dette. Modellene har blitt gode nok til at det å skille veldig gode resultater fra utrolig gode har sluttet å ha noe å si. Om den 7. annonsen egentlig burde vært den 8. på resultatlisten, er ikke særlig relevant for brukeren, så lenge de kan stole på at de får se det de ba om. Men om en annonse de åpenbart ikke er kvalifisert for i det hele tatt dukker opp, merker de med én gang, og det er dette Jev får til, til 1/80 av kostnaden.

---

*Jobbsikt er laget av Vebjørn Haug Kåsene og Emil Ekelund.*