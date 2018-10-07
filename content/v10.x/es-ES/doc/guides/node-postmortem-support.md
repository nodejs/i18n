# Soporte Postmortem

Los metadatos postmortem son constantes presentes en la compilación final, la cual puede ser usada por debuggers y otras herramientas para navegar a través de estructuras internas de software cuando se analice su memoria (ya sea en un proceso de ejecución o en un volcado de memoria). Node.js proporciona estos metadatos y su compilación para V8 y para estructuras internas de Node.js.

### Metadatos Postmortem V8

V8 prefija todas las constantes postmortem con `v8dbg_`, y ellas permiten la inspección de objetos en la cabecera. V8 genera aquellos símbolos con un script (`deps/v8/tools/gen-postmortem-metadata.py`), y Node.js siempre incluye estas constantes en la compilación final.

### Símbolos de Depuración de Node.js

Node prefija todas las constantes postmortem con `nodedbg_`, y ellas complementan las constantes V8 al proporcionar formas de inspeccionar estructuras específicas de Node, tales como `node::Environment`, `node::BaseObject` y sus clases descendientes desde `src/utils.h` y otros. Esas constantes son declaradas en `src/node_postmortem_metadata.cc`, y la mayoría estaban estaban calculadas en el tiempo de la compilación.

#### Calcular el offset de miembros de clase

Las constantes Node.js que refieren al offset de miembros de clase de memoria son calculados en tiempo de compilación. Because of that, those class members must be at a fixed offset from the start of the class. That's not a problem in most cases, but it also means that those members should always come after any templated member on the class definition.

For example, if we want to add a constant with the offset for `ReqWrap::req_wrap_queue_`, it should be defined after `ReqWrap::req_`, because `sizeof(req_)` depends on the type of T, which means the class definition should be like this:

```c++
template <typename T>
class ReqWrap : public AsyncWrap {
 private:
  // req_wrap_queue_ comes before any templated member, which places it in a
  // fixed offset from the start of the class
  ListNode<ReqWrap> req_wrap_queue_;

  T req_;
};
```

instead of:

```c++
template <typename T>
class ReqWrap : public AsyncWrap {
 private:
  T req_;

  // req_wrap_queue_ comes after a templated member, which means it won't be in
  // a fixed offset from the start of the class
  ListNode<ReqWrap> req_wrap_queue_;
};
```

There are also tests on `test/cctest/test_node_postmortem_metadata.cc` to make sure all Node postmortem metadata are calculated correctly.

## Tools and References

* [llnode](https://github.com/nodejs/llnode): LLDB plugin
* [`mdb_v8`](https://github.com/joyent/mdb_v8): mdb plugin
* [nodejs/post-mortem](https://github.com/nodejs/post-mortem): Node.js post-mortem working group