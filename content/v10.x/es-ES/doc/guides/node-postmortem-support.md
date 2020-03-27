# Soporte Postmortem

Los metadatos postmortem son constantes presentes en la compilación final, la cual puede ser usada por debuggers y otras herramientas para navegar a través de estructuras internas de software cuando se analice su memoria (ya sea en un proceso de ejecución o en un volcado de memoria). Node.js proporciona estos metadatos y su compilación para V8 y para estructuras internas de Node.js.


### Metadatos Postmortem V8

V8 prefija todas las constantes postmortem con `v8dbg_`, y ellas permiten la inspección de objetos en la cabecera. V8 genera aquellos símbolos con un script (`deps/v8/tools/gen-postmortem-metadata.py`), y Node.js siempre incluye estas constantes en la compilación final.

### Símbolos de Depuración de Node.js

Node.js prefixes all postmortem constants with `nodedbg_`, and they complement V8 constants by providing ways to inspect Node.js-specific structures, like `node::Environment`, `node::BaseObject` and its descendants, classes from `src/utils.h` and others. Esas constantes son declaradas en `src/node_postmortem_metadata.cc`, y la mayoría estaban estaban calculadas en el tiempo de la compilación.

#### Calcular el offset de miembros de clase

Las constantes Node.js que refieren al offset de miembros de clase de memoria son calculados en tiempo de compilación. Debido a eso, esos miembros de clase deben estar en un offset fijo desde el inicio de la clase. Eso no es un problema en la mayoría de los casos, pero también significa que esos miembros siempre deben venir después de cualquier miembro con plantilla en la definición de la clase.

Por ejemplo, si queremos añadir una constante con el offset para `ReqWrap::req_wrap_queue_`, debería ser definido después de `ReqWrap::req_`, ya que `sizeof(req_)` depende del tipo de T, lo que significa que la definición de la clase debería ser así:

```c++
plantilla <typename T>
class ReqWrap : public AsyncWrap {
 private:
  // req_wrap_queue_ viene antes de cualquier miembro con plantilla, lo cual lo coloca en un
  // offset fijo desde el inicio de la clase
  ListNode<ReqWrap> req_wrap_queue_;

  T req_;
};
```

en lugar de:

```c++
plantilla <typename T>
class ReqWrap : public AsyncWrap {
 private:
  T req_;

  // req_wrap_queue_ viene después de un miembro con plantilla, lo cual significa que no estará en
  // un offset fijo desde el inicio de la clase
  ListNode<ReqWrap> req_wrap_queue_;
};
```

There are also tests on `test/cctest/test_node_postmortem_metadata.cc` to make sure all Node.js postmortem metadata are calculated correctly.

## Herramientas y referencias

* [llnode](https://github.com/nodejs/llnode): complemento LLDB
* [`mdb_v8`](https://github.com/joyent/mdb_v8): complemento mdb
* [nodejs/post-mortem](https://github.com/nodejs/post-mortem): Grupo de trabajo post-mortem de Node.js
