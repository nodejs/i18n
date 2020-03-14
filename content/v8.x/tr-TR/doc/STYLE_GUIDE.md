# Stil Klavuzu

* Dokümantasyon, `lowercase-with-dashes.md` olarak biçimlendirilmiş isimlerle markdown dosyalarına yazılmıştır.
  * Dosya adlarında altçizgilerin bulunmasına yalnızca belgenin açıklayacağı konu içerisinde bulunduklarında izin verilir(ör. `child_process`).
  * Üst düzey markdown dosyaları gibi bazı dosyalar istisnadır.
* Dokümanlar satır sonuna kadar 80 karakterle sınırlı olmalıdır.
* `.editorconfig` 'da açıklanan formatlama tercih edilir.
  * Bazı editörlerin bu kuralları otomatik olarak uygulayabilmeleri için bir [eklenti](http://editorconfig.org/#download) bulunmaktadır.
* Yazım ve dil bilgisi gibi mekanik konular mümkün olduğunca araçlarla tanımlanmalıdır. Eğer bir araçla tanımlanmadıysa gözlemciler tarafından belirtilmesi gerekir.
* Amerikan İngilizcesi yazımı tercih edilir. "Capitalize" vs. "Capitalise", "color" vs. "colour", vb.
* [Seri virgül](https://en.wikipedia.org/wiki/Serial_comma) kullanın.
* Referans belgelerinde kişi zamirlerden kaçının (“Ben”, “sen”, “biz”).
  * Kişi zamirlerinin kullanımı günlük konuşma diline özgü klavuzlar gibi belgelerde kabul edilir.
  * Cinsiyet belirtmeyen zamirleri ve cinsiyet belirtmeyen çoğul isimleri kullanın.
    * EVET: "onlar", "onların", "onlar", "millet", "insanlar", "geliştiriciler"
    * TAMAM DEĞİL: "onun", "onunki", "o", "beyler", "ahbaplar"
* Sarma elemanlarını (parantezler ve tırnak işaretleri) birleştirirken, terminal noktalama işaretleri yerleştirilmelidir:
  * Sarma elemanı tam bir cümle içeriyorsa, sarma öğesinin içinde — bir özne, fiil ve bir nesne.
  * Paketleme elemanı, sarma elemanının dışında, sadece bir maddenin bir parçasını içeriyorsa.
* Cümle sonu noktalama işaretlerini sarma öğelerinin içine yerleştirin — periyotlar parantez içinde ve sonra değil, tırnak içindedir.
* Belgeler birinci seviye bir başlıkla başlamalıdır. Sonunda örnek bir belge buraya bağlanacaktır.
* Bağlantıları satır içi bağlantılara yapıştırmayı tercih edin — `[bir bağlantı][]`'ya `[bir bağlantı](http://example.com)` seçin.
* API'leri belgelerken, bölümün sonunda API'nin tanıtıldığı sürümü not edin. Bir API kullanımdan kaldırılmışsa, ayrıca API'nin kullanımdan kaldırıldığı ilk sürümünü de not alın.
* Çizgileri kullanırken, [New York Times Stil ve Kullanım Kılavuzu](https://en.wikipedia.org/wiki/The_New_York_Times_Manual_of_Style_and_Usage)'na göre boşluklarla çevrili [Em çizgileri](https://en.wikipedia.org/wiki/Dash#Em_dash) ("—" veya `Seçenek+Shift+"-"`'yi macOS üzerinde) kullanın.
* Varlıklar dahil olmak üzere:
  * Bir örnek veya tam program eklemek istiyorsanız, onu dir içindeki `varlıklar/<0> uygun alt dizine ekleyin.</li>
<li>Şu şekilde bağlayın: <code>[Asset](/varlıklar/{subdir}/{filename})` dosya tabanlı varlıklar için ve `![Asset](/varlıklar{subdir}/{filename})` görüntü tabanlı varlıklar için.
  * Resimler için, SVG'yi diğer varlıklara tercih edin. SVG uygun olmadığında, lütfen tanıtmakta olduğunuz varlığın dosya boyutuna dikkat edin.
* Kod blokları için:
  * Dil farkında çitleri kullanın. ("```js")
  * Kodun eksiksiz olması gerekmez — kod bloklarını tam çalışan programlar olarak değil, bir örnek olarak kabul edin veya amacınıza yardım edin. Eğer tam bir çalışma programı gerekliyse, onu `varlıklar/kod-örnekleri`'nde bir öğe olarak ekleyin ve ona bağlayın.
* Alt çizgi, yıldız işareti ve geri tepme çubukları kullanılırken, lütfen uygun şekilde kaçma kullanın (`\_`, `\*` ve `` \` `` yerine `_`, `*` ve `` ` ``).
* Yapıcı işlevlerine yapılan başvurular PascalCase kullanmalıdır.
* Yapıcı örneklerine yapılan referanslar camelCase kullanmalıdır.
* Metotlara referanslar parantez içinde kullanılmalıdır: örneğin, `socket.end()` yerine `socket.end`.
* To draw special attention to a note, adhere to the following guidelines:
  * Make the "Note:" label italic, i.e. `*Note*:`.
  * Use a capital letter after the "Note:" label.
  * Preferably, make the note a new paragraph for better visual distinction.
* İşlev argümanları veya nesne özellikleri aşağıdaki formatı kullanmalıdır:
  * <code>* \`name\` {type|type2} Optional description. \*\*Default:\*\* \`defaultValue\`.</code>
  * E.g. <code>* `byteOffset` {integer} Index of first byte to expose. **Default:** `0`.</code>
  * `Tür`, bir Node.js türüne veya bir [JavaScript türüne](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Grammar_and_types#Data_structures_and_types) bakmalıdır.
* Fonksiyon dönüşleri aşağıdaki formatı kullanmalıdır:
  * <code>* Dönüşler: {type|type2} İsteğe bağlı açıklama.</code>
  * E.g. <code>* Returns: {AsyncHook} A reference to `asyncHook`.</code>
* Use official styling for capitalization in products and projects.
  * OK: JavaScript, Google's V8
  * NOT OK: Javascript, Google's v8
* Use _Node.js_ and not _Node_, _NodeJS_, or similar variants.
  * When referring to the executable, _`node`_ is acceptable.

See also API documentation structure overview in [doctools README](../tools/doc/README.md).
