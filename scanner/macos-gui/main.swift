import Cocoa

class AppDelegate: NSObject, NSApplicationDelegate {
    var window: NSWindow!
    var statusLabel: NSTextField!

    func applicationDidFinishLaunching(_ notification: Notification) {
        // Create window
        let windowRect = NSRect(x: 0, y: 0, width: 320, height: 140)
        window = NSWindow(
            contentRect: windowRect,
            styleMask: [.titled, .closable],
            backing: .buffered,
            defer: false
        )
        window.title = "DoINeedAnUpgrade"
        window.center()

        // Content view
        let contentView = NSView(frame: windowRect)
        window.contentView = contentView

        // Spinner
        let spinner = NSProgressIndicator(frame: NSRect(x: 140, y: 80, width: 40, height: 40))
        spinner.style = .spinning
        spinner.startAnimation(nil)
        contentView.addSubview(spinner)

        // Status label
        statusLabel = NSTextField(frame: NSRect(x: 20, y: 30, width: 280, height: 40))
        statusLabel.stringValue = "Scanning your hardware..."
        statusLabel.isEditable = false
        statusLabel.isBordered = false
        statusLabel.backgroundColor = .clear
        statusLabel.alignment = .center
        statusLabel.font = NSFont.systemFont(ofSize: 14)
        contentView.addSubview(statusLabel)

        window.makeKeyAndOrderFront(nil)
        NSApp.activate(ignoringOtherApps: true)

        // Run scan in background
        DispatchQueue.global(qos: .userInitiated).async {
            let specs = Scanner.detectSpecs()
            let code = Scanner.encodeSpecs(specs) ?? ""
            let url = Scanner.getURL(specs)

            // Copy to clipboard
            let pasteboard = NSPasteboard.general
            pasteboard.clearContents()
            pasteboard.setString(code, forType: .string)

            DispatchQueue.main.async {
                self.statusLabel.stringValue = "Done! Opening browser..."

                // Open browser
                if let urlObj = URL(string: url) {
                    NSWorkspace.shared.open(urlObj)
                }

                // Close after delay
                DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
                    NSApp.terminate(nil)
                }
            }
        }
    }
}

// Main entry point
let app = NSApplication.shared
let delegate = AppDelegate()
app.delegate = delegate
app.run()
