import Foundation
import PDFKit
import Darwin

guard CommandLine.arguments.count >= 2 else {
    fputs("Usage: extract-pdf-text.swift <pdf-path> [start-page] [page-count]\n", stderr)
    exit(2)
}

let fileURL = URL(fileURLWithPath: CommandLine.arguments[1])
let startPage = max(1, Int(CommandLine.arguments.dropFirst(2).first ?? "1") ?? 1)
let pageCount = max(1, Int(CommandLine.arguments.dropFirst(3).first ?? "30") ?? 30)

guard let document = PDFDocument(url: fileURL) else {
    fputs("PDFKit could not open the PDF.\n", stderr)
    exit(3)
}

let first = min(document.pageCount, startPage - 1)
let end = min(document.pageCount, first + pageCount)
if first >= end {
    fputs("Requested page range is outside the PDF.\n", stderr)
    exit(4)
}

for index in first..<end {
    guard let page = document.page(at: index) else { continue }
    print("--- Page \(index + 1) ---")
    print(page.string ?? "")
}
