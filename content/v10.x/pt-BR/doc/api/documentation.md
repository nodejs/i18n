# Sobre esta documentação

<!--introduced_in=v0.10.0-->

<!-- type=misc -->

O objetivo desta documentação é explicar de modo compreensível a API do Node.js, tanto do ponto de vista de referência quanto do ponto de vista conceitual. Cada seção descreve um módulo embutido ou um conceito de alto nível.

Quando necessário, propriedades de tipos, métodos de argumentos e os argumentos fornecidos para manipuladores de evento serão detalhados num subtópico, abaixo do tópico de cabeçalho.

## Contribuições

Caso encontre um erro nesta documentação, por favor, [abra uma issue](https://github.com/nodejs/node/issues/new) ou então veja [o guia de contribuição](https://github.com/nodejs/node/blob/master/CONTRIBUTING.md) para instruções de como submeter um patch de correção.

Cada arquivo é gerado com base num arquivo `.md` correspondente que fica no diretório: `doc/api/` na estrutura de arquivos do Node.js. A documentação é gerada usando o programa `tools/doc/generate.js`. Um template HTML está localizado em `template.html`.

## Índice de estabilidade

<!--type=misc-->

Por toda a documentação há indicadores de estabilidade de uma seção. A API do Node.js passa por mudanças, e conforme amadurece, certas partes são mais confiáveis que outras. Algumas já foram bastante testadas, e são tão usadas, que dificilmente mudarão. Outras são recentes e experimentais, ou são tidas como incertas e podem ser re-desenhadas.

Os índices de estabilidade são os seguintes:

```txt
Estabilidade: 0 - Descontinuado. Essa feature é conhecida apresentar problemas, e mudanças podem ser planejadas. Não confie nela. O uso dessa feature pode emitir alertas. Não se deve esperar compatibilidade com versões principais mais antigas.
```

```txt
Estabilidade: 1 - Experimental. Essa feature ainda está em desenvolvimento e está sujeita a alterações não compatíveis com versões anteriores, ou até remoção de versões futuras. Não recomendado o uso dessa feature em ambiente de produção.
Features experimentais não estão sujeitas ao modelo de versionamento semântico do Node.js.
```

```txt
Estabilidade: 2 - Estável. A API foi aprovada. A compatibilidade com o ambiente npm é de alta prioridade, e não será quebrada a menos que seja necessário.
```

É necessária tomar cuidado no uso de uma feature `Experimental`, particularmente com módulos que podem ser usados como dependência (ou dependência das dependências) de uma aplicação Node.js. Usuários finais podem não estar cientes do uso de uma feature experimental, e podem ocorrer erros inesperados ou mudança de comportamento caso a API seja modificada. Para evitar surpresas desagradáveis, uma feature `Experimental` deve ser marcada com uma linha de comando para habilitá-la explicitamente, ou então poderá emitir um alerta. By default, such warnings are printed to [`stderr`][] and may be handled by attaching a listener to the [`'warning'`][] event.

## JSON Output

<!-- YAML
added: v0.6.12
-->

> Stability: 1 - Experimental

Every `.html` document has a corresponding `.json` document presenting the same information in a structured manner. This feature is experimental, and added for the benefit of IDEs and other utilities that wish to do programmatic things with the documentation.

## Syscalls and man pages

System calls like open(2) and read(2) define the interface between user programs and the underlying operating system. Node.js functions which simply wrap a syscall, like [`fs.open()`][], will document that. The docs link to the corresponding man pages (short for manual pages) which describe how the syscalls work.

Some syscalls, like lchown(2), are BSD-specific. That means, for example, that [`fs.lchown()`][] only works on macOS and other BSD-derived systems, and is not available on Linux.

Most Unix syscalls have Windows equivalents, but behavior may differ on Windows relative to Linux and macOS. For an example of the subtle ways in which it's sometimes impossible to replace Unix syscall semantics on Windows, see [Node issue 4760](https://github.com/nodejs/node/issues/4760).