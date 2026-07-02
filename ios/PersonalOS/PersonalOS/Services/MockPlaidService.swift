import Foundation

class MockPlaidService: PlaidProviding {
    let persona: Persona

    init(persona: Persona? = nil) {
        self.persona = persona ?? Persona.allCases.randomElement()!
    }

    func startLink() async throws -> PlaidLinkResult {
        try await Task.sleep(nanoseconds: 1_000_000_000)
        return PlaidLinkResult(
            institutionName: persona.bankName,
            institutionID: "ins_\(persona.rawValue)",
            accountMask: persona.accountMask
        )
    }

    func fetchTransactions(for konnectionID: UUID) async throws -> [SoulTransaktion] {
        let calendar = Calendar.current
        let now = Date()
        var transactions: [SoulTransaktion] = []

        for template in persona.transactionTemplates {
            let count = Int.random(in: template.countRange)
            for i in 0..<count {
                let daysAgo = Int.random(in: 0...89)
                let date = calendar.date(byAdding: .day, value: -daysAgo, to: now)!
                let hour = template.preferredHours.randomElement() ?? 12
                let txnDate = calendar.date(bySettingHour: hour, minute: Int.random(in: 0...59), second: 0, of: date)!
                let amount = Decimal(Double.random(in: template.amountRange))
                let merchant = template.merchants.randomElement()!

                let txn = SoulTransaktion(
                    source: .plaid,
                    transactionType: template.transactionType,
                    occurredAt: txnDate,
                    rawRef: "plaid_\(konnectionID.uuidString.prefix(8))_\(i)_\(template.category)",
                    amountUSD: amount,
                    currency: "USD",
                    merchantRaw: merchant.raw,
                    merchantCanonical: merchant.canonical,
                    categoryRaw: template.plaidCategory,
                    soulCategory: template.category,
                    soulTags: template.tags,
                    intentSignals: template.intentSignals,
                    useLimitationTags: ["cfpb_1033"]
                )
                transactions.append(txn)
            }
        }

        return transactions.sorted { $0.occurredAt > $1.occurredAt }
    }

    // MARK: - Personas

    enum Persona: String, CaseIterable {
        case priya
        case marcus
        case sofia
        case james

        var bankName: String {
            switch self {
            case .priya: return "Chase"
            case .marcus: return "Bank of America"
            case .sofia: return "Ally Bank"
            case .james: return "Wells Fargo"
            }
        }

        var accountMask: String {
            switch self {
            case .priya: return "4521"
            case .marcus: return "7832"
            case .sofia: return "3190"
            case .james: return "6644"
            }
        }

        var transactionTemplates: [TransactionTemplate] {
            switch self {
            case .priya: return Self.priyaTemplates
            case .marcus: return Self.marcusTemplates
            case .sofia: return Self.sofiaTemplates
            case .james: return Self.jamesTemplates
            }
        }

        // MARK: Priya — NYC, 28, Tech PM, $95K

        static let priyaTemplates: [TransactionTemplate] = [
            TransactionTemplate(category: "dining.restaurant", plaidCategory: "FOOD_AND_DRINK > RESTAURANTS", transactionType: .purchase, countRange: 20...28,
                merchants: [("SWEETGREEN NYC", "Sweetgreen"), ("JOES PIZZA 7TH AVE", "Joe's Pizza"), ("SHAKE SHACK #412", "Shake Shack"), ("THAI VILLA EAST VLG", "Thai Villa"), ("LE PAIN QUOTIDIEN", "Le Pain Quotidien")],
                amountRange: 12...55, preferredHours: [12, 13, 19, 20], tags: ["dining_out", "urban"], intentSignals: []),
            TransactionTemplate(category: "dining.delivery", plaidCategory: "FOOD_AND_DRINK > DELIVERY", transactionType: .purchase, countRange: 12...18,
                merchants: [("DOORDASH*SWEETGREEN", "DoorDash"), ("UBER EATS 8YH2K", "Uber Eats"), ("GRUBHUB ORDER", "Grubhub")],
                amountRange: 18...45, preferredHours: [19, 20, 21, 22], tags: ["delivery", "convenience"], intentSignals: ["late_night_purchase"]),
            TransactionTemplate(category: "dining.grocery", plaidCategory: "FOOD_AND_DRINK > GROCERIES", transactionType: .purchase, countRange: 8...12,
                merchants: [("TRADER JOES #567", "Trader Joe's"), ("WHOLE FOODS MKT", "Whole Foods"), ("WESTSIDE MKT NYC", "Westside Market")],
                amountRange: 25...120, preferredHours: [17, 18, 19], tags: ["grocery", "health_conscious_spend"], intentSignals: []),
            TransactionTemplate(category: "dining.coffee", plaidCategory: "FOOD_AND_DRINK > COFFEE", transactionType: .purchase, countRange: 20...30,
                merchants: [("STARBUCKS #13924", "Starbucks"), ("BLUE BOTTLE COFFE", "Blue Bottle Coffee"), ("GREGORYS COFFEE", "Gregory's Coffee")],
                amountRange: 4.5...7.5, preferredHours: [7, 8, 9, 14], tags: ["coffee", "daily_habit"], intentSignals: []),
            TransactionTemplate(category: "transport.rideshare", plaidCategory: "TRANSPORTATION > RIDE_SHARE", transactionType: .purchase, countRange: 15...22,
                merchants: [("UBER *TRIP", "Uber"), ("LYFT *RIDE", "Lyft")],
                amountRange: 12...45, preferredHours: [8, 9, 22, 23], tags: ["rideshare", "commute"], intentSignals: []),
            TransactionTemplate(category: "transport.transit", plaidCategory: "TRANSPORTATION > PUBLIC_TRANSIT", transactionType: .purchase, countRange: 4...4,
                merchants: [("MTA*NYCT PAYGO", "MTA New York")],
                amountRange: 33...33, preferredHours: [7], tags: ["transit", "commute", "recurring"], intentSignals: []),
            TransactionTemplate(category: "shopping.online", plaidCategory: "SHOPS > ONLINE_MARKETPLACE", transactionType: .purchase, countRange: 10...15,
                merchants: [("AMAZON.COM*MZ1234", "Amazon"), ("AMZN MKTP US", "Amazon"), ("TARGET.COM", "Target")],
                amountRange: 15...180, preferredHours: [21, 22, 23], tags: ["online_shopping"], intentSignals: ["late_night_purchase", "impulse_pattern"]),
            TransactionTemplate(category: "shopping.clothing", plaidCategory: "SHOPS > CLOTHING", transactionType: .purchase, countRange: 3...6,
                merchants: [("ZARA #0234 NYC", "Zara"), ("UNIQLO 5TH AVE", "Uniqlo"), ("& OTHER STORIES", "& Other Stories")],
                amountRange: 35...150, preferredHours: [13, 14, 17, 18], tags: ["fashion", "in_store"], intentSignals: []),
            TransactionTemplate(category: "entertainment.streaming", plaidCategory: "RECREATION > SUBSCRIPTION", transactionType: .purchase, countRange: 5...5,
                merchants: [("NETFLIX.COM", "Netflix"), ("SPOTIFY USA", "Spotify"), ("HULU *SUBSCRIPTION", "Hulu"), ("YOUTUBE PREMIUM", "YouTube Premium"), ("CHATGPT SUBSCRIPT", "OpenAI ChatGPT")],
                amountRange: 9.99...19.99, preferredHours: [0], tags: ["subscription", "recurring", "streaming"], intentSignals: []),
            TransactionTemplate(category: "health.fitness", plaidCategory: "RECREATION > FITNESS", transactionType: .purchase, countRange: 4...6,
                merchants: [("CLASSPASS *MEMBER", "ClassPass"), ("BARRY'S BOOTCAMP", "Barry's Bootcamp"), ("SOULCYCLE NYC", "SoulCycle")],
                amountRange: 30...45, preferredHours: [6, 7, 18], tags: ["fitness", "wellness"], intentSignals: []),
            TransactionTemplate(category: "bills.utilities", plaidCategory: "UTILITIES > ELECTRIC", transactionType: .payment, countRange: 3...3,
                merchants: [("CON EDISON", "Con Edison"), ("SPECTRUM CABLE", "Spectrum"), ("VERIZON WIRELESS", "Verizon")],
                amountRange: 65...180, preferredHours: [0], tags: ["utility", "recurring", "bill_payment"], intentSignals: []),
            TransactionTemplate(category: "housing.rent", plaidCategory: "RENT > RENT_PAYMENT", transactionType: .payment, countRange: 3...3,
                merchants: [("AVALON EAST VILL", "Avalon Communities")],
                amountRange: 2800...2800, preferredHours: [0], tags: ["rent", "recurring", "housing"], intentSignals: []),
            TransactionTemplate(category: "finance.loan", plaidCategory: "LOAN_PAYMENTS > STUDENT_LOAN", transactionType: .payment, countRange: 3...3,
                merchants: [("DEPT OF EDUCATION", "Federal Student Loan")],
                amountRange: 450...450, preferredHours: [0], tags: ["student_loan", "recurring", "debt_payment"], intentSignals: []),
            TransactionTemplate(category: "health.personal_care", plaidCategory: "PERSONAL_CARE > HAIR", transactionType: .purchase, countRange: 2...3,
                merchants: [("DRYBAR NYC", "Drybar"), ("GLOSSIER INC", "Glossier")],
                amountRange: 25...75, preferredHours: [10, 11, 14], tags: ["personal_care", "beauty"], intentSignals: []),
            TransactionTemplate(category: "finance.income", plaidCategory: "INCOME > PAYROLL", transactionType: .income, countRange: 6...6,
                merchants: [("TECHCORP PAYROLL", "TechCorp Inc.")],
                amountRange: 3650...3650, preferredHours: [0], tags: ["payroll", "recurring", "biweekly"], intentSignals: []),
        ]

        // MARK: Marcus — Austin, 42, Business owner, $130K

        static let marcusTemplates: [TransactionTemplate] = [
            TransactionTemplate(category: "dining.grocery", plaidCategory: "FOOD_AND_DRINK > GROCERIES", transactionType: .purchase, countRange: 12...16,
                merchants: [("HEB GROCERY #234", "H-E-B"), ("COSTCO WHSE #1242", "Costco"), ("WHOLE FOODS AUS", "Whole Foods")],
                amountRange: 45...280, preferredHours: [10, 16, 17], tags: ["grocery", "family", "bulk_shopping"], intentSignals: []),
            TransactionTemplate(category: "dining.restaurant", plaidCategory: "FOOD_AND_DRINK > RESTAURANTS", transactionType: .purchase, countRange: 8...12,
                merchants: [("TORCHYS TACOS", "Torchy's Tacos"), ("FRANKLINS BBQ", "Franklin Barbecue"), ("UCHI AUSTIN", "Uchi")],
                amountRange: 25...120, preferredHours: [12, 18, 19], tags: ["dining_out", "family"], intentSignals: []),
            TransactionTemplate(category: "housing.mortgage", plaidCategory: "RENT > MORTGAGE", transactionType: .payment, countRange: 3...3,
                merchants: [("WELLS FARGO MORTG", "Wells Fargo Mortgage")],
                amountRange: 2200...2200, preferredHours: [0], tags: ["mortgage", "recurring", "housing"], intentSignals: []),
            TransactionTemplate(category: "transport.fuel", plaidCategory: "TRANSPORTATION > GAS", transactionType: .purchase, countRange: 8...12,
                merchants: [("BUCCEES #42", "Buc-ee's"), ("SHELL OIL", "Shell"), ("EXXON MOBIL", "ExxonMobil")],
                amountRange: 55...95, preferredHours: [7, 8, 17], tags: ["fuel", "vehicle"], intentSignals: []),
            TransactionTemplate(category: "education.kids", plaidCategory: "RECREATION > ACTIVITIES", transactionType: .purchase, countRange: 8...12,
                merchants: [("KUMON MATH #89", "Kumon"), ("AUSTIN FC YOUTH", "Austin FC Youth Soccer"), ("KIDVILLE AUSTIN", "Kidville")],
                amountRange: 50...200, preferredHours: [9, 15, 16], tags: ["kids_activities", "education", "family"], intentSignals: []),
            TransactionTemplate(category: "shopping.home", plaidCategory: "SHOPS > HOME_IMPROVEMENT", transactionType: .purchase, countRange: 4...7,
                merchants: [("HOME DEPOT #4521", "Home Depot"), ("LOWES #1832", "Lowe's"), ("POTTERY BARN", "Pottery Barn")],
                amountRange: 30...350, preferredHours: [9, 10, 14], tags: ["home_improvement", "homeowner"], intentSignals: ["researched_before_buy"]),
            TransactionTemplate(category: "finance.insurance", plaidCategory: "INSURANCE > AUTO", transactionType: .payment, countRange: 3...3,
                merchants: [("STATE FARM INS", "State Farm"), ("ALLSTATE AUTO", "Allstate")],
                amountRange: 180...280, preferredHours: [0], tags: ["insurance", "recurring", "auto"], intentSignals: []),
            TransactionTemplate(category: "finance.insurance", plaidCategory: "INSURANCE > HOME", transactionType: .payment, countRange: 3...3,
                merchants: [("LIBERTY MUTUAL", "Liberty Mutual")],
                amountRange: 150...150, preferredHours: [0], tags: ["insurance", "recurring", "home"], intentSignals: []),
            TransactionTemplate(category: "shopping.business", plaidCategory: "SHOPS > OFFICE_SUPPLIES", transactionType: .purchase, countRange: 5...8,
                merchants: [("STAPLES #2831", "Staples"), ("AMZN MKTP US*BIZ", "Amazon Business"), ("FEDEX OFFICE", "FedEx Office")],
                amountRange: 20...200, preferredHours: [10, 11, 14], tags: ["business_expense", "office"], intentSignals: []),
            TransactionTemplate(category: "entertainment.streaming", plaidCategory: "RECREATION > SUBSCRIPTION", transactionType: .purchase, countRange: 4...4,
                merchants: [("DISNEY PLUS", "Disney+"), ("NETFLIX.COM", "Netflix"), ("APPLE.COM/BILL", "Apple One"), ("SIRIUS XM", "SiriusXM")],
                amountRange: 9.99...16.99, preferredHours: [0], tags: ["subscription", "recurring", "family"], intentSignals: []),
            TransactionTemplate(category: "bills.utilities", plaidCategory: "UTILITIES > ELECTRIC", transactionType: .payment, countRange: 3...3,
                merchants: [("AUSTIN ENERGY", "Austin Energy"), ("ATT INTERNET", "AT&T"), ("AUSTIN WATER", "Austin Water")],
                amountRange: 80...250, preferredHours: [0], tags: ["utility", "recurring"], intentSignals: []),
            TransactionTemplate(category: "health.medical", plaidCategory: "HEALTHCARE > MEDICAL", transactionType: .purchase, countRange: 3...5,
                merchants: [("CVS PHARMACY", "CVS"), ("WALGREENS #4521", "Walgreens"), ("ARC SOUTH AUSTIN", "Austin Regional Clinic")],
                amountRange: 15...75, preferredHours: [9, 10, 16], tags: ["healthcare", "pharmacy", "family"], intentSignals: []),
            TransactionTemplate(category: "finance.property_tax", plaidCategory: "TAX > PROPERTY", transactionType: .payment, countRange: 1...1,
                merchants: [("TRAVIS COUNTY TAX", "Travis County Tax Office")],
                amountRange: 3200...3200, preferredHours: [0], tags: ["property_tax", "homeowner"], intentSignals: []),
            TransactionTemplate(category: "finance.income", plaidCategory: "INCOME > BUSINESS", transactionType: .income, countRange: 6...8,
                merchants: [("CLIENT PAYMENT", "Business Revenue"), ("STRIPE TRANSFER", "Stripe")],
                amountRange: 4500...8500, preferredHours: [0], tags: ["business_income", "variable"], intentSignals: []),
        ]

        // MARK: Sofia — Miami, 35, Freelance designer, $70K variable

        static let sofiaTemplates: [TransactionTemplate] = [
            TransactionTemplate(category: "dining.restaurant", plaidCategory: "FOOD_AND_DRINK > RESTAURANTS", transactionType: .purchase, countRange: 15...20,
                merchants: [("VERSAILLES REST", "Versailles Restaurant"), ("CEVICHE 105", "Ceviche 105"), ("SUSHI GARAGE", "Sushi Garage")],
                amountRange: 15...65, preferredHours: [12, 13, 20, 21], tags: ["dining_out", "social"], intentSignals: []),
            TransactionTemplate(category: "dining.grocery", plaidCategory: "FOOD_AND_DRINK > GROCERIES", transactionType: .purchase, countRange: 6...10,
                merchants: [("PUBLIX #1892", "Publix"), ("SEDANOS SUPERMKT", "Sedano's")],
                amountRange: 30...90, preferredHours: [11, 17], tags: ["grocery"], intentSignals: []),
            TransactionTemplate(category: "shopping.tools", plaidCategory: "RECREATION > SUBSCRIPTION", transactionType: .purchase, countRange: 3...3,
                merchants: [("ADOBE *CREATIVE", "Adobe Creative Cloud"), ("FIGMA INC", "Figma"), ("CANVA PTY LTD", "Canva")],
                amountRange: 12.99...54.99, preferredHours: [0], tags: ["subscription", "creative_tools", "business_expense"], intentSignals: []),
            TransactionTemplate(category: "workspace.coworking", plaidCategory: "RENT > COWORKING", transactionType: .payment, countRange: 3...3,
                merchants: [("WEWORK BRICKELL", "WeWork")],
                amountRange: 350...350, preferredHours: [0], tags: ["coworking", "recurring", "business_expense"], intentSignals: []),
            TransactionTemplate(category: "dining.coffee", plaidCategory: "FOOD_AND_DRINK > COFFEE", transactionType: .purchase, countRange: 18...25,
                merchants: [("PANTHER COFFEE", "Panther Coffee"), ("ALL DAY MIAMI", "All Day"), ("STARBUCKS #19842", "Starbucks")],
                amountRange: 4...7, preferredHours: [8, 9, 14, 15], tags: ["coffee", "daily_habit", "workspace"], intentSignals: []),
            TransactionTemplate(category: "travel.flights", plaidCategory: "TRAVEL > AIRLINES", transactionType: .purchase, countRange: 2...3,
                merchants: [("AMERICAN AIR", "American Airlines"), ("JETBLUE 2791832", "JetBlue")],
                amountRange: 180...450, preferredHours: [21, 22], tags: ["travel", "flights"], intentSignals: ["researched_before_buy"]),
            TransactionTemplate(category: "travel.lodging", plaidCategory: "TRAVEL > LODGING", transactionType: .purchase, countRange: 2...3,
                merchants: [("AIRBNB *HM2K4", "Airbnb"), ("BOOKING.COM", "Booking.com")],
                amountRange: 120...350, preferredHours: [20, 21], tags: ["travel", "lodging"], intentSignals: ["researched_before_buy"]),
            TransactionTemplate(category: "health.medical", plaidCategory: "HEALTHCARE > MEDICAL", transactionType: .purchase, countRange: 4...6,
                merchants: [("JACKSON HEALTH SY", "Jackson Health"), ("CVS PHARMACY", "CVS"), ("OSCAR HEALTH INS", "Oscar Health")],
                amountRange: 25...250, preferredHours: [9, 10, 15], tags: ["healthcare", "out_of_pocket", "no_employer_plan"], intentSignals: []),
            TransactionTemplate(category: "finance.remittance", plaidCategory: "TRANSFER > WIRE", transactionType: .transfer, countRange: 3...3,
                merchants: [("REMITLY TRANSFER", "Remitly")],
                amountRange: 200...400, preferredHours: [0], tags: ["remittance", "family_support", "recurring"], intentSignals: []),
            TransactionTemplate(category: "education.growth", plaidCategory: "RECREATION > EDUCATION", transactionType: .purchase, countRange: 3...5,
                merchants: [("SKILLSHARE INC", "Skillshare"), ("DOMESTIKA.ORG", "Domestika"), ("AMAZON KINDLE", "Amazon Kindle")],
                amountRange: 9.99...120, preferredHours: [20, 21, 22], tags: ["education", "creative_learning", "self_improvement"], intentSignals: []),
            TransactionTemplate(category: "transport.rideshare", plaidCategory: "TRANSPORTATION > RIDE_SHARE", transactionType: .purchase, countRange: 10...14,
                merchants: [("UBER *TRIP", "Uber"), ("LYFT *RIDE", "Lyft")],
                amountRange: 8...35, preferredHours: [9, 10, 22, 23], tags: ["rideshare"], intentSignals: []),
            TransactionTemplate(category: "entertainment.streaming", plaidCategory: "RECREATION > SUBSCRIPTION", transactionType: .purchase, countRange: 3...3,
                merchants: [("SPOTIFY USA", "Spotify"), ("HBO MAX", "HBO Max"), ("NETFLIX.COM", "Netflix")],
                amountRange: 9.99...15.99, preferredHours: [0], tags: ["subscription", "streaming"], intentSignals: []),
            TransactionTemplate(category: "bills.utilities", plaidCategory: "UTILITIES > ELECTRIC", transactionType: .payment, countRange: 3...3,
                merchants: [("FPL ELECTRIC", "Florida Power & Light"), ("T-MOBILE", "T-Mobile")],
                amountRange: 70...160, preferredHours: [0], tags: ["utility", "recurring"], intentSignals: []),
            TransactionTemplate(category: "housing.rent", plaidCategory: "RENT > RENT_PAYMENT", transactionType: .payment, countRange: 3...3,
                merchants: [("BRICKELL HEIGHTS", "Brickell Heights Apartments")],
                amountRange: 2100...2100, preferredHours: [0], tags: ["rent", "recurring"], intentSignals: []),
            TransactionTemplate(category: "finance.income", plaidCategory: "INCOME > FREELANCE", transactionType: .income, countRange: 3...5,
                merchants: [("STRIPE TRANSFER", "Stripe"), ("PAYPAL *CLIENT", "PayPal"), ("WISE TRANSFER", "Wise")],
                amountRange: 1800...6500, preferredHours: [0], tags: ["freelance_income", "variable", "irregular"], intentSignals: []),
        ]

        // MARK: James — Chicago, 55, Corporate manager, $160K

        static let jamesTemplates: [TransactionTemplate] = [
            TransactionTemplate(category: "dining.grocery", plaidCategory: "FOOD_AND_DRINK > GROCERIES", transactionType: .purchase, countRange: 14...18,
                merchants: [("MARIANO'S #3891", "Mariano's"), ("JEWEL OSCO #432", "Jewel-Osco"), ("WHOLE FOODS CHI", "Whole Foods")],
                amountRange: 40...200, preferredHours: [10, 16, 17], tags: ["grocery", "home_cooking"], intentSignals: []),
            TransactionTemplate(category: "dining.restaurant", plaidCategory: "FOOD_AND_DRINK > RESTAURANTS", transactionType: .purchase, countRange: 6...10,
                merchants: [("GIBSONS STEAKHSE", "Gibson's Steakhouse"), ("PORTILLOS #12", "Portillo's"), ("ALINEA CHICAGO", "Alinea")],
                amountRange: 30...200, preferredHours: [12, 19, 20], tags: ["dining_out", "premium"], intentSignals: []),
            TransactionTemplate(category: "health.medical", plaidCategory: "HEALTHCARE > MEDICAL", transactionType: .purchase, countRange: 6...10,
                merchants: [("NORTHWESTERN MED", "Northwestern Medicine"), ("WALGREENS #8921", "Walgreens"), ("CVS PHARMACY", "CVS"), ("LABCORP", "LabCorp")],
                amountRange: 15...180, preferredHours: [8, 9, 10, 15], tags: ["healthcare", "regular_checkups", "pharmacy"], intentSignals: []),
            TransactionTemplate(category: "health.fitness", plaidCategory: "RECREATION > FITNESS", transactionType: .purchase, countRange: 3...3,
                merchants: [("EAST BANK CLUB", "East Bank Club")],
                amountRange: 250...250, preferredHours: [0], tags: ["fitness", "premium_gym", "recurring"], intentSignals: []),
            TransactionTemplate(category: "entertainment.recreation", plaidCategory: "RECREATION > GOLF", transactionType: .purchase, countRange: 4...6,
                merchants: [("COYOTE RUN GOLF", "Coyote Run Golf Course"), ("MEDINAH CC", "Medinah Country Club")],
                amountRange: 75...300, preferredHours: [7, 8, 9], tags: ["golf", "recreation", "premium"], intentSignals: []),
            TransactionTemplate(category: "finance.investment", plaidCategory: "TRANSFER > INVESTMENT", transactionType: .transfer, countRange: 3...3,
                merchants: [("FIDELITY INVEST", "Fidelity Investments"), ("VANGUARD GROUP", "Vanguard")],
                amountRange: 2000...3000, preferredHours: [0], tags: ["investment", "recurring", "retirement"], intentSignals: []),
            TransactionTemplate(category: "finance.alimony", plaidCategory: "TRANSFER > WIRE", transactionType: .transfer, countRange: 3...3,
                merchants: [("DOMESTIC WIRE TFR", "Alimony Payment")],
                amountRange: 2500...2500, preferredHours: [0], tags: ["alimony", "recurring", "legal_obligation"], intentSignals: []),
            TransactionTemplate(category: "finance.insurance", plaidCategory: "INSURANCE > AUTO", transactionType: .payment, countRange: 3...3,
                merchants: [("GEICO AUTO INS", "GEICO")],
                amountRange: 220...220, preferredHours: [0], tags: ["insurance", "recurring", "auto"], intentSignals: []),
            TransactionTemplate(category: "finance.insurance", plaidCategory: "INSURANCE > HEALTH", transactionType: .payment, countRange: 3...3,
                merchants: [("BCBS ILLINOIS", "Blue Cross Blue Shield")],
                amountRange: 450...450, preferredHours: [0], tags: ["insurance", "recurring", "health_premium"], intentSignals: []),
            TransactionTemplate(category: "travel.pattern", plaidCategory: "TRAVEL > AIRLINES", transactionType: .purchase, countRange: 2...4,
                merchants: [("UNITED AIRLINES", "United Airlines"), ("MARRIOTT HOTELS", "Marriott")],
                amountRange: 200...800, preferredHours: [9, 10, 20], tags: ["travel", "business_travel", "premium"], intentSignals: ["researched_before_buy"]),
            TransactionTemplate(category: "shopping.online", plaidCategory: "SHOPS > ONLINE_MARKETPLACE", transactionType: .purchase, countRange: 6...10,
                merchants: [("AMAZON.COM", "Amazon"), ("NORDSTROM.COM", "Nordstrom"), ("BROOKS BROTHERS", "Brooks Brothers")],
                amountRange: 30...300, preferredHours: [19, 20, 21], tags: ["online_shopping", "premium_brands"], intentSignals: ["researched_before_buy"]),
            TransactionTemplate(category: "housing.mortgage", plaidCategory: "RENT > MORTGAGE", transactionType: .payment, countRange: 3...3,
                merchants: [("CHASE MORTGAGE", "Chase Mortgage")],
                amountRange: 2800...2800, preferredHours: [0], tags: ["mortgage", "recurring", "housing"], intentSignals: []),
            TransactionTemplate(category: "bills.utilities", plaidCategory: "UTILITIES > ELECTRIC", transactionType: .payment, countRange: 3...3,
                merchants: [("COMED ELECTRIC", "ComEd"), ("XFINITY COMCAST", "Xfinity"), ("PEOPLES GAS", "Peoples Gas")],
                amountRange: 80...220, preferredHours: [0], tags: ["utility", "recurring"], intentSignals: []),
            TransactionTemplate(category: "finance.property_tax", plaidCategory: "TAX > PROPERTY", transactionType: .payment, countRange: 1...1,
                merchants: [("COOK COUNTY TREAS", "Cook County Treasurer")],
                amountRange: 4800...4800, preferredHours: [0], tags: ["property_tax", "homeowner"], intentSignals: []),
            TransactionTemplate(category: "entertainment.streaming", plaidCategory: "RECREATION > SUBSCRIPTION", transactionType: .purchase, countRange: 3...3,
                merchants: [("WSJ DIGITAL", "Wall Street Journal"), ("NETFLIX.COM", "Netflix"), ("AUDIBLE US", "Audible")],
                amountRange: 9.99...19.99, preferredHours: [0], tags: ["subscription", "news", "premium_content"], intentSignals: []),
            TransactionTemplate(category: "finance.income", plaidCategory: "INCOME > PAYROLL", transactionType: .income, countRange: 6...6,
                merchants: [("MEGACORP PAYROLL", "MegaCorp Inc.")],
                amountRange: 6150...6150, preferredHours: [0], tags: ["payroll", "recurring", "biweekly"], intentSignals: []),
        ]
    }
}

struct TransactionTemplate {
    let category: String
    let plaidCategory: String
    let transactionType: SoulTransaktion.TransactionType
    let countRange: ClosedRange<Int>
    let merchants: [(raw: String, canonical: String)]
    let amountRange: ClosedRange<Double>
    let preferredHours: [Int]
    let tags: [String]
    let intentSignals: [String]

    init(category: String, plaidCategory: String, transactionType: SoulTransaktion.TransactionType,
         countRange: ClosedRange<Int>, merchants: [(String, String)],
         amountRange: ClosedRange<Double>, preferredHours: [Int],
         tags: [String], intentSignals: [String]) {
        self.category = category
        self.plaidCategory = plaidCategory
        self.transactionType = transactionType
        self.countRange = countRange
        self.merchants = merchants.map { (raw: $0.0, canonical: $0.1) }
        self.amountRange = amountRange
        self.preferredHours = preferredHours
        self.tags = tags
        self.intentSignals = intentSignals
    }
}
