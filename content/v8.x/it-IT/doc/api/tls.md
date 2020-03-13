# TLS (SSL)

<!--introduced_in=v0.10.0-->

> Stabilità: 2 - Stable

Il modulo `tls` fornisce un'implementazione dei protocolli Transport Layer Security (TLS) e Secure Socket Layer (SSL) che è costruita sulla base di OpenSSL. Si può accedere al modulo utilizzando:

```js
const tls = require('tls');
```

## Concetti TLS/SSL

Il TLS/SSL è un infrastruttura a chiave publica/privata (PKI). Per la maggior parte dei casi comuni, ogni client e server deve avere una *chiave privata*.

Le chiavi private possono essere generate in diversi modi. L'esempio seguente illustra l'utilizzo dell'interfaccia a riga di comando OpenSSL per generare una chiave privata RSA di 2048 bit:

```sh
openssl genrsa -out ryans-key.pem 2048
```

Con TLS/SSL, tutti i server (e alcuni client) devono avere un *certificate*. I certificati sono *chiavi pubbliche* che corrispondono a una chiave privata, e che sono firmate digitalmente da un Autorità di Certificazione o dal proprietario della chiave privata (tali certificati vengono chiamati "auto-firmati"). Il primo passo per ottenere un certificato è creare un *Certificate Signing Request* file (CSR).

L'interfaccia a riga di comando di OpenSSL può essere usata per generare un CSR per una chiave privata:

```sh
openssl req -new -sha256 -key ryans-key.pem -out ryans-csr.pem
```

Una volta che il file CSR è generato, può essere inviato a un Autorità di Certificazione per essere firmato oppure può essere utilizzato per generare un certificato auto-firmato.

La creazione di un certificato auto-firmato utilizzando l'interfaccia a riga di comando di OpenSSL viene illustrata nell'esempio seguente:

```sh
openssl x509 -req -in ryans-csr.pem -signkey ryans-key.pem -out ryans-cert.pem
```

Una volta che il certificato è stato generato, può essere utilizzato per generare un file `.pfx` o `.p12`:

```sh
openssl pkcs12 -export -in ryans-cert.pem -inkey ryans-key.pem \
      -certfile ca-cert.pem -out ryans.pfx
```

Dove:

* `in`: è il certificato firmato
* `inkey`: è la chiave privata associata
* `certfile`: è una concatenazione di tutte le Autorità di Certificazione (CA) certs in un singolo file, ad es.`cât ca-cert.pem ca-cert.pem > ca-cert.pem`

### Perfect Forward Secrecy

<!-- type=misc -->

Il termine "[Forward Secrecy](https://en.wikipedia.org/wiki/Perfect_forward_secrecy)" o "Perfect Forward Secrecy" descrive una caratteristica dei metodi di key-agreement (cioè, key-exchange). Vale a dire, le chiavi dei server e client vengono usate per negoziare nuove chiavi provvisorie che vengono usate specificamente e soltanto per la sessione di comunicazione attuale. In pratica, ciò significa che anche se la chiave privata del server viene compromessa, la comunicazione può essere decritptata da chi ci sta spiando solo se l’aggressore riesce ad ottenere la coppia di chiavi generata specificamente per la sessione.

La Perfect Forward Secrecy si ottiene generando casualmente una coppia di chiavi per key-agreement su ogni handshake TLS/SSL (in contrasto con l'uso della stessa chiave per tutte le sessioni). I metodi che implementano questa tecnica vengono chiamati "ephemeral" (effimeri).

Attualmente sono due i metodi comunemente utilizzati per raggiungere la Perfect Forward Secrecy (nota il carattere "E" aggiunto alle abbreviazioni tradizionali):

* [DHE](https://en.wikipedia.org/wiki/Diffie%E2%80%93Hellman_key_exchange) - Una versione effimera del protocollo di key-agreement Diffie Hellman.
* [ECDHE](https://en.wikipedia.org/wiki/Elliptic_curve_Diffie%E2%80%93Hellman) - Una versione effimera del protocollo di key agreement Elliptic Curve Diffie Hellman.

I metodi effimeri potrebbero avere alcuni inconvenienti per quanto riguarda le prestazioni, perché la generazione di chiavi è costosa.

Per utilizzare la Perfect Forward Secrecy utilizzando `DHE` con il modulo `tls`, è necessario generare parametri Diffie-Hellman e specificarli con l'opzione `dhparam` a [`tls.createSecureContext()`][]. Di seguito viene illustrato l'utilizzo dell'interfaccia a riga di Comando OpenSSL per generare tali parametri:

```sh
openssl dhparam -outform PEM -out dhparam.pem 2048
```

Se si utilizza la Perfect Forward Secrecy utilizzando `ECDHE`, non sono necessari i parametri Diffie-Hellman e verrà utilizzata una curva ECDHE predefinita. La proprietà `ecdhCurve` può essere utilizzata durante la creazione di un Server TLS per specificare l'elenco dei nomi delle curve supportate da utilizzare, per maggiori informazioni visualizza [`tls.createServer()`].

### ALPN, NPN, and SNI

<!-- type=misc -->

ALPN (Application-Layer Protocol Negotiation Extension), NPN (Next Protocol Negotiation) and, SNI (Server Name Indication) are TLS handshake extensions:

* ALPN/NPN - Allows the use of one TLS server for multiple protocols (HTTP, SPDY, HTTP/2)
* SNI - Consente l'utilizzo di un server TLS per più hostname con certificati SSL diversi.

*Note*: Use of ALPN is recommended over NPN. The NPN extension has never been formally defined or documented and generally not recommended for use.

### Client-initiated renegotiation attack mitigation

<!-- type=misc -->

Il protocollo TLS permette ai client di rinegoziare certi aspetti della sessione TLS. Sfortunatamente, la rinegoziazione della sessione richiede un numero sproporzionato di risorse server-side, facendo si che diventi un potenziale vettore per gli attacchi di tipo denial-of-service.

Per mitigare i rischi, la rinegoziazione viene limitata a tre volte ogni dieci minuti. Quando si supera questa soglia, viene emesso un `'error'` event sull'istanza [`tls.TLSSocker`][]. I limiti sono configurabili:

* `tls.CLIENT_RENEG_LIMIT`{number} Specifica il numero di richieste di rinegoziazione. **Predefinito** `3`.
* `tls.CLIENT_RENEG_WINDOW` {number} Specifies the time renegotiation window in seconds. **Predefinito:** `600` (10 minuti).

*Note*: The default renegotiation limits should not be modified without a full understanding of the implications and risks.

Per testare i limiti della rinegoziazione sù un server, connettiti ad esso utilizzando il client a riga di comando di OpensSSL (`openssl s_client -connect address:port`) poi inserisci `R<CR>` (cioè la lettera `R` seguita da un ritorno a capo) più volte.

## Modificare la suite del Cipher TLS predefinito

Node.js è costruito con una suite predefinita di cifrature TLS abilitate e disabilitate. Attualmente, la suite di cifratura predefinita è:

```txt
ECDHE-RSA-AES128-GCM-SHA256:
ECDHE-ECDSA-AES128-GCM-SHA256:
ECDHE-RSA-AES256-GCM-SHA384:
ECDHE-ECDSA-AES256-GCM-SHA384:
DHE-RSA-AES128-GCM-SHA256:
ECDHE-RSA-AES128-SHA256:
DHE-RSA-AES128-SHA256:
ECDHE-RSA-AES256-SHA384:
DHE-RSA-AES256-SHA384:
ECDHE-RSA-AES256-SHA256:
DHE-RSA-AES256-SHA256:
HIGH:
!aNULL:
!eNULL:
!EXPORT:
!DES:
!RC4:
!MD5:
!PSK:
!SRP:
!CAMELLIA
```

Questa impostazione predefinita può essere sostituita interamente utilizzando l'opzione a riga di comando `--tls-cipher-list`. Ad esempio, il seguente codice rende`ECDHE-RSA-AES128-GCM-SHA256:!RC4` la suite di cifratura TLS predefinita:

```sh
node --tls-cipher-list="ECDHE-RSA-AES128-GCM-SHA256:!RC4"
```

The default can also be replaced on a per client or server basis using the `ciphers` option from [`tls.createSecureContext()`][], which is also available in [`tls.createServer()`], [`tls.connect()`], and when creating new [`tls.TLSSocket`]s.

Per ulteriori dettagli sul formato consultare la [documentazione della lista di formati di cifratura OpenSSL](https://www.openssl.org/docs/man1.0.2/apps/ciphers.html#CIPHER-LIST-FORMAT).

*Note*: The default cipher suite included within Node.js has been carefully selected to reflect current security best practices and risk mitigation. Cambiare la suite di cifratura predefinita può avere un impatto importante sulla sicurezza di un'applicazione. Le opzioni switch `--tls-cipher-list` e `ciphers` dovrebbero essere utilizzate solo se assolutamente necessario.

The default cipher suite prefers GCM ciphers for [Chrome's 'modern cryptography' setting] and also prefers ECDHE and DHE ciphers for Perfect Forward Secrecy, while offering *some* backward compatibility.

128 bit AES is preferred over 192 and 256 bit AES in light of [specific attacks affecting larger AES key sizes].

Old clients that rely on insecure and deprecated RC4 or DES-based ciphers (like Internet Explorer 6) cannot complete the handshaking process with the default configuration. If these clients _must_ be supported, the [TLS recommendations](https://wiki.mozilla.org/Security/Server_Side_TLS) may offer a compatible cipher suite. For more details on the format, see the [OpenSSL cipher list format documentation](https://www.openssl.org/docs/man1.0.2/apps/ciphers.html#CIPHER-LIST-FORMAT).

## Classe: tls.Server
<!-- YAML
added: v0.3.2
-->

La classe `tls.Server` è una sottoclasse di `net.Server` che accetta connessioni criptate utilizzando TLS o SSL.

### Event: 'newSession'
<!-- YAML
added: v0.9.2
-->

L'evento `'newSession'` viene emesso alla creazione di una nuova sessione di TLS. Questo potrebbe essere utilizzato per memorizzare sessioni in un dispositivo di archiviazione esterno. Il callback listener riceve tre argomenti quando viene chiamato:

* `sessionId` - L'identificatore della sessione TLS
* `sessionData` - I dati della sessione TLS
* `callback` {Function} Una funzione di callback che non accetta argomenti e che deve essere chiamata affinche i dati possano essere inviati o ricevuti attraverso la connessione sicura.

*Note*: Listening for this event will have an effect only on connections established after the addition of the event listener.

### Evento: 'OCSPRequest'
<!-- YAML
added: v0.11.13
-->

L'evento `'OCSPRequest'` viene emesso quando il client invia una richiesta dello stato di certificazione. Il callback del listener riceve tre argomenti quando viene chiamato:

* `certificate` {Buffer} Il certificato del server
* `issuer` {Buffer} Il certificato dell’emittente
* `callback` {Function} Una funzione callback che deve essere chiamata per fornire i risultati della richiesta OCSP.

Il certificato attuale del server può essere analizzato per ottenere l'URL OCSP e l'id del certificato; dopo aver ricevuto una risposta OCSP, viene chiamato `callback(null, resp)`, dove `resp` è un istanza `Buffer` contenente la risposta OCSP. Sia `certificate` che `issuer` sono rappresentazioni DER di tipo `Buffer` del certificato primario e dell'autorità emittente. Questi possono essere utilizzati per ottenere l'id del certificato di OCSP e l'URL endpoint di OCSP.

In alternativa, potrebbe essere chiamato `callback(null, null)` il che indica che non c'è stata alcuna risposta OCSP.

Chiamare `callback(err)` darà come risultato la chiamata a `socket.destroy(err)`.

Il flusso tipico di una richiesta OCSP è il seguente:

1. Client connects to the server and sends an `'OCSPRequest'` (via the status info extension in ClientHello).
2. Server receives the request and emits the `'OCSPRequest'` event, calling the listener if registered.
3. Server extracts the OCSP URL from either the `certificate` or `issuer` and performs an [OCSP request](https://en.wikipedia.org/wiki/OCSP_stapling) to the CA.
4. Server receives `OCSPResponse` from the CA and sends it back to the client via the `callback` argument
5. Client validates the response and either destroys the socket or performs a handshake.

*Note*: The `issuer` can be `null` if the certificate is either self-signed or the issuer is not in the root certificates list. (Un emittente può essere fornito attraverso l'opzione `ca` quando si stabilisce la connessione TLS.)

*Note*: Listening for this event will have an effect only on connections established after the addition of the event listener.

*Note*: An npm module like [asn1.js](https://npmjs.org/package/asn1.js) may be used to parse the certificates.

### Event: 'resumeSession'
<!-- YAML
added: v0.9.2
-->

L'evento `'resumeSession' ` viene emesso quando il client richiede di riprendere una sessione TLS precedente. Il listener callback riceve due argomenti quando viene chiamato:

* `sessionId` - L'identificatore della sessione TLS/SSL
* `calback` {Function} Una funzione di callback da chiamare quando la sessione precedente è stata recuperata.

Quando viene chimato, il listener dell'evento può realizzare una ricerca nella memoria esterna utilizzando la `sessionId` fornita e chiamare `callback(null, sessionData)` una volta finito. Se la sessione non può essere ripresa (cioè non esiste in memoria) il callback potrebbe essere chiamato come `callback(null, null)`. Chiamare `callback(err)` terminerà la connessione in entrata e distruggerà il socket.

*Note*: Listening for this event will have an effect only on connections established after the addition of the event listener.

Di seguito viene illustrato come si riprende un sessione TLS:

```js
const tlsSessionStore = {};
server.on('newSession', (id, data, cb) => {
  tlsSessionStore[id.toString('hex')] = data;
  cb();
});
server.on('resumeSession', (id, cb) => {
  cb(null, tlsSessionStore[id.toString('hex')] || null);
});
```

### Evento: 'secureConnection'
<!-- YAML
added: v0.3.2
-->

The `'secureConnection'` event is emitted after the handshaking process for a new connection has successfully completed. Il callback del listener riceve un solo argomento quando viene chiamato:

* `tlsSocket` {tls.TLSSocket} Il socket TLS stabilito.

La proprietà `tlsSocket.authorized` è un valore `boolean` che indica se il client è stato verificato da una delle Autorità di Certificazione fornite per il server. Se `tls.Socket.authorized` è `falso`, allora `socket.authorizationError` è impostato per descrivere in che modo l'autorizzazione non è riuscita. Nota che in base alle impostazioni del server TLS, le connessioni non autorizzate potrebbero ancora essere accettate.

The `tlsSocket.npnProtocol` and `tlsSocket.alpnProtocol` properties are strings that contain the selected NPN and ALPN protocols, respectively. When both NPN and ALPN extensions are received, ALPN takes precedence over NPN and the next protocol is selected by ALPN.

When ALPN has no selected protocol, `tlsSocket.alpnProtocol` returns `false`.

La proprietà `tlsSocket.servername` è una stringa contenente il nome del server richiesto tramite SNI.

### Evento: 'tlsClientError'
<!-- YAML
added: v6.0.0
-->

L'evento `tlsClientError'` viene generato quando si verifica un errore prima che venga stabilita una connessione sicura. Il listener callback riceve due argomenti quando viene chiamato:

* `exception` {Error} L'`Error` object che descrive l'errore
* `tlsSocket` {tls.TLSSocket} L'istanza `tls.TLSSocket` da cui ha avuto origine l'errore.

### server.addContext(hostname, context)
<!-- YAML
added: v0.5.3
-->

* `hostname` {string} Un host name SNI o carattere jolly (ad es. `*`)
* `contest` {Object} Un object contenente una qualsiasi delle possibili proprietà dagli argomenti delle `opzioni` [`tls.createSecureContext()`][] (ad es. `key`, `cert`, `ca`, etc).

Il metodo `server.addContext()` aggiunge un contesto protetto che verrà usato se la richiesta del hostname SNI del client coincide con il `hostname` (o carattere jolly) fornito.

### server.address()
<!-- YAML
added: v0.6.0
-->

Restituisce l'indirizzo associato, il nome della famiglia dell'indirizzo e la porta del server come riportato dal sistema operativo. Vedi [`net.Server.address()`][] per maggiori informazioni.

### server.close([callback])
<!-- YAML
added: v0.3.2
-->

* `callback` {Function} Un callback facoltativo del listener che verrà registrato per eseguire il listening sull'evento `'close' ` dell'istanza del server.

Il metodo `server.close()` blocca l'accettazione di nuove connessioni da parte del server.

La funzione opera in modo asincrono. L'evento `'close'` verrà emesso quando il server non ha altre connessioni aperte.

### server.connections
<!-- YAML
added: v0.3.2
deprecated: v0.9.7
-->

> Stabilità: 0 - Deprecato: Utilizza invece [`server.getConnections()`][].

Restituisce il numero attuale di connessioni simultanee sul server.

### server.getTicketKeys()
<!-- YAML
added: v3.0.0
-->

Restituisce un istanza `Buffer` che contiene le chiavi attualmente utilizzate per crittografia/decrittografia dei [TLS Session Tickets](https://www.ietf.org/rfc/rfc5077.txt)

### server.listen()

Avvia il server che esegue il listening per le connessioni criptate. Questo metodo è identico a [`server.listen()`][] da [`net.Server`][].

### server.setTicketKeys(keys)
<!-- YAML
added: v3.0.0
-->

* `keys` {Buffer} Le chiavi utilizzate la crittografia/decrittografia dei [TLS Session Tickets](https://www.ietf.org/rfc/rfc5077.txt).

Aggiorna le chiavi per la crittografia/decrittografia dei [TLS Session Tickets](https://www.ietf.org/rfc/rfc5077.txt).

*Note*: The key's `Buffer` should be 48 bytes long. See `ticketKeys` option in [tls.createServer](#tls_tls_createserver_options_secureconnectionlistener) for more information on how it is used.

*Note*: Changes to the ticket keys are effective only for future server connections. Existing or currently pending server connections will use the previous keys.


## Classe: tls.TLSSocket
<!-- YAML
added: v0.11.4
-->

The `tls.TLSSocket` is a subclass of [`net.Socket`][] that performs transparent encryption of written data and all required TLS negotiation.

Le istanze di `tls.TLSSocket` implementano l'interfaccia duplex [Stream](stream.html#stream_stream).

*Note*: Methods that return TLS connection metadata (e.g. [`tls.TLSSocket.getPeerCertificate()`][] will only return data while the connection is open.

### new tls.TLSSocket(socket[, options])
<!-- YAML
added: v0.11.4
changes:
  - version: v5.0.0
    pr-url: https://github.com/nodejs/node/pull/2564
    description: ALPN options are supported now.
-->

* `socket` {net.Socket|stream.Duplex}
Sul lato server, qualsiasi stream `Duplex`. Sul lato client, qualsiasi istanza di [`net.Socket`][] (per il supporto generico di stream `Duplex` dal lato client, deve essere utilizzato [`tls.connect()`][]).
* `options` {Object}
  * `isServer`: Il protocollo SSL/TLS è asimmetrico, TLSSockets devono sapere se devono comportarsi come un server o come un client. Se `true` verrà creata un istanza del socket TLS come server. **Default:** `false`.
  * `server` {net.Server} Un istanza [`net.Server`][] facoltativa.
  * `requestCert`: Se autenticare o meno il peer remoto richiedendo un certificato. I client richiedono sempre un certificato del server. I server (`isServer` è vero) possono facoltativamente impostare `requestCert` su vero per richiedere un certificato del client.
  * `rejectUnauthorized`: Facoltativo, vedi [`tls.createServer()`][]
  * `NPNProtocols`: Optional, see [`tls.createServer()`][]
  * `ALPNProtocols`: Facoltativo, vedi [`tls.createServer()`][]
  * `SNICallback`: Facoltativo, vedi [`tls.createServer()`][]
  * `session` {Buffer} Un istanza `Buffer` facoltativa contenente una sessione TLS.
  * `requestOCSP` {boolean} If `true`, specifies that the OCSP status request extension will be added to the client hello and an `'OCSPResponse'` event will be emitted on the socket before establishing a secure communication
  * `secureContext`: Object contestuale TLS facoltativo creato con [`tls.createSecureContext()`][]. Se _non_ viene fornito un `secureContext`, ne verrà creato uno passando l'intero `options` object a `tls.createSecureContext()`.
  * ...: Opzioni [`tls.createSecureContext()`][] facoltative che vengono utilizzate se l'opzione `secureContext` non è presente, altrimenti vengono ignorati.

Costruisce un nuovo `tls.TLSSocket` object da un socket TCP esistente.

### Evento: 'OCSPResponse'
<!-- YAML
added: v0.11.13
-->

L'evento `'OCSPResponse'` viene emesso se l'opzione `requestOCSP` è stata impostata quando è stato creato il `tls.TLSSocket` ed è stata ricevuta una risposta OCSP. Il callback del listener riceve un solo argomento quando viene chiamato:

* `respone` {Buffer} La risposta del server OCSP

In genere, la `risposta` è un object firmato digitalmente dal CA del server che contiene informazioni riguardanti lo stato di revoca del certificato del server.

### Evento: 'secureConnect'
<!-- YAML
added: v0.11.4
-->

The `'secureConnect'` event is emitted after the handshaking process for a new connection has successfully completed. Il callback del listener verrà chiamato indipendentemente dal fatto che il certificato del server sia stato autorizzato o meno. È responsabilità del client verificare la proprietà `tlsSocket.authorized` per determinare se il certificato del server è stato firmato da uno dei CA specificati. Se `tlsSocket.authorized === false`, allora l'errore può essere trovato esaminando la proprietà `tlsSocket.authorizationError`. If either ALPN or NPN was used, the `tlsSocket.alpnProtocol` or `tlsSocket.npnProtocol` properties can be checked to determine the negotiated protocol.

### tlsSocket.address()
<!-- YAML
added: v0.11.4
-->

Returns the bound address, the address family name, and port of the underlying socket as reported by the operating system. Returns an object with three properties, e.g. `{ port: 12346, family: 'IPv4', address: '127.0.0.1' }`

### tlsSocket.authorizationError
<!-- YAML
added: v0.11.4
-->

Restituisce il motivo per cui non è stato verificato il certificato del peer. Questa proprietà viene impostata solo quando `tlsSocket.authorized === false`.

### tlsSocket.authorized
<!-- YAML
added: v0.11.4
-->

Restituisce `true` se il certificato peer è stato firmato da uno dei CA specificati quando si è creata l'istanza `tls.TLSSocket`, altrimenti `false`.

### tlsSocket.disableRenegotiation()
<!-- YAML
added: v8.4.0
-->

Disabilita la rinegoziazione TLS per questa istanza `TLSSocket`. Una volta chiamata, i tentativi di rinegoziare attiveranno un evento `'error'` sul `TLSSocket`.

### tlsSocket.encrypted
<!-- YAML
added: v0.11.4
-->

Restituisce sempre `true`. Questo può essere usato per distinguere socket TLS da istanze `net.Socket` regolari.

### tlsSocket.getCipher()
<!-- YAML
added: v0.11.4
-->

Restituisce un object che rappresenta il nome del cifrario. The `version` key is a legacy field which always contains the value `'TLSv1/SSLv3'`.

For example: `{ name: 'AES256-SHA', version: 'TLSv1/SSLv3' }`

See `SSL_CIPHER_get_name()` in https://www.openssl.org/docs/man1.0.2/ssl/SSL_CIPHER_get_name.html for more information.

### tlsSocket.getEphemeralKeyInfo()
<!-- YAML
added: v5.0.0
-->

Returns an object representing the type, name, and size of parameter of an ephemeral key exchange in [Perfect Forward Secrecy](#tls_perfect_forward_secrecy) on a client connection. Esso restituisce un object vuoto quando lo scambio delle chiavi non è ephemeral (efimero). Poiché questo è supportato solo su un socket di tipo client; quando viene chiamato su un socket di tipo server, viene restituito `null`. I tipi supportati sono `'DH' ` e `'ECDH'`. The `name` property is available only when type is 'ECDH'.

For Example: `{ type: 'ECDH', name: 'prime256v1', size: 256 }`

### tlsSocket.getFinished()
<!-- YAML
added: v8.12.0
-->

* Restituisce: {Buffer|undefined} L’ultimo messaggio `Finished` che è stato inviato al socket come parte di un handshake SSL/TLS, oppure `undefined` se non è ancora stato inviato alcun messaggio `Finished`.

As the `Finished` messages are message digests of the complete handshake (with a total of 192 bits for TLS 1.0 and more for SSL 3.0), they can be used for external authentication procedures when the authentication provided by SSL/TLS is not desired or is not enough.

Corrisponde alla routine `SSL_get_finished` in OpenSSL e può essere utilizzato per implementare il binding del canale `tls-unique` da [RFC 5929](https://tools.ietf.org/html/rfc5929).

### tlsSocket.getPeerCertificate([detailed])
<!-- YAML
added: v0.11.4
-->

* `dettagliato` {boolean} Includere l'intera catena di certificati se `true`, altrimenti includere solo il certificato del peer.

Restituisce un object che rappresenta il certificato del peer. L'object restituito ha alcune proprietà corrispondenti ai campi del certificato.

If the full certificate chain was requested, each certificate will include a `issuerCertificate` property containing an object representing its issuer's certificate.

Per esempio:

```text
{ subject:
   { C: 'UK',
     ST: 'Acknack Ltd',
     L: 'Rhys Jones',
     O: 'node.js',
     OU: 'Test TLS Certificate',
     CN: 'localhost' },
  issuer:
   { C: 'UK',
     ST: 'Acknack Ltd',
     L: 'Rhys Jones',
     O: 'node.js',
     OU: 'Test TLS Certificate',
     CN: 'localhost' },
  issuerCertificate:
   { ... another certificate, possibly with a .issuerCertificate ... },
  raw: < RAW DER buffer >,
  valid_from: 'Nov 11 09:52:22 2009 GMT',
  valid_to: 'Nov 6 09:52:22 2029 GMT',
  fingerprint: '2A:7A:C2:DD:E5:F9:CC:53:72:35:99:7A:02:5A:71:38:52:EC:8A:DF',
  serialNumber: 'B9B0D332A1AA5635' }
```

Se il peer non fornisce un certificato, verrà restituito un object vuoto.

### tlsSocket.getPeerFinished()
<!-- YAML
added: v8.12.0
-->

* Restituisce: {Buffer|undefined} L'ultimo messaggio `Finished` che è previsto oppure che è stato ricevuto dal Socket come parte di un handshake SSL/TLS, oppure `undefined` se non è ancora presente alcun messaggio `Finished`.

As the `Finished` messages are message digests of the complete handshake (with a total of 192 bits for TLS 1.0 and more for SSL 3.0), they can be used for external authentication procedures when the authentication provided by SSL/TLS is not desired or is not enough.

Corrisponde alla routine `SSL_get_peer_finished` in OpenSSL e può essere usato per implementare il binding del canale `tls-unique` da [RFC 5929](https://tools.ietf.org/html/rfc5929).

### tlsSocket.getProtocol()
<!-- YAML
added: v5.7.0
-->

Restituisce una stringa contenente la versione negoziata del protocollo SSL/TLS della connessione corrente. Il valore `'unknown'` verrà restituito per i socket connessi che non hanno completato il processo di handshaking. Il valore `null` verrà restituito per i socket del server oppure per i socket del client disconnessi.

Le risposte di esempio includono:

* `TLSv1`
* `TLSv1.1`
* `TLSv1.2`
* `sconosciuto`

Vedi https://www.openssl.org/docs/man1.0.2/ssl/SSL_get_version.html per maggiori informazioni.

### tlsSocket.getSession()
<!-- YAML
added: v0.11.4
-->

Restuisce la sessione TLS codificata ASN.1 oppure `undefined` se non è stata negoziata alcuna sessione. Può essere utilizzato per accelerare la costituzione del handshake durante la riconnessione al server.

### tlsSocket.getTLSTicket()
<!-- YAML
added: v0.11.4
-->

Returns the TLS session ticket or `undefined` if no session was negotiated.

*Note*: This only works with client TLS sockets. Useful only for debugging, for session reuse provide `session` option to [`tls.connect()`][].

### tlsSocket.localAddress
<!-- YAML
added: v0.11.4
-->

Returns the string representation of the local IP address.

### tlsSocket.localPort
<!-- YAML
added: v0.11.4
-->

Restituisce la rappresentazione numerica della porta locale.

### tlsSocket.remoteAddress
<!-- YAML
added: v0.11.4
-->

Restituisce la rappresentazione di tipo stringa dell'indirizzo IP remoto. Ad esempio, `'74.125.127.100'` o `'2001:4860:a005::68'`.

### tlsSocket.remoteFamily
<!-- YAML
added: v0.11.4
-->

Returns the string representation of the remote IP family. `'IPv4'` o `'IPv6'`.

### tlsSocket.remotePort
<!-- YAML
added: v0.11.4
-->

Restituisce la rappresentazione numerica della porta remota. Per esempio, `443`.

### tlsSocket.renegotiate(options, callback)
<!-- YAML
added: v0.11.8
-->

* `options` {Object}
  * `rejectUnauthorized` {boolean} Se non `false`, il certificato del server viene verificato rispetto alla lista dei CA forniti. Se la verifica fallisce viene emesso un evento `'error'`; `err.code` contiene il codice di errore di OpenSSL. **Default:** `true`.
  * `requestCert`
* `callback` {Function} Una funzione che verrà chiamata quando la richiesta di rinegoziazione è stata completata.

Il metodo `tlsSocket.renegotiate()` avvia un processo di rinegoziazione TLS. Al termine, la funzione `callbavk` riceverà una solo argomento che sarà un `Error` (se la richiesta è fallita) oppure `null`.

*Note*: This method can be used to request a peer's certificate after the secure connection has been established.

*Note*: When running as the server, the socket will be destroyed with an error after `handshakeTimeout` timeout.

### tlsSocket.setMaxSendFragment(size)
<!-- YAML
added: v0.11.11
-->

* `size` {number} La dimensione massima del frammento TLS. Il valore massimo è `16384`. **Default:** `16384`.

Il metodo `tlsSocket.setMaxSendFragment()` imposta la dimensione massima del frammento TLS. Restituisce `true` se l'impostazione del limite è riuscita; altrimenti `false`.

Smaller fragment sizes decrease the buffering latency on the client: larger fragments are buffered by the TLS layer until the entire fragment is received and its integrity is verified; large fragments can span multiple roundtrips and their processing can be delayed due to packet loss or reordering. However, smaller fragments add extra TLS framing bytes and CPU overhead, which may decrease overall server throughput.

## tls.checkServerIdentity(host, cert)
<!-- YAML
added: v0.8.4
-->

* `host` {string} The hostname to verify the certificate against
* `cert` {Object} Un object che rappresenta il certificato del peer. L'object restituito ha alcune proprietà corrispondenti ai campi del certificato.

Verifies the certificate `cert` is issued to host `host`.

Returns {Error} object, populating it with the reason, host, and cert on failure. On success, returns {undefined}.

*Note*: This function can be overwritten by providing alternative function as part of the `options.checkServerIdentity` option passed to `tls.connect()`. The overwriting function can call `tls.checkServerIdentity()` of course, to augment the checks done with additional verification.

*Note*: This function is only called if the certificate passed all other checks, such as being issued by trusted CA (`options.ca`).

The cert object contains the parsed certificate and will have a structure similar to:

```text
{ subject:
   { OU: [ 'Domain Control Validated', 'PositiveSSL Wildcard' ],
     CN: '*.nodejs.org' },
  issuer:
   { C: 'GB',
     ST: 'Greater Manchester',
     L: 'Salford',
     O: 'COMODO CA Limited',
     CN: 'COMODO RSA Domain Validation Secure Server CA' },
  subjectaltname: 'DNS:*.nodejs.org, DNS:nodejs.org',
  infoAccess:
   { 'CA Issuers - URI':
      [ 'http://crt.comodoca.com/COMODORSADomainValidationSecureServerCA.crt' ],
     'OCSP - URI': [ 'http://ocsp.comodoca.com' ] },
  modulus: 'B56CE45CB740B09A13F64AC543B712FF9EE8E4C284B542A1708A27E82A8D151CA178153E12E6DDA15BF70FFD96CB8A88618641BDFCCA03527E665B70D779C8A349A6F88FD4EF6557180BD4C98192872BCFE3AF56E863C09DDD8BC1EC58DF9D94F914F0369102B2870BECFA1348A0838C9C49BD1C20124B442477572347047506B1FCD658A80D0C44BCC16BC5C5496CFE6E4A8428EF654CD3D8972BF6E5BFAD59C93006830B5EB1056BBB38B53D1464FA6E02BFDF2FF66CD949486F0775EC43034EC2602AEFBF1703AD221DAA2A88353C3B6A688EFE8387811F645CEED7B3FE46E1F8B9F59FAD028F349B9BC14211D5830994D055EEA3D547911E07A0ADDEB8A82B9188E58720D95CD478EEC9AF1F17BE8141BE80906F1A339445A7EB5B285F68039B0F294598A7D1C0005FC22B5271B0752F58CCDEF8C8FD856FB7AE21C80B8A2CE983AE94046E53EDE4CB89F42502D31B5360771C01C80155918637490550E3F555E2EE75CC8C636DDE3633CFEDD62E91BF0F7688273694EEEBA20C2FC9F14A2A435517BC1D7373922463409AB603295CEB0BB53787A334C9CA3CA8B30005C5A62FC0715083462E00719A8FA3ED0A9828C3871360A73F8B04A4FC1E71302844E9BB9940B77E745C9D91F226D71AFCAD4B113AAF68D92B24DDB4A2136B55A1CD1ADF39605B63CB639038ED0F4C987689866743A68769CC55847E4A06D6E2E3F1',
  exponent: '0x10001',
  valid_from: 'Aug 14 00:00:00 2017 GMT',
  valid_to: 'Nov 20 23:59:59 2019 GMT',
  fingerprint: '01:02:59:D9:C3:D2:0D:08:F7:82:4E:44:A4:B4:53:C5:E2:3A:87:4D',
  ext_key_usage: [ '1.3.6.1.5.5.7.3.1', '1.3.6.1.5.5.7.3.2' ],
  serialNumber: '66593D57F20CBC573E433381B5FEC280',
  raw: <Buffer ....> }
```

## tls.connect(options[, callback])
<!-- YAML
added: v0.11.3
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12839
    description: The `lookup` option is supported now.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/11984
    description: The `ALPNProtocols` and `NPNProtocols` options can
                 be `Uint8Array`s now.
  - version: v5.3.0, v4.7.0
    pr-url: https://github.com/nodejs/node/pull/4246
    description: The `secureContext` option is supported now.
  - version: v5.0.0
    pr-url: https://github.com/nodejs/node/pull/2564
    description: ALPN options are supported now.
-->

* `options` {Object}
  * `host` {string} Il host a cui il client si dovrebbe connettere. **Default:** `'localhost'`.
  * `port` {number} La porta a cui il client si dovrebbe connettere.
  * `path` {string} Crea una connessione di tipo socket unix al percorso. Se questa opzione è specificata, `host` e `port` vengono ignorati.
  * `socket` {stream.Duplex} Stabilisci una connessione sicura su un determinato socket invece di creare un nuovo socket. Di solito, questa è un istanza di [`net.Socket`][], ma qualsiasi stream `Duplex` è consentito. Se questa opzione è specificata, `path`, `host` e `port` vengono ignorati, tranne per la convalida del certificato. Di solito, un socket è già connesso quando viene passato a `tls.connect()`, ma può anche essere connesso in seguito. Nota che la connessione, la sconnessione e la distruzione del `socket` sono responsabilità dell'utente, chiamare `tls.connect()` non causerà la chiamata di `net.connect()`.
  * `rejectUnauthorized` {boolean} Se non `false`, il certificato del server viene verificato rispetto alla lista dei CA forniti. Se la verifica fallisce viene emesso un evento `'error'`; `err.code` contiene il codice di errore di OpenSSL. **Default:** `true`.
  * `NPNProtocols` {string[]|Buffer[]|Uint8Array[]|Buffer|Uint8Array}
An array of strings, `Buffer`s or `Uint8Array`s, or a single `Buffer` or `Uint8Array` containing supported NPN protocols. `Buffer`s should have the format `[len][name][len][name]...` e.g. `0x05hello0x05world`, where the first byte is the length of the next protocol name. Passare un array solitamente è molto più semplice, ad es. `['hello', 'world']`.
  * `ALPNProtocols`: {string[]|Buffer[]|Uint8Array[]|Buffer|Uint8Array} Un array di stringhe, `Buffer` o `Uint8Array`, o un singolo `Buffer` o `Uint8Array` contenente i protocolli ALPN supportati. I `Buffer` dovrebbero avere il formato `[len][name][len][name]...` ad es. `0x05hello0x05world`, dove il primo byte è la lunghezza del nome del prossimo protocollo. Passare un array solitamente è molto più semplice, ad es. `['hello', 'world']`.
  * `servername`: {string} Il nome del server per l'estensione TLS SNI (Server Name Indication).
  * `checkServerIdentity(servername, cert)` {Function} Una funzione di callback da utilizzare (al posto della funzione `tls.checkServerIdentity()` integrata) quando si verifica l'hostname del server (o il `servername` fornito quando esplicitamente impostato) rispetto al certificato. Questo dovrebbe restituire un {Error} se la verifica fallisce. Questo metodo dovrebbe restituire `undefined` se il `servername` e `cert` vengono verificati.
  * `session` {Buffer} Un instanza `Buffer`, contenente la sessione TLS.
  * `minDHSize` {number} Dimensione minima del parametro DH in bit per accettare una connessione TLS. Quando un server offre un parametro DH con una dimensione inferiore a `minDHSize`, la connessione TLS viene distrutta e viene generato un errore. **Default:** `1024`.
  * `secureContext`: Object contestuale TLS facoltativo creato con [`tls.createSecureContext()`][]. Se _non_ viene fornito un `secureContext`, ne verrà creato uno passando l'intero `options` object a `tls.createSecureContext()`.
  * `lookup` {Function} Funzione lookup (di ricerca) personalizzata. **Default:** [`dns.lookup()`][].
  * ...: Opzioni [`tls.createSecureContext()`][] facoltative che vengono utilizzate se l'opzione `secureContext` non è presente, altrimenti vengono ignorati.
* `callback` {Function}

La funzione di `callback`, se specificata, verrà aggiunta come listener per l'evento [`'secureConnect'`][].

`tls.connect()` restituisce un object [`tls.TLSSocket`][].

Il codice seguente implementa un esempio semplice di 'echo server':

```js
const tls = require('tls');
const fs = require('fs');

const options = {
  // Necessario solo se si sta utilizzando l'autenticazione del certificato del client
  key: fs.readFileSync('client-key.pem'),
  cert: fs.readFileSync('client-cert.pem'),

  // Necessario solo se il server utilizza un certificato auto-firmato
  ca: [ fs.readFileSync('server-cert.pem') ]
};

const socket = tls.connect(8000, options, () => {
  console.log('client connected',
              socket.authorized ? 'authorized' : 'unauthorized');
  process.stdin.pipe(socket);
  process.stdin.resume();
});
socket.setEncoding('utf8');
socket.on('data', (data) => {
  console.log(data);
});
socket.on('end', () => {
  server.close();
});
```

O

```js
const tls = require('tls');
const fs = require('fs');

const options = {
  pfx: fs.readFileSync('client.pfx')
};

const socket = tls.connect(8000, options, () => {
  console.log('client connected',
              socket.authorized ? 'authorized' : 'unauthorized');
  process.stdin.pipe(socket);
  process.stdin.resume();
});
socket.setEncoding('utf8');
socket.on('data', (data) => {
  console.log(data);
});
socket.on('end', () => {
  server.close();
});
```

## tls.connect(path\[, options\]\[, callback\])
<!-- YAML
added: v0.11.3
-->

* `path` {string} Valore predefinito per `options.path`.
* `options` {Object} Vedi [`tls.connect()`][].
* `callback` {Function} Vedi [`tls.connect()`][].

Uguale a [`tls.connect()`][] ad eccezione del fatto che `path` può essere fornito come un argomento anziché come un'opzione.

*Note*: A path option, if specified, will take precedence over the path argument.

## tls.connect(port\[, host\]\[, options\][, callback])
<!-- YAML
added: v0.11.3
-->

* `port` {number} Valore predefinito per `options.port`.
* `host` {string} Valore facoltativo predefinito per `options.host`.
* `options` {Object} Vedi [`tls.connect()`][].
* `callback` {Function} Vedi [`tls.connect()`][].

Uguale a [`tls.connect()`][] ad eccezione del fatto che `port` e `host` possono essere forniti come argomenti anziché opzioni.

*Note*: A port or host option, if specified, will take precedence over any port or host argument.


## tls.createSecureContext(options)
<!-- YAML
added: v0.11.13
changes:
  - version: v7.3.0
    pr-url: https://github.com/nodejs/node/pull/10294
    description: If the `key` option is an array, individual entries do not
                 need a `passphrase` property anymore. Array entries can also
                 just be `string`s or `Buffer`s now.
  - version: v5.2.0
    pr-url: https://github.com/nodejs/node/pull/4099
    description: The `ca` option can now be a single string containing multiple
                 CA certificates.
-->

* `options` {Object}
  * `pfx` {string|string[]|Buffer|Buffer[]|Object[]} Optional PFX or PKCS12 encoded private key and certificate chain. `pfx` è un'alternativa per fornire `key` e `cert` individualmente. PFX è solitamente crittografato, se lo è, per decriptarlo verrà usato `passphrase`. Molteplici PFX possono essere forniti o come un array di buffer PFX non criptati, oppure come un array di object nella forma `{buf: <string|buffer>[, passphrase: <string>]}`. La forma dell'object può verificarsi solo in un array. `object.passphrase` è facoltativo. Encrypted PFX will be decrypted with `object.passphrase` if provided, or `options.passphrase` if it is not.
  * `key` {string|string[]|Buffer|Buffer[]|Object[]} Chiavi private facoltative in formato PEM. PEM allows the option of private keys being encrypted. Le chiavi crittografate verranno decriptate con `options.passphrase`. Molteplici chiavi che utilizzano algoritmi diversi possono essere fornite come un array di chiave non crittografata stringhe o buffer, oppure come un array di object nella forma `{pem:
<string|buffer>[, passphrase: <string>]}`. La forma dell'object può verificarsi solo in un array. `object.passphrase` è facoltativo. Le chiavi crittografate saranno decriptate con `object.passphrase` se è stato fornito, oppure `options.passphrase` se non è stato fornito.
  * `passphrase` {string} Optional shared passphrase used for a single private key and/or a PFX.
  * `cert` {string|string[]|Buffer|Buffer[]} Catene facoltative di certificati in formato PEM. Una catena di certificazione dovrebbe essere fornita per ogni chiave privata. Each cert chain should consist of the PEM formatted certificate for a provided private `key`, followed by the PEM formatted intermediate certificates (if any), in order, and not including the root CA (the root CA must be pre-known to the peer, see `ca`). Quando vengono fornite molteplici catene di certificazione, queste non devono avere lo stesso ordine delle loro chiavi private in `key`. Se i certificati intermedi non vengono forniti, il peer non sarà in grado di convalidare il certificato, e l'handshake fallirà.
  * `ca` {string|string[]|Buffer|Buffer[]} Optionally override the trusted CA certificates. Default is to trust the well-known CAs curated by Mozilla. Le CA di Mozilla vengono sostituite completamente quando le CA sono specificate esplicitamente utilizzando questa opzione. The value can be a string or Buffer, or an Array of strings and/or Buffers. Any string or Buffer can contain multiple PEM CAs concatenated together. Il certificato del peer deve poter essere concatenato a una CA di fiducia del server affinché la connessione venga autenticata. Quando vengono utilizzati certificati che non sono concatenati a una CA ben nota, La CA del certificato deve essere specificata esplicitamente come attendibile altrimenti la connessione non si potrà autenticare. Se il peer utilizza un certificato che non corrisponde o si concatena a una delle CA predefinite, utilizzare l'opzione `ca` per fornire un certificato CA a cui il certificato del peer può corrispondere o concatenare. Per i certificati auto-firmati, il certificato è la propria CA, e deve essere fornito.
  * `crl` {string|string[]|Buffer|Buffer[]} CRL facoltative formattate in PEM (Liste di revoca del certificato).
  * `ciphers` {string} Specifiche facoltative della suite di cifratura, che sostituiscono quelle predefinite. Per ulteriori informazioni, vedi [modifying the default cipher suite](#tls_modifying_the_default_tls_cipher_suite).
  * `honorCipherOrder` {boolean} Tentativo di utilizzare le preferenze della suite di cifratura del server invece di quella del client. Quando è `true`, causa l'impostazione di `SSL_OP_CIPHER_SERVER_PREFERENCE` in `secureOptions`, per ulteriori informazioni visualizza [OpenSSL Options](crypto.html#crypto_openssl_options).
  * `ecdhCurve` {string} A string describing a named curve or a colon separated list of curve NIDs or names, for example `P-521:P-384:P-256`, to use for ECDH key agreement, or `false` to disable ECDH. Imposta su `auto` per selezionare la curva automaticamente. Utilizza [`crypto.getCurves()`][] per ottenere una lista di nomi di curve disponibili. Nelle versioni più recenti, `openssl ecparam -list_curves` mostrerà anche il nome e la descrizione di ogni curva ellittica disponibile. **Default:** [`tls.DEFAULT_ECDH_CURVE`].
  * `dhparam` {string|Buffer} Parametri DiffieHellman, necessari per [Perfect Forward Secrecy](#tls_perfect_forward_secrecy). Usa `openssl dhparam` per creare i parametri. La lunghezza della chiave deve essere maggiore di o uguale a 1024 bits, altrimenti verrà generato un errore. Si raccomanda vivamente l'utilizzo di 2048 bits o più per una maggiore sicurezza. If omitted or invalid, the parameters are silently discarded and DHE ciphers will not be available.
  * `secureProtocol` {string} Optional SSL method to use, default is `'SSLv23_method'`. The possible values are listed as [SSL_METHODS](https://www.openssl.org/docs/man1.0.2/ssl/ssl.html#DEALING-WITH-PROTOCOL-METHODS), use the function names as strings. For example, `'SSLv3_method'` to force SSL version 3.
  * `secureOptions` {number} Influisce facoltativamente sul comportamento del protocollo OpenSSL, il che di solito non è necessario. This should be used carefully if at all! Value is a numeric bitmask of the `SSL_OP_*` options from [OpenSSL Options](crypto.html#crypto_openssl_options).
  * `sessionIdContext` {string} Identificatore opaco facoltativo utilizzato dai server per garantire che lo stato della sessione non è condivisa tra le applicazioni. Non utilizzato dai client.

*Note*:

* [`tls.createServer()`][] sets the default value of the `honorCipherOrder` option to `true`, other APIs that create secure contexts leave it unset.

* [`tls.createServer()`][] uses a 128 bit truncated SHA1 hash value generated from `process.argv` as the default value of the `sessionIdContext` option, other APIs that create secure contexts have no default value.

Il metodo `tls.createSecureContext()` crea un object di credenziali.

A key is *required* for ciphers that make use of certificates. Si può utilizzare sia `key` che `pfx` per fornirla.

If the 'ca' option is not given, then Node.js will use the default publicly trusted list of CAs as given in <https://hg.mozilla.org/mozilla-central/raw-file/tip/security/nss/lib/ckfw/builtins/certdata.txt>.


## tls.createServer(\[options\]\[, secureConnectionListener\])
<!-- YAML
added: v0.3.2
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/11984
    description: The `ALPNProtocols` and `NPNProtocols` options can
                 be `Uint8Array`s now.
  - version: v5.0.0
    pr-url: https://github.com/nodejs/node/pull/2564
    description: ALPN options are supported now.
-->

* `options` {Object}
  * `handshakeTimeout` {number} Annulla la connessione se l'handshake SSL/TLS non viene completato nel numero di millisecondi specificato. Un `'tlsClientError'` viene emesso sul object `tls.Server` ogni volta che un handshake non viene completato nel tempo prestabilito. **Default:** `120000` (120 seconds).
  * `requestCert` {boolean} Se `true` il server richiederà un certificato dai client che si connettono e provano a verificare quel certificato. **Default:** `false`.
  * `rejectUnauthorized` {boolean} Se non è `false` il server rifiuterà qualsiasi connessione che non è autorizzata con la lista dei CA forniti. Questa opzione ha effetto solo se `requestCert` è `true`. **Default:** `true`.
  * `NPNProtocols` {string[]|Buffer[]|Uint8Array[]|Buffer|Uint8Array}
An array of strings, `Buffer`s or `Uint8Array`s, or a single `Buffer` or `Uint8Array` containing supported NPN protocols. `Buffer`s should have the format `[len][name][len][name]...` e.g. `0x05hello0x05world`, where the first byte is the length of the next protocol name. Passare un array solitamente è molto più semplice, ad es. `['hello', 'world']`. (I protocolli dovrebbero essere ordinati in base alla loro priorità.)
  * `ALPNProtocols`: {string[]|Buffer[]|Uint8Array[]|Buffer|Uint8Array} Un array di stringhe, `Buffer` o `Uint8Array`, o un singolo `Buffer` o `Uint8Array` contenente i protocolli ALPN supportati. I `Buffer` dovrebbero avere il formato `[len][name][len][name]...` ad es. `0x05hello0x05world`, dove il primo byte è la lunghezza del nome del prossimo protocollo. Passare un array solitamente è molto più semplice, ad es. `['hello', 'world']`. (Protocols should be ordered by their priority.) When the server receives both NPN and ALPN extensions from the client, ALPN takes precedence over NPN and the server does not send an NPN extension to the client.
  * `SNICallback(servername, cb)` {Function}
Una funzione che verrà chiamata se il client supporta l'estensione TLS SNI. Due argomenti verranno passati quando verrà chiamato: `servername ` e `cb`. `SNICallback` should invoke `cb(null, ctx)`, where `ctx` is a SecureContext instance. (`tls.createSecureContext(...)` can be used to get a proper SecureContext.) If `SNICallback` wasn't provided the default callback with high-level API will be used (see below).
  * `sessionTimeout` {number} Un intero che specifica il numero di secondi dopo i quali scadranno gli identificatori di sessione TLS e i ticket di sessione TLS creati dal server. See [SSL_CTX_set_timeout](https://www.openssl.org/docs/man1.0.2/ssl/SSL_CTX_set_timeout.html) for more details.
  * `ticketKeys`: Un'istanza `Buffer` di 48 byte costituita da un prefisso di 16 byte, una chiave HMAC di 16 byte, e una chiave AES di 16 byte. Questa può essere utilizzata per accettare ticket di sessione TLS su più istanze del server TLS.
  * ...: Può essere fornita qualsiasi opzione di [`tls.createSecureContext()`][]. Per i server, solitamente vengono richieste le opzioni di identità (`pfx` o `key`/`cert`).
* `secureConnectionListener` {Function}

Creates a new [tls.Server](#tls_class_tls_server). The `secureConnectionListener`, if provided, is automatically set as a listener for the [`'secureConnection'`][] event.

*Note*: The `ticketKeys` options is automatically shared between `cluster` module workers.

The following illustrates a simple echo server:

```js
const tls = require('tls');
const fs = require('fs');

const options = {
  key: fs.readFileSync('server-key.pem'),
  cert: fs.readFileSync('server-cert.pem'),

  // This is necessary only if using the client certificate authentication.
  requestCert: true,

  // This is necessary only if the client uses the self-signed certificate.
  ca: [ fs.readFileSync('client-cert.pem') ]
};

const server = tls.createServer(options, (socket) => {
  console.log('server connected',
              socket.authorized ? 'authorized' : 'unauthorized');
  socket.write('welcome!\n');
  socket.setEncoding('utf8');
  socket.pipe(socket);
});
server.listen(8000, () => {
  console.log('server bound');
});
```

O

```js
const tls = require('tls');
const fs = require('fs');

const options = {
  pfx: fs.readFileSync('server.pfx'),

  // This is necessary only if using the client certificate authentication.
  requestCert: true,

};

const server = tls.createServer(options, (socket) => {
  console.log('server connected',
              socket.authorized ? 'authorized' : 'unauthorized');
  socket.write('welcome!\n');
  socket.setEncoding('utf8');
  socket.pipe(socket);
});
server.listen(8000, () => {
  console.log('server bound');
});
```

This server can be tested by connecting to it using `openssl s_client`:

```sh
openssl s_client -connect 127.0.0.1:8000
```

## tls.getCiphers()
<!-- YAML
added: v0.10.2
-->

Returns an array with the names of the supported SSL ciphers.

Per esempio:

```js
console.log(tls.getCiphers()); // ['AES128-SHA', 'AES256-SHA', ...]
```

## tls.DEFAULT_ECDH_CURVE
<!-- YAML
added: v0.11.13
-->

The default curve name to use for ECDH key agreement in a tls server. The default value is `'prime256v1'` (NIST P-256). Consult [RFC 4492](https://www.rfc-editor.org/rfc/rfc4492.txt) and [FIPS.186-4](http://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.186-4.pdf) for more details.


## API obsoleti

### Class: CryptoStream
<!-- YAML
added: v0.3.4
deprecated: v0.11.3
-->

> Stability: 0 - Deprecated: Use [`tls.TLSSocket`][] instead.

The `tls.CryptoStream` class represents a stream of encrypted data. This class has been deprecated and should no longer be used.

#### cryptoStream.bytesWritten
<!-- YAML
added: v0.3.4
deprecated: v0.11.3
-->

The `cryptoStream.bytesWritten` property returns the total number of bytes written to the underlying socket *including* the bytes required for the implementation of the TLS protocol.

### Class: SecurePair
<!-- YAML
added: v0.3.2
deprecated: v0.11.3
-->

> Stability: 0 - Deprecated: Use [`tls.TLSSocket`][] instead.

Returned by [`tls.createSecurePair()`][].

#### Event: 'secure'
<!-- YAML
added: v0.3.2
deprecated: v0.11.3
-->

The `'secure'` event is emitted by the `SecurePair` object once a secure connection has been established.

As with checking for the server [`secureConnection`](#tls_event_secureconnection) event, `pair.cleartext.authorized` should be inspected to confirm whether the certificate used is properly authorized.

### tls.createSecurePair(\[context\]\[, isServer\]\[, requestCert\]\[, rejectUnauthorized\][, options])
<!-- YAML
added: v0.3.2
deprecated: v0.11.3
changes:
  - version: v5.0.0
    pr-url: https://github.com/nodejs/node/pull/2564
    description: ALPN options are supported now.
-->

> Stability: 0 - Deprecated: Use [`tls.TLSSocket`][] instead.

* `context` {Object} A secure context object as returned by `tls.createSecureContext()`
* `isServer` {boolean} `true` to specify that this TLS connection should be opened as a server.
* `requestCert` {boolean} `true` to specify whether a server should request a certificate from a connecting client. Only applies when `isServer` is `true`.
* `rejectUnauthorized` {boolean} If not `false` a server automatically reject clients with invalid certificates. Only applies when `isServer` is `true`.
* `options`
  * `secureContext`: An optional TLS context object from [`tls.createSecureContext()`][]
  * `isServer`: If `true` the TLS socket will be instantiated in server-mode. **Default:** `false`.
  * `server` {net.Server} Un istanza [`net.Server`][] facoltativa
  * `requestCert`: Optional, see [`tls.createServer()`][]
  * `rejectUnauthorized`: Facoltativo, vedi [`tls.createServer()`][]
  * `NPNProtocols`: Optional, see [`tls.createServer()`][]
  * `ALPNProtocols`: Facoltativo, vedi [`tls.createServer()`][]
  * `SNICallback`: Facoltativo, vedi [`tls.createServer()`][]
  * `session` {Buffer} Un istanza `Buffer` facoltativa contenente una sessione TLS.
  * `requestOCSP` {boolean} If `true`, specifies that the OCSP status request extension will be added to the client hello and an `'OCSPResponse'` event will be emitted on the socket before establishing a secure communication

Creates a new secure pair object with two streams, one of which reads and writes the encrypted data and the other of which reads and writes the cleartext data. Generally, the encrypted stream is piped to/from an incoming encrypted data stream and the cleartext one is used as a replacement for the initial encrypted stream.

`tls.createSecurePair()` returns a `tls.SecurePair` object with `cleartext` and `encrypted` stream properties.

*Note*: `cleartext` has the same API as [`tls.TLSSocket`][].

*Note*: The `tls.createSecurePair()` method is now deprecated in favor of `tls.TLSSocket()`. Ad esempio, il codice:

```js
pair = tls.createSecurePair(/* ... */);
pair.encrypted.pipe(socket);
socket.pipe(pair.encrypted);
```

can be replaced by:

```js
secure_socket = tls.TLSSocket(socket, options);
```

where `secure_socket` has the same API as `pair.cleartext`.
