import { Button, Text, View } from "react-native";
import * as Notifications from "expo-notifications";
import * as React from "react";
import { MMKV, useMMKVString } from "react-native-mmkv";
import axios from "axios";
import BgFetch from "@/modules/expo-bg-fetch";

const storage = new MMKV();
const NOTIFICATION_CATEGORY = "test-notification-category";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const logToStorage = (message: string) => {
  const prev = storage.getString("logs") || "";

  const now = new Date();
  const hours = now.getHours().toString().padStart(2, "0");
  const minutes = now.getMinutes().toString().padStart(2, "0");
  const seconds = now.getSeconds().toString().padStart(2, "0");
  const milliseconds = now.getMilliseconds().toString().padStart(3, "0");
  const time = `${hours}:${minutes}:${seconds}.${milliseconds}`;

  const formattedMessage = `[${time}] ${message}`;

  if (__DEV__) {
    console.log(formattedMessage);
  }

  storage.set("logs", `${prev}\n${formattedMessage}`);
};

const Logs = () => {
  const [logs] = useMMKVString("logs");

  return <Text>{logs ?? "No logs"}</Text>;
};

export default function Index() {
  React.useEffect(() => {
    // Request permissions
    Notifications.requestPermissionsAsync().catch(console.error);

    // Setup notifications categories
    Notifications.setNotificationCategoryAsync(NOTIFICATION_CATEGORY, [
      {
        identifier: "async-action",
        buttonTitle: "Async Action",
        options: {
          opensAppToForeground: false,
        },
      },
      {
        identifier: "sync-action",
        buttonTitle: "Sync Action",
        options: {
          opensAppToForeground: false,
        },
      },
    ]).catch(console.error);

    const responseHandler =
      Notifications.addNotificationResponseReceivedListener(
        async (response) => {
          if (response.actionIdentifier === "async-action") {
            logToStorage("Doing async action");
            logToStorage(
              "Sync actions will be shown in the console when the app is in background"
            );
            logToStorage("But let's try to fetch some data from the server...");
            BgFetch.send(
              {
                url: "https://jsonplaceholder.typicode.com/todos/1",
              },
              (response) =>
                logToStorage(`Fetched data: ${JSON.stringify(response)}`)
            );
            logToStorage("Data fetched successfully");
            logToStorage(
              "Fetching only started when the app was in foreground"
            );
          } else if (response.actionIdentifier === "sync-action") {
            logToStorage("Doing sync action");
            logToStorage(
              "All logs will be shown in the console, even if the app is in background"
            );
          }
        }
      );

    return () => {
      responseHandler.remove();
    };
  }, []);

  const showNotification = () =>
    Notifications.scheduleNotificationAsync({
      identifier: "test-notification",
      content: {
        categoryIdentifier: NOTIFICATION_CATEGORY,
        title: "Test Notification",
        body: "This is a test notification",
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        // Show the notification in 3 seconds
        date: new Date(Date.now() + 3000),
      },
    })
      .then(() => {
        console.log("Notification scheduled");
      })
      .catch(console.error);

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Button
        title="Show Notification in 3 seconds"
        onPress={showNotification}
      />
      <Button
        title="Clear logs"
        onPress={() => {
          storage.delete("logs");
        }}
      />
      <Text>(Put the app in background after pressing)</Text>
      <Logs />
    </View>
  );
}
