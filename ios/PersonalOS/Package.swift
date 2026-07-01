// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "PersonalOS",
    platforms: [
        .iOS(.v17)
    ],
    products: [
        .library(name: "PersonalOS", targets: ["PersonalOS"]),
    ],
    targets: [
        .target(
            name: "PersonalOS",
            path: "PersonalOS"
        ),
        .testTarget(
            name: "PersonalOSTests",
            dependencies: ["PersonalOS"],
            path: "PersonalOSTests"
        ),
    ]
)
