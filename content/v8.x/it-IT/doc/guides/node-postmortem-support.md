# Supporto Postmortem

I metadati postmortem sono costanti presenti nella build finale che possono essere utilizzati dai debugger e da altri strumenti per navigare attraverso le strutture interne del software durante l'analisi della sua memoria (sia su un processo in esecuzione che su un core dump). Node provides this metadata in its builds for V8 and Node internal structures.


### Metadati Postmortem V8

V8 prefissa tutte le costanti postmortem con `v8dbg_` ed esse consentono l'ispezione di object sull'heap nonché di proprietà e riferimenti dell'object. V8 generates those symbols with a script (`deps/v8/tools/gen-postmortem-metadata.py`), and Node always includes these constants in the final build.

### Node Debug Symbols

Node.js prefixes all postmortem constants with `nodedbg_`, and they complement V8 constants by providing ways to inspect Node.js-specific structures, like `node::Environment`, `node::BaseObject` and its descendants, classes from `src/utils.h` and others. Queste costanti sono dichiarate in `src/node_postmortem_metadata.cc` e la maggior parte di esse sono calcolate al momento della compilazione.

#### Calcolare l'offset dei membri della classe

Node constants referring to the offset of class members in memory are calculated at compile time. Per questo motivo, quei membri della classe devono essere a un offset fisso dall'inizio della classe. Non è un problema nella maggior parte dei casi, ma significa anche che quei membri dovrebbero sempre venire dopo qualsiasi membro basato su template sulla definizione di classe.

Ad esempio, se vogliamo aggiungere una costante con l'offset per `ReqWrap::req_wrap_queue_`, essa dovrebbe essere definita dopo `ReqWrap::req_`, perché `sizeof(req_)` dipende dal tipo di T, che significa che la definizione di classe dovrebbe essere simile a questa:

```c++
template <typename T>
class ReqWrap : public AsyncWrap {
 private:
  // req_wrap_queue_ viene prima di qualsiasi membro basato su template, che lo sistema in un
  // offset fisso dall'inizio della classe
  ListNode<ReqWrap> req_wrap_queue_;

  T req_;
};
```

invece di:

```c++
template <typename T>
class ReqWrap : public AsyncWrap {
 private:
  T req_;

  // req_wrap_queue_ viene dopo un membro basato su template, che significa che non sarà in
  // un offset fisso dall'inizio della classe
  ListNode<ReqWrap> req_wrap_queue_;
};
```

There are also tests on `test/cctest/test_node_postmortem_metadata.cc` to make sure all Node.js postmortem metadata are calculated correctly.

## Strumenti e Riferimenti

* [llnode](https://github.com/nodejs/llnode): LLDB plugin
* [`mdb_v8`](https://github.com/joyent/mdb_v8): mdb plugin
* [nodejs/post-mortem](https://github.com/nodejs/post-mortem): gruppo di lavoro di Node.js post-mortem
