# Tästä dokumentaatiosta

<!--introduced_in=v0.10.0-->
<!-- type=misc -->

Tämän dokumentaation tavoittena on selittää Node.js rajapinta sekä viittauksellisesta että käsitteellisestä näkökulmasta. Jokainen osio kuvaa sisäänrakennetun moduulin tai korkeamman tason käsitteen.

Ominaisuuksien tyypit, menetelmien argumentit ja tapahtumankäsittelijöiden argumentit on annettu listana aiheen otsikon alla tarvittaessa.

## Auttaminen

Jos näet tässä dokumentaatiossa virheitä, ole ystävällinen ja [lähetä virheraportti](https://github.com/nodejs/node/issues/new) tai katso [auttamisoppaasta](https://github.com/nodejs/node/blob/master/CONTRIBUTING.md) ohjeet kuinka lähettää korjaus.

Jokainen tiedosto on generoitu Node.js:n lähdekoodin `doc/api` kansion sisältämästä `.md` tiedostosta. Dokumentaatio on luotu käyttämällä `tools/doc/generate.js` ohjelmaa. HTML mallipohja on sijainnissa `doc/template.html`.

## Vakausindeksi

<!--type=misc-->

Läpi dokumentaation on merkkejä osion vakaudesta. Node.js API on vielä osittain muuttumassa, ja kun se kypsyy, jotkin osat ovat luotettavampia kuin toiset. Jotkut ovat jo niiden koeteltua ja luotettuja, että ne tuskin muuttuvat enää lainkaan. Jotkin osat ovat upouusia ja kokeellisia, tai tiedetään muutoin riskialttiiksi ja aiotaan suunnitella uudestaan.

Vakausindeksit ovat:

```txt
Stability: 0 - Deprecated
This feature is known to be problematic, and changes may be planned. Do
not rely on it. Use of the feature may cause warnings to be emitted.
Taaksepäin yhteensopivuutta pääversioiden läpi ei tulisi odottaa.
```

```txt
Stability: 1 - Experimental
This feature is still under active development and subject to non-backwards
compatible changes, or even removal, in any future version. Use of the feature
is not recommended in production environments. Experimental features are not
subject to the Node.js Semantic Versioning model.
```

```txt
Stability: 2 - Stable
The API has proven satisfactory. Compatibility with the npm ecosystem
is a high priority, and will not be broken unless absolutely necessary.
```

*Note*: Caution must be used when making use of `Experimental` features, particularly within modules that may be used as dependencies (or dependencies of dependencies) within a Node.js application. Loppukäyttäjät eivät välttämättä ole tietoisia kokeellisten toimintojen käytöstä ja siksi voivat kokea odottamattomia virheitä tai käyttäytymismuutoksia kun API muutoksia sattuu. Tällaisten yllätysten välttämiseksi, `Kokeelliset` toiminnot voivat vaatia komentorivioption niiden aktivoimista varten, tai voivat aiheuttaa prosessivaroituksen näkymisen. By default, such warnings are printed to [`stderr`][] and may be handled by attaching a listener to the [`process.on('warning')`][] event.

## JSON Output
<!-- YAML
added: v0.6.12
-->

> Vakaus: 1 - Kokeellinen

Jokaisella `.html` dokumentilla on vastaava `.json` dokumentti esittämään saman tiedon rakenteisesti. Tämä toiminto on kokeellinen ja lisätty IDE:lle ja muille työkaluille, jotka käsittelevät dokumentaatiota ohjelmallisesti.

## Syscalls and man pages

Systeemikutsut, kuten open(2) ja read(2) määrittelevät käyttäjäohjelmien ja alla olevan käyttöjärjestelmän välisen rajapinnan. Node functions which simply wrap a syscall, like [`fs.open()`][], will document that. Dokumentaatiossa linkitetään vastaavat manuaalisivut, jotka kuvaavat kuinka systeemikutsut toimivat.

Eräät systeemikutsut, kuten lchown(2) ovat käytössä vain BSD:ssä. That means, for example, that [`fs.lchown()`][] only works on macOS and other BSD-derived systems, and is not available on Linux.

Useimmilla Unixin systeemikutsuilla on vastaavuudet Windows-ympäristössä, mutta käyttäytyminen voi vahdella Windowsissa suhteessa Linuxiin tai macOS:n. For an example of the subtle ways in which it's sometimes impossible to replace Unix syscall semantics on Windows, see [Node.js issue 4760](https://github.com/nodejs/node/issues/4760).
