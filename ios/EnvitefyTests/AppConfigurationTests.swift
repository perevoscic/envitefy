import XCTest
@testable import Envitefy

final class AppConfigurationTests: XCTestCase {
    func testOnlyExactHTTPSOriginIsTrusted() {
        XCTAssertTrue(AppConfiguration.isFirstParty(URL(string: "https://envitefy.com/event/example")!))
        for url in ["http://envitefy.com", "https://envitefy.com.evil.test", "https://envitefy.com:444", "https://user@envitefy.com", "file:///etc/passwd"] {
            XCTAssertFalse(AppConfiguration.isFirstParty(URL(string: url)!))
        }
    }
    func testRejectsRedirectsAndInternalEndpoints() {
        for path in ["//evil.test", "/\\evil.test", "/api/auth/signout", "/a/../api/user", "/mobile/sign-in", "https://evil.test", "/bad\npath"] {
            XCTAssertEqual(AppConfiguration.safePath(path), "/")
        }
        XCTAssertEqual(AppConfiguration.safePath("/event/example?preview=owner"), "/event/example?preview=owner")
    }
    func testCallbackRequiresExactStateAndSingleCode() {
        let code = String(repeating: "a", count: 43)
        let url = URL(string: "envitefy://auth/callback?code=\(code)&state=expected")!
        XCTAssertEqual(AppConfiguration.callback(url, expectedState: "expected"), code)
        XCTAssertNil(AppConfiguration.callback(url, expectedState: "wrong"))
        XCTAssertNil(AppConfiguration.callback(URL(string: url.absoluteString + "&code=duplicate")!, expectedState: "expected"))
        XCTAssertNil(AppConfiguration.callback(URL(string: "https://auth/callback?code=\(code)&state=expected")!, expectedState: "expected"))
    }
    func testPrivateLinksCannotBeSharedByAppToolbar() {
        for path in ["/settings", "/smart-signup-form/example/manage", "/event/example?token=secret", "/card/example#private", "/event/new"] {
            XCTAssertNil(AppConfiguration.shareURL(URL(string: "https://envitefy.com" + path)!))
        }
        XCTAssertNotNil(AppConfiguration.shareURL(URL(string: "https://envitefy.com/card/example")!))
    }
}
