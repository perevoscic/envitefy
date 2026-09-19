import Foundation

enum AppConfiguration {
    static let origin = URL(string: "https://envitefy.com")!
    static let callbackScheme = "envitefy"
    static let userAgent = "EnvitefyIOS/1.0"

    static func isFirstParty(_ url: URL) -> Bool {
        url.scheme?.lowercased() == "https" && url.host?.lowercased() == "envitefy.com"
            && (url.port == nil || url.port == 443) && url.user == nil && url.password == nil
    }

    static func safePath(_ path: String) -> String {
        guard path.hasPrefix("/"), !path.hasPrefix("//"), !path.contains("\\"),
              path.count <= 2048, !path.unicodeScalars.contains(where: { $0.value <= 32 }),
              let url = URL(string: path, relativeTo: origin)?.absoluteURL.standardized, isFirstParty(url),
              !["api", "mobile"].contains(url.pathComponents.dropFirst().first ?? "") else { return "/" }
        return path
    }

    static func callback(_ url: URL, expectedState: String) -> String? {
        guard url.scheme == callbackScheme, url.host == "auth", url.path == "/callback",
              url.user == nil, url.password == nil, url.port == nil, url.fragment == nil,
              let components = URLComponents(url: url, resolvingAgainstBaseURL: false) else { return nil }
        let items = components.queryItems ?? []
        guard items.filter({ $0.name == "state" }).count == 1,
              items.filter({ $0.name == "code" }).count == 1,
              items.first(where: { $0.name == "state" })?.value == expectedState,
              let code = items.first(where: { $0.name == "code" })?.value,
              code.range(of: "^[A-Za-z0-9_-]{43}$", options: .regularExpression) != nil else { return nil }
        return code
    }

    static func canOpenExternally(_ url: URL) -> Bool {
        ["https", "mailto", "tel", "sms", "webcal", "webcals", "maps", "comgooglemaps"].contains(url.scheme?.lowercased() ?? "")
    }

    // Sharing a settings page or private signup-management URL would expose private context.
    static func shareURL(_ url: URL) -> URL? {
        guard isFirstParty(url), url.query == nil, url.fragment == nil else { return nil }
        let parts = url.pathComponents.filter { $0 != "/" }
        guard parts.count == 2, ["event", "e", "card", "smart-signup-form"].contains(parts[0]),
              !["new", "gymnastics", "football", "birthdays", "weddings"].contains(parts[1]) else { return nil }
        return url
    }
}
