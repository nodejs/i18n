# HTTP

<!--introduced_in=v0.10.0-->

> Σταθερότητα: 2 - Σταθερό

Για να χρησιμοποιηθεί ο εξυπηρετητής και ο πελάτης HTTP, θα πρέπει να γίνει κλήση `require('http')`.

Οι διεπαφές HTTP στο Node.js έχουν σχεδιαστεί για να υποστηρίζουν πολλά χαρακτηριστικά των πρωτοκόλλων που είναι κατά παράδοση δύσκολα στη χρήση. Ειδικότερα, μεγάλα, ενδεχομένως κωδικοποιημένα μπλοκ μηνυμάτων. Η διεπαφή έχει σχεδιαστεί να μην μεταφέρει buffer ολόκληρων αιτημάτων ή απαντήσεων — ο χρήστης μπορεί να αποκτήσει τα δεδομένα με ροή.

Τα μηνύματα κεφαλίδας HTTP παρουσιάζονται σαν αντικείμενα, όπως αυτό:
```js
{ 'content-length': '123',
  'content-type': 'text/plain',
  'connection': 'keep-alive',
  'host': 'mysite.com',
  'accept': '*/*' }
```

Τα κλειδιά είναι πεζοί χαρακτήρες. Οι τιμές δεν τροποποιούνται.

Για να υποστηριχθεί ολόκληρο το φάσμα των πιθανών εφαρμογών του πρωτοκόλλου HTTP, το HTTP API του Node.js είναι φτιαγμένο σε πολύ χαμηλό επίπεδο. Ασχολείται μόνο με τον χειρισμό ροών και την ανάλυση μηνυμάτων. Αναλύει ένα μήνυμα σε κεφαλίδες και σώμα, αλλά δεν αναλύει περαιτέρω τις κεφαλίδες ή το σώμα.

Δείτε το [`message.headers`][] για λεπτομέρειες στο πώς μεταχειρίζονται οι διπλότυπες κεφαλίδες.

Οι ανεπεξέργαστες κεφαλίδες, διατηρούνται όπως παραλήφθηκαν στην ιδιότητα `rawHeaders`, που είναι ένας πίνακας από `[key, value, key2, value2, ...]`. Για παράδειγμα, το προηγούμενο αντικείμενο μηνύματος κεφαλίδας, θα είχε μια λίστα `rawHeaders` όπως η παρακάτω:
```js
[ 'ConTent-Length', '123456',
  'content-LENGTH', '123',
  'content-type', 'text/plain',
  'CONNECTION', 'keep-alive',
  'Host', 'mysite.com',
  'accepT', '*/*' ]
```

## Class: http.Agent<!-- YAML
added: v0.3.4
-->Ο `Agent` είναι υπεύθυνος για την διαχείριση της διατήρησης συνδέσεων και την επαναχρησιμοποίηση τους, με τους πελάτες HTTP. Διατηρεί μια ουρά από αιτήματα σε αναμονή για κάθε υπολογιστή και θύρα, επαναχρησιμοποιώντας ένα μοναδικό socket σύνδεσης για κάθε αίτημα, μέχρι να αδειάσει η ουρά, οπότε και το socket καταστρέφεται ή τοποθετείται σε μια δεξαμενή όπου και κρατείται μέχρι να χρησιμοποιηθεί ξανά για αιτήματα του ίδιου υπολογιστή και της ίδιας θύρας. Το αν θα καταστραφεί ή θα μπει στην δεξαμενή, εξαρτάται από την [επιλογή](#http_new_agent_options) `keepAlive`.

Οι συνδέσεις σε δεξαμενή έχουν ενεργοποιημένο το TCP Keep-Alive, αλλά οι εξυπηρετητές ενδέχεται να κλείνουν τις αδρανείς συνδέσεις, στην οποία περίπτωση αφαιρούνται από την δεξαμενή και μια νέα σύνδεση θα γίνει όταν ένα νέο αίτημα HTTP δημιουργηθεί για αυτόν τον υπολογιστή και αυτή τη θύρα. Οι εξυπηρετητές ενδέχεται να αρνούνται τα πολλαπλά αιτήματα μέσω της ίδιας σύνδεσης, στην οποία περίπτωση η σύνδεση θα πρέπει να επαναδημιουργηθεί για κάθε αίτημα και δε μπορεί να γίνει δεξαμενή. Ο `Agent` θα συνεχίσει να στέλνει νέα αιτήματα στον εξυπηρετητή, αλλά το κάθε ένα θα γίνεται μέσω μιας νέας σύνδεσης.

Όταν μια σύνδεση κλείσει είτε από τον πελάτη ή από τον εξυπηρετητή, αφαιρείται από την δεξαμενή. Οποιαδήποτε αχρησιμοποίητα socket στην δεξαμενή, γίνονται unref για να μην κρατάνε την διαδικασία του Node.js ενεργή όταν δεν υπάρχουν εκκρεμή αιτήματα. (see [socket.unref()](net.html#net_socket_unref)).

Είναι καλή πρακτική, να γίνεται [`destroy()`][] ενός `Agent` όταν αυτός δεν χρησιμοποιείται άλλο, καθώς τα αχρησιμοποίητα Socket χρησιμοποιούν πόρους του Λειτουργικού Συστήματος.

Τα socket αφαιρούνται από έναν agent, όταν το socket μεταδίδει ένα συμβάν `'close'` ή ένα συμβάν `'agentRemove'`. Όταν υπάρχει πρόθεση να υπάρχει ένα αίτημα HTTP ανοιχτό για μεγάλο χρονικό διάστημα, χωρίς να είναι δεμένο σε έναν agent, μπορεί να γίνει κάτι σαν το παρακάτω:

```js
http.get(options, (res) => {
  // Do stuff
}).on('socket', (socket) => {
  socket.emit('agentRemove');
});
```

Ένας agent μπορεί επίσης να χρησιμοποιηθεί για ένα μοναδικό αίτημα. Με τη χρήση του `{agent: false}` ως επιλογή στη συνάρτηση `http.get()` ή στη συνάρτηση `http.request()`, θα χρησιμοποιηθεί ένας `Agent` μιας χρήσης με τις προεπιλεγμένες επιλογές για την σύνδεση πελάτη.

`agent:false`:

```js
http.get({
  hostname: 'localhost',
  port: 80,
  path: '/',
  agent: false  // create a new agent just for this one request
}, (res) => {
  // Do stuff with response
});
```

### new Agent([options])<!-- YAML
added: v0.3.4
-->* `options` {Object} Set of configurable options to set on the agent. Μπορεί να περιέχει τα παρακάτω πεδία:
  * `keepAlive` {boolean} Να παραμένουν ενεργά τα socket ακόμα και όταν δεν υπάρχουν εκκρεμή αιτήματα, ώστε να μπορούν να χρησιμοποιηθούν για μελλοντικά αιτήματα χωρίς την ανάγκη αποκατάστασης μιας σύνδεσης TCP. **Προεπιλογή:** `false`.
  * `keepAliveMsecs` {number} Όταν χρησιμοποιείται η επιλογή `keepAlive`, ορίζει την [αρχική καθυστέρηση](net.html#net_socket_setkeepalive_enable_initialdelay) των πακέτων TCP Keep-Alive. Αγνοείται όταν η επιλογή `keepAlive` είναι `false` ή `undefined`. **Προεπιλογή:** `1000`.
  * `maxSockets` {number} Ο μέγιστος αριθμός socket που επιτρέπονται ανά υπολογιστή. **Προεπιλογή:** `Infinity`.
  * `maxFreeSockets` {number} Μέγιστος αριθμός ανοιχτών socket που μπορούν να μείνουν ανοιχτά σε ελεύθερη κατάσταση. Εφαρμόζεται μόνο αν το `keepAlive` έχει οριστεί ως `true`. **Προεπιλογή:** `256`.

Το προεπιλεγμένο [`http.globalAgent`][] που χρησιμοποιείται από την συνάρτηση [`http.request()`][] έχει όλες τις παραπάνω τιμές ορισμένες στις προεπιλεγμένες τιμές τους.

Για να γίνει ρύθμιση οποιασδήποτε από τις παραπάνω τιμές, πρέπει να δημιουργηθεί ένα προσαρμοσμένο [`http.Agent`][].

```js
const http = require('http');
const keepAliveAgent = new http.Agent({ keepAlive: true });
options.agent = keepAliveAgent;
http.request(options, onResponseCallback);
```

### agent.createConnection(options[, callback])<!-- YAML
added: v0.11.4
-->* `options` {Object} Επιλογές που περιέχουν τα στοιχεία σύνδεσης. Δείτε την συνάρτηση [`net.createConnection()`][] για τη μορφή των επιλογών της
* `callback` {Function} Η συνάρτηση Callback που παραλαμβάνει το δημιουργημένο socket
* Επιστρέφει: {net.Socket}

Δημιουργεί ένα socket/μια ροή που μπορεί να χρησιμοποιηθεί σε αιτήματα HTTP.

Από προεπιλογή, αυτή η συνάρτηση είναι ίδια με την συνάρτηση [`net.createConnection()`][]. Ωστόσο, ένας προσαρμοσμένος agent μπορεί να παρακάμψει αυτή τη μέθοδο, σε περίπτωση που ζητείται μεγαλύτερη προσαρμοστικότητα.

Ένα socket/μια ροή μπορεί να παρέχεται με έναν από τους 2 παρακάτω τρόπους: με την επιστροφή του socket/της ροής από αυτήν την συνάρτηση, ή με το πέρασμα του socket/της ροής στο `callback`.

Το `callback` έχει υπογραφή `(err, stream)`.

### agent.keepSocketAlive(socket)<!-- YAML
added: v8.1.0
-->* `socket` {net.Socket}

Called when `socket` is detached from a request and could be persisted by the Agent. Η προεπιλεγμένη συμπεριφορά είναι:

```js
socket.setKeepAlive(true, this.keepAliveMsecs);
socket.unref();
return true;
```

Αυτή η μέθοδος μπορεί να παρακαμφθεί από μια συγκεκριμένη subclass του `Agent`. Εάν αυτή η μέθοδος επιστρέψει μια τιμή falsy, το socket θα καταστραφεί αντί να διατηρηθεί για χρήση με το επόμενο αίτημα.

### agent.reuseSocket(socket, request)<!-- YAML
added: v8.1.0
-->* `socket` {net.Socket}
* `request` {http.ClientRequest}

Καλείται όταν ένα `socket` έχει συνδεθεί στο `request` αφού έχει διατηρηθεί λόγω των επιλογών keep-alive. Η προεπιλεγμένη συμπεριφορά είναι:

```js
socket.ref();
```

Αυτή η μέθοδος μπορεί να παρακαμφθεί από μια συγκεκριμένη subclass του `Agent`.

### agent.destroy()<!-- YAML
added: v0.11.4
-->Καταστρέφει όλα τα socket που είναι σε χρήση από τον agent αυτή τη στιγμή.

Συνήθως, δεν χρειάζεται να γίνει αυτό. Ωστόσο, αν χρησιμοποιείτε έναν agent με ενεργό το `keepAlive`, τότε το καλύτερο είναι να γίνεται ρητός τερματισμός του agent όταν δεν θα χρησιμοποιηθεί άλλο. Διαφορετικά, τα socket μπορεί να παραμείνουν ανοιχτά για μεγάλο χρονικό διάστημα πριν ο εξυπηρετητής τερματίσει την λειτουργία τους.

### agent.freeSockets<!-- YAML
added: v0.11.4
-->* {Object}

Ένα αντικείμενο που περιέχει πίνακες με socket που αναμένουν την χρήση τους από τον agent, όταν έχει ενεργοποιηθεί το `keepAlive`. Να μην τροποποιηθεί.

### agent.getName(options)
<!-- YAML
added: v0.11.4
-->

* `options` {Object} A set of options providing information for name generation
  * `host` {string} A domain name or IP address of the server to issue the request to
  * `port` {number} Θύρα του απομακρυσμένου εξυπηρετητή
  * `localAddress` {string} Τοπική διεπαφή η οποία θα δεσμευτεί για συνδέσεις δικτύου όταν γίνεται έκδοση του αιτήματος
  * `family` {integer} Πρέπει να είναι 4 ή 6 εάν δεν ισούται με `undefined`.
* Επιστρέφει: {string}

Λαμβάνει ένα μοναδικό όνομα για ένα σύνολο επιλογών αιτημάτων, για τον προσδιορισμό της επαναχρησιμοποίησης μιας σύνδεσης. Για έναν HTTP agent, η συνάρτηση επιστρέφει `host:port:localAddress` ή `host:port:localAddress:family`. Για έναν HTTPS agent, το όνομα συμπεριλαμβάνει την αρχή πιστοποίησης, το πιστοποιητικό, τους cipher και άλλες συγκεκριμένες HTTPS/TLS επιλογές, για τον προσδιορισμό της επαναχρησιμοποίησης του socket.

### agent.maxFreeSockets<!-- YAML
added: v0.11.7
-->* {number}

Από προεπιλογή, είναι ορισμένο ως 256. Για agents με ενεργοποιημένο το `keepAlive`, αυτό ορίζει τον μέγιστο αριθμό των socket που μπορούν να παραμείνουν ανοιχτά σε ελεύθερη κατάσταση.

### agent.maxSockets<!-- YAML
added: v0.3.6
-->* {number}

Από προεπιλογή, είναι ορισμένο ως Infinity. Προσδιορίζει πόσα παράλληλα socket μπορεί να κρατάει ανοιχτά ο agent ανά προέλευση. Η προέλευση είναι η τιμή επιστροφής της συνάρτησης [`agent.getName()`][].

### agent.requests<!-- YAML
added: v0.5.9
-->* {Object}

Ένα αντικείμενο που περιέχει την ουρά των αιτημάτων που δεν έχουν ανατεθεί ακόμα σε κάποιο socket. Να μην τροποποιηθεί.

### agent.sockets
<!-- YAML
added: v0.3.6
-->

* {Object}

Ένα αντικείμενο που περιέχει πίνακες των socket που χρησιμοποιούνται αυτή τη στιγμή από τον agent. Να μην τροποποιηθεί.

## Class: http.ClientRequest<!-- YAML
added: v0.1.17
-->Αυτό το αντικείμενο δημιουργείται εσωτερικά και επιστρέφεται από την συνάρτηση [`http.request()`][]. Αντιπροσωπεύει ένα αίτημα _in-progress_, του οποίου οι κεφαλίδες έχουν ήδη μπει στην ουρά. Η κεφαλίδα μπορεί ακόμα να μεταβληθεί χρησιμοποιώντας τις συναρτήσεις API [`setHeader(name, value)`][], [`getHeader(name)`][], [`removeHeader(name)`][]. Η πραγματική κεφαλίδα θα σταλεί μαζί με το πρώτο κομμάτι δεδομένων ή όταν γίνει κλήση της συνάρτησης [`request.end()`][].

Για να λάβετε την απάντηση, προσθέστε έναν ακροατή [`'response'`][] στο αντικείμενο της αίτησης. To [`'response'`][] θα μεταδοθεί από το αντικείμενο του αιτήματος όταν ληφθούν οι κεφαλίδες της απόκρισης. Το συμβάν [`'response'`][] εκτελείται με μια παράμετρο, η οποία είναι ένα στιγμιότυπο του [`http.IncomingMessage`][].

Κατά τη διάρκεια του συμβάντος [`'response'`][], μπορούν να προστεθούν ακροατές στο αντικείμενο απόκρισης· ιδιαίτερα για την ακρόαση του συμβάντος `'data'`.

Αν δεν προστεθεί χειριστής [`'response'`][], τότε η απόκριση θα απορρίπτεται εξ'ολοκλήρου. Ωστόσο, αν προστεθεί χειριστής του συμβάντος [`'response'`][], τότε τα δεδομένα από την απόκριση του αντικειμένου **πρέπει** να καταναλωθούν, είτε με την κλήση της συνάρτησης `response.read()` όταν υπάρχει ένα συμβάν `'readable'`, ή με την προσθήκη ενός χειριστή `'data'`, ή με την κλήση της μεθόδου `.resume()`. Μέχρι να καταναλωθούν όλα τα δεδομένα, το συμβάν `'end'` δε θα ενεργοποιηθεί. Επίσης, μέχρι να διαβαστούν όλα τα δεδομένα, θα καταναλώνει μνήμη πράγμα που τελικά μπορεί να οδηγήσει σε σφάλμα 'process out of memory'.

*Note*: Node.js does not check whether Content-Length and the length of the body which has been transmitted are equal or not.

Το αίτημα υλοποιεί την διεπαφή [Επεξεργάσιμης Ροής](stream.html#stream_class_stream_writable). Αυτό είναι ένα [`EventEmitter`][] με τα ακόλουθα συμβάντα:

### Συμβάν: 'abort'<!-- YAML
added: v1.4.1
-->Μεταδίδεται όταν το αίτημα έχει ματαιωθεί από τον πελάτη. Αυτό το συμβάν μεταδίδεται μόνο στην πρώτη κλήση του `abort()`.

### Συμβάν: 'connect'<!-- YAML
added: v0.7.0
-->* `response` {http.IncomingMessage}
* `socket` {net.Socket}
* `head` {Buffer}

Μεταδίδεται κάθε φορά που ο εξυπηρετητής αποκρίνεται σε ένα αίτημα με μια μέθοδο `CONNECT`. If this event is not being listened for, clients receiving a `CONNECT` method will have their connections closed.

Ένα ζευγάρι εξυπηρετητή και πελάτη, που επιδεικνύει την ακρόαση του συμβάντος `'connect'`:

```js
const http = require('http');
const net = require('net');
const url = require('url');

// Δημιουργία ενός HTTP tunneling proxy
const proxy = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('okay');
});
proxy.on('connect', (req, cltSocket, head) => {
  // σύνδεση στον εξυπηρετητή προέλευσης
  const srvUrl = url.parse(`http://${req.url}`);
  const srvSocket = net.connect(srvUrl.port, srvUrl.hostname, () => {
    cltSocket.write('HTTP/1.1 200 Connection Established\r\n' +
                    'Proxy-agent: Node.js-Proxy\r\n' +
                    '\r\n');
    srvSocket.write(head);
    srvSocket.pipe(cltSocket);
    cltSocket.pipe(srvSocket);
  });
});

// τώρα που ο proxy εκτελείται
proxy.listen(1337, '127.0.0.1', () => {

  // δημιουργία αιτήματος σε ένα proxy tunnel
  const options = {
    port: 1337,
    hostname: '127.0.0.1',
    method: 'CONNECT',
    path: 'www.google.com:80'
  };

  const req = http.request(options);
  req.end();

  req.on('connect', (res, socket, head) => {
    console.log('got connected!');

    // δημιουργία αιτήματος μέσω ενός HTTP tunnel
    socket.write('GET / HTTP/1.1\r\n' +
                 'Host: www.google.com:80\r\n' +
                 'Connection: close\r\n' +
                 '\r\n');
    socket.on('data', (chunk) => {
      console.log(chunk.toString());
    });
    socket.on('end', () => {
      proxy.close();
    });
  });
});
```

### Συμβάν: 'continue'<!-- YAML
added: v0.3.2
-->Μεταδίδεται όταν ο εξυπηρετητής αποστέλλει μια απόκριση HTTP '100 Continue', συνήθως επειδή το αίτημα περιείχε το 'Expect: 100-continue'. Αυτή είναι μια οδηγία που ο πελάτης θα πρέπει να αποστείλει το σώμα του αιτήματος.

### Συμβάν: 'response'<!-- YAML
added: v0.1.0
-->* `response` {http.IncomingMessage}

Μεταδίδεται όταν ληφθεί μια απόκριση σε αυτό το αίτημα. Το συμβάν μεταδίδεται μόνο μια φορά.

### Συμβάν: 'socket'<!-- YAML
added: v0.5.3
-->* `socket` {net.Socket}

Μεταδίδεται αφού ένα socket αντιστοιχιστεί σε αυτό το αίτημα.

### Συμβάν: 'timeout'<!-- YAML
added: v0.7.8
-->Μεταδίδεται όταν το υποκείμενο socket εξαντλεί το χρονικό περιθώριο λόγω αδράνειας. Αυτό ειδοποιεί, μόνο, πως το socket έχει μείνει αδρανές. Το αίτημα πρέπει να ματαιωθεί χειροκίνητα.

Δείτε επίσης: [`request.setTimeout()`][]

### Συμβάν: 'upgrade'<!-- YAML
added: v0.1.94
-->* `response` {http.IncomingMessage}
* `socket` {net.Socket}
* `head` {Buffer}

Μεταδίδεται κάθε φορά που ο εξυπηρετητής αποκρίνεται σε ένα αίτημα με αναβάθμιση. If this event is not being listened for, clients receiving an upgrade header will have their connections closed.

Ένα ζευγάρι εξυπηρετητή και πελάτη, που επιδεικνύει την ακρόαση του συμβάντος `'upgrade'`.

```js
const http = require('http');

// Δημιουργία ενός εξυπηρετητή HTTP
const srv = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('okay');
});
srv.on('upgrade', (req, socket, head) => {
  socket.write('HTTP/1.1 101 Web Socket Protocol Handshake\r\n' +
               'Upgrade: WebSocket\r\n' +
               'Connection: Upgrade\r\n' +
               '\r\n');

  socket.pipe(socket); // επιστροφή echo
});

// τώρα που ο εξυπηρετητής τρέχει
srv.listen(1337, '127.0.0.1', () => {

  // δημιουργία αιτήματος
  const options = {
    port: 1337,
    hostname: '127.0.0.1',
    headers: {
      'Connection': 'Upgrade',
      'Upgrade': 'websocket'
    }
  };

  const req = http.request(options);
  req.end();

  req.on('upgrade', (res, socket, upgradeHead) => {
    console.log('got upgraded!');
    socket.end();
    process.exit(0);
  });
});
```

### request.abort()<!-- YAML
added: v0.3.8
-->Σημειώνει πως το αίτημα ματαιώνεται. Η κλήση αυτής της μεθόδου θα προκαλέσει την απόρριψη των εναπομεινάντων δεδομένων του αιτήματος, καθώς και την καταστροφή του socket.

### request.aborted<!-- YAML
added: v0.11.14
-->Αν ένα αίτημα έχει ματαιωθεί, αυτή τη τιμή είναι ο στιγμή που ακυρώθηκε το αίτημα, σε χιλιοστά του δευτερολέπτου από την 1η Ιανουαρίου 1970 00:00:00 UTC.

### request.connection<!-- YAML
added: v0.3.0
-->* {net.Socket}

See [`request.socket`][]

### request.end(\[data[, encoding]\]\[, callback\])<!-- YAML
added: v0.1.90
-->* `data` {string|Buffer}
* `encoding` {string}
* `callback` {Function}

Τελειώνει την αποστολή του αιτήματος. Αν κάποια μέρη του σώματος δεν έχουν αποσταλεί, θα προστεθούν στην ροή. Αν το αίτημα είναι τεμαχισμένο, αυτό θα στείλει τον τερματισμό `'0\r\n\r\n'`.

Ο ορισμός του `data`, είναι ισοδύναμος με την κλήση του [`request.write(data, encoding)`][] ακολουθούμενου από `request.end(callback)`.

Αν έχει οριστεί το `callback`, τότε θα κληθεί με την ολοκλήρωση του αιτήματος ροής.

### request.flushHeaders()<!-- YAML
added: v1.6.0
-->Εκκαθάριση των κεφαλίδων του αιτήματος.

Για λόγους αποδοτικότητας, το Node.js κάνει προσωρινή αποθήκευση των κεφαλίδων του αιτήματος μέχρι να κληθεί το `request.end()` ή μέχρι να γραφτεί το πρώτο τμήμα των δεδομένων του αιτήματος. Στη συνέχεια, προσπαθεί να εισάγει όλες τις κεφαλίδες και τα δεδομένα του αιτήματος σε ένα πακέτο TCP.

Αυτό συνήθως είναι το επιθυμητό (εξοικονομεί μια πλήρη διαδρομή TCP), αλλά όχι όταν τα πρώτα δεδομένα δεν έχουν αποσταλεί μέχρι πιθανώς πολύ αργότερα. Το `request.flushHeaders()` αγνοεί οποιαδήποτε βελτιστοποίηση και ξεκινάει το αίτημα άμεσα.

### request.getHeader(name)<!-- YAML
added: v1.6.0
-->* `name` {string}
* Επιστρέφει: {string}

Διαβάζει μια από τις κεφαλίδες του αιτήματος. Σημειώστε πως δεν γίνεται διάκριση πεζών-κεφαλαίων στο όνομα.

Παράδειγμα:
```js
const contentType = request.getHeader('Content-Type');
```

### request.removeHeader(name)
<!-- YAML
added: v1.6.0
-->

* `name` {string}

Αφαιρεί μια κεφαλίδα που έχει ήδη οριστεί στο αντικείμενο κεφαλίδων.

Παράδειγμα:
```js
request.removeHeader('Content-Type');
```

### request.setHeader(name, value)
<!-- YAML
added: v1.6.0
-->

* `name` {string}
* `value` {string}

Ορίζει μια μοναδική τιμή για το αντικείμενο κεφαλίδων. Αν αυτή η κεφαλίδα υπάρχει ήδη στις κεφαλίδες προς αποστολή, η τιμή του θα αντικατασταθεί με την ορισμένη. Χρησιμοποιήστε έναν πίνακα με string εδώ, για να αποστείλετε πολλαπλές κεφαλίδες με το ίδιο όνομα.

Παράδειγμα:
```js
request.setHeader('Content-Type', 'application/json');
```

ή

```js
request.setHeader('Set-Cookie', ['type=ninja', 'language=javascript']);
```

### request.setNoDelay([noDelay])<!-- YAML
added: v0.5.9
-->* `noDelay` {boolean}

Όταν ανατεθεί ένα socket σε αυτό το αίτημα και γίνει η σύνδεση, θα γίνει κλήση του [`socket.setNoDelay()`][].

### request.setSocketKeepAlive(\[enable\]\[, initialDelay\])<!-- YAML
added: v0.5.9
-->* `enable` {boolean}
* `initialDelay` {number}

Όταν ανατεθεί ένα socket σε αυτό το αίτημα και γίνει η σύνδεση, θα γίνει κλήση του [`socket.setKeepAlive()`][].

### request.setTimeout(timeout[, callback])
<!-- YAML
added: v0.5.9
-->

* `timeout` {number} Χιλιοστά του Δευτερολέπτου πριν την εξάντληση του χρονικού ορίου του αιτήματος.
* `callback` {Function} Προαιρετική συνάρτηση που θα κληθεί όταν εξαντληθεί το χρονικό περιθώριο ενός αιτήματος. Same as binding to the `timeout` event.

If no socket is assigned to this request then [`socket.setTimeout()`][] will be called immediately. Otherwise [`socket.setTimeout()`][] will be called after the assigned socket is connected.

Returns `request`.

### request.socket<!-- YAML
added: v0.3.0
-->* {net.Socket}

Αναφορά στο υποκείμενο socket. Συνήθως οι χρήστες δε θέλουν πρόσβαση σε αυτήν την ιδιότητα. Ειδικότερα, το socket δε θα μεταδώσει συμβάντα `'readable'`, εξαιτίας του τρόπου που ο αναλυτής πρωτοκόλλου συνδέεται στο socket. Μετά το `response.end()`, η ιδιότητα εκμηδενίζεται. Μπορείτε επίσης να αποκτήσετε πρόσβαση στο `socket` μέσω του `request.connection`.

Παράδειγμα:

```js
const http = require('http');
const options = {
  host: 'www.google.com',
};
const req = http.get(options);
req.end();
req.once('response', (res) => {
  const ip = req.socket.localAddress;
  const port = req.socket.localPort;
  console.log(`Η διεύθυνση IP σας είναι ${ip} και η θύρα προέλευσης είναι ${port}.`);
  // κατανάλωση απόκρισης του αντικειμένου
});
```

### request.write(chunk\[, encoding\]\[, callback\])<!-- YAML
added: v0.1.29
-->* `chunk` {string|Buffer}
* `encoding` {string}
* `callback` {Function}

Αποστέλλει ένα τμήμα του σώματος. Καλώντας πολλές φορές αυτή τη μέθοδο, το σώμα ενός αιτήματος μπορεί να αποσταλεί σε έναν εξυπηρετητή — σε αυτήν την περίπτωση προτείνεται να γίνει χρήση της κεφαλίδας `['Transfer-Encoding', 'chunked']` κατά τη δημιουργία του αιτήματος.

Η παράμετρος `encoding` είναι προαιρετική και ισχύει μόνο όταν το `chunk` είναι string. Από προεπιλογή είναι `'utf8'`.

Η παράμετρος `callback` είναι προαιρετική και μπορεί να κληθεί όταν αυτό το κομμάτι δεδομένων έχει εκκαθαριστεί.

Επιστρέφει `true` εάν το σύνολο των δεδομένων έχει εκκαθαριστεί με επιτυχία στην προσωρινή μνήμη αποθήκευσης του πυρήνα. Επιστρέφει `false` αν όλα ή μέρος των δεδομένων έχουν μπει σε ουρά στη μνήμη του χρήστη. Το `'drain'` θα μεταδοθεί όταν ο χώρος προσωρινής αποθήκευσης είναι πάλι ελεύθερος.

## Class: http.Server<!-- YAML
added: v0.1.17
-->This class inherits from [`net.Server`][] and has the following additional events:

### Συμβάν: 'checkContinue'<!-- YAML
added: v0.3.0
-->* `request` {http.IncomingMessage}
* `response` {http.ServerResponse}

Μεταδίδεται κάθε φορά που λαμβάνεται ένα αίτημα με κωδικό HTTP `Expect: 100-continue`. Αν δε γίνεται ακρόαση για αυτό το συμβάν, ο εξυπηρετητής θα αποκριθεί αυτόματα με απάντηση `100 Continue` ανάλογα με την περίπτωση.

Handling this event involves calling [`response.writeContinue()`][] if the client should continue to send the request body, or generating an appropriate HTTP response (e.g. 400 Bad Request) if the client should not continue to send the request body.

Σημειώστε πως όταν αυτό το συμβάν μεταδίδεται και χειρίζεται, το συμβάν [`'request'`][] δεν θα μεταδοθεί.

### Συμβάν: 'checkExpectation'<!-- YAML
added: v5.5.0
-->* `request` {http.IncomingMessage}
* `response` {http.ServerResponse}

Μεταδίδεται κάθε φορά που λαμβάνεται ένα αίτημα HTTP με κεφαλίδα `Expect`, όταν η τιμή δεν είναι `100-continue`. Αν δε γίνεται ακρόαση για αυτό το συμβάν, ο εξυπηρετητής θα αποκριθεί αυτόματα με απάντηση `417 Expectation Failed` ανάλογα με την περίπτωση.

Σημειώστε πως όταν αυτό το συμβάν μεταδίδεται και χειρίζεται, το συμβάν [`'request'`][] δεν θα μεταδοθεί.

### Συμβάν: 'clientError'<!-- YAML
added: v0.1.94
changes:
  - version: v6.0.0
    pr-url: https://github.com/nodejs/node/pull/4557
    description: The default action of calling `.destroy()` on the `socket`
                 will no longer take place if there are listeners attached
                 for `clientError`.
  - version: v8.10.0
    pr-url: https://github.com/nodejs/node/pull/17672
    description: The rawPacket is the current buffer that just parsed. Adding
                 this buffer to the error object of clientError event is to make
                 it possible that developers can log the broken packet.
-->* `exception` {Error}
* `socket` {net.Socket}

Αν η σύνδεση ενός πελάτη μεταδώσει ένα συμβάν `'error'`, θα προωθηθεί εδώ. Η ακρόαση του συμβάντος είναι υπεύθυνη για το κλείσιμο/την καταστροφή του υποκείμενου socket. Για παράδειγμα, κάποιος μπορεί να θέλει να κλείσει ένα socket πιο δυναμικά, με μια προσαρμοσμένη απόκριση HTTP αντί να αποκόψει απότομα την σύνδεση.

Η προεπιλεγμένη συμπεριφορά είναι να κλείσει το socket με απόκριση HTTP '400 Bad Request' εάν αυτό είναι δυνατόν, διαφορετικά το socket καταστρέφεται αμέσως.

Το `socket` είναι το αντικείμενο [`net.Socket`][] από το οποίο προήλθε το σφάλμα.

```js
const http = require('http');

const server = http.createServer((req, res) => {
  res.end();
});
server.on('clientError', (err, socket) => {
  socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
});
server.listen(8000);
```

Όταν παρουσιαστεί το συμβάν `'clientError'`, δεν υπάρχει κανένα αντικείμενο `request` ή `response`, οπότε οποιαδήποτε απόκριση HTTP αποσταλεί, συμπεριλαμβανομένων των αποκρίσεων κεφαλίδων και φορτίου, *πρέπει* να γραφτεί απευθείας στο αντικείμενο `socket`. Πρέπει να ληφθεί μέριμνα για να εξασφαλισθεί ότι η απόκριση είναι ένα σωστά μορφοποιημένο μήνυμα απόκρισης HTTP.

Το `err` είναι ένα στιγμιότυπο του `Error` με δύο επιπλέον στήλες:

+ `bytesParsed`: ο αριθμός των byte του πακέτου αιτήματος που η Node.js έχει πιθανώς αναλύσει σωστά,
+ `rawPacket`: το ακατέργαστο πακέτο του τρέχοντος αιτήματος.

### Συμβάν: 'close'<!-- YAML
added: v0.1.4
-->Μεταδίδεται όταν ο εξυπηρετητής τερματίζει τη λειτουργία του.

### Συμβάν: 'connect'<!-- YAML
added: v0.7.0
-->* `request` {http.IncomingMessage} Οι παράμετροι για το αίτημα HTTP, όπως εντοπίζονται στο συμβάν [`'request'`][]
* `socket` {net.Socket} Το δικτυακό socket μεταξύ του εξυπηρετητή και του πελάτη
* `head` {Buffer} Το πρώτο πακέτο της σήραγγας ροής (ενδέχεται να είναι κενό)

Μεταδίδεται κάθε φορά που ένας πελάτης στέλνει αίτημα HTTP της μεθόδου `CONNECT`. Αν δεν γίνεται ακρόαση αυτού του συμβάντος, θα γίνει τερματισμός της σύνδεσης των πελατών που αιτούνται την μέθοδο `CONNECT`.

Αφού μεταδοθεί αυτό το συμβάν, το socket του αιτήματος δε θα έχει ακρόαση του συμβάντος `'data'`, που σημαίνει πως θα πρέπει να δεσμευτεί με σκοπό να διαχειριστεί τα δεδομένα που αποστέλλονται στον εξυπηρετητή μέσω αυτού του socket.

### Συμβάν: 'connection'<!-- YAML
added: v0.1.0
-->* `socket` {net.Socket}

Αυτό το συμβάν μεταδίδεται όταν δημιουργείται μια νέα ροή δεδομένων TCP. Το `socket` είναι συνήθως ένα αντικείμενο τύπου [`net.Socket`][]. Συνήθως οι χρήστες δε θέλουν πρόσβαση σε αυτό το συμβάν. Ειδικότερα, το socket δε θα μεταδώσει συμβάντα `'readable'`, εξαιτίας του τρόπου που ο αναλυτής πρωτοκόλλου συνδέεται στο socket. Μπορείτε επίσης να αποκτήσετε πρόσβαση στο `socket` κατά τη διάρκεια του συμβάντος `request.connection`.

*Note*: This event can also be explicitly emitted by users to inject connections into the HTTP server. Σε αυτήν την περίπτωση, μπορεί να μεταβιβαστεί οποιαδήποτε ροή [`Duplex`][].

### Συμβάν: 'request'<!-- YAML
added: v0.1.0
-->* `request` {http.IncomingMessage}
* `response` {http.ServerResponse}

Μεταδίδεται κάθε φορά που υπάρχει ένα αίτημα. Σημειώστε ότι ενδέχεται να υπάρχουν πολλαπλά αιτήματα ανά σύνδεση (σε περίπτωση συνδέσεων με κεφαλίδα HTTP Keep-Alive).

### Συμβάν: 'upgrade'<!-- YAML
added: v0.1.94
-->* `request` {http.IncomingMessage} Οι παράμετροι για το αίτημα HTTP, όπως εντοπίζονται στο συμβάν [`'request'`][]
* `socket` {net.Socket} Το δικτυακό socket μεταξύ του εξυπηρετητή και του πελάτη
* `head` {Buffer} Το πρώτο πακέτο της αναβαθμισμένης ροής (ενδέχεται να είναι κενό)

Μεταδίδεται κάθε φορά που ένας πελάτης αιτείται μια αναβάθμιση HTTP. If this event is not listened for, then clients requesting an upgrade will have their connections closed.

Αφού μεταδοθεί αυτό το συμβάν, το socket του αιτήματος δε θα έχει ακρόαση του συμβάντος `'data'`, που σημαίνει πως θα πρέπει να δεσμευτεί με σκοπό να διαχειριστεί τα δεδομένα που αποστέλλονται στον εξυπηρετητή μέσω αυτού του socket.

### server.close([callback])<!-- YAML
added: v0.1.90
-->* `callback` {Function}

Διακόπτει την αποδοχή νέων συνδέσεων από τον εξυπηρετητή. Δείτε [`net.Server.close()`][].

### server.listen()

Εκκινεί τον εξυπηρετητή HTTP για ακρόαση συνδέσεων. Η μέθοδος είναι πανομοιότυπη με το [`server.listen()`][] από το [`net.Server`][].

### server.listening<!-- YAML
added: v5.7.0
-->* {boolean}

A Boolean indicating whether or not the server is listening for connections.

### server.maxHeadersCount<!-- YAML
added: v0.7.0
-->* {number} **Προεπιλογή:** `2000`

Προσθέτει μέγιστο όριο στον αριθμό εισερχομένων κεφαλίδων. If set to 0 - no limit will be applied.

### server.headersTimeout<!-- YAML
added: v8.14.0
-->* {number} **Προεπιλογή:** `40000`

Limit the amount of time the parser will wait to receive the complete HTTP headers.

In case of inactivity, the rules defined in \[server.timeout\]\[\] apply. However, that inactivity based timeout would still allow the connection to be kept open if the headers are being sent very slowly (by default, up to a byte per 2 minutes). In order to prevent this, whenever header data arrives an additional check is made that more than `server.headersTimeout` milliseconds has not passed since the connection was established. If the check fails, a `'timeout'` event is emitted on the server object, and (by default) the socket is destroyed. See \[server.timeout\]\[\] for more information on how timeout behaviour can be customised.

### server.setTimeout(\[msecs\]\[, callback\])<!-- YAML
added: v0.9.12
-->* `msecs` {number} **Προεπιλογή:** `120000` (2 λεπτά)
* `callback` {Function}

Ορίζει την τιμή της εξάντλησης του χρονικού ορίου για τα socket, και μεταδίδει ένα συμβάν `'timeout'` στο αντικείμενο του εξυπηρετητή, μεταβιβάζοντας το socket σαν παράμετρο, αν γίνει εξάντληση του χρονικού ορίου.

Αν γίνεται ακρόαση του συμβάντος `'timeout'` στο αντικείμενο του εξυπηρετητή, τότε θα κληθεί με το socket που έχει εξαντληθεί το χρονικό όριο, σαν παράμετρος.

Από προεπιλογή, η τιμή του χρονικού ορίου εξάντλησης του εξυπηρετητή είναι 2 λεπτά, και τα socket καταστρέφονται αυτόματα αν εξαντληθεί το χρονικό τους όριο. Ωστόσο, αν έχει έχει ανατεθεί στο συμβάν `'timeout'` του εξυπηρετητή μια συνάρτηση callback, θα πρέπει να γίνεται ρητός χειρισμός των εξαντλήσεων του χρονικού ορίου.

Returns `server`.

### server.timeout<!-- YAML
added: v0.9.12
-->* {number} Χρονικό όριο σε χιλιοστά δευτερολέπτου. **Προεπιλογή:** `120000` (2 λεπτά).

Ο χρόνος αδράνειας σε χιλιοστά δευτερολέπτου, πριν υποτεθεί ότι έχει εξαντληθεί το χρονικό περιθώριο του socket.

Μια τιμή `0` θα απενεργοποιήσει την συμπεριφορά χρονικού ορίου στις εισερχόμενες συνδέσεις.

*Note*: The socket timeout logic is set up on connection, so changing this value only affects new connections to the server, not any existing connections.

### server.keepAliveTimeout<!-- YAML
added: v8.0.0
-->* {number} Χρονικό όριο σε χιλιοστά δευτερολέπτου. **Προεπιλογή:** `5000` (5 δευτερόλεπτα).

Ο χρόνος αδράνειας σε χιλιοστά δευτερολέπτου που θα πρέπει να περιμένει ο εξυπηρετητής για περαιτέρω δεδομένα, αφού έχει ολοκληρώσει την εγγραφή της τελευταίας απόκρισης, πριν την καταστροφή του socket. Αν ο εξυπηρετητής λάβει νέα δεδομένα πριν την εξάντληση του χρονικού ορίου του keep-alive, θα γίνει επαναφορά του χρονικού περιθωρίου αδράνειας του [`server.timeout`][].

A value of `0` will disable the keep-alive timeout behavior on incoming connections. A value of `0` makes the http server behave similarly to Node.js versions prior to 8.0.0, which did not have a keep-alive timeout.

*Note*: The socket timeout logic is set up on connection, so changing this value only affects new connections to the server, not any existing connections.

## Class: http.ServerResponse<!-- YAML
added: v0.1.17
-->Το αντικείμενο δημιουργείται εσωτερικά από έναν εξυπηρετητή HTTP — όχι από τον χρήστη. Μεταβιβάζεται ως η δεύτερη παράμετρος στο συμβάν [`'request'`][].

Η απόκριση εφαρμόζει, αλλά δεν κληρονομεί από την διασύνδεση [Εγγράψιμης Ροής](stream.html#stream_class_stream_writable). Αυτό είναι ένα [`EventEmitter`][] με τα ακόλουθα συμβάντα:

### Συμβάν: 'close'<!-- YAML
added: v0.6.7
-->Δηλώνει ότι η υποκείμενη σύνδεση έχει τερματιστεί πριν γίνει κλήση του [`response.end()`][] ή εκκαθάριση.

### Συμβάν: 'finish'<!-- YAML
added: v0.3.6
-->Μεταδίδεται όταν έχει αποσταλεί η απόκριση. Πιο συγκεκριμένα, αυτό το συμβάν μεταδίδεται όταν το τελευταίο κομμάτι των κεφαλίδων απόκρισης και του σώματος έχουν παραδοθεί στο λειτουργικό σύστημα για μετάδοση μέσω του δικτύου. Αυτό δεν υπονοεί ότι ο πελάτης έχει παραλάβει οτιδήποτε ακόμα.

Μετά από αυτό το συμβάν, δεν γίνεται μετάδοση άλλων συμβάντων στο αντικείμενο απόκρισης.

### response.addTrailers(headers)<!-- YAML
added: v0.3.0
-->* `headers` {Object}

Αυτή η μέθοδος προσθέτει τελικές κεφαλίδες HTTP (μια κεφαλίδα στο τέλος του μηνύματος) στην απόκριση.

Οι τελικές κεφαλίδες μεταδίδονται **μόνο** αν η κωδικοποίηση του τμήματος χρησιμοποιείται για την απόκριση, αν δεν χρησιμοποιείται (π.χ. το αίτημα ήταν HTTP/1.0), αυτές απορρίπτονται σιωπηλά.

Σημειώστε ότι το πρωτόκολλο HTTP απαιτεί την αποστολή της κεφαλίδας `Trailer` για να μεταδοθούν οι τελικές κεφαλίδες, με μια λίστα των πεδίων κεφαλίδων ως τιμή της. Για παράδειγμα,

```js
response.writeHead(200, { 'Content-Type': 'text/plain',
                          'Trailer': 'Content-MD5' });
response.write(fileData);
response.addTrailers({ 'Content-MD5': '7895bf4b8828b55ceaf47747b4bca667' });
response.end();
```

Η προσπάθεια ορισμού ονόματος πεδίου μιας κεφαλίδας ή τιμής που συμπεριλαμβάνει λανθασμένους χαρακτήρες, έχει ως αποτέλεσμα την εμφάνιση σφάλματος [`TypeError`][].


### response.connection<!-- YAML
added: v0.3.0
-->* {net.Socket}

Δείτε το [`response.socket`][].

### response.end(\[data\]\[, encoding\][, callback])<!-- YAML
added: v0.1.90
-->* `data` {string|Buffer}
* `encoding` {string}
* `callback` {Function}

Αυτή η μέθοδος αποστέλλει σήμα στον εξυπηρετητή ότι οι κεφαλίδες απόκρισης και το σώμα έχουν αποσταλεί, ο εξυπηρετητής θα πρέπει να θεωρήσει αυτό το μήνυμα ως ολοκληρωμένο. Η μέθοδος, `response.end()`, ΕΙΝΑΙ ΑΠΑΡΑΙΤΗΤΟ να καλείται σε κάθε απόκριση.

Ο ορισμός του `data`, είναι ισοδύναμος με την κλήση του [`response.write(data, encoding)`][] ακολουθούμενου από `response.end(callback)`.

Αν έχει οριστεί το `callback`, τότε θα κληθεί με την ολοκλήρωση του αιτήματος ροής.

### response.finished<!-- YAML
added: v0.0.2
-->* {boolean}

Τιμή Boolean που δηλώνει αν η απόκριση έχει ολοκληρωθεί ή όχι. Ξεκινάει ως `false`. Αφού εκτελεσθεί το [`response.end()`][], η τιμή του θα είναι `true`.

### response.getHeader(name)<!-- YAML
added: v0.4.0
-->* `name` {string}
* Επιστρέφει: {string}

Διαβάζει μια κεφαλίδα η οποία έχει προστεθεί στην ουρά, αλλά δεν έχει αποσταλεί στον πελάτη. Σημειώστε πως δεν γίνεται διάκριση πεζών-κεφαλαίων στο όνομα.

Παράδειγμα:

```js
const contentType = response.getHeader('content-type');
```

### response.getHeaderNames()<!-- YAML
added: v7.7.0
-->* Επιστρέφει: {Array}

Επιστρέφει έναν πίνακα που περιέχει τις μοναδικές τιμές των τρεχόντων εξερχομένων κεφαλίδων. Όλα τα ονόματα κεφαλίδων είναι με πεζούς χαρακτήρες.

Παράδειγμα:

```js
response.setHeader('Foo', 'bar');
response.setHeader('Set-Cookie', ['foo=bar', 'bar=baz']);

const headerNames = response.getHeaderNames();
// headerNames === ['foo', 'set-cookie']
```

### response.getHeaders()<!-- YAML
added: v7.7.0
-->* Επιστρέφει: {Object}

Επιστρέφει ένα ρηχό αντίγραφο των τρεχόντων εξερχομένων κεφαλίδων. Από την στιγμή που χρησιμοποιείται ένα ρηχό αντίγραφο, οι τιμές του πίνακα μπορούν να μεταλλαχθούν χωρίς περαιτέρω κλήσεις στις διάφορες μεθόδους που σχετίζονται με τις κεφαλίδες της ενότητας http. Τα κλειδιά του επιστρεφόμενου αντικειμένου είναι τα ονόματα των κεφαλίδων, και οι τιμές του είναι οι τιμές της αντίστοιχης κεφαλίδας. Όλα τα ονόματα κεφαλίδων είναι με πεζούς χαρακτήρες.

*Note*: The object returned by the `response.getHeaders()` method _does not_ prototypically inherit from the JavaScript `Object`. Αυτό σημαίνει ότι οι τυπικές μέθοδοι του `Object` όπως η μέθοδος `obj.toString()`, η μέθοδος `obj.hasOwnProperty()`, και άλλες μέθοδοι, δεν ορίζονται και *δεν θα λειτουργήσουν*.

Παράδειγμα:

```js
response.setHeader('Foo', 'bar');
response.setHeader('Set-Cookie', ['foo=bar', 'bar=baz']);

const headers = response.getHeaders();
// headers === { foo: 'bar', 'set-cookie': ['foo=bar', 'bar=baz'] }
```

### response.hasHeader(name)
<!-- YAML
added: v7.7.0
-->

* `name` {string}
* Επιστρέφει: {boolean}

Επιστρέφει `true` αν η κεφαλίδα που προσδιορίζεται ως `name` έχει οριστεί στις εξερχόμενες κεφαλίδες. Σημειώστε ότι δεν γίνεται διάκριση πεζών-κεφαλαίων στο όνομα της κεφαλίδας.

Παράδειγμα:

```js
const hasContentType = response.hasHeader('content-type');
```

### response.headersSent<!-- YAML
added: v0.9.3
-->* {boolean}

Boolean (μόνο για ανάγνωση). True αν οι κεφαλίδες έχουν αποσταλεί, false αν δεν έχουν αποσταλεί.

### response.removeHeader(name)<!-- YAML
added: v0.4.0
-->* `name` {string}

Αφαιρεί μια κεφαλίδα που έχει τοποθετηθεί σε ουρά για υπονοούμενη αποστολή.

Παράδειγμα:

```js
response.removeHeader('Content-Encoding');
```

### response.sendDate<!-- YAML
added: v0.7.5
-->* {boolean}

Όταν είναι True, η κεφαλίδα της Ημερομηνίας θα δημιουργηθεί με αυτόματο τρόπο και θα αποσταλεί με την απόκριση, αν δεν είναι ήδη ορισμένη ως κεφαλίδα. Από προεπιλογή είναι True.

Αυτό πρέπει να απενεργοποιηθεί μόνο για δοκιμές. Το πρωτόκολλο HTTP απαιτεί την κεφαλίδα της Ημερομηνίας στις αποκρίσεις.

### response.setHeader(name, value)
<!-- YAML
added: v0.4.0
-->

* `name` {string}
* `value` {string | string[]}

Ορίζει μια μοναδική τιμή κεφαλίδας για τις υπονοούμενες κεφαλίδες. Αν αυτή η κεφαλίδα υπάρχει ήδη στις κεφαλίδες προς αποστολή, η τιμή της θα αντικατασταθεί με την ορισμένη. Χρησιμοποιήστε έναν πίνακα με string εδώ, για να αποστείλετε πολλαπλές κεφαλίδες με το ίδιο όνομα.

Παράδειγμα:

```js
response.setHeader('Content-Type', 'text/html');
```

ή

```js
response.setHeader('Set-Cookie', ['type=ninja', 'language=javascript']);
```

Η προσπάθεια ορισμού ονόματος πεδίου μιας κεφαλίδας ή τιμής που συμπεριλαμβάνει λανθασμένους χαρακτήρες, έχει ως αποτέλεσμα την εμφάνιση σφάλματος [`TypeError`][].

When headers have been set with [`response.setHeader()`][], they will be merged with any headers passed to [`response.writeHead()`][], with the headers passed to [`response.writeHead()`][] given precedence.

```js
// επιστρέφει content-type = text/plain
const server = http.createServer((req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.setHeader('X-Foo', 'bar');
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('ok');
});
```

### response.setTimeout(msecs[, callback])<!-- YAML
added: v0.9.12
-->* `msecs` {number}
* `callback` {Function}

Ορίζει την τιμή της εξάντλησης του χρονικού περιθωρίου του Socket σε `msecs`. Αν έχει οριστεί ένα callback, τότε προστίθεται σαν ακροατής στο συμβάν `'timeout'` στην απόκριση του αντικειμένου.

Αν δεν έχει προστεθεί ακροατής για το `'timeout'` στο αίτημα, στην απόκριση ή στον εξυπηρετητή, τότε τα socket καταστρέφονται μόλις εξαντληθεί το χρονικό τους περιθώριο. Αν έχει οριστεί κάποιος χειριστής στο συμβάν `'timeout'` του αιτήματος, της απόκρισης ή του εξυπηρετητή, τότε η εξάντληση του χρονικού περιθωρίου των socket πρέπει να χειρίζεται ρητά.

Returns `response`.

### response.socket<!-- YAML
added: v0.3.0
-->* {net.Socket}

Αναφορά στο υποκείμενο socket. Συνήθως οι χρήστες δε θέλουν πρόσβαση σε αυτήν την ιδιότητα. Ειδικότερα, το socket δε θα μεταδώσει συμβάντα `'readable'`, εξαιτίας του τρόπου που ο αναλυτής πρωτοκόλλου συνδέεται στο socket. Μετά το `response.end()`, η ιδιότητα εκμηδενίζεται. Μπορείτε επίσης να αποκτήσετε πρόσβαση στο `socket` μέσω του `response.connection`.

Παράδειγμα:

```js
const http = require('http');
const server = http.createServer((req, res) => {
  const ip = res.socket.remoteAddress;
  const port = res.socket.remotePort;
  res.end(`Η διεύθυνση IP σας είναι ${ip} και η θύρα προέλευσης είναι ${port}..`);
}).listen(3000);
```

### response.statusCode<!-- YAML
added: v0.4.0
-->* {number}

Όταν χρησιμοποιούνται υπονοούμενες κεφαλίδες (χωρίς δηλαδή την ρητή κλήση του [`response.writeHead()`][]), αυτή η ιδιότητα ελέγχει τον κωδικό κατάστασης που θα αποσταλεί στον πελάτη όταν οι κεφαλίδες εκκαθαριστούν.

Παράδειγμα:

```js
response.statusCode = 404;
```

Αφού η κεφαλίδα απόκρισης αποσταλεί στον πελάτη, αυτή η ιδιότητα υποδεικνύει τον κωδικό κατάστασης που έχει αποσταλεί.

### response.statusMessage<!-- YAML
added: v0.11.8
-->* {string}

When using implicit headers (not calling [`response.writeHead()`][] explicitly), this property controls the status message that will be sent to the client when the headers get flushed. If this is left as `undefined` then the standard message for the status code will be used.

Παράδειγμα:

```js
response.statusMessage = 'Not found';
```

Αφού η κεφαλίδα απόκρισης αποσταλεί στον πελάτη, αυτή η ιδιότητα υποδεικνύει το μήνυμα κατάστασης που έχει αποσταλεί.

### response.write(chunk\[, encoding\]\[, callback\])<!-- YAML
added: v0.1.29
-->* `chunk` {string|Buffer}
* `encoding` {string} **Προεπιλογή:** `'utf8'`
* `callback` {Function}
* Επιστρέφει: {boolean}

Αν κληθεί αυτή η μέθοδος και δεν έχει κληθεί το [`response.writeHead()`][], θα γίνει εναλλαγή σε λειτουργία υπονοούμενων κεφαλίδων και θα γίνει εκκαθάριση των υπονοούμενων κεφαλίδων.

Αυτό στέλνει ένα κομμάτι του σώματος απόκρισης. Αυτή η μέθοδος μπορεί να κληθεί πολλαπλές φορές για να εφοδιάσει την ροή με τα επόμενα κομμάτια του σώματος.

Σημειώστε ότι στην ενότητα `http`, το σώμα απόκρισης παραλείπεται αν το αίτημα είναι ένα αίτημα HEAD. Παρομοίως, οι αποκρίσεις `204` και `304` _δεν πρέπει_ να συμπεριλαμβάνουν ένα σώμα απόκρισης.

Το `chunk` μπορεί να είναι ένα string ή ένα buffer. Αν το `chunk` είναι string, η δεύτερη παράμετρος καθορίζει πως θα γίνει η κωδικοποίησή του σε μια ροή byte. To `callback` θα κληθεί όταν αυτό το κομμάτι των δεδομένων εκκαθαριστεί.

*Note*: This is the raw HTTP body and has nothing to do with higher-level multi-part body encodings that may be used.

Την πρώτη φορά που θα κληθεί το [`response.write()`][], θα στείλει τις πληροφορίες κεφαλίδας που βρίσκονται στο buffer, καθώς και το πρώτο κομμάτι δεδομένων στον πελάτη. Τη δεύτερη φορά που θα κληθεί το [`response.write()`][], η Node.js υποθέτει ότι τα δεδομένα θα αποσταλούν ως ροή, κι έτσι στέλνει τα νέα δεδομένα ξεχωριστά. Δηλαδή η απόκριση τοποθετείται στο buffer μόνο μέχρι το πρώτο κομμάτι του σώματος.

Επιστρέφει `true` εάν το σύνολο των δεδομένων έχει εκκαθαριστεί με επιτυχία στην προσωρινή μνήμη αποθήκευσης του πυρήνα. Επιστρέφει `false` αν όλα ή μέρος των δεδομένων έχουν μπει σε ουρά στη μνήμη του χρήστη. Το `'drain'` θα μεταδοθεί όταν ο χώρος προσωρινής αποθήκευσης είναι πάλι ελεύθερος.

### response.writeContinue()<!-- YAML
added: v0.3.0
-->Στέλνει στον πελάτη ένα μήνυμα HTTP/1.1 100 Continue, υποδεικνύοντας ότι πρέπει να αποσταλεί το σώμα του αιτήματος. See the [`'checkContinue'`][] event on `Server`.

### response.writeHead(statusCode\[, statusMessage\]\[, headers\])<!-- YAML
added: v0.1.30
changes:
  - version: v5.11.0, v4.4.5
    pr-url: https://github.com/nodejs/node/pull/6291
    description: A `RangeError` is thrown if `statusCode` is not a number in
                 the range `[100, 999]`.
-->* `statusCode` {number}
* `statusMessage` {string}
* `headers` {Object}

Αποστέλλει μια κεφαλίδα απόκρισης στο αίτημα. Ο κωδικός κατάστασης είναι ένας 3ψήφιος κωδικός κατάστασης HTTP, όπως το `404`. Η τελευταία παράμετρος, `headers`, είναι οι κεφαλίδες απόκρισης. Προαιρετικά, μπορεί να οριστεί ένα αναγνώσιμο από ανθρώπους `statusMessage` ως δεύτερη παράμετρος.

Παράδειγμα:

```js
const body = 'hello world';
response.writeHead(200, {
  'Content-Length': Buffer.byteLength(body),
  'Content-Type': 'text/plain' });
```

Η μέθοδος πρέπει να κληθεί μόνο μια φορά σε ένα μήνυμα, και πρέπει να κληθεί πριν την κλήση του [`response.end()`][].

Αν κληθεί το [`response.write()`][] ή το [`response.end()`][] πριν την κλήση του, θα υπολογιστούν οι υπονοούμενες/μεταβαλλόμενες κεφαλίδες και θα γίνει η κλήση αυτής της συνάρτησης.

When headers have been set with [`response.setHeader()`][], they will be merged with any headers passed to [`response.writeHead()`][], with the headers passed to [`response.writeHead()`][] given precedence.

```js
// επιστρέφει content-type = text/plain
const server = http.createServer((req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.setHeader('X-Foo', 'bar');
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('ok');
});
```

Σημειώστε ότι το Content-Length ορίζεται σε byte και όχι σε αριθμό χαρακτήρων. Το παραπάνω παράδειγμα λειτουργεί επειδή το string `'hello world'` συμπεριλαμβάνει μόνο χαρακτήρες μονού byte. Αν το σώμα περιέχει χαρακτήρες διαφορετικής κωδικοποίησης, τότε θα πρέπει να χρησιμοποιηθεί το `Buffer.byteLength()` για να προσδιοριστεί ο αριθμός των byte στην συγκεκριμένη κωδικοποίηση. Επίσης, το node.js δεν ελέγχει εάν το Content-Length και το μέγεθος του σώματος που έχει μεταδοθεί είναι ίσα ή όχι.

Η προσπάθεια ορισμού ονόματος πεδίου μιας κεφαλίδας ή τιμής που συμπεριλαμβάνει λανθασμένους χαρακτήρες, έχει ως αποτέλεσμα την εμφάνιση σφάλματος [`TypeError`][].

## Class: http.IncomingMessage<!-- YAML
added: v0.1.17
-->Ένα αντικείμενο `IncomingMessage` δημιουργείται από το [`http.Server`][] ή το [`http.ClientRequest`][] και μεταβιβάζεται ως η πρώτη παράμετρος στο [`'request'`][] ή στο συμβάν [`'response'`][] αντίστοιχα. It may be used to access response status, headers and data.

Υλοποιεί τη διεπαφή [Αναγνώσιμης Ροής](stream.html#stream_class_stream_readable) καθώς και τα παρακάτω συμβάντα, τις μεθόδους και τις ιδιότητες.

### Συμβάν: 'aborted'<!-- YAML
added: v0.3.8
-->Μεταδίδεται όταν το αίτημα έχει ματαιωθεί.

### Συμβάν: 'close'<!-- YAML
added: v0.4.2
-->Δηλώνει ότι η υποκείμενη σύνδεση έχει τερματιστεί. Όπως και στο `'end'`, αυτό το συμβάν εκτελείται μόνο μια φορά ανά απόκριση.

### message.aborted<!-- YAML
added: v8.13.0
-->* {boolean}

Η ιδιότητα `message.aborted` θα έχει οριστεί ως `true` αν το αίτημα έχει ματαιωθεί.

### message.complete<!-- YAML
added: v0.3.0
-->* {boolean}

The `message.complete` property will be `true` if a complete HTTP message has been received and successfully parsed.

This property is particularly useful as a means of determining if a client or server fully transmitted a message before a connection was terminated:

```js
const req = http.request({
  host: '127.0.0.1',
  port: 8080,
  method: 'POST'
}, (res) => {
  res.resume();
  res.on('end', () => {
    if (!res.complete)
      console.error(
        'The connection was terminated while the message was still being sent');
  });
});
```

### message.destroy([error])<!-- YAML
added: v0.3.0
-->* `error` {Error}

Καλεί το `destroy()` στο socket που έχει λάβει το `IncomingMessage`. Αν το `error` έχει οριστεί, τότε θα μεταδοθεί ένα συμβάν `'error'` και το `error` μεταβιβάζεται ως παράμετρος σε οποιονδήποτε ακροατή (αν υπάρχει) του συμβάντος.

### message.headers<!-- YAML
added: v0.1.5
-->* {Object}

Το αντικείμενο κεφαλίδων αιτήματος/απόκρισης.

Ζεύγη κλειδιών-τιμών των ονομάτων και των τιμών των κεφαλίδων. Τα ονόματα των κεφαλίδων μετατρέπονται σε πεζούς χαρακτήρες. Παράδειγμα:

```js
// Εμφανίζει κάτι σαν το παρακάτω:
//
// { 'user-agent': 'curl/7.22.0',
//   host: '127.0.0.1:8000',
//   accept: '*/*' }
console.log(request.headers);
```

Τα διπλότυπα στις ανεπεξέργαστες κεφαλίδες χειρίζονται με τους παρακάτω τρόπους, ανάλογα με το όνομα της κεφαλίδας:

* Τα διπλότυπα των `age`, `authorization`, `content-length`, `content-type`, `etag`, `expires`, `from`, `host`, `if-modified-since`, `if-unmodified-since`, `last-modified`, `location`, `max-forwards`, `proxy-authorization`, `referer`, `retry-after`, ή `user-agent` απορρίπτονται.
* Το `set-cookie` είναι πάντα πίνακας. Τα διπλότυπα προστίθενται στον πίνακα.
* Για όλες τις άλλες κεφαλίδες, οι τιμές συνενώνονται με διαχωριστικό ', '.

### message.httpVersion<!-- YAML
added: v0.1.1
-->* {string}

Σε περίπτωση αιτήματος του εξυπηρετητή, η έκδοση HTTP αποστέλλεται από τον πελάτη. Στην περίπτωση της απάντηση πελάτη, είναι η έκδοση HTTP του server που έχει συνδεθεί. Κατά πάσα πιθανότητα είναι `'1.1'` ή `'1.0'`.

Επίσης το `message.httpVersionMajor` είναι το πρώτο integer, και το `message.httpVersionMinor` είναι το δεύτερο.

### message.method<!-- YAML
added: v0.1.1
-->* {string}

**Είναι έγκυρο μόνο για αιτήματα που έχουν προέλθει από το [`http.Server`][].**

Η μέθοδος αιτήματος είναι string. Μόνο για ανάγνωση. Παράδειγμα: `'GET'`, `'DELETE'`.

### message.rawHeaders<!-- YAML
added: v0.11.6
-->* {Array}

Η λίστα ανεπεξέργαστων κεφαλίδων αιτήματος/απόκρισης, όπως έχουν ληφθεί.

Σημειώστε ότι τα κλειδιά και οι τιμές βρίσκονται στην ίδια λίστα. *Δεν* είναι μια λίστα πλειάδων. Έτσι, οι μονοί αριθμοί είναι τα κλειδιά, και οι ζυγοί αριθμοί είναι οι αντίστοιχες τιμές τους.

Τα ονόματα κεφαλίδων δεν έχουν μετατραπεί σε πεζούς χαρακτήρες, και τα διπλότυπα δεν έχουν ενωθεί.

```js
// Εμφανίζει κάτι σαν το παρακάτω:
//
// [ 'user-agent',
//   'this is invalid because there can be only one',
//   'User-Agent',
//   'curl/7.22.0',
//   'Host',
//   '127.0.0.1:8000',
//   'ACCEPT',
//   '*/*' ]
console.log(request.rawHeaders);
```

### message.rawTrailers<!-- YAML
added: v0.11.6
-->* {Array}

Τα κλειδιά ουράς και οι τιμές των ακατέργαστων αιτημάτων αίτησης/απόκρισης, ακριβώς όπως παραλήφθηκαν. Συμπληρώνονται μόνο κατά το συμβάν `'end'`.

### message.setTimeout(msecs, callback)<!-- YAML
added: v0.5.9
-->* `msecs` {number}
* `callback` {Function}

Καλεί το `message.connection.setTimeout(msecs, callback)`.

Returns `message`.

### message.socket<!-- YAML
added: v0.3.0
-->* {net.Socket}

Το αντικείμενο [`net.Socket`][] που σχετίζεται με την σύνδεση.

Για συνδέσεις με υποστήριξη HTTPS, χρησιμοποιήστε το [`request.socket.getPeerCertificate()`][] για να αποκτήσετε τα στοιχεία ταυτοποίησης του πελάτη.

### message.statusCode<!-- YAML
added: v0.1.1
-->* {number}

**Ισχύει μόνο για απόκριση που λήφθηκε από το [`http.ClientRequest`][].**

Ο 3ψήφιος κωδικός κατάστασης της απόκρισης HTTP. Π.Χ. `404`.

### message.statusMessage<!-- YAML
added: v0.11.10
-->* {string}

**Ισχύει μόνο για απόκριση που λήφθηκε από το [`http.ClientRequest`][].**

Το μήνυμα της κατάστασης απόκρισης HTTP (φράση). E.G. `OK` or `Internal Server Error`.

### message.trailers<!-- YAML
added: v0.3.0
-->* {Object}

Το αντικείμενο ουράς αιτήματος/απόκρισης. Συμπληρώνονται μόνο κατά το συμβάν `'end'`.

### message.url<!-- YAML
added: v0.1.90
-->* {string}

**Είναι έγκυρο μόνο για αιτήματα που έχουν προέλθει από το [`http.Server`][].**

String URL αιτήματος. Περιέχει μόνο το URL που είναι παρόν στο αίτημα HTTP. Αν το αίτημα είναι:

```txt
GET /status?name=ryan HTTP/1.1\r\n
Accept: text/plain\r\n
\r\n
```

Τότε το `request.url` θα είναι:
```js
'/status?name=ryan'
```

Για να αναλύσετε το url στα επιμέρους κομμάτια του, μπορεί να χρησιμοποιηθεί το `require('url').parse(request.url)`. Παράδειγμα:

```txt
$ node
> require('url').parse('/status?name=ryan')
Url {
  protocol: null,
  slashes: null,
  auth: null,
  host: null,
  port: null,
  hostname: null,
  hash: null,
  search: '?name=ryan',
  query: 'name=ryan',
  pathname: '/status',
  path: '/status?name=ryan',
  href: '/status?name=ryan' }
```

Για να εξάγετε τις παραμέτρους από το string του ερωτήματος, μπορείτε να χρησιμοποιήσετε την συνάρτηση `require('querystring').parse`, ή μπορείτε να ορίσετε ως `true` την δεύτερη παράμετρο στο `require('url').parse`. Παράδειγμα:

```txt
$ node
> require('url').parse('/status?name=ryan', true)
Url {
  protocol: null,
  slashes: null,
  auth: null,
  host: null,
  port: null,
  hostname: null,
  hash: null,
  search: '?name=ryan',
  query: { name: 'ryan' },
  pathname: '/status',
  path: '/status?name=ryan',
  href: '/status?name=ryan' }
```

## http.METHODS<!-- YAML
added: v0.11.8
-->* {Array}

Μια λίστα με μεθόδους HTTP που υποστηρίζονται από τον αναλυτή.

## http.STATUS_CODES<!-- YAML
added: v0.1.22
-->* {Object}

Μια συλλογή με όλους τους καθιερωμένους κωδικούς κατάστασης της απόκρισης HTTP, και μια μικρή περιγραφή για κάθε έναν από αυτούς. Για παράδειγμα, `http.STATUS_CODES[404] === 'Not
Found'`.

## http.createServer([requestListener])<!-- YAML
added: v0.1.13
-->- `requestListener` {Function}

* Επιστρέφει: {http.Server}

Επιστρέφει ένα νέο στιγμιότυπο του [`http.Server`][].

Το `requestListener` είναι μια συνάρτηση που προστίθεται αυτόματα στο αίτημα [`'request'`][].

## http.get(options[, callback])<!-- YAML
added: v0.3.6
changes:
  - version: v7.5.0
    pr-url: https://github.com/nodejs/node/pull/10638
    description: The `options` parameter can be a WHATWG `URL` object.
-->* `options` {Object | string | URL} Δέχεται τα ίδια `options` με το [`http.request()`][], με το `method` να είναι πάντα ορισμένο ως `GET`. Οι ιδιότητες που κληρονομούνται από την πρωτότυπη μέθοδο, αγνοούνται.
* `callback` {Function}
* Επιστρέφει: {http.ClientRequest}

Από την στιγμή που τα περισσότερα αιτήματα είναι αιτήματα GET χωρίς σώματα, η Node.js προσφέρει αυτήν την μέθοδο για ευκολία. Η μόνη διαφορά μεταξύ αυτής της μεθόδου και της μεθόδου [`http.request()`][], είναι ότι ορίζει την μέθοδο να χρησιμοποιεί GET και καλεί το `req.end()` αυτόματα. Σημειώστε ότι το callback θα πρέπει να καταναλώσει τα δεδομένα της απόκρισης, για τους λόγους που αναφέρονται στην ενότητα [`http.ClientRequest`][].

To `callback` καλείται με μια μόνο παράμετρο, η οποία είναι ένα στιγμιότυπο του [`http.IncomingMessage`][]

Παράδειγμα λήψης JSON:

```js
http.get('http://nodejs.org/dist/index.json', (res) => {
  const { statusCode } = res;
  const contentType = res.headers['content-type'];

  let error;
  if (statusCode !== 200) {
    error = new Error('Το αίτημα απέτυχε.\n' +
                      `Κωδικός Κατάστασης: ${statusCode}`);
  } else if (!/^application\/json/.test(contentType)) {
    error = new Error('Μη έγκυρο content-type.\n' +
                      `Αναμενόταν application/json αλλά λήφθηκε ${contentType}`);
  }
  if (error) {
    console.error(error.message);
    // κατανάλωση των δεδομένων απόκρισης για απελευθέρωση μνήμης
    res.resume();
    return;
  }

  res.setEncoding('utf8');
  let rawData = '';
  res.on('data', (chunk) => { rawData += chunk; });
  res.on('end', () => {
    try {
      const parsedData = JSON.parse(rawData);
      console.log(parsedData);
    } catch (e) {
      console.error(e.message);
    }
  });
}).on('error', (e) => {
  console.error(`Εμφανίστηκε σφάλμα: ${e.message}`);
});
```

## http.globalAgent<!-- YAML
added: v0.5.9
-->* {http.Agent}

Καθολικό στιγμιότυπο του `Agent` που χρησιμοποιείται από προεπιλογή για όλα τα αιτήματα HTTP των πελατών.

## http.maxHeaderSize<!-- YAML
added: v8.15.0
-->* {number}

Read-only property specifying the maximum allowed size of HTTP headers in bytes. Defaults to 8KB. Configurable using the [`--max-http-header-size`][] CLI option.

## http.request(options[, callback])
<!-- YAML
added: v0.3.6
changes:
  - version: v7.5.0
    pr-url: https://github.com/nodejs/node/pull/10638
    description: The `options` parameter can be a WHATWG `URL` object.
-->

* `options` {Object | string | URL}
  * `protocol` {string} Το πρωτόκολλο που θα χρησιμοποιηθεί. **Default:** `http:`.
  * `host` {string} Ένα όνομα τομέα ή μια διεύθυνση IP εξυπηρετητή για τον οποίο θα εκδοθεί το αίτημα. **Default:** `localhost`.
  * `hostname` {string} Ψευδώνυμο για το `host`. Για υποστήριξη του [`url.parse()`][], το `hostname` προτιμάται από το `host`.
  * `family` {number} Η οικογένεια διευθύνσεων IP που θα χρησιμοποιηθεί για την επίλυση του `host` και του `hostname`. Οι έγκυρες τιμές είναι `4` ή `6`. Αν δεν έχει οριστεί, θα χρησιμοποιηθούν και η IPv4 και η IPv6.
  * `port` {number} Θύρα του απομακρυσμένου εξυπηρετητή. **Προεπιλογή:** `80`.
  * `localAddress` {string} Τοπική διεπαφή η οποία θα δεσμευτεί για συνδέσεις δικτύου όταν γίνεται έκδοση του αιτήματος.
  * `socketPath` {string} Unix Domain Socket (use one of host:port or socketPath).
  * `method` {string} Ένα string που καθορίζει την μέθοδο του αιτήματος HTTP. **Προεπιλογή:** `'GET'`.
  * `path` {string} Διαδρομή αιτήματος. Θα πρέπει να συμπεριλαμβάνει το string ερωτήματος, αν υπάρχει. Π.Χ. `'/index.html?page=12'`. Ένα exception εμφανίζεται όταν η διαδρομή του αιτήματος περιλαμβάνει μη-έγκυρους χαρακτήρες. Επί του παρόντος, μόνο τα κενά απορρίπτονται, αλλά αυτό είναι κάτι που μπορεί να αλλάξει στο μέλλον. **Προεπιλογή:** `'/'`.
  * `headers` {Object} Ένα αντικείμενο που περιέχει τις κεφαλίδες του αιτήματος.
  * `auth` {string} Βασική ταυτοποίηση, όπως `'user:password'`, για τον υπολογισμό μιας κεφαλίδας Authorization.
  * `agent` {http.Agent | boolean} Controls [`Agent`][] behavior. Possible values:
   * `undefined` (προεπιλογή): χρησιμοποιήστε το [`http.globalAgent`][] για αυτόν τον υπολογιστή και αυτή τη θύρα.
   * Αντικείμενο `Agent`: ρητή χρήση αυτού που μεταβιβάστηκε στο `Agent`.
   * `false`: δημιουργεί έναν νέο `Agent` προς χρήση, με τις προεπιλεγμένες τιμές.
  * `createConnection` {Function} Μια συνάρτηση που δημιουργεί ένα socket/μια ροή που θα χρησιμοποιείται κάθε φορά που δεν χρησιμοποιείται η επιλογή `agent`. Αυτή μπορεί να χρησιμοποιηθεί για την αποφυγή δημιουργίας μιας προσαρμοσμένης κλάσης `Agent` απλά και μόνο για την παράκαμψη της προεπιλεγμένης συνάρτησης `createConnection`. Δείτε το [`agent.createConnection()`][] για περισσότερες λεπτομέρειες. Οποιαδήποτε ροή [`Duplex`][] είναι έγκυρη τιμή επιστροφής.
  * `timeout` {number}: Ένας αριθμός που ορίζει την εξάντληση του χρονικού περιθωρίου του socket σε χιλιοστά του δευτερολέπτου. Αυτό ορίζει την εξάντληση του χρονικού περιθωρίου πριν γίνει η σύνδεση του socket.
* `callback` {Function}
* Επιστρέφει: {http.ClientRequest}

Το Node.js διατηρεί πολλαπλές συνδέσεις ανά εξυπηρετητή για την δημιουργία αιτημάτων HTTP. Αυτή η συνάρτηση επιτρέπει την δημιουργία αιτημάτων με διαφάνεια.

Το `options` μπορεί να είναι ένα αντικείμενο, ένα string ή ένα αντικείμενο [`URL`][]. Αν το `options` είναι string, θα αναλυθεί αυτόματα με το [`url.parse()`][]. Αν είναι ένα αντικείμενο [`URL`][], θα μετατραπεί αυτόματα σε ένα κοινό αντικείμενο `options`.

Η προαιρετική παράμετρος `callback` θα προστεθεί ως ακροατής μιας χρήσης, για το συμβάν [`'response'`][].

Το `http.request()` επιστρέφει ένα στιγμιότυπο της κλάσης [`http.ClientRequest`][]. Το στιγμιότυπο `ClientRequest` είναι μια εγγράψιμη ροή. Εάν χρειάζεται να γίνει μεταφόρτωση αρχείου μέσω αιτήματος POST, τότε πρέπει να το γράψετε στο αντικείμενο `ClientRequest`.

Παράδειγμα:

```js
const postData = querystring.stringify({
  'msg': 'Hello World!'
});

const options = {
  hostname: 'www.google.com',
  port: 80,
  path: '/upload',
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
  res.setEncoding('utf8');
  res.on('data', (chunk) => {
    console.log(`BODY: ${chunk}`);
  });
  res.on('end', () => {
    console.log('Δεν υπάρχουν άλλα δεδομένα απόκρισης.');
  });
});

req.on('error', (e) => {
  console.error(`πρόβλημα με το αίτημα: ${e.message}`);
});

// εγγραφή δεδομένων στο σώμα αιτήματος
req.write(postData);
req.end();
```

Σημειώστε ότι στο παράδειγμα έγινε κλήση του `req.end()`. Μαζί με το `http.request()`, πρέπει πάντα να γίνεται κλήση του `req.end()` για εκφραστεί το τέλος του αιτήματος - ακόμα κι αν δεν υπάρχουν δεδομένα που θα γραφούν στο σώμα του αιτήματος.

Αν συμβεί οποιοδήποτε σφάλμα κατά την διάρκεια του αιτήματος (όπως με την επίλυση του DNS, σφάλματα επιπέδου TCP, ή πραγματικά σφάλματα ανάλυσης HTTP), μεταδίδεται ένα συμβάν `'error'` στο επιστρεφόμενο αντικείμενο αιτήματος. Όπως με όλα τα συμβάντα `'error'`, αν δεν έχουν καταχωρηθεί ακροατές, τότε θα εμφανιστεί μήνυμα σφάλματος.

Υπάρχουν μερικές ειδικές κεφαλίδες που θα πρέπει να έχετε κατά νου.

* Η αποστολή της κεφαλίδας 'Connection: keep-alive' θα ειδοποιήσει την Node.js ότι η σύνδεση με τον εξυπηρετητή θα πρέπει να παραμείνει ενεργή μέχρι το επόμενο αίτημα.

* Η αποστολή της κεφαλίδας 'Content-Length' θα απενεργοποιήσει την προεπιλεγμένη κωδικοποίηση των κομματιών.

* Η αποστολή της κεφαλίδας 'Expect', θα στείλει αμέσως τις κεφαλίδες του αιτήματος. Usually, when sending 'Expect: 100-continue', both a timeout and a listener for the `continue` event should be set. Δείτε την παράγραφο 8.2.3 του RFC2616 για περισσότερες πληροφορίες.

* Η αποστολή μιας κεφαλίδας Authorization θα παρακάμψει την χρήση της επιλογής `auth` για τον υπολογισμό της βασικής εξουσιοδότησης.

Παράδειγμα χρήσης ενός [`URL`][] ως `options`:

```js
const { URL } = require('url');

const options = new URL('http://abc:xyz@example.com');

const req = http.request(options, (res) => {
  // ...
});
```

Σε ένα επιτυχημένο αίτημα, θα μεταδοθούν τα παρακάτω συμβάντα, με την ακόλουθη σειρά:

* `socket`
* `response`
  * `data` any number of times, on the `res` object (`data` will not be emitted at all if the response body is empty, for instance, in most redirects)
  * `end` on the `res` object
* `close`

Στην περίπτωση ενός σφάλματος σύνδεσης, θα μεταδοθούν τα παρακάτω συμβάντα:

* `socket`
* `error`
* `close`

Αν κληθεί το `req.abort()` πριν γίνει μια επιτυχημένη σύνδεση, θα μεταδοθούν τα παρακάτω συμβάντα, με την ακόλουθη σειρά:

* `socket`
* (το `req.abort()` καλείται εδώ)
* `abort`
* `close`
* `error` with an error with message `Error: socket hang up` and code `ECONNRESET`

Αν κληθεί το `req.abort()` αφού ληφθεί η απόκριση, θα μεταδοθούν τα παρακάτω συμβάντα, με την ακόλουθη σειρά:

* `socket`
* `response`
  * `data` any number of times, on the `res` object
* (το `req.abort()` καλείται εδώ)
* `abort`
* `close`
  * `aborted` on the `res` object
  * `end` on the `res` object
  * `close` on the `res` object

Note that setting the `timeout` option or using the `setTimeout` function will not abort the request or do anything besides add a `timeout` event.
