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

É necessária tomar cuidado no uso de uma feature `Experimental`, particularmente com módulos que podem ser usados como dependência (ou dependência das dependências) de uma aplicação Node.js. Usuários finais podem não estar cientes do uso de uma feature experimental, e podem ocorrer erros inesperados ou mudança de comportamento caso a API seja modificada. Para evitar surpresas desagradáveis, uma feature `Experimental` deve ser marcada com uma linha de comando para habilitá-la explicitamente, ou então poderá emitir um alerta. Por padrão, esses alertas são exibidos num [`stderr`][] e devem ser tratados anexando um listener no evento [`'warning'`][].

## Saída de JSON

<!-- YAML
added: v0.6.12
-->

> Estabilidade: 1 - Experimental

Todo documento `.html` tem um documento `.json` correspondente, que apresenta as mesmas informações de forma estruturada. Essa é uma feature experimental, adicionada para benefício de IDEs ou outras ferramentas utilitárias para quem deseja fazer coisas através da programação com essa documentação.

## Chamadas de sistema e páginas de manual

Chamadas de sistema (system calls) como open(2) e read(2) definem a interface de uso entre programas de usuário e o sistema operacional subjacente. Funções Node.js que somente envolvem uma syscall, como [`fs.open()`][], vão documentar isso. O link do documento para sua página correspondente no manual (abreviação de man pages) que descreve como a chamada de sistema funciona.

Algumas chamadas de sistema, como lchown(2), são específicas do BSD. Isso significa que, por exemplo, [`fs.lchown()`][] só funciona no macOS e outros sistemas BSD semelhantes, e não está disponível no Linux.

Muitas chamadas de sistema Unix possuem equivalentes no Windows, mas o comportamento pode ser diferente no Windows em relação a Linux e macOS. Um exemplo dessas sutilezas é que às vezes é impossível substituir no Windows uma chamada de sistema Unix, veja [Node issue 4760](https://github.com/nodejs/node/issues/4760).