# Percorso

<!--introduced_in=v0.10.0-->

> Stabilità: 2 - Stable

Il modulo `path` fornisce utility per lavorare con percorsi di file e directory. Ci si può accedere utilizzando:

```js
const path = require('path');
```

## Windows vs. POSIX

L'operazione predefinita del modulo `path` varia in base al sistema operativo su cui è in esecuzione un'applicazione Node.js. In particolare, quando si esegue su un sistema operativo Windows, il modulo `path` presumerà che vengano utilizzati percorsi in stile Windows.

So using `path.basename()` might yield different results on POSIX and Windows:

Su POSIX:

```js
path.basename('C:\\temp\\myfile.html');
// Restituisce: 'C:\\temp\\myfile.html'
```

Su Windows:

```js
path.basename('C:\\temp\\myfile.html');
// Restituisce: 'myfile.html'
```

Per ottenere risultati consistenti quando si lavora con i file path di Windows su qualsiasi sistema operativo, utilizzare [`path.win32`][]:

Su POSIX e Windows:

```js
path.win32.basename('C:\\temp\\myfile.html');
// Restituisce: 'myfile.html'
```

Per ottenere risultati consistenti quando si lavora con i file path di POSIX su qualsiasi sistema operativo, utilizzare [`path.posix`][]:

Su POSIX e Windows:

```js
path.posix.basename('/tmp/myfile.html');
// Restituisce: 'myfile.html'
```

*Nota:* Su Windows Node.js segue il concetto di working directory per unità. Questo comportamento può essere osservato quando si utilizza un percorso di unità senza backslash. Ad esempio `path.resolve ('c: \\')` può potenzialmente restituire un risultato diverso da `path.resolve ('c:')`. Per maggiori informazioni, vedi [questa pagina MSDN](https://msdn.microsoft.com/en-us/library/windows/desktop/aa365247.aspx#fully_qualified_vs._relative_paths).

## path.basename(path[, ext])
<!-- YAML
added: v0.1.25
changes:
  - version: v6.0.0
    pr-url: https://github.com/nodejs/node/pull/5348
    description: Passing a non-string as the `path` argument will throw now.
-->

* `path` {string}
* `ext` {string} Un'estensione di file opzionale
* Restituisce: {string}

I metodi `path.basename()` restituiscono l'ultima porzione di un ` path`, simile al comando `basename` Unix. I separatori di directory finali vengono ignorati, vedere [`path.sep`][].

Per esempio:

```js
path.basename('/foo/bar/baz/asdf/quux.html');
// Restituisce: 'quux.html'

path.basename('/foo/bar/baz/asdf/quux.html', '.html');
// Restituisce: 'quux'
```

Un [`TypeError`][] è lanciato se `path` non è una stringa o se `ext` è indicato e non è una stringa.

## path.delimiter
<!-- YAML
added: v0.9.3
-->

* {string}

Fornisce il delimitarore del percorso specifico della piattaforma:

* `;` per Windows
* `:` per POSIX

Ad esempio, su POSIX:

```js
console.log(process.env.PATH);
// Stampa: '/usr/bin:/bin:/usr/sbin:/sbin:/usr/local/bin'

process.env.PATH.split(path.delimiter);
// Restituisce: ['/usr/bin', '/bin', '/usr/sbin', '/sbin', '/usr/local/bin']
```

Su Windows:

```js
console.log(process.env.PATH);
// Stampa: 'C:\Windows\system32;C:\Windows;C:\Program Files\node\'

process.env.PATH.split(path.delimiter);
// Restituisce ['C:\\Windows\\system32', 'C:\\Windows', 'C:\\Program Files\\node\\']
```

## path.dirname(path)
<!-- YAML
added: v0.1.16
changes:
  - version: v6.0.0
    pr-url: https://github.com/nodejs/node/pull/5348
    description: Passing a non-string as the `path` argument will throw now.
-->

* `path` {string}
* Restituisce: {string}

Il metodo `path.dirname()` restituisce il nome della directory di un `path`, simile al comando Unix `dirname`. I separatori di directory finali vengono ignorati, vedere [`path.sep`][].

Per esempio:

```js
path.dirname('/foo/bar/baz/asdf/quux');
// Restituisce: '/foo/bar/baz/asdf'
```

Un [`TypeError`] [] viene lanciato se `path` non è una stringa.

## path.extname(path)
<!-- YAML
added: v0.1.25
changes:
  - version: v6.0.0
    pr-url: https://github.com/nodejs/node/pull/5348
    description: Passing a non-string as the `path` argument will throw now.
-->

* `path` {string}
* Restituisce: {string}

Il metodo `path.extname()` restituisce l'estensione del `path`, dall'ultima comparsa del carattere `.` (punto) alla fine della stringa nell'ultima parte del `path`. Se non c'è nessun `.` nell'ultima porzione del `path`, o se il primo carattere del nome di base del `path` (vedi `path.basename()`) è `.`, viene restituita una stringa vuota.

Per esempio:

```js
path.extname('index.html');
// Restituisce: '.html'

path.extname('index.coffee.md');
// Restituisce: '.md'

path.extname('index.');
// Restituisce: '.'

path.extname('index');
// Restituisce: ''

path.extname('.index');
// Restituisce: ''
```

Un [`TypeError`] [] viene lanciato se `path` non è una stringa.

## path.format(pathObject)
<!-- YAML
added: v0.11.15
-->

* `pathObject` {Object}
  * `dir` {string}
  * `root` {string}
  * `base` {string}
  * `name` {string}
  * `ext` {string}
* Restituisce: {string}

Il metodo `path.format ()` restituisce una stringa di percorso da un object. Questo è l'opposto di [`path.parse()`][].

Quando si forniscono proprietà al `pathObject` si ricorda che esistono combinazioni dove una proprietà ha la priorità su un'altra:

* `pathObject.root` viene ignorato se `pathObject.dir` viene fornito
* `pathObject.ext` e `pathObject.name` vengono ignorati se `pathObject.base` esiste

Ad esempio, su POSIX:

```js
// se `dir`, `root` and `base`vengono forniti,
// `${dir}${path.sep}${base}`
// verrà restituito. `root` viene ignorato.
path.format({
  root: '/ignored',
  dir: '/home/user/dir',
  base: 'file.txt'
});
// Restituisce: '/home/user/dir/file.txt'

// `root` sarà usato se`dir` non è specificato.
// Se viene fornito solo `root` o` dir` è uguale a `root`, il 
// separatore della piattaforma non sarà incluso. `ext` verrà ignorato.
path.format({
  root: '/',
  base: 'file.txt',
  ext: 'ignored'
});
// Restituisce: '/file.txt'

// `name` + `ext` verrà usato se `base` non è specificato.
path.format({
  root: '/',
  name: 'file',
  ext: '.txt'
});
// Restituisce: '/file.txt'
```

Su Windows:

```js
path.format({
  dir: 'C:\\path\\dir',
  base: 'file.txt'
});
// Restituisce: 'C:\\path\\dir\\file.txt'
```

## path.isAbsolute(path)
<!-- YAML
added: v0.11.2
-->

* `path` {string}
* Restituisce: {boolean}

Il metodo `path.isAbsolute ()` determina se il `path` è un absolute path.

Se il `path` dato è una stringa di lunghezza zero, verrà restituito `false`.

Ad esempio su POSIX:

```js
path.isAbsolute('/foo/bar'); // true
path.isAbsolute('/baz/..');  // true
path.isAbsolute('qux/');     // false
path.isAbsolute('.');        // false
```

Su Windows:

```js
path.isAbsolute('//server');    // true
path.isAbsolute('\\\\server');  // true
path.isAbsolute('C:/foo/..');   // true
path.isAbsolute('C:\\foo\\..'); // true
path.isAbsolute('bar\\baz');    // false
path.isAbsolute('bar/baz');     // false
path.isAbsolute('.');           // false
```

Un [`TypeError`] [] viene lanciato se `path` non è una stringa.

## path.join([...paths])
<!-- YAML
added: v0.1.16
-->

* `...paths` {string} Una sequenza di segmenti di percorso
* Restituisce: {string}

Il metodo `path.join()` unisce tutti i segmenti del `path` dati insieme utilizzando il separatore specifico della piattaforma come delimitatore, quindi normalizza il percorso risultante.

I segmenti di lunghezza zero `path` vengono ignorati. Se la stringa del percorso utilizzato è una stringa di lunghezza zero, verrà restituito `'.'`, che rappresenta la directory di lavoro corrente.

Per esempio:

```js
path.join('/foo', 'bar', 'baz/asdf', 'quux', '..');
// Restituisce: '/foo/bar/baz/asdf'

path.join('foo', {}, 'bar');
// lancia 'TypeError: Path deve essere una stringa. Ricevuto {}'
```

Un [`TypeError`] [] viene lanciato se uno dei segmenti del percorso non è una stringa.

## path.normalize(path)
<!-- YAML
added: v0.1.23
-->

* `path` {string}
* Restituisce: {string}

Il metodo `path.normalize()` normalizza il `path` dato, risolvendo i segmenti `'..'` e `'.'`.

When multiple, sequential path segment separation characters are found (e.g. `/` on POSIX and either ``\` or``/`on Windows), they are replaced by a single
instance of the platform specific path segment separator (`/`on POSIX and`\` on Windows). I separatori finali vengono conservati.

Se il `path` è una stringa di lunghezza zero, viene restituito `'.'`, che rappresenta la directory di lavoro corrente.

Ad esempio su POSIX:

```js
path.normalize('/foo/bar//baz/asdf/quux/..');
// Restituisce: '/foo/bar/baz/asdf'
```

Su Windows:

```js
path.normalize('C:\\temp\\\\foo\\bar\\..\\');
// Restituisce: 'C:\\temp\\foo\\'
```

Poiché Windows riconosce più separatori di percorso, entrambi i separatori verranno sostituiti da istanze del separatore preferito di Windows (`\`):

```js
path.win32.normalize('C:////temp\\\\/\\/\\/foo/bar');
// Restituisce: 'C:\\temp\\foo\\bar'
```

Un [`TypeError`] [] viene lanciato se `path` non è una stringa.

## path.parse(path)
<!-- YAML
added: v0.11.15
-->

* `path` {string}
* Restituisce: {Object}

Il metodo `path.parse()` restituisce un object le cui proprietà rappresentano elementi significativi del `path`. I separatori di directory finali vengono ignorati, vedere [`path.sep`][].

L'object restituito avrà le seguenti proprietà:

* `dir` {string}
* `root` {string}
* `base` {string}
* `name` {string}
* `ext` {string}

Ad esempio su POSIX:

```js
path.parse('/home/user/dir/file.txt');
// Restituisce:
// { root: '/',
//   dir: '/home/user/dir',
//   base: 'file.txt',
//   ext: '.txt',
//   name: 'file' }
```

```text
┌─────────────────────┬────────────┐
│          dir        │    base    │
├──────┬              ├──────┬─────┤
│ root │              │ name │ ext │
"  /    home/user/dir / file  .txt "
└──────┴──────────────┴──────┴─────┘
(tutti gli spazi nella linea "" devono essere ignorati - sono esclusivamente per la formattazione)
```

Su Windows:

```js
path.parse('C:\\path\\dir\\file.txt');
// Restituisce:
// { root: 'C:\\',
//   dir: 'C:\\path\\dir',
//   base: 'file.txt',
//   ext: '.txt',
//   name: 'file' }
```

```text
┌─────────────────────┬────────────┐
│          dir        │    base    │
├──────┬              ├──────┬─────┤
│ root │              │ name │ ext │
" C:\      path\dir   \ file  .txt "
└──────┴──────────────┴──────┴─────┘
(tutti gli spazi nella linea "" devono essere ignorati - sono esclusivamente per la formattazione)
```

Un [`TypeError`] [] viene lanciato se `path` non è una stringa.

## path.posix
<!-- YAML
added: v0.11.15
-->

* {Object}

La proprietà `path.posix` fornisce l'accesso alle implementazioni specifiche POSIX dei metodi del `path`.

## path.relative (da, a)
<!-- YAML
added: v0.5.0
changes:
  - version: v6.8.0
    pr-url: https://github.com/nodejs/node/pull/8523
    description: On Windows, the leading slashes for UNC paths are now included
                 in the return value.
-->

* `from` {string}
* `to` {string}
* Restituisce: {string}

Il metodo `path.relative()` restituisce il relative path da `from` a `to` in base alla directory di lavoro corrente. Se entrambi `from` e `to` pongono rimedio allo stesso percorso (dopo aver chiamato `path.resolve()` su ciascuno), una stringa di lunghezza zero viene restituita.

Se una stringa di lunghezza zero viene passata come `from` o `to`, verrà utilizzata la directory di lavoro corrente anziché le stringhe di lunghezza zero.

Ad esempio su POSIX:

```js
path.relative('/data/orandea/test/aaa', '/data/orandea/impl/bbb');
// Restituisce: '../../impl/bbb'
```

Su Windows:

```js
path.relative('C:\\orandea\\test\\aaa', 'C:\\orandea\\impl\\bbb');
// Restituisce: '..\\..\\impl\\bbb'
```

Un [`TypeError`][] viene lanciato se `from` o `to` non è una stringa.

## path.resolve([...paths])
<!-- YAML
added: v0.3.4
-->

* `...paths` {string} Una sequenza di percorsi o segmenti di percorso
* Restituisce: {string}

Il metodo`path.resolve()` risolve una sequenza di percorsi o segmenti di percorso in un absolute path.

La sequenza di percorsi data viene elaborata da destra a sinistra, con ogni successivo `path` anteposto fino a quando viene creato un absolute path. Ad esempio, data la sequenza di segmenti di percorso: `/foo`,`/bar`,`baz`, chiamare `path.resolve('/foo', '/bar', 'baz')` restituirebbe `/bar/baz`.

Se dopo aver elaborato tutti i segmenti del `path` indicati, non è stato ancora generato un absolute path, viene utilizzata la directory di lavoro corrente.

Il percorso risultante viene normalizzato e le barre finali vengono rimosse a meno che il percorso non venga risolto nella directory principale.

I segmenti di lunghezza zero `path` vengono ignorati.

Se non vengono passati segmenti del `path`, ` path.resolve()` restituirà l'absolute path della directory di lavoro corrente.

Per esempio:

```js
path.resolve('/foo/bar', './baz');
// Restituisce: '/foo/bar/baz'

path.resolve('/foo/bar', '/tmp/file/');
// Restituisce: '/tmp/file'

path.resolve('wwwroot', 'static_files/png/', '../gif/image.gif');
// se la directory di lavoro corrente è /home/myself/node,
// questo restituisce'/home/myself/node/wwwroot/static_files/gif/image.gif'
```

Un [`TypeError`][] viene lanciato se uno degli argomenti non è una stringa.

## path.sep
<!-- YAML
added: v0.7.9
-->

* {string}

Fornisce il separatore del segmento del percorso specifico della piattaforma:

* `\` su Windows
* `/` su POSIX

Ad esempio su POSIX:

```js
'foo/bar/baz'.split(path.sep);
// Restituisce: ['foo', 'bar', 'baz']
```

Su Windows:

```js
'foo\\bar\\baz'.split(path.sep);
// Restituisce: ['foo', 'bar', 'baz']
```

*Note*: On Windows, both the forward slash (`/`) and backward slash (``\`) are
accepted as path segment separators; however, the``path`methods only add
backward slashes (`\`).

## path.win32
<!-- YAML
added: v0.11.15
-->

* {Object}

La proprietà `path.win32` fornisce l'accesso alle implementazioni specifiche di Windows dei metodi del `path`.
