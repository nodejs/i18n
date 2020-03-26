# SO

<!--introduced_in=v0.10.0-->

> Stabilità: 2 - Stable

Il modulo `os` fornisce un numero di metodi di utilità relativi al sistema operativo. Ci si può accedere utilizzando:

```js
const os = require('os');
```

## os.EOL
<!-- YAML
added: v0.7.8
-->

* {string}

Una costante di stringa che definisce il marker di fine riga specifico del sistema operativo:

* `\n` su POSIX
* `\r\n` su Windows

## os.arch()
<!-- YAML
added: v0.5.0
-->

* Restituisce: {string}

Il metodo `os.arch()` restituisce una stringa che identifica l'architettura della CPU del sistema operativo per la quale è stato compilato il binario Node.js.

I possibili valori correnti sono: `'arm'`, `'arm64'`, `'ia32'`, `'mips'`, `'mipsel'`, `'ppc'`, `'ppc64'`, `'s390'`, `'s390x'`, `'x32'` e `'x64'`.

Equivalente a [`process.arch`][].

## os.constants
<!-- YAML
added: v6.3.0
-->

* {Object}

Restituisce un object contenente costanti specifiche del sistema operativo comunemente utilizzate per i codici di errore, segnali di processo e così via. Le costanti specifiche attualmente definite sono descritte nelle [OS Costants](#os_os_constants_1).

## os.cpus()
<!-- YAML
added: v0.3.3
-->

* Restituisce: {Array}

Il metodo `os.cpus()` restituisce un array degli object contenenti informazioni riguardo a ciascun core della CPU logica.

Le proprietà incluse in ogni oggetto includono:

* `model` {string}
* `speed` {number} (in MHz)
* `times` {Object}
  * `user` {number} Il numero di millisecondi che la CPU ha speso in modalità utente.
  * `nice` {number} Il numero di millisecondi che la CPU ha speso nella modalità nice.
  * `sys` {number} Il numero di millisecondi che la CPU ha speso nella modalità sys.
  * `idle` {number} Il numero di millisecondi che la CPU ha speso nella modalità idle.
  * `irq` {number} Il numero di millisecondi che la CPU ha speso nella modalità irq.

Per esempio:
```js
[
  {
    model: 'Intel(R) Core(TM) i7 CPU         860  @ 2.80GHz',
    speed: 2926,
    times: {
      user: 252020,
      nice: 0,
      sys: 30340,
      idle: 1070356870,
      irq: 0
    }
  },
  {
    model: 'Intel(R) Core(TM) i7 CPU         860  @ 2.80GHz',
    speed: 2926,
    times: {
      user: 306960,
      nice: 0,
      sys: 26980,
      idle: 1071569080,
      irq: 0
    }
  },
  {
    model: 'Intel(R) Core(TM) i7 CPU         860  @ 2.80GHz',
    speed: 2926,
    times: {
      user: 248450,
      nice: 0,
      sys: 21750,
      idle: 1070919370,
      irq: 0
    }
  },
  {
    model: 'Intel(R) Core(TM) i7 CPU         860  @ 2.80GHz',
    speed: 2926,
    times: {
      user: 256880,
      nice: 0,
      sys: 19430,
      idle: 1070905480,
      irq: 20
    }
  },
  {
    model: 'Intel(R) Core(TM) i7 CPU         860  @ 2.80GHz',
    speed: 2926,
    times: {
      user: 511580,
      nice: 20,
      sys: 40900,
      idle: 1070842510,
      irq: 0
    }
  },
  {
    model: 'Intel(R) Core(TM) i7 CPU         860  @ 2.80GHz',
    speed: 2926,
    times: {
      user: 291660,
      nice: 0,
      sys: 34360,
      idle: 1070888000,
      irq: 10
    }
  },
  {
    model: 'Intel(R) Core(TM) i7 CPU         860  @ 2.80GHz',
    speed: 2926,
    times: {
      user: 308260,
      nice: 0,
      sys: 55410,
      idle: 1071129970,
      irq: 880
    }
  },
  {
    model: 'Intel(R) Core(TM) i7 CPU         860  @ 2.80GHz',
    speed: 2926,
    times: {
      user: 266450,
      nice: 1480,
      sys: 34920,
      idle: 1072572010,
      irq: 30
    }
  }
]
```

*Note*: Because `nice` values are UNIX-specific, on Windows the `nice` values of all processors are always 0.

## os.endianness()<!-- YAML
added: v0.9.4
-->* Restituisce: {string}

Il metodo`os.endianness()` restituisce una stringa che identifica l'endianness (l'ordine dei byte) della CPU *per la quale il binario Node.js è stato compilato*.

I valori possibili sono:

* `'BE'` per big endian
* `'LE'` per little endian.

## os.freemem()<!-- YAML
added: v0.3.3
-->* Restituisce: {integer}

Il metodo `os.freemem()` restituisce la quantità di memoria di sistema libera in byte come un numero intero.

## os.homedir()<!-- YAML
added: v2.3.0
-->* Restituisce: {string}

Il metodo `os.homedir()` restituisce la directory home dell'utente corrente come una stringa.

## os.hostname()<!-- YAML
added: v0.3.3
-->* Restituisce: {string}

Il metodo `os.hostname()` restituisce l'hostname del sistema operativo come una stringa.

## os.loadavg()
<!-- YAML
added: v0.3.3
-->

* Restituisce: {Array}

Il metodo `os.loadavg()` restituisce un array contenente le medie di caricamento di 1, 5 e 15 minuti.

La media di caricamento è una misura dell'attività del sistema, calcolata dal sistema operativo ed espressa come un numero frazionario. Come regola generale, la media di caricamento dovrebbe idealmente essere inferiore al numero di CPU logiche nel sistema.

La media del caricamento è un concetto specifico UNIX con nessun equivalente reale sulle piattaforme Windows. Su Windows, il valore di ritorno è sempre `[0, 0, 0]`.

## os.networkInterfaces()<!-- YAML
added: v0.6.0
-->* Restituisce: {Object}

Il metodo `os.networkInterfaces()` restituisce un object contenente solo le interfacce di rete a cui è stato assegnato un indirizzo di rete.

Ogni chiave sull'oggetto restituito identifica un'interfaccia di rete. Il valore associato è un array degli object che descrivono, ognuno, un indirizzo di rete assegnato.

Le proprietà disponibili sull'object dell'indirizzo di rete assegnato includono:

* `address` {string} L'indirizzo IPv4 o IPv6 assegnato
* `netmask` {string} La maschera di rete IPv4 o IPv6
* `family` {string} O `IPv4` oppure `IPv6`
* `mac` {string} L'indirizzo MAC dell'interfaccia di rete
* `internal` {boolean} `true` se l'interfaccia di rete è un loopback o un'interfaccia simile che non è accessibile da remoto; altrimenti`false`
* `scopeid` {number} L'ID di scope IPv6 numerico (specificato solo quando`family` è `IPv6`)
* `cidr` {string} L'indirizzo IPv4 o IPv6 assegnato con il prefisso di routing nella notazione CIDR. Se la `netmask` non è valida, questa proprietà è impostata su `null`
```js
{
  lo: [
    {
      address: '127.0.0.1',
      netmask: '255.0.0.0',
      family: 'IPv4',
      mac: '00:00:00:00:00:00',
      internal: true,
      cidr: '127.0.0.1/8'
    },
    {
      address: '::1',
      netmask: 'ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff',
      family: 'IPv6',
      mac: '00:00:00:00:00:00',
      internal: true,
      cidr: '::1/128'
    }
  ],
  eth0: [
    {
      address: '192.168.1.108',
      netmask: '255.255.255.0',
      family: 'IPv4',
      mac: '01:02:03:0a:0b:0c',
      internal: false,
      cidr: '192.168.1.108/24'
    },
    {
      address: 'fe80::a00:27ff:fe4e:66a1',
      netmask: 'ffff:ffff:ffff:ffff::',
      family: 'IPv6',
      mac: '01:02:03:0a:0b:0c',
      internal: false,
      cidr: 'fe80::a00:27ff:fe4e:66a1/64'
    }
  ]
}
```

## os.platform()<!-- YAML
added: v0.5.0
-->* Restituisce: {string}

Il metodo `os.platform()` restituisce una stringa che identifica la piattaforma del sistema operativo impostata durante il tempo di compilazione di Node.js.

I valori attualmente possibili sono:

* `'aix'`
* `'darwin'`
* `'freebsd'`
* `'linux'`
* `'openbsd'`
* `'sunos'`
* `'win32'`

Equivalente a [`process.platform`][].

*Note*: The value `'android'` may also be returned if the Node.js is built on the Android operating system. Tuttavia, al momento, il supporto Android in Node.js è considerato [come sperimentale](https://github.com/nodejs/node/blob/master/BUILDING.md#androidandroid-based-devices-eg-firefox-os).

## os.release()<!-- YAML
added: v0.3.3
-->* Restituisce: {string}

Il metodo `os.release()` restituisce una stringa che identifica la versione del sistema operativo.

*Note*: On POSIX systems, the operating system release is determined by calling [uname(3)](https://linux.die.net/man/3/uname). Su Windows, viene utilizzata `GetVersionExW()`. Si prega di consultare https://en.wikipedia.org/wiki/Uname#Examples per ulteriori informazioni.

## os.tmpdir()<!-- YAML
added: v0.9.9
changes:
  - version: v2.0.0
    pr-url: https://github.com/nodejs/node/pull/747
    description: This function is now cross-platform consistent and no longer
                 returns a path with a trailing slash on any platform
-->* Restituisce: {string}

Il metodo `os.tmpdir()` restituisce una stringa che specifica la directory predefinita del sistema operativo per i file temporanei.

## os.totalmem()
<!-- YAML
added: v0.3.3
-->

* Restituisce: {integer}

Il metodo `os.totalmem()` restituisce la quantità totale di memoria di sistema in byte come un numero intero.

## os.type()<!-- YAML
added: v0.3.3
-->* Restituisce: {string}

Il metodo `os.type()` restituisce una stringa che identifica il nome del sistema operativo restituito da [uname(3)](https://linux.die.net/man/3/uname). Per esempio su linux `'Linux'`, su macOS `'Darwin'` e su Windows `'Windows_NT'`.

Si prega di consultare https://en.wikipedia.org/wiki/Uname#Examples per ulteriori informazioni sull'output dell'esecuzione di [uname(3)](https://linux.die.net/man/3/uname) su vari sistemi operativi.

## os.uptime()
<!-- YAML
added: v0.3.3
-->

* Restituisce: {integer}

Il metodo `os.uptime()` restituisce il tempo di attività del sistema in un numero di secondi.

*Note*: On Windows the returned value includes fractions of a second. Use `Math.floor()` to get whole seconds.

## os.userInfo([options])<!-- YAML
added: v6.0.0
-->* `options` {Object}
  * `encoding` {string} Codifica dei caratteri utilizzata per interpretare le stringhe risultanti. Se l'`encoding` è impostato su `'buffer'`, i valori `username`, `shell` e `homedir` diverranno istanze del `Buffer`. **Default:** `'utf8'`.
* Restituisce: {Object}

Il metodo `os.userInfo()` restituisce informazioni sull'utente attualmente efficace - sulle piattaforme POSIX, questo è solitamente un sottoinsieme del file delle password. L'oggetto restituito include `username`, `uid`, `gid`, `shell` e `homedir`. Su Windows, i campi `uid` e `gid` sono `-1` e `shell` è `null`.

Il valore di `homedir` restituito da `os.userInfo()` è fornito dal sistema operativo. Questo differisce dal risultato di `os.homedir()`, il quale esegue il query di diverse variabili d'ambiente per la home directory prima di ritornare alla risposta del sistema operativo.

## Constanti del SO

Le seguenti costante vengono esportate da `os.constants`.

*Note*: Not all constants will be available on every operating system.

### Costanti di Segnale<!-- YAML
changes:
  - version: v5.11.0
    pr-url: https://github.com/nodejs/node/pull/6093
    description: Added support for `SIGINFO`.
-->Le seguenti costanti di segnale vengono esportate da `os.constants.signals`:

<table>
  <tr>
    <th>Costante</th>
    <th>Descrizione</th>
  </tr>
  <tr>
    <td><code>SIGHUP</code></td>
    <td>Inviato per segnalare quando un terminale di controllo è chiuso o un parent    process si chiude.</td>
  </tr>
  <tr>
    <td><code>SIGINT</code></td>
    <td>Inviato per segnalare quando un utente desidera interrompere un processo    (`(Ctrl + C)`).</td>
  </tr>
  <tr>
    <td><code>SIGQUIT</code></td>
    <td>Inviato per segnalare quando un utente desidera terminare un processo ed eseguire un    core dump.</td>
  </tr>
  <tr>
    <td><code>SIGILL</code></td>
    <td>Inviato a un processo per notificare che si è tentato di eseguire un'istruzione illegale, non corretta, sconosciuta o privilegiata.</td>
  </tr>
  <tr>
    <td><code>SIGTRAP</code></td>
    <td>Inviato a un processo quando si è verificata un'eccezione.</td>
  </tr>
  <tr>
    <td><code>SIGABRT</code></td>
    <td>Inviato a un processo per richiedere l'annullamento.</td>
  </tr>
  <tr>
    <td><code>SIGIOT</code></td>
    <td>Sinonimo per <code>SIGABRT</code></td>
  </tr>
  <tr>
    <td><code>SIGBUS</code></td>
    <td>Inviato a un processo per notificare che ha causato un errore del bus.</td>
  </tr>
  <tr>
    <td><code>SIGFPE</code></td>
    <td>Inviato a un processo per notificare che ha eseguito     un'operazione aritmetica non consentita.</td>
  </tr>
  <tr>
    <td><code>SIGKILL</code></td>
    <td>Inviato a un processo per terminarlo immediatamente.</td>
  </tr>
  <tr>
    <td><code>SIGUSR1</code> <code>SIGUSR2</code></td>
    <td>Inviato a un processo per identificare le condizioni definite dall'utente.</td>
  </tr>
  <tr>
    <td><code>SIGSEGV</code></td>
    <td>Inviato a un processo per notificare un errore di segmentazione.</td>
  </tr>
  <tr>
    <td><code>SIGPIPE</code></td>
    <td>Inviato a un processo quando ha tentato di scrivere su una pipe    disconnessa.</td>
  </tr>
  <tr>
    <td><code>SIGALRM</code></td>
    <td>Inviato a un processo quando trascorre un timer di sistema.</td>
  </tr>
  <tr>
    <td><code>SIGTERM</code></td>
    <td>Inviato a un processo per richiedere la cessazione.</td>
  </tr>
  <tr>
    <td><code>SIGCHLD</code></td>
    <td>Inviato a un processo quando termina un child process.</td>
  </tr>
  <tr>
    <td><code>SIGSTKFLT</code></td>
    <td>Inviato a un processo per segnalare un errore di stack su un coprocessore.</td>
  </tr>
  <tr>
    <td><code>SIGCONT</code></td>
    <td>Inviato per dare istruzioni al sistema operativo di continuare un processo in sospeso.</td>
  </tr>
  <tr>
    <td><code>SIGSTOP</code></td>
    <td>Inviato per dare istruzioni al sistema operativo di interrompere un processo.</td>
  </tr>
  <tr>
    <td><code>SIGTSTP</code></td>
    <td>Inviato a un processo per richiedergli di fermarsi.</td>
  </tr>
  <tr>
    <td><code>SIGBREAK</code></td>
    <td>Inviato per indicare quando un utente desidera interrompere un processo.</td>
  </tr>
  <tr>
    <td><code>SIGTTIN</code></td>
    <td>Inviato a un processo quando legge dal TTY mentre è in    background.</td>
  </tr>
  <tr>
    <td><code>SIGTTOU</code></td>
    <td>Inviato a un processo quando scrive sulla TTY mentre è in    background.</td>
  </tr>
  <tr>
    <td><code>SIGURG</code></td>
    <td>Inviato a un processo quando un socket ha dati urgenti da leggere.</td>
  </tr>
  <tr>
    <td><code>SIGXCPU</code></td>
    <td>Inviato a un processo quando ha superato il limite di utilizzo della CPU.</td>
  </tr>
  <tr>
    <td><code>SIGXFSZ</code></td>
    <td>Inviato a un processo quando cresce un file più grande del massimo    consentito.</td>
  </tr>
  <tr>
    <td><code>SIGVTALRM</code></td>
    <td>Inviato a un processo quando è trascorso un timer virtuale.</td>
  </tr>
  <tr>
    <td><code>SIGPROF</code></td>
    <td>Inviato a un processo quando è trascorso un timer di sistema.</td>
  </tr>
  <tr>
    <td><code>SIGWINCH</code></td>
    <td>Inviato a un processo quando il terminale di controllo ha cambiato le sue dimensioni.</td>
  </tr>
  <tr>
    <td><code>SIGIO</code></td>
    <td>Inviato a un processo quando I/O è disponibile.</td>
  </tr>
  <tr>
    <td><code>SIGPOLL</code></td>
    <td>Sinonimo per <code>SIGIO</code></td>
  </tr>
  <tr>
    <td><code>SIGLOST</code></td>
    <td>Inviato a un processo quando un file lock è stato perso.</td>
  </tr>
  <tr>
    <td><code>SIGPWR</code></td>
    <td>Inviato a un processo per notificare l'interruzione di corrente.</td>
  </tr>
  <tr>
    <td><code>SIGINFO</code></td>
    <td>Sinonimo per <code>SIGPWR</code></td>
  </tr>
  <tr>
    <td><code>SIGSYS</code></td>
    <td>Inviato a un processo per notificare un argomento non valido.</td>
  </tr>
  <tr>
    <td><code>SIGUNUSED</code></td>
    <td>Sinonimo per <code>SIGSYS</code></td>
  </tr>
</table>

### Costanti di Errore

Le seguenti costanti di errore vengono esportate da `os.constants.errno`:

#### Costanti di errore POSIX

<table>
  <tr>
    <th>Costante</th>
    <th>Descrizione</th>
  </tr>
  <tr>
    <td><code>E2BIG</code></td>
    <td>Indica che l'elenco degli argomenti è più lungo del previsto.</td>
  </tr>
  <tr>
    <td><code>EACCES</code></td>
    <td>Indica che l'operazione non ha avuto permessi sufficienti.</td>
  </tr>
  <tr>
    <td><code>EADDRINUSE</code></td>
    <td>Indica che l'indirizzo di rete è già in uso.</td>
  </tr>
  <tr>
    <td><code>EADDRNOTAVAIL</code></td>
    <td>Indica che l'indirizzo di rete non è al momento disponibile per    l'uso.</td>
  </tr>
  <tr>
    <td><code>EAFNOSUPPORT</code></td>
    <td>Indica che la famiglia di indirizzi di rete non è supportata.</td>
  </tr>
  <tr>
    <td><code>EAGAIN</code></td>
    <td>Indica che al momento non ci sono dati disponibili e di riprovare     l'operazione più tardi.</td>
  </tr>
  <tr>
    <td><code>EALREADY</code></td>
    <td>Indica che il socket ha già una connessione in sospeso    in corso.</td>
  </tr>
  <tr>
    <td><code>EBADF</code></td>
    <td>Indica che un file descriptor non è valido.</td>
  </tr>
  <tr>
    <td><code>EBADMSG</code></td>
    <td>Indica un messaggio di dati non valido.</td>
  </tr>
  <tr>
    <td><code>EBUSY</code></td>
    <td>Indica che un dispositivo o una risorsa sono occupati.</td>
  </tr>
  <tr>
    <td><code>ECANCELED</code></td>
    <td>Indica che un operazione è stata annullata.</td>
  </tr>
  <tr>
    <td><code>ECHILD</code></td>
    <td>Indica che non ci sono child process.</td>
  </tr>
  <tr>
    <td><code>ECONNABORTED</code></td>
    <td>Indica che la connessione di rete è stata interrotta.</td>
  </tr>
  <tr>
    <td><code>ECONNREFUSED</code></td>
    <td>Indica che la connessione di rete è stata rifiutata.</td>
  </tr>
  <tr>
    <td><code>ECONNRESET</code></td>
    <td>Indica che la connessione di rete è stata ripristinata.</td>
  </tr>
  <tr>
    <td><code>EDEADLK</code></td>
    <td>Indica che è stato evitato un deadlock delle risorse.</td>
  </tr>
  <tr>
    <td><code>EDESTADDRREQ</code></td>
    <td>Indica che è richiesto un indirizzo di destinazione.</td>
  </tr>
  <tr>
    <td><code>EDOM</code></td>
    <td>Indica che un argomento è fuori dal dominio della funzione.</td>
  </tr>
  <tr>
    <td><code>EDQUOT</code></td>
    <td>Indica che la quota del disco è stata superata.</td>
  </tr>
  <tr>
    <td><code>EEXIST</code></td>
    <td>Indica che il file esiste già.</td>
  </tr>
  <tr>
    <td><code>EFAULT</code></td>
    <td>Indica un indirizzo del puntatore non valido.</td>
  </tr>
  <tr>
    <td><code>EFBIG</code></td>
    <td>Indica che il file è troppo grande.</td>
  </tr>
  <tr>
    <td><code>EHOSTUNREACH</code></td>
    <td>Indica che l'host non è raggiungibile.</td>
  </tr>
  <tr>
    <td><code>EIDRM</code></td>
    <td>Indica che l'identifier è stato rimosso.</td>
  </tr>
  <tr>
    <td><code>EIDRM</code></td>
    <td>Indica una sequenza di byte non valida.</td>
  </tr>
  <tr>
    <td><code>EINPROGRESS</code></td>
    <td>Indica che un'operazione è già in corso.</td>
  </tr>
  <tr>
    <td><code>EINTR</code></td>
    <td>Indica che una chiamata di funzione è stata interrotta.</td>
  </tr>
  <tr>
    <td><code>EINVAL</code></td>
    <td>Indica che è stato fornito un argomento non valido.</td>
  </tr>
  <tr>
    <td><code>EIO</code></td>
    <td>Indica un errore di I/O altrimenti non specificato.</td>
  </tr>
  <tr>
    <td><code>EISCONN</code></td>
    <td>Indica che il socket è connesso.</td>
  </tr>
  <tr>
    <td><code>EISDIR</code></td>
    <td>Indica che il percorso è una directory.</td>
  </tr>
  <tr>
    <td><code>ELOOP</code></td>
    <td>Indica troppi livelli di collegamenti simbolici in un percorso.</td>
  </tr>
  <tr>
    <td><code>EMFILE</code></td>
    <td>Indica che ci sono troppi file aperti.</td>
  </tr>
  <tr>
    <td><code>EMLINK</code></td>
    <td>Indica che ci sono troppi collegamenti fisici a un file.</td>
  </tr>
  <tr>
    <td><code>EMSGSIZE</code></td>
    <td>Indica che il messaggio fornito è troppo lungo.</td>
  </tr>
  <tr>
    <td><code>EMULTIHOP</code></td>
    <td>Indica che è stato tentato un multihop.</td>
  </tr>
  <tr>
    <td><code>ENAMETOOLONG</code></td>
    <td>Indica che il filename è troppo grande.</td>
  </tr>
  <tr>
    <td><code>ENETDOWN</code></td>
    <td>Indica che la rete è inattiva.</td>
  </tr>
  <tr>
    <td><code>ENETRESET</code></td>
    <td>Indica che la connessione è stata interrotta dalla rete.</td>
  </tr>
  <tr>
    <td><code>ENETUNREACH</code></td>
    <td>Indica che la rete non è raggiungibile.</td>
  </tr>
  <tr>
    <td><code>ENFILE</code></td>
    <td>Indica troppi file aperti nel sistema.</td>
  </tr>
  <tr>
    <td><code>ENOBUFS</code></td>
    <td>Indica che lo spazio sul buffer non è disponibile.</td>
  </tr>
  <tr>
    <td><code>ENODATA</code></td>
    <td>Indica che nessun messaggio è disponibile sulla coda    di lettura dello stream head.</td>
  </tr>
  <tr>
    <td><code>ENODEV</code></td>
    <td>Indica che non esiste un dispositivo del genere.</td>
  </tr>
  <tr>
    <td><code>ENOENT</code></td>
    <td>Indica che non esiste tale file o directory.</td>
  </tr>
  <tr>
    <td><code>ENOEXEC</code></td>
    <td>Indica un errore di formato exec.</td>
  </tr>
  <tr>
    <td><code>ENOLCK</code></td>
    <td>Indica che non ci sono blocchi disponibili.</td>
  </tr>
  <tr>
    <td><code>ENOLINK</code></td>
    <td>Indicazione che un collegamento è stato interrotto.</td>
  </tr>
  <tr>
    <td><code>ENOMEM</code></td>
    <td>Indica che non c'è abbastanza spazio.</td>
  </tr>
  <tr>
    <td><code>ENOMSG</code></td>
    <td>Indica che non vi è alcun messaggio del tipo desiderato.</td>
  </tr>
  <tr>
    <td><code>ENOPROTOOPT</code></td>
    <td>Indica che un determinato protocollo non è disponibile.</td>
  </tr>
  <tr>
    <td><code>ENOSPC</code></td>
    <td>Indica che non c'è spazio disponibile sul dispositivo.</td>
  </tr>
  <tr>
    <td><code>ENOSR</code></td>
    <td>Indica che non ci sono risorse di streaming disponibili.</td>
  </tr>
  <tr>
    <td><code>ENOSTR</code></td>
    <td>Indica che una determinata risorsa non è uno stream.</td>
  </tr>
  <tr>
    <td><code>ENOSYS</code></td>
    <td>Indica che una funzione non è stata implementata.</td>
  </tr>
  <tr>
    <td><code>ENOTCONN</code></td>
    <td>Indica che il socket non è connesso.</td>
  </tr>
  <tr>
    <td><code>ENOTDIR</code></td>
    <td>Indica che il percorso non è una directory.</td>
  </tr>
  <tr>
    <td><code>ENOTEMPTY</code></td>
    <td>Indica che la directory non è vuota.</td>
  </tr>
  <tr>
    <td><code>ENOTSOCK</code></td>
    <td>Indica che l'elemento considerato non è un socket.</td>
  </tr>
  <tr>
    <td><code>ENOTSUP</code></td>
    <td>Indica che una determinata operazione non è supportata.</td>
  </tr>
  <tr>
    <td><code>ENOTTY</code></td>
    <td>Indica un'operazione di controllo I/O inappropriata.</td>
  </tr>
  <tr>
    <td><code>ENXIO</code></td>
    <td>Indica che non vi è alcun dispositivo o indirizzo di questo tipo.</td>
  </tr>
  <tr>
    <td><code>EOPNOTSUPP</code></td>
    <td>Indica che un'operazione non è supportata sul socket.
    Ricorda che mentre `ENOTSUP` e` EOPNOTSUPP` hanno lo stesso valore su Linux,    secondo POSIX.1 questi valori di errore dovrebbero essere distinti.)</td>
  </tr>
  <tr>
    <td><code>EOVERFLOW</code></td>
    <td>Indica che un valore è troppo grande per essere memorizzato in un   tipo di dati fornito.</td>
  </tr>
  <tr>
    <td><code>EPERM</code></td>
    <td>Indica che l'operazione non è consentita.</td>
  </tr>
  <tr>
    <td><code>EPIPE</code></td>
    <td>Indica una pipe danneggiata.</td>
  </tr>
  <tr>
    <td><code>EPROTO</code></td>
    <td>Indica un errore di protocollo.</td>
  </tr>
  <tr>
    <td><code>EPROTONOSUPPORT</code></td>
    <td>Indica che un protocollo non è supportato.</td>
  </tr>
  <tr>
    <td><code>EPROTOTYPE</code></td>
    <td>Indica il tipo sbagliato di protocollo per un socket.</td>
  </tr>
  <tr>
    <td><code>ERANGE</code></td>
    <td>Indica che i risultati sono troppo grandi.</td>
  </tr>
  <tr>
    <td><code>EROFS</code></td>
    <td>Indica che il file system è di sola lettura.</td>
  </tr>
  <tr>
    <td><code>ESPIPE</code></td>
    <td>Indica un'operazione di ricerca non valida.</td>
  </tr>
  <tr>
    <td><code>ESRCH</code></td>
    <td>Indica che non esiste un processo simile.</td>
  </tr>
  <tr>
    <td><code>ESTALE</code></td>
    <td>Indica che il file handle è obsoleto.</td>
  </tr>
  <tr>
    <td><code>ETIME</code></td>
    <td>Indica un timer scaduto.</td>
  </tr>
  <tr>
    <td><code>ETIMEDOUT</code></td>
    <td>Indica che la connessione è scaduta.</td>
  </tr>
  <tr>
    <td><code>ETXTBSY</code></td>
    <td>Indica che un file di testo è occupato.</td>
  </tr>
  <tr>
    <td><code>EWOULDBLOCK</code></td>
    <td>Indica che l'operazione si bloccherebbe.</td>
  </tr>
  <tr>
    <td><code>EXDEV</code></td>
    <td>Indica un collegamento improprio.
  </tr>
</table>

#### Costanti di Errore Specifico di Windows

I seguenti codici di errore sono specifici per il sistema operativo Windows:

<table>
  <tr>
    <th>Costante</th>
    <th>Descrizione</th>
  </tr>
  <tr>
    <td><code>WSAEINTR</code></td>
    <td>Indica un chiamata di funzione interrotta.</td>
  </tr>
  <tr>
    <td><code>WSAEBADF</code></td>
    <td>Indica un file handle non valido.</td>
  </tr>
  <tr>
    <td><code>WSAEACCES</code></td>
    <td>Indica la mancanza di autorizzazioni sufficienti per completare l'operazione.</td>
  </tr>
  <tr>
    <td><code>WSAEFAULT</code></td>
    <td>Indica un indirizzo del puntatore non valido.</td>
  </tr>
  <tr>
    <td><code>WSAEINVAL</code></td>
    <td>Indica che è stato trasmesso un argomento non valido.</td>
  </tr>
  <tr>
    <td><code>WSAEMFILE</code></td>
    <td>Indica che ci sono troppi file aperti.</td>
  </tr>
  <tr>
    <td><code>WSAEWOULDBLOCK</code></td>
    <td>Indica che una risorsa è temporaneamente non disponibile.</td>
  </tr>
  <tr>
    <td><code>WSAEINPROGRESS</code></td>
    <td>Indica che un'operazione è attualmente in corso.</td>
  </tr>
  <tr>
    <td><code>WSAEALREADY</code></td>
    <td>Indica che un'operazione è già in corso.</td>
  </tr>
  <tr>
    <td><code>WSAENOTSOCK</code></td>
    <td>Indica che la risorsa non è un socket.</td>
  </tr>
  <tr>
    <td><code>WSAEDESTADDRREQ</code></td>
    <td>Indica che è richiesto un indirizzo di destinazione.</td>
  </tr>
  <tr>
    <td><code>WSAEDESTADDRREQ</code></td>
    <td>Indica che la dimensione del messaggio è troppo grande.</td>
  </tr>
  <tr>
    <td><code>WSAEPROTOTYPE</code></td>
    <td>Indica il tipo di protocollo errato per il socket.</td>
  </tr>
  <tr>
    <td><code>WSAENOPROTOOPT</code></td>
    <td>Indica un'opzione di protocollo errata.</td>
  </tr>
  <tr>
    <td><code>WSAEPROTONOSUPPORT</code></td>
    <td>Indica che il protocollo non è supportato.</td>
  </tr>
  <tr>
    <td><code>WSAESOCKTNOSUPPORT</code></td>
    <td>Indica che il tipo di socket non è supportato.</td>
  </tr>
  <tr>
    <td><code>WSAEOPNOTSUPP</code></td>
    <td>Indica che l'operazione non è supportata.</td>
  </tr>
  <tr>
    <td><code>WSAEPFNOSUPPORT</code></td>
    <td>Indica che il protocollo family non è supportato.</td>
  </tr>
  <tr>
    <td><code>WSAEAFNOSUPPORT</code></td>
    <td>Indica che la famiglia di indirizzi non è supportata.</td>
  </tr>
  <tr>
    <td><code>WSAEADDRINUSE</code></td>
    <td>Indica che l'indirizzo di rete è già in uso.</td>
  </tr>
  <tr>
    <td><code>WSAEADDRNOTAVAIL</code></td>
    <td>Indica che l'indirizzo di rete non è disponibile.</td>
  </tr>
  <tr>
    <td><code>WSAENETDOWN</code></td>
    <td>Indica che la rete è inattiva.</td>
  </tr>
  <tr>
    <td><code>WSAENETUNREACH</code></td>
    <td>Indica che la rete non è raggiungibile.</td>
  </tr>
  <tr>
    <td><code>WSAENETRESET</code></td>
    <td>Indica che la connessione di rete è stata ripristinata.</td>
  </tr>
  <tr>
    <td><code>WSAECONNABORTED</code></td>
    <td>Indica che la connessione è stata interrotta.</td>
  </tr>
  <tr>
    <td><code>WSAECONNRESET</code></td>
    <td>Indica che la connessione è stata ripristinata dal peer.</td>
  </tr>
  <tr>
    <td><code>WSAENOBUFS</code></td>
    <td>Indica che lo spazio sul buffer non è disponibile.</td>
  </tr>
  <tr>
    <td><code>WSAEISCONN</code></td>
    <td>Indica che il socket è già connesso.</td>
  </tr>
  <tr>
    <td><code>WSAENOTCONN</code></td>
    <td>Indica che il socket non è connesso.</td>
  </tr>
  <tr>
    <td><code>WSAESHUTDOWN</code></td>
    <td>Indica che i dati non possono essere inviati dopo che il socket è stato    spento.</td>
  </tr>
  <tr>
    <td><code>WSAETOOMANYREFS</code></td>
    <td>Indica che ci sono troppi riferimenti.</td>
  </tr>
  <tr>
    <td><code>WSAETIMEDOUT</code></td>
    <td>Indica che la connessione è scaduta.</td>
  </tr>
  <tr>
    <td><code>WSAECONNREFUSED</code></td>
    <td>Indica che la connessione è stata rifiutata.</td>
  </tr>
  <tr>
    <td><code>WSAELOOP</code></td>
    <td>Indica che un nome non può essere tradotto.</td>
  </tr>
  <tr>
    <td><code>WSAENAMETOOLONG</code></td>
    <td>Indica che il nome era troppo lungo.</td>
  </tr>
  <tr>
    <td><code>WSAEHOSTDOWN</code></td>
    <td>Indica che un host di rete è inattivo.</td>
  </tr>
  <tr>
    <td><code>WSAEHOSTUNREACH</code></td>
    <td>Indica che non esiste un collegamento ad un host di rete.</td>
  </tr>
  <tr>
    <td><code>WSAENOTEMPTY</code></td>
    <td>Indica che la directory non è vuota.</td>
  </tr>
  <tr>
    <td><code>WSAEPROCLIM</code></td>
    <td>Indica che ci sono troppi processi.</td>
  </tr>
  <tr>
    <td><code>WSAEUSERS</code></td>
    <td>Indica che la quota utente è stata superata.</td>
  </tr>
  <tr>
    <td><code>WSAEDQUOT</code></td>
    <td>Indica che la quota del disco è stata superata.</td>
  </tr>
  <tr>
    <td><code>WSAESTALE</code></td>
    <td>Indica un riferimento di un file handle obsoleto.</td>
  </tr>
  <tr>
    <td><code>WSAEREMOTE</code></td>
    <td>Indica che l'elemento è remoto.</td>
  </tr>
  <tr>
    <td><code>WSASYSNOTREADY</code></td>
    <td>Indica che il sottosistema di rete non è pronto.</td>
  </tr>
  <tr>
    <td><code>WSAVERNOTSUPPORTED</code></td>
    <td>Indicates that the winsock.dll version is out of range.</td>
  </tr>
  <tr>
    <td><code>WSANOTINITIALISED</code></td>
    <td>Indica che un WSAStartup di esito positivo non è stato ancora eseguito.</td>
  </tr>
  <tr>
    <td><code>WSAEDISCON</code></td>
    <td>Indica che è in corso l'esecuzione del graceful shoutdown.</td>
  </tr>
  <tr>
    <td><code>WSAENOMORE</code></td>
    <td>Indica che non ci sono ulteriori risultati.</td>
  </tr>
  <tr>
    <td><code>WSAECANCELLED</code></td>
    <td>Indica che un operazione è stata annullata.</td>
  </tr>
  <tr>
    <td><code>WSAEINVALIDPROCTABLE</code></td>
    <td>Indica che la tabella di procedura di chiamata non è valida.</td>
  </tr>
  <tr>
    <td><code>WSAEINVALIDPROVIDER</code></td>
    <td>Indica un service provider non valido.</td>
  </tr>
  <tr>
    <td><code>WSAEPROVIDERFAILEDINIT</code></td>
    <td>Indica che il service provider non è riuscito ad inizializzare.</td>
  </tr>
  <tr>
    <td><code>WSASYSCALLFAILURE</code></td>
    <td>Indica un errore di chiamata di sistema.</td>
  </tr>
  <tr>
    <td><code>WSASERVICE_NOT_FOUND</code></td>
    <td>Indica che un servizio non è stato trovato.</td>
  </tr>
  <tr>
    <td><code>WSATYPE_NOT_FOUND</code></td>
    <td>Indica che non è stato trovato un tipo di classe.</td>
  </tr>
  <tr>
    <td><code>WSA_E_NO_MORE</code></td>
    <td>Indica che non ci sono ulteriori risultati.</td>
  </tr>
  <tr>
    <td><code>WSA_E_CANCELLED</code></td>
    <td>Indica che la chiamata è stata annullata.</td>
  </tr>
  <tr>
    <td><code>WSAEREFUSED</code></td>
    <td>Indica che un database query è stata rifiutato.</td>
  </tr>
</table>

### Costanti libuv

<table>
  <tr>
    <th>Costante</th>
    <th>Descrizione</th>
  </tr>
  <tr>
    <td><code>UV_UDP_REUSEADDR</code></td>
    <td></td>
  </tr>
</table>

