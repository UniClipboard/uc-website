// macOS-only acceptance helper. Reads PNG bytes from stdin, writes the decoded
// payload to the parent test process, never to a file or a test report.
import Foundation
import Vision
import ImageIO
let data = FileHandle.standardInput.readDataToEndOfFile()
guard let source = CGImageSourceCreateWithData(data as CFData, nil),
      let image = CGImageSourceCreateImageAtIndex(source, 0, nil) else { exit(1) }
let request = VNDetectBarcodesRequest()
request.symbologies = [.qr]
try VNImageRequestHandler(cgImage: image).perform([request])
guard let payload = request.results?.first?.payloadStringValue else { exit(2) }
print(payload, terminator: "")
