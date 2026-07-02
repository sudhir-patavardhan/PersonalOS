import Foundation

class SandboxDataGenerator {
    let persona: MockPlaidService.Persona

    init(persona: MockPlaidService.Persona = .priya) {
        self.persona = persona
    }

    func generateAll(konnectionIDs: [Konnection.Provider: UUID]) -> [Konnection.Provider: [SoulTransaktion]] {
        var result: [Konnection.Provider: [SoulTransaktion]] = [:]
        for (provider, konnectionID) in konnectionIDs {
            result[provider] = generate(for: provider, konnectionID: konnectionID)
        }
        return result
    }

    func generate(for provider: Konnection.Provider, konnectionID: UUID) -> [SoulTransaktion] {
        switch provider {
        case .plaid:
            return []
        case .setuAA:
            return []
        case .appleHealth:
            return generateAppleHealth(konnectionID: konnectionID)
        case .googleDPA:
            return generateGoogleActivity(konnectionID: konnectionID)
        case .amazonBYOD:
            return generateAmazon(konnectionID: konnectionID)
        case .uberBYOD:
            return generateUber(konnectionID: konnectionID)
        case .instagramBYOD:
            return generateInstagram(konnectionID: konnectionID)
        }
    }

    // MARK: - Apple Health

    private func generateAppleHealth(konnectionID: UUID) -> [SoulTransaktion] {
        let calendar = Calendar.current
        let now = Date()
        var txns: [SoulTransaktion] = []
        let prefix = konnectionID.uuidString.prefix(8)

        for daysAgo in 0..<90 {
            let date = calendar.date(byAdding: .day, value: -daysAgo, to: now)!

            let steps = Int.random(in: persona.healthProfile.stepsRange)
            txns.append(SoulTransaktion(
                source: .appleHealth, transactionType: .activity,
                occurredAt: calendar.date(bySettingHour: 23, minute: 59, second: 0, of: date)!,
                rawRef: "health_steps_\(prefix)_\(daysAgo)",
                soulCategory: "health.fitness",
                soulTags: ["steps", "daily_summary"],
                intentSignals: steps > 10000 ? ["high_activity"] : [],
                healthFlag: true, marketplaceEligible: false,
                confidence: 1.0
            ))

            if daysAgo % 7 < persona.healthProfile.workoutDaysPerWeek {
                let workout = persona.healthProfile.workoutTypes.randomElement()!
                let calories = Int.random(in: workout.calorieRange)
                let duration = Int.random(in: workout.durationRange)
                let hour = workout.preferredHours.randomElement()!
                txns.append(SoulTransaktion(
                    source: .appleHealth, transactionType: .activity,
                    occurredAt: calendar.date(bySettingHour: hour, minute: Int.random(in: 0...59), second: 0, of: date)!,
                    rawRef: "health_workout_\(prefix)_\(daysAgo)",
                    soulCategory: "health.fitness",
                    soulTags: ["workout", workout.name, "duration_\(duration)min", "calories_\(calories)"],
                    intentSignals: calories > 400 ? ["intense_workout"] : [],
                    healthFlag: true, marketplaceEligible: false,
                    confidence: 1.0
                ))
            }

            let sleepHours = Double.random(in: persona.healthProfile.sleepRange)
            txns.append(SoulTransaktion(
                source: .appleHealth, transactionType: .activity,
                occurredAt: calendar.date(bySettingHour: 7, minute: Int.random(in: 0...30), second: 0, of: date)!,
                rawRef: "health_sleep_\(prefix)_\(daysAgo)",
                soulCategory: "health.fitness",
                soulTags: ["sleep", String(format: "hours_%.1f", sleepHours)],
                intentSignals: sleepHours < 6 ? ["poor_sleep"] : [],
                healthFlag: true, marketplaceEligible: false,
                confidence: 0.95
            ))

            let restingHR = Int.random(in: persona.healthProfile.restingHRRange)
            txns.append(SoulTransaktion(
                source: .appleHealth, transactionType: .activity,
                occurredAt: calendar.date(bySettingHour: 8, minute: 0, second: 0, of: date)!,
                rawRef: "health_hr_\(prefix)_\(daysAgo)",
                soulCategory: "health.fitness",
                soulTags: ["heart_rate", "resting_\(restingHR)bpm"],
                healthFlag: true, marketplaceEligible: false,
                confidence: 1.0
            ))
        }

        return txns.sorted { $0.occurredAt > $1.occurredAt }
    }

    // MARK: - Google Activity

    private func generateGoogleActivity(konnectionID: UUID) -> [SoulTransaktion] {
        let calendar = Calendar.current
        let now = Date()
        var txns: [SoulTransaktion] = []
        let prefix = konnectionID.uuidString.prefix(8)

        for daysAgo in 0..<90 {
            let date = calendar.date(byAdding: .day, value: -daysAgo, to: now)!

            let searchCount = Int.random(in: persona.googleProfile.dailySearchRange)
            for i in 0..<searchCount {
                let search = persona.googleProfile.searchTopics.randomElement()!
                let hour = Int.random(in: 8...23)
                txns.append(SoulTransaktion(
                    source: .googleActivity, transactionType: .activity,
                    occurredAt: calendar.date(bySettingHour: hour, minute: Int.random(in: 0...59), second: 0, of: date)!,
                    rawRef: "google_search_\(prefix)_\(daysAgo)_\(i)",
                    soulCategory: search.category,
                    soulTags: ["search", search.topic],
                    intentSignals: search.intentSignals,
                    confidence: 0.8
                ))
            }

            let browseCount = Int.random(in: 3...8)
            for i in 0..<browseCount {
                let site = persona.googleProfile.frequentSites.randomElement()!
                let hour = Int.random(in: 9...23)
                txns.append(SoulTransaktion(
                    source: .googleActivity, transactionType: .activity,
                    occurredAt: calendar.date(bySettingHour: hour, minute: Int.random(in: 0...59), second: 0, of: date)!,
                    rawRef: "google_browse_\(prefix)_\(daysAgo)_\(i)",
                    soulCategory: site.category,
                    soulTags: ["browsing", site.domain],
                    intentSignals: site.intentSignals,
                    confidence: 0.7
                ))
            }

            if daysAgo % 3 == 0 {
                let location = persona.googleProfile.frequentLocations.randomElement()!
                txns.append(SoulTransaktion(
                    source: .googleActivity, transactionType: .activity,
                    occurredAt: calendar.date(bySettingHour: 12, minute: 0, second: 0, of: date)!,
                    rawRef: "google_location_\(prefix)_\(daysAgo)",
                    soulCategory: location.category,
                    soulTags: ["location", location.name, location.type],
                    confidence: 0.9
                ))
            }
        }

        return txns.sorted { $0.occurredAt > $1.occurredAt }
    }

    // MARK: - Amazon

    private func generateAmazon(konnectionID: UUID) -> [SoulTransaktion] {
        let calendar = Calendar.current
        let now = Date()
        var txns: [SoulTransaktion] = []
        let prefix = konnectionID.uuidString.prefix(8)

        let orderCount = Int.random(in: persona.amazonProfile.orderCountRange)
        for i in 0..<orderCount {
            let daysAgo = Int.random(in: 0...89)
            let date = calendar.date(byAdding: .day, value: -daysAgo, to: now)!
            let order = persona.amazonProfile.orderTypes.randomElement()!
            let amount = Decimal(Double.random(in: order.priceRange))
            let hour = order.preferredHours.randomElement()!

            txns.append(SoulTransaktion(
                source: .amazon, transactionType: .purchase,
                occurredAt: calendar.date(bySettingHour: hour, minute: Int.random(in: 0...59), second: 0, of: date)!,
                rawRef: "amzn_order_\(prefix)_\(i)",
                amountUSD: amount, currency: "USD",
                merchantRaw: "AMAZON.COM", merchantCanonical: "Amazon",
                categoryRaw: order.amazonCategory,
                soulCategory: order.soulCategory,
                soulTags: order.tags,
                intentSignals: order.intentSignals,
                confidence: 1.0
            ))
        }

        let browseCount = Int.random(in: 30...60)
        for i in 0..<browseCount {
            let daysAgo = Int.random(in: 0...89)
            let date = calendar.date(byAdding: .day, value: -daysAgo, to: now)!
            let browse = persona.amazonProfile.browseCategories.randomElement()!
            let hour = Int.random(in: 19...23)

            txns.append(SoulTransaktion(
                source: .amazon, transactionType: .activity,
                occurredAt: calendar.date(bySettingHour: hour, minute: Int.random(in: 0...59), second: 0, of: date)!,
                rawRef: "amzn_browse_\(prefix)_\(i)",
                soulCategory: browse.soulCategory,
                soulTags: ["product_browse", browse.name],
                intentSignals: ["researched_before_buy"],
                confidence: 0.6
            ))
        }

        return txns.sorted { $0.occurredAt > $1.occurredAt }
    }

    // MARK: - Uber

    private func generateUber(konnectionID: UUID) -> [SoulTransaktion] {
        let calendar = Calendar.current
        let now = Date()
        var txns: [SoulTransaktion] = []
        let prefix = konnectionID.uuidString.prefix(8)

        let rideCount = Int.random(in: persona.uberProfile.ridesRange)
        for i in 0..<rideCount {
            let daysAgo = Int.random(in: 0...89)
            let date = calendar.date(byAdding: .day, value: -daysAgo, to: now)!
            let ride = persona.uberProfile.rideTypes.randomElement()!
            let amount = Decimal(Double.random(in: ride.priceRange))
            let hour = ride.preferredHours.randomElement()!

            txns.append(SoulTransaktion(
                source: .uber, transactionType: .purchase,
                occurredAt: calendar.date(bySettingHour: hour, minute: Int.random(in: 0...59), second: 0, of: date)!,
                rawRef: "uber_ride_\(prefix)_\(i)",
                amountUSD: amount, currency: "USD",
                merchantRaw: "UBER *TRIP \(ride.name)", merchantCanonical: "Uber",
                categoryRaw: "ride_\(ride.name.lowercased())",
                soulCategory: "transport.commute",
                soulTags: ["rideshare", ride.name.lowercased(), ride.timeOfDay],
                intentSignals: ride.intentSignals,
                confidence: 1.0
            ))
        }

        let eatsCount = Int.random(in: persona.uberProfile.eatsRange)
        for i in 0..<eatsCount {
            let daysAgo = Int.random(in: 0...89)
            let date = calendar.date(byAdding: .day, value: -daysAgo, to: now)!
            let restaurant = persona.uberProfile.eatsRestaurants.randomElement()!
            let amount = Decimal(Double.random(in: 15...55))

            txns.append(SoulTransaktion(
                source: .uber, transactionType: .purchase,
                occurredAt: calendar.date(bySettingHour: [12, 13, 19, 20, 21].randomElement()!, minute: Int.random(in: 0...59), second: 0, of: date)!,
                rawRef: "uber_eats_\(prefix)_\(i)",
                amountUSD: amount, currency: "USD",
                merchantRaw: "UBER EATS *\(restaurant.uppercased())", merchantCanonical: "Uber Eats",
                categoryRaw: "uber_eats",
                soulCategory: "dining.restaurant",
                soulTags: ["delivery", "uber_eats", restaurant.lowercased()],
                intentSignals: ["convenience_purchase"],
                confidence: 1.0
            ))
        }

        return txns.sorted { $0.occurredAt > $1.occurredAt }
    }

    // MARK: - Instagram

    private func generateInstagram(konnectionID: UUID) -> [SoulTransaktion] {
        let calendar = Calendar.current
        let now = Date()
        var txns: [SoulTransaktion] = []
        let prefix = konnectionID.uuidString.prefix(8)

        for daysAgo in 0..<90 {
            let date = calendar.date(byAdding: .day, value: -daysAgo, to: now)!

            let sessionCount = Int.random(in: persona.instagramProfile.dailySessionRange)
            for s in 0..<sessionCount {
                let hour = persona.instagramProfile.activeHours.randomElement()!
                let duration = Int.random(in: 5...45)
                let contentType = persona.instagramProfile.contentInterests.randomElement()!

                txns.append(SoulTransaktion(
                    source: .instagram, transactionType: .activity,
                    occurredAt: calendar.date(bySettingHour: hour, minute: Int.random(in: 0...59), second: 0, of: date)!,
                    rawRef: "ig_session_\(prefix)_\(daysAgo)_\(s)",
                    soulCategory: contentType.soulCategory,
                    soulTags: ["instagram", "session", contentType.name, "duration_\(duration)min"],
                    intentSignals: contentType.intentSignals,
                    confidence: 0.65
                ))
            }

            if Int.random(in: 0...6) < persona.instagramProfile.postsPerWeek {
                txns.append(SoulTransaktion(
                    source: .instagram, transactionType: .activity,
                    occurredAt: calendar.date(bySettingHour: [10, 14, 18, 20].randomElement()!, minute: Int.random(in: 0...59), second: 0, of: date)!,
                    rawRef: "ig_post_\(prefix)_\(daysAgo)",
                    soulCategory: "entertainment.streaming",
                    soulTags: ["instagram", "post", "content_creation"],
                    confidence: 0.8
                ))
            }

            if daysAgo % 5 == 0 {
                let adCategory = persona.instagramProfile.adInteractions.randomElement()!
                txns.append(SoulTransaktion(
                    source: .instagram, transactionType: .activity,
                    occurredAt: calendar.date(bySettingHour: Int.random(in: 19...23), minute: Int.random(in: 0...59), second: 0, of: date)!,
                    rawRef: "ig_ad_\(prefix)_\(daysAgo)",
                    soulCategory: adCategory.soulCategory,
                    soulTags: ["instagram", "ad_interaction", adCategory.name],
                    intentSignals: ["ad_click", "purchase_intent"],
                    confidence: 0.5
                ))
            }
        }

        return txns.sorted { $0.occurredAt > $1.occurredAt }
    }
}

// MARK: - Persona Profiles

extension MockPlaidService.Persona {

    // MARK: Health Profile

    struct HealthProfile {
        let stepsRange: ClosedRange<Int>
        let workoutDaysPerWeek: Int
        let workoutTypes: [WorkoutType]
        let sleepRange: ClosedRange<Double>
        let restingHRRange: ClosedRange<Int>
    }

    struct WorkoutType {
        let name: String
        let calorieRange: ClosedRange<Int>
        let durationRange: ClosedRange<Int>
        let preferredHours: [Int]
    }

    var healthProfile: HealthProfile {
        switch self {
        case .priya:
            return HealthProfile(
                stepsRange: 6000...12000, workoutDaysPerWeek: 4,
                workoutTypes: [
                    WorkoutType(name: "yoga", calorieRange: 150...300, durationRange: 45...75, preferredHours: [6, 7]),
                    WorkoutType(name: "spinning", calorieRange: 350...550, durationRange: 40...50, preferredHours: [7, 18]),
                    WorkoutType(name: "bootcamp", calorieRange: 400...600, durationRange: 45...60, preferredHours: [6, 18]),
                ],
                sleepRange: 5.5...7.5, restingHRRange: 58...68
            )
        case .marcus:
            return HealthProfile(
                stepsRange: 4000...8000, workoutDaysPerWeek: 3,
                workoutTypes: [
                    WorkoutType(name: "weight_training", calorieRange: 250...450, durationRange: 45...75, preferredHours: [6, 17]),
                    WorkoutType(name: "running", calorieRange: 300...500, durationRange: 25...45, preferredHours: [6, 7]),
                ],
                sleepRange: 6.0...7.5, restingHRRange: 62...72
            )
        case .sofia:
            return HealthProfile(
                stepsRange: 5000...10000, workoutDaysPerWeek: 3,
                workoutTypes: [
                    WorkoutType(name: "pilates", calorieRange: 200...350, durationRange: 50...60, preferredHours: [8, 9]),
                    WorkoutType(name: "swimming", calorieRange: 300...500, durationRange: 30...50, preferredHours: [7, 17]),
                    WorkoutType(name: "dance", calorieRange: 250...400, durationRange: 45...60, preferredHours: [19, 20]),
                ],
                sleepRange: 6.5...8.5, restingHRRange: 55...65
            )
        case .james:
            return HealthProfile(
                stepsRange: 3000...7000, workoutDaysPerWeek: 4,
                workoutTypes: [
                    WorkoutType(name: "golf", calorieRange: 200...400, durationRange: 120...240, preferredHours: [7, 8]),
                    WorkoutType(name: "weight_training", calorieRange: 250...400, durationRange: 45...60, preferredHours: [6]),
                    WorkoutType(name: "cycling", calorieRange: 300...500, durationRange: 30...60, preferredHours: [6, 17]),
                ],
                sleepRange: 5.5...7.0, restingHRRange: 65...78
            )
        }
    }

    // MARK: Google Profile

    struct GoogleProfile {
        let dailySearchRange: ClosedRange<Int>
        let searchTopics: [SearchTopic]
        let frequentSites: [FrequentSite]
        let frequentLocations: [FrequentLocation]
    }

    struct SearchTopic {
        let topic: String
        let category: String
        let intentSignals: [String]
    }

    struct FrequentSite {
        let domain: String
        let category: String
        let intentSignals: [String]
    }

    struct FrequentLocation {
        let name: String
        let type: String
        let category: String
    }

    var googleProfile: GoogleProfile {
        switch self {
        case .priya:
            return GoogleProfile(
                dailySearchRange: 5...15,
                searchTopics: [
                    SearchTopic(topic: "best restaurants nyc", category: "dining.restaurant", intentSignals: ["local_search"]),
                    SearchTopic(topic: "react hooks tutorial", category: "education.growth", intentSignals: ["skill_building"]),
                    SearchTopic(topic: "weekend getaway northeast", category: "travel.pattern", intentSignals: ["travel_planning"]),
                    SearchTopic(topic: "skincare routine oily skin", category: "shopping.research", intentSignals: ["researched_before_buy"]),
                    SearchTopic(topic: "yoga near me", category: "health.fitness", intentSignals: ["local_search"]),
                    SearchTopic(topic: "airpods pro vs sony", category: "shopping.research", intentSignals: ["comparison_shopping"]),
                    SearchTopic(topic: "student loan refinance rates", category: "finance.health", intentSignals: ["financial_research"]),
                ],
                frequentSites: [
                    FrequentSite(domain: "reddit.com", category: "entertainment.streaming", intentSignals: []),
                    FrequentSite(domain: "medium.com", category: "education.growth", intentSignals: ["reading"]),
                    FrequentSite(domain: "nytimes.com", category: "entertainment.streaming", intentSignals: []),
                    FrequentSite(domain: "sephora.com", category: "shopping.research", intentSignals: ["researched_before_buy"]),
                ],
                frequentLocations: [
                    FrequentLocation(name: "WeWork Flatiron", type: "office", category: "transport.commute"),
                    FrequentLocation(name: "Trader Joe's Union Square", type: "grocery", category: "dining.grocery"),
                    FrequentLocation(name: "Barry's Bootcamp", type: "gym", category: "health.fitness"),
                ]
            )
        case .marcus:
            return GoogleProfile(
                dailySearchRange: 3...10,
                searchTopics: [
                    SearchTopic(topic: "small business tax deductions", category: "finance.health", intentSignals: ["financial_research"]),
                    SearchTopic(topic: "best riding lawn mower 2026", category: "shopping.research", intentSignals: ["comparison_shopping"]),
                    SearchTopic(topic: "kids soccer league austin", category: "education.growth", intentSignals: ["family_activity"]),
                    SearchTopic(topic: "bbq brisket recipe", category: "dining.grocery", intentSignals: []),
                    SearchTopic(topic: "home security camera system", category: "shopping.research", intentSignals: ["researched_before_buy"]),
                ],
                frequentSites: [
                    FrequentSite(domain: "homedepot.com", category: "shopping.research", intentSignals: ["researched_before_buy"]),
                    FrequentSite(domain: "quickbooks.com", category: "finance.health", intentSignals: []),
                    FrequentSite(domain: "espn.com", category: "entertainment.streaming", intentSignals: []),
                ],
                frequentLocations: [
                    FrequentLocation(name: "Costco Wholesale", type: "retail", category: "shopping.research"),
                    FrequentLocation(name: "Austin FC Stadium", type: "sports", category: "entertainment.streaming"),
                    FrequentLocation(name: "H-E-B Mueller", type: "grocery", category: "dining.grocery"),
                ]
            )
        case .sofia:
            return GoogleProfile(
                dailySearchRange: 6...14,
                searchTopics: [
                    SearchTopic(topic: "UX design portfolio examples", category: "education.growth", intentSignals: ["skill_building"]),
                    SearchTopic(topic: "cheapest flights miami to nyc", category: "travel.pattern", intentSignals: ["travel_planning"]),
                    SearchTopic(topic: "freelance invoice template", category: "finance.health", intentSignals: []),
                    SearchTopic(topic: "best coworking space miami", category: "shopping.research", intentSignals: ["local_search"]),
                    SearchTopic(topic: "figma auto layout tutorial", category: "education.growth", intentSignals: ["skill_building"]),
                    SearchTopic(topic: "health insurance freelancer florida", category: "finance.health", intentSignals: ["financial_research"]),
                ],
                frequentSites: [
                    FrequentSite(domain: "dribbble.com", category: "education.growth", intentSignals: ["design_research"]),
                    FrequentSite(domain: "behance.net", category: "education.growth", intentSignals: ["design_research"]),
                    FrequentSite(domain: "airbnb.com", category: "travel.pattern", intentSignals: ["travel_planning"]),
                    FrequentSite(domain: "wise.com", category: "finance.health", intentSignals: []),
                ],
                frequentLocations: [
                    FrequentLocation(name: "WeWork Brickell", type: "coworking", category: "transport.commute"),
                    FrequentLocation(name: "Panther Coffee Wynwood", type: "cafe", category: "dining.restaurant"),
                    FrequentLocation(name: "MIA Airport", type: "airport", category: "travel.pattern"),
                ]
            )
        case .james:
            return GoogleProfile(
                dailySearchRange: 3...8,
                searchTopics: [
                    SearchTopic(topic: "vanguard target date fund 2035", category: "finance.health", intentSignals: ["financial_research"]),
                    SearchTopic(topic: "best golf courses illinois", category: "entertainment.streaming", intentSignals: ["local_search"]),
                    SearchTopic(topic: "cholesterol lowering foods", category: "health.fitness", intentSignals: ["health_concern"]),
                    SearchTopic(topic: "chicago symphony schedule", category: "entertainment.streaming", intentSignals: ["event_planning"]),
                    SearchTopic(topic: "estate planning attorney chicago", category: "finance.health", intentSignals: ["financial_research"]),
                ],
                frequentSites: [
                    FrequentSite(domain: "wsj.com", category: "finance.health", intentSignals: []),
                    FrequentSite(domain: "fidelity.com", category: "finance.health", intentSignals: ["financial_research"]),
                    FrequentSite(domain: "golf.com", category: "entertainment.streaming", intentSignals: []),
                ],
                frequentLocations: [
                    FrequentLocation(name: "MegaCorp Tower", type: "office", category: "transport.commute"),
                    FrequentLocation(name: "East Bank Club", type: "gym", category: "health.fitness"),
                    FrequentLocation(name: "Northwestern Memorial Hospital", type: "medical", category: "health.fitness"),
                ]
            )
        }
    }

    // MARK: Amazon Profile

    struct AmazonProfile {
        let orderCountRange: ClosedRange<Int>
        let orderTypes: [AmazonOrderType]
        let browseCategories: [AmazonBrowseCategory]
    }

    struct AmazonOrderType {
        let amazonCategory: String
        let soulCategory: String
        let priceRange: ClosedRange<Double>
        let tags: [String]
        let intentSignals: [String]
        let preferredHours: [Int]
    }

    struct AmazonBrowseCategory {
        let name: String
        let soulCategory: String
    }

    var amazonProfile: AmazonProfile {
        switch self {
        case .priya:
            return AmazonProfile(
                orderCountRange: 15...25,
                orderTypes: [
                    AmazonOrderType(amazonCategory: "Beauty", soulCategory: "shopping.research", priceRange: 12...65, tags: ["beauty", "skincare"], intentSignals: ["researched_before_buy"], preferredHours: [21, 22, 23]),
                    AmazonOrderType(amazonCategory: "Books", soulCategory: "education.growth", priceRange: 10...25, tags: ["books", "learning"], intentSignals: [], preferredHours: [20, 21]),
                    AmazonOrderType(amazonCategory: "Electronics", soulCategory: "shopping.research", priceRange: 20...200, tags: ["electronics", "tech"], intentSignals: ["comparison_shopping"], preferredHours: [21, 22]),
                    AmazonOrderType(amazonCategory: "Home & Kitchen", soulCategory: "shopping.impulse", priceRange: 15...80, tags: ["home", "apartment"], intentSignals: [], preferredHours: [20, 21, 22]),
                    AmazonOrderType(amazonCategory: "Grocery", soulCategory: "dining.grocery", priceRange: 20...60, tags: ["pantry", "snacks"], intentSignals: [], preferredHours: [19, 20]),
                ],
                browseCategories: [
                    AmazonBrowseCategory(name: "Wireless Earbuds", soulCategory: "shopping.research"),
                    AmazonBrowseCategory(name: "Vitamin C Serum", soulCategory: "shopping.research"),
                    AmazonBrowseCategory(name: "Standing Desk", soulCategory: "shopping.research"),
                ]
            )
        case .marcus:
            return AmazonProfile(
                orderCountRange: 12...20,
                orderTypes: [
                    AmazonOrderType(amazonCategory: "Tools & Home Improvement", soulCategory: "shopping.research", priceRange: 25...250, tags: ["tools", "home_improvement"], intentSignals: ["researched_before_buy"], preferredHours: [20, 21]),
                    AmazonOrderType(amazonCategory: "Office Products", soulCategory: "shopping.research", priceRange: 15...100, tags: ["office", "business"], intentSignals: [], preferredHours: [10, 11]),
                    AmazonOrderType(amazonCategory: "Sports & Outdoors", soulCategory: "health.fitness", priceRange: 20...150, tags: ["sports", "outdoor", "kids"], intentSignals: [], preferredHours: [20, 21]),
                    AmazonOrderType(amazonCategory: "Toys & Games", soulCategory: "shopping.impulse", priceRange: 15...80, tags: ["kids", "toys"], intentSignals: [], preferredHours: [21, 22]),
                    AmazonOrderType(amazonCategory: "Automotive", soulCategory: "shopping.research", priceRange: 15...120, tags: ["car", "maintenance"], intentSignals: ["researched_before_buy"], preferredHours: [20, 21]),
                ],
                browseCategories: [
                    AmazonBrowseCategory(name: "Power Tools", soulCategory: "shopping.research"),
                    AmazonBrowseCategory(name: "Grill Accessories", soulCategory: "shopping.research"),
                    AmazonBrowseCategory(name: "Kids STEM Toys", soulCategory: "education.growth"),
                ]
            )
        case .sofia:
            return AmazonProfile(
                orderCountRange: 10...18,
                orderTypes: [
                    AmazonOrderType(amazonCategory: "Arts, Crafts & Sewing", soulCategory: "education.growth", priceRange: 10...60, tags: ["art_supplies", "creative"], intentSignals: [], preferredHours: [14, 15, 21]),
                    AmazonOrderType(amazonCategory: "Electronics", soulCategory: "shopping.research", priceRange: 20...300, tags: ["tech", "design_tools"], intentSignals: ["comparison_shopping"], preferredHours: [21, 22]),
                    AmazonOrderType(amazonCategory: "Books", soulCategory: "education.growth", priceRange: 10...30, tags: ["design_books", "business"], intentSignals: [], preferredHours: [20, 21]),
                    AmazonOrderType(amazonCategory: "Clothing", soulCategory: "shopping.impulse", priceRange: 20...80, tags: ["fashion", "casual"], intentSignals: ["impulse_pattern"], preferredHours: [22, 23]),
                ],
                browseCategories: [
                    AmazonBrowseCategory(name: "Drawing Tablets", soulCategory: "shopping.research"),
                    AmazonBrowseCategory(name: "Travel Backpack", soulCategory: "travel.pattern"),
                    AmazonBrowseCategory(name: "Portable Monitor", soulCategory: "shopping.research"),
                ]
            )
        case .james:
            return AmazonProfile(
                orderCountRange: 8...15,
                orderTypes: [
                    AmazonOrderType(amazonCategory: "Health & Household", soulCategory: "health.fitness", priceRange: 15...80, tags: ["supplements", "health"], intentSignals: [], preferredHours: [20, 21]),
                    AmazonOrderType(amazonCategory: "Books", soulCategory: "education.growth", priceRange: 15...35, tags: ["business_books", "biography"], intentSignals: [], preferredHours: [21, 22]),
                    AmazonOrderType(amazonCategory: "Sports & Outdoors", soulCategory: "health.fitness", priceRange: 30...200, tags: ["golf", "fitness"], intentSignals: ["researched_before_buy"], preferredHours: [20, 21]),
                    AmazonOrderType(amazonCategory: "Clothing", soulCategory: "shopping.research", priceRange: 40...200, tags: ["professional", "golf_wear"], intentSignals: [], preferredHours: [19, 20]),
                    AmazonOrderType(amazonCategory: "Wine", soulCategory: "dining.grocery", priceRange: 25...80, tags: ["wine", "entertaining"], intentSignals: [], preferredHours: [18, 19]),
                ],
                browseCategories: [
                    AmazonBrowseCategory(name: "Golf Clubs", soulCategory: "shopping.research"),
                    AmazonBrowseCategory(name: "Blood Pressure Monitor", soulCategory: "health.fitness"),
                    AmazonBrowseCategory(name: "Wine Decanter", soulCategory: "shopping.research"),
                ]
            )
        }
    }

    // MARK: Uber Profile

    struct UberProfile {
        let ridesRange: ClosedRange<Int>
        let eatsRange: ClosedRange<Int>
        let rideTypes: [UberRideType]
        let eatsRestaurants: [String]
    }

    struct UberRideType {
        let name: String
        let priceRange: ClosedRange<Double>
        let preferredHours: [Int]
        let timeOfDay: String
        let intentSignals: [String]
    }

    var uberProfile: UberProfile {
        switch self {
        case .priya:
            return UberProfile(
                ridesRange: 20...35, eatsRange: 8...15,
                rideTypes: [
                    UberRideType(name: "UberX", priceRange: 12...30, preferredHours: [8, 9, 22, 23], timeOfDay: "commute", intentSignals: []),
                    UberRideType(name: "UberXL", priceRange: 20...45, preferredHours: [20, 21, 22], timeOfDay: "evening", intentSignals: ["group_ride"]),
                    UberRideType(name: "Comfort", priceRange: 18...40, preferredHours: [8, 17, 18], timeOfDay: "commute", intentSignals: ["premium_preference"]),
                ],
                eatsRestaurants: ["Sweetgreen", "Thai Villa", "Shake Shack", "Chipotle", "Poke Bowl"]
            )
        case .marcus:
            return UberProfile(
                ridesRange: 5...10, eatsRange: 3...6,
                rideTypes: [
                    UberRideType(name: "UberX", priceRange: 10...25, preferredHours: [20, 21, 22], timeOfDay: "evening", intentSignals: []),
                ],
                eatsRestaurants: ["Torchy's Tacos", "P.Terry's", "Chick-fil-A"]
            )
        case .sofia:
            return UberProfile(
                ridesRange: 15...25, eatsRange: 10...18,
                rideTypes: [
                    UberRideType(name: "UberX", priceRange: 8...25, preferredHours: [9, 10, 22, 23], timeOfDay: "mixed", intentSignals: []),
                    UberRideType(name: "UberPool", priceRange: 6...18, preferredHours: [9, 10, 17], timeOfDay: "commute", intentSignals: ["budget_conscious"]),
                ],
                eatsRestaurants: ["Versailles", "Ceviche 105", "MiMo District Cafe", "Sushi Garage", "Pollo Tropical"]
            )
        case .james:
            return UberProfile(
                ridesRange: 8...15, eatsRange: 2...5,
                rideTypes: [
                    UberRideType(name: "UberBlack", priceRange: 35...80, preferredHours: [8, 9, 18, 19], timeOfDay: "business", intentSignals: ["premium_preference"]),
                    UberRideType(name: "Comfort", priceRange: 20...45, preferredHours: [19, 20, 21], timeOfDay: "evening", intentSignals: []),
                ],
                eatsRestaurants: ["Gibson's", "RPM Italian", "Portillo's"]
            )
        }
    }

    // MARK: Instagram Profile

    struct InstagramProfile {
        let dailySessionRange: ClosedRange<Int>
        let postsPerWeek: Int
        let activeHours: [Int]
        let contentInterests: [IGContentType]
        let adInteractions: [IGAdCategory]
    }

    struct IGContentType {
        let name: String
        let soulCategory: String
        let intentSignals: [String]
    }

    struct IGAdCategory {
        let name: String
        let soulCategory: String
    }

    var instagramProfile: InstagramProfile {
        switch self {
        case .priya:
            return InstagramProfile(
                dailySessionRange: 3...6, postsPerWeek: 3, activeHours: [8, 12, 13, 19, 20, 21, 22],
                contentInterests: [
                    IGContentType(name: "food_content", soulCategory: "dining.restaurant", intentSignals: ["food_discovery"]),
                    IGContentType(name: "fashion", soulCategory: "shopping.impulse", intentSignals: ["impulse_pattern"]),
                    IGContentType(name: "fitness_wellness", soulCategory: "health.fitness", intentSignals: []),
                    IGContentType(name: "travel", soulCategory: "travel.pattern", intentSignals: ["travel_aspiration"]),
                    IGContentType(name: "tech_productivity", soulCategory: "education.growth", intentSignals: []),
                ],
                adInteractions: [
                    IGAdCategory(name: "skincare_ad", soulCategory: "shopping.impulse"),
                    IGAdCategory(name: "fashion_brand", soulCategory: "shopping.impulse"),
                    IGAdCategory(name: "fitness_app", soulCategory: "health.fitness"),
                ]
            )
        case .marcus:
            return InstagramProfile(
                dailySessionRange: 1...3, postsPerWeek: 1, activeHours: [7, 12, 20, 21],
                contentInterests: [
                    IGContentType(name: "home_improvement", soulCategory: "shopping.research", intentSignals: ["researched_before_buy"]),
                    IGContentType(name: "sports", soulCategory: "entertainment.streaming", intentSignals: []),
                    IGContentType(name: "food_grilling", soulCategory: "dining.grocery", intentSignals: []),
                    IGContentType(name: "family_kids", soulCategory: "education.growth", intentSignals: []),
                ],
                adInteractions: [
                    IGAdCategory(name: "tool_brand", soulCategory: "shopping.research"),
                    IGAdCategory(name: "outdoor_gear", soulCategory: "shopping.research"),
                ]
            )
        case .sofia:
            return InstagramProfile(
                dailySessionRange: 4...8, postsPerWeek: 5, activeHours: [9, 10, 13, 14, 19, 20, 21, 22, 23],
                contentInterests: [
                    IGContentType(name: "design_inspiration", soulCategory: "education.growth", intentSignals: ["skill_building"]),
                    IGContentType(name: "travel_wanderlust", soulCategory: "travel.pattern", intentSignals: ["travel_aspiration"]),
                    IGContentType(name: "food_culture", soulCategory: "dining.restaurant", intentSignals: ["food_discovery"]),
                    IGContentType(name: "art_illustration", soulCategory: "education.growth", intentSignals: []),
                    IGContentType(name: "fashion_style", soulCategory: "shopping.impulse", intentSignals: ["impulse_pattern"]),
                ],
                adInteractions: [
                    IGAdCategory(name: "design_tool", soulCategory: "education.growth"),
                    IGAdCategory(name: "airline_deal", soulCategory: "travel.pattern"),
                    IGAdCategory(name: "fashion_brand", soulCategory: "shopping.impulse"),
                ]
            )
        case .james:
            return InstagramProfile(
                dailySessionRange: 1...2, postsPerWeek: 0, activeHours: [7, 20, 21],
                contentInterests: [
                    IGContentType(name: "golf", soulCategory: "entertainment.streaming", intentSignals: []),
                    IGContentType(name: "finance_investing", soulCategory: "finance.health", intentSignals: ["financial_research"]),
                    IGContentType(name: "travel_luxury", soulCategory: "travel.pattern", intentSignals: ["premium_preference"]),
                    IGContentType(name: "food_wine", soulCategory: "dining.restaurant", intentSignals: []),
                ],
                adInteractions: [
                    IGAdCategory(name: "luxury_watch", soulCategory: "shopping.research"),
                    IGAdCategory(name: "financial_service", soulCategory: "finance.health"),
                ]
            )
        }
    }
}
