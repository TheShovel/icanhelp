# Swift & iOS Development

## Language Basics
- Apple's language for iOS/macOS (replaced Objective-C). Strongly typed, compiled, protocol-oriented. Memory managed via ARC (Automatic Reference Counting — not GC, deterministic retain-release). Swift 5.9 current. ABI stable since Swift 5 (libraries embed in OS). Interop with Objective-C
- Key features: Optionals (`?`), guard-let (early exit), closures (first-class functions), structs (value type) vs classes (reference type), extensions, protocols (+ protocol extensions), generics, Result type, async/await (Swift 5.5+), SwiftUI (declarative UI), Combine (reactive framework)

## iOS App Architecture
- **SwiftUI**: declarative UI framework (`@State`, `@Binding`, `@ObservedObject`, `@EnvironmentObject`). Combine with UIKit for complex views. Live preview in Xcode. NavigationStack (iOS 16+)
- **UIKit**: traditional imperative UI. Storyboard/NIB/XIB files or programmatic layout with Auto Layout + NSLayoutConstraint. MVC (Model-View-Controller) or MVVM pattern. UITableView + UICollectionView
- **Frameworks**: URLSession (networking), CoreData (persistence), UserDefaults (small preferences), FileManager (file system), CoreLocation, MapKit, HealthKit, ARKit, CoreML (Machine Learning), Vision (computer vision — face detection, text recognition, barcode), AVFoundation (recording/playback), Photos (camera roll)
- **App lifecycle**: AppDelegate → SceneDelegate (iOS 13+). Notifications: UNUserNotificationCenter. Background modes (limited — audio, location, VoIP, fetch, processing). Push notifications: APNs (Apple Push Notification service)
- **Xcode**: IDE for iOS dev. Simulator, debugger, instruments (profiling), Swift Package Manager (SPM — dependency management). Minimum deployment target (iOS 16+ as of 2024, many still target 15). TestFlight for beta distribution

## App Store
- **Developer account**: $99/year. App review (1-3 days, guidelines: no bugs, no spam, no hidden features, privacy required). In-app purchases (Apple takes 15-30% — small business program: 15% if <$1M/year). App Tracking Transparency (ATT — user must opt in for IDFA tracking). Privacy labels (required on App Store listing)
