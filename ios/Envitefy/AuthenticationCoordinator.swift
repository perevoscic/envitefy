import AuthenticationServices
import CryptoKit
import Security
import WebKit

@MainActor
final class AuthenticationCoordinator: NSObject, ASWebAuthenticationPresentationContextProviding {
    private var session: ASWebAuthenticationSession?
    private weak var webView: WKWebView?

    func start(webView: WKWebView, returnTo: String, mode: String, intent: String?, calendar: String? = nil, completion: @escaping (Result<String, Error>) -> Void) {
        guard session == nil else { return }
        self.webView = webView
        do {
            let verifier = try randomToken()
            let state = try randomToken()
            let challenge = Data(SHA256.hash(data: Data(verifier.utf8))).base64URL
            var url = URLComponents(url: AppConfiguration.origin.appendingPathComponent("mobile/sign-in"), resolvingAgainstBaseURL: false)!
            url.queryItems = [URLQueryItem(name: "challenge", value: challenge), URLQueryItem(name: "state", value: state),
                              URLQueryItem(name: "returnTo", value: AppConfiguration.safePath(returnTo)),
                              URLQueryItem(name: "mode", value: mode == "signup" ? "signup" : "login")]
            if let intent { url.queryItems?.append(URLQueryItem(name: "intent", value: intent)) }
            if let calendar, ["google", "outlook"].contains(calendar) { url.queryItems?.append(URLQueryItem(name: "calendar", value: calendar)) }
            let auth = ASWebAuthenticationSession(url: url.url!, callbackURLScheme: AppConfiguration.callbackScheme) { [weak self, weak webView] callback, error in
                Task { @MainActor in
                    guard let self else { return }
                    self.session = nil
                    if let error {
                        if (error as? ASWebAuthenticationSessionError)?.code == .canceledLogin { return }
                        completion(.failure(error)); return
                    }
                    guard let callback, let code = AppConfiguration.callback(callback, expectedState: state), let webView else {
                        completion(.failure(AuthError.invalidCallback)); return
                    }
                    do { completion(.success(try await self.exchange(code: code, verifier: verifier, webView: webView))) }
                    catch { completion(.failure(error)) }
                }
            }
            // Do not silently import another Safari user's existing account.
            auth.prefersEphemeralWebBrowserSession = true
            auth.presentationContextProvider = self
            session = auth
            if !auth.start() { session = nil; completion(.failure(AuthError.unavailable)) }
        } catch { completion(.failure(error)) }
    }

    func presentationAnchor(for session: ASWebAuthenticationSession) -> ASPresentationAnchor {
        webView?.window ?? ASPresentationAnchor()
    }

    private func randomToken() throws -> String {
        var bytes = [UInt8](repeating: 0, count: 32)
        guard SecRandomCopyBytes(kSecRandomDefault, bytes.count, &bytes) == errSecSuccess else { throw AuthError.unavailable }
        return Data(bytes).base64URL
    }

    private func exchange(code: String, verifier: String, webView: WKWebView) async throws -> String {
        let endpoint = AppConfiguration.origin.appendingPathComponent("api/mobile/auth/exchange")
        var request = URLRequest(url: endpoint)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONEncoder().encode(ExchangeRequest(code: code, verifier: verifier))
        request.timeoutInterval = 30
        let client = URLSession(configuration: .ephemeral, delegate: NoRedirects(), delegateQueue: nil)
        defer { client.invalidateAndCancel() }
        let (data, response) = try await client.data(for: request)
        guard let response = response as? HTTPURLResponse, response.statusCode == 200,
              response.url == endpoint else { throw AuthError.exchangeFailed }
        var fields: [String: String] = [:]
        for (key, value) in response.allHeaderFields { fields[String(describing: key)] = String(describing: value) }
        let cookies = HTTPCookie.cookies(withResponseHeaderFields: fields, for: endpoint).filter {
            ($0.name == "__Secure-next-auth.session-token" || $0.name.hasPrefix("__Secure-next-auth.session-token."))
                && $0.domain == "envitefy.com" && $0.isSecure && $0.isHTTPOnly
        }
        guard !cookies.isEmpty else { throw AuthError.exchangeFailed }
        let result = try JSONDecoder().decode(ExchangeResponse.self, from: data)
        let store = webView.configuration.websiteDataStore.httpCookieStore
        let oldCookies: [HTTPCookie] = await withCheckedContinuation { continuation in
            store.getAllCookies { continuation.resume(returning: $0) }
        }
        for old in oldCookies where old.name == "__Secure-next-auth.session-token" || old.name.hasPrefix("__Secure-next-auth.session-token.") {
            await withCheckedContinuation { (continuation: CheckedContinuation<Void, Never>) in
                store.delete(old) { continuation.resume() }
            }
        }
        for cookie in cookies {
            await withCheckedContinuation { (continuation: CheckedContinuation<Void, Never>) in
                store.setCookie(cookie) { continuation.resume() }
            }
        }
        return AppConfiguration.safePath(result.returnTo)
    }
}

private struct ExchangeRequest: Encodable { let code: String; let verifier: String }
private struct ExchangeResponse: Decodable { let returnTo: String }
private enum AuthError: LocalizedError {
    case invalidCallback, unavailable, exchangeFailed
    var errorDescription: String? { "Sign-in could not finish. Please open Sign in and try again." }
}
private final class NoRedirects: NSObject, URLSessionTaskDelegate {
    func urlSession(_ session: URLSession, task: URLSessionTask, willPerformHTTPRedirection response: HTTPURLResponse,
                    newRequest request: URLRequest, completionHandler: @escaping (URLRequest?) -> Void) { completionHandler(nil) }
}
private extension Data {
    var base64URL: String { base64EncodedString().replacingOccurrences(of: "+", with: "-").replacingOccurrences(of: "/", with: "_").replacingOccurrences(of: "=", with: "") }
}
