# Stringa di query

<!--introduced_in=v0.10.0-->

> Stabilità: 2 - Stable

<!--name=querystring-->

Il modulo `querystring` fornisce utility per l'analisi e la formattazione delle stringhe di query URL. Ci si può accedere utilizzando:

```js
const querystring = require('querystring');
```

## querystring.decode()
<!-- YAML
added: v0.1.99
-->

The `querystring.decode()` function is an alias for `querystring.parse()`.

## querystring.encode()
<!-- YAML
added: v0.1.99
-->

The `querystring.encode()` function is an alias for `querystring.stringify()`.

## querystring.escape(str)
<!-- YAML
added: v0.1.25
-->

* `str` {string}

Il metodo `querystring.escape()` esegue la codifica percentuale dell'URL sul dato `str` in modo ottimizzato per i requisiti specifici delle stringhe di query dell'URL.

Il metodo `querystring.escape()` è utilizzato da `querystring.stringify()` e generalmente non dovrebbe essere utilizzato direttamente. Viene esportato principalmente per consentire al codice dell'applicazione di fornire un'implementazione di codifica percentuale sostitutiva, se necessario, assegnando `querystring.escape` a una funzione alternativa.

## querystring.parse(str[, sep[, eq[, options]]])
<!-- YAML
added: v0.1.25
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/10967
    description: Multiple empty entries are now parsed correctly (e.g. `&=&=`).
  - version: v6.0.0
    pr-url: https://github.com/nodejs/node/pull/6055
    description: The returned object no longer inherits from `Object.prototype`.
  - version: v6.0.0, v4.2.4
    pr-url: https://github.com/nodejs/node/pull/3807
    description: The `eq` parameter may now have a length of more than `1`.
-->

* `str`{string} La stringa di query URL da analizzare
* `sep` {string} La sottostringa utilizzata per delimitare le coppie di chiavi e valori nella stringa di query. **Default:** `'&'`.
* `eq` {string}. La sottostringa utilizzata per delimitare chiavi e valori nella stringa di query. **Default:** `'='`.
* `options` {Object}
  * `decodeURIComponent` {Function} La funzione da utilizzare durante la decodifica di caratteri con codifica percentuale nella stringa di query. **Default:** `querystring.unescape()`.
  * `maxKeys` {number} Specifica il numero massimo di chiavi da analizzare. Specificare `0` per rimuovere le limitazioni del conteggio delle chiavi. **Default:** `1000`.

Il metodo `querystring.parse()` analizza una stringa di query URL (`str`) in un insieme di coppie chiave-valore.

Ad esempio, la stringa di query `'foo=bar&abc=xyz&abc=123'` viene analizzata in:
```js
{
  foo: 'bar',
  abc: ['xyz', '123']
}
```

The object returned by the `querystring.parse()` method _does not_ prototypically inherit from the JavaScript `Object`. Ciò significa che i tipici metodi `Object` come `obj.toString()`, `obj.hasOwnProperty()` e altri non vengono definiti e *non funzioneranno*.

Per impostazione predefinita, si presume che i caratteri con codifica percentuale all'interno della stringa di query utilizzino la codifica UTF-8. If an alternative character encoding is used, then an alternative `decodeURIComponent` option will need to be specified:

```js
// Supponendo che la funzione gbkDecodeURIComponent esista già...

querystring.parse('w=%D6%D0%CE%C4&foo=bar', null, null,
                  { decodeURIComponent: gbkDecodeURIComponent });
```

## querystring.stringify(obj[, sep[, eq[, options]]])<!-- YAML
added: v0.1.25
-->* `obj` {Object} L'object da serializzare in una stringa di query URL
* `sep` {string} La sottostringa utilizzata per delimitare le coppie di chiavi e valori nella stringa di query. **Default:** `'&'`.
* `eq` {string}. La sottostringa utilizzata per delimitare chiavi e valori nella stringa di query. **Default:** `'='`.
* `options`
  * `encodeURIComponent`{Function} La funzione da utilizzare durante la conversione di caratteri URL non sicuri in codifica percentuale nella stringa di query. **Default:** `querystring.escape()`.

Il metodo `querystring.stringify()` produce una stringa di query URL da un determinato `obj` dall'iterazione attraverso le "proprietà proprie" dell'oggetto.

It serializes the following types of values passed in `obj`:
{string|number|boolean|string[]|number[]|boolean[]}
Any other input values will be coerced to empty strings.

```js
querystring.stringify({ foo: 'bar', baz: ['qux', 'quux'], corge: '' });
// restituisce 'foo=bar&baz=qux&baz=quux&corge='

querystring.stringify({ foo: 'bar', baz: 'qux' }, ';', ':');
// restituisce 'foo:bar;baz:qux'
```

Per impostazione predefinita, i caratteri che richiedono codifica in percentuale all'interno della stringa di query saranno codificati come UTF-8. If an alternative encoding is required, then an alternative `encodeURIComponent` option will need to be specified:

```js
// Supponendo che la funzione gbkEncodeURIComponent esista già,

querystring.stringify({ w: '中文', foo: 'bar' }, null, null,
                      { encodeURIComponent: gbkEncodeURIComponent });
```

## querystring.unescape(str)
<!-- YAML
added: v0.1.25
-->

* `str` {string}

Il metodo `querystring.unescape()` esegue la decodifica dei caratteri con codifica percentuale dell'URL sulla `str` indicata.

Il metodo `querystring.unescape()` è utilizzato da `querystring.parse()` e generalmente non dovrebbe essere utilizzato direttamente. Viene esportato principalmente per consentire al codice dell'applicazione di fornire un'implementazione di decodifica sostitutiva, se necessario, assegnando `querystring.unescape` a una funzione alternativa.

Per impostazione predefinita, il metodo `querystring.unescape()` tenterà di utilizzare il metodo JavaScript incorporato `decodeURIComponent()` per la decodifica. Se fallisce, verrà utilizzato un equivalente più sicuro che non genera URL malformati.
