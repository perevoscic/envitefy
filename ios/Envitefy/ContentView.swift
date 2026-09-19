import SwiftUI
import WebKit

struct ContentView: View {
    @StateObject private var browser = BrowserModel()

    var body: some View {
        VStack(spacing: 0) {
            ZStack {
                WebsiteView(model: browser)
                if let failure = browser.loadFailure {
                    VStack(spacing: 20) {
                        Image(systemName: "wifi.exclamationmark").font(.largeTitle).accessibilityHidden(true)
                        Text("Unable to open Envitefy").font(.title2).bold()
                        Text(failure).multilineTextAlignment(.center)
                        Button("Try again") { browser.retry() }
                            .buttonStyle(.borderedProminent).frame(minHeight: 44)
                    }.padding(32).frame(maxWidth: .infinity, maxHeight: .infinity)
                        .background(Color(uiColor: .systemBackground))
                }
                if browser.isLoading {
                    VStack { ProgressView().padding(12).background(.regularMaterial, in: Capsule()); Spacer() }
                        .padding(.top, 8).allowsHitTesting(false).accessibilityLabel("Loading Envitefy")
                }
            }
            HStack {
                Button { browser.navigate(action: "back") } label: { Image(systemName: "chevron.left").frame(width: 44, height: 44) }
                    .disabled(!browser.canGoBack).accessibilityLabel("Go back")
                Spacer()
                Text("Envitefy").font(.footnote).foregroundStyle(.secondary)
                Spacer()
                Menu {
                    Button("Home", systemImage: "house") { browser.navigate(action: "navigate", path: "/") }
                    Button("Sign in", systemImage: "person.crop.circle") { browser.authenticate() }
                    if let url = browser.publicShareURL {
                        ShareLink(item: url) { Label("Share event", systemImage: "square.and.arrow.up") }
                    }
                    Button("Refresh", systemImage: "arrow.clockwise") { browser.navigate(action: "reload") }
                    Button("Privacy policy", systemImage: "hand.raised") { browser.openExternal(AppConfiguration.origin.appendingPathComponent("privacy")) }
                    Button("Help & support", systemImage: "questionmark.circle") { browser.openExternal(AppConfiguration.origin.appendingPathComponent("contact")) }
                } label: { Image(systemName: "ellipsis").frame(width: 44, height: 44) }
                    .accessibilityLabel("App actions")
            }.padding(.horizontal, 12).background(.regularMaterial)
        }
        .sheet(item: $browser.sharedFile) { file in
            ActivitySheet(items: [file.url]).onDisappear { browser.removeTemporaryFile(file.url) }
        }
        .alert("Envitefy", isPresented: Binding(get: { browser.message != nil }, set: { if !$0 { browser.message = nil } })) {
            Button("OK", role: .cancel) { browser.message = nil }
        } message: { Text(browser.message ?? "") }
        .onOpenURL { url in
            // Authentication callbacks are handled only by the active ASWebAuthenticationSession.
            if AppConfiguration.isFirstParty(url) { browser.navigate(action: "navigate", path: url.path + (url.query.map { "?" + $0 } ?? "")) }
        }
    }
}

struct WebsiteView: UIViewRepresentable {
    let model: BrowserModel
    func makeUIView(context: Context) -> WKWebView { model.webView }
    func updateUIView(_ view: WKWebView, context: Context) {}
}

struct ActivitySheet: UIViewControllerRepresentable {
    let items: [Any]
    func makeUIViewController(context: Context) -> UIActivityViewController {
        UIActivityViewController(activityItems: items, applicationActivities: nil)
    }
    func updateUIViewController(_ controller: UIActivityViewController, context: Context) {}
}
