import UIKit
import Capacitor

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Override point for customization after application launch.
        return true
    }

    func applicationWillResignActive(_ application: UIApplication) {
        // Sent when the application is about to move from active to inactive state. This can occur for certain types of temporary interruptions (such as an incoming phone call or SMS message) or when the user quits the application and it begins the transition to the background state.
        // Use this method to pause ongoing tasks, disable timers, and invalidate graphics rendering callbacks. Games should use this method to pause the game.
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
        // Use this method to release shared resources, save user data, invalidate timers, and store enough application state information to restore your application to its current state in case it is terminated later.
        // If your application supports background execution, this method is called instead of applicationWillTerminate: when the user quits.
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
        // Called as part of the transition from the background to the active state; here you can undo many of the changes made on entering the background.
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        // Restart any tasks that were paused (or not yet started) while the application was inactive. If the application was previously in the background, optionally refresh the user interface.
    }

    func applicationWillTerminate(_ application: UIApplication) {
        // Called when the application is about to terminate. Save data if appropriate. See also applicationDidEnterBackground:.
    }

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        // Called when the app was launched with a url. Feel free to add additional processing here,
        // but if you want the App API to support tracking app url opens, make sure to keep this call
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        // Called when the app was launched with an activity, including Universal Links.
        // Feel free to add additional processing here, but if you want the App API to support
        // tracking app url opens, make sure to keep this call
        return ApplicationDelegateProxy.shared.application(application, continue: userActivity, restorationHandler: restorationHandler)
    }

}

// iOS 27 requires the scene lifecycle. The window and the Capacitor view come from Main.storyboard,
// set as this scene's storyboard in Info.plist (UIApplicationSceneManifest).
class SceneDelegate: UIResponder, UIWindowSceneDelegate {

    var window: UIWindow?

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        // Links that opened the app from cold start
        for context in connectionOptions.urlContexts {
            _ = ApplicationDelegateProxy.shared.application(UIApplication.shared, open: context.url, options: [:])
        }
        if let activity = connectionOptions.userActivities.first {
            _ = ApplicationDelegateProxy.shared.application(UIApplication.shared, continue: activity, restorationHandler: { _ in })
        }
        // Card protection (Apple doesn't let apps block screenshots): blur the screen while it is
        // recorded or mirrored, and in the app switcher; after a screenshot, point to "Share this card".
        NotificationCenter.default.addObserver(self, selector: #selector(captureChanged), name: UIScreen.capturedDidChangeNotification, object: nil)
        NotificationCenter.default.addObserver(self, selector: #selector(tookScreenshot), name: UIApplication.userDidTakeScreenshotNotification, object: nil)
        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }
            if #available(iOS 17.0, *) {
                self.window?.registerForTraitChanges([UITraitSceneCaptureState.self]) { (_: UIWindow, _: UITraitCollection) in self.updateShield() }
            }
            self.updateShield()
        }
    }

    // MARK: card protection
    private var shield: UIVisualEffectView?
    private var inBackground = false

    private func isCaptured() -> Bool {
        guard let ws = window?.windowScene else { return false }
        if #available(iOS 17.0, *) { return ws.traitCollection.sceneCaptureState == .active }
        return ws.screen.isCaptured
    }

    private func updateShield() {
        guard let window = window else { return }
        let on = inBackground || isCaptured()
        if on && shield == nil {
            let v = UIVisualEffectView(effect: UIBlurEffect(style: .systemThickMaterialDark))
            v.frame = window.bounds
            v.autoresizingMask = [.flexibleWidth, .flexibleHeight]
            window.addSubview(v)
            shield = v
        } else if !on, let v = shield {
            v.removeFromSuperview()
            shield = nil
        }
    }

    @objc private func captureChanged() { updateShield() }

    @objc private func tookScreenshot() {
        let web = (window?.rootViewController as? CAPBridgeViewController)?.webView
        web?.evaluateJavaScript("window.dispatchEvent(new Event('hh-screenshot'))", completionHandler: nil)
    }

    func sceneWillResignActive(_ scene: UIScene) { inBackground = true; updateShield() }
    func sceneDidBecomeActive(_ scene: UIScene) { inBackground = false; updateShield() }

    func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
        for context in URLContexts {
            _ = ApplicationDelegateProxy.shared.application(UIApplication.shared, open: context.url, options: [:])
        }
    }

    func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
        _ = ApplicationDelegateProxy.shared.application(UIApplication.shared, continue: userActivity, restorationHandler: { _ in })
    }
}
