import ExpoModulesCore
import UIKit

// Lightweight logging helper: compiled out in Release builds (avoids string cost)
fileprivate func ExpoBgFetchLog(_ message: @autoclosure () -> String) {
#if DEBUG
  print(message())
#endif
}

public class ExpoBgFetchModule: Module {
  // Each module class must implement the definition function. The definition consists of components
  // that describes the module's functionality and behavior.
  // See https://docs.expo.dev/modules/module-api for more details about available components.
  public func definition() -> ModuleDefinition {
    Name("ExpoBgFetch")

    Events("onResult")

    // Synchronous function: returns requestId immediately; work runs in background
    Function("send") { (args: BgFetchArgs) -> String in
      let requestId = UUID().uuidString

    guard let url = URL(string: args.url), !args.url.isEmpty else {
  ExpoBgFetchLog("[ExpoBgFetch][iOS] START failed: id=\(requestId) reason=Missing url")
        self.sendEvent("onResult", [
          "requestId": requestId,
          "result": ["ok": false, "status": 0, "error": "Missing url"]
        ])
        return requestId
      }

      var request = URLRequest(url: url)
      request.httpMethod = (args.method ?? "GET").uppercased()
      if let headers = args.headers {
        for (k, v) in headers { request.setValue(v, forHTTPHeaderField: k) }
      }
      if let body = args.body, request.httpMethod != "GET" && request.httpMethod != "HEAD" {
        request.httpBody = body.data(using: .utf8)
      }

      let sessionCfg = URLSessionConfiguration.default
      if let timeout = args.timeoutMs { sessionCfg.timeoutIntervalForRequest = TimeInterval(timeout) / 1000.0 }
      let session = URLSession(configuration: sessionCfg)

      // Log: request starting
      ExpoBgFetchLog("[ExpoBgFetch][iOS] START id=\(requestId) method=\(request.httpMethod ?? "GET") url=\(request.url?.absoluteString ?? "")")

      // Always request short background time so the task can finish if the user backgrounds right away
      var bgTask: UIBackgroundTaskIdentifier = .invalid
      let startBgTask = {
        bgTask = UIApplication.shared.beginBackgroundTask(withName: "ExpoBgFetch-\(requestId)") {
          // Expiration handler
          ExpoBgFetchLog("[ExpoBgFetch][iOS] BG TASK expired id=\(requestId)")
          if bgTask != .invalid {
            UIApplication.shared.endBackgroundTask(bgTask)
            bgTask = .invalid
          }
        }
      }
      if Thread.isMainThread {
        startBgTask()
      } else {
        DispatchQueue.main.sync { startBgTask() }
      }
      if bgTask == .invalid {
        ExpoBgFetchLog("[ExpoBgFetch][iOS] BG TASK could not start id=\(requestId)")
      }

      let task = session.dataTask(with: request) { _, response, error in
        defer {
          if bgTask != .invalid {
            DispatchQueue.main.async {
              UIApplication.shared.endBackgroundTask(bgTask)
              bgTask = .invalid
            }
          }
        }
        if let error = error {
          ExpoBgFetchLog("[ExpoBgFetch][iOS] END   id=\(requestId) method=\(request.httpMethod ?? "GET") url=\(request.url?.absoluteString ?? "") status=0 error=\(error.localizedDescription)")
          self.sendEvent("onResult", [
            "requestId": requestId,
            "result": ["ok": false, "status": 0, "error": error.localizedDescription]
          ])
          return
        }
        guard let http = response as? HTTPURLResponse else {
          ExpoBgFetchLog("[ExpoBgFetch][iOS] END   id=\(requestId) method=\(request.httpMethod ?? "GET") url=\(request.url?.absoluteString ?? "") status=0 error=No response")
          self.sendEvent("onResult", [
            "requestId": requestId,
            "result": ["ok": false, "status": 0, "error": "No response"]
          ])
          return
        }
  let status = http.statusCode
        ExpoBgFetchLog("[ExpoBgFetch][iOS] END   id=\(requestId) method=\(request.httpMethod ?? "GET") url=\(http.url?.absoluteString ?? request.url?.absoluteString ?? "") status=\(status)")
        self.sendEvent("onResult", [
          "requestId": requestId,
          "result": [
            "ok": (200...299).contains(status),
            "status": status,
            "url": http.url?.absoluteString as Any
          ]
        ])
      }
      task.resume()

      return requestId
    }
  }
}

// Record to validate incoming args
struct BgFetchArgs: Record {
  @Field var url: String = ""
  @Field var method: String? = nil
  @Field var headers: [String: String]? = nil
  @Field var body: String? = nil
  @Field var timeoutMs: Int? = nil
}
