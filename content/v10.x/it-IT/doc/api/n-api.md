# N-API

<!--introduced_in=v7.10.0-->

<!-- type=misc -->

> Stabilità: 2 - Stabile

N-API (pronunciato N come la lettera stessa, seguito da API) è un'API per la creazione di Addons nativi. È indipendente dal runtime JavaScript sottostante (es. V8) e viene mantenuto come parte dello stesso Node.js. Quest'API sarà stabile in Application Binary Interface (ABI) tra le versioni di Node.js. Ha lo scopo di isolare gli Addons dalle modifiche nell'engine JavaScript sottostante e consentire ai moduli compilati per una versione di essere eseguiti nelle versioni successive di Node.js senza ricompilazione.

Gli Addons sono costruiti/impacchettati con lo stesso approccio/gli stessi tools evidenziati nella sezione intitolata [Addons C++](addons.html). L'unica differenza è l'insieme di API utilizzate dal codice nativo. Invece di utilizzare le API di V8 o di [Native Abstractions per Node.js](https://github.com/nodejs/nan), vengono utilizzate le funzioni disponibili in N-API.

Le API esposte da N-API vengono generalmente utilizzate per creare e manipolare i valori di JavaScript. I concepts e le operations generalmente mappano le idee specificate in "ECMA262 Language Specification". Le API hanno le seguenti proprietà:

- Tutte le chiamate N-API restituiscono(return) uno status code di tipo `napi_status`. Questo stato indica se la chiamata API è avvenuta con successo oppure no.
- Il valore di return dell'API viene passato tramite un parametro out.
- Tutti i valori di JavaScript sono astratti dietro un tipo opaco chiamato `napi_value`.
- In caso di status code di errore, è possibile ottenere ulteriori informazioni utilizzando `napi_get_last_error_info`. Ulteriori informazioni possono essere trovate nella sezione di gestione degli errori [Gestione degli Errori](#n_api_error_handling).

Il N-API è un'API C che garantisce la stabilità dell'ABI attraverso le versioni di Node.js e diversi livelli del compilatore. Tuttavia, capiamo che un'API C++ può essere più facile da usare in molti casi. Per supportare questi casi ci aspettiamo che ci siano uno o più moduli wrapper C++ che forniscano un'API C++ inlineable. I file binari creati con questi moduli wrapper dipenderanno dai simboli per le funzioni basate su N-API C esportate da Node.js. Questi wrappers non fanno parte di N-API, né saranno mantenuti come parte di Node.js. Uno di questi esempi è: [node-addon-api](https://github.com/nodejs/node-addon-api).

Per utilizzare le funzioni di N-API, includere il file [`node_api.h`](https://github.com/nodejs/node/blob/master/src/node_api.h) che si trova nella directory src nel node development tree:

```C
#include <node_api.h>
```

## Data Types N-API di base

N-API espone i seguenti datatypes fondamentali come abstractions che vengono utilizzate dalle varie API. Queste API devono essere considerate come opache, auto-esaminabile (introspectable) solo con altre chiamate N-API.

### napi_status

Status code integrale che indica il successo oppure il fallimento di una chiamata N-API. Attualmente sono supportati i seguenti status codes.

```C
typedef enum {
  napi_ok,
  napi_invalid_arg,
  napi_object_expected,
  napi_string_expected,
  napi_name_expected,
  napi_function_expected,
  napi_number_expected,
  napi_boolean_expected,
  napi_array_expected,
  napi_generic_failure,
  napi_pending_exception,
  napi_cancelled,
  napi_escape_called_twice,
  napi_handle_scope_mismatch,
  napi_callback_scope_mismatch
} napi_status;
```

Se viene richiesta qualche informazione aggiuntiva su un'API che restituisce un failed status, può essere ottenuta chiamando `napi_get_last_error_info`.

### napi_extended_error_info

```C
typedef struct {
  const char* error_message;
  void* engine_reserved;
  uint32_t engine_error_code;
  napi_status error_code;
} napi_extended_error_info;
```

- `error_message`: Stringa con codifica UTF8 contenente una descrizione neutrale dell'errore da parte della VM.
- `engine_reserved`: Riservato per i dettagli degli errori specifici della VM. Questo non è attualmente implementato per qualsiasi VM.
- `engine_error_code`: Error code specifico della VM. Questo non è attualmente implementato per qualsiasi VM.
- `error_code`: Lo status code di N-API che ha avuto origine con l'ultimo errore.

Vedi la sezione [Gestione degli Errori](#n_api_error_handling) per ulteriori informazioni.

### napi_env

`napi_env` viene utilizzato per rappresentare un contesto che l'implementazione N-API sottostante può utilizzare per mantenere lo stato specifico della VM. Questa struttura viene passata alle funzioni native quando vengono invocate, e dev'essere passata indietro quando si effettuano chiamate N-API. Nello specifico, lo stesso `napi_env`, che è stato passato quand'è stata chiamata la funzione nativa iniziale, deve essere passato a tutte le successive chiamate N-API nidificate. Non è consentito memorizzare nella cache `napi_env` ai fini del riutilizzo generale.

### napi_value

Questo è un puntatore opaco che viene utilizzato per rappresentare un valore JavaScript.

### Tipi di N-API Memory Management

#### napi_handle_scope

Questa è un'abstraction utilizzata per controllare e modificare la durata degli objects creati all'interno di un particolare scope. In generale, i valori N-API vengono creati nel contesto di un handle scope. Nel momento in cui un metodo nativo viene chiamato da JavaScript, esisterà un handle scope predefinito. Se l'utente non crea esplicitamente un nuovo handle scope, i valori N-API verranno creati nell'handle scope predefinito. Per ogni invocazione di codice al di fuori dell'esecuzione di un metodo nativo (ad esempio, durante l'invocazione di una callback per libuv), è richiesto il modulo per creare uno scope prima di invocare qualsiasi funzione che può comportare la creazione di valori JavaScript.

Gli handle scopes vengono creati usando [`napi_open_handle_scope`][] e vengono distrutti usando [`napi_close_handle_scope`][]. La chiusura dello scope può indicare al GC che tutti i `napi_value` creati nel corso della durata dell'handle scope non sono più referenziati dallo stack frame corrente.

Per maggiori dettagli, consulta [Object Lifetime Management](#n_api_object_lifetime_management).

#### napi_escapable_handle_scope

Gli handle scopes di tipo escapable sono un tipo speciale di handle scope per restituire valori creati all'interno di un particolare handle scope ad un parent scope.

#### napi_ref

Questa è l'abstraction da usare per fare riferimento a `napi_value`. Ciò consente agli utenti di gestire la durata dei valori JavaScript, compresa la definizione in modo esplicito della loro durata minima.

Per maggiori dettagli, consulta [Object Lifetime Management](#n_api_object_lifetime_management).

### Tipi di N-API Callback

#### napi_callback_info

Datatype opaco passato ad una funzione di callback. Può essere utilizzato per ottenere informazioni aggiuntive sul contesto in cui è stato invocato il callback.

#### napi_callback

Tipo di funzione puntatore per le funzioni native fornite dall'utente che devono essere esposte a JavaScript tramite N-API. Le funzioni di callback devono soddisfare la seguente dicitura:

```C
typedef napi_value (*napi_callback)(napi_env, napi_callback_info);
```

#### napi_finalize

Tipo di funzione puntatore per funzioni aggiuntive fornite che consente all'utente di essere avvisato quando i dati di proprietà esterna sono pronti per essere puliti poichè l'oggetto con cui è stato associato è stato sottoposto alla garbage collection. L'utente deve fornire una funzione che soddisfi la seguente dicitura che verrebbe chiamata sulla collection dell'object. Al momento, `napi_finalize` può essere utilizzato per scoprire quando avviene la collection di objects con dati esterni.

```C
typedef void (*napi_finalize)(napi_env env,
                              void* finalize_data,
                              void* finalize_hint);
```

#### napi_async_execute_callback

Funzione puntatore utilizzato con funzioni che supportano operazioni asincrone. Le funzioni di callback devono soddisfare la seguente dicitura:

```C
typedef void (*napi_async_execute_callback)(napi_env env, void* data);
```

#### napi_async_complete_callback

Funzione puntatore utilizzato con funzioni che supportano operazioni asincrone. Le funzioni di callback devono soddisfare la seguente dicitura:

```C
typedef void (*napi_async_complete_callback)(napi_env env,
                                             napi_status status,
                                             void* data);
```

## Gestione degli Errori

N-API utilizza sia i valori return che le eccezioni JavaScript per la gestione degli errori. Le seguenti sezioni spiegano l'approccio per ciascun caso.

### Valori Return

Tutte le funzioni N-API condividono lo stesso modello di gestione degli errori. Il tipo di return di tutte le funzioni API è `napi_status`.

Il valore return sarà `napi_ok` se la richiesta è stata eseguita correttamente e se non è stata generata alcuna eccezione JavaScript non rilevata. Se si è verificato un errore ED è stata generata un'eccezione, verrà restituito il valore `napi_status` per l'errore. Se è stata generata un'eccezione, e non si è verificato alcun errore, verrà restituito `napi_pending_exception`.

Nei casi in cui viene restituito un valore return diverso da `napi_ok` o `napi_pending_exception`, è necessario chiamare [`napi_is_exception_pending`][] per verificare se c'è un'eccezione in sospeso. Vedi la sezione sulle eccezioni per maggiori dettagli.

Il set completo di possibili valori `napi_status` è definito in `napi_api_types.h`.

Il valore return `napi_status` fornisce una rappresentazione indipendente dell'errore verificatosi da parte della VM. In alcuni casi è utile essere in grado di ottenere informazioni più dettagliate, includendo una stringa che rappresenta l'errore e le informazioni specifiche della VM (engine).

Per recuperare queste informazioni viene fornito [`napi_get_last_error_info`][] che restituisce una struttura `napi_extended_error_info`. Il formato della struttura `napi_extended_error_info` è il seguente:

```C
typedef struct napi_extended_error_info {
  const char* error_message;
  void* engine_reserved;
  uint32_t engine_error_code;
  napi_status error_code;
};
```

- `error_message`: Rappresentazione testuale dell'errore che si è verificato.
- `engine_reserved`: Handle opaco riservato solo all'uso dell'engine.
- `engine_error_code`: Error code specifico della VM.
- `error_code`: Status code n-api per l'ultimo errore.

[`napi_get_last_error_info`][] restituisce le informazioni per l'ultima chiamata N-API che è stata effettuata.

Non fare affidamento sul contenuto o sul formato di una qualsiasi delle extended information in quanto non è soggetto a SemVer e può cambiare in qualsiasi momento. È inteso solo per scopi di registrazione.

#### napi_get_last_error_info

<!-- YAML
added: v8.0.0
-->

```C
napi_status
napi_get_last_error_info(napi_env env,
                         const napi_extended_error_info** result);
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[out] result`: La struttura `napi_extended_error_info` con ulteriori informazioni sull'errore.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API recupera una struttura `napi_extended_error_info` con informazioni sull'ultimo errore che si è verificato.

Il contenuto del `napi_extended_error_info` restituito è valido solo finché non viene chiamata una funzione n-api sullo stesso `env`.

Non fare affidamento sul contenuto o sul formato di una qualsiasi delle extended information in quanto non è soggetto a SemVer e può cambiare in qualsiasi momento. È inteso solo per scopi di registrazione.

Quest'API può essere chiamata anche se è presente un'eccezione JavaScript in sospeso.

### Eccezioni

Qualsiasi chiamata alla funzione N-API può causare un'eccezione JavaScript in sospeso. Questo è ovviamente il caso per qualsiasi funzione che potrebbe causare l'esecuzione di JavaScript, ma N-API specifica che un'eccezione potrebbe essere in attesa di return da una qualsiasi delle funzioni API.

Se il `napi_status` restituito da una funzione è `napi_ok`, allora non è in sospeso alcuna eccezione e non è richiesta alcuna azione aggiuntiva. Se il `napi_status` restituito è qualcosa di diverso da `napi_ok` o `napi_pending_exception`, per provare a recuperare e continuare anzichè restituire immediatamente, bisogna chiamare [`napi_is_exception_pending`][] per determinare se un'eccezione è in sospeso o meno.

Quando un'eccezione è in sospeso, è possibile utilizzare uno dei seguenti due approcci.

Il primo approccio consiste nel fare qualsiasi pulizia appropriata e successivamente fare il return in modo che l'esecuzione ritorni a JavaScript. Appena parte della transizione torna a JavaScript, l'eccezione verrà lanciata al punto nel codice JavaScript in cui è stato invocato il metodo nativo. Il comportamento della maggior parte delle chiamate N-API, mentre un'eccezione è in sospeso, non è specificato, e molte restituiscono semplicemente `napi_pending_exception`, quindi è importante fare il meno possibile e di conseguenza fare il return a JavaScript dove l'eccezione può essere gestita.

Il secondo approccio è provare a gestire l'eccezione. Ci saranno casi in cui il codice nativo può catturare l'eccezione, bisogna prendere l'azione giusta e dopo continuare. Questo è consigliato solo nei casi specifici in cui è noto che l'eccezione può essere gestita in sicurezza. In questi casi [`napi_get_and_clear_last_exception`][] può essere utilizzato per ottenere e cancellare l'eccezione. In caso di esito positivo, il risultato conterrà l'handle fino all'ultimo JavaScript `Object` lanciato. Se viene determinato, dopo aver recuperato l'eccezione, essa non può essere gestita tuttavia può essere rilanciata con [`napi_throw`][] dove l'errore è il JavaScript `Error` object da lanciare.

Le seguenti funzioni utility sono disponibili anche nel caso in cui il codice nativo debba generare un'eccezione o determinare se un `napi_value` è un'istanza di un JavaScript `Error` object: [`napi_throw_error`][], [`napi_throw_type_error`][], [`napi_throw_range_error`][] e [`napi_is_error`][].

Le seguenti funzioni utility sono disponibili anche nel caso in cui il codice nativo necessiti di creare un `Error` object: [`napi_create_error`][], [`napi_create_type_error`][], e [`napi_create_range_error`][], dove il risultato è il `napi_value` che fa riferimento al JavaScript `Error` object appena creato.

Il progetto Node.js aggiunge error codes a tutti gli errori generati internamente. L'obiettivo è che le applicazioni utilizzino questi error codes per il controllo di tutti gli errori. I messaggi di errato associato rimarranno, ma verranno utilizzati solo per la registrazione e la visualizzazione con l'aspettativa che il messaggio possa cambiare senza applicare SemVer. Per supportare questo modello con N-API, sia nelle funzionalità interne che per le funzionalità specifiche del modulo (come buona pratica), le funzioni `throw_` e `create_` richiedono un parametro di codice opzionale che è la stringa per il codice da aggiungere all'error object. Se il parametro opzionale è NULL, nessun codice verrà associato all'errore. Se viene fornito un codice, viene aggiornato anche il nome associato all'errore:

```text
originalName [code]
```

dove `originalName` è il nome originale associato all'errore e `code` è il codice che è stato fornito. Ad esempio se il codice è `'ERR_ERROR_1'` ed un `TypeError` è in fase di creazione, il nome sarà:

```text
TypeError [ERR_ERROR_1]
```

#### napi_throw

<!-- YAML
added: v8.0.0
-->

```C
NODE_EXTERN napi_status napi_throw(napi_env env, napi_value error);
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] error`: Il valore JavaScript da lanciare.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API lancia il valore JavaScript fornito.

#### napi_throw_error

<!-- YAML
added: v8.0.0
-->

```C
NODE_EXTERN napi_status napi_throw_error(napi_env env,
                                         const char* code,
                                         const char* msg);
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] code`: Error code opzionale da impostare sull'errore.
- `[in] msg`: La stringa C che rappresenta il testo da associare all'errore.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API lancia un JavaScript `Error` con il testo fornito.

#### napi_throw_type_error

<!-- YAML
added: v8.0.0
-->

```C
NODE_EXTERN napi_status napi_throw_type_error(napi_env env,
                                              const char* code,
                                              const char* msg);
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] code`: Error code opzionale da impostare sull'errore.
- `[in] msg`: La stringa C che rappresenta il testo da associare all'errore.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API lancia un JavaScript `TypeError` con il testo fornito.

#### napi_throw_range_error

<!-- YAML
added: v8.0.0
-->

```C
NODE_EXTERN napi_status napi_throw_range_error(napi_env env,
                                               const char* code,
                                               const char* msg);
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] code`: Error code opzionale da impostare sull'errore.
- `[in] msg`: La stringa C che rappresenta il testo da associare all'errore.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API lancia un JavaScript `RangeError` con il testo fornito.

#### napi_is_error

<!-- YAML
added: v8.0.0
-->

```C
NODE_EXTERN napi_status napi_is_error(napi_env env,
                                      napi_value value,
                                      bool* result);
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] msg`: Il `napi_value` da verificare.
- `[out] result`: Valore booleano impostato su true se `napi_value` rappresenta un errore, in caso contrario false.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API richiede un `napi_value` per verificare se rappresenta un error object.

#### napi_create_error

<!-- YAML
added: v8.0.0
-->

```C
NODE_EXTERN napi_status napi_create_error(napi_env env,
                                          napi_value code,
                                          napi_value msg,
                                          napi_value* result);
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] code`: `napi_value` opzionale con la stringa per l'error code da associare all'errore.
- `[in] msg`: `napi_value` che fa riferimento ad una JavaScript `String` da utilizzare come messaggio per l'`Error`.
- `[out] result`: `napi_value` che rappresenta l'errore creato.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API restituisce un JavaScript `Error` con il testo fornito.

#### napi_create_type_error

<!-- YAML
added: v8.0.0
-->

```C
NODE_EXTERN napi_status napi_create_type_error(napi_env env,
                                               napi_value code,
                                               napi_value msg,
                                               napi_value* result);
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] code`: `napi_value` opzionale con la stringa per l'error code da associare all'errore.
- `[in] msg`: `napi_value` che fa riferimento ad una JavaScript `String` da utilizzare come messaggio per l'`Error`.
- `[out] result`: `napi_value` che rappresenta l'errore creato.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API restituisce un JavaScript `TypeError` con il testo fornito.

#### napi_create_range_error

<!-- YAML
added: v8.0.0
-->

```C
NODE_EXTERN napi_status napi_create_range_error(napi_env env,
                                                napi_value code,
                                                const char* msg,
                                                napi_value* result);
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] code`: `napi_value` opzionale con la stringa per l'error code da associare all'errore.
- `[in] msg`: `napi_value` che fa riferimento ad una JavaScript `String` da utilizzare come messaggio per l'`Error`.
- `[out] result`: `napi_value` che rappresenta l'errore creato.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API restituisce un JavaScript `RangeError` con il testo fornito.

#### napi_get_and_clear_last_exception

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_get_and_clear_last_exception(napi_env env,
                                              napi_value* result);
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[out] result`: L'eccezione se una è in sospeso, in caso contrario NULL.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API restituisce true se è in sospeso un'eccezione.

Quest'API può essere chiamata anche se è presente un'eccezione JavaScript in sospeso.

#### napi_is_exception_pending

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_is_exception_pending(napi_env env, bool* result);
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[out] result`: Valore booleano impostato su true se è in sospeso un'eccezione.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API restituisce true se è in sospeso un'eccezione.

Quest'API può essere chiamata anche se è presente un'eccezione JavaScript in sospeso.

#### napi_fatal_exception

<!-- YAML
added: v9.10.0
-->

```C
napi_status napi_fatal_exception(napi_env env, napi_value err);
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] err`: L'errore che vuoi passare ad `'uncaughtException'`.

Attiva un `'uncaughtException'` in JavaScript. Utile se una callback asincrona lancia un'eccezione senza possibilità di recupero.

### Fatal Errors

In caso di errore irreversibile in un modulo nativo, è possibile lanciare un fatal error per interrompere immediatamente il processo.

#### napi_fatal_error

<!-- YAML
added: v8.2.0
-->

```C
NAPI_NO_RETURN void napi_fatal_error(const char* location,
                                                 size_t location_len,
                                                 const char* message,
                                                 size_t message_len);
```

- `[in] location`: Posizione opzionale in cui si è verificato l'errore.
- `[in] location_len`: La lunghezza della posizione in bytes, oppure `NAPI_AUTO_LENGTH` se è null-terminated.
- `[in] message`: Il messaggio associato all'errore.
- `[in] message_len`: La lunghezza del messaggio in bytes, oppure `NAPI_AUTO_LENGTH` se è null-terminated.

La funzione call non restituisce nulla, il processo verrà terminato.

Quest'API può essere chiamata anche se è presente un'eccezione JavaScript in sospeso.

## Object Lifetime management

Quando vengono effettuate le N-API calls, gli handles per gli objects nell'heap per la VM sottostante possono essere restituiti come `napi_values`. Questi handles devono mantenere gli objects 'vivi' fino a quando non sono più richiesti dal codice nativo, altrimenti gli objects potrebbero essere raccolti prima che il codice nativo finisca di usarli.

Man mano che object handles vengono restituiti, essi vengono associati a uno 'scope'. La durata dello scope predefinito è legata alla durata della chiamata al metodo nativo. Il risultato è che, per impostazione predefinita, gli handles restano validi e gli objects associati a questi handles verranno mantenuti vivi per la durata della chiamata al metodo nativo.

In molti casi, tuttavia, è necessario che gli handles restino validi per una durata più breve o più lunga rispetto a quella del metodo nativo. Le sezioni che seguono descrivono le funzioni N-API che possono essere utilizzate per cambiare la durata predefinita dell'handle.

### Rendere la durata dell'handle più breve rispetto a quella del metodo nativo

Spesso è necessario rendere la durata degli handles più breve rispetto alla durata di un metodo nativo. Ad esempio, si consideri un metodo nativo che ha un ciclo che itera attraverso gli elementi in un array di grandi dimensioni:

```C
for (int i = 0; i < 1000000; i++) {
  napi_value result;
  napi_status status = napi_get_element(env, object, i, &result);
  if (status != napi_ok) {
    break;
  }
  // fare qualcosa con l'elemento.
}
```

Questo comporterebbe la creazione di un numero elevato di handles, che consumano risorse sostanziali. Inoltre, anche se il codice nativo potrebbe usare solo l'handle più recente, tutti gli objects associati sarebbero mantenuti in vita poiché condividono tutti lo stesso scope.

Per gestire questo caso, N-API offre la capacità di stabilire un nuovo 'scope' al quale verranno associati gli handles appena creati. Una volta che tali handles non sono più necessari, lo scope può essere 'chiuso' e qualsiasi handle associato allo scope viene invalidato. I metodi disponibili per aprire/chiudere gli scopes sono [`napi_open_handle_scope`][] e [`napi_close_handle_scope`][].

N-API supporta solo una singola gerarchia nidificata di scopes. C'è un solo scope attivo in qualsiasi momento e tutti i nuovi handles saranno associati ad esso mentre è attivo. Gli scopes devono essere chiusi nell'ordine inverso a quello in cui sono stati aperti. Inoltre, tutti gli scopes creati all'interno di un metodo nativo devono essere chiusi prima di ritornare da quel metodo.

Prendendo l'esempio precedente, l'aggiunta di calls a [`napi_open_handle_scope`][] e [`napi_close_handle_scope`][] assicurerebbe che, al massimo, un singolo handle sia valido durante l'esecuzione del ciclo:

```C
or (int i = 0; i < 1000000; i++) {
  napi_handle_scope scope;
  napi_status status = napi_open_handle_scope(env, &scope);
  if (status != napi_ok) {
    break;
  }
  napi_value result;
  status = napi_get_element(env, object, i, &result);
  if (status != napi_ok) {
    break;
  }
  // fare qualcosa con l'elemento
  status = napi_close_handle_scope(env, scope);
  if (status != napi_ok) {
    break;
  }
}
```

Quando si annidano gli scopes, ci sono casi in cui un handle da uno scope interno debba vivere oltre la durata di quello scope. N-API supporta un 'escapable scope' al fine di sostenere questo caso. Un escapable scope consente ad un handle di essere 'promosso' in modo che esso 'ignori' lo scope corrente e la sua durata cambi da quella dello scope corrente a quella dello scope esterno.

I metodi disponibili per aprire/chiudere gli escapable scopes sono [`napi_open_escapable_handle_scope`][] e [`napi_close_escapable_handle_scope`][].

La richiesta per promuovere un handle viene effettuata tramite [`napi_escape_handle`][] che può essere chiamato una sola volta.

#### napi_open_handle_scope

<!-- YAML
added: v8.0.0
-->

```C
NODE_EXTERN napi_status napi_open_handle_scope(napi_env env,
                                               napi_handle_scope* result);
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[out] result`: `napi_value` che rappresenta il nuovo scope.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API apre un nuovo scope.

#### napi_close_handle_scope

<!-- YAML
added: v8.0.0
-->

```C
NODE_EXTERN napi_status napi_close_handle_scope(napi_env env,
                                                napi_handle_scope scope);
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] scope`: `napi_value` che rappresenta lo scope che dev'essere chiuso.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API chiude lo scope passato. Gli scopes devono essere chiusi nell'ordine inverso a quello in cui sono stati creati.

Quest'API può essere chiamata anche se è presente un'eccezione JavaScript in sospeso.

#### napi_open_escapable_handle_scope

<!-- YAML
added: v8.0.0
-->

```C
NODE_EXTERN napi_status
    napi_open_escapable_handle_scope(napi_env env,
                                     napi_handle_scope* result);
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[out] result`: `napi_value` che rappresenta il nuovo scope.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API apre un nuovo scope da cui è possibile promuovere un oggetto allo scope esterno.

#### napi_close_escapable_handle_scope

<!-- YAML
added: v8.0.0
-->

```C
NODE_EXTERN napi_status
    napi_close_escapable_handle_scope(napi_env env,
                                      napi_handle_scope scope);
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] scope`: `napi_value` che rappresenta lo scope che dev'essere chiuso.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API chiude lo scope passato. Gli scopes devono essere chiusi nell'ordine inverso a quello in cui sono stati creati.

Quest'API può essere chiamata anche se è presente un'eccezione JavaScript in sospeso.

#### napi_escape_handle

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_escape_handle(napi_env env,
                               napi_escapable_handle_scope scope,
                               napi_value escapee,
                               napi_value* result);
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] scope`: `napi_value` che rappresenta lo scope corrente.
- `[in] escapee`: `napi_value` che rappresenta il JavaScript `Object` di JavaScript che deve essere ignorato.
- `[out] result`: `napi_value` che rappresenta l'handle per l'`Object` ignorato nello scope esterno.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API promuove l'handle per il JavaScript object in modo che sia valido per la durata dello scope esterno. Può essere chiamato solo una volta per ogni scope. Se viene chiamato più di una volta, verrà restituito un errore.

Quest'API può essere chiamata anche se è presente un'eccezione JavaScript in sospeso.

### Reference ad objects con una durata superiore a quella del metodo nativo

In alcuni casi un addon dovrà essere in grado di creare e fare reference ad objects con una durata superiore a quella di una sola invocazione del metodo nativo. Ad esempio, per creare un constructor e successivamente utilizzare tale constructor in una richiesta per creare istanze, deve essere possibile fare reference al constructor object in richieste di creazione di istanze di ogni tipo. Questo non sarebbe possibile con un handle normale restituito come `napi_value` come descritto nella sezione precedente. La durata di un normale handle è gestita dagli scopes e tutti gli scopes devono essere chiusi prima della fine di un metodo nativo.

N-API fornisce metodi per creare reference persistenti ad un object. Ogni reference persistente ha un count associato con un valore pari a 0 o superiore. Il count determina se il reference manterrà vivo l'oggetto corrispondente. I reference con un count di 0 non impediscono la raccolta dell'object e sono spesso denominati reference 'deboli'. Qualsiasi count superiore a 0 impedirà la raccolta dell'object.

I reference possono essere creati con un reference count iniziale. Il count può quindi essere modificato tramite [`napi_reference_ref`][] e [`napi_reference_unref`][]. Se un object viene raccolto mentre il count per un reference è 0, tutte le chiamate successive per ottenere l'object associato al reference [`napi_get_reference_value`][] restituiranno NULL per il valore restituito `napi_value`. Un tentativo di chiamare [`napi_reference_ref`][] per un reference il cui object è stato raccolto genererà un errore.

I reference devono essere cancellati una volta che non sono più richiesti dall'addon. Quando un reference viene eliminato, non impedirà più all'object corrispondente di essere raccolto. La mancata eliminazione di un reference persistente comporterà una 'perdita di memoria' sia con la memoria nativa per il reference persistente sia con l'object corrispondente sull'heap che sarà mantenuto per sempre.

Possono essere creati più reference persistenti che si riferiscono allo stesso object, ognuno dei quali manterrà l'object vivo o meno in base al proprio count.

#### napi_create_reference

<!-- YAML
added: v8.0.0
-->

```C
NODE_EXTERN napi_status napi_create_reference(napi_env env,
                                              napi_value value,
                                              int initial_refcount,
                                              napi_ref* result);
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] value`: `napi_value` che rappresenta l'`Object` per il quale vogliamo un reference.
- `[in] initial_refcount`: Reference count iniziale per il nuovo reference.
- `[out] result`: `napi_ref` che punta al nuovo reference.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API crea un nuovo reference con il reference count specificato sull'`Object` passato.

#### napi_delete_reference

<!-- YAML
added: v8.0.0
-->

```C
NODE_EXTERN napi_status napi_delete_reference(napi_env env, napi_ref ref);
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] ref`: `napi_ref` da cancellare.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API cancella il reference passato.

Quest'API può essere chiamata anche se è presente un'eccezione JavaScript in sospeso.

#### napi_reference_ref

<!-- YAML
added: v8.0.0
-->

```C
NODE_EXTERN napi_status napi_reference_ref(napi_env env,
                                           napi_ref ref,
                                           int* result);
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] ref`: `napi_ref` per il quale verrà incrementato il reference count.
- `[out] result`: Il nuovo reference count.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API incrementa il reference count per il reference passato e restituisce il reference count risultante.

#### napi_reference_unref

<!-- YAML
added: v8.0.0
-->

```C
NODE_EXTERN napi_status napi_reference_unref(napi_env env,
                                             napi_ref ref,
                                             int* result);
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] ref`: `napi_ref` per il quale verrà decrementato il reference count.
- `[out] result`: Il nuovo reference count.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API decrementa il reference count per il reference passato e restituisce il reference count risultante.

#### napi_get_reference_value

<!-- YAML
added: v8.0.0
-->

```C
NODE_EXTERN napi_status napi_get_reference_value(napi_env env,
                                                 napi_ref ref,
                                                 napi_value* result);
```

il `napi_value` passato all'interno o all'esterno da questi metodi è un handle per l'object a cui è collegato il reference.

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] ref`: `napi_ref` per il quale richiediamo l'`Object` corrispondente.
- `[out] result`: Il `napi_value` per l'`Object` a cui fa riferimento `napi_ref`.

Restituisce `napi_ok` se l'API ha esito positivo.

Se ancora valida, quest'API restituisce il `napi_value` che rappresenta il JavaScript `Object` associato a `napi_ref`. In caso contrario, il risultato sarà NULL.

## Registrazione del Modulo

I moduli N-API sono registrati in modo simile ad altri moduli tranne per il fatto che anziché utilizzare la macro `NODE_MODULE` viene utilizzata la seguente:

```C
NAPI_MODULE(NODE_GYP_MODULE_NAME, Init)
```

La prossima differenza è la dicitura per il metodo `Init`. Per un modulo N-API è la seguente:

```C
napi_value Init(napi_env env, napi_value exports);
```

Il valore restituito da `Init` viene considerato come `exports` object per il modulo. Il metodo `Init` passa un empty object tramite il parametro `exports` per comodità. Se `Init` restituisce NULL, il parametro passato come `exports` viene esportato dal modulo. I moduli N-API non possono modificare il `module` object ma possono specificare qualsiasi cosa come la proprietà `exports` del modulo.

Per aggiungere il metodo `hello` come una funzione in modo che possa essere chiamato come metodo fornito dall'addon:

```C
napi_value Init(napi_env env, napi_value exports) {
  napi_status status;
  napi_property_descriptor desc =
    {"hello", NULL, Method, NULL, NULL, NULL, napi_default, NULL};
  status = napi_define_properties(env, exports, 1, &desc);
  if (status != napi_ok) return NULL;
  return exports;
}
```

Per impostare una funzione in modo che venga restituita da `require()` per l'addon:

```C
napi_value Init(napi_env env, napi_value exports) {
  napi_value method;
  napi_status status;
  status = napi_create_function(env, "exports", NAPI_AUTO_LENGTH, Method, NULL, &method);
  if (status != napi_ok) return NULL;
  return method;
}
```

Per definire una classe in modo che possano essere create nuove istanze (spesso utilizzato con [Object Wrap](#n_api_object_wrap)):

```C
// NOTA: esempio parziale, non è incluso tutto il codice di riferimento
napi_value Init(napi_env env, napi_value exports) {
  napi_status status;
  napi_property_descriptor properties[] = {
    { "value", NULL, NULL, GetValue, SetValue, NULL, napi_default, NULL },
    DECLARE_NAPI_METHOD("plusOne", PlusOne),
    DECLARE_NAPI_METHOD("multiply", Multiply),
  };

  napi_value cons;
  status =
      napi_define_class(env, "MyObject", New, NULL, 3, properties, &cons);
  if (status != napi_ok) return NULL;

  status = napi_create_reference(env, cons, 1, &constructor);
  if (status != napi_ok) return NULL;

  status = napi_set_named_property(env, exports, "MyObject", cons);
  if (status != napi_ok) return NULL;

  return exports;
}
```

Se ti aspetti che il tuo modulo venga caricato più volte durante il ciclo del processo Node.js, puoi utilizzare la macro `NAPI_MODULE_INIT` per inizializzare il tuo modulo:

```C
NAPI_MODULE_INIT() {
  napi_value answer;
  napi_status result;

  status = napi_create_int64(env, 42, &answer);
  if (status != napi_ok) return NULL;

  status = napi_set_named_property(env, exports, "answer", answer);
  if (status != napi_ok) return NULL;

  return exports;
}
```

Questa macro include `NAPI_MODULE`, e dichiara una funzione `Init` con un nome speciale e con una visibilità superiore all'addon. Questo consentirà a Node.js di inizializzare il modulo anche se viene caricato più volte.

Le variabili `env` ed `exports` saranno disponibili all'interno del corpo della funzione in seguito all'invocazione della macro.

Per maggiori dettagli sul settaggio delle proprietà sugli objects, vedi la sezione [Lavorare con le proprietà JavaScript](#n_api_working_with_javascript_properties).

Per maggiori dettagli sulla costruzione di moduli addon in generale, fare riferimento all'API esistente.

## Lavorare con i valori JavaScript

N-API espone un set di API per creare tutti i tipi di valori JavaScript. Alcuni di questi tipi sono documentati nella [Section 6](https://tc39.github.io/ecma262/#sec-ecmascript-data-types-and-values) del [ECMAScript Language Specification](https://tc39.github.io/ecma262/).

Fondamentalmente, queste API vengono utilizzate per eseguire una delle seguenti operazioni:

1. Creare un nuovo JavaScript object
2. Convertire da un tipo C primitivo ad un valore N-API
3. Converti da un valore N-API ad un tipo C primitivo
4. Ottenere istanze globali tra cui `undefined` e `null`

I valori N-API sono rappresentati dal tipo `napi_value`. Qualsiasi chiamata N-API che richiede un valore JavaScript accetta un `napi_value`. In alcuni casi, l'API controlla il tipo del `napi_value` in anticipo. Tuttavia, per prestazioni migliori, è meglio che il caller si assicuri che il `napi_value` in questione sia del tipo JavaScript previsto dall'API.

### Tipi di Enum

#### napi_valuetype

```C
typedef enum {
  // ES6 types (corresponds to typeof)
  napi_undefined,
  napi_null,
  napi_boolean,
  napi_number,
  napi_string,
  napi_symbol,
  napi_object,
  napi_function,
  napi_external,
} napi_valuetype;
```

Descrive il tipo di `napi_value`. Questo generalmente corrisponde ai tipi descritti nella [Section 6.1](https://tc39.github.io/ecma262/#sec-ecmascript-language-types) dell'ECMAScript Language Specification. Oltre ai tipi in quella sezione, `napi_valuetype` può anche rappresentare delle `Function` e degli `Object` con dati esterni.

Un valore JavaScript di tipo `napi_external` viene visualizzato in JavaScript come un semplice object in modo tale che nessuna proprietà e nessun prototipo possano essere impostati su di esso.

#### napi_typedarray_type

```C
typedef enum {
  napi_int8_array,
  napi_uint8_array,
  napi_uint8_clamped_array,
  napi_int16_array,
  napi_uint16_array,
  napi_int32_array,
  napi_uint32_array,
  napi_float32_array,
  napi_float64_array,
} napi_typedarray_type;
```

Questo rappresenta il datatype scalare binario sottostante di `TypedArray`. Gli elementi di questa enum corrispondono alla [Section 22.2](https://tc39.github.io/ecma262/#sec-typedarray-objects) dell'[ECMAScript Language Specification](https://tc39.github.io/ecma262/).

### Funzioni per la creazione di Objects

#### napi_create_array

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_create_array(napi_env env, napi_value* result)
```

- `[in] env`: L'ambiente in cui viene invocata la N-API call.
- `[out] result`: Un `napi_value` che rappresenta un JavaScript `Array`.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API restituisce un valore N-API corrispondente ad un tipo JavaScript `Array`. I JavaScript arrays sono descritti nella [Section 22.1](https://tc39.github.io/ecma262/#sec-array-objects) dell'ECMAScript Language Specification.

#### napi_create_array_with_length

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_create_array_with_length(napi_env env,
                                          size_t length,
                                          napi_value* result)
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] length`: La lunghezza iniziale dell'`Array`.
- `[out] result`: Un `napi_value` che rappresenta un JavaScript `Array`.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API restituisce un valore N-API corrispondente ad un tipo JavaScript `Array`. La proprietà della lunghezza dell'`Array` è impostata sul parametro della lunghezza passata/approvata. Tuttavia, il buffer sottostante non è garantito per essere pre-assegnato dalla VM quando viene creato l'array - tale comportamento viene lasciato all'implementazione della VM sottostante. Se il buffer deve essere un blocco contiguo di memoria che può essere letto e/o scritto direttamente tramite C, considerare l'utilizzo di [`napi_create_external_arraybuffer`][].

I JavaScript arrays sono descritti nella [Section 22.1](https://tc39.github.io/ecma262/#sec-array-objects) dell'ECMAScript Language Specification.

#### napi_create_arraybuffer

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_create_arraybuffer(napi_env env,
                                    size_t byte_length,
                                    void** data,
                                    napi_value* result)
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] length`: La lunghezza in bytes dell'array buffer da creare.
- `[out] data`: Puntatore al byte buffer sottostante di `ArrayBuffer`.
- `[out] result`: Un `napi_value` che rappresenta un JavaScript `ArrayBuffer`.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API restuisce un valore N-API corrispondente ad un JavaScript `ArrayBuffer`. Gli `ArrayBuffer` sono usati per rappresentare i buffers di dati binari a lunghezza fissa. Sono normalmente utilizzati come backing-buffer per gli `TypedArray` objects. L'`ArrayBuffer` allocato avrà un byte buffer sottostante la cui dimensione è determinata dal parametro `length` che è stato passato/approvato. Il buffer sottostante viene restituito in modo facoltativo al caller nel caso in cui il caller voglia manipolare direttamente il buffer. Questo buffer può essere scritto solo direttamente dal codice nativo. Per scrivere su questo buffer da JavaScript, è necessario creare un array tipizzato od un `DataView` object.

Gli JavaScript `ArrayBuffer` objects sono descritti nella [Section 24.1](https://tc39.github.io/ecma262/#sec-arraybuffer-objects) dell'ECMAScript Language Specification.

#### napi_create_buffer

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_create_buffer(napi_env env,
                               size_t size,
                               void** data,
                               napi_value* result)
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] size`: Dimensione in bytes del buffer sottostante.
- `[out] data`: Puntatore Raw al buffer sottostante.
- `[out] result`: Un `napi_value` che rappresenta un `node::Buffer`.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API alloca un `node::Buffer` object. Mentre questa è ancora una struttura di dati completamente supportata, nella maggior parte dei casi sarà sufficiente utilizzare un `TypedArray`.

#### napi_create_buffer_copy

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_create_buffer_copy(napi_env env,
                                    size_t length,
                                    const void* data,
                                    void** result_data,
                                    napi_value* result)
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] size`: Dimensione in bytes dell'input buffer (dovrebbe essere uguale alla dimensione del nuovo buffer).
- `[in] data`: Puntatore Raw al buffer sottostante da cui poter copiare.
- `[out] result_data`: Puntatore al buffer dei dati sottostanti del nuovo `Buffer`.
- `[out] result`: Un `napi_value` che rappresenta un `node::Buffer`.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API alloca un `node::Buffer` object e lo inizializza con i dati copiati dal buffer passato/approvato. Mentre questa è ancora una struttura di dati completamente supportata, nella maggior parte dei casi sarà sufficiente utilizzare un `TypedArray`.

#### napi_create_external

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_create_external(napi_env env,
                                 void* data,
                                 napi_finalize finalize_cb,
                                 void* finalize_hint,
                                 napi_value* result)
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] data`: Puntatore Raw ai dati esterni.
- `[in] finalize_cb`: Callback opzionale da chiamare quando viene raccolto il valore esterno.
- `[in] finalize_hint`: Hint opzionale da passare al callback finalizzato durante la raccolta.
- `[out] result`: Un `napi_value` che rappresenta un valore esterno.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API alloca un valore JavaScript con dati esterni associati ad esso. Questo è usato per passare dati esterni attraverso il codice JavaScript, quindi può essere recuperato in seguito dal codice nativo. L'API consente al caller di passare ad un callback finalizzato, nel caso in cui la risorsa nativa sottostante debba essere ripulita quando viene raccolto il valore JavaScript esterno.

Il valore creato non è un object, e pertanto non supporta proprietà aggiuntive. È considerato un tipo di valore distinto: chiamando `napi_typeof()` con un valore esterno produce `napi_external`.

#### napi_create_external_arraybuffer

<!-- YAML
added: v8.0.0
-->

```C
napi_status
napi_create_external_arraybuffer(napi_env env,
                                 void* external_data,
                                 size_t byte_length,
                                 napi_finalize finalize_cb,
                                 void* finalize_hint,
                                 napi_value* result)
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] external_data`: Puntatore al byte buffer sottostante dell'`ArrayBuffer`.
- `[in] byte_length`: La lunghezza in bytes del buffer sottostante.
- `[in] finalize_cb`: Callback opzionale da chiamare quando viene raccolto l'`ArrayBuffer`.
- `[in] finalize_hint`: Hint opzionale da passare al callback finalizzato durante la raccolta.
- `[out] result`: Un `napi_value` che rappresenta un JavaScript `ArrayBuffer`.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API restuisce un valore N-API corrispondente ad un JavaScript `ArrayBuffer`. Il byte buffer sottostante dell'`ArrayBuffer` è allocato e gestito esternamente. Il caller deve assicurarsi che il byte buffer rimanga valido fino alla chiamata del callback finalizzato.

I JavaScript `ArrayBuffer` sono descritti nella [Section 24.1](https://tc39.github.io/ecma262/#sec-arraybuffer-objects) dell'ECMAScript Language Specification.

#### napi_create_external_buffer

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_create_external_buffer(napi_env env,
                                        size_t length,
                                        void* data,
                                        napi_finalize finalize_cb,
                                        void* finalize_hint,
                                        napi_value* result)
```

- `[in] env`: L'ambiente in cui viene invocata l'APi.
- `[in] length`: Dimensione in bytes dell'input buffer (dovrebbe essere uguale alla dimensione del nuovo buffer).
- `[in] data`: Puntatore Raw al buffer sottostante da cui poter copiare.
- `[in] finalize_cb`: Callback opzionale da chiamare quando viene raccolto l'`ArrayBuffer`.
- `[in] finalize_hint`: Hint opzionale da passare al callback finalizzato durante la raccolta.
- `[out] result`: Un `napi_value` che rappresenta un `node::Buffer`.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API alloca un `node::Buffer` object e lo inizializza con i dati supportati dal buffer passato/approvato. Mentre questa è ancora una struttura di dati completamente supportata, nella maggior parte dei casi sarà sufficiente utilizzare un `TypedArray`.

Per Node.js >=4 i `Buffers` sono `Uint8Array`.

#### napi_create_function

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_create_function(napi_env env,
                                 const char* utf8name,
                                 size_t length,
                                 napi_callback cb,
                                 void* data,
                                 napi_value* result)
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] utf8name`: Una stringa che rappresenta il nome della funzione codificata come UTF8.
- `[in] length`: La lunghezza di `utf8name` in bytes, oppure `NAPI_AUTO_LENGTH` se è null-terminated.
- `[in] cb`: Un funzione puntatore alla funzione nativa da invocare quando la funzione creata viene invocata da JavaScript.
- `[in] data`: Arbitrary context data opzionali da passare alla funzione nativa quando viene invocata.
- `[out] result`: Un `napi_value` che rappresenta una funzione JavaScript.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API restituisce un valore N-API corrispondente ad un JavaScript `Function` object. È usata per avvolgere(wrap) le funzioni native in modo che possano essere invocate da JavaScript.

Le JavaScript `Function` sono descritte nella [Section 19.2](https://tc39.github.io/ecma262/#sec-function-objects) dell'ECMAScript Language Specification.

#### napi_create_object

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_create_object(napi_env env, napi_value* result)
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[out] result`: Un `napi_value` che rappresenta un JavaScript `Object`.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API alloca un JavaScript `Object` predefinito. È l'equivalente di fare `new Object()` in JavaScript.

Il tipo JavaScript `Object` è descritto nella [Section 6.1.7](https://tc39.github.io/ecma262/#sec-object-type) dell'ECMAScript Language Specification.

#### napi_create_symbol

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_create_symbol(napi_env env,
                               napi_value description,
                               napi_value* result)
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] description`: `napi_value` opzionale che fa riferimento ad una JavaScript `String` da impostare come descrizione per il simbolo.
- `[out] result`: Un `napi_value` che rappresenta un JavaScript `Symbol`.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API crea un JavaScript `Symbol` object da una stringa C con codifica UTF8.

Il tipo JavaScript `Symbol` è descritto nella [Section 19.4](https://tc39.github.io/ecma262/#sec-symbol-objects) dell'ECMAScript Language Specification.

#### napi_create_typedarray

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_create_typedarray(napi_env env,
                                   napi_typedarray_type type,
                                   size_t length,
                                   napi_value arraybuffer,
                                   size_t byte_offset,
                                   napi_value* result)
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] type`: Datatype scalare degli elementi all'interno di `TypedArray`.
- `[in] length`: Numero di elementi in `TypedArray`.
- `[in] arraybuffer`: `ArrayBuffer` sottostante all'array tipizzato.
- `[in] byte_offset`: Il byte offset all'interno dell'`ArrayBuffer` da cui iniziare a proiettare il `TypedArray`.
- `[out] result`: Un `napi_value` che rappresenta un JavaScript `TypedArray`.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API crea un JavaScript `TypedArray` object su un `ArrayBuffer` esistente. Gli `TypedArray` objects forniscono una visione simile all'array su un data buffer sottostante in cui ogni elemento ha lo stesso datatype scalare binario.

È richiesto che `(length * size_of_element) + byte_offset` debba essere <= della dimensione in bytes dell'array passato/approvato. In caso contrario, viene generata un'eccezione `RangeError`.

Gli JavaScript `TypedArray` objects sono descritti nella [Section 22.2](https://tc39.github.io/ecma262/#sec-typedarray-objects) dell'ECMAScript Language Specification.

#### napi_create_dataview

<!-- YAML
added: v8.3.0
-->

```C
napi_status napi_create_dataview(napi_env env,
                                 size_t byte_length,
                                 napi_value arraybuffer,
                                 size_t byte_offset,
                                 napi_value* result)
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] length`: Numero di elemtni in `DataView`.
- `[in] arraybuffer`: `ArrayBuffer` sottostante il `DataView`.
- `[in] byte_offset`: Il byte offset all'interno dell'`ArrayBuffer` da cui iniziare a proiettare il `DataView`.
- `[out] result`: Un `napi_value` che rappresenta un JavaScript `DataView`.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API crea un JavaScript `DataView` su un `ArrayBuffer` esistente. Gli `DataView` objects forniscono una visione simile all'array su un data buffer sottostante, ma uno che accetti elementi di dimensioni e tipo diversi nell'`ArrayBuffer`.

È richiesto che `byte_length + byte_offset` sia minore o uguale alla dimensione in bytes dell'array passato/approvato. In caso contrario, viene generata un'eccezione `RangeError`.

Gli JavaScript `DataView` objects sono descritti nella [Section 24.3](https://tc39.github.io/ecma262/#sec-dataview-objects) dell'ECMAScript Language Specification.

### Funzioni per la conversione da tipi C a N-API

#### napi_create_int32

<!-- YAML
added: v8.4.0
-->

```C
napi_status napi_create_int32(napi_env env, int32_t value, napi_value* result)
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] value`: Valore integer(intero) da rappresentare in JavaScript.
- `[out] result`: Un `napi_value` che rappresenta un JavaScript `Number`.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API viene utilizzata per la conversione dal tipo C `int32_t` al tipo JavaScript `Number`.

Il tipo JavaScript `Number` è descritto nella [Section 6.1.6](https://tc39.github.io/ecma262/#sec-ecmascript-language-types-number-type) dell'ECMAScript Language Specification.

#### napi_create_uint32

<!-- YAML
added: v8.4.0
-->

```C
napi_status napi_create_uint32(napi_env env, uint32_t value, napi_value* result)
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] value`: Valore unsigned integer da rappresentare in JavaScript.
- `[out] result`: Un `napi_value` che rappresenta un JavaScript `Number`.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API viene utilizzata per la conversione dal tipo C `uint32_t` al tipo JavaScript `Number`.

Il tipo JavaScript `Number` è descritto nella [Section 6.1.6](https://tc39.github.io/ecma262/#sec-ecmascript-language-types-number-type) dell'ECMAScript Language Specification.

#### napi_create_int64

<!-- YAML
added: v8.4.0
-->

```C
napi_status napi_create_int64(napi_env env, int64_t value, napi_value* result)
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] value`: Valore integer da rappresentare in JavaScript.
- `[out] result`: Un `napi_value` che rappresenta un JavaScript `Number`.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API viene utilizzata per la conversione da tipo C `int64_t` a tipo JavaScript `Number`.

Il tipo JavaScript `Number` è descritto nella [Section 6.1.6](https://tc39.github.io/ecma262/#sec-ecmascript-language-types-number-type) dell'ECMAScript Language Specification. Nota che l'intervallo completo di `int64_t` non può essere rappresentato con la massima precisione in JavaScript. I valori integer al di fuori dell'intervallo di [`Number.MIN_SAFE_INTEGER`](https://tc39.github.io/ecma262/#sec-number.min_safe_integer) -(2^53 - 1) - [`Number.MAX_SAFE_INTEGER`](https://tc39.github.io/ecma262/#sec-number.max_safe_integer) (2^53 - 1) perderanno precisione.

#### napi_create_double

<!-- YAML
added: v8.4.0
-->

```C
napi_status napi_create_double(napi_env env, double value, napi_value* result)
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] value`: Valore double-precision(doppia precisione) da rappresentare in JavaScript.
- `[out] result`: Un `napi_value` che rappresenta un JavaScript `Number`.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API viene utilizzata per la conversione del tipo C `double` al tipo JavaScript `Number`.

Il tipo JavaScript `Number` è descritto nella [Section 6.1.6](https://tc39.github.io/ecma262/#sec-ecmascript-language-types-number-type) dell'ECMAScript Language Specification.

#### napi_create_string_latin1

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_create_string_latin1(napi_env env,
                                      const char* str,
                                      size_t length,
                                      napi_value* result);
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] str`: Character buffer che rappresenta una stringa con codifica ISO-8859-1.
- `[in] length`: La lunghezza della stringa in bytes, oppure `NAPI_AUTO_LENGTH` se è null-terminated.
- `[out] result`: Un `napi_value` che rappresenta una JavaScript `String`.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API crea un JavaScript `String` object da una stringa C con codifica ISO-8859-1. La stringa nativa viene copiata.

Il tipo JavaScript `String` è descritto nella [Section 6.1.4](https://tc39.github.io/ecma262/#sec-ecmascript-language-types-string-type) dell'ECMAScript Language Specification.

#### napi_create_string_utf16

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_create_string_utf16(napi_env env,
                                     const char16_t* str,
                                     size_t length,
                                     napi_value* result)
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] str`: Character buffer che rappresenta una stringa con codifica UTF16-LE.
- `[in] length`: La lunghezza della stringa in two-byte code units, oppure `NAPI_AUTO_LENGTH` se è null-terminated.
- `[out] result`: Un `napi_value` che rappresenta una JavaScript `String`.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API crea un JavaScript `String` object da una stringa C con codifica UTF16-LE. La stringa nativa viene copiata.

Il tipo JavaScript `String` è descritto nella [Section 6.1.4](https://tc39.github.io/ecma262/#sec-ecmascript-language-types-string-type) dell'ECMAScript Language Specification.

#### napi_create_string_utf8

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_create_string_utf8(napi_env env,
                                    const char* str,
                                    size_t length,
                                    napi_value* result)
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] str`: Character buffer che rappresenta una stringa con codifica UTF8.
- `[in] length`: La lunghezza della stringa in bytes, oppure `NAPI_AUTO_LENGTH` se è null-terminated.
- `[out] result`: Un `napi_value` che rappresenta una JavaScript `String`.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API crea un JavaScript `String` object da una stringa C con codifica UTF8. La stringa nativa viene copiata.

Il tipo JavaScript `String` è descritto nella [Section 6.1.4](https://tc39.github.io/ecma262/#sec-ecmascript-language-types-string-type) dell'ECMAScript Language Specification.

### Funzioni per la conversione da N-API a tipi C

#### napi_get_array_length

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_get_array_length(napi_env env,
                                  napi_value value,
                                  uint32_t* result)
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] value`: `napi_value` che rappresenta il JavaScript `Array` di cui viene interrogata la lunghezza.
- `[out] result`: `uint32` che rappresenta la lunghezza dell'array.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API restituisce la lunghezza di un'array.

La lunghezza dell'`Array` è descritta nella [Section 22.1.4.1](https://tc39.github.io/ecma262/#sec-properties-of-array-instances-length) dell'ECMAScript Language Specification.

#### napi_get_arraybuffer_info

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_get_arraybuffer_info(napi_env env,
                                      napi_value arraybuffer,
                                      void** data,
                                      size_t* byte_length)
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] arraybuffer`: `napi_value` che rappresenta l'`ArrayBuffer` interrogato.
- `[out] data`: Il data buffer sottostante dell'`ArrayBuffer`.
- `[out] byte_length`: Lunghezza in bytes del data buffer sottostante.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API viene utilizzata per recuperare il data buffer sottostante di un `ArrayBuffer` e la sua lunghezza.

*WARNING*: Prestare attenzione durante l'utilizzo di quest'API. La durata del data buffer sottostante è gestita dall'`ArrayBuffer` anche dopo che viene restituito. Un possibile metodo sicuro per utilizzare quest'API è insieme a [`napi_create_reference`][], che può essere utilizzato per garantire il controllo della durata dell'`ArrayBuffer`. È anche sicuro utilizzare il data buffer restituito all'interno dello stesso callback fin quando non ci sono calls ad altre API che potrebbero attivare un GC.

#### napi_get_buffer_info

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_get_buffer_info(napi_env env,
                                 napi_value value,
                                 void** data,
                                 size_t* length)
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] value`: `napi_value` che rappresenta il `node::Buffer` interrogato.
- `[out] data`: Il data buffer sottostante al `node::Buffer`.
- `[out] length`: Lunghezza in bytes del data buffer sottostante.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API viene utilizzata per recuperare il data buffer sottostante di un `node::Buffer` e la sua lunghezza.

*Warning*: Prestare attenzione durante l'utilizzo di quest'API poiché la durata del data buffer sottostante non è garantita se è gestita dalla VM.

#### napi_get_prototype

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_get_prototype(napi_env env,
                               napi_value object,
                               napi_value* result)
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] object`: `napi_value` che rappresenta il JavaScript `Object` che deve restituire il prototipo. Questo restituisce l'equivalente di `Object.getPrototypeOf` (che non ha lo stesso ruolo della proprietà del `prototype` della funzione).
- `[out] result`: `napi_value` che rappresenta il prototipo dell'object dato.

Restituisce `napi_ok` se l'API ha esito positivo.

#### napi_get_typedarray_info

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_get_typedarray_info(napi_env env,
                                     napi_value typedarray,
                                     napi_typedarray_type* type,
                                     size_t* length,
                                     void** data,
                                     napi_value* arraybuffer,
                                     size_t* byte_offset)
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] typedarray`: `napi_value` che rappresenta il `TypedArray` le cui proprietà sono da interrogare.
- `[out] type`: Datatype scalare degli elementi all'interno di `TypedArray`.
- `[out] length`: `Number` (numero) di elementi in `TypedArray`.
- `[out] data`: Il data buffer sottostante l'array tipizzato (typed array).
- `[out] byte_offset`: Il byte offset all'interno del data buffer da cui iniziare a proiettare il `TypedArray`.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API restituisce varie proprietà di un array tipizzato (typed array).

*Warning*: Prestare attenzione durante l'utilizzo di quest'API poiché il data buffer sottostante è gestito dalla VM.

#### napi_get_dataview_info

<!-- YAML
added: v8.3.0
-->

```C
napi_status napi_get_dataview_info(napi_env env,
                                   napi_value dataview,
                                   size_t* byte_length,
                                   void** data,
                                   napi_value* arraybuffer,
                                   size_t* byte_offset)
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] dataview`: `napi_value` che rappresenta il `DataView` le cui proprietà sono da interrogare.
- `[out] byte_length`: `Number` (numero) di bytes in `DataView`.
- `[out] data`: Il data buffer sottostante il `DataView`.
- `[out] arraybuffer`: `ArrayBuffer` sottostante il `DataView`.
- `[out] byte_offset`: Il byte offset all'interno del data buffer da cui iniziare a proiettare il `DataView`.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API restituisce varie proprietà di un `DataView`.

#### napi_get_value_bool

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_get_value_bool(napi_env env, napi_value value, bool* result)
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] value`: `napi_value` che rappresenta un JavaScript `Boolean`.
- `[out] result`: C booleano primitivo equivalente al JavaScript `Boolean` fornito.

Restituisce `napi_ok` se l'API ha esito positivo. Se viene passato un valore `napi_value` non booleano esso restituisce `napi_boolean_expected`.

Quest'API restituisce un C booleano primitivo equivalente al JavaScript `Boolean` fornito.

#### napi_get_value_double

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_get_value_double(napi_env env,
                                  napi_value value,
                                  double* result)
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] value`: `napi_value` che rappresenta un JavaScript `Number`.
- `[out] result`: C double primitivo equivalente al JavaScript `Number` fornito.

Restituisce `napi_ok` se l'API ha esito positivo. Se viene passato un valore `napi_value` non numerico esso restituisce `napi_number_expected`.

Quest'API restituisce un C double primitivo equivalente al JavaScript `Number` fornito.

#### napi_get_value_external

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_get_value_external(napi_env env,
                                    napi_value value,
                                    void** result)
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] value`: `napi_value` che rappresenta un valore esterno di JavaScript.
- `[out] result`: Puntatore ai dati che hanno subito il wrapping da parte del valore esterno di JavaScript.

Restituisce `napi_ok` se l'API ha esito positivo. Se viene passato un valore `napi_value` non esterno esso restituisce `napi_invalid_arg`.

Quest'API recupera il puntatore ai dati esterni passato in precedenza a `napi_create_external()`.

#### napi_get_value_int32

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_get_value_int32(napi_env env,
                                 napi_value value,
                                 int32_t* result)
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] value`: `napi_value` che rappresenta un JavaScript `Number`.
- `[out] result`: C `int32` primitivo equivalente al JavaScript `Number` fornito.

Restituisce `napi_ok` se l'API ha esito positivo. Se viene passato un valore `napi_value` non numerico in `napi_number_expected`.

Quest'API restituisce un C `int32` primitivo equivalente al JavaScript `Number` fornito.

Se il numero supera l'intervallo del valore integer a 32 bit, allora il risultato viene troncato all'equivalente dei 32 bits inferiori. Questo può determinare un numero positivo elevato che diventa un numero negativo se il valore è > 2^31 -1.

I valori numerici non finiti (`NaN`, `+Infinity`, oppure `-Infinity`) impostano il risultato su zero.

#### napi_get_value_int64

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_get_value_int64(napi_env env,
                                 napi_value value,
                                 int64_t* result)
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] value`: `napi_value` che rappresenta un JavaScript `Number`.
- `[out] result`: C `int64` primitivo equivalente al JavaScript `Number` fornito.

Restituisce `napi_ok` se l'API ha esito positivo. Se viene passato un valore `napi_value` non numerico esso restituisce `napi_number_expected`.

Quest'API restituisce un C `int64` primitivo equivalente al JavaScript `Number` fornito.

I valori `Number` (numerici) al di fuori dell'intervallo [`Number.MIN_SAFE_INTEGER`](https://tc39.github.io/ecma262/#sec-number.min_safe_integer) -(2^53 - 1) - [`Number.MAX_SAFE_INTEGER`](https://tc39.github.io/ecma262/#sec-number.max_safe_integer) (2^53 - 1) perderanno precisione.

I valori numerici non finiti (`NaN`, `+Infinity`, oppure `-Infinity`) impostano il risultato su zero.

#### napi_get_value_string_latin1

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_get_value_string_latin1(napi_env env,
                                         napi_value value,
                                         char* buf,
                                         size_t bufsize,
                                         size_t* result)
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] value`: `napi_value` che rappresenta una stringa JavaScript.
- `[in] buf`: Buffer nel quale scrivere la stringa con codifica ISO-8859-1. Se viene passato NULL, viene restituita la lunghezza della stringa (in bytes).
- `[in] bufsize`: Dimensione del buffer di destinazione. Quando questo valore è insufficiente, la stringa restituita verrà troncata.
- `[out] result`: Numero di bytes copiati all'interno del buffer, escluso il null terminator.

Restituisce `napi_ok` se l'API ha esito positivo. Se viene passato un valore `napi_value` che non sia `String` esso restituisce `napi_string_expected`.

Quest'API restituisce la stringa con codifica ISO-8859-1 corrispondente al valore passato.

#### napi_get_value_string_utf8

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_get_value_string_utf8(napi_env env,
                                       napi_value value,
                                       char* buf,
                                       size_t bufsize,
                                       size_t* result)
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] value`: `napi_value` che rappresenta una stringa JavaScript.
- `[in] buf`: Buffer nel quale scrivere la stringa con codifica UTF8. Se viene passato NULL, viene restituita la lunghezza della stringa (in bytes).
- `[in] bufsize`: Dimensione del buffer di destinazione. Quando questo valore è insufficiente, la stringa restituita verrà troncata.
- `[out] result`: Numero di bytes copiati all'interno del buffer, escluso il null terminator.

Restituisce `napi_ok` se l'API ha esito positivo. Se viene passato un valore `napi_value` che non sia `String` esso restituisce `napi_string_expected`.

Quest'API restituisce la stringa con codifica UTF8 corrispondente al valore passato.

#### napi_get_value_string_utf16

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_get_value_string_utf16(napi_env env,
                                        napi_value value,
                                        char16_t* buf,
                                        size_t bufsize,
                                        size_t* result)
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] value`: `napi_value` che rappresenta una stringa JavaScript.
- `[in] buf`: Buffer nel quale scrivere la stringa con codifica UTF16-LE. Se viene passato NULL, viene restituita la lunghezza della stringa (in unità di codice a 2 byte).
- `[in] bufsize`: Dimensione del buffer di destinazione. Quando questo valore è insufficiente, la stringa restituita verrà troncata.
- `[out] result`: Numero di unità di codice a 2 byte copiate all'interno del buffer, escluso il null terminator.

Restituisce `napi_ok` se l'API ha esito positivo. Se viene passato un valore `napi_value` che non sia `String` esso restituisce `napi_string_expected`.

Quest'API restituisce la stringa con codifica UTF16 corrispondente al valore passato.

#### napi_get_value_uint32

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_get_value_uint32(napi_env env,
                                  napi_value value,
                                  uint32_t* result)
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] value`: `napi_value` che rappresenta un JavaScript `Number`.
- `[out] result`: C primitivo equivalente al `napi_value` fornito come un `uint32_t`.

Restituisce `napi_ok` se l'API ha esito positivo. Se viene passato un valore `napi_value` non numerico esso restituisce `napi_number_expected`.

Quest'API restituisce un C primitivo equivalente al `napi_value` fornito come un `uint32_t`.

### Funzioni per ottenere istanze globali

#### napi_get_boolean

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_get_boolean(napi_env env, bool value, napi_value* result)
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] value`: Il valore del booleano da recuperare.
- `[out] result`: `napi_value` che rappresenta un JavaScript `Boolean` singleton da recuperare.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API viene utilizzata per restituire il JavaScript singleton object che viene utilizzato per rappresentare il valore booleano fornito.

#### napi_get_global

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_get_global(napi_env env, napi_value* result)
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[out] result`: `napi_value` che rappresenta un JavaScript `global` object.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API restituisce il `global` object.

#### napi_get_null

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_get_null(napi_env env, napi_value* result)
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[out] result`: `napi_value` che rappresenta un JavaScript `null` object.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API restituisce il `null` object.

#### napi_get_undefined

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_get_undefined(napi_env env, napi_value* result)
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[out] result`: `napi_value` che rappresenta un valore JavaScript Undefined.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API restituisce l'Undefined object.

## Lavorare con i valori JavaScript - Abstract Operations

N-API fornisce un set di API per eseguire alcune abstract operations su valori JavaScript. Alcune di queste operations sono documentate nella [Section 7](https://tc39.github.io/ecma262/#sec-abstract-operations) dell'[ECMAScript Language Specification](https://tc39.github.io/ecma262/).

Queste API supportano una delle seguenti operations:

1. Forzare i valori JavaScript a specifici tipi JavaScript (come `Number` oppure `String`).
2. Controllare il tipo di un valore JavaScript.
3. Verificare l'uguaglianza tra due valori JavaScript.

### napi_coerce_to_bool

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_coerce_to_bool(napi_env env,
                                napi_value value,
                                napi_value* result)
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] value`: Il valore JavaScript da forzare.
- `[out] result`: `napi_value` che rappresenta il JavaScript `Boolean` forzato.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API implementa l'abstract operation `ToBoolean()` come definito nella [Section 7.1.2](https://tc39.github.io/ecma262/#sec-toboolean) dell'ECMAScript Language Specification. Quest'API può essere rientrante se i getters sono definiti nell'`Object` passato.

### napi_coerce_to_number

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_coerce_to_number(napi_env env,
                                  napi_value value,
                                  napi_value* result)
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] value`: Il valore JavaScript da forzare.
- `[out] result`: `napi_value` che rappresenta il JavaScript `Number` forzato.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API implementa l'abstract operation `ToNumber()` come definito nella [Section 7.1.3](https://tc39.github.io/ecma262/#sec-tonumber) dell'ECMAScript Language Specification. Quest'API può essere rientrante se i getters sono definiti nell'`Object` passato.

### napi_coerce_to_object

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_coerce_to_object(napi_env env,
                                  napi_value value,
                                  napi_value* result)
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] value`: Il valore JavaScript da forzare.
- `[out] result`: `napi_value` che rappresenta il JavaScript `Object` forzato.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API implementa l'abstract operation `ToObject()` come definito nella [Section 7.1.13](https://tc39.github.io/ecma262/#sec-toobject) dell'ECMAScript Language Specification. Quest'API può essere rientrante se i getters sono definiti nell'`Object` passato.

### napi_coerce_to_string

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_coerce_to_string(napi_env env,
                                  napi_value value,
                                  napi_value* result)
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] value`: Il valore JavaScript da forzare.
- `[out] result`: `napi_value` che rappresenta la JavaScript `String` forzata.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API implementa l'abstract operation `ToString()` come definito nella [Section 7.1.13](https://tc39.github.io/ecma262/#sec-tostring) dell'ECMAScript Language Specification. Quest'API può essere rientrante se i getters sono definiti nell'`Object` passato.

### napi_typeof

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_typeof(napi_env env, napi_value value, napi_valuetype* result)
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] value`: Il valore JavaScript il cui tipo è da interrogare.
- `[out] result`: Il tipo del valore JavaScript.

Restituisce `napi_ok` se l'API ha esito positivo.

- `napi_invalid_arg` se il tipo di `value` non è un tipo ECMAScript noto e se `value` non è un valore esterno.

Quest'API si comporta in modo simile all'invocazione del `typeof` Operator sull'object come definito nella [Section 12.5.5](https://tc39.github.io/ecma262/#sec-typeof-operator) dell'ECMAScript Language Specification. Tuttavia, ha il supporto per rilevare un valore esterno. Se `value` ha un tipo che non è valido, viene restituito un errore.

### napi_instanceof

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_instanceof(napi_env env,
                            napi_value object,
                            napi_value constructor,
                            bool* result)
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] object`: Il valore JavaScript da verificare.
- `[in] constructor`: Il JavaScript function object della funzione constructor con il quale verificarlo.
- `[out] result`: Valore booleano impostato su true se `object instanceof constructor` è true.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API si comporta in modo simile all'invocazione del `instanceof` Operator sull'object come definito nella [Section 12.10.4](https://tc39.github.io/ecma262/#sec-instanceofoperator) dell'ECMAScript Language Specification.

### napi_is_array

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_is_array(napi_env env, napi_value value, bool* result)
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] value`: Il valore JavaScript da verificare.
- `[out] result`: Se l'object fornito è un array.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API si comporta in modo simile all'invocazione del `IsArray` operation sull'object come definito nella [Section 7.2.2](https://tc39.github.io/ecma262/#sec-isarray) dell'ECMAScript Language Specification.

### napi_is_arraybuffer

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_is_arraybuffer(napi_env env, napi_value value, bool* result)
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] value`: Il valore JavaScript da verificare.
- `[out] result`: Se l'object fornito è un `ArrayBuffer`.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API controlla se l'`Object` passato è un array buffer.

### napi_is_buffer

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_is_buffer(napi_env env, napi_value value, bool* result)
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] value`: Il valore JavaScript da verificare.
- `[out] result`: Se il `napi_value` fornito rappresenta un `node::Buffer` object.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API controlla se l'`Object` passato è un buffer.

### napi_is_error

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_is_error(napi_env env, napi_value value, bool* result)
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] value`: Il valore JavaScript da verificare.
- `[out] result`: Se il `napi_value` fornito rappresenta un `Error` object.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API controlla se l'`Object` passato è un `Error`.

### napi_is_typedarray

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_is_typedarray(napi_env env, napi_value value, bool* result)
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] value`: Il valore JavaScript da verificare.
- `[out] result`: Se il `napi_value` fornito rappresenta un `TypedArray`.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API controlla se l'`Object` passato è un array tipizzato (typed array).

### napi_is_dataview

<!-- YAML
added: v8.3.0
-->

```C
napi_status napi_is_dataview(napi_env env, napi_value value, bool* result)
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] value`: Il valore JavaScript da verificare.
- `[out] result`: Se il `napi_value` fornito rappresenta un `DataView`.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API controlla se l'`Object` passato è un `DataView`.

### napi_strict_equals

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_strict_equals(napi_env env,
                               napi_value lhs,
                               napi_value rhs,
                               bool* result)
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] lhs`: Il valore JavaScript da verificare.
- `[in] rhs`: Il valore JavaScript con il quale verificarlo.
- `[out] result`: Se i due `napi_value` objects sono uguali.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API si comporta in modo simile all'invocazione dell'algoritmo Strict Equality come definito nella [Section 7.2.14](https://tc39.github.io/ecma262/#sec-strict-equality-comparison) dell'ECMAScript Language Specification.

## Lavorare con le Proprietà JavaScript

N-API fornisce un set di API per ottenere ed impostare le proprietà sugli JavaScript objects. Alcuni di questi tipi sono documentati nella [Section 7](https://tc39.github.io/ecma262/#sec-operations-on-objects) dell'[ECMAScript Language Specification](https://tc39.github.io/ecma262/).

Le proprietà in JavaScript sono rappresentate come una tupla di una key ed un valore. Fondamentalmente, tutte le property keys in N-API possono essere rappresentate in una delle seguenti forme:

- Named: una semplice stringa con codifica UTF8
- Integer-Indexed: un valore di indice rappresentato tramite `uint32_t`
- JavaScript value: questi sono rappresentati in N-API tramite `napi_value`. Può essere un `napi_value` che rappresenta una `String` (stringa), un `Number` (numero), oppure un `Symbol` (simbolo).

I valori N-API sono rappresentati dal tipo `napi_value`. Qualsiasi chiamata N-API che richiede un un valore JavaScript accetta un `napi_value`. Tuttavia, è responsabilità del caller assicurarsi che il `napi_value` in questione sia del tipo JavaScript previsto dall'API.

Le API documentate in questa sezione forniscono una semplice interfaccia per ottenere ed impostare le proprietà su JavaScript objects arbitrari rappresentati tramite `napi_value`.

Ad esempio, considera il seguente frammento di codice JavaScript:

```js
const obj = {};
obj.myProp = 123;
```

L'equivalente può essere fatto usando i valori N-API con il seguente frammento:

```C
napi_status status = napi_generic_failure;

// const obj = {}
napi_value obj, value;
status = napi_create_object(env, &obj);
if (status != napi_ok) return status;

// Crea un napi_value per 123
status = napi_create_int32(env, 123, &value);
if (status != napi_ok) return status;

// obj.myProp = 123
status = napi_set_named_property(env, obj, "myProp", value);
if (status != napi_ok) return status;
```

Le proprietà indicizzate possono essere impostate in modo simile. Considera il seguente frammento JavaScript:

```js
const arr = [];
arr[123] = 'hello';
```

L'equivalente può essere fatto usando i valori N-API con il seguente frammento:

```C
napi_status status = napi_generic_failure;

// const arr = [];
napi_value arr, value;
status = napi_create_array(env, &arr);
if (status != napi_ok) return status;

// Crea un napi_value per 'hello'
status = napi_create_string_utf8(env, "hello", NAPI_AUTO_LENGTH, &value);
if (status != napi_ok) return status;

// arr[123] = 'hello';
status = napi_set_element(env, arr, 123, value);
if (status != napi_ok) return status;
```

Le proprietà possono essere recuperate utilizzando le API descritte in questa sezione. Considera il seguente frammento JavaScript:

```js
const arr = [];
const value = arr[123];
```

Quanto segue è l'equivalente approssimativo della controparte N-API:

```C
napi_status status = napi_generic_failure;

// const arr = []
napi_value arr, value;
status = napi_create_array(env, &arr);
if (status != napi_ok) return status;

// const value = arr[123]
status = napi_get_element(env, arr, 123, &value);
if (status != napi_ok) return status;
```

Infine, è possibile definire più proprietà su un object per motivi di prestazioni. Considera il seguente codice JavaScript:

```js
const obj = {};
Object.defineProperties(obj, {
  'foo': { value: 123, writable: true, configurable: true, enumerable: true },
  'bar': { value: 456, writable: true, configurable: true, enumerable: true }
});
```

Quanto segue è l'equivalente approssimativo della controparte N-API:

```C
napi_status status = napi_status_generic_failure;

// const obj = {};
napi_value obj;
status = napi_create_object(env, &obj);
if (status != napi_ok) return status;

// Crea napi_values per 123 e 456
napi_value fooValue, barValue;
status = napi_create_int32(env, 123, &fooValue);
if (status != napi_ok) return status;
status = napi_create_int32(env, 456, &barValue);
if (status != napi_ok) return status;

// Imposta le proprietà
napi_property_descriptor descriptors[] = {
  { "foo", NULL, NULL, NULL, NULL, fooValue, napi_default, NULL },
  { "bar", NULL, NULL, NULL, NULL, barValue, napi_default, NULL }
}
status = napi_define_properties(env,
                                obj,
                                sizeof(descriptors) / sizeof(descriptors[0]),
                                descriptors);
if (status != napi_ok) return status;
```

### Strutture

#### napi_property_attributes

```C
typedef enum {
  napi_default = 0,
  napi_writable = 1 << 0,
  napi_enumerable = 1 << 1,
  napi_configurable = 1 << 2,

  // Usato con napi_define_class per distinguere le proprietà statiche
  // dalle proprietà dell'istanza. Ignorato da napi_define_properties.
  napi_static = 1 << 10,
} napi_property_attributes;
```

Gli `napi_property_attributes` sono flags (bandiere) utilizzate per controllare il comportamento delle proprietà impostate su un JavaScript object. A parte `napi_static` essi corrispondono agli attributi elencati nella [Section 6.1.7.1](https://tc39.github.io/ecma262/#table-2) dell'[ECMAScript Language Specification](https://tc39.github.io/ecma262/). Possono essere uno o più dei seguenti bitflags:

- `napi_default` - Utilizzato per indicare che non sono stati impostati attributi espliciti sulla proprietà specificata. Per impostazione predefinita, una proprietà è di sola lettura, non enumerabile e non configurabile.
- `napi_writable` - Utilizzato per indicare che una determinata proprietà è scrivibile.
- `napi_enumerable` - Utilizzato per indicare che una determinata proprietà è enumerabile.
- `napi_configurable` - Utilizzato per indicare che una determinata proprietà è configurabile, com'è definito nella [Section 6.1.7.1](https://tc39.github.io/ecma262/#table-2) dell'[ECMAScript Language Specification](https://tc39.github.io/ecma262/).
- `napi_static` - Utilizzato per indicare che la proprietà verrà definita come una proprietà statica su una classe al posto di una proprietà dell'istanza, che è l'impostazione predefinita. Questo è usato solo tramite [`napi_define_class`][]. E' ignorato da `napi_define_properties`.

#### napi_property_descriptor

```C
typedef struct {
  // Una di tipo utf8name oppure il nome dovrebbe essere NULL.
  const char* utf8name;
  napi_value name;

  napi_callback method;
  napi_callback getter;
  napi_callback setter;
  napi_value value;

  napi_property_attributes attributes;
  void* data;
} napi_property_descriptor;
```

- `utf8name`: `String` (stringa) opzionale che descrive la key per la proprietà, codificata come UTF8. Uno tra `utf8name` oppure `name` deve essere fornito per la proprietà.
- `name`: `napi_value` facoltativo che punta ad una stringa od un simbolo JavaScript da utilizzare come key per la proprietà. Uno tra `utf8name` oppure `name` deve essere fornito per la proprietà.
- `value`: Il valore recuperato tramite un get access della proprietà se la proprietà è una proprietà dei dati. Se questo viene passato, imposta `getter`, `setter`, `method` e `data` a `NULL` (poiché questi membri non saranno usati).
- `getter`: Una funzione da chiamare quando viene eseguito un get access della proprietà. Se questo viene passato, imposta `value` e `method` a `NULL` (poiché questi membri non saranno usati). La funzione specificata viene chiamata implicitamente dal runtime quando si accede alla proprietà dal codice JavaScript (o se viene eseguito un get sulla proprietà utilizzando una chiamata N-API).
- `setter`: Una funzione da chiamare quando viene eseguito un set access della proprietà. Se questo viene passato, imposta `value` e `method` a `NULL` (poiché questi membri non saranno usati). La funzione specificata viene chiamata implicitamente dal runtime quando la proprietà viene impostata dal codice JavaScript (o se viene eseguito un set sulla proprietà utilizzando una chiamata N-API).
- `method`: Impostalo per fare in modo che la `value` property del property descriptor object sia una funzione JavaScript rappresentata tramite `method`. Se questo viene passato, imposta `value`, `getter` e `setter` a `NULL` (poiché questi membri non saranno usati).
- `attributes`: Gli attributi associati alla particolare proprietà. Vedi [`napi_property_attributes`](#n_api_napi_property_attributes).
- `data`: I dati di callback vengono passati in `method`, `getter` e `setter` se viene invocata questa funzione.

### Funzioni

#### napi_get_property_names

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_get_property_names(napi_env env,
                                    napi_value object,
                                    napi_value* result);
```

- `[in] env`: L'ambiente in cui viene invocata la N-API call.
- `[in] object`: L'object da cui recuperare le proprietà.
- `[out] result`: Un `napi_value` che rappresenta un array di valori JavaScript che indicano i nomi delle proprietà dell'object. L'API può essere utilizzata per iterare su `result` usando [`napi_get_array_length`][] e [`napi_get_element`][].

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API restituisce i nomi delle proprietà enumerabili di `object` come un'array di stringhe. Le proprietà di `object`, la cui key è un simbolo, non saranno incluse.

#### napi_set_property

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_set_property(napi_env env,
                              napi_value object,
                              napi_value key,
                              napi_value value);
```

- `[in] env`: L'ambiente in cui viene invocata la N-API call.
- `[in] object`: L'object su cui impostare la proprietà.
- `[in] key`: Il nome della proprietà da impostare.
- `[in] value`: Il valore della proprietà.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API imposta una proprietà sull'`Object` passato/approvato.

#### napi_get_property

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_get_property(napi_env env,
                              napi_value object,
                              napi_value key,
                              napi_value* result);
```

- `[in] env`: L'ambiente in cui viene invocata la N-API call.
- `[in] object`: L'object da cui recuperare la proprietà.
- `[in] key`: Il nome della proprietà da recuperare.
- `[out] result`: Il valore della proprietà.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API ottiene la proprietà richiesta dall'`Object` passato/approvato.

#### napi_has_property

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_has_property(napi_env env,
                              napi_value object,
                              napi_value key,
                              bool* result);
```

- `[in] env`: L'ambiente in cui viene invocata la N-API call.
- `[in] object`: L'object da interrogare.
- `[in] key`: Il nome della proprietà di cui bisogna verificare l'esistenza.
- `[out] result`: Se la proprietà esiste nell'object oppure no.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API controlla se l'`Object` passato/approvato ha la proprietà nominata.

#### napi_delete_property

<!-- YAML
added: v8.2.0
-->

```C
napi_status napi_delete_property(napi_env env,
                                 napi_value object,
                                 napi_value key,
                                 bool* result);
```

- `[in] env`: L'ambiente in cui viene invocata la N-API call.
- `[in] object`: L'object da interrogare.
- `[in] key`: Il nome della proprietà da cancellare.
- `[out] result`: Se la cancellazione della proprietà è avvenuta con successo o meno. Facoltativamente, il `result` può essere ignorato passando `NULL`.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API tenta di eliminare la `key` own property da `object`.

#### napi_has_own_property

<!-- YAML
added: v8.2.0
-->

```C
napi_status napi_has_own_property(napi_env env,
                                  napi_value object,
                                  napi_value key,
                                  bool* result);
```

- `[in] env`: L'ambiente in cui viene invocata la N-API call.
- `[in] object`: L'object da interrogare.
- `[in] key`: Il nome della own property di cui bisogna verificare l'esistenza.
- `[out] result`: Se l'own property esiste nell'object oppure no.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API controlla se l'`Object` passato ha la own property nominata. La `key` deve essere una stringa od un `Symbol`, altrimenti verrà generato un errore. N-API non eseguirà alcuna conversione tra i tipi di dati.

#### napi_set_named_property

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_set_named_property(napi_env env,
                                    napi_value object,
                                    const char* utf8Name,
                                    napi_value value);
```

- `[in] env`: L'ambiente in cui viene invocata la N-API call.
- `[in] object`: L'object su cui impostare la proprietà.
- `[in] utf8Name`: Il nome della proprietà da impostare.
- `[in] value`: Il valore della proprietà.

Restituisce `napi_ok` se l'API ha esito positivo.

Questo metodo equivale a chiamare [`napi_set_property`][] con un `napi_value` creato dalla stringa passata come `utf8Name`.

#### napi_get_named_property

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_get_named_property(napi_env env,
                                    napi_value object,
                                    const char* utf8Name,
                                    napi_value* result);
```

- `[in] env`: L'ambiente in cui viene invocata la N-API call.
- `[in] object`: L'oggetto da cui recuperare la proprietà.
- `[in] utf8Name`: Il nome della proprietà da ottenere.
- `[out] result`: Il valore della proprietà.

Restituisce `napi_ok` se l'API ha esito positivo.

Questo metodo equivale a chiamare [`napi_get_property`][] con un `napi_value` creato dalla stringa passata come `utf8Name`.

#### napi_has_named_property

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_has_named_property(napi_env env,
                                    napi_value object,
                                    const char* utf8Name,
                                    bool* result);
```

- `[in] env`: L'ambiente in cui viene invocata la N-API call.
- `[in] object`: L'object da interrogare.
- `[in] utf8Name`: Il nome della proprietà di cui bisogna verificare l'esistenza.
- `[out] result`: Se la proprietà esiste nell'object oppure no.

Restituisce `napi_ok` se l'API ha esito positivo.

Questo metodo equivale a chiamare [`napi_has_property`][] con un `napi_value` creato dalla stringa passata come `utf8Name`.

#### napi_set_element

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_set_element(napi_env env,
                             napi_value object,
                             uint32_t index,
                             napi_value value);
```

- `[in] env`: L'ambiente in cui viene invocata la N-API call.
- `[in] object`: L'object da cui impostare le proprietà.
- `[in] index`: L'index della proprietà da impostare.
- `[in] value`: Il valore della proprietà.

Restituisce `napi_ok` se l'API ha esito positivo.

Questa API imposta un elemento `Object` passato/approvato.

#### napi_get_element

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_get_element(napi_env env,
                             napi_value object,
                             uint32_t index,
                             napi_value* result);
```

- `[in] env`: L'ambiente in cui viene invocata la N-API call.
- `[in] object`: L'object da cui recuperare la proprietà.
- `[in] index`: L'index della proprietà da ottenere.
- `[out] result`: Il valore della proprietà.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API ottiene l'elemento nell'index richiesto.

#### napi_has_element

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_has_element(napi_env env,
                             napi_value object,
                             uint32_t index,
                             bool* result);
```

- `[in] env`: L'ambiente in cui viene invocata la N-API call.
- `[in] object`: L'object da interrogare.
- `[in] index`: L'index della proprietà di cui bisogna verificare l'esistenza.
- `[out] result`: Se la proprietà esiste nell'object oppure no.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API restituisce se l'`Object` passato ha un elemento nell'index richiesto.

#### napi_delete_element

<!-- YAML
added: v8.2.0
-->

```C
napi_status napi_delete_element(napi_env env,
                                napi_value object,
                                uint32_t index,
                                bool* result);
```

- `[in] env`: L'ambiente in cui viene invocata la N-API call.
- `[in] object`: L'object da interrogare.
- `[in] index`: L'index della proprietà da cancellare.
- `[out] result`: Se la cancellazione dell'elemento è avvenuta con successo o meno. Facoltativamente, il `result` può essere ignorato passando `NULL`.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API tenta di cancellare l'`index` specificato dall'`object`.

#### napi_define_properties

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_define_properties(napi_env env,
                                   napi_value object,
                                   size_t property_count,
                                   const napi_property_descriptor* properties);
```

- `[in] env`: L'ambiente in cui viene invocata la N-API call.
- `[in] object`: L'object da cui recuperare le proprietà.
- `[in] property_count`: Il numero di elementi nell'array `properties`.
- `[in] properties`: L'array dei property descriptors (descrittori della proprietà).

Restituisce `napi_ok` se l'API ha esito positivo.

Questo metodo consente la definizione efficiente di più proprietà su un dato object. Le proprietà sono definite utilizzando i property descriptors (vedi [`napi_property_descriptor`][]). Dato un'array di tali property descriptors, quest'API imposterà le proprietà sull'object una alla volta, come definito da `DefineOwnProperty()` (descritto nella [Section 9.1.6](https://tc39.github.io/ecma262/#sec-ordinary-object-internal-methods-and-internal-slots-defineownproperty-p-desc) dell'ECMA262 specification).

## Lavorare con le funzioni JavaScript

N-API fornisce un set di API che consentono al codice JavaScript di richiamare (callback) il codice nativo. Le API N-API che supportano il richiamo al codice nativo utilizzano funzioni di callback rappresentate dal tipo `napi_callback`. Quando la JavaScript VM richiama il codice nativo, viene invocata la funzione `napi_callback` fornita. Le API documentate in questa sezione consentono alla funzione di callback di eseguire le operazioni seguenti:

- Ottenere informazioni sul contesto in cui è stato invocato il callback.
- Ottenere gli argomenti passati nel callback.
- Restituire un `napi_value` indietro dal callback.

Inoltre, N-API fornisce un set di funzioni che consentono di chiamare le funzioni JavaScript dal codice nativo. Si può chiamare una funzione come una normale chiamata di funzione JavaScript, o come una funzione constructor.

### napi_call_function

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_call_function(napi_env env,
                               napi_value recv,
                               napi_value func,
                               int argc,
                               const napi_value* argv,
                               napi_value* result)
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] recv`: L'object `this` è passato alla funzione chiamata.
- `[in] func`: `napi_value` che rappresenta la funzione JavaScript da invocare.
- `[in] argc`: Il count degli elementi nell'array `argv`.
- `[in] argv`: L'Array dei `napi_values` che rappresenta i valori JavaScript passati come argomenti alla funzione.
- `[out] result`: `napi_value` che rappresenta il JavaScript object restituito.

Restituisce `napi_ok` se l'API ha esito positivo.

Questo metodo consente ad un JavaScript function object di essere chiamato da un add-on nativo. Questo è il meccanismo principale di callback *dal* codice nativo dell'add-on *a* JavaScript. Nel caso speciale di chiamare in JavaScript dopo un'operazione asincrona, vedi [`napi_make_callback`][].

Un esempio di caso d'utilizzo potrebbe essere il seguente. Considera il seguente frammento JavaScript:

```js
function AddTwo(num) {
  return num + 2;
}
```

La funzione sopracitata può essere invocata da un add-on nativo usando il seguente codice:

```C
// Ottiene la funzione denominata "AddTwo" sul global object
napi_value global, add_two, arg;
napi_status status = napi_get_global(env, &global);
if (status != napi_ok) return;

status = napi_get_named_property(env, global, "AddTwo", &add_two);
if (status != napi_ok) return;

// const arg = 1337
status = napi_create_int32(env, 1337, &arg);
if (status != napi_ok) return;

napi_value* argv = &arg;
size_t argc = 1;

// AddTwo(arg);
napi_value return_val;
status = napi_call_function(env, global, add_two, argc, argv, &return_val);
if (status != napi_ok) return;

// Converte il risultato in un tipo nativo
int32_t result;
status = napi_get_value_int32(env, return_val, &result);
if (status != napi_ok) return;
```

### napi_create_function

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_create_function(napi_env env,
                                 const char* utf8name,
                                 napi_callback cb,
                                 void* data,
                                 napi_value* result);
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] utf8Name`: Il nome della funzione codificata come UTF8. Questo è visibile all'interno di JavaScript come nuova proprietà `name` del function object.
- `[in] cb`: La funzione nativa che dovrebbe essere chiamata quando viene invocato questo function object.
- `[in] data`: Data context fornito dall'utente. Questo verrà restituito alla funzione quando viene invocata in seguito.
- `[out] result`: `napi_value` che rappresenta il JavaScript function object per la funzione appena creata.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API consente ad un add-on author di creare un function object nel codice nativo. Questo è il meccanismo principale che consente il call (chiamata) *da* JavaScript *nel* codice nativo dell'addon.

La funzione appena creata non è automaticamente visibile dallo script dopo questa call. Invece, una proprietà deve essere impostata in modo esplicito su qualsiasi object visibile a JavaScript, in modo che la funzione sia accessibile dallo script.

Per esporre una funzione come parte del modulo exports dell'add-on, imposta la funzione appena creata sull'exports object. Un modulo di esempio potrebbe essere il seguente:

```C
napi_value SayHello(napi_env env, napi_callback_info info) {
  printf("Hello\n");
  return NULL;
}

napi_value Init(napi_env env, napi_value exports) {
  napi_status status;

  napi_value fn;
  status = napi_create_function(env, NULL, 0, SayHello, NULL, &fn);
  if (status != napi_ok) return NULL;

  status = napi_set_named_property(env, exports, "sayHello", fn);
  if (status != napi_ok) return NULL;

  return exports;
}

NAPI_MODULE(NODE_GYP_MODULE_NAME, Init)
```

Dato il codice sopracitato, l'add-on può essere utilizzato da JavaScript nel seguente modo:

```js
const myaddon = require('./addon');
myaddon.sayHello();
```

La stringa passata per require non è necessariamente il nome passato in `NAPI_MODULE` nel frammento precedente ma il nome del target in `binding.gyp` responsabile della creazione del file `.node`.

### napi_get_cb_info

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_get_cb_info(napi_env env,
                             napi_callback_info cbinfo,
                             size_t* argc,
                             napi_value* argv,
                             napi_value* thisArg,
                             void** data)
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] cbinfo`: Le callback info passate nella funzione callback.
- `[in-out] argc`: Specifica la dimensione dell'array `argv` fornito e riceve il count effettivo degli argomenti.
- `[out] argv`: Buffer a cui il `napi_value` rappresenta gli argomenti che sono copiati. Se ci sono più argomenti del count fornito, viene copiato solo il numero richiesto di argomenti. Se sono presenti meno argomenti di quelli richiesti, il resto di `argv` viene riempito con valori `napi_value` che rappresentano `undefined`.
- `[out] this`: Riceve l'argomento JavaScript `this` per la call.
- `[out] data`: Riceve il puntatore ai dati per il callback.

Restituisce `napi_ok` se l'API ha esito positivo.

Questo metodo viene utilizzato all'interno di una funzione callback per recuperare i dettagli sulla call come gli argomenti ed il puntatore `this` da una determinata callback info.

### napi_get_new_target

<!-- YAML
added: v8.6.0
-->

```C
napi_status napi_get_new_target(napi_env env,
                                napi_callback_info cbinfo,
                                napi_value* result)
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] cbinfo`: Le callback info passate nella funzione callback.
- `[out] result`: Il `new.target` della constructor call.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API restituisce il `new.target` della constructor call. Se il callback corrente non è una constructor call, il risultato è `NULL`.

### napi_new_instance

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_new_instance(napi_env env,
                              napi_value cons,
                              size_t argc,
                              napi_value* argv,
                              napi_value* result)
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] cons`: `napi_value` che rappresenta la funzione JavaScript da invocare come constructor.
- `[in] argc`: Il count degli elementi nell'array `argv`.
- `[in] argv`: Array di valori JavaScript come `napi_value` che rappresentano gli argomenti del constructor.
- `[out] result`: `napi_value` che rappresenta il JavaScript object restituito, che in questo caso è il constructed object (l'object costruito).

Questo metodo viene utilizzato per istanziare un nuovo valore JavaScript utilizzando un dato `napi_value` che rappresenta il constructor per l'object. Ad esempio, considera il seguente frammento:

```js
function MyObject(param) {
  this.param = param;
}

const arg = 'hello';
const value = new MyObject(arg);
```

Questo può essere approssimato in N-API usando il seguente frammento:

```C
// Ottiene la funzione constructor MyObject
napi_value global, constructor, arg, value;
napi_status status = napi_get_global(env, &global);
if (status != napi_ok) return;

status = napi_get_named_property(env, global, "MyObject", &constructor);
if (status != napi_ok) return;

// const arg = "hello"
status = napi_create_string_utf8(env, "hello", NAPI_AUTO_LENGTH, &arg);
if (status != napi_ok) return;

napi_value* argv = &arg;
size_t argc = 1;

// const value = new MyObject(arg)
status = napi_new_instance(env, constructor, argc, argv, &value);
```

Restituisce `napi_ok` se l'API ha esito positivo.

## Object Wrap

N-API offre un modo per "avvolgere" (wrap) classi ed istanze C++ in modo che il constructor ed i metodi della classe possano essere chiamati da JavaScript.

1. L'API [`napi_define_class`][] definisce una classe JavaScript con constructor, proprietà e metodi statici, e proprietà e metodi di istanza che corrispondono alla classe C++.
2. Quando il codice JavaScript invoca il constructor, il callback del constructor utilizza [`napi_wrap`][] per eseguire il wrapping di una nuova istanza C++ in un JavaScript object, quindi restituisce il wrapper object.
3. Quando il codice JavaScript invoca un metodo od una property accessor sulla classe, viene invocata la corrispondente funzione C++ `napi_callback`. Per un callback di istanza, [`napi_unwrap`][] ottiene l'istanza C++ che è il target della call.

Per i wrapped objects può essere difficile distinguere tra una funzione chiamata su un prototipo di classe ed una funzione chiamata su un'istanza di una classe. Un modello comune utilizzato per risolvere questo problema consiste nel salvare un reference persistente al constructor della classe per i successivi controlli di `instanceof`.

Ad esempio:

```C
napi_value MyClass_constructor = NULL;
status = napi_get_reference_value(env, MyClass::es_constructor, &MyClass_constructor);
assert(napi_ok == status);
bool is_instance = false;
status = napi_instanceof(env, es_this, MyClass_constructor, &is_instance);
assert(napi_ok == status);
if (is_instance) {
  // napi_unwrap() ...
} else {
  // in caso contrario...
}
```

Il reference deve essere liberato quando non è più necessario.

### napi_define_class

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_define_class(napi_env env,
                              const char* utf8name,
                              size_t length,
                              napi_callback constructor,
                              void* data,
                              size_t property_count,
                              const napi_property_descriptor* properties,
                              napi_value* result);
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] utf8name`: Nome della funzione JavaScript constructor; non deve essere necessariamente uguale al nome della classe C++, sebbene sia raccomandato per chiarezza.
- `[in] length`: La lunghezza di `utf8name` in bytes, oppure `NAPI_AUTO_LENGTH` se è null-terminated.
- `[in] constructor`: Funzione callback che gestisce la costruzione di istanze della classe. (Questo dovrebbe essere un metodo statico sulla classe, non una funzione C++ constructor effettiva.)
- `[in] data`: Dati opzionali da passare al callback del constructor come `data` property delle callback info.
- `[in] property_count`: Numero di elementi nell'argomento dell'array `properties`.
- `[in] properties`: Array di property descriptors che descrivono proprietà di dati statici e di istanza, accessors e metodi sulla classe. Vedi `napi_property_descriptor`.
- `[out] result`: Un `napi_value` che rappresenta la funzione constructor per la classe.

Restituisce `napi_ok` se l'API ha esito positivo.

Definisce una classe JavaScript che corrisponde ad una classe C++, includendo:

- Una funzione JavaScript constructor che ha il nome della classe ed invoca il callback del constructor C++ fornito.
- Proprietà presenti sulla funzione constructor corrispondenti alle proprietà dei dati *statici*, agli accessors ed ai metodi della classe C++ (definita dai property descriptors con l'attributo `napi_static`).
- Proprietà presenti sul `prototype` object della funzione constructor corrispondenti a proprietà di dati *non-statici*, agli accessors ed ai metodi della classe C++ (definiti dai property descriptors senza l'attributo `napi_static`).

Il callback del constructor C++ deve essere un metodo statico sulla classe che chiama l'effettivo constructor della classe, successivamente esegue il wrapping della nuova istanza C++ in un JavaScript object, e restituisce il wrapper object. Vedi `napi_wrap()` per maggiori dettagli.

La funzione JavaScript constructor restituita da [`napi_define_class`][] viene spesso salvata ed utilizzata in seguito, per costruire nuove istanze della classe dal codice nativo, e/o verificare se i valori forniti sono istanze della classe. In tal caso, per impedire che il valore della funzione subisca la garbage collection, crea un reference persistente usando [`napi_create_reference`][] ed assicurati che il reference count sia mantenuto >= 1.

### napi_wrap

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_wrap(napi_env env,
                      napi_value js_object,
                      void* native_object,
                      napi_finalize finalize_cb,
                      void* finalize_hint,
                      napi_ref* result);
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] js_object`: Il JavaScript object che sarà il wrapper per l'object nativo. Quest'object *deve* essere stato creato dal `prototype` di un constructor creato usando `napi_define_class()`.
- `[in] native_object`: L'istanza nativa che subirà il wrapping nel JavaScript object.
- `[in] finalize_cb`: Callback nativo opzionale che può essere utilizzato per liberare l'istanza nativa quando il JavaScript object è pronto per la garbage-collection.
- `[in] finalize_hint`: Contextual hint opzionale passato al callback finalizzato.
- `[out] result`: Reference opzionale al wrapped object.

Restituisce `napi_ok` se l'API ha esito positivo.

Esegue il wrapping di un'istanza nativa in un JavaScript object. L'istanza nativa può essere recuperata in seguito utilizzando `napi_unwrap()`.

Quando il codice JavaScript invoca un constructor per una classe che è stata definita usando `napi_define_class()`, viene invocato il `napi_callback` per il constructor. Dopo aver costruito un'istanza della classe nativa, il callback deve chiamare `napi_wrap()` per eseguire il wrapping dell'istanza appena costruita nel JavaScript object già creato ovvero l'argomento `this` del callback del constructor. (Quel `this` object è stato creato dal `prototype` della funzione constructor, quindi ha già le definizioni di tutte le proprietà e i metodi dell'istanza.)

In genere, quando si esegue il wrapping di un'istanza di classe, è necessario fornire un callback finalizzato che elimina semplicemente l'istanza nativa ricevuta come argomento `data` sul callback finalizzato.

Il reference opzionale restituito è inizialmente un reference debole, il che significa che ha un reference count pari a 0. In genere questo reference count viene incrementato temporaneamente durante le operazioni asincrone che richiedono che l'istanza rimanga valida.

*Attenzione*: il reference opzionale restituito (se ottenuto) deve essere eliminato tramite [`napi_delete_reference`][] SOLO in risposta all'invocazione del callback finalizzato. (Se viene eliminato prima di allora, il callback finalizzato non può mai essere invocato.) Pertanto, quando si ottiene un reference, è necessario anche un callback finalizzato che permetta la giusta correzione del reference.

Quest'API può modificare la prototype chain del wrapper object. In seguito, un'ulteriore manipolazione della prototype chain del wrapper potrebbe causare il fallimento di `napi_unwrap()`.

Chiamando `napi_wrap()` una seconda volta su di un object verrà restituito un errore. Per associare un'altra istanza nativa all'object, prima di tutto utilizza `napi_remove_wrap()`.

### napi_unwrap

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_unwrap(napi_env env,
                        napi_value js_object,
                        void** result);
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] js_object`: L'object associato all'istanza nativa.
- `[out] result`: Puntatore all'istanza nativa che ha subito il wrapping.

Restituisce `napi_ok` se l'API ha esito positivo.

Recupera un'istanza nativa che ha precedentemente subito il wrapping in un JavaScript object utilizzando `napi_wrap()`.

Quando il codice JavaScript invoca un metodo od una property accessor sulla classe, viene invocato il corrispondente `napi_callback`. Se il callback è per un metodo od un accessor di istanza, allora l'argomento `this` del callback è il wrapper object; l'istanza C++, che ha subito il wrapping ed è il target della chiamata, può essere ottenuta chiamando `napi_unwrap()` sul wrapper object.

### napi_remove_wrap

<!-- YAML
added: v8.5.0
-->

```C
napi_status napi_remove_wrap(napi_env env,
                             napi_value js_object,
                             void** result);
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] js_object`: L'object associato all'istanza nativa.
- `[out] result`: Puntatore all'istanza nativa che ha subito il wrapping.

Restituisce `napi_ok` se l'API ha esito positivo.

Recupera un'istanza nativa che ha precedentemente subito il wrapping nel JavaScript object `js_object` utilizzando `napi_wrap()` e rimuove il wrapping, ripristinando in tal modo la prototype chain del JavaScript object. Se un callback finalizzato è stato associato al wrapping, non verrà più chiamato quando il JavaScript object subisce la garbage collection.

## Semplici Operazioni Asincrone

I moduli Addon spesso hanno bisogno di sfruttare gli async helpers di libuv come parte della loro implementazione. Ciò gli consente di pianificare il lavoro da eseguire in modo asincrono così che i loro metodi possano eseguire il return prima che il lavoro venga completato. Questo è importante perchè gli consente di evitare il blocco totale dell'esecuzione dell'applicazione Node.js.

N-API fornisce un'interfaccia ABI stabile per queste funzioni di supporto che copre i casi più comuni di utilizzo asicrono.

N-API definisce la struttura `napi_work` che viene utilizzata per gestire gli workers asincroni. Le istanze vengono create/eliminate con [`napi_create_async_work`][] e [`napi_delete_async_work`][].

I callback `execute` e `complete` sono funzioni che verranno invocate rispettivamente quando l'executor è pronto per essere eseguito e quando esso termina il suo compito (task). Queste funzioni implementano le seguenti interfacce:

```C
typedef void (*napi_async_execute_callback)(napi_env env,
                                            void* data);
typedef void (*napi_async_complete_callback)(napi_env env,
                                             napi_status status,
                                             void* data);
```

Quando questi metodi vengono invocati, il parametro `data` passato sarà il `void*` data fornito dall'addon che è stato passato alla chiamata `napi_create_async_work`.

Una volta creato, l'async worker può essere messo in coda per l'esecuzione utilizzando la funzione [`napi_queue_async_work`][]:

```C
napi_status napi_queue_async_work(napi_env env,
                                  napi_async_work work);
```

[`napi_cancel_async_work`][] può essere usato se il work deve essere cancellato prima che esso inizi l'esecuzione.

Dopo aver chiamato [`napi_cancel_async_work`][], il callback `complete` verrà invocato con un status value di `napi_cancelled`. Il work non dovrebbe essere cancellato prima dell'invocazione del callback `complete`, anche quando è stato annullato.

### napi_create_async_work

<!-- YAML
added: v8.0.0
changes:

  - version: v8.6.0
    pr-url: https://github.com/nodejs/node/pull/14697
    description: Added `async_resource` and `async_resource_name` parameters.
-->

```C
napi_status napi_create_async_work(napi_env env,
                                   napi_value async_resource,
                                   napi_value async_resource_name,
                                   napi_async_execute_callback execute,
                                   napi_async_complete_callback complete,
                                   void* data,
                                   napi_async_work* result);
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] async_resource`: Un object facoltativo associato all'async work che verrà passato a possibili `async_hooks` [`init` hooks][].
- `[in] async_resource_name`: Identificatore per il tipo di risorsa che viene fornita per le informazioni diagnostiche esposte dall'API `async_hooks`.
- `[in] execute`: La funzione nativa che dovrebbe essere chiamata per eseguire la logica in modo asincrono. La funzione data viene chiamata da un worker pool thread e può essere eseguita in parallelo con il main event loop thread.
- `[in] complete`: La funzione nativa che verrà chiamata quando la logica asincrona è completata o cancellata. La funzione data viene chiamata dal main event loop thread.
- `[in] data`: Data context fornito dall'utente. Questo verrà passato di nuovo nelle funzioni execute e complete.
- `[out] result`: `napi_async_work*` che è l'handle dell'async work appena creato.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API alloca un work object che viene utilizzato per eseguire la logica in modo asincrono. Esso dovrebbe essere liberato usando [`napi_delete_async_work`][] una volta che il work non è più necessario.

`async_resource_name` dovrebbe essere una stringa null-terminated con codifica UTF-8.

L'identificatore `async_resource_name` viene fornito dall'utente e dovrebbe essere rappresentativo del tipo di async work eseguito. E' inoltre consigliato di applicare il namespace all'identificatore, ad es. includendo il nome del modulo. Vedi la [documentazione riguardo `async_hooks`][async_hooks `type`] per maggiori informazioni.

### napi_delete_async_work

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_delete_async_work(napi_env env,
                                   napi_async_work work);
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] work`: L'handle restituito dalla chiamata a `napi_create_async_work`.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API libera un work object allocato precedentemente.

Quest'API può essere chiamata anche se è presente un'eccezione JavaScript in sospeso.

### napi_queue_async_work

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_queue_async_work(napi_env env,
                                  napi_async_work work);
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] work`: L'handle restituito dalla chiamata a `napi_create_async_work`.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API richiede che il work allocato precedentemente venga pianificato per l'esecuzione.

### napi_cancel_async_work

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_cancel_async_work(napi_env env,
                                   napi_async_work work);
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] work`: L'handle restituito dalla chiamata a `napi_create_async_work`.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API annulla il work in coda se non è stato ancora avviato. Se ha già iniziato l'esecuzione, non può essere annullato e verrà restituito `napi_generic_failure`. In caso di successo, il callback `complete` verrà invocato con un status value di `napi_cancelled`. Il work non dovrebbe essere cancellato prima dell'invocazione del callback `complete`, anche se è stato annullato con successo.

Quest'API può essere chiamata anche se è presente un'eccezione JavaScript in sospeso.

## Operazioni Asincrone Personalizzate

Le semplici API di work asincrono sopracitate potrebbero non essere appropriate per ogni scenario. Quando si utilizza un altro meccanismo asincrono, sono necessarie le seguenti API per garantire che un'operazione asincrona venga monitorata correttamente dal runtime.

### napi_async_init

<!-- YAML
added: v8.6.0
-->

```C
napi_status napi_async_init(napi_env env,
                            napi_value async_resource,
                            napi_value async_resource_name,
                            napi_async_context* result)
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] async_resource`: Un object facoltativo associato all'async work che verrà passato a possibili `async_hooks` [`init` hooks][].
- `[in] async_resource_name`: Identificatore per il tipo di risorsa che viene fornita per le informazioni diagnostiche esposte dall'API `async_hooks`.
- `[out] result`: L'async context inizializzato.

Restituisce `napi_ok` se l'API ha esito positivo.

### napi_async_destroy

<!-- YAML
added: v8.6.0
-->

```C
napi_status napi_async_destroy(napi_env env,
                               napi_async_context async_context);
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] async_context`: L'async context da distruggere.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API può essere chiamata anche se è presente un'eccezione JavaScript in sospeso.

### napi_make_callback

<!-- YAML
added: v8.0.0
changes:

  - version: v8.6.0
    description: Added `async_context` parameter.
-->

```C
napi_status napi_make_callback(napi_env env,
                               napi_async_context async_context,
                               napi_value recv,
                               napi_value func,
                               int argc,
                               const napi_value* argv,
                               napi_value* result)
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] async_context`: Context per l'operazione asincrona che sta invocando il callback. Questo dovrebbe normalmente essere un valore precedentemente ottenuto da [`napi_async_init`][]. Tuttavia è consentito anche `NULL`, che indica che l'async context corrente (se presente) deve essere utilizzato per il callback.
- `[in] recv`: L'object `this` è passato alla funzione chiamata.
- `[in] func`: `napi_value` che rappresenta la funzione JavaScript da invocare.
- `[in] argc`: Il count degli elementi nell'array `argv`.
- `[in] argv`: Array di valori JavaScript come `napi_value` che rappresentano gli argomenti della funzione.
- `[out] result`: `napi_value` che rappresenta il JavaScript object restituito.

Restituisce `napi_ok` se l'API ha esito positivo.

Questo metodo consente ad un JavaScript function object di essere chiamato da un add-on nativo. Quest'API è simile a `napi_call_function`. Tuttavia, esso è usato per chiamare *da* codice nativo di nuovo *all'interno* di JavaScript *dopo* esser stato restituito da un'operazione asincrona (quando non ci sono altri script nello stack). È un wrapper abbastanza semplice attorno a `node::MakeCallback`.

Nota che *non* è necessario per utilizzare `napi_make_callback` da un `napi_async_complete_callback`; in quella situazione l'async context del callback è già stato impostato, quindi una chiamata diretta a `napi_call_function` è sufficiente ed appropriata. L'utilizzo della funzione `napi_make_callback` può essere richiesto quando si implementa un comportamento asincrono personalizzato che non utilizza `napi_create_async_work`.

### napi_open_callback_scope

<!-- YAML
added: v9.6.0
-->

```C
NAPI_EXTERN napi_status napi_open_callback_scope(napi_env env,
                                                 napi_value resource_object,
                                                 napi_async_context context,
                                                 napi_callback_scope* result)
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] resource_object`: Un object facoltativo associato all'async work che verrà passato a possibili `async_hooks` [`init` hooks][].
- `[in] context`: Context per l'operazione asincrona che sta invocando il callback. Questo dovrebbe essere un valore precedentemente ottenuto da [`napi_async_init`][].
- `[out] result`: Lo scope appena creato.

Ci sono casi (ad esempio, la risoluzione di promise) in cui è necessario avere l'equivalente dello scope associato ad un callback nel momento in cui si effettuano determinate N-API calls. Se non ci sono altri script nello stack, le funzioni [`napi_open_callback_scope`][] e [`napi_close_callback_scope`][] possono essere utilizzate per aprire/chiudere lo scope richiesto.

### napi_close_callback_scope

<!-- YAML
added: v9.6.0
-->

```C
NAPI_EXTERN napi_status napi_close_callback_scope(napi_env env,
                                                  napi_callback_scope scope)
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] scope`: Lo scope da chiudere.

Quest'API può essere chiamata anche se è presente un'eccezione JavaScript in sospeso.

## Gestione delle Versioni

### napi_get_node_version

<!-- YAML
added: v8.4.0
-->

```C
typedef struct {
  uint32_t major;
  uint32_t minor;
  uint32_t patch;
  const char* release;
} napi_node_version;

napi_status napi_get_node_version(napi_env env,
                                  const napi_node_version** version);
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[out] version`: Un puntatore alle informazioni della versione per Node.js stesso.

Restituisce `napi_ok` se l'API ha esito positivo.

Questa funzione riempie la struttura `version` con la versione principale, quella meno importante e la versione patch di Node.js attualmente in esecuzione, ed il campo `release` con il valore di [`process.release.name`][`process.release`].

Il buffer restituito è allocato in modo statico e non è necessario liberarlo.

### napi_get_version

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_get_version(napi_env env,
                             uint32_t* result);
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[out] result`: La versione di N-API più recente supportata.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API restituisce la versione N-API più recente supportata dal runtime Node.js. N-API è programmato per essere additivo in modo che le nuove release di Node.js possano supportare funzioni API aggiuntive. Per consentire ad un addon di utilizzare una funzione più recente quando è in esecuzione con versioni di Node.js che lo supportano, pur fornendo un comportamento di fallback durante l'esecuzione con versioni di Node.js che non lo supportano:

- Chiama `napi_get_version()` per determinare se l'API è disponibile.
- Se disponibile, carica in modo dinamico un puntatore alla funzione usando `uv_dlsym()`.
- Usa il puntatore caricato in modo dinamico per invocare la funzione.
- Se la funzione non è disponibile, fornisci un'implementazione alternativa che non utilizza la funzione.

## Gestione della Memoria

### napi_adjust_external_memory

<!-- YAML
added: v8.5.0
-->

```C
NAPI_EXTERN napi_status napi_adjust_external_memory(napi_env env,
                                                    int64_t change_in_bytes,
                                                    int64_t* result);
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] change_in_bytes`: La modifica nella memoria allocata esternamente che viene mantenuta attiva dagli JavaScript objects.
- `[out] result`: Il valore regolato

Restituisce `napi_ok` se l'API ha esito positivo.

Questa funzione fornisce a V8 un'indicazione della quantità di memoria allocata esternamente che viene mantenuta attiva dagli JavaScript objects (es. un JavaScript object che punta alla propria memoria allocata da un modulo nativo). La registrazione di memoria allocata esternamente attiverà le garbage collection globali più spesso di quanto non farebbe altrimenti.

<!-- it's very convenient to have all the anchors indexed -->

<!--lint disable no-unused-definitions remark-lint-->

## Promises

N-API fornisce agevolazioni per la creazione di `Promise` objects come descritto nella [Section 25.4](https://tc39.github.io/ecma262/#sec-promise-objects) dell'ECMA specification. Implementa i promise come una coppia di objects. Quando un promise viene creato da `napi_create_promise()`, un "deferred" object (object differito) viene creato e restituito affianco a `Promise`. Il deferred object è associato al `Promise` creato ed è l'unico mezzo per risolvere o rifiutare il `Promise` utilizzando `napi_resolve_deferred()` oppure `napi_reject_deferred()`. Il deferred object creato da `napi_create_promise()` è liberato da `napi_resolve_deferred()` oppure `napi_reject_deferred()`. Il `Promise` object può essere restituito a JavaScript dove può essere usato nel modo più consueto.

Ad esempio, per creare un promise e passarlo ad un worker asincrono:

```c
napi_deferred deferred;
napi_value promise;
napi_status status;

// Crea il promise.
status = napi_create_promise(env, &deferred, &promise);
if (status != napi_ok) return NULL;

// Passa il deferred ad una funzione che esegue un'azione asincrona.
do_something_asynchronous(deferred);

// Restituisce il promise a JS
return promise;
```

La funzione `do_something_asynchronous()` qui sopra eseguirebbe la sua azione asincrona e quindi risolverebbe o rifiuterebbe il deferred, concludendo così il promise e liberando il deferred:

```c
napi_deferred deferred;
napi_value undefined;
napi_status status;

// Crea un valore con cui concludere il deferred.
status = napi_get_undefined(env, &undefined);
if (status != napi_ok) return NULL;

// Risolve o rifiuta il promise associato al deferred dipendendo
// dal successo dell'azione asincrona.
if (asynchronous_action_succeeded) {
  status = napi_resolve_deferred(env, deferred, undefined);
} else {
  status = napi_reject_deferred(env, deferred, undefined);
}
if (status != napi_ok) return NULL;

// A questo punto il deferred è stato liberato, quindi dovremmo assegnargli NULL.
deferred = NULL;
```

### napi_create_promise

<!-- YAML
added: v8.5.0
-->

```C
napi_status napi_create_promise(napi_env env,
                                napi_deferred* deferred,
                                napi_value* promise);
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[out] deferred`: Un deferred object appena creato che in seguito può essere passato a `napi_resolve_deferred()` oppure `napi_reject_deferred()` per risolvere resp. rifiuta il promise associato.
- `[out] promise`: Il JavaScript promise associato con il deferred object.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API crea un deferred object ed un JavaScript promise.

### napi_resolve_deferred

<!-- YAML
added: v8.5.0
-->

```C
napi_status napi_resolve_deferred(napi_env env,
                                  napi_deferred deferred,
                                  napi_value resolution);
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] deferred`: Il deferred object del quale bisogna risolvere il promise associato.
- `[in] resolution`: Il valore con cui risolvere il promise.

Quest'API risolve un JavaScript promise tramite il deferred object a cui è associato. Pertanto, può essere utilizzata solo per risolvere i JavaScript promise per i quali è disponibile il corrispondente deferred object. Ciò significa in effetti che il promise dev'essere stato creato utilizzando `napi_create_promise()` e che il deferred object restituito da tale chiamata dev'essere stato mantenuto per essere passato a quest'API.

Il deferred object viene liberato al completamento avvenuto con successo.

### napi_reject_deferred

<!-- YAML
added: v8.5.0
-->

```C
napi_status napi_reject_deferred(napi_env env,
                                 napi_deferred deferred,
                                 napi_value rejection);
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] deferred`: Il deferred object del quale bisogna risolvere il promise associato.
- `[in] rejection`: Il valore con cui rifiutare il promise.

Quest'API rifiuta un JavaScript promise tramite il deferred object a cui è associato. Pertanto, può essere utilizzata solo per rifiutare i JavaScript promise per i quali è disponibile il corrispondente deferred object. Ciò significa in effetti che il promise dev'essere stato creato utilizzando `napi_create_promise()` e che il deferred object restituito da tale chiamata dev'essere stato mantenuto per essere passato a quest'API.

Il deferred object viene liberato al completamento avvenuto con successo.

### napi_is_promise

<!-- YAML
added: v8.5.0
-->

```C
napi_status napi_is_promise(napi_env env,
                            napi_value promise,
                            bool* is_promise);
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] promise`: Il promise da esaminare
- `[out] is_promise`: Flag che indica se `promise` è un promise object nativo - ovvero un promise object creato dall'engine sottostante.

## Script execution

N-API fornisce un'API per l'esecuzione di una stringa contenente JavaScript utilizzando il JavaScript engine sottostante.

### napi_run_script

<!-- YAML
added: v8.5.0
-->

```C
NAPI_EXTERN napi_status napi_run_script(napi_env env,
                                        napi_value script,
                                        napi_value* result);
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] script`: Una stringa JavaScript contenente lo script da eseguire.
- `[out] result`: Il valore risultante dell'aver eseguito lo script.

## libuv event loop

N-API fornisce una funzione per ottenere l'attuale event loop associato ad uno specifico `napi_env`.

### napi_get_uv_event_loop

<!-- YAML
added: v9.3.0
-->

```C
NAPI_EXTERN napi_status napi_get_uv_event_loop(napi_env env,
                                               uv_loop_t** loop);
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[out] loop`: L'attuale istanza del libuv loop.