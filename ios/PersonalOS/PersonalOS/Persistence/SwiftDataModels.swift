import Foundation
import SwiftData

@Model
final class SDSoul {
    @Attribute(.unique) var soulID: UUID
    var createdAt: Date
    var depthScore: Double
    var phase: String
    var walletAddress: String?
    var walletProvisionedAt: Date?

    @Relationship(deleteRule: .cascade, inverse: \SDKonnection.soul)
    var konnections: [SDKonnection] = []

    @Relationship(deleteRule: .cascade, inverse: \SDInsight.soul)
    var insights: [SDInsight] = []

    init(soulID: UUID, createdAt: Date, depthScore: Double, phase: String) {
        self.soulID = soulID
        self.createdAt = createdAt
        self.depthScore = depthScore
        self.phase = phase
    }
}

@Model
final class SDKonnection {
    @Attribute(.unique) var konnectionID: UUID
    var provider: String
    var status: String
    var connectedAt: Date
    var lastHarvestedAt: Date?
    var transaktionCount: Int

    var soul: SDSoul?

    @Relationship(deleteRule: .cascade, inverse: \SDSoulTransaktion.konnection)
    var transaktions: [SDSoulTransaktion] = []

    @Relationship(deleteRule: .cascade, inverse: \SDSyncReport.konnection)
    var syncReports: [SDSyncReport] = []

    init(konnectionID: UUID, provider: String, status: String, connectedAt: Date, transaktionCount: Int) {
        self.konnectionID = konnectionID
        self.provider = provider
        self.status = status
        self.connectedAt = connectedAt
        self.transaktionCount = transaktionCount
    }
}

@Model
final class SDSoulTransaktion {
    @Attribute(.unique) var transaktionID: UUID
    var source: String
    var transactionType: String
    var harvestedAt: Date
    var occurredAt: Date
    var rawRef: String
    var amountUSD: Double?
    var currency: String?
    var merchantRaw: String?
    var merchantCanonical: String?
    var categoryRaw: String?
    var soulCategory: String
    var soulTags: String
    var intentSignals: String
    var healthFlag: Bool
    var marketplaceEligible: Bool
    var useLimitationTags: String
    var confidence: Double

    var konnection: SDKonnection?

    init(transaktionID: UUID, source: String, transactionType: String, harvestedAt: Date,
         occurredAt: Date, rawRef: String, soulCategory: String, confidence: Double) {
        self.transaktionID = transaktionID
        self.source = source
        self.transactionType = transactionType
        self.harvestedAt = harvestedAt
        self.occurredAt = occurredAt
        self.rawRef = rawRef
        self.soulCategory = soulCategory
        self.confidence = confidence
        self.soulTags = "[]"
        self.intentSignals = "[]"
        self.healthFlag = false
        self.marketplaceEligible = true
        self.useLimitationTags = "[]"
    }
}

@Model
final class SDInsight {
    @Attribute(.unique) var insightID: UUID
    var category: String
    var score: Double
    var confidence: Double
    var computedAt: Date
    var algorithmVersion: String
    var isStale: Bool
    var marketplaceEligible: Bool

    var soul: SDSoul?

    init(insightID: UUID, category: String, score: Double, confidence: Double,
         computedAt: Date, algorithmVersion: String) {
        self.insightID = insightID
        self.category = category
        self.score = score
        self.confidence = confidence
        self.computedAt = computedAt
        self.algorithmVersion = algorithmVersion
        self.isStale = false
        self.marketplaceEligible = true
    }
}

@Model
final class SDSyncReport {
    @Attribute(.unique) var reportID: UUID
    var provider: String
    var startedAt: Date
    var completedAt: Date?
    var status: String
    var recordsSynced: Int
    var categoriesFound: Int
    var dateRangeStart: Date?
    var dateRangeEnd: Date?
    var timeToFirstRecord: Double?
    var timeToComplete: Double?
    var slaViolations: String
    var consistencyWarnings: String

    var konnection: SDKonnection?

    init(reportID: UUID, provider: String, startedAt: Date, status: String, recordsSynced: Int) {
        self.reportID = reportID
        self.provider = provider
        self.startedAt = startedAt
        self.status = status
        self.recordsSynced = recordsSynced
        self.categoriesFound = 0
        self.slaViolations = "[]"
        self.consistencyWarnings = "[]"
    }
}
