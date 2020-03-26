# Giới thiệu về tài liệu

<!--introduced_in=v0.10.0-->
<!-- type=misc -->

Tài liệu này sẽ giới thiệu một cách đầy đủ về hệ thống phần mềm Node.js, API, cũng như một số tài liệu tham khảo và những khái niệm. Mỗi một phần sẽ giới thiệu các module được tạo thành và những khái niệm bậc cao khác nhau (Module là một chức năng mà người lập trình tạo ra và có thể "tháo rời").

Xử lý sự kiện trong Java sẽ được chi tiết hóa bằng các giá trị cấu hình thích hợp, các đối số truyền vào phương thức hay những đối số khác, tất cả sẽ được liệt kê dưới dạng danh sách bên dưới tiêu đề.

## Nhứng đóng góp của người dịch

Nếu người dịch phát hiện ra lỗi trong tài liệu này, xin vui lòng vào phần [gửi yêu cầu](https://github.com/nodejs/node/issues/new) hoặc xem trong phần [hướng dẫn đóng góp ý kiến](https://github.com/nodejs/node/blob/master/CONTRIBUTING.md) để được hướng dẫn cụ thể cách gửi yêu cầu của mình.

Mỗi tệp tin được tạo ra đều có đuôi là `.md` và nằm ở thư mục `doc/api/` được lưu trong phần mềm Source Tree của Node.js. Chương trình `tools/doc/generate.js` dùng để tạo tài liệu. Mẫu HTML lưu tại `doc/template.html`.

## Chỉ mục index ổn định

<!--type=misc-->

Throughout the documentation are indications of a section's stability. The Node.js API is still somewhat changing, and as it matures, certain parts are more reliable than others. Some are so proven, and so relied upon, that they are unlikely to ever change at all. Others are brand new and experimental, or known to be hazardous and in the process of being redesigned.

The stability indices are as follows:

> Stability: 0 - Deprecated. The feature may emit warnings. Backward compatibility is not guaranteed.

<!-- separator -->

> Stability: 1 - Experimental. This feature is still under active development and subject to non-backward compatible changes or removal in any future version. Use of the feature is not recommended in production environments. Experimental features are not subject to the Node.js Semantic Versioning model.

<!-- separator -->

> Stability: 2 - Stable. Compatibility with the npm ecosystem is a high priority.

Caution must be used when making use of `Experimental` features, particularly within modules that may be used as dependencies (or dependencies of dependencies) within a Node.js application. End users may not be aware that experimental features are being used, and therefore may experience unexpected failures or behavior changes when API modifications occur. To help avoid such surprises, `Experimental` features may require a command-line flag to explicitly enable them, or may cause a process warning to be emitted. By default, such warnings are printed to [`stderr`][] and may be handled by attaching a listener to the [`'warning'`][] event.

## JSON Output
<!-- YAML
added: v0.6.12
-->

> Tính ổn định: 1 - Thử nghiệm

Every `.html` document has a corresponding `.json` document presenting the same information in a structured manner. This feature is experimental, and added for the benefit of IDEs and other utilities that wish to do programmatic things with the documentation.

## Syscalls and man pages

System calls like open(2) and read(2) define the interface between user programs and the underlying operating system. Node.js functions which simply wrap a syscall, like [`fs.open()`][], will document that. The docs link to the corresponding man pages (short for manual pages) which describe how the syscalls work.

Most Unix syscalls have Windows equivalents, but behavior may differ on Windows relative to Linux and macOS. For an example of the subtle ways in which it's sometimes impossible to replace Unix syscall semantics on Windows, see [Node.js issue 4760](https://github.com/nodejs/node/issues/4760).
