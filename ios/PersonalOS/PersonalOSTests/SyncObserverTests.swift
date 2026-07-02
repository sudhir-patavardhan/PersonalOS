import XCTest
@testable import PersonalOS

final class SyncObserverTests: XCTestCase {
    func testSyncLifecycle() {
        let observer = SyncObserver()
        let konnectionID = UUID()

        observer.beginSync(provider: .plaid, konnectionID: konnectionID)
        XCTAssertEqual(observer.state(for: .plaid), .syncing)

        for _ in 0..<50 {
            observer.recordReceived(provider: .plaid)
        }

        let report = observer.completeSync(provider: .plaid)
        XCTAssertEqual(report.recordsSynced, 50)
        XCTAssertEqual(report.status, .completed)
        XCTAssertNotNil(report.completedAt)
        XCTAssertNotNil(report.timeToComplete)
    }

    func testFailedSync() {
        let observer = SyncObserver()

        observer.beginSync(provider: .plaid, konnectionID: UUID())
        let report = observer.failSync(provider: .plaid, error: NSError(domain: "test", code: 1))

        XCTAssertEqual(report.status, .failed)
    }

    func testIdleStateBeforeSync() {
        let observer = SyncObserver()
        XCTAssertEqual(observer.state(for: .plaid), .idle)
    }
}
