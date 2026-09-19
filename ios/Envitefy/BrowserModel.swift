import Combine
import SwiftUI
import WebKit

struct SharedFile: Identifiable { let id = UUID(); let url: URL }

@MainActor
final class BrowserModel: NSObject, ObservableObject, WKNavigationDelegate, WKUIDelegate, WKScriptMessageHandler, WKDownloadDelegate {
    @Published var isLoading = true
    @Published var canGoBack = false
    @Published var loadFailure: String?
    @Published var message: String?
    @Published var publicShareURL: URL?
    @Published var sharedFile: SharedFile?
    let webView: WKWebView
    private let authentication = AuthenticationCoordinator()
    private var observations: [NSKeyValueObservation] = []
    private var downloads: [ObjectIdentifier: URL] = [:]
    private var hasLoadedPage = false

    override init() {
        let configuration = WKWebViewConfiguration()
        configuration.websiteDataStore = .default()
        configuration.applicationNameForUserAgent = AppConfiguration.userAgent
        configuration.allowsInlineMediaPlayback = true
        configuration.preferences.javaScriptCanOpenWindowsAutomatically = false
        webView = WKWebView(frame: .zero, configuration: configuration)
        super.init()
        configuration.userContentController.add(WeakMessageHandler(self), name: "envitefy")
        webView.navigationDelegate = self
        webView.uiDelegate = self
        // Back goes through the website's explicit Save / Discard guard.
        webView.allowsBackForwardNavigationGestures = false
        webView.isOpaque = false
        webView.backgroundColor = .systemBackground
        observations = [
            webView.observe(\.isLoading, options: [.new]) { [weak self] view, _ in
                Task { @MainActor in self?.isLoading = view.isLoading }
            },
            webView.observe(\.canGoBack, options: [.new]) { [weak self] view, _ in
                Task { @MainActor in self?.canGoBack = view.canGoBack }
            },
            webView.observe(\.url, options: [.new]) { [weak self] view, _ in
                Task { @MainActor in self?.publicShareURL = view.url.flatMap(AppConfiguration.shareURL) }
            }
        ]
        webView.load(URLRequest(url: AppConfiguration.origin))
    }

    func retry() {
        loadFailure = nil
        if hasLoadedPage { navigate(action: "reload") }
        else { webView.load(URLRequest(url: AppConfiguration.origin)) }
    }

    func navigate(action: String, path: String = "/") {
        sendNavigation(["action": action, "path": AppConfiguration.safePath(path)])
    }

    private func sendNavigation(_ detail: [String: String]) {
        guard let data = try? JSONSerialization.data(withJSONObject: detail),
              let json = String(data: data, encoding: .utf8) else { return }
        let script = """
        (() => {
          if (document.documentElement.dataset.envitefyNativeReady !== 'true') return false;
          window.dispatchEvent(new CustomEvent('envitefy-native-navigation', { detail: \(json) }));
          return true;
        })()
        """
        webView.evaluateJavaScript(script) { [weak self] result, _ in
            guard result as? Bool != true else { return }
            self?.message = "This page is still loading or needs an Envitefy update. Try again after it finishes loading."
        }
    }

    func authenticate(returnTo: String? = nil, mode: String = "login", intent: String? = nil, calendar: String? = nil) {
        let current = webView.url.map { $0.path + ($0.query.map { "?" + $0 } ?? "") } ?? "/"
        var detail = ["action": "authentication-request", "path": AppConfiguration.safePath(returnTo ?? current), "mode": mode]
        if let intent { detail["intent"] = intent }
        if let calendar { detail["calendar"] = calendar }
        sendNavigation(detail)
    }

    private func beginAuthentication(returnTo: String, mode: String, intent: String?, calendar: String?) {
        authentication.start(webView: webView, returnTo: returnTo, mode: mode, intent: intent, calendar: calendar) { [weak self] result in
            switch result {
            case .success(let path): self?.navigate(action: "authenticated", path: path)
            case .failure(let error): self?.message = error.localizedDescription
            }
        }
    }

    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard message.frameInfo.isMainFrame, let url = message.frameInfo.request.url,
              AppConfiguration.isFirstParty(url), let body = message.body as? [String: String] else { return }
        if body["action"] == "request-authenticate" {
            authenticate(returnTo: body["returnTo"], mode: body["mode"] ?? "login", intent: body["intent"], calendar: body["calendar"])
        } else if body["action"] == "authenticate" {
            beginAuthentication(returnTo: body["returnTo"] ?? "/", mode: body["mode"] ?? "login", intent: body["intent"], calendar: body["calendar"])
        }
    }

    func openExternal(_ url: URL) {
        guard AppConfiguration.canOpenExternally(url) else { return }
        UIApplication.shared.open(url) { [weak self] opened in
            if !opened { self?.message = "No app is available to open this link." }
        }
    }

    func webView(_ webView: WKWebView, decidePolicyFor action: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        guard let url = action.request.url else { decisionHandler(.cancel); return }
        if action.targetFrame?.isMainFrame == false { decisionHandler(.allow); return }
        if action.shouldPerformDownload && (AppConfiguration.isFirstParty(url) || url.scheme == "blob") {
            decisionHandler(.download); return
        }
        if AppConfiguration.isFirstParty(url) {
            if interceptCalendar(url) { decisionHandler(.cancel); return }
            decisionHandler(.allow); return
        }
        // No OAuth, arbitrary website, script, or local-file navigation inside the trusted web view.
        if action.navigationType == .linkActivated { openExternal(url) }
        else if ["accounts.google.com", "appleid.apple.com"].contains(url.host ?? "") {
            message = "Use Sign in from App actions to continue securely."
        }
        decisionHandler(.cancel)
    }

    func webView(_ webView: WKWebView, createWebViewWith configuration: WKWebViewConfiguration,
                 for action: WKNavigationAction, windowFeatures: WKWindowFeatures) -> WKWebView? {
        guard let url = action.request.url else { return nil }
        if AppConfiguration.isFirstParty(url) {
            if interceptCalendar(url) { return nil }
            navigate(action: "navigate", path: url.path + (url.query.map { "?" + $0 } ?? ""))
        } else { openExternal(url) }
        return nil
    }

    private func interceptCalendar(_ url: URL) -> Bool {
        guard ["/api/google/auth", "/api/outlook/auth"].contains(url.path) else { return false }
        let items = URLComponents(url: url, resolvingAgainstBaseURL: false)?.queryItems ?? []
        if items.contains(where: { $0.name == "analytics" || $0.name == "state" }) {
            message = "Open Envitefy in Safari to finish this advanced connection. Your event stays open here."
            return true
        }
        let next = items.first(where: { $0.name == "next" })?.value ?? "/settings#calendars"
        authenticate(returnTo: next, calendar: url.path.contains("google") ? "google" : "outlook")
        return true
    }

    func webView(_ webView: WKWebView, decidePolicyFor response: WKNavigationResponse, decisionHandler: @escaping (WKNavigationResponsePolicy) -> Void) {
        let disposition = (response.response as? HTTPURLResponse)?.value(forHTTPHeaderField: "Content-Disposition") ?? ""
        decisionHandler(!response.canShowMIMEType || disposition.lowercased().contains("attachment") ? .download : .allow)
    }
    func webView(_ webView: WKWebView, navigationAction: WKNavigationAction, didBecome download: WKDownload) { download.delegate = self }
    func webView(_ webView: WKWebView, navigationResponse: WKNavigationResponse, didBecome download: WKDownload) { download.delegate = self }
    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) { hasLoadedPage = true; loadFailure = nil }
    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) { failed(error) }
    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) { failed(error) }
    func webViewWebContentProcessDidTerminate(_ webView: WKWebView) {
        // Never silently reload or claim that unsaved work was persisted.
        hasLoadedPage = false
        loadFailure = "The page stopped running. Unsaved changes may have been lost. Reopen Envitefy to continue."
    }
    private func failed(_ error: Error) {
        guard (error as NSError).code != NSURLErrorCancelled else { return }
        if hasLoadedPage { message = "That page could not load. Your current page is still open." }
        else { loadFailure = "Check your internet connection, then try again." }
    }

    func download(_ download: WKDownload, decideDestinationUsing response: URLResponse, suggestedFilename: String, completionHandler: @escaping (URL?) -> Void) {
        do {
            let folder = FileManager.default.temporaryDirectory.appendingPathComponent("EnvitefyDownloads", isDirectory: true).appendingPathComponent(UUID().uuidString, isDirectory: true)
            try FileManager.default.createDirectory(at: folder, withIntermediateDirectories: true)
            let name = (suggestedFilename as NSString).lastPathComponent
            let url = folder.appendingPathComponent(name.isEmpty || name == "." || name == ".." ? "Envitefy-file" : name)
            downloads[ObjectIdentifier(download)] = url
            completionHandler(url)
        } catch { completionHandler(nil); message = "Unable to save this file. Please try again." }
    }
    func downloadDidFinish(_ download: WKDownload) {
        guard let url = downloads.removeValue(forKey: ObjectIdentifier(download)) else { return }
        sharedFile = SharedFile(url: url)
    }
    func download(_ download: WKDownload, didFailWithError error: Error, resumeData: Data?) {
        if let url = downloads.removeValue(forKey: ObjectIdentifier(download)) { removeTemporaryFile(url) }
        message = "The download did not finish. Please try again."
    }
    func removeTemporaryFile(_ url: URL) {
        let root = FileManager.default.temporaryDirectory.appendingPathComponent("EnvitefyDownloads", isDirectory: true).standardizedFileURL.path + "/"
        guard url.standardizedFileURL.path.hasPrefix(root) else { return }
        try? FileManager.default.removeItem(at: url.deletingLastPathComponent())
    }

    func webView(_ webView: WKWebView, runJavaScriptAlertPanelWithMessage message: String, initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping () -> Void) {
        let alert = UIAlertController(title: "Envitefy", message: message, preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "OK", style: .default) { _ in completionHandler() })
        present(alert, fallback: completionHandler)
    }
    func webView(_ webView: WKWebView, runJavaScriptConfirmPanelWithMessage message: String, initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping (Bool) -> Void) {
        let alert = UIAlertController(title: "Envitefy", message: message, preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "Cancel", style: .cancel) { _ in completionHandler(false) })
        alert.addAction(UIAlertAction(title: "Continue", style: .default) { _ in completionHandler(true) })
        present(alert) { completionHandler(false) }
    }
    func webView(_ webView: WKWebView, runJavaScriptTextInputPanelWithPrompt prompt: String, defaultText: String?, initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping (String?) -> Void) {
        let alert = UIAlertController(title: "Envitefy", message: prompt, preferredStyle: .alert)
        alert.addTextField { $0.text = defaultText }
        alert.addAction(UIAlertAction(title: "Cancel", style: .cancel) { _ in completionHandler(nil) })
        alert.addAction(UIAlertAction(title: "Continue", style: .default) { [weak alert] _ in completionHandler(alert?.textFields?.first?.text) })
        present(alert) { completionHandler(nil) }
    }
    private func present(_ controller: UIViewController, fallback: () -> Void) {
        guard var parent = webView.window?.rootViewController else { fallback(); return }
        while let shown = parent.presentedViewController { parent = shown }
        parent.present(controller, animated: true)
    }
}

private final class WeakMessageHandler: NSObject, WKScriptMessageHandler {
    weak var delegate: WKScriptMessageHandler?
    init(_ delegate: WKScriptMessageHandler) { self.delegate = delegate }
    func userContentController(_ controller: WKUserContentController, didReceive message: WKScriptMessage) {
        delegate?.userContentController(controller, didReceive: message)
    }
}
