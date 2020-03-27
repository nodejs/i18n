# Sobre esta documentação

<!--introduced_in=v0.10.0-->
<!-- type=misc -->

O objetivo desta documentação é explicar de modo compreensível a API do Node.js, tanto do ponto de vista de referência quanto do ponto de vista conceitual. Cada seção descreve um módulo embutido ou um conceito de alto nível.

Quando necessário, propriedades de tipos, métodos de argumentos e os argumentos fornecidos para manipuladores de evento serão detalhados num subtópico, abaixo do tópico de cabeçalho.

## Contribuições

Caso encontre um erro nesta documentação, por favor, [abra uma issue](https://github.com/nodejs/node/issues/new) ou então veja [o guia de contribuição](https://github.com/nodejs/node/blob/master/CONTRIBUTING.md) para instruções de como submeter um patch de correção.

Cada arquivo é gerado com base no arquivo `.md` correspondente que fica no diretório: `doc/api/` na estrutura de arquivos do Node.js. A documentação é gerada usando o programa `tools/doc/generate.js`. Um template HTML está localizado em `template.html`.

## Índice de estabilidade

<!--type=misc-->

Por toda a documentação há indicadores de estabilidade de uma seção. A API do Node.js passa por mudanças, e conforme amadurece, certas partes são mais confiáveis que outras. Algumas já foram bastante testadas, e são tão usadas, que dificilmente mudarão. Outras são recentes e experimentais, ou são tidas como incertas e podem ser re-desenhadas.

Os índices de estabilidade são os seguintes:

> Estabilidade: 0 - Descontinuado. The feature may emit warnings. Backward compatibility is not guaranteed.

<!-- separator -->

> Stability: 1 - Experimental. This feature is still under active development and subject to non-backward compatible changes or removal in any future version. Use of the feature is not recommended in production environments. Experimental features are not subject to the Node.js Semantic Versioning model.

<!-- separator -->

> Stability: 2 - Stable. Compatibility with the npm ecosystem is a high priority.

É necessária tomar cuidado no uso de uma funcionalidades `Experimentais`, particularmente em módulos que podem ser usados como dependência (ou dependência de dependências) em uma aplicação Node.js. Usuários finais podem não estar cientes do uso de funcionalidades experimentais, e assim poderão sofrer com falhas inesperadas, ou mudança de comportamento quando ocorrerem modificações na API. Para evitar surpresas desagradáveis, uma feature `Experimental` deve ser marcada com uma linha de comando para habilitá-la explicitamente, ou então poderá emitir um alerta. Por padrão, esses alertas são exibidos num [`stderr`][] e devem ser tratados anexando um listener no evento [`'warning'`][].

## Saída de JSON
<!-- YAML
added: v0.6.12
-->

> Estabilidade: 1 - Experimental

Todo documento `.html` tem um documento `.json` correspondente, que apresenta as mesmas informações de forma estruturada. Essa é uma feature experimental, adicionada para benefício de IDEs ou outras ferramentas utilitárias para quem deseja fazer coisas através da programação com essa documentação.

## Chamadas de sistema e páginas de manual

Chamadas de sistema (system calls) como open(2) e read(2) definem a interface de uso entre programas de usuário e o sistema operacional subjacente. Node.js functions which simply wrap a syscall, like [`fs.open()`][], will document that. O link do documento para sua página correspondente no manual (abreviação de man pages) que descreve como a chamada de sistema funciona.

Muitas chamadas de sistema Unix possuem equivalentes no Windows, mas o comportamento pode ser diferente no Windows em relação a Linux e macOS. For an example of the subtle ways in which it's sometimes impossible to replace Unix syscall semantics on Windows, see [Node.js issue 4760](https://github.com/nodejs/node/issues/4760).
